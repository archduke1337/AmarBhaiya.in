import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { Client, Storage } from "appwrite";

const storageClient = new Client()
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId);
const storage = new Storage(storageClient);

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
  return storage.getFilePreview({
    bucketId,
    fileId,
    width,
    height,
  }).toString();
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
  return storage.getFileView({
    bucketId,
    fileId,
  }).toString();
}
