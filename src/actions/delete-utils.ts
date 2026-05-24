import { Query } from "node-appwrite";
import { revalidatePath } from "next/cache";

import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import {
  executeDeletePlan,
  mergeDeletePlans,
  type DeletePlan,
} from "@/lib/appwrite/delete-plan";
import {
  listAllRows as listAllPaginatedRows,
  type AnyAppwriteRow,
} from "@/lib/appwrite/row-pagination";
import { createAdminClient } from "@/lib/appwrite/server";

type AnyRow = AnyAppwriteRow;
type AdminServices = Awaited<ReturnType<typeof createAdminClient>>;
type AdminTablesDB = AdminServices["tablesDB"];

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

async function collectLessonDeletePlan({
  tablesDB,
  lessonId,
  courseId,
}: {
  tablesDB: AdminTablesDB;
  lessonId: string;
  courseId: string;
}): Promise<DeletePlan | null> {
  const lesson = await getRowById(tablesDB, APPWRITE_CONFIG.tables.lessons, lessonId);
  if (!lesson || String(lesson.courseId ?? "") !== courseId) {
    return null;
  }

  const lessonVideoId = String(lesson.videoFileId ?? lesson.videoId ?? lesson.fileId ?? "");

  try {
    const [resources, quizzes, assignments, lessonComments, lessonProgressRows] =
      await Promise.all([
        listAllRows(tablesDB, APPWRITE_CONFIG.tables.resources, [
          Query.equal("lessonId", [lessonId]),
        ]),
        listAllRows(tablesDB, APPWRITE_CONFIG.tables.quizzes, [
          Query.equal("lessonId", [lessonId]),
        ]),
        listAllRows(tablesDB, APPWRITE_CONFIG.tables.assignments, [
          Query.equal("lessonId", [lessonId]),
        ]),
        listAllRows(tablesDB, APPWRITE_CONFIG.tables.courseComments, [
          Query.equal("lessonId", [lessonId]),
        ]),
        listAllRows(tablesDB, APPWRITE_CONFIG.tables.progress, [
          Query.equal("lessonId", [lessonId]),
        ]),
      ]);

    const quizIds = quizzes.map((quiz) => quiz.$id);
    const assignmentIds = assignments.map((assignment) => assignment.$id);
    const [quizAttempts, quizQuestions, submissions] = await Promise.all([
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
    ]);

    const resourceFileIds = resources
      .map((resource) => String(resource.fileId ?? ""))
      .filter(Boolean);
    const submissionFileIds = submissions
      .map((submission) => String(submission.fileId ?? ""))
      .filter(Boolean);

    return mergeDeletePlans({
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
        ...resources.map((row) => ({
          tableId: APPWRITE_CONFIG.tables.resources,
          rowId: row.$id,
        })),
        ...lessonComments.map((row) => ({
          tableId: APPWRITE_CONFIG.tables.courseComments,
          rowId: row.$id,
        })),
        ...lessonProgressRows.map((row) => ({
          tableId: APPWRITE_CONFIG.tables.progress,
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
        {
          tableId: APPWRITE_CONFIG.tables.lessons,
          rowId: lessonId,
        },
      ],
      fileDeletes: [
        {
          bucketId: APPWRITE_CONFIG.buckets.courseVideos,
          fileIds: [lessonVideoId],
        },
        {
          bucketId: APPWRITE_CONFIG.buckets.courseResources,
          fileIds: resourceFileIds,
        },
        {
          bucketId: APPWRITE_CONFIG.buckets.courseResources,
          fileIds: submissionFileIds,
        },
      ],
    });
  } catch (error) {
    console.error(
      `[Delete] Failed to collect delete plan for lesson ${lessonId}:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

async function collectModuleDeletePlan({
  tablesDB,
  moduleId,
  courseId,
}: {
  tablesDB: AdminTablesDB;
  moduleId: string;
  courseId: string;
}): Promise<DeletePlan | null> {
  const moduleRow = await getRowById(tablesDB, APPWRITE_CONFIG.tables.modules, moduleId);
  if (!moduleRow || String(moduleRow.courseId ?? "") !== courseId) {
    return null;
  }

  try {
    const lessons = await listAllRows(tablesDB, APPWRITE_CONFIG.tables.lessons, [
      Query.equal("moduleId", [moduleId]),
    ]);
    const lessonPlans = await Promise.all(
      lessons.map((lesson) =>
        collectLessonDeletePlan({
          tablesDB,
          lessonId: lesson.$id,
          courseId,
        })
      )
    );

    if (lessonPlans.some((plan) => !plan)) {
      return null;
    }

    return mergeDeletePlans(
      ...(lessonPlans as DeletePlan[]),
      {
        stagedDeletes: [
          {
            tableId: APPWRITE_CONFIG.tables.modules,
            rowId: moduleId,
          },
        ],
        fileDeletes: [],
      }
    );
  } catch (error) {
    console.error(
      `[Delete] Failed to collect delete plan for module ${moduleId}:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

export {
  type AnyRow,
  type AdminTablesDB,
  getRowById,
  listAllRows,
  listRowsByQueriesForIds,
  syncCourseLessonStats,
  revalidateEach,
  collectLessonDeletePlan,
  collectModuleDeletePlan,
};
