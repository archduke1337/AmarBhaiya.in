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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RetroPanel } from "@/components/marketing/retro-panel";

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
    <div className="flex max-w-5xl flex-col gap-8">
      <PageHeader
        eyebrow="Billing"
        title="Payment records aur billing details ek jagah."
        description="Course purchase ke time yeh details receipts aur invoices mein use hoti hain. Short, accurate, aur India-friendly rakho."
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
        <RetroPanel tone="secondary" className="space-y-0 p-0">
          <div className="flex items-center justify-between border-b-2 border-border px-5 py-3">
            <h2 className="font-heading text-sm font-black uppercase tracking-[0.14em]">
              Active subscription
            </h2>
            <Badge variant={subscription.status === "active" ? "default" : "outline"}>
              {subscription.status}
            </Badge>
          </div>
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-heading text-xl font-black tracking-[-0.04em]">
                {subscription.planName}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {new Date(subscription.startDate).toLocaleDateString("en-IN")} → {new Date(subscription.endDate).toLocaleDateString("en-IN")}
              </p>
            </div>
            {subscription.status === "active" && (
              <form action={cancelSubscriptionAction}>
                <input type="hidden" name="subscriptionId" value={subscription.id} />
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                >
                  Cancel subscription
                </Button>
              </form>
            )}
          </div>
        </RetroPanel>
      )}

      <RetroPanel tone="card" className="space-y-0 p-0">
        <div className="flex items-center justify-between border-b-2 border-border px-5 py-3">
          <div>
            <h2 className="font-heading text-sm font-black uppercase tracking-[0.14em]">
              Payment history
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {payments.length} recorded payment{payments.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="px-5 py-6 text-center text-sm font-medium text-muted-foreground">
            Abhi course payment record nahi hai.
          </div>
        ) : (
          <div className="divide-y-2 divide-border">
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
      </RetroPanel>


      <form action={upsertBillingInfoAction} className="flex flex-col gap-6">
        {/* Name */}
        <RetroPanel tone="card" className="space-y-0 p-0">
          <div className="border-b-2 border-border px-5 py-3">
            <h2 className="font-heading text-sm font-black uppercase tracking-[0.14em]">
              Personal details
            </h2>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                name="firstName"
                required
                placeholder="Gaurav"
                defaultValue={billing?.firstName ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                name="lastName"
                required
                placeholder="Sharma"
                defaultValue={billing?.lastName ?? ""}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder="+91 98765 43210"
                defaultValue={billing?.phone ?? ""}
              />
            </div>
          </div>
        </RetroPanel>

        {/* Address */}
        <RetroPanel tone="card" className="space-y-0 p-0">
          <div className="border-b-2 border-border px-5 py-3">
            <h2 className="font-heading text-sm font-black uppercase tracking-[0.14em]">
              Billing address
            </h2>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="addressLine1">Address line 1</Label>
              <Input
                id="addressLine1"
                name="addressLine1"
                required
                placeholder="House/Flat No., Street, Locality"
                defaultValue={billing?.addressLine1 ?? ""}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="addressLine2">Address line 2 (optional)</Label>
              <Input
                id="addressLine2"
                name="addressLine2"
                placeholder="Apartment, suite, landmark"
                defaultValue={billing?.addressLine2 ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                required
                placeholder="Mumbai"
                defaultValue={billing?.city ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                name="state"
                required
                placeholder="Maharashtra"
                defaultValue={billing?.state ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                name="country"
                required
                placeholder="India"
                defaultValue={billing?.country ?? "India"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipcode">PIN code</Label>
              <Input
                id="zipcode"
                name="zipcode"
                required
                placeholder="400001"
                defaultValue={billing?.zipcode ?? ""}
              />
            </div>
          </div>
        </RetroPanel>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="secondary"
            size="lg"
          >
            Save billing info
          </Button>
        </div>
      </form>
    </div>
  );
}
