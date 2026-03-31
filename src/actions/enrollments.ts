"use server";

import { ID, Query } from "node-appwrite";

import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";

type EnrollmentActionResult = {
  success: boolean;
  error?: string;
  enrollmentId?: string;
};

async function getCurrentUserId(): Promise<string> {
  const { account } = await createSessionClient();
  const user = await account.get();
  return user.$id;
}

export async function enrollInFreeCourse(
  courseId: string
): Promise<EnrollmentActionResult> {
  if (!courseId) {
    return { success: false, error: "Course ID is required." };
  }

  try {
    const userId = await getCurrentUserId();
    const { tablesDB } = await createAdminClient();

    const existing = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.enrollments,
      queries: [
        Query.equal("userId", [userId]),
        Query.equal("courseId", [courseId]),
        Query.limit(1),
      ],
    });

    const existingEnrollment = existing.rows[0] as { $id: string } | undefined;
    if (existingEnrollment) {
      return { success: true, enrollmentId: existingEnrollment.$id };
    }

    const enrollmentId = ID.unique();

    await tablesDB.createRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.enrollments,
      rowId: enrollmentId,
      data: {
        userId,
        courseId,
        enrolledAt: new Date().toISOString(),
        accessModel: "free",
        isActive: true,
      },
    });

    return { success: true, enrollmentId };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to enroll in course.",
    };
  }
}

export async function unenrollFromCourse(
  courseId: string
): Promise<EnrollmentActionResult> {
  if (!courseId) {
    return { success: false, error: "Course ID is required." };
  }

  try {
    const userId = await getCurrentUserId();
    const { tablesDB } = await createAdminClient();

    const existing = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.enrollments,
      queries: [
        Query.equal("userId", [userId]),
        Query.equal("courseId", [courseId]),
        Query.limit(1),
      ],
    });

    const existingEnrollment = existing.rows[0] as { $id: string } | undefined;

    if (!existingEnrollment) {
      return { success: true };
    }

    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.enrollments,
      rowId: existingEnrollment.$id,
      data: {
        isActive: false,
      },
    });

    return { success: true, enrollmentId: existingEnrollment.$id };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to unenroll from course.",
    };
  }
}
