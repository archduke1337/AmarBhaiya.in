"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/appwrite/auth";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { getCourseDetailPaths } from "@/lib/utils/cache-paths";
import { listAllRows, type AnyAppwriteRow } from "@/lib/appwrite/row-pagination";
import { userCanManageCourse } from "@/lib/appwrite/access";
import { actionSuccess, actionError, type ActionResult } from "@/lib/errors/action-result";
import { revalidateEach } from "@/lib/utils/revalidate";

function parseBoolean(value: FormDataEntryValue | null, fallback = false): boolean {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.toLowerCase().trim();
  return normalized === "true" || normalized === "1" || normalized === "on";
}

function parseInteger(value: FormDataEntryValue | null, fallback = 0): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.round(numeric);
}

type AnyRow = AnyAppwriteRow;

async function updateCourseLessonStats(
  tablesDB: Awaited<ReturnType<typeof createAdminClient>>["tablesDB"],
  courseId: string
): Promise<void> {
  const lessons = await listAllRows<AnyRow>(tablesDB, APPWRITE_CONFIG.tables.lessons, [
    Query.equal("courseId", [courseId]),
  ]);

  const totalDuration = lessons.reduce((sum, row) => {
    const duration = Number(row.duration ?? 0);
    return sum + (Number.isFinite(duration) ? duration : 0);
  }, 0);

  await tablesDB.updateRow({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.tables.courses,
    rowId: courseId,
    data: {
      totalLessons: lessons.length,
      totalDuration,
    },
  });
}

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

const createModuleSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().trim().min(4),
  description: z.string().trim().optional(),
  order: z.number().int().min(0).default(0),
});

const createLessonSchema = z.object({
  courseId: z.string().min(1),
  moduleId: z.string().min(1),
  title: z.string().trim().min(4),
  description: z.string().trim().optional(),
  durationSeconds: z.number().int().min(0).default(0),
  order: z.number().int().min(0).default(0),
  isFree: z.boolean(),
  isFreePreview: z.boolean(),
});

const updateModuleSchema = z.object({
  moduleId: z.string().trim().min(1),
  courseId: z.string().trim().min(1),
  title: z.string().trim().min(4),
  description: z.string().trim().optional(),
  order: z.number().int().min(0).default(0),
});

const updateLessonSchema = z.object({
  lessonId: z.string().trim().min(1),
  moduleId: z.string().trim().min(1),
  courseId: z.string().trim().min(1),
  title: z.string().trim().min(4),
  description: z.string().trim().optional(),
  durationSeconds: z.number().int().min(0).default(0),
  order: z.number().int().min(0).default(0),
  isFree: z.boolean(),
  isFreePreview: z.boolean(),
});

export async function createCurriculumModuleAction(formData: FormData): Promise<ActionResult> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const parsed = createModuleSchema.safeParse({
    courseId: String(formData.get("courseId") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? "") || undefined,
    order: parseInteger(formData.get("order"), 0),
  });

  if (!parsed.success) {
    return actionError("Invalid input: title (min 4 chars) is required");
  }

  const course = await userCanManageCourse(parsed.data.courseId, role, user.$id);
  if (!course) {
    return actionError("Course not found or you do not have permission to edit it");
  }

  const { tablesDB } = await createAdminClient();

  await tablesDB.createRow({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.tables.modules,
    rowId: ID.unique(),
    data: {
      courseId: parsed.data.courseId,
      title: parsed.data.title,
      description: parsed.data.description,
      order: parsed.data.order,
    },
  });

  revalidateCourseEditorPaths(parsed.data.courseId);
  revalidateEach(getCourseDetailPaths(parsed.data.courseId, String(course.slug ?? "")));

  return actionSuccess();
}

