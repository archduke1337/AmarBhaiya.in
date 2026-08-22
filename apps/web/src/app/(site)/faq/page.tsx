import type { Metadata } from "next";
import Link from "next/link";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "FAQ — Frequently Asked Questions",
  description:
    "Answers about notes, courses, certificates, refunds, and account access on amarbhaiya.in.",
  alternates: { canonical: "/faq" },
};

const faqGroups = [
  {
    title: "Getting started",
    items: [
      {
        q: "Is amarbhaiya.in really free?",
        a: "Yes — chapter-wise notes, blog articles, and public community access are completely free. You only pay for a course or a premium subscription if you choose to.",
      },
      {
        q: "Do I need an account to read notes?",
        a: "Notes are available to everyone. An account is required to save your progress, download material, and access the community.",
      },
      {
        q: "Which classes and subjects are covered?",
        a: "The platform focuses on Class 6 to 12 school material first, expanding into skills, career, and life guidance over time.",
      },
    ],
  },
  {
    title: "Courses and payments",
    items: [
      {
        q: "How are paid courses priced?",
        a: "Every course shows its one-time fee on the course page before checkout. Payments are processed securely through Razorpay.",
      },
      {
        q: "What is the Premium subscription?",
        a: "Premium unlocks everything on the platform — premium courses, live sessions, and community features — for a simple monthly fee. You can cancel before the next renewal.",
      },
      {
        q: "Can I get a refund?",
        a: "Paid courses have a defined refund window and subscription renewals can be cancelled in advance. Full details are on the refund policy page.",
      },
      {
        q: "Do you offer discounts or coupons?",
        a: "Yes, valid coupons can be applied at checkout. The discounted amount is always shown before you confirm payment.",
      },
    ],
  },
  {
    title: "Learning and accounts",
    items: [
      {
        q: "How do certificates work?",
        a: "Certificates are issued when course completion criteria are met, and each certificate has a verification link for authenticity checks.",
      },
      {
        q: "Can I learn on my phone?",
        a: "Yes — the platform works on mobile browsers, and the app layout includes a bottom navigation designed for phones.",
      },
      {
        q: "How do I reset my password or verify my email?",
        a: "Use the login page's forgot-password flow, and check your inbox for the verification link after registering.",
      },
      {
        q: "How do I get help with a problem?",
        a: "Use the contact page or the support page. Moderation and grievance channels are listed there for reports and escalations.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="space-y-12 px-4 py-14 md:px-6 md:py-20 xl:space-y-16 xl:py-24">
      <section className="mx-auto max-w-3xl space-y-6">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions, answered"
          description="The most common questions about notes, courses, payments, and accounts. Something missing? Ask us on the contact page."
          titleAs="h1"
        />

        <div className="space-y-4">
          {faqGroups.map((group) => (
            <div key={group.title} className="space-y-3">
              <h2 className="font-heading text-2xl font-black tracking-[-0.05em]">
                {group.title}
              </h2>
              {group.items.map((item) => (
                <details
                  key={item.q}
                  className="group overflow-hidden rounded-[calc(var(--radius)+2px)] border-2 border-border bg-card shadow-retro"
                >
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 bg-secondary/75 px-4 py-3 text-sm font-heading font-black tracking-[0.03em] outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span
                      className="mt-0.5 text-xs font-black text-muted-foreground transition-transform duration-200 group-open:rotate-45"
                      aria-hidden
                    >
                      +
                    </span>
                  </summary>
                  <div className="px-4 py-4">
                    <p className="text-sm font-medium leading-7 text-foreground/80">{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl">
        <RetroPanel tone="secondary" className="space-y-3">
          <h2 className="font-heading text-2xl font-black tracking-[-0.05em]">
            Still have a question?
          </h2>
          <p className="text-sm font-medium leading-7 text-foreground/80">
            Reach out on the{" "}
            <Link href="/contact" className="font-bold text-accent hover:underline">
              contact page
            </Link>{" "}
            or visit{" "}
            <Link href="/support" className="font-bold text-accent hover:underline">
              support
            </Link>{" "}
            for help with billing, accounts, and technical issues.
          </p>
        </RetroPanel>
      </section>
    </div>
  );
}
