import { Query } from "node-appwrite";
import { APPWRITE_CONFIG } from "../config";
import { createSessionClient } from "../server";
import {
  safeListAllRows, toDate,
  type CommunityThreadItem, type CommunityCategoryItem,
  type ForumCategoryRow, type ForumThreadRow,
} from "./internal";

export async function getCommunityThreadsData(): Promise<CommunityThreadItem[]> {
  try {
    const { tablesDB } = await createSessionClient();
    const [categoryRows, threadRows] = await Promise.all([
      safeListAllRows<ForumCategoryRow>(tablesDB, APPWRITE_CONFIG.tables.forumCategories),
      safeListAllRows<ForumThreadRow>(tablesDB, APPWRITE_CONFIG.tables.forumThreads),
    ]);
    const categoryNameById = new Map<string, string>(
      categoryRows.map((c) => [c.$id, typeof c.name === "string" ? c.name : "General"])
    );
    return threadRows
      .sort((a, b) => {
        const aPinned = Boolean(a.isPinned) ? 1 : 0;
        const bPinned = Boolean(b.isPinned) ? 1 : 0;
        if (aPinned !== bPinned) return bPinned - aPinned;
        const aDate = toDate(a.lastReplyAt ?? a.createdAt)?.getTime() ?? 0;
        const bDate = toDate(b.lastReplyAt ?? b.createdAt)?.getTime() ?? 0;
        return bDate - aDate;
      })
      .map((thread) => ({
        id: thread.$id,
        title: typeof thread.title === "string" ? thread.title : "Untitled thread",
        authorId: typeof thread.userId === "string" ? thread.userId : "",
        author: typeof thread.userName === "string" ? thread.userName : "Unknown user",
        replies: typeof thread.replyCount === "number" ? thread.replyCount : 0,
        pinned: Boolean(thread.isPinned),
        locked: Boolean(thread.isLocked),
        category: (typeof thread.forumCatId === "string" && categoryNameById.get(thread.forumCatId)) || "General",
      }));
  } catch {
    return [];
  }
}

export async function getCommunityCategoriesData(): Promise<CommunityCategoryItem[]> {
  try {
    const { tablesDB } = await createSessionClient();
    const categoryRows = await safeListAllRows<ForumCategoryRow>(
      tablesDB, APPWRITE_CONFIG.tables.forumCategories,
      [Query.orderAsc("order")]
    );
    return categoryRows.map((c) => ({
      id: c.$id,
      name: typeof c.name === "string" ? c.name : "General",
    }));
  } catch {
    return [];
  }
}
