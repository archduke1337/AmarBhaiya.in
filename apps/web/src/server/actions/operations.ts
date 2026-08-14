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
  isFeatured: z.boolean(),
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
  await requireRole(["admin"]);

  const parsed = updateUserRoleSchema.safeParse({
    userId: String(formData.get("userId") ?? ""),
    role: String(formData.get("role") ?? ""),
  });

  if (!parsed.success) {
    return actionError("Invalid input: userId and role are required");
  }

  await assignRole(parsed.data.userId, parsed.data.role);

  revalidatePath("/admin/users");

  return actionSuccess();
}

export async function updateCourseVisibilityAction(formData: FormData): Promise<ActionResult> {
  await requireRole(["admin"]);

  const parsed = updateCourseVisibilitySchema.safeParse({
    courseId: String(formData.get("courseId") ?? ""),
    isPublished: parseBoolean(formData.get("isPublished"), false),
    isFeatured: parseBoolean(formData.get("isFeatured"), false),
  });

  if (!parsed.success) {
    return actionError("Invalid input: courseId, isPublished, and isFeatured are required");
  }

  const course = await getCourseRow(parsed.data.courseId);
  if (!course) {
    return actionError("Course not found");
  }

  try {
    const { tablesDB } = await createAdminClient();

    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.courses,
      rowId: parsed.data.courseId,
      data: {
        isPublished: parsed.data.isPublished,
        isFeatured: parsed.data.isFeatured,
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
