import { FileText, Filter, Search } from "lucide-react";
import Link from "next/link";

import { getAdminAuditLogs } from "@/lib/appwrite/dashboard-data";
import type { AdminAuditItem } from "@/lib/appwrite/dashboard-data";
import { formatDateTime, formatRelativeTime } from "@/lib/utils/format";
import { PageHeader, EmptyState } from "@/components/dashboard";

// ── Helpers ─────────────────────────────────────────────────────────────────

const actionColors: Record<string, string> = {
  "payment.completed": "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
  "payment.failed": "border-destructive/30 bg-destructive/5 text-destructive",
  "payment.refunded": "border-purple-500/30 bg-purple-500/5 text-purple-600 dark:text-purple-400",
  "payment.pending": "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400",
};

function getActionColor(action: string): string {
  return actionColors[action] || "border-border/40 bg-accent/5 text-muted-foreground";
}

function filterLogs(
  logs: AdminAuditItem[],
  params: { action?: string; entity?: string; q?: string }
): AdminAuditItem[] {
  let filtered = logs;
  if (params.action) {
    filtered = filtered.filter((l) => l.action === params.action);
  }
  if (params.entity) {
    filtered = filtered.filter((l) => l.entity === params.entity);
  }
  if (params.q) {
    const q = params.q.toLowerCase();
    filtered = filtered.filter(
      (l) =>
        l.actor.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.entity.toLowerCase().includes(q) ||
        l.entityId.toLowerCase().includes(q)
    );
  }
  return filtered;
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; entity?: string; q?: string }>;
}) {
  const allLogs = await getAdminAuditLogs();
  const params = await searchParams;
  const logs = filterLogs(allLogs, params);

  const hasActiveFilter = params.action || params.entity || params.q;

  // Group logs by action type for summary
  const actionCounts = allLogs.reduce(
    (acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const topActions = Object.entries(actionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  const uniqueEntities = [...new Set(allLogs.map((l) => l.entity).filter(Boolean))].sort();


  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Admin · Audit"
        title="System Audit Trail"
        description={`${allLogs.length} recorded events — every admin, instructor, and moderator action is logged here.`}
      />

      {allLogs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No audit events"
          description="System actions will be logged here automatically as admins, instructors, and moderators perform operations."
        />
      ) : (
        <>
          {/* Active filter indicator */}
          {hasActiveFilter && (
            <div className="flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/5 px-4 py-2.5">
              <Filter className="size-3.5 text-accent" />
              <p className="text-xs font-semibold text-accent">
                Filtered{params.action ? `: action = "${params.action}"` : ""}{params.entity ? ` · entity = "${params.entity}"` : ""}
              </p>
              <Link
                href="/admin/audit"
                className="ml-auto text-[10px] font-bold text-accent hover:underline underline-offset-4"
              >
                Clear filter
              </Link>
            </div>
          )}

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <form method="get">
              {params.action && <input type="hidden" name="action" value={params.action} />}
              {params.entity && <input type="hidden" name="entity" value={params.entity} />}
              <input
                type="text"
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Search by actor, action, entity, or ID..."
                className="w-full h-10 pl-9 pr-4 text-sm rounded-xl border border-border/40 bg-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </form>
          </div>

          {/* Action filter chips */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/audit"
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                !params.action
                  ? "bg-foreground text-background border-foreground"
                  : "border-border/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({allLogs.length})
            </Link>
            {topActions.map(([action, count]) => (
              <Link
                key={action}
                href={`/admin/audit?action=${encodeURIComponent(action)}`}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors hover:opacity-80 ${
                  params.action === action
                    ? "bg-foreground text-background border-foreground"
                    : getActionColor(action)
                }`}
              >
                {action.replace(/^payment\./, "")}
                <span className="tabular-nums">{count}</span>
              </Link>
            ))}
          </div>

          {/* Entity filter chips */}
          {uniqueEntities.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Filter className="size-3 text-muted-foreground" />
              <Link
                href="/admin/audit"
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                  !params.entity
                    ? "bg-foreground text-background border-foreground"
                    : "border-border/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </Link>
              {uniqueEntities.map((entity) => (
                <Link
                  key={entity}
                  href={`/admin/audit?entity=${encodeURIComponent(entity)}`}
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                    params.entity === entity
                      ? "bg-foreground text-background border-foreground"
                      : "border-border/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {entity}
                </Link>
              ))}
            </div>
          )}

          {/* Results count */}
          <p className="text-xs font-semibold text-muted-foreground tabular-nums">
            {hasActiveFilter
              ? `Showing ${logs.length} of ${allLogs.length} events`
              : `${logs.length} events`}
          </p>

          {/* Audit log table */}
          <section className="overflow-hidden rounded-2xl border border-border/40 bg-surface">
            <div className="flex items-center justify-between border-b-2 border-border bg-[color:var(--surface-secondary)] px-5 py-3">
              <h2 className="font-heading text-sm font-black uppercase tracking-[0.12em]">
                Event Log
              </h2>
              <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                {logs.length} events
              </span>
            </div>

            <div className="hidden items-center gap-4 border-b border-border/40 bg-surface-hover px-5 py-3 font-heading text-xs font-black uppercase tracking-[0.15em] text-muted-foreground md:grid md:grid-cols-[140px_1fr_100px_1fr_140px]">
              <span>Actor</span>
              <span>Action</span>
              <span>Entity</span>
              <span>Entity ID</span>
              <span>Time</span>
            </div>

            {logs.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm font-semibold text-muted-foreground">
                No events match the selected filter.
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    id={`audit-log-${log.id}`}
                    className="flex flex-col gap-1.5 px-5 py-3.5 transition-colors hover:bg-accent/30 md:grid md:grid-cols-[140px_1fr_100px_1fr_140px] md:items-center md:gap-4 scroll-mt-24"
                  >
                    <span className="text-sm font-semibold">{log.actor}</span>

                    <span
                      className={`inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getActionColor(log.action)}`}
                    >
                      {log.action}
                    </span>

                    <span className="text-xs font-semibold text-muted-foreground">
                      {log.entity}
                    </span>

                    <span className="truncate font-mono text-xs text-muted-foreground">
                      {log.entityId}
                    </span>

                    <span
                      className="text-xs tabular-nums text-muted-foreground"
                      title={log.createdAt ? formatDateTime(log.createdAt) : undefined}
                    >
                      {log.createdAt
                        ? formatRelativeTime(log.createdAt)
                        : "Unknown time"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
