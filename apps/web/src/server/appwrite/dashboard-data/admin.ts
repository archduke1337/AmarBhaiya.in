import { Query } from "node-appwrite";
import type { Models } from "node-appwrite";
import { APPWRITE_CONFIG } from "../config";
import { createAdminClient } from "../server";
import {
  safeListAllRows, safeListRows, safeCountRows, listRowsByFieldValues,
  toDate, getSafeHttpUrl, resolveRoleFromLabels, isActiveEnrollmentRow,
  isToday, buildRsvpCountBySessionId, sortLiveSessionsForDashboard,
  type AnyRow,
  type CourseRow, type EnrollmentRow, type PaymentRow, type LiveSessionRow,
  type ModerationActionRow, type AuditLogRow,
} from "./internal";

export type {
  AdminDashboardStats, AdminUserItem, AdminCategoryItem,
  AdminPaymentItem, AdminLiveData, ModerationActionItem, AdminModerationData, AdminAuditItem,
  InstructorLiveSessionItem,
} from "./internal";

export async function getAdminDashboardStats() {
  try {
    const { tablesDB, users } = await createAdminClient();
    const [usersTotal, enrollmentRows, completedPaymentRows, liveSessions, courseRows] = await Promise.all([
      users.list({ queries: [Query.limit(1)] }).then((r) => r.total).catch(() => 0),
      safeListAllRows<EnrollmentRow>(tablesDB, APPWRITE_CONFIG.tables.enrollments),
      safeListAllRows<PaymentRow>(tablesDB, APPWRITE_CONFIG.tables.payments, [Query.equal("status", ["completed"])]),
      safeCountRows(tablesDB, APPWRITE_CONFIG.tables.liveSessions, [Query.equal("status", ["scheduled", "live"])]),
      safeListAllRows<CourseRow>(tablesDB, APPWRITE_CONFIG.tables.courses),
    ]);
    const activeEnrollments = enrollmentRows.filter(isActiveEnrollmentRow).length;
    const completedEnrollments = enrollmentRows.filter((r) => Number((r as AnyRow).progress ?? 0) >= 100).length;
    const completionRate = enrollmentRows.length > 0 ? Math.round((completedEnrollments / enrollmentRows.length) * 100) : 0;
    const totalCourses = courseRows.length;
    const publishedCourses = courseRows.filter((r) => Boolean((r as AnyRow).isPublished)).length;
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
    const monthlyRevenue = completedPaymentRows.filter((p) => { const d = toDate(p.createdAt); return d ? d >= startOfMonth : false; }).reduce((s, p) => s + Number(p.amount ?? 0), 0) / 100;
    const totalRevenue = completedPaymentRows.reduce((s, p) => s + Number(p.amount ?? 0), 0) / 100;
    return { totalUsers: usersTotal, activeEnrollments, monthlyRevenue, totalRevenue, liveSessions, totalCourses, publishedCourses, completionRate };
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Failed to load admin dashboard stats.");
    return { totalUsers: 0, activeEnrollments: 0, monthlyRevenue: 0, totalRevenue: 0, liveSessions: 0, totalCourses: 0, publishedCourses: 0, completionRate: 0 };
  }
}

export async function getAdminUsers() {
  const { users } = await createAdminClient();
  try {
    const allUsers: Models.User<Models.Preferences>[] = [];
    const pageSize = 100;
    let offset = 0;
    while (true) {
      const page = await users.list({ queries: [Query.orderDesc("registration"), Query.limit(pageSize), Query.offset(offset)] });
      allUsers.push(...page.users);
      if (page.users.length < pageSize) break;
      offset += page.users.length;
    }
    return allUsers.map((user) => ({ id: user.$id, name: user.name || user.$id, role: resolveRoleFromLabels(user.labels), status: user.status ? "active" : "blocked", email: user.email || "No email" }));
  } catch { return []; }
}

export type AdminCourseItem = {
  id: string;
  title: string;
  slug: string;
  state: string;
  featured: string;
  category: string;
  price: number;
  instructorName: string;
  instructorId: string;
  enrollmentCount: number;
  totalLessons: number;
  isPublished: boolean;
  isFeatured: boolean;
};

