"use server";

import { ID } from "node-appwrite";
import { revalidatePath } from "next/cache";

import { requireAuth, requireRole } from "@/server/appwrite/auth";
import {
  userCanManageCourse,
  userCanManageCourseResource,
  userCanManageResource,
} from "@/server/appwrite/access";
import { APPWRITE_CONFIG } from "@/server/appwrite/config";
import { finalizeLessonVideoUpload } from "@/server/appwrite/lesson-video-upload";
import { createAdminClient, createSessionClient } from "@/server/appwrite/server";
import {
  LESSON_VIDEO_ALLOWED_MIMES,
  LESSON_VIDEO_MAX_BYTES,
  getFileExtension,
  isAllowedLessonVideoExtension,
} from "@/server/uploads/lesson-video";
import {
  COURSE_RESOURCE_ALLOWED_MIMES,
  COURSE_RESOURCE_MAX_BYTES,
  STANDALONE_RESOURCE_ALLOWED_MIMES,
  STANDALONE_RESOURCE_MAX_BYTES,
} from "@/server/uploads/instructor-file";
import { deleteUploadedFileIfPresent } from "@/server/uploads/shared";
import { validateFileMimeType } from "@/lib/utils/sanitize";
import { actionSuccess, actionError, type ActionResult } from "@/lib/errors/action-result";

const STANDALONE_RESOURCE_EXTENSIONS = [
  "pdf",
  "zip",
  "txt",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "mp4",
  "webm",
  "mov",
  "mkv",
] as const;

const COURSE_RESOURCE_EXTENSIONS = [
  "pdf",
  "zip",
  "txt",
  "doc",
  "docx",
  "pptx",
] as const;

function getCourseThumbnailFileId(course: Record<string, unknown>): string {
  return String(course.thumbnailFileId ?? course.thumbnailId ?? "");
}

// ── Upload Course Thumbnail ─────────────────────────────────────────────────

export async function uploadCourseThumbnailAction(
  formData: FormData
): Promise<ActionResult> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const courseId = String(formData.get("courseId") ?? "");
  const file = formData.get("file") as File | null;

  if (!courseId || !file || file.size === 0) {
    return actionError("Choose an image before uploading.");
  }
  const course = await userCanManageCourse(courseId, role, user.$id);
  if (!course) {
    return actionError("You do not have permission to update this course.");
  }

  // Validate file
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return actionError("Images must be 5 MB or smaller.");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!["jpg", "jpeg", "png", "webp"].includes(ext)) {
    return actionError("Only JPG, PNG, and WEBP images are supported.");
  }

  try {
    // SECURITY: Verify MIME type using magic bytes to prevent spoofed files
    const buffer = Buffer.from(await file.arrayBuffer());
    const validMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!validateFileMimeType(buffer, file.name, validMimes)) {
      console.error("File MIME type validation failed");
      return actionError("This file does not look like a valid image.");
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
          uploaded.$id,
          "Upload"
        );
        throw error;
      }
    }

    if (previousThumbnailId && previousThumbnailId !== uploaded.$id) {
      await deleteUploadedFileIfPresent(
        storage,
        APPWRITE_CONFIG.buckets.courseThumbnails,
        previousThumbnailId,
        "Upload"
      );
    }

    revalidatePath("/instructor");
    revalidatePath(`/instructor/courses/${courseId}`);
    revalidatePath("/instructor/courses");
    revalidatePath("/courses");
    if (typeof course.slug === "string" && course.slug) {
      revalidatePath(`/courses/${course.slug}`);
    }

    return actionSuccess();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to upload thumbnail.";
    console.error(message);
    return actionError(message);
  }
}

// ── Upload Course Video ─────────────────────────────────────────────────────

export async function uploadLessonVideoAction(
  formData: FormData
): Promise<ActionResult> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const courseId = String(formData.get("courseId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  const file = formData.get("file") as File | null;

  if (!courseId || !lessonId || !file || file.size === 0) {
    return actionError("Missing course ID, lesson ID, or file.");
  }
  if (!(await userCanManageCourse(courseId, role, user.$id))) {
    return actionError("You do not have permission to upload a video to this course.");
  }

  if (file.size > LESSON_VIDEO_MAX_BYTES) {
    return actionError("Video file exceeds the maximum allowed size.");
  }
  const ext = getFileExtension(file.name);
  if (!isAllowedLessonVideoExtension(ext)) {
    return actionError("Video file type is not supported.");
  }
  try {
    // SECURITY: Verify MIME type using magic bytes to prevent malware disguised as video
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!validateFileMimeType(buffer, file.name, [...LESSON_VIDEO_ALLOWED_MIMES])) {
      console.error("File MIME type validation failed");
      return actionError("Video file MIME type validation failed.");
    }

    const { storage } = await createAdminClient();

    const uploaded = await storage.createFile({
      bucketId: APPWRITE_CONFIG.buckets.courseVideos,
      fileId: ID.unique(),
      file,
    });

    const result = await finalizeLessonVideoUpload({
      courseId,
      lessonId,
      uploadedFileId: uploaded.$id,
      userId: user.$id,
      role,
    });

    if (!result.success) {
      await deleteUploadedFileIfPresent(
        storage,
        APPWRITE_CONFIG.buckets.courseVideos,
        uploaded.$id,
        "Upload"
      );
      console.error(result.error);
      return actionError(result.error);
    }

    return actionSuccess();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to upload video.";
    console.error(message);
    return actionError(message);
  }
}

