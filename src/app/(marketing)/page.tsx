/**
 * Marketing Homepage — amarbhaiya.in
 * ────────────────────────────────────
 * Design: Ethereal Glass + Editorial Luxury hybrid
 * Vibe: Deep OLED dark, warm amber accent, cinematic typography
 * Layout: Asymmetrical bento + editorial split hero
 * Mobile: min-h-dvh, pb-safe, 44px touch targets, iOS Safe Areas
 *
 * HeroUI v3: Button (onPress, variant, size), Card, compound components
 * No Provider needed in HeroUI v3.
 */

import Link from "next/link";
import { Button } from "@heroui/react";
import { RevealWrapper } from "@/components/ui/reveal-wrapper";
import { getHomePageContent } from "@/lib/appwrite/marketing-content";

export const revalidate = 3600;

const FALLBACK_STATS = [
  { end: 0, suffix: "+", label: "Students" },
  { end: 0, suffix: "+", label: "Courses" },
  { end: 0, suffix: "+", label: "Hours" },
  { end: 0, suffix: " yrs", label: "Teaching" },
];

const FALLBACK_DOMAINS = [
  { title: "School learning", sub: "Class 6 to 12 courses with practical notes" },
  { title: "Exam prep", sub: "Structured revision paths and chapter-level practice" },
  { title: "Doubt support", sub: "Live sessions and actionable feedback loops" },
  { title: "Skills", sub: "Career-oriented skills layered after school basics" },
  { title: "Community", sub: "Learn with peers and stay accountable" },
  { title: "Certificates", sub: "Completion records with verification links" },
];

const FALLBACK_WHY_ITEMS = [
  { title: "Concept clarity", body: "Lessons focus on understanding first, then speed." },
  { title: "Useful notes", body: "Chapter notes are written for revision under pressure." },
  { title: "Live guidance", body: "Students can ask direct doubts in live sessions." },
  { title: "Progress visibility", body: "Courses and milestones stay transparent and trackable." },
];

const DOMAIN_ICONS = ["📐", "🔬", "📖", "🌍", "🖊️", "💻"] as const;
const DOMAIN_COLORS = [
  "oklch(0.70 0.14 265)",
  "oklch(0.70 0.14 148)",
  "oklch(0.72 0.17 55)",
  "oklch(0.68 0.14 32)",
  "oklch(0.70 0.13 330)",
  "oklch(0.68 0.14 220)",
] as const;

const FEATURE_ICONS = ["🎥", "📄", "🔴", "🏆"] as const;

function formatStatValue(end: number, suffix: string) {
  return `${Math.max(0, Math.round(end)).toLocaleString("en-IN")}${suffix}`;
}

