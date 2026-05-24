import { Query } from "node-appwrite";
import type { Models } from "node-appwrite";

import type { Role } from "@/lib/utils/constants";
import type {
  Assignment, AuditLog, Category, Course, Enrollment,
  ForumCategory, ForumThread, Lesson, LiveSession,
  ModerationAction, Module, Payment, Quiz, QuizAttempt, Submission,
} from "@/types/appwrite";

import { APPWRITE_CONFIG } from "../config";
import { createAdminClient, createSessionClient } from "../server";
export { isSubmissionReviewed, getSubmissionReviewedAt } from "@/lib/utils/submission-review";

export type AnyRow = Models.Row & {
  [key: string]: unknown;
};

export type AdminClient = Awaited<ReturnType<typeof createAdminClient>>;

export type InstructorScope = {
  userId: string;
  role: Role;
};

export type CourseRow = AnyRow & Partial<Course>;
export type EnrollmentRow = AnyRow & Partial<Enrollment>;
export type PaymentRow = AnyRow & Partial<Payment>;
export type LiveSessionRow = AnyRow & Partial<LiveSession>;
export type ModerationActionRow = AnyRow & Partial<ModerationAction>;
export type AuditLogRow = AnyRow & Partial<AuditLog>;
export type ForumThreadRow = AnyRow & Partial<ForumThread>;
export type ForumCategoryRow = AnyRow & Partial<ForumCategory>;
export type ModuleRow = AnyRow & Partial<Module>;
export type LessonRow = AnyRow & Partial<Lesson>;
export type QuizRow = AnyRow & Partial<Quiz>;
export type QuizAttemptRow = AnyRow & Partial<QuizAttempt>;
export type AssignmentRow = AnyRow & Partial<Assignment>;
export type SubmissionRow = AnyRow & Partial<Submission>;

export const REVIEW_OVERDUE_MS = 1000 * 60 * 60 * 24 * 3;
export const RECENT_ENROLLMENT_MS = 1000 * 60 * 60 * 24 * 14;
export const STUDENT_ATTENTION_MS = 1000 * 60 * 60 * 24 * 7;

export type CommunityThreadItem = {
  id: string;
  title: string;
  authorId: string;
  author: string;
  replies: number;
  pinned: boolean;
  locked: boolean;
  category: string;
};

export type CommunityCategoryItem = {
  id: string;
  name: string;
};

export type InstructorDashboardStats = {
  courses: number;
  activeEnrollments: number;
  liveSessions: number;
  pendingReviews: number;
};

export type InstructorCourseListItem = {
  id: string;
  title: string;
  shortDescription: string;
  status: "Published" | "Draft";
  accessModel: string;
  price: number;
  totalLessons: number;
  totalDuration: number;
  moduleCount: number;
  activeEnrollments: number;
  hasThumbnail: boolean;
  previewLessonCount: number;
  lessonVideoCount: number;
  missingVideoCount: number;
  publishBlockers: string[];
  attentionFlags: string[];
  readyToPublish: boolean;
  needsAttention: boolean;
};

export type InstructorStudentItem = {
  id: string;
  name: string;
  email: string;
  courseId: string;
  courseTitle: string;
  progressPercent: number;
  enrolledAt: string | null;
  needsAttention: boolean;
  isNearCompletion: boolean;
  isNewEnrollment: boolean;
};

export type InstructorSubmissionQueueItem = {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseTitle: string;
  userId: string;
  userName: string;
  fileId: string;
  submittedAt: string;
  grade: number;
  feedback: string;
  isGraded: boolean;
  gradedAt: string | null;
  needsFeedback: boolean;
  isOverdueReview: boolean;
};

export type InstructorLiveSessionItem = {
  id: string;
  title: string;
  description: string;
  status: string;
  scheduledAt: string | null;
  streamUrl: string;
  recordingUrl: string;
  rsvpCount: number;
};

export type InstructorRevenueCourseItem = {
  id: string;
  title: string;
  accessModel: string;
  isPublished: boolean;
  enrollments: number;
  totalRevenue: number;
  monthlyRevenue: number;
  lastPaymentAt: string | null;
};

export type InstructorRevenueRecentPaymentItem = {
  id: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  paidAt: string | null;
};

export type InstructorRevenueOverview = {
  totalEarnings: number;
  monthlyEarnings: number;
  totalEnrollments: number;
  paidCourseCount: number;
  publishedPaidCourses: number;
  courseEarnings: InstructorRevenueCourseItem[];
  recentPayments: InstructorRevenueRecentPaymentItem[];
  dormantPaidCourses: InstructorRevenueCourseItem[];
};

