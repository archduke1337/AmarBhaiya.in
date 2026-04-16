import { FileText, Upload, Clock, Download } from "lucide-react";
import type { Models } from "node-appwrite";

import { requireAuth } from "@/lib/appwrite/auth";
import { PageHeader, EmptyState } from "@/components/dashboard";
import { submitAssignmentAction } from "@/actions/assignments";
import { RetroPanel } from "@/components/marketing/retro-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ASSIGNMENT_SUBMISSION_ALLOWED_EXTENSIONS,
  ASSIGNMENT_SUBMISSION_MAX_BYTES,
} from "@/lib/uploads/assignment-submission";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { Query } from "node-appwrite";

type AnyRow = Models.Row & Record<string, unknown>;

function isActiveEnrollment(row: AnyRow): boolean {
  return row.isActive !== false
    && String(row.status ?? "active") !== "cancelled";
}

type StudentAssignment = {
  id: string;
  submissionId: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string;
  dueDate: string;
  submitted: boolean;
  submittedAt: string;
  gradedAt: string;
  isGraded: boolean;
  grade: number;
  feedback: string;
  fileId: string;
};

async function getStudentAssignments(
  userId: string
): Promise<StudentAssignment[]> {
  const { tablesDB } = await createAdminClient();

  const chunkValues = (values: string[], chunkSize = 20): string[][] => {
    if (values.length <= chunkSize) {
      return [values];
    }

    const chunks: string[][] = [];
    for (let index = 0; index < values.length; index += chunkSize) {
      chunks.push(values.slice(index, index + chunkSize));
    }

    return chunks;
  };

  const listRowsByFieldValues = async (
    tableId: string,
    field: string,
    values: string[],
    extraQueries: string[] = []
  ): Promise<AnyRow[]> => {
    if (values.length === 0) {
      return [];
    }

    const chunks = chunkValues(values, 20);
    const results = await Promise.all(
      chunks.map(async (chunk) => {
        try {
          const rows: AnyRow[] = [];
          let offset = 0;

          while (true) {
            const result = await tablesDB.listRows({
              databaseId: APPWRITE_CONFIG.databaseId,
              tableId,
              queries: [
                Query.equal(field, chunk),
                ...extraQueries,
                Query.limit(500),
                Query.offset(offset),
              ],
            });

            rows.push(...(result.rows as AnyRow[]));

            if (result.rows.length < 500) {
              break;
            }

            offset += result.rows.length;
          }

          return rows;
        } catch {
          return [] as AnyRow[];
        }
      })
    );

    return results.flat();
  };

  const listAllRows = async (
    tableId: string,
    queries: string[] = []
  ): Promise<AnyRow[]> => {
    try {
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
    } catch {
      return [];
    }
  };

  const enrollments = await listAllRows(APPWRITE_CONFIG.tables.enrollments, [
    Query.equal("userId", [userId]),
  ]);

  const courseIds = Array.from(
    new Set(
      enrollments
        .filter(isActiveEnrollment)
        .map((r) => String((r as AnyRow).courseId ?? ""))
        .filter((id) => id.length > 0)
    )
  );

  if (courseIds.length === 0) return [];

  const [courseRows, assignmentRows, submissionsResult] = await Promise.all([
    listRowsByFieldValues(APPWRITE_CONFIG.tables.courses, "$id", courseIds),
    listRowsByFieldValues(
      APPWRITE_CONFIG.tables.assignments,
      "courseId",
      courseIds,
      [Query.orderDesc("$createdAt")]
    ),
    listAllRows(APPWRITE_CONFIG.tables.submissions, [
      Query.equal("userId", [userId]),
      Query.orderDesc("$createdAt"),
    ]),
  ]);

  const courseTitleById = new Map<string, string>(
    courseRows.map((row) => [row.$id, String(row.title ?? "Course")])
  );

  const assignmentIds = new Set(assignmentRows.map((row) => row.$id));
  const latestSubmissionByAssignmentId = new Map<string, AnyRow>();

  for (const row of submissionsResult) {
    const assignmentId = String(row.assignmentId ?? "");
    if (!assignmentIds.has(assignmentId)) {
      continue;
    }

    const previous = latestSubmissionByAssignmentId.get(assignmentId);
    const currentTime = new Date(String(row.submittedAt ?? row.$createdAt ?? "")).getTime();
    const previousTime = previous
      ? new Date(String(previous.submittedAt ?? previous.$createdAt ?? "")).getTime()
      : -1;

    if (!previous || currentTime >= previousTime) {
      latestSubmissionByAssignmentId.set(assignmentId, row);
    }
  }

  return assignmentRows.map((row) => {
    const submission = latestSubmissionByAssignmentId.get(row.$id);

    return {
      id: row.$id,
      submissionId: String(submission?.$id ?? ""),
      courseId: String(row.courseId ?? ""),
      courseTitle:
        courseTitleById.get(String(row.courseId ?? "")) ?? "Course",
      title: String(row.title ?? "Assignment"),
      description: String(row.description ?? ""),
      dueDate: String(row.dueDate ?? ""),
      submitted: Boolean(submission),
      submittedAt: String(submission?.submittedAt ?? ""),
      gradedAt: String(submission?.gradedAt ?? ""),
      isGraded:
        (typeof submission?.gradedAt === "string" && submission.gradedAt.length > 0) ||
        (typeof submission?.feedback === "string" && submission.feedback.trim().length > 0) ||
        Number(submission?.grade ?? 0) !== 0,
      grade: Number(submission?.grade ?? 0),
      feedback: String(submission?.feedback ?? ""),
      fileId: String(submission?.fileId ?? ""),
    } satisfies StudentAssignment;
  });
}

