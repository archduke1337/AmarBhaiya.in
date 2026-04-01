import Link from "next/link";
import {
  Flag,
  UserX,
  MessageSquare,
  Activity,
  AlertTriangle,
  ArrowRight,
  Shield,
  Search,
} from "lucide-react";

import {
  getModeratorDashboardStats,
  getModeratorReports,
  getModeratorCommunityData,
} from "@/lib/appwrite/dashboard-data";
import { formatCompactNumber } from "@/lib/utils/format";
import {
  PageHeader,
  StatCard,
  StatGrid,
  ActivityFeed,
} from "@/components/dashboard";

export default async function ModeratorDashboardPage() {
  const [stats, reports, communityData] = await Promise.all([
    getModeratorDashboardStats(),
    getModeratorReports(),
    getModeratorCommunityData(),
  ]);

  const pendingReports = reports.filter((r) => r.status === "pending");
  const urgentReports = pendingReports.filter(() => {
    // TODO: Track report age — flag reports older than 24h
    return false;
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <PageHeader
        eyebrow="Moderator"
        title="Moderation Dashboard"
        description="Monitor flagged content, manage user behavior, and keep the community healthy."
        actions={
          <Link
            href="/moderator/reports"
            className={`inline-flex h-9 items-center gap-2 px-4 text-sm transition-colors ${
              pendingReports.length > 0
                ? "bg-foreground text-background hover:opacity-90"
                : "border border-border hover:bg-muted"
            }`}
          >
            <Flag className="size-4" />
            {pendingReports.length > 0
              ? `Review ${pendingReports.length} Reports`
              : "View Reports"}
          </Link>
        }
      />

      {/* Stats */}
      <StatGrid columns={4}>
        <StatCard
          label="Open Reports"
          value={formatCompactNumber(stats.openReports)}
          icon={Flag}
          description={
            stats.openReports > 0
              ? "Requires attention"
              : "Queue clear"
          }
        />
        <StatCard
          label="Muted Users"
          value={formatCompactNumber(stats.mutedUsers)}
          icon={UserX}
          description="Currently silenced"
        />
        <StatCard
          label="Flagged Threads"
          value={formatCompactNumber(stats.flaggedThreads)}
          icon={MessageSquare}
          description="Threads under review"
        />
        <StatCard
          label="Actions Today"
          value={formatCompactNumber(stats.actionsToday)}
          icon={Activity}
          description="Your moderation activity"
        />
      </StatGrid>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Reports + Community — 2 cols */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Urgent Queue */}
          <ActivityFeed
            title="Latest Reports"
            viewAllHref="/moderator/reports"
            emptyText="No open reports. The community is healthy!"
            items={pendingReports.slice(0, 5).map((report) => ({
              id: report.id,
              label: `${report.entityType}: ${report.target}`,
              description: report.reason,
              badge: report.status === "pending" ? "Pending" : "Reviewed",
              href: "/moderator/reports",
            }))}
          />

          {/* Community Thread Activity */}
          <ActivityFeed
            title="Recent Community Threads"
            viewAllHref="/moderator/community"
            emptyText="No active community threads."
            items={communityData.recentThreads.slice(0, 5).map((thread) => ({
              id: thread.id,
              label: thread.title,
              description: `by ${thread.author} · ${thread.replies} replies`,
              badge: thread.pinned ? "Pinned" : thread.category,
            }))}
          />
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-6">
          {/* Moderation Action Breakdown */}
          <section className="border border-border">
            <p className="border-b border-border px-5 py-3 text-sm font-medium">
              Action Breakdown
            </p>
            <div className="flex flex-col divide-y divide-border">
              {communityData.actionCounts.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <span className="text-sm text-muted-foreground">
                    {item.label}
                  </span>
                  <span className="text-sm font-medium tabular-nums">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Quick navigation */}
          <nav className="border border-border">
            <p className="border-b border-border px-5 py-3 text-sm font-medium">
              Quick Navigation
            </p>
            <div className="flex flex-col divide-y divide-border">
              {[
                {
                  label: "Flagged Reports",
                  href: "/moderator/reports",
                  icon: Flag,
                },
                {
                  label: "Moderated Users",
                  href: "/moderator/students",
                  icon: UserX,
                },
                {
                  label: "Community Overview",
                  href: "/moderator/community",
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
