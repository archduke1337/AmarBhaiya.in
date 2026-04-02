"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuth } from "@/lib/appwrite/auth";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";

// ── Schemas ─────────────────────────────────────────────────────────────────

const studentProfileSchema = z.object({
  dateOfBirth: z.string().optional(),
  grade: z.string().max(50).optional(),
  school: z.string().max(200).optional(),
  hobby: z.string().max(300).optional(),
  bio: z.string().max(1000).optional(),
  guardianName: z.string().max(200).optional(),
  guardianPhone: z.string().max(20).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
});

const billingInfoSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(100),
  lastName: z.string().trim().min(1, "Last name is required.").max(100),
  phone: z.string().trim().min(1, "Phone is required.").max(20),
  addressLine1: z.string().trim().min(1, "Address is required.").max(300),
  addressLine2: z.string().max(300).optional(),
  city: z.string().trim().min(1, "City is required.").max(100),
  state: z.string().trim().min(1, "State is required.").max(100),
  country: z.string().trim().min(1, "Country is required.").max(100),
  zipcode: z.string().trim().min(1, "Zipcode is required.").max(20),
});

// ── Helpers ─────────────────────────────────────────────────────────────────

type AnyRow = Record<string, unknown> & { $id: string };

async function findRowByUserId(
  tableId: string,
  userId: string
): Promise<AnyRow | null> {
  const { tablesDB } = await createAdminClient();
  const result = await tablesDB.listRows({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId,
    queries: [Query.equal("userId", [userId]), Query.limit(1)],
  });
  return (result.rows[0] as AnyRow | undefined) ?? null;
}

// ── Student Profile Actions ─────────────────────────────────────────────────

export async function upsertStudentProfileAction(
  formData: FormData
): Promise<void> {
  const user = await requireAuth();

  const parsed = studentProfileSchema.safeParse({
    dateOfBirth: String(formData.get("dateOfBirth") ?? "").trim() || undefined,
    grade: String(formData.get("grade") ?? "").trim() || undefined,
    school: String(formData.get("school") ?? "").trim() || undefined,
    hobby: String(formData.get("hobby") ?? "").trim() || undefined,
    bio: String(formData.get("bio") ?? "").trim() || undefined,
    guardianName: String(formData.get("guardianName") ?? "").trim() || undefined,
    guardianPhone: String(formData.get("guardianPhone") ?? "").trim() || undefined,
    city: String(formData.get("city") ?? "").trim() || undefined,
    state: String(formData.get("state") ?? "").trim() || undefined,
  });

  if (!parsed.success) return;

  try {
    const { tablesDB } = await createAdminClient();
    const tableId = APPWRITE_CONFIG.tables.studentProfiles;

    const existing = await findRowByUserId(tableId, user.$id);

    const data: Record<string, unknown> = {
      userId: user.$id,
      ...parsed.data,
    };

    if (existing) {
      await tablesDB.updateRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId,
        rowId: existing.$id,
        data,
      });
    } else {
      await tablesDB.createRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId,
        rowId: ID.unique(),
        data,
      });
    }

    revalidatePath("/app/dashboard");
    revalidatePath("/app/profile");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to update profile."
    );
  }
}

export async function getStudentProfile(userId: string) {
  const row = await findRowByUserId(
    APPWRITE_CONFIG.tables.studentProfiles,
    userId
  );
  if (!row) return null;

  return {
    dateOfBirth: (row.dateOfBirth as string) || "",
    grade: (row.grade as string) || "",
    school: (row.school as string) || "",
    hobby: (row.hobby as string) || "",
    bio: (row.bio as string) || "",
    guardianName: (row.guardianName as string) || "",
    guardianPhone: (row.guardianPhone as string) || "",
    city: (row.city as string) || "",
    state: (row.state as string) || "",
  };
}

// ── Billing Info Actions ────────────────────────────────────────────────────

export async function upsertBillingInfoAction(
  formData: FormData
): Promise<void> {
  const user = await requireAuth();

  const parsed = billingInfoSchema.safeParse({
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    addressLine1: String(formData.get("addressLine1") ?? ""),
    addressLine2: String(formData.get("addressLine2") ?? "").trim() || undefined,
    city: String(formData.get("city") ?? ""),
    state: String(formData.get("state") ?? ""),
    country: String(formData.get("country") ?? ""),
    zipcode: String(formData.get("zipcode") ?? ""),
  });

  if (!parsed.success) return;

  try {
    const { tablesDB } = await createAdminClient();
    const tableId = APPWRITE_CONFIG.tables.billingInfo;

    const existing = await findRowByUserId(tableId, user.$id);
    const now = new Date().toISOString();

    const data: Record<string, unknown> = {
      userId: user.$id,
      ...parsed.data,
      updatedAt: now,
    };

    if (existing) {
      await tablesDB.updateRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId,
        rowId: existing.$id,
        data,
      });
    } else {
      data.createdAt = now;
      await tablesDB.createRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId,
        rowId: ID.unique(),
        data,
      });
    }

    revalidatePath("/app/dashboard");
    revalidatePath("/app/profile");
    revalidatePath("/app/billing");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to update billing info."
    );
  }
}

export async function getBillingInfo(userId: string) {
  const row = await findRowByUserId(
    APPWRITE_CONFIG.tables.billingInfo,
    userId
  );
  if (!row) return null;

  return {
    firstName: (row.firstName as string) || "",
    lastName: (row.lastName as string) || "",
    phone: (row.phone as string) || "",
    addressLine1: (row.addressLine1 as string) || "",
    addressLine2: (row.addressLine2 as string) || "",
    city: (row.city as string) || "",
    state: (row.state as string) || "",
    country: (row.country as string) || "",
    zipcode: (row.zipcode as string) || "",
  };
}
