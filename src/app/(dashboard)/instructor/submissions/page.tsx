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
import { RetroPanel } from "@/components/marketing/retro-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
        description={`${awaitingGrade.length} awaiting grade · ${feedbackMissing.length} missing feedback · ${graded.length} fully graded. Start with the oldest work so students do not wait silently.`}
        actions={
          <Button asChild variant="outline" size="sm" className="w-full min-[420px]:w-auto">
            <Link href="/instructor">Back to dashboard</Link>
          </Button>
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
        <h2 className="font-heading text-2xl font-black tracking-[-0.04em]">
          {title}
        </h2>
        <p className="text-sm font-medium leading-7 text-muted-foreground">
          {description}
        </p>
      </div>

      {childCount === 0 ? (
        <div className="rounded-[calc(var(--radius)+6px)] border-2 border-dashed border-border bg-[color:var(--surface-card)] px-5 py-6 text-sm font-semibold leading-7 text-muted-foreground">
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
    <RetroPanel
      id={`submission-${submission.id}`}
      tone={variant === "pending" ? "accent" : "card"}
      className="scroll-mt-24 overflow-hidden p-0"
    >
      <div className="flex flex-col gap-4 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading text-lg font-black tracking-[-0.04em]">
                {submission.assignmentTitle}
              </h3>
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
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {submission.courseTitle} · {submission.userName}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              Submitted {submittedAtLabel}
              {submittedRelativeLabel ? ` · ${submittedRelativeLabel}` : ""}
            </p>
            {submission.isGraded && gradedAtLabel ? (
              <p className="text-xs font-semibold text-muted-foreground">
                Last graded {gradedAtLabel}
              </p>
            ) : null}
          </div>

          <div className="grid w-full shrink-0 grid-cols-1 gap-2 min-[420px]:w-auto min-[420px]:grid-cols-2 sm:flex sm:items-center">
            <Button asChild variant="outline" size="xs">
              <Link href={`/instructor/courses/${submission.courseId}/curriculum`}>
                Open course
              </Link>
            </Button>
            {submission.fileId ? (
              <Button asChild variant="secondary" size="xs">
                <a
                  href={`/api/submission-file/${submission.id}?download=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="size-3" />
                  Download
                </a>
              </Button>
            ) : null}
          </div>
        </div>

        {submission.feedback ? (
          <div className="rounded-[calc(var(--radius)+2px)] border-2 border-border bg-[color:var(--surface-muted)] px-3 py-2 text-sm font-medium leading-7 text-muted-foreground shadow-retro-sm">
            {submission.feedback}
          </div>
        ) : null}
      </div>

      <form
        action={gradeSubmissionAction}
        className="grid gap-4 border-t-2 border-border bg-[color:var(--surface-muted)] px-5 py-4 md:grid-cols-[120px_minmax(0,1fr)_auto]"
      >
        <input type="hidden" name="submissionId" value={submission.id} />

        <label className="flex flex-col gap-2">
          <Label>Grade</Label>
          <Input
            name="grade"
            type="number"
            min={0}
            max={100}
            required
            defaultValue={submission.isGraded ? submission.grade : undefined}
            placeholder="85"
            className="h-10"
          />
        </label>

        <label className="flex flex-col gap-2">
          <Label>Feedback</Label>
          <Textarea
            name="feedback"
            defaultValue={submission.feedback}
            placeholder="Write like a teacher: what went well, what to fix, and what to attempt next."
            className="min-h-24"
          />
        </label>

        <div className="flex items-end">
          <Button
            type="submit"
            className="w-full md:w-auto"
          >
            {variant === "pending"
              ? "Submit grade"
              : variant === "feedback"
                ? "Add feedback"
                : "Update review"}
          </Button>
        </div>
      </form>
    </RetroPanel>
  );
}
