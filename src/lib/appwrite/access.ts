import { Query } from "node-appwrite";

import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import type { Role } from "@/lib/utils/constants";

type AnyRow = Record<string, unknown> & { $id: string };

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

  if (String(course.accessModel ?? "free") === "free") {
    return true;
  }

  if (lessonId) {
    const lesson = await getLessonRow(lessonId);
    if (!lesson || String(lesson.courseId ?? "") !== courseId) {
      return false;
    }

    if (Boolean(lesson.isFree) || Boolean(lesson.isFreePreview)) {
      return true;
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

    return enrollments.rows.some((row) => {
      const enrollment = row as AnyRow;
      return enrollment.isActive !== false
        && String(enrollment.status ?? "active") !== "cancelled";
    });
  } catch {
    return false;
  }
}
