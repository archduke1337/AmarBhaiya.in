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
} from "@/lib/appwrite/dashboard-data";
import { formatCompactNumber, formatDateTime, formatRelativeTime } from "@/lib/utils/format";
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

  const [stats, courses, sessions, resources, courseResources] = await Promise.all([
    getInstructorDashboardStats(scope),
    getInstructorCourseList(scope),
    getInstructorLiveSessions(scope),
    getInstructorResources(scope),
    getInstructorCourseResources(scope),
  ]);

  const draftCourses = courses.filter((c) => c.status === "Draft");
  const publishedCourses = courses.filter((c) => c.status === "Published");
  const standaloneDrafts = resources.filter((resource) => !resource.isPublished).length;
  const standalonePublished = resources.length - standaloneDrafts;
  const sessionsMissingJoinLink = sessions.filter((session) => !session.streamUrl).length;
  const resourceCourseCount = new Set(courseResources.map((resource) => resource.courseId)).size;

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
              ? "Assignments awaiting grading"
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

          {/* Quick Links */}
          <nav className="border border-border">
            <p className="border-b border-border px-5 py-3 text-sm font-medium">
              Quick Links
            </p>
            <div className="flex flex-col divide-y divide-border">
              {[
                { label: "Manage Categories", href: "/instructor/categories" },
                { label: "View Students", href: "/instructor/students" },
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
  }
) {
  const items: Array<{
    id: string;
    label: string;
    description: string;
    badge?: string;
    href?: string;
  }> = [];

  if (stats.pendingReviews > 0) {
    items.push({
      id: "pending-reviews",
      label: `${stats.pendingReviews} submissions to review`,
      description: "Grade pending assignments",
      badge: "Urgent",
      href: "/instructor/submissions",
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
