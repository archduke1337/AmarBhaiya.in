import Link from "next/link";
import { Children, type ReactNode } from "react";
import {
  CheckCircle2,
  ClipboardCheck,
  Download,
  GraduationCap,
  MessageSquareText,
} from "lucide-react";

import { gradeSubmissionAction } from "@/actions/assignments";
import {
  EmptyState,
  PageHeader,
  StatCard,
  StatGrid,
} from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/appwrite/auth";
import {
  getInstructorSubmissionQueue,
  type InstructorSubmissionQueueItem,
} from "@/lib/appwrite/dashboard-data";
import { formatDateTime, formatRelativeTime } from "@/lib/utils/format";

export default async function InstructorSubmissionsPage() {
  const { user, role } = await requireRole(["admin", "instructor"]);
  const scope = { userId: user.$id, role };
  const submissions = await getInstructorSubmissionQueue(scope);

  const awaitingGrade = [...submissions]
    .filter((submission) => !submission.isGraded)
    .sort((left, right) => {
      const leftTime = new Date(left.submittedAt).getTime();
      const rightTime = new Date(right.submittedAt).getTime();
      return leftTime - rightTime;
    });
  const feedbackMissing = [...submissions]
    .filter((submission) => submission.needsFeedback)
    .sort((left, right) => {
      const leftTime = new Date(left.gradedAt ?? left.submittedAt).getTime();
      const rightTime = new Date(right.gradedAt ?? right.submittedAt).getTime();
      return leftTime - rightTime;
    });
  const graded = [...submissions]
    .filter((submission) => submission.isGraded && !submission.needsFeedback)
    .sort((left, right) => {
      const leftTime = new Date(left.gradedAt ?? left.submittedAt).getTime();
      const rightTime = new Date(right.gradedAt ?? right.submittedAt).getTime();
      return rightTime - leftTime;
    });
  const overdueReviews = awaitingGrade.filter(
    (submission) => submission.isOverdueReview
  ).length;

  return (
    <div className="flex max-w-6xl flex-col gap-6">
      <PageHeader
        eyebrow="Instructor · Submissions"
        title="Assignment Review Queue"
        description={`${awaitingGrade.length} awaiting grade · ${feedbackMissing.length} missing feedback · ${graded.length} fully graded`}
        actions={
          <Link
            href="/instructor"
            className="inline-flex h-9 items-center px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to dashboard
          </Link>
        }
      />

      <StatGrid columns={3}>
        <StatCard
          label="Awaiting Grade"
          value={awaitingGrade.length}
          icon={ClipboardCheck}
          description={
            overdueReviews > 0
              ? `${overdueReviews} review${overdueReviews === 1 ? "" : "s"} overdue`
              : awaitingGrade.length > 0
                ? "Oldest submissions are shown first"
                : "Nothing waiting right now"
          }
        />
        <StatCard
          label="Missing Feedback"
          value={feedbackMissing.length}
          icon={MessageSquareText}
          description={
            feedbackMissing.length > 0
              ? "Students have a score but still need context"
              : "Every graded submission includes feedback"
          }
        />
        <StatCard
          label="Fully Graded"
          value={graded.length}
          icon={CheckCircle2}
          description={
            graded.length > 0
              ? "Recent completions stay editable here"
              : "Completed reviews will appear here"
          }
        />
      </StatGrid>

      {submissions.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No submissions yet"
          description="Students will submit assignments here once you publish course work inside your curriculum."
        />
      ) : (
        <div className="flex flex-col gap-6">
          <SubmissionSection
            id="awaiting-grade"
            title={`Awaiting Grade (${awaitingGrade.length})`}
            description="Start with the oldest work first so nothing sits too long without a score."
            emptyText="No submissions are waiting for a grade."
          >
            {awaitingGrade.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                variant="pending"
              />
            ))}
          </SubmissionSection>

          <SubmissionSection
            id="feedback-missing"
            title={`Needs Feedback (${feedbackMissing.length})`}
            description="These submissions already have a score, but the student still needs written guidance."
            emptyText="Every graded submission already has feedback."
          >
            {feedbackMissing.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                variant="feedback"
              />
            ))}
          </SubmissionSection>

          <SubmissionSection
            id="graded-submissions"
            title={`Recently Graded (${graded.length})`}
            description="Keep recent grading decisions visible so you can quickly update scores or notes when needed."
            emptyText="Graded submissions will appear here once reviews are complete."
          >
            {graded.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                variant="graded"
              />
            ))}
          </SubmissionSection>
        </div>
      )}
    </div>
  );
}

