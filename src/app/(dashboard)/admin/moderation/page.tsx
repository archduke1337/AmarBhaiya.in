export default function AdminModerationPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin Moderation</p>
        <h1 className="text-3xl mt-2">Moderation Governance</h1>
      </div>

      <section className="border border-border p-6 space-y-3 text-sm text-muted-foreground">
        <p>- Moderator actions today: 21</p>
        <p>- Escalations to admin: 3</p>
        <p>- Pending policy reviews: 2</p>
      </section>
    </div>
  );
}
