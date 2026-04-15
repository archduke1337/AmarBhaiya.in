import Link from "next/link";
import {
  BookOpen,
  Bell,
  CreditCard,
  Download,
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
import { RetroPanel } from "@/components/marketing/retro-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  const learningNotifications = notifications.filter(
    (notification) =>
      notification.type === "assignment_feedback" ||
      notification.type === "quiz_result"
  );

  const greeting = getGreeting();

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <PageHeader
        eyebrow={role === "student" ? "Dashboard" : `Dashboard · ${role}`}
        title={`${greeting}, ${user.name.split(" ")[0]}`}
        description="Pick up where you left off, revise quickly with notes, or move straight into the next lesson."
        actions={
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/notes">Open notes</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/courses">Browse courses</Link>
            </Button>
          </div>
        }
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

      <RetroPanel tone="accent" className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
            Study rhythm
          </p>
          <p className="text-sm font-medium leading-7 text-foreground/80">
            Use notes for quick revision, courses for the full sequence, and live sessions when you need explanation that feels human.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Class 6 to 12 first</Badge>
          <Badge variant="ghost">Notes + courses + live</Badge>
        </div>
      </RetroPanel>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Continue Learning — takes 2 cols */}
        <section className="flex flex-col gap-4 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-2xl font-black tracking-[-0.04em]">Continue Learning</h2>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="link" size="sm">
                <Link href="/app/courses">View all</Link>
              </Button>
              <Button asChild variant="link" size="sm">
                <Link href="/notes">Notes</Link>
              </Button>
            </div>
          </div>

          {inProgressCourses.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No courses in progress"
              description="Browse the course catalogue and enroll in a course to get started."
              action={{ label: "Browse courses", href: "/courses" }}
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-1">
              {inProgressCourses.slice(0, 3).map((course) => (
                <Link
                  key={course.id}
                  href={course.continueHref}
                  className="group"
                >
                  <RetroPanel
                    tone={course.progressPercent >= 70 ? "secondary" : "card"}
                    className="space-y-4 transition-transform group-hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <h3 className="font-heading text-xl font-black tracking-[-0.04em] group-hover:underline">
                          {course.title}
                        </h3>
                        <p className="text-sm font-medium text-muted-foreground">
                          {course.completedLessons} of {course.totalLessons}{" "}
                          lessons complete
                        </p>
                        {course.continueLessonTitle && (
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
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

                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full border-2 border-border bg-card">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{
                            width: `${Math.max(2, course.progressPercent)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs tabular-nums font-black text-muted-foreground">
                        {course.progressPercent}%
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      <ArrowRight className="size-3" />
                      <span>
                        {course.resumePercent > 0 ? "Resume lesson" : "Open next lesson"}
                      </span>
                    </div>
                  </RetroPanel>
                </Link>
              ))}
            </div>
          )}

          <section className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-heading text-2xl font-black tracking-[-0.04em]">Study Queue</h2>
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="link" size="sm">
                  <Link href="/app/assignments#pending-assignments">Assignments</Link>
                </Button>
                <Button asChild variant="link" size="sm">
                  <Link href="/app/quizzes">Quizzes</Link>
                </Button>
              </div>
            </div>

            {studyQueue.length === 0 ? (
              <RetroPanel tone="muted">
                <p className="text-sm font-medium text-muted-foreground">
                  No pending assignments or quiz retakes right now. Keep going with your lessons and new work will show up here automatically.
                </p>
              </RetroPanel>
            ) : (
              <RetroPanel tone="card" className="overflow-hidden p-0">
                <div className="divide-y-2 divide-border">
                  {studyQueue.map((item) => (
                    <Link
                      key={`${item.kind}-${item.id}`}
                      href={item.href}
                      className="group block transition-colors hover:bg-[color:var(--surface-ink)]"
                    >
                      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
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

                        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
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
              </RetroPanel>
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

          {learningNotifications.length > 0 && (
            <ActivityFeed
              title="Feedback & Results"
              viewAllHref="/app/notifications"
              items={learningNotifications.slice(0, 4).map((notification) => ({
                id: notification.id,
                label: notification.title,
                description: notification.body || notification.type,
                badge:
                  notification.type === "assignment_feedback" ? "Grade" : "Quiz",
                timestamp: notification.createdAt
                  ? formatRelativeTime(notification.createdAt)
                  : undefined,
                href: notification.link || `/app/notifications#notification-${notification.id}`,
              }))}
            />
          )}

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

          <RetroPanel tone="accent" className="overflow-hidden p-0">
            <p className="border-b-2 border-border px-5 py-3 font-heading text-sm font-black uppercase tracking-[0.16em]">
              Quick Links
            </p>
            <div className="flex flex-col divide-y-2 divide-border">
              {[
                {
                  label: "Study Notes",
                  href: "/notes",
                  icon: Download,
                },
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
                  className="group flex items-center justify-between gap-3 px-5 py-3 text-sm text-muted-foreground transition-colors hover:bg-[color:var(--surface-ink)] hover:text-foreground"
                >
                  <div className="flex items-center gap-2">
                    <link.icon className="size-4" />
                    {link.label}
                  </div>
                  <ArrowRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </RetroPanel>
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
