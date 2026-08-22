import type { Metadata } from "next";
import Link from "next/link";
import { Mail, ShieldAlert } from "lucide-react";

import { OWNER } from "@/lib/utils/constants";
import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "Grievance Redressal — IT Rules 2021",
  description:
    "Grievance Officer for amarbhaiya.in under IT Rules 2021: contact, 24h acknowledgement, 15-day resolution, 36h content takedown and escalation.",
};

const LAST_UPDATED = "23 August 2026";

const process = [
  {
    title: "1. Raise the concern",
    body: "Email the Grievance Officer or use /contact. Include: your account email/ID (if any), date, providerRef/order_id or URL of content (for takedown), clear description, relief sought, and attachments. Anonymous reports are reviewed but time-bound responses need contact details.",
  },
  {
    title: "2. Acknowledgement — 24 hours",
    body: "Every grievance is acknowledged within 24 hours with a reference number you can quote in follow-ups. This is the IT Rules 2021 clock start.",
  },
  {
    title: "3. Resolution — 15 days (36 hours for takedown)",
    body: "Standard grievances (refunds, access, data correction/deletion, billing) are resolved within 15 days of receipt. For content that violates law/IP/privacy or IT Rules 2021, we act within 36 hours of a valid notice (remove/disable access) and inform you. Complex cases may take the full 15 days with interim updates.",
  },
  {
    title: "4. Appeal & escalation",
    body: "If you disagree, reply to the reference thread for senior review. You may also approach the appropriate court, consumer forum (Consumer Protection Act 2019), or the Data Protection Board (DPDP Act 2023) for data matters. For intermediary matters, the Grievance Appellate Committee under IT Rules 2021 is available after our response.",
  },
];

export default function GrievanceRedressalPage() {
  return (
    <div className="space-y-12 px-4 py-14 md:px-6 md:py-20 xl:space-y-16 xl:py-24">
      <section className="mx-auto max-w-6xl space-y-6">
        <SectionHeading
          eyebrow="Legal"
          title="Grievance redressal — IT Rules 2021"
          description="A named, accountable channel for every concern — 24h ack, 15-day resolution, 36h takedown where required."
          titleAs="h1"
        />

        <RetroPanel tone="secondary" className="space-y-3 p-6">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-accent" aria-hidden />
            <h2 className="font-heading text-2xl font-black tracking-[-0.05em]">Grievance Officer (IT Rules 2021, Rule 3(2))</h2>
          </div>
          <dl className="space-y-2 text-sm font-medium leading-7 text-foreground/80">
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
              <dt className="min-w-36 font-bold text-foreground">Name</dt>
              <dd>{OWNER.name}</dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
              <dt className="min-w-36 font-bold text-foreground">Role</dt>
              <dd>Founder & Grievance Officer, amarbhaiya.in</dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
              <dt className="min-w-36 font-bold text-foreground">Platform</dt>
              <dd>amarbhaiya.in</dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
              <dt className="min-w-36 font-bold text-foreground">Email (grievance)</dt>
              <dd>
                <a
                  href={`mailto:${OWNER.email}`}
                  className="inline-flex items-center gap-1.5 font-bold text-accent hover:underline"
                >
                  <Mail className="size-3.5" aria-hidden />
                  {OWNER.email}
                </a>
              </dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
              <dt className="min-w-36 font-bold text-foreground">Alternate</dt>
              <dd>
                <Link href="/contact" className="font-bold text-accent hover:underline">
                  /contact
                </Link>{" "}
                (select “Grievance”)
              </dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
              <dt className="min-w-36 font-bold text-foreground">Timelines</dt>
              <dd>Ack 24h · Resolve 15 days · Takedown 36h (where IT Rules apply) · Last updated {LAST_UPDATED}</dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
              <dt className="min-w-36 font-bold text-foreground">Address</dt>
              <dd>India — exact postal address furnished on request to the grievance email (as the platform operates primarily online).</dd>
            </div>
          </dl>
          <p className="text-xs font-medium leading-6 text-foreground/60">
            Publishing this contact is required by Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.
          </p>
        </RetroPanel>
      </section>

      <section className="mx-auto max-w-6xl grid gap-4">
        <h2 className="font-heading text-2xl font-black tracking-[-0.05em]">How it works</h2>
        {process.map((item, index) => (
          <RetroPanel key={item.title} tone={index % 2 === 0 ? "card" : "muted"} className="space-y-3">
            <h3 className="font-heading text-xl font-black tracking-[-0.04em]">{item.title}</h3>
            <p className="text-sm font-medium leading-7 text-foreground/80">{item.body}</p>
          </RetroPanel>
        ))}
      </section>

      <section className="mx-auto max-w-6xl grid gap-4">
        <RetroPanel tone="secondary" className="space-y-3">
          <h3 className="font-heading text-xl font-black tracking-[-0.04em]">What to include</h3>
          <ul className="grid gap-2 list-disc pl-5 text-sm font-medium leading-7 text-foreground/80" role="list">
            <li>Account email and userId if logged in; order_id/providerRef + paymentId for billing.</li>
            <li>For content takedown: exact URL(s), why it violates law/policy, and your relationship to the content.</li>
            <li>For data requests (access/correction/deletion under DPDP Act 2023): userId and specific data.</li>
          </ul>
        </RetroPanel>
        <RetroPanel tone="card" className="space-y-3">
          <p className="text-sm font-medium leading-7 text-foreground/80">
            Routine help is faster via <Link href="/faq" className="font-bold text-accent hover:underline">FAQ</Link> and{" "}
            <Link href="/support" className="font-bold text-accent hover:underline">support</Link>. Grievance is the time-bound, officer-attended track — use it when you need an official record or when a normal ticket did not resolve your concern.
          </p>
        </RetroPanel>
      </section>
    </div>
  );
}
