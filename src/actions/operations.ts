"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assignRole, requireRole } from "@/lib/appwrite/auth";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import {
  listAllRows,
  type AnyAppwriteRow,
} from "@/lib/appwrite/row-pagination";
import { createAdminClient } from "@/lib/appwrite/server";
import type { Role } from "@/lib/utils/constants";
import { getBlogDetailPaths, getCourseDetailPaths } from "@/lib/utils/cache-paths";
import { slugify } from "@/lib/utils/format";
import { parseLineSeparatedList } from "@/lib/utils/form-lists";

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

const createCategorySchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().optional(),
  description: z.string().trim().optional(),
  order: z.number().int().min(0).default(0),
});

const updateCategorySchema = z.object({
  categoryId: z.string().trim().min(1),
  name: z.string().trim().min(2),
  slug: z.string().trim().optional(),
  description: z.string().trim().optional(),
  order: z.number().int().min(0).default(0),
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

const applyModerationSchema = z.object({
  targetUserId: z.string().trim().min(1),
  targetUserName: z.string().trim().optional(),
  action: z.enum([
    "warn",
    "mute",
    "timeout",
    "delete_post",
    "pin",
    "unpin",
    "remove_from_chat",
    "flag",
  ]),
  scope: z.enum(["course", "platform"]),
  reason: z.string().trim().min(3),
  duration: z.string().trim().optional(),
  entityType: z.string().trim().optional(),
  entityId: z.string().trim().optional(),
});

const resolveModerationSchema = z.object({
  actionId: z.string().trim().min(1),
});

const upsertSiteCopySchema = z.object({
  key: z.string().trim().min(3),
  title: z.string().trim().optional(),
  body: z.string().trim().optional(),
  payload: z.string().trim().optional(),
  isPublished: z.boolean(),
});

const createBlogPostSchema = z.object({
  title: z.string().trim().min(6),
  slug: z.string().trim().optional(),
  excerpt: z.string().trim().min(12),
  category: z.string().trim().min(2),
  authorName: z.string().trim().optional(),
  publishedAt: z.string().trim().optional(),
  readMinutes: z.number().int().min(1).default(5),
  content: z.string().trim().min(24),
  isPublished: z.boolean(),
});

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

function normalizeDateTime(value: string | undefined): string {
  if (!value) {
    return new Date().toISOString();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }

  return parsed.toISOString();
}

type CourseRowLike = {
  $id: string;
  instructorId?: string;
  slug?: string;
};

type AnyRow = AnyAppwriteRow;

async function getCourseRow(courseId: string): Promise<CourseRowLike | null> {
  const { tablesDB } = await createAdminClient();

  try {
    return (await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.courses,
      rowId: courseId,
    })) as CourseRowLike;
  } catch {
    return null;
  }
}

async function userCanManageCourse(courseId: string, role: Role, userId: string) {
  const course = await getCourseRow(courseId);
  if (!course) {
    return null;
  }

  if (role === "admin") {
    return course;
  }

  return course.instructorId === userId ? course : null;
}

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

function revalidateEach(paths: string[]): void {
  for (const path of paths) {
    revalidatePath(path);
  }
}

export async function updateUserRoleAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);

  const parsed = updateUserRoleSchema.safeParse({
    userId: String(formData.get("userId") ?? ""),
    role: String(formData.get("role") ?? ""),
  });

  if (!parsed.success) {
    return;
  }

  await assignRole(parsed.data.userId, parsed.data.role);

  revalidatePath("/admin/users");
}

export async function updateCourseVisibilityAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);

  const parsed = updateCourseVisibilitySchema.safeParse({
    courseId: String(formData.get("courseId") ?? ""),
    isPublished: parseBoolean(formData.get("isPublished"), false),
    isFeatured: parseBoolean(formData.get("isFeatured"), false),
  });

  if (!parsed.success) {
    return;
  }

  const course = await getCourseRow(parsed.data.courseId);
  if (!course) {
    return;
  }

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

  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  revalidatePath("/");
  revalidateEach(getCourseDetailPaths(parsed.data.courseId, course.slug));
}

