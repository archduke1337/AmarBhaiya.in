"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/appwrite/auth";
import { userCanManageResource } from "@/lib/appwrite/access";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";

// ── Schema ──────────────────────────────────────────────────────────────────

const createResourceSchema = z.object({
  title: z.string().trim().min(4, "Title must be at least 4 characters.").max(300),
  description: z.string().trim().optional(),
  type: z.enum(["notes", "worksheet", "test_paper", "video", "other"]),
  accessModel: z.enum(["free", "paid"]).default("free"),
  price: z.number().min(0).default(0),
  isPublished: z.boolean().default(false),
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

type AnyRow = Record<string, unknown> & { $id: string };

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
  if (description !== undefined) data.description = description;

  const type = String(formData.get("type") ?? "");
  if (["notes", "worksheet", "test_paper", "video", "other"].includes(type)) {
    data.type = type;
  }

  const accessModel = String(formData.get("accessModel") ?? "");
  if (["free", "paid"].includes(accessModel)) {
    data.accessModel = accessModel;
    data.price = accessModel === "paid" ? Number(formData.get("price") ?? 0) : 0;
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
    const { tablesDB } = await createAdminClient();

    if (!(await userCanManageResource(resourceId, role, user.$id))) return;

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

// ── List (for instructor dashboard) ─────────────────────────────────────────

export async function getInstructorResources(
  scope: { userId: string; role: string }
): Promise<StandaloneResource[]> {
  const { tablesDB } = await createAdminClient();

  const queries =
    scope.role === "admin"
      ? [Query.orderDesc("$createdAt"), Query.limit(100)]
      : [
          Query.equal("instructorId", [scope.userId]),
          Query.orderDesc("$createdAt"),
          Query.limit(100),
        ];

  try {
    const result = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.standaloneResources,
      queries,
    });

    return result.rows.map((row) => {
      const r = row as AnyRow;
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
  } catch {
    return [];
  }
}
