/**
 * Marketing Homepage — amarbhaiya.in
 * ────────────────────────────────────
 * Design: Ethereal Glass + Editorial Luxury hybrid
 * Vibe: Deep OLED dark, warm amber accent, cinematic typography
 * Layout: Asymmetrical bento + editorial split hero
 * Mobile: min-h-dvh, pb-safe, 44px touch targets, iOS Safe Areas
 *
 * UI: shadcn/ui + radix-ui + Tailwind v4
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { RevealWrapper } from "@/components/ui/reveal-wrapper";
import { getHomePageContent } from "@/server/appwrite/marketing-content";
import { AnnouncementBanner } from "@/components/marketing/announcement-banner";

export const revalidate = 3600;

export const metadata = {
  alternates: { canonical: "/" },
};

const DOMAIN_COLORS = [
  "oklch(0.70 0.14 265)",
  "oklch(0.70 0.14 148)",
  "oklch(0.72 0.17 55)",
  "oklch(0.68 0.14 32)",
  "oklch(0.70 0.13 330)",
  "oklch(0.68 0.14 220)",
] as const;

function formatStatValue(end: number, suffix: string) {
  return `${Math.max(0, Math.round(end)).toLocaleString("en-IN")}${suffix}`;
}

// ── Page ─────────────────────────────────────────────────────
export default async function MarketingPage() {
  type MarketingHomeContent = Awaited<ReturnType<typeof getHomePageContent>>;

  const fallbackHomeContent: MarketingHomeContent = {
    stats: [],
    domains: [],
    learnItems: [],
    featuredCourses: [],
    whyItems: [],
    collections: [],
    announcement: null,
  };

  let homeContent: MarketingHomeContent = fallbackHomeContent;

  try {
    homeContent = await getHomePageContent();
  } catch {
    homeContent = fallbackHomeContent;
  }

  const stats = homeContent.stats;
  const domains = homeContent.domains;
  const whyItems = homeContent.whyItems;
  const featuredCourse = homeContent.featuredCourses[0] ?? null;
  const heroDescription =
    homeContent.learnItems[0]?.desc?.trim() ||
    "Class 6 se 12 tak — har subject ke notes, video courses, aur live sessions. Coaching ki zaroorat nahi, Bhaiya hai na.";
  const quickStats = stats.slice(0, 2);

  const announcement = homeContent.announcement;
  const collections = homeContent.collections;

  return (
    <>
      <AnnouncementBanner announcement={announcement} />

      {/* ═══════════════════════════════════════════════════
          SECTION 1 — Hero (Editorial Split)
      ═══════════════════════════════════════════════════ */}
      <section
          aria-label="Hero"
          className="section-pad relative overflow-hidden"
        >
          {/* Ambient glow orbs — GPU-safe, fixed pseudo-elements */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-[0.12] blur-[120px]"
              style={{ background: "var(--accent)" }}
            />
            <div
              className="absolute -bottom-16 right-0 w-[400px] h-[400px] rounded-full opacity-[0.08] blur-[100px]"
              style={{ background: "oklch(0.65 0.18 265)" }}
            />
          </div>

          <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
              {/* Left — Typography block */}
              <div className="flex flex-col gap-6">
                <RevealWrapper>
                  <span className="eyebrow">
                    Learn from Amar Bhaiya
                  </span>
                </RevealWrapper>

                <RevealWrapper className="stagger-1">
                  <h1 className="max-w-[11ch] text-[clamp(2.5rem,8vw,5rem)] font-black leading-[0.96] tracking-[-0.045em] text-foreground">
                    Padhai simple,{" "}
                    <span
                      className="inline-block"
                      style={{
                        background: "linear-gradient(135deg, var(--accent) 0%, oklch(0.85 0.15 72) 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      honest
                    </span>
                    {" "}aur useful.
                  </h1>
                </RevealWrapper>

                <RevealWrapper className="stagger-2">
                  <p className="max-w-prose text-base font-medium leading-7 text-foreground/65 sm:text-lg sm:leading-8">
                    {heroDescription}
                  </p>
                </RevealWrapper>

                <RevealWrapper className="stagger-3 flex flex-wrap gap-3 pt-2">
                  <Button asChild
                      size="lg"
                      className="font-bold px-7 bg-accent text-accent-foreground glow-accent-sm active:scale-[0.97] transition-transform"
                    >
                      <Link href="/courses">
                        Courses dekho
                        <svg className="ml-2 w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </Link>
                    </Button>
                    <Button asChild
                      size="lg"
                      variant="outline"
                      className="font-semibold px-7"
                    >
                      <Link href="/notes">Free notes</Link>
                    </Button>
                </RevealWrapper>

                {/* Stats row */}
                {stats.length > 0 ? (
                  <RevealWrapper className="stagger-4 flex flex-wrap gap-6 pt-4 border-t border-border/40">
                    {stats.map((stat) => (
                      <div key={stat.label} className="flex flex-col">
                        <span className="text-xl font-black text-foreground leading-none">
                          {formatStatValue(stat.end, stat.suffix)}
                        </span>
                        <span className="text-xs text-foreground/50 font-medium mt-0.5">{stat.label}</span>
                      </div>
                    ))}
                  </RevealWrapper>
                ) : null}
              </div>

              {/* Right — Asymmetric bento preview cards */}
              <RevealWrapper className="stagger-2 grid grid-cols-2 gap-3">
                {/* Big card */}
                <div
                  className="card-bezel col-span-2"
                  style={{ background: "color-mix(in oklab, var(--surface) 85%, var(--accent) 8%)" }}
                >
                  <div className="card-bezel-inner p-4 sm:p-5">
                    {featuredCourse ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-black text-accent" style={{ background: "color-mix(in oklab, var(--accent) 12%, transparent)" }} aria-hidden="true">*</div>
                          <div>
                            <p className="font-bold text-sm text-foreground">{featuredCourse.title}</p>
                            <p className="text-xs text-foreground/50">
                              {featuredCourse.sub || "Popular with active students"}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs font-semibold text-foreground/70">
                          <span className="rounded-full bg-surface-hover px-2 py-1">
                            {featuredCourse.level}
                          </span>
                          <span className="rounded-full bg-surface-hover px-2 py-1">
                            {featuredCourse.students} learners
                          </span>
                          <span className="rounded-full bg-surface-hover px-2 py-1">
                            {featuredCourse.price}
                          </span>
                        </div>

                        {featuredCourse.note ? (
                          <p className="text-xs text-foreground/50">{featuredCourse.note}</p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-foreground/60">
                        Featured course section updates automatically from published course data.
                      </p>
                    )}
                  </div>
                </div>

                {quickStats.map((stat, index) => (
                  <div key={`${stat.label}-${index}`} className="card-bezel">
                    <div className="card-bezel-inner p-4 flex flex-col gap-1">
                      <span className="text-2xl font-black text-foreground leading-none">
                        {formatStatValue(stat.end, stat.suffix)}
                      </span>
                      <span className="text-xs text-foreground/50 font-medium">{stat.label}</span>
                    </div>
                  </div>
                ))}
              </RevealWrapper>
            </div>
          </div>
        </section>

        {/* Trust strip — social proof */}
        <section aria-label="Trust indicators" className="mx-auto -mt-4 max-w-5xl px-4 sm:px-6">
          <RevealWrapper>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-2xl border border-border/40 bg-surface/80 px-4 py-3 text-center text-xs font-semibold leading-5 text-foreground/60 backdrop-blur sm:gap-x-6 sm:rounded-full">
              <span className="inline-flex items-center gap-1.5"><span className="text-accent">★</span> 4.8/5 from students</span>
              <span className="hidden sm:inline opacity-30">·</span>
              <span>10k+ learners</span>
              <span className="hidden sm:inline opacity-30">·</span>
              <span>Free notes for Class 6–12</span>
              <span className="hidden sm:inline opacity-30">·</span>
              <span className="hidden sm:inline">No spam, just clarity</span>
            </div>
          </RevealWrapper>
        </section>

        {/* ═══════════════════════════════════════════════════
            SECTION 2 — Subjects bento grid
        ═══════════════════════════════════════════════════ */}
        <section aria-labelledby="subjects-heading" className="section-pad-sm">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <RevealWrapper className="mb-10 text-center">
              <span className="eyebrow mb-4 mx-auto">Subjects</span>
              <h2 id="subjects-heading" className="text-[clamp(1.75rem,5vw,3rem)] font-black tracking-[-0.04em]">
                Har subject covered.
              </h2>
              <p className="mx-auto mt-3 max-w-prose text-sm leading-6 text-foreground/60 sm:text-base">
                Expert-crafted content for every NCERT chapter, every class.
              </p>
            </RevealWrapper>

            {/* Responsive subject grid */}
            {domains.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {domains.slice(0, 6).map((domain, i) => (
                  <RevealWrapper
                    key={`${domain.title}-${i}`}
                    className={`stagger-${Math.min(i + 1, 5)}`}
                  >
                    <Link
                      href="/courses"
                      className="block group"
                    >
                      <div
                        className="card-bezel h-full"
                        style={{
                          background: `color-mix(in oklab, var(--surface) 88%, ${DOMAIN_COLORS[i % DOMAIN_COLORS.length]} 12%)`,
                        }}
                      >
                        <div className="card-bezel-inner p-5 flex flex-col gap-3 min-h-[120px] group-hover:bg-surface/80 transition-colors duration-300">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black" style={{ background: `color-mix(in oklab, ${DOMAIN_COLORS[i % DOMAIN_COLORS.length]} 15%, transparent)`, color: DOMAIN_COLORS[i % DOMAIN_COLORS.length] }} aria-hidden="true">
                            {domain.title.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-foreground">{domain.title}</p>
                            <p className="text-xs text-foreground/50 mt-0.5">{domain.sub}</p>
                          </div>
                          <span
                            className="text-xs font-semibold self-start opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300"
                            style={{ color: DOMAIN_COLORS[i % DOMAIN_COLORS.length] }}
                          >
                            Explore &gt;
                          </span>
                        </div>
                      </div>
                    </Link>
                  </RevealWrapper>
                ))}
              </div>
            ) : (
              <RevealWrapper>
                <div className="card-bezel">
                  <div className="card-bezel-inner p-5 text-sm text-foreground/60">
                    Subject highlights appear here once live homepage content is published.
                  </div>
                </div>
              </RevealWrapper>
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            SECTION 3 — Featured Collections
        ═══════════════════════════════════════════════════ */}
        {collections.length > 0 && (
          <section aria-labelledby="collections-heading" className="section-pad-sm">
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
              <RevealWrapper className="mb-8">
                <span className="eyebrow mb-3 mx-auto">Collections</span>
                <h2 id="collections-heading" className="text-[clamp(1.5rem,4vw,2.5rem)] font-black tracking-[-0.04em] text-center">
                  Curated learning packs
                </h2>
              </RevealWrapper>

              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none">
                {collections.map((collection, i) => (
                  <RevealWrapper
                    key={collection.id}
                    className={`stagger-${Math.min(i + 1, 4)} snap-start shrink-0 w-[280px] sm:w-[320px]`}
                  >
                    <div className="card-bezel h-full">
                      <div
                        className="card-bezel-inner p-6 flex flex-col gap-4 min-h-[200px] relative overflow-hidden"
                        style={{
                          ...(collection.bgColor ? {
                            background: `linear-gradient(135deg, ${collection.bgColor}18, ${collection.bgColor}06)`,
                          } : {}),
                        }}
                      >
                        {/* Banner background image */}
                        {collection.imageUrl && (
                          <div
                            className="absolute inset-0 opacity-10 bg-cover bg-center"
                            style={{ backgroundImage: `url(${collection.imageUrl})` }}
                            aria-hidden="true"
                          />
                        )}

                        <div className="relative z-10">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black"
                            style={{
                              background: collection.bgColor
                                ? `color-mix(in oklab, ${collection.bgColor} 15%, transparent)`
                                : "color-mix(in oklab, var(--accent) 12%, transparent)",
                              color: collection.bgColor || "var(--accent)",
                            }}
                            aria-hidden="true"
                          >
                            {i + 1}
                          </div>
                        </div>
                        <div className="relative z-10 flex-1">
                          <h3 className="font-bold text-base text-foreground">{collection.title}</h3>
                          {collection.subtitle && (
                            <p className="text-sm text-foreground/55 mt-1 leading-relaxed">
                              {collection.subtitle}
                            </p>
                          )}
                          <p className="text-xs text-foreground/40 mt-2">
                            {collection.courseSlugs.length} course{collection.courseSlugs.length === 1 ? "" : "s"}
                          </p>
                        </div>
                        <Link
                          href={collection.courseSlugs[0] ? `/courses/${collection.courseSlugs[0]}` : "/courses"}
                          className="relative z-10 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] hover:opacity-80 transition-opacity"
                          style={{ color: collection.bgColor || "var(--accent)" }}
                        >
                          {collection.cta || "Explore"}
                          <ArrowRight className="size-3.5" />
                        </Link>
                      </div>
                    </div>
                  </RevealWrapper>
                ))}
              </div>

              <RevealWrapper>
                <div className="mt-6 text-center">
                  <Button asChild variant="outline" className="font-semibold px-7">
                    <Link href="/courses">View all courses</Link>
                  </Button>
                </div>
              </RevealWrapper>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════
            SECTION 4 — Features
        ═══════════════════════════════════════════════════ */}
        <section aria-labelledby="features-heading" className="section-pad">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <RevealWrapper className="mb-12 text-center">
              <span className="eyebrow mb-4 mx-auto">Why amarbhaiya.in?</span>
              <h2 id="features-heading" className="text-[clamp(1.75rem,5vw,3rem)] font-black tracking-[-0.04em]">
                Simple. Honest. Useful.
              </h2>
            </RevealWrapper>

            {whyItems.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {whyItems.slice(0, 4).map((item, i) => (
                  <RevealWrapper
                    key={`${item.title}-${i}`}
                    className={`stagger-${Math.min(i + 1, 4)}`}
                  >
                    <div className="card-bezel h-full">
                      <div className="card-bezel-inner p-6 flex flex-col gap-4">
                        <span className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-black text-accent"
                          style={{ background: "color-mix(in oklab, var(--accent) 10%, transparent)" }}
                          aria-hidden="true"
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <h3 className="font-bold text-base text-foreground">{item.title}</h3>
                          <p className="text-sm text-foreground/55 mt-1 leading-relaxed">{item.body}</p>
                        </div>
                      </div>
                    </div>
                  </RevealWrapper>
                ))}
              </div>
            ) : (
              <RevealWrapper>
                <div className="card-bezel">
                  <div className="card-bezel-inner p-6 text-sm text-foreground/60">
                    Platform highlights appear automatically from published marketing content.
                  </div>
                </div>
              </RevealWrapper>
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            SECTION 5 — How it works
        ═══════════════════════════════════════════════════ */}
        <section aria-labelledby="how-heading" className="section-pad-sm">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <RevealWrapper className="mb-10 text-center">
              <span className="eyebrow mb-4 mx-auto">How it works</span>
              <h2 id="how-heading" className="text-[clamp(1.75rem,5vw,3rem)] font-black tracking-[-0.04em]">
                Three steps, zero friction.
              </h2>
              <p className="mx-auto mt-3 max-w-prose text-sm leading-6 text-foreground/60 sm:text-base">
                From a free account to your first finished chapter in under five minutes.
              </p>
            </RevealWrapper>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Banao free account",
                  body: "Email aur password se free account banao — koi card nahi, koi trial trap nahi.",
                },
                {
                  step: "02",
                  title: "Chuno apna path",
                  body: "Class aur subject ke hisaab se notes, course, ya live session pehle milega jo actual me useful hai.",
                },
                {
                  step: "03",
                  title: "Roshni karo, results dekho",
                  body: "Chhote structured lessons se chapter complete karo aur progress ko practical rakho.",
                },
              ].map((item, i) => (
                <RevealWrapper key={item.step} className={`stagger-${Math.min(i + 1, 3)}`}>
                  <div className="card-bezel h-full">
                    <div className="card-bezel-inner p-6 flex flex-col gap-4">
                      <span className="font-black text-4xl leading-none opacity-[0.16]" aria-hidden="true">
                        {item.step}
                      </span>
                      <div>
                        <h3 className="font-bold text-base text-foreground">{item.title}</h3>
                        <p className="text-sm text-foreground/55 mt-1 leading-relaxed">{item.body}</p>
                      </div>
                    </div>
                  </div>
                </RevealWrapper>
              ))}
            </div>

            <RevealWrapper className="mt-8 text-center">
              <Button asChild size="lg" className="font-bold px-8 bg-accent text-accent-foreground glow-accent-sm">
                <Link href="/register">Start now — it&apos;s free</Link>
              </Button>
            </RevealWrapper>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            SECTION 6 — Testimonials
        ═══════════════════════════════════════════════════ */}
        <section aria-labelledby="testimonials-heading" className="section-pad-sm">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <RevealWrapper className="mb-10 text-center">
              <span className="eyebrow mb-4 mx-auto">From students</span>
              <h2 id="testimonials-heading" className="text-[clamp(1.75rem,5vw,3rem)] font-black tracking-[-0.04em]">
                4.8/5 — aur rising.
              </h2>
              <p className="mx-auto mt-3 max-w-prose text-sm leading-6 text-foreground/60 sm:text-base">
                Real notes about what learning actually feels like here.
              </p>
            </RevealWrapper>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  quote: "Coaching ke notes mushkil the. Yahan har chapter ka free note seedha aur dry nahi — actually samajh me aata hai.",
                  name: "Class 10 student",
                  detail: "Science · Board prep",
                },
                {
                  quote: "Course kharidne se pehle poora curriculum dekh sakte the. Paid hone ka matlab yahan tabhi hota hai jab value clear ho.",
                  name: "Class 12 student",
                  detail: "Maths · Competitive prep",
                },
                {
                  quote: "Mere bete ko structured lessons ne lagatar padhna easy bana diya. Progress track karna bhi aasaan hai.",
                  name: "Parent",
                  detail: "Guardian of Class 8 student",
                },
              ].map((item, i) => (
                <RevealWrapper key={item.name} className={`stagger-${Math.min(i + 1, 3)}`}>
                  <div className="card-bezel h-full">
                    <div className="card-bezel-inner p-6 flex flex-col gap-4">
                      <div className="flex gap-0.5 text-accent" aria-label="5 out of 5 stars" role="img">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <svg key={j} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M12 2l2.95 6.27 6.9.92-5.05 4.87 1.26 6.84L12 17.9l-6.06 3.03 1.26-6.84L2.15 9.19l6.9-.92L12 2z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-sm font-medium leading-7 text-foreground/80">
                        &ldquo;{item.quote}&rdquo;
                      </p>
                      <div className="mt-auto">
                        <p className="font-bold text-sm text-foreground">{item.name}</p>
                        <p className="text-xs text-foreground/50 mt-0.5">{item.detail}</p>
                      </div>
                    </div>
                  </div>
                </RevealWrapper>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            SECTION 7 — CTA Banner
        ═══════════════════════════════════════════════════ */}
        <section aria-labelledby="cta-heading" className="section-pad-sm pb-safe">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <RevealWrapper>
              <div
                className="rounded-[2rem] p-1.5 relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, color-mix(in oklab, var(--accent) 30%, transparent), color-mix(in oklab, oklch(0.65 0.18 265) 30%, transparent))",
                }}
              >
                <div
                  className="rounded-[calc(2rem-6px)] px-8 py-12 sm:py-16 text-center flex flex-col items-center gap-6"
                  style={{ background: "color-mix(in oklab, var(--surface) 92%, var(--accent) 8%)" }}
                >
                  {/* Glow behind text */}
                  <div
                    className="absolute inset-0 rounded-[calc(2rem-6px)] opacity-30 blur-3xl pointer-events-none"
                    style={{ background: "radial-gradient(ellipse at center, var(--accent), transparent 70%)" }}
                    aria-hidden="true"
                  />

                  <span className="eyebrow relative z-10">Start today</span>
                  <h2
                    id="cta-heading"
                    className="relative z-10 text-[clamp(2rem,6vw,3.5rem)] font-black tracking-[-0.04em] text-foreground max-w-xl leading-tight"
                  >
                    Ek course free mein shuru karo.
                  </h2>
                  <p className="relative z-10 text-foreground/60 max-w-sm text-base leading-relaxed">
                    Account banao — free hai. Har chapter ka notes bhi free hai. Shuruaat karo aaj.
                  </p>
                  <div className="relative z-10 flex flex-wrap gap-3 justify-center">
                    <Button asChild
                        size="lg"
                        className="font-bold px-8 bg-accent text-accent-foreground glow-accent active:scale-[0.97] transition-transform"
                      >
                        <Link href="/register">Free account banao</Link>
                      </Button>
                    <Button asChild size="lg" variant="outline" className="font-semibold px-8">
                      <Link href="/courses">Courses browse karo</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </RevealWrapper>
          </div>
        </section>
    </>
  );
}
