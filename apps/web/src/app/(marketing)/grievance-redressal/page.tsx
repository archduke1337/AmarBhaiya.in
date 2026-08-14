import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";

import { OWNER } from "@/lib/utils/constants";
import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "Grievance Redressal",
  description:
    "Grievance officer details and the escalation process for users of amarbhaiya.in, in line with Indian IT rules.",
};

const process = [
  {
    title: "1. Raise the concern",
    body: "Start with the contact page or email the grievance officer directly. Include your account details (if any), a clear description of the issue, and what outcome you expect.",
  },
  {
    title: "2. Acknowledgement",
    body: "Every grievance is acknowledged within 24 hours of receipt. You will receive a reference you can use for follow-ups.",
  },
  {
    title: "3. Resolution",
    body: "Grievances are addressed within 15 days of receipt, covering refunds, account access, content concerns, and data-related requests.",
  },
  {
    title: "4. Escalation",
    body: "If a resolution is not satisfactory, you may escalate to the appropriate judicial or regulatory forum in India, or reach out through the contact page for a senior review.",
  },
];

export default function GrievanceRedressalPage() {
  return (
    <div className="space-y-12 px-4 py-14 md:px-6 md:py-20 xl:space-y-16 xl:py-24">
      <section className="mx-auto max-w-6xl space-y-6">
        <SectionHeading
          eyebrow="Legal"
          title="Grievance redressal"
          description="A named, accountable channel for every concern — processed within 15 days."
          titleAs="h1"
        />

        <RetroPanel tone="secondary" className="space-y-3 p-6">
          <h2 className="font-heading text-2xl font-black tracking-[-0.05em]">Grievance officer</h2>
          <dl className="space-y-2 text-sm font-medium leading-7 text-foreground/80">
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
              <dt className="min-w-28 font-bold text-foreground">Name</dt>
              <dd>{OWNER.name}</dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
              <dt className="min-w-28 font-bold text-foreground">Role</dt>
              <dd>Founder and Grievance Officer</dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
              <dt className="min-w-28 font-bold text-foreground">Platform</dt>
              <dd>amarbhaiya.in</dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
              <dt className="min-w-28 font-bold text-foreground">Email</dt>
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
              <dt className="min-w-28 font-bold text-foreground">Response time</dt>
              <dd>Acknowledgement within 24 hours; resolution within 15 days</dd>
            </div>
          </dl>
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
          <p className="text-sm font-medium leading-7 text-foreground/80">
            For routine questions, the{" "}
            <Link href="/faq" className="font-bold text-accent hover:underline">
              FAQ
            </Link>{" "}
            and{" "}
            <Link href="/support" className="font-bold text-accent hover:underline">
              support
            </Link>{" "}
            pages are faster. Grievance escalation is for concerns that need an official,
            time-bound response.
          </p>
        </RetroPanel>
      </section>
    </div>
  );
}