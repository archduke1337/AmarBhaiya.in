"use server";

import { Query } from "node-appwrite";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/appwrite/auth";
import { userCanManageCourse } from "@/lib/appwrite/access";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import {
  listAllRows as listAllPaginatedRows,
  type AnyAppwriteRow,
} from "@/lib/appwrite/row-pagination";
import { createAdminClient } from "@/lib/appwrite/server";
import { getCourseDetailPaths } from "@/lib/utils/cache-paths";

// ── Helpers ─────────────────────────────────────────────────────────────────

type AnyRow = AnyAppwriteRow;
type AdminServices = Awaited<ReturnType<typeof createAdminClient>>;
type AdminTablesDB = AdminServices["tablesDB"];
type AdminStorage = AdminServices["storage"];
type DeleteTarget = { tableId: string; rowId: string };

async function getRowById(
  tablesDB: AdminTablesDB,
  tableId: string,
  rowId: string
): Promise<AnyRow | null> {
  try {
    return (await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId,
      rowId,
    })) as AnyRow;
  } catch {
    return null;
  }
}

async function listAllRows(
  tablesDB: AdminTablesDB,
  tableId: string,
  queries: string[]
): Promise<AnyRow[]> {
  const rows: AnyRow[] = [];
  let offset = 0;

  while (true) {
    const page = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId,
      queries: [...queries, Query.limit(500), Query.offset(offset)],
    });

    rows.push(...(page.rows as AnyRow[]));

    if (page.rows.length < 500) {
      break;
    }

    offset += page.rows.length;
  }

  return rows;
}

async function deleteRowsByQueries(
  tablesDB: AdminTablesDB,
  tableId: string,
  queries: string[]
): Promise<string[]> {
  const failedDeletes: string[] = [];

  try {
    let hasMore = true;
    while (hasMore) {
      const rows = await tablesDB.listRows({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId,
        queries: [...queries, Query.limit(500)],
      });

      if (rows.rows.length === 0) {
        hasMore = false;
        break;
      }

      for (const row of rows.rows as AnyRow[]) {
        try {
          await tablesDB.deleteRow({
            databaseId: APPWRITE_CONFIG.databaseId,
            tableId,
            rowId: row.$id,
          });
        } catch (error) {
          failedDeletes.push(`${tableId}/${row.$id}`);
          console.error(
            `[Delete] Failed to delete ${tableId}/${row.$id}:`,
            error instanceof Error ? error.message : error
          );
        }
      }

      if (rows.rows.length < 500) {
        hasMore = false;
      }
    }
  } catch (error) {
    failedDeletes.push(`${tableId}/__query_failed__`);
    console.error(
      `[Delete] Failed to query ${tableId}:`,
      error instanceof Error ? error.message : error
    );
  }

  return failedDeletes;
}

async function listRowsByQueriesForIds(
  tablesDB: AdminTablesDB,
  tableId: string,
  field: string,
  ids: string[]
): Promise<AnyRow[]> {
  if (ids.length === 0) {
    return [];
  }

  const rows: AnyRow[] = [];
  const uniqueIds = [...new Set(ids.filter(Boolean))];

  for (let index = 0; index < uniqueIds.length; index += 20) {
    rows.push(
      ...(await listAllRows(tablesDB, tableId, [
        Query.equal(field, uniqueIds.slice(index, index + 20)),
      ]))
    );
  }

  return rows;
}

