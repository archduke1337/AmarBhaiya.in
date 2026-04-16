import { Video, Calendar, Radio } from "lucide-react";

import { requireAuth } from "@/lib/appwrite/auth";
import {
  getRecentLiveRecordings,
  getUpcomingLiveSessions,
} from "@/lib/appwrite/dashboard-data";
import { rsvpToSessionAction } from "@/actions/account";
import { formatDateTime } from "@/lib/utils/format";
import { PageHeader, EmptyState } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RetroPanel } from "@/components/marketing/retro-panel";

export default async function StudentLivePage() {
  await requireAuth();
  const [sessions, recordings] = await Promise.all([
    getUpcomingLiveSessions(),
    getRecentLiveRecordings(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Live Sessions"
        title="Live class miss ho jaye toh recording ka backup hai."
        description="Upcoming sessions, active classes, and published recordings ek jagah. Phone pe bhi join karna easy rahe."
      />

      {sessions.length === 0 && recordings.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No live sessions yet"
          description="Jab instructors live class schedule ya recording publish karenge, woh yahin dikhega."
        />
      ) : (
        <>
          <section
            id="upcoming-sessions"
            className="scroll-mt-24 flex flex-col gap-3"
          >
            <h2 className="font-heading text-lg font-black tracking-[-0.03em] text-muted-foreground">
              Upcoming & live
            </h2>
            {sessions.length === 0 ? (
              <RetroPanel tone="muted">
                <p className="text-sm font-medium leading-7 text-muted-foreground">
                  Abhi upcoming session scheduled nahi hai. Recordings section check kar sakte ho.
                </p>
              </RetroPanel>
            ) : (
              sessions.map((session) => (
                <RetroPanel
                  key={session.id}
                  id={`session-${session.id}`}
                  tone={session.status === "live" ? "secondary" : "card"}
                  className="scroll-mt-24"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-heading text-2xl font-black tracking-[-0.04em]">
                          {session.title}
                        </h2>
                        <Badge
                          variant={session.status === "live" ? "default" : "outline"}
                          className="capitalize"
                        >
                          {session.status === "live" && (
                            <Radio className="mr-1 size-3 animate-pulse" />
                          )}
                          {session.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="size-3.5" />
                          {session.scheduledAt
                            ? formatDateTime(session.scheduledAt)
                            : "Not scheduled"}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {session.status === "live" ? (
                        session.streamUrl ? (
                          <Button asChild variant="secondary" className="w-full sm:w-auto">
                            <a href={session.streamUrl} target="_blank" rel="noreferrer">
                              Join session
                            </a>
                          </Button>
                        ) : (
                          <span className="inline-flex min-h-11 items-center rounded-[calc(var(--radius)+2px)] border-2 border-border bg-[color:var(--surface-card)] px-4 text-sm font-semibold text-muted-foreground shadow-retro-sm">
                            Join link coming soon
                          </span>
                        )
                      ) : (
                        <form action={rsvpToSessionAction}>
                          <input
                            type="hidden"
                            name="sessionId"
                            value={session.id}
                          />
                          <Button
                            type="submit"
                            variant="outline"
                            className="w-full sm:w-auto"
                          >
                            RSVP
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                </RetroPanel>
              ))
            )}
          </section>

          <section
            id="recent-recordings"
            className="scroll-mt-24 flex flex-col gap-3"
          >
            <h2 className="font-heading text-lg font-black tracking-[-0.03em] text-muted-foreground">
              Recent recordings
            </h2>
            {recordings.length === 0 ? (
              <RetroPanel tone="muted">
                <p className="text-sm font-medium leading-7 text-muted-foreground">
                  Session khatam hone ke baad jab recording publish hogi, woh yahin aa jayegi.
                </p>
              </RetroPanel>
            ) : (
              recordings.map((recording) => (
                <RetroPanel
                  key={recording.id}
                  id={`recording-${recording.id}`}
                  tone="card"
                  className="scroll-mt-24"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-1.5">
                      <h2 className="font-heading text-2xl font-black tracking-[-0.04em]">
                        {recording.title}
                      </h2>
                      <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="size-3.5" />
                          {recording.scheduledAt
                            ? formatDateTime(recording.scheduledAt)
                            : "Recently added"}
                        </span>
                      </div>
                    </div>

                    <Button asChild variant="outline" className="w-full sm:w-auto">
                      <a href={recording.recordingUrl} target="_blank" rel="noreferrer">
                        Watch recording
                      </a>
                    </Button>
                  </div>
                </RetroPanel>
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}