export async function createCategoryAction(formData: FormData): Promise<void> {
  const { user } = await requireRole(["admin", "instructor"]);

  const parsed = createCategorySchema.safeParse({
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? "") || undefined,
    description: String(formData.get("description") ?? "") || undefined,
    order: parseInteger(formData.get("order"), 0),
  });

  if (!parsed.success) {
    return;
  }

  const { tablesDB } = await createAdminClient();
  const baseSlug = slugify(parsed.data.slug || parsed.data.name) || `category-${Date.now()}`;

  let created = false;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;

    try {
      await tablesDB.createRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.categories,
        rowId: ID.unique(),
        data: {
          name: parsed.data.name,
          slug,
          description: parsed.data.description,
          order: parsed.data.order,
          createdBy: user.$id,
        },
      });

      created = true;
      break;
    } catch (error) {
      const appwriteError = error as { code?: number };
      if (appwriteError.code !== 409) {
        throw error;
      }
    }
  }

  if (!created) {
    return;
  }

  revalidatePath("/admin/categories");
  revalidatePath("/instructor/categories");
  revalidatePath("/courses");
}

export async function updateCategoryAction(formData: FormData): Promise<void> {
  await requireRole(["admin", "instructor"]);

  const parsed = updateCategorySchema.safeParse({
    categoryId: String(formData.get("categoryId") ?? ""),
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? "") || undefined,
    description: String(formData.get("description") ?? "") || undefined,
    order: parseInteger(formData.get("order"), 0),
  });

  if (!parsed.success) {
    return;
  }

  const { tablesDB } = await createAdminClient();
  const normalizedSlug =
    slugify(parsed.data.slug || parsed.data.name) ||
    `category-${parsed.data.categoryId.slice(0, 8)}`;

  await tablesDB.updateRow({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.tables.categories,
    rowId: parsed.data.categoryId,
    data: {
      name: parsed.data.name,
      slug: normalizedSlug,
      description: parsed.data.description,
      order: parsed.data.order,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/instructor/categories");
  revalidatePath("/courses");
}

export async function updateInstructorCourseAction(formData: FormData): Promise<void> {
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
    return;
  }

  const course = await userCanManageCourse(parsed.data.courseId, role, user.$id);
  if (!course) {
    return;
  }

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

  revalidatePath("/instructor");
  revalidatePath("/instructor/courses");
  revalidatePath(`/instructor/courses/${parsed.data.courseId}`);
  revalidatePath(`/instructor/courses/${parsed.data.courseId}/curriculum`);
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  revalidateEach(getCourseDetailPaths(parsed.data.courseId, course.slug));
}

export async function createCurriculumModuleAction(formData: FormData): Promise<void> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const parsed = createModuleSchema.safeParse({
    courseId: String(formData.get("courseId") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? "") || undefined,
    order: parseInteger(formData.get("order"), 0),
  });

  if (!parsed.success) {
    return;
  }

  const course = await userCanManageCourse(parsed.data.courseId, role, user.$id);
  if (!course) {
    return;
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

  revalidatePath("/instructor");
  revalidatePath("/instructor/courses");
  revalidatePath(`/instructor/courses/${parsed.data.courseId}`);
  revalidatePath(`/instructor/courses/${parsed.data.courseId}/curriculum`);
  revalidateEach(getCourseDetailPaths(parsed.data.courseId, course.slug));
}

export async function createCurriculumLessonAction(formData: FormData): Promise<void> {
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
    return;
  }

  const course = await userCanManageCourse(parsed.data.courseId, role, user.$id);
  if (!course) {
    return;
  }

  const { tablesDB } = await createAdminClient();

  try {
    const moduleRow = (await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.modules,
      rowId: parsed.data.moduleId,
    })) as { courseId?: string };

    if (moduleRow.courseId !== parsed.data.courseId) {
      return;
    }
  } catch {
    return;
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

  revalidatePath("/instructor");
  revalidatePath("/instructor/courses");
  revalidatePath(`/instructor/courses/${parsed.data.courseId}`);
  revalidatePath(`/instructor/courses/${parsed.data.courseId}/curriculum`);
  revalidateEach(getCourseDetailPaths(parsed.data.courseId, course.slug));
}

