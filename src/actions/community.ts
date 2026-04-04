"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuth, requireRole } from "@/lib/appwrite/auth";
import { getUserRole } from "@/lib/appwrite/auth-utils";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import {
  listAllRows,
  type AnyAppwriteRow,
} from "@/lib/appwrite/row-pagination";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";
import { sanitizeHtml } from "@/lib/utils/sanitize";

// ── Schema ──────────────────────────────────────────────────────────────────

const createReplySchema = z.object({
  threadId: z.string().min(1, "Thread ID is required."),
  body: z.string().trim().min(3, "Reply must be at least 3 characters."),
});

// ── Types ───────────────────────────────────────────────────────────────────

export type ForumReply = {
  id: string;
  threadId: string;
  userId: string;
  userName: string;
  userRole: string;
  body: string;
  createdAt: string;
  isDeleted: boolean;
};

export type ForumThreadDetail = {
  id: string;
  title: string;
  body: string;
  category: string;
  categoryName: string;
  author: string;
  authorId: string;
  authorRole: string;
  pinned: boolean;
  locked: boolean;
  replyCount: number;
  createdAt: string;
};

type AnyRow = AnyAppwriteRow;

async function getForumThreadRow(threadId: string): Promise<AnyRow | null> {
  const { tablesDB } = await createAdminClient();

  try {
    return (await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.forumThreads,
      rowId: threadId,
    })) as AnyRow;
  } catch {
    return null;
  }
}

async function syncForumThreadReplyMetadata(threadId: string): Promise<void> {
  const { tablesDB } = await createAdminClient();
  const thread = await getForumThreadRow(threadId);
  if (!thread) {
    return;
  }

  const replies = await tablesDB.listRows({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.tables.forumReplies,
    queries: [
      Query.equal("threadId", [threadId]),
      Query.equal("isDeleted", [false]),
      Query.orderDesc("$createdAt"),
      Query.limit(1),
    ],
  });

  const latestReply = replies.rows[0] as AnyRow | undefined;
  await tablesDB.updateRow({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.tables.forumThreads,
    rowId: threadId,
    data: {
      replyCount: replies.total,
      lastReplyAt: String(
        latestReply?.createdAt
          ?? latestReply?.$createdAt
          ?? thread.createdAt
          ?? thread.$createdAt
          ?? new Date().toISOString()
      ),
    },
  });
}

// ── Create Reply ────────────────────────────────────────────────────────────

export async function createForumReplyAction(
  formData: FormData
): Promise<void> {
  const user = await requireAuth();

  const parsed = createReplySchema.safeParse({
    threadId: String(formData.get("threadId") ?? ""),
    body: String(formData.get("body") ?? ""),
  });

  if (!parsed.success) return;

  try {
    const { tablesDB } = await createSessionClient();
    const now = new Date().toISOString();

    // Check thread exists and is not locked
    const thread = (await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.forumThreads,
      rowId: parsed.data.threadId,
    })) as AnyRow;

    if (Boolean(thread.isLocked)) {
      return; // Thread is locked, can't reply
    }

    // Create the reply
    await tablesDB.createRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.forumReplies,
      rowId: ID.unique(),
      data: {
        threadId: parsed.data.threadId,
        userId: user.$id,
        userName: user.name,
        userRole: getUserRole(user),
        body: sanitizeHtml(parsed.data.body),
        createdAt: now,
        isDeleted: false,
      },
    });

    await syncForumThreadReplyMetadata(parsed.data.threadId);

    revalidatePath("/app/community");
    revalidatePath(`/app/community/${parsed.data.threadId}`);
    revalidatePath("/moderator/community");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to create reply."
    );
  }
}

// ── Get Thread Detail ───────────────────────────────────────────────────────

