import { Query } from "node-appwrite";
import type { Models } from "node-appwrite";

import { requireAuth } from "@/lib/appwrite/auth";
import { userHasCourseAccess } from "@/lib/appwrite/access";
import type { Role } from "@/lib/utils/constants";
import type {
  Assignment,
  AuditLog,
  Category,
  Course,
  Enrollment,
  ForumCategory,
  ForumThread,
  Lesson,
  LiveSession,
  ModerationAction,
  Module,
  Payment,
  Quiz,
  QuizAttempt,
  Submission,
} from "@/types/appwrite";

import { APPWRITE_CONFIG } from "./config";
import { createAdminClient, createSessionClient } from "./server";

type AnyRow = Models.Row & {
  [key: string]: unknown;
};

type AdminClient = Awaited<ReturnType<typeof createAdminClient>>;

type InstructorScope = {
  userId: string;
  role: Role;
};

type CourseRow = AnyRow & Partial<Course>;
type EnrollmentRow = AnyRow & Partial<Enrollment>;
type PaymentRow = AnyRow & Partial<Payment>;
type LiveSessionRow = AnyRow & Partial<LiveSession>;
type ModerationActionRow = AnyRow & Partial<ModerationAction>;
type AuditLogRow = AnyRow & Partial<AuditLog>;
type ForumThreadRow = AnyRow & Partial<ForumThread>;
type ForumCategoryRow = AnyRow & Partial<ForumCategory>;
type ModuleRow = AnyRow & Partial<Module>;
type LessonRow = AnyRow & Partial<Lesson>;
type QuizRow = AnyRow & Partial<Quiz>;
type QuizAttemptRow = AnyRow & Partial<QuizAttempt>;
type AssignmentRow = AnyRow & Partial<Assignment>;
type SubmissionRow = AnyRow & Partial<Submission>;

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

const REVIEW_OVERDUE_MS = 1000 * 60 * 60 * 24 * 3;
const RECENT_ENROLLMENT_MS = 1000 * 60 * 60 * 24 * 14;
const STUDENT_ATTENTION_MS = 1000 * 60 * 60 * 24 * 7;

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
  providerRef: string;
  method: string;
  amount: number;
  currency: string;
  status: string;
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

export type StudentProfileStats = {
  currentStreakDays: number;
  activeCourses: number;
  certificates: number;
};

function chunkValues<T>(values: T[], chunkSize = 20): T[][] {
  if (values.length <= chunkSize) {
    return [values];
  }

  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize));
  }
  return chunks;
}

function toDate(value: unknown): Date | null {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function getSafeHttpUrl(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
}

function getCourseThumbnailId(course: CourseRow): string {
  if (
    typeof course.thumbnailFileId === "string" &&
    course.thumbnailFileId.length > 0
  ) {
    return course.thumbnailFileId;
  }

  if (typeof course.thumbnailId === "string" && course.thumbnailId.length > 0) {
    return course.thumbnailId;
  }

  return "";
}

function buildInstructorCourseHealth(args: {
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
  const previewLessonCount = lessons.filter((lesson) => Boolean(lesson.isFreePreview))
    .length;
  const publishBlockers: string[] = [];
  const attentionFlags: string[] = [];

  if (!hasThumbnail) {
    publishBlockers.push("Add a course thumbnail");
  }

  if (modules.length === 0) {
    publishBlockers.push("Create the first module");
  }

  if (totalLessons === 0) {
    publishBlockers.push("Add at least one lesson");
  } else if (lessonVideoCount === 0) {
    publishBlockers.push("Upload the first lesson video");
  }

  if (missingVideoCount > 0 && lessonVideoCount > 0) {
    attentionFlags.push(
      `${missingVideoCount} lesson${missingVideoCount === 1 ? "" : "s"} still need video`
    );
  }

  const accessModel =
    typeof course.accessModel === "string" ? course.accessModel : "free";
  if (accessModel !== "free" && previewLessonCount === 0) {
    attentionFlags.push("No free preview lesson for conversion");
  }

  if (Boolean(course.isPublished) && activeEnrollments === 0) {
    attentionFlags.push("Published with no active enrollments yet");
  }

  return {
    thumbnailId,
    hasThumbnail,
    totalLessons,
    totalDuration,
    moduleCount: modules.length,
    activeEnrollments,
    previewLessonCount,
    lessonVideoCount,
    missingVideoCount,
    publishBlockers,
    attentionFlags,
    readyToPublish: !Boolean(course.isPublished) && publishBlockers.length === 0,
    needsAttention: publishBlockers.length > 0 || attentionFlags.length > 0,
  };
}

function toUtcDateKey(value: unknown): string | null {
  const date = toDate(value);
  if (!date) {
    return null;
  }

  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized.toISOString().slice(0, 10);
}

function calculateCurrentStreak(dateKeys: Set<string>): number {
  if (dateKeys.size === 0) {
    return 0;
  }

  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);

  const todayKey = cursor.toISOString().slice(0, 10);
  if (!dateKeys.has(todayKey)) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    const yesterdayKey = cursor.toISOString().slice(0, 10);
    if (!dateKeys.has(yesterdayKey)) {
      return 0;
    }
  }

  let streak = 0;
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!dateKeys.has(key)) {
      break;
    }

    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

function isToday(value: unknown): boolean {
  const date = toDate(value);
  if (!date) {
    return false;
  }

  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function resolveRoleFromLabels(labels: string[] | undefined): string {
  if (!labels || labels.length === 0) {
    return "student";
  }

  if (labels.includes("admin")) {
    return "admin";
  }

  if (labels.includes("moderator")) {
    return "moderator";
  }

  if (labels.includes("instructor")) {
    return "instructor";
  }

  return "student";
}

function getInstructorQueries(scope: InstructorScope): string[] {
  if (scope.role === "admin") {
    return [Query.limit(100)];
  }

  return [Query.equal("instructorId", [scope.userId]), Query.limit(100)];
}

async function safeListRows<Row extends AnyRow>(
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

    return {
      rows: response.rows,
      total: response.total,
    };
  } catch {
    return {
      rows: [],
      total: 0,
    };
  }
}

async function safeCountRows(
  tablesDB: AdminClient["tablesDB"],
  tableId: string,
  queries: string[] = []
): Promise<number> {
  const response = await safeListRows<AnyRow>(tablesDB, tableId, [
    ...queries,
    Query.limit(1),
  ]);

  return response.total;
}

async function safeGetRow<Row extends AnyRow>(
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

async function listRowsByFieldValues<Row extends AnyRow>(
  tablesDB: AdminClient["tablesDB"],
  tableId: string,
  field: string,
  values: string[],
  extraQueries: string[] = []
): Promise<Row[]> {
  if (values.length === 0) {
    return [];
  }

  const chunks = chunkValues(values, 20);
  const results = await Promise.all(
    chunks.map((chunk) =>
      safeListRows<Row>(tablesDB, tableId, [
        Query.equal(field, chunk),
        Query.limit(200),
        ...extraQueries,
      ])
    )
  );

  return results.flatMap((result) => result.rows);
}

export async function getCommunityThreadsData(): Promise<CommunityThreadItem[]> {
  try {
    const { tablesDB } = await createSessionClient();

    const [categoriesResult, threadsResult] = await Promise.all([
      safeListRows<ForumCategoryRow>(tablesDB, APPWRITE_CONFIG.tables.forumCategories, [
        Query.limit(100),
      ]),
      safeListRows<ForumThreadRow>(tablesDB, APPWRITE_CONFIG.tables.forumThreads, [
        Query.limit(50),
      ]),
    ]);

    const categoryNameById = new Map<string, string>(
      categoriesResult.rows.map((category) => [
        category.$id,
        typeof category.name === "string" ? category.name : "General",
      ])
    );

    return threadsResult.rows
      .sort((left, right) => {
        const leftPinned = Boolean(left.isPinned) ? 1 : 0;
        const rightPinned = Boolean(right.isPinned) ? 1 : 0;
        if (leftPinned !== rightPinned) {
          return rightPinned - leftPinned;
        }

        const leftDate = toDate(left.lastReplyAt ?? left.createdAt)?.getTime() ?? 0;
        const rightDate = toDate(right.lastReplyAt ?? right.createdAt)?.getTime() ?? 0;
        return rightDate - leftDate;
      })
      .map((thread) => ({
        id: thread.$id,
        title: typeof thread.title === "string" ? thread.title : "Untitled thread",
        authorId: typeof thread.userId === "string" ? thread.userId : "",
        author: typeof thread.userName === "string" ? thread.userName : "Unknown user",
        replies: typeof thread.replyCount === "number" ? thread.replyCount : 0,
        pinned: Boolean(thread.isPinned),
        locked: Boolean(thread.isLocked),
        category:
          (typeof thread.forumCatId === "string" &&
            categoryNameById.get(thread.forumCatId)) ||
          "General",
      }));
  } catch {
    return [];
  }
}

export async function getCommunityCategoriesData(): Promise<CommunityCategoryItem[]> {
  try {
    const { tablesDB } = await createSessionClient();
    const categoriesResult = await safeListRows<ForumCategoryRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.forumCategories,
      [Query.orderAsc("order"), Query.limit(100)]
    );

    return categoriesResult.rows.map((category) => ({
      id: category.$id,
      name: typeof category.name === "string" ? category.name : "General",
    }));
  } catch {
    return [];
  }
}

