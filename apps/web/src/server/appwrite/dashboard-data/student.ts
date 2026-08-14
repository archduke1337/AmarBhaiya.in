import { Query } from "node-appwrite";
import { requireAuth } from "@/server/appwrite/auth";
import { userHasCourseAccess } from "@/server/appwrite/access";
import { APPWRITE_CONFIG } from "../config";
import { createAdminClient } from "../server";
import {
  safeListAllRows, safeListRows, listRowsByFieldValues,
  toDate, toUtcDateKey, calculateCurrentStreak, isActiveEnrollmentRow,
  getSafeHttpUrl,
  type AnyRow, type EnrollmentRow, type CourseRow,
  type LessonRow, type AssignmentRow, type SubmissionRow,
  type QuizRow, type QuizAttemptRow,
} from "./internal";

export type StudentProfileStats = {
  currentStreakDays: number;
  activeCourses: number;
  certificates: number;
};

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

export async function getStudentProfileStats(
  userId: string
): Promise<StudentProfileStats> {
  if (!userId) {
    return { currentStreakDays: 0, activeCourses: 0, certificates: 0 };
  }
  try {
    const { tablesDB } = await createAdminClient();
    const [enrollmentRows, certificateRows, progressRows] = await Promise.all([
      safeListAllRows<EnrollmentRow>(tablesDB, APPWRITE_CONFIG.tables.enrollments, [
        Query.equal("userId", [userId]),
      ]),
      safeListAllRows<AnyRow>(tablesDB, APPWRITE_CONFIG.tables.certificates, [
        Query.equal("userId", [userId]),
      ]),
      safeListAllRows<AnyRow>(tablesDB, APPWRITE_CONFIG.tables.progress, [
        Query.equal("userId", [userId]),
      ]),
    ]);
    const completedDateKeys = new Set<string>();
    for (const row of progressRows) {
      const key = toUtcDateKey(row.completedAt);
      if (key) completedDateKeys.add(key);
    }
    const activeEnrollments = enrollmentRows.filter(isActiveEnrollmentRow).length;
    return {
      currentStreakDays: calculateCurrentStreak(completedDateKeys),
      activeCourses: activeEnrollments,
      certificates: certificateRows.length,
    };
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Failed to load student profile stats.");
    return { currentStreakDays: 0, activeCourses: 0, certificates: 0 };
  }
}

