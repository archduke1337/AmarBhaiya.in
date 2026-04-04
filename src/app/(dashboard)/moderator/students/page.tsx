import { UserX, Clock, ShieldAlert, History } from "lucide-react";

import {
  applyModerationActionAction,
  resolveModerationActionAction,
} from "@/actions/operations";
import { getModeratorStudents } from "@/lib/appwrite/dashboard-data";
import {
  PageHeader,
  EmptyState,
  StatGrid,
  StatCard,
} from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils/format";

export default async function ModeratorStudentsPage() {
  const students = await getModeratorStudents();

  const openCases = students.filter((s) => s.status === "open").length;
  const resolvedCases = students.filter((s) => s.status === "resolved").length;
  const totalActions = students.reduce((sum, student) => sum + student.actionCount, 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Moderator · Students"
        title="Student Activity Lookup"
        description={`${students.length} users with moderation history — ${openCases} open cases`}
      />

      <StatGrid columns={3}>
        <StatCard
          label="Open Cases"
          value={openCases}
          icon={ShieldAlert}
          description={openCases > 0 ? "Need moderator attention" : "No active cases"}
        />
        <StatCard
          label="Resolved Cases"
          value={resolvedCases}
          icon={Clock}
          description="Previously reviewed users"
        />
        <StatCard
          label="Actions Tracked"
          value={totalActions}
          icon={History}
          description="Across all listed users"
        />
      </StatGrid>

      {students.length === 0 ? (
        <EmptyState
          icon={UserX}
          title="No moderation activity"
          description="No students have been moderated yet. Actions taken against users will appear here."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {students.map((student) => (
            <article key={student.id} className="border border-border">
              {/* User header */}
              <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-medium">{student.name}</h2>
                    <Badge
                      variant={student.status === "open" ? "default" : "outline"}
                    >
                      {student.status}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {student.latestScope}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last action: <span className="capitalize">{student.latestAction}</span> — {student.latestReason}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {student.actionCount} action{student.actionCount === 1 ? "" : "s"} on record
                    {student.lastActionAt ? ` · ${formatRelativeTime(student.lastActionAt)}` : ""}
                  </p>
                </div>

                {student.status === "open" && (
                  <form
                    action={resolveModerationActionAction}
                    className="shrink-0"
                  >
                    <input type="hidden" name="actionId" value={student.latestActionId} />
                    <button
                      type="submit"
                      className="h-8 bg-foreground px-3 text-xs text-background transition-opacity hover:opacity-90"
                    >
                      Resolve
                    </button>
                  </form>
                )}
              </div>

              {/* Quick action form */}
              <form
                action={applyModerationActionAction}
                className="bg-muted/20 px-5 py-4"
              >
                <input type="hidden" name="targetUserId" value={student.id} />
                <input type="hidden" name="targetUserName" value={student.name} />
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
                    </select>
                  </label>

                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="text-muted-foreground">
                      Duration (optional)
                    </span>
                    <input
                      name="duration"
                      placeholder="48h"
                      className="h-9 border border-border bg-background px-3 text-sm"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5 text-sm md:col-span-3">
                    <span className="text-muted-foreground">Reason</span>
                    <textarea
                      name="reason"
                      required
                      minLength={3}
                      rows={2}
                      defaultValue={student.latestReason}
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
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
