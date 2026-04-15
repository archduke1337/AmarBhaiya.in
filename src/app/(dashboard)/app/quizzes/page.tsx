import { Award, CheckCircle, XCircle } from "lucide-react";
import { Query } from "node-appwrite";
import type { Models } from "node-appwrite";

import { requireAuth } from "@/lib/appwrite/auth";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { PageHeader, EmptyState } from "@/components/dashboard";
import { RetroPanel } from "@/components/marketing/retro-panel";
import { Badge } from "@/components/ui/badge";

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
    <div className="flex max-w-6xl flex-col gap-6">
      <PageHeader
        eyebrow="Quiz History"
        title="Quiz results ko pressure nahi, feedback ki tarah dekho."
        description={`${attempts.length} total · ${passed} passed · Avg score: ${avgScore}%. Galat attempts bhi revision ka signal dete hain.`}
      />

      {attempts.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No quiz attempts yet"
          description="Jab kisi enrolled course ka quiz attempt karoge, result yahin aa jayega."
          action={{ label: "My courses", href: "/app/courses" }}
        />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <RetroPanel tone="secondary" className="space-y-1">
              <p className="font-heading text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                Attempts
              </p>
              <p className="font-heading text-4xl font-black tracking-[-0.08em]">
                {attempts.length}
              </p>
            </RetroPanel>
            <RetroPanel tone="accent" className="space-y-1">
              <p className="font-heading text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                Passed
              </p>
              <p className="font-heading text-4xl font-black tracking-[-0.08em]">
                {passed}
              </p>
            </RetroPanel>
            <RetroPanel tone="card" className="space-y-1">
              <p className="font-heading text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                Average
              </p>
              <p className="font-heading text-4xl font-black tracking-[-0.08em]">
                {avgScore}%
              </p>
            </RetroPanel>
          </div>

          <RetroPanel tone="card" className="space-y-0 p-0">
            <div className="border-b-2 border-border px-5 py-4">
              <h2 className="font-heading text-lg font-black tracking-[-0.03em]">
                Attempt history
              </h2>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Latest attempts first
              </p>
            </div>
            <div className="divide-y-2 divide-border">
            {attempts.map((a) => (
              <div
                key={a.id}
                className="grid gap-3 px-5 py-4 md:grid-cols-[1.2fr_1fr_auto_auto] md:items-center"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{a.quizTitle}</p>
                  <p className="text-xs font-medium text-muted-foreground">
                    {a.courseTitle}
                  </p>
                </div>
                <p className="text-xs tabular-nums text-muted-foreground md:text-right">
                  {a.completedAt
                    ? new Date(a.completedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "No date"}
                </p>
                <Badge variant="outline" className="w-fit tabular-nums">
                  {a.score}%
                </Badge>
                <span className="inline-flex items-center gap-1.5">
                  {a.passed ? (
                    <>
                      <CheckCircle className="size-3.5 text-emerald-500" />
                      <span className="text-xs font-semibold text-emerald-600">Pass</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="size-3.5 text-destructive" />
                      <span className="text-xs font-semibold text-destructive">Retry</span>
                    </>
                  )}
                </span>
              </div>
            ))}
            </div>
          </RetroPanel>
        </div>
      )}
    </div>
  );
}
