import type { Metadata } from "next";
import Link from "next/link";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description:
    "Refund, cancellation and duplicate-payment policy for paid courses and subscriptions on amarbhaiya.in — timelines, eligibility and how to request.",
  alternates: { canonical: "/refund-policy" },
};

const LAST_UPDATED = "23 August 2026";

const sections = [
  {
    title: "1. Scope & payment partner",
    body: "All paid transactions are processed by Razorpay in INR. Prices on course pages are authoritative; the server validates coupon, amount and currency (create-order:19 INR-only). Refunds, when approved, go to the original payment method via Razorpay.",
  },
  {
    title: "2. Paid courses — eligibility",
    body: "Request within 7 days of purchase and before you have completed >25% of course content (progress <25%) or accessed >25% of paid lessons. Access is revoked (enrollment isActive=false, status cancelled) once a refund is processed (course-payment.ts). Consumable access (certificate already issued, >25% progress) is not refundable except for duplicate/failed payments below.",
  },
  {
    title: "3. Premium subscriptions — cancellation",
    body: "Subscriptions (subscriptions status active|expired|cancelled) can be cancelled anytime before the next billing cycle — cancellation stops future charges; the current period stays active until endDate. Expiry/cancellation revokes subscription-gated access (access.ts now checks active subscriptions). No pro-rata for the current period unless it was unused and requested within 48 hours.",
  },
  {
    title: "4. Free & public material",
    body: "Free notes (standalone_resources free), free courses (accessModel free) and public blog/community are not chargeable and not refundable by design.",
  },
  {
    title: "5. Failed, duplicate or uncaptured payments",
    body: "If you were charged but the course was not activated (pending→completed webhook:101 may retry up to Razorpay's 500), or you were charged twice, share the providerRef/order_id and paymentId. We verify via Razorpay and Appwrite (payments providerRef unique) and refund the duplicate/failed amount in full. Uncaptured/failed Razorpay statuses remain failed and are not charged.",
  },
  {
    title: "6. Coupons & discounts",
    body: "Coupons (coupons) are limited by maxUses/expiresAt/isActive and incremented transactionally (coupons.ts:348). Discounts are applied at order creation; invalid coupons are ignored (couponApplied:false) — request a correction before paying if the discount did not apply.",
  },
  {
    title: "7. How to request",
    body: "Use /contact or email the grievance officer (see /grievance-redressal) with: account email, course/subscription name, providerRef/order_id, paymentId, reason and % completion. We acknowledge in 24 hours and resolve/refund within 7 business days of approval. Refunds via Razorpay take 5-10 business days to reflect per bank.",
  },
  {
    title: "8. Non-refundable & abuse",
    body: "Abuse of refunds (repeated enroll→refund), ToS violations, or chargeback fraud may lead to account suspension and denial of future refunds. We log all payment transitions (audit_logs/payments status pending|completed|failed|refunded) for audit.",
  },
  {
    title: "9. Consumer rights (India)",
    body: "Nothing here limits your rights under the Consumer Protection Act 2019. If our resolution is unsatisfactory, you may approach the appropriate consumer forum or the Grievance Officer for escalation (15-day redressal, see /grievance-redressal). Subscriptions may also be managed via your Razorpay/bank mandate.",
  },
];

export default function RefundPolicyPage() {
  return (
    <div className="site-container space-y-12 py-12 sm:py-16 xl:space-y-16 xl:py-20">
      <section className="mx-auto max-w-6xl space-y-6">
        <SectionHeading
          eyebrow="Legal"
          title="Refund & cancellation policy"
          description="Clear, fair rules for paid courses and subscriptions — and what happens when payments fail."
          titleAs="h1"
        />
        <RetroPanel tone="secondary" className="space-y-3">
          <p className="text-sm font-medium leading-7 text-foreground/80">
            Last updated: {LAST_UPDATED} · Effective: {LAST_UPDATED}
          </p>
          <p className="text-sm font-medium leading-7 text-foreground/80">
            Need billing help? <Link href="/support" className="font-bold text-accent hover:underline">support</Link> ·{" "}
            <Link href="/contact" className="font-bold text-accent hover:underline">contact</Link> ·{" "}
            <Link href="/grievance-redressal" className="font-bold text-accent hover:underline">grievance</Link>.
          </p>
        </RetroPanel>
      </section>

      <section className="mx-auto max-w-6xl grid gap-4">
        {sections.map((item, index) => (
          <RetroPanel key={item.title} tone={index % 2 === 0 ? "card" : "muted"} className="space-y-3">
            <h2 className="font-heading text-[clamp(1.35rem,3vw,2rem)] font-black tracking-[-0.04em]">{item.title}</h2>
            <p className="text-sm font-medium leading-7 text-foreground/80">{item.body}</p>
          </RetroPanel>
        ))}
      </section>
    </div>
  );
}
