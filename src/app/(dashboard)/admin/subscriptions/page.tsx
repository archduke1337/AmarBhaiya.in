import { requireRole } from "@/lib/appwrite/auth";
import {
  getAllSubscriptions,
  adminCreateSubscriptionAction,
  adminUpdateSubscriptionAction,
} from "@/actions/subscriptions";
import { getAdminUsers } from "@/lib/appwrite/dashboard-data";
import { PageHeader, EmptyState } from "@/components/dashboard";
import { CreditCard } from "lucide-react";
import { formatAdminUserOption } from "@/lib/utils/admin-select";

export default async function AdminSubscriptionsPage() {
  await requireRole(["admin"]);
  const [subscriptions, users] = await Promise.all([
    getAllSubscriptions(),
    getAdminUsers(),
  ]);

  const active = subscriptions.filter((s) => s.status === "active");
  const other = subscriptions.filter((s) => s.status !== "active");
  const studentOptions = users.filter((user) => user.role === "student");

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <PageHeader
        eyebrow="Admin"
        title="Subscription Management"
        description={`${active.length} active · ${other.length} expired/cancelled · ${subscriptions.length} total`}
      />

      {/* Create manual subscription */}
      <section className="border border-border p-5 space-y-4">
        <h2 className="text-sm font-medium">Grant Manual Subscription</h2>
        <form
          action={adminCreateSubscriptionAction}
          className="grid gap-3 md:grid-cols-4"
        >
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Student</span>
            <select
              name="userId"
              required
              disabled={studentOptions.length === 0}
              defaultValue=""
              className="h-9 w-full border border-border bg-background px-3 text-xs disabled:opacity-60"
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

          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Plan name</span>
            <input
              name="planName"
              required
              placeholder="e.g. Pro Monthly"
              className="h-9 w-full border border-border bg-background px-3 text-xs"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Duration (months)</span>
            <input
              name="durationMonths"
              type="number"
              min={1}
              max={24}
              defaultValue={1}
              className="h-9 w-full border border-border bg-background px-3 text-xs"
            />
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={studentOptions.length === 0}
              className="h-9 w-full bg-foreground text-background text-xs transition-opacity hover:opacity-90"
            >
              Grant Access
            </button>
          </div>
        </form>
        <p className="text-xs text-muted-foreground">
          {studentOptions.length > 0
            ? `${studentOptions.length} students available for manual subscription grants.`
            : "No student accounts are available for manual subscription grants yet."}
        </p>
      </section>

      {/* Subscriptions list */}
      {subscriptions.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No subscriptions yet"
          description="Subscriptions will appear here once students purchase plans."
        />
      ) : (
        <section className="border border-border">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-medium">
              All Subscriptions ({subscriptions.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-5 py-2 text-xs font-medium text-muted-foreground">
                    User
                  </th>
                  <th className="px-5 py-2 text-xs font-medium text-muted-foreground">
                    Plan
                  </th>
                  <th className="px-5 py-2 text-xs font-medium text-muted-foreground">
                    Start
                  </th>
                  <th className="px-5 py-2 text-xs font-medium text-muted-foreground">
                    End
                  </th>
                  <th className="px-5 py-2 text-xs font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-5 py-2 text-xs font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subscriptions.map((sub) => (
                  <tr key={sub.id}>
                    <td className="px-5 py-3">
                      <p className="text-xs font-medium">{sub.userName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {sub.userId}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-xs">{sub.planName}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {sub.startDate
                        ? new Date(sub.startDate).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {sub.endDate
                        ? new Date(sub.endDate).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block text-[10px] uppercase tracking-wider border px-1.5 py-0.5 ${
                          sub.status === "active"
                            ? "border-emerald-500/30 text-emerald-600"
                            : sub.status === "cancelled"
                              ? "border-destructive/30 text-destructive"
                              : "border-border text-muted-foreground"
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <form
                        action={adminUpdateSubscriptionAction}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="hidden"
                          name="subscriptionId"
                          value={sub.id}
                        />
                        <select
                          name="status"
                          defaultValue={sub.status}
                          className="h-7 border border-border bg-background px-2 text-[10px]"
                        >
                          <option value="active">Active</option>
                          <option value="expired">Expired</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button
                          type="submit"
                          className="h-7 border border-border px-2 text-[10px] hover:bg-muted transition-colors"
                        >
                          Update
                        </button>
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
