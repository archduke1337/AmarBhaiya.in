"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";

import { requireAuth, requireRole } from "@/lib/appwrite/auth";
import {
  userCanManageCourse,
  userHasCourseAccess,
} from "@/lib/appwrite/access";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";

type AnyRow = Record<string, unknown> & { $id: string };

async function getAssignmentRow(assignmentId: string): Promise<AnyRow | null> {
  const { tablesDB } = await createAdminClient();

  try {
    return (await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.assignments,
      rowId: assignmentId,
    })) as AnyRow;
  } catch {
    return null;
  }
}

async function getSubmissionRow(submissionId: string): Promise<AnyRow | null> {
  const { tablesDB } = await createAdminClient();

  try {
    return (await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.submissions,
      rowId: submissionId,
    })) as AnyRow;
  } catch {
    return null;
  }
}

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
  const { user, role } = await requireRole(["admin", "instructor"]);

  const courseId = String(formData.get("courseId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "");

  if (!courseId || !title) return;
  if (!(await userCanManageCourse(courseId, role, user.$id))) return;

  try {
    const { tablesDB } = await createAdminClient();

    if (lessonId) {
      const lesson = (await tablesDB.getRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.lessons,
        rowId: lessonId,
      }).catch(() => null)) as AnyRow | null;

      if (!lesson || String(lesson.courseId ?? "") !== courseId) {
        return;
      }
    }

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
  const { user, role } = await requireRole(["admin", "instructor"]);

  const assignmentId = String(formData.get("assignmentId") ?? "");
  if (!assignmentId) return;

  try {
    const assignment = await getAssignmentRow(assignmentId);
    if (!assignment) return;
    if (!(await userCanManageCourse(String(assignment.courseId ?? ""), role, user.$id))) {
      return;
    }

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

  const assignment = await getAssignmentRow(assignmentId);
  if (!assignment) return;

  const courseId = String(assignment.courseId ?? "");
  const lessonId = String(assignment.lessonId ?? "");
  if (!courseId) return;
  if (!(await userHasCourseAccess({ courseId, userId: user.$id, lessonId: lessonId || undefined }))) {
    return;
  }

  const { tablesDB } = await createAdminClient();

  let existingSubmission: AnyRow | null = null;
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

    existingSubmission = (existing.rows[0] as AnyRow | undefined) ?? null;
  } catch {
    existingSubmission = null;
  }

  // Handle file upload
  const file = formData.get("file") as File | null;
  let uploadedFileId = "";

  if (file && file.size > 0) {
    const { storage } = await createAdminClient();

    try {
      const uploaded = await storage.createFile(
        APPWRITE_CONFIG.buckets.courseResources,
        ID.unique(),
        file
      );
      uploadedFileId = uploaded.$id;
    } catch (error) {
      console.error(
        error instanceof Error ? error.message : "Failed to upload file."
      );
      return;
    }
  }

  if (!uploadedFileId) {
    return;
  }

  if (existingSubmission) {
    try {
      await tablesDB.updateRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.submissions,
        rowId: existingSubmission.$id,
        data: {
          fileId: uploadedFileId,
          submittedAt: new Date().toISOString(),
        },
      });
      revalidatePath("/app");
      revalidatePath("/app/assignments");
      return;
    } catch (error) {
      console.error(
        error instanceof Error ? error.message : "Failed to update submission."
      );
      return;
    }
  }

  try {
    await tablesDB.createRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.submissions,
      rowId: ID.unique(),
      data: {
        assignmentId,
        userId: user.$id,
        fileId: uploadedFileId,
        submittedAt: new Date().toISOString(),
        grade: 0,
        feedback: "",
      },
    });

    revalidatePath("/app");
    revalidatePath("/app/assignments");
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
  const { user, role } = await requireRole(["admin", "instructor"]);
  const assignment = await getAssignmentRow(assignmentId);
  if (!assignment) return [];
  if (!(await userCanManageCourse(String(assignment.courseId ?? ""), role, user.$id))) {
    return [];
  }

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

    const submissions = await Promise.all(
      result.rows.map(async (entry) => {
        const row = entry as AnyRow;
        let userName = "Student";

        try {
          const u = await users.get(String(row.userId ?? ""));
          userName = u.name || u.email;
        } catch {
          // User may not exist.
        }

        return {
          id: row.$id,
          assignmentId: String(row.assignmentId ?? ""),
          userId: String(row.userId ?? ""),
          userName,
          fileId: String(row.fileId ?? ""),
          submittedAt: String(row.submittedAt ?? ""),
          grade: Number(row.grade ?? 0),
          feedback: String(row.feedback ?? ""),
        } satisfies SubmissionItem;
      })
    );

    return submissions;
  } catch {
    return [];
  }
}

// ── Grade Submission (Instructor) ───────────────────────────────────────────

export async function gradeSubmissionAction(
  formData: FormData
): Promise<void> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const submissionId = String(formData.get("submissionId") ?? "");
  const grade = Math.max(0, Math.min(100, Number(formData.get("grade") ?? 0)));
  const feedback = String(formData.get("feedback") ?? "").trim();

  if (!submissionId) return;

  try {
    const submission = await getSubmissionRow(submissionId);
    if (!submission) return;

    const assignment = await getAssignmentRow(String(submission.assignmentId ?? ""));
    if (!assignment) return;
    if (!(await userCanManageCourse(String(assignment.courseId ?? ""), role, user.$id))) {
      return;
    }

    const { tablesDB } = await createAdminClient();

    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.submissions,
      rowId: submissionId,
      data: { grade, feedback },
    });

    revalidatePath("/instructor");
    revalidatePath("/instructor/submissions");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to grade submission."
    );
  }
}
