import {
  applyModerationActionAction,
  resolveModerationActionAction,
} from "@/actions/operations";
import { getModeratorReports } from "@/lib/appwrite/dashboard-data";

export default async function ModeratorReportsPage() {
  const reports = await getModeratorReports();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Reports</p>
        <h1 className="text-3xl mt-2">Flagged Content Queue</h1>
      </div>

      <section className="space-y-3">
        {reports.length === 0 ? (
          <article className="border border-border p-5 text-sm text-muted-foreground">
            No flagged moderation reports found.
          </article>
        ) : null}

        {reports.map((report) => (
          <article key={report.id} className="border border-border p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg">{report.id}</h2>
                <p className="text-sm text-muted-foreground">
                  {report.entityType} · entity: {report.entityId} · target: {report.target}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Reason: {report.reason}</p>
              </div>
              <p className="text-sm uppercase tracking-widest text-muted-foreground">{report.status}</p>
            </div>

            {report.targetUserId ? (
              <form action={applyModerationActionAction} className="border border-border p-4 grid gap-3 md:grid-cols-3">
                <input type="hidden" name="targetUserId" value={report.targetUserId} />
                <input type="hidden" name="targetUserName" value={report.target} />
                <input type="hidden" name="entityType" value={report.entityType} />
                <input type="hidden" name="entityId" value={report.entityId} />
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
                    <option value="flag">Flag only</option>
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  <span>Duration (optional)</span>
                  <input
                    name="duration"
                    placeholder="24h"
                    className="h-10 w-full border border-border bg-background px-3"
                  />
                </label>

                <label className="space-y-1 text-sm md:col-span-3">
                  <span>Moderator note</span>
                  <textarea
                    name="reason"
                    required
                    minLength={3}
                    defaultValue={report.reason}
                    rows={2}
                    className="w-full border border-border bg-background px-3 py-2"
                  />
                </label>

                <div className="md:col-span-3 flex justify-end">
                  <button
                    type="submit"
                    className="h-9 px-3 border border-border text-sm hover:bg-muted"
                  >
                    Apply moderation action
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground border border-border p-3">
                This report has no target user ID, so user-level actions are unavailable.
              </p>
            )}

            {report.status === "pending" ? (
              <form action={resolveModerationActionAction} className="flex justify-end">
                <input type="hidden" name="actionId" value={report.id} />
                <button
                  type="submit"
                  className="h-9 px-3 bg-foreground text-background text-sm"
                >
                  Mark report reviewed
                </button>
              </form>
            ) : null}
          </article>
        ))}
      </section>
    </div>
  );
}
