import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Layers3,
  MessagesSquare,
  PlayCircle,
  Sparkles,
  Users,
  Video,
} from "lucide-react";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getHomePageContent } from "@/lib/appwrite/marketing-content";

export const revalidate = 3600;

const deliverySignals = [
  {
    title: "Structured learning",
    body: "Courses are organized for progression, not just consumption.",
    icon: Layers3,
  },
  {
    title: "Live interaction",
    body: "Sessions, questions, and replays keep the learning loop active.",
    icon: Video,
  },
  {
    title: "Actual practice",
    body: "Assignments, quizzes, and progress tracking keep things honest.",
    icon: CheckCircle2,
  },
];

const systemSteps = [
  {
    title: "Understand the topic clearly",
    detail:
      "Every course is designed to remove ambiguity first, so students know what matters before they start memorizing steps.",
  },
  {
    title: "Practice inside the same workflow",
    detail:
      "Lessons connect directly to assignments, quizzes, and progress markers instead of scattering practice across random tools.",
  },
  {
    title: "Keep momentum with support",
    detail:
      "Live sessions, community, and simple next-step guidance help students continue instead of stalling after the first burst of motivation.",
  },
];

function MetricTile({
  value,
  label,
  suffix,
}: {
  value: number;
  label: string;
  suffix: string;
}) {
  return (
    <RetroPanel tone="card" className="space-y-2">
      <p className="font-heading text-4xl font-black tracking-[-0.08em] md:text-5xl">
        {value.toLocaleString("en-IN")}
        {suffix}
      </p>
      <p className="font-heading text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
    </RetroPanel>
  );
}

