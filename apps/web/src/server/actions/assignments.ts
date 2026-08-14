"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/server/appwrite/auth";
import { getCourseRow, userCanManageCourse } from "@/server/appwrite/access";
import { APPWRITE_CONFIG } from "@/server/appwrite/config";
import { executeDeletePlan } from "@/server/appwrite/delete-plan";
import { listAllRows, type AnyAppwriteRow } from "@/server/appwrite/row-pagination";
import { createAdminClient } from "@/server/appwrite/server";
import { getCourseDetailPaths } from "@/lib/utils/cache-paths";
import { actionSuccess, actionError, type ActionResult } from "@/lib/errors/action-result";

type AnyRow = AnyAppwriteRow;

export async function getAssignmentRow(assignmentId: string): Promise<AnyRow | null> {
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

// ── Types ───────────────────────────────────────────────────────────────────

export type AssignmentItem = {
  id: string;
  lessonId: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
};

// ── Create Assignment (Instructor) ──────────────────────────────────────────

export async function createAssignmentAction(
  formData: FormData
): Promise<ActionResult> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const courseId = String(formData.get("courseId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "");

  if (!courseId || !title) {
    return actionError("Course ID and title are required");
  }
  if (!(await userCanManageCourse(courseId, role, user.$id))) {
    return actionError("You do not have permission to manage this course");
  }

  try {
    const { tablesDB } = await createAdminClient();

    if (lessonId) {
      const lesson = (await tablesDB.getRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.lessons,
        rowId: lessonId,
      }).catch(() => null)) as AnyRow | null;

      if (!lesson || String(lesson.courseId ?? "") !== courseId) {
        return actionError("Lesson does not belong to the specified course");
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
    return actionSuccess();
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to create assignment."
    );
    return actionError("Failed to create assignment");
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
): Promise<ActionResult> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const assignmentId = String(formData.get("assignmentId") ?? "");
  if (!assignmentId) {
    return actionError("Assignment ID is required");
  }
  try {
    const assignment = await getAssignmentRow(assignmentId);
    if (!assignment) {
      return actionError("Assignment not found");
    }
    if (!(await userCanManageCourse(String(assignment.courseId ?? ""), role, user.$id))) {
      return actionError("You do not have permission to manage this course");
    }

    const { tablesDB, storage } = await createAdminClient();
    const submissionRows = await listAllRows<AnyRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.submissions,
      [Query.equal("assignmentId", [assignmentId])]
    );
    const deleted = await executeDeletePlan({
      tablesDB,
      storage,
      plan: {
        stagedDeletes: [
          ...submissionRows.map((submission) => ({
            tableId: APPWRITE_CONFIG.tables.submissions,
            rowId: submission.$id,
          })),
          {
            tableId: APPWRITE_CONFIG.tables.assignments,
            rowId: assignmentId,
          },
        ],
        fileDeletes: [
          {
            bucketId: APPWRITE_CONFIG.buckets.courseResources,
            fileIds: submissionRows
              .map((submission) => String(submission.fileId ?? ""))
              .filter(Boolean),
          },
        ],
      },
      label: `assignment ${assignmentId}`,
    });
    if (!deleted) {
      return actionError("Failed to delete assignment");
    }
    revalidatePath("/instructor");
    revalidatePath("/instructor/submissions");
    revalidatePath("/app/assignments");
    revalidatePath("/app/dashboard");
    revalidatePath(`/instructor/courses/${String(assignment.courseId ?? "")}/curriculum`);
    const course = await getCourseRow(String(assignment.courseId ?? ""));
    if (course) {
      for (const path of getCourseDetailPaths(
        String(assignment.courseId ?? ""),
        typeof course.slug === "string" ? course.slug : ""
      )) {
        revalidatePath(path);
      }
    }
    if (String(assignment.lessonId ?? "")) {
      revalidatePath(
        `/app/learn/${String(assignment.courseId ?? "")}/${String(assignment.lessonId ?? "")}`
      );
    }
    return actionSuccess();
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to delete assignment."
    );
    return actionError("Failed to delete assignment");
  }
}
