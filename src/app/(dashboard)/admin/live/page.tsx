import { getAdminLiveData } from "@/lib/appwrite/dashboard-data";
import { formatDateTime } from "@/lib/utils/format";

export default async function AdminLivePage() {
  const data = await getAdminLiveData();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin Live</p>
        <h1 className="text-3xl mt-2">Live Session Monitoring</h1>
      </div>

      <section className="border border-border p-6 space-y-2 text-sm text-muted-foreground">
        <p>- Active sessions: {data.activeSessions}</p>
        <p>- Scheduled sessions: {data.scheduledSessions}</p>
        <p>- Recording upload failures: {data.recordingFailures}</p>
      </section>

      <section className="border border-border p-6 space-y-3">
        <h2 className="text-xl">Upcoming sessions</h2>
        {data.upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming sessions found.</p>
        ) : null}

        {data.upcoming.map((session) => (
          <article key={session.id} className="border border-border p-4 text-sm text-muted-foreground">
            <p className="text-foreground">{session.title}</p>
            <p className="mt-1 capitalize">
              {session.status}
              {" · "}
              {session.scheduledAt ? formatDateTime(session.scheduledAt) : "No schedule set"}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
