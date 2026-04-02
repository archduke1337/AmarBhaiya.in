"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";

import { requireAuth, requireRole } from "@/lib/appwrite/auth";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { actionSuccess, actionError, type ActionResult } from "@/lib/errors/action-result";

type AnyRow = Record<string, unknown> & { $id: string };

// ── Enroll in Course ────────────────────────────────────────────────────────

export async function enrollInCourseAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const user = await requireAuth();
    const courseId = String(formData.get("courseId") ?? "");
    if (!courseId) return actionError("Course ID is required");

    const { tablesDB } = await createAdminClient();

    // Check if already enrolled
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

      if (existing.rows.length > 0) {
        // Already enrolled
        revalidatePath("/app/courses");
        return actionSuccess();
      }
    } catch {
      // Continue to enroll
    }

    // Verify course exists and get access model
    let courseSlug = courseId;
    let accessModel = "free";

    try {
      const course = (await tablesDB.getRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.courses,
        rowId: courseId,
      })) as AnyRow;

      courseSlug = String(course.slug ?? courseId);
      accessModel = String(course.accessModel ?? "free");
    } catch {
      return actionError("Course not found");
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
        status: "active",
        completedAt: "",
        progress: 0,
      },
    });

    revalidatePath("/app/courses");
    revalidatePath("/app/dashboard");
    revalidatePath(`/courses/${courseSlug}`);
    return actionSuccess();
  } catch (error) {
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
    if (!courseId || !lessonId) return actionError("Missing course or lesson ID");

    const { tablesDB } = await createAdminClient();

    // Check not already tracked
    try {
      const existing = await tablesDB.listRows({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.progress,
        queries: [
          Query.equal("courseId", [courseId]),
          Query.equal("userId", [user.$id]),
          Query.equal("lessonId", [lessonId]),
          Query.limit(1),
        ],
      });

      if (existing.rows.length > 0) {
        return actionSuccess(); // Already completed
      }
    } catch {
      // Continue
    }

    try {
      // Create progress record
      await tablesDB.createRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.progress,
        rowId: ID.unique(),
        data: {
          courseId,
          userId: user.$id,
          lessonId,
          completedAt: new Date().toISOString(),
        },
      });

      // Get enrollment record to increment completed count
      const enrollments = await tablesDB.listRows({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.enrollments,
        queries: [
          Query.equal("courseId", [courseId]),
          Query.equal("userId", [user.$id]),
          Query.limit(1),
        ],
      });

      const enrollmentRow = enrollments.rows[0] as AnyRow | undefined;
      if (!enrollmentRow) {
        return actionSuccess();
      }

      // OPTIMIZATION: Get total lessons only once, cache calculation
      const lessonsResult = await tablesDB.listRows({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.lessons,
        queries: [Query.equal("courseId", [courseId]), Query.limit(500)],
      });

      const totalLessons = lessonsResult.total;
      const currentProgress = Number(enrollmentRow.completedLessons ?? 0) + 1;
      const progressPercent = totalLessons > 0 ? Math.round((currentProgress / totalLessons) * 100) : 0;

      const updateData: Record<string, unknown> = {
        completedLessons: currentProgress,
        progress: progressPercent,
      };

      // Mark complete if 100%
      if (progressPercent >= 100) {
        updateData.completedAt = new Date().toISOString();
        updateData.status = "completed";
      }

      await tablesDB.updateRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.enrollments,
        rowId: enrollmentRow.$id,
        data: updateData,
      });

      // AUTO-GENERATE CERTIFICATE when course completes (100%)
      if (progressPercent >= 100) {
        try {
          // Import dynamically to avoid circular dependency
          const { issueCertificateAction } = await import("./certificate");
          const formData = new FormData();
          formData.set("courseId", courseId);
          await issueCertificateAction(formData);
        } catch (certError) {
          // Log but don't fail the enrollment completion
          console.error("Failed to auto-generate certificate:", certError);
        }
      }

      revalidatePath(`/app/learn/${courseId}/${lessonId}`);
      revalidatePath("/app/courses");
      revalidatePath("/app/dashboard");
      return actionSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to mark complete";
      console.error(message);
      return actionError(message);
    }
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Unexpected error");
  }
}

// ── Get Course Progress ─────────────────────────────────────────────────────

export async function getCourseProgress(
  courseId: string,
  userId: string
): Promise<{ completedLessonIds: string[]; percent: number }> {
  const { tablesDB } = await createAdminClient();

  try {
    const [result, totalLessons] = await Promise.all([
      tablesDB.listRows({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.progress,
        queries: [
          Query.equal("courseId", [courseId]),
          Query.equal("userId", [userId]),
          Query.limit(500),
        ],
      }),
      tablesDB.listRows({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.lessons,
        queries: [
          Query.equal("courseId", [courseId]),
          Query.limit(500),
        ],
      }),
    ]);

    const completedLessonIds = result.rows.map((r) =>
      String((r as AnyRow).lessonId ?? "")
    );

    const percent =
      totalLessons.total > 0
        ? Math.round((completedLessonIds.length / totalLessons.total) * 100)
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

    return result.rows.length > 0;
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
  const { tablesDB } = await createAdminClient();

  try {
    const result = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.enrollments,
      queries: [
        Query.equal("userId", [userId]),
        Query.orderDesc("$createdAt"),
        Query.limit(100),
      ],
    });

    const enrollmentRows = result.rows as AnyRow[];
    const courseIds = Array.from(
      new Set(
        enrollmentRows
          .map((row) => String(row.courseId ?? ""))
          .filter((id) => id.length > 0)
      )
    );

    const courseEntries = await Promise.allSettled(
      courseIds.map(async (courseId) => {
        const course = (await tablesDB.getRow({
          databaseId: APPWRITE_CONFIG.databaseId,
          tableId: APPWRITE_CONFIG.tables.courses,
          rowId: courseId,
        })) as AnyRow;

        return {
          courseId,
          title: String(course.title ?? "Unknown Course"),
          slug: String(course.slug ?? courseId),
        };
      })
    );

    const courseById = new Map<string, { title: string; slug: string }>();
    for (const entry of courseEntries) {
      if (entry.status !== "fulfilled") {
        continue;
      }

      courseById.set(entry.value.courseId, {
        title: entry.value.title,
        slug: entry.value.slug,
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
    if (existing.rows.length > 0) return;
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
        status: "active",
        completedAt: "",
        progress: 0,
        paymentId: "",
        accessModel: "free",
      },
    });

    revalidatePath("/admin/students");
    revalidatePath("/admin/courses");
  } catch (error) {
    console.error("[Admin Enroll]", error instanceof Error ? error.message : error);
  }
}

// ── Admin: Unenroll ───────────────────────────────────────────────────────

export async function adminUnenrollAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);

  const enrollmentId = String(formData.get("enrollmentId") ?? "").trim();
  if (!enrollmentId) return;

  const { tablesDB } = await createAdminClient();

  try {
    await tablesDB.deleteRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.enrollments,
      rowId: enrollmentId,
    });

    revalidatePath("/admin/students");
    revalidatePath("/admin/courses");
  } catch (error) {
    console.error("[Admin Unenroll]", error instanceof Error ? error.message : error);
  }
}