async function stageDeleteTargets(
  tablesDB: AdminTablesDB,
  transactionId: string,
  targets: DeleteTarget[]
): Promise<string[]> {
  const failedDeletes: string[] = [];

  for (const target of targets) {
    try {
      await tablesDB.deleteRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: target.tableId,
        rowId: target.rowId,
        transactionId,
      });
    } catch (error) {
      failedDeletes.push(`${target.tableId}/${target.rowId}`);
      console.error(
        `[Delete] Failed to stage delete for ${target.tableId}/${target.rowId}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  return failedDeletes;
}

async function deleteFileIds(
  storage: AdminStorage,
  bucketId: string,
  fileIds: string[]
): Promise<void> {
  const uniqueIds = [...new Set(fileIds.map((fileId) => fileId.trim()).filter(Boolean))];

  for (const fileId of uniqueIds) {
    try {
      await storage.deleteFile({ bucketId, fileId });
    } catch (error) {
      console.error(
        `[Delete] Failed to delete file ${bucketId}/${fileId}:`,
        error instanceof Error ? error.message : error
      );
    }
  }
}

async function syncCourseLessonStats(
  tablesDB: AdminTablesDB,
  courseId: string
): Promise<void> {
  try {
    const remaining = await listAllPaginatedRows<AnyRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.lessons,
      [Query.equal("courseId", [courseId])]
    );

    const totalDuration = remaining.reduce((sum, row) => {
      const duration = Number(row.duration ?? 0);
      return sum + (Number.isFinite(duration) ? duration : 0);
    }, 0);

    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.courses,
      rowId: courseId,
      data: { totalLessons: remaining.length, totalDuration },
    });
  } catch {
    // Non-critical
  }
}

function revalidateEach(paths: string[]): void {
  for (const path of paths) {
    revalidatePath(path);
  }
}

async function deleteLessonTree({
  tablesDB,
  storage,
  lessonId,
  courseId,
}: {
  tablesDB: AdminTablesDB;
  storage: AdminStorage;
  lessonId: string;
  courseId: string;
}): Promise<boolean> {
  const lesson = await getRowById(tablesDB, APPWRITE_CONFIG.tables.lessons, lessonId);
  if (!lesson || String(lesson.courseId ?? "") !== courseId) {
    return false;
  }

  const failedDeletes: string[] = [];
  const lessonVideoId = String(lesson.videoFileId ?? lesson.videoId ?? lesson.fileId ?? "");

  try {
    const resources = await listAllRows(tablesDB, APPWRITE_CONFIG.tables.resources, [
      Query.equal("lessonId", [lessonId]),
    ]);
    const resourceFileIds = resources
      .map((resource) => String(resource.fileId ?? ""))
      .filter(Boolean);

    const quizzes = await listAllRows(tablesDB, APPWRITE_CONFIG.tables.quizzes, [
      Query.equal("lessonId", [lessonId]),
    ]);
    const assignments = await listAllRows(tablesDB, APPWRITE_CONFIG.tables.assignments, [
      Query.equal("lessonId", [lessonId]),
    ]);

    const submissionFileIds: string[] = [];

    for (const quiz of quizzes) {
      failedDeletes.push(
        ...(await deleteRowsByQueries(tablesDB, APPWRITE_CONFIG.tables.quizAttempts, [
          Query.equal("quizId", [quiz.$id]),
        ]))
      );
      failedDeletes.push(
        ...(await deleteRowsByQueries(tablesDB, APPWRITE_CONFIG.tables.quizQuestions, [
          Query.equal("quizId", [quiz.$id]),
        ]))
      );

      try {
        await tablesDB.deleteRow({
          databaseId: APPWRITE_CONFIG.databaseId,
          tableId: APPWRITE_CONFIG.tables.quizzes,
          rowId: quiz.$id,
        });
      } catch (error) {
        failedDeletes.push(`${APPWRITE_CONFIG.tables.quizzes}/${quiz.$id}`);
        console.error(
          `[Delete] Failed to delete ${APPWRITE_CONFIG.tables.quizzes}/${quiz.$id}:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    for (const assignment of assignments) {
      const submissions = await listAllRows(tablesDB, APPWRITE_CONFIG.tables.submissions, [
        Query.equal("assignmentId", [assignment.$id]),
      ]);

      submissionFileIds.push(
        ...submissions
          .map((submission) => String(submission.fileId ?? ""))
          .filter(Boolean)
      );

      failedDeletes.push(
        ...(await deleteRowsByQueries(tablesDB, APPWRITE_CONFIG.tables.submissions, [
          Query.equal("assignmentId", [assignment.$id]),
        ]))
      );

      try {
        await tablesDB.deleteRow({
          databaseId: APPWRITE_CONFIG.databaseId,
          tableId: APPWRITE_CONFIG.tables.assignments,
          rowId: assignment.$id,
        });
      } catch (error) {
        failedDeletes.push(`${APPWRITE_CONFIG.tables.assignments}/${assignment.$id}`);
        console.error(
          `[Delete] Failed to delete ${APPWRITE_CONFIG.tables.assignments}/${assignment.$id}:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    failedDeletes.push(
      ...(await deleteRowsByQueries(tablesDB, APPWRITE_CONFIG.tables.resources, [
        Query.equal("lessonId", [lessonId]),
      ]))
    );
    failedDeletes.push(
      ...(await deleteRowsByQueries(tablesDB, APPWRITE_CONFIG.tables.courseComments, [
        Query.equal("lessonId", [lessonId]),
      ]))
    );
    failedDeletes.push(
      ...(await deleteRowsByQueries(tablesDB, APPWRITE_CONFIG.tables.progress, [
        Query.equal("lessonId", [lessonId]),
      ]))
    );

    if (failedDeletes.length > 0) {
      console.warn(
        `[Delete] Aborting lesson delete for ${lessonId} because child cleanup failed.`,
        failedDeletes
      );
      return false;
    }

    await tablesDB.deleteRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.lessons,
      rowId: lessonId,
    });

    await deleteFileIds(storage, APPWRITE_CONFIG.buckets.courseVideos, [lessonVideoId]);
    await deleteFileIds(storage, APPWRITE_CONFIG.buckets.courseResources, resourceFileIds);
    await deleteFileIds(storage, APPWRITE_CONFIG.buckets.courseResources, submissionFileIds);

    return true;
  } catch (error) {
    console.error(
      `[Delete] Failed to delete lesson tree ${lessonId}:`,
      error instanceof Error ? error.message : error
    );
    return false;
  }
}

// ── Delete Course ───────────────────────────────────────────────────────────
// Instructor (owner) or Admin. Cascades through course-owned learning content.

export async function deleteCourseAction(formData: FormData): Promise<void> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const courseId = String(formData.get("courseId") ?? "");
  if (!courseId) return;

  const course = await userCanManageCourse(courseId, role, user.$id);
  if (!course) return;

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

  const stagedDeletes: DeleteTarget[] = [
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
  ];

  const transaction = await tablesDB
    .createTransaction({
      ttl: 300,
    })
    .catch(() => null);

  if (!transaction?.$id) {
    console.error(`[Delete] Failed to create deletion transaction for course ${courseId}.`);
    return;
  }

  const failedDeletes = await stageDeleteTargets(
    tablesDB,
    transaction.$id,
    stagedDeletes
  );

  if (failedDeletes.length > 0) {
    console.warn(
      `[Delete] Course ${courseId} was not deleted because transactional staging failed:`,
      failedDeletes
    );
    await tablesDB
      .updateTransaction({
        transactionId: transaction.$id,
        rollback: true,
      })
      .catch(() => null);
    return;
  }

  try {
    await tablesDB.updateTransaction({
      transactionId: transaction.$id,
      commit: true,
    });
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to commit course deletion."
    );
    await tablesDB
      .updateTransaction({
        transactionId: transaction.$id,
        rollback: true,
      })
      .catch(() => null);
    return;
  }

  await deleteFileIds(storage, APPWRITE_CONFIG.buckets.courseVideos, lessonVideoIds);
  await deleteFileIds(storage, APPWRITE_CONFIG.buckets.courseResources, resourceFileIds);
  await deleteFileIds(storage, APPWRITE_CONFIG.buckets.courseResources, submissionFileIds);
  await deleteFileIds(
    storage,
    APPWRITE_CONFIG.buckets.courseThumbnails,
    [String(course.thumbnailFileId ?? course.thumbnailId ?? "")]
  );

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
}

// ── Delete Module ───────────────────────────────────────────────────────────
// Instructor (owner) or Admin. Cascades: deletes all lessons in the module.

export async function deleteModuleAction(formData: FormData): Promise<void> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const courseId = String(formData.get("courseId") ?? "");
  const moduleId = String(formData.get("moduleId") ?? "");
  if (!courseId || !moduleId) return;

  const course = await userCanManageCourse(courseId, role, user.$id);
  if (!course) return;

  const { tablesDB, storage } = await createAdminClient();
  const moduleRow = await getRowById(tablesDB, APPWRITE_CONFIG.tables.modules, moduleId);
  if (!moduleRow || String(moduleRow.courseId ?? "") !== courseId) return;

  const lessons = await listAllRows(tablesDB, APPWRITE_CONFIG.tables.lessons, [
    Query.equal("moduleId", [moduleId]),
  ]);

  for (const lesson of lessons) {
    const deleted = await deleteLessonTree({
      tablesDB,
      storage,
      lessonId: lesson.$id,
      courseId,
    });

    if (!deleted) {
      return;
    }
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
    return;
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
}

// ── Delete Lesson ───────────────────────────────────────────────────────────

export async function deleteLessonAction(formData: FormData): Promise<void> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const courseId = String(formData.get("courseId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  if (!courseId || !lessonId) return;

  const course = await userCanManageCourse(courseId, role, user.$id);
  if (!course) return;

  const { tablesDB, storage } = await createAdminClient();
  const deleted = await deleteLessonTree({
    tablesDB,
    storage,
    lessonId,
    courseId,
  });
  if (!deleted) return;

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

// ── Delete Live Session ─────────────────────────────────────────────────────

export async function deleteLiveSessionAction(
  formData: FormData
): Promise<void> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const sessionId = String(formData.get("sessionId") ?? "");
  if (!sessionId) return;

  const { tablesDB } = await createAdminClient();
  const session = await getRowById(
    tablesDB,
    APPWRITE_CONFIG.tables.liveSessions,
    sessionId
  );
  if (!session) return;
  if (!(await userCanManageCourse(String(session.courseId ?? ""), role, user.$id))) {
    return;
  }

  // Delete RSVPs
  const failedDeletes: string[] = [];
  try {
    failedDeletes.push(
      ...(await deleteRowsByQueries(tablesDB, APPWRITE_CONFIG.tables.sessionRsvps, [
        Query.equal("sessionId", [sessionId]),
      ]))
    );
  } catch {
    // No RSVPs
  }

  if (failedDeletes.length > 0) {
    console.warn(
      `[Delete] Aborting live session delete for ${sessionId} because RSVP cleanup failed.`,
      failedDeletes
    );
    return;
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
  revalidatePath("/admin");
  revalidatePath("/instructor");
  revalidatePath("/instructor/live");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/live");
}
