import { revalidatePath } from "next/cache";

import { deleteUploadedFileIfPresent } from "@/server/uploads/shared";
import { validateStoredAppwriteFileSignature } from "@/server/appwrite/file-signature";
import { userCanManageCourse } from "@/server/appwrite/access";
import { APPWRITE_CONFIG } from "@/server/appwrite/config";
import { createAdminClient } from "@/server/appwrite/server";
import {
  LESSON_VIDEO_ALLOWED_MIMES,
  LESSON_VIDEO_MAX_BYTES,
  getFileExtension,
  isAllowedLessonVideoExtension,
} from "@/server/uploads/lesson-video";
import type { Role } from "@/lib/utils/constants";
import type { AnyRow } from "@/types/rows";

type FinalizeLessonVideoUploadInput = {
  courseId: string;
  lessonId: string;
  uploadedFileId: string;
  userId: string;
  role: Role;
};

type FinalizeLessonVideoUploadResult =
  | { success: true }
  | { success: false; status: number; error: string };

function getLessonVideoFileId(lesson: Record<string, unknown>): string {
  return String(lesson.videoFileId ?? lesson.videoId ?? lesson.fileId ?? "");
}

export async function getManageableLessonVideoTarget({
  courseId,
  lessonId,
  userId,
  role,
}: Omit<FinalizeLessonVideoUploadInput, "uploadedFileId">): Promise<
  | { course: AnyRow; lesson: AnyRow }
  | null
> {
  const course = await userCanManageCourse(courseId, role, userId);
  if (!course) {
    return null;
  }

  const { tablesDB } = await createAdminClient();
  const lesson = (await tablesDB.getRow({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.tables.lessons,
    rowId: lessonId,
  }).catch(() => null)) as AnyRow | null;

  if (!lesson || String(lesson.courseId ?? "") !== courseId) {
    return null;
  }

  return { course, lesson };
}

export async function finalizeLessonVideoUpload(
  input: FinalizeLessonVideoUploadInput
): Promise<FinalizeLessonVideoUploadResult> {
  const { courseId, lessonId, uploadedFileId, userId, role } = input;
  const target = await getManageableLessonVideoTarget({
    courseId,
    lessonId,
    userId,
    role,
  });

  if (!target) {
    return { success: false, status: 403, error: "Forbidden" };
  }

  const { storage, tablesDB } = await createAdminClient();
  const uploadedFile = await storage.getFile({
    bucketId: APPWRITE_CONFIG.buckets.courseVideos,
    fileId: uploadedFileId,
  }).catch(() => null);

  if (!uploadedFile) {
    return { success: false, status: 404, error: "Uploaded video not found." };
  }

  const uploadedExtension = getFileExtension(String(uploadedFile.name ?? ""));
  if (!isAllowedLessonVideoExtension(uploadedExtension)) {
    await deleteUploadedFileIfPresent(
      storage,
      APPWRITE_CONFIG.buckets.courseVideos,
      uploadedFileId,
      "LessonVideoUpload"
    );
    return {
      success: false,
      status: 400,
      error: "Unsupported lesson video format.",
    };
  }

  const hasValidSignature = await validateStoredAppwriteFileSignature({
    bucketId: APPWRITE_CONFIG.buckets.courseVideos,
    fileId: uploadedFileId,
    fileName: String(uploadedFile.name ?? ""),
    allowedMimes: LESSON_VIDEO_ALLOWED_MIMES,
  });

  if (!hasValidSignature) {
    await deleteUploadedFileIfPresent(
      storage,
      APPWRITE_CONFIG.buckets.courseVideos,
      uploadedFileId,
      "LessonVideoUpload"
    );
    return {
      success: false,
      status: 400,
      error: "Uploaded video content does not match the allowed file type.",
    };
  }

  const fileSize = Number((uploadedFile as { sizeOriginal?: number }).sizeOriginal ?? (uploadedFile as { size?: number }).size ?? 0);
  if (fileSize > LESSON_VIDEO_MAX_BYTES) {
    await deleteUploadedFileIfPresent(
      storage,
      APPWRITE_CONFIG.buckets.courseVideos,
      uploadedFileId,
      "LessonVideoUpload"
    );
    return { success: false, status: 400, error: "Video too large. Max 5GB." };
  }

  const previousVideoId = getLessonVideoFileId(target.lesson);

  try {
    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.lessons,
      rowId: lessonId,
      data: { videoFileId: uploadedFileId },
    });
  } catch (error) {
    console.error("[LessonVideoUpload] Failed to attach uploaded lesson video:", error);
    await deleteUploadedFileIfPresent(
      storage,
      APPWRITE_CONFIG.buckets.courseVideos,
      uploadedFileId,
      "LessonVideoUpload"
    );

    return {
      success: false,
      status: 500,
      error: "Failed to attach uploaded lesson video.",
    };
  }

  if (previousVideoId && previousVideoId !== uploadedFileId) {
    await deleteUploadedFileIfPresent(
      storage,
      APPWRITE_CONFIG.buckets.courseVideos,
      previousVideoId,
      "LessonVideoUpload"
    );
  }

  revalidatePath("/instructor");
  revalidatePath("/instructor/courses");
  revalidatePath(`/instructor/courses/${courseId}`);
  revalidatePath(`/instructor/courses/${courseId}/curriculum`);
  revalidatePath(`/app/learn/${courseId}/${lessonId}`);

  return { success: true };
}
