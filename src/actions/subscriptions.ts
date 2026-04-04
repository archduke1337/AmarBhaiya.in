"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";

import { requireAuth, requireRole } from "@/lib/appwrite/auth";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { parseFiniteNumber } from "@/lib/utils/number";
import { processInBatches } from "@/lib/utils/batch";

type AnyRow = Record<string, unknown> & { $id: string };
const VALID_SUBSCRIPTION_STATUSES = new Set(["active", "expired", "cancelled"]);
type AdminTablesDB = Awaited<ReturnType<typeof createAdminClient>>["tablesDB"];
type AdminUsers = Awaited<ReturnType<typeof createAdminClient>>["users"];

function toDate(value: unknown): Date | null {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function deriveSubscriptionStatus(row: AnyRow): "active" | "expired" | "cancelled" {
  const storedStatus = String(row.status ?? "expired");
  if (storedStatus !== "active") {
    return VALID_SUBSCRIPTION_STATUSES.has(storedStatus)
      ? (storedStatus as "active" | "expired" | "cancelled")
      : "expired";
  }

  const endDate = toDate(row.endDate);
  if (endDate && endDate.getTime() < Date.now()) {
    return "expired";
  }

  return "active";
}

async function normalizeSubscriptionStatuses(
  tablesDB: AdminTablesDB,
  rows: AnyRow[]
): Promise<Map<string, string>> {
  const normalizedStatuses = new Map<string, string>();

  await processInBatches(rows, 25, async (row) => {
    const normalizedStatus = deriveSubscriptionStatus(row);
    normalizedStatuses.set(row.$id, normalizedStatus);

    if (normalizedStatus !== String(row.status ?? "")) {
      try {
        await tablesDB.updateRow({
          databaseId: APPWRITE_CONFIG.databaseId,
          tableId: APPWRITE_CONFIG.tables.subscriptions,
          rowId: row.$id,
          data: { status: normalizedStatus },
        });
      } catch {
        // Keep reads resilient even if normalization write fails.
      }
    }
  });

  return normalizedStatuses;
}

async function deactivateOtherActiveSubscriptions(
  tablesDB: AdminTablesDB,
  userId: string,
  keepSubscriptionId?: string
): Promise<void> {
  const existing = await tablesDB.listRows({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.tables.subscriptions,
    queries: [
      Query.equal("userId", [userId]),
      Query.equal("status", ["active"]),
      Query.limit(100),
    ],
  }).catch(() => ({ rows: [] as AnyRow[] }));

  const rows = (existing.rows as AnyRow[]).filter(
    (row) => row.$id !== keepSubscriptionId
  );

  await processInBatches(rows, 25, async (row) => {
    const nextStatus =
      deriveSubscriptionStatus(row) === "expired" ? "expired" : "cancelled";

    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.subscriptions,
      rowId: row.$id,
      data: { status: nextStatus },
    });
  });
}

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

async function listAllSubscriptionRows(
  tablesDB: AdminTablesDB
): Promise<AnyRow[]> {
  const rows: AnyRow[] = [];
  const pageSize = 500;
  let offset = 0;

  while (true) {
    const result = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.subscriptions,
      queries: [
        Query.orderDesc("$createdAt"),
        Query.limit(pageSize),
        Query.offset(offset),
      ],
    });

    rows.push(...(result.rows as AnyRow[]));

    if (result.rows.length < pageSize) {
      break;
    }

    offset += result.rows.length;
  }

  return rows;
}

async function buildUserNameMap(
  users: AdminUsers,
  userIds: string[]
): Promise<Map<string, string>> {
  const userNameById = new Map<string, string>();

  await processInBatches(userIds, 25, async (userId) => {
    try {
      const user = await users.get(userId);
      userNameById.set(userId, user.name || user.email || "Unknown");
    } catch {
      // User may not exist
    }
  });

  return userNameById;
}

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
        Query.orderDesc("$createdAt"),
        Query.limit(25),
      ],
    });

    const rows = result.rows as AnyRow[];
    if (rows.length === 0) return null;
    const normalizedStatuses = await normalizeSubscriptionStatuses(tablesDB, rows);
    const row = rows.find((candidate) => normalizedStatuses.get(candidate.$id) === "active");
    if (!row) return null;

    return {
      id: row.$id,
      userId: String(row.userId ?? ""),
      userName: user.name || user.email,
      planId: String(row.planId ?? ""),
      planName: String(row.planName ?? "Unknown Plan"),
      startDate: String(row.startDate ?? ""),
      endDate: String(row.endDate ?? ""),
      status: normalizedStatuses.get(row.$id) ?? String(row.status ?? "active"),
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
    const rows = await listAllSubscriptionRows(tablesDB);
    const normalizedStatuses = await normalizeSubscriptionStatuses(tablesDB, rows);
    const userIds = Array.from(
      new Set(
        rows
          .map((row) => String(row.userId ?? ""))
          .filter((userId) => userId.length > 0)
      )
    );
    const userNameById = await buildUserNameMap(users, userIds);

    return rows.map((row) => {
      const userId = String(row.userId ?? "");

      return {
        id: row.$id,
        userId,
        userName: userNameById.get(userId) ?? "Unknown",
        planId: String(row.planId ?? ""),
        planName: String(row.planName ?? "Unknown"),
        startDate: String(row.startDate ?? ""),
        endDate: String(row.endDate ?? ""),
        status: normalizedStatuses.get(row.$id) ?? String(row.status ?? "expired"),
      };
    });
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
  if (!VALID_SUBSCRIPTION_STATUSES.has(status)) return;

  const { tablesDB } = await createAdminClient();

  try {
    const subscription = (await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.subscriptions,
      rowId: subscriptionId,
    }).catch(() => null)) as AnyRow | null;
    if (!subscription) return;

    if (status === "active") {
      await deactivateOtherActiveSubscriptions(
        tablesDB,
        String(subscription.userId ?? ""),
        subscriptionId
      );
    }

    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.subscriptions,
      rowId: subscriptionId,
      data: { status },
    });

    revalidatePath("/admin/subscriptions");
    revalidatePath("/app/billing");
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
  const parsedDurationMonths = parseFiniteNumber(formData.get("durationMonths"));
  const durationMonths = Math.max(
    1,
    Math.min(36, Math.floor(parsedDurationMonths ?? 1))
  );

  if (!userId || !planName) return;

  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + durationMonths);

  const { tablesDB } = await createAdminClient();

  try {
    await deactivateOtherActiveSubscriptions(tablesDB, userId);

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
    revalidatePath("/app/billing");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to create subscription."
    );
  }
}
