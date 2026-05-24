"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";

import { requireAuth, requireRole } from "@/lib/appwrite/auth";
import { getCourseRow } from "@/lib/appwrite/access";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { executeDeletePlan } from "@/lib/appwrite/delete-plan";
import { listAllRows, type AnyAppwriteRow } from "@/lib/appwrite/row-pagination";
import { createAdminClient } from "@/lib/appwrite/server";
import { actionSuccess, actionError } from "@/lib/errors/action-result";
import { getCourseDetailPaths } from "@/lib/utils/cache-paths";

type AnyRow = AnyAppwriteRow;

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

// ── Enroll in Course ────────────────────────────────────────────────────────

export async function enrollInCourseAction(
  formData: FormData
): Promise<void> {
  let resolvedCourseForRevalidation:
    | { courseId: string; courseSlug: string }
    | null = null;

  try {
    const user = await requireAuth();
    const courseInput = String(formData.get("courseId") ?? "").trim();
    if (!courseInput) {
      actionError("Course ID is required");
      return;
    }
    const { tablesDB } = await createAdminClient();
    const resolvedCourse = await resolveCourseForEnrollment(tablesDB, courseInput);
    if (!resolvedCourse) {
      actionError("Course not found");
      return;
    }

    const { courseId, courseSlug, accessModel, isPublished } = resolvedCourse;
    resolvedCourseForRevalidation = { courseId, courseSlug };
    if (!isPublished) {
      actionError("Course not available");
      return;
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
        actionSuccess();
        return;
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
        actionSuccess();
        return;
      }
    } catch {
      // Continue to enroll
    }

    // Block paid courses from free enrollment
    if (accessModel === "paid" || accessModel === "subscription") {
      actionError("This course requires payment. Please use checkout.", "PAID_COURSE");
      return;
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
    actionSuccess();
    return;
  } catch (error) {
    const appwriteError = error as { code?: number };
    if (appwriteError?.code === 409 && resolvedCourseForRevalidation) {
      revalidatePath("/app/courses");
      revalidatePath("/app/dashboard");
      revalidateEach(
        getCourseDetailPaths(
          resolvedCourseForRevalidation.courseId,
          resolvedCourseForRevalidation.courseSlug
        )
      );
      actionSuccess();
      return;
    }

    const message = error instanceof Error ? error.message : "Failed to enroll in course";
    console.error("[Enrollment] Failed to create enrollment:", message);
    actionError(message);
    return;
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

export async function adminEnrollAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);

  const userId = String(formData.get("userId") ?? "").trim();
  const courseId = String(formData.get("courseId") ?? "").trim();
  if (!userId || !courseId) {
    actionError("Missing userId or courseId");
    return;
  }
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
    if (existingRow && isActiveEnrollmentRow(existingRow)) {
      actionError("Student is already enrolled in this course");
      return;
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

      revalidatePath("/admin/students");
      revalidatePath("/admin/courses");
      revalidatePath("/app/courses");
      revalidatePath("/app/dashboard");
      const course = await getCourseRow(courseId);
      revalidateEach(
        getCourseDetailPaths(courseId, typeof course?.slug === "string" ? course.slug : "")
      );
      actionSuccess();
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
    actionSuccess();
    return;
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
      actionSuccess();
      return;
    }

    console.error("[Admin Enroll]", error instanceof Error ? error.message : error);
    actionError(error instanceof Error ? error.message : "Failed to create enrollment");
    return;
  }
}

// ── Admin: Unenroll ───────────────────────────────────────────────────────

export async function adminUnenrollAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);

  const enrollmentId = String(formData.get("enrollmentId") ?? "").trim();
  if (!enrollmentId) {
    actionError("Missing enrollmentId");
    return;
  }
  const { tablesDB, storage } = await createAdminClient();

  try {
    const enrollment = (await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.enrollments,
      rowId: enrollmentId,
    }).catch(() => null)) as AnyRow | null;

    if (!enrollment) {
      actionError("Enrollment not found");
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
        actionError("Failed to delete enrollment data");
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
        actionError("Failed to delete enrollment data");
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
    actionSuccess();
    return;
  } catch (error) {
    console.error("[Admin Unenroll]", error instanceof Error ? error.message : error);
    actionError(error instanceof Error ? error.message : "Failed to unenroll student");
    return;
  }
}