export async function getInstructorDashboardStats(
  scope: InstructorScope
): Promise<InstructorDashboardStats> {
  try {
    const { tablesDB } = await createAdminClient();

    const coursesResult = await safeListRows<CourseRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.courses,
      getInstructorQueries(scope)
    );

    const courseIds = coursesResult.rows.map((course) => course.$id);

    const activeEnrollmentsRows = await listRowsByFieldValues<EnrollmentRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.enrollments,
      "courseId",
      courseIds
    );

    const activeEnrollments = activeEnrollmentsRows.filter(
      (row) => row.isActive !== false
    ).length;

    const liveSessionQueries: string[] = [
      Query.equal("status", ["scheduled", "live"]),
    ];
    if (scope.role !== "admin") {
      liveSessionQueries.push(Query.equal("instructorId", [scope.userId]));
    }
    const liveSessions = await safeCountRows(
      tablesDB,
      APPWRITE_CONFIG.tables.liveSessions,
      liveSessionQueries
    );

    const assignments = await listRowsByFieldValues<AnyRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.assignments,
      "courseId",
      courseIds
    );
    const assignmentIds = assignments.map((row) => row.$id);

    const submissions = await listRowsByFieldValues<AnyRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.submissions,
      "assignmentId",
      assignmentIds
    );
    const pendingReviews = submissions.filter(
      (row) => Number(row.grade ?? 0) <= 0
    ).length;

    return {
      courses: coursesResult.total,
      activeEnrollments,
      liveSessions,
      pendingReviews,
    };
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "Failed to load instructor dashboard stats."
    );

    return {
      courses: 0,
      activeEnrollments: 0,
      liveSessions: 0,
      pendingReviews: 0,
    };
  }
}

export async function getInstructorCourseList(
  scope: InstructorScope
): Promise<InstructorCourseListItem[]> {
  try {
    const { tablesDB } = await createAdminClient();
    const coursesResult = await safeListRows<CourseRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.courses,
      getInstructorQueries(scope)
    );

    const courseIds = coursesResult.rows.map((course) => course.$id);
    const [moduleRows, lessonRows, enrollmentRows] = await Promise.all([
      listRowsByFieldValues<ModuleRow>(
        tablesDB,
        APPWRITE_CONFIG.tables.modules,
        "courseId",
        courseIds
      ),
      listRowsByFieldValues<LessonRow>(
        tablesDB,
        APPWRITE_CONFIG.tables.lessons,
        "courseId",
        courseIds
      ),
      listRowsByFieldValues<EnrollmentRow>(
        tablesDB,
        APPWRITE_CONFIG.tables.enrollments,
        "courseId",
        courseIds
      ),
    ]);

    const modulesByCourseId = new Map<string, ModuleRow[]>();
    for (const moduleRow of moduleRows) {
      const courseId =
        typeof moduleRow.courseId === "string" ? moduleRow.courseId : "";
      if (!courseId) {
        continue;
      }

      const current = modulesByCourseId.get(courseId) ?? [];
      current.push(moduleRow);
      modulesByCourseId.set(courseId, current);
    }

    const lessonsByCourseId = new Map<string, LessonRow[]>();
    for (const lesson of lessonRows) {
      const courseId = typeof lesson.courseId === "string" ? lesson.courseId : "";
      if (!courseId) {
        continue;
      }

      const current = lessonsByCourseId.get(courseId) ?? [];
      current.push(lesson);
      lessonsByCourseId.set(courseId, current);
    }

    const activeEnrollmentsByCourseId = new Map<string, number>();
    for (const enrollment of enrollmentRows) {
      const courseId =
        typeof enrollment.courseId === "string" ? enrollment.courseId : "";
      if (!courseId || enrollment.isActive === false) {
        continue;
      }

      activeEnrollmentsByCourseId.set(
        courseId,
        (activeEnrollmentsByCourseId.get(courseId) ?? 0) + 1
      );
    }

    return coursesResult.rows
      .sort((left, right) => {
        const leftDate = toDate(left.$updatedAt ?? left.$createdAt)?.getTime() ?? 0;
        const rightDate = toDate(right.$updatedAt ?? right.$createdAt)?.getTime() ?? 0;
        return rightDate - leftDate;
      })
      .map((course) => {
        const health = buildInstructorCourseHealth({
          course,
          modules: modulesByCourseId.get(course.$id) ?? [],
          lessons: lessonsByCourseId.get(course.$id) ?? [],
          activeEnrollments: activeEnrollmentsByCourseId.get(course.$id) ?? 0,
        });

        return {
          id: course.$id,
          title: typeof course.title === "string" ? course.title : "Untitled course",
          shortDescription:
            typeof course.shortDescription === "string" ? course.shortDescription : "",
          status: course.isPublished ? "Published" : "Draft",
          accessModel:
            typeof course.accessModel === "string" ? course.accessModel : "free",
          price: Number(course.price ?? 0),
          totalLessons: health.totalLessons,
          totalDuration: health.totalDuration,
          moduleCount: health.moduleCount,
          activeEnrollments: health.activeEnrollments,
          hasThumbnail: health.hasThumbnail,
          previewLessonCount: health.previewLessonCount,
          lessonVideoCount: health.lessonVideoCount,
          missingVideoCount: health.missingVideoCount,
          publishBlockers: health.publishBlockers,
          attentionFlags: health.attentionFlags,
          readyToPublish: health.readyToPublish,
          needsAttention: health.needsAttention,
        };
      });
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "Failed to load instructor course list."
    );

    return [];
  }
}

export async function getInstructorStudents(
  scope: InstructorScope
): Promise<InstructorStudentItem[]> {
  try {
    const { tablesDB, users } = await createAdminClient();

    const coursesResult = await safeListRows<CourseRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.courses,
      getInstructorQueries(scope)
    );

    const courseById = new Map(coursesResult.rows.map((course) => [course.$id, course]));
    const courseIds = [...courseById.keys()];

    if (courseIds.length === 0) {
      return [];
    }

    const enrollmentRows = await listRowsByFieldValues<EnrollmentRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.enrollments,
      "courseId",
      courseIds
    );

    const activeEnrollmentRows = enrollmentRows
      .filter((row) => row.isActive !== false && typeof row.userId === "string")
      .sort((left, right) => {
        const leftDate = toDate(left.enrolledAt)?.getTime() ?? 0;
        const rightDate = toDate(right.enrolledAt)?.getTime() ?? 0;
        return rightDate - leftDate;
      });

    if (activeEnrollmentRows.length === 0) {
      return [];
    }

    const uniqueUserIds = [...new Set(activeEnrollmentRows.map((row) => String(row.userId)))];

    const userMap = new Map<string, { name: string; email: string }>();
    await Promise.all(
      uniqueUserIds.map(async (userId) => {
        try {
          const user = await users.get({ userId });
          userMap.set(userId, {
            name: user.name || "Unknown user",
            email: user.email || "No email",
          });
        } catch {
          userMap.set(userId, {
            name: userId,
            email: "No email",
          });
        }
      })
    );

    return activeEnrollmentRows.map((enrollment) => {
      const userId = String(enrollment.userId);
      const courseId = typeof enrollment.courseId === "string" ? enrollment.courseId : "";
      const course = courseById.get(courseId);
      const enrolledAt =
        typeof enrollment.enrolledAt === "string" && enrollment.enrolledAt.length > 0
          ? enrollment.enrolledAt
          : typeof enrollment.$createdAt === "string"
            ? enrollment.$createdAt
            : null;
      const enrolledTime = toDate(enrolledAt)?.getTime() ?? Number.NaN;

      const rawProgress = Number(enrollment.progress ?? 0);
      const progressPercent = Number.isFinite(rawProgress)
        ? Math.min(100, Math.max(0, Math.round(rawProgress)))
        : 0;

      const user = userMap.get(userId) ?? { name: userId, email: "No email" };

      return {
        id: userId,
        name: user.name,
        email: user.email,
        courseId,
        courseTitle:
          typeof course?.title === "string" ? course.title : "Unknown course",
        progressPercent,
        enrolledAt,
        needsAttention:
          progressPercent < 25 &&
          Number.isFinite(enrolledTime) &&
          Date.now() - enrolledTime > STUDENT_ATTENTION_MS,
        isNearCompletion: progressPercent >= 80 && progressPercent < 100,
        isNewEnrollment:
          Number.isFinite(enrolledTime) &&
          Date.now() - enrolledTime <= RECENT_ENROLLMENT_MS,
      };
    });
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "Failed to load instructor students."
    );

    return [];
  }
}

