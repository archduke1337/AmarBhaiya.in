"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/appwrite/auth";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { sanitizeHtml, escapeHtml } from "@/lib/utils/sanitize";

type AnyRow = Record<string, unknown> & { $id: string };

export type LessonComment = {
  id: string;
  userName: string;
  userRole: string;
  text: string;
  createdAt: string;
  isPinned: boolean;
};

// ── Post Comment ────────────────────────────────────────────────────────────

export async function postLessonCommentAction(
  formData: FormData
): Promise<void> {
  const user = await requireAuth();
  const lessonId = String(formData.get("lessonId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  let text = String(formData.get("text") ?? "").trim();

  if (!lessonId || !courseId || !text) return;

  // SECURITY: Sanitize HTML to prevent XSS attacks
  text = sanitizeHtml(text);

  try {
    const { tablesDB } = await createAdminClient();

    await tablesDB.createRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.courseComments,
      rowId: ID.unique(),
      data: {
        lessonId,
        courseId,
        userId: user.$id,
        userName: user.name || "Anonymous",
        userRole: String(user.prefs?.role ?? "student"),
        text, // Now sanitized
        parentId: "",
        createdAt: new Date().toISOString(),
        isPinned: false,
        isDeleted: false,
        likes: 0,
      },
    });

    revalidatePath(`/app/learn/${courseId}/${lessonId}`);
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to post comment."
    );
  }
}

// ── Get Lesson Comments ─────────────────────────────────────────────────────

export async function getLessonComments(
  lessonId: string
): Promise<LessonComment[]> {
  const { tablesDB } = await createAdminClient();

  try {
    const result = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.courseComments,
      queries: [
        Query.equal("lessonId", [lessonId]),
        Query.equal("isDeleted", [false]),
        Query.orderDesc("$createdAt"),
        Query.limit(100),
      ],
    });

    return result.rows.map((r) => {
      const row = r as AnyRow;
      return {
        id: row.$id,
        userName: String(row.userName ?? "Anonymous"),
        userRole: String(row.userRole ?? "student"),
        text: String(row.text ?? ""),
        createdAt: String(row.createdAt ?? row.$createdAt ?? ""),
        isPinned: Boolean(row.isPinned),
      };
    });
  } catch {
    return [];
  }
}
