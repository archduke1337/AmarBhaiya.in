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

function FooterLinkColumn({
  title,
  links,
}: {
  title: string;
  links: FooterLinkItem[];
}) {
  return (
    <div>
      <p className="mb-4 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-foreground/40">
        {title}
      </p>
      <ul className="space-y-2.5" role="list">
        {links.map((link) => (
          <li key={`${title}-${link.href}`}>
            <Link
              href={link.href}
              className="inline-flex min-h-11 items-center text-sm font-medium text-foreground/65 transition-colors duration-200 hover:text-foreground"
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
  return (
    <footer className="mt-auto border-t border-border/40 pb-safe" aria-label="Site footer">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <section className="relative overflow-hidden rounded-[calc(var(--radius)+10px)] border border-border/50 bg-surface/70 p-6 shadow-surface sm:p-8">
          <div
            className="pointer-events-none absolute -right-20 -top-16 h-64 w-64 rounded-full opacity-[0.13] blur-3xl"
            style={{ background: "var(--accent)" }}
            aria-hidden
          />

          <div className="relative grid gap-10 lg:grid-cols-[1.05fr_1fr]">
            <div className="space-y-5">
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
                <p className="max-w-xl text-sm font-medium leading-7 text-foreground/65">
                  Start with notes, move into structured courses, and learn at a pace you can sustain.
                  Every section here is designed to help you choose the next useful step quickly.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="inline-flex min-h-11 items-center rounded-full bg-accent px-4 py-2 text-sm font-bold text-accent-foreground transition-transform duration-200 hover:scale-[1.01]"
                >
                  Start free
                </Link>
                <Link
                  href="/courses"
                  className="inline-flex min-h-11 items-center rounded-full border border-border/70 bg-background px-4 py-2 text-sm font-semibold text-foreground/80 transition-colors duration-200 hover:text-foreground"
                >
                  Browse courses
                </Link>
              </div>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {footerLinkGroups.map((group) => (
                <FooterLinkColumn key={group.title} title={group.title} links={group.links} />
              ))}
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-5 rounded-[calc(var(--radius)+6px)] border border-border/40 bg-surface/50 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
          <div className="space-y-2">
            <a
              href={`mailto:${OWNER.email}`}
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-foreground/75 transition-colors hover:text-foreground"
            >
              <Mail className="size-4" />
              {OWNER.email}
            </a>
            <div className="flex flex-wrap gap-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-foreground/45">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-8 items-center gap-1 transition-colors hover:text-foreground/70"
                >
                  {item.label}
                  <ArrowUpRight className="size-3" />
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-[0.12em] text-foreground/40 sm:justify-end">
            <Link href="/privacy" className="inline-flex min-h-8 items-center transition-colors hover:text-foreground/70">
              Privacy
            </Link>
            <Link href="/terms" className="inline-flex min-h-8 items-center transition-colors hover:text-foreground/70">
              Terms
            </Link>
            <Link href="/certificates" className="inline-flex min-h-8 items-center transition-colors hover:text-foreground/70">
              Verify certificates
            </Link>
          </div>
        </div>

        <p className="mt-5 text-center text-xs font-semibold uppercase tracking-[0.12em] text-foreground/35 sm:text-left">
          © {new Date().getFullYear()} amarbhaiya.in · {OWNER.name}
        </p>
      </div>
    </footer>
  );
}
