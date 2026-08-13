import { Query } from "node-appwrite";
import { APPWRITE_CONFIG } from "../config";
import { createAdminClient } from "../server";
import {
  safeListAllRows, toDate, isToday,
  type ModerationActionRow, type ForumCategoryRow, type ForumThreadRow,
} from "./internal";

export type {
  ModeratorDashboardStats, ModeratorReportItem, ModeratorStudentItem,
  ModeratorCommunityData, CommunityThreadItem,
} from "./internal";

export async function getModeratorDashboardStats() {
  try {
    const { tablesDB } = await createAdminClient();
    const rows = await safeListAllRows<ModerationActionRow>(tablesDB, APPWRITE_CONFIG.tables.moderationActions, [Query.orderDesc("$createdAt")]);
    const openReports = rows.filter((r) => r.action === "flag" && !r.revertedAt).length;
    const mutedUsers = new Set(rows.filter((r) => (r.action === "mute" || r.action === "timeout") && !r.revertedAt && typeof r.targetUserId === "string").map((r) => String(r.targetUserId))).size;
    const flaggedThreads = new Set(rows.filter((r) => r.action === "flag" && !r.revertedAt && typeof r.entityType === "string" && r.entityType.toLowerCase().includes("thread") && typeof r.entityId === "string").map((r) => String(r.entityId))).size;
    const actionsToday = rows.filter((r) => isToday(r.createdAt)).length;
    return { openReports, mutedUsers, flaggedThreads, actionsToday };
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Failed to load moderator dashboard stats.");
    return { openReports: 0, mutedUsers: 0, flaggedThreads: 0, actionsToday: 0 };
  }
}

export async function getModeratorReports() {
  try {
    const { tablesDB } = await createAdminClient();
    const rows = await safeListAllRows<ModerationActionRow>(tablesDB, APPWRITE_CONFIG.tables.moderationActions, [Query.equal("action", ["flag"]), Query.orderDesc("$createdAt")]);
    return rows.sort((a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0)).map((row) => ({
      id: row.$id, entityType: typeof row.entityType === "string" ? row.entityType : "unknown",
      entityId: typeof row.entityId === "string" ? row.entityId : "n/a",
      targetUserId: typeof row.targetUserId === "string" ? row.targetUserId : "",
      target: typeof row.targetUserName === "string" ? row.targetUserName : typeof row.targetUserId === "string" ? row.targetUserId : "Unknown user",
      reason: typeof row.reason === "string" ? row.reason : "No reason provided",
      status: row.revertedAt ? "reviewed" : "pending",
      createdAt: typeof row.createdAt === "string" ? row.createdAt : null,
    }));
  } catch (error) { console.error(error instanceof Error ? error.message : "Failed to load moderator reports."); return []; }
}

export async function getModeratorStudents() {
  try {
    const { tablesDB } = await createAdminClient();
    const rows = await safeListAllRows<ModerationActionRow>(tablesDB, APPWRITE_CONFIG.tables.moderationActions, [Query.orderDesc("$createdAt")]);
    const filteredRows = rows.filter((r) => typeof r.targetUserId === "string").sort((a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0));
    const latestByUser = new Map<string, ModerationActionRow>();
    const latestOpenByUser = new Map<string, ModerationActionRow>();
    const countByUser = new Map<string, number>();
    for (const row of filteredRows) {
      const userId = String(row.targetUserId);
      if (!latestByUser.has(userId)) latestByUser.set(userId, row);
      if (!row.revertedAt && !latestOpenByUser.has(userId)) latestOpenByUser.set(userId, row);
      countByUser.set(userId, (countByUser.get(userId) ?? 0) + 1);
    }
    return [...latestByUser.entries()].map(([userId, row]) => {
      const openRow = latestOpenByUser.get(userId);
      const displayRow = openRow ?? row;
      return {
        id: userId, latestActionId: openRow?.$id ?? row.$id,
        name: typeof displayRow.targetUserName === "string" && displayRow.targetUserName.length > 0 ? displayRow.targetUserName : userId,
        latestAction: typeof displayRow.action === "string" ? displayRow.action : "unknown",
        latestReason: typeof displayRow.reason === "string" ? displayRow.reason : "No notes",
        latestScope: typeof displayRow.scope === "string" ? displayRow.scope : "platform",
        lastActionAt: typeof displayRow.createdAt === "string" ? displayRow.createdAt : null,
        actionCount: countByUser.get(userId) ?? 1, status: openRow ? "open" : "resolved",
      };
    });
  } catch (error) { console.error(error instanceof Error ? error.message : "Failed to load moderator students."); return []; }
}

export async function getModeratorCommunityData() {
  try {
    const { tablesDB } = await createAdminClient();
    const [actionRows, categoryRows, threadRows] = await Promise.all([
      safeListAllRows<ModerationActionRow>(tablesDB, APPWRITE_CONFIG.tables.moderationActions, [Query.orderDesc("$createdAt")]),
      safeListAllRows<ForumCategoryRow>(tablesDB, APPWRITE_CONFIG.tables.forumCategories, [Query.orderAsc("name")]),
      safeListAllRows<ForumThreadRow>(tablesDB, APPWRITE_CONFIG.tables.forumThreads, [Query.orderDesc("lastReplyAt")]),
    ]);
    const counts = { warn: 0, mute: 0, timeout: 0, deletePost: 0, flag: 0 };
    for (const action of actionRows) {
      if (action.action === "warn") counts.warn += 1;
      if (action.action === "mute") counts.mute += 1;
      if (action.action === "timeout") counts.timeout += 1;
      if (action.action === "delete_post") counts.deletePost += 1;
      if (action.action === "flag") counts.flag += 1;
    }
    const categoryNameById = new Map(categoryRows.map((c) => [c.$id, typeof c.name === "string" ? c.name : "General"]));
    const recentThreads = threadRows.sort((a, b) => (toDate(b.lastReplyAt ?? b.createdAt)?.getTime() ?? 0) - (toDate(a.lastReplyAt ?? a.createdAt)?.getTime() ?? 0)).map((thread) => ({
      id: thread.$id, title: typeof thread.title === "string" ? thread.title : "Untitled thread",
      authorId: typeof thread.userId === "string" ? thread.userId : "",
      author: typeof thread.userName === "string" ? thread.userName : "Unknown user",
      replies: Number(thread.replyCount ?? 0), pinned: Boolean(thread.isPinned), locked: Boolean(thread.isLocked),
      category: (typeof thread.forumCatId === "string" && categoryNameById.get(thread.forumCatId)) || "General",
    }));
    return {
      actionCounts: [
        { label: "Warn", value: counts.warn }, { label: "Mute", value: counts.mute },
        { label: "Timeout", value: counts.timeout }, { label: "Delete Post", value: counts.deletePost },
        { label: "Flag", value: counts.flag },
      ],
      recentThreads,
    };
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Failed to load moderator community data.");
    return { actionCounts: [{ label: "Warn", value: 0 }, { label: "Mute", value: 0 }, { label: "Timeout", value: 0 }, { label: "Delete Post", value: 0 }, { label: "Flag", value: 0 }], recentThreads: [] };
  }
}
