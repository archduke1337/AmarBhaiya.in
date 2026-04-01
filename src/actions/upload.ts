"use server";

import { ID, InputFile } from "node-appwrite";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/appwrite/auth";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";

// ── Type helpers ────────────────────────────────────────────────────────────

type UploadResult = {
  success: boolean;
  fileId?: string;
  error?: string;
};

// ── Upload Course Thumbnail ─────────────────────────────────────────────────

export async function uploadCourseThumbnailAction(
  formData: FormData
): Promise<void> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const courseId = String(formData.get("courseId") ?? "");
  const file = formData.get("file") as File | null;

  if (!courseId || !file || file.size === 0) return;

  // Validate file
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) return;

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!["jpg", "jpeg", "png", "webp"].includes(ext)) return;

  try {
    const { storage, tablesDB } = await createAdminClient();

    // Upload to bucket
    const buffer = Buffer.from(await file.arrayBuffer());
    const inputFile = InputFile.fromBuffer(buffer, file.name);

    const uploaded = await storage.createFile({
      bucketId: APPWRITE_CONFIG.buckets.courseThumbnails,
      fileId: ID.unique(),
      file: inputFile,
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

  // Validate: 500MB max
  const maxSize = 500 * 1024 * 1024;
  if (file.size > maxSize) return;

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!["mp4", "webm", "mov", "mkv"].includes(ext)) return;

  try {
    const { storage, tablesDB } = await createAdminClient();

    const buffer = Buffer.from(await file.arrayBuffer());
    const inputFile = InputFile.fromBuffer(buffer, file.name);

    const uploaded = await storage.createFile({
      bucketId: APPWRITE_CONFIG.buckets.courseVideos,
      fileId: ID.unique(),
      file: inputFile,
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
  await requireRole(["admin", "instructor"]);

  const resourceId = String(formData.get("resourceId") ?? "");
  const file = formData.get("file") as File | null;

  if (!resourceId || !file || file.size === 0) return;

  // Validate: 200MB max
  const maxSize = 200 * 1024 * 1024;
  if (file.size > maxSize) return;

  try {
    const { storage, tablesDB } = await createAdminClient();

    const buffer = Buffer.from(await file.arrayBuffer());
    const inputFile = InputFile.fromBuffer(buffer, file.name);

    const uploaded = await storage.createFile({
      bucketId: APPWRITE_CONFIG.buckets.resourceFiles,
      fileId: ID.unique(),
      file: inputFile,
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
  const { user } = await requireRole(["admin", "instructor", "moderator", "student"]);

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return;

  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) return;

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!["jpg", "jpeg", "png", "webp"].includes(ext)) return;

  try {
    const { storage } = await createAdminClient();

    const buffer = Buffer.from(await file.arrayBuffer());
    const inputFile = InputFile.fromBuffer(buffer, file.name);

    await storage.createFile({
      bucketId: APPWRITE_CONFIG.buckets.userAvatars,
      fileId: ID.unique(),
      file: inputFile,
    });

    revalidatePath("/app/profile/edit");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to upload avatar."
    );
  }
}

// ── Get File URL ────────────────────────────────────────────────────────────

export function getFilePreviewUrl(
  bucketId: string,
  fileId: string,
  width?: number,
  height?: number
): string {
  if (!fileId) return "";

  const base = `${APPWRITE_CONFIG.endpoint}/storage/buckets/${bucketId}/files/${fileId}/preview`;
  const params = new URLSearchParams({
    project: APPWRITE_CONFIG.projectId,
  });

  if (width) params.set("width", String(width));
  if (height) params.set("height", String(height));

  return `${base}?${params.toString()}`;
}

export function getFileDownloadUrl(bucketId: string, fileId: string): string {
  if (!fileId) return "";

  return `${APPWRITE_CONFIG.endpoint}/storage/buckets/${bucketId}/files/${fileId}/download?project=${APPWRITE_CONFIG.projectId}`;
}

export function getFileViewUrl(bucketId: string, fileId: string): string {
  if (!fileId) return "";

  return `${APPWRITE_CONFIG.endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${APPWRITE_CONFIG.projectId}`;
}
