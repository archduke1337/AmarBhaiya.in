"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/appwrite/auth";
import {
  userCanManageCourseResource,
  userCanManageLesson,
} from "@/lib/appwrite/access";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { executeDeletePlan } from "@/lib/appwrite/delete-plan";
import { createAdminClient } from "@/lib/appwrite/server";
import { normalizeHttpUrl } from "@/lib/utils/url";
import { actionSuccess, actionError, type ActionResult } from "@/lib/errors/action-result";
import {
  listAllRows,
  listRowsByFieldValues,
} from "@/lib/appwrite/row-pagination";

// ── Schema ──────────────────────────────────────────────────────────────────

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

// ── Course-Linked Resources ────────────────────────────────────────────────

export async function createCourseResourceAction(
  formData: FormData
): Promise<ActionResult> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const parsed = createCourseResourceSchema.safeParse({
    lessonId: String(formData.get("lessonId") ?? ""),
    title: String(formData.get("title") ?? ""),
    type: String(formData.get("type") ?? "file"),
    url: String(formData.get("url") ?? "").trim() || undefined,
  });

  if (!parsed.success) {
    return actionError("Invalid course resource data.");
  }
  const lessonContext = await userCanManageLesson(parsed.data.lessonId, role, user.$id);
  if (!lessonContext) {
    return actionError("You do not have permission to manage this lesson.");
  }
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

    return actionSuccess();
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to create course resource."
    );

    return actionError("Failed to create course resource.");
  }
}

export async function updateCourseResourceAction(
  formData: FormData
): Promise<ActionResult> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const resourceId = String(formData.get("resourceId") ?? "");
  if (!resourceId) {
    return actionError("Resource ID is required.");
  }
  const resourceContext = await userCanManageCourseResource(resourceId, role, user.$id);
  if (!resourceContext) {
    return actionError("You do not have permission to manage this resource.");
  }
  const parsed = courseResourceFieldsSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    type: String(formData.get("type") ?? "file"),
    url: String(formData.get("url") ?? "").trim() || undefined,
  });

  if (!parsed.success) {
    return actionError("Invalid course resource data.");
  }
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

    return actionSuccess();
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to update course resource."
    );

    return actionError("Failed to update course resource.");
  }
}

export async function deleteCourseResourceAction(
  formData: FormData
): Promise<ActionResult> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const resourceId = String(formData.get("resourceId") ?? "");
  if (!resourceId) {
    return actionError("Resource ID is required.");
  }
  const resourceContext = await userCanManageCourseResource(resourceId, role, user.$id);
  if (!resourceContext) {
    return actionError("You do not have permission to manage this resource.");
  }
  try {
    const { tablesDB, storage } = await createAdminClient();

    const deleted = await executeDeletePlan({
      tablesDB,
      storage,
      plan: {
        stagedDeletes: [
          {
            tableId: APPWRITE_CONFIG.tables.resources,
            rowId: resourceId,
          },
        ],
        fileDeletes: [
          {
            bucketId: APPWRITE_CONFIG.buckets.courseResources,
            fileIds: [String(resourceContext.resource.fileId ?? "")],
          },
        ],
      },
      label: `course resource ${resourceId}`,
    });
    if (!deleted) {
      return actionError("Failed to delete course resource.");
    }
    revalidatePath("/instructor/resources");
    revalidatePath(`/instructor/courses/${resourceContext.course.$id}/curriculum`);
    revalidatePath(`/app/learn/${resourceContext.course.$id}/${resourceContext.lesson.$id}`);

    return actionSuccess();
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to delete course resource."
    );

    return actionError("Failed to delete course resource.");
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

    const { tablesDB } = await createAdminClient();
    const courseRows = await listAllRows(
      tablesDB,
      APPWRITE_CONFIG.tables.courses,
      courseQueries
    );
    const courseTitleById = new Map(
      courseRows.map((course) => [course.$id, String(course.title ?? "Untitled course")])
    );
    const courseIds = courseRows.map((course) => course.$id);
    const lessonRows = await listRowsByFieldValues(
      tablesDB,
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
    const { tablesDB } = await createAdminClient();
    const resourceRows = await listRowsByFieldValues(
      tablesDB,
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
