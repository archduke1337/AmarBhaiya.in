import { Award, CheckCircle, XCircle } from "lucide-react";
import { Query } from "node-appwrite";
import type { Models } from "node-appwrite";

import { requireAuth } from "@/lib/appwrite/auth";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { PageHeader, EmptyState } from "@/components/dashboard";

type AnyRow = Models.Row & Record<string, unknown>;

type QuizAttemptDisplay = {
  id: string;
  quizTitle: string;
  courseTitle: string;
  score: number;
  passed: boolean;
  completedAt: string;
};

async function getStudentQuizHistory(userId: string): Promise<QuizAttemptDisplay[]> {
  const { tablesDB } = await createAdminClient();

  try {
    const listAllRows = async (
      tableId: string,
      queries: string[] = []
    ): Promise<AnyRow[]> => {
      const rows: AnyRow[] = [];
      let offset = 0;

      while (true) {
        const result = await tablesDB.listRows({
          databaseId: APPWRITE_CONFIG.databaseId,
          tableId,
          queries: [...queries, Query.limit(500), Query.offset(offset)],
        });

        rows.push(...(result.rows as AnyRow[]));

        if (result.rows.length < 500) {
          break;
        }

        offset += result.rows.length;
      }

      return rows;
    };

    const chunkValues = (values: string[], chunkSize = 20): string[][] => {
      const chunks: string[][] = [];
      for (let index = 0; index < values.length; index += chunkSize) {
        chunks.push(values.slice(index, index + chunkSize));
      }
      return chunks;
    };

    const listRowsByFieldValues = async (
      tableId: string,
      field: string,
      values: string[]
    ): Promise<AnyRow[]> => {
      if (values.length === 0) {
        return [];
      }

      const results = await Promise.all(
        chunkValues(values).map((chunk) =>
          listAllRows(tableId, [Query.equal(field, chunk)])
        )
      );

      return results.flat();
    };

    const attemptsRows = await listAllRows(APPWRITE_CONFIG.tables.quizAttempts, [
      Query.equal("userId", [userId]),
      Query.orderDesc("$createdAt"),
    ]);

    const quizIds = [
      ...new Set(
        attemptsRows
          .map((row) => String(row.quizId ?? ""))
          .filter((quizId) => quizId.length > 0)
      ),
    ];

    const quizRows = await listRowsByFieldValues(
      APPWRITE_CONFIG.tables.quizzes,
      "$id",
      quizIds
    );
    const courseIds = [
      ...new Set(
        quizRows
          .map((quiz) => String(quiz.courseId ?? ""))
          .filter((courseId) => courseId.length > 0)
      ),
    ];
    const courseRows = await listRowsByFieldValues(
      APPWRITE_CONFIG.tables.courses,
      "$id",
      courseIds
    );

    const quizById = new Map(quizRows.map((quiz) => [quiz.$id, quiz]));
    const courseTitleById = new Map(
      courseRows.map((course) => [
        course.$id,
        String(course.title ?? "Course"),
      ])
    );

    const attempts: QuizAttemptDisplay[] = [];

    for (const row of attemptsRows) {
      const quiz = quizById.get(String(row.quizId ?? ""));
      const quizTitle = String(quiz?.title ?? "Quiz");
      const courseTitle =
        courseTitleById.get(String(quiz?.courseId ?? "")) ?? "Course";

      attempts.push({
        id: row.$id,
        quizTitle,
        courseTitle,
        score: Number(row.score ?? 0),
        passed: Boolean(row.passed),
        completedAt: String(row.completedAt ?? ""),
      });
    }

    return attempts;
  } catch {
    return [];
  }
}

export default async function StudentQuizHistoryPage() {
  const user = await requireAuth();
  const attempts = await getStudentQuizHistory(user.$id);

  const passed = attempts.filter((a) => a.passed).length;
  const avgScore =
    attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
      : 0;

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <PageHeader
        eyebrow="Quiz History"
        title="Your Quiz Attempts"
        description={`${attempts.length} total · ${passed} passed · Avg score: ${avgScore}%`}
      />

      {attempts.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No quiz attempts yet"
          description="Take a quiz in any of your enrolled courses to see your results here."
          action={{ label: "My courses", href: "/app/courses" }}
        />
      ) : (
        <section className="border border-border">
          <div className="hidden items-center gap-4 border-b border-border bg-muted/30 px-5 py-3 text-xs uppercase tracking-[0.15em] text-muted-foreground md:grid md:grid-cols-[1fr_1fr_80px_80px_120px]">
            <span>Quiz</span>
            <span>Course</span>
            <span>Score</span>
            <span>Result</span>
            <span>Date</span>
          </div>
          <div className="divide-y divide-border">
            {attempts.map((a) => (
              <div
                key={a.id}
                className="flex flex-col gap-2 px-5 py-3 md:grid md:grid-cols-[1fr_1fr_80px_80px_120px] md:items-center md:gap-4"
              >
                <span className="text-sm font-medium">{a.quizTitle}</span>
                <span className="text-sm text-muted-foreground">{a.courseTitle}</span>
                <span className="text-sm tabular-nums font-medium">{a.score}%</span>
                <span className="inline-flex items-center gap-1">
                  {a.passed ? (
                    <>
                      <CheckCircle className="size-3.5 text-emerald-500" />
                      <span className="text-xs text-emerald-600">Pass</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="size-3.5 text-destructive" />
                      <span className="text-xs text-destructive">Fail</span>
                    </>
                  )}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {a.completedAt
                    ? new Date(a.completedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