export type InstructorCourseSummary = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  whatYouLearn: string[];
  requirements: string[];
  accessModel: string;
  isPublished: boolean;
  price: number;
  totalLessons: number;
  totalDuration: number;
  thumbnailId: string;
  moduleCount: number;
  activeEnrollments: number;
  hasThumbnail: boolean;
  previewLessonCount: number;
  lessonVideoCount: number;
  missingVideoCount: number;
  publishBlockers: string[];
  attentionFlags: string[];
  readyToPublish: boolean;
  needsAttention: boolean;
};

export type InstructorCurriculumModule = {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Array<{
    id: string;
    title: string;
    description: string;
    order: number;
    duration: number;
    isFree: boolean;
    isFreePreview: boolean;
    videoFileId: string;
  }>;
};

export type ModeratorDashboardStats = {
  openReports: number;
  mutedUsers: number;
  flaggedThreads: number;
  actionsToday: number;
};

export type ModeratorReportItem = {
  id: string;
  entityType: string;
  entityId: string;
  targetUserId: string;
  target: string;
  reason: string;
  status: "pending" | "reviewed";
  createdAt: string | null;
};

export type ModeratorStudentItem = {
  id: string;
  latestActionId: string;
  name: string;
  latestAction: string;
  latestReason: string;
  latestScope: string;
  lastActionAt: string | null;
  actionCount: number;
  status: "open" | "resolved";
};

export type ModeratorCommunityData = {
  actionCounts: Array<{ label: string; value: number }>;
  recentThreads: CommunityThreadItem[];
};

export type AdminDashboardStats = {
  totalUsers: number;
  activeEnrollments: number;
  monthlyRevenue: number;
  totalRevenue: number;
  liveSessions: number;
  totalCourses: number;
  publishedCourses: number;
  completionRate: number;
};

export type AdminUserItem = {
  id: string;
  name: string;
  role: string;
  status: "active" | "blocked";
  email: string;
};

export type AdminCourseItem = {
  id: string;
  title: string;
  state: "published" | "draft";
  featured: "yes" | "no";
  category: string;
};

export type AdminCategoryItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
};

export type AdminPaymentItem = {
  id: string;
  userId: string;
  providerRef: string;
  method: string;
  amount: number;
  currency: string;
  status: string;
  courseId: string;
  courseSlug: string;
  userName: string;
  courseTitle: string;
  createdAt: string | null;
};

export type AdminLiveData = {
  activeSessions: number;
  scheduledSessions: number;
  recordingFailures: number;
  upcoming: InstructorLiveSessionItem[];
};

export type ModerationActionItem = {
  id: string;
  moderatorName: string;
  targetUserName: string;
  action: string;
  scope: string;
  reason: string;
  createdAt: string;
};

export type AdminModerationData = {
  actionsToday: number;
  openEscalations: number;
  activeTimeouts: number;
  escalationItems: ModerationActionItem[];
};

export type AdminAuditItem = {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  createdAt: string | null;
};

export type PublicCourseCard = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  accessModel: string;
  price: number;
  thumbnailId: string;
  instructorName: string;
  totalLessons: number;
  totalDuration: number;
  enrolledCount: number;
  categoryId: string;
};

export type PublicCourseDetail = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  accessModel: string;
  price: number;
  thumbnailId: string;
  instructorId: string;
  instructorName: string;
  totalLessons: number;
  totalDuration: number;
  enrolledCount: number;
  isPublished: boolean;
  modules: Array<{
    id: string;
    title: string;
    order: number;
    lessons: Array<{
      id: string;
      title: string;
      order: number;
      duration: number;
      isFree: boolean;
      isFreePreview: boolean;
    }>;
  }>;
};

export function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function chunkValues<T>(values: T[], chunkSize = 20): T[][] {
  if (values.length <= chunkSize) return [values];
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize));
  }
  return chunks;
}