function SubmissionSection({
  id,
  title,
  description,
  emptyText,
  children,
}: {
  id: string;
  title: string;
  description: string;
  emptyText: string;
  children: ReactNode;
}) {
  const childCount = Children.toArray(children).length;

  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-3 flex flex-col gap-1">
        <h2 className="text-base font-medium">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {childCount === 0 ? (
        <div className="border border-dashed border-border px-5 py-6 text-sm text-muted-foreground">
          {emptyText}
        </div>
      ) : (
        <div className="flex flex-col gap-3">{children}</div>
      )}
    </section>
  );
}

function SubmissionCard({
  submission,
  variant,
}: {
  submission: InstructorSubmissionQueueItem;
  variant: "pending" | "feedback" | "graded";
}) {
  const submittedAtLabel = submission.submittedAt
    ? formatDateTime(submission.submittedAt)
    : "Unknown submission time";
  const submittedRelativeLabel = submission.submittedAt
    ? formatRelativeTime(submission.submittedAt)
    : "";
  const gradedAtLabel = submission.gradedAt
    ? formatRelativeTime(submission.gradedAt)
    : "";
  const isOverdue = variant === "pending" && submission.isOverdueReview;

  return (
    <article
      id={`submission-${submission.id}`}
      className="scroll-mt-24 border border-border bg-card"
    >
      <div className="flex flex-col gap-4 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-medium">{submission.assignmentTitle}</h3>
              {variant === "pending" ? (
                <Badge variant={isOverdue ? "destructive" : "outline"}>
                  {isOverdue ? "Overdue" : "Pending"}
                </Badge>
              ) : variant === "feedback" ? (
                <Badge variant="secondary">Needs feedback</Badge>
              ) : (
                <Badge>Graded</Badge>
              )}
              {submission.isGraded && (
                <Badge variant="outline">{submission.grade}/100</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {submission.courseTitle} · {submission.userName}
            </p>
            <p className="text-xs text-muted-foreground">
              Submitted {submittedAtLabel}
              {submittedRelativeLabel ? ` · ${submittedRelativeLabel}` : ""}
            </p>
            {submission.isGraded && gradedAtLabel ? (
              <p className="text-xs text-muted-foreground">
                Last graded {gradedAtLabel}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              href={`/instructor/courses/${submission.courseId}/curriculum`}
              className="inline-flex h-8 items-center border border-border px-3 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              Open course
            </Link>
            {submission.fileId ? (
              <a
                href={`/api/submission-file/${submission.id}?download=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1 border border-border px-3 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                <Download className="size-3" />
                Download
              </a>
            ) : null}
          </div>
        </div>

        {submission.feedback ? (
          <div className="border border-border/70 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {submission.feedback}
          </div>
        ) : null}
      </div>

      <form
        action={gradeSubmissionAction}
        className="grid gap-3 border-t border-border px-5 py-4 md:grid-cols-[120px_minmax(0,1fr)_auto]"
      >
        <input type="hidden" name="submissionId" value={submission.id} />

        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Grade
          </span>
          <input
            name="grade"
            type="number"
            min={0}
            max={100}
            required
            defaultValue={submission.isGraded ? submission.grade : undefined}
            placeholder="85"
            className="h-9 border border-border bg-background px-3 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Feedback
          </span>
          <input
            name="feedback"
            defaultValue={submission.feedback}
            placeholder="Share what went well and what should improve next."
            className="h-9 border border-border bg-background px-3 text-sm"
          />
        </label>

        <div className="flex items-end">
          <button
            type="submit"
            className="inline-flex h-9 items-center justify-center bg-foreground px-4 text-sm text-background transition-opacity hover:opacity-90"
          >
            {variant === "pending"
              ? "Submit grade"
              : variant === "feedback"
                ? "Add feedback"
                : "Update review"}
          </button>
        </div>
      </form>
    </article>
  );
}
