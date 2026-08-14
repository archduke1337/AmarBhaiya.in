"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";

import { requireAuth, requireRole } from "@/server/appwrite/auth";
import { getCourseRow } from "@/server/appwrite/access";
import { APPWRITE_CONFIG } from "@/server/appwrite/config";
import { executeDeletePlan } from "@/server/appwrite/delete-plan";
import { listAllRows, type AnyAppwriteRow } from "@/server/appwrite/row-pagination";
import { createAdminClient } from "@/server/appwrite/server";
import { actionSuccess, actionError, type ActionResult } from "@/lib/errors/action-result";
import { getCourseDetailPaths } from "@/lib/utils/cache-paths";
import { revalidateEach } from "@/lib/utils/revalidate";

type AnyRow = AnyAppwriteRow;

function isActiveEnrollmentRow(row: Record<string, unknown>): boolean {
  return row.isActive !== false && String(row.status ?? "active") !== "cancelled";
}

// ── Shared Enrollment Data ───────────────────────────────────────────────────

type FindOrCreateEnrollmentResult =
  | { status: "already_active"; enrollment: Record<string, unknown> & { $id: string } }
  | { status: "reactivated"; enrollment: Record<string, unknown> & { $id: string } }
  | { status: "created" }
  | { status: "error"; message: string };

/**
 * Finds an existing enrollment for a user+course, or creates a new one.
 * Handles reactivation of cancelled/completed enrollments.
 * Does NOT handle revalidation — caller must revalidate paths.
 */
async function findOrCreateEnrollment(
  tablesDB: Awaited<ReturnType<typeof createAdminClient>>["tablesDB"],
  courseId: string,
  userId: string
): Promise<FindOrCreateEnrollmentResult> {
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
    if (existingRow && isActiveEnrollmentRow(existingRow)) {
      return { status: "already_active", enrollment: existingRow };
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

      return { status: "reactivated", enrollment: existingRow };
    }
  } catch {
    // No existing enrollment found — continue to create below
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

    return { status: "created" };
  } catch (error) {
    const appwriteError = error as { code?: number };
    if (appwriteError?.code === 409) {
      return { status: "created" };
    }
    return { status: "error", message: error instanceof Error ? error.message : "Failed to create enrollment" };
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

// ── Enroll in Course ────────────────────────────────────────────────────────

export async function enrollInCourseAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const user = await requireAuth();
    const courseInput = String(formData.get("courseId") ?? "").trim();
    if (!courseInput) {
      return actionError("Course ID is required");
    }
    const { tablesDB } = await createAdminClient();
    const resolvedCourse = await resolveCourseForEnrollment(tablesDB, courseInput);
    if (!resolvedCourse) {
      return actionError("Course not found");
    }

    const { courseId, courseSlug, accessModel, isPublished } = resolvedCourse;
    if (!isPublished) {
      return actionError("Course not available");
    }

    // Block paid courses from free enrollment
    if (accessModel === "paid" || accessModel === "subscription") {
      return actionError("This course requires payment. Please use checkout.", "PAID_COURSE");
    }

    const result = await findOrCreateEnrollment(tablesDB, courseId, user.$id);

    if (result.status === "error") {
      return actionError(result.message);
    }

    revalidatePath("/app/courses");
    revalidatePath("/app/dashboard");
    revalidateEach(getCourseDetailPaths(courseId, courseSlug));
    return actionSuccess();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to enroll in course";
    console.error("[Enrollment] Failed to create enrollment:", message);
    return actionError(message);
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

// ── Admin: Manual Enroll ──────────────────────────────────────────────────

export async function adminEnrollAction(formData: FormData): Promise<ActionResult> {
  await requireRole(["admin"]);

  const userId = String(formData.get("userId") ?? "").trim();
  const courseId = String(formData.get("courseId") ?? "").trim();
  if (!userId || !courseId) {
    return actionError("Missing userId or courseId");
  }
  const { tablesDB } = await createAdminClient();

  const result = await findOrCreateEnrollment(tablesDB, courseId, userId);

  if (result.status === "already_active") {
    return actionError("Student is already enrolled in this course");
  }

  if (result.status === "error") {
    return actionError(result.message);
  }

  revalidatePath("/admin/students");
  revalidatePath("/admin/courses");
  revalidatePath("/app/courses");
  revalidatePath("/app/dashboard");
  const course = await getCourseRow(courseId);
  revalidateEach(
    getCourseDetailPaths(courseId, typeof course?.slug === "string" ? course.slug : "")
  );
  return actionSuccess();
}

// ── Admin: Unenroll ───────────────────────────────────────────────────────

export async function adminUnenrollAction(formData: FormData): Promise<ActionResult> {
  await requireRole(["admin"]);

  const enrollmentId = String(formData.get("enrollmentId") ?? "").trim();
  if (!enrollmentId) {
    return actionError("Missing enrollmentId");
  }
  const { tablesDB, storage } = await createAdminClient();

  try {
    const enrollment = (await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.enrollments,
      rowId: enrollmentId,
    }).catch(() => null)) as AnyRow | null;

    if (!enrollment) {
      return actionError("Enrollment not found");
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
        return actionError("Failed to delete enrollment data");
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
        return actionError("Failed to delete enrollment data");
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
    return actionSuccess();
  } catch (error) {
    console.error("[Admin Unenroll]", error instanceof Error ? error.message : error);
    return actionError(error instanceof Error ? error.message : "Failed to unenroll student");
  }
}