// ── Upload Resource File ────────────────────────────────────────────────────

export async function uploadResourceFileAction(
  formData: FormData
): Promise<ActionResult> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const resourceId = String(formData.get("resourceId") ?? "");
  const file = formData.get("file") as File | null;

  if (!resourceId || !file || file.size === 0) {
    return actionError("Missing resource ID or file.");
  }
  const resource = await userCanManageResource(resourceId, role, user.$id);
  if (!resource) {
    return actionError("You do not have permission to upload to this resource.");
  }
  if (file.size > STANDALONE_RESOURCE_MAX_BYTES) {
    return actionError("Resource file exceeds the maximum allowed size.");
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!STANDALONE_RESOURCE_EXTENSIONS.includes(ext as (typeof STANDALONE_RESOURCE_EXTENSIONS)[number])) {
    return actionError("Resource file type is not supported.");
  }

  const standaloneHeader = Buffer.from(await file.slice(0, 32).arrayBuffer());
  if (!validateFileMimeType(standaloneHeader, file.name, [...STANDALONE_RESOURCE_ALLOWED_MIMES])) {
    console.error("Standalone resource MIME type validation failed");
    return actionError("Resource file MIME type validation failed.");
  }

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
        uploaded.$id,
        "Upload"
      );
      throw error;
    }

    if (previousFileId && previousFileId !== uploaded.$id) {
      await deleteUploadedFileIfPresent(
        storage,
        APPWRITE_CONFIG.buckets.resourceFiles,
        previousFileId,
        "Upload"
      );
    }

    revalidatePath("/instructor/resources");
    return actionSuccess();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to upload resource file.";
    console.error(message);
    return actionError(message);
  }
}

// ── Upload Course Resource File ────────────────────────────────────────────

export async function uploadCourseResourceFileAction(
  formData: FormData
): Promise<ActionResult> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const resourceId = String(formData.get("resourceId") ?? "");
  const file = formData.get("file") as File | null;

  if (!resourceId || !file || file.size === 0) {
    return actionError("Missing resource ID or file.");
  }
  const resourceContext = await userCanManageCourseResource(resourceId, role, user.$id);
  if (!resourceContext) {
    return actionError("You do not have permission to upload to this course resource.");
  }
  if (file.size > COURSE_RESOURCE_MAX_BYTES) {
    return actionError("Course resource file exceeds the maximum allowed size.");
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!COURSE_RESOURCE_EXTENSIONS.includes(ext as (typeof COURSE_RESOURCE_EXTENSIONS)[number])) {
    return actionError("Course resource file type is not supported.");
  }

  const courseResourceHeader = Buffer.from(await file.slice(0, 32).arrayBuffer());
  if (!validateFileMimeType(courseResourceHeader, file.name, [...COURSE_RESOURCE_ALLOWED_MIMES])) {
    console.error("Course resource MIME type validation failed");
    return actionError("Course resource file MIME type validation failed.");
  }

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
        uploaded.$id,
        "Upload"
      );
      throw error;
    }

    if (previousFileId && previousFileId !== uploaded.$id) {
      await deleteUploadedFileIfPresent(
        storage,
        APPWRITE_CONFIG.buckets.courseResources,
        previousFileId,
        "Upload"
      );
    }

    revalidatePath("/instructor/resources");
    revalidatePath(`/instructor/courses/${resourceContext.course.$id}/curriculum`);
    revalidatePath(`/app/learn/${resourceContext.course.$id}/${resourceContext.lesson.$id}`);
    return actionSuccess();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to upload course resource file.";
    console.error(message);
    return actionError(message);
  }
}

// ── Upload Blog Image ───────────────────────────────────────────────────────

export async function uploadBlogImageAction(
  formData: FormData
): Promise<ActionResult<{ url: string; fileId: string }>> {
  await requireRole(["admin"]);

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return actionError("No image file provided.");
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return actionError("Images must be 10 MB or smaller.");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)) {
    return actionError("Only JPG, PNG, WEBP, GIF, and SVG images are supported.");
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!validateFileMimeType(buffer, file.name, validMimes)) {
      console.error("Blog image MIME type validation failed");
      return actionError("This file does not look like a valid image.");
    }

    const { storage } = await createAdminClient();
    const uploaded = await storage.createFile({
      bucketId: APPWRITE_CONFIG.buckets.blogImages,
      fileId: ID.unique(),
      file,
    });

    const viewUrl = `${APPWRITE_CONFIG.endpoint}/storage/buckets/${APPWRITE_CONFIG.buckets.blogImages}/files/${uploaded.$id}/view?project=${APPWRITE_CONFIG.projectId}`;

    return actionSuccess({ url: viewUrl, fileId: uploaded.$id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload image.";
    console.error(message);
    return actionError(message);
  }
}

// ── Upload User Avatar ──────────────────────────────────────────────────────

export async function uploadAvatarAction(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireAuth();

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return actionError("No file provided for avatar upload.");
  }
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    return actionError("Avatar image must be 2 MB or smaller.");
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!["jpg", "jpeg", "png", "webp"].includes(ext)) {
    return actionError("Only JPG, PNG, and WEBP images are supported for avatars.");
  }
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const validMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!validateFileMimeType(buffer, file.name, validMimes)) {
      console.error("File MIME type validation failed");
      return actionError("Avatar file MIME type validation failed.");
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
    return actionSuccess();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to upload avatar.";
    console.error(message);
    return actionError(message);
  }
}