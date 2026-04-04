"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";

import { requireAuth, requireRole } from "@/lib/appwrite/auth";
import {
  userCanManageCourse,
  userHasCourseAccess,
} from "@/lib/appwrite/access";
import { createNotificationEntry } from "@/actions/notifications";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import {
  listAllRows,
  type AnyAppwriteRow,
} from "@/lib/appwrite/row-pagination";
import { createAdminClient } from "@/lib/appwrite/server";
import {
  ASSIGNMENT_SUBMISSION_ALLOWED_EXTENSIONS,
  ASSIGNMENT_SUBMISSION_ALLOWED_MIMES,
  ASSIGNMENT_SUBMISSION_MAX_BYTES,
  getAssignmentSubmissionFileExtension,
} from "@/lib/uploads/assignment-submission";
import { clampNumber, parseFiniteNumber } from "@/lib/utils/number";
import { validateFileMimeType } from "@/lib/utils/sanitize";
import { processInBatches } from "@/lib/utils/batch";

type AnyRow = AnyAppwriteRow;

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
    const rows = await listAllRows<AnyRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.assignments,
      [Query.equal("courseId", [courseId]), Query.orderDesc("$createdAt")]
    );

    return rows.map((row) => {
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

    const { tablesDB, storage } = await createAdminClient();
    const submissionRows = await listAllRows<AnyRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.submissions,
      [Query.equal("assignmentId", [assignmentId])]
    );

    await processInBatches(submissionRows, 25, async (submission) => {
      const fileId = String(submission.fileId ?? "");
      if (fileId) {
        try {
          await storage.deleteFile({
            bucketId: APPWRITE_CONFIG.buckets.courseResources,
            fileId,
          });
        } catch {
          // Continue deleting the row even if file cleanup fails.
        }
      }

      await tablesDB.deleteRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.submissions,
        rowId: submission.$id,
      });
    });

    await tablesDB.deleteRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.assignments,
      rowId: assignmentId,
    });

    revalidatePath("/instructor");
    revalidatePath("/instructor/submissions");
    revalidatePath("/app/assignments");
    revalidatePath("/app/dashboard");
    revalidatePath(`/instructor/courses/${String(assignment.courseId ?? "")}/curriculum`);
    if (String(assignment.lessonId ?? "")) {
      revalidatePath(
        `/app/learn/${String(assignment.courseId ?? "")}/${String(assignment.lessonId ?? "")}`
      );
    }
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
  const previousFileId = String(existingSubmission?.fileId ?? "");

  if (file && file.size > 0) {
    if (file.size > ASSIGNMENT_SUBMISSION_MAX_BYTES) {
      return;
    }

    const extension = getAssignmentSubmissionFileExtension(file.name);
    if (
      !ASSIGNMENT_SUBMISSION_ALLOWED_EXTENSIONS.includes(
        extension as (typeof ASSIGNMENT_SUBMISSION_ALLOWED_EXTENSIONS)[number]
      )
    ) {
      return;
    }

    const fileHeader = Buffer.from(await file.slice(0, 32).arrayBuffer());
    if (
      !validateFileMimeType(fileHeader, file.name, [
        ...ASSIGNMENT_SUBMISSION_ALLOWED_MIMES,
      ])
    ) {
      return;
    }

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
          grade: 0,
          feedback: "",
        },
      });

      if (previousFileId && previousFileId !== uploadedFileId) {
        const { storage } = await createAdminClient();
        try {
          await storage.deleteFile({
            bucketId: APPWRITE_CONFIG.buckets.courseResources,
            fileId: previousFileId,
          });
        } catch {
          // Submission update already succeeded; ignore old file cleanup failure.
        }
      }

      revalidatePath("/app");
      revalidatePath("/app/assignments");
      return;
    } catch (error) {
      if (uploadedFileId) {
        const { storage } = await createAdminClient();
        try {
          await storage.deleteFile({
            bucketId: APPWRITE_CONFIG.buckets.courseResources,
            fileId: uploadedFileId,
          });
        } catch {
          // Ignore rollback cleanup failure.
        }
      }

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
    const appwriteError = error as { code?: number };
    if (appwriteError.code === 409) {
      try {
        const conflictRows = await tablesDB.listRows({
          databaseId: APPWRITE_CONFIG.databaseId,
          tableId: APPWRITE_CONFIG.tables.submissions,
          queries: [
            Query.equal("assignmentId", [assignmentId]),
            Query.equal("userId", [user.$id]),
            Query.limit(1),
          ],
        });

        const conflictedSubmission = (conflictRows.rows[0] as AnyRow | undefined) ?? null;
        if (conflictedSubmission) {
          await tablesDB.updateRow({
            databaseId: APPWRITE_CONFIG.databaseId,
            tableId: APPWRITE_CONFIG.tables.submissions,
            rowId: conflictedSubmission.$id,
            data: {
              fileId: uploadedFileId,
              submittedAt: new Date().toISOString(),
              grade: 0,
              feedback: "",
            },
          });

          const conflictedPreviousFileId = String(conflictedSubmission.fileId ?? "");
          if (conflictedPreviousFileId && conflictedPreviousFileId !== uploadedFileId) {
            const { storage } = await createAdminClient();
            try {
              await storage.deleteFile({
                bucketId: APPWRITE_CONFIG.buckets.courseResources,
                fileId: conflictedPreviousFileId,
              });
            } catch {
              // Submission update already succeeded; ignore old file cleanup failure.
            }
          }

          revalidatePath("/app");
          revalidatePath("/app/assignments");
          return;
        }
      } catch {
        // Fall through to rollback logic below.
      }
    }

    if (uploadedFileId) {
      const { storage } = await createAdminClient();
      try {
        await storage.deleteFile({
          bucketId: APPWRITE_CONFIG.buckets.courseResources,
          fileId: uploadedFileId,
        });
      } catch {
        // Ignore rollback cleanup failure.
      }
    }

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
    const submissionRows = await listAllRows<AnyRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.submissions,
      [Query.equal("assignmentId", [assignmentId]), Query.orderDesc("$createdAt")]
    );
    const userNameById = new Map<string, string>();
    const userIds = Array.from(
      new Set(
        submissionRows
          .map((row) => String(row.userId ?? ""))
          .filter((userId) => userId.length > 0)
      )
    );

    await processInBatches(userIds, 25, async (userId) => {
      try {
        const userRecord = await users.get(userId);
        userNameById.set(userId, userRecord.name || userRecord.email || "Student");
      } catch {
        // User may not exist.
      }
    });

    return submissionRows.map((row) => ({
      id: row.$id,
      assignmentId: String(row.assignmentId ?? ""),
      userId: String(row.userId ?? ""),
      userName: userNameById.get(String(row.userId ?? "")) ?? "Student",
      fileId: String(row.fileId ?? ""),
      submittedAt: String(row.submittedAt ?? ""),
      grade: Number(row.grade ?? 0),
      feedback: String(row.feedback ?? ""),
    }));
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
  const rawGrade = parseFiniteNumber(formData.get("grade"));
  const feedback = String(formData.get("feedback") ?? "").trim();

  if (!submissionId || rawGrade === null) return;

  const grade = clampNumber(Math.round(rawGrade), 0, 100);

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

    const assignmentTitle =
      typeof assignment.title === "string" ? assignment.title : "assignment";
    const scoreSummary = `You received ${grade}/100.`;
    const feedbackSummary = feedback ? ` Feedback: ${feedback}` : "";

    try {
      await createNotificationEntry({
        userId: String(submission.userId ?? ""),
        type: "assignment_feedback",
        title: `Assignment graded: ${assignmentTitle}`,
        body: `${scoreSummary}${feedbackSummary}`.trim(),
        link: `/app/assignments#assignment-${assignment.$id}`,
      });
    } catch {
      // Keep grading successful even if notification delivery fails.
    }

    revalidatePath("/instructor");
    revalidatePath("/instructor/submissions");
    revalidatePath("/app/assignments");
    revalidatePath("/app/notifications");
    revalidatePath("/app/dashboard");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to grade submission."
    );
  }
}
