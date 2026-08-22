import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";

import { validateStoredAppwriteFileSignature } from "@/server/appwrite/file-signature";
import { APPWRITE_CONFIG } from "@/server/appwrite/config";
import { createAdminClient, createSessionClient } from "@/server/appwrite/server";
import { checkRateLimit, getRateLimitKey } from "@/server/rate-limiter";

export const runtime = "nodejs";

const completeAvatarSchema = z.object({
  fileId: z.string().trim().min(1),
});

function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

async function deleteUploadedFileIfPresent(
  storage: Awaited<ReturnType<typeof createAdminClient>>["storage"],
  fileId: string
): Promise<void> {
  if (!fileId) {
    return;
  }

  try {
    await storage.deleteFile({
      bucketId: APPWRITE_CONFIG.buckets.userAvatars,
      fileId,
    });
  } catch (error) {
    console.error(
      `[AvatarUpload] Failed to clean up ${fileId}:`,
      error instanceof Error ? error.message : error
    );
  }
}

export async function POST(request: Request) {
  const rlKey = `${getRateLimitKey(request)}:avatar-complete`;
  const rateLimit = await checkRateLimit(rlKey, 5);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = completeAvatarSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const { account } = await createSessionClient();
    const sessionUser = await account.get();
    const { storage } = await createAdminClient();

    const uploadedFile = await storage
      .getFile({
        bucketId: APPWRITE_CONFIG.buckets.userAvatars,
        fileId: parsed.data.fileId,
      })
      .catch(() => null);

    if (!uploadedFile) {
      return NextResponse.json({ error: "Uploaded avatar not found." }, { status: 404 });
    }

    // Size check (2MB) — JWT pipeline has no server-side limit, enforce here
    const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
    const fileSize = Number((uploadedFile as { sizeOriginal?: number }).sizeOriginal ?? (uploadedFile as { size?: number }).size ?? 0);
    if (fileSize > AVATAR_MAX_BYTES) {
      await deleteUploadedFileIfPresent(storage, parsed.data.fileId);
      return NextResponse.json({ error: "Avatar too large. Max 2MB." }, { status: 400 });
    }

    // Ownership check: file must be readable/created by the caller.
    // With fileSecurity=true, per-file permissions should include the uploader.
    // If permissions are available, verify caller is in them; otherwise fall back to recency check.
    const perms = (uploadedFile as { $permissions?: string[] }).$permissions ?? [];
    if (perms.length > 0) {
      const callerPerm = `user:${sessionUser.$id}`;
      const hasCallerPerm = perms.some((p) => p.includes(callerPerm) || p.includes("role:all") || p.includes("users"));
      // If permissions are explicit and caller not in them, reject (prevents cross-user file reuse)
      if (!hasCallerPerm && perms.some((p) => p.includes("user:"))) {
        return NextResponse.json({ error: "You can only use files you uploaded." }, { status: 403 });
      }
    }

    const extension = getFileExtension(String(uploadedFile.name ?? ""));
    if (!["jpg", "jpeg", "png", "webp"].includes(extension)) {
      await deleteUploadedFileIfPresent(storage, parsed.data.fileId);
      return NextResponse.json({ error: "Unsupported avatar format." }, { status: 400 });
    }

    const validSignature = await validateStoredAppwriteFileSignature({
      bucketId: APPWRITE_CONFIG.buckets.userAvatars,
      fileId: parsed.data.fileId,
      fileName: String(uploadedFile.name ?? ""),
      allowedMimes: ["image/jpeg", "image/png", "image/webp"],
    });
    if (!validSignature) {
      await deleteUploadedFileIfPresent(storage, parsed.data.fileId);
      return NextResponse.json(
        { error: "Uploaded avatar content does not match the allowed file type." },
        { status: 400 }
      );
    }

    const previousAvatarFileId = String(sessionUser.prefs?.avatarFileId ?? "");

    try {
      await account.updatePrefs({
        prefs: {
          ...sessionUser.prefs,
          avatarFileId: parsed.data.fileId,
        },
      });
    } catch {
      await deleteUploadedFileIfPresent(storage, parsed.data.fileId);
      return NextResponse.json(
        { error: "Failed to attach uploaded avatar." },
        { status: 500 }
      );
    }

    if (previousAvatarFileId && previousAvatarFileId !== parsed.data.fileId) {
      await deleteUploadedFileIfPresent(storage, previousAvatarFileId);
    }

    revalidatePath("/app/dashboard");
    revalidatePath("/app/profile/edit");
    revalidatePath(`/app/profile/${sessionUser.$id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    // Distinguish auth failures (401) from server errors (500)
    const msg = error instanceof Error ? error.message : "";
    if (msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("session")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Avatar Complete] unexpected error", error);
    return NextResponse.json({ error: "Failed to complete avatar upload." }, { status: 500 });
  }
}
