"use server";

import { ID } from "node-appwrite";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/server/appwrite/auth";
import { APPWRITE_CONFIG } from "@/server/appwrite/config";
import { createAdminClient } from "@/server/appwrite/server";
import { slugify } from "@/lib/utils/format";
import { parseInteger } from "@/lib/utils/form-parsers";
import { actionSuccess, actionError, type ActionResult } from "@/lib/errors/action-result";

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

export async function createCategoryAction(formData: FormData): Promise<ActionResult> {
  const { user } = await requireRole(["admin", "instructor"]);

  const parsed = createCategorySchema.safeParse({
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? "") || undefined,
    description: String(formData.get("description") ?? "") || undefined,
    order: parseInteger(formData.get("order"), 0),
  });

  if (!parsed.success) {
    return actionError("Invalid input: name is required (min 2 characters)");
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
    return actionError("Failed to create category: slug conflict after multiple attempts");
  }

  revalidatePath("/admin/categories");
  revalidatePath("/instructor/categories");
  revalidatePath("/courses");

  return actionSuccess();
}

export async function updateCategoryAction(formData: FormData): Promise<ActionResult> {
  await requireRole(["admin", "instructor"]);

  const parsed = updateCategorySchema.safeParse({
    categoryId: String(formData.get("categoryId") ?? ""),
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? "") || undefined,
    description: String(formData.get("description") ?? "") || undefined,
    order: parseInteger(formData.get("order"), 0),
  });

  if (!parsed.success) {
    return actionError("Invalid input: categoryId and name are required");
  }

  try {
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

    return actionSuccess();
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to update category."
    );
    return actionError("Failed to update category.");
  }
}
