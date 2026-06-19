/**
 * Shared upload utilities used across multiple upload pipelines.
 * Consolidates duplicated helper functions.
 */

import type { Storage } from "node-appwrite";

/**
 * Safely delete an uploaded file from Appwrite storage.
 * Silently handles missing file IDs and deletion errors.
 */
export async function deleteUploadedFileIfPresent(
  storage: Storage,
  bucketId: string,
  fileId: string,
  label?: string
): Promise<void> {
  if (!fileId) {
    return;
  }

  const tag = label ?? "Upload";

  try {
    await storage.deleteFile({ bucketId, fileId });
  } catch (error) {
    console.error(
      `[${tag}] Failed to clean up ${bucketId}/${fileId}:`,
      error instanceof Error ? error.message : error
    );
  }
}
