export type InstructorUploadKind =
  | "course-thumbnail"
  | "standalone-resource"
  | "course-resource";

export const INSTRUCTOR_UPLOAD_BUCKETS = {
  "course-thumbnail": "course_thumbnails",
  "standalone-resource": "resource_files",
  "course-resource": "course_resources",
} as const satisfies Record<InstructorUploadKind, string>;

export const COURSE_THUMBNAIL_ALLOWED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
] as const;
export const COURSE_THUMBNAIL_ALLOWED_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const STANDALONE_RESOURCE_ALLOWED_EXTENSIONS = [
  "pdf",
  "zip",
  "txt",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "mp4",
  "webm",
  "mov",
  "mkv",
] as const;
export const STANDALONE_RESOURCE_ALLOWED_MIMES = [
  "application/pdf",
  "application/zip",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
] as const;
export const COURSE_RESOURCE_ALLOWED_EXTENSIONS = [
  "pdf",
  "zip",
  "txt",
  "doc",
  "docx",
  "pptx",
] as const;
export const COURSE_RESOURCE_ALLOWED_MIMES = [
  "application/pdf",
  "application/zip",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;

export const COURSE_THUMBNAIL_MAX_BYTES = 5 * 1024 * 1024;
export const STANDALONE_RESOURCE_MAX_BYTES = 200 * 1024 * 1024;
export const COURSE_RESOURCE_MAX_BYTES = 50 * 1024 * 1024;

export function getUploadFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

export function isAllowedInstructorUploadExtension(
  kind: InstructorUploadKind,
  extension: string
): boolean {
  if (kind === "course-thumbnail") {
    return COURSE_THUMBNAIL_ALLOWED_EXTENSIONS.includes(
      extension as (typeof COURSE_THUMBNAIL_ALLOWED_EXTENSIONS)[number]
    );
  }

  if (kind === "standalone-resource") {
    return STANDALONE_RESOURCE_ALLOWED_EXTENSIONS.includes(
      extension as (typeof STANDALONE_RESOURCE_ALLOWED_EXTENSIONS)[number]
    );
  }

  return COURSE_RESOURCE_ALLOWED_EXTENSIONS.includes(
    extension as (typeof COURSE_RESOURCE_ALLOWED_EXTENSIONS)[number]
  );
}

export function getInstructorUploadMaxBytes(kind: InstructorUploadKind): number {
  if (kind === "course-thumbnail") {
    return COURSE_THUMBNAIL_MAX_BYTES;
  }

  if (kind === "standalone-resource") {
    return STANDALONE_RESOURCE_MAX_BYTES;
  }

  return COURSE_RESOURCE_MAX_BYTES;
}
