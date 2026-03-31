const REPORTS = [
  { id: "rep-91", type: "Forum thread", severity: "high", status: "pending" },
  { id: "rep-92", type: "Course comment", severity: "medium", status: "pending" },
  { id: "rep-93", type: "Live chat", severity: "low", status: "reviewed" },
];

export default function ModeratorReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Reports</p>
        <h1 className="text-3xl mt-2">Flagged Content Queue</h1>
      </div>

      <section className="space-y-3">
        {REPORTS.map((report) => (
          <article key={report.id} className="border border-border p-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg">{report.id}</h2>
              <p className="text-sm text-muted-foreground">
                {report.type} - severity: {report.severity}
              </p>
            </div>
            <p className="text-sm uppercase tracking-widest text-muted-foreground">{report.status}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
