import Link from "next/link";
import {
  Bell,
  Users,
  CreditCard,
  BookOpen,
  Video,
  Megaphone,
  TrendingUp,
  ArrowRight,
  Shield,
  FileText,
} from "lucide-react";

import {
  getAdminAuditLogs,
  getAdminDashboardStats,
  getAdminLiveData,
  getAdminModerationData,
  getAdminPayments,
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
  ActivityFeed,
} from "@/components/dashboard";
import { RetroPanel } from "@/components/marketing/retro-panel";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const [stats, payments, liveData, moderationData, auditLogs] = await Promise.all([
    getAdminDashboardStats(),
    getAdminPayments({ limit: 4 }),
    getAdminLiveData({ upcomingLimit: 8 }),
    getAdminModerationData({ escalationLimit: 2 }),
    getAdminAuditLogs({ limit: 1 }),
  ]);

  const draftCourses = Math.max(0, stats.totalCourses - stats.publishedCourses);
  const sessionsMissingJoinLink = liveData.upcoming.filter(
    (session) => !session.streamUrl
  ).length;

  const quickActions = [
    { label: "User Management", href: "/admin/users", icon: Users, description: "Manage roles and access" },
    { label: "Marketing CMS", href: "/admin/marketing", icon: Megaphone, description: "Homepage copy and blog content" },
    { label: "Course Oversight", href: "/admin/courses", icon: BookOpen, description: "Publish, feature, or archive" },
    { label: "Payment Records", href: "/admin/payments", icon: CreditCard, description: "Transactions and refunds" },
    { label: "Live Session Control", href: "/admin/live", icon: Video, description: "Active and scheduled sessions" },
    { label: "Moderation Queue", href: "/admin/moderation", icon: Shield, description: "Escalations and timeouts" },
    { label: "Notifications", href: "/admin/notifications", icon: Bell, description: "Broadcast updates across the platform" },
    { label: "Audit Trail", href: "/admin/audit", icon: FileText, description: "System-wide activity log" },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <PageHeader
        eyebrow="Admin"
        title="Platform Control Center"
        description="System-wide overview of users, revenue, content, and platform health."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/marketing">
              <TrendingUp className="size-4" />
              Marketing CMS
            </Link>
          </Button>
        }
      />

      {/* KPI Stats */}
      <StatGrid columns={4}>
        <StatCard
          label="Total Users"
          value={formatCompactNumber(stats.totalUsers)}
          icon={Users}
          description="Platform-wide"
        />
        <StatCard
          label="Active Enrollments"
          value={formatCompactNumber(stats.activeEnrollments)}
          icon={BookOpen}
          description={`${stats.completionRate}% completion rate`}
        />
        <StatCard
          label="Monthly Revenue"
          value={formatCurrency(stats.monthlyRevenue)}
          icon={CreditCard}
          description={`Total: ${formatCurrency(stats.totalRevenue)}`}
        />
        <StatCard
          label="Live Sessions"
          value={formatCompactNumber(stats.liveSessions)}
          icon={Video}
          description="Scheduled or active"
        />
      </StatGrid>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          {
            label: "Total Courses",
            value: stats.totalCourses,
            note: `${stats.publishedCourses} published`,
            tone: "secondary" as const,
          },
          {
            label: "Published",
            value: stats.publishedCourses,
            note: `of ${stats.totalCourses} total`,
            tone: "accent" as const,
          },
          {
            label: "Completion Rate",
            value: `${stats.completionRate}%`,
            note: "enrolled → completed",
            tone: "card" as const,
          },
          {
            label: "Total Revenue",
            value: formatCurrency(stats.totalRevenue),
            note: "all time",
            tone: "muted" as const,
          },
        ].map((item) => (
          <RetroPanel key={item.label} tone={item.tone} className="space-y-1">
            <p className="font-heading text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
              {item.label}
            </p>
            <p className="font-heading text-3xl font-black tracking-[-0.05em] tabular-nums">
              {item.value}
            </p>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {item.note}
            </p>
          </RetroPanel>
        ))}
      </div>

      {/* Alerts & Quick Navigation */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions — takes 2 cols */}
        <section className="flex flex-col gap-4 lg:col-span-2">
          <h2 className="font-heading text-2xl font-black tracking-[-0.04em]">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group"
              >
                <RetroPanel
                  tone={action.href === "/admin/moderation" ? "secondary" : action.href === "/admin/payments" ? "accent" : "card"}
                  className="flex items-start gap-4 transition-transform group-hover:-translate-y-1"
                >
                  <div className="rounded-[calc(var(--radius)+2px)] border-2 border-border bg-card p-2 text-muted-foreground shadow-retro-sm transition-colors group-hover:text-foreground">
                    <action.icon className="size-4" />
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="font-heading text-lg font-black tracking-[-0.03em]">{action.label}</span>
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      {action.description}
                    </span>
                  </div>
                  <ArrowRight className="mt-0.5 size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </RetroPanel>
              </Link>
            ))}
          </div>

          <ActivityFeed
            title="Operational Queue"
            items={buildOperationalQueue({
              draftCourses,
              liveData,
              moderationData,
              auditLogs,
            })}
          />
        </section>

        {/* System Health sidebar */}
        <aside className="flex flex-col gap-4">
          <ActivityFeed
            title="System Alerts"
            emptyText="No issues detected."
            items={buildAlerts(stats, {
              draftCourses,
              openEscalations: moderationData.openEscalations,
              recordingFailures: liveData.recordingFailures,
              sessionsMissingJoinLink,
            })}
          />

          <ActivityFeed
            title="Revenue Pulse"
            viewAllHref="/admin/payments"
            emptyText="No recent payments."
            items={payments.map((payment) => ({
              id: payment.id,
              label: payment.userName,
              description: `${payment.courseTitle} · ${formatCurrency(payment.amount, payment.currency)}`,
              badge: payment.status,
              timestamp: payment.createdAt
                ? formatRelativeTime(payment.createdAt)
                : undefined,
              href: `/admin/payments#payment-${payment.id}`,
            }))}
          />

          <RetroPanel tone="accent" className="space-y-3">
            <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.15em] text-muted-foreground">
              Platform at a Glance
            </p>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">SDK</dt>
                <dd className="tabular-nums">node-appwrite 23.x</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Framework</dt>
                <dd className="tabular-nums">Next.js 16.2</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Database</dt>
                <dd className="tabular-nums">Appwrite TablesDB</dd>
              </div>
            </dl>
          </RetroPanel>
        </aside>
      </div>
    </div>
  );
}

