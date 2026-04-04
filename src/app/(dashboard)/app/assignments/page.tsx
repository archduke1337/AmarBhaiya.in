import { FileText, Upload, Clock, Download } from "lucide-react";
import type { Models } from "node-appwrite";

import { requireAuth } from "@/lib/appwrite/auth";
import { PageHeader, EmptyState } from "@/components/dashboard";
import { submitAssignmentAction } from "@/actions/assignments";
import {
  ASSIGNMENT_SUBMISSION_ALLOWED_EXTENSIONS,
  ASSIGNMENT_SUBMISSION_MAX_BYTES,
} from "@/lib/uploads/assignment-submission";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { Query } from "node-appwrite";

type AnyRow = Models.Row & Record<string, unknown>;

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
    Query.equal("isActive", [true]),
  ]);

  const courseIds = Array.from(
    new Set(
      enrollments
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
    <div className="flex flex-col gap-6 max-w-4xl">
      <PageHeader
        eyebrow="Assignments"
        title="Your Assignments"
        description={`${pending.length} pending · ${done.length} submitted · ${assignments.length} total`}
      />

      {assignments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No assignments yet"
          description="Assignments from your enrolled courses will appear here."
          action={{ label: "Browse courses", href: "/courses" }}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Pending */}
          {pending.length > 0 && (
            <section
              id="pending-assignments"
              className="scroll-mt-24 flex flex-col gap-3"
            >
              <h2 className="text-sm font-medium text-muted-foreground">
                Pending ({pending.length})
              </h2>
              {pending.map((a) => (
                <article
                  key={a.id}
                  id={`assignment-${a.id}`}
                  className="scroll-mt-24 border border-border"
                >
                  <div className="px-5 py-4 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-medium">{a.title}</h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {a.courseTitle}
                        </p>
                      </div>
                      {a.dueDate && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground border border-border px-2 py-0.5 shrink-0">
                          <Clock className="size-3" />
                          Due: {new Date(a.dueDate).toLocaleDateString("en-IN")}
                        </span>
                      )}
                    </div>

                    {a.description && (
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                        {a.description}
                      </p>
                    )}
                  </div>

                  {/* Submit form */}
                  <form
                    action={submitAssignmentAction}
                    className="border-t border-border px-5 py-3 flex items-center gap-3"
                    encType="multipart/form-data"
                  >
                    <input type="hidden" name="assignmentId" value={a.id} />
                    <label className="flex items-center gap-2 text-xs cursor-pointer flex-1">
                      <Upload className="size-3.5 text-muted-foreground" />
                      <input
                        type="file"
                        name="file"
                        accept={acceptedAssignmentFileTypes}
                        className="text-xs file:border file:border-border file:bg-background file:px-2 file:py-1 file:text-xs file:mr-2"
                      />
                    </label>
                    <span className="text-[10px] text-muted-foreground hidden lg:inline">
                      Max {Math.round(ASSIGNMENT_SUBMISSION_MAX_BYTES / (1024 * 1024))} MB
                    </span>
                    <button
                      type="submit"
                      className="h-8 bg-foreground text-background px-4 text-xs transition-opacity hover:opacity-90 shrink-0"
                    >
                      Submit
                    </button>
                  </form>
                </article>
              ))}
            </section>
          )}

          {/* Submitted */}
          {done.length > 0 && (
            <section
              id="submitted-assignments"
              className="scroll-mt-24 flex flex-col gap-3"
            >
              <h2 className="text-sm font-medium text-muted-foreground">
                Submitted ({done.length})
              </h2>
              {done.map((a) => (
                <article
                  key={a.id}
                  id={`assignment-${a.id}`}
                  className="scroll-mt-24 border border-border"
                >
                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-medium">{a.title}</h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {a.courseTitle} · Submitted{" "}
                          {a.submittedAt
                            ? new Date(a.submittedAt).toLocaleDateString(
                                "en-IN"
                              )
                            : ""}
                        </p>
                      </div>
                      {a.isGraded ? (
                        <span className="text-sm font-medium tabular-nums">
                          {a.grade}/100
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground border border-border px-2 py-0.5">
                          Awaiting grade
                        </span>
                      )}
                    </div>

                    {a.fileId && a.submissionId && (
                      <div className="mt-2">
                        <a
                          href={`/api/submission-file/${a.submissionId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs border border-border px-2 py-1 hover:bg-muted transition-colors"
                        >
                          <Download className="size-3" />
                          Open your submission
                        </a>
                      </div>
                    )}

                    {a.feedback && (
                      <div className="mt-3 border-t border-border pt-3">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                          Instructor Feedback
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {a.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