export async function getInstructorSubmissionQueue(
  scope: InstructorScope
): Promise<InstructorSubmissionQueueItem[]> {
  try {
    const { tablesDB, users } = await createAdminClient();

    const coursesResult = await safeListRows<CourseRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.courses,
      getInstructorQueries(scope)
    );

    const courseIds = coursesResult.rows.map((course) => course.$id);
    if (courseIds.length === 0) {
      return [];
    }

    const courseTitleById = new Map(
      coursesResult.rows.map((course) => [
        course.$id,
        typeof course.title === "string" ? course.title : "Course",
      ])
    );

    const assignmentRows = await listRowsByFieldValues<AssignmentRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.assignments,
      "courseId",
      courseIds
    );

    const assignmentById = new Map(
      assignmentRows.map((row) => [
        row.$id,
        {
          assignmentId: row.$id,
          assignmentTitle:
            typeof row.title === "string" ? row.title : "Assignment",
          courseId:
            typeof row.courseId === "string" ? row.courseId : "",
        },
      ])
    );

    const assignmentIds = [...assignmentById.keys()];
    if (assignmentIds.length === 0) {
      return [];
    }

    const submissionRows = await listRowsByFieldValues<SubmissionRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.submissions,
      "assignmentId",
      assignmentIds
    );

    const userIds = [
      ...new Set(
        submissionRows
          .map((row) => (typeof row.userId === "string" ? row.userId.trim() : ""))
          .filter(Boolean)
      ),
    ];

    const userNameById = new Map<string, string>();
    await Promise.all(
      userIds.map(async (userId) => {
        try {
          const account = await users.get({ userId });
          userNameById.set(userId, account.name || account.email || userId);
        } catch {
          userNameById.set(userId, "Student");
        }
      })
    );

    return submissionRows
      .map((row) => {
        const assignment = assignmentById.get(row.assignmentId ?? "");
        if (!assignment) {
          return null;
        }

        const userId = typeof row.userId === "string" ? row.userId : "";
        const submittedAt =
          typeof row.submittedAt === "string" && row.submittedAt.length > 0
            ? row.submittedAt
            : typeof row.$createdAt === "string"
              ? row.$createdAt
              : "";
        const grade = Number(row.grade ?? 0);
        const feedback = typeof row.feedback === "string" ? row.feedback : "";
        const submittedTime = toDate(submittedAt)?.getTime() ?? Number.NaN;
        const gradedAt =
          grade > 0
            ? typeof row.$updatedAt === "string" && row.$updatedAt.length > 0
              ? row.$updatedAt
              : submittedAt || null
            : null;

        return {
          id: row.$id,
          assignmentId: assignment.assignmentId,
          assignmentTitle: assignment.assignmentTitle,
          courseId: assignment.courseId,
          courseTitle: courseTitleById.get(assignment.courseId) ?? "Course",
          userId,
          userName: userNameById.get(userId) ?? "Student",
          fileId: typeof row.fileId === "string" ? row.fileId : "",
          submittedAt,
          grade,
          feedback,
          gradedAt,
          needsFeedback: grade > 0 && feedback.trim().length === 0,
          isOverdueReview:
            grade <= 0 &&
            Number.isFinite(submittedTime) &&
            Date.now() - submittedTime > REVIEW_OVERDUE_MS,
        } satisfies InstructorSubmissionQueueItem;
      })
      .filter((item): item is InstructorSubmissionQueueItem => item !== null)
      .sort((left, right) => {
        const leftTime = toDate(left.submittedAt)?.getTime() ?? 0;
        const rightTime = toDate(right.submittedAt)?.getTime() ?? 0;
        return rightTime - leftTime;
      });
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "Failed to load instructor submission queue."
    );

    return [];
  }
}

export async function getInstructorRevenueOverview(
  scope: InstructorScope
): Promise<InstructorRevenueOverview> {
  try {
    const { tablesDB } = await createAdminClient();

    const coursesResult = await safeListRows<CourseRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.courses,
      getInstructorQueries(scope)
    );

    const courses = coursesResult.rows;
    const courseIds = courses.map((course) => course.$id);

    if (courseIds.length === 0) {
      return {
        totalEarnings: 0,
        monthlyEarnings: 0,
        totalEnrollments: 0,
        paidCourseCount: 0,
        publishedPaidCourses: 0,
        courseEarnings: [],
        recentPayments: [],
        dormantPaidCourses: [],
      };
    }

    const [paymentsByCourse, enrollmentsByCourse] = await Promise.all([
      Promise.all(
        courseIds.map(async (courseId) => {
          const result = await safeListRows<PaymentRow>(
            tablesDB,
            APPWRITE_CONFIG.tables.payments,
            [
              Query.equal("courseId", [courseId]),
              Query.equal("status", ["completed"]),
              Query.limit(500),
            ]
          );

          return [courseId, result.rows] as const;
        })
      ),
      Promise.all(
        courseIds.map(async (courseId) => {
          const result = await safeListRows<EnrollmentRow>(
            tablesDB,
            APPWRITE_CONFIG.tables.enrollments,
            [Query.equal("courseId", [courseId]), Query.limit(500)]
          );

          return [courseId, result.rows] as const;
        })
      ),
    ]);

    const paymentMap = new Map<string, PaymentRow[]>(paymentsByCourse);
    const enrollmentMap = new Map<string, EnrollmentRow[]>(enrollmentsByCourse);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    let totalEarnings = 0;
    let monthlyEarnings = 0;
    let totalEnrollments = 0;

    const courseEarnings = courses
      .map((course) => {
        const payments = paymentMap.get(course.$id) ?? [];
        const enrollments = enrollmentMap.get(course.$id) ?? [];
        const totalRevenue = payments.reduce(
          (sum, payment) => sum + Number(payment.amount ?? 0) / 100,
          0
        );
        const monthlyRevenue = payments.reduce((sum, payment) => {
          const paidAt = toDate(payment.createdAt ?? payment.$createdAt);
          if (!paidAt || paidAt < monthStart) {
            return sum;
          }

          return sum + Number(payment.amount ?? 0) / 100;
        }, 0);
        const lastPaymentAt =
          [...payments]
            .map((payment) =>
              typeof payment.createdAt === "string" && payment.createdAt.length > 0
                ? payment.createdAt
                : typeof payment.$createdAt === "string"
                  ? payment.$createdAt
                  : null
            )
            .filter((value): value is string => Boolean(value))
            .sort((left, right) => {
              const leftTime = toDate(left)?.getTime() ?? 0;
              const rightTime = toDate(right)?.getTime() ?? 0;
              return rightTime - leftTime;
            })[0] ?? null;

        totalEarnings += totalRevenue;
        monthlyEarnings += monthlyRevenue;
        totalEnrollments += enrollments.length;

        return {
          id: course.$id,
          title: typeof course.title === "string" ? course.title : "Untitled",
          accessModel:
            typeof course.accessModel === "string" ? course.accessModel : "free",
          isPublished: Boolean(course.isPublished),
          enrollments: enrollments.length,
          totalRevenue,
          monthlyRevenue,
          lastPaymentAt,
        } satisfies InstructorRevenueCourseItem;
      })
      .sort((left, right) => {
        if (right.monthlyRevenue !== left.monthlyRevenue) {
          return right.monthlyRevenue - left.monthlyRevenue;
        }
        if (right.totalRevenue !== left.totalRevenue) {
          return right.totalRevenue - left.totalRevenue;
        }
        return right.enrollments - left.enrollments;
      });

    const recentPayments = [...paymentMap.entries()]
      .flatMap(([courseId, payments]) =>
        payments.map((payment) => ({
          id: payment.$id,
          courseId,
          courseTitle:
            courseEarnings.find((course) => course.id === courseId)?.title ?? "Course",
          amount: Number(payment.amount ?? 0) / 100,
          paidAt:
            typeof payment.createdAt === "string" && payment.createdAt.length > 0
              ? payment.createdAt
              : typeof payment.$createdAt === "string"
                ? payment.$createdAt
                : null,
        }))
      )
      .sort((left, right) => {
        const leftTime = toDate(left.paidAt)?.getTime() ?? 0;
        const rightTime = toDate(right.paidAt)?.getTime() ?? 0;
        return rightTime - leftTime;
      })
      .slice(0, 6);

    const dormantPaidCourses = courseEarnings.filter(
      (course) =>
        course.accessModel === "paid" &&
        course.isPublished &&
        course.monthlyRevenue <= 0
    );

    return {
      totalEarnings,
      monthlyEarnings,
      totalEnrollments,
      paidCourseCount: courseEarnings.filter((course) => course.accessModel === "paid")
        .length,
      publishedPaidCourses: courseEarnings.filter(
        (course) => course.accessModel === "paid" && course.isPublished
      ).length,
      courseEarnings,
      recentPayments,
      dormantPaidCourses,
    };
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "Failed to load instructor revenue overview."
    );

    return {
      totalEarnings: 0,
      monthlyEarnings: 0,
      totalEnrollments: 0,
      paidCourseCount: 0,
      publishedPaidCourses: 0,
      courseEarnings: [],
      recentPayments: [],
      dormantPaidCourses: [],
    };
  }
}

export async function getInstructorLiveSessions(
  scope: InstructorScope
): Promise<InstructorLiveSessionItem[]> {
  try {
    const { tablesDB } = await createAdminClient();

    const queries: string[] = [Query.orderAsc("scheduledAt"), Query.limit(50)];
    if (scope.role !== "admin") {
      queries.push(Query.equal("instructorId", [scope.userId]));
    }

    const sessionsResult = await safeListRows<LiveSessionRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.liveSessions,
      queries
    );

    const sessionIds = sessionsResult.rows.map((session) => session.$id);
    const rsvpRows = await listRowsByFieldValues<AnyRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.sessionRsvps,
      "sessionId",
      sessionIds
    );

    const rsvpCountBySessionId = new Map<string, number>();
    for (const row of rsvpRows) {
      const sessionId = typeof row.sessionId === "string" ? row.sessionId : "";
      if (!sessionId) {
        continue;
      }

      rsvpCountBySessionId.set(
        sessionId,
        (rsvpCountBySessionId.get(sessionId) ?? 0) + 1
      );
    }

    return sessionsResult.rows.map((session) => ({
      id: session.$id,
      title: typeof session.title === "string" ? session.title : "Untitled session",
      description:
        typeof session.description === "string" ? session.description : "",
      status: typeof session.status === "string" ? session.status : "scheduled",
      scheduledAt:
        typeof session.scheduledAt === "string" ? session.scheduledAt : null,
      streamUrl: getSafeHttpUrl(session.streamId),
      recordingUrl: getSafeHttpUrl(session.recordingUrl),
      rsvpCount: rsvpCountBySessionId.get(session.$id) ?? 0,
    }));
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "Failed to load instructor live sessions."
    );

    return [];
  }
}

