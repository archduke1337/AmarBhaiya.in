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
import { Button } from "@heroui/react";

import { requireAuth } from "@/lib/appwrite/auth";
import { getUserRole } from "@/lib/appwrite/auth-utils";
import {
  getStudentProfileStats,
  getStudentEnrolledCourses,
  getStudentStudyQueue,
  getUpcomingLiveSessions,
  type StudentEnrolledCourse,
  type UpcomingSessionItem,
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
import type { ActivityItem } from "@/components/dashboard/activity-feed";

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
    <div className="flex flex-col gap-6 animate-fade-in-up pb-[10vh]">
      {/* Header */}
      <PageHeader
        eyebrow={role === "student" ? "Your Dashboard" : `Dashboard · ${role}`}
        title={`${greeting}, ${user.name.split(" ")[0]}`}
        description="Pick up where you left off, revise quickly with notes, or move straight into the next lesson."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/notes">
              <Button variant="bordered" className="bg-surface border-border/40 font-bold" size="sm">
                Notes
              </Button>
            </Link>
            <Link href="/courses">
              <Button color="primary" variant="solid" className="font-bold shadow-[0_4px_16px_color-mix(in_oklab,var(--accent)_30%,transparent)]" size="sm">
                Browse courses
              </Button>
            </Link>
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

      {/* Rhythm Info Block (previously RetroPanel) */}
      <div className="card-bezel my-2" style={{ background: "color-mix(in oklab, var(--surface) 80%, var(--accent) 5%)" }}>
        <div className="card-bezel-inner p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="eyebrow">
              Study rhythm
            </p>
            <p className="text-sm font-medium leading-relaxed text-foreground/80 max-w-2xl mt-1">
              Use notes for quick revision, courses for the full sequence, and live sessions when you need explanation that feels human. Class 6 to 12.
            </p>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Continue Learning — Left Column */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-black tracking-[-0.03em]">Continue Learning</h2>
              <div className="flex flex-wrap gap-2">
                <Link href="/app/courses">
                   <span className="text-sm font-bold text-accent hover:text-accent-foreground transition-colors cursor-pointer">View all</span>
                </Link>
              </div>
            </div>

            {inProgressCourses.length === 0 ? (
              <EmptyState
                icon={GraduationCap}
                title="No active courses"
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
                    <div className="flex flex-col gap-4 p-5 rounded-2xl bg-surface border border-border/40 transition-all hover:bg-surface-hover hover:border-border/60 hover:shadow-[var(--surface-shadow)]">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col gap-1">
                          <h3 className="text-lg font-black tracking-[-0.02em] group-hover:text-accent transition-colors">
                            {course.title}
                          </h3>
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-foreground/50">
                            {course.completedLessons} of {course.totalLessons} lessons
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                         <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-foreground/50">
                              {course.resumePercent > 0
                                ? `Resume: ${course.continueLessonTitle}`
                                : `Up Next: ${course.continueLessonTitle}`}
                            </span>
                            <span className="text-foreground">{course.progressPercent}%</span>
                         </div>
                         <div className="h-2 rounded-full bg-surface-hover overflow-hidden">
                           <div
                             className="h-full bg-accent transition-all duration-700 w-0"
                             style={{ width: `${Math.max(2, course.progressPercent)}%` }}
                           />
                         </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Study Queue Section */}
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-black tracking-[-0.03em]">Study Queue</h2>
            </div>

            {studyQueue.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-border/60 bg-surface/30">
                <p className="text-sm font-medium text-foreground/50 text-center">
                  No pending assignments or quiz retakes right now.
                </p>
              </div>
            ) : (
              <div className="flex flex-col rounded-2xl bg-surface border border-border/40 overflow-hidden divide-y divide-border/20">
                {studyQueue.map((item) => (
                  <Link
                    key={`${item.kind}-${item.id}`}
                    href={item.href}
                    className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors hover:bg-surface-hover group"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.1em] px-1.5 py-0.5 rounded outline outline-1 outline-border text-foreground/60">
                          {item.kind}
                        </span>
                        <p className="font-bold text-sm tracking-tight group-hover:text-accent transition-colors">
                           {item.title}
                        </p>
                      </div>
                      <p className="text-xs font-medium text-foreground/50">
                        {item.courseTitle}{item.lessonTitle ? ` · ${item.lessonTitle}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.status === "Overdue" && (
                         <span className="text-[10px] font-bold uppercase text-danger bg-danger/10 px-2 py-0.5 rounded">Overdue</span>
                      )}
                      {item.dueAt && (
                         <span className="text-xs font-medium text-foreground/40">{formatRelativeTime(item.dueAt)}</span>
                      )}
                      <ArrowRight className="size-4 text-foreground/30 group-hover:text-accent transition-colors shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Sidebar — Right Column */}
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

          <div className="flex flex-col rounded-3xl bg-surface border border-border/40 overflow-hidden relative">
             <div className="px-5 py-4 border-b border-border/20">
               <h3 className="font-bold text-base tracking-tight">Quick Links</h3>
             </div>
             <div className="flex flex-col divide-y divide-border/20">
                {[
                  { label: "Study Notes", href: "/notes", icon: Download },
                  { label: "Live Sessions", href: "/app/live#upcoming-sessions", icon: Video },
                  { label: "Notifications", href: "/app/notifications", icon: Bell },
                  { label: "Billing History", href: "/app/billing", icon: CreditCard },
                  { label: "Community", href: "/app/community", icon: MessageSquare },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex justify-between items-center p-4 transition-colors hover:bg-surface-hover group"
                  >
                    <div className="flex items-center gap-3 text-sm font-semibold text-foreground/80 group-hover:text-foreground">
                      <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-foreground/60 group-hover:text-accent transition-colors">
                        <link.icon className="size-4" />
                      </div>
                      {link.label}
                    </div>
                    <ArrowRight className="size-4 opacity-50 group-hover:opacity-100 group-hover:text-accent transition-all transform group-hover:translate-x-1" />
                  </Link>
                ))}
             </div>
          </div>
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
  inProgressCourses: StudentEnrolledCourse[],
  upcomingSessions: UpcomingSessionItem[],
  unreadCount: number
): ActivityItem[] {
  const items: ActivityItem[] = [];

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