// ── Page ─────────────────────────────────────────────────────
export default async function MarketingPage() {
  const fallbackHomeContent = {
    stats: FALLBACK_STATS,
    domains: FALLBACK_DOMAINS,
    learnItems: [],
    featuredCourses: [],
    whyItems: FALLBACK_WHY_ITEMS,
  };

  let homeContent = fallbackHomeContent;

  try {
    const fetchedContent = await getHomePageContent();
    homeContent = {
      ...fetchedContent,
      stats: fetchedContent.stats.length > 0 ? fetchedContent.stats : FALLBACK_STATS,
      domains: fetchedContent.domains.length > 0 ? fetchedContent.domains : FALLBACK_DOMAINS,
      whyItems: fetchedContent.whyItems.length > 0 ? fetchedContent.whyItems : FALLBACK_WHY_ITEMS,
    };
  } catch {
    homeContent = fallbackHomeContent;
  }

  const stats = homeContent.stats.length > 0 ? homeContent.stats : FALLBACK_STATS;
  const domains = homeContent.domains.length > 0 ? homeContent.domains : FALLBACK_DOMAINS;
  const whyItems = homeContent.whyItems.length > 0 ? homeContent.whyItems : FALLBACK_WHY_ITEMS;
  const featuredCourse = homeContent.featuredCourses[0] ?? null;
  const heroDescription =
    homeContent.learnItems[0]?.desc?.trim() ||
    "Class 6 se 12 tak — har subject ke notes, video courses, aur live sessions. Coaching ki zaroorat nahi, Bhaiya hai na.";
  const quickStats = stats.slice(0, 2);

  return (
    <>
      {/* ═══════════════════════════════════════════════════
          SECTION 1 — Hero (Editorial Split)
      ═══════════════════════════════════════════════════ */}
      <section
          aria-label="Hero"
          className="section-pad relative overflow-hidden"
        >
          {/* Ambient glow orbs — GPU-safe, fixed pseudo-elements */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
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
                    <span aria-hidden>✦</span>
                    Learn from Amar Bhaiya
                  </span>
                </RevealWrapper>

                <RevealWrapper className="stagger-1">
                  <h1 className="text-[clamp(2.5rem,8vw,5rem)] font-black leading-[0.92] tracking-[-0.04em] text-foreground">
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
                  <p className="text-base sm:text-lg text-foreground/60 font-medium leading-relaxed max-w-md">
                    {heroDescription}
                  </p>
                </RevealWrapper>

                <RevealWrapper className="stagger-3 flex flex-wrap gap-3 pt-2">
                  <Link href="/courses">
                    <Button
                      size="lg"
                      className="font-bold px-7 bg-accent text-accent-foreground glow-accent-sm active:scale-[0.97] transition-transform"
                    >
                      Courses dekho
                      <span
                        className="ml-2 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                        style={{ background: "oklch(0 0 0 / 0.15)" }}
                        aria-hidden
                      >
                        →
                      </span>
                    </Button>
                  </Link>
                  <Link href="/notes">
                    <Button
                      size="lg"
                      variant="outline"
                      className="font-semibold px-7"
                    >
                      Free notes
                    </Button>
                  </Link>
                </RevealWrapper>

                {/* Stats row */}
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
              </div>

              {/* Right — Asymmetric bento preview cards */}
              <RevealWrapper className="stagger-2 grid grid-cols-2 gap-3">
                {/* Big card */}
                <div
                  className="card-bezel col-span-2"
                  style={{ background: "color-mix(in oklab, var(--surface) 85%, var(--accent) 8%)" }}
                >
                  <div className="card-bezel-inner p-5">
                    {featuredCourse ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-2xl" aria-hidden>🎓</span>
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
                      <span className="text-2xl" aria-hidden>{index === 0 ? "🔥" : "📄"}</span>
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
              <p className="mt-3 text-foreground/55 max-w-md mx-auto">
                Expert-crafted content for every NCERT chapter, every class.
              </p>
            </RevealWrapper>

            {/* Responsive subject grid */}
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
                        <span className="text-3xl" aria-hidden>{DOMAIN_ICONS[i % DOMAIN_ICONS.length]}</span>
                        <div>
                          <p className="font-bold text-sm text-foreground">{domain.title}</p>
                          <p className="text-xs text-foreground/50 mt-0.5">{domain.sub}</p>
                        </div>
                        <span
                          className="text-xs font-semibold self-start opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300"
                          style={{ color: DOMAIN_COLORS[i % DOMAIN_COLORS.length] }}
                        >
                          Explore →
                        </span>
                      </div>
                    </div>
                  </Link>
                </RevealWrapper>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            SECTION 3 — Features
        ═══════════════════════════════════════════════════ */}
        <section aria-labelledby="features-heading" className="section-pad">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <RevealWrapper className="mb-12 text-center">
              <span className="eyebrow mb-4 mx-auto">Why amarbhaiya.in?</span>
              <h2 id="features-heading" className="text-[clamp(1.75rem,5vw,3rem)] font-black tracking-[-0.04em]">
                Simple. Honest. Useful.
              </h2>
            </RevealWrapper>

            <div className="grid gap-4 sm:grid-cols-2">
              {whyItems.slice(0, 4).map((item, i) => (
                <RevealWrapper
                  key={`${item.title}-${i}`}
                  className={`stagger-${Math.min(i + 1, 4)}`}
                >
                  <div className="card-bezel h-full">
                    <div className="card-bezel-inner p-6 flex flex-col gap-4">
                      <span className="text-3xl w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: "color-mix(in oklab, var(--accent) 10%, transparent)" }}
                        aria-hidden
                      >
                        {FEATURE_ICONS[i % FEATURE_ICONS.length]}
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
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            SECTION 4 — CTA Banner
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
                    aria-hidden
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
                    <Link href="/register">
                      <Button
                        size="lg"
                        className="font-bold px-8 bg-accent text-accent-foreground glow-accent active:scale-[0.97] transition-transform"
                      >
                        Free account banao
                      </Button>
                    </Link>
                    <Link href="/courses">
                      <Button size="lg" variant="outline" className="font-semibold px-8">
                        Courses browse karo
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </RevealWrapper>
          </div>
        </section>
    </>
  );
}
