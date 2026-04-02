import { Activity, AlertTriangle, Clock } from "lucide-react";

import { getAdminModerationData } from "@/lib/appwrite/dashboard-data";
import { PageHeader, StatGrid, StatCard } from "@/components/dashboard";

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