export async function getStudentEnrolledCourses(
  userId: string
): Promise<StudentEnrolledCourse[]> {
  if (!userId) return [];
  try {
    const { tablesDB } = await createAdminClient();
    const enrollmentRows = await safeListAllRows<EnrollmentRow>(
      tablesDB, APPWRITE_CONFIG.tables.enrollments,
      [Query.equal("userId", [userId])]
    );
    const activeEnrollmentRows = enrollmentRows.filter(isActiveEnrollmentRow);
    if (activeEnrollmentRows.length === 0) return [];
    const courseIds = activeEnrollmentRows
      .map((e) => (typeof e.courseId === "string" ? e.courseId : ""))
      .filter(Boolean);
    const courses = await listRowsByFieldValues<CourseRow>(
      tablesDB, APPWRITE_CONFIG.tables.courses, "$id", courseIds
    );
    const courseMap = new Map(courses.map((c) => [c.$id, c]));
    const categoryRows = await safeListAllRows<AnyRow & { name?: string }>(
      tablesDB, APPWRITE_CONFIG.tables.categories,
      [Query.orderAsc("order")]
    );
    const categoryNameById = new Map<string, string>(
      categoryRows.map((cat) => [cat.$id, typeof cat.name === "string" ? cat.name : "General"])
    );
    const progressRows = await safeListAllRows<AnyRow>(
      tablesDB, APPWRITE_CONFIG.tables.progress,
      [Query.equal("userId", [userId])]
    );
    const lessonRows = await listRowsByFieldValues<LessonRow>(
      tablesDB, APPWRITE_CONFIG.tables.lessons, "courseId", courseIds
    );
    const lessonsByCourse = new Map<string, LessonRow[]>();
    for (const lesson of lessonRows) {
      const courseId = typeof lesson.courseId === "string" ? lesson.courseId : "";
      if (!courseId) continue;
      const current = lessonsByCourse.get(courseId) ?? [];
      current.push(lesson);
      lessonsByCourse.set(courseId, current);
    }
    for (const [courseId, rows] of lessonsByCourse) {
      lessonsByCourse.set(courseId, [...rows].sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0)));
    }
    const completedByCourse = new Map<string, number>();
    const progressByCourse = new Map<string, AnyRow[]>();
    for (const row of progressRows) {
      const cid = typeof row.courseId === "string" ? row.courseId : "";
      const completedAt = typeof row.completedAt === "string" ? row.completedAt.trim() : "";
      if (!cid) continue;
      const courseRows = progressByCourse.get(cid) ?? [];
      courseRows.push(row);
      progressByCourse.set(cid, courseRows);
      if (completedAt) completedByCourse.set(cid, (completedByCourse.get(cid) ?? 0) + 1);
    }
    return courseIds
      .map((courseId) => {
        const course = courseMap.get(courseId);
        if (!course) return null;
        const courseLessonRows = lessonsByCourse.get(courseId) ?? [];
        const courseProgressRows = progressByCourse.get(courseId) ?? [];
        const totalLessons = Number(course.totalLessons ?? 0);
        const completedLessons = completedByCourse.get(courseId) ?? 0;
        const progressPercent = totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;
        const completedLessonIds = new Set(
          courseProgressRows.filter((r) => (typeof r.completedAt === "string" ? r.completedAt.trim() : "").length > 0).map((r) => String(r.lessonId ?? "")).filter(Boolean)
        );
        const latestPartialRow = [...courseProgressRows]
          .filter((r) => (typeof r.completedAt === "string" ? r.completedAt.trim() : "").length === 0 && Number(r.percentComplete ?? 0) > 0)
          .sort((a, b) => {
            const aTime = toDate(a.$updatedAt ?? a.$createdAt)?.getTime() ?? 0;
            const bTime = toDate(b.$updatedAt ?? b.$createdAt)?.getTime() ?? 0;
            if (aTime !== bTime) return bTime - aTime;
            return Number(b.percentComplete ?? 0) - Number(a.percentComplete ?? 0);
          })[0];
        const latestPartialLessonId = String(latestPartialRow?.lessonId ?? "");
        const latestPartialLesson = courseLessonRows.find((l) => l.$id === latestPartialLessonId);
        const nextIncompleteLesson = courseLessonRows.find((l) => !completedLessonIds.has(l.$id));
        const continueLesson = progressPercent >= 100 ? null : latestPartialLesson ?? nextIncompleteLesson ?? courseLessonRows[0] ?? null;
        const resumePercent = latestPartialLesson && continueLesson?.$id === latestPartialLesson.$id
          ? Math.max(0, Math.min(99, Math.round(Number(latestPartialRow?.percentComplete ?? 0)))) : 0;
        const latestActivityRow = [...courseProgressRows].sort((a, b) => {
          const aTime = toDate(a.$updatedAt ?? a.completedAt ?? a.$createdAt)?.getTime() ?? 0;
          const bTime = toDate(b.$updatedAt ?? b.completedAt ?? b.$createdAt)?.getTime() ?? 0;
          return bTime - aTime;
        })[0];
        const lastActivityAt = typeof latestActivityRow?.$updatedAt === "string" ? latestActivityRow.$updatedAt
          : typeof latestActivityRow?.completedAt === "string" && latestActivityRow.completedAt ? latestActivityRow.completedAt
          : typeof latestActivityRow?.$createdAt === "string" ? latestActivityRow.$createdAt : null;
        const slug = typeof course.slug === "string" ? course.slug : courseId;
        const continueHref = progressPercent >= 100 ? `/app/courses/${slug}`
          : continueLesson ? `/app/learn/${courseId}/${continueLesson.$id}` : `/app/courses/${slug}`;
        return {
          id: courseId, title: typeof course.title === "string" ? course.title : "Untitled", slug,
          category: (typeof course.categoryId === "string" && categoryNameById.get(course.categoryId)) || "General",
          totalLessons, completedLessons, progressPercent, continueHref,
          continueLessonTitle: typeof continueLesson?.title === "string" ? continueLesson.title : "",
          resumePercent, lastActivityAt,
        };
      })
      .filter((c): c is StudentEnrolledCourse => c !== null)
      .sort((a, b) => {
        if (a.progressPercent >= 100 && b.progressPercent < 100) return 1;
        if (b.progressPercent >= 100 && a.progressPercent < 100) return -1;
        const aTime = toDate(a.lastActivityAt)?.getTime() ?? 0;
        const bTime = toDate(b.lastActivityAt)?.getTime() ?? 0;
        if (aTime !== bTime) return bTime - aTime;
        return b.progressPercent - a.progressPercent;
      });
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Failed to load student enrolled courses.");
    return [];
  }
}

