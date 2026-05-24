"use server";

import { ID } from "node-appwrite";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/appwrite/auth";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { slugify } from "@/lib/utils/format";
import { actionSuccess, actionError } from "@/lib/errors/action-result";

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

export async function createCategoryAction(formData: FormData): Promise<void> {
  const { user } = await requireRole(["admin", "instructor"]);

  const parsed = createCategorySchema.safeParse({
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? "") || undefined,
    description: String(formData.get("description") ?? "") || undefined,
    order: parseInteger(formData.get("order"), 0),
  });

  if (!parsed.success) {
    actionError("Invalid input: name is required (min 2 characters)");
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
    actionError("Failed to create category: slug conflict after multiple attempts");
    return;
  }

  revalidatePath("/admin/categories");
  revalidatePath("/instructor/categories");
  revalidatePath("/courses");

  actionSuccess();
  return;
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
    actionError("Invalid input: categoryId and name are required");
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

  actionSuccess();
  return;
}