export default async function LandingPage() {
  const homeContent = await getHomePageContent();

  return (
    <div className="space-y-16 px-4 py-8 md:px-6 md:py-10">
      {/* ── Hero: Asymmetric Split ─────────────────────────────────── */}
      <section className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
        <RetroPanel tone="card" size="lg" className="space-y-8">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Learn from Bhaiya</Badge>
            <Badge variant="secondary">School to career</Badge>
            <Badge variant="ghost">Practical first</Badge>
          </div>

          <div className="space-y-5">
            <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.22em] text-muted-foreground">
              Learning platform
            </p>
            <h1 className="font-heading max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.08em] text-balance md:text-7xl">
              Practical learning for students who are done with vague advice.
            </h1>
            <p className="max-w-2xl text-base font-medium leading-8 text-muted-foreground md:text-lg">
              Coding, board prep, career direction, and execution habits —
              built by someone who's walked the same road.
              Not a coaching institute. Just an honest system by Amar Bhaiya,
              backed by {homeContent.stats.find((s) => s.label.toLowerCase().includes("student"))?.end.toLocaleString("en-IN") ?? "1,500"}+ students who already use it.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/courses">
                Browse courses
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/register">Create free account</Link>
            </Button>
          </div>
        </RetroPanel>

        {/* Right column: metrics from real backend */}
        <div className="grid grid-cols-2 gap-4">
          {homeContent.stats.map((item) => (
            <MetricTile
              key={item.label}
              value={item.end}
              label={item.label}
              suffix={item.suffix}
            />
          ))}
        </div>
      </section>

      {/* ── What Amar Bhaiya covers (from backend domains) ─────────── */}
      <section className="mx-auto max-w-7xl space-y-6">
        <SectionHeading
          eyebrow="What you'll learn"
          title="Subjects and skills that actually move the needle."
          description="From board exams to coding to career skills — each course is built for outcomes, not for padding a catalog."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {homeContent.domains.map((d) => (
            <RetroPanel key={d.title} tone="muted" className="space-y-3">
              <p className="font-heading text-xl font-black tracking-[-0.04em]">
                {d.title}
              </p>
              <p className="text-sm font-medium leading-6 text-muted-foreground">
                {d.sub}
              </p>
            </RetroPanel>
          ))}
        </div>
      </section>

      {/* ── Featured courses (from real backend data) ───────────────── */}
      {homeContent.featuredCourses.length > 0 && (
        <section className="mx-auto max-w-7xl space-y-6">
          <SectionHeading
            eyebrow="Featured courses"
            title="What students are actually taking right now."
          />

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {homeContent.featuredCourses.map((course, index) => (
              <Link
                key={`${course.title}-${index}`}
                href={course.slug ? `/courses/${course.slug}` : "/courses"}
                className="group"
              >
                <RetroPanel
                  tone="card"
                  size="lg"
                  className="flex h-full flex-col gap-5 transition-transform duration-200 group-hover:-translate-y-1 group-hover:shadow-retro-lg"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{course.level}</Badge>
                    <span className="font-heading text-[0.7rem] font-black uppercase tracking-[0.14em] text-muted-foreground">
                      {course.students} students
                    </span>
                  </div>

                  <div className="flex-1 space-y-3">
                    <h3 className="font-heading text-2xl font-black leading-[0.94] tracking-[-0.05em]">
                      {course.title}
                    </h3>
                    <p className="text-sm font-medium leading-7 text-muted-foreground line-clamp-2">
                      {course.sub}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t-2 border-border pt-4">
                    <span className="font-heading text-xl font-black text-primary">
                      {course.price}
                    </span>
                    <span className="flex items-center gap-1.5 font-heading text-[0.72rem] font-black uppercase tracking-[0.1em] text-foreground group-hover:text-primary transition-colors">
                      Explore
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </RetroPanel>
              </Link>
            ))}
          </div>

          <div className="flex justify-start pt-2">
            <Button asChild variant="outline" size="lg">
              <Link href="/courses">
                See all courses
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* ── Delivery signals ────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl">
        <RetroPanel tone="secondary" size="lg" className="space-y-8">
          <SectionHeading
            eyebrow="How it works"
            title="Built for real learning, not just content consumption."
          />

          <div className="grid gap-4 md:grid-cols-3">
            {deliverySignals.map((item) => (
              <div key={item.title} className="space-y-3">
                <div className="flex size-12 items-center justify-center rounded-[calc(var(--radius)+4px)] border-2 border-border bg-card shadow-retro-sm">
                  <item.icon className="size-5" />
                </div>
                <h3 className="font-heading text-lg font-black tracking-[-0.03em]">
                  {item.title}
                </h3>
                <p className="text-sm font-medium leading-7 text-muted-foreground">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </RetroPanel>
      </section>

      {/* ── The system (numbered steps) ─────────────────────────────── */}
      <section className="mx-auto max-w-7xl space-y-8">
        <SectionHeading
          eyebrow="The system"
          title="Three steps. No fluff. Just execution."
        />

        <div className="grid gap-5 md:grid-cols-3">
          {systemSteps.map((step, i) => (
            <RetroPanel key={step.title} tone="card" className="space-y-4">
              <div className="flex size-10 items-center justify-center rounded-full border-2 border-border bg-primary font-heading text-base font-black text-primary-foreground shadow-retro-sm">
                {i + 1}
              </div>
              <h3 className="font-heading text-lg font-black tracking-[-0.03em]">
                {step.title}
              </h3>
              <p className="text-sm font-medium leading-7 text-muted-foreground">
                {step.detail}
              </p>
            </RetroPanel>
          ))}
        </div>
      </section>

      {/* ── Learn items from backend ────────────────────────────────── */}
      {homeContent.learnItems.length > 0 && (
        <section className="mx-auto max-w-7xl space-y-6">
          <SectionHeading
            eyebrow="Course catalog"
            title="What you can learn here."
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {homeContent.learnItems.map((item) => (
              <RetroPanel key={item.title} tone="card" className="flex gap-5">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-heading text-lg font-black tracking-[-0.03em]">
                      {item.title}
                    </h3>
                    <Badge variant="outline">{item.who}</Badge>
                  </div>
                  <p className="text-sm font-medium leading-7 text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              </RetroPanel>
            ))}
          </div>
        </section>
      )}

      {/* ── Why this works (from backend whyItems) ──────────────────── */}
      {homeContent.whyItems.length > 0 && (
        <section className="mx-auto max-w-7xl space-y-6">
          <SectionHeading
            eyebrow="Why this is different"
            title="The approach matters more than the topic list."
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {homeContent.whyItems.map((item, index) => (
              <RetroPanel
                key={item.title}
                tone={index % 2 === 0 ? "accent" : "muted"}
                className="space-y-3"
              >
                <Sparkles className="size-5 text-primary" />
                <h3 className="font-heading text-base font-black tracking-[-0.02em]">
                  {item.title}
                </h3>
                <p className="text-sm font-medium leading-7 text-muted-foreground">
                  {item.body}
                </p>
              </RetroPanel>
            ))}
          </div>
        </section>
      )}

      {/* ── Final CTA ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl">
        <RetroPanel tone="brand" size="lg" className="space-y-8 text-center">
          <div className="mx-auto max-w-3xl space-y-5">
            <h2 className="mx-auto font-heading text-4xl font-black leading-[0.92] tracking-[-0.06em] text-primary-foreground md:text-6xl">
              Stop scrolling. Start building.
            </h2>
            <p className="mx-auto max-w-xl text-base font-medium leading-8 text-primary-foreground/80">
              Pick a course. Start a lesson. Do an assignment. That's it.
              No 40-page sales letter. No "limited seats" nonsense.
              Just start.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link href="/courses">
                <BookOpen className="size-4" />
                Browse courses
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/20">
              <Link href="/register">
                Create free account
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </RetroPanel>
      </section>
    </div>
  );
}
