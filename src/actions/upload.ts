"use server";

import { ID } from "node-appwrite";
import { revalidatePath } from "next/cache";

import { requireAuth, requireRole } from "@/lib/appwrite/auth";
import {
  userCanManageCourse,
  userCanManageCourseResource,
  userCanManageResource,
} from "@/lib/appwrite/access";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";
import { validateFileMimeType } from "@/lib/utils/sanitize";

type AnyRow = Record<string, unknown> & { $id: string };

function getCourseThumbnailFileId(course: Record<string, unknown>): string {
  return String(course.thumbnailFileId ?? course.thumbnailId ?? "");
}

function getLessonVideoFileId(lesson: Record<string, unknown>): string {
  return String(lesson.videoFileId ?? lesson.videoId ?? lesson.fileId ?? "");
}

async function deleteUploadedFileIfPresent(
  storage: Awaited<ReturnType<typeof createAdminClient>>["storage"],
  bucketId: string,
  fileId: string
): Promise<void> {
  if (!fileId) return;

  try {
    await storage.deleteFile({ bucketId, fileId });
  } catch (error) {
    console.error(
      `[Upload] Failed to clean up file ${bucketId}/${fileId}:`,
      error instanceof Error ? error.message : error
    );
  }
}

// ── Upload Course Thumbnail ─────────────────────────────────────────────────

export async function uploadCourseThumbnailAction(
  formData: FormData
): Promise<void> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const courseId = String(formData.get("courseId") ?? "");
  const file = formData.get("file") as File | null;

  if (!courseId || !file || file.size === 0) return;
  const course = await userCanManageCourse(courseId, role, user.$id);
  if (!course) return;

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
    const previousThumbnailId = getCourseThumbnailFileId(course);

    // Upload to bucket
    const uploaded = await storage.createFile({
      bucketId: APPWRITE_CONFIG.buckets.courseThumbnails,
      fileId: ID.unique(),
      file,
    });

    try {
      await tablesDB.updateRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.courses,
        rowId: courseId,
        data: { thumbnailId: uploaded.$id, thumbnailFileId: uploaded.$id },
      });
    } catch {
      try {
        await tablesDB.updateRow({
          databaseId: APPWRITE_CONFIG.databaseId,
          tableId: APPWRITE_CONFIG.tables.courses,
          rowId: courseId,
          data: { thumbnailId: uploaded.$id },
        });
      } catch (error) {
        await deleteUploadedFileIfPresent(
          storage,
          APPWRITE_CONFIG.buckets.courseThumbnails,
          uploaded.$id
        );
        throw error;
      }
    }

    if (previousThumbnailId && previousThumbnailId !== uploaded.$id) {
      await deleteUploadedFileIfPresent(
        storage,
        APPWRITE_CONFIG.buckets.courseThumbnails,
        previousThumbnailId
      );
    }

    revalidatePath(`/instructor/courses/${courseId}`);
    revalidatePath("/instructor/courses");
    revalidatePath("/courses");
    if (typeof course.slug === "string" && course.slug) {
      revalidatePath(`/courses/${course.slug}`);
    }
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
    const lesson = (await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.lessons,
      rowId: lessonId,
    }).catch(() => null)) as AnyRow | null;

    if (!lesson || String(lesson.courseId ?? "") !== courseId) {
      return;
    }

    const previousVideoId = getLessonVideoFileId(lesson);

    const uploaded = await storage.createFile({
      bucketId: APPWRITE_CONFIG.buckets.courseVideos,
      fileId: ID.unique(),
      file,
    });

    try {
      await tablesDB.updateRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.lessons,
        rowId: lessonId,
        data: { videoFileId: uploaded.$id },
      });
    } catch (error) {
      await deleteUploadedFileIfPresent(
        storage,
        APPWRITE_CONFIG.buckets.courseVideos,
        uploaded.$id
      );
      throw error;
    }

    if (previousVideoId && previousVideoId !== uploaded.$id) {
      await deleteUploadedFileIfPresent(
        storage,
        APPWRITE_CONFIG.buckets.courseVideos,
        previousVideoId
      );
    }

    revalidatePath(`/instructor/courses/${courseId}/curriculum`);
    revalidatePath(`/app/learn/${courseId}/${lessonId}`);
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
  const resource = await userCanManageResource(resourceId, role, user.$id);
  if (!resource) return;

  // Validate: 200MB max
  const maxSize = 200 * 1024 * 1024;
  if (file.size > maxSize) return;

  try {
    const { storage, tablesDB } = await createAdminClient();
    const previousFileId = String(resource.fileId ?? "");

    const uploaded = await storage.createFile({
      bucketId: APPWRITE_CONFIG.buckets.resourceFiles,
      fileId: ID.unique(),
      file,
    });

    try {
      await tablesDB.updateRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.standaloneResources,
        rowId: resourceId,
        data: { fileId: uploaded.$id },
      });
    } catch (error) {
      await deleteUploadedFileIfPresent(
        storage,
        APPWRITE_CONFIG.buckets.resourceFiles,
        uploaded.$id
      );
      throw error;
    }

    if (previousFileId && previousFileId !== uploaded.$id) {
      await deleteUploadedFileIfPresent(
        storage,
        APPWRITE_CONFIG.buckets.resourceFiles,
        previousFileId
      );
    }

    revalidatePath("/instructor/resources");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to upload resource file."
    );
  }
}

// ── Upload Course Resource File ────────────────────────────────────────────

export async function uploadCourseResourceFileAction(
  formData: FormData
): Promise<void> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const resourceId = String(formData.get("resourceId") ?? "");
  const file = formData.get("file") as File | null;

  if (!resourceId || !file || file.size === 0) return;

  const resourceContext = await userCanManageCourseResource(resourceId, role, user.$id);
  if (!resourceContext) return;

  const maxSize = 100 * 1024 * 1024;
  if (file.size > maxSize) return;

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!["pdf", "zip", "txt", "doc", "docx", "pptx"].includes(ext)) return;

  try {
    const { storage, tablesDB } = await createAdminClient();
    const previousFileId = String(resourceContext.resource.fileId ?? "");

    const uploaded = await storage.createFile({
      bucketId: APPWRITE_CONFIG.buckets.courseResources,
      fileId: ID.unique(),
      file,
    });

    try {
      await tablesDB.updateRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.resources,
        rowId: resourceId,
        data: { fileId: uploaded.$id },
      });
    } catch (error) {
      await deleteUploadedFileIfPresent(
        storage,
        APPWRITE_CONFIG.buckets.courseResources,
        uploaded.$id
      );
      throw error;
    }

    if (previousFileId && previousFileId !== uploaded.$id) {
      await deleteUploadedFileIfPresent(
        storage,
        APPWRITE_CONFIG.buckets.courseResources,
        previousFileId
      );
    }

    revalidatePath("/instructor/resources");
    revalidatePath(`/instructor/courses/${resourceContext.course.$id}/curriculum`);
    revalidatePath(`/app/learn/${resourceContext.course.$id}/${resourceContext.lesson.$id}`);
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to upload course resource file."
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
