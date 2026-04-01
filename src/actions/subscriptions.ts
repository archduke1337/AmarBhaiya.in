"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";

import { requireAuth, requireRole } from "@/lib/appwrite/auth";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";

type AnyRow = Record<string, unknown> & { $id: string };

// ── Types ───────────────────────────────────────────────────────────────────

export type SubscriptionPlan = {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  isActive: boolean;
};

export type UserSubscription = {
  id: string;
  userId: string;
  userName: string;
  planId: string;
  planName: string;
  startDate: string;
  endDate: string;
  status: string;
};

// ── Get User's Subscription ─────────────────────────────────────────────────

export async function getUserSubscription(): Promise<UserSubscription | null> {
  const user = await requireAuth();
  const { tablesDB } = await createAdminClient();

  try {
    const result = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.subscriptions,
      queries: [
        Query.equal("userId", [user.$id]),
        Query.equal("status", ["active"]),
        Query.orderDesc("$createdAt"),
        Query.limit(1),
      ],
    });

    const row = result.rows[0] as AnyRow | undefined;
    if (!row) return null;

    return {
      id: row.$id,
      userId: String(row.userId ?? ""),
      userName: user.name || user.email,
      planId: String(row.planId ?? ""),
      planName: String(row.planName ?? "Unknown Plan"),
      startDate: String(row.startDate ?? ""),
      endDate: String(row.endDate ?? ""),
      status: String(row.status ?? "active"),
    };
  } catch {
    return null;
  }
}

// ── Get All Subscriptions (Admin) ───────────────────────────────────────────

export async function getAllSubscriptions(): Promise<UserSubscription[]> {
  await requireRole(["admin"]);
  const { tablesDB, users } = await createAdminClient();

  try {
    const result = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.subscriptions,
      queries: [
        Query.orderDesc("$createdAt"),
        Query.limit(200),
      ],
    });

    const subs: UserSubscription[] = [];

    for (const r of result.rows) {
      const row = r as AnyRow;
      let userName = "Unknown";

      try {
        const u = await users.get(String(row.userId ?? ""));
        userName = u.name || u.email;
      } catch {
        // User may not exist
      }

      subs.push({
        id: row.$id,
        userId: String(row.userId ?? ""),
        userName,
        planId: String(row.planId ?? ""),
        planName: String(row.planName ?? "Unknown"),
        startDate: String(row.startDate ?? ""),
        endDate: String(row.endDate ?? ""),
        status: String(row.status ?? "expired"),
      });
    }

    return subs;
  } catch {
    return [];
  }
}

// ── Cancel Subscription ─────────────────────────────────────────────────────

export async function cancelSubscriptionAction(
  formData: FormData
): Promise<void> {
  const user = await requireAuth();
  const subscriptionId = String(formData.get("subscriptionId") ?? "");
  if (!subscriptionId) return;

  const { tablesDB } = await createAdminClient();

  try {
    // Verify ownership
    const sub = (await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.subscriptions,
      rowId: subscriptionId,
    })) as AnyRow;

    if (String(sub.userId) !== user.$id) return;

    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.subscriptions,
      rowId: subscriptionId,
      data: {
        status: "cancelled",
      },
    });

    revalidatePath("/app/billing");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to cancel subscription."
    );
  }
}

// ── Admin: Update Subscription Status ───────────────────────────────────────

export async function adminUpdateSubscriptionAction(
  formData: FormData
): Promise<void> {
  await requireRole(["admin"]);

  const subscriptionId = String(formData.get("subscriptionId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!subscriptionId || !status) return;

  const { tablesDB } = await createAdminClient();

  try {
    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.subscriptions,
      rowId: subscriptionId,
      data: { status },
    });

    revalidatePath("/admin/subscriptions");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to update subscription."
    );
  }
}

// ── Admin: Create Subscription (manual) ─────────────────────────────────────

export async function adminCreateSubscriptionAction(
  formData: FormData
): Promise<void> {
  await requireRole(["admin"]);

  const userId = String(formData.get("userId") ?? "").trim();
  const planName = String(formData.get("planName") ?? "").trim();
  const durationMonths = Number(formData.get("durationMonths") ?? 1);

  if (!userId || !planName) return;

  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + durationMonths);

  const { tablesDB } = await createAdminClient();

  try {
    await tablesDB.createRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.subscriptions,
      rowId: ID.unique(),
      data: {
        userId,
        planId: planName.toLowerCase().replace(/\s+/g, "-"),
        planName,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: "active",
        paymentId: "",
      },
    });

    revalidatePath("/admin/subscriptions");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to create subscription."
    );
  }
}
