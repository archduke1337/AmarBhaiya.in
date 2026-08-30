import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, HeartHandshake, Presentation, Rocket } from "lucide-react";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Careers & Collaborations",
  description:
    "Work with amarbhaiya.in through teaching, content, product, or meaningful learning collaborations.",
  alternates: { canonical: "/careers" },
};

const paths = [
  {
    icon: Presentation,
    title: "Teach with us",
    body: "Bring a subject, skill, or practical framework that students can use. We care more about clarity and consistency than polished jargon.",
  },
  {
    icon: Rocket,
    title: "Build with us",
    body: "Help improve the learning experience through product, engineering, design, content systems, or thoughtful operations.",
  },
  {
    icon: HeartHandshake,
    title: "Partner with us",
    body: "If you have an education, community, or student-support idea that fits the school-first mission, tell us what you want to make useful.",
  },
];

export default function CareersPage() {
  return (
    <div className="site-container space-y-14 py-12 sm:py-16 xl:space-y-20 xl:py-20">
      <section className="mx-auto grid max-w-6xl gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
        <SectionHeading
          eyebrow="Careers & collaborations"
          title="Work on learning that respects the student on the other side."
          description="We are building amarbhaiya.in carefully: school-first, practical, and honest about what helps people keep going. If that sounds like the kind of work you want to contribute to, start a conversation."
          titleAs="h1"
        />
        <RetroPanel tone="accent" size="lg" className="space-y-4 xl:translate-y-8">
          <BriefcaseBusiness className="size-6 text-accent-foreground" aria-hidden="true" />
          <p className="site-kicker font-sans">
            How we evaluate a fit
          </p>
          <p className="text-lg font-bold leading-8 tracking-[-0.03em]">
            Show us what you can make clearer, more useful, or more human for a student.
          </p>
          <p className="text-sm font-medium leading-7 text-foreground/80">
            We do not list generic openings here. Roles and collaborations depend on the work, the timing, and the value you can create.
          </p>
        </RetroPanel>
      </section>

      <section className="mx-auto max-w-6xl space-y-8">
        <SectionHeading
          eyebrow="Ways to contribute"
          title="There is more than one way to make the classroom better."
          description="Choose the path closest to your strengths. A useful first message is more valuable than a generic CV with no context."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {paths.map((path, index) => (
            <RetroPanel key={path.title} tone={index === 1 ? "secondary" : index === 2 ? "muted" : "card"} className="flex h-full flex-col gap-4">
              <path.icon className="size-5 text-accent" aria-hidden="true" />
              <h2 className="font-heading text-[clamp(1.35rem,3vw,2rem)] font-normal tracking-[-0.02em]">{path.title}</h2>
              <p className="flex-1 text-sm font-medium leading-7 text-foreground/80">{path.body}</p>
            </RetroPanel>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl">
        <RetroPanel tone="primary" size="lg" className="space-y-5 text-center">
          <p className="site-kicker font-sans">
            Start with context
          </p>
          <h2 className="font-heading text-3xl font-normal tracking-[-0.02em] md:text-4xl">
            Tell us what you want to improve for students.
          </h2>
          <p className="mx-auto max-w-2xl text-sm font-medium leading-7 text-foreground/80">
            Include your background, the kind of work you want to do, and one concrete idea for making learning simpler or more useful.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/contact">
                Start a conversation
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/about">Understand the mission</Link>
            </Button>
          </div>
        </RetroPanel>
      </section>
    </div>
  );
}
