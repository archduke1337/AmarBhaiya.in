"use server";

import { ID } from "node-appwrite";
import { revalidatePath } from "next/cache";

import { requireAuth, requireRole } from "@/lib/appwrite/auth";
import {
  userCanManageCourse,
  userCanManageResource,
} from "@/lib/appwrite/access";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";
import { validateFileMimeType } from "@/lib/utils/sanitize";

// ── Upload Course Thumbnail ─────────────────────────────────────────────────

export async function uploadCourseThumbnailAction(
  formData: FormData
): Promise<void> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const courseId = String(formData.get("courseId") ?? "");
  const file = formData.get("file") as File | null;

  if (!courseId || !file || file.size === 0) return;
  if (!(await userCanManageCourse(courseId, role, user.$id))) return;

  // Validate file
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) return;

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!["jpg", "jpeg", "png", "webp"].includes(ext)) return;

  try {
    // SECURITY: Verify MIME type using magic bytes to prevent spoofed files
    const buffer = Buffer.from(await file.arrayBuffer());
    const validMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!validateFileMimeType(buffer, file.name, validMimes)) {
      console.error("File MIME type validation failed");
      return;
    }

    const { storage, tablesDB } = await createAdminClient();

    // Upload to bucket
    const uploaded = await storage.createFile({
      bucketId: APPWRITE_CONFIG.buckets.courseThumbnails,
      fileId: ID.unique(),
      file,
    });

    // Update course record
    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.courses,
      rowId: courseId,
      data: { thumbnailId: uploaded.$id },
    });

    revalidatePath(`/instructor/courses/${courseId}`);
    revalidatePath("/courses");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to upload thumbnail."
    );
  }
}

// ── Upload Course Video ─────────────────────────────────────────────────────

export async function uploadLessonVideoAction(
  formData: FormData
): Promise<void> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const courseId = String(formData.get("courseId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  const file = formData.get("file") as File | null;

  if (!courseId || !lessonId || !file || file.size === 0) return;
  if (!(await userCanManageCourse(courseId, role, user.$id))) return;

  // Validate: 500MB max
  const maxSize = 500 * 1024 * 1024;
  if (file.size > maxSize) return;

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!["mp4", "webm", "mov", "mkv"].includes(ext)) return;

  try {
    // SECURITY: Verify MIME type using magic bytes to prevent malware disguised as video
    const buffer = Buffer.from(await file.arrayBuffer());
    const validMimes = ["video/mp4", "video/webm", "video/quicktime", "video/x-matroska"];
    if (!validateFileMimeType(buffer, file.name, validMimes)) {
      console.error("File MIME type validation failed");
      return;
    }

    const { storage, tablesDB } = await createAdminClient();

    const uploaded = await storage.createFile({
      bucketId: APPWRITE_CONFIG.buckets.courseVideos,
      fileId: ID.unique(),
      file,
    });

    // Update lesson record
    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.lessons,
      rowId: lessonId,
      data: { videoFileId: uploaded.$id },
    });

    revalidatePath(`/instructor/courses/${courseId}/curriculum`);
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to upload video."
    );
  }
}

// ── Upload Resource File ────────────────────────────────────────────────────

export async function uploadResourceFileAction(
  formData: FormData
): Promise<void> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const resourceId = String(formData.get("resourceId") ?? "");
  const file = formData.get("file") as File | null;

  if (!resourceId || !file || file.size === 0) return;
  if (!(await userCanManageResource(resourceId, role, user.$id))) return;

  // Validate: 200MB max
  const maxSize = 200 * 1024 * 1024;
  if (file.size > maxSize) return;

  try {
    const { storage, tablesDB } = await createAdminClient();

    const uploaded = await storage.createFile({
      bucketId: APPWRITE_CONFIG.buckets.resourceFiles,
      fileId: ID.unique(),
      file,
    });

    // Update resource record
    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.standaloneResources,
      rowId: resourceId,
      data: { fileId: uploaded.$id },
    });

    revalidatePath("/instructor/resources");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to upload resource file."
    );
  }
}

// ── Upload User Avatar ──────────────────────────────────────────────────────

export async function uploadAvatarAction(
  formData: FormData
): Promise<void> {
  const user = await requireAuth();

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return;

  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) return;

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!["jpg", "jpeg", "png", "webp"].includes(ext)) return;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const validMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!validateFileMimeType(buffer, file.name, validMimes)) {
      console.error("File MIME type validation failed");
      return;
    }

    const { storage } = await createAdminClient();
    const { account } = await createSessionClient();

    const uploaded = await storage.createFile({
      bucketId: APPWRITE_CONFIG.buckets.userAvatars,
      fileId: ID.unique(),
      file,
    });

    await account.updatePrefs({
      prefs: {
        ...user.prefs,
        avatarFileId: uploaded.$id,
      },
    });

    revalidatePath("/app/profile/edit");
    revalidatePath("/app/dashboard");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to upload avatar."
    );
  }
}