export async function getInstructorCourseSummary(
  scope: InstructorScope,
  identifier: string
): Promise<InstructorCourseSummary | null> {
  try {
    const { tablesDB } = await createAdminClient();

    const byId = await safeGetRow<CourseRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.courses,
      identifier
    );

    const isAllowedById =
      byId &&
      (scope.role === "admin" || byId.instructorId === scope.userId);

    let course = isAllowedById ? byId : null;

    if (!course) {
      const slugQueries: string[] = [Query.equal("slug", [identifier]), Query.limit(1)];
      if (scope.role !== "admin") {
        slugQueries.push(Query.equal("instructorId", [scope.userId]));
      }

      const bySlug = await safeListRows<CourseRow>(
        tablesDB,
        APPWRITE_CONFIG.tables.courses,
        slugQueries
      );

      course = bySlug.rows[0] ?? null;
    }

    if (!course) {
      return null;
    }

    const [modulesResult, lessonsResult, enrollmentsResult] = await Promise.all([
      safeListRows<ModuleRow>(tablesDB, APPWRITE_CONFIG.tables.modules, [
        Query.equal("courseId", [course.$id]),
        Query.limit(200),
      ]),
      safeListRows<LessonRow>(tablesDB, APPWRITE_CONFIG.tables.lessons, [
        Query.equal("courseId", [course.$id]),
        Query.limit(1000),
      ]),
      safeListRows<EnrollmentRow>(tablesDB, APPWRITE_CONFIG.tables.enrollments, [
        Query.equal("courseId", [course.$id]),
        Query.limit(500),
      ]),
    ]);

    const health = buildInstructorCourseHealth({
      course,
      modules: modulesResult.rows,
      lessons: lessonsResult.rows,
      activeEnrollments: enrollmentsResult.rows.filter(
        (enrollment) => enrollment.isActive !== false
      ).length,
    });

    return {
      id: course.$id,
      title: typeof course.title === "string" ? course.title : "Untitled course",
      slug: typeof course.slug === "string" ? course.slug : course.$id,
      shortDescription:
        typeof course.shortDescription === "string" ? course.shortDescription : "",
      whatYouLearn: toStringArray(course.whatYouLearn),
      requirements: toStringArray(course.requirements),
      accessModel:
        typeof course.accessModel === "string" ? course.accessModel : "free",
      isPublished: Boolean(course.isPublished),
      price: Number(course.price ?? 0),
      totalLessons: health.totalLessons,
      totalDuration: health.totalDuration,
      thumbnailId: health.thumbnailId,
      moduleCount: health.moduleCount,
      activeEnrollments: health.activeEnrollments,
      hasThumbnail: health.hasThumbnail,
      previewLessonCount: health.previewLessonCount,
      lessonVideoCount: health.lessonVideoCount,
      missingVideoCount: health.missingVideoCount,
      publishBlockers: health.publishBlockers,
      attentionFlags: health.attentionFlags,
      readyToPublish: health.readyToPublish,
      needsAttention: health.needsAttention,
    };
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "Failed to load instructor course summary."
    );

    return null;
  }
}

export async function getInstructorCurriculum(
  courseId: string
): Promise<InstructorCurriculumModule[]> {
  try {
    const { tablesDB } = await createAdminClient();

    const modulesResult = await safeListRows<ModuleRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.modules,
      [Query.equal("courseId", [courseId]), Query.orderAsc("order"), Query.limit(200)]
    );

    const lessonsByModule = new Map<string, LessonRow[]>();
    const lessonsResult = await safeListRows<LessonRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.lessons,
      [Query.equal("courseId", [courseId]), Query.orderAsc("order"), Query.limit(1000)]
    );

    for (const lesson of lessonsResult.rows) {
      if (typeof lesson.moduleId !== "string") {
        continue;
      }

      const current = lessonsByModule.get(lesson.moduleId) ?? [];
      current.push(lesson);
      lessonsByModule.set(lesson.moduleId, current);
    }

    return modulesResult.rows.map((module) => ({
      id: module.$id,
      title: typeof module.title === "string" ? module.title : "Untitled module",
      description:
        typeof module.description === "string" ? module.description : "",
      order: Number(module.order ?? 0),
      lessons: (lessonsByModule.get(module.$id) ?? []).map((lesson) => ({
        id: lesson.$id,
        title: typeof lesson.title === "string" ? lesson.title : "Untitled lesson",
        description:
          typeof lesson.description === "string" ? lesson.description : "",
        order: Number(lesson.order ?? 0),
        duration: Number(lesson.duration ?? 0),
        isFree: Boolean(lesson.isFree),
        isFreePreview: Boolean(lesson.isFreePreview),
        videoFileId: typeof lesson.videoFileId === "string" ? lesson.videoFileId : "",
      })),
    }));
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "Failed to load instructor curriculum."
    );

    return [];
  }
}

export async function getModeratorDashboardStats(): Promise<ModeratorDashboardStats> {
  try {
    const { tablesDB } = await createAdminClient();

    const actionsResult = await safeListRows<ModerationActionRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.moderationActions,
      [Query.limit(300)]
    );

    const rows = actionsResult.rows;

    const openReports = rows.filter(
      (row) => row.action === "flag" && !row.revertedAt
    ).length;

    const mutedUsers = new Set(
      rows
        .filter(
          (row) =>
            (row.action === "mute" || row.action === "timeout") &&
            !row.revertedAt &&
            typeof row.targetUserId === "string"
        )
        .map((row) => String(row.targetUserId))
    ).size;

    const flaggedThreads = new Set(
      rows
        .filter(
          (row) =>
            row.action === "flag" &&
            typeof row.entityType === "string" &&
            row.entityType.toLowerCase().includes("thread") &&
            typeof row.entityId === "string"
        )
        .map((row) => String(row.entityId))
    ).size;

    const actionsToday = rows.filter((row) => isToday(row.createdAt)).length;

    return {
      openReports,
      mutedUsers,
      flaggedThreads,
      actionsToday,
    };
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "Failed to load moderator dashboard stats."
    );

    return {
      openReports: 0,
      mutedUsers: 0,
      flaggedThreads: 0,
      actionsToday: 0,
    };
  }
}

export async function getModeratorReports(): Promise<ModeratorReportItem[]> {
  try {
    const { tablesDB } = await createAdminClient();
    const actionsResult = await safeListRows<ModerationActionRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.moderationActions,
      [Query.equal("action", ["flag"]), Query.limit(100)]
    );

    return actionsResult.rows
      .sort((left, right) => {
        const leftDate = toDate(left.createdAt)?.getTime() ?? 0;
        const rightDate = toDate(right.createdAt)?.getTime() ?? 0;
        return rightDate - leftDate;
      })
      .map((row) => ({
        id: row.$id,
        entityType:
          typeof row.entityType === "string" ? row.entityType : "unknown",
        entityId: typeof row.entityId === "string" ? row.entityId : "n/a",
        targetUserId:
          typeof row.targetUserId === "string" ? row.targetUserId : "",
        target:
          typeof row.targetUserName === "string"
            ? row.targetUserName
            : typeof row.targetUserId === "string"
            ? row.targetUserId
            : "Unknown user",
        reason: typeof row.reason === "string" ? row.reason : "No reason provided",
        status: row.revertedAt ? "reviewed" : "pending",
        createdAt: typeof row.createdAt === "string" ? row.createdAt : null,
      }));
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to load moderator reports."
    );

    return [];
  }
}

export async function getModeratorStudents(): Promise<ModeratorStudentItem[]> {
  try {
    const { tablesDB } = await createAdminClient();
    const actionsResult = await safeListRows<ModerationActionRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.moderationActions,
      [Query.limit(300)]
    );

    const rows = actionsResult.rows
      .filter((row) => typeof row.targetUserId === "string")
      .sort((left, right) => {
        const leftDate = toDate(left.createdAt)?.getTime() ?? 0;
        const rightDate = toDate(right.createdAt)?.getTime() ?? 0;
        return rightDate - leftDate;
      });

    const latestByUser = new Map<string, ModerationActionRow>();
    for (const row of rows) {
      const userId = String(row.targetUserId);
      if (!latestByUser.has(userId)) {
        latestByUser.set(userId, row);
      }
    }

    return [...latestByUser.entries()].slice(0, 50).map(([userId, row]) => ({
      id: userId,
      latestActionId: row.$id,
      name:
        typeof row.targetUserName === "string" && row.targetUserName.length > 0
          ? row.targetUserName
          : userId,
      latestAction: typeof row.action === "string" ? row.action : "unknown",
      latestReason: typeof row.reason === "string" ? row.reason : "No notes",
      status: row.revertedAt ? "resolved" : "open",
    }));
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to load moderator students."
    );

    return [];
  }
}

