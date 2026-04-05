"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";

import { requireAuth, requireRole } from "@/lib/appwrite/auth";
import { getCourseRow } from "@/lib/appwrite/access";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { executeDeletePlan } from "@/lib/appwrite/delete-plan";
import { upsertLessonProgressRow } from "@/lib/appwrite/progress";
import {
  listAllRows,
  listRowsByFieldValues,
  type AnyAppwriteRow,
} from "@/lib/appwrite/row-pagination";
import { createAdminClient } from "@/lib/appwrite/server";
import { actionSuccess, actionError, type ActionResult } from "@/lib/errors/action-result";
import { getCourseDetailPaths } from "@/lib/utils/cache-paths";

type AnyRow = AnyAppwriteRow;

function isCompletedProgressRow(row: Record<string, unknown>): boolean {
  return typeof row.completedAt === "string" && row.completedAt.trim().length > 0;
}

function isActiveEnrollmentRow(row: Record<string, unknown>): boolean {
  return row.isActive !== false && String(row.status ?? "active") !== "cancelled";
}

function revalidateEach(paths: string[]): void {
  for (const path of paths) {
    revalidatePath(path);
  }
}

async function resolveCourseForEnrollment(
  tablesDB: Awaited<ReturnType<typeof createAdminClient>>["tablesDB"],
  courseInput: string
): Promise<{
  courseId: string;
  courseSlug: string;
  accessModel: string;
  isPublished: boolean;
} | null> {
  try {
    let course: AnyRow | null = null;

    try {
      course = (await tablesDB.getRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.courses,
        rowId: courseInput,
      })) as AnyRow;
    } catch {
      const bySlug = await tablesDB.listRows({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.courses,
        queries: [Query.equal("slug", [courseInput]), Query.limit(1)],
      });
      course = (bySlug.rows[0] as AnyRow | undefined) ?? null;
    }

    if (!course) {
      return null;
    }

    return {
      courseId: course.$id,
      courseSlug: String(course.slug ?? course.$id),
      accessModel: String(course.accessModel ?? "free"),
      isPublished: Boolean(course.isPublished),
    };
  } catch {
    return null;
  }
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

    const enrollmentRow = enrollments.rows[0] as AnyRow | undefined;
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
    const message = error instanceof Error ? error.message : "Failed to mark complete";
    console.error(message);
    return actionError(message);
  }
}

// ── Enroll in Course ────────────────────────────────────────────────────────

export async function enrollInCourseAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const user = await requireAuth();
    const courseInput = String(formData.get("courseId") ?? "").trim();
    if (!courseInput) return actionError("Course ID is required");

    const { tablesDB } = await createAdminClient();
    const resolvedCourse = await resolveCourseForEnrollment(tablesDB, courseInput);
    if (!resolvedCourse) {
      return actionError("Course not found");
    }

    const { courseId, courseSlug, accessModel, isPublished } = resolvedCourse;
    if (!isPublished) {
      return actionError("Course not available");
    }

    // Check if already enrolled using canonical course id
    try {
      const existing = await tablesDB.listRows({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.enrollments,
        queries: [
          Query.equal("courseId", [courseId]),
          Query.equal("userId", [user.$id]),
          Query.limit(1),
        ],
      });

      const existingRow = (existing.rows[0] as AnyRow | undefined) ?? null;
      if (existingRow && isActiveEnrollmentRow(existingRow)) {
        revalidatePath("/app/courses");
        revalidatePath("/app/dashboard");
        revalidateEach(getCourseDetailPaths(courseId, courseSlug));
        return actionSuccess();
      }

      if (existingRow) {
        const nextStatus =
          String(existingRow.status ?? "active") === "completed" ? "completed" : "active";

        await tablesDB.updateRow({
          databaseId: APPWRITE_CONFIG.databaseId,
          tableId: APPWRITE_CONFIG.tables.enrollments,
          rowId: existingRow.$id,
          data: {
            enrolledAt: String(existingRow.enrolledAt ?? "") || new Date().toISOString(),
            paymentId: "",
            accessModel: "free",
            isActive: true,
            status: nextStatus,
          },
        });

        revalidatePath("/app/courses");
        revalidatePath("/app/dashboard");
        revalidateEach(getCourseDetailPaths(courseId, courseSlug));
        return actionSuccess();
      }
    } catch {
      // Continue to enroll
    }

    // Block paid courses from free enrollment
    if (accessModel === "paid" || accessModel === "subscription") {
      return actionError("This course requires payment. Please use checkout.", "PAID_COURSE");
    }

    // Create enrollment
    await tablesDB.createRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.enrollments,
      rowId: ID.unique(),
      data: {
        courseId,
        userId: user.$id,
        enrolledAt: new Date().toISOString(),
        paymentId: "",
        accessModel: "free",
        isActive: true,
        completedLessons: 0,
        progress: 0,
        completedAt: "",
        status: "active",
      },
    });

    revalidatePath("/app/courses");
    revalidatePath("/app/dashboard");
    revalidateEach(getCourseDetailPaths(courseId, courseSlug));
    return actionSuccess();
  } catch (error) {
    const appwriteError = error as { code?: number };
    if (appwriteError?.code === 409) {
      revalidatePath("/app/courses");
      revalidatePath("/app/dashboard");
      revalidateEach(getCourseDetailPaths(courseId, courseSlug));
      return actionSuccess();
    }

    const message = error instanceof Error ? error.message : "Failed to enroll in course";
    console.error("[Enrollment] Failed to create enrollment:", message);
    return actionError(message);
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
    return completeLessonForUser({ courseId, lessonId, userId: user.$id });
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

// ── Check Enrollment ────────────────────────────────────────────────────────

export async function isEnrolled(
  courseId: string,
  userId: string
): Promise<boolean> {
  // SECURITY: Verify caller owns this data or is admin
  const caller = await requireAuth();
  if (caller.$id !== userId && !caller.labels?.includes("admin")) {
    return false;
  }

  const { tablesDB } = await createAdminClient();

  try {
    const result = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.enrollments,
      queries: [
        Query.equal("courseId", [courseId]),
        Query.equal("userId", [userId]),
        Query.limit(1),
      ],
    });

    const enrollment = result.rows[0] as AnyRow | undefined;
    return enrollment ? isActiveEnrollmentRow(enrollment) : false;
  } catch {
    return false;
  }
}

