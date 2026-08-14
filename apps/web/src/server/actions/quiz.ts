"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";

import { requireAuth, requireRole } from "@/server/appwrite/auth";
import {
  getCourseRow,
  userCanManageCourse,
  userHasCourseAccess,
} from "@/server/appwrite/access";
import { createNotificationEntry } from "@/server/actions/notifications";
import { APPWRITE_CONFIG } from "@/server/appwrite/config";
import { executeDeletePlan } from "@/server/appwrite/delete-plan";
import {
  listAllRows,
  type AnyAppwriteRow,
} from "@/server/appwrite/row-pagination";
import { createAdminClient } from "@/server/appwrite/server";
import { getCourseDetailPaths } from "@/lib/utils/cache-paths";
import { clampNumber, parseFiniteNumber } from "@/lib/utils/number";
import { actionSuccess, actionError, type ActionResult } from "@/lib/errors/action-result";
import { handleActionError } from "@/lib/errors/error-handler";
import { revalidateEach } from "@/lib/utils/revalidate";

type AnyRow = AnyAppwriteRow;

async function getQuizRow(quizId: string): Promise<AnyRow | null> {
  const { tablesDB } = await createAdminClient();

  try {
    return (await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.quizzes,
      rowId: quizId,
    })) as AnyRow;
  } catch {
    return null;
  }
}

async function getQuizQuestionRows(
  tablesDB: Awaited<ReturnType<typeof createAdminClient>>["tablesDB"],
  quizId: string
): Promise<AnyRow[]> {
  return listAllRows<AnyRow>(tablesDB, APPWRITE_CONFIG.tables.quizQuestions, [
    Query.equal("quizId", [quizId]),
    Query.orderAsc("order"),
  ]);
}

// ── Types ───────────────────────────────────────────────────────────────────

export type QuizSummary = {
  id: string;
  lessonId: string;
  courseId: string;
  title: string;
  passMark: number;
  timeLimit: number;
  questionCount: number;
};

export type QuizQuestionItem = {
  id: string;
  text: string;
  type: string;
  options: string[];
  correctAnswer: string;
  order: number;
};

export type QuizAttemptResult = {
  id: string;
  score: number;
  passed: boolean;
  completedAt: string;
};

// ── Create Quiz (Instructor) ────────────────────────────────────────────────

export async function createQuizAction(formData: FormData): Promise<ActionResult> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const courseId = String(formData.get("courseId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const rawPassMark = parseFiniteNumber(formData.get("passMark"));
  const rawTimeLimit = parseFiniteNumber(formData.get("timeLimit"));
  const passMark = clampNumber(Math.round(rawPassMark ?? 60), 0, 100);
  const timeLimit = Math.max(0, Math.round(rawTimeLimit ?? 0));

  if (!courseId || !title) {
    return actionError("Course ID and title are required.");
  }
  if (!(await userCanManageCourse(courseId, role, user.$id))) {
    return actionError("You do not have permission to manage this course.");
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
        return actionError("Lesson not found or does not belong to this course.");
      }
    }

    await tablesDB.createRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.quizzes,
      rowId: ID.unique(),
      data: {
        courseId,
        lessonId: lessonId || "",
        title,
        passMark,
        timeLimit,
      },
    });

    revalidatePath(`/instructor/courses/${courseId}/curriculum`);
    return actionSuccess();
  } catch (error) {
    return actionError(handleActionError(error, { category: "DATABASE", action: "createQuiz" }));
  }
}

// ── Add Question ────────────────────────────────────────────────────────────

export async function addQuizQuestionAction(
  formData: FormData
): Promise<ActionResult> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const quizId = String(formData.get("quizId") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  const type = String(formData.get("type") ?? "mcq");
  const correctAnswer = String(formData.get("correctAnswer") ?? "").trim();

  const optionsRaw = String(formData.get("options") ?? "");
  const options = optionsRaw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const rawOrder = parseFiniteNumber(formData.get("order"));
  const order = Math.max(0, Math.trunc(rawOrder ?? 0));

  if (!quizId || !text || !correctAnswer) {
    return actionError("Quiz ID, question text, and correct answer are required.");
  }

  try {
    const quiz = await getQuizRow(quizId);
    if (!quiz) {
      return actionError("Quiz not found.");
    }
    if (!(await userCanManageCourse(String(quiz.courseId ?? ""), role, user.$id))) {
      return actionError("You do not have permission to manage this quiz.");
    }

    const { tablesDB } = await createAdminClient();

    await tablesDB.createRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.quizQuestions,
      rowId: ID.unique(),
      data: {
        quizId,
        text,
        type,
        options,
        correctAnswer,
        order,
      },
    });

    revalidatePath("/instructor");
    return actionSuccess();
  } catch (error) {
    return actionError(handleActionError(error, { category: "DATABASE", action: "addQuizQuestion" }));
  }
}

