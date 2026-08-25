import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle, LifeBuoy, BookOpen } from "lucide-react";

import { OWNER } from "@/lib/utils/constants";
import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "Support — Help & Contact",
  description:
    "Get help with accounts, payments, courses, and technical issues on amarbhaiya.in.",
  alternates: { canonical: "/support" },
};

const channels = [
  {
    icon: Mail,
    title: "Email support",
    body: `Write to ${OWNER.email} for account, billing, and general questions.`,
    action: { label: "Email us", href: `mailto:${OWNER.email}` },
  },
  {
    icon: MessageCircle,
    title: "Contact form",
    body: "Use the contact form for structured requests — support, reports, and business enquiries.",
    action: { label: "Open contact form", href: "/contact" },
  },
  {
    icon: BookOpen,
    title: "FAQ",
    body: "Most common questions about notes, courses, payments, and certificates are already answered.",
    action: { label: "Read the FAQ", href: "/faq" },
  },
  {
    icon: LifeBuoy,
    title: "Grievance redressal",
    body: "Serious or unresolved issues are escalated to the grievance officer with a defined response time.",
    action: { label: "Escalate a grievance", href: "/grievance-redressal" },
  },
];

export default function SupportPage() {
  return (
    <div className="space-y-12 px-4 py-14 md:px-6 md:py-20 xl:space-y-16 xl:py-24">
      <section className="mx-auto max-w-6xl space-y-6">
        <SectionHeading
          eyebrow="Support"
          title="We reply, and we reply fast"
          description="Choose the channel that fits. Billing and technical issues are prioritised, and every message gets a human response."
          titleAs="h1"
        />

        <div className="grid gap-4 md:grid-cols-2">
          {channels.map((channel, index) => (
            <RetroPanel key={channel.title} tone={index % 2 === 0 ? "card" : "muted"} className="flex flex-col gap-3 p-6">
              <channel.icon className="size-5 text-accent" aria-hidden="true" />
              <h2 className="font-heading text-2xl font-black tracking-[-0.05em]">
                {channel.title}
              </h2>
              <p className="text-sm font-medium leading-7 text-foreground/80">{channel.body}</p>
              <Link
                href={channel.action.href}
                className="mt-auto inline-flex min-h-10 items-center justify-center rounded-full border border-border/70 bg-background px-4 text-sm font-semibold text-foreground/80 transition-colors hover:text-foreground"
              >
                {channel.action.label}
              </Link>
            </RetroPanel>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl grid gap-4">
        <RetroPanel tone="secondary" className="space-y-3">
          <h2 className="font-heading text-2xl font-black tracking-[-0.05em]">
            Before you write
          </h2>
          <p className="text-sm font-medium leading-7 text-foreground/80">
            Check the{" "}
            <Link href="/faq" className="font-bold text-accent hover:underline">
              FAQ
            </Link>{" "}
            for instant answers, and the{" "}
            <Link href="/refund-policy" className="font-bold text-accent hover:underline">
              refund policy
            </Link>{" "}
            for payment questions. For purchase issues, include your course name and payment
            reference — it helps us resolve your request in one reply.
          </p>
        </RetroPanel>
      </section>
    </div>
  );
}