export function toDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function toNumber(value: unknown, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function toDurationMinutes(value: unknown): number {
  const raw = toNumber(value, 0);
  if (raw <= 0) return 0;
  if (raw > 240) return Math.max(1, Math.round(raw / 60));
  return Math.round(raw);
}

export function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function normalizeTag(value: string): string {
  return value.trim().toLowerCase();
}

export function toTitleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function extractClassTag(values: string[]): string {
  for (const value of values) {
    const match = value.match(/\b(?:class|grade|std)\s*[-:]?\s*(6|7|8|9|10|11|12)\b/i);
    if (match?.[1]) return `Class ${match[1]}`;
  }
  return "";
}

export function extractSubjectTag(values: string[]): string {
  const knownSubjects = [
    "maths", "mathematics", "science", "english", "sst",
    "social science", "physics", "chemistry", "biology",
    "accountancy", "economics", "business studies", "bst",
    "history", "geography", "civics", "computer", "hindi",
  ];
  for (const value of values) {
    const normalized = normalizeTag(value);
    const matched = knownSubjects.find((subject) => normalized.includes(subject));
    if (matched) {
      if (matched === "mathematics") return "Maths";
      if (matched === "social science") return "Social Science";
      if (matched === "business studies") return "Business Studies";
      return toTitleCase(matched);
    }
  }
  return "";
}

export function extractChapterTag(values: string[]): string {
  for (const value of values) {
    const match = value.match(/\b(chapter|ch)\s*[-:]?\s*([a-z0-9]+)/i);
    if (match?.[2]) return `Chapter ${match[2].toUpperCase()}`;
  }
  return "";
}

export function parseParagraphs(content: unknown): string[] {
  if (typeof content !== "string" || content.trim().length === 0) return [];
  return content
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function parseJsonPayload<T>(value: unknown): T | null {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function getSafeHttpUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

export function getCourseThumbnailId(course: CourseRow): string {
  if (typeof course.thumbnailFileId === "string" && course.thumbnailFileId.length > 0) {
    return course.thumbnailFileId;
  }
  if (typeof course.thumbnailId === "string" && course.thumbnailId.length > 0) {
    return course.thumbnailId;
  }
  return "";
}

export function buildInstructorCourseHealth(args: {
  course: CourseRow;
  modules: ModuleRow[];
  lessons: LessonRow[];
  activeEnrollments: number;
}) {
  const { course, modules, lessons, activeEnrollments } = args;
  const thumbnailId = getCourseThumbnailId(course);
  const hasThumbnail = thumbnailId.length > 0;
  const totalLessons = lessons.length;
  const totalDuration = lessons.reduce((sum, lesson) => {
    const duration = Number(lesson.duration ?? 0);
    return sum + (Number.isFinite(duration) ? duration : 0);
  }, 0);
  const lessonVideoCount = lessons.filter(
    (lesson) => typeof lesson.videoFileId === "string" && lesson.videoFileId.length > 0
  ).length;
  const missingVideoCount = Math.max(0, totalLessons - lessonVideoCount);
  const previewLessonCount = lessons.filter((lesson) => Boolean(lesson.isFreePreview)).length;
  const publishBlockers: string[] = [];
  const attentionFlags: string[] = [];

  if (!hasThumbnail) publishBlockers.push("Add a course thumbnail");
  if (modules.length === 0) publishBlockers.push("Create the first module");
  if (totalLessons === 0) {
    publishBlockers.push("Add at least one lesson");
  } else if (lessonVideoCount === 0) {
    publishBlockers.push("Upload the first lesson video");
  }
  if (missingVideoCount > 0 && lessonVideoCount > 0) {
    attentionFlags.push(`${missingVideoCount} lesson${missingVideoCount === 1 ? "" : "s"} still need video`);
  }
  const accessModel = typeof course.accessModel === "string" ? course.accessModel : "free";
  if (accessModel !== "free" && previewLessonCount === 0) {
    attentionFlags.push("No free preview lesson for conversion");
  }
  if (Boolean(course.isPublished) && activeEnrollments === 0) {
    attentionFlags.push("Published with no active enrollments yet");
  }

  return {
    thumbnailId, hasThumbnail, totalLessons, totalDuration,
    moduleCount: modules.length, activeEnrollments, previewLessonCount,
    lessonVideoCount, missingVideoCount, publishBlockers, attentionFlags,
    readyToPublish: !Boolean(course.isPublished) && publishBlockers.length === 0,
    needsAttention: publishBlockers.length > 0 || attentionFlags.length > 0,
  };
}

export function toUtcDateKey(value: unknown): string | null {
  const date = toDate(value);
  if (!date) return null;
  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized.toISOString().slice(0, 10);
}

export function calculateCurrentStreak(dateKeys: Set<string>): number {
  if (dateKeys.size === 0) return 0;
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);
  const todayKey = cursor.toISOString().slice(0, 10);
  if (!dateKeys.has(todayKey)) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    const yesterdayKey = cursor.toISOString().slice(0, 10);
    if (!dateKeys.has(yesterdayKey)) return 0;
  }
  let streak = 0;
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!dateKeys.has(key)) break;
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export function isToday(value: unknown): boolean {
  const date = toDate(value);
  if (!date) return false;
  const now = new Date();
  return date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
}

export function resolveRoleFromLabels(labels: string[] | undefined): string {
  if (!labels || labels.length === 0) return "student";
  if (labels.includes("admin")) return "admin";
  if (labels.includes("moderator")) return "moderator";
  if (labels.includes("instructor")) return "instructor";
  return "student";
}

export function isActiveEnrollmentRow(row: Partial<EnrollmentRow>): boolean {
  return row.isActive !== false && String(row.status ?? "active") !== "cancelled";
}

export function getInstructorBaseQueries(scope: InstructorScope): string[] {
  if (scope.role === "admin") return [];
  return [Query.equal("instructorId", [scope.userId])];
}

export async function safeListRows<Row extends AnyRow>(
  tablesDB: AdminClient["tablesDB"] | Awaited<ReturnType<typeof createSessionClient>>["tablesDB"],
  tableId: string,
  queries: string[] = []
): Promise<{ rows: Row[]; total: number }> {
  try {
    const response = await tablesDB.listRows<Row>({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId,
      queries,
    });
    return { rows: response.rows, total: response.total };
  } catch {
    return { rows: [], total: 0 };
  }
}

export async function safeCountRows(
  tablesDB: AdminClient["tablesDB"],
  tableId: string,
  queries: string[] = []
): Promise<number> {
  const response = await safeListRows<AnyRow>(tablesDB, tableId, [...queries, Query.limit(1)]);
  return response.total;
}

export async function safeGetRow<Row extends AnyRow>(
  tablesDB: AdminClient["tablesDB"],
  tableId: string,
  rowId: string
): Promise<Row | null> {
  try {
    return await tablesDB.getRow<Row>({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId,
      rowId,
    });
  } catch {
    return null;
  }
}

export async function safeListAllRows<Row extends AnyRow>(
  tablesDB: AdminClient["tablesDB"] | Awaited<ReturnType<typeof createSessionClient>>["tablesDB"],
  tableId: string,
  queries: string[] = [],
  pageSize = 500
): Promise<Row[]> {
  const rows: Row[] = [];
  let offset = 0;
  while (true) {
    const response = await safeListRows<Row>(tablesDB, tableId, [
      ...queries, Query.limit(pageSize), Query.offset(offset),
    ]);
    rows.push(...response.rows);
    if (response.rows.length < pageSize) break;
    offset += response.rows.length;
  }
  return rows;
}

export async function listRowsByFieldValues<Row extends AnyRow>(
  tablesDB: AdminClient["tablesDB"] | Awaited<ReturnType<typeof createSessionClient>>["tablesDB"],
  tableId: string,
  field: string,
  values: string[],
  extraQueries: string[] = []
): Promise<Row[]> {
  if (values.length === 0) return [];
  const chunks = chunkValues(values, 20);
  const results = await Promise.all(
    chunks.map((chunk) =>
      safeListAllRows<Row>(tablesDB, tableId, [Query.equal(field, chunk), ...extraQueries])
    )
  );
  return results.flatMap((result) => result);
}

export function buildRsvpCountBySessionId(rows: AnyRow[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const sessionId = typeof row.sessionId === "string" ? row.sessionId : "";
    if (sessionId) {
      counts.set(sessionId, (counts.get(sessionId) ?? 0) + 1);
    }
  }
  return counts;
}

export function sortLiveSessionsForDashboard(sessions: LiveSessionRow[]): LiveSessionRow[] {
  return [...sessions].sort((left, right) => {
    const leftStatus = typeof left.status === "string" ? left.status : "";
    const rightStatus = typeof right.status === "string" ? right.status : "";
    if (leftStatus === "live" && rightStatus !== "live") return -1;
    if (leftStatus !== "live" && rightStatus === "live") return 1;
    const leftTime = toDate(left.scheduledAt)?.getTime() ?? 0;
    const rightTime = toDate(right.scheduledAt)?.getTime() ?? 0;
    return leftTime - rightTime;
  });
}
