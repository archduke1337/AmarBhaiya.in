export const LESSON_VIDEO_ALLOWED_EXTENSIONS = ["mp4", "webm", "mov"] as const;

export const LESSON_VIDEO_ALLOWED_MIMES = [
  "video/mp4",
  "video/mkv",
  "video/mov",
  "video/webm",
  "video/quicktime",
] as const;

export const LESSON_VIDEO_MAX_BYTES = 500 * 1024 * 1024;

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function isAllowedLessonVideoExtension(extension: string): boolean {
  return LESSON_VIDEO_ALLOWED_EXTENSIONS.includes(
    extension as (typeof LESSON_VIDEO_ALLOWED_EXTENSIONS)[number]
  );
}
