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
        title="Upcoming & Active Sessions"
        description="Live classes scheduled by instructors, plus recent recordings you can revisit."
      />

      {sessions.length === 0 && recordings.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No live sessions yet"
          description="Live sessions and recordings will appear here once instructors publish them."
        />
      ) : (
        <>
          <section
            id="upcoming-sessions"
            className="scroll-mt-24 flex flex-col gap-3"
          >
            <h2 className="text-lg font-medium">Upcoming & Live</h2>
            {sessions.length === 0 ? (
              <p className="border border-border px-5 py-4 text-sm text-muted-foreground">
                No upcoming sessions right now.
              </p>
            ) : (
              sessions.map((session) => (
                <article
                  key={session.id}
                  id={`session-${session.id}`}
                  className="scroll-mt-24 border border-border"
                >
                  <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-medium">{session.title}</h2>
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

                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
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
                          <a
                            href={session.streamUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-9 items-center bg-foreground px-4 text-sm text-background transition-opacity hover:opacity-90"
                          >
                            Join Session
                          </a>
                        ) : (
                          <span className="inline-flex h-9 items-center border border-border px-4 text-sm text-muted-foreground">
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
                          <button
                            type="submit"
                            className="h-9 border border-border px-4 text-sm transition-colors hover:bg-muted"
                          >
                            RSVP
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>

          <section
            id="recent-recordings"
            className="scroll-mt-24 flex flex-col gap-3"
          >
            <h2 className="text-lg font-medium">Recent Recordings</h2>
            {recordings.length === 0 ? (
              <p className="border border-border px-5 py-4 text-sm text-muted-foreground">
                Recordings will appear here once sessions end and instructors publish them.
              </p>
            ) : (
              recordings.map((recording) => (
                <article
                  key={recording.id}
                  id={`recording-${recording.id}`}
                  className="scroll-mt-24 border border-border"
                >
                  <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-1.5">
                      <h2 className="text-base font-medium">{recording.title}</h2>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="size-3.5" />
                          {recording.scheduledAt
                            ? formatDateTime(recording.scheduledAt)
                            : "Recently added"}
                        </span>
                      </div>
                    </div>

                    <a
                      href={recording.recordingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center border border-border px-4 text-sm transition-colors hover:bg-muted"
                    >
                      Watch Recording
                    </a>
                  </div>
                </article>
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}
