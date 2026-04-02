import { Activity, AlertTriangle, Clock, Shield } from "lucide-react";

import { resolveModerationActionAction } from "@/actions/operations";
import { getAdminModerationData } from "@/lib/appwrite/dashboard-data";
import { formatDateTime } from "@/lib/utils/format";
import { PageHeader, StatGrid, StatCard, EmptyState } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";

export default async function AdminModerationPage() {
  const data = await getAdminModerationData();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Admin · Moderation"
        title="Moderation Governance"
        description="Platform-wide overview of moderator activity, open escalations, and active enforcement."
      />

      <StatGrid columns={3}>
        <StatCard
          label="Actions Today"
          value={data.actionsToday}
          icon={Activity}
          description="Moderator actions taken today"
        />
        <StatCard
          label="Open Escalations"
          value={data.openEscalations}
          icon={AlertTriangle}
          description={
            data.openEscalations > 0
              ? "Flagged content needing admin review"
              : "No pending escalations"
          }
        />
        <StatCard
          label="Active Timeouts"
          value={data.activeTimeouts}
          icon={Clock}
          description="Users currently timed out"
        />
      </StatGrid>

      {/* Open Escalations */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Open Escalations</h2>

        {data.escalationItems.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="No open escalations"
            description="All flagged items have been resolved."
          />
        ) : (
          <div className="border border-border divide-y divide-border">
            {data.escalationItems.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {item.targetUserName}
                    </span>
                    <Badge variant="outline" className="capitalize">
                      {item.scope}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Flagged by {item.moderatorName}
                    {item.createdAt ? ` · ${formatDateTime(item.createdAt)}` : ""}
                  </p>
                  {item.reason && (
                    <p className="text-sm text-muted-foreground">
                      Reason: {item.reason}
                    </p>
                  )}
                </div>
                <form action={resolveModerationActionAction}>
                  <input type="hidden" name="actionId" value={item.id} />
                  <button
                    type="submit"
                    className="h-9 border border-border px-4 text-sm transition-colors hover:bg-muted"
                  >
                    Resolve
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Guidance panel */}
      <section className="border border-border p-6">
        <h2 className="mb-3 text-sm font-medium">Moderation Policy Notes</h2>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p>
            • Moderators handle day-to-day content moderation: warnings, mutes, timeouts, and thread management.
          </p>
          <p>
            • <strong>Escalations</strong> are flags that moderators have raised for admin attention — review these promptly.
          </p>
          <p>
            • Active timeouts expire automatically. Permanent bans require admin intervention via User Management.
          </p>
          <p>
            • All moderation actions are recorded in the Audit Trail for accountability.
          </p>
        </div>
      </section>
    </div>
  );
}
