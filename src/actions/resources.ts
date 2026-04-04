"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/appwrite/auth";
import {
  userCanManageCourseResource,
  userCanManageLesson,
  userCanManageResource,
} from "@/lib/appwrite/access";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { parseFiniteNumber } from "@/lib/utils/number";
import { normalizeHttpUrl } from "@/lib/utils/url";

// ── Schema ──────────────────────────────────────────────────────────────────

const createResourceSchema = z.object({
  title: z.string().trim().min(4, "Title must be at least 4 characters.").max(300),
  description: z.string().trim().optional(),
  type: z.enum(["notes", "worksheet", "test_paper", "video", "other"]),
  accessModel: z.enum(["free", "paid"]).default("free"),
  price: z.number().min(0).default(0),
  isPublished: z.boolean().default(false),
});

const courseResourceFieldsSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters.").max(200),
  type: z.enum(["pdf", "link", "file"]).default("file"),
  url: z.string().trim().optional(),
}).superRefine((data, ctx) => {
  if (data.type !== "link") {
    return;
  }

  if (!data.url) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["url"],
      message: "Link resources require a URL.",
    });
    return;
  }

  try {
    if (!normalizeHttpUrl(data.url)) {
      throw new Error("Invalid URL");
    }
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["url"],
      message: "Enter a valid HTTP or HTTPS URL.",
    });
  }
});

const createCourseResourceSchema = courseResourceFieldsSchema.extend({
  lessonId: z.string().trim().min(1, "Lesson is required."),
});

// ── Types ───────────────────────────────────────────────────────────────────

export type StandaloneResource = {
  id: string;
  instructorId: string;
  instructorName: string;
  title: string;
  description: string;
  type: string;
  accessModel: string;
  price: number;
  fileId: string;
  thumbnailId: string;
  downloadCount: number;
  isPublished: boolean;
  tags: string[];
  createdAt: string;
};

export type CourseResourceOption = {
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
};

export type InstructorCourseResource = {
  id: string;
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  title: string;
  type: "pdf" | "link" | "file";
  url: string;
  fileId: string;
};

type AnyRow = Record<string, unknown> & { $id: string };

function chunkValues<T>(values: T[], chunkSize = 20): T[][] {
  if (values.length <= chunkSize) {
    return [values];
  }

  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize));
  }
  return chunks;
}

async function listRowsByFieldValues(
  tableId: string,
  field: string,
  values: string[]
): Promise<AnyRow[]> {
  if (values.length === 0) {
    return [];
  }

  const { tablesDB } = await createAdminClient();
  const rows: AnyRow[] = [];

  for (const chunk of chunkValues(values, 20)) {
    try {
      let offset = 0;

      while (true) {
        const result = await tablesDB.listRows({
          databaseId: APPWRITE_CONFIG.databaseId,
          tableId,
          queries: [
            Query.equal(field, chunk),
            Query.limit(500),
            Query.offset(offset),
          ],
        });

        rows.push(...(result.rows as AnyRow[]));

        if (result.rows.length < 500) {
          break;
        }

        offset += result.rows.length;
      }
    } catch {
      // Skip failing chunks
    }
  }

  return rows;
}

async function listAllRows(
  tableId: string,
  queries: string[]
): Promise<AnyRow[]> {
  const { tablesDB } = await createAdminClient();
  const rows: AnyRow[] = [];
  let offset = 0;

  while (true) {
    const result = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId,
      queries: [...queries, Query.limit(500), Query.offset(offset)],
    });

    rows.push(...(result.rows as AnyRow[]));

    if (result.rows.length < 500) {
      break;
    }

    offset += result.rows.length;
  }

  return rows;
}

// ── Create ──────────────────────────────────────────────────────────────────

export async function createStandaloneResourceAction(
  formData: FormData
): Promise<void> {
  const { user } = await requireRole(["admin", "instructor"]);

  const parsed = createResourceSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? "").trim() || undefined,
    type: String(formData.get("type") ?? "notes"),
    accessModel: String(formData.get("accessModel") ?? "free"),
    price: Number(formData.get("price") ?? 0),
    isPublished: formData.get("isPublished") === "on",
  });

  if (!parsed.success) return;

  try {
    const { tablesDB } = await createAdminClient();

    await tablesDB.createRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.standaloneResources,
      rowId: ID.unique(),
      data: {
        instructorId: user.$id,
        instructorName: user.name,
        title: parsed.data.title,
        description: parsed.data.description || "",
        type: parsed.data.type,
        accessModel: parsed.data.accessModel,
        price: parsed.data.accessModel === "paid" ? parsed.data.price : 0,
        fileId: "",
        thumbnailId: "",
        downloadCount: 0,
        isPublished: parsed.data.isPublished,
        tags: [],
        createdAt: new Date().toISOString(),
      },
    });

    revalidatePath("/instructor/resources");
    revalidatePath("/admin/courses");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to create resource."
    );
  }
}

// ── Course-Linked Resources ────────────────────────────────────────────────

