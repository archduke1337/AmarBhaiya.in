export const LESSON_VIDEO_ALLOWED_EXTENSIONS = ["mp4", "webm", "mov"] as const;

export const LESSON_VIDEO_ALLOWED_MIMES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export const LESSON_VIDEO_MAX_BYTES = 5_000_000_000;

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function isAllowedLessonVideoExtension(extension: string): boolean {
  return LESSON_VIDEO_ALLOWED_EXTENSIONS.includes(
    extension as (typeof LESSON_VIDEO_ALLOWED_EXTENSIONS)[number]
  );
}
