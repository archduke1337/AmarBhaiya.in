import { Query } from "node-appwrite";
import type { Models } from "node-appwrite";

import { requireAuth } from "@/lib/appwrite/auth";
import { userHasCourseAccess } from "@/lib/appwrite/access";
import type { Role } from "@/lib/utils/constants";
import type {
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
};

export type InstructorStudentItem = {
  id: string;
  name: string;
  email: string;
  courseTitle: string;
  progressPercent: number;
};

export type InstructorLiveSessionItem = {
  id: string;
  title: string;
  status: string;
  scheduledAt: string | null;
  rsvpCount: number;
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
  accessModel: string;
  isPublished: boolean;
  price: number;
  totalLessons: number;
  totalDuration: number;
  thumbnailId: string;
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
}

export async function getInstructorCourseList(
  scope: InstructorScope
): Promise<InstructorCourseListItem[]> {
  const { tablesDB } = await createAdminClient();
  const coursesResult = await safeListRows<CourseRow>(
    tablesDB,
    APPWRITE_CONFIG.tables.courses,
    getInstructorQueries(scope)
  );

  return coursesResult.rows
    .sort((left, right) => {
      const leftDate = toDate(left.$updatedAt ?? left.$createdAt)?.getTime() ?? 0;
      const rightDate = toDate(right.$updatedAt ?? right.$createdAt)?.getTime() ?? 0;
      return rightDate - leftDate;
    })
    .map((course) => ({
      id: course.$id,
      title: typeof course.title === "string" ? course.title : "Untitled course",
      shortDescription:
        typeof course.shortDescription === "string" ? course.shortDescription : "",
      status: course.isPublished ? "Published" : "Draft",
    }));
}

export async function getInstructorStudents(
  scope: InstructorScope
): Promise<InstructorStudentItem[]> {
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
    })
    .slice(0, 40);

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

    const rawProgress = Number(enrollment.progress ?? 0);
    const progressPercent = Number.isFinite(rawProgress)
      ? Math.min(100, Math.max(0, Math.round(rawProgress)))
      : 0;

    const user = userMap.get(userId) ?? { name: userId, email: "No email" };

    return {
      id: userId,
      name: user.name,
      email: user.email,
      courseTitle:
        typeof course?.title === "string" ? course.title : "Unknown course",
      progressPercent,
    };
  });
}

export async function getInstructorLiveSessions(
  scope: InstructorScope
): Promise<InstructorLiveSessionItem[]> {
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
    status: typeof session.status === "string" ? session.status : "scheduled",
    scheduledAt:
      typeof session.scheduledAt === "string" ? session.scheduledAt : null,
    rsvpCount: rsvpCountBySessionId.get(session.$id) ?? 0,
  }));
}

export async function getInstructorCourseSummary(
  scope: InstructorScope,
  identifier: string
): Promise<InstructorCourseSummary | null> {
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

  return {
    id: course.$id,
    title: typeof course.title === "string" ? course.title : "Untitled course",
    slug: typeof course.slug === "string" ? course.slug : course.$id,
    shortDescription:
      typeof course.shortDescription === "string" ? course.shortDescription : "",
    accessModel:
      typeof course.accessModel === "string" ? course.accessModel : "free",
    isPublished: Boolean(course.isPublished),
    price: Number(course.price ?? 0),
    totalLessons: Number(course.totalLessons ?? 0),
    totalDuration: Number(course.totalDuration ?? 0),
    thumbnailId:
      typeof course.thumbnailFileId === "string" && course.thumbnailFileId.length > 0
        ? course.thumbnailFileId
        : typeof course.thumbnailId === "string"
          ? course.thumbnailId
          : "",
  };
}

export async function getInstructorCurriculum(
  courseId: string
): Promise<InstructorCurriculumModule[]> {
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
}

export async function getModeratorDashboardStats(): Promise<ModeratorDashboardStats> {
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
}

export async function getModeratorReports(): Promise<ModeratorReportItem[]> {
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
    }));
}

export async function getModeratorStudents(): Promise<ModeratorStudentItem[]> {
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
}

export async function getModeratorCommunityData(): Promise<ModeratorCommunityData> {
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
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
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
}

export async function getAdminPayments(): Promise<AdminPaymentItem[]> {
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
  }));
}

export async function getAdminLiveData(): Promise<AdminLiveData> {
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
      status: typeof session.status === "string" ? session.status : "scheduled",
      scheduledAt:
        typeof session.scheduledAt === "string" ? session.scheduledAt : null,
      rsvpCount: 0,
    }));

  return {
    activeSessions,
    scheduledSessions,
    recordingFailures,
    upcoming,
  };
}

export async function getAdminModerationData(): Promise<AdminModerationData> {
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
}

export async function getAdminAuditLogs(): Promise<AdminAuditItem[]> {
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
};

export async function getStudentEnrolledCourses(
  userId: string
): Promise<StudentEnrolledCourse[]> {
  if (!userId) return [];

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

  const completedByCourse = new Map<string, number>();
  for (const row of progressResult.rows) {
    const cid = typeof row.courseId === "string" ? row.courseId : "";
    if (cid) {
      completedByCourse.set(cid, (completedByCourse.get(cid) ?? 0) + 1);
    }
  }

  return courseIds
    .map((courseId) => {
      const course = courseMap.get(courseId);
      if (!course) return null;
      const totalLessons = Number(course.totalLessons ?? 0);
      const completedLessons = completedByCourse.get(courseId) ?? 0;
      const progressPercent =
        totalLessons > 0
          ? Math.min(100, Math.round((completedLessons / totalLessons) * 100))
          : 0;

      return {
        id: courseId,
        title: typeof course.title === "string" ? course.title : "Untitled",
        slug: typeof course.slug === "string" ? course.slug : courseId,
        category:
          (typeof course.categoryId === "string" &&
            categoryNameById.get(course.categoryId)) ||
          "General",
        totalLessons,
        completedLessons,
        progressPercent,
      };
    })
    .filter((c): c is StudentEnrolledCourse => c !== null)
    .sort((a, b) => {
      if (a.progressPercent >= 100 && b.progressPercent < 100) return 1;
      if (b.progressPercent >= 100 && a.progressPercent < 100) return -1;
      return b.progressPercent - a.progressPercent;
    });
}

// ── Upcoming Live Sessions (for students) ─────────────────────────────────

export type UpcomingSessionItem = {
  id: string;
  title: string;
  status: string;
  scheduledAt: string | null;
};

export async function getUpcomingLiveSessions(): Promise<UpcomingSessionItem[]> {
  const user = await requireAuth();
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
    });

    if (visibleSessions.length >= 10) {
      break;
    }
  }

  return visibleSessions;
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