export async function getModeratorCommunityData(): Promise<ModeratorCommunityData> {
  try {
    const { tablesDB } = await createAdminClient();

    const [actionsResult, categoriesResult, threadsResult] = await Promise.all([
      safeListRows<ModerationActionRow>(tablesDB, APPWRITE_CONFIG.tables.moderationActions, [
        Query.limit(300),
      ]),
      safeListRows<ForumCategoryRow>(tablesDB, APPWRITE_CONFIG.tables.forumCategories, [
        Query.limit(100),
      ]),
      safeListRows<ForumThreadRow>(tablesDB, APPWRITE_CONFIG.tables.forumThreads, [
        Query.limit(30),
      ]),
    ]);

    const counts = {
      warn: 0,
      mute: 0,
      timeout: 0,
      deletePost: 0,
      flag: 0,
    };

    for (const action of actionsResult.rows) {
      if (action.action === "warn") {
        counts.warn += 1;
      }
      if (action.action === "mute") {
        counts.mute += 1;
      }
      if (action.action === "timeout") {
        counts.timeout += 1;
      }
      if (action.action === "delete_post") {
        counts.deletePost += 1;
      }
      if (action.action === "flag") {
        counts.flag += 1;
      }
    }

    const categoryNameById = new Map<string, string>(
      categoriesResult.rows.map((category) => [
        category.$id,
        typeof category.name === "string" ? category.name : "General",
      ])
    );

    const recentThreads: CommunityThreadItem[] = threadsResult.rows
      .sort((left, right) => {
        const leftDate = toDate(left.lastReplyAt ?? left.createdAt)?.getTime() ?? 0;
        const rightDate = toDate(right.lastReplyAt ?? right.createdAt)?.getTime() ?? 0;
        return rightDate - leftDate;
      })
      .slice(0, 8)
      .map((thread) => ({
        id: thread.$id,
        title: typeof thread.title === "string" ? thread.title : "Untitled thread",
        authorId: typeof thread.userId === "string" ? thread.userId : "",
        author: typeof thread.userName === "string" ? thread.userName : "Unknown user",
        replies: Number(thread.replyCount ?? 0),
        pinned: Boolean(thread.isPinned),
        locked: Boolean(thread.isLocked),
        category:
          (typeof thread.forumCatId === "string" &&
            categoryNameById.get(thread.forumCatId)) ||
          "General",
      }));

    return {
      actionCounts: [
        { label: "Warn", value: counts.warn },
        { label: "Mute", value: counts.mute },
        { label: "Timeout", value: counts.timeout },
        { label: "Delete Post", value: counts.deletePost },
        { label: "Flag", value: counts.flag },
      ],
      recentThreads,
    };
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "Failed to load moderator community data."
    );

    return {
      actionCounts: [
        { label: "Warn", value: 0 },
        { label: "Mute", value: 0 },
        { label: "Timeout", value: 0 },
        { label: "Delete Post", value: 0 },
        { label: "Flag", value: 0 },
      ],
      recentThreads: [],
    };
  }
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  try {
    const { tablesDB, users } = await createAdminClient();

    const [usersTotal, activeEnrollmentsResult, completedPayments, liveSessions, coursesResult] =
      await Promise.all([
        users
          .list({
            queries: [Query.limit(1)],
          })
          .then((result) => result.total)
          .catch(() => 0),
        safeListRows<EnrollmentRow>(tablesDB, APPWRITE_CONFIG.tables.enrollments, [
          Query.limit(500),
        ]),
        safeListRows<PaymentRow>(tablesDB, APPWRITE_CONFIG.tables.payments, [
          Query.equal("status", ["completed"]),
          Query.limit(500),
        ]),
        safeCountRows(tablesDB, APPWRITE_CONFIG.tables.liveSessions, [
          Query.equal("status", ["scheduled", "live"]),
        ]),
        safeListRows(tablesDB, APPWRITE_CONFIG.tables.courses, [
          Query.limit(500),
        ]),
      ]);

    const activeEnrollments = activeEnrollmentsResult.rows.filter((row) => row.isActive !== false).length;
    const completedEnrollments = activeEnrollmentsResult.rows.filter(
      (row) => Number((row as AnyRow).progress ?? 0) >= 100
    ).length;
    const completionRate =
      activeEnrollmentsResult.total > 0
        ? Math.round((completedEnrollments / activeEnrollmentsResult.total) * 100)
        : 0;

    const totalCourses = coursesResult.total;
    const publishedCourses = coursesResult.rows.filter(
      (r) => Boolean((r as AnyRow).isPublished)
    ).length;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyRevenue = completedPayments.rows
      .filter((payment) => {
        const createdAt = toDate(payment.createdAt);
        if (!createdAt) {
          return false;
        }

        return createdAt >= startOfMonth;
      })
      .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0) / 100;

    const totalRevenue = completedPayments.rows.reduce(
      (sum, payment) => sum + Number(payment.amount ?? 0),
      0
    ) / 100;

    return {
      totalUsers: usersTotal,
      activeEnrollments,
      monthlyRevenue,
      totalRevenue,
      liveSessions,
      totalCourses,
      publishedCourses,
      completionRate,
    };
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "Failed to load admin dashboard stats."
    );

    return {
      totalUsers: 0,
      activeEnrollments: 0,
      monthlyRevenue: 0,
      totalRevenue: 0,
      liveSessions: 0,
      totalCourses: 0,
      publishedCourses: 0,
      completionRate: 0,
    };
  }
}

export async function getAdminUsers(): Promise<AdminUserItem[]> {
  const { users } = await createAdminClient();

  try {
    const userList = await users.list({
      queries: [Query.orderDesc("registration"), Query.limit(80)],
    });

    return userList.users.map((user) => ({
      id: user.$id,
      name: user.name || user.$id,
      role: resolveRoleFromLabels(user.labels),
      status: user.status ? "active" : "blocked",
      email: user.email || "No email",
    }));
  } catch {
    return [];
  }
}

export async function getAdminCourses(): Promise<AdminCourseItem[]> {
  const { tablesDB } = await createAdminClient();

  const [coursesResult, categoriesResult] = await Promise.all([
    safeListRows<CourseRow>(tablesDB, APPWRITE_CONFIG.tables.courses, [Query.limit(100)]),
    safeListRows<AnyRow & Partial<Category>>(
      tablesDB,
      APPWRITE_CONFIG.tables.categories,
      [Query.limit(100)]
    ),
  ]);

  const categoryNameById = new Map<string, string>(
    categoriesResult.rows.map((category) => [
      category.$id,
      typeof category.name === "string" ? category.name : "Uncategorized",
    ])
  );

  return coursesResult.rows.map((course) => ({
    id: course.$id,
    title: typeof course.title === "string" ? course.title : "Untitled course",
    state: course.isPublished ? "published" : "draft",
    featured: course.isFeatured ? "yes" : "no",
    category:
      (typeof course.categoryId === "string" &&
        categoryNameById.get(course.categoryId)) ||
      "Uncategorized",
  }));
}

export async function getAdminCategories(): Promise<AdminCategoryItem[]> {
  try {
    const { tablesDB } = await createAdminClient();

    const categoriesResult = await safeListRows<AnyRow & Partial<Category>>(
      tablesDB,
      APPWRITE_CONFIG.tables.categories,
      [Query.orderAsc("order"), Query.limit(100)]
    );

    return categoriesResult.rows.map((category) => ({
      id: category.$id,
      name: typeof category.name === "string" ? category.name : "Unnamed",
      slug: typeof category.slug === "string" ? category.slug : "",
      description:
        typeof category.description === "string" ? category.description : "",
      order: Number(category.order ?? 0),
    }));
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to load admin categories."
    );

    return [];
  }
}

export async function getAdminPayments(): Promise<AdminPaymentItem[]> {
  try {
    const { tablesDB, users } = await createAdminClient();

    const paymentsResult = await safeListRows<PaymentRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.payments,
      [Query.limit(120)]
    );

    const paymentRows = paymentsResult.rows.sort((left, right) => {
      const leftDate = toDate(left.createdAt)?.getTime() ?? 0;
      const rightDate = toDate(right.createdAt)?.getTime() ?? 0;
      return rightDate - leftDate;
    });

    const courseIds = [
      ...new Set(
        paymentRows
          .map((payment) => payment.courseId)
          .filter((value): value is string => typeof value === "string")
      ),
    ];

    const userIds = [
      ...new Set(
        paymentRows
          .map((payment) => payment.userId)
          .filter((value): value is string => typeof value === "string")
      ),
    ];

    const courseMap = new Map<string, string>();
    const courseRows = await listRowsByFieldValues<CourseRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.courses,
      "$id",
      courseIds
    );
    for (const row of courseRows) {
      courseMap.set(
        row.$id,
        typeof row.title === "string" ? row.title : row.$id
      );
    }
    for (const courseId of courseIds) {
      if (!courseMap.has(courseId)) {
        courseMap.set(courseId, courseId);
      }
    }

    const userMap = new Map<string, string>();
    await Promise.all(
      userIds.map(async (userId) => {
        try {
          const user = await users.get({ userId });
          userMap.set(userId, user.name || userId);
        } catch {
          userMap.set(userId, userId);
        }
      })
    );

    return paymentRows.map((payment) => ({
      id: payment.$id,
      providerRef:
        typeof payment.providerRef === "string" ? payment.providerRef : payment.$id,
      method: typeof payment.method === "string" ? payment.method : "unknown",
      amount: Number(payment.amount ?? 0) / 100,
      currency: typeof payment.currency === "string" ? payment.currency : "INR",
      status: typeof payment.status === "string" ? payment.status : "pending",
      userName:
        (typeof payment.userId === "string" && userMap.get(payment.userId)) ||
        "Unknown user",
      courseTitle:
        (typeof payment.courseId === "string" && courseMap.get(payment.courseId)) ||
        "Unknown course",
      createdAt: typeof payment.createdAt === "string" ? payment.createdAt : null,
    }));
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to load admin payments."
    );

    return [];
  }
}

