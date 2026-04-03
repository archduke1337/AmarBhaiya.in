import { Video, Radio, Clock, AlertTriangle } from "lucide-react";

import { deleteLiveSessionAction } from "@/actions/delete";
import { getAdminLiveData } from "@/lib/appwrite/dashboard-data";
import { formatDateTime } from "@/lib/utils/format";
import { PageHeader, StatGrid, StatCard, EmptyState } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";

export default async function AdminLivePage() {
  const data = await getAdminLiveData();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Admin · Live"
        title="Live Session Monitoring"
        description="Overview of all active, scheduled, and recently ended live sessions across the platform."
      />

      <StatGrid columns={3}>
        <StatCard
          label="Active Now"
          value={data.activeSessions}
          icon={Radio}
          description={data.activeSessions > 0 ? "Sessions in progress" : "No live sessions"}
        />
        <StatCard
          label="Scheduled"
          value={data.scheduledSessions}
          icon={Clock}
          description="Upcoming sessions"
        />
        <StatCard
          label="Recording Failures"
          value={data.recordingFailures}
          icon={AlertTriangle}
          description={data.recordingFailures > 0 ? "Missing recordings" : "All recordings OK"}
        />
      </StatGrid>

      <section
        id="upcoming-sessions"
        className="scroll-mt-24 flex flex-col gap-4"
      >
        <h2 className="text-lg font-medium">Upcoming Sessions</h2>

        {data.upcoming.length === 0 ? (
          <EmptyState
            icon={Video}
            title="No upcoming sessions"
            description="Instructors can schedule live sessions from their dashboard."
          />
        ) : (
          <div className="border border-border">
            <div className="hidden items-center gap-4 border-b border-border bg-muted/30 px-5 py-3 text-xs uppercase tracking-[0.15em] text-muted-foreground md:grid md:grid-cols-[1fr_100px_200px_80px]">
              <span>Session</span>
              <span>Status</span>
              <span>Scheduled At</span>
              <span>Links</span>
            </div>

            <div className="divide-y divide-border">
              {data.upcoming.map((session) => (
                <div
                  key={session.id}
                  id={`session-${session.id}`}
                  className="flex flex-col gap-2 px-5 py-4 md:grid md:grid-cols-[1fr_100px_200px_80px] md:items-center md:gap-4"
                >
                  <span className="text-sm font-medium">{session.title}</span>

                  <Badge
                    variant={session.status === "live" ? "default" : "outline"}
                    className="w-fit capitalize"
                  >
                    {session.status}
                  </Badge>

                  <span className="text-sm tabular-nums text-muted-foreground">
                    {session.scheduledAt
                      ? formatDateTime(session.scheduledAt)
                      : "Not scheduled"}
                  </span>

                  <div className="flex items-center gap-3 text-xs">
                    {session.streamUrl ? (
                      <a
                        href={session.streamUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        Open
                      </a>
                    ) : (
                      <span className="text-muted-foreground">No link</span>
                    )}
                    <form action={deleteLiveSessionAction}>
                      <input type="hidden" name="sessionId" value={session.id} />
                      <button
                        type="submit"
                        className="text-destructive hover:underline"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
