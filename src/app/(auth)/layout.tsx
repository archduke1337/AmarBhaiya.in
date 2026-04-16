import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle"; // Need to update this one too if it exists

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background flex flex-col md:grid md:grid-cols-2 relative">
      <div className="absolute right-4 top-4 z-50">
        {/* We'll keep the ThemeToggle but should ensure it uses HeroUI later */}
        {/* <ThemeToggle /> */}
      </div>

      {/* ═══════════════════════════════════════════════════
          Left Column — Editorial Typography + Branding
      ═══════════════════════════════════════════════════ */}
      <section className="hidden md:flex flex-col justify-between p-12 bg-surface border-r border-border/50 relative overflow-hidden">
        {/* Ambient glow in bg */}
        <div aria-hidden className="absolute -left-32 -bottom-32 w-[600px] h-[600px] rounded-full opacity-[0.06] blur-[100px]" style={{ background: "var(--accent)" }} />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-2">
           <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }} aria-hidden>A</span>
           <span className="font-bold text-sm text-foreground/80">amarbhaiya<span style={{ color: "var(--accent)" }}>.in</span></span>
        </div>

        {/* Messaging */}
        <div className="relative z-10 my-auto">
          <h1 className="text-[clamp(2.5rem,4vw,4rem)] font-black leading-[1] tracking-[-0.04em] text-foreground max-w-lg mb-6">
            Padhai simple. <br/>
            Results honest.
          </h1>
          <p className="text-foreground/60 text-lg leading-relaxed max-w-sm">
            Join the community of students learning without the coaching-centre fluff. Direct next steps.
          </p>
        </div>

        {/* Footer info */}
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground/40">Student Workspace</p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          Right Column — Auth Form
      ═══════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col justify-center px-4 py-8 sm:px-12 md:max-w-xl mx-auto w-full relative z-10 pt-safe pb-safe">
        {/* Mobile brand header (hidden on md) */}
        <div className="md:hidden flex items-center gap-2 self-center mb-12">
           <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }} aria-hidden>A</span>
           <span className="font-bold text-sm text-foreground/90">amarbhaiya<span style={{ color: "var(--accent)" }}>.in</span></span>
        </div>

        {/* Form Container Container */}
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
