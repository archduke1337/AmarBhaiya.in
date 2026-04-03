import {
  createLiveSessionAction,
  updateLiveSessionAction,
} from "@/actions/dashboard";
import { deleteLiveSessionAction } from "@/actions/delete";
import { requireRole } from "@/lib/appwrite/auth";
import {
  getInstructorCourseList,
  getInstructorLiveSessions,
} from "@/lib/appwrite/dashboard-data";
import { formatDateTime } from "@/lib/utils/format";

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

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Live Sessions</p>
        <h1 className="text-3xl mt-2">Schedule and Broadcast</h1>
      </div>

      <section className="border border-border p-6 space-y-4">
        <h2 className="text-xl">Upcoming</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No upcoming sessions found.
          </p>
        ) : null}

        {sessions.map((session) => (
          <article key={session.id} className="border border-border p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h3>{session.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {session.scheduledAt ? formatDateTime(session.scheduledAt) : "No schedule set"}
                  {" · "}
                  {session.status}
                  {" · "}
                  {session.rsvpCount} RSVPs
                </p>
                {session.description ? (
                  <p className="text-sm text-muted-foreground">
                    {session.description}
                  </p>
                ) : null}
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {session.streamUrl ? (
                    <a
                      href={session.streamUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-4"
                    >
                      Open join link
                    </a>
                  ) : (
                    <span>No join link yet</span>
                  )}
                  {session.recordingUrl ? (
                    <a
                      href={session.recordingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-4"
                    >
                      Open recording
                    </a>
                  ) : null}
                </div>
              </div>
              <form action={deleteLiveSessionAction}>
                <input type="hidden" name="sessionId" value={session.id} />
                <button
                  type="submit"
                  className="h-8 border border-destructive/30 px-3 text-xs text-destructive transition-colors hover:bg-destructive/10"
                >
                  Delete
                </button>
              </form>
            </div>

            <form action={updateLiveSessionAction} className="grid gap-3 border-t border-border pt-3 md:grid-cols-2">
              <input type="hidden" name="sessionId" value={session.id} />

              <label className="space-y-1 text-sm md:col-span-2">
                <span>Session title</span>
                <input
                  name="title"
                  required
                  minLength={4}
                  defaultValue={session.title}
                  className="h-10 w-full border border-border bg-background px-3"
                />
              </label>

              <label className="space-y-1 text-sm md:col-span-2">
                <span>Description</span>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={session.description}
                  className="w-full border border-border bg-background px-3 py-2"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span>Schedule</span>
                <input
                  type="datetime-local"
                  name="scheduledAt"
                  required
                  defaultValue={toDateTimeLocalValue(session.scheduledAt)}
                  className="w-full h-10 border border-border bg-background px-3"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span>Status</span>
                <select
                  name="status"
                  defaultValue={session.status}
                  className="w-full h-10 border border-border bg-background px-3"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="live">Live</option>
                  <option value="ended">Ended</option>
                </select>
              </label>

              <label className="space-y-1 text-sm md:col-span-2">
                <span>Join URL</span>
                <input
                  name="streamUrl"
                  type="url"
                  defaultValue={session.streamUrl}
                  placeholder="https://..."
                  className="h-10 w-full border border-border bg-background px-3"
                />
              </label>

              <label className="space-y-1 text-sm md:col-span-2">
                <span>Recording URL</span>
                <input
                  name="recordingUrl"
                  type="url"
                  defaultValue={session.recordingUrl}
                  placeholder="https://..."
                  className="h-10 w-full border border-border bg-background px-3"
                />
              </label>

              <div className="flex justify-end md:col-span-2">
                <button
                  type="submit"
                  className="h-9 px-3 border border-border text-sm hover:bg-muted"
                >
                  Save session
                </button>
              </div>
            </form>
          </article>
        ))}
      </section>

      <section className="border border-border p-6 space-y-4">
        <h2 className="text-xl">Schedule a new live session</h2>
        {courses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Create at least one course first to schedule live sessions.
          </p>
        ) : (
          <form action={createLiveSessionAction} className="space-y-3">
            <select
              name="courseId"
              className="w-full h-11 border border-border bg-background px-3"
              required
              defaultValue={courses[0]?.id ?? ""}
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <input
              name="title"
              className="w-full h-11 border border-border bg-background px-3"
              placeholder="Session title"
              required
              minLength={4}
            />
            <textarea
              name="description"
              className="w-full min-h-24 border border-border bg-background px-3 py-2"
              placeholder="Session description"
            />
            <input
              type="datetime-local"
              name="scheduledAt"
              className="w-full h-11 border border-border bg-background px-3"
              required
            />
            <input
              name="streamUrl"
              type="url"
              className="w-full h-11 border border-border bg-background px-3"
              placeholder="Optional join URL (Zoom, YouTube Live, Stream call, etc.)"
            />
            <button className="h-10 px-4 bg-foreground text-background text-sm" type="submit">
              Create session
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
