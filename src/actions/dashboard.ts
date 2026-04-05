"use server";

import { ID } from "node-appwrite";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuth, requireRole } from "@/lib/appwrite/auth";
import { userCanManageCourse } from "@/lib/appwrite/access";
import { getUserRole } from "@/lib/appwrite/auth-utils";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";
import { slugify } from "@/lib/utils/format";
import { parseLineSeparatedList } from "@/lib/utils/form-lists";
import { sanitizeHtml } from "@/lib/utils/sanitize";

const createForumThreadSchema = z.object({
  forumCatId: z.string().min(1, "Category is required."),
  title: z.string().trim().min(6, "Title must be at least 6 characters."),
  body: z.string().trim().min(12, "Body must be at least 12 characters."),
});

const createCourseSchema = z.object({
  title: z.string().trim().min(6, "Title must be at least 6 characters."),
  categoryId: z.string().trim().optional(),
  shortDescription: z
    .string()
    .trim()
    .min(12, "Short description must be at least 12 characters."),
  accessModel: z.enum(["free", "paid", "subscription"]).default("free"),
  requirements: z.array(z.string().trim().min(1)).default([]),
  whatYouLearn: z.array(z.string().trim().min(1)).default([]),
});

const createLiveSessionSchema = z.object({
  courseId: z.string().min(1, "Course is required."),
  title: z.string().trim().min(4, "Session title must be at least 4 characters."),
  description: z.string().trim().optional(),
  scheduledAt: z.string().min(1, "Schedule is required."),
  streamUrl: z.string().trim().optional(),
});

const updateLiveSessionSchema = z.object({
  sessionId: z.string().min(1, "Session is required."),
  title: z.string().trim().min(4, "Session title must be at least 4 characters."),
  description: z.string().trim().optional(),
  scheduledAt: z.string().min(1, "Schedule is required."),
  status: z.enum(["scheduled", "live", "ended"]).default("scheduled"),
  streamUrl: z.string().trim().optional(),
  recordingUrl: z.string().trim().optional(),
});

function normalizeIsoDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(Date.now() + 60 * 60 * 1000).toISOString();
  }

  return parsed.toISOString();
}

function normalizeOptionalHttpUrl(value?: string): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return "";
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export async function createForumThreadAction(
  formData: FormData
): Promise<void> {
  const user = await requireAuth();
  const payload = {
    forumCatId: String(formData.get("forumCatId") ?? ""),
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
  };

  const parsed = createForumThreadSchema.safeParse(payload);
  if (!parsed.success) {
    return;
  }

  try {
    const { tablesDB } = await createSessionClient();
    const now = new Date().toISOString();

    await tablesDB.createRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.forumThreads,
      rowId: ID.unique(),
      data: {
        forumCatId: parsed.data.forumCatId,
        userId: user.$id,
        userName: user.name,
        userRole: getUserRole(user),
        title: sanitizeHtml(parsed.data.title),
        body: sanitizeHtml(parsed.data.body),
        createdAt: now,
        isPinned: false,
        isLocked: false,
        replyCount: 0,
        lastReplyAt: now,
      },
    });

    revalidatePath("/app/community");
    revalidatePath("/moderator");
    revalidatePath("/moderator/community");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to create forum thread."
    );
  }
}

export async function createCourseDraftAction(
  formData: FormData
): Promise<void> {
  const { user } = await requireRole(["admin", "instructor"]);

  const payload = {
    title: String(formData.get("title") ?? ""),
    categoryId: String(formData.get("categoryId") ?? "").trim() || undefined,
    shortDescription: String(formData.get("shortDescription") ?? ""),
    accessModel:
      String(formData.get("accessModel") ?? "free") as
        | "free"
        | "paid"
        | "subscription",
    requirements: parseLineSeparatedList(formData.get("requirements")),
    whatYouLearn: parseLineSeparatedList(formData.get("whatYouLearn")),
  };

  const parsed = createCourseSchema.safeParse(payload);
  if (!parsed.success) {
    return;
  }

  try {
    const { tablesDB } = await createAdminClient();
    const baseSlug = slugify(parsed.data.title) || `course-${Date.now()}`;

    let rowCreated = false;
    let lastError: unknown = null;

    for (let attempt = 0; attempt < 3 && !rowCreated; attempt += 1) {
      const slug = attempt === 0 ? baseSlug : `${baseSlug}-${Date.now()}-${attempt}`;

      try {
        await tablesDB.createRow({
          databaseId: APPWRITE_CONFIG.databaseId,
          tableId: APPWRITE_CONFIG.tables.courses,
          rowId: ID.unique(),
          data: {
            title: parsed.data.title,
            slug,
            description: parsed.data.shortDescription,
            shortDescription: parsed.data.shortDescription,
            instructorId: user.$id,
            instructorName: user.name,
            categoryId: parsed.data.categoryId,
            price: parsed.data.accessModel === "free" ? 0 : 499,
            accessModel: parsed.data.accessModel,
            isPublished: false,
            isFeatured: false,
            thumbnailId: "",
            totalDuration: 0,
            totalLessons: 0,
            enrollmentCount: 0,
            rating: 0,
            ratingCount: 0,
            tags: [],
            requirements: parsed.data.requirements,
            whatYouLearn: parsed.data.whatYouLearn,
          },
        });

        rowCreated = true;
      } catch (error) {
        lastError = error;
        const appwriteError = error as { code?: number };
        if (appwriteError.code !== 409) {
          throw error;
        }
      }
    }

    if (!rowCreated) {
      throw lastError instanceof Error
        ? lastError
        : new Error("Failed to create course due to slug conflict.");
    }

    revalidatePath("/instructor");
    revalidatePath("/instructor/courses");
    revalidatePath("/admin/courses");
    redirect("/instructor/courses");
  } catch (error) {
    // redirect() throws a special error in Next.js - rethrow it
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error(error instanceof Error ? error.message : "Failed to create course.");
  }
}

