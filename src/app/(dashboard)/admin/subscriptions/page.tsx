import { requireRole } from "@/lib/appwrite/auth";
import { getAllSubscriptions } from "@/actions/subscriptions";
import {
  adminCreateSubscriptionFormAction,
  adminUpdateSubscriptionFormAction,
} from "@/actions/form-wrappers";
import { getAdminUsers } from "@/lib/appwrite/dashboard-data";
import { PageHeader, EmptyState } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, CheckCircle2, XCircle, Clock } from "lucide-react";
import { formatAdminUserOption } from "@/lib/utils/admin-select";
import { formatDate } from "@/lib/utils/format";

export default async function AdminSubscriptionsPage() {
  await requireRole(["admin"]);
  const [subscriptions, users] = await Promise.all([
    getAllSubscriptions(),
    getAdminUsers(),
  ]);

  const active = subscriptions.filter((s) => s.status === "active");
  const expired = subscriptions.filter((s) => s.status === "expired");
  const cancelled = subscriptions.filter((s) => s.status === "cancelled");
  const studentOptions = users.filter((user) => user.role === "student");

  return (
    <div className="flex flex-col gap-8 max-w-6xl">
      <PageHeader
        eyebrow="Admin"
        title="Subscription Management"
        description={`${active.length} active · ${cancelled.length} cancelled · ${expired.length} expired · ${subscriptions.length} total`}
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border/40 bg-surface p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="size-4 text-emerald-500" />
            Active
          </div>
          <p className="mt-1 text-2xl font-black tabular-nums">{active.length}</p>
        </div>
        <div className="rounded-2xl border border-border/40 bg-surface p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Clock className="size-4 text-amber-500" />
            Expired
          </div>
          <p className="mt-1 text-2xl font-black tabular-nums">{expired.length}</p>
        </div>
        <div className="rounded-2xl border border-border/40 bg-surface p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <XCircle className="size-4 text-destructive" />
            Cancelled
          </div>
          <p className="mt-1 text-2xl font-black tabular-nums">{cancelled.length}</p>
        </div>
        <div className="rounded-2xl border border-border/40 bg-surface p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CreditCard className="size-4 text-muted-foreground" />
            Total
          </div>
          <p className="mt-1 text-2xl font-black tabular-nums">{subscriptions.length}</p>
        </div>
      </div>

      {/* Create manual subscription */}
      <section className="overflow-hidden rounded-2xl border border-border/40 bg-surface">
        <div className="flex items-center gap-2 border-b border-border/40 bg-surface-hover px-5 py-3.5">
          <Plus className="size-4 text-muted-foreground" />
          <div>
            <h2 className="font-heading text-sm font-black uppercase tracking-[0.12em]">
              Grant Manual Subscription
            </h2>
            <p className="text-xs text-muted-foreground">
              Manually grant subscription access to a student.
            </p>
          </div>
        </div>
        <form
          action={adminCreateSubscriptionFormAction}
          className="flex flex-col gap-4 p-5"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-1.5">
              <Label htmlFor="sub-user">Student</Label>
              <select
                id="sub-user"
                name="userId"
                required
                disabled={studentOptions.length === 0}
                defaultValue=""
                className="input-field--select w-full h-9 text-sm disabled:opacity-60"
              >
                <option value="" disabled>
                  {studentOptions.length > 0 ? "Select student" : "No students available"}
                </option>
                {studentOptions.map((user) => (
                  <option key={user.id} value={user.id}>
                    {formatAdminUserOption(user)}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <Label htmlFor="sub-plan">Plan name</Label>
              <Input
                id="sub-plan"
                name="planName"
                required
                placeholder="e.g. Pro Monthly"
              />
            </label>

            <label className="space-y-1.5">
              <Label htmlFor="sub-duration">Duration (months)</Label>
              <Input
                id="sub-duration"
                name="durationMonths"
                type="number"
                min={1}
                max={24}
                defaultValue={1}
              />
            </label>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {studentOptions.length > 0
                ? `${studentOptions.length} students available for manual subscription grants.`
                : "No student accounts are available for manual subscription grants yet."}
            </p>
            <Button type="submit" size="sm" disabled={studentOptions.length === 0}>
              <CreditCard className="size-3.5" />
              Grant Access
            </Button>
          </div>
        </form>
      </section>

      {/* Subscriptions list */}
      {subscriptions.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No subscriptions yet"
          description="Subscriptions will appear here once students purchase plans."
        />
      ) : (
        <section className="overflow-hidden rounded-2xl border border-border/40 bg-surface">
          <div className="flex items-center justify-between border-b border-border/40 bg-surface-hover px-5 py-3.5">
            <div>
              <h2 className="font-heading text-sm font-black uppercase tracking-[0.12em]">
                All Subscriptions
              </h2>
              <p className="text-xs text-muted-foreground">{subscriptions.length} records</p>
            </div>
            <Badge variant="outline">{subscriptions.length} total</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-left text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">Start</th>
                  <th className="px-5 py-3">End</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold">{sub.userName}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {sub.userId}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium">{sub.planName}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {sub.startDate ? formatDate(sub.startDate) : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {sub.endDate ? formatDate(sub.endDate) : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={sub.status === "active" ? "default" : "outline"}
                        className="uppercase text-[10px]"
                      >
                        {sub.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <form
                        action={adminUpdateSubscriptionFormAction}
                        className="flex items-center gap-2"
                      >
                        <input type="hidden" name="subscriptionId" value={sub.id} />
                        <select
                          name="status"
                          defaultValue={sub.status}
                          className="input-field--select h-8 text-[10px]"
                        >
                          <option value="active">Active</option>
                          <option value="expired">Expired</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <Button type="submit" size="xs" variant="secondary">
                          Update
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
