import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "Legal — Policies & Compliance",
  description:
    "All amarbhaiya.in policies: terms, privacy, refund & cancellation, cookies, grievance redressal (IT Rules 2021), community guidelines and parents safety.",
  alternates: { canonical: "/legal" },
};

const LAST_UPDATED = "23 August 2026";

const legalLinks = [
  { title: "Terms of service", body: "Rights, duties, payments, IP, termination and Mumbai jurisdiction. Updated 23 Aug 2026.", href: "/terms" },
  { title: "Privacy policy", body: "What we collect (incl. Appwrite/Razorpay), why, retention, your DPDP Act 2023 rights.", href: "/privacy" },
  { title: "Refund & cancellation", body: "7-day course window (<25% progress), subscription till endDate, Razorpay timelines.", href: "/refund-policy" },
  { title: "Cookie policy", body: "a_session_{PROJECT_ID} + theme + rate-limit; no ad tracking; how to clear.", href: "/cookie-policy" },
  { title: "Grievance redressal", body: "IT Rules 2021: named officer Amarnath Pandey, 24h ack, 15-day resolve, 36h takedown.", href: "/grievance-redressal" },
  { title: "Community guidelines", body: "8 rules, moderation warn→ban, how to report and appeal.", href: "/community-guidelines" },
  { title: "For parents", body: "Safety, supervision, guardian consent for <18, how to raise concerns.", href: "/parents" },
];

export default function LegalPage() {
  return (
    <div className="site-container space-y-12 py-12 sm:py-16 xl:space-y-16 xl:py-20">
      <section className="mx-auto max-w-6xl space-y-6">
        <SectionHeading
          eyebrow="Legal"
          title="Policies and compliance"
          description="Every policy that governs amarbhaiya.in — in force from 23 August 2026. For questions, the owner answers directly."
          titleAs="h1"
        />
        <RetroPanel tone="secondary" className="space-y-2">
          <p className="text-sm font-medium leading-7 text-foreground/80">Last updated: {LAST_UPDATED}</p>
          <p className="text-xs font-medium leading-6 text-foreground/60">
            Nothing here is legal advice; the governing texts are the IT Act 2000, IT Rules 2021, DPDP Act 2023 and Consumer Protection Act 2019.
          </p>
        </RetroPanel>
      </section>

      <section className="mx-auto max-w-6xl grid gap-4 md:grid-cols-2">
        {legalLinks.map((item, index) => (
          <RetroPanel
            key={item.href}
            tone={index % 2 === 0 ? "card" : "muted"}
            className="group flex flex-col gap-2 p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-[clamp(1.35rem,3vw,2rem)] font-black tracking-[-0.04em]">{item.title}</h2>
              <ArrowUpRight
                className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                aria-hidden="true"
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
          <h2 className="font-heading text-[clamp(1.35rem,3vw,2rem)] font-black tracking-[-0.04em]">Questions? Escalation</h2>
          <p className="text-sm font-medium leading-7 text-foreground/80">
            Start with <Link href="/contact" className="font-bold text-accent hover:underline">contact</Link> or{" "}
            <Link href="/support" className="font-bold text-accent hover:underline">support</Link>. For a time-bound grievance (including data/correction/deletion, payments, takedowns) use{" "}
            <Link href="/grievance-redressal" className="font-bold text-accent hover:underline">grievance redressal</Link> — acknowledged 24h, resolved 15 days, appeal to courts/DP Board.
          </p>
        </RetroPanel>
      </section>
    </div>
  );
}