export async function createCourseResourceAction(
  formData: FormData
): Promise<void> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const parsed = createCourseResourceSchema.safeParse({
    lessonId: String(formData.get("lessonId") ?? ""),
    title: String(formData.get("title") ?? ""),
    type: String(formData.get("type") ?? "file"),
    url: String(formData.get("url") ?? "").trim() || undefined,
  });

  if (!parsed.success) return;

  const lessonContext = await userCanManageLesson(parsed.data.lessonId, role, user.$id);
  if (!lessonContext) return;

  try {
    const { tablesDB } = await createAdminClient();

    await tablesDB.createRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.resources,
      rowId: ID.unique(),
      data: {
        lessonId: lessonContext.lesson.$id,
        title: parsed.data.title,
        fileId: "",
        type: parsed.data.type,
        url:
          parsed.data.type === "link"
            ? normalizeHttpUrl(parsed.data.url) || ""
            : "",
      },
    });

    revalidatePath("/instructor/resources");
    revalidatePath(`/instructor/courses/${lessonContext.course.$id}/curriculum`);
    revalidatePath(`/app/learn/${lessonContext.course.$id}/${lessonContext.lesson.$id}`);
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to create course resource."
    );
  }
}

export async function updateCourseResourceAction(
  formData: FormData
): Promise<void> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const resourceId = String(formData.get("resourceId") ?? "");
  if (!resourceId) return;

  const resourceContext = await userCanManageCourseResource(resourceId, role, user.$id);
  if (!resourceContext) return;

  const parsed = courseResourceFieldsSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    type: String(formData.get("type") ?? "file"),
    url: String(formData.get("url") ?? "").trim() || undefined,
  });

  if (!parsed.success) return;

  const data = {
    title: parsed.data.title,
    type: parsed.data.type,
    url:
      parsed.data.type === "link"
        ? normalizeHttpUrl(parsed.data.url) || ""
        : "",
  };

  try {
    const { tablesDB } = await createAdminClient();

    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.resources,
      rowId: resourceId,
      data,
    });

    revalidatePath("/instructor/resources");
    revalidatePath(`/instructor/courses/${resourceContext.course.$id}/curriculum`);
    revalidatePath(`/app/learn/${resourceContext.course.$id}/${resourceContext.lesson.$id}`);
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to update course resource."
    );
  }
}

export async function deleteCourseResourceAction(
  formData: FormData
): Promise<void> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const resourceId = String(formData.get("resourceId") ?? "");
  if (!resourceId) return;

  const resourceContext = await userCanManageCourseResource(resourceId, role, user.$id);
  if (!resourceContext) return;

  try {
    const { tablesDB, storage } = await createAdminClient();

    const fileId = String(resourceContext.resource.fileId ?? "");
    if (fileId) {
      try {
        await storage.deleteFile({
          bucketId: APPWRITE_CONFIG.buckets.courseResources,
          fileId,
        });
      } catch {
        // Continue even if file cleanup fails
      }
    }

    await tablesDB.deleteRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.resources,
      rowId: resourceId,
    });

    revalidatePath("/instructor/resources");
    revalidatePath(`/instructor/courses/${resourceContext.course.$id}/curriculum`);
    revalidatePath(`/app/learn/${resourceContext.course.$id}/${resourceContext.lesson.$id}`);
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to delete course resource."
    );
  }
}

// ── Update ──────────────────────────────────────────────────────────────────

export async function updateStandaloneResourceAction(
  formData: FormData
): Promise<void> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const resourceId = String(formData.get("resourceId") ?? "");
  if (!resourceId) return;
  if (!(await userCanManageResource(resourceId, role, user.$id))) return;

  const data: Record<string, unknown> = {};

  const title = String(formData.get("title") ?? "").trim();
  if (title) data.title = title;

  const description = String(formData.get("description") ?? "").trim();
  if (formData.has("description")) data.description = description;

  const type = String(formData.get("type") ?? "");
  if (["notes", "worksheet", "test_paper", "video", "other"].includes(type)) {
    data.type = type;
  }

  const accessModel = String(formData.get("accessModel") ?? "");
  if (["free", "paid"].includes(accessModel)) {
    data.accessModel = accessModel;
    if (accessModel === "paid") {
      const price = parseFiniteNumber(formData.get("price"));
      if (price === null || price < 0) return;
      data.price = price;
    } else {
      data.price = 0;
    }
  }

  data.isPublished = formData.get("isPublished") === "on";

  try {
    const { tablesDB } = await createAdminClient();

    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.standaloneResources,
      rowId: resourceId,
      data,
    });

    revalidatePath("/instructor/resources");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to update resource."
    );
  }
}

// ── Delete ──────────────────────────────────────────────────────────────────

export async function deleteStandaloneResourceAction(
  formData: FormData
): Promise<void> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const resourceId = String(formData.get("resourceId") ?? "");
  if (!resourceId) return;

  try {
    const { tablesDB, storage } = await createAdminClient();
    const resource = await userCanManageResource(resourceId, role, user.$id);
    if (!resource) return;

    const fileId = String(resource.fileId ?? "");
    if (fileId) {
      try {
        await storage.deleteFile({
          bucketId: APPWRITE_CONFIG.buckets.resourceFiles,
          fileId,
        });
      } catch {
        // Continue even if file cleanup fails
      }
    }

    await tablesDB.deleteRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.standaloneResources,
      rowId: resourceId,
    });

    revalidatePath("/instructor/resources");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to delete resource."
    );
  }
}

