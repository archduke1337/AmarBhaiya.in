"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";

import { requireAuth, requireRole } from "@/lib/appwrite/auth";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";

type AnyRow = Record<string, unknown> & { $id: string };

// ── Enroll in Course ────────────────────────────────────────────────────────

export async function enrollInCourseAction(
  formData: FormData
): Promise<void> {
  const user = await requireAuth();
  const courseId = String(formData.get("courseId") ?? "");
  if (!courseId) return;

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
      // Already enrolled — just revalidate and return
      revalidatePath("/app/courses");
      return;
    }
  } catch {
    // Continue to enroll
  }

  // Verify course exists
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
    // Course doesn't exist — still try to enroll (for flexibility)
    console.error(`[Enrollment] Course ${courseId} not found via getRow, attempting enrollment anyway.`);
  }

  // Block paid courses from free enrollment
  // (paid courses must go through Razorpay checkout)
  if (accessModel === "paid" || accessModel === "subscription") {
    console.error(`[Enrollment] Blocked free enrollment for ${accessModel} course ${courseId}`);
    return;
  }

  try {
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
  } catch (error) {
    console.error(
      "[Enrollment] Failed to create enrollment:",
      error instanceof Error ? error.message : error
    );
  }
}

// ── Mark Lesson Complete ────────────────────────────────────────────────────

export async function markLessonCompleteAction(
  formData: FormData
): Promise<void> {
  const user = await requireAuth();
  const courseId = String(formData.get("courseId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  if (!courseId || !lessonId) return;

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

    if (existing.rows.length > 0) return; // Already completed
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

    // Recalculate course progress
    const [completedResult, totalResult] = await Promise.all([
      tablesDB.listRows({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.progress,
        queries: [
          Query.equal("courseId", [courseId]),
          Query.equal("userId", [user.$id]),
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

    const completedCount = completedResult.total;
    const totalLessons = totalResult.total;
    const progressPercent =
      totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    // Update enrollment progress
    const enrollment = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.enrollments,
      queries: [
        Query.equal("courseId", [courseId]),
        Query.equal("userId", [user.$id]),
        Query.limit(1),
      ],
    });

    const enrollmentRow = enrollment.rows[0] as AnyRow | undefined;
    if (enrollmentRow) {
      const updateData: Record<string, unknown> = {
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
    }

    revalidatePath(`/app/learn/${courseId}/${lessonId}`);
    revalidatePath("/app/courses");
    revalidatePath("/app/dashboard");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to mark complete."
    );
  }
}

// ── Get Course Progress ─────────────────────────────────────────────────────

export async function getCourseProgress(
  courseId: string,
  userId: string
): Promise<{ completedLessonIds: string[]; percent: number }> {
  const { tablesDB } = await createAdminClient();

  try {
    const result = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.progress,
      queries: [
        Query.equal("courseId", [courseId]),
        Query.equal("userId", [userId]),
        Query.limit(500),
      ],
    });

    const completedLessonIds = result.rows.map((r) =>
      String((r as AnyRow).lessonId ?? "")
    );

    const totalLessons = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.lessons,
      queries: [
        Query.equal("courseId", [courseId]),
        Query.limit(500),
      ],
    });

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

    const enrollments: EnrolledCourse[] = [];

    for (const row of result.rows) {
      const r = row as AnyRow;
      const cId = String(r.courseId ?? "");

      // Fetch course details
      let courseTitle = "Unknown Course";
      let courseSlug = cId;

      try {
        const course = (await tablesDB.getRow({
          databaseId: APPWRITE_CONFIG.databaseId,
          tableId: APPWRITE_CONFIG.tables.courses,
          rowId: cId,
        })) as AnyRow;

        courseTitle = String(course.title ?? "Unknown Course");
        courseSlug = String(course.slug ?? cId);
      } catch {
        // Course may have been deleted
      }

      enrollments.push({
        enrollmentId: r.$id,
        courseId: cId,
        courseTitle,
        courseSlug,
        progress: Number(r.progress ?? 0),
        status: String(r.status ?? "active"),
        enrolledAt: String(r.enrolledAt ?? ""),
      });
    }

    return enrollments;
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