export async function getAdminLiveData(): Promise<AdminLiveData> {
  try {
    const { tablesDB } = await createAdminClient();

    const sessionsResult = await safeListRows<LiveSessionRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.liveSessions,
      [Query.limit(120)]
    );

    const sessions = sessionsResult.rows;

    const activeSessions = sessions.filter((session) => session.status === "live").length;
    const scheduledSessions = sessions.filter(
      (session) => session.status === "scheduled"
    ).length;
    const recordingFailures = sessions.filter(
      (session) =>
        session.status === "ended" &&
        (!session.recordingUrl || String(session.recordingUrl).trim().length === 0)
    ).length;

    const upcoming = sessions
      .filter((session) => session.status === "scheduled" || session.status === "live")
      .sort((left, right) => {
        const leftDate = toDate(left.scheduledAt)?.getTime() ?? 0;
        const rightDate = toDate(right.scheduledAt)?.getTime() ?? 0;
        return leftDate - rightDate;
      })
      .slice(0, 8)
      .map((session) => ({
        id: session.$id,
        title: typeof session.title === "string" ? session.title : "Untitled session",
        description:
          typeof session.description === "string" ? session.description : "",
        status: typeof session.status === "string" ? session.status : "scheduled",
        scheduledAt:
          typeof session.scheduledAt === "string" ? session.scheduledAt : null,
        streamUrl: getSafeHttpUrl(session.streamId),
        recordingUrl: getSafeHttpUrl(session.recordingUrl),
        rsvpCount: 0,
      }));

    return {
      activeSessions,
      scheduledSessions,
      recordingFailures,
      upcoming,
    };
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to load admin live data."
    );

    return {
      activeSessions: 0,
      scheduledSessions: 0,
      recordingFailures: 0,
      upcoming: [],
    };
  }
}

export async function getAdminModerationData(): Promise<AdminModerationData> {
  try {
    const { tablesDB } = await createAdminClient();

    const actionsResult = await safeListRows<ModerationActionRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.moderationActions,
      [Query.limit(300)]
    );

    const rows = actionsResult.rows;

    const actionsToday = rows.filter((row) => isToday(row.createdAt)).length;
    const openEscalations = rows.filter(
      (row) => row.action === "flag" && !row.revertedAt
    ).length;
    const activeTimeouts = rows.filter(
      (row) => row.action === "timeout" && !row.revertedAt
    ).length;

    const escalationItems = rows
      .filter((row) => row.action === "flag" && !row.revertedAt)
      .sort((left, right) => {
        const leftTime = toDate(left.createdAt)?.getTime() ?? 0;
        const rightTime = toDate(right.createdAt)?.getTime() ?? 0;
        return rightTime - leftTime;
      })
      .slice(0, 20)
      .map((row) => ({
        id: row.$id,
        moderatorName: typeof row.moderatorName === "string" ? row.moderatorName : "Unknown",
        targetUserName: typeof row.targetUserName === "string" ? row.targetUserName : "Unknown",
        action: typeof row.action === "string" ? row.action : "flag",
        scope: typeof row.scope === "string" ? row.scope : "platform",
        reason: typeof row.reason === "string" ? row.reason : "",
        createdAt: typeof row.createdAt === "string" ? row.createdAt : "",
      }));

    return {
      actionsToday,
      openEscalations,
      activeTimeouts,
      escalationItems,
    };
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "Failed to load admin moderation data."
    );

    return {
      actionsToday: 0,
      openEscalations: 0,
      activeTimeouts: 0,
      escalationItems: [],
    };
  }
}

export async function getAdminAuditLogs(): Promise<AdminAuditItem[]> {
  try {
    const { tablesDB } = await createAdminClient();

    const logsResult = await safeListRows<AuditLogRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.auditLogs,
      [Query.orderDesc("createdAt"), Query.limit(100)]
    );

    return logsResult.rows.map((log) => ({
      id: log.$id,
      actor: typeof log.actorName === "string" ? log.actorName : "Unknown actor",
      action: typeof log.action === "string" ? log.action : "unknown action",
      entity: typeof log.entity === "string" ? log.entity : "unknown entity",
      entityId: typeof log.entityId === "string" ? log.entityId : "n/a",
      createdAt: typeof log.createdAt === "string" ? log.createdAt : null,
    }));
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to load admin audit logs."
    );

    return [];
  }
}

export async function getStudentProfileStats(
  userId: string
): Promise<StudentProfileStats> {
  if (!userId) {
    return {
      currentStreakDays: 0,
      activeCourses: 0,
      certificates: 0,
    };
  }

  try {
    const { tablesDB } = await createAdminClient();

    const [enrollmentsResult, certificatesResult, progressResult] = await Promise.all([
      safeListRows<EnrollmentRow>(tablesDB, APPWRITE_CONFIG.tables.enrollments, [
        Query.equal("userId", [userId]),
        Query.equal("isActive", [true]),
        Query.limit(500),
      ]),
      safeListRows<AnyRow>(tablesDB, APPWRITE_CONFIG.tables.certificates, [
        Query.equal("userId", [userId]),
        Query.limit(500),
      ]),
      safeListRows<AnyRow>(tablesDB, APPWRITE_CONFIG.tables.progress, [
        Query.equal("userId", [userId]),
        Query.limit(2000),
      ]),
    ]);

    const completedDateKeys = new Set<string>();
    for (const row of progressResult.rows) {
      const key = toUtcDateKey(row.completedAt);
      if (key) {
        completedDateKeys.add(key);
      }
    }

    return {
      currentStreakDays: calculateCurrentStreak(completedDateKeys),
      activeCourses: enrollmentsResult.total,
      certificates: certificatesResult.total,
    };
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "Failed to load student profile stats."
    );

    return {
      currentStreakDays: 0,
      activeCourses: 0,
      certificates: 0,
    };
  }
}

// ── Student Enrolled Courses ──────────────────────────────────────────────

export type StudentEnrolledCourse = {
  id: string;
  title: string;
  slug: string;
  category: string;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  continueHref: string;
  continueLessonTitle: string;
  resumePercent: number;
  lastActivityAt: string | null;
};

export type StudentStudyQueueItem = {
  id: string;
  kind: "assignment" | "quiz";
  title: string;
  courseTitle: string;
  lessonTitle: string;
  href: string;
  status: string;
  detail: string;
  dueAt: string | null;
};