export async function createLiveSessionAction(
  formData: FormData
): Promise<void> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const payload = {
    courseId: String(formData.get("courseId") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? "").trim() || undefined,
    scheduledAt: String(formData.get("scheduledAt") ?? ""),
    streamUrl: String(formData.get("streamUrl") ?? "").trim() || undefined,
  };

  const parsed = createLiveSessionSchema.safeParse(payload);
  if (!parsed.success) {
    return;
  }

  const streamUrl = normalizeOptionalHttpUrl(parsed.data.streamUrl);
  if (streamUrl === null) {
    return;
  }

  try {
    const course = await userCanManageCourse(parsed.data.courseId, role, user.$id);
    if (!course) {
      return;
    }

    const { tablesDB } = await createAdminClient();

    await tablesDB.createRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.liveSessions,
      rowId: ID.unique(),
      data: {
        courseId: parsed.data.courseId,
        instructorId:
          role === "admin"
            ? String(course.instructorId ?? user.$id)
            : user.$id,
        title: parsed.data.title,
        description: parsed.data.description ?? "",
        scheduledAt: normalizeIsoDate(parsed.data.scheduledAt),
        streamId: streamUrl,
        status: "scheduled",
        recordingUrl: "",
        duration: 0,
      },
    });

    revalidatePath("/instructor");
    revalidatePath("/instructor/live");
    revalidatePath("/admin");
    revalidatePath("/admin/live");
    revalidatePath("/app/dashboard");
    revalidatePath("/app/live");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to create live session."
    );
  }
}

export async function updateLiveSessionAction(
  formData: FormData
): Promise<void> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const payload = {
    sessionId: String(formData.get("sessionId") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? "").trim() || undefined,
    scheduledAt: String(formData.get("scheduledAt") ?? ""),
    status: String(formData.get("status") ?? "scheduled"),
    streamUrl: String(formData.get("streamUrl") ?? "").trim() || undefined,
    recordingUrl: String(formData.get("recordingUrl") ?? "").trim() || undefined,
  };

  const parsed = updateLiveSessionSchema.safeParse(payload);
  if (!parsed.success) {
    return;
  }

  const streamUrl = normalizeOptionalHttpUrl(parsed.data.streamUrl);
  const recordingUrl = normalizeOptionalHttpUrl(parsed.data.recordingUrl);
  if (streamUrl === null || recordingUrl === null) {
    return;
  }
  if (parsed.data.status === "live" && !streamUrl) {
    return;
  }

  try {
    const { tablesDB } = await createAdminClient();
    const session = await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.liveSessions,
      rowId: parsed.data.sessionId,
    }).catch(() => null);

    if (!session) {
      return;
    }

    const course = await userCanManageCourse(
      String((session as Record<string, unknown>).courseId ?? ""),
      role,
      user.$id
    );
    if (!course) {
      return;
    }

    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.liveSessions,
      rowId: parsed.data.sessionId,
      data: {
        title: parsed.data.title,
        description: parsed.data.description ?? "",
        scheduledAt: normalizeIsoDate(parsed.data.scheduledAt),
        status: parsed.data.status,
        streamId: streamUrl,
        recordingUrl: recordingUrl,
      },
    });

    revalidatePath("/instructor");
    revalidatePath("/instructor/live");
    revalidatePath("/admin");
    revalidatePath("/admin/live");
    revalidatePath("/app/dashboard");
    revalidatePath("/app/live");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to update live session."
    );
  }
}
