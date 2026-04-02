import { Video, Calendar, Radio } from "lucide-react";

import { requireAuth } from "@/lib/appwrite/auth";
import { getUpcomingLiveSessions } from "@/lib/appwrite/dashboard-data";
import { rsvpToSessionAction } from "@/actions/account";
import { formatDateTime } from "@/lib/utils/format";
import { PageHeader, EmptyState } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";

export default async function StudentLivePage() {
  await requireAuth();
  const sessions = await getUpcomingLiveSessions();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Live Sessions"
        title="Upcoming & Active Sessions"
        description="Live classes scheduled by instructors. RSVP to get notified when a session starts."
      />

      {sessions.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No upcoming sessions"
          description="Live sessions will appear here once instructors schedule them. Check back later."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map((session) => (
            <article
              key={session.id}
              className="border border-border"
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
                    <a
                      href="#"
                      className="inline-flex h-9 items-center bg-foreground px-4 text-sm text-background transition-opacity hover:opacity-90"
                    >
                      Join Session
                    </a>
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
          ))}
        </div>
      )}
    </div>
  );
}