export async function getStudentEnrolledCourses(
  userId: string
): Promise<StudentEnrolledCourse[]> {
  if (!userId) return [];
  try {
    const { tablesDB } = await createAdminClient();

    const enrollmentsResult = await safeListRows<EnrollmentRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.enrollments,
      [Query.equal("userId", [userId]), Query.equal("isActive", [true]), Query.limit(100)]
    );

    if (enrollmentsResult.rows.length === 0) return [];

    const courseIds = enrollmentsResult.rows
      .map((e) => (typeof e.courseId === "string" ? e.courseId : ""))
      .filter(Boolean);

    const courses = await listRowsByFieldValues<CourseRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.courses,
      "$id",
      courseIds
    );

    const courseMap = new Map(courses.map((c) => [c.$id, c]));

    const categoriesResult = await safeListRows<AnyRow & Partial<Category>>(
      tablesDB,
      APPWRITE_CONFIG.tables.categories,
      [Query.limit(100)]
    );
    const categoryNameById = new Map<string, string>(
      categoriesResult.rows.map((cat) => [
        cat.$id,
        typeof cat.name === "string" ? cat.name : "General",
      ])
    );

    const progressResult = await safeListRows<AnyRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.progress,
      [Query.equal("userId", [userId]), Query.limit(2000)]
    );
    const lessonRows = await listRowsByFieldValues<LessonRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.lessons,
      "courseId",
      courseIds
    );

    const lessonsByCourse = new Map<string, LessonRow[]>();
    for (const lesson of lessonRows) {
      const courseId = typeof lesson.courseId === "string" ? lesson.courseId : "";
      if (!courseId) {
        continue;
      }

      const current = lessonsByCourse.get(courseId) ?? [];
      current.push(lesson);
      lessonsByCourse.set(courseId, current);
    }

    for (const [courseId, rows] of lessonsByCourse) {
      lessonsByCourse.set(
        courseId,
        [...rows].sort(
          (left, right) => Number(left.order ?? 0) - Number(right.order ?? 0)
        )
      );
    }

    const completedByCourse = new Map<string, number>();
    const progressByCourse = new Map<string, AnyRow[]>();
    for (const row of progressResult.rows) {
      const cid = typeof row.courseId === "string" ? row.courseId : "";
      const completedAt =
        typeof row.completedAt === "string" ? row.completedAt.trim() : "";
      if (!cid) {
        continue;
      }

      const courseRows = progressByCourse.get(cid) ?? [];
      courseRows.push(row);
      progressByCourse.set(cid, courseRows);

      if (completedAt) {
        completedByCourse.set(cid, (completedByCourse.get(cid) ?? 0) + 1);
      }
    }

    return courseIds
        .map((courseId) => {
          const course = courseMap.get(courseId);
          if (!course) return null;
          const courseLessonRows = lessonsByCourse.get(courseId) ?? [];
          const courseProgressRows = progressByCourse.get(courseId) ?? [];
          const totalLessons = Number(course.totalLessons ?? 0);
          const completedLessons = completedByCourse.get(courseId) ?? 0;
          const progressPercent =
            totalLessons > 0
              ? Math.min(100, Math.round((completedLessons / totalLessons) * 100))
              : 0;
          const completedLessonIds = new Set(
            courseProgressRows
              .filter((row) => {
                const completedAt =
                  typeof row.completedAt === "string" ? row.completedAt.trim() : "";
                return completedAt.length > 0;
              })
              .map((row) => String(row.lessonId ?? ""))
              .filter(Boolean)
          );
          const latestPartialRow = [...courseProgressRows]
            .filter((row) => {
              const completedAt =
                typeof row.completedAt === "string" ? row.completedAt.trim() : "";
              return completedAt.length === 0 && Number(row.percentComplete ?? 0) > 0;
            })
            .sort((left, right) => {
              const leftTime =
                toDate(left.$updatedAt ?? left.$createdAt)?.getTime() ?? 0;
              const rightTime =
                toDate(right.$updatedAt ?? right.$createdAt)?.getTime() ?? 0;
              if (leftTime !== rightTime) {
                return rightTime - leftTime;
              }

              return Number(right.percentComplete ?? 0) - Number(left.percentComplete ?? 0);
            })[0];
          const latestPartialLessonId = String(latestPartialRow?.lessonId ?? "");
          const latestPartialLesson = courseLessonRows.find(
            (lesson) => lesson.$id === latestPartialLessonId
          );
          const nextIncompleteLesson = courseLessonRows.find(
            (lesson) => !completedLessonIds.has(lesson.$id)
          );
          const continueLesson =
            progressPercent >= 100
              ? null
              : latestPartialLesson ?? nextIncompleteLesson ?? courseLessonRows[0] ?? null;
          const resumePercent =
            latestPartialLesson && continueLesson?.$id === latestPartialLesson.$id
              ? Math.max(
                  0,
                  Math.min(99, Math.round(Number(latestPartialRow?.percentComplete ?? 0)))
                )
              : 0;
          const latestActivityRow = [...courseProgressRows].sort((left, right) => {
            const leftTime =
              toDate(left.$updatedAt ?? left.completedAt ?? left.$createdAt)?.getTime() ?? 0;
            const rightTime =
              toDate(right.$updatedAt ?? right.completedAt ?? right.$createdAt)?.getTime() ?? 0;
            return rightTime - leftTime;
          })[0];
          const lastActivityAt =
            typeof latestActivityRow?.$updatedAt === "string"
              ? latestActivityRow.$updatedAt
              : typeof latestActivityRow?.completedAt === "string" && latestActivityRow.completedAt
                ? latestActivityRow.completedAt
                : typeof latestActivityRow?.$createdAt === "string"
                  ? latestActivityRow.$createdAt
                  : null;
          const slug = typeof course.slug === "string" ? course.slug : courseId;
          const continueHref =
            progressPercent >= 100
              ? `/app/courses/${slug}`
              : continueLesson
                ? `/app/learn/${courseId}/${continueLesson.$id}`
                : `/app/courses/${slug}`;

          return {
            id: courseId,
            title: typeof course.title === "string" ? course.title : "Untitled",
            slug,
            category:
              (typeof course.categoryId === "string" &&
                categoryNameById.get(course.categoryId)) ||
              "General",
            totalLessons,
            completedLessons,
            progressPercent,
            continueHref,
            continueLessonTitle:
              typeof continueLesson?.title === "string" ? continueLesson.title : "",
            resumePercent,
            lastActivityAt,
          };
        })
      .filter((c): c is StudentEnrolledCourse => c !== null)
      .sort((a, b) => {
        if (a.progressPercent >= 100 && b.progressPercent < 100) return 1;
        if (b.progressPercent >= 100 && a.progressPercent < 100) return -1;
        const aTime = toDate(a.lastActivityAt)?.getTime() ?? 0;
        const bTime = toDate(b.lastActivityAt)?.getTime() ?? 0;
        if (aTime !== bTime) {
          return bTime - aTime;
        }
        return b.progressPercent - a.progressPercent;
      });
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "Failed to load student enrolled courses."
    );

    return [];
  }
}

export async function getStudentStudyQueue(
  userId: string
): Promise<StudentStudyQueueItem[]> {
  if (!userId) {
    return [];
  }
  try {
    const { tablesDB } = await createAdminClient();
    const enrollmentsResult = await safeListRows<EnrollmentRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.enrollments,
      [
        Query.equal("userId", [userId]),
        Query.equal("isActive", [true]),
        Query.limit(100),
      ]
    );

    const courseIds = [
      ...new Set(
        enrollmentsResult.rows
          .map((row) =>
            typeof row.courseId === "string" ? row.courseId.trim() : ""
          )
          .filter(Boolean)
      ),
    ];

    if (courseIds.length === 0) {
      return [];
    }

    const [
      courseRows,
      lessonRows,
      assignmentRows,
      quizRows,
      submissionsResult,
      quizAttemptsResult,
    ] = await Promise.all([
      listRowsByFieldValues<CourseRow>(
        tablesDB,
        APPWRITE_CONFIG.tables.courses,
        "$id",
        courseIds
      ),
      listRowsByFieldValues<LessonRow>(
        tablesDB,
        APPWRITE_CONFIG.tables.lessons,
        "courseId",
        courseIds
      ),
      listRowsByFieldValues<AssignmentRow>(
        tablesDB,
        APPWRITE_CONFIG.tables.assignments,
        "courseId",
        courseIds
      ),
      listRowsByFieldValues<QuizRow>(
        tablesDB,
        APPWRITE_CONFIG.tables.quizzes,
        "courseId",
        courseIds
      ),
      safeListRows<SubmissionRow>(
        tablesDB,
        APPWRITE_CONFIG.tables.submissions,
        [Query.equal("userId", [userId]), Query.limit(2000)]
      ),
      safeListRows<QuizAttemptRow>(
        tablesDB,
        APPWRITE_CONFIG.tables.quizAttempts,
        [Query.equal("userId", [userId]), Query.limit(2000)]
      ),
    ]);

    const courseTitleById = new Map<string, string>(
      courseRows.map((course) => [
        course.$id,
        typeof course.title === "string" ? course.title : "Course",
      ])
    );

    const lessonMetaById = new Map<
      string,
      { title: string; order: number }
    >(
      lessonRows.map((lesson) => [
        lesson.$id,
        {
          title: typeof lesson.title === "string" ? lesson.title : "",
          order: Number(lesson.order ?? 0),
        },
      ])
    );

    const latestSubmissionByAssignmentId = new Map<string, SubmissionRow>();
    for (const submission of submissionsResult.rows) {
      const assignmentId =
        typeof submission.assignmentId === "string"
          ? submission.assignmentId.trim()
          : "";
      if (!assignmentId) {
        continue;
      }

      const previous = latestSubmissionByAssignmentId.get(assignmentId);
      const currentTime =
        toDate(submission.submittedAt ?? submission.$createdAt)?.getTime() ?? 0;
      const previousTime =
        toDate(previous?.submittedAt ?? previous?.$createdAt)?.getTime() ?? -1;

      if (!previous || currentTime >= previousTime) {
        latestSubmissionByAssignmentId.set(assignmentId, submission);
      }
    }

    const attemptsByQuizId = new Map<string, QuizAttemptRow[]>();
    for (const attempt of quizAttemptsResult.rows) {
      const quizId = typeof attempt.quizId === "string" ? attempt.quizId.trim() : "";
      if (!quizId) {
        continue;
      }

      const current = attemptsByQuizId.get(quizId) ?? [];
      current.push(attempt);
      attemptsByQuizId.set(quizId, current);
    }

    const now = Date.now();
    const threeDaysMs = 1000 * 60 * 60 * 24 * 3;

    const assignmentItems = assignmentRows
      .filter((assignment) => !latestSubmissionByAssignmentId.has(assignment.$id))
      .map((assignment) => {
        const dueAt =
          typeof assignment.dueDate === "string" && assignment.dueDate.trim().length > 0
            ? assignment.dueDate
            : null;
        const dueTime = toDate(dueAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const priority =
          dueTime < now
            ? 0
            : dueTime <= now + threeDaysMs
              ? 1
              : dueAt
                ? 3
                : 5;

        return {
          id: assignment.$id,
          kind: "assignment" as const,
          title: typeof assignment.title === "string" ? assignment.title : "Assignment",
          courseTitle:
            courseTitleById.get(
              typeof assignment.courseId === "string" ? assignment.courseId : ""
            ) ?? "Course",
          lessonTitle:
            lessonMetaById.get(
              typeof assignment.lessonId === "string" ? assignment.lessonId : ""
            )?.title ?? "",
          href: `/app/assignments#assignment-${assignment.$id}`,
          status:
            dueTime < now
              ? "Overdue"
              : dueTime <= now + threeDaysMs
                ? "Due soon"
                : "Pending",
          detail:
            typeof assignment.description === "string" && assignment.description.trim().length > 0
              ? assignment.description.trim()
              : "Upload your work to complete this assignment.",
          dueAt,
          sortPriority: priority,
          sortTime: dueTime,
          sortLabel:
            typeof assignment.title === "string" ? assignment.title : "Assignment",
        };
      });

    const quizItems = quizRows
      .map((quiz) => {
        const attempts = attemptsByQuizId.get(quiz.$id) ?? [];
        if (attempts.some((attempt) => Boolean(attempt.passed))) {
          return null;
        }

        const latestAttempt = [...attempts].sort((left, right) => {
          const leftTime = toDate(left.completedAt ?? left.$createdAt)?.getTime() ?? 0;
          const rightTime =
            toDate(right.completedAt ?? right.$createdAt)?.getTime() ?? 0;
          return rightTime - leftTime;
        })[0];
        const bestScore = attempts.reduce(
          (max, attempt) => Math.max(max, Number(attempt.score ?? 0)),
          0
        );
        const lessonMeta = lessonMetaById.get(
          typeof quiz.lessonId === "string" ? quiz.lessonId : ""
        );

        return {
          id: quiz.$id,
          kind: "quiz" as const,
          title: typeof quiz.title === "string" ? quiz.title : "Quiz",
          courseTitle:
            courseTitleById.get(
              typeof quiz.courseId === "string" ? quiz.courseId : ""
            ) ?? "Course",
          lessonTitle: lessonMeta?.title ?? "",
          href: `/app/quiz/${quiz.$id}`,
          status: latestAttempt ? "Retry" : "Ready",
          detail: latestAttempt
            ? `Best ${bestScore}% · Pass mark ${Number(quiz.passMark ?? 60)}%`
            : `Pass mark ${Number(quiz.passMark ?? 60)}%${lessonMeta?.title ? ` · ${lessonMeta.title}` : ""}`,
          dueAt: null,
          sortPriority: latestAttempt ? 2 : 4,
          sortTime: lessonMeta?.order ?? Number.MAX_SAFE_INTEGER,
          sortLabel: typeof quiz.title === "string" ? quiz.title : "Quiz",
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return [...assignmentItems, ...quizItems]
      .sort((left, right) => {
        if (left.sortPriority !== right.sortPriority) {
          return left.sortPriority - right.sortPriority;
        }
        if (left.sortTime !== right.sortTime) {
          return left.sortTime - right.sortTime;
        }
        if (left.courseTitle !== right.courseTitle) {
          return left.courseTitle.localeCompare(right.courseTitle);
        }
        return left.sortLabel.localeCompare(right.sortLabel);
      })
      .slice(0, 6)
      .map((item) => ({
        id: item.id,
        kind: item.kind,
        title: item.title,
        courseTitle: item.courseTitle,
        lessonTitle: item.lessonTitle,
        href: item.href,
        status: item.status,
        detail: item.detail,
        dueAt: item.dueAt,
      }));
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "Failed to load student study queue."
    );

    return [];
  }
}

// ── Upcoming Live Sessions (for students) ─────────────────────────────────

export type UpcomingSessionItem = {
  id: string;
  title: string;
  status: string;
  scheduledAt: string | null;
  streamUrl: string;
};

export type LiveRecordingItem = {
  id: string;
  title: string;
  scheduledAt: string | null;
  recordingUrl: string;
};

export async function getUpcomingLiveSessions(): Promise<UpcomingSessionItem[]> {
  const user = await requireAuth();

  try {
    const { tablesDB } = await createAdminClient();

    const result = await safeListRows<LiveSessionRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.liveSessions,
      [
        Query.equal("status", ["scheduled", "live"]),
        Query.orderAsc("scheduledAt"),
        Query.limit(50),
      ]
    );

    const accessByCourseId = new Map<string, boolean>();
    const visibleSessions: UpcomingSessionItem[] = [];

    for (const session of result.rows) {
      const courseId = typeof session.courseId === "string" ? session.courseId : "";
      if (!courseId) {
        continue;
      }

      let hasAccess = accessByCourseId.get(courseId);
      if (hasAccess === undefined) {
        hasAccess = await userHasCourseAccess({ courseId, userId: user.$id });
        accessByCourseId.set(courseId, hasAccess);
      }

      if (!hasAccess) {
        continue;
      }

      visibleSessions.push({
        id: session.$id,
        title: typeof session.title === "string" ? session.title : "Untitled session",
        status: typeof session.status === "string" ? session.status : "scheduled",
        scheduledAt: typeof session.scheduledAt === "string" ? session.scheduledAt : null,
        streamUrl: getSafeHttpUrl(session.streamId),
      });

      if (visibleSessions.length >= 10) {
        break;
      }
    }

    return visibleSessions;
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "Failed to load upcoming live sessions."
    );

    return [];
  }
}