export async function updateCurriculumModuleAction(formData: FormData): Promise<void> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const parsed = updateModuleSchema.safeParse({
    moduleId: String(formData.get("moduleId") ?? ""),
    courseId: String(formData.get("courseId") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? "") || undefined,
    order: parseInteger(formData.get("order"), 0),
  });

  if (!parsed.success) {
    return;
  }

  const course = await userCanManageCourse(parsed.data.courseId, role, user.$id);
  if (!course) {
    return;
  }

  const { tablesDB } = await createAdminClient();

  try {
    const moduleRow = (await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.modules,
      rowId: parsed.data.moduleId,
    })) as { courseId?: string };

    if (moduleRow.courseId !== parsed.data.courseId) {
      return;
    }
  } catch {
    return;
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

  revalidatePath("/instructor");
  revalidatePath("/instructor/courses");
  revalidatePath(`/instructor/courses/${parsed.data.courseId}`);
  revalidatePath(`/instructor/courses/${parsed.data.courseId}/curriculum`);
  revalidateEach(getCourseDetailPaths(parsed.data.courseId, course.slug));
}

export async function updateCurriculumLessonAction(formData: FormData): Promise<void> {
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
    return;
  }

  const course = await userCanManageCourse(parsed.data.courseId, role, user.$id);
  if (!course) {
    return;
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
      return;
    }
  } catch {
    return;
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

  revalidatePath("/instructor");
  revalidatePath("/instructor/courses");
  revalidatePath(`/instructor/courses/${parsed.data.courseId}`);
  revalidatePath(`/instructor/courses/${parsed.data.courseId}/curriculum`);
  revalidateEach(getCourseDetailPaths(parsed.data.courseId, course.slug));
}

export async function applyModerationActionAction(formData: FormData): Promise<void> {
  const { user } = await requireRole(["admin", "moderator"]);

  const parsed = applyModerationSchema.safeParse({
    targetUserId: String(formData.get("targetUserId") ?? ""),
    targetUserName: String(formData.get("targetUserName") ?? "") || undefined,
    action: String(formData.get("action") ?? "warn"),
    scope: String(formData.get("scope") ?? "platform"),
    reason: String(formData.get("reason") ?? ""),
    duration: String(formData.get("duration") ?? "") || undefined,
    entityType: String(formData.get("entityType") ?? "") || undefined,
    entityId: String(formData.get("entityId") ?? "") || undefined,
  });

  if (!parsed.success) {
    return;
  }

  if (parsed.data.targetUserId === user.$id) {
    return;
  }

  const entityType = parsed.data.entityType;
  const entityId = parsed.data.entityId;
  const isThreadAction =
    typeof entityType === "string" &&
    entityType.toLowerCase().includes("thread") &&
    typeof entityId === "string" &&
    entityId.length > 0;

  if ((parsed.data.action === "pin" || parsed.data.action === "unpin") && !isThreadAction) {
    return;
  }

  const { tablesDB, users } = await createAdminClient();

  let targetUserName = parsed.data.targetUserName || parsed.data.targetUserId;
  try {
    const targetUser = await users.get({ userId: parsed.data.targetUserId });
    targetUserName = targetUser.name || targetUser.email || targetUserName;
  } catch {
    // Fall back to the submitted display name when the user record is unavailable.
  }

  await tablesDB.createRow({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.tables.moderationActions,
    rowId: ID.unique(),
    data: {
      moderatorId: user.$id,
      moderatorName: user.name,
      targetUserId: parsed.data.targetUserId,
      targetUserName,
      action: parsed.data.action,
      scope: parsed.data.scope,
      reason: parsed.data.reason,
      duration: parsed.data.duration || "",
      entityType: parsed.data.entityType || "",
      entityId: parsed.data.entityId || "",
      createdAt: new Date().toISOString(),
      revertedBy: "",
    },
  });

  if (isThreadAction && (parsed.data.action === "pin" || parsed.data.action === "unpin")) {
    try {
      await tablesDB.updateRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.forumThreads,
        rowId: entityId,
        data: {
          isPinned: parsed.data.action === "pin",
        },
      });
    } catch {
      // Ignore thread pin sync failures and keep moderation action record.
    }
  }

  revalidatePath("/moderator/reports");
  revalidatePath("/moderator");
  revalidatePath("/moderator/community");
  revalidatePath("/moderator/students");
  revalidatePath("/admin");
  revalidatePath("/admin/moderation");
}