export async function createCurriculumLessonAction(formData: FormData): Promise<ActionResult> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const parsed = createLessonSchema.safeParse({
    courseId: String(formData.get("courseId") ?? ""),
    moduleId: String(formData.get("moduleId") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? "") || undefined,
    durationSeconds: parseInteger(formData.get("durationSeconds"), 0),
    order: parseInteger(formData.get("order"), 0),
    isFree: parseBoolean(formData.get("isFree"), false),
    isFreePreview: parseBoolean(formData.get("isFreePreview"), false),
  });

  if (!parsed.success) {
    return actionError("Invalid input: title (min 4 chars) is required");
  }

  const course = await userCanManageCourse(parsed.data.courseId, role, user.$id);
  if (!course) {
    return actionError("Course not found or you do not have permission to edit it");
  }

  const { tablesDB } = await createAdminClient();

  try {
    const moduleRow = (await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.modules,
      rowId: parsed.data.moduleId,
    })) as { courseId?: string };

    if (moduleRow.courseId !== parsed.data.courseId) {
      return actionError("Module does not belong to the specified course");
    }
  } catch {
    return actionError("Module not found");
  }

  await tablesDB.createRow({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.tables.lessons,
    rowId: ID.unique(),
    data: {
      moduleId: parsed.data.moduleId,
      courseId: parsed.data.courseId,
      title: parsed.data.title,
      description: parsed.data.description,
      videoFileId: "",
      duration: parsed.data.durationSeconds,
      order: parsed.data.order,
      isFree: parsed.data.isFree,
      isFreePreview: parsed.data.isFreePreview,
    },
  });

  await updateCourseLessonStats(tablesDB, parsed.data.courseId);

  revalidateCourseEditorPaths(parsed.data.courseId);
  revalidateCourseAudiencePaths(parsed.data.courseId, String(course.slug ?? ""));

  return actionSuccess();
}

export async function updateCurriculumModuleAction(formData: FormData): Promise<ActionResult> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const parsed = updateModuleSchema.safeParse({
    moduleId: String(formData.get("moduleId") ?? ""),
    courseId: String(formData.get("courseId") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? "") || undefined,
    order: parseInteger(formData.get("order"), 0),
  });

  if (!parsed.success) {
    return actionError("Invalid input: title (min 4 chars) is required");
  }

  const course = await userCanManageCourse(parsed.data.courseId, role, user.$id);
  if (!course) {
    return actionError("Course not found or you do not have permission to edit it");
  }

  const { tablesDB } = await createAdminClient();

  try {
    const moduleRow = (await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.modules,
      rowId: parsed.data.moduleId,
    })) as { courseId?: string };

    if (moduleRow.courseId !== parsed.data.courseId) {
      return actionError("Module does not belong to the specified course");
    }
  } catch {
    return actionError("Module not found");
  }

  await tablesDB.updateRow({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.tables.modules,
    rowId: parsed.data.moduleId,
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      order: parsed.data.order,
    },
  });

  revalidateCourseEditorPaths(parsed.data.courseId);
  revalidateEach(getCourseDetailPaths(parsed.data.courseId, String(course.slug ?? "")));

  return actionSuccess();
}

export async function updateCurriculumLessonAction(formData: FormData): Promise<ActionResult> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const parsed = updateLessonSchema.safeParse({
    lessonId: String(formData.get("lessonId") ?? ""),
    moduleId: String(formData.get("moduleId") ?? ""),
    courseId: String(formData.get("courseId") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? "") || undefined,
    durationSeconds: parseInteger(formData.get("durationSeconds"), 0),
    order: parseInteger(formData.get("order"), 0),
    isFree: parseBoolean(formData.get("isFree"), false),
    isFreePreview: parseBoolean(formData.get("isFreePreview"), false),
  });

  if (!parsed.success) {
    return actionError("Invalid input: title (min 4 chars) is required");
  }

  const course = await userCanManageCourse(parsed.data.courseId, role, user.$id);
  if (!course) {
    return actionError("Course not found or you do not have permission to edit it");
  }

  const { tablesDB } = await createAdminClient();

  try {
    const lessonRow = (await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.lessons,
      rowId: parsed.data.lessonId,
    })) as { courseId?: string; moduleId?: string };

    if (
      lessonRow.courseId !== parsed.data.courseId ||
      lessonRow.moduleId !== parsed.data.moduleId
    ) {
      return actionError("Lesson does not belong to the specified course or module");
    }
  } catch {
    return actionError("Lesson not found");
  }

  await tablesDB.updateRow({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.tables.lessons,
    rowId: parsed.data.lessonId,
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      duration: parsed.data.durationSeconds,
      order: parsed.data.order,
      isFree: parsed.data.isFree,
      isFreePreview: parsed.data.isFreePreview,
    },
  });

  await updateCourseLessonStats(tablesDB, parsed.data.courseId);

  revalidateCourseEditorPaths(parsed.data.courseId);
  revalidateCourseAudiencePaths(parsed.data.courseId, String(course.slug ?? ""));
  revalidatePath(`/app/learn/${parsed.data.courseId}/${parsed.data.lessonId}`);

  return actionSuccess();
}
