import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";

import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";

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

    const extension = getFileExtension(String(uploadedFile.name ?? ""));
    if (!["jpg", "jpeg", "png", "webp"].includes(extension)) {
      await deleteUploadedFileIfPresent(storage, parsed.data.fileId);
      return NextResponse.json({ error: "Unsupported avatar format." }, { status: 400 });
    }

    const previousAvatarFileId = String(sessionUser.prefs?.avatarFileId ?? "");

    try {
      await account.updatePrefs({
        prefs: {
          ...sessionUser.prefs,
          avatarFileId: parsed.data.fileId,
        },
      });
    } catch (error) {
      await deleteUploadedFileIfPresent(storage, parsed.data.fileId);
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to attach uploaded avatar.",
        },
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
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
