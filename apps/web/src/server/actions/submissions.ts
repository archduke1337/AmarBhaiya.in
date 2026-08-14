"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";
import { requireAuth, requireRole } from "@/server/appwrite/auth";
import { userCanManageCourse, userHasCourseAccess } from "@/server/appwrite/access";
import { APPWRITE_CONFIG } from "@/server/appwrite/config";
import { listAllRows, type AnyAppwriteRow } from "@/server/appwrite/row-pagination";
import { createAdminClient } from "@/server/appwrite/server";
import { createNotificationEntry } from "@/server/actions/notifications";
import { clampNumber, parseFiniteNumber } from "@/lib/utils/number";
import { validateFileMimeType } from "@/lib/utils/sanitize";
import { processInBatches } from "@/lib/utils/batch";
import { getAssignmentRow } from "@/server/actions/assignments";
import { ASSIGNMENT_SUBMISSION_ALLOWED_EXTENSIONS, ASSIGNMENT_SUBMISSION_ALLOWED_MIMES, ASSIGNMENT_SUBMISSION_MAX_BYTES, getAssignmentSubmissionFileExtension } from "@/server/uploads/assignment-submission";
import { actionSuccess, actionError, type ActionResult } from "@/lib/errors/action-result";

type AnyRow = AnyAppwriteRow;

function shouldRetryWithoutGradedAt(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("gradedat")
    && (message.includes("attribute") || message.includes("column") || message.includes("unknown"));
}

async function createSubmissionRecord(
  tablesDB: Awaited<ReturnType<typeof createAdminClient>>["tablesDB"],
  data: Record<string, unknown>
): Promise<void> {
  try {
    await tablesDB.createRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.submissions,
      rowId: ID.unique(),
      data,
    });
  } catch (error) {
    if (!shouldRetryWithoutGradedAt(error)) {
      throw error;
    }

    const legacyData = { ...data };
    delete legacyData.gradedAt;
    await tablesDB.createRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.submissions,
      rowId: ID.unique(),
      data: legacyData,
    });
  }
}

async function updateSubmissionRecord(
  tablesDB: Awaited<ReturnType<typeof createAdminClient>>["tablesDB"],
  rowId: string,
  data: Record<string, unknown>
): Promise<void> {
  try {
    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.submissions,
      rowId,
      data,
    });
  } catch (error) {
    if (!shouldRetryWithoutGradedAt(error)) {
      throw error;
    }

    const legacyData = { ...data };
    delete legacyData.gradedAt;
    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.submissions,
      rowId,
      data: legacyData,
    });
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

// ── Submit Assignment (Student) ─────────────────────────────────────────────

export async function submitAssignmentAction(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireAuth();

  const assignmentId = String(formData.get("assignmentId") ?? "");
  if (!assignmentId) {
    return actionError("Assignment ID is required");
  }
  const assignment = await getAssignmentRow(assignmentId);
  if (!assignment) {
    return actionError("Assignment not found");
  }
  const courseId = String(assignment.courseId ?? "");
  const lessonId = String(assignment.lessonId ?? "");
  if (!courseId) {
    return actionError("Course ID is missing");
  }
  if (!(await userHasCourseAccess({ courseId, userId: user.$id, lessonId: lessonId || undefined }))) {
    return actionError("You do not have access to this course");
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
      return actionError("File exceeds maximum allowed size");
    }

    const extension = getAssignmentSubmissionFileExtension(file.name);
    if (
      !ASSIGNMENT_SUBMISSION_ALLOWED_EXTENSIONS.includes(
        extension as (typeof ASSIGNMENT_SUBMISSION_ALLOWED_EXTENSIONS)[number]
      )
    ) {
      return actionError("File type is not allowed");
    }

    const fileHeader = Buffer.from(await file.slice(0, 32).arrayBuffer());
    if (
      !validateFileMimeType(fileHeader, file.name, [
        ...ASSIGNMENT_SUBMISSION_ALLOWED_MIMES,
      ])
    ) {
      return actionError("File content does not match allowed types");
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
      return actionError("Failed to upload file");
    }
  }

  if (!uploadedFileId) {
    return actionError("No file was uploaded");
  }

  if (existingSubmission) {
    try {
      await updateSubmissionRecord(tablesDB, existingSubmission.$id, {
        fileId: uploadedFileId,
        submittedAt: new Date().toISOString(),
        gradedAt: "",
        grade: 0,
        feedback: "",
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
      return actionSuccess();
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
      return actionError("Failed to update existing submission");
    }
  }

  try {
    await createSubmissionRecord(tablesDB, {
      assignmentId,
      userId: user.$id,
      fileId: uploadedFileId,
      submittedAt: new Date().toISOString(),
      gradedAt: "",
      grade: 0,
      feedback: "",
    });

    revalidatePath("/app");
    revalidatePath("/app/assignments");
    return actionSuccess();
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
          await updateSubmissionRecord(tablesDB, conflictedSubmission.$id, {
            fileId: uploadedFileId,
            submittedAt: new Date().toISOString(),
            gradedAt: "",
            grade: 0,
            feedback: "",
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
    return actionSuccess();
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
    return actionError("Failed to submit assignment");
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
): Promise<ActionResult> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const submissionId = String(formData.get("submissionId") ?? "");
  const rawGrade = parseFiniteNumber(formData.get("grade"));
  const feedback = String(formData.get("feedback") ?? "").trim();

  if (!submissionId || rawGrade === null) {
    return actionError("Submission ID and grade are required");
  }
  const grade = clampNumber(Math.round(rawGrade), 0, 100);

  try {
    const submission = await getSubmissionRow(submissionId);
    if (!submission) {
      return actionError("Submission not found");
    }
    const assignment = await getAssignmentRow(String(submission.assignmentId ?? ""));
    if (!assignment) {
      return actionError("Assignment not found");
    }
    if (!(await userCanManageCourse(String(assignment.courseId ?? ""), role, user.$id))) {
      return actionError("You do not have permission to manage this course");
    }

    const { tablesDB } = await createAdminClient();

    await updateSubmissionRecord(tablesDB, submissionId, {
      grade,
      feedback,
      gradedAt: new Date().toISOString(),
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
    return actionSuccess();
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to grade submission."
    );
    return actionError("Failed to grade submission");
  }
}
