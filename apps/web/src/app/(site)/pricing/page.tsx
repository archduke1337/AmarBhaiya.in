import type { Metadata } from "next";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "Pricing — Free Notes, Courses & Premium",
  description:
    "Transparent pricing for amarbhaiya.in: free chapter-wise notes, one-time paid courses, and a premium subscription for everything else.",
  alternates: { canonical: "/pricing" },
};

const tiers = [
  {
    name: "Notes",
    tagline: "Free for every student",
    price: "₹0",
    per: "forever",
    cta: { label: "Browse free notes", href: "/notes" },
    features: [
      "Chapter-wise notes for Class 6 to 12",
      "Regularly updated study material",
      "Blog articles and study guides",
      "Public community access",
    ],
  },
  {
    name: "Courses",
    tagline: "Pay once, own it forever",
    price: "One-time",
    per: "per course",
    cta: { label: "Browse courses", href: "/courses" },
    featured: true,
    features: [
      "Structured video lessons and modules",
      "Assignments with instructor review",
      "Progress tracking and certificates",
      "Course fee shown on each course page",
    ],
  },
  {
    name: "Premium",
    tagline: "Everything on the platform",
    price: "Monthly",
    per: "subscription",
    cta: { label: "Learn about access", href: "/faq" },
    features: [
      "All premium courses and live sessions",
      "Full community and moderator support",
      "Early access to new material",
      "Cancel anytime — renewals are monthly",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="space-y-12 px-4 py-14 md:px-6 md:py-20 xl:space-y-16 xl:py-24">
      <section className="mx-auto max-w-6xl space-y-6">
        <SectionHeading
          eyebrow="Pricing"
          title="Fair prices, zero surprises"
          description="Notes stay free. Courses are one-time purchases. Premium unlocks everything for a simple monthly fee. No hidden charges at checkout."
          titleAs="h1"
        />

        <div className="grid gap-4 lg:grid-cols-3">
          {tiers.map((tier) => (
            <RetroPanel
              key={tier.name}
              tone={tier.featured ? "secondary" : "card"}
              className="flex flex-col gap-5 p-6"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h2 className="font-heading text-2xl font-black tracking-[-0.05em]">
                    {tier.name}
                  </h2>
                  {tier.featured && <Sparkles className="size-4 text-accent" aria-hidden />}
                </div>
                <p className="text-sm font-semibold text-muted-foreground">{tier.tagline}</p>
              </div>

              <p className="flex items-baseline gap-2">
                <span className="font-heading text-4xl font-black tracking-[-0.05em]">
                  {tier.price}
                </span>
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  {tier.per}
                </span>
              </p>

              <ul className="space-y-2.5" role="list">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm font-medium leading-6 text-foreground/80"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={tier.cta.href}
                className={
                  tier.featured
                    ? "mt-auto inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-4 text-sm font-bold text-accent-foreground"
                    : "mt-auto inline-flex min-h-11 items-center justify-center rounded-full border border-border/70 bg-background px-4 text-sm font-semibold text-foreground/80 transition-colors hover:text-foreground"
                }
              >
                {tier.cta.label}
              </Link>
            </RetroPanel>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl grid gap-4">
        <RetroPanel tone="muted" className="space-y-3">
          <h2 className="font-heading text-2xl font-black tracking-[-0.05em]">Refunds and billing</h2>
          <p className="text-sm font-medium leading-7 text-foreground/80">
            Paid courses come with a clear refund window, and subscription renewals can be
            cancelled before the next cycle. See the{" "}
            <Link href="/refund-policy" className="font-bold text-accent hover:underline">
              refund policy
            </Link>{" "}
            for details. Questions about a charge?{" "}
            <Link href="/support" className="font-bold text-accent hover:underline">
              Get support
            </Link>
            .
          </p>
        </RetroPanel>
      </section>
    </div>
  );
}
