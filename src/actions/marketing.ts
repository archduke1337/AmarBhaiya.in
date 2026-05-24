"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/appwrite/auth";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { getBlogDetailPaths, getCourseDetailPaths } from "@/lib/utils/cache-paths";
import { slugify } from "@/lib/utils/format";
import {
  listAllRows,
  type AnyAppwriteRow,
} from "@/lib/appwrite/row-pagination";
import { actionSuccess, actionError } from "@/lib/errors/action-result";

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

function normalizeJsonPayload(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return "";
  }

  try {
    return JSON.stringify(JSON.parse(trimmed));
  } catch {
    return null;
  }
}

type AnyRow = AnyAppwriteRow;

function revalidateEach(paths: string[]): void {
  for (const path of paths) {
    revalidatePath(path);
  }
}

function revalidateHomeContentPaths(): void {
  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath("/api/content/home");
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
    actionError("Invalid input: key (min 3 chars) is required");
    return;
  }

  const normalizedPayload = normalizeJsonPayload(parsed.data.payload);
  if (normalizedPayload === null) {
    actionError("Invalid JSON payload submitted for site copy");
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
        payload: normalizedPayload,
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
        payload: normalizedPayload,
        updatedAt: now,
        isPublished: parsed.data.isPublished,
      },
    });
  }

  revalidateHomeContentPaths();
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/blog");
  revalidatePath("/admin/marketing");

  actionSuccess();
  return;
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
    actionError("Invalid input: name is required (min 2 characters)");
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

      revalidateHomeContentPaths();
      revalidatePath("/blog");
      revalidatePath("/admin/marketing");
      revalidateEach(getBlogDetailPaths(slug));
      actionSuccess();
      return;
    } catch (error) {
      const appwriteError = error as { code?: number };
      if (appwriteError.code !== 409) {
        throw error;
      }
    }
  }
  actionError("Failed to create blog post: slug conflict after multiple attempts");
  return;
}

// ── Update Blog Post ──────────────────────────────────────────────────────

export async function updateBlogPostAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);

  const postId = String(formData.get("postId") ?? "");
  if (!postId) {
    actionError("Invalid input: postId is required");
    return;
  }
  const { tablesDB } = await createAdminClient();
  const existingPost = (await tablesDB.getRow({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.tables.blogPosts,
    rowId: postId,
  }).catch(() => null)) as AnyRow | null;
  if (!existingPost) {
    actionError("Blog post not found");
    return;
  }
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

  if (Object.keys(data).length === 0) {
    actionError("No fields to update");
    return;
  }
  try {
    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.blogPosts,
      rowId: postId,
      data,
    });

    revalidateHomeContentPaths();
    revalidatePath("/blog");
    revalidatePath("/admin/marketing");
    revalidateEach(getBlogDetailPaths(String(existingPost.slug ?? "")));
    actionSuccess();
    return;
  } catch (error) {
    actionError(error instanceof Error ? error.message : "Failed to update blog post.");
    return;
  }
}

// ── Delete Blog Post ──────────────────────────────────────────────────────

export async function deleteBlogPostAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);

  const postId = String(formData.get("postId") ?? "");
  if (!postId) {
    actionError("Invalid input: postId is required");
    return;
  }
  const { tablesDB } = await createAdminClient();
  const existingPost = (await tablesDB.getRow({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.tables.blogPosts,
    rowId: postId,
  }).catch(() => null)) as AnyRow | null;
  if (!existingPost) {
    actionError("Blog post not found");
    return;
  }
  try {
    await tablesDB.deleteRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.blogPosts,
      rowId: postId,
    });

    revalidateHomeContentPaths();
    revalidatePath("/blog");
    revalidatePath("/admin/marketing");
    revalidateEach(getBlogDetailPaths(String(existingPost.slug ?? "")));
    actionSuccess();
    return;
  } catch (error) {
    actionError(error instanceof Error ? error.message : "Failed to delete blog post.");
    return;
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
