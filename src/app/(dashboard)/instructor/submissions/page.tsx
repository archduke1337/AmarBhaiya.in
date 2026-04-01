import { FileText, GraduationCap, Download } from "lucide-react";

import { requireRole } from "@/lib/appwrite/auth";
import { getInstructorCourseList } from "@/lib/appwrite/dashboard-data";
import {
  getCourseAssignments,
  getAssignmentSubmissions,
  gradeSubmissionAction,
} from "@/actions/assignments";
import { PageHeader, EmptyState } from "@/components/dashboard";
import { getFileViewUrl } from "@/lib/utils/file-urls";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";

export default async function InstructorSubmissionsPage() {
  const { user, role } = await requireRole(["admin", "instructor"]);
  const scope = { userId: user.$id, role };
  const courses = await getInstructorCourseList(scope);

  // Gather all assignments and submissions across all courses
  type FullSubmission = {
    assignmentId: string;
    assignmentTitle: string;
    courseTitle: string;
    id: string;
    userId: string;
    userName: string;
    fileId: string;
    submittedAt: string;
    grade: number;
    feedback: string;
  };

  const allSubmissions: FullSubmission[] = [];

  for (const course of courses) {
    const assignments = await getCourseAssignments(course.id);
    for (const assignment of assignments) {
      const subs = await getAssignmentSubmissions(assignment.id);
      for (const sub of subs) {
        allSubmissions.push({
          ...sub,
          assignmentTitle: assignment.title,
          courseTitle: course.title,
          assignmentId: assignment.id,
        });
      }
    }
  }

  const ungraded = allSubmissions.filter((s) => s.grade === 0);
  const graded = allSubmissions.filter((s) => s.grade > 0);

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <PageHeader
        eyebrow="Instructor · Submissions"
        title="Assignment Submissions"
        description={`${ungraded.length} awaiting grade · ${graded.length} graded · ${allSubmissions.length} total`}
      />

      {allSubmissions.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No submissions yet"
          description="Students will submit assignments here once you create them in your course curriculum."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Ungraded first */}
          {ungraded.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                Awaiting Grade ({ungraded.length})
              </h2>
              {ungraded.map((sub) => (
                <article key={sub.id} className="border border-border">
                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-medium">
                          {sub.assignmentTitle}
                        </h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {sub.courseTitle} · by {sub.userName}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Submitted:{" "}
                          {new Date(sub.submittedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      {sub.fileId && (
                        <a
                          href={getFileViewUrl(
                            APPWRITE_CONFIG.buckets.courseResources,
                            sub.fileId
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs border border-border px-2 py-1 hover:bg-muted transition-colors shrink-0"
                        >
                          <Download className="size-3" />
                          Download
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Grading form */}
                  <form
                    action={gradeSubmissionAction}
                    className="border-t border-border px-5 py-3 flex items-end gap-3"
                  >
                    <input type="hidden" name="submissionId" value={sub.id} />
                    <label className="flex-1 space-y-1">
                      <span className="text-[10px] text-muted-foreground">
                        Grade (0-100)
                      </span>
                      <input
                        name="grade"
                        type="number"
                        min={0}
                        max={100}
                        required
                        placeholder="85"
                        className="h-8 w-full border border-border bg-background px-2 text-xs"
                      />
                    </label>
                    <label className="flex-[2] space-y-1">
                      <span className="text-[10px] text-muted-foreground">
                        Feedback (optional)
                      </span>
                      <input
                        name="feedback"
                        placeholder="Good work! Consider improving..."
                        className="h-8 w-full border border-border bg-background px-2 text-xs"
                      />
                    </label>
                    <button
                      type="submit"
                      className="h-8 bg-foreground text-background px-4 text-xs shrink-0 transition-opacity hover:opacity-90"
                    >
                      Submit Grade
                    </button>
                  </form>
                </article>
              ))}
            </section>
          )}

          {/* Graded */}
          {graded.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                Graded ({graded.length})
              </h2>
              {graded.map((sub) => (
                <article
                  key={sub.id}
                  className="border border-border px-5 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-medium">
                        {sub.assignmentTitle}
                      </h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {sub.courseTitle} · by {sub.userName} ·{" "}
                        {new Date(sub.submittedAt).toLocaleDateString("en-IN")}
                      </p>
                      {sub.feedback && (
                        <p className="text-xs text-muted-foreground mt-1">
                          &ldquo;{sub.feedback}&rdquo;
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-medium tabular-nums shrink-0">
                      {sub.grade}/100
                    </span>
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