export async function getInstructorCourseResourceOptions(
  scope: { userId: string; role: string }
): Promise<CourseResourceOption[]> {
  try {
    const courseQueries =
      scope.role === "admin"
        ? [Query.orderDesc("$updatedAt")]
        : [
            Query.equal("instructorId", [scope.userId]),
            Query.orderDesc("$updatedAt"),
          ];

    const courseRows = await listAllRows(
      APPWRITE_CONFIG.tables.courses,
      courseQueries
    );
    const courseTitleById = new Map(
      courseRows.map((course) => [course.$id, String(course.title ?? "Untitled course")])
    );
    const courseIds = courseRows.map((course) => course.$id);
    const lessonRows = await listRowsByFieldValues(
      APPWRITE_CONFIG.tables.lessons,
      "courseId",
      courseIds
    );

    return lessonRows
      .sort((left, right) => {
        const leftCourseTitle = courseTitleById.get(String(left.courseId ?? "")) ?? "";
        const rightCourseTitle = courseTitleById.get(String(right.courseId ?? "")) ?? "";
        if (leftCourseTitle !== rightCourseTitle) {
          return leftCourseTitle.localeCompare(rightCourseTitle);
        }

        return Number(left.order ?? 0) - Number(right.order ?? 0);
      })
      .map((lesson) => ({
        courseId: String(lesson.courseId ?? ""),
        courseTitle: courseTitleById.get(String(lesson.courseId ?? "")) ?? "Untitled course",
        lessonId: lesson.$id,
        lessonTitle: String(lesson.title ?? "Untitled lesson"),
      }));
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "Failed to load instructor course resource options."
    );

    return [];
  }
}

export async function getInstructorCourseResources(
  scope: { userId: string; role: string }
): Promise<InstructorCourseResource[]> {
  const lessonOptions = await getInstructorCourseResourceOptions(scope);
  const lessonIds = lessonOptions.map((lesson) => lesson.lessonId);

  if (lessonIds.length === 0) {
    return [];
  }

  const lessonById = new Map(
    lessonOptions.map((lesson) => [
      lesson.lessonId,
      {
        courseId: lesson.courseId,
        courseTitle: lesson.courseTitle,
        lessonTitle: lesson.lessonTitle,
      },
    ])
  );

  const resourceRows = await listRowsByFieldValues(
    APPWRITE_CONFIG.tables.resources,
    "lessonId",
    lessonIds
  );

  return resourceRows
    .map((row) => {
      const lessonId = String(row.lessonId ?? "");
      const lesson = lessonById.get(lessonId);
      if (!lesson) return null;

      return {
        id: row.$id,
        courseId: lesson.courseId,
        courseTitle: lesson.courseTitle,
        lessonId,
        lessonTitle: lesson.lessonTitle,
        title: String(row.title ?? ""),
        type: (String(row.type ?? "file") as "pdf" | "link" | "file"),
        url: String(row.url ?? ""),
        fileId: String(row.fileId ?? ""),
      } satisfies InstructorCourseResource;
    })
    .filter((resource): resource is InstructorCourseResource => resource !== null)
    .sort((left, right) => {
      if (left.courseTitle !== right.courseTitle) {
        return left.courseTitle.localeCompare(right.courseTitle);
      }
      if (left.lessonTitle !== right.lessonTitle) {
        return left.lessonTitle.localeCompare(right.lessonTitle);
      }
      return left.title.localeCompare(right.title);
    });
}

// ── List (for instructor dashboard) ─────────────────────────────────────────

export async function getInstructorResources(
  scope: { userId: string; role: string }
): Promise<StandaloneResource[]> {
  try {
    const queries =
      scope.role === "admin"
        ? [Query.orderDesc("$createdAt")]
        : [
            Query.equal("instructorId", [scope.userId]),
            Query.orderDesc("$createdAt"),
          ];

    const rows = await listAllRows(
      APPWRITE_CONFIG.tables.standaloneResources,
      queries
    );

    return rows.map((row) => {
      const r = row;
      return {
        id: r.$id,
        instructorId: String(r.instructorId ?? ""),
        instructorName: String(r.instructorName ?? ""),
        title: String(r.title ?? ""),
        description: String(r.description ?? ""),
        type: String(r.type ?? "notes"),
        accessModel: String(r.accessModel ?? "free"),
        price: Number(r.price ?? 0),
        fileId: String(r.fileId ?? ""),
        thumbnailId: String(r.thumbnailId ?? ""),
        downloadCount: Number(r.downloadCount ?? 0),
        isPublished: Boolean(r.isPublished),
        tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
        createdAt: String(r.createdAt ?? ""),
      };
    });
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "Failed to load instructor resources."
    );

    return [];
  }
}
