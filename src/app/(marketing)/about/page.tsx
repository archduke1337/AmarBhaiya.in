import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Know the story behind amarbhaiya.in and the mission to make practical learning accessible for students.",
};

const IDENTITY_CARDS = [
  {
    title: "Tech Educator",
    detail: "Teaches project-first coding from fundamentals to deployment.",
  },
  {
    title: "Board Prep Mentor",
    detail: "Builds exam systems around PYQs and revision strategy.",
  },
  {
    title: "Fitness Guide",
    detail: "Makes health and discipline practical for student routines.",
  },
  {
    title: "Career Coach",
    detail: "Helps students make better stream, college, and placement decisions.",
  },
  {
    title: "Builder Mindset",
    detail: "Focuses on execution, consistency, and long-term self growth.",
  },
];

const JOURNEY = [
  {
    year: "2019",
    title: "Started Teaching Informally",
    detail:
      "Began helping juniors with coding and exam prep through small peer sessions.",
  },
  {
    year: "2021",
    title: "Built Repeatable Learning Frameworks",
    detail:
      "Created outcome-focused learning systems combining practice and review loops.",
  },
  {
    year: "2024",
    title: "Expanded Into Multi-Domain Mentorship",
    detail:
      "Added fitness, career guidance, and personal discipline modules for students.",
  },
  {
    year: "2026",
    title: "Launched amarbhaiya.in",
    detail:
      "Unified courses, community, and live sessions in one practical platform.",
  },
];

export default function AboutPage() {
  return (
    <div className="px-6 md:px-12 py-20 md:py-28 space-y-24">
      <section className="max-w-4xl mx-auto space-y-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">About</p>
        <h1 className="text-4xl md:text-6xl leading-tight">
          Learn from someone who has already made the mistakes.
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed max-w-3xl">
          amarbhaiya.in exists to remove confusion for students. Instead of
          overloaded theory, the platform focuses on practical systems for
          coding, academics, fitness, and career growth.
        </p>
      </section>

      <section className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl mb-8">Identity Layers</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
          {IDENTITY_CARDS.map((item) => (
            <article key={item.title} className="bg-background p-8 space-y-3">
              <h3 className="text-lg">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl mb-8">Journey</h2>
        <div className="border border-border divide-y divide-border">
          {JOURNEY.map((item) => (
            <article key={item.year} className="grid md:grid-cols-[120px_1fr] gap-6 p-6 md:p-8">
              <p className="text-sm uppercase tracking-widest text-muted-foreground">{item.year}</p>
              <div className="space-y-2">
                <h3 className="text-xl">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto border border-border p-8 md:p-10">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">Mission</p>
        <p className="text-xl md:text-2xl leading-relaxed">
          Give every student a practical edge through clear systems, honest
          mentorship, and execution-first learning.
        </p>
      </section>
    </div>
  );
}
