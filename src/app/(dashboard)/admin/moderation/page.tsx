import { getAdminModerationData } from "@/lib/appwrite/dashboard-data";

export default async function AdminModerationPage() {
  const data = await getAdminModerationData();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin Moderation</p>
        <h1 className="text-3xl mt-2">Moderation Governance</h1>
      </div>

      <section className="border border-border p-6 space-y-3 text-sm text-muted-foreground">
        <p>- Moderator actions today: {data.actionsToday}</p>
        <p>- Open escalations: {data.openEscalations}</p>
        <p>- Active timeouts: {data.activeTimeouts}</p>
      </section>
    </div>
  );
}
