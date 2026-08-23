import { Query } from "node-appwrite";
import { APPWRITE_CONFIG } from "../config";
import { createAdminClient } from "../server";
import {
  safeListAllRows, safeListRows, safeCountRows, safeGetRow, listRowsByFieldValues,
  getInstructorBaseQueries, buildInstructorCourseHealth, isActiveEnrollmentRow,
  toDate, getSafeHttpUrl, toStringArray, sortLiveSessionsForDashboard,
  isSubmissionReviewed, getSubmissionReviewedAt,
  REVIEW_OVERDUE_MS, RECENT_ENROLLMENT_MS, STUDENT_ATTENTION_MS,
  type AnyRow, type InstructorScope,
  type CourseRow, type EnrollmentRow, type ModuleRow, type LessonRow,
  type PaymentRow, type LiveSessionRow, type AssignmentRow, type SubmissionRow,
} from "./internal";
import type { InstructorCourseListItem } from "./internal";

export type {
  InstructorDashboardStats, InstructorCourseListItem, InstructorStudentItem,
  InstructorSubmissionQueueItem, InstructorLiveSessionItem,
  InstructorRevenueCourseItem, InstructorRevenueRecentPaymentItem,
  InstructorRevenueOverview, InstructorCourseSummary, InstructorCurriculumModule,
} from "./internal";

export async function getInstructorDashboardStats(scope: InstructorScope) {
  try {
    const { tablesDB } = await createAdminClient();
    const courseRows = await safeListAllRows<CourseRow>(
      tablesDB, APPWRITE_CONFIG.tables.courses, getInstructorBaseQueries(scope)
    );
    const courseIds = courseRows.map((c) => c.$id);
    const activeEnrollmentsRows = await listRowsByFieldValues<EnrollmentRow>(
      tablesDB, APPWRITE_CONFIG.tables.enrollments, "courseId", courseIds
    );
    const activeEnrollments = activeEnrollmentsRows.filter(isActiveEnrollmentRow).length;
    const liveSessionQueries: string[] = [Query.equal("status", ["scheduled", "live"])];
    if (scope.role !== "admin") liveSessionQueries.push(Query.equal("instructorId", [scope.userId]));
    const liveSessions = await safeCountRows(tablesDB, APPWRITE_CONFIG.tables.liveSessions, liveSessionQueries);
    const assignments = await listRowsByFieldValues<AnyRow>(tablesDB, APPWRITE_CONFIG.tables.assignments, "courseId", courseIds);
    const submissions = await listRowsByFieldValues<AnyRow>(tablesDB, APPWRITE_CONFIG.tables.submissions, "assignmentId", assignments.map((a) => a.$id));
    const pendingReviews = submissions.filter((r) => !isSubmissionReviewed(r)).length;
    return { courses: courseRows.length, activeEnrollments, liveSessions, pendingReviews };
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Failed to load instructor dashboard stats.");
    return { courses: 0, activeEnrollments: 0, liveSessions: 0, pendingReviews: 0 };
  }
}