// ── Get Quiz with Questions ─────────────────────────────────────────────────

export async function getQuizWithQuestions(quizId: string): Promise<{
  quiz: QuizSummary | null;
  questions: QuizQuestionItem[];
}> {
  const user = await requireAuth();
  const { tablesDB } = await createAdminClient();

  try {
    const quiz = (await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.quizzes,
      rowId: quizId,
    })) as AnyRow;

    if (!(await userHasCourseAccess({ courseId: String(quiz.courseId ?? ""), userId: user.$id }))) {
      return { quiz: null, questions: [] };
    }

    const questionRows = await getQuizQuestionRows(tablesDB, quizId);

    return {
      quiz: {
        id: quiz.$id,
        lessonId: String(quiz.lessonId ?? ""),
        courseId: String(quiz.courseId ?? ""),
        title: String(quiz.title ?? "Quiz"),
        passMark: Number(quiz.passMark ?? 60),
        timeLimit: Number(quiz.timeLimit ?? 0),
        questionCount: questionRows.length,
      },
      questions: questionRows.map((q) => {
        return {
          id: q.$id,
          text: String(q.text ?? ""),
          type: String(q.type ?? "mcq"),
          options: Array.isArray(q.options) ? (q.options as string[]) : [],
          correctAnswer: String(q.correctAnswer ?? ""),
          order: Number(q.order ?? 0),
        };
      }),
    };
  } catch {
    return { quiz: null, questions: [] };
  }
}

// ── Get Quizzes for Course ──────────────────────────────────────────────────

export async function getCourseQuizzes(
  courseId: string
): Promise<QuizSummary[]> {
  const { tablesDB } = await createAdminClient();

  try {
    const rows = await listAllRows<AnyRow>(tablesDB, APPWRITE_CONFIG.tables.quizzes, [
      Query.equal("courseId", [courseId]),
    ]);

    return rows.map((q) => {
      return {
        id: q.$id,
        lessonId: String(q.lessonId ?? ""),
        courseId: String(q.courseId ?? ""),
        title: String(q.title ?? "Quiz"),
        passMark: Number(q.passMark ?? 60),
        timeLimit: Number(q.timeLimit ?? 0),
        questionCount: 0, // Not fetched here for performance
      };
    });
  } catch {
    return [];
  }
}

// ── Submit Quiz Attempt ─────────────────────────────────────────────────────

export async function submitQuizAttemptAction(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireAuth();

  const quizId = String(formData.get("quizId") ?? "");
  if (!quizId) {
    return actionError("Quiz ID is required.");
  }

  const { tablesDB } = await createAdminClient();
  const quiz = await getQuizRow(quizId);
  if (!quiz) {
    return actionError("Quiz not found.");
  }
  if (!(await userHasCourseAccess({ courseId: String(quiz.courseId ?? ""), userId: user.$id }))) {
    return actionError("You do not have access to this course.");
  }

  const questions = await getQuizQuestionRows(tablesDB, quizId);
  if (questions.length === 0) {
    return actionError("This quiz has no questions.");
  }

  let passMark = 60;
  try {
    passMark = Number(quiz.passMark ?? 60);
  } catch {
    // Use default
  }

  const answers: string[] = [];
  let correct = 0;

  for (const question of questions) {
    const answer = String(formData.get(`answer_${question.$id}`) ?? "");
    answers.push(answer);

    if (
      answer.toLowerCase().trim() ===
      String(question.correctAnswer ?? "").toLowerCase().trim()
    ) {
      correct++;
    }
  }

  const score = Math.round((correct / questions.length) * 100);
  const passed = score >= passMark;

  try {
    await tablesDB.createRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.quizAttempts,
      rowId: ID.unique(),
      data: {
        userId: user.$id,
        quizId,
        score,
        answers,
        completedAt: new Date().toISOString(),
        passed,
      },
    });

    try {
      await createNotificationEntry({
        userId: user.$id,
        type: "quiz_result",
        title: passed
          ? `You passed ${String(quiz.title ?? "your quiz")}`
          : `Retry ${String(quiz.title ?? "your quiz")}`,
        body: passed
          ? `Score ${score}% · Pass mark ${passMark}%`
          : `Score ${score}% · Pass mark ${passMark}% · Review the quiz and try again.`,
        link: `/app/quiz/${quizId}`,
      });
    } catch {
      // Keep the saved attempt even if notification delivery fails.
    }

    revalidatePath("/app");
    revalidatePath("/app/dashboard");
    revalidatePath("/app/notifications");
    revalidatePath("/app/quizzes");
    revalidatePath(`/app/quiz/${quizId}`);
    return actionSuccess();
  } catch (error) {
    return actionError(handleActionError(error, { category: "DATABASE", action: "submitQuizAttempt" }));
  }
}

