import { Flag } from "lucide-react";

import {
  applyModerationActionAction,
  resolveModerationActionAction,
} from "@/actions/operations";
import { getModeratorReports } from "@/lib/appwrite/dashboard-data";
import { PageHeader, EmptyState } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";

export default async function ModeratorReportsPage() {
  const reports = await getModeratorReports();

  const pending = reports.filter((r) => r.status === "pending").length;
  const reviewed = reports.filter((r) => r.status === "reviewed").length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Moderator · Reports"
        title="Flagged Content Queue"
        description={`${reports.length} total reports — ${pending} pending review, ${reviewed} resolved`}
      />

      {reports.length === 0 ? (
        <EmptyState
          icon={Flag}
          title="No flagged reports"
          description="The content queue is clear. Reports from the community will appear here when flagged."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {reports.map((report) => (
            <article
              key={report.id}
              className="border border-border"
            >
              {/* Report header */}
              <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {report.entityType}
                    </span>
                    <Badge
                      variant={report.status === "pending" ? "default" : "outline"}
                    >
                      {report.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Target: {report.target} · Entity: {report.entityId}
                  </p>
                </div>

                {report.status === "pending" && (
                  <form
                    action={resolveModerationActionAction}
                    className="shrink-0"
                  >
                    <input type="hidden" name="actionId" value={report.id} />
                    <button
                      type="submit"
                      className="h-8 bg-foreground px-3 text-xs text-background transition-opacity hover:opacity-90"
                    >
                      Mark reviewed
                    </button>
                  </form>
                )}
              </div>

              {/* Report reason */}
              <div className="px-5 py-3">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Reason:</span>{" "}
                  {report.reason}
                </p>
              </div>

              {/* Quick action form */}
              {report.targetUserId && (
                <form
                  action={applyModerationActionAction}
                  className="border-t border-border bg-muted/20 px-5 py-4"
                >
                  <input type="hidden" name="targetUserId" value={report.targetUserId} />
                  <input type="hidden" name="targetUserName" value={report.target} />
                  <input type="hidden" name="entityType" value={report.entityType} />
                  <input type="hidden" name="entityId" value={report.entityId} />
                  <input type="hidden" name="scope" value="platform" />

                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="flex flex-col gap-1.5 text-sm">
                      <span className="text-muted-foreground">Action</span>
                      <select
                        name="action"
                        defaultValue="warn"
                        className="h-9 border border-border bg-background px-3 text-sm"
                      >
                        <option value="warn">Warn</option>
                        <option value="mute">Mute</option>
                        <option value="timeout">Timeout</option>
                        <option value="remove_from_chat">Remove from chat</option>
                        <option value="flag">Flag only</option>
                      </select>
                    </label>

                    <label className="flex flex-col gap-1.5 text-sm">
                      <span className="text-muted-foreground">
                        Duration (optional)
                      </span>
                      <input
                        name="duration"
                        placeholder="24h"
                        className="h-9 border border-border bg-background px-3 text-sm"
                      />
                    </label>

                    <label className="flex flex-col gap-1.5 text-sm md:col-span-3">
                      <span className="text-muted-foreground">
                        Moderator note
                      </span>
                      <textarea
                        name="reason"
                        required
                        minLength={3}
                        defaultValue={report.reason}
                        rows={2}
                        className="border border-border bg-background px-3 py-2 text-sm"
                      />
                    </label>

                    <div className="flex justify-end md:col-span-3">
                      <button
                        type="submit"
                        className="h-8 border border-border px-3 text-xs transition-colors hover:bg-muted"
                      >
                        Apply action
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
