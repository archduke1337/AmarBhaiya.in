import Link from "next/link";
import { CreditCard, Receipt, Clock } from "lucide-react";

import { requireAuth } from "@/lib/appwrite/auth";
import {
  upsertBillingInfoAction,
  getBillingInfo,
  getBillingPaymentHistory,
} from "@/actions/profile";
import { getUserSubscription, cancelSubscriptionAction } from "@/actions/subscriptions";
import { PageHeader, StatGrid, StatCard } from "@/components/dashboard";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";

export default async function BillingInfoPage() {
  await requireAuth();
  const [billing, subscription, payments] = await Promise.all([
    getBillingInfo(),
    getUserSubscription(),
    getBillingPaymentHistory(),
  ]);
  const completedPayments = payments.filter((payment) => payment.status === "completed");
  const pendingPayments = payments.filter((payment) => payment.status === "pending");
  const totalSpent = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <PageHeader
        eyebrow="Billing"
        title="Billing Information"
        description="This information is used when purchasing courses. It will appear on your invoices and receipts."
      />

      <StatGrid columns={3}>
        <StatCard
          label="Completed Payments"
          value={completedPayments.length}
          icon={Receipt}
          description={completedPayments.length > 0 ? "Successful purchases" : "No purchases yet"}
        />
        <StatCard
          label="Pending Payments"
          value={pendingPayments.length}
          icon={Clock}
          description={pendingPayments.length > 0 ? "Awaiting confirmation" : "All clear"}
        />
        <StatCard
          label="Total Spent"
          value={formatCurrency(totalSpent)}
          icon={CreditCard}
          description="Across course purchases"
        />
      </StatGrid>

      {/* Active Subscription */}
      {subscription && (
        <section className="border border-border">
          <div className="border-b border-border px-5 py-3 flex items-center justify-between">
            <h2 className="text-sm font-medium">Active Subscription</h2>
            <span className={`text-[10px] uppercase tracking-wider border px-1.5 py-0.5 ${
              subscription.status === "active"
                ? "border-emerald-500/30 text-emerald-600"
                : "border-border text-muted-foreground"
            }`}>
              {subscription.status}
            </span>
          </div>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{subscription.planName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(subscription.startDate).toLocaleDateString("en-IN")} → {new Date(subscription.endDate).toLocaleDateString("en-IN")}
              </p>
            </div>
            {subscription.status === "active" && (
              <form action={cancelSubscriptionAction}>
                <input type="hidden" name="subscriptionId" value={subscription.id} />
                <button
                  type="submit"
                  className="h-8 border border-destructive/30 px-3 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                >
                  Cancel Subscription
                </button>
              </form>
            )}
          </div>
        </section>
      )}

      <section className="border border-border">
        <div className="border-b border-border px-5 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium">Payment History</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {payments.length} recorded payment{payments.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="px-5 py-6 text-sm text-muted-foreground text-center">
            No course payment records yet.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {payment.courseSlug ? (
                      <Link
                        href={`/courses/${payment.courseSlug}`}
                        className="text-sm font-medium underline-offset-4 hover:underline"
                      >
                        {payment.courseTitle}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium">{payment.courseTitle}</p>
                    )}
                    <Badge
                      variant={payment.status === "completed" ? "default" : "outline"}
                      className="w-fit"
                    >
                      {payment.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {payment.method} · {payment.providerRef}
                    {payment.createdAt ? ` · ${formatDateTime(payment.createdAt)}` : ""}
                  </p>
                </div>

                <div className="text-sm font-medium tabular-nums">
                  {formatCurrency(payment.amount, payment.currency)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>


      <form action={upsertBillingInfoAction} className="flex flex-col gap-6">
        {/* Name */}
        <section className="border border-border">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-medium">Personal Details</h2>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">First Name</span>
              <input
                name="firstName"
                required
                placeholder="Gaurav"
                defaultValue={billing?.firstName ?? ""}
                className="h-10 border border-border bg-background px-3 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Last Name</span>
              <input
                name="lastName"
                required
                placeholder="Sharma"
                defaultValue={billing?.lastName ?? ""}
                className="h-10 border border-border bg-background px-3 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
              <span className="text-muted-foreground">Phone Number</span>
              <input
                name="phone"
                type="tel"
                required
                placeholder="+91 98765 43210"
                defaultValue={billing?.phone ?? ""}
                className="h-10 border border-border bg-background px-3 text-sm"
              />
            </label>
          </div>
        </section>

        {/* Address */}
        <section className="border border-border">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-medium">Billing Address</h2>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
              <span className="text-muted-foreground">Address Line 1</span>
              <input
                name="addressLine1"
                required
                placeholder="House/Flat No., Street, Locality"
                defaultValue={billing?.addressLine1 ?? ""}
                className="h-10 border border-border bg-background px-3 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
              <span className="text-muted-foreground">
                Address Line 2 (Optional)
              </span>
              <input
                name="addressLine2"
                placeholder="Apartment, suite, landmark"
                defaultValue={billing?.addressLine2 ?? ""}
                className="h-10 border border-border bg-background px-3 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">City</span>
              <input
                name="city"
                required
                placeholder="Mumbai"
                defaultValue={billing?.city ?? ""}
                className="h-10 border border-border bg-background px-3 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">State / Province</span>
              <input
                name="state"
                required
                placeholder="Maharashtra"
                defaultValue={billing?.state ?? ""}
                className="h-10 border border-border bg-background px-3 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Country / Region</span>
              <input
                name="country"
                required
                placeholder="India"
                defaultValue={billing?.country ?? "India"}
                className="h-10 border border-border bg-background px-3 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">ZIP / PIN Code</span>
              <input
                name="zipcode"
                required
                placeholder="400001"
                defaultValue={billing?.zipcode ?? ""}
                className="h-10 border border-border bg-background px-3 text-sm"
              />
            </label>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            className="h-10 bg-foreground px-6 text-sm text-background transition-opacity hover:opacity-90"
          >
            Save Billing Info
          </button>
        </div>
      </form>
    </div>
  );
}
