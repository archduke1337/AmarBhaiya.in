/**
 * Footer — amarbhaiya.in
 * ──────────────────────
 * Editorial utility footer.
 * iOS safe-area aware (pb-safe).
 * Uses existing Tailwind v4 + theme tokens.
 */

import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";

import { OWNER, PUBLIC_NAV_ITEMS } from "@/lib/utils/constants";

type FooterLinkItem = {
  label: string;
  href: string;
};

const footerLinkGroups: Array<{ title: string; links: FooterLinkItem[] }> = [
  {
    title: "Learn",
    links: PUBLIC_NAV_ITEMS.filter((item) => item.href !== "/").slice(0, 4),
  },
  {
    title: "Platform",
    links: [
      { label: "Certificates", href: "/certificates" },
      { label: "Community", href: "/app/community" },
      { label: "Live sessions", href: "/app/live" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Register", href: "/register" },
      { label: "Login", href: "/login" },
      { label: "Dashboard", href: "/app/dashboard" },
      { label: "Instructor", href: "/instructor" },
    ],
  },
];

const socialLinks: FooterLinkItem[] = [
  { label: "YouTube", href: OWNER.social.youtube },
  { label: "Instagram", href: OWNER.social.instagram },
  { label: "LinkedIn", href: OWNER.social.linkedin },
  { label: "Twitter", href: OWNER.social.twitter },
];

const mobileQuickLinks: FooterLinkItem[] = [
  { label: "Courses", href: "/courses" },
  { label: "Notes", href: "/notes" },
  { label: "Contact", href: "/contact" },
  { label: "Login", href: "/login" },
];

function FooterLinkColumn({
  title,
  links,
}: {
  title: string;
  links: FooterLinkItem[];
}) {
  return (
    <div>
      <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-foreground/40">
        {title}
      </p>
      <ul className="space-y-1.5" role="list">
        {links.map((link) => (
          <li key={`${title}-${link.href}`}>
            <Link
              href={link.href}
              className="inline-flex min-h-10 items-center text-sm font-medium text-foreground/65 transition-colors duration-200 hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/40 pb-safe" aria-label="Site footer">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
        <section className="relative overflow-hidden rounded-[calc(var(--radius)+10px)] border border-border/50 bg-surface/70 p-5 shadow-surface sm:p-8">
          <div
            className="pointer-events-none absolute -right-20 -top-16 h-64 w-64 rounded-full opacity-[0.13] blur-3xl"
            style={{ background: "var(--accent)" }}
            aria-hidden
          />

          <div className="relative space-y-4 sm:hidden">
            <Link href="/" className="inline-flex items-center gap-2" aria-label="amarbhaiya.in home">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black"
                style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                aria-hidden
              >
                A
              </span>
              <span className="font-bold text-sm text-foreground/80">
                amarbhaiya<span style={{ color: "var(--accent)" }}>.in</span>
              </span>
            </Link>

            <p className="text-sm font-medium leading-6 text-foreground/65">
              Notes first, courses next, progress that stays practical.
            </p>

            <div className="grid gap-2">
              <Link
                href="/register"
                className="inline-flex min-h-10 w-full items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-bold text-accent-foreground"
              >
                Start free
              </Link>
              <Link
                href="/courses"
                className="inline-flex min-h-10 w-full items-center justify-center rounded-full border border-border/70 bg-background px-4 py-2 text-sm font-semibold text-foreground/80 transition-colors duration-200 hover:text-foreground"
              >
                Browse courses
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {mobileQuickLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex min-h-9 items-center justify-center rounded-xl border border-border/60 bg-background/80 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-foreground/65"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="relative hidden gap-8 sm:grid lg:grid-cols-[1.05fr_1fr] lg:gap-10">
            <div className="space-y-4 sm:space-y-5">
              <Link href="/" className="inline-flex items-center gap-2" aria-label="amarbhaiya.in home">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black"
                  style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                  aria-hidden
                >
                  A
                </span>
                <span className="font-bold text-sm text-foreground/80">
                  amarbhaiya<span style={{ color: "var(--accent)" }}>.in</span>
                </span>
              </Link>

              <div className="space-y-3">
                <h2 className="font-heading text-[clamp(1.4rem,2.8vw,2rem)] font-black tracking-[-0.03em] text-foreground">
                  Built for students who need clarity, not noise.
                </h2>
                <p className="max-w-xl text-sm font-medium leading-6 text-foreground/65 sm:leading-7">
                  Start with notes, move into structured courses, and learn at a pace you can sustain.
                  Every section here is designed to help you choose the next useful step quickly.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-bold text-accent-foreground transition-transform duration-200 hover:scale-[1.01]"
                >
                  Start free
                </Link>
                <Link
                  href="/courses"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-border/70 bg-background px-4 py-2 text-sm font-semibold text-foreground/80 transition-colors duration-200 hover:text-foreground"
                >
                  Browse courses
                </Link>
              </div>
            </div>

            <div className="grid gap-x-5 gap-y-6 min-[480px]:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {footerLinkGroups.map((group, index) => (
                <div
                  key={group.title}
                  className={
                    index === footerLinkGroups.length - 1
                      ? "min-[480px]:col-span-2 lg:col-span-1"
                      : ""
                  }
                >
                  <FooterLinkColumn title={group.title} links={group.links} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-4 rounded-[calc(var(--radius)+6px)] border border-border/40 bg-surface/50 p-4 sm:mt-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
          <div className="space-y-2">
            <a
              href={`mailto:${OWNER.email}`}
              className="inline-flex min-h-10 items-center gap-2 break-all text-sm font-semibold text-foreground/75 transition-colors hover:text-foreground sm:min-h-11 sm:break-normal"
            >
              <Mail className="size-4" />
              {OWNER.email}
            </a>
            <div className="flex flex-wrap gap-2.5 text-[11px] font-semibold uppercase tracking-widest text-foreground/45 sm:gap-3.5 sm:text-xs sm:tracking-[0.12em]">
              {socialLinks.map((item, index) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex min-h-8 items-center gap-1 px-1 transition-colors hover:text-foreground/70 ${index > 1 ? "hidden sm:inline-flex" : ""}`}
                >
                  {item.label}
                  <ArrowUpRight className="size-3" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] font-semibold uppercase tracking-widest text-foreground/40 min-[420px]:grid-cols-3 sm:flex sm:flex-wrap sm:justify-end sm:gap-4 sm:text-xs sm:tracking-[0.12em]">
            <Link href="/privacy" className="inline-flex min-h-8 items-center transition-colors hover:text-foreground/70">
              Privacy
            </Link>
            <Link href="/terms" className="inline-flex min-h-8 items-center transition-colors hover:text-foreground/70">
              Terms
            </Link>
            <Link href="/certificates" className="hidden min-h-8 items-center transition-colors hover:text-foreground/70 min-[420px]:inline-flex">
              Verify certificates
            </Link>
          </div>
        </div>

        <p className="mt-5 text-center text-xs font-semibold uppercase tracking-[0.12em] text-foreground/35 sm:text-left">
          <span className="sm:hidden">© {currentYear} amarbhaiya.in</span>
          <span className="hidden sm:inline">© {currentYear} amarbhaiya.in · {OWNER.name}</span>
        </p>
      </div>
    </footer>
  );
}