export async function getStudentStudyQueue(
  userId: string
): Promise<StudentStudyQueueItem[]> {
  if (!userId) return [];
  try {
    const { tablesDB } = await createAdminClient();
    const enrollmentRows = await safeListAllRows<EnrollmentRow>(
      tablesDB, APPWRITE_CONFIG.tables.enrollments,
      [Query.equal("userId", [userId])]
    );
    const activeEnrollmentRows = enrollmentRows.filter(isActiveEnrollmentRow);
    const courseIds = [...new Set(activeEnrollmentRows.map((r) => typeof r.courseId === "string" ? r.courseId.trim() : "").filter(Boolean))];
    if (courseIds.length === 0) return [];

    const [courseRows, lessonRows, assignmentRows, quizRows, submissionsResult, quizAttemptsResult] = await Promise.all([
      listRowsByFieldValues<CourseRow>(tablesDB, APPWRITE_CONFIG.tables.courses, "$id", courseIds),
      listRowsByFieldValues<LessonRow>(tablesDB, APPWRITE_CONFIG.tables.lessons, "courseId", courseIds),
      listRowsByFieldValues<AssignmentRow>(tablesDB, APPWRITE_CONFIG.tables.assignments, "courseId", courseIds),
      listRowsByFieldValues<QuizRow>(tablesDB, APPWRITE_CONFIG.tables.quizzes, "courseId", courseIds),
      safeListAllRows<SubmissionRow>(tablesDB, APPWRITE_CONFIG.tables.submissions, [Query.equal("userId", [userId])]),
      safeListAllRows<QuizAttemptRow>(tablesDB, APPWRITE_CONFIG.tables.quizAttempts, [Query.equal("userId", [userId])]),
    ]);

    const courseTitleById = new Map(courseRows.map((c) => [c.$id, typeof c.title === "string" ? c.title : "Course"]));
    const lessonMetaById = new Map(lessonRows.map((l) => [l.$id, { title: typeof l.title === "string" ? l.title : "", order: Number(l.order ?? 0) }]));

    const latestSubmissionByAssignmentId = new Map<string, SubmissionRow>();
    for (const submission of submissionsResult) {
      const assignmentId = typeof submission.assignmentId === "string" ? submission.assignmentId.trim() : "";
      if (!assignmentId) continue;
      const previous = latestSubmissionByAssignmentId.get(assignmentId);
      const currentTime = toDate(submission.submittedAt ?? submission.$createdAt)?.getTime() ?? 0;
      const previousTime = toDate(previous?.submittedAt ?? previous?.$createdAt)?.getTime() ?? -1;
      if (!previous || currentTime >= previousTime) latestSubmissionByAssignmentId.set(assignmentId, submission);
    }

    const attemptsByQuizId = new Map<string, QuizAttemptRow[]>();
    for (const attempt of quizAttemptsResult) {
      const quizId = typeof attempt.quizId === "string" ? attempt.quizId.trim() : "";
      if (!quizId) continue;
      const current = attemptsByQuizId.get(quizId) ?? [];
      current.push(attempt);
      attemptsByQuizId.set(quizId, current);
    }

    const now = Date.now();
    const threeDaysMs = 1000 * 60 * 60 * 24 * 3;

    const assignmentItems = assignmentRows
      .filter((a) => !latestSubmissionByAssignmentId.has(a.$id))
      .map((assignment) => {
        const dueAt = typeof assignment.dueDate === "string" && assignment.dueDate.trim().length > 0 ? assignment.dueDate : null;
        const dueTime = toDate(dueAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const priority = dueTime < now ? 0 : dueTime <= now + threeDaysMs ? 1 : dueAt ? 3 : 5;
        return {
          id: assignment.$id, kind: "assignment" as const,
          title: typeof assignment.title === "string" ? assignment.title : "Assignment",
          courseTitle: courseTitleById.get(typeof assignment.courseId === "string" ? assignment.courseId : "") ?? "Course",
          lessonTitle: lessonMetaById.get(typeof assignment.lessonId === "string" ? assignment.lessonId : "")?.title ?? "",
          href: `/app/assignments#assignment-${assignment.$id}`,
          status: dueTime < now ? "Overdue" : dueTime <= now + threeDaysMs ? "Due soon" : "Pending",
          detail: typeof assignment.description === "string" && assignment.description.trim().length > 0 ? assignment.description.trim() : "Upload your work to complete this assignment.",
          dueAt, sortPriority: priority, sortTime: dueTime, sortLabel: typeof assignment.title === "string" ? assignment.title : "Assignment",
        };
      });

    const quizItems = quizRows
      .map((quiz) => {
        const attempts = attemptsByQuizId.get(quiz.$id) ?? [];
        if (attempts.some((a) => Boolean(a.passed))) return null;
        const latestAttempt = [...attempts].sort((a, b) => (toDate(b.completedAt ?? b.$createdAt)?.getTime() ?? 0) - (toDate(a.completedAt ?? a.$createdAt)?.getTime() ?? 0))[0];
        const bestScore = attempts.reduce((max, a) => Math.max(max, Number(a.score ?? 0)), 0);
        const lessonMeta = lessonMetaById.get(typeof quiz.lessonId === "string" ? quiz.lessonId : "");
        return {
          id: quiz.$id, kind: "quiz" as const,
          title: typeof quiz.title === "string" ? quiz.title : "Quiz",
          courseTitle: courseTitleById.get(typeof quiz.courseId === "string" ? quiz.courseId : "") ?? "Course",
          lessonTitle: lessonMeta?.title ?? "",
          href: `/app/quiz/${quiz.$id}`,
          status: latestAttempt ? "Retry" : "Ready",
          detail: latestAttempt ? `Best ${bestScore}% · Pass mark ${Number(quiz.passMark ?? 60)}%` : `Pass mark ${Number(quiz.passMark ?? 60)}%${lessonMeta?.title ? ` · ${lessonMeta.title}` : ""}`,
          dueAt: null, sortPriority: latestAttempt ? 2 : 4, sortTime: lessonMeta?.order ?? Number.MAX_SAFE_INTEGER, sortLabel: typeof quiz.title === "string" ? quiz.title : "Quiz",
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return [...assignmentItems, ...quizItems]
      .sort((a, b) => {
        if (a.sortPriority !== b.sortPriority) return a.sortPriority - b.sortPriority;
        if (a.sortTime !== b.sortTime) return a.sortTime - b.sortTime;
        if (a.courseTitle !== b.courseTitle) return a.courseTitle.localeCompare(b.courseTitle);
        return a.sortLabel.localeCompare(b.sortLabel);
      })
      .slice(0, 6)
      .map(({ sortPriority, sortTime, sortLabel, ...item }) => item);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Failed to load student study queue.");
    return [];
  }
}

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
    const accessByCourseId = new Map<string, boolean>();
    const visibleSessions: UpcomingSessionItem[] = [];
    const pageSize = 50;
    let offset = 0;
    while (visibleSessions.length < 10) {
      const result = await safeListRows<import("./internal").LiveSessionRow>(
        tablesDB, APPWRITE_CONFIG.tables.liveSessions,
        [Query.equal("status", ["scheduled", "live"]), Query.orderAsc("scheduledAt"), Query.limit(pageSize), Query.offset(offset)]
      );
      for (const session of result.rows) {
        const courseId = typeof session.courseId === "string" ? session.courseId : "";
        if (!courseId) continue;
        let hasAccess = accessByCourseId.get(courseId);
        if (hasAccess === undefined) {
          hasAccess = await userHasCourseAccess({ courseId, userId: user.$id });
          accessByCourseId.set(courseId, hasAccess);
        }
        if (!hasAccess) continue;
        visibleSessions.push({
          id: session.$id, title: typeof session.title === "string" ? session.title : "Untitled session",
          status: typeof session.status === "string" ? session.status : "scheduled",
          scheduledAt: typeof session.scheduledAt === "string" ? session.scheduledAt : null,
          streamUrl: getSafeHttpUrl(session.streamId),
        });
        if (visibleSessions.length >= 10) break;
      }
      if (result.rows.length < pageSize) break;
      offset += result.rows.length;
    }
    return visibleSessions;
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Failed to load upcoming live sessions.");
    return [];
  }
}

export async function getRecentLiveRecordings(): Promise<LiveRecordingItem[]> {
  const user = await requireAuth();
  try {
    const { tablesDB } = await createAdminClient();
    const accessByCourseId = new Map<string, boolean>();
    const recordings: LiveRecordingItem[] = [];
    const pageSize = 50;
    let offset = 0;
    while (recordings.length < 10) {
      const result = await safeListRows<import("./internal").LiveSessionRow>(
        tablesDB, APPWRITE_CONFIG.tables.liveSessions,
        [Query.equal("status", ["ended"]), Query.orderDesc("scheduledAt"), Query.limit(pageSize), Query.offset(offset)]
      );
      for (const session of result.rows) {
        const courseId = typeof session.courseId === "string" ? session.courseId : "";
        const recordingUrl = getSafeHttpUrl(session.recordingUrl);
        if (!courseId || !recordingUrl) continue;
        let hasAccess = accessByCourseId.get(courseId);
        if (hasAccess === undefined) {
          hasAccess = await userHasCourseAccess({ courseId, userId: user.$id });
          accessByCourseId.set(courseId, hasAccess);
        }
        if (!hasAccess) continue;
        recordings.push({
          id: session.$id, title: typeof session.title === "string" ? session.title : "Session recording",
          scheduledAt: typeof session.scheduledAt === "string" ? session.scheduledAt : null,
          recordingUrl,
        });
        if (recordings.length >= 10) break;
      }
      if (result.rows.length < pageSize) break;
      offset += result.rows.length;
    }
    return recordings;
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Failed to load recent live recordings.");
    return [];
  }
}
