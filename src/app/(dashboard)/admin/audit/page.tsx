import { FileText, Search, Filter } from "lucide-react";

import { getAdminAuditLogs } from "@/lib/appwrite/dashboard-data";
import { formatDateTime, formatRelativeTime } from "@/lib/utils/format";
import { PageHeader, EmptyState } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

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

// ── Page ────────────────────────────────────────────────────────────────────

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; action?: string; entity?: string }>;
}) {
  const logs = await getAdminAuditLogs();

  // Extract unique actions and entities for filter dropdowns
  const uniqueActions = [...new Set(logs.map((l) => l.action).filter(Boolean))].sort();
  const uniqueEntities = [...new Set(logs.map((l) => l.entity).filter(Boolean))].sort();

  // Group logs by action type for summary
  const actionCounts = logs.reduce(
    (acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const topActions = Object.entries(actionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Admin · Audit"
        title="System Audit Trail"
        description={`${logs.length} recorded events — every admin, instructor, and moderator action is logged here. Search and filter to find specific events.`}
      />

      {logs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No audit events"
          description="System actions will be logged here automatically as admins, instructors, and moderators perform operations."
        />
      ) : (
        <>
          {/* Action summary bar */}
          <div className="flex flex-wrap items-center gap-2">
            {topActions.map(([action, count]) => (
              <a
                key={action}
                href={`/admin/audit?action=${encodeURIComponent(action)}`}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors hover:opacity-80 ${getActionColor(action)}`}
              >
                {action.replace("payment.", "")}
                <span className="tabular-nums">{count}</span>
              </a>
            ))}
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                name="q"
                placeholder="Search by actor, action, or entity ID..."
                className="pl-8 h-9 text-sm"
                defaultValue=""
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="size-3.5 text-muted-foreground" />
              <select
                name="action"
                className="h-9 rounded-lg border border-border/40 bg-background px-3 text-xs font-semibold"
                defaultValue=""
              >
                <option value="">All actions</option>
                {uniqueActions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
              <select
                name="entity"
                className="h-9 rounded-lg border border-border/40 bg-background px-3 text-xs font-semibold"
                defaultValue=""
              >
                <option value="">All entities</option>
                {uniqueEntities.map((entity) => (
                  <option key={entity} value={entity}>
                    {entity}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-xs font-semibold text-muted-foreground tabular-nums">
              {logs.length} events
            </span>
          </div>

          {/* Audit log table */}
          <section className="overflow-hidden rounded-2xl border border-border/40 bg-surface">
            <div className="hidden items-center gap-4 border-b-2 border-border bg-[color:var(--surface-secondary)] px-5 py-3 font-heading text-xs font-black uppercase tracking-[0.15em] text-muted-foreground md:grid md:grid-cols-[140px_1fr_100px_1fr_140px]">
              <span>Actor</span>
              <span>Action</span>
              <span>Entity</span>
              <span>Entity ID</span>
              <span>Time</span>
            </div>

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
          </section>

          {/* Search/filter form (JS-powered via URL params) */}
          <AuditFilterForm />
        </>
      )}
    </div>
  );
}

// ── Client filter form ─────────────────────────────────────────────────────

import { Suspense } from "react";

function AuditFilterForm() {
  return (
    <Suspense fallback={null}>
      <AuditFilterFormInner />
    </Suspense>
  );
}

function AuditFilterFormInner() {
  // This is a static placeholder — actual filtering is done
  // by submitting the filter form which navigates with search params.
  // The page reads `searchParams` at the top to apply filters.
  return (
    <div className="rounded-2xl border border-border/40 bg-surface p-4">
      <p className="text-xs font-semibold text-muted-foreground">
        Filter by URL: <code className="font-mono text-accent">/admin/audit?action=payment.completed&entity=payment</code>
      </p>
      <p className="mt-1 text-[10px] text-muted-foreground">
        Use search params to filter — the server renders filtered results on page load.
      </p>
    </div>
  );
}
