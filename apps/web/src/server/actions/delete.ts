"use server";

import { Query } from "node-appwrite";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/server/appwrite/auth";
import { userCanManageCourse } from "@/server/appwrite/access";
import { APPWRITE_CONFIG } from "@/server/appwrite/config";
import { executeDeletePlan, mergeDeletePlans } from "@/server/appwrite/delete-plan";
import { createAdminClient } from "@/server/appwrite/server";
import { getCourseDetailPaths } from "@/lib/utils/cache-paths";
import { actionSuccess, actionError, type ActionResult } from "@/lib/errors/action-result";
import {
  getRowById,
  listAllRows,
  listRowsByQueriesForIds,
  syncCourseLessonStats,
  revalidateEach,
  collectLessonDeletePlan,
  collectModuleDeletePlan,
} from "./delete-utils";

export async function deleteCourseAction(formData: FormData): Promise<ActionResult> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const courseId = String(formData.get("courseId") ?? "");
  if (!courseId) {
    return actionError("Course ID is required to delete a course");
  }
  const course = await userCanManageCourse(courseId, role, user.$id);
  if (!course) {
    return actionError("Course not found or you do not have permission to delete it");
  }
  const { tablesDB, storage } = await createAdminClient();
  const [lessons, quizzes, assignments, liveSessions, modules, courseComments, enrollments, progressRows] =
    await Promise.all([
      listAllRows(tablesDB, APPWRITE_CONFIG.tables.lessons, [
        Query.equal("courseId", [courseId]),
      ]),
      listAllRows(tablesDB, APPWRITE_CONFIG.tables.quizzes, [
        Query.equal("courseId", [courseId]),
      ]),
      listAllRows(tablesDB, APPWRITE_CONFIG.tables.assignments, [
        Query.equal("courseId", [courseId]),
      ]),
      listAllRows(tablesDB, APPWRITE_CONFIG.tables.liveSessions, [
        Query.equal("courseId", [courseId]),
      ]),
      listAllRows(tablesDB, APPWRITE_CONFIG.tables.modules, [
        Query.equal("courseId", [courseId]),
      ]),
      listAllRows(tablesDB, APPWRITE_CONFIG.tables.courseComments, [
        Query.equal("courseId", [courseId]),
      ]),
      listAllRows(tablesDB, APPWRITE_CONFIG.tables.enrollments, [
        Query.equal("courseId", [courseId]),
      ]),
      listAllRows(tablesDB, APPWRITE_CONFIG.tables.progress, [
        Query.equal("courseId", [courseId]),
      ]),
    ]);

  const lessonVideoIds = lessons
    .map((lesson) => String(lesson.videoFileId ?? lesson.videoId ?? lesson.fileId ?? ""))
    .filter(Boolean);
  const lessonIds = lessons.map((lesson) => lesson.$id);
  const quizIds = quizzes.map((quiz) => quiz.$id);
  const assignmentIds = assignments.map((assignment) => assignment.$id);
  const liveSessionIds = liveSessions.map((session) => session.$id);

  const [quizAttempts, quizQuestions, submissions, sessionRsvps, resources] =
    await Promise.all([
      listRowsByQueriesForIds(
        tablesDB,
        APPWRITE_CONFIG.tables.quizAttempts,
        "quizId",
        quizIds
      ),
      listRowsByQueriesForIds(
        tablesDB,
        APPWRITE_CONFIG.tables.quizQuestions,
        "quizId",
        quizIds
      ),
      listRowsByQueriesForIds(
        tablesDB,
        APPWRITE_CONFIG.tables.submissions,
        "assignmentId",
        assignmentIds
      ),
      listRowsByQueriesForIds(
        tablesDB,
        APPWRITE_CONFIG.tables.sessionRsvps,
        "sessionId",
        liveSessionIds
      ),
      listRowsByQueriesForIds(
        tablesDB,
        APPWRITE_CONFIG.tables.resources,
        "lessonId",
        lessonIds
      ),
    ]);

  const submissionFileIds: string[] = submissions
    .map((submission) => String(submission.fileId ?? ""))
    .filter(Boolean);
  const resourceFileIds: string[] = resources
    .map((resource) => String(resource.fileId ?? ""))
    .filter(Boolean);

  const deletePlan = mergeDeletePlans({
    stagedDeletes: [
      ...quizAttempts.map((row) => ({
        tableId: APPWRITE_CONFIG.tables.quizAttempts,
        rowId: row.$id,
      })),
      ...quizQuestions.map((row) => ({
        tableId: APPWRITE_CONFIG.tables.quizQuestions,
        rowId: row.$id,
      })),
      ...submissions.map((row) => ({
        tableId: APPWRITE_CONFIG.tables.submissions,
        rowId: row.$id,
      })),
      ...sessionRsvps.map((row) => ({
        tableId: APPWRITE_CONFIG.tables.sessionRsvps,
        rowId: row.$id,
      })),
      ...resources.map((row) => ({
        tableId: APPWRITE_CONFIG.tables.resources,
        rowId: row.$id,
      })),
      ...courseComments.map((row) => ({
        tableId: APPWRITE_CONFIG.tables.courseComments,
        rowId: row.$id,
      })),
      ...progressRows.map((row) => ({
        tableId: APPWRITE_CONFIG.tables.progress,
        rowId: row.$id,
      })),
      ...enrollments.map((row) => ({
        tableId: APPWRITE_CONFIG.tables.enrollments,
        rowId: row.$id,
      })),
      ...liveSessions.map((row) => ({
        tableId: APPWRITE_CONFIG.tables.liveSessions,
        rowId: row.$id,
      })),
      ...assignments.map((row) => ({
        tableId: APPWRITE_CONFIG.tables.assignments,
        rowId: row.$id,
      })),
      ...quizzes.map((row) => ({
        tableId: APPWRITE_CONFIG.tables.quizzes,
        rowId: row.$id,
      })),
      ...lessons.map((row) => ({
        tableId: APPWRITE_CONFIG.tables.lessons,
        rowId: row.$id,
      })),
      ...modules.map((row) => ({
        tableId: APPWRITE_CONFIG.tables.modules,
        rowId: row.$id,
      })),
      {
        tableId: APPWRITE_CONFIG.tables.courses,
        rowId: courseId,
      },
    ],
    fileDeletes: [
      {
        bucketId: APPWRITE_CONFIG.buckets.courseVideos,
        fileIds: lessonVideoIds,
      },
      {
        bucketId: APPWRITE_CONFIG.buckets.courseResources,
        fileIds: resourceFileIds,
      },
      {
        bucketId: APPWRITE_CONFIG.buckets.courseResources,
        fileIds: submissionFileIds,
      },
      {
        bucketId: APPWRITE_CONFIG.buckets.courseThumbnails,
        fileIds: [String(course.thumbnailFileId ?? course.thumbnailId ?? "")],
      },
    ],
  });

  const deleted = await executeDeletePlan({
    tablesDB,
    storage,
    plan: deletePlan,
    label: `course ${courseId}`,
  });
  if (!deleted) {
    return actionError("Failed to execute delete plan for course");
  }

  revalidatePath("/instructor");
  revalidatePath("/admin/courses");
  revalidatePath("/instructor/courses");
  revalidatePath("/admin/live");
  revalidatePath("/instructor/live");
  revalidatePath("/app");
  revalidatePath("/app/live");
  revalidatePath("/app/assignments");
  revalidatePath("/app/quizzes");
  revalidatePath("/");
  revalidatePath("/courses");
  revalidateEach(
    getCourseDetailPaths(courseId, typeof course.slug === "string" ? course.slug : "")
  );

  return actionSuccess();
}

