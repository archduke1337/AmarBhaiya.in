export const ASSIGNMENT_SUBMISSION_ALLOWED_EXTENSIONS = [
  "pdf",
  "zip",
  "txt",
  "doc",
  "docx",
  "ppt",
  "pptx",
] as const;

export const ASSIGNMENT_SUBMISSION_ALLOWED_MIMES = [
  "application/pdf",
  "application/zip",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;

export const ASSIGNMENT_SUBMISSION_MAX_BYTES = 50 * 1024 * 1024;

export function getAssignmentSubmissionFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}