export async function getAdminCourses(): Promise<AdminCourseItem[]> {
  const { tablesDB, users } = await createAdminClient();
  const [coursesResult, categoriesResult, enrollmentsResult] = await Promise.all([
    safeListAllRows<CourseRow>(tablesDB, APPWRITE_CONFIG.tables.courses),
    safeListAllRows<AnyRow & { name?: string }>(tablesDB, APPWRITE_CONFIG.tables.categories, [Query.orderAsc("order")]),
    safeListAllRows<EnrollmentRow>(tablesDB, APPWRITE_CONFIG.tables.enrollments),
  ]);
  const categoryNameById = new Map<string, string>(categoriesResult.map((c) => [c.$id, typeof c.name === "string" ? c.name : "Uncategorized"]));

  // Count active enrollments per course
  const enrollmentCountByCourse = new Map<string, number>();
  for (const e of enrollmentsResult) {
    const row = e as AnyRow;
    const cid = String(row.courseId ?? "");
    if (cid && isActiveEnrollmentRow(e)) {
      enrollmentCountByCourse.set(cid, (enrollmentCountByCourse.get(cid) ?? 0) + 1);
    }
  }

  // Resolve instructor names
  const rawIds = coursesResult.map((c) => String((c as AnyRow).instructorId ?? ""));
  const instructorIds = [...new Set(rawIds.filter((id) => id.length > 0))];
  const instructorNameMap = new Map<string, string>();
  await Promise.all(instructorIds.map(async (id: string) => {
    try { const u = await users.get({ userId: id }); instructorNameMap.set(id, u.name || id); } catch { instructorNameMap.set(id, id); }
  }));

  return coursesResult.map((course) => {
    const row = course as AnyRow;
    const instructorId = String(row.instructorId ?? "");
    return {
      id: course.$id,
      title: typeof course.title === "string" ? course.title : "Untitled course",
      slug: String(row.slug ?? ""),
      state: course.isPublished ? "published" : "draft",
      featured: course.isFeatured ? "yes" : "no",
      category: (typeof course.categoryId === "string" && categoryNameById.get(course.categoryId)) || "Uncategorized",
      price: Number(row.price ?? 0),
      instructorName: instructorNameMap.get(instructorId) || "Unknown",
      instructorId,
      enrollmentCount: enrollmentCountByCourse.get(course.$id) ?? Number(row.enrollmentCount ?? row.enrolledCount ?? 0),
      totalLessons: Number(row.totalLessons ?? 0),
      isPublished: Boolean(course.isPublished),
      isFeatured: Boolean(course.isFeatured),
    };
  });
}

export async function getAdminCategories() {
  try {
    const { tablesDB } = await createAdminClient();
    const categoriesResult = await safeListAllRows<AnyRow & { name?: string; slug?: string; description?: string }>(tablesDB, APPWRITE_CONFIG.tables.categories, [Query.orderAsc("order")]);
    return categoriesResult.map((c) => ({ id: c.$id, name: typeof c.name === "string" ? c.name : "Unnamed", slug: typeof c.slug === "string" ? c.slug : "", description: typeof c.description === "string" ? c.description : "", order: Number(c.order ?? 0) }));
  } catch (error) { console.error(error instanceof Error ? error.message : "Failed to load admin categories."); return []; }
}

export async function getAdminPayments(options?: { limit?: number }) {
  try {
    const { tablesDB, users } = await createAdminClient();
    const limit = options?.limit;
    const paymentRows = typeof limit === "number" && limit > 0
      ? (await safeListRows<PaymentRow>(tablesDB, APPWRITE_CONFIG.tables.payments, [Query.orderDesc("$createdAt"), Query.limit(limit)])).rows
      : await safeListAllRows<PaymentRow>(tablesDB, APPWRITE_CONFIG.tables.payments, [Query.orderDesc("$createdAt")]);
    const sortedPaymentRows = paymentRows.sort((a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0));
    const courseIds = [...new Set(sortedPaymentRows.map((p) => p.courseId).filter((v): v is string => typeof v === "string"))];
    const userIds = [...new Set(sortedPaymentRows.map((p) => p.userId).filter((v): v is string => typeof v === "string"))];
    const courseMap = new Map<string, string>();
    const courseSlugMap = new Map<string, string>();
    const courseRows = await listRowsByFieldValues<CourseRow>(tablesDB, APPWRITE_CONFIG.tables.courses, "$id", courseIds);
    for (const row of courseRows) { courseMap.set(row.$id, typeof row.title === "string" ? row.title : row.$id); courseSlugMap.set(row.$id, typeof row.slug === "string" ? row.slug : row.$id); }
    for (const courseId of courseIds) { if (!courseMap.has(courseId)) courseMap.set(courseId, courseId); if (!courseSlugMap.has(courseId)) courseSlugMap.set(courseId, courseId); }
    const userMap = new Map<string, string>();
    await Promise.all(userIds.map(async (userId) => { try { const u = await users.get({ userId }); userMap.set(userId, u.name || userId); } catch { userMap.set(userId, userId); } }));
    return sortedPaymentRows.map((payment) => ({
      id: payment.$id, userId: typeof payment.userId === "string" ? payment.userId : "",
      providerRef: typeof payment.providerRef === "string" ? payment.providerRef : payment.$id,
      method: typeof payment.method === "string" ? payment.method : "unknown",
      amount: Number(payment.amount ?? 0) / 100, currency: typeof payment.currency === "string" ? payment.currency : "INR",
      status: typeof payment.status === "string" ? payment.status : "pending",
      courseId: typeof payment.courseId === "string" ? payment.courseId : "",
      courseSlug: typeof payment.courseId === "string" ? courseSlugMap.get(payment.courseId) || payment.courseId : "",
      userName: (typeof payment.userId === "string" && userMap.get(payment.userId)) || "Unknown user",
      courseTitle: (typeof payment.courseId === "string" && courseMap.get(payment.courseId)) || "Unknown course",
      createdAt: typeof payment.createdAt === "string" ? payment.createdAt : null,
    }));
  } catch (error) { console.error(error instanceof Error ? error.message : "Failed to load admin payments."); return []; }
}

