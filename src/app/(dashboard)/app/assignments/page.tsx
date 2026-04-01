import Link from "next/link";
import { FileText, Upload, Clock } from "lucide-react";

import { requireAuth } from "@/lib/appwrite/auth";
import { getStudentEnrolledCourses } from "@/lib/appwrite/dashboard-data";
import { PageHeader, EmptyState } from "@/components/dashboard";
import { submitAssignmentAction } from "@/actions/assignments";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { Query } from "node-appwrite";

type AnyRow = Record<string, unknown> & { $id: string };

type StudentAssignment = {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string;
  dueDate: string;
  submitted: boolean;
  submittedAt: string;
  grade: number;
  feedback: string;
};

async function getStudentAssignments(
  userId: string
): Promise<StudentAssignment[]> {
  const { tablesDB } = await createAdminClient();

  // Get enrolled course IDs
  const enrollments = await tablesDB.listRows({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.tables.enrollments,
    queries: [
      Query.equal("userId", [userId]),
      Query.limit(100),
    ],
  });

  const courseIds = enrollments.rows.map((r) =>
    String((r as AnyRow).courseId ?? "")
  );

  if (courseIds.length === 0) return [];

  // Get assignments for enrolled courses
  const assignments: StudentAssignment[] = [];

  for (const courseId of courseIds) {
    try {
      const result = await tablesDB.listRows({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.assignments,
        queries: [
          Query.equal("courseId", [courseId]),
          Query.limit(50),
        ],
      });

      // Get course title
      let courseTitle = "Course";
      try {
        const course = (await tablesDB.getRow({
          databaseId: APPWRITE_CONFIG.databaseId,
          tableId: APPWRITE_CONFIG.tables.courses,
          rowId: courseId,
        })) as AnyRow;
        courseTitle = String(course.title ?? "Course");
      } catch {
        // skip
      }

      for (const r of result.rows) {
        const row = r as AnyRow;

        // Check if student has submitted
        let submitted = false;
        let submittedAt = "";
        let grade = 0;
        let feedback = "";

        try {
          const subs = await tablesDB.listRows({
            databaseId: APPWRITE_CONFIG.databaseId,
            tableId: APPWRITE_CONFIG.tables.submissions,
            queries: [
              Query.equal("assignmentId", [row.$id]),
              Query.equal("userId", [userId]),
              Query.limit(1),
            ],
          });

          if (subs.rows.length > 0) {
            const sub = subs.rows[0] as AnyRow;
            submitted = true;
            submittedAt = String(sub.submittedAt ?? "");
            grade = Number(sub.grade ?? 0);
            feedback = String(sub.feedback ?? "");
          }
        } catch {
          // skip
        }

        assignments.push({
          id: row.$id,
          courseId,
          courseTitle,
          title: String(row.title ?? "Assignment"),
          description: String(row.description ?? ""),
          dueDate: String(row.dueDate ?? ""),
          submitted,
          submittedAt,
          grade,
          feedback,
        });
      }
    } catch {
      // skip
    }
  }

  return assignments;
}

export default async function StudentAssignmentsPage() {
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
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                Pending ({pending.length})
              </h2>
              {pending.map((a) => (
                <article key={a.id} className="border border-border">
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
                        className="text-xs file:border file:border-border file:bg-background file:px-2 file:py-1 file:text-xs file:mr-2"
                      />
                    </label>
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
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                Submitted ({done.length})
              </h2>
              {done.map((a) => (
                <article key={a.id} className="border border-border">
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
                      {a.grade > 0 ? (
                        <span className="text-sm font-medium tabular-nums">
                          {a.grade}/100
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground border border-border px-2 py-0.5">
                          Awaiting grade
                        </span>
                      )}
                    </div>

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
