import { getModeratorReports } from "@/lib/appwrite/dashboard-data";

export default async function ModeratorReportsPage() {
  const reports = await getModeratorReports();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Reports</p>
        <h1 className="text-3xl mt-2">Flagged Content Queue</h1>
      </div>

      <section className="space-y-3">
        {reports.length === 0 ? (
          <article className="border border-border p-5 text-sm text-muted-foreground">
            No flagged moderation reports found.
          </article>
        ) : null}

        {reports.map((report) => (
          <article key={report.id} className="border border-border p-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg">{report.id}</h2>
              <p className="text-sm text-muted-foreground">
                {report.entityType} · entity: {report.entityId} · target: {report.target}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Reason: {report.reason}</p>
            </div>
            <p className="text-sm uppercase tracking-widest text-muted-foreground">{report.status}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