export async function getAdminLiveData(options?: { upcomingLimit?: number }) {
  try {
    const { tablesDB } = await createAdminClient();
    const sessions = await safeListAllRows<LiveSessionRow>(tablesDB, APPWRITE_CONFIG.tables.liveSessions, [Query.orderAsc("scheduledAt")]);
    const rsvpRows = await listRowsByFieldValues<AnyRow>(tablesDB, APPWRITE_CONFIG.tables.sessionRsvps, "sessionId", sessions.map((s) => s.$id));
    const rsvpCountBySessionId = buildRsvpCountBySessionId(rsvpRows);
    const activeSessions = sessions.filter((s) => s.status === "live").length;
    const scheduledSessions = sessions.filter((s) => s.status === "scheduled").length;
    const recordingFailures = sessions.filter((s) => s.status === "ended" && (!s.recordingUrl || String(s.recordingUrl).trim().length === 0)).length;
    const upcomingLimit = options?.upcomingLimit;
    const upcoming = sortLiveSessionsForDashboard(sessions)
      .filter((s) => s.status === "scheduled" || s.status === "live")
      .slice(0, typeof upcomingLimit === "number" && upcomingLimit > 0 ? upcomingLimit : Number.MAX_SAFE_INTEGER)
      .map((session) => ({
        id: session.$id, title: typeof session.title === "string" ? session.title : "Untitled session",
        description: typeof session.description === "string" ? session.description : "",
        status: typeof session.status === "string" ? session.status : "scheduled",
        scheduledAt: typeof session.scheduledAt === "string" ? session.scheduledAt : null,
        streamUrl: getSafeHttpUrl(session.streamId), recordingUrl: getSafeHttpUrl(session.recordingUrl),
        rsvpCount: rsvpCountBySessionId.get(session.$id) ?? 0,
      }));
    return { activeSessions, scheduledSessions, recordingFailures, upcoming };
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Failed to load admin live data.");
    return { activeSessions: 0, scheduledSessions: 0, recordingFailures: 0, upcoming: [] };
  }
}

export async function getAdminModerationData(options?: { escalationLimit?: number }) {
  try {
    const { tablesDB } = await createAdminClient();
    const rows = await safeListAllRows<ModerationActionRow>(tablesDB, APPWRITE_CONFIG.tables.moderationActions, [Query.orderDesc("$createdAt")]);
    const actionsToday = rows.filter((r) => isToday(r.createdAt)).length;
    const openEscalations = rows.filter((r) => r.action === "flag" && !r.revertedAt).length;
    const activeTimeouts = new Set(rows.filter((r) => r.action === "timeout" && !r.revertedAt && typeof r.targetUserId === "string").map((r) => String(r.targetUserId))).size;
    const escalationLimit = options?.escalationLimit;
    const escalationItems = rows.filter((r) => r.action === "flag" && !r.revertedAt)
      .sort((a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0))
      .slice(0, typeof escalationLimit === "number" && escalationLimit > 0 ? escalationLimit : Number.MAX_SAFE_INTEGER)
      .map((row) => ({ id: row.$id, moderatorName: typeof row.moderatorName === "string" ? row.moderatorName : "Unknown", targetUserName: typeof row.targetUserName === "string" ? row.targetUserName : "Unknown", action: typeof row.action === "string" ? row.action : "flag", scope: typeof row.scope === "string" ? row.scope : "platform", reason: typeof row.reason === "string" ? row.reason : "", createdAt: typeof row.createdAt === "string" ? row.createdAt : "" }));
    return { actionsToday, openEscalations, activeTimeouts, escalationItems };
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Failed to load admin moderation data.");
    return { actionsToday: 0, openEscalations: 0, activeTimeouts: 0, escalationItems: [] };
  }
}

export async function getAdminAuditLogs(options?: { limit?: number }) {
  try {
    const { tablesDB } = await createAdminClient();
    const limit = options?.limit;
    const logsResult = typeof limit === "number" && limit > 0
      ? (await safeListRows<AuditLogRow>(tablesDB, APPWRITE_CONFIG.tables.auditLogs, [Query.orderDesc("$createdAt"), Query.limit(limit)])).rows
      : await safeListAllRows<AuditLogRow>(tablesDB, APPWRITE_CONFIG.tables.auditLogs, [Query.orderDesc("$createdAt")]);
    return logsResult.map((log) => ({ id: log.$id, actor: typeof log.actorName === "string" ? log.actorName : "Unknown actor", action: typeof log.action === "string" ? log.action : "unknown action", entity: typeof log.entity === "string" ? log.entity : "unknown entity", entityId: typeof log.entityId === "string" ? log.entityId : "n/a", createdAt: typeof log.createdAt === "string" ? log.createdAt : null }));
  } catch (error) { console.error(error instanceof Error ? error.message : "Failed to load admin audit logs."); return []; }
}
