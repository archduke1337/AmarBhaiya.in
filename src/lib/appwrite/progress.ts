import { ID, Query } from "node-appwrite";

import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import type { createAdminClient } from "@/lib/appwrite/server";

type TablesDbClient = Awaited<ReturnType<typeof createAdminClient>>["tablesDB"];

export type ProgressRow = Record<string, unknown> & {
  $id: string;
  courseId?: unknown;
  lessonId?: unknown;
  percentComplete?: unknown;
  completedAt?: unknown;
};

function normalizePercentComplete(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

function getCompletedAtValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getPercentCompleteValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function findLessonProgressRow(
  tablesDB: TablesDbClient,
  {
    userId,
    lessonId,
    courseId,
  }: {
    userId: string;
    lessonId: string;
    courseId?: string;
  }
): Promise<ProgressRow | null> {
  const result = await tablesDB.listRows({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.tables.progress,
    queries: [
      Query.equal("userId", [userId]),
      Query.equal("lessonId", [lessonId]),
      Query.limit(1),
    ],
  });

  const row = (result.rows[0] as ProgressRow | undefined) ?? null;
  if (!row) {
    return null;
  }

  if (courseId && String(row.courseId ?? "") !== courseId) {
    return null;
  }

  return row;
}

export async function upsertLessonProgressRow(
  tablesDB: TablesDbClient,
  {
    userId,
    courseId,
    lessonId,
    percentComplete,
    completedAt,
  }: {
    userId: string;
    courseId: string;
    lessonId: string;
    percentComplete: number;
    completedAt?: string;
  }
): Promise<{
  rowId: string;
  percentComplete: number;
  completedAt: string;
  alreadyCompleted: boolean;
}> {
  const desiredPercent = normalizePercentComplete(percentComplete);
  const desiredCompletedAt = getCompletedAtValue(completedAt);

  const applyToExistingRow = async (row: ProgressRow) => {
    const existingCompletedAt = getCompletedAtValue(row.completedAt);
    if (existingCompletedAt) {
      return {
        rowId: row.$id,
        percentComplete: getPercentCompleteValue(row.percentComplete),
        completedAt: existingCompletedAt,
        alreadyCompleted: true,
      };
    }

    const existingPercent = getPercentCompleteValue(row.percentComplete);
    const nextPercent = Math.max(existingPercent, desiredPercent);
    const updateData: Record<string, unknown> = {};

    if (nextPercent > existingPercent) {
      updateData.percentComplete = nextPercent;
    }

    if (desiredCompletedAt) {
      updateData.completedAt = desiredCompletedAt;
    }

    if (Object.keys(updateData).length > 0) {
      await tablesDB.updateRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.progress,
        rowId: row.$id,
        data: updateData,
      });
    }

    return {
      rowId: row.$id,
      percentComplete: nextPercent,
      completedAt: desiredCompletedAt,
      alreadyCompleted: false,
    };
  };

  const existingRow = await findLessonProgressRow(tablesDB, {
    userId,
    lessonId,
    courseId,
  });

  if (existingRow) {
    return applyToExistingRow(existingRow);
  }

  try {
    const rowId = ID.unique();
    await tablesDB.createRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.progress,
      rowId,
      data: {
        userId,
        courseId,
        lessonId,
        completedAt: desiredCompletedAt,
        percentComplete: desiredPercent,
      },
    });

    return {
      rowId,
      percentComplete: desiredPercent,
      completedAt: desiredCompletedAt,
      alreadyCompleted: false,
    };
  } catch (error) {
    const appwriteError = error as { code?: number };
    if (appwriteError.code !== 409) {
      throw error;
    }

    const conflictedRow = await findLessonProgressRow(tablesDB, {
      userId,
      lessonId,
      courseId,
    });

    if (!conflictedRow) {
      throw error;
    }

    return applyToExistingRow(conflictedRow);
  }
}
