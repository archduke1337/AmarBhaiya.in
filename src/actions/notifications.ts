"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";

import { requireAuth, requireRole } from "@/lib/appwrite/auth";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";

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

async function processInBatches<T>(
  entries: T[],
  batchSize: number,
  worker: (entry: T) => Promise<void>
): Promise<void> {
  for (let index = 0; index < entries.length; index += batchSize) {
    const batch = entries.slice(index, index + batchSize);
    await Promise.allSettled(batch.map((entry) => worker(entry)));
  }
}

// ── Get User Notifications ──────────────────────────────────────────────────

export async function getUserNotifications(): Promise<Notification[]> {
  const user = await requireAuth();
  const { tablesDB } = await createAdminClient();

  try {
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
        body: String(r.body ?? ""),
        link: String(r.link ?? ""),
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
  const { tablesDB } = await createAdminClient();

  try {
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
    const result = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.notifications,
      queries: [
        Query.equal("userId", [user.$id]),
        Query.equal("isRead", [false]),
        Query.limit(200),
      ],
    });

    await processInBatches(result.rows as AnyRow[], 25, async (row) => {
      await tablesDB.updateRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.notifications,
        rowId: row.$id,
        data: { isRead: true },
      });
    });

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

    await tablesDB.createRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.notifications,
      rowId: ID.unique(),
      data: {
        userId,
        type,
        title,
        body,
        link,
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    });
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

    // Get all users
    const allUsers = await users.list({ queries: [Query.limit(500)] });
    const createdAt = new Date().toISOString();

    await processInBatches(allUsers.users, 50, async (user) => {
      await tablesDB.createRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.notifications,
        rowId: ID.unique(),
        data: {
          userId: user.$id,
          type,
          title,
          body,
          link,
          isRead: false,
          createdAt,
        },
      });
    });

    revalidatePath("/admin");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to broadcast."
    );
  }
}
