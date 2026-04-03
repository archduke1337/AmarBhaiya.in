"use server";

import { Query } from "node-appwrite";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/appwrite/auth";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import type { Role } from "@/lib/utils/constants";

// ── Helpers ─────────────────────────────────────────────────────────────────

async function userOwnsCourse(courseId: string, role: Role, userId: string): Promise<boolean> {
  if (role === "admin") return true;

  const { tablesDB } = await createAdminClient();
  try {
    const course = (await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.courses,
      rowId: courseId,
    })) as { instructorId?: string };

    return course.instructorId === userId;
  } catch {
    return false;
  }
}

// ── Delete Course ───────────────────────────────────────────────────────────
// Admin only. Cascades: deletes all modules, lessons, enrollments, progress.

export async function deleteCourseAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);

  const courseId = String(formData.get("courseId") ?? "");
  if (!courseId) return;

  const { tablesDB } = await createAdminClient();

  // Delete child rows (paginated to handle >2000 records)
  const childTables = [
    APPWRITE_CONFIG.tables.lessons,
    APPWRITE_CONFIG.tables.modules,
    APPWRITE_CONFIG.tables.enrollments,
    APPWRITE_CONFIG.tables.progress,
  ];

  const failedDeletes: string[] = [];

  for (const tableId of childTables) {
    try {
      let hasMore = true;
      while (hasMore) {
        const rows = await tablesDB.listRows({
          databaseId: APPWRITE_CONFIG.databaseId,
          tableId,
          queries: [Query.equal("courseId", [courseId]), Query.limit(500)],
        });

        if (rows.rows.length === 0) {
          hasMore = false;
          break;
        }

        for (const row of rows.rows) {
          try {
            await tablesDB.deleteRow({
              databaseId: APPWRITE_CONFIG.databaseId,
              tableId,
              rowId: (row as { $id: string }).$id,
            });
          } catch (error) {
            const rowId = (row as { $id: string }).$id;
            failedDeletes.push(`${tableId}/${rowId}`);
            console.error(`[Delete] Failed to delete ${tableId}/${rowId}:`, error instanceof Error ? error.message : error);
          }
        }

        // If we got fewer than 500, we're done
        if (rows.rows.length < 500) {
          hasMore = false;
        }
      }
    } catch (error) {
      console.error(`[Delete] Failed to query ${tableId} for courseId=${courseId}:`, error instanceof Error ? error.message : error);
    }
  }

  if (failedDeletes.length > 0) {
    console.warn(`[Delete] ${failedDeletes.length} child rows failed to delete for course ${courseId}. Orphaned records:`, failedDeletes);
  }

  // Delete the course itself
  try {
    await tablesDB.deleteRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.courses,
      rowId: courseId,
    });
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to delete course."
    );
    return;
  }

  revalidatePath("/admin/courses");
  revalidatePath("/instructor/courses");
  revalidatePath("/courses");
}

// ── Delete Module ───────────────────────────────────────────────────────────
// Instructor (owner) or Admin. Cascades: deletes all lessons in the module.

export async function deleteModuleAction(formData: FormData): Promise<void> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const courseId = String(formData.get("courseId") ?? "");
  const moduleId = String(formData.get("moduleId") ?? "");
  if (!courseId || !moduleId) return;

  if (!(await userOwnsCourse(courseId, role, user.$id))) return;

  const { tablesDB } = await createAdminClient();

  // Delete lessons in this module
  try {
    const lessons = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.lessons,
      queries: [Query.equal("moduleId", [moduleId]), Query.limit(500)],
    });

    for (const lesson of lessons.rows) {
      try {
        await tablesDB.deleteRow({
          databaseId: APPWRITE_CONFIG.databaseId,
          tableId: APPWRITE_CONFIG.tables.lessons,
          rowId: (lesson as { $id: string }).$id,
        });
      } catch {
        // Continue
      }
    }
  } catch {
    // No lessons to delete
  }

  // Delete the module
  try {
    await tablesDB.deleteRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.modules,
      rowId: moduleId,
    });
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to delete module."
    );
  }

  revalidatePath(`/instructor/courses/${courseId}/curriculum`);
}

// ── Delete Lesson ───────────────────────────────────────────────────────────

export async function deleteLessonAction(formData: FormData): Promise<void> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const courseId = String(formData.get("courseId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  if (!courseId || !lessonId) return;

  if (!(await userOwnsCourse(courseId, role, user.$id))) return;

  const { tablesDB } = await createAdminClient();

  try {
    await tablesDB.deleteRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.lessons,
      rowId: lessonId,
    });
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to delete lesson."
    );
  }

  // Re-count lessons for the course
  try {
    const remaining = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.lessons,
      queries: [Query.equal("courseId", [courseId]), Query.limit(2000)],
    });

    const totalDuration = remaining.rows.reduce((sum, row) => {
      const d = Number((row as { duration?: unknown }).duration ?? 0);
      return sum + (Number.isFinite(d) ? d : 0);
    }, 0);

    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.courses,
      rowId: courseId,
      data: { totalLessons: remaining.total, totalDuration },
    });
  } catch {
    // Non-critical
  }

  revalidatePath(`/instructor/courses/${courseId}/curriculum`);
}

