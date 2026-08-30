/**
 * Footer — amarbhaiya.in
 * ──────────────────────
 * Editorial utility footer.
 * Calm typographic hierarchy: hairline dividers, no nested panels,
 * no decorative blobs. iOS safe-area aware (pb-safe).
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
      { label: "Pricing", href: "/pricing" },
      { label: "Certificates", href: "/certificates" },
      { label: "Community", href: "/app/community" },
      { label: "Live sessions", href: "/app/live" },
      { label: "FAQ", href: "/faq" },
      { label: "Support", href: "/support" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Register", href: "/register" },
      { label: "Login", href: "/login" },
      { label: "Dashboard", href: "/app/dashboard" },
      { label: "Instructor", href: "/instructor" },
      { label: "Careers & collaborations", href: "/careers" },
    ],
  },
];

const socialLinks: FooterLinkItem[] = [
  { label: "YouTube", href: OWNER.social.youtube },
  { label: "Instagram", href: OWNER.social.instagram },
  { label: "WhatsApp", href: OWNER.social.whatsapp },
  { label: "LinkedIn", href: OWNER.social.linkedin },
];

const legalLinks: FooterLinkItem[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Refunds", href: "/refund-policy" },
  { label: "Cookies", href: "/cookie-policy" },
  { label: "Grievance", href: "/grievance-redressal" },
  { label: "Legal", href: "/legal" },
];

function BrandMark() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5" aria-label="amarbhaiya.in home">
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-[10px] font-heading text-base font-normal"
        style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
        aria-hidden="true"
      >
        A
      </span>
      <span className="font-heading text-lg font-normal tracking-[-0.01em] text-foreground">
        amarbhaiya<span style={{ color: "var(--accent)" }}>.in</span>
      </span>
    </Link>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/40 pb-safe" aria-label="Site footer">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        {/* ── Top: statement + links ── */}
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          {/* Statement block */}
          <div className="space-y-5">
            <BrandMark />
            <p className="max-w-sm font-heading text-2xl font-normal leading-snug tracking-[-0.02em] text-foreground">
              Built for students who need clarity, not noise.
            </p>
            <p className="max-w-md text-sm font-medium leading-6 text-foreground/60">
              Start with notes, move into structured courses, and learn at a pace you can sustain.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1 text-sm font-semibold text-foreground/70">
              <Link
                href="/register"
                className="inline-flex min-h-11 items-center underline-offset-4 text-foreground/80 transition-colors hover:text-accent hover:underline"
              >
                Create free account
              </Link>
              <Link
                href="/courses"
                className="inline-flex min-h-11 items-center underline-offset-4 text-foreground/80 transition-colors hover:text-accent hover:underline"
              >
                Browse courses
              </Link>
            </div>
          </div>

          {/* Link columns */}
          <nav className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3" aria-label="Footer navigation">
            {footerLinkGroups.map((group) => (
              <div key={group.title}>
                <p className="mb-3 font-sans text-[0.65rem] font-extrabold uppercase tracking-[0.16em] text-foreground/55">
                  {group.title}
                </p>
                <ul className="space-y-0.5" role="list">
                  {group.links.map((link) => (
                    <li key={`${group.title}-${link.href}`}>
                      <Link
                        href={link.href}
                        className="inline-flex min-h-9 items-center text-sm font-medium text-foreground/70 transition-colors duration-200 hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* ── Middle divider row: contact + socials ── */}
        <div className="mt-10 flex flex-col gap-4 border-t border-border/40 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <a
            href={`mailto:${OWNER.email}`}
            className="inline-flex min-h-9 items-center gap-2 break-all text-sm font-semibold text-foreground/80 transition-colors hover:text-foreground sm:break-normal"
          >
            <Mail className="size-4 shrink-0" aria-hidden="true" />
            {OWNER.email}
          </a>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {socialLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-8 items-center gap-1 text-xs font-bold uppercase tracking-[0.1em] text-foreground/65 transition-colors hover:text-foreground/90"
              >
                {item.label}
                <ArrowUpRight className="size-3" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>

        {/* ── Bottom bar: legal + copyright ── */}
        <div className="mt-5 flex flex-col gap-3 border-t border-border/30 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Legal">
            {legalLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-7 items-center text-xs font-semibold text-foreground/60 transition-colors hover:text-foreground/80"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="text-xs font-medium text-foreground/55">
            © {currentYear} amarbhaiya.in · {OWNER.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