export async function getForumThreadDetail(
  threadId: string
): Promise<ForumThreadDetail | null> {
  const { tablesDB } = await createAdminClient();

  try {
    const thread = (await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.forumThreads,
      rowId: threadId,
    })) as AnyRow;

    // Get category name
    let categoryName = "General";
    try {
      const cat = (await tablesDB.getRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.forumCategories,
        rowId: String(thread.forumCatId ?? ""),
      })) as AnyRow;
      categoryName = String(cat.name ?? "General");
    } catch {
      // Category not found
    }

    return {
      id: thread.$id,
      title: String(thread.title ?? ""),
      body: String(thread.body ?? ""),
      category: String(thread.forumCatId ?? ""),
      categoryName,
      author: String(thread.userName ?? "Anonymous"),
      authorId: String(thread.userId ?? ""),
      authorRole: String(thread.userRole ?? "student"),
      pinned: Boolean(thread.isPinned),
      locked: Boolean(thread.isLocked),
      replyCount: Number(thread.replyCount ?? 0),
      createdAt: String(thread.createdAt ?? ""),
    };
  } catch {
    return null;
  }
}

// ── Get Thread Replies ──────────────────────────────────────────────────────

export async function getForumThreadReplies(
  threadId: string
): Promise<ForumReply[]> {
  const { tablesDB } = await createAdminClient();

  try {
    const rows = await listAllRows<AnyRow>(tablesDB, APPWRITE_CONFIG.tables.forumReplies, [
      Query.equal("threadId", [threadId]),
      Query.orderAsc("$createdAt"),
    ]);

    return rows.map((r) => {
      return {
        id: r.$id,
        threadId: String(r.threadId ?? ""),
        userId: String(r.userId ?? ""),
        userName: String(r.userName ?? "Anonymous"),
        userRole: String(r.userRole ?? "student"),
        body: String(r.body ?? ""),
        createdAt: String(r.createdAt ?? ""),
        isDeleted: Boolean(r.isDeleted),
      };
    });
  } catch {
    return [];
  }
}

// ── Delete Reply (Moderator) ────────────────────────────────────────────────

export async function deleteForumReplyAction(
  formData: FormData
): Promise<void> {
  await requireRole(["admin", "moderator"]);

  const replyId = String(formData.get("replyId") ?? "").trim();
  const threadId = String(formData.get("threadId") ?? "").trim();
  if (!replyId) return;

  const { tablesDB } = await createAdminClient();

  try {
    const reply = (await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.forumReplies,
      rowId: replyId,
    }).catch(() => null)) as AnyRow | null;
    if (!reply || Boolean(reply.isDeleted)) {
      return;
    }

    const resolvedThreadId = String(reply.threadId ?? threadId);

    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.forumReplies,
      rowId: replyId,
      data: {
        isDeleted: true,
        body: "[Removed by moderator]",
      },
    });

    await syncForumThreadReplyMetadata(resolvedThreadId);

    if (resolvedThreadId) {
      revalidatePath(`/app/community/${resolvedThreadId}`);
    }
    revalidatePath("/app/community");
    revalidatePath("/moderator/community");
  } catch (error) {
    console.error("[Mod] Reply delete failed:", error instanceof Error ? error.message : error);
  }
}

// ── Lock Thread (Moderator) ─────────────────────────────────────────────────

export async function lockThreadAction(formData: FormData): Promise<void> {
  await requireRole(["admin", "moderator"]);

  const threadId = String(formData.get("threadId") ?? "").trim();
  if (!threadId) return;

  const { tablesDB } = await createAdminClient();

  try {
    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.forumThreads,
      rowId: threadId,
      data: { isLocked: true },
    });

    revalidatePath(`/app/community/${threadId}`);
    revalidatePath("/app/community");
    revalidatePath("/moderator/community");
  } catch (error) {
    console.error("[Mod] Lock thread failed:", error instanceof Error ? error.message : error);
  }
}

// ── Unlock Thread (Moderator) ───────────────────────────────────────────────

export async function unlockThreadAction(formData: FormData): Promise<void> {
  await requireRole(["admin", "moderator"]);

  const threadId = String(formData.get("threadId") ?? "").trim();
  if (!threadId) return;

  const { tablesDB } = await createAdminClient();

  try {
    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.forumThreads,
      rowId: threadId,
      data: { isLocked: false },
    });

    revalidatePath(`/app/community/${threadId}`);
    revalidatePath("/app/community");
    revalidatePath("/moderator/community");
  } catch (error) {
    console.error("[Mod] Unlock thread failed:", error instanceof Error ? error.message : error);
  }
}