function buildAlerts(
  stats: {
    totalUsers: number;
    activeEnrollments: number;
    monthlyRevenue: number;
    liveSessions: number;
    totalCourses: number;
    publishedCourses: number;
    completionRate: number;
    totalRevenue: number;
  },
  context: {
    draftCourses: number;
    openEscalations: number;
    recordingFailures: number;
    sessionsMissingJoinLink: number;
  }
) {
  const alerts: Array<{
    id: string;
    label: string;
    description: string;
    badge?: string;
    href?: string;
  }> = [];

  if (stats.totalUsers === 0) {
    alerts.push({
      id: "no-users",
      label: "No users registered yet",
      description: "The platform has zero users. Share the registration link.",
      badge: "Setup",
      href: "/admin/users",
    });
  }

  if (stats.activeEnrollments === 0) {
    alerts.push({
      id: "no-enrollments",
      label: "No active enrollments",
      description: "Publish courses and start enrolling students.",
      badge: "Content",
      href: "/admin/courses",
    });
  }

  if (stats.monthlyRevenue === 0) {
    alerts.push({
      id: "no-revenue",
      label: "No revenue this month",
      description: "Consider running a promotion or launching paid courses.",
      href: "/admin/payments",
    });
  }

  if (context.openEscalations > 0) {
    alerts.push({
      id: "open-escalations",
      label: `${context.openEscalations} moderation escalation${context.openEscalations === 1 ? "" : "s"} open`,
      description: "Admins need to review unresolved platform flags.",
      badge: "Moderation",
      href: "/admin/moderation#open-escalations",
    });
  }

  if (context.sessionsMissingJoinLink > 0) {
    alerts.push({
      id: "missing-live-links",
      label: `${context.sessionsMissingJoinLink} live session${context.sessionsMissingJoinLink === 1 ? "" : "s"} missing join links`,
      description: "Students will not be able to join until instructors add meeting URLs.",
      badge: "Live",
      href: "/admin/live#upcoming-sessions",
    });
  }

  if (context.recordingFailures > 0) {
    alerts.push({
      id: "recording-failures",
      label: `${context.recordingFailures} ended session${context.recordingFailures === 1 ? "" : "s"} missing recordings`,
      description: "Check whether instructors still need to publish replay links.",
      badge: "Recordings",
      href: "/admin/live#upcoming-sessions",
    });
  }

  if (context.draftCourses > 0) {
    alerts.push({
      id: "draft-courses",
      label: `${context.draftCourses} course draft${context.draftCourses === 1 ? "" : "s"} awaiting oversight`,
      description: "Review unpublished courses and decide what should be featured or launched.",
      badge: "Courses",
      href: "/admin/courses",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "all-good",
      label: "All systems operational",
      description: "No issues detected. Platform is running smoothly.",
      badge: "OK",
      href: "/admin/audit",
    });
  }

  return alerts;
}

