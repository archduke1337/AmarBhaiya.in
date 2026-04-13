import type { Metadata } from "next";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";

import { getAboutPageContent } from "@/lib/appwrite/marketing-content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Know the story behind amarbhaiya.in and the mission to make practical learning accessible for students.",
};
export default async function AboutPage() {
  const aboutContent = await getAboutPageContent();

  return (
    <div className="space-y-20 px-6 py-20 md:px-12 md:py-28">
      <section className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionHeading
          eyebrow="About"
          title="Built for students who want fewer speeches and more signal."
          description="amarbhaiya.in exists to reduce confusion. The point is not to look impressive from a distance. The point is to make the next move clearer when you are in the middle of real decisions."
          titleAs="h1"
        />
        <RetroPanel tone="accent" size="lg" className="space-y-4 xl:translate-y-8">
          <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.22em] text-muted-foreground">
            Operating principle
          </p>
          <p className="text-lg font-bold leading-8 tracking-[-0.03em]">
            Practical learning only works when the advice feels close to the mess students are actually living through.
          </p>
        </RetroPanel>
      </section>

      <section className="mx-auto max-w-6xl space-y-8">
        <SectionHeading
          eyebrow="Identity layers"
          title="Not one lane. A stacked worldview."
          description="The brand works because it combines teaching, execution, and lived context rather than pretending every learner starts from the same place."
        />
        {aboutContent.identityCards.length === 0 ? (
          <RetroPanel tone="muted">
            <p className="text-sm font-medium text-muted-foreground">
              Identity blocks are not configured yet.
            </p>
          </RetroPanel>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {aboutContent.identityCards.map((item, index) => (
            <RetroPanel
              key={item.title}
              tone={index % 3 === 0 ? "card" : index % 3 === 1 ? "secondary" : "accent"}
              className="space-y-3"
            >
              <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.2em] text-muted-foreground">
                Layer {index + 1}
              </p>
              <h3 className="font-heading text-2xl font-black tracking-[-0.05em]">
                {item.title}
              </h3>
              <p className="text-sm font-medium leading-6 text-foreground/80">{item.detail}</p>
            </RetroPanel>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-8">
        <SectionHeading
          eyebrow="Journey"
          title="A timeline that earns the point of view."
          description="This is the part that matters: not a polished origin story, but the sequence of experiments, mistakes, and corrections that shaped the teaching style."
        />
        {aboutContent.journey.length === 0 ? (
          <RetroPanel tone="muted">
            <p className="text-sm font-medium text-muted-foreground">
              Journey timeline is not configured yet.
            </p>
          </RetroPanel>
        ) : null}
        <div className="space-y-4">
          {aboutContent.journey.map((item, index) => (
            <RetroPanel
              key={`${item.year}-${item.title}`}
              tone={index % 2 === 0 ? "card" : "muted"}
              className="grid gap-5 md:grid-cols-[120px_1fr] md:items-start"
            >
              <p className="font-heading text-sm font-black uppercase tracking-[0.2em] text-primary">
                {item.year}
              </p>
              <div className="space-y-2">
                <h3 className="font-heading text-2xl font-black tracking-[-0.05em]">
                  {item.title}
                </h3>
                <p className="text-sm font-medium leading-7 text-foreground/80">{item.detail}</p>
              </div>
            </RetroPanel>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl">
        <RetroPanel tone="primary" size="lg" className="space-y-4">
          <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.2em] text-primary-foreground/80">
            Mission
          </p>
          <p className="text-2xl font-bold leading-9 tracking-[-0.04em] text-foreground md:text-3xl md:leading-10">
            {aboutContent.mission || "Mission content is not configured yet."}
          </p>
        </RetroPanel>
      </section>
    </div>
  );
}
