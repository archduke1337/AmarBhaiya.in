import { createLiveSessionAction } from "@/actions/dashboard";
import { requireRole } from "@/lib/appwrite/auth";
import {
  getInstructorCourseList,
  getInstructorLiveSessions,
} from "@/lib/appwrite/dashboard-data";
import { formatDateTime } from "@/lib/utils/format";

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
          <article key={session.id} className="border border-border p-4 space-y-1">
            <h3>{session.title}</h3>
            <p className="text-sm text-muted-foreground">
              {session.scheduledAt ? formatDateTime(session.scheduledAt) : "No schedule set"}
              {" · "}
              {session.status}
              {" · "}
              {session.rsvpCount} RSVPs
            </p>
          </article>
        ))}
      </section>

      <section className="border border-border p-6 space-y-4">
        <h2 className="text-xl">Start a new live session</h2>
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
            <button className="h-10 px-4 bg-foreground text-background text-sm" type="submit">
              Create session
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
