import type { Metadata } from "next";
import Link from "next/link";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "Community Guidelines",
  description:
    "The rules that keep amarbhaiya.in community discussions helpful, respectful, and safe.",
};

const rules = [
  {
    title: "Be respectful",
    body: "Treat every member like a classmate. No personal attacks, harassment, hate speech, or bullying — in any language.",
  },
  {
    title: "Stay on topic",
    body: "Keep discussions about learning: notes, courses, exams, and study guidance. Promotional or spam messages are removed.",
  },
  {
    title: "Protect privacy",
    body: "Do not share your own or anyone else's personal information — phone numbers, addresses, or private accounts. That includes other students.",
  },
  {
    title: "No plagiarism or piracy",
    body: "Do not re-upload platform content, share paid course material, or post copyrighted material you do not own.",
  },
  {
    title: "Ask real questions",
    body: "There is no such thing as a silly question — but do search for an existing answer before posting, so threads stay useful.",
  },
  {
    title: "Report, don't retaliate",
    body: "If you see a guideline violation, use the report option or contact page. Do not engage in public arguments.",
  },
];

export default function CommunityGuidelinesPage() {
  return (
    <div className="space-y-12 px-4 py-14 md:px-6 md:py-20 xl:space-y-16 xl:py-24">
      <section className="mx-auto max-w-6xl space-y-6">
        <SectionHeading
          eyebrow="Community"
          title="Community guidelines"
          description="Simple rules that keep the community a safe, useful place for students."
          titleAs="h1"
        />
        <RetroPanel tone="secondary" className="space-y-3">
          <p className="text-sm font-medium leading-7 text-foreground/80">
            Effective date: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <p className="text-sm font-medium leading-7 text-foreground/80">
            Violations are handled by the moderation team. Serious or repeated violations may
            result in content removal, account suspension, or permanent ban.
          </p>
        </RetroPanel>
      </section>

      <section className="mx-auto max-w-6xl grid gap-4 md:grid-cols-2">
        {rules.map((item, index) => (
          <RetroPanel key={item.title} tone={index % 2 === 0 ? "card" : "muted"} className="space-y-3">
            <h2 className="font-heading text-2xl font-black tracking-[-0.05em]">{item.title}</h2>
            <p className="text-sm font-medium leading-7 text-foreground/80">{item.body}</p>
          </RetroPanel>
        ))}
      </section>

      <section className="mx-auto max-w-6xl grid gap-4">
        <RetroPanel tone="secondary" className="space-y-3">
          <h2 className="font-heading text-2xl font-black tracking-[-0.05em]">Reporting a violation</h2>
          <p className="text-sm font-medium leading-7 text-foreground/80">
            Use the{" "}
            <Link href="/contact" className="font-bold text-accent hover:underline">
              contact page
            </Link>{" "}
            to report content or behaviour. Parents can find additional safety information on the{" "}
            <Link href="/parents" className="font-bold text-accent hover:underline">
              parents page
            </Link>
            , and unresolved concerns can be escalated via{" "}
            <Link href="/grievance-redressal" className="font-bold text-accent hover:underline">
              grievance redressal
            </Link>
            .
          </p>
        </RetroPanel>
      </section>
    </div>
  );
}