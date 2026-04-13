import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Layers3,
  MessagesSquare,
  PlayCircle,
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
              Coding, board prep, fitness, career direction, and execution habits
              in one connected system of courses, assignments, live sessions, and
              community support.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link href="/register">
                Start learning
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/courses">
                Explore courses
                <BookOpen />
              </Link>
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {deliverySignals.map((signal, index) => (
              <RetroPanel
                key={signal.title}
                tone={index === 0 ? "secondary" : index === 1 ? "accent" : "muted"}
                className="space-y-3"
              >
                <signal.icon className="size-5" />
                <div className="space-y-1">
                  <h2 className="font-heading text-xl font-black tracking-[-0.04em]">
                    {signal.title}
                  </h2>
                  <p className="text-sm font-medium leading-6 text-foreground/80">
                    {signal.body}
                  </p>
                </div>
              </RetroPanel>
            ))}
          </div>
        </RetroPanel>

        <div className="grid gap-4">
          <RetroPanel tone="secondary" size="lg" className="space-y-5">
            <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.22em] text-muted-foreground">
              Built around action
            </p>
            <div className="space-y-3">
              <h2 className="font-heading text-3xl font-black leading-[0.96] tracking-[-0.06em]">
                Watch less. Apply faster.
              </h2>
              <p className="text-sm font-medium leading-7 text-foreground/80">
                The point is not to look productive. The point is to make the next
                step obvious enough that students actually take it.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <RetroPanel tone="card" className="space-y-2">
                <p className="font-heading text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                  Included
                </p>
                <p className="text-sm font-semibold leading-6">
                  Courses, assignments, quizzes, live sessions, community, billing,
                  and progress tracking in one place.
                </p>
              </RetroPanel>
              <RetroPanel tone="card" className="space-y-2">
                <p className="font-heading text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                  Audience
                </p>
                <p className="text-sm font-semibold leading-6">
                  School students, college learners, and early-career people who
                  want structure without gatekeeping.
                </p>
              </RetroPanel>
            </div>
          </RetroPanel>

          <div className="grid gap-4 sm:grid-cols-2">
            {homeContent.stats.map((item) => (
              <MetricTile
                key={`${item.label}-${item.suffix}`}
                value={item.end}
                label={item.label}
                suffix={item.suffix}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-6">
        <SectionHeading
          eyebrow="Coverage"
          title="The platform spans the decisions students actually live with."
          description="Not one narrow subject lane. A broader, more realistic stack of skills that helps students study, build, stay healthy, and navigate career choices with less guesswork."
          titleAs="h2"
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {homeContent.domains.map((item, index) => (
            <RetroPanel
              key={`${item.title}-${index}`}
              tone={index % 2 === 0 ? "card" : "accent"}
              className="space-y-3"
            >
              <p className="font-heading text-2xl font-black tracking-[-0.05em]">
                {item.title}
              </p>
              <p className="text-sm font-medium leading-6 text-foreground/80">
                {item.sub}
              </p>
            </RetroPanel>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <RetroPanel tone="accent" size="lg" className="space-y-6">
          <SectionHeading
            eyebrow="Method"
            title="A calmer way to make progress."
            description="The platform is designed to reduce clutter around learning. Fewer tabs, fewer random detours, and clearer movement between explanation, practice, and support."
            titleAs="h2"
          />

          <div className="space-y-4">
            {systemSteps.map((step, index) => (
              <div
                key={step.title}
                className="grid gap-3 rounded-[calc(var(--radius)+2px)] border-2 border-border bg-[color:var(--surface-card)] px-4 py-4 shadow-retro-sm md:grid-cols-[36px_1fr]"
              >
                <div className="flex size-9 items-center justify-center rounded-full border-2 border-border bg-secondary font-heading text-sm font-black">
                  {index + 1}
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading text-xl font-black tracking-[-0.04em]">
                    {step.title}
                  </h3>
                  <p className="text-sm font-medium leading-6 text-foreground/80">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </RetroPanel>

        <RetroPanel tone="secondary" size="lg" className="space-y-6">
          <SectionHeading
            eyebrow="What learners get"
            title="Each lane is packaged like a proper product, not a folder of videos."
            description="That means clearer positioning, better pacing, and enough structure for students to know why a course exists before they buy time into it."
            titleAs="h2"
          />

          <div className="grid gap-4 md:grid-cols-2">
            {homeContent.learnItems.map((item, index) => (
              <RetroPanel
                key={item.title}
                tone={index % 2 === 0 ? "card" : "muted"}
                className="flex h-full flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-heading text-2xl font-black tracking-[-0.05em]">
                      {item.title}
                    </h3>
                    <Badge variant="outline">{item.who}</Badge>
                  </div>
                  <p className="text-sm font-medium leading-6 text-foreground/80">
                    {item.desc}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <ArrowRight className="size-3.5" />
                  Curriculum with context
                </div>
              </RetroPanel>
            ))}
          </div>
        </RetroPanel>
      </section>

      <section className="mx-auto max-w-7xl space-y-6">
        <SectionHeading
          eyebrow="Featured courses"
          title="A catalogue that feels more deliberate."
          description="Featured courses should read like strong offers with clear outcomes, student proof, and an obvious reason to click through."
          titleAs="h2"
        />
        <div className="grid gap-4 xl:grid-cols-3">
          {homeContent.featuredCourses.map((course, index) => (
            <Link
              key={`${course.title}-${index}`}
              href={course.slug ? `/courses/${course.slug}` : "/courses"}
              className="group"
            >
              <RetroPanel
                tone={index === 0 ? "card" : index === 1 ? "secondary" : "accent"}
                size="lg"
                className="flex h-full flex-col gap-5 transition-transform group-hover:-translate-y-1"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Badge variant="outline">{course.level}</Badge>
                  <Badge variant="ghost">{course.students}</Badge>
                </div>

                <div className="space-y-3">
                  <h3 className="font-heading text-3xl font-black leading-[0.95] tracking-[-0.06em]">
                    {course.title}
                  </h3>
                  <p className="text-sm font-medium leading-7 text-foreground/80">
                    {course.sub}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div className="space-y-1">
                    <p className="font-heading text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                      Access
                    </p>
                    <p className="text-sm font-semibold leading-6 text-foreground/80">
                      {course.note}
                    </p>
                  </div>
                  <div className="rounded-[calc(var(--radius)+2px)] border-2 border-border bg-[color:var(--surface-card)] px-4 py-3 shadow-retro-sm">
                    <p className="font-heading text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                      Price
                    </p>
                    <p className="mt-1 text-xl font-bold tracking-[-0.03em]">
                      {course.price}
                    </p>
                  </div>
                </div>

                <div className="mt-auto flex items-center gap-2 text-sm font-semibold">
                  View course
                  <ArrowRight className="size-4" />
                </div>
              </RetroPanel>
            </Link>
          ))}
        </div>

        <div className="flex justify-start">
          <Button asChild variant="outline" size="lg">
            <Link href="/courses">
              Browse full catalogue
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-6">
        <SectionHeading
          eyebrow="Why it lands"
          title="The value is in the teaching style, not just the topic list."
          description="These are the qualities that make the platform feel useful in practice rather than just attractive in a screenshot."
          titleAs="h2"
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {homeContent.whyItems.map((item, index) => (
            <RetroPanel
              key={item.title}
              tone={index % 2 === 0 ? "muted" : "card"}
              className="space-y-3"
            >
              <div className="flex items-center gap-3">
                {index % 4 === 0 ? <MessagesSquare className="size-5" /> : null}
                {index % 4 === 1 ? <Users className="size-5" /> : null}
                {index % 4 === 2 ? <PlayCircle className="size-5" /> : null}
                {index % 4 === 3 ? <BookOpen className="size-5" /> : null}
                <h3 className="font-heading text-2xl font-black tracking-[-0.05em]">
                  {item.title}
                </h3>
              </div>
              <p className="text-sm font-medium leading-6 text-foreground/80">
                {item.body}
              </p>
            </RetroPanel>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl">
        <RetroPanel tone="brand" size="lg" className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-4">
            <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.2em] text-primary-foreground/75">
              Ready to begin
            </p>
            <h2 className="font-heading text-4xl font-black leading-[0.94] tracking-[-0.07em] text-primary-foreground md:text-6xl">
              Build momentum with a system that actually supports it.
            </h2>
            <p className="max-w-2xl text-base font-medium leading-8 text-primary-foreground/80">
              Start with one course, one assignment, or one live session. The point is not to do everything at once. The point is to keep moving.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <Button asChild size="lg" variant="secondary">
              <Link href="/register">
                Create a free account
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-[color:var(--surface-card)]">
              <Link href="/contact">Talk to the team</Link>
            </Button>
          </div>
        </RetroPanel>
      </section>
    </div>
  );
}
