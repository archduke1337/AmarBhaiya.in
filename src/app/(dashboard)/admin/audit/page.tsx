import { getAdminAuditLogs } from "@/lib/appwrite/dashboard-data";
import { formatDateTime } from "@/lib/utils/format";

export default async function AdminAuditPage() {
  const logs = await getAdminAuditLogs();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Audit Logs</p>
        <h1 className="text-3xl mt-2">System Audit Trail</h1>
      </div>

      <section className="border border-border p-6 space-y-3">
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No audit events found.</p>
        ) : null}

        {logs.map((log) => (
          <article key={log.id} className="text-sm text-muted-foreground border border-border px-3 py-2 space-y-1">
            <p className="text-foreground">
              {log.actor} · {log.action}
            </p>
            <p>
              Entity: {log.entity} ({log.entityId})
            </p>
            <p>
              {log.createdAt ? formatDateTime(log.createdAt) : "Unknown time"}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