export async function deleteModuleAction(formData: FormData): Promise<ActionResult> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const courseId = String(formData.get("courseId") ?? "");
  const moduleId = String(formData.get("moduleId") ?? "");
  if (!courseId || !moduleId) {
    return actionError("Course ID and Module ID are required to delete a module");
  }
  const course = await userCanManageCourse(courseId, role, user.$id);
  if (!course) {
    return actionError("Course not found or you do not have permission to delete this module");
  }
  const { tablesDB, storage } = await createAdminClient();
  const deletePlan = await collectModuleDeletePlan({
    tablesDB,
    moduleId,
    courseId,
  });
  if (!deletePlan) {
    return actionError("Failed to build delete plan for module");
  }
  const deleted = await executeDeletePlan({
    tablesDB,
    storage,
    plan: deletePlan,
    label: `module ${moduleId}`,
  });
  if (!deleted) {
    return actionError("Failed to execute delete plan for module");
  }
  await syncCourseLessonStats(tablesDB, courseId);

  revalidatePath("/app");
  revalidatePath("/app/assignments");
  revalidatePath("/app/quizzes");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/courses");
  revalidatePath("/courses");
  revalidateEach(
    getCourseDetailPaths(courseId, typeof course.slug === "string" ? course.slug : "")
  );
  revalidatePath(`/instructor/courses/${courseId}`);
  revalidatePath(`/instructor/courses/${courseId}/curriculum`);

  return actionSuccess();
}