export async function getInstructorCourseList(scope: InstructorScope): Promise<InstructorCourseListItem[]> {
  try {
    const { tablesDB } = await createAdminClient();
    const courseRows = await safeListAllRows<CourseRow>(tablesDB, APPWRITE_CONFIG.tables.courses, getInstructorBaseQueries(scope));
    const courseIds = courseRows.map((c) => c.$id);
    const [moduleRows, lessonRows, enrollmentRows] = await Promise.all([
      listRowsByFieldValues<ModuleRow>(tablesDB, APPWRITE_CONFIG.tables.modules, "courseId", courseIds),
      listRowsByFieldValues<LessonRow>(tablesDB, APPWRITE_CONFIG.tables.lessons, "courseId", courseIds),
      listRowsByFieldValues<EnrollmentRow>(tablesDB, APPWRITE_CONFIG.tables.enrollments, "courseId", courseIds),
    ]);
    const modulesByCourseId = new Map<string, ModuleRow[]>();
    for (const m of moduleRows) {
      const cid = typeof m.courseId === "string" ? m.courseId : "";
      if (!cid) continue;
      const current = modulesByCourseId.get(cid) ?? [];
      current.push(m);
      modulesByCourseId.set(cid, current);
    }
    const lessonsByCourseId = new Map<string, LessonRow[]>();
    for (const l of lessonRows) {
      const cid = typeof l.courseId === "string" ? l.courseId : "";
      if (!cid) continue;
      const current = lessonsByCourseId.get(cid) ?? [];
      current.push(l);
      lessonsByCourseId.set(cid, current);
    }
    const activeEnrollmentsByCourseId = new Map<string, number>();
    for (const e of enrollmentRows) {
      const cid = typeof e.courseId === "string" ? e.courseId : "";
      if (!cid || !isActiveEnrollmentRow(e)) continue;
      activeEnrollmentsByCourseId.set(cid, (activeEnrollmentsByCourseId.get(cid) ?? 0) + 1);
    }
    return courseRows.sort((a, b) => (toDate(b.$updatedAt ?? b.$createdAt)?.getTime() ?? 0) - (toDate(a.$updatedAt ?? a.$createdAt)?.getTime() ?? 0)).map((course) => {
      const health = buildInstructorCourseHealth({
        course, modules: modulesByCourseId.get(course.$id) ?? [],
        lessons: lessonsByCourseId.get(course.$id) ?? [],
        activeEnrollments: activeEnrollmentsByCourseId.get(course.$id) ?? 0,
      });
      return {
        id: course.$id, title: typeof course.title === "string" ? course.title : "Untitled course",
        shortDescription: typeof course.shortDescription === "string" ? course.shortDescription : "",
        status: course.isPublished ? "Published" : "Draft",
        accessModel: typeof course.accessModel === "string" ? course.accessModel : "free",
        price: Number(course.price ?? 0), totalLessons: health.totalLessons, totalDuration: health.totalDuration,
        moduleCount: health.moduleCount, activeEnrollments: health.activeEnrollments,
        hasThumbnail: health.hasThumbnail, previewLessonCount: health.previewLessonCount,
        lessonVideoCount: health.lessonVideoCount, missingVideoCount: health.missingVideoCount,
        publishBlockers: health.publishBlockers, attentionFlags: health.attentionFlags,
        readyToPublish: health.readyToPublish, needsAttention: health.needsAttention,
      };
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Failed to load instructor course list.");
    return [];
  }
}

export async function getInstructorStudents(scope: InstructorScope) {
  try {
    const { tablesDB, users } = await createAdminClient();
    const courseRows = await safeListAllRows<CourseRow>(tablesDB, APPWRITE_CONFIG.tables.courses, getInstructorBaseQueries(scope));
    const courseById = new Map(courseRows.map((c) => [c.$id, c]));
    const courseIds = [...courseById.keys()];
    if (courseIds.length === 0) return [];
    const enrollmentRows = await listRowsByFieldValues<EnrollmentRow>(tablesDB, APPWRITE_CONFIG.tables.enrollments, "courseId", courseIds);
    const activeEnrollmentRows = enrollmentRows.filter((r) => isActiveEnrollmentRow(r) && typeof r.userId === "string")
      .sort((a, b) => (toDate(b.enrolledAt)?.getTime() ?? 0) - (toDate(a.enrolledAt)?.getTime() ?? 0));
    if (activeEnrollmentRows.length === 0) return [];
    const uniqueUserIds = [...new Set(activeEnrollmentRows.map((r) => String(r.userId)))];
    const userMap = new Map<string, { name: string; email: string }>();
    await Promise.all(uniqueUserIds.map(async (userId) => {
      try {
        const user = await users.get({ userId });
        userMap.set(userId, { name: user.name || "Unknown user", email: user.email || "No email" });
      } catch { userMap.set(userId, { name: userId, email: "No email" }); }
    }));
    return activeEnrollmentRows.map((enrollment) => {
      const userId = String(enrollment.userId);
      const courseId = typeof enrollment.courseId === "string" ? enrollment.courseId : "";
      const course = courseById.get(courseId);
      const enrolledAt = typeof enrollment.enrolledAt === "string" && enrollment.enrolledAt.length > 0 ? enrollment.enrolledAt
        : typeof enrollment.$createdAt === "string" ? enrollment.$createdAt : null;
      const enrolledTime = toDate(enrolledAt)?.getTime() ?? Number.NaN;
      const rawProgress = Number(enrollment.progress ?? 0);
      const progressPercent = Number.isFinite(rawProgress) ? Math.min(100, Math.max(0, Math.round(rawProgress))) : 0;
      const user = userMap.get(userId) ?? { name: userId, email: "No email" };
      return {
        id: userId, name: user.name, email: user.email, courseId,
        courseTitle: typeof course?.title === "string" ? course.title : "Unknown course",
        progressPercent, enrolledAt,
        needsAttention: progressPercent < 25 && Number.isFinite(enrolledTime) && Date.now() - enrolledTime > STUDENT_ATTENTION_MS,
        isNearCompletion: progressPercent >= 80 && progressPercent < 100,
        isNewEnrollment: Number.isFinite(enrolledTime) && Date.now() - enrolledTime <= RECENT_ENROLLMENT_MS,
      };
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Failed to load instructor students.");
    return [];
  }
}

export async function getInstructorSubmissionQueue(scope: InstructorScope) {
  try {
    const { tablesDB, users } = await createAdminClient();
    const courseRows = await safeListAllRows<CourseRow>(tablesDB, APPWRITE_CONFIG.tables.courses, getInstructorBaseQueries(scope));
    const courseIds = courseRows.map((c) => c.$id);
    if (courseIds.length === 0) return [];
    const courseTitleById = new Map(courseRows.map((c) => [c.$id, typeof c.title === "string" ? c.title : "Course"]));
    const assignmentRows = await listRowsByFieldValues<AssignmentRow>(tablesDB, APPWRITE_CONFIG.tables.assignments, "courseId", courseIds);
    const assignmentById = new Map(assignmentRows.map((r) => [r.$id, { assignmentId: r.$id, assignmentTitle: typeof r.title === "string" ? r.title : "Assignment", courseId: typeof r.courseId === "string" ? r.courseId : "" }]));
    const assignmentIds = [...assignmentById.keys()];
    if (assignmentIds.length === 0) return [];
    const submissionRows = await listRowsByFieldValues<SubmissionRow>(tablesDB, APPWRITE_CONFIG.tables.submissions, "assignmentId", assignmentIds);
    const userIds = [...new Set(submissionRows.map((r) => (typeof r.userId === "string" ? r.userId.trim() : "")).filter(Boolean))];
    const userNameById = new Map<string, string>();
    await Promise.all(userIds.map(async (userId) => {
      try { const a = await users.get({ userId }); userNameById.set(userId, a.name || a.email || userId); }
      catch { userNameById.set(userId, "Student"); }
    }));
    return submissionRows.map((row) => {
      const assignment = assignmentById.get(row.assignmentId ?? "");
      if (!assignment) return null;
      const userId = typeof row.userId === "string" ? row.userId : "";
      const submittedAt = typeof row.submittedAt === "string" && row.submittedAt.length > 0 ? row.submittedAt : typeof row.$createdAt === "string" ? row.$createdAt : "";
      const grade = Number(row.grade ?? 0);
      const feedback = typeof row.feedback === "string" ? row.feedback : "";
      const submittedTime = toDate(submittedAt)?.getTime() ?? Number.NaN;
      const gradedAt = getSubmissionReviewedAt(row);
      const isGraded = gradedAt !== null;
      return {
        id: row.$id, assignmentId: assignment.assignmentId, assignmentTitle: assignment.assignmentTitle,
        courseId: assignment.courseId, courseTitle: courseTitleById.get(assignment.courseId) ?? "Course",
        userId, userName: userNameById.get(userId) ?? "Student",
        fileId: typeof row.fileId === "string" ? row.fileId : "", submittedAt, grade, feedback, isGraded, gradedAt,
        needsFeedback: isGraded && feedback.trim().length === 0,
        isOverdueReview: !isGraded && Number.isFinite(submittedTime) && Date.now() - submittedTime > REVIEW_OVERDUE_MS,
      };
    }).filter((item) => item !== null)
      .sort((a, b) => (toDate(b.submittedAt)?.getTime() ?? 0) - (toDate(a.submittedAt)?.getTime() ?? 0));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Failed to load instructor submission queue.");
    return [];
  }
}

export async function getInstructorRevenueOverview(scope: InstructorScope) {
  try {
    const { tablesDB } = await createAdminClient();
    const courses = await safeListAllRows<CourseRow>(tablesDB, APPWRITE_CONFIG.tables.courses, getInstructorBaseQueries(scope));
    const courseIds = courses.map((c) => c.$id);
    if (courseIds.length === 0) return { totalEarnings: 0, monthlyEarnings: 0, totalEnrollments: 0, paidCourseCount: 0, publishedPaidCourses: 0, courseEarnings: [], recentPayments: [], dormantPaidCourses: [] };
    const [payments, enrollments] = await Promise.all([
      listRowsByFieldValues<PaymentRow>(tablesDB, APPWRITE_CONFIG.tables.payments, "courseId", courseIds, [Query.equal("status", ["completed"])]),
      listRowsByFieldValues<EnrollmentRow>(tablesDB, APPWRITE_CONFIG.tables.enrollments, "courseId", courseIds),
    ]);
    const paymentMap = new Map<string, PaymentRow[]>();
    for (const p of payments) { const cid = typeof p.courseId === "string" ? p.courseId : ""; if (!cid) continue; const e = paymentMap.get(cid) ?? []; e.push(p); paymentMap.set(cid, e); }
    const enrollmentMap = new Map<string, EnrollmentRow[]>();
    for (const e of enrollments) { const cid = typeof e.courseId === "string" ? e.courseId : ""; if (!cid) continue; const existing = enrollmentMap.get(cid) ?? []; existing.push(e); enrollmentMap.set(cid, existing); }
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    let totalEarnings = 0, monthlyEarnings = 0, totalEnrollments = 0;
    const courseEarnings = courses.map((course) => {
      const payments = paymentMap.get(course.$id) ?? [];
      const enrollments = enrollmentMap.get(course.$id) ?? [];
      const totalRevenue = payments.reduce((s, p) => s + Number(p.amount ?? 0) / 100, 0);
      const monthlyRevenue = payments.reduce((s, p) => { const d = toDate(p.createdAt ?? p.$createdAt); return d && d >= monthStart ? s + Number(p.amount ?? 0) / 100 : s; }, 0);
      const lastPaymentAt = [...payments].map((p) => typeof p.createdAt === "string" && p.createdAt.length > 0 ? p.createdAt : typeof p.$createdAt === "string" ? p.$createdAt : null)
        .filter((v): v is string => Boolean(v)).sort((a, b) => (toDate(b)?.getTime() ?? 0) - (toDate(a)?.getTime() ?? 0))[0] ?? null;
      totalEarnings += totalRevenue; monthlyEarnings += monthlyRevenue; totalEnrollments += enrollments.length;
      return { id: course.$id, title: typeof course.title === "string" ? course.title : "Untitled", accessModel: typeof course.accessModel === "string" ? course.accessModel : "free", isPublished: Boolean(course.isPublished), enrollments: enrollments.length, totalRevenue, monthlyRevenue, lastPaymentAt };
    }).sort((a, b) => { if (b.monthlyRevenue !== a.monthlyRevenue) return b.monthlyRevenue - a.monthlyRevenue; if (b.totalRevenue !== a.totalRevenue) return b.totalRevenue - a.totalRevenue; return b.enrollments - a.enrollments; });
    const recentPayments = [...paymentMap.entries()].flatMap(([courseId, payments]) => payments.map((p) => ({ id: p.$id, courseId, courseTitle: courseEarnings.find((c) => c.id === courseId)?.title ?? "Course", amount: Number(p.amount ?? 0) / 100, paidAt: typeof p.createdAt === "string" && p.createdAt.length > 0 ? p.createdAt : typeof p.$createdAt === "string" ? p.$createdAt : null })))
      .sort((a, b) => (toDate(b.paidAt)?.getTime() ?? 0) - (toDate(a.paidAt)?.getTime() ?? 0)).slice(0, 6);
    const dormantPaidCourses = courseEarnings.filter((c) => c.accessModel === "paid" && c.isPublished && c.monthlyRevenue <= 0);
    return { totalEarnings, monthlyEarnings, totalEnrollments, paidCourseCount: courseEarnings.filter((c) => c.accessModel === "paid").length, publishedPaidCourses: courseEarnings.filter((c) => c.accessModel === "paid" && c.isPublished).length, courseEarnings, recentPayments, dormantPaidCourses };
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Failed to load instructor revenue overview.");
    return { totalEarnings: 0, monthlyEarnings: 0, totalEnrollments: 0, paidCourseCount: 0, publishedPaidCourses: 0, courseEarnings: [], recentPayments: [], dormantPaidCourses: [] };
  }
}

export async function getInstructorLiveSessions(scope: InstructorScope) {
  try {
    const { tablesDB } = await createAdminClient();
    const queries: string[] = [];
    if (scope.role !== "admin") queries.push(Query.equal("instructorId", [scope.userId]));
    const sessions = await safeListAllRows<LiveSessionRow>(tablesDB, APPWRITE_CONFIG.tables.liveSessions, queries);
    const sessionIds = sessions.map((s) => s.$id);
    const rsvpRows = await listRowsByFieldValues<AnyRow>(tablesDB, APPWRITE_CONFIG.tables.sessionRsvps, "sessionId", sessionIds);
    const rsvpCountBySessionId = new Map<string, number>();
    for (const row of rsvpRows) { const sid = typeof row.sessionId === "string" ? row.sessionId : ""; if (sid) rsvpCountBySessionId.set(sid, (rsvpCountBySessionId.get(sid) ?? 0) + 1); }
    return sortLiveSessionsForDashboard(sessions).map((session) => ({
      id: session.$id, title: typeof session.title === "string" ? session.title : "Untitled session",
      description: typeof session.description === "string" ? session.description : "",
      status: typeof session.status === "string" ? session.status : "scheduled",
      scheduledAt: typeof session.scheduledAt === "string" ? session.scheduledAt : null,
      streamUrl: getSafeHttpUrl(session.streamId), recordingUrl: getSafeHttpUrl(session.recordingUrl),
      rsvpCount: rsvpCountBySessionId.get(session.$id) ?? 0,
    }));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Failed to load instructor live sessions.");
    return [];
  }
}

export async function getInstructorCourseSummary(scope: InstructorScope, identifier: string) {
  try {
    const { tablesDB } = await createAdminClient();
    const byId = await safeGetRow<CourseRow>(tablesDB, APPWRITE_CONFIG.tables.courses, identifier);
    const isAllowedById = byId && (scope.role === "admin" || byId.instructorId === scope.userId);
    let course = isAllowedById ? byId : null;
    if (!course) {
      const slugQueries: string[] = [Query.equal("slug", [identifier]), Query.limit(1)];
      if (scope.role !== "admin") slugQueries.push(Query.equal("instructorId", [scope.userId]));
      course = (await safeListRows<CourseRow>(tablesDB, APPWRITE_CONFIG.tables.courses, slugQueries)).rows[0] ?? null;
    }
    if (!course) return null;
    const [moduleRows, lessonRows, enrollmentRows] = await Promise.all([
      safeListAllRows<ModuleRow>(tablesDB, APPWRITE_CONFIG.tables.modules, [Query.equal("courseId", [course.$id])]),
      safeListAllRows<LessonRow>(tablesDB, APPWRITE_CONFIG.tables.lessons, [Query.equal("courseId", [course.$id])]),
      safeListAllRows<EnrollmentRow>(tablesDB, APPWRITE_CONFIG.tables.enrollments, [Query.equal("courseId", [course.$id])]),
    ]);
    const health = buildInstructorCourseHealth({ course, modules: moduleRows, lessons: lessonRows, activeEnrollments: enrollmentRows.filter(isActiveEnrollmentRow).length });
    return {
      id: course.$id, title: typeof course.title === "string" ? course.title : "Untitled course",
      slug: typeof course.slug === "string" ? course.slug : course.$id,
      shortDescription: typeof course.shortDescription === "string" ? course.shortDescription : "",
      whatYouLearn: toStringArray(course.whatYouLearn), requirements: toStringArray(course.requirements),
      accessModel: typeof course.accessModel === "string" ? course.accessModel : "free",
      isPublished: Boolean(course.isPublished), price: Number(course.price ?? 0),
      totalLessons: health.totalLessons, totalDuration: health.totalDuration,
      thumbnailId: health.thumbnailId, moduleCount: health.moduleCount,
      activeEnrollments: health.activeEnrollments, hasThumbnail: health.hasThumbnail,
      previewLessonCount: health.previewLessonCount, lessonVideoCount: health.lessonVideoCount,
      missingVideoCount: health.missingVideoCount, publishBlockers: health.publishBlockers,
      attentionFlags: health.attentionFlags, readyToPublish: health.readyToPublish,
      needsAttention: health.needsAttention,
    };
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Failed to load instructor course summary.");
    return null;
  }
}

export async function getInstructorCurriculum(courseId: string) {
  try {
    const { tablesDB } = await createAdminClient();
    const moduleRows = await safeListAllRows<ModuleRow>(tablesDB, APPWRITE_CONFIG.tables.modules, [Query.equal("courseId", [courseId]), Query.orderAsc("order")]);
    const lessonRows = await safeListAllRows<LessonRow>(tablesDB, APPWRITE_CONFIG.tables.lessons, [Query.equal("courseId", [courseId]), Query.orderAsc("order")]);
    const lessonsByModule = new Map<string, LessonRow[]>();
    for (const lesson of lessonRows) { if (typeof lesson.moduleId !== "string") continue; const current = lessonsByModule.get(lesson.moduleId) ?? []; current.push(lesson); lessonsByModule.set(lesson.moduleId, current); }
    return moduleRows.map((module) => ({
      id: module.$id, title: typeof module.title === "string" ? module.title : "Untitled module",
      description: typeof module.description === "string" ? module.description : "", order: Number(module.order ?? 0),
      lessons: (lessonsByModule.get(module.$id) ?? []).map((lesson) => ({
        id: lesson.$id, title: typeof lesson.title === "string" ? lesson.title : "Untitled lesson",
        description: typeof lesson.description === "string" ? lesson.description : "",
        order: Number(lesson.order ?? 0), duration: Number(lesson.duration ?? 0),
        isFree: Boolean(lesson.isFree), isFreePreview: Boolean(lesson.isFreePreview),
        videoFileId: typeof lesson.videoFileId === "string" ? lesson.videoFileId : "",
      })),
    }));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Failed to load instructor curriculum.");
    return [];
  }
}
