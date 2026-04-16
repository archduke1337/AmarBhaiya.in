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

// ── Static content (no Appwrite needed for shell — ISR fills data) ──
const STATS = [
  { value: "50K+",  label: "Students"     },
  { value: "200+",  label: "Courses"      },
  { value: "1000+", label: "Free Notes"   },
  { value: "Class 6–12", label: "Coverage" },
];

const SUBJECTS = [
  { title: "Mathematics",   emoji: "📐", color: "oklch(0.70 0.14 265)", count: "42 courses" },
  { title: "Science",       emoji: "🔬", color: "oklch(0.70 0.14 148)", count: "38 courses" },
  { title: "English",       emoji: "📖", color: "oklch(0.72 0.17 55)",  count: "28 courses" },
  { title: "Social Science",emoji: "🌍", color: "oklch(0.68 0.14 32)",  count: "24 courses" },
  { title: "Hindi",         emoji: "🖊️", color: "oklch(0.70 0.13 330)", count: "20 courses" },
  { title: "Computer",      emoji: "💻", color: "oklch(0.68 0.14 220)", count: "15 courses" },
];

const FEATURES = [
  {
    icon: "🎥",
    title: "HD Video Lessons",
    body: "Concepts explained simply, in Hinglish. No coaching-centre jargon.",
  },
  {
    icon: "📄",
    title: "Free Notes",
    body: "Downloadable PDFs for every chapter, every class. Always free.",
  },
  {
    icon: "🔴",
    title: "Live Q&A Sessions",
    body: "Ask Bhaiya directly. Real-time doubt solving, no waiting.",
  },
  {
    icon: "🏆",
    title: "Certificates",
    body: "Complete a course, earn a shareable certificate. Proof of learning.",
  },
];

// ── Page ─────────────────────────────────────────────────────
export default function MarketingPage() {
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
                    Class 6 se 12 tak — har subject ke notes, video courses, aur live sessions.
                    Coaching ki zaroorat nahi, Bhaiya hai na.
                  </p>
                </RevealWrapper>

                <RevealWrapper className="stagger-3 flex flex-wrap gap-3 pt-2">
                  <Link href="/courses">
                    <Button
                      size="lg"
                      onPress={() => {}}
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
                      onPress={() => {}}
                      className="font-semibold px-7"
                    >
                      Free notes
                    </Button>
                  </Link>
                </RevealWrapper>

                {/* Stats row */}
                <RevealWrapper className="stagger-4 flex flex-wrap gap-6 pt-4 border-t border-border/40">
                  {STATS.map((stat) => (
                    <div key={stat.label} className="flex flex-col">
                      <span className="text-xl font-black text-foreground leading-none">{stat.value}</span>
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
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl" aria-hidden>📐</span>
                      <div>
                        <p className="font-bold text-sm text-foreground">Class 10 Mathematics</p>
                        <p className="text-xs text-foreground/50">42 lessons · Free + Paid</p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-foreground/60">Progress</span>
                        <span className="text-accent font-bold">68%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-default overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: "68%", background: "var(--accent)" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Streak card */}
                <div className="card-bezel">
                  <div className="card-bezel-inner p-4 flex flex-col gap-1">
                    <span className="text-2xl" aria-hidden>🔥</span>
                    <span className="text-2xl font-black text-foreground leading-none">14</span>
                    <span className="text-xs text-foreground/50 font-medium">Day streak</span>
                  </div>
                </div>

                {/* Notes card */}
                <div className="card-bezel">
                  <div className="card-bezel-inner p-4 flex flex-col gap-1">
                    <span className="text-2xl" aria-hidden>📄</span>
                    <span className="text-2xl font-black text-foreground leading-none">∞</span>
                    <span className="text-xs text-foreground/50 font-medium">Free notes</span>
                  </div>
                </div>
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
              {SUBJECTS.map((subject, i) => (
                <RevealWrapper
                  key={subject.title}
                  className={`stagger-${Math.min(i + 1, 5)}`}
                >
                  <Link
                    href={`/courses?subject=${subject.title.toLowerCase()}`}
                    className="block group"
                  >
                    <div
                      className="card-bezel h-full"
                      style={{
                        background: `color-mix(in oklab, var(--surface) 88%, ${subject.color} 12%)`,
                      }}
                    >
                      <div className="card-bezel-inner p-5 flex flex-col gap-3 min-h-[120px] group-hover:bg-surface/80 transition-colors duration-300">
                        <span className="text-3xl" aria-hidden>{subject.emoji}</span>
                        <div>
                          <p className="font-bold text-sm text-foreground">{subject.title}</p>
                          <p className="text-xs text-foreground/50 mt-0.5">{subject.count}</p>
                        </div>
                        <span
                          className="text-xs font-semibold self-start opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300"
                          style={{ color: subject.color }}
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
              {FEATURES.map((feat, i) => (
                <RevealWrapper
                  key={feat.title}
                  className={`stagger-${Math.min(i + 1, 4)}`}
                >
                  <div className="card-bezel h-full">
                    <div className="card-bezel-inner p-6 flex flex-col gap-4">
                      <span className="text-3xl w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: "color-mix(in oklab, var(--accent) 10%, transparent)" }}
                        aria-hidden
                      >
                        {feat.icon}
                      </span>
                      <div>
                        <h3 className="font-bold text-base text-foreground">{feat.title}</h3>
                        <p className="text-sm text-foreground/55 mt-1 leading-relaxed">{feat.body}</p>
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
                        onPress={() => {}}
                        className="font-bold px-8 bg-accent text-accent-foreground glow-accent active:scale-[0.97] transition-transform"
                      >
                        Free account banao
                      </Button>
                    </Link>
                    <Link href="/courses">
                      <Button size="lg" variant="outline" onPress={() => {}} className="font-semibold px-8">
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