export async function resolveModerationActionAction(formData: FormData): Promise<void> {
  const { user } = await requireRole(["admin", "moderator"]);

  const parsed = resolveModerationSchema.safeParse({
    actionId: String(formData.get("actionId") ?? ""),
  });

  if (!parsed.success) {
    return;
  }

  const { tablesDB } = await createAdminClient();

  await tablesDB.updateRow({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.tables.moderationActions,
    rowId: parsed.data.actionId,
    data: {
      revertedBy: user.$id,
      revertedAt: new Date().toISOString(),
    },
  });

  revalidatePath("/moderator/reports");
  revalidatePath("/moderator");
  revalidatePath("/moderator/students");
  revalidatePath("/admin");
  revalidatePath("/admin/moderation");
}

export async function upsertSiteCopyAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);

  const parsed = upsertSiteCopySchema.safeParse({
    key: String(formData.get("key") ?? ""),
    title: String(formData.get("title") ?? "") || undefined,
    body: String(formData.get("body") ?? "") || undefined,
    payload: String(formData.get("payload") ?? "") || undefined,
    isPublished: parseBoolean(formData.get("isPublished"), true),
  });

  if (!parsed.success) {
    return;
  }

  const { tablesDB } = await createAdminClient();
  const now = new Date().toISOString();

  const existing = await tablesDB.listRows({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.tables.siteCopy,
    queries: [Query.equal("key", [parsed.data.key]), Query.limit(1)],
  });

  const row = existing.rows[0] as { $id: string } | undefined;

  if (row) {
    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.siteCopy,
      rowId: row.$id,
      data: {
        title: parsed.data.title,
        body: parsed.data.body,
        payload: parsed.data.payload,
        updatedAt: now,
        isPublished: parsed.data.isPublished,
      },
    });
  } else {
    await tablesDB.createRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.siteCopy,
      rowId: ID.unique(),
      data: {
        key: parsed.data.key,
        title: parsed.data.title,
        body: parsed.data.body,
        payload: parsed.data.payload,
        updatedAt: now,
        isPublished: parsed.data.isPublished,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/courses");
  revalidatePath("/blog");
  revalidatePath("/admin/marketing");
}

export async function createBlogPostAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);

  const parsed = createBlogPostSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? "") || undefined,
    excerpt: String(formData.get("excerpt") ?? ""),
    category: String(formData.get("category") ?? ""),
    authorName: String(formData.get("authorName") ?? "") || undefined,
    publishedAt: String(formData.get("publishedAt") ?? "") || undefined,
    readMinutes: parseInteger(formData.get("readMinutes"), 5),
    content: String(formData.get("content") ?? ""),
    isPublished: parseBoolean(formData.get("isPublished"), true),
  });

  if (!parsed.success) {
    return;
  }

  const { tablesDB } = await createAdminClient();
  const baseSlug = slugify(parsed.data.slug || parsed.data.title) || `post-${Date.now()}`;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;

    try {
      await tablesDB.createRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.blogPosts,
        rowId: ID.unique(),
        data: {
          slug,
          title: parsed.data.title,
          excerpt: parsed.data.excerpt,
          category: parsed.data.category,
          authorName: parsed.data.authorName || "Team",
          publishedAt: normalizeDateTime(parsed.data.publishedAt),
          readMinutes: parsed.data.readMinutes,
          content: parsed.data.content,
          isPublished: parsed.data.isPublished,
        },
      });

      revalidatePath("/blog");
      revalidatePath("/admin/marketing");
      revalidateEach(getBlogDetailPaths(slug));
      return;
    } catch (error) {
      const appwriteError = error as { code?: number };
      if (appwriteError.code !== 409) {
        throw error;
      }
    }
  }
}