// ── Get Student Enrollments ─────────────────────────────────────────────────

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

// ── Admin: Manual Enroll ──────────────────────────────────────────────────

export async function adminEnrollAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);

  const userId = String(formData.get("userId") ?? "").trim();
  const courseId = String(formData.get("courseId") ?? "").trim();
  if (!userId || !courseId) return;

  const { tablesDB } = await createAdminClient();

  // Check if already enrolled
  try {
    const existing = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.enrollments,
      queries: [
        Query.equal("courseId", [courseId]),
        Query.equal("userId", [userId]),
        Query.limit(1),
      ],
    });
    const existingRow = (existing.rows[0] as AnyRow | undefined) ?? null;
    if (existingRow && isActiveEnrollmentRow(existingRow)) return;

    if (existingRow) {
      const nextStatus =
        String(existingRow.status ?? "active") === "completed" ? "completed" : "active";

      await tablesDB.updateRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.enrollments,
        rowId: existingRow.$id,
        data: {
          enrolledAt: String(existingRow.enrolledAt ?? "") || new Date().toISOString(),
          paymentId: "",
          accessModel: "free",
          isActive: true,
          status: nextStatus,
        },
      });

      revalidatePath("/admin/students");
      revalidatePath("/admin/courses");
      revalidatePath("/app/courses");
      revalidatePath("/app/dashboard");
      const course = await getCourseRow(courseId);
      revalidateEach(
        getCourseDetailPaths(courseId, typeof course?.slug === "string" ? course.slug : "")
      );
      return;
    }
  } catch {
    // continue
  }

  try {
    await tablesDB.createRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.enrollments,
      rowId: ID.unique(),
      data: {
        courseId,
        userId,
        enrolledAt: new Date().toISOString(),
        paymentId: "",
        accessModel: "free",
        isActive: true,
        completedLessons: 0,
        progress: 0,
        completedAt: "",
        status: "active",
      },
    });

    revalidatePath("/admin/students");
    revalidatePath("/admin/courses");
    revalidatePath("/app/courses");
    revalidatePath("/app/dashboard");
    const course = await getCourseRow(courseId);
    revalidateEach(
      getCourseDetailPaths(courseId, typeof course?.slug === "string" ? course.slug : "")
    );
  } catch (error) {
    const appwriteError = error as { code?: number };
    if (appwriteError?.code === 409) {
      revalidatePath("/admin/students");
      revalidatePath("/admin/courses");
      revalidatePath("/app/courses");
      revalidatePath("/app/dashboard");
      const course = await getCourseRow(courseId);
      revalidateEach(
        getCourseDetailPaths(courseId, typeof course?.slug === "string" ? course.slug : "")
      );
      return;
    }

    console.error("[Admin Enroll]", error instanceof Error ? error.message : error);
  }
}

// ── Admin: Unenroll ───────────────────────────────────────────────────────

export async function adminUnenrollAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);

  const enrollmentId = String(formData.get("enrollmentId") ?? "").trim();
  if (!enrollmentId) return;

  const { tablesDB, storage } = await createAdminClient();

  try {
    const enrollment = (await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.enrollments,
      rowId: enrollmentId,
    }).catch(() => null)) as AnyRow | null;

    if (!enrollment) {
      return;
    }

    const userId = String(enrollment.userId ?? "");
    const courseId = String(enrollment.courseId ?? "");

    if (userId && courseId) {
      const progressRows = await listAllRows<AnyRow>(
        tablesDB,
        APPWRITE_CONFIG.tables.progress,
        [Query.equal("userId", [userId]), Query.equal("courseId", [courseId])]
      ).catch(() => []);
      const deleted = await executeDeletePlan({
        tablesDB,
        storage,
        plan: {
          stagedDeletes: [
            ...progressRows.map((row) => ({
              tableId: APPWRITE_CONFIG.tables.progress,
              rowId: row.$id,
            })),
            {
              tableId: APPWRITE_CONFIG.tables.enrollments,
              rowId: enrollmentId,
            },
          ],
          fileDeletes: [],
        },
        label: `enrollment ${enrollmentId}`,
      });
      if (!deleted) {
        return;
      }
    } else {
      const deleted = await executeDeletePlan({
        tablesDB,
        storage,
        plan: {
          stagedDeletes: [
            {
              tableId: APPWRITE_CONFIG.tables.enrollments,
              rowId: enrollmentId,
            },
          ],
          fileDeletes: [],
        },
        label: `enrollment ${enrollmentId}`,
      });
      if (!deleted) {
        return;
      }
    }

    revalidatePath("/admin/students");
    revalidatePath("/admin/courses");
    if (userId) {
      revalidatePath(`/admin/students/${userId}`);
    }
    if (courseId) {
      revalidatePath("/app/courses");
      const course = await getCourseRow(courseId);
      revalidateEach(
        getCourseDetailPaths(courseId, typeof course?.slug === "string" ? course.slug : "")
      );
      revalidatePath("/app/dashboard");
    }
  } catch (error) {
    console.error("[Admin Unenroll]", error instanceof Error ? error.message : error);
  }
}
