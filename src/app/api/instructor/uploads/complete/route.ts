import { NextResponse } from "next/server";
import { z } from "zod";

import { getUserRole } from "@/lib/appwrite/auth-utils";
import { finalizeInstructorUpload } from "@/lib/appwrite/instructor-file-upload";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";

export const runtime = "nodejs";

const completeUploadSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("course-thumbnail"),
    courseId: z.string().trim().min(1),
    fileId: z.string().trim().min(1),
  }),
  z.object({
    kind: z.literal("standalone-resource"),
    resourceId: z.string().trim().min(1),
    fileId: z.string().trim().min(1),
  }),
  z.object({
    kind: z.literal("course-resource"),
    resourceId: z.string().trim().min(1),
    fileId: z.string().trim().min(1),
  }),
]);

async function getAuthenticatedManager() {
  try {
    const { account } = await createSessionClient();
    const sessionUser = await account.get();
    const { users } = await createAdminClient();
    const adminUser = await users.get({ userId: sessionUser.$id });

    return {
      user: sessionUser,
      role: getUserRole(adminUser),
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const authenticated = await getAuthenticatedManager();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (authenticated.role !== "admin" && authenticated.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await request.json().catch(() => null);
  const parsed = completeUploadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = await finalizeInstructorUpload({
    ...parsed.data,
    uploadedFileId: parsed.data.fileId,
    userId: authenticated.user.$id,
    role: authenticated.role,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true });
}