function buildOperationalQueue(context: {
  draftCourses: number;
  liveData: {
    upcoming: Array<{
      id: string;
      title: string;
      status: string;
      scheduledAt: string | null;
      streamUrl: string;
    }>;
  };
  moderationData: {
    escalationItems: Array<{
      id: string;
      targetUserName: string;
      moderatorName: string;
      scope: string;
      reason: string;
      createdAt: string;
    }>;
  };
  auditLogs: Array<{
    id: string;
    actor: string;
    action: string;
    entity: string;
    createdAt: string | null;
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

  for (const escalation of context.moderationData.escalationItems.slice(0, 2)) {
    items.push({
      id: `escalation-${escalation.id}`,
      label: `${escalation.targetUserName} needs review`,
      description:
        escalation.reason || `Raised by ${escalation.moderatorName} for admin follow-up`,
      badge: escalation.scope,
      href: `/admin/moderation#escalation-${escalation.id}`,
      timestamp: escalation.createdAt
        ? formatRelativeTime(escalation.createdAt)
        : undefined,
    });
  }

  for (const session of context.liveData.upcoming.filter((item) => !item.streamUrl).slice(0, 2)) {
    items.push({
      id: `session-${session.id}`,
      label: `${session.title} is missing a join link`,
      description: session.scheduledAt
        ? formatDateTime(session.scheduledAt)
        : "No schedule set yet",
      badge: session.status,
      href: `/admin/live#session-${session.id}`,
    });
  }

  if (context.draftCourses > 0) {
    items.push({
      id: "draft-courses",
      label: `${context.draftCourses} course draft${context.draftCourses === 1 ? "" : "s"} still unpublished`,
      description: "Review publication, featuring, and visibility from course oversight",
      badge: "Courses",
      href: "/admin/courses",
    });
  }

  if (items.length === 0 && context.auditLogs[0]) {
    const latestLog = context.auditLogs[0];
    items.push({
      id: `audit-${latestLog.id}`,
      label: `${latestLog.actor} performed ${latestLog.action}`,
      description: latestLog.entity,
      badge: "Audit",
      href: `/admin/audit#audit-log-${latestLog.id}`,
      timestamp: latestLog.createdAt
        ? formatRelativeTime(latestLog.createdAt)
        : undefined,
    });
  }

  return items;
}
