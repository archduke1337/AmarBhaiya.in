"use server";

import { ID, Query } from "node-appwrite";

import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";

type ProgressResult = {
  success: boolean;
  error?: string;
  percentComplete?: number;
};

async function getEstimatedLessonCount(courseId: string): Promise<number> {
  const { tablesDB } = await createAdminClient();

  try {
    const courseRow = await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.courses,
      rowId: courseId,
    });

    const totalLessons = Number((courseRow as { totalLessons?: number }).totalLessons ?? 0);
    if (Number.isFinite(totalLessons) && totalLessons > 0) {
      return totalLessons;
    }
  } catch {
    // Continue with lesson table fallback.
  }

  try {
    const lessons = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.lessons,
      queries: [Query.equal("courseId", [courseId]), Query.limit(2000)],
    });

    return Math.max(1, lessons.total);
  } catch {
    return 1;
  }
}

export async function markLessonComplete(
  courseId: string,
  lessonId: string
): Promise<ProgressResult> {
  if (!courseId || !lessonId) {
    return { success: false, error: "Course and lesson IDs are required." };
  }

  try {
    const { account, tablesDB } = await createSessionClient();
    const user = await account.get();

    const existing = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.progress,
      queries: [
        Query.equal("userId", [user.$id]),
        Query.equal("lessonId", [lessonId]),
        Query.limit(1),
      ],
    });

    const progressRow = existing.rows[0] as { $id: string } | undefined;
    const now = new Date().toISOString();

    if (progressRow) {
      await tablesDB.updateRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.progress,
        rowId: progressRow.$id,
        data: {
          completedAt: now,
        },
      });
    } else {
      await tablesDB.createRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.progress,
        rowId: ID.unique(),
        data: {
          userId: user.$id,
          courseId,
          lessonId,
          completedAt: now,
          percentComplete: 0,
        },
      });
    }

    const progressRows = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.progress,
      queries: [
        Query.equal("userId", [user.$id]),
        Query.equal("courseId", [courseId]),
        Query.limit(200),
      ],
    });

    const uniqueLessons = new Set(
      progressRows.rows
        .map((row) => (row as { lessonId?: string }).lessonId)
        .filter((value): value is string => Boolean(value))
    );

    const estimatedLessonCount = await getEstimatedLessonCount(courseId);

    const percentComplete = Math.min(
      100,
      Math.round((uniqueLessons.size / estimatedLessonCount) * 100)
    );

    return { success: true, percentComplete };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update lesson progress.",
    };
  }
}

export async function getCourseProgress(courseId: string): Promise<ProgressResult> {
  if (!courseId) {
    return { success: false, error: "Course ID is required." };
  }

  try {
    const { account, tablesDB } = await createSessionClient();
    const user = await account.get();

    const progressRows = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.progress,
      queries: [
        Query.equal("userId", [user.$id]),
        Query.equal("courseId", [courseId]),
        Query.limit(200),
      ],
    });

    const uniqueLessons = new Set(
      progressRows.rows
        .map((row) => (row as { lessonId?: string }).lessonId)
        .filter((value): value is string => Boolean(value))
    );

    const estimatedLessonCount = await getEstimatedLessonCount(courseId);

    const percentComplete = Math.min(
      100,
      Math.round((uniqueLessons.size / estimatedLessonCount) * 100)
    );

    return { success: true, percentComplete };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch progress.",
    };
  }
}