// ── Get User's Best Attempt ─────────────────────────────────────────────────

export async function getUserBestAttempt(
  quizId: string
): Promise<QuizAttemptResult | null> {
  const user = await requireAuth();
  const { tablesDB } = await createAdminClient();

  try {
    const result = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.quizAttempts,
      queries: [
        Query.equal("quizId", [quizId]),
        Query.equal("userId", [user.$id]),
        Query.orderDesc("score"),
        Query.limit(1),
      ],
    });

    const row = result.rows[0] as AnyRow | undefined;
    if (!row) return null;

    return {
      id: row.$id,
      score: Number(row.score ?? 0),
      passed: Boolean(row.passed),
      completedAt: String(row.completedAt ?? ""),
    };
  } catch {
    return null;
  }
}

// ── Delete Quiz ─────────────────────────────────────────────────────────────

export async function deleteQuizAction(formData: FormData): Promise<ActionResult> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const quizId = String(formData.get("quizId") ?? "");
  if (!quizId) {
    return actionError("Quiz ID is required.");
  }

  try {
    const quiz = await getQuizRow(quizId);
    if (!quiz) {
      return actionError("Quiz not found.");
    }
    if (!(await userCanManageCourse(String(quiz.courseId ?? ""), role, user.$id))) {
      return actionError("You do not have permission to manage this quiz.");
    }

    const { tablesDB, storage } = await createAdminClient();

    const [questionRows, attemptRows] = await Promise.all([
      getQuizQuestionRows(tablesDB, quizId),
      listAllRows<AnyRow>(tablesDB, APPWRITE_CONFIG.tables.quizAttempts, [
        Query.equal("quizId", [quizId]),
      ]),
    ]);
    const deleted = await executeDeletePlan({
      tablesDB,
      storage,
      plan: {
        stagedDeletes: [
          ...questionRows.map((question) => ({
            tableId: APPWRITE_CONFIG.tables.quizQuestions,
            rowId: question.$id,
          })),
          ...attemptRows.map((attempt) => ({
            tableId: APPWRITE_CONFIG.tables.quizAttempts,
            rowId: attempt.$id,
          })),
          {
            tableId: APPWRITE_CONFIG.tables.quizzes,
            rowId: quizId,
          },
        ],
        fileDeletes: [],
      },
      label: `quiz ${quizId}`,
    });
    if (!deleted) {
      return actionError("Failed to delete quiz.");
    }

    revalidatePath("/instructor");
    revalidatePath(`/instructor/courses/${String(quiz.courseId ?? "")}/curriculum`);
    revalidatePath("/app/quizzes");
    if (String(quiz.courseId ?? "")) {
      const course = await getCourseRow(String(quiz.courseId ?? ""));
      revalidateEach(
        getCourseDetailPaths(
          String(quiz.courseId ?? ""),
          typeof course?.slug === "string" ? course.slug : ""
        )
      );
    }
    if (String(quiz.lessonId ?? "")) {
      revalidatePath(
        `/app/learn/${String(quiz.courseId ?? "")}/${String(quiz.lessonId ?? "")}`
      );
    }
    return actionSuccess();
  } catch (error) {
    return actionError(handleActionError(error, { category: "DATABASE", action: "deleteQuiz" }));
  }
}
