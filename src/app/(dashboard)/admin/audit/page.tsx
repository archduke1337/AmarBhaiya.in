const AUDIT_EVENTS = [
  "admin changed role: student -> moderator",
  "instructor published course: complete-coding-bootcamp",
  "moderator deleted flagged forum reply",
];

export default function AdminAuditPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Audit Logs</p>
        <h1 className="text-3xl mt-2">System Audit Trail</h1>
      </div>

      <section className="border border-border p-6 space-y-3">
        {AUDIT_EVENTS.map((event) => (
          <p key={event} className="text-sm text-muted-foreground border border-border px-3 py-2">
            {event}
          </p>
        ))}
      </section>
    </div>
  );
}