export async function getRecentLiveRecordings(): Promise<LiveRecordingItem[]> {
  const user = await requireAuth();
  const { tablesDB } = await createAdminClient();

  const result = await safeListRows<LiveSessionRow>(
    tablesDB,
    APPWRITE_CONFIG.tables.liveSessions,
    [
      Query.equal("status", ["ended"]),
      Query.orderDesc("scheduledAt"),
      Query.limit(50),
    ]
  );

  const accessByCourseId = new Map<string, boolean>();
  const recordings: LiveRecordingItem[] = [];

  for (const session of result.rows) {
    const courseId = typeof session.courseId === "string" ? session.courseId : "";
    const recordingUrl = getSafeHttpUrl(session.recordingUrl);

    if (!courseId || !recordingUrl) {
      continue;
    }

    let hasAccess = accessByCourseId.get(courseId);
    if (hasAccess === undefined) {
      hasAccess = await userHasCourseAccess({ courseId, userId: user.$id });
      accessByCourseId.set(courseId, hasAccess);
    }

    if (!hasAccess) {
      continue;
    }

    recordings.push({
      id: session.$id,
      title: typeof session.title === "string" ? session.title : "Session recording",
      scheduledAt: typeof session.scheduledAt === "string" ? session.scheduledAt : null,
      recordingUrl,
    });

    if (recordings.length >= 10) {
      break;
    }
  }

  return recordings;
}

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC COURSE DATA (no auth required)
// ══════════════════════════════════════════════════════════════════════════════

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

export async function getPublicCourses(): Promise<PublicCourseCard[]> {
  const { tablesDB } = await createAdminClient();

  try {
    const result = await safeListRows<CourseRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.courses,
      [Query.equal("isPublished", [true]), Query.orderDesc("$createdAt"), Query.limit(100)]
    );

    return result.rows.map((c) => ({
      id: c.$id,
      title: typeof c.title === "string" ? c.title : "Untitled",
      slug: typeof c.slug === "string" ? c.slug : c.$id,
      shortDescription:
        typeof c.shortDescription === "string" ? c.shortDescription : "",
      accessModel: typeof c.accessModel === "string" ? c.accessModel : "free",
      price: Number(c.price ?? 0),
      thumbnailId:
        typeof c.thumbnailFileId === "string" && c.thumbnailFileId.length > 0
          ? c.thumbnailFileId
          : typeof c.thumbnailId === "string"
            ? c.thumbnailId
            : "",
      instructorName:
        typeof c.instructorName === "string" ? c.instructorName : "",
      totalLessons: Number(c.totalLessons ?? 0),
      totalDuration: Number(c.totalDuration ?? 0),
      enrolledCount: Number(c.enrolledCount ?? 0),
      categoryId: typeof c.categoryId === "string" ? c.categoryId : "",
    }));
  } catch {
    return [];
  }
}

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

export async function getPublicCourseBySlug(
  slugOrId: string
): Promise<PublicCourseDetail | null> {
  const { tablesDB } = await createAdminClient();

  // Try by ID first
  let course = await safeGetRow<CourseRow>(
    tablesDB,
    APPWRITE_CONFIG.tables.courses,
    slugOrId
  );

  // Try by slug
  if (!course) {
    const bySlug = await safeListRows<CourseRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.courses,
      [Query.equal("slug", [slugOrId]), Query.limit(1)]
    );
    course = bySlug.rows[0] ?? null;
  }

  if (!course || !course.isPublished) return null;

  // Fetch modules
  const modulesResult = await safeListRows(
    tablesDB,
    APPWRITE_CONFIG.tables.modules,
    [Query.equal("courseId", [course.$id]), Query.orderAsc("order"), Query.limit(100)]
  );

  const modules = [];
  for (const mod of modulesResult.rows) {
    const m = mod as AnyRow;
    const lessonsResult = await safeListRows(
      tablesDB,
      APPWRITE_CONFIG.tables.lessons,
      [Query.equal("moduleId", [m.$id]), Query.orderAsc("order"), Query.limit(100)]
    );

    modules.push({
      id: m.$id,
      title: typeof m.title === "string" ? m.title : "Untitled Module",
      order: Number(m.order ?? 0),
      lessons: lessonsResult.rows.map((l) => {
        const lesson = l as AnyRow;
        return {
          id: lesson.$id,
          title: typeof lesson.title === "string" ? lesson.title : "Untitled Lesson",
          order: Number(lesson.order ?? 0),
          duration: Number(lesson.duration ?? 0),
          isFree: Boolean(lesson.isFree),
          isFreePreview: Boolean(lesson.isFreePreview),
        };
      }),
    });
  }

  return {
    id: course.$id,
    title: typeof course.title === "string" ? course.title : "Untitled",
    slug: typeof course.slug === "string" ? course.slug : course.$id,
    shortDescription:
      typeof course.shortDescription === "string" ? course.shortDescription : "",
    accessModel: typeof course.accessModel === "string" ? course.accessModel : "free",
    price: Number(course.price ?? 0),
    thumbnailId:
      typeof course.thumbnailFileId === "string" && course.thumbnailFileId.length > 0
        ? course.thumbnailFileId
        : typeof course.thumbnailId === "string"
          ? course.thumbnailId
          : "",
    instructorId: typeof course.instructorId === "string" ? course.instructorId : "",
    instructorName:
      typeof course.instructorName === "string" ? course.instructorName : "",
    totalLessons: Number(course.totalLessons ?? 0),
    totalDuration: Number(course.totalDuration ?? 0),
    enrolledCount: Number(course.enrolledCount ?? 0),
    isPublished: Boolean(course.isPublished),
    modules,
  };
}
