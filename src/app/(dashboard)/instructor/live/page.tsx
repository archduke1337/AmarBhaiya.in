import Link from "next/link";
import { CalendarClock, Link2, Plus, Radio, Video } from "lucide-react";

import {
  createLiveSessionAction,
  updateLiveSessionAction,
} from "@/actions/dashboard";
import { deleteLiveSessionAction } from "@/actions/delete";
import { EmptyState, PageHeader, StatCard, StatGrid } from "@/components/dashboard";
import { RetroPanel } from "@/components/marketing/retro-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireRole } from "@/lib/appwrite/auth";
import {
  getInstructorCourseList,
  getInstructorLiveSessions,
} from "@/lib/appwrite/dashboard-data";
import { formatDateTime } from "@/lib/utils/format";

const selectClassName =
  "h-11 w-full rounded-[calc(var(--radius)+2px)] border-2 border-border bg-input px-3.5 text-sm font-semibold text-foreground shadow-retro-sm outline-none transition-all focus-visible:-translate-y-px focus-visible:translate-x-px focus-visible:shadow-none focus-visible:ring-[3px] focus-visible:ring-ring/40";

function toDateTimeLocalValue(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (input: number) => input.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function InstructorLivePage() {
  const { user, role } = await requireRole(["admin", "instructor"]);
  const [sessions, courses] = await Promise.all([
    getInstructorLiveSessions({ userId: user.$id, role }),
    getInstructorCourseList({ userId: user.$id, role }),
  ]);

  const liveSessions = sessions.filter((session) => session.status === "live");
  const scheduledSessions = sessions.filter(
    (session) => session.status === "scheduled"
  );
  const sessionsMissingJoinLink = sessions.filter(
    (session) => !session.streamUrl
  );

  return (
    <div className="flex max-w-6xl flex-col gap-8">
      <PageHeader
        eyebrow="Instructor · Live"
        title="Live Class Studio"
        description="Schedule doubt sessions, revision classes, and live walkthroughs. Students should know when to join, where to click, and what the session is about."
        actions={
          <Button asChild variant="outline" size="sm" className="w-full min-[420px]:w-auto">
            <Link href="/instructor">Back to dashboard</Link>
          </Button>
        }
      />

      <StatGrid columns={4}>
        <StatCard
          label="Total Sessions"
          value={sessions.length}
          icon={Video}
          description="Created across your courses"
        />
        <StatCard
          label="Scheduled"
          value={scheduledSessions.length}
          icon={CalendarClock}
          description="Upcoming or waiting to start"
        />
        <StatCard
          label="Live Now"
          value={liveSessions.length}
          icon={Radio}
          description={liveSessions.length > 0 ? "Students can join now" : "No live room active"}
        />
        <StatCard
          label="Missing Link"
          value={sessionsMissingJoinLink.length}
          icon={Link2}
          description="Add join links before students arrive"
        />
      </StatGrid>

      <RetroPanel tone="accent" className="text-sm font-semibold leading-7 text-muted-foreground">
        Tip for Amar Bhaiya-style classes: keep the title specific, add one clear outcome, and paste the join link before announcing the session. A confused student will usually not try twice on mobile.
      </RetroPanel>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-heading text-2xl font-black tracking-[-0.04em]">
                Scheduled Sessions
              </h2>
              <p className="mt-1 text-sm font-medium leading-7 text-muted-foreground">
                Edit timing, links, recording URLs, and session status.
              </p>
            </div>
            <Button asChild variant="link" size="sm" className="hidden sm:inline-flex">
              <a href="#create-session">Create new</a>
            </Button>
          </div>

          {sessions.length === 0 ? (
            <EmptyState
              icon={Radio}
              title="No live sessions yet"
              description="Create your first session when you want students to gather for doubts, revisions, or a live concept walkthrough."
            />
          ) : (
            sessions.map((session) => (
              <RetroPanel
                key={session.id}
                id={`session-${session.id}`}
                tone={session.status === "live" ? "secondary" : "card"}
                className="scroll-mt-24 overflow-hidden p-0"
              >
                <div className="flex flex-col gap-4 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-heading text-xl font-black tracking-[-0.04em]">
                          {session.title}
                        </h3>
                        <Badge variant={session.status === "live" ? "default" : "outline"}>
                          {session.status}
                        </Badge>
                        {!session.streamUrl ? (
                          <Badge variant="destructive">Join link missing</Badge>
                        ) : null}
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        {session.scheduledAt
                          ? formatDateTime(session.scheduledAt)
                          : "No schedule set"}{" "}
                        · {session.rsvpCount} RSVP{session.rsvpCount === 1 ? "" : "s"}
                      </p>
                      {session.description ? (
                        <p className="max-w-2xl text-sm font-medium leading-7 text-muted-foreground">
                          {session.description}
                        </p>
                      ) : (
                        <p className="text-sm font-medium text-muted-foreground">
                          Add one sentence so students know why this class matters.
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        {session.streamUrl ? (
                          <Button asChild variant="outline" size="xs">
                            <a
                              href={session.streamUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open join link
                            </a>
                          </Button>
                        ) : null}
                        {session.recordingUrl ? (
                          <Button asChild variant="outline" size="xs">
                            <a
                              href={session.recordingUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open recording
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    <form action={deleteLiveSessionAction}>
                      <input type="hidden" name="sessionId" value={session.id} />
                      <Button
                        type="submit"
                        variant="destructive"
                        size="xs"
                        className="w-full sm:w-auto"
                      >
                        Delete
                      </Button>
                    </form>
                  </div>
                </div>

                <form
                  action={updateLiveSessionAction}
                  className="grid gap-4 border-t-2 border-border bg-[color:var(--surface-muted)] px-5 py-4 md:grid-cols-2"
                >
                  <input type="hidden" name="sessionId" value={session.id} />

                  <label className="flex flex-col gap-2 md:col-span-2">
                    <Label>Session title</Label>
                    <Input
                      name="title"
                      required
                      minLength={4}
                      defaultValue={session.title}
                    />
                  </label>

                  <label className="flex flex-col gap-2 md:col-span-2">
                    <Label>Description</Label>
                    <Textarea
                      name="description"
                      rows={2}
                      defaultValue={session.description}
                      className="min-h-24"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <Label>Schedule</Label>
                    <Input
                      type="datetime-local"
                      name="scheduledAt"
                      required
                      defaultValue={toDateTimeLocalValue(session.scheduledAt)}
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <Label>Status</Label>
                    <select
                      name="status"
                      defaultValue={session.status}
                      className={selectClassName}
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="live">Live</option>
                      <option value="ended">Ended</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-2 md:col-span-2">
                    <Label>Join URL</Label>
                    <Input
                      name="streamUrl"
                      type="url"
                      defaultValue={session.streamUrl}
                      placeholder="Zoom, YouTube Live, Google Meet, or Stream link"
                    />
                  </label>

                  <label className="flex flex-col gap-2 md:col-span-2">
                    <Label>Recording URL</Label>
                    <Input
                      name="recordingUrl"
                      type="url"
                      defaultValue={session.recordingUrl}
                      placeholder="Paste recording link after the class ends"
                    />
                  </label>

                  <div className="flex justify-end md:col-span-2">
                    <Button type="submit" variant="secondary" className="w-full min-[420px]:w-auto">
                      Save session
                    </Button>
                  </div>
                </form>
              </RetroPanel>
            ))
          )}
        </div>

        <RetroPanel
          id="create-session"
          tone="secondary"
          className="scroll-mt-24 self-start xl:sticky xl:top-24"
        >
          <div className="mb-5 flex items-center gap-2">
            <div className="rounded-[calc(var(--radius)+2px)] border-2 border-border bg-[color:var(--surface-accent)] p-2 shadow-retro-sm">
              <Plus className="size-4" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-black tracking-[-0.04em]">
                Create live class
              </h2>
              <p className="text-xs font-semibold leading-6 text-muted-foreground">
                Keep it crisp. Title, course, time, and link.
              </p>
            </div>
          </div>

          {courses.length === 0 ? (
            <p className="text-sm font-semibold leading-7 text-muted-foreground">
              Create at least one course first. Live sessions need a course so students see them in the right place.
            </p>
          ) : (
            <form action={createLiveSessionAction} className="flex flex-col gap-4">
              <label className="flex flex-col gap-2">
                <Label>Course</Label>
                <select
                  name="courseId"
                  className={selectClassName}
                  required
                  defaultValue={courses[0]?.id ?? ""}
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <Label>Title</Label>
                <Input
                  name="title"
                  placeholder="Sunday doubt solving for Real Numbers"
                  required
                  minLength={4}
                />
              </label>

              <label className="flex flex-col gap-2">
                <Label>Description</Label>
                <Textarea
                  name="description"
                  placeholder="What should students revise before joining?"
                  className="min-h-28"
                />
              </label>

              <label className="flex flex-col gap-2">
                <Label>Schedule</Label>
                <Input type="datetime-local" name="scheduledAt" required />
              </label>

              <label className="flex flex-col gap-2">
                <Label>Join URL</Label>
                <Input
                  name="streamUrl"
                  type="url"
                  placeholder="Optional for now, but add before announcing"
                />
              </label>

              <Button type="submit" className="w-full">
                Create session
              </Button>
            </form>
          )}
        </RetroPanel>
      </section>
    </div>
  );
}
