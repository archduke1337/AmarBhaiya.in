import { requireAuth } from "@/lib/appwrite/auth";
import { upsertBillingInfoAction, getBillingInfo } from "@/actions/profile";
import { getUserSubscription, cancelSubscriptionAction } from "@/actions/subscriptions";
import { PageHeader } from "@/components/dashboard";

export default async function BillingInfoPage() {
  const user = await requireAuth();
  const [billing, subscription] = await Promise.all([
    getBillingInfo(user.$id),
    getUserSubscription(),
  ]);

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <PageHeader
        eyebrow="Billing"
        title="Billing Information"
        description="This information is used when purchasing courses. It will appear on your invoices and receipts."
      />

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
