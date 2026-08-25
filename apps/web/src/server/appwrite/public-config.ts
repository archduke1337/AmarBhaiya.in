import { APPWRITE_CONFIG } from "./config";

export const PUBLIC_APPWRITE_CONFIG = {
  endpoint: APPWRITE_CONFIG.endpoint,
  projectId: APPWRITE_CONFIG.projectId,
  buckets: {
    courseVideos: APPWRITE_CONFIG.buckets.courseVideos,
  },
} as const;

export function getMissingPublicAppwriteEnvKeys(): string[] {
  const missing: string[] = [];

  if (!PUBLIC_APPWRITE_CONFIG.endpoint) {
    missing.push("NEXT_PUBLIC_APPWRITE_ENDPOINT");
  }

  if (!PUBLIC_APPWRITE_CONFIG.projectId) {
    missing.push("NEXT_PUBLIC_APPWRITE_PROJECT_ID");
  }

  return missing;
}

export function hasPublicAppwriteConfig(): boolean {
  return getMissingPublicAppwriteEnvKeys().length === 0;
}
