import { FileText } from "lucide-react";

import { getAdminAuditLogs } from "@/lib/appwrite/dashboard-data";
import { formatDateTime, formatRelativeTime } from "@/lib/utils/format";
import { PageHeader, EmptyState } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";

export default async function AdminAuditPage() {
  const logs = await getAdminAuditLogs();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Admin · Audit"
        title="System Audit Trail"
        description={`${logs.length} recorded events — every admin, instructor, and moderator action is logged here.`}
      />

      {logs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No audit events"
          description="System actions will be logged here automatically as admins, instructors, and moderators perform operations."
        />
      ) : (
        <section className="border border-border">
          {/* Table header */}
          <div className="hidden items-center gap-4 border-b border-border bg-muted/30 px-5 py-3 text-xs uppercase tracking-[0.15em] text-muted-foreground md:grid md:grid-cols-[140px_1fr_120px_1fr_140px]">
            <span>Actor</span>
            <span>Action</span>
            <span>Entity</span>
            <span>Entity ID</span>
            <span>Time</span>
          </div>

          <div className="divide-y divide-border">
            {logs.map((log) => (
              <div
                key={log.id}
                id={`audit-log-${log.id}`}
                className="flex flex-col gap-1.5 px-5 py-3.5 md:grid md:grid-cols-[140px_1fr_120px_1fr_140px] md:items-center md:gap-4"
              >
                <span className="text-sm font-medium">{log.actor}</span>

                <Badge variant="outline" className="w-fit">
                  {log.action}
                </Badge>

                <span className="text-xs text-muted-foreground">
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
      )}
    </div>
  );
}
