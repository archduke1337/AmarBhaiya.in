import Link from "next/link";
import {
  Users,
  CreditCard,
  BookOpen,
  Video,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Shield,
  FileText,
} from "lucide-react";

import { getAdminDashboardStats } from "@/lib/appwrite/dashboard-data";
import { formatCompactNumber, formatCurrency } from "@/lib/utils/format";
import {
  PageHeader,
  StatCard,
  StatGrid,
  ActivityFeed,
} from "@/components/dashboard";

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  const quickActions = [
    { label: "User Management", href: "/admin/users", icon: Users, description: "Manage roles and access" },
    { label: "Course Oversight", href: "/admin/courses", icon: BookOpen, description: "Publish, feature, or archive" },
    { label: "Payment Records", href: "/admin/payments", icon: CreditCard, description: "Transactions and refunds" },
    { label: "Live Session Control", href: "/admin/live", icon: Video, description: "Active and scheduled sessions" },
    { label: "Moderation Queue", href: "/admin/moderation", icon: Shield, description: "Escalations and timeouts" },
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
          <Link
            href="/admin/marketing"
            className="inline-flex h-9 items-center gap-2 border border-border px-4 text-sm transition-colors hover:bg-muted"
          >
            <TrendingUp className="size-4" />
            Marketing CMS
          </Link>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border border-border p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Total Courses</p>
          <p className="text-2xl tabular-nums">{stats.totalCourses}</p>
          <p className="text-[10px] text-muted-foreground">{stats.publishedCourses} published</p>
        </div>
        <div className="border border-border p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Published</p>
          <p className="text-2xl tabular-nums">{stats.publishedCourses}</p>
          <p className="text-[10px] text-muted-foreground">of {stats.totalCourses} total</p>
        </div>
        <div className="border border-border p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Completion Rate</p>
          <p className="text-2xl tabular-nums">{stats.completionRate}%</p>
          <p className="text-[10px] text-muted-foreground">enrolled → completed</p>
        </div>
        <div className="border border-border p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Total Revenue</p>
          <p className="text-2xl tabular-nums">{formatCurrency(stats.totalRevenue)}</p>
          <p className="text-[10px] text-muted-foreground">all time</p>
        </div>
      </div>

      {/* Alerts & Quick Navigation */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions — takes 2 cols */}
        <section className="flex flex-col gap-4 lg:col-span-2">
          <h2 className="text-lg font-medium">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-start gap-4 border border-border p-4 transition-colors hover:border-foreground/20"
              >
                <div className="rounded-md border border-border p-2 text-muted-foreground transition-colors group-hover:text-foreground">
                  <action.icon className="size-4" />
                </div>
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-sm font-medium">{action.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {action.description}
                  </span>
                </div>
                <ArrowRight className="mt-0.5 size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </section>

        {/* System Health sidebar */}
        <aside className="flex flex-col gap-4">
          <ActivityFeed
            title="System Alerts"
            emptyText="No issues detected."
            items={buildAlerts(stats)}
          />

          <div className="border border-border p-4">
            <p className="mb-2 text-xs uppercase tracking-[0.15em] text-muted-foreground">
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
          </div>
        </aside>
      </div>
    </div>
  );
}

function buildAlerts(stats: { totalUsers: number; activeEnrollments: number; monthlyRevenue: number; liveSessions: number; totalCourses: number; publishedCourses: number; completionRate: number; totalRevenue: number }) {
  const alerts: Array<{ id: string; label: string; description: string; badge?: string }> = [];

  if (stats.totalUsers === 0) {
    alerts.push({
      id: "no-users",
      label: "No users registered yet",
      description: "The platform has zero users. Share the registration link.",
      badge: "Setup",
    });
  }

  if (stats.activeEnrollments === 0) {
    alerts.push({
      id: "no-enrollments",
      label: "No active enrollments",
      description: "Publish courses and start enrolling students.",
      badge: "Content",
    });
  }

  if (stats.monthlyRevenue === 0) {
    alerts.push({
      id: "no-revenue",
      label: "No revenue this month",
      description: "Consider running a promotion or launching paid courses.",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "all-good",
      label: "All systems operational",
      description: "No issues detected. Platform is running smoothly.",
      badge: "OK",
    });
  }

  return alerts;
}
