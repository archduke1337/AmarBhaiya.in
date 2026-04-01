"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";

import { requireAuth, requireRole } from "@/lib/appwrite/auth";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";

type AnyRow = Record<string, unknown> & { $id: string };

// ── Types ───────────────────────────────────────────────────────────────────

export type AssignmentItem = {
  id: string;
  lessonId: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
};

export type SubmissionItem = {
  id: string;
  assignmentId: string;
  userId: string;
  userName: string;
  fileId: string;
  submittedAt: string;
  grade: number;
  feedback: string;
};

// ── Create Assignment (Instructor) ──────────────────────────────────────────

export async function createAssignmentAction(
  formData: FormData
): Promise<void> {
  await requireRole(["admin", "instructor"]);

  const courseId = String(formData.get("courseId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "");

  if (!courseId || !title) return;

  try {
    const { tablesDB } = await createAdminClient();

    await tablesDB.createRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.assignments,
      rowId: ID.unique(),
      data: {
        courseId,
        lessonId: lessonId || "",
        title,
        description,
        dueDate: dueDate || "",
      },
    });

    revalidatePath(`/instructor/courses/${courseId}/curriculum`);
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to create assignment."
    );
  }
}

// ── Get Course Assignments ──────────────────────────────────────────────────

export async function getCourseAssignments(
  courseId: string
): Promise<AssignmentItem[]> {
  const { tablesDB } = await createAdminClient();

  try {
    const result = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.assignments,
      queries: [
        Query.equal("courseId", [courseId]),
        Query.orderDesc("$createdAt"),
        Query.limit(50),
      ],
    });

    return result.rows.map((r) => {
      const row = r as AnyRow;
      return {
        id: row.$id,
        lessonId: String(row.lessonId ?? ""),
        courseId: String(row.courseId ?? ""),
        title: String(row.title ?? "Assignment"),
        description: String(row.description ?? ""),
        dueDate: String(row.dueDate ?? ""),
      };
    });
  } catch {
    return [];
  }
}

// ── Delete Assignment ───────────────────────────────────────────────────────

export async function deleteAssignmentAction(
  formData: FormData
): Promise<void> {
  await requireRole(["admin", "instructor"]);

  const assignmentId = String(formData.get("assignmentId") ?? "");
  if (!assignmentId) return;

  try {
    const { tablesDB } = await createAdminClient();

    await tablesDB.deleteRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.assignments,
      rowId: assignmentId,
    });

    revalidatePath("/instructor");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to delete assignment."
    );
  }
}

// ── Submit Assignment (Student) ─────────────────────────────────────────────

export async function submitAssignmentAction(
  formData: FormData
): Promise<void> {
  const user = await requireAuth();

  const assignmentId = String(formData.get("assignmentId") ?? "");
  if (!assignmentId) return;

  // Handle file upload
  const file = formData.get("file") as File | null;
  let fileId = "";

  if (file && file.size > 0) {
    const { storage } = await createAdminClient();

    try {
      const uploaded = await storage.createFile(
        APPWRITE_CONFIG.buckets.courseResources,
        ID.unique(),
        file
      );
      fileId = uploaded.$id;
    } catch (error) {
      console.error(
        error instanceof Error ? error.message : "Failed to upload file."
      );
      return;
    }
  }

  const { tablesDB } = await createAdminClient();

  // Check for existing submission
  try {
    const existing = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.submissions,
      queries: [
        Query.equal("assignmentId", [assignmentId]),
        Query.equal("userId", [user.$id]),
        Query.limit(1),
      ],
    });

    if (existing.rows.length > 0) {
      // Update existing submission
      const row = existing.rows[0] as AnyRow;
      await tablesDB.updateRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.submissions,
        rowId: row.$id,
        data: {
          fileId,
          submittedAt: new Date().toISOString(),
        },
      });
      revalidatePath("/app");
      return;
    }
  } catch {
    // Continue to create
  }

  try {
    await tablesDB.createRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.submissions,
      rowId: ID.unique(),
      data: {
        assignmentId,
        userId: user.$id,
        fileId,
        submittedAt: new Date().toISOString(),
        grade: 0,
        feedback: "",
      },
    });

    revalidatePath("/app");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to submit assignment."
    );
  }
}

// ── Get Submissions for Assignment (Instructor) ─────────────────────────────

export async function getAssignmentSubmissions(
  assignmentId: string
): Promise<SubmissionItem[]> {
  await requireRole(["admin", "instructor"]);
  const { tablesDB, users } = await createAdminClient();

  try {
    const result = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.submissions,
      queries: [
        Query.equal("assignmentId", [assignmentId]),
        Query.orderDesc("$createdAt"),
        Query.limit(100),
      ],
    });

    const submissions: SubmissionItem[] = [];

    for (const r of result.rows) {
      const row = r as AnyRow;
      let userName = "Student";

      try {
        const u = await users.get(String(row.userId ?? ""));
        userName = u.name || u.email;
      } catch {
        // User may not exist
      }

      submissions.push({
        id: row.$id,
        assignmentId: String(row.assignmentId ?? ""),
        userId: String(row.userId ?? ""),
        userName,
        fileId: String(row.fileId ?? ""),
        submittedAt: String(row.submittedAt ?? ""),
        grade: Number(row.grade ?? 0),
        feedback: String(row.feedback ?? ""),
      });
    }

    return submissions;
  } catch {
    return [];
  }
}

// ── Grade Submission (Instructor) ───────────────────────────────────────────

export async function gradeSubmissionAction(
  formData: FormData
): Promise<void> {
  await requireRole(["admin", "instructor"]);

  const submissionId = String(formData.get("submissionId") ?? "");
  const grade = Number(formData.get("grade") ?? 0);
  const feedback = String(formData.get("feedback") ?? "").trim();

  if (!submissionId) return;

  try {
    const { tablesDB } = await createAdminClient();

    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.submissions,
      rowId: submissionId,
      data: { grade, feedback },
    });

    revalidatePath("/instructor");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to grade submission."
    );
  }
}
