import type { Metadata } from "next";
import { ThemeToggle } from "@/components/theme-toggle";

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
    <div className="min-h-screen bg-background px-4 py-6 md:px-6 md:py-8">
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>
      <main
        id="main"
        className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl gap-6 md:grid-cols-[1.05fr_0.95fr]"
      >
        <section className="retro-surface relative hidden overflow-hidden bg-secondary p-8 text-secondary-foreground md:flex md:flex-col md:justify-between">
          <div className="flex flex-col gap-5">
            <p className="font-heading text-xs uppercase tracking-[0.18em] text-secondary-foreground/70">
              Amarbhaiya.in
            </p>
            <h1 className="max-w-xl text-6xl leading-[0.9]">
              Learn loud. Build fast. Stay practical.
            </h1>
            <p className="max-w-md text-base font-semibold leading-relaxed text-secondary-foreground/80">
              Courses, mentoring, live sessions, and community spaces in one chunky workspace made for real progress.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="retro-surface -rotate-1 bg-card p-5">
              <p className="font-heading text-xs uppercase tracking-[0.16em] text-muted-foreground">
                What you get
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[calc(var(--radius)+2px)] border-2 border-border bg-accent p-4 shadow-retro-sm">
                  <p className="text-2xl">100+</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground/70">
                    Lessons & tools
                  </p>
                </div>
                <div className="rounded-[calc(var(--radius)+2px)] border-2 border-border bg-primary p-4 text-primary-foreground shadow-retro-sm">
                  <p className="text-2xl">Live</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground/70">
                    Sessions & replays
                  </p>
                </div>
              </div>
            </div>

            <div className="retro-surface ml-10 rotate-1 bg-accent p-5">
              <p className="font-heading text-xs uppercase tracking-[0.16em] text-accent-foreground/70">
                Built for
              </p>
              <ul className="mt-3 grid gap-2 text-sm font-semibold">
                <li>Students who want clarity, not fluff</li>
                <li>Actionable lessons with direct next steps</li>
                <li>One account across learning, billing, and live sessions</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="retro-surface flex items-center justify-center bg-card px-5 py-8 md:px-8">
          {children}
        </section>
      </main>
    </div>
  );
}
