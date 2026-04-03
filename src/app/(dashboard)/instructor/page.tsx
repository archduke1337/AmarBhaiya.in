import Link from "next/link";
import {
  BookOpen,
  Users,
  Video,
  ClipboardCheck,
  Plus,
  ArrowRight,
  Layers,
} from "lucide-react";

import {
  getInstructorCourseResources,
  getInstructorResources,
} from "@/actions/resources";
import { requireRole } from "@/lib/appwrite/auth";
import {
  getInstructorDashboardStats,
  getInstructorCourseList,
  getInstructorLiveSessions,
  getInstructorRevenueOverview,
  getInstructorSubmissionQueue,
  getInstructorStudents,
} from "@/lib/appwrite/dashboard-data";
import {
  formatCompactNumber,
  formatCurrency,
  formatDateTime,
  formatRelativeTime,
} from "@/lib/utils/format";
import {
  PageHeader,
  StatCard,
  StatGrid,
  EmptyState,
  ActivityFeed,
} from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";

export default async function InstructorDashboardPage() {
  const { user, role } = await requireRole(["admin", "instructor"]);
  const scope = { userId: user.$id, role };

  const [stats, courses, sessions, resources, courseResources, submissions, students, revenue] =
    await Promise.all([
    getInstructorDashboardStats(scope),
    getInstructorCourseList(scope),
    getInstructorLiveSessions(scope),
    getInstructorResources(scope),
    getInstructorCourseResources(scope),
    getInstructorSubmissionQueue(scope),
    getInstructorStudents(scope),
    getInstructorRevenueOverview(scope),
  ]);

  const draftCourses = courses.filter((c) => c.status === "Draft");
  const publishedCourses = courses.filter((c) => c.status === "Published");
  const standaloneDrafts = resources.filter((resource) => !resource.isPublished).length;
  const standalonePublished = resources.length - standaloneDrafts;
  const sessionsMissingJoinLink = sessions.filter((session) => !session.streamUrl).length;
  const resourceCourseCount = new Set(courseResources.map((resource) => resource.courseId)).size;
  const awaitingGrade = [...submissions]
    .filter((submission) => submission.grade === 0)
    .sort((left, right) => {
      const leftTime = new Date(left.submittedAt).getTime();
      const rightTime = new Date(right.submittedAt).getTime();
      return leftTime - rightTime;
    });
  const recentlyGraded = [...submissions]
    .filter((submission) => submission.grade > 0)
    .sort((left, right) => {
      const leftTime = new Date(left.gradedAt ?? left.submittedAt).getTime();
      const rightTime = new Date(right.gradedAt ?? right.submittedAt).getTime();
      return rightTime - leftTime;
    });
  const feedbackMissing = recentlyGraded.filter((submission) => submission.needsFeedback);
  const reviewOverdueCount = awaitingGrade.filter(
    (submission) => submission.isOverdueReview
  ).length;
  const studentsNeedingAttention = [...students]
    .filter((student) => student.needsAttention)
    .sort((left, right) => {
      if (left.progressPercent !== right.progressPercent) {
        return left.progressPercent - right.progressPercent;
      }
      const leftTime = new Date(left.enrolledAt ?? "").getTime();
      const rightTime = new Date(right.enrolledAt ?? "").getTime();
      return leftTime - rightTime;
    });
  const nearCompletionStudents = [...students]
    .filter((student) => student.isNearCompletion)
    .sort((left, right) => {
      if (left.progressPercent !== right.progressPercent) {
        return right.progressPercent - left.progressPercent;
      }
      const leftTime = new Date(left.enrolledAt ?? "").getTime();
      const rightTime = new Date(right.enrolledAt ?? "").getTime();
      return rightTime - leftTime;
    });
  const recentEnrollments = [...students]
    .filter((student) => student.isNewEnrollment)
    .sort((left, right) => {
      const leftTime = new Date(left.enrolledAt ?? "").getTime();
      const rightTime = new Date(right.enrolledAt ?? "").getTime();
      return rightTime - leftTime;
    });
  const topRevenueCourses = revenue.courseEarnings.filter(
    (course) => course.totalRevenue > 0
  );
  const dormantPaidCourses = revenue.dormantPaidCourses;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <PageHeader
        eyebrow="Instructor"
        title="Course Command Center"
        description="Manage your courses, monitor student progress, and schedule live sessions."
        actions={
          <Link
            href="/instructor/courses/new"
            className="inline-flex h-9 items-center gap-2 bg-foreground px-4 text-sm text-background transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            New Course
          </Link>
        }
      />

      {/* Stats */}
      <StatGrid columns={4}>
        <StatCard
          label="My Courses"
          value={formatCompactNumber(stats.courses)}
          icon={BookOpen}
          description={`${draftCourses.length} draft, ${publishedCourses.length} published`}
        />
        <StatCard
          label="Active Enrollments"
          value={formatCompactNumber(stats.activeEnrollments)}
          icon={Users}
          description="Across all your courses"
        />
        <StatCard
          label="Live Sessions"
          value={formatCompactNumber(stats.liveSessions)}
          icon={Video}
          description="Scheduled or active"
        />
        <StatCard
          label="Pending Reviews"
          value={formatCompactNumber(stats.pendingReviews)}
          icon={ClipboardCheck}
          description={
            stats.pendingReviews > 0
              ? reviewOverdueCount > 0
                ? `${reviewOverdueCount} overdue to review`
                : "Assignments awaiting grading"
              : feedbackMissing.length > 0
                ? `${feedbackMissing.length} graded without feedback`
                : "All caught up"
          }
        />
      </StatGrid>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Course list — 2 cols */}
        <section className="flex flex-col gap-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">My Courses</h2>
            <Link
              href="/instructor/courses"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              View all →
            </Link>
          </div>

          {courses.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No courses yet"
              description="Create your first course to start teaching and earning."
              action={{
                label: "Create course",
                href: "/instructor/courses/new",
              }}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {courses.slice(0, 5).map((course) => (
                <Link
                  key={course.id}
                  href={`/instructor/courses/${course.id}`}
                  className="group flex items-start justify-between gap-4 border border-border p-4 transition-colors hover:border-foreground/20"
                >
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-medium group-hover:underline">
                      {course.title}
                    </h3>
                    {course.shortDescription && (
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {course.shortDescription}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge
                      variant={
                        course.status === "Published" ? "default" : "outline"
                      }
                    >
                      {course.status}
                    </Badge>
                    <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </Link>
              ))}
            </div>
          )}

          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Grading Flow</h2>
              <Link
                href="/instructor/submissions"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Open submissions →
              </Link>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <ActivityFeed
                title={`Awaiting Grade (${awaitingGrade.length})`}
                emptyText="No submissions are waiting for review."
                items={awaitingGrade.slice(0, 4).map((submission) => ({
                  id: submission.id,
                  label: submission.assignmentTitle,
                  description: `${submission.userName} · ${submission.courseTitle}`,
                  badge: submission.isOverdueReview ? "Overdue" : "Pending",
                  timestamp: submission.submittedAt
                    ? formatRelativeTime(submission.submittedAt)
                    : undefined,
                  href: `/instructor/submissions#submission-${submission.id}`,
                }))}
              />

              <ActivityFeed
                title={`Recently Graded (${recentlyGraded.length})`}
                emptyText="Graded submissions will appear here."
                items={recentlyGraded.slice(0, 4).map((submission) => ({
                  id: submission.id,
                  label: submission.assignmentTitle,
                  description: `${submission.userName} · ${submission.grade}/100${submission.needsFeedback ? " · Feedback still missing" : ""}`,
                  badge: submission.needsFeedback ? "Add feedback" : "Graded",
                  timestamp: submission.gradedAt
                    ? formatRelativeTime(submission.gradedAt)
                    : undefined,
                  href: `/instructor/submissions#submission-${submission.id}`,
                }))}
              />
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Learner Signals</h2>
              <Link
                href="/instructor/students"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Open students →
              </Link>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <ActivityFeed
                title={`Needs Attention (${studentsNeedingAttention.length})`}
                emptyText="No students currently need outreach."
                items={studentsNeedingAttention.slice(0, 4).map((student) => ({
                  id: `${student.courseId}-${student.id}`,
                  label: student.name,
                  description: `${student.courseTitle} · ${student.progressPercent}% complete`,
                  badge: "Outreach",
                  timestamp: student.enrolledAt
                    ? formatRelativeTime(student.enrolledAt)
                    : undefined,
                  href: getInstructorStudentHref(student.courseId, student.id),
                }))}
              />

              <ActivityFeed
                title={`Near Completion (${nearCompletionStudents.length})`}
                emptyText="No learners are near the finish line yet."
                items={nearCompletionStudents.slice(0, 4).map((student) => ({
                  id: `near-${student.courseId}-${student.id}`,
                  label: student.name,
                  description: `${student.courseTitle} · ${student.progressPercent}% complete`,
                  badge: student.progressPercent >= 95 ? "Almost done" : "Momentum",
                  timestamp: student.enrolledAt
                    ? formatRelativeTime(student.enrolledAt)
                    : undefined,
                  href: getInstructorStudentHref(student.courseId, student.id),
                }))}
              />
            </div>
          </section>
        </section>

        {/* Sidebar */}
        <aside className="flex flex-col gap-6">
          {/* Action Items */}
          <ActivityFeed
            title="Action Items"
            items={buildActionItems(stats, draftCourses, {
              courseResources: courseResources.length,
              standaloneResources: resources.length,
              sessionsMissingJoinLink,
              reviewOverdueCount,
              feedbackMissingCount: feedbackMissing.length,
              firstAwaitingSubmissionId: awaitingGrade[0]?.id,
              firstFeedbackSubmissionId: feedbackMissing[0]?.id,
              studentAttentionCount: studentsNeedingAttention.length,
              firstStudentAttentionHref: studentsNeedingAttention[0]
                ? getInstructorStudentHref(
                    studentsNeedingAttention[0].courseId,
                    studentsNeedingAttention[0].id
                  )
                : undefined,
              dormantRevenueCourseId: dormantPaidCourses[0]?.id,
            })}
          />

          {/* Upcoming Sessions */}
          <ActivityFeed
            title="Upcoming Sessions"
            viewAllHref="/instructor/live"
            emptyText="No sessions scheduled."
            items={sessions.slice(0, 4).map((session) => ({
              id: session.id,
              label: session.title,
              description: [
                session.scheduledAt
                  ? formatDateTime(session.scheduledAt)
                  : "No schedule set yet",
                `${session.rsvpCount} RSVPs`,
                session.streamUrl ? null : "Join link missing",
              ]
                .filter(Boolean)
                .join(" · "),
              badge:
                session.status === "live"
                  ? "LIVE"
                  : session.status === "scheduled"
                    ? "Upcoming"
                    : session.status,
              timestamp: session.scheduledAt
                ? formatRelativeTime(session.scheduledAt)
                : undefined,
              href: `/instructor/live#session-${session.id}`,
            }))}
          />

          {/* Resource Library */}
          <ActivityFeed
            title="Resource Library"
            viewAllHref="/instructor/resources"
            items={buildResourceItems({
              courseResources,
              resourceCourseCount,
              standaloneDrafts,
              standalonePublished,
              standaloneResources: resources,
            })}
          />

          <ActivityFeed
            title="Revenue Pulse"
            viewAllHref="/instructor/earnings"
            items={buildRevenueItems({
              monthlyEarnings: revenue.monthlyEarnings,
              totalEarnings: revenue.totalEarnings,
              topRevenueCourses,
              dormantPaidCourses,
              recentEnrollments,
            })}
          />

          {/* Quick Links */}
          <nav className="border border-border">
            <p className="border-b border-border px-5 py-3 text-sm font-medium">
              Quick Links
            </p>
            <div className="flex flex-col divide-y divide-border">
              {[
                { label: "Manage Categories", href: "/instructor/categories" },
                { label: "View Students", href: "/instructor/students" },
                { label: "Review Submissions", href: "/instructor/submissions" },
                { label: "View Earnings", href: "/instructor/earnings" },
                { label: "Schedule Live Session", href: "/instructor/live" },
                { label: "Resources Library", href: "/instructor/resources" },
                {
                  label: "Upload Standalone Resource",
                  href: "/instructor/resources#create-standalone-resource",
                },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-5 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </aside>
      </div>
    </div>
  );
}

function buildActionItems(
  stats: { pendingReviews: number },
  draftCourses: Array<{ id: string; title: string }>,
  context: {
    courseResources: number;
    standaloneResources: number;
    sessionsMissingJoinLink: number;
    reviewOverdueCount: number;
    feedbackMissingCount: number;
    firstAwaitingSubmissionId?: string;
    firstFeedbackSubmissionId?: string;
    studentAttentionCount: number;
    firstStudentAttentionHref?: string;
    dormantRevenueCourseId?: string;
  }
) {
  const items: Array<{
    id: string;
    label: string;
    description: string;
    badge?: string;
    href?: string;
  }> = [];

  if (context.reviewOverdueCount > 0) {
    items.push({
      id: "overdue-reviews",
      label: `${context.reviewOverdueCount} submission${context.reviewOverdueCount === 1 ? "" : "s"} overdue for review`,
      description: "Start with the oldest work waiting in the grading queue",
      badge: "Urgent",
      href: context.firstAwaitingSubmissionId
        ? `/instructor/submissions#submission-${context.firstAwaitingSubmissionId}`
        : "/instructor/submissions#awaiting-grade",
    });
  } else if (stats.pendingReviews > 0) {
    items.push({
      id: "pending-reviews",
      label: `${stats.pendingReviews} submissions to review`,
      description: "Grade pending assignments",
      badge: "Urgent",
      href: context.firstAwaitingSubmissionId
        ? `/instructor/submissions#submission-${context.firstAwaitingSubmissionId}`
        : "/instructor/submissions#awaiting-grade",
    });
  }

  if (context.feedbackMissingCount > 0) {
    items.push({
      id: "feedback-missing",
      label: `${context.feedbackMissingCount} graded submission${context.feedbackMissingCount === 1 ? "" : "s"} still need feedback`,
      description: "Add written context so students know what to improve next",
      badge: "Feedback",
      href: context.firstFeedbackSubmissionId
        ? `/instructor/submissions#submission-${context.firstFeedbackSubmissionId}`
        : "/instructor/submissions#graded-submissions",
    });
  }

  if (context.studentAttentionCount > 0) {
    items.push({
      id: "student-outreach",
      label: `${context.studentAttentionCount} learner${context.studentAttentionCount === 1 ? "" : "s"} need a progress check-in`,
      description: "Reach out to students who enrolled but still have low momentum",
      badge: "Students",
      href: context.firstStudentAttentionHref ?? "/instructor/students#needs-attention",
    });
  }

  if (context.sessionsMissingJoinLink > 0) {
    items.push({
      id: "live-links",
      label: `${context.sessionsMissingJoinLink} live session${context.sessionsMissingJoinLink === 1 ? "" : "s"} still need a join link`,
      description: "Add Zoom, YouTube, Stream, or meeting URLs before students arrive",
      badge: "Live",
      href: "/instructor/live",
    });
  }

  if (context.dormantRevenueCourseId) {
    items.push({
      id: "dormant-revenue",
      label: "A published paid course has no revenue this month",
      description: "Review pricing, sales copy, or promotion before the month gets away",
      badge: "Revenue",
      href: `/instructor/earnings#course-revenue-${context.dormantRevenueCourseId}`,
    });
  }

  if (context.courseResources === 0) {
    items.push({
      id: "lesson-resources",
      label: "Add the first lesson resource",
      description: "Attach PDFs, downloads, or links directly to a lesson",
      badge: "Resources",
      href: "/instructor/resources#create-course-resource",
    });
  }

  if (context.standaloneResources === 0) {
    items.push({
      id: "standalone-resources",
      label: "Create your standalone resource library",
      description: "Publish notes, worksheets, and videos outside of courses",
      badge: "Library",
      href: "/instructor/resources#create-standalone-resource",
    });
  }

  for (const course of draftCourses.slice(0, 2)) {
    items.push({
      id: `draft-${course.id}`,
      label: `"${course.title}" is still in draft`,
      description: "Publish when ready to accept students",
      href: `/instructor/courses/${course.id}`,
    });
  }

  if (items.length === 0) {
    items.push({
      id: "all-done",
      label: "No pending actions",
      description: "You're all caught up!",
      badge: "✓",
    });
  }

  return items;
}

function getInstructorStudentHref(courseId: string, userId: string) {
  return `/instructor/students#student-${courseId}-${userId}`;
}

function buildRevenueItems(context: {
  monthlyEarnings: number;
  totalEarnings: number;
  topRevenueCourses: Array<{
    id: string;
    title: string;
    monthlyRevenue: number;
    totalRevenue: number;
    enrollments: number;
  }>;
  dormantPaidCourses: Array<{
    id: string;
    title: string;
    totalRevenue: number;
  }>;
  recentEnrollments: Array<{
    courseTitle: string;
    name: string;
    enrolledAt: string | null;
  }>;
}) {
  const items: Array<{
    id: string;
    label: string;
    description: string;
    badge?: string;
    href?: string;
    timestamp?: string;
  }> = [];

  items.push({
    id: "monthly-earnings",
    label: `This month: ${formatCurrency(context.monthlyEarnings)}`,
    description: `All-time earnings now sit at ${formatCurrency(context.totalEarnings)}`,
    badge: "Revenue",
    href: "/instructor/earnings",
  });

  if (context.topRevenueCourses.length > 0) {
    const topCourse = context.topRevenueCourses[0];
    items.push({
      id: `top-revenue-${topCourse.id}`,
      label: topCourse.title,
      description: `${formatCurrency(topCourse.monthlyRevenue || topCourse.totalRevenue)} revenue · ${topCourse.enrollments} enrollments`,
      badge: topCourse.monthlyRevenue > 0 ? "Top seller" : "All time",
      href: `/instructor/earnings#course-revenue-${topCourse.id}`,
    });
  }

  if (context.dormantPaidCourses.length > 0) {
    const dormantCourse = context.dormantPaidCourses[0];
    items.push({
      id: `dormant-course-${dormantCourse.id}`,
      label: `${dormantCourse.title} needs a revenue push`,
      description:
        dormantCourse.totalRevenue > 0
          ? "Published and selling historically, but inactive this month"
          : "Published with no completed sales yet",
      badge: "Watch",
      href: `/instructor/earnings#course-revenue-${dormantCourse.id}`,
    });
  }

  if (context.recentEnrollments.length > 0) {
    const latestEnrollment = context.recentEnrollments[0];
    items.push({
      id: "recent-enrollment",
      label: `${latestEnrollment.name} just enrolled`,
      description: latestEnrollment.courseTitle,
      badge: "New",
      timestamp: latestEnrollment.enrolledAt
        ? formatRelativeTime(latestEnrollment.enrolledAt)
        : undefined,
      href: "/instructor/students#recent-enrollments",
    });
  }

  return items;
}

function buildResourceItems(context: {
  courseResources: Array<{
    id: string;
    courseId: string;
    courseTitle: string;
    lessonTitle: string;
    title: string;
  }>;
  resourceCourseCount: number;
  standaloneDrafts: number;
  standalonePublished: number;
  standaloneResources: Array<{
    id: string;
    title: string;
    type: string;
    isPublished: boolean;
    createdAt: string;
  }>;
}) {
  const items: Array<{
    id: string;
    label: string;
    description: string;
    badge?: string;
    href?: string;
    timestamp?: string;
  }> = [];

  if (context.courseResources.length > 0) {
    items.push({
      id: "course-resources-summary",
      label: `${context.courseResources.length} lesson resource${context.courseResources.length === 1 ? "" : "s"} attached`,
      description: `${context.resourceCourseCount} course${context.resourceCourseCount === 1 ? "" : "s"} now include files, PDFs, or lesson links`,
      badge: "Courses",
      href: "/instructor/resources#course-resources",
    });
  } else {
    items.push({
      id: "course-resources-empty",
      label: "No lesson resources attached yet",
      description: "Start with a worksheet, PDF, or reference link inside a lesson",
      badge: "Start",
      href: "/instructor/resources#create-course-resource",
    });
  }

  if (context.standaloneResources.length > 0) {
    const latestStandalone = context.standaloneResources[0];

    items.push({
      id: "standalone-resources-summary",
      label: `${context.standalonePublished} published standalone resource${context.standalonePublished === 1 ? "" : "s"}`,
      description:
        context.standaloneDrafts > 0
          ? `${context.standaloneDrafts} draft${context.standaloneDrafts === 1 ? "" : "s"} still in progress`
          : "Your independent resource library is fully published",
      badge: "Library",
      href: "/instructor/resources#standalone-resources",
    });
    items.push({
      id: `standalone-resource-${latestStandalone.id}`,
      label: latestStandalone.title,
      description: `${latestStandalone.isPublished ? "Published" : "Draft"} ${latestStandalone.type.replace("_", " ")}`,
      badge: "Latest",
      timestamp: latestStandalone.createdAt
        ? formatRelativeTime(latestStandalone.createdAt)
        : undefined,
      href: `/instructor/resources#standalone-resource-${latestStandalone.id}`,
    });
  } else {
    items.push({
      id: "standalone-resources-empty",
      label: "No standalone resources yet",
      description: "Create a free or paid download that students can access outside a course",
      badge: "Create",
      href: "/instructor/resources#create-standalone-resource",
    });
  }

  return items;
}
