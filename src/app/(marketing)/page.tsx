"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  PlayCircle,
  Sparkles,
  Star,
  Trophy,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type HomeStatItem = {
  end: number;
  suffix: string;
  label: string;
};

type HomeDomainItem = {
  title: string;
  sub: string;
};

type HomeLearnItem = {
  title: string;
  who: string;
  desc: string;
};

type HomeFeaturedCourseItem = {
  title: string;
  sub: string;
  level: string;
  students: string;
  price: string;
  note: string;
  slug?: string;
};

type HomeWhyItem = {
  title: string;
  body: string;
};

type HomePageContent = {
  stats: HomeStatItem[];
  domains: HomeDomainItem[];
  learnItems: HomeLearnItem[];
  featuredCourses: HomeFeaturedCourseItem[];
  whyItems: HomeWhyItem[];
};

const defaultHomeContent: HomePageContent = {
  stats: [
    { end: 0, suffix: "+", label: "Students" },
    { end: 0, suffix: "+", label: "Courses" },
    { end: 0, suffix: "+", label: "Hours" },
    { end: 0, suffix: " yrs", label: "Teaching" },
  ],
  domains: [],
  learnItems: [],
  featuredCourses: [],
  whyItems: [],
};

const surfaceClasses = [
  "bg-secondary text-secondary-foreground",
  "bg-accent text-accent-foreground",
  "bg-card text-card-foreground",
  "bg-muted text-foreground",
];

function SectionHeading({
  kicker,
  title,
  body,
}: {
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex max-w-3xl flex-col gap-3">
      <p className="font-heading text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {kicker}
      </p>
      <h2 className="text-4xl md:text-5xl">{title}</h2>
      <p className="text-sm font-semibold leading-relaxed text-muted-foreground md:text-base">
        {body}
      </p>
    </div>
  );
}

function HomeMetricCard({
  item,
  className,
}: {
  item: HomeStatItem;
  className?: string;
}) {
  return (
    <article
      className={`rounded-[calc(var(--radius)+4px)] border-2 border-border p-5 shadow-retro ${className ?? "bg-card"}`}
    >
      <p className="text-4xl md:text-5xl">
        {item.end.toLocaleString("en-IN")}
        {item.suffix}
      </p>
      <p className="mt-2 font-heading text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {item.label}
      </p>
    </article>
  );
}

