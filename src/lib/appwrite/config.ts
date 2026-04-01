// ── Appwrite Configuration ──────────────────────────────────────────────────
// All Appwrite IDs in one place. Update these after creating resources in Console.

const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";

export const APPWRITE_CONFIG = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "",
  projectId: PROJECT_ID,
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "amarbhaiya_db",

  // ── Tables (Collections) ──────────────────────────────────────────────────
  tables: {
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
    blogPosts: "blog_posts",
    siteCopy: "site_copy",
    studentProfiles: "student_profiles",
    billingInfo: "billing_info",
    standaloneResources: "standalone_resources",
  },

  // ── Storage Buckets ───────────────────────────────────────────────────────
  buckets: {
    courseVideos: "course_videos",
    courseThumbnails: "course_thumbnails",
    courseResources: "course_resources",
    userAvatars: "user_avatars",
    certificates: "certificates",
    blogImages: "blog_images",
    resourceFiles: "resource_files",
  },

  // ── Session Cookie ────────────────────────────────────────────────────────
  // MUST be "a_session_<PROJECT_ID>" for Appwrite to recognize it.
  // See: https://appwrite.io/docs — SSR Auth cookie naming
  sessionCookieName: `a_session_${PROJECT_ID}`,
} as const;

// ── Type Shortcuts ──────────────────────────────────────────────────────────
export type TableKey = keyof typeof APPWRITE_CONFIG.tables;
export type BucketKey = keyof typeof APPWRITE_CONFIG.buckets;
