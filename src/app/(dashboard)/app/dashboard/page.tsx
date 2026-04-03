import Link from "next/link";
import {
  BookOpen,
  Bell,
  CreditCard,
  Flame,
  GraduationCap,
  MessageSquare,
  Trophy,
  Video,
  ArrowRight,
} from "lucide-react";

import { requireAuth } from "@/lib/appwrite/auth";
import { getUserRole } from "@/lib/appwrite/auth-utils";
import {
  getStudentProfileStats,
  getStudentEnrolledCourses,
  getStudentStudyQueue,
  getUpcomingLiveSessions,
} from "@/lib/appwrite/dashboard-data";
import { formatRelativeTime } from "@/lib/utils/format";
import {
  getUserNotifications,
  getUnreadNotificationCount,
} from "@/actions/notifications";
import {
  PageHeader,
  StatCard,
  StatGrid,
  EmptyState,
  ActivityFeed,
} from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";

export default async function StudentDashboardPage() {
  const user = await requireAuth();
  const role = getUserRole(user);

  const [stats, enrolledCourses, studyQueue, upcomingSessions, unreadCount, notifications] = await Promise.all([
    getStudentProfileStats(user.$id),
    getStudentEnrolledCourses(user.$id),
    getStudentStudyQueue(user.$id),
    getUpcomingLiveSessions(),
    getUnreadNotificationCount(),
    getUserNotifications(),
  ]);

  const inProgressCourses = enrolledCourses.filter(
    (c) => c.progressPercent < 100
  );
  const completedCourses = enrolledCourses.filter(
    (c) => c.progressPercent >= 100
  );

  const greeting = getGreeting();

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <PageHeader
        eyebrow={role === "student" ? "Dashboard" : `Dashboard · ${role}`}
        title={`${greeting}, ${user.name.split(" ")[0]}`}
        description="Pick up where you left off or explore something new."
      />

      {/* Stats */}
      <StatGrid columns={4}>
        <StatCard
          label="Current Streak"
          value={`${stats.currentStreakDays}d`}
          icon={Flame}
          description={
            stats.currentStreakDays > 0
              ? "Keep it going!"
              : "Complete a lesson to start"
          }
        />
        <StatCard
          label="Active Courses"
          value={stats.activeCourses}
          icon={BookOpen}
          description={`${completedCourses.length} completed`}
        />
        <StatCard
          label="Certificates"
          value={stats.certificates}
          icon={Trophy}
        />
        <StatCard
          label="Upcoming Sessions"
          value={upcomingSessions.length}
          icon={Video}
          description={
            upcomingSessions[0]
              ? `Next: ${upcomingSessions[0].title}`
              : "None scheduled"
          }
        />
      </StatGrid>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Continue Learning — takes 2 cols */}
        <section className="flex flex-col gap-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Continue Learning</h2>
            <Link
              href="/app/courses"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              View all →
            </Link>
          </div>

          {inProgressCourses.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No courses in progress"
              description="Browse the course catalogue and enroll in a course to get started."
              action={{ label: "Browse courses", href: "/courses" }}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {inProgressCourses.slice(0, 3).map((course) => (
                <Link
                  key={course.id}
                  href={course.continueHref}
                  className="group border border-border p-5 transition-colors hover:border-foreground/20"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <h3 className="font-medium group-hover:underline">
                        {course.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {course.completedLessons} of {course.totalLessons}{" "}
                        lessons complete
                      </p>
                      {course.continueLessonTitle && (
                        <p className="text-xs text-muted-foreground">
                          {course.resumePercent > 0
                            ? `Resume ${course.continueLessonTitle} at ${course.resumePercent}%`
                            : `Up next: ${course.continueLessonTitle}`}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {course.category || "General"}
                    </Badge>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden bg-muted">
                      <div
                        className="h-full bg-foreground transition-all duration-500"
                        style={{
                          width: `${Math.max(2, course.progressPercent)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {course.progressPercent}%
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ArrowRight className="size-3" />
                    <span>
                      {course.resumePercent > 0 ? "Resume lesson" : "Open next lesson"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-medium">Study Queue</h2>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Link
                  href="/app/assignments#pending-assignments"
                  className="transition-colors hover:text-foreground"
                >
                  Assignments
                </Link>
                <Link
                  href="/app/quizzes"
                  className="transition-colors hover:text-foreground"
                >
                  Quizzes
                </Link>
              </div>
            </div>

            {studyQueue.length === 0 ? (
              <div className="border border-border px-5 py-6 text-sm text-muted-foreground">
                No pending assignments or quiz retakes right now. Keep going with your lessons and new work will show up here automatically.
              </div>
            ) : (
              <div className="border border-border">
                <div className="divide-y divide-border">
                  {studyQueue.map((item) => (
                    <Link
                      key={`${item.kind}-${item.id}`}
                      href={item.href}
                      className="group block transition-colors hover:bg-muted/40"
                    >
                      <div className="flex items-start justify-between gap-3 px-5 py-4">
                        <div className="flex min-w-0 flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium group-hover:underline">
                              {item.title}
                            </p>
                            <Badge variant="outline" className="text-[10px] uppercase">
                              {item.kind}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {item.courseTitle}
                            {item.lessonTitle ? ` · ${item.lessonTitle}` : ""}
                          </p>
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {item.detail}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <Badge
                            variant={item.status === "Overdue" ? "default" : "outline"}
                            className="text-[10px]"
                          >
                            {item.status}
                          </Badge>
                          {item.dueAt && (
                            <span className="text-[10px] text-muted-foreground">
                              {formatRelativeTime(item.dueAt)}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <ArrowRight className="size-3" />
                            Open
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        </section>

        {/* Sidebar — upcoming sessions + achievements */}
        <aside className="flex flex-col gap-6">
          <ActivityFeed
            title="Next Steps"
            items={buildStudentActionItems(
              inProgressCourses,
              upcomingSessions,
              unreadCount
            )}
          />

          {/* Upcoming Live Sessions */}
          <ActivityFeed
            title="Upcoming Sessions"
            viewAllHref="/app/live"
            emptyText="No upcoming live sessions."
            items={upcomingSessions.slice(0, 4).map((session) => ({
              id: session.id,
              label: session.title,
              description: session.scheduledAt
                ? formatRelativeTime(session.scheduledAt)
                : "Date TBD",
              badge: session.status === "live" ? "LIVE" : undefined,
              href: `/app/live#session-${session.id}`,
            }))}
          />

          {/* Recent Completions */}
          {completedCourses.length > 0 && (
            <ActivityFeed
              title="Completed Courses"
              items={completedCourses.slice(0, 3).map((course) => ({
                id: course.id,
                label: course.title,
                description: `${course.totalLessons} lessons`,
                badge: "Done",
                href: `/app/courses/${course.slug || course.id}`,
              }))}
            />
          )}

          {/* Recent Notifications */}
          <ActivityFeed
            title={`Notifications${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
            viewAllHref="/app/notifications"
            emptyText="No recent notifications."
            items={notifications.slice(0, 4).map((n) => ({
              id: n.id,
              label: n.title,
              description: n.body || n.type,
              badge: n.isRead ? undefined : "NEW",
              href: n.link || `/app/notifications#notification-${n.id}`,
            }))}
          />

          <nav className="border border-border">
            <p className="border-b border-border px-5 py-3 text-sm font-medium">
              Quick Links
            </p>
            <div className="flex flex-col divide-y divide-border">
              {[
                {
                  label: "Live Sessions",
                  href: "/app/live#upcoming-sessions",
                  icon: Video,
                },
                {
                  label: "Notifications",
                  href: "/app/notifications",
                  icon: Bell,
                },
                {
                  label: "Billing History",
                  href: "/app/billing",
                  icon: CreditCard,
                },
                {
                  label: "Community",
                  href: "/app/community",
                  icon: MessageSquare,
                },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center justify-between px-5 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  <div className="flex items-center gap-2">
                    <link.icon className="size-4" />
                    {link.label}
                  </div>
                  <ArrowRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </nav>
        </aside>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function buildStudentActionItems(
  inProgressCourses: Array<{
    id: string;
    title: string;
    continueHref: string;
    continueLessonTitle: string;
    resumePercent: number;
  }>,
  upcomingSessions: Array<{
    id: string;
    title: string;
    status: string;
    scheduledAt: string | null;
  }>,
  unreadCount: number
) {
  const items: Array<{
    id: string;
    label: string;
    description: string;
    badge?: string;
    href?: string;
  }> = [];

  const nextCourse = inProgressCourses[0];
  if (nextCourse) {
    items.push({
      id: `resume-${nextCourse.id}`,
      label: `Resume ${nextCourse.title}`,
      description: nextCourse.continueLessonTitle
        ? nextCourse.resumePercent > 0
          ? `${nextCourse.continueLessonTitle} is waiting at ${nextCourse.resumePercent}%`
          : `Next up: ${nextCourse.continueLessonTitle}`
        : "Jump back into your course",
      badge: "Study",
      href: nextCourse.continueHref,
    });
  }

  const nextSession = upcomingSessions[0];
  if (nextSession) {
    items.push({
      id: `session-${nextSession.id}`,
      label:
        nextSession.status === "live"
          ? `${nextSession.title} is live now`
          : `Upcoming live session: ${nextSession.title}`,
      description: nextSession.scheduledAt
        ? formatRelativeTime(nextSession.scheduledAt)
        : "Watch the live sessions page for the schedule",
      badge: nextSession.status === "live" ? "LIVE" : "Live",
      href: `/app/live#session-${nextSession.id}`,
    });
  }

  if (unreadCount > 0) {
    items.push({
      id: "notifications",
      label: `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`,
      description: "Check updates from instructors, admins, and system reminders",
      badge: "Inbox",
      href: "/app/notifications",
    });
  }

  if (items.length === 0) {
    items.push({
      id: "browse-courses",
      label: "Explore the catalogue",
      description: "Pick a course, join a live session, or head into the community",
      badge: "Start",
      href: "/courses",
    });
  }

  return items;
}
