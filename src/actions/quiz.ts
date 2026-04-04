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
import { processInBatches } from "@/lib/utils/batch";

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

export async function createQuizAction(formData: FormData): Promise<void> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const courseId = String(formData.get("courseId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const passMark = Number(formData.get("passMark") ?? 60);
  const timeLimit = Number(formData.get("timeLimit") ?? 0);

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
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to create quiz."
    );
  }
}

// ── Add Question ────────────────────────────────────────────────────────────

export async function addQuizQuestionAction(
  formData: FormData
): Promise<void> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const quizId = String(formData.get("quizId") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  const type = String(formData.get("type") ?? "mcq");
  const correctAnswer = String(formData.get("correctAnswer") ?? "").trim();

  // Parse options from comma-separated string
  const optionsRaw = String(formData.get("options") ?? "");
  const options = optionsRaw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const order = Number(formData.get("order") ?? 0);

  if (!quizId || !text || !correctAnswer) return;

  try {
    const quiz = await getQuizRow(quizId);
    if (!quiz) return;
    if (!(await userCanManageCourse(String(quiz.courseId ?? ""), role, user.$id))) {
      return;
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
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to add question."
    );
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
): Promise<void> {
  const user = await requireAuth();

  const quizId = String(formData.get("quizId") ?? "");
  if (!quizId) return;

  const { tablesDB } = await createAdminClient();
  const quiz = await getQuizRow(quizId);
  if (!quiz) return;
  if (!(await userHasCourseAccess({ courseId: String(quiz.courseId ?? ""), userId: user.$id }))) {
    return;
  }

  // Get questions
  const questions = await getQuizQuestionRows(tablesDB, quizId);
  if (questions.length === 0) return;

  // Get quiz pass mark
  let passMark = 60;
  try {
    passMark = Number(quiz.passMark ?? 60);
  } catch {
    // Use default
  }

  // Grade answers
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
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to save attempt."
    );
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

export async function deleteQuizAction(formData: FormData): Promise<void> {
  const { user, role } = await requireRole(["admin", "instructor"]);

  const quizId = String(formData.get("quizId") ?? "");
  if (!quizId) return;

  try {
    const quiz = await getQuizRow(quizId);
    if (!quiz) return;
    if (!(await userCanManageCourse(String(quiz.courseId ?? ""), role, user.$id))) {
      return;
    }

    const { tablesDB } = await createAdminClient();

    // Delete questions first
    const [questionRows, attemptRows] = await Promise.all([
      getQuizQuestionRows(tablesDB, quizId),
      listAllRows<AnyRow>(tablesDB, APPWRITE_CONFIG.tables.quizAttempts, [
        Query.equal("quizId", [quizId]),
      ]),
    ]);

    await processInBatches(questionRows, 25, async (question) => {
      await tablesDB.deleteRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.quizQuestions,
        rowId: question.$id,
      });
    });

    await processInBatches(attemptRows, 25, async (attempt) => {
      await tablesDB.deleteRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.quizAttempts,
        rowId: attempt.$id,
      });
    });

    await tablesDB.deleteRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.quizzes,
      rowId: quizId,
    });

    revalidatePath("/instructor");
    revalidatePath(`/instructor/courses/${String(quiz.courseId ?? "")}/curriculum`);
    revalidatePath("/app/quizzes");
    if (String(quiz.courseId ?? "")) {
      revalidatePath(`/app/courses/${String(quiz.courseId ?? "")}`);
    }
    if (String(quiz.lessonId ?? "")) {
      revalidatePath(
        `/app/learn/${String(quiz.courseId ?? "")}/${String(quiz.lessonId ?? "")}`
      );
    }
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to delete quiz."
    );
  }
}
