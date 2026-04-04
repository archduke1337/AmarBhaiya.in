"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";

import { requireAuth, requireRole } from "@/lib/appwrite/auth";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { processInBatches } from "@/lib/utils/batch";
import { toNotificationActionUrl } from "@/lib/utils/url";

// ── Types ───────────────────────────────────────────────────────────────────

export type Notification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  createdAt: string;
};

type AnyRow = Record<string, unknown> & { $id: string };

type CreateNotificationInput = {
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  createdAt?: string;
};

type AdminTablesDB = Awaited<ReturnType<typeof createAdminClient>>["tablesDB"];
type AdminUsers = Awaited<ReturnType<typeof createAdminClient>>["users"];

function getNotificationBody(row: AnyRow): string {
  return String(row.message ?? row.body ?? "");
}

function getNotificationLink(row: AnyRow): string {
  return String(row.actionUrl ?? row.link ?? "");
}

async function writeNotificationEntry(
  tablesDB: AdminTablesDB,
  input: CreateNotificationInput
): Promise<void> {
  const userId = input.userId.trim();
  const title = input.title.trim();

  if (!userId || !title) {
    return;
  }

  const payload = {
    userId,
    type: input.type.trim() || "info",
    title,
    message: input.body?.trim() || "",
    actionUrl: toNotificationActionUrl(input.link?.trim() || ""),
    isRead: false,
    createdAt: input.createdAt || new Date().toISOString(),
  };

  try {
    await tablesDB.createRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.notifications,
      rowId: ID.unique(),
      data: payload,
    });
  } catch {
    await tablesDB.createRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.notifications,
      rowId: ID.unique(),
      data: {
        userId,
        type: input.type.trim() || "info",
        title,
        body: input.body?.trim() || "",
        link: input.link?.trim() || "",
        isRead: false,
        createdAt: input.createdAt || new Date().toISOString(),
      },
    });
  }
}

async function listAllAdminUserIds(users: AdminUsers): Promise<string[]> {
  const userIds: string[] = [];
  const pageSize = 100;
  let offset = 0;

  while (true) {
    const page = await users.list({
      queries: [
        Query.orderDesc("registration"),
        Query.limit(pageSize),
        Query.offset(offset),
      ],
    });

    userIds.push(...page.users.map((user) => user.$id));

    if (page.users.length < pageSize) {
      break;
    }

    offset += page.users.length;
  }

  return userIds;
}

export async function createNotificationEntry(
  input: CreateNotificationInput,
  tablesDB?: AdminTablesDB
): Promise<void> {
  if (tablesDB) {
    await writeNotificationEntry(tablesDB, input);
    return;
  }

  const adminClient = await createAdminClient();
  await writeNotificationEntry(adminClient.tablesDB, input);
}

// ── Get User Notifications ──────────────────────────────────────────────────

export async function getUserNotifications(): Promise<Notification[]> {
  const user = await requireAuth();

  try {
    const { tablesDB } = await createAdminClient();

    const result = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.notifications,
      queries: [
        Query.equal("userId", [user.$id]),
        Query.orderDesc("$createdAt"),
        Query.limit(50),
      ],
    });

    return result.rows.map((row) => {
      const r = row as AnyRow;
      return {
        id: r.$id,
        userId: String(r.userId ?? ""),
        type: String(r.type ?? "info"),
        title: String(r.title ?? ""),
        body: getNotificationBody(r),
        link: getNotificationLink(r),
        isRead: Boolean(r.isRead),
        createdAt: String(r.createdAt ?? r.$createdAt ?? ""),
      };
    });
  } catch {
    return [];
  }
}

// ── Get Unread Count ────────────────────────────────────────────────────────

export async function getUnreadNotificationCount(): Promise<number> {
  const user = await requireAuth();

  try {
    const { tablesDB } = await createAdminClient();

    const result = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.notifications,
      queries: [
        Query.equal("userId", [user.$id]),
        Query.equal("isRead", [false]),
        Query.limit(1),
      ],
    });

    return result.total;
  } catch {
    return 0;
  }
}

// ── Mark as Read ────────────────────────────────────────────────────────────

export async function markNotificationReadAction(
  formData: FormData
): Promise<void> {
  const user = await requireAuth();

  const notificationId = String(formData.get("notificationId") ?? "");
  if (!notificationId) return;

  try {
    const { tablesDB } = await createAdminClient();
    const notification = (await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.notifications,
      rowId: notificationId,
    })) as AnyRow;

    if (String(notification.userId ?? "") !== user.$id) {
      return;
    }

    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.notifications,
      rowId: notificationId,
      data: { isRead: true },
    });

    revalidatePath("/app/notifications");
    revalidatePath("/app/dashboard");
  } catch {
    // Non-critical
  }
}

// ── Mark All as Read ────────────────────────────────────────────────────────

export async function markAllNotificationsReadAction(): Promise<void> {
  const user = await requireAuth();
  const { tablesDB } = await createAdminClient();

  try {
    while (true) {
      const result = await tablesDB.listRows({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.notifications,
        queries: [
          Query.equal("userId", [user.$id]),
          Query.equal("isRead", [false]),
          Query.limit(200),
        ],
      });

      const unreadRows = result.rows as AnyRow[];
      if (unreadRows.length === 0) {
        break;
      }

      await processInBatches(unreadRows, 25, async (row) => {
        await tablesDB.updateRow({
          databaseId: APPWRITE_CONFIG.databaseId,
          tableId: APPWRITE_CONFIG.tables.notifications,
          rowId: row.$id,
          data: { isRead: true },
        });
      });

      if (unreadRows.length < 200) {
        break;
      }
    }

    revalidatePath("/app/notifications");
    revalidatePath("/app/dashboard");
  } catch {
    // Non-critical
  }
}

// ── Send Notification (admin/system utility) ────────────────────────────────

export async function sendNotificationAction(
  formData: FormData
): Promise<void> {
  await requireRole(["admin"]);

  const userId = String(formData.get("userId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const link = String(formData.get("link") ?? "").trim();
  const type = String(formData.get("type") ?? "info");

  if (!userId || !title) return;

  try {
    const { tablesDB } = await createAdminClient();

    await createNotificationEntry(
      {
        userId,
        type,
        title,
        body,
        link,
      },
      tablesDB
    );

    revalidatePath("/admin/notifications");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to send notification."
    );
  }
}

// ── Broadcast Notification (to all users) ───────────────────────────────────

export async function broadcastNotificationAction(
  formData: FormData
): Promise<void> {
  await requireRole(["admin"]);

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const link = String(formData.get("link") ?? "").trim();
  const type = String(formData.get("type") ?? "announcement");

  if (!title) return;

  try {
    const { tablesDB, users } = await createAdminClient();

    const allUserIds = await listAllAdminUserIds(users);
    const createdAt = new Date().toISOString();

    await processInBatches(allUserIds, 50, async (userId) => {
      await createNotificationEntry(
        {
          userId,
          type,
          title,
          body,
          link,
          createdAt,
        },
        tablesDB
      );
    });

    revalidatePath("/admin/notifications");
    revalidatePath("/admin");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to broadcast."
    );
  }
}
