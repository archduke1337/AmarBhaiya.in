const PUBLIC_APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "";
const PUBLIC_APPWRITE_PROJECT_ID =
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "";

export const PUBLIC_APPWRITE_CONFIG = {
  endpoint: PUBLIC_APPWRITE_ENDPOINT,
  projectId: PUBLIC_APPWRITE_PROJECT_ID,
  buckets: {
    courseVideos: "course_videos",
  },
} as const;

export function getMissingPublicAppwriteEnvKeys(): string[] {
  const missing: string[] = [];

  if (!PUBLIC_APPWRITE_ENDPOINT) {
    missing.push("NEXT_PUBLIC_APPWRITE_ENDPOINT");
  }

  if (!PUBLIC_APPWRITE_PROJECT_ID) {
    missing.push("NEXT_PUBLIC_APPWRITE_PROJECT_ID");
  }

  return missing;
}

export function hasPublicAppwriteConfig(): boolean {
  return getMissingPublicAppwriteEnvKeys().length === 0;
}
