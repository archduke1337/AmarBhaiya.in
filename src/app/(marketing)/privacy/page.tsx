import type { Metadata } from "next";
import Link from "next/link";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How amarbhaiya.in handles student data, account data, and communication preferences.",
};

const sections = [
  {
    title: "Information we collect",
    points: [
      "Account details such as name, email, and login credentials.",
      "Learning activity such as course progress, quiz attempts, and assignments.",
      "Payment and subscription records for billing and support.",
      "Support and contact messages you send to the team.",
    ],
  },
  {
    title: "How we use it",
    points: [
      "To create and secure your account.",
      "To deliver courses, notes, certificates, and progress tracking.",
      "To process payments and resolve billing issues.",
      "To improve teaching quality, product clarity, and reliability.",
    ],
  },
  {
    title: "Data sharing",
    points: [
      "We do not sell personal data.",
      "Data may be shared with trusted infrastructure providers required to run the platform.",
      "Information may be disclosed when legally required or to protect users and platform integrity.",
    ],
  },
  {
    title: "Your choices",
    points: [
      "You can request correction or deletion of your account data.",
      "You can contact us to review support or communication preferences.",
      "You can stop using the platform at any time.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="space-y-12 px-4 py-14 md:px-6 md:py-20 xl:space-y-16 xl:py-24">
      <section className="mx-auto max-w-6xl space-y-6">
        <SectionHeading
          eyebrow="Legal"
          title="Privacy policy"
          description="This policy explains what data we collect, why we collect it, and how we protect it."
          titleAs="h1"
        />
        <RetroPanel tone="secondary" className="space-y-3">
          <p className="text-sm font-medium leading-7 text-foreground/80">
            Effective date: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <p className="text-sm font-medium leading-7 text-foreground/80">
            If you have questions, contact us through the <Link href="/contact" className="font-bold text-accent hover:underline">contact page</Link>.
          </p>
        </RetroPanel>
      </section>

      <section className="mx-auto max-w-6xl grid gap-4">
        {sections.map((section, index) => (
          <RetroPanel key={section.title} tone={index % 2 === 0 ? "card" : "muted"} className="space-y-3">
            <h2 className="font-heading text-2xl font-black tracking-[-0.05em]">{section.title}</h2>
            <ul className="grid gap-2" role="list">
              {section.points.map((point) => (
                <li key={point} className="text-sm font-medium leading-7 text-foreground/80">
                  {point}
                </li>
              ))}
            </ul>
          </RetroPanel>
        ))}
      </section>
    </div>
  );
}
