import Link from "next/link";
import {
  Bell,
  Users,
  CreditCard,
  BookOpen,
  Video,
  Megaphone,
  Shield,
  FileText,
  TrendingUp,
  Tag,
  Clock,
} from "lucide-react";
import { Button } from "@heroui/react";

import {
  getAdminDashboardStats,
  getAdminPayments,
  getAdminLiveData,
  getAdminModerationData,
  getAdminAuditLogs,
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

export default async function AdminDashboardPage() {
  const [stats, payments, liveData, moderationData, auditLogs] = await Promise.all([
    getAdminDashboardStats(),
    getAdminPayments(),
    getAdminLiveData({ upcomingLimit: 8 }),
    getAdminModerationData({ escalationLimit: 2 }),
    getAdminAuditLogs({ limit: 1 }),
  ]);

  const draftCourses = Math.max(0, stats.totalCourses - stats.publishedCourses);
  const sessionsMissingJoinLink = liveData.upcoming.filter(
    (session) => !session.streamUrl
  ).length;

  // Payment stats for alerts
  const pendingPayments = payments.filter((p) => p.status === "pending");
  const failedPayments = payments.filter((p) => p.status === "failed");
  const refundedPayments = payments.filter((p) => p.status === "refunded");

  const quickActions = [
    { label: "User Management", href: "/admin/users", icon: Users, description: "Manage roles and access" },
    { label: "Marketing CMS", href: "/admin/marketing", icon: Megaphone, description: "Homepage copy and blog content" },
    { label: "Course Oversight", href: "/admin/courses", icon: BookOpen, description: "Publish, feature, or archive" },
    { label: "Payment Records", href: "/admin/payments", icon: CreditCard, description: `Transactions and refunds` },
    { label: "Coupon Management", href: "/admin/coupons", icon: Tag, description: "Discount codes and analytics" },
    { label: "Live Session Control", href: "/admin/live", icon: Video, description: "Active and scheduled sessions" },
    { label: "Moderation Queue", href: "/admin/moderation", icon: Shield, description: "Escalations and timeouts" },
    { label: "Notifications", href: "/admin/notifications", icon: Bell, description: "Broadcast updates across the platform" },
    { label: "Audit Trail", href: "/admin/audit", icon: FileText, description: "System-wide activity log" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Admin"
        title="Platform Control Center"
        description="System-wide overview of users, revenue, content, and platform health."
        actions={
          <Link href="/admin/marketing">
            <Button variant="ghost" size="sm" className="font-bold">
              <TrendingUp className="size-4" />
              Marketing CMS
            </Button>
          </Link>
        }
      />

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
          label="Pending Payments"
          value={formatCompactNumber(pendingPayments.length)}
          icon={Clock}
          description={pendingPayments.length > 0 ? `${pendingPayments.length} need confirmation` : "All clear"}
        />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="flex flex-col gap-6 lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group bg-surface border border-border/40 rounded-2xl p-5 transition-all hover:bg-surface-hover hover:border-border/60 hover:shadow-[var(--surface-shadow)]"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center text-accent shrink-0 group-hover:scale-105 transition-transform">
                    <action.icon className="size-5" />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-bold text-base tracking-tight group-hover:text-accent transition-colors">{action.label}</span>
                    <span className="text-xs font-medium text-foreground/50">{action.description}</span>
                  </div>
                </div>
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

        <aside className="flex flex-col gap-6">
          <ActivityFeed
            title="System Alerts"
            emptyText="No issues detected."
            items={buildAlerts(stats, {
              draftCourses,
              openEscalations: moderationData.openEscalations,
              recordingFailures: liveData.recordingFailures,
              sessionsMissingJoinLink,
              pendingPayments: pendingPayments.length,
              failedPayments: failedPayments.length,
            })}
          />

          <ActivityFeed
            title="Revenue Pulse"
            viewAllHref="/admin/payments"
            emptyText="No recent payments."
            items={payments.slice(0, 6).map((payment) => ({
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

          <div className="bg-surface border border-border/40 rounded-2xl p-5 flex flex-col gap-3">
            <p className="eyebrow self-start">Platform at a Glance</p>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-foreground/60">SDK</dt>
                <dd className="tabular-nums font-medium">node-appwrite 23.x</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-foreground/60">Framework</dt>
                <dd className="tabular-nums font-medium">Next.js 16.2</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-foreground/60">Database</dt>
                <dd className="tabular-nums font-medium">Appwrite TablesDB</dd>
              </div>
            </dl>
          </div>
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
    pendingPayments: number;
    failedPayments: number;
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

  if (context.pendingPayments > 0) {
    alerts.push({
      id: "pending-payments",
      label: `${context.pendingPayments} payment${context.pendingPayments === 1 ? "" : "s"} pending confirmation`,
      description: "Check pending transactions and verify with Razorpay if needed.",
      badge: "Pending",
      href: "/admin/payments",
    });
  }

  if (context.failedPayments > 0) {
    alerts.push({
      id: "failed-payments",
      label: `${context.failedPayments} failed payment${context.failedPayments === 1 ? "" : "s"}`,
      description: "Review failed payments and contact affected students if necessary.",
      badge: "Failed",
      href: "/admin/payments",
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
