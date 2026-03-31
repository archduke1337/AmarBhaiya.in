export default function AdminLivePage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin Live</p>
        <h1 className="text-3xl mt-2">Live Session Monitoring</h1>
      </div>

      <section className="border border-border p-6 space-y-2 text-sm text-muted-foreground">
        <p>- Active sessions: 1</p>
        <p>- Scheduled sessions (next 7 days): 6</p>
        <p>- Recording upload failures: 0</p>
      </section>
    </div>
  );
}
