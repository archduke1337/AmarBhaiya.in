import Link from "next/link";
import {
  Flag,
  UserX,
  MessageSquare,
  Activity,
  ArrowRight,
} from "lucide-react";

import {
  getModeratorDashboardStats,
  getModeratorReports,
  getModeratorCommunityData,
} from "@/lib/appwrite/dashboard-data";
import { formatCompactNumber, formatRelativeTime } from "@/lib/utils/format";
import {
  PageHeader,
  StatCard,
  StatGrid,
  ActivityFeed,
} from "@/components/dashboard";
import { RetroPanel } from "@/components/marketing/retro-panel";
import { Button } from "@/components/ui/button";

export default async function ModeratorDashboardPage() {
  const [stats, reports, communityData] = await Promise.all([
    getModeratorDashboardStats(),
    getModeratorReports(),
    getModeratorCommunityData(),
  ]);

  const pendingReports = reports.filter((r) => r.status === "pending");

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <PageHeader
        eyebrow="Moderator"
        title="Moderation Dashboard"
        description="Monitor flagged content, manage user behavior, and keep the community healthy."
        actions={
          <Button
            asChild
            variant={pendingReports.length > 0 ? "default" : "outline"}
            size="sm"
          >
            <Link href="/moderator/reports">
              <Flag className="size-4" />
              {pendingReports.length > 0
                ? `Review ${pendingReports.length} Reports`
                : "View Reports"}
            </Link>
          </Button>
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
              timestamp: report.createdAt
                ? formatRelativeTime(report.createdAt)
                : undefined,
              href: `/moderator/reports#report-${report.id}`,
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
              badge: thread.locked
                ? "Locked"
                : thread.pinned
                  ? "Pinned"
                  : thread.category,
              href: `/moderator/community#thread-${thread.id}`,
            }))}
          />
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-6">
          <ActivityFeed
            title="Follow-up Queue"
            items={buildModeratorFollowUpItems(stats, pendingReports)}
          />

          {/* Moderation Action Breakdown */}
          <RetroPanel tone="secondary" className="overflow-hidden p-0">
            <p className="border-b border-border px-5 py-3 font-heading text-sm font-black uppercase tracking-[0.16em]">
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
          </RetroPanel>

          {/* Quick navigation */}
          <RetroPanel tone="accent" className="overflow-hidden p-0">
            <p className="border-b border-border px-5 py-3 font-heading text-sm font-black uppercase tracking-[0.16em]">
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
          </RetroPanel>
        </aside>
      </div>
    </div>
  );
}

function buildModeratorFollowUpItems(
  stats: {
    openReports: number;
    mutedUsers: number;
    flaggedThreads: number;
    actionsToday: number;
  },
  pendingReports: Array<{ id: string; reason: string }>
) {
  const items: Array<{
    id: string;
    label: string;
    description: string;
    badge?: string;
    href?: string;
  }> = [];

  if (pendingReports.length > 0) {
    items.push({
      id: "pending-reports",
      label: `${pendingReports.length} report${pendingReports.length === 1 ? "" : "s"} still waiting`,
      description:
        pendingReports[0]?.reason || "Open the reports queue and clear the oldest flags first",
      badge: "Urgent",
      href: `/moderator/reports#report-${pendingReports[0]?.id ?? ""}`,
    });
  }

  if (stats.flaggedThreads > 0) {
    items.push({
      id: "flagged-threads",
      label: `${stats.flaggedThreads} thread${stats.flaggedThreads === 1 ? "" : "s"} under watch`,
      description: "Inspect pinned, locked, and recently reported discussion threads",
      badge: "Threads",
      href: "/moderator/community#recent-threads",
    });
  }

  if (stats.mutedUsers > 0) {
    items.push({
      id: "active-sanctions",
      label: `${stats.mutedUsers} user${stats.mutedUsers === 1 ? "" : "s"} currently muted or timed out`,
      description: "Review sanctions and confirm nothing should be reverted or escalated",
      badge: "Users",
      href: "/moderator/students",
    });
  }

  if (items.length === 0) {
    items.push({
      id: "all-clear",
      label: "No urgent moderation follow-up",
      description: "Reports, threads, and user sanctions are under control",
      badge: "Clear",
      href: "/moderator/community",
    });
  }

  return items;
}
