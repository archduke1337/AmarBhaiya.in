import { Query } from "node-appwrite";

import { APPWRITE_CONFIG } from "@/server/appwrite/config";
import { isActiveEnrollmentRow } from "@/server/appwrite/dashboard-data/internal";
import { createAdminClient } from "@/server/appwrite/server";
import type { Role } from "@/lib/utils/constants";
import type { AnyRow } from "@/types/rows";

async function getRowById(tableId: string, rowId: string): Promise<AnyRow | null> {
  const { tablesDB } = await createAdminClient();

  try {
    return (await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId,
      rowId,
    })) as AnyRow;
  } catch {
    return null;
  }
}

export async function getCourseRow(courseId: string): Promise<AnyRow | null> {
  return getRowById(APPWRITE_CONFIG.tables.courses, courseId);
}

export async function getLessonRow(lessonId: string): Promise<AnyRow | null> {
  return getRowById(APPWRITE_CONFIG.tables.lessons, lessonId);
}

export async function userCanManageLesson(
  lessonId: string,
  role: Role,
  userId: string
): Promise<{ lesson: AnyRow; course: AnyRow } | null> {
  const lesson = await getLessonRow(lessonId);
  if (!lesson) {
    return null;
  }

  const course = await userCanManageCourse(String(lesson.courseId ?? ""), role, userId);
  if (!course) {
    return null;
  }

  return { lesson, course };
}

export async function userCanManageCourse(
  courseId: string,
  role: Role,
  userId: string
): Promise<AnyRow | null> {
  const course = await getCourseRow(courseId);
  if (!course) {
    return null;
  }

  if (role === "admin") {
    return course;
  }

  return String(course.instructorId ?? "") === userId ? course : null;
}

export async function userCanManageResource(
  resourceId: string,
  role: Role,
  userId: string
): Promise<AnyRow | null> {
  const resource = await getRowById(APPWRITE_CONFIG.tables.standaloneResources, resourceId);
  if (!resource) {
    return null;
  }

  if (role === "admin") {
    return resource;
  }

  return String(resource.instructorId ?? "") === userId ? resource : null;
}

export async function userCanManageCourseResource(
  resourceId: string,
  role: Role,
  userId: string
): Promise<{ resource: AnyRow; lesson: AnyRow; course: AnyRow } | null> {
  const resource = await getRowById(APPWRITE_CONFIG.tables.resources, resourceId);
  if (!resource) {
    return null;
  }

  const lessonId = String(resource.lessonId ?? "");
  if (!lessonId) {
    return null;
  }

  const lessonContext = await userCanManageLesson(lessonId, role, userId);
  if (!lessonContext) {
    return null;
  }

  return {
    resource,
    lesson: lessonContext.lesson,
    course: lessonContext.course,
  };
}

export async function userHasCourseAccess({
  courseId,
  userId,
  lessonId,
}: {
  courseId: string;
  userId: string;
  lessonId?: string;
}): Promise<boolean> {
  const course = await getCourseRow(courseId);
  if (!course) {
    return false;
  }

  if (course.isPublished === false) {
    return false;
  }

  let lesson: AnyRow | null = null;
  if (lessonId) {
    lesson = await getLessonRow(lessonId);
    if (!lesson || String(lesson.courseId ?? "") !== courseId) {
      return false;
    }
  }

  const { tablesDB } = await createAdminClient();

  try {
    const enrollments = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.enrollments,
      queries: [
        Query.equal("courseId", [courseId]),
        Query.equal("userId", [userId]),
        Query.limit(10),
      ],
    });

    const hasActiveEnrollment = enrollments.rows.some((row) => isActiveEnrollmentRow(row as AnyRow));

    if (hasActiveEnrollment) {
      return true;
    }
  } catch {
    // Continue to public-access checks below.
  }

  if (String(course.accessModel ?? "free") === "free") {
    return true;
  }

  // Subscription-gated courses: check active subscription
  if (String(course.accessModel ?? "") === "subscription") {
    try {
      const subs = await tablesDB.listRows({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.subscriptions,
        queries: [
          Query.equal("userId", [userId]),
          Query.equal("status", ["active"]),
          Query.limit(10),
        ],
      });
      const hasActiveSub = subs.rows.some((row) => {
        const r = row as AnyRow;
        if (String(r.status ?? "") !== "active") return false;
        if (!r.endDate) return true;
        const end = new Date(String(r.endDate));
        return !Number.isNaN(end.getTime()) && end > new Date();
      });
      if (hasActiveSub) return true;
    } catch {
      // fall through to lesson preview check
    }
  }

  if (lesson) {
    if (Boolean(lesson.isFree) || Boolean(lesson.isFreePreview)) {
      return true;
    }
  }

  return false;
}
