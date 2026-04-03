import { revalidatePath } from "next/cache";

import { userCanManageCourse } from "@/lib/appwrite/access";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import {
  getFileExtension,
  isAllowedLessonVideoExtension,
} from "@/lib/uploads/lesson-video";
import type { Role } from "@/lib/utils/constants";

type AnyRow = Record<string, unknown> & { $id: string };

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

async function deleteUploadedFileIfPresent(
  storage: Awaited<ReturnType<typeof createAdminClient>>["storage"],
  bucketId: string,
  fileId: string
): Promise<void> {
  if (!fileId) {
    return;
  }

  try {
    await storage.deleteFile({ bucketId, fileId });
  } catch (error) {
    console.error(
      `[LessonVideoUpload] Failed to clean up ${bucketId}/${fileId}:`,
      error instanceof Error ? error.message : error
    );
  }
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
      uploadedFileId
    );
    return {
      success: false,
      status: 400,
      error: "Unsupported lesson video format.",
    };
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
    await deleteUploadedFileIfPresent(
      storage,
      APPWRITE_CONFIG.buckets.courseVideos,
      uploadedFileId
    );

    return {
      success: false,
      status: 500,
      error:
        error instanceof Error
          ? error.message
          : "Failed to attach uploaded lesson video.",
    };
  }

  if (previousVideoId && previousVideoId !== uploadedFileId) {
    await deleteUploadedFileIfPresent(
      storage,
      APPWRITE_CONFIG.buckets.courseVideos,
      previousVideoId
    );
  }

  revalidatePath("/instructor");
  revalidatePath("/instructor/courses");
  revalidatePath(`/instructor/courses/${courseId}`);
  revalidatePath(`/instructor/courses/${courseId}/curriculum`);
  revalidatePath(`/app/learn/${courseId}/${lessonId}`);

  return { success: true };
}
