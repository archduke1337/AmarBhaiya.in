import type { Metadata } from "next";
import Link from "next/link";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms that govern use of amarbhaiya.in courses, notes, and student platform features.",
};

const terms = [
  {
    title: "Platform use",
    body: "Use the platform for lawful learning and educational purposes. Do not misuse, abuse, or attempt to disrupt platform operations.",
  },
  {
    title: "Accounts",
    body: "You are responsible for account credentials and activity under your login. Keep your credentials private and accurate.",
  },
  {
    title: "Payments and subscriptions",
    body: "Paid plans, renewals, and cancellations follow the billing terms shown at checkout. Reach out through contact support for billing help.",
  },
  {
    title: "Content and intellectual property",
    body: "Course videos, notes, and platform materials are provided for enrolled learner use. Re-uploading or unauthorized redistribution is not allowed.",
  },
  {
    title: "Certificates",
    body: "Certificates are issued when completion criteria are met. Verification links are provided for authenticity checks.",
  },
  {
    title: "Updates to terms",
    body: "We may update terms when platform policies or legal requirements change. Continued use means acceptance of updated terms.",
  },
];

export default function TermsPage() {
  return (
    <div className="space-y-12 px-4 py-14 md:px-6 md:py-20 xl:space-y-16 xl:py-24">
      <section className="mx-auto max-w-6xl space-y-6">
        <SectionHeading
          eyebrow="Legal"
          title="Terms of service"
          description="These terms explain your rights and responsibilities while using amarbhaiya.in."
          titleAs="h1"
        />
        <RetroPanel tone="secondary" className="space-y-3">
          <p className="text-sm font-medium leading-7 text-foreground/80">
            Effective date: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <p className="text-sm font-medium leading-7 text-foreground/80">
            For clarifications, use the <Link href="/contact" className="font-bold text-accent hover:underline">contact page</Link>.
          </p>
        </RetroPanel>
      </section>

      <section className="mx-auto max-w-6xl grid gap-4">
        {terms.map((item, index) => (
          <RetroPanel key={item.title} tone={index % 2 === 0 ? "card" : "muted"} className="space-y-3">
            <h2 className="font-heading text-2xl font-black tracking-[-0.05em]">{item.title}</h2>
            <p className="text-sm font-medium leading-7 text-foreground/80">{item.body}</p>
          </RetroPanel>
        ))}
      </section>
    </div>
  );
}
