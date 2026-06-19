"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/appwrite/auth";
import { userCanManageResource } from "@/lib/appwrite/access";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { executeDeletePlan } from "@/lib/appwrite/delete-plan";
import { createAdminClient } from "@/lib/appwrite/server";
import { parseFiniteNumber } from "@/lib/utils/number";
import { actionSuccess, actionError, type ActionResult } from "@/lib/errors/action-result";

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
): Promise<ActionResult> {
  const { user } = await requireRole(["admin", "instructor"]);

  const parsed = createResourceSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? "").trim() || undefined,
    type: String(formData.get("type") ?? "notes"),
    accessModel: String(formData.get("accessModel") ?? "free"),
    price: Number(formData.get("price") ?? 0),
    isPublished: formData.get("isPublished") === "on",
  });

  if (!parsed.success) {
    return actionError("Invalid resource data.");
  }
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

    return actionSuccess();
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to create resource."
    );

    return actionError("Failed to create resource.");
  }
}

// ── Update ──────────────────────────────────────────────────────────────────

export async function updateStandaloneResourceAction(
  formData: FormData
): Promise<ActionResult> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const resourceId = String(formData.get("resourceId") ?? "");
  if (!resourceId) {
    return actionError("Resource ID is required.");
  }
  if (!(await userCanManageResource(resourceId, role, user.$id))) {
    return actionError("You do not have permission to manage this resource.");
  }

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
      if (price === null || price < 0) {
        return actionError("Invalid price.");
      }
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

    return actionSuccess();
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to update resource."
    );

    return actionError("Failed to update resource.");
  }
}

// ── Delete ──────────────────────────────────────────────────────────────────

export async function deleteStandaloneResourceAction(
  formData: FormData
): Promise<ActionResult> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const resourceId = String(formData.get("resourceId") ?? "");
  if (!resourceId) {
    return actionError("Resource ID is required.");
  }
  try {
    const { tablesDB, storage } = await createAdminClient();
    const resource = await userCanManageResource(resourceId, role, user.$id);
    if (!resource) {
      return actionError("You do not have permission to manage this resource.");
    }
    const deleted = await executeDeletePlan({
      tablesDB,
      storage,
      plan: {
        stagedDeletes: [
          {
            tableId: APPWRITE_CONFIG.tables.standaloneResources,
            rowId: resourceId,
          },
        ],
        fileDeletes: [
          {
            bucketId: APPWRITE_CONFIG.buckets.resourceFiles,
            fileIds: [String(resource.fileId ?? "")],
          },
        ],
      },
      label: `standalone resource ${resourceId}`,
    });
    if (!deleted) {
      return actionError("Failed to delete resource.");
    }
    revalidatePath("/instructor/resources");

    return actionSuccess();
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to delete resource."
    );

    return actionError("Failed to delete resource.");
  }
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
      tablesDB,
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