// ── Update Blog Post ──────────────────────────────────────────────────────

export async function updateBlogPostAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);

  const postId = String(formData.get("postId") ?? "");
  if (!postId) return;

  const { tablesDB } = await createAdminClient();
  const existingPost = (await tablesDB.getRow({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.tables.blogPosts,
    rowId: postId,
  }).catch(() => null)) as AnyRow | null;
  if (!existingPost) return;

  const data: Record<string, unknown> = {};

  const title = String(formData.get("title") ?? "").trim();
  if (title) data.title = title;

  const excerpt = String(formData.get("excerpt") ?? "").trim();
  if (excerpt) data.excerpt = excerpt;

  const content = String(formData.get("content") ?? "").trim();
  if (content) data.content = content;

  const category = String(formData.get("category") ?? "").trim();
  if (category) data.category = category;

  const isPublishedRaw = formData.get("isPublished");
  if (isPublishedRaw !== null) {
    data.isPublished = parseBoolean(isPublishedRaw, true);
  }

  if (Object.keys(data).length === 0) return;

  try {
    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.blogPosts,
      rowId: postId,
      data,
    });

    revalidatePath("/blog");
    revalidatePath("/admin/marketing");
    revalidateEach(getBlogDetailPaths(String(existingPost.slug ?? "")));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Failed to update blog post.");
  }
}

// ── Delete Blog Post ──────────────────────────────────────────────────────

export async function deleteBlogPostAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);

  const postId = String(formData.get("postId") ?? "");
  if (!postId) return;

  const { tablesDB } = await createAdminClient();
  const existingPost = (await tablesDB.getRow({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.tables.blogPosts,
    rowId: postId,
  }).catch(() => null)) as AnyRow | null;
  if (!existingPost) return;

  try {
    await tablesDB.deleteRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.blogPosts,
      rowId: postId,
    });

    revalidatePath("/blog");
    revalidatePath("/admin/marketing");
    revalidateEach(getBlogDetailPaths(String(existingPost.slug ?? "")));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Failed to delete blog post.");
  }
}

// ── Get Blog Posts for Admin ──────────────────────────────────────────────

type AdminBlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  content: string;
  isPublished: boolean;
  publishedAt: string;
};

export async function getAdminBlogPosts(): Promise<AdminBlogPost[]> {
  await requireRole(["admin"]);
  const { tablesDB } = await createAdminClient();

  try {
    const rows = await listAllRows<AnyRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.blogPosts,
      [Query.orderDesc("$createdAt")]
    );

    return rows.map((row) => {
      return {
        id: row.$id,
        title: String(row.title ?? ""),
        slug: String(row.slug ?? ""),
        excerpt: String(row.excerpt ?? ""),
        category: String(row.category ?? ""),
        content: String(row.content ?? ""),
        isPublished: Boolean(row.isPublished),
        publishedAt: String(row.publishedAt ?? ""),
      };
    });
  } catch {
    return [];
  }
}
