import { APPWRITE_CONFIG } from "@/lib/appwrite/config";

/**
 * Build a file preview URL (for images — thumbnails, avatars, etc.).
 */
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

/**
 * Build a file download URL (triggers browser download).
 */
export function getFileDownloadUrl(bucketId: string, fileId: string): string {
  if (!fileId) return "";

  return `${APPWRITE_CONFIG.endpoint}/storage/buckets/${bucketId}/files/${fileId}/download?project=${APPWRITE_CONFIG.projectId}`;
}

/**
 * Build a file view URL (inline display — for video src, etc.).
 */
export function getFileViewUrl(bucketId: string, fileId: string): string {
  if (!fileId) return "";

  return `${APPWRITE_CONFIG.endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${APPWRITE_CONFIG.projectId}`;
}
