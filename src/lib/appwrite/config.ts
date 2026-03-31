// ── Appwrite Configuration ──────────────────────────────────────────────────
// All Appwrite IDs in one place. Update these after creating resources in Console.

export const APPWRITE_CONFIG = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "",
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "",
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "amarbhaiya_db",

  // ── Collections ───────────────────────────────────────────────────────────
  collections: {
    courses: "courses",
    categories: "categories",
    modules: "modules",
    lessons: "lessons",
    resources: "resources",
    enrollments: "enrollments",
    progress: "progress",
    quizzes: "quizzes",
    quizQuestions: "quiz_questions",
    quizAttempts: "quiz_attempts",
    assignments: "assignments",
    submissions: "submissions",
    certificates: "certificates",
    liveSessions: "live_sessions",
    sessionRsvps: "session_rsvps",
    courseComments: "course_comments",
    forumCategories: "forum_categories",
    forumThreads: "forum_threads",
    forumReplies: "forum_replies",
    payments: "payments",
    subscriptions: "subscriptions",
    moderationActions: "moderation_actions",
    auditLogs: "audit_logs",
    notifications: "notifications",
  },

  // ── Storage Buckets ───────────────────────────────────────────────────────
  buckets: {
    courseVideos: "course_videos",
    courseThumbnails: "course_thumbnails",
    courseResources: "course_resources",
    userAvatars: "user_avatars",
    certificates: "certificates",
    blogImages: "blog_images",
  },

  // ── Session Cookie ────────────────────────────────────────────────────────
  sessionCookieName: "amarbhaiya-session",
} as const;

// ── Type Shortcuts ──────────────────────────────────────────────────────────
export type CollectionKey = keyof typeof APPWRITE_CONFIG.collections;
export type BucketKey = keyof typeof APPWRITE_CONFIG.buckets;
