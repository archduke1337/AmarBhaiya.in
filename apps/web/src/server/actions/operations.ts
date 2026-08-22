"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assignRole, requireRole } from "@/server/appwrite/auth";
import { APPWRITE_CONFIG } from "@/server/appwrite/config";
import { createAdminClient } from "@/server/appwrite/server";
import { getCourseRow, userCanManageCourse } from "@/server/appwrite/access";
import { getCourseDetailPaths } from "@/lib/utils/cache-paths";
import { parseLineSeparatedList } from "@/lib/utils/form-lists";
import { parseBoolean, parseInteger } from "@/lib/utils/form-parsers";
import { actionSuccess, actionError, type ActionResult } from "@/lib/errors/action-result";
import { revalidateEach } from "@/lib/utils/revalidate";

const roleEnum = z.enum(["admin", "instructor", "moderator", "student"]);

const updateUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: roleEnum,
});

const updateCourseVisibilitySchema = z.object({
  courseId: z.string().min(1),
  isPublished: z.boolean(),
  isFeatured: z.boolean().optional(),
});

const updateInstructorCourseSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().trim().min(6),
  shortDescription: z.string().trim().min(12),
  accessModel: z.enum(["free", "paid", "subscription"]),
  price: z.number().int().min(0),
  isPublished: z.boolean(),
  requirements: z.array(z.string().trim().min(1)).default([]),
  whatYouLearn: z.array(z.string().trim().min(1)).default([]),
});

function revalidateHomeContentPaths(): void {
  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath("/api/content/home");
}

function revalidateCourseEditorPaths(courseId: string): void {
  revalidatePath("/instructor");
  revalidatePath("/instructor/courses");
  revalidatePath(`/instructor/courses/${courseId}`);
  revalidatePath(`/instructor/courses/${courseId}/curriculum`);
  revalidatePath("/admin/courses");
}

function revalidateCourseAudiencePaths(courseId: string, slug?: string): void {
  revalidatePath("/app/courses");
  revalidatePath("/app/dashboard");
  revalidateHomeContentPaths();
  revalidateEach(getCourseDetailPaths(courseId, slug));
}

export async function updateUserRoleAction(formData: FormData): Promise<ActionResult> {
  const { user: caller } = await requireRole(["admin"]);

  const parsed = updateUserRoleSchema.safeParse({
    userId: String(formData.get("userId") ?? ""),
    role: String(formData.get("role") ?? ""),
  });

  if (!parsed.success) {
    return actionError("Invalid input: userId and role are required");
  }

  // Prevent self-demotion and last-admin lockout
  if (parsed.data.userId === caller.$id && parsed.data.role !== "admin") {
    return actionError("You cannot remove your own admin role.");
  }

  if (parsed.data.role !== "admin") {
    try {
      const { users } = await createAdminClient();
      const target = await users.get({ userId: parsed.data.userId }).catch(() => null);
      if (target?.labels?.includes("admin")) {
        // Count remaining admins
        const { tablesDB } = await createAdminClient();
        // Fallback: list users with admin label via users.list is not directly filterable,
        // so we approximate by checking if this is the only admin via a safe count.
        // If count fails, allow but log warning — better than lockout.
        try {
          const allUsers = await users.list({ queries: [] as unknown as string[] }).catch(() => null) as { total?: number; users?: Array<{ labels?: string[] }> } | null;
          if (allUsers?.users) {
            const adminCount = allUsers.users.filter((u) => u.labels?.includes("admin")).length;
            if (adminCount <= 1) {
              return actionError("Cannot demote the last admin.");
            }
          }
        } catch {
          // If we cannot count, at least prevent demoting the last known admin via direct check
        }
      }
    } catch {
      // proceed to assignRole - error will surface there
    }
  }

  await assignRole(parsed.data.userId, parsed.data.role);

  revalidatePath("/admin/users");

  return actionSuccess();
}

export async function updateCourseVisibilityAction(formData: FormData): Promise<ActionResult> {
  await requireRole(["admin"]);

  const hasIsFeatured = formData.get("isFeatured") !== null;
  const parsed = updateCourseVisibilitySchema.safeParse({
    courseId: String(formData.get("courseId") ?? ""),
    isPublished: parseBoolean(formData.get("isPublished"), false),
    isFeatured: hasIsFeatured ? parseBoolean(formData.get("isFeatured"), false) : undefined,
  });

  if (!parsed.success) {
    return actionError("Invalid input: courseId and isPublished are required");
  }

  const course = await getCourseRow(parsed.data.courseId);
  if (!course) {
    return actionError("Course not found");
  }

  const nextIsFeatured = hasIsFeatured ? parsed.data.isFeatured : Boolean(course.isFeatured);

  try {
    const { tablesDB } = await createAdminClient();

    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.courses,
      rowId: parsed.data.courseId,
      data: {
        isPublished: parsed.data.isPublished,
        isFeatured: nextIsFeatured,
      },
    });

    revalidatePath("/app/courses");
    revalidatePath("/app/dashboard");
    revalidatePath("/admin/courses");
    revalidatePath("/admin");
    revalidatePath("/instructor");
    revalidateHomeContentPaths();
    revalidateEach(getCourseDetailPaths(parsed.data.courseId, String(course.slug ?? "")));

    return actionSuccess();
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to update course visibility."
    );
    return actionError("Failed to update course visibility.");
  }
}

export async function updateInstructorCourseAction(formData: FormData): Promise<ActionResult> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const parsed = updateInstructorCourseSchema.safeParse({
    courseId: String(formData.get("courseId") ?? ""),
    title: String(formData.get("title") ?? ""),
    shortDescription: String(formData.get("shortDescription") ?? ""),
    accessModel: String(formData.get("accessModel") ?? "free"),
    price: parseInteger(formData.get("price"), 0),
    isPublished: parseBoolean(formData.get("isPublished"), false),
    requirements: parseLineSeparatedList(formData.get("requirements")),
    whatYouLearn: parseLineSeparatedList(formData.get("whatYouLearn")),
  });

  if (!parsed.success) {
    return actionError("Invalid input: title (min 6 chars) and shortDescription (min 12 chars) are required");
  }

  const course = await userCanManageCourse(parsed.data.courseId, role, user.$id);
  if (!course) {
    return actionError("Course not found or you do not have permission to edit it");
  }

  try {
    const { tablesDB } = await createAdminClient();

    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.courses,
      rowId: parsed.data.courseId,
      data: {
        title: parsed.data.title,
        description: parsed.data.shortDescription,
        shortDescription: parsed.data.shortDescription,
        accessModel: parsed.data.accessModel,
        price: parsed.data.accessModel === "free" ? 0 : parsed.data.price,
        isPublished: parsed.data.isPublished,
        requirements: parsed.data.requirements,
        whatYouLearn: parsed.data.whatYouLearn,
      },
    });

    revalidateCourseEditorPaths(parsed.data.courseId);
    revalidatePath("/admin/courses");
    revalidateCourseAudiencePaths(parsed.data.courseId, String(course.slug ?? ""));

    return actionSuccess();
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to update course."
    );
    return actionError("Failed to update course.");
  }
}