export async function deleteLessonAction(formData: FormData): Promise<ActionResult> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const courseId = String(formData.get("courseId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  if (!courseId || !lessonId) {
    return actionError("Course ID and Lesson ID are required to delete a lesson");
  }
  const course = await userCanManageCourse(courseId, role, user.$id);
  if (!course) {
    return actionError("Course not found or you do not have permission to delete this lesson");
  }
  const { tablesDB, storage } = await createAdminClient();
  const deletePlan = await collectLessonDeletePlan({
    tablesDB,
    lessonId,
    courseId,
  });
  if (!deletePlan) {
    return actionError("Failed to build delete plan for lesson");
  }
  const deleted = await executeDeletePlan({
    tablesDB,
    storage,
    plan: deletePlan,
    label: `lesson ${lessonId}`,
  });
  if (!deleted) {
    return actionError("Failed to execute delete plan for lesson");
  }
  await syncCourseLessonStats(tablesDB, courseId);

  revalidatePath("/app");
  revalidatePath("/app/assignments");
  revalidatePath("/app/quizzes");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/courses");
  revalidatePath("/courses");
  revalidateEach(
    getCourseDetailPaths(courseId, typeof course.slug === "string" ? course.slug : "")
  );
  revalidatePath(`/instructor/courses/${courseId}`);
  revalidatePath(`/app/learn/${courseId}/${lessonId}`);
  revalidatePath(`/instructor/courses/${courseId}/curriculum`);

  return actionSuccess();
}

export async function deleteCategoryAction(formData: FormData): Promise<ActionResult> {
  await requireRole(["admin"]);

  const categoryId = String(formData.get("categoryId") ?? "");
  if (!categoryId) {
    return actionError("Category ID is required to delete a category");
  }
  const { tablesDB } = await createAdminClient();

  try {
    const coursesUsingCategory = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.courses,
      queries: [Query.equal("categoryId", [categoryId]), Query.limit(1)],
    });

    if (coursesUsingCategory.total > 0) {
      console.error(
        `[Delete] Cannot delete category ${categoryId}. ${coursesUsingCategory.total} courses assigned to this category.`
      );
      return actionError(`Cannot delete category: ${coursesUsingCategory.total} course(s) are still assigned to it`);
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
    return actionError("Failed to delete category due to an unexpected error");
  }

  revalidatePath("/admin/categories");
  revalidatePath("/instructor/categories");

  return actionSuccess();
}

export async function deleteLiveSessionAction(
  formData: FormData
): Promise<ActionResult> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const sessionId = String(formData.get("sessionId") ?? "");
  if (!sessionId) {
    return actionError("Session ID is required to delete a live session");
  }
  const { tablesDB, storage } = await createAdminClient();
  const session = await getRowById(
    tablesDB,
    APPWRITE_CONFIG.tables.liveSessions,
    sessionId
  );
  if (!session) {
    return actionError("Live session not found");
  }
  if (!(await userCanManageCourse(String(session.courseId ?? ""), role, user.$id))) {
    return actionError("You do not have permission to delete this live session");
  }

  try {
    const sessionRsvps = await listAllRows(
      tablesDB,
      APPWRITE_CONFIG.tables.sessionRsvps,
      [
        Query.equal("sessionId", [sessionId]),
      ]
    );
    const deleted = await executeDeletePlan({
      tablesDB,
      storage,
      plan: {
        stagedDeletes: [
          ...sessionRsvps.map((row) => ({
            tableId: APPWRITE_CONFIG.tables.sessionRsvps,
            rowId: row.$id,
          })),
          {
            tableId: APPWRITE_CONFIG.tables.liveSessions,
            rowId: sessionId,
          },
        ],
        fileDeletes: [],
      },
      label: `live session ${sessionId}`,
    });
    if (!deleted) {
      return actionError("Failed to execute delete plan for live session");
    }
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to delete session."
    );
    return actionError("Failed to delete live session due to an unexpected error");
  }

  revalidatePath("/admin/live");
  revalidatePath("/admin");
  revalidatePath("/instructor");
  revalidatePath("/instructor/live");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/live");

  return actionSuccess();
}
