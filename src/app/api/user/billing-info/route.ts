import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { z } from "zod";

import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";

const billingInfoSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  phone: z.string().max(20).optional().default(""),
  parentName: z.string().trim().min(1).max(200),
  parentPhone: z.string().trim().min(1).max(20),
  addressLine1: z.string().trim().min(1).max(300),
  addressLine2: z.string().max(300).optional().default(""),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  country: z.string().trim().min(1).max(100),
  zipcode: z.string().trim().min(1).max(20),
});

async function getAuthenticatedUser() {
  try {
    const { account } = await createSessionClient();
    return await account.get();
  } catch {
    return null;
  }
}

// ── GET: Check if user has billing info ────────────────────────────────────

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ hasBillingInfo: false, billing: null });
  }

  try {
    const { tablesDB } = await createAdminClient();
    const result = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.billingInfo,
      queries: [Query.equal("userId", [user.$id]), Query.limit(1)],
    });

    const row = result.rows[0] as Record<string, unknown> | undefined;

    if (row) {
      return NextResponse.json({
        hasBillingInfo: true,
        billing: {
          firstName: row.firstName ?? "",
          lastName: row.lastName ?? "",
          phone: row.phone ?? "",
          parentName: row.parentName ?? "",
          parentPhone: row.parentPhone ?? "",
          addressLine1: row.addressLine1 ?? "",
          addressLine2: row.addressLine2 ?? "",
          city: row.city ?? "",
          state: row.state ?? "",
          country: row.country ?? "",
          zipcode: row.zipcode ?? "",
        },
      });
    }

    return NextResponse.json({ hasBillingInfo: false, billing: null });
  } catch {
    return NextResponse.json({ hasBillingInfo: false, billing: null });
  }
}

// ── POST: Save billing info ────────────────────────────────────────────────

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  if (!json) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = billingInfoSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid billing data" },
      { status: 400 }
    );
  }

  // Validate phone !== parentPhone
  if (parsed.data.phone && parsed.data.parentPhone && parsed.data.phone === parsed.data.parentPhone) {
    return NextResponse.json(
      { error: "Student phone and parent phone cannot be the same." },
      { status: 400 }
    );
  }

  try {
    const { tablesDB } = await createAdminClient();

    // Check if billing info already exists
    const existing = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.billingInfo,
      queries: [Query.equal("userId", [user.$id]), Query.limit(1)],
    });

    const now = new Date().toISOString();
    const data: Record<string, unknown> = {
      userId: user.$id,
      ...parsed.data,
      updatedAt: now,
    };

    if (existing.rows.length > 0) {
      await tablesDB.updateRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.billingInfo,
        rowId: existing.rows[0].$id,
        data,
      });
    } else {
      data.createdAt = now;
      await tablesDB.createRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.billingInfo,
        rowId: ID.unique(),
        data,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save billing info" },
      { status: 500 }
    );
  }
}
