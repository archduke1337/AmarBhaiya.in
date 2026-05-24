"use server";

import { Query } from "node-appwrite";

import { requireAuth } from "@/lib/appwrite/auth";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import {
  listAllRows,
  listRowsByFieldValues,
  type AnyAppwriteRow,
} from "@/lib/appwrite/row-pagination";
import { createAdminClient } from "@/lib/appwrite/server";

type AnyRow = AnyAppwriteRow;

export type EnrolledCourse = {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  progress: number;
  status: string;
  enrolledAt: string;
};

export async function getStudentEnrollments(
  userId: string
): Promise<EnrolledCourse[]> {
  // SECURITY: Verify caller owns this data or is admin
  const caller = await requireAuth();
  if (caller.$id !== userId && !caller.labels?.includes("admin")) {
    return [];
  }

  const { tablesDB } = await createAdminClient();

  try {
    const enrollmentRows = await listAllRows<AnyRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.enrollments,
      [Query.equal("userId", [userId]), Query.orderDesc("$createdAt")]
    );
    const courseIds = Array.from(
      new Set(
        enrollmentRows
          .map((row) => String(row.courseId ?? ""))
          .filter((id) => id.length > 0)
      )
    );

    const courseRows = await listRowsByFieldValues<AnyRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.courses,
      "$id",
      courseIds
    );

    const courseById = new Map<string, { title: string; slug: string }>();
    for (const course of courseRows) {
      courseById.set(course.$id, {
        title: String(course.title ?? "Unknown Course"),
        slug: String(course.slug ?? course.$id),
      });
    }

    return enrollmentRows.map((row) => {
      const courseId = String(row.courseId ?? "");
      const courseMeta = courseById.get(courseId);

      return {
        enrollmentId: row.$id,
        courseId,
        courseTitle: courseMeta?.title ?? "Unknown Course",
        courseSlug: courseMeta?.slug ?? courseId,
        progress: Number(row.progress ?? 0),
        status: String(row.status ?? "active"),
        enrolledAt: String(row.enrolledAt ?? ""),
      };
    });
  } catch {
    return [];
  }
}

// Re-export moved functions for backward compatibility
export {
  enrollInCourseAction,
  isEnrolled,
  adminEnrollAction,
  adminUnenrollAction,
} from "./enroll";

export {
  completeLessonForUser,
  markLessonCompleteAction,
  getCourseProgress,
} from "./progress";
