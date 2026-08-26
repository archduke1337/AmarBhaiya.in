"use server";

import { Query } from "node-appwrite";
import { revalidatePath } from "next/cache";

import { requireAuth } from "@/server/appwrite/auth";
import { APPWRITE_CONFIG } from "@/server/appwrite/config";
import { upsertLessonProgressRow } from "@/server/appwrite/progress";
import { isActiveEnrollmentRow } from "@/server/appwrite/dashboard-data/internal";
import { listAllRows } from "@/server/appwrite/row-pagination";
import { createAdminClient } from "@/server/appwrite/server";
import { actionSuccess, actionError, type ActionResult } from "@/lib/errors/action-result";
import { getCourseDetailPaths } from "@/lib/utils/cache-paths";
import { revalidateEach } from "@/lib/utils/revalidate";
import type { AnyRow } from "@/types/rows";

function isCompletedProgressRow(row: Record<string, unknown>): boolean {
  return typeof row.completedAt === "string" && row.completedAt.trim().length > 0;
}

export async function completeLessonForUser({
  courseId,
  lessonId,
  userId,
}: {
  courseId: string;
  lessonId: string;
  userId: string;
}): Promise<ActionResult> {
  if (!courseId || !lessonId || !userId) {
    return actionError("Missing course or lesson ID");
  }

  const caller = await requireAuth();
  if (caller.$id !== userId && !caller.labels?.includes("admin")) {
    return actionError("Forbidden");
  }

  try {
    const { tablesDB } = await createAdminClient();
    const [courseRow, lessonRow] = await Promise.all([
      tablesDB.getRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.courses,
        rowId: courseId,
      }).catch(() => null),
      tablesDB.getRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.lessons,
        rowId: lessonId,
      }).catch(() => null),
    ]);

    if (!courseRow || !lessonRow) {
      return actionError("Course or lesson not found");
    }

    const lesson = lessonRow as AnyRow;
    if (String(lesson.courseId ?? "") !== courseId) {
      return actionError("Lesson does not belong to this course");
    }

    const course = courseRow as AnyRow;
    if (course.isPublished === false) {
      return actionError("Course is not available");
    }

    const courseIsFree = String(course.accessModel ?? "free") === "free";
    const completionTimestamp = new Date().toISOString();

    const enrollments = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.enrollments,
      queries: [
        Query.equal("courseId", [courseId]),
        Query.equal("userId", [userId]),
        Query.limit(1),
      ],
    });

    const enrollmentRow = enrollments.rows.find((row) =>
      isActiveEnrollmentRow(row as AnyRow)
    ) as AnyRow | undefined;
    if (!enrollmentRow && !courseIsFree) {
      return actionError("Enrollment required");
    }

    const progressWrite = await upsertLessonProgressRow(tablesDB, {
      userId,
      courseId,
      lessonId,
      percentComplete: 100,
      completedAt: completionTimestamp,
    });

    if (progressWrite.alreadyCompleted) {
      return actionSuccess();
    }

    if (!enrollmentRow) {
      revalidatePath(`/app/learn/${courseId}/${lessonId}`);
      return actionSuccess();
    }

    const [lessonRows, progressRows] = await Promise.all([
      listAllRows<AnyRow>(tablesDB, APPWRITE_CONFIG.tables.lessons, [
        Query.equal("courseId", [courseId]),
      ]),
      listAllRows<AnyRow>(tablesDB, APPWRITE_CONFIG.tables.progress, [
        Query.equal("courseId", [courseId]),
        Query.equal("userId", [userId]),
      ]),
    ]);

    const totalLessons = lessonRows.length;
    const completedLessons = progressRows
      .filter((row) => isCompletedProgressRow(row)).length;
    const progressPercent =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    const updateData: Record<string, unknown> = {
      completedLessons,
      progress: progressPercent,
    };

    if (progressPercent >= 100) {
      updateData.completedAt = completionTimestamp;
      updateData.status = "completed";
    }

    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.enrollments,
      rowId: enrollmentRow.$id,
      data: updateData,
    });

    if (
      progressPercent >= 100 &&
      String(enrollmentRow.status ?? "active") !== "completed"
    ) {
      try {
        const { issueCertificateAction } = await import("./certificate");
        const certificateFormData = new FormData();
        certificateFormData.set("courseId", courseId);
        await issueCertificateAction(certificateFormData);
      } catch (certError) {
        console.error("Failed to auto-generate certificate:", certError);
      }
    }

    revalidatePath(`/app/learn/${courseId}/${lessonId}`);
    revalidatePath("/app/courses");
    revalidatePath("/app/dashboard");
    revalidateEach(
      getCourseDetailPaths(courseId, typeof course.slug === "string" ? course.slug : "")
    );
    return actionSuccess();
  } catch (error) {
    console.error("[CompleteLesson] failed", error);
    const raw = error instanceof Error ? error.message : "Failed to mark complete";
    const safe = raw.toLowerCase().includes("appwrite") || raw.toLowerCase().includes("document")
      ? "Failed to mark complete"
      : raw;
    return actionError(safe);
  }
}

// ── Mark Lesson Complete ────────────────────────────────────────────────────
// OPTIMIZATION: Instead of recalculating progress from scratch every time,
// we cache progress in the enrollment row. This prevents N+1 queries.

export async function markLessonCompleteAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const user = await requireAuth();
    const courseId = String(formData.get("courseId") ?? "");
    const lessonId = String(formData.get("lessonId") ?? "");
    return await completeLessonForUser({ courseId, lessonId, userId: user.$id });
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Unexpected error");
  }
}

// ── Get Course Progress ─────────────────────────────────────────────────────

export async function getCourseProgress(
  courseId: string,
  userId: string
): Promise<{ completedLessonIds: string[]; percent: number }> {
  // SECURITY: Verify caller owns this data or is admin
  const caller = await requireAuth();
  if (caller.$id !== userId && !caller.labels?.includes("admin")) {
    return { completedLessonIds: [], percent: 0 };
  }

  const { tablesDB } = await createAdminClient();

  try {
    const [progressRows, lessonRows] = await Promise.all([
      listAllRows<AnyRow>(tablesDB, APPWRITE_CONFIG.tables.progress, [
        Query.equal("courseId", [courseId]),
        Query.equal("userId", [userId]),
      ]),
      listAllRows<AnyRow>(tablesDB, APPWRITE_CONFIG.tables.lessons, [
        Query.equal("courseId", [courseId]),
      ]),
    ]);

    const completedLessonIds = progressRows
      .filter((row) => isCompletedProgressRow(row))
      .map((row) => String(row.lessonId ?? ""));

    const percent =
      lessonRows.length > 0
        ? Math.round((completedLessonIds.length / lessonRows.length) * 100)
        : 0;

    return { completedLessonIds, percent };
  } catch {
    return { completedLessonIds: [], percent: 0 };
  }
}