export default function LandingPage() {
  const [homeContent, setHomeContent] =
    useState<HomePageContent>(defaultHomeContent);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    function applyHomeContent(data: Partial<HomePageContent>) {
      setHomeContent((prev) => ({
        stats:
          Array.isArray(data.stats) && data.stats.length > 0 ? data.stats : prev.stats,
        domains: Array.isArray(data.domains) ? data.domains : prev.domains,
        learnItems: Array.isArray(data.learnItems) ? data.learnItems : prev.learnItems,
        featuredCourses: Array.isArray(data.featuredCourses)
          ? data.featuredCourses
          : prev.featuredCourses,
        whyItems: Array.isArray(data.whyItems) ? data.whyItems : prev.whyItems,
      }));
    }

    try {
      const cached = window.sessionStorage.getItem("home-content:v1");
      if (cached) {
        applyHomeContent(JSON.parse(cached) as Partial<HomePageContent>);
      }
    } catch {
      // Ignore invalid session cache.
    }

    async function loadHomeContent() {
      try {
        const response = await fetch("/api/content/home", {
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as Partial<HomePageContent>;
        if (cancelled) {
          return;
        }

        applyHomeContent(data);

        try {
          window.sessionStorage.setItem("home-content:v1", JSON.stringify(data));
        } catch {
          // Ignore storage/runtime errors.
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    void loadHomeContent();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 px-4 pb-10 md:px-6">
      <section className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="retro-surface flex flex-col gap-6 bg-card p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>Learn from Bhaiya</Badge>
            <Badge variant="outline">Retro mode engaged</Badge>
          </div>

          <div className="flex flex-col gap-4">
            <h1 className="max-w-4xl text-6xl leading-[0.88] md:text-7xl">
              Padhai karo apne tareeke se.
            </h1>
            <p className="max-w-2xl text-base font-semibold leading-relaxed text-muted-foreground md:text-lg">
              Class 8 se college tak. Coding, fitness, career, personal growth,
              aur real-world execution in one bold learning hub with zero fluff.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link href="/register">
                Start learning <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/courses">
                Browse courses <BookOpen />
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {homeContent.stats.map((item, index) => (
              <HomeMetricCard
                key={`${item.label}-${index}`}
                item={item}
                className={surfaceClasses[index % surfaceClasses.length]}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-5">
          <article className="retro-surface rotate-[-1.2deg] bg-secondary p-6 text-secondary-foreground">
            <div className="flex items-center gap-3">
              <Sparkles className="size-5" />
              <p className="font-heading text-xs uppercase tracking-[0.16em]">
                What makes this different
              </p>
            </div>
            <p className="mt-5 text-3xl leading-[0.95]">
              Not just syllabus. Full stack life skills.
            </p>
            <p className="mt-4 text-sm font-semibold leading-relaxed text-secondary-foreground/80">
              Learn with chunky structure: courses, assignments, live sessions,
              discussion, billing, and progress all connected.
            </p>
          </article>

          <article className="retro-surface ml-6 rotate-[1.2deg] bg-accent p-6 text-accent-foreground">
            <div className="flex items-center gap-3">
              <PlayCircle className="size-5" />
              <p className="font-heading text-xs uppercase tracking-[0.16em]">
                Built for action
              </p>
            </div>
            <div className="mt-5 grid gap-3">
              <div className="rounded-[calc(var(--radius)+2px)] border-2 border-border bg-card p-4 shadow-retro-sm">
                <p className="font-heading text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Practical lessons
                </p>
                <p className="mt-2 text-sm font-semibold">
                  Direct steps, not endless theory.
                </p>
              </div>
              <div className="rounded-[calc(var(--radius)+2px)] border-2 border-border bg-primary p-4 text-primary-foreground shadow-retro-sm">
                <p className="font-heading text-xs uppercase tracking-[0.14em] text-primary-foreground/75">
                  Live support
                </p>
                <p className="mt-2 text-sm font-semibold">
                  Join sessions, ask questions, replay later.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2 xl:grid-cols-4">
        {homeContent.domains.length === 0 ? (
          <div className="retro-surface md:col-span-2 xl:col-span-4 bg-card p-6 text-sm font-semibold text-muted-foreground">
            Domain strip content is not configured yet.
          </div>
        ) : (
          homeContent.domains.map((item, index) => (
            <article
              key={`${item.title}-${index}`}
              className={`retro-surface p-5 ${surfaceClasses[index % surfaceClasses.length]}`}
            >
              <p className="font-heading text-sm uppercase tracking-[0.1em]">
                {item.title}
              </p>
              <p className="mt-2 text-sm font-semibold opacity-80">{item.sub}</p>
            </article>
          ))
        )}
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="retro-surface bg-primary p-6 text-primary-foreground md:p-8">
          <SectionHeading
            kicker="Ye kaun hai?"
            title="Main woh banda hoon jo tumhari galtiyan pehle kar chuka hai."
            body="School, college, coding, fitness, aur career ka kaafi confusion khud jhela. Ab woh shortcut map bana diya hai jo mujhe tab chahiye tha."
          />
        </article>

        <div className="grid gap-4">
          <article className="retro-surface bg-card p-6">
            <p className="font-heading text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Why this platform exists
            </p>
            <p className="mt-4 text-sm font-semibold leading-relaxed text-muted-foreground">
              YouTube tutorials dekhne ke baad bhi first project nahi banta,
              teachers theory bolkar nikal jaate hain, aur career decisions
              guesswork ban jaate hain. Yeh platform us gap ko fill karta hai.
            </p>
          </article>
          <article className="retro-surface bg-secondary p-6 text-secondary-foreground">
            <p className="font-heading text-xs uppercase tracking-[0.16em] text-secondary-foreground/70">
              What changes here
            </p>
            <ul className="mt-4 grid gap-3 text-sm font-semibold">
              <li>Clear roadmaps instead of scattered videos</li>
              <li>Assignments and quizzes tied to actual lessons</li>
              <li>Community and live sessions for momentum</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-col gap-6">
        <SectionHeading
          kicker="Kya milega?"
          title="Sirf padhai nahi. Poori life ka syllabus."
          body="Each lane is packaged like a retro card deck: big signals, clear audience, and a straightforward reason to care."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {homeContent.learnItems.length === 0 ? (
            <div className="retro-surface md:col-span-2 xl:col-span-3 bg-card p-6 text-sm font-semibold text-muted-foreground">
              Learning blocks are not configured yet.
            </div>
          ) : (
            homeContent.learnItems.map((item, index) => (
              <article
                key={item.title}
                className={`retro-surface flex h-full flex-col justify-between gap-4 p-6 ${surfaceClasses[index % surfaceClasses.length]}`}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-2xl">{item.title}</h3>
                    <Badge variant={index % 2 === 0 ? "outline" : "ghost"}>
                      {item.who}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold leading-relaxed opacity-80">
                    {item.desc}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm font-heading uppercase tracking-[0.12em]">
                  <ArrowRight className="size-4" />
                  Learn this lane
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-col gap-6">
        <SectionHeading
          kicker="Courses"
          title="Seekho woh jo school kabhi nahi sikhata."
          body="The catalogue now reads like a deck of collectible lesson packs instead of a generic SaaS list."
        />

        <div className="grid gap-4">
          {homeContent.featuredCourses.length === 0 ? (
            <div className="retro-surface bg-card p-6 text-sm font-semibold text-muted-foreground">
              Featured courses are not configured yet.
            </div>
          ) : (
            homeContent.featuredCourses.map((course, index) => (
              <Link
                key={`${course.title}-${index}`}
                href={course.slug ? `/courses/${course.slug}` : "/courses"}
                className={`retro-surface grid gap-4 p-6 transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] md:grid-cols-[1.1fr_0.55fr_0.35fr] ${surfaceClasses[index % surfaceClasses.length]}`}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-3xl">{course.title}</h3>
                    <Badge variant="outline">{course.level}</Badge>
                  </div>
                  <p className="text-sm font-semibold opacity-80">{course.sub}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="ghost">{course.students} students</Badge>
                    <Badge variant="secondary">{course.note}</Badge>
                  </div>
                </div>

                <div className="rounded-[calc(var(--radius)+2px)] border-2 border-border bg-card p-4 shadow-retro-sm">
                  <p className="font-heading text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Price
                  </p>
                  <p className="mt-3 text-3xl">{course.price}</p>
                </div>

                <div className="flex items-end justify-between md:justify-end">
                  <div className="rounded-full border-2 border-border bg-primary p-3 text-primary-foreground shadow-retro-sm">
                    <ArrowRight className="size-5" />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        <div>
          <Button asChild variant="ghost">
            <Link href="/courses">
              View all courses <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-col gap-6">
        <SectionHeading
          kicker="Toh bhaiya hi kyun?"
          title="Kyunki baaki sab sirf padhate hain. Main samjhata hoon."
          body="These reasons are framed like punchy collectible badges, not soft trust-copy blocks."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {homeContent.whyItems.length === 0 ? (
            <div className="retro-surface md:col-span-2 xl:col-span-4 bg-card p-6 text-sm font-semibold text-muted-foreground">
              Why-section points are not configured yet.
            </div>
          ) : (
            homeContent.whyItems.map((item, index) => (
              <article
                key={item.title}
                className={`retro-surface flex h-full flex-col gap-4 p-6 ${surfaceClasses[index % surfaceClasses.length]}`}
              >
                <div className="flex items-center gap-3">
                  {index % 4 === 0 ? <Star className="size-5" /> : null}
                  {index % 4 === 1 ? <Users className="size-5" /> : null}
                  {index % 4 === 2 ? <Trophy className="size-5" /> : null}
                  {index % 4 === 3 ? <BookOpen className="size-5" /> : null}
                  <h3 className="text-2xl">{item.title}</h3>
                </div>
                <p className="text-sm font-semibold leading-relaxed opacity-80">
                  {item.body}
                </p>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl">
        <div className="retro-surface grid gap-5 bg-primary p-6 text-primary-foreground md:grid-cols-[1fr_auto] md:items-center md:p-8">
          <div className="flex flex-col gap-4">
            <p className="font-heading text-xs uppercase tracking-[0.18em] text-primary-foreground/75">
              Ready?
            </p>
            <h2 className="text-5xl md:text-6xl">
              Abhi start karo. Aaj se momentum banao.
            </h2>
            <p className="max-w-2xl text-sm font-semibold leading-relaxed text-primary-foreground/80 md:text-base">
              Sochte reh jaoge toh woh banda aage nikal jayega jo aaj shuru kar raha hai.
            </p>
          </div>

          <div className="flex flex-col gap-4 md:items-end">
            <Button asChild size="lg" variant="secondary">
              <Link href="/register">
                Free account banao <ArrowRight />
              </Link>
            </Button>
            <p className="text-xs font-heading uppercase tracking-[0.16em] text-primary-foreground/75">
              Free hai. No credit card. No hidden charges.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
