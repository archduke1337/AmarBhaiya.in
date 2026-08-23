export const AVATAR_ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;
export const AVATAR_ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export function getAvatarFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}
