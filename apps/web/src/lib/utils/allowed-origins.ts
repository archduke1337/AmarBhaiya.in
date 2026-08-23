export const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL ?? "",
  "https://amarbhaiya.in",
  "https://www.amarbhaiya.in",
  "https://community.amarbhaiya.in",
  "https://app.amarbhaiya.in",
  "https://admin.amarbhaiya.in",
  "https://instructor.amarbhaiya.in",
  "https://moderator.amarbhaiya.in",
].filter(Boolean);