export default async function StudentAssignmentsPage() {
  const acceptedAssignmentFileTypes = ASSIGNMENT_SUBMISSION_ALLOWED_EXTENSIONS
    .map((extension) => `.${extension}`)
    .join(",");

  const user = await requireAuth();
  const assignments = await getStudentAssignments(user.$id);

  const pending = assignments.filter((a) => !a.submitted);
  const done = assignments.filter((a) => a.submitted);

  return (
    <div className="flex max-w-6xl flex-col gap-6">
      <PageHeader
        eyebrow="Assignments"
        title="Assignments ko simple queue ki tarah rakho."
        description={`${pending.length} pending · ${done.length} submitted · ${assignments.length} total. Pehle pending kaam clear karo, phir feedback review karna.`}
      />

      {assignments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No assignments yet"
          description="Jab enrolled courses mein assignments publish honge, woh yahin aa jayenge."
          action={{ label: "Browse courses", href: "/courses" }}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <RetroPanel tone="accent" className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                Submission desk
              </p>
              <p className="text-sm font-medium leading-7 text-foreground/80">
                File upload karne se pehle name, subject, aur pages ek baar check kar lo. Re-submit karoge toh old file replace ho jayegi.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{pending.length} pending</Badge>
              <Badge variant="ghost">{done.length} submitted</Badge>
            </div>
          </RetroPanel>

          {/* Pending */}
          {pending.length > 0 && (
            <section
              id="pending-assignments"
              className="scroll-mt-24 flex flex-col gap-3"
            >
              <h2 className="font-heading text-lg font-black tracking-[-0.03em] text-muted-foreground">
                Pending ({pending.length})
              </h2>
              {pending.map((a) => (
                <RetroPanel
                  key={a.id}
                  id={`assignment-${a.id}`}
                  tone="card"
                  className="scroll-mt-24 space-y-0 p-0"
                >
                  <div className="flex flex-col gap-3 px-5 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <h3 className="font-heading text-2xl font-black tracking-[-0.04em]">
                          {a.title}
                        </h3>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          {a.courseTitle}
                        </p>
                      </div>
                      {a.dueDate && (
                        <Badge variant="outline" className="shrink-0">
                          <Clock className="size-3" />
                          Due: {new Date(a.dueDate).toLocaleDateString("en-IN")}
                        </Badge>
                      )}
                    </div>

                    {a.description && (
                      <p className="whitespace-pre-wrap text-sm font-medium leading-7 text-muted-foreground">
                        {a.description}
                      </p>
                    )}
                  </div>

                  {/* Submit form */}
                  <form
                    action={submitAssignmentAction}
                    className="grid gap-3 border-t-2 border-border px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
                    encType="multipart/form-data"
                  >
                    <input type="hidden" name="assignmentId" value={a.id} />
                    <label className="flex min-h-12 cursor-pointer items-center gap-2 rounded-[calc(var(--radius)+2px)] border-2 border-border bg-[color:var(--surface-muted)] px-3 text-xs font-semibold shadow-retro-sm">
                      <Upload className="size-3.5 text-muted-foreground" />
                      <input
                        type="file"
                        name="file"
                        accept={acceptedAssignmentFileTypes}
                        className="min-w-0 text-xs file:mr-2 file:rounded-[calc(var(--radius)+1px)] file:border-2 file:border-border file:bg-background file:px-2 file:py-1 file:text-xs"
                      />
                    </label>
                    <Button
                      type="submit"
                      variant="secondary"
                      className="w-full sm:w-auto"
                    >
                      Submit
                    </Button>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:col-span-2">
                      Max {Math.round(ASSIGNMENT_SUBMISSION_MAX_BYTES / (1024 * 1024))} MB · Accepted: {acceptedAssignmentFileTypes}
                    </p>
                  </form>
                </RetroPanel>
              ))}
            </section>
          )}

          {/* Submitted */}
          {done.length > 0 && (
            <section
              id="submitted-assignments"
              className="scroll-mt-24 flex flex-col gap-3"
            >
              <h2 className="font-heading text-lg font-black tracking-[-0.03em] text-muted-foreground">
                Submitted ({done.length})
              </h2>
              {done.map((a) => (
                <RetroPanel
                  key={a.id}
                  id={`assignment-${a.id}`}
                  tone={a.isGraded ? "secondary" : "muted"}
                  className="scroll-mt-24 space-y-0 p-0"
                >
                  <div className="px-5 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <h3 className="font-heading text-2xl font-black tracking-[-0.04em]">
                          {a.title}
                        </h3>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          {a.courseTitle} · Submitted{" "}
                          {a.submittedAt
                            ? new Date(a.submittedAt).toLocaleDateString(
                                "en-IN"
                              )
                            : ""}
                        </p>
                      </div>
                      {a.isGraded ? (
                        <Badge variant="outline" className="tabular-nums">
                          {a.grade}/100
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          Awaiting grade
                        </Badge>
                      )}
                    </div>

                    {a.fileId && a.submissionId && (
                      <div className="mt-2">
                        <a
                          href={`/api/submission-file/${a.submissionId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-10 items-center gap-2 rounded-[calc(var(--radius)+2px)] border-2 border-border bg-[color:var(--surface-card)] px-3 text-xs font-semibold shadow-retro-sm transition-colors hover:bg-[color:var(--surface-accent)]"
                        >
                          <Download className="size-3" />
                          Open your submission
                        </a>
                      </div>
                    )}

                    {a.feedback && (
                      <div className="mt-4 border-t-2 border-border pt-4">
                        <p className="mb-1 font-heading text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                          Instructor Feedback
                        </p>
                        <p className="text-sm font-medium leading-7 text-muted-foreground">
                          {a.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                </RetroPanel>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