// ── Delete Category ─────────────────────────────────────────────────────────
// SECURITY FIX: Prevent deletion if courses are assigned to this category

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);

  const categoryId = String(formData.get("categoryId") ?? "");
  if (!categoryId) return;

  const { tablesDB } = await createAdminClient();

  try {
    // VALIDATION: Check if any courses use this category
    const coursesUsingCategory = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.courses,
      queries: [Query.equal("categoryId", [categoryId]), Query.limit(1)],
    });

    if (coursesUsingCategory.total > 0) {
      console.error(
        `[Delete] Cannot delete category ${categoryId}. ${coursesUsingCategory.total} courses assigned to this category.`
      );
      return; // Prevent deletion of category with active courses
    }

    await tablesDB.deleteRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.categories,
      rowId: categoryId,
    });
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to delete category."
    );
  }

  revalidatePath("/admin/categories");
  revalidatePath("/instructor/categories");
}

// ── Delete Forum Thread ─────────────────────────────────────────────────────
// Admin or Moderator. Cascades: deletes all replies.

export async function deleteForumThreadAction(
  formData: FormData
): Promise<void> {
  await requireRole(["admin", "moderator"]);

  const threadId = String(formData.get("threadId") ?? "");
  if (!threadId) return;

  const { tablesDB } = await createAdminClient();

  // Delete replies first
  try {
    const replies = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.forumReplies,
      queries: [Query.equal("threadId", [threadId]), Query.limit(2000)],
    });

    for (const reply of replies.rows) {
      try {
        await tablesDB.deleteRow({
          databaseId: APPWRITE_CONFIG.databaseId,
          tableId: APPWRITE_CONFIG.tables.forumReplies,
          rowId: (reply as { $id: string }).$id,
        });
      } catch {
        // Continue
      }
    }
  } catch {
    // No replies
  }

  // Delete the thread
  try {
    await tablesDB.deleteRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.forumThreads,
      rowId: threadId,
    });
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to delete thread."
    );
  }

  revalidatePath("/app/community");
  revalidatePath("/moderator/community");
}

// ── Delete Forum Reply ──────────────────────────────────────────────────────

export async function deleteForumReplyAction(
  formData: FormData
): Promise<void> {
  await requireRole(["admin", "moderator"]);

  const replyId = String(formData.get("replyId") ?? "");
  const threadId = String(formData.get("threadId") ?? "");
  if (!replyId) return;

  const { tablesDB } = await createAdminClient();

  try {
    await tablesDB.deleteRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.forumReplies,
      rowId: replyId,
    });

    // Decrement reply count on thread
    if (threadId) {
      try {
        const thread = (await tablesDB.getRow({
          databaseId: APPWRITE_CONFIG.databaseId,
          tableId: APPWRITE_CONFIG.tables.forumThreads,
          rowId: threadId,
        })) as { replyCount?: number };

        const newCount = Math.max(0, Number(thread.replyCount ?? 1) - 1);
        await tablesDB.updateRow({
          databaseId: APPWRITE_CONFIG.databaseId,
          tableId: APPWRITE_CONFIG.tables.forumThreads,
          rowId: threadId,
          data: { replyCount: newCount },
        });
      } catch {
        // Non-critical
      }
    }
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to delete reply."
    );
  }

  revalidatePath("/app/community");
  revalidatePath("/moderator/community");
  if (threadId) {
    revalidatePath(`/app/community/${threadId}`);
  }
}

// ── Delete Live Session ─────────────────────────────────────────────────────

export async function deleteLiveSessionAction(
  formData: FormData
): Promise<void> {
  await requireRole(["admin"]);

  const sessionId = String(formData.get("sessionId") ?? "");
  if (!sessionId) return;

  const { tablesDB } = await createAdminClient();

  // Delete RSVPs
  try {
    const rsvps = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.sessionRsvps,
      queries: [Query.equal("sessionId", [sessionId]), Query.limit(2000)],
    });

    for (const rsvp of rsvps.rows) {
      try {
        await tablesDB.deleteRow({
          databaseId: APPWRITE_CONFIG.databaseId,
          tableId: APPWRITE_CONFIG.tables.sessionRsvps,
          rowId: (rsvp as { $id: string }).$id,
        });
      } catch {
        // Continue
      }
    }
  } catch {
    // No RSVPs
  }

  try {
    await tablesDB.deleteRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.liveSessions,
      rowId: sessionId,
    });
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to delete session."
    );
  }

  revalidatePath("/admin/live");
  revalidatePath("/instructor/live");
}
