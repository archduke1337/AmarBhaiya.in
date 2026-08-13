import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { validateFileMimeType } from "@/lib/utils/sanitize";

const FILE_SIGNATURE_BYTES = 32;

async function fetchAppwriteFileHeader(
  bucketId: string,
  fileId: string
): Promise<Buffer | null> {
  const apiKey = process.env.APPWRITE_API_KEY;
  if (!apiKey) {
    return null;
  }

  const response = await fetch(
    `${APPWRITE_CONFIG.endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${encodeURIComponent(APPWRITE_CONFIG.projectId)}`,
    {
      headers: {
        "X-Appwrite-Project": APPWRITE_CONFIG.projectId,
        "X-Appwrite-Key": apiKey,
        Range: `bytes=0-${FILE_SIGNATURE_BYTES - 1}`,
      },
      cache: "no-store",
    }
  ).catch(() => null);

  if (!response || !response.ok) {
    return null;
  }

  const arrayBuffer = await response.arrayBuffer().catch(() => null);
  if (!arrayBuffer) {
    return null;
  }

  return Buffer.from(arrayBuffer);
}

export async function validateStoredAppwriteFileSignature(args: {
  bucketId: string;
  fileId: string;
  fileName: string;
  allowedMimes: readonly string[];
}): Promise<boolean> {
  const header = await fetchAppwriteFileHeader(args.bucketId, args.fileId);
  if (!header) {
    return false;
  }

  return validateFileMimeType(header, args.fileName, [...args.allowedMimes]);
}
