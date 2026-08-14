import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "Legal — Policies & Compliance",
  description:
    "All amarbhaiya.in policies in one place: terms, privacy, refunds, cookies, grievance redressal, and community guidelines.",
};

const legalLinks = [
  { title: "Terms of service", body: "Rights and responsibilities while using the platform.", href: "/terms" },
  { title: "Privacy policy", body: "What data we collect, why, and how it is protected.", href: "/privacy" },
  { title: "Refund policy", body: "Refund windows for paid courses and subscriptions.", href: "/refund-policy" },
  { title: "Cookie policy", body: "Which cookies and local storage the platform uses.", href: "/cookie-policy" },
  { title: "Grievance redressal", body: "Named grievance officer and 15-day resolution process.", href: "/grievance-redressal" },
  { title: "Community guidelines", body: "The rules that keep community discussions safe.", href: "/community-guidelines" },
  { title: "For parents", body: "Safety commitments and how to raise concerns.", href: "/parents" },
];

export default function LegalPage() {
  return (
    <div className="space-y-12 px-4 py-14 md:px-6 md:py-20 xl:space-y-16 xl:py-24">
      <section className="mx-auto max-w-6xl space-y-6">
        <SectionHeading
          eyebrow="Legal"
          title="Policies and compliance"
          description="Everything you need to know about how amarbhaiya.in operates — collected in one place."
          titleAs="h1"
        />
      </section>

      <section className="mx-auto max-w-6xl grid gap-4 md:grid-cols-2">
        {legalLinks.map((item, index) => (
          <RetroPanel
            key={item.href}
            tone={index % 2 === 0 ? "card" : "muted"}
            className="group flex flex-col gap-2 p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-2xl font-black tracking-[-0.05em]">{item.title}</h2>
              <ArrowUpRight
                className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                aria-hidden
              />
            </div>
            <p className="text-sm font-medium leading-7 text-foreground/80">{item.body}</p>
            <Link
              href={item.href}
              className="mt-auto inline-flex min-h-10 items-center text-sm font-bold text-accent hover:underline"
            >
              Read the policy
            </Link>
          </RetroPanel>
        ))}
      </section>

      <section className="mx-auto max-w-6xl grid gap-4">
        <RetroPanel tone="secondary" className="space-y-3">
          <h2 className="font-heading text-2xl font-black tracking-[-0.05em]">Questions?</h2>
          <p className="text-sm font-medium leading-7 text-foreground/80">
            If a policy is unclear, ask us on the{" "}
            <Link href="/contact" className="font-bold text-accent hover:underline">
              contact page
            </Link>{" "}
            — legal questions are answered by the owner directly.
          </p>
        </RetroPanel>
      </section>
    </div>
  );
}