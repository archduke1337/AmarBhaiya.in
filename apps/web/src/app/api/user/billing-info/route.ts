import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";

import { APPWRITE_CONFIG } from "@/server/appwrite/config";
import { createAdminClient } from "@/server/appwrite/server";
import { checkRateLimit, getRateLimitKey } from "@/server/rate-limiter";
import { billingInfoSchema } from "@/server/validators/billing";

import { getApiUser } from "@/server/appwrite/api-auth";

export const runtime = "nodejs";

// ── GET: Check if user has billing info ────────────────────────────────────

export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rlKey = `${getRateLimitKey(request)}:billing-info:${user.$id}`;
  const rateLimit = await checkRateLimit(rlKey, 10);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
    );
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
    console.error("[Billing Info] save failed", error);
    return NextResponse.json(
      { error: "Failed to save billing info" },
      { status: 500 }
    );
  }
}
