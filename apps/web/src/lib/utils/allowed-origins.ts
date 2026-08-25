export const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL ?? "",
  "https://amarbhaiya.in",
  "https://www.amarbhaiya.in",
  "https://community.amarbhaiya.in",
  "https://app.amarbhaiya.in",
  "https://admin.amarbhaiya.in",
  "https://instructor.amarbhaiya.in",
  "https://moderator.amarbhaiya.in",
  // Local dev and Vercel previews — only in non-production
  ...(process.env.NODE_ENV !== "production"
    ? ["http://localhost:3000", "http://127.0.0.1:3000"]
    : []),
  ...(process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL
    ? [`https://${process.env.VERCEL_URL}`]
    : []),
].filter(Boolean);
