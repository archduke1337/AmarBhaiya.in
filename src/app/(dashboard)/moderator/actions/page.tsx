import {
  applyModerationActionAction,
  resolveModerationActionAction,
} from "@/actions/operations";
import {
  getModeratorReports,
  getModeratorStudents,
} from "@/lib/appwrite/dashboard-data";

const moderationActions = [
  "warn",
  "mute",
  "timeout",
  "delete_post",
  "pin",
  "unpin",
  "remove_from_chat",
  "flag",
] as const;

export default async function ModeratorActionsPage() {
  const [reports, students] = await Promise.all([
    getModeratorReports(),
    getModeratorStudents(),
  ]);

  const pendingReports = reports.filter((report) => report.status === "pending");

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Moderator Actions</p>
        <h1 className="text-3xl md:text-4xl">Moderation Action Center</h1>
        <p className="text-muted-foreground max-w-3xl">
          Execute moderation decisions, resolve flagged items, and keep the community safe.
        </p>
      </section>

      <section className="grid xl:grid-cols-2 gap-5">
        <article className="border border-border p-6 space-y-4">
          <h2 className="text-xl">Resolve flagged report</h2>
          {pendingReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending reports right now.</p>
          ) : (
            <form action={resolveModerationActionAction} className="space-y-3">
              <select
                name="actionId"
                className="w-full h-11 border border-border bg-background px-3"
                required
                defaultValue={pendingReports[0]?.id ?? ""}
              >
                {pendingReports.map((report) => (
                  <option key={report.id} value={report.id}>
                    {report.id} - {report.entityType} - {report.reason}
                  </option>
                ))}
              </select>
              <button type="submit" className="h-10 px-4 bg-foreground text-background text-sm">
                Mark resolved
              </button>
            </form>
          )}

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Pending queue</p>
            {pendingReports.slice(0, 6).map((report) => (
              <p key={report.id} className="text-sm text-muted-foreground">
                {report.id} - {report.target}
              </p>
            ))}
          </div>
        </article>

        <article className="border border-border p-6 space-y-4">
          <h2 className="text-xl">Issue moderation action</h2>
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No student records available. Use manual target fields once records appear.
            </p>
          ) : (
            <form action={applyModerationActionAction} className="space-y-3">
              <select
                name="targetUserId"
                className="w-full h-11 border border-border bg-background px-3"
                required
                defaultValue={students[0]?.id ?? ""}
              >
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.id})
                  </option>
                ))}
              </select>

              <input
                name="targetUserName"
                className="w-full h-11 border border-border bg-background px-3"
                placeholder="Target display name (optional)"
              />

              <div className="grid md:grid-cols-2 gap-3">
                <select
                  name="action"
                  className="w-full h-11 border border-border bg-background px-3"
                  defaultValue="warn"
                >
                  {moderationActions.map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))}
                </select>
                <select
                  name="scope"
                  className="w-full h-11 border border-border bg-background px-3"
                  defaultValue="platform"
                >
                  <option value="platform">Platform</option>
                  <option value="course">Course</option>
                </select>
              </div>

              <textarea
                name="reason"
                className="w-full min-h-24 border border-border bg-background px-3 py-2"
                placeholder="Reason for this action"
                required
                minLength={3}
              />

              <div className="grid md:grid-cols-3 gap-3">
                <input
                  name="duration"
                  className="w-full h-11 border border-border bg-background px-3"
                  placeholder="Duration (example: 24h)"
                />
                <input
                  name="entityType"
                  className="w-full h-11 border border-border bg-background px-3"
                  placeholder="Entity type (thread, reply)"
                />
                <input
                  name="entityId"
                  className="w-full h-11 border border-border bg-background px-3"
                  placeholder="Entity ID"
                />
              </div>

              <button type="submit" className="h-10 px-4 bg-foreground text-background text-sm">
                Create action
              </button>
            </form>
          )}
        </article>
      </section>
    </div>
  );
}