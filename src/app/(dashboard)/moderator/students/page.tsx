import {
  applyModerationActionAction,
  resolveModerationActionAction,
} from "@/actions/operations";
import { getModeratorStudents } from "@/lib/appwrite/dashboard-data";

export default async function ModeratorStudentsPage() {
  const students = await getModeratorStudents();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Students</p>
        <h1 className="text-3xl mt-2">Student Activity Lookup</h1>
      </div>

      <section className="space-y-3">
        {students.length === 0 ? (
          <article className="border border-border p-5 text-sm text-muted-foreground">
            No student moderation activity found yet.
          </article>
        ) : null}

        {students.map((student) => (
          <article key={student.id} className="border border-border p-5 space-y-4">
            <div>
              <h2 className="text-lg">{student.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">ID: {student.id}</p>
              <p className="text-sm text-muted-foreground mt-1">Last action: {student.latestAction}</p>
              <p className="text-sm text-muted-foreground mt-1">Reason: {student.latestReason}</p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mt-2">
                {student.status}
              </p>
            </div>

            <form action={applyModerationActionAction} className="grid gap-3 md:grid-cols-3 border border-border p-4">
              <input type="hidden" name="targetUserId" value={student.id} />
              <input type="hidden" name="targetUserName" value={student.name} />
              <input type="hidden" name="scope" value="platform" />

              <label className="space-y-1 text-sm">
                <span>Action</span>
                <select
                  name="action"
                  defaultValue="warn"
                  className="h-10 w-full border border-border bg-background px-3"
                >
                  <option value="warn">Warn</option>
                  <option value="mute">Mute</option>
                  <option value="timeout">Timeout</option>
                  <option value="remove_from_chat">Remove from chat</option>
                </select>
              </label>

              <label className="space-y-1 text-sm">
                <span>Duration (optional)</span>
                <input
                  name="duration"
                  placeholder="48h"
                  className="h-10 w-full border border-border bg-background px-3"
                />
              </label>

              <label className="space-y-1 text-sm md:col-span-3">
                <span>Reason</span>
                <textarea
                  name="reason"
                  required
                  minLength={3}
                  rows={2}
                  defaultValue={student.latestReason}
                  className="w-full border border-border bg-background px-3 py-2"
                />
              </label>

              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="h-9 px-3 border border-border text-sm hover:bg-muted"
                >
                  Apply user action
                </button>
              </div>
            </form>

            {student.status === "open" ? (
              <form action={resolveModerationActionAction} className="flex justify-end">
                <input type="hidden" name="actionId" value={student.latestActionId} />
                <button
                  type="submit"
                  className="h-9 px-3 bg-foreground text-background text-sm"
                >
                  Resolve latest action
                </button>
              </form>
            ) : null}
          </article>
        ))}
      </section>
    </div>
  );
}
