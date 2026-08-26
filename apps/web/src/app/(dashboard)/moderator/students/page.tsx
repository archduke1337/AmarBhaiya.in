import { UserX, Clock, ShieldAlert, History } from "lucide-react";

import {
  applyModerationActionFormAction,
  resolveModerationActionFormAction,
} from "@/server/actions/form-wrappers";
import { getModeratorStudents } from "@/server/appwrite/dashboard-data";
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
            <article key={student.id} className="bg-surface border border-border/40 rounded-2xl overflow-hidden">
              {/* User header */}
              <div className="flex flex-col gap-2 border-b border-border/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
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
                    {student.status === "open" ? "Open case" : "Last action"}:{" "}
                    <span className="capitalize">{student.latestAction}</span> —{" "}
                    {student.latestReason}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {student.actionCount} action{student.actionCount === 1 ? "" : "s"} on record
                    {student.lastActionAt ? ` · ${formatRelativeTime(student.lastActionAt)}` : ""}
                  </p>
                </div>

                {student.status === "open" && (
                  <form
                    action={resolveModerationActionFormAction}
                    className="shrink-0"
                  >
                    <input type="hidden" name="actionId" value={student.latestActionId} />
                    <button
                      type="submit"
                      className="inline-flex min-h-11 items-center rounded-[calc(var(--radius)+2px)] bg-foreground px-4 text-sm font-bold text-background shadow-retro-sm transition-all hover:-translate-y-px hover:translate-x-px hover:shadow-none"
                    >
                      Resolve
                    </button>
                  </form>
                )}
              </div>

              {/* Quick action form */}
              <form
                action={applyModerationActionFormAction}
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
                      className="input-field h-11"
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
                      className="input-field h-11"
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
                      className="input-field--textarea text-sm"
                    />
                  </label>

                  <div className="flex justify-end md:col-span-3">
                    <button
                      type="submit"
                      className="inline-flex min-h-11 items-center rounded-[calc(var(--radius)+2px)] border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-hover"
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
