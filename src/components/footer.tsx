import Image from "next/image";
import Link from "next/link";

import { OWNER } from "@/lib/utils/constants";

export function Footer() {
  const platformLinks = [
    { label: "Courses", href: "/courses" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
    { label: "Login", href: "/login" },
  ];

  const socialLinks = [
    { label: "YouTube", href: OWNER.social.youtube },
    { label: "Instagram", href: OWNER.social.instagram },
    { label: "LinkedIn", href: OWNER.social.linkedin },
    { label: "Twitter", href: OWNER.social.twitter },
  ];

  return (
    <footer className="mt-12 border-t bg-background px-4 pb-6 pt-4 md:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <div className="retro-surface grid gap-6 bg-card p-6 md:grid-cols-[1.35fr_0.75fr_0.75fr]">
          <div className="retro-dot rounded-[calc(var(--radius)+2px)] border-2 border-border bg-secondary p-5 shadow-retro-sm">
            <Link href="/" className="inline-flex items-center" aria-label="Amar Bhaiya home">
              <Image
                src="/AMAR%20BHAIYA.png"
                alt="Amar Bhaiya"
                width={220}
                height={74}
                className="h-12 w-auto object-contain"
              />
            </Link>
            <p className="mt-4 max-w-sm text-sm font-semibold leading-relaxed text-secondary-foreground/80">
              School se college tak — coding, fitness, career, aur life skills.
              Bina kisi gatekeeping ke. Seedha, practical, kaam ka content.
            </p>
          </div>

          <div className="rounded-[calc(var(--radius)+2px)] border-2 border-border bg-accent p-5 shadow-retro-sm">
            <h4 className="font-heading text-xs uppercase tracking-[0.16em] text-accent-foreground/70">Platform</h4>
            <div className="mt-4 flex flex-col gap-3">
              {platformLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="block text-sm font-semibold text-accent-foreground transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[calc(var(--radius)+2px)] border-2 border-border bg-muted p-5 shadow-retro-sm">
            <h4 className="font-heading text-xs uppercase tracking-[0.16em] text-muted-foreground">Connect</h4>
            <div className="mt-4 flex flex-col gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-sm font-semibold text-foreground transition-colors hover:text-primary"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="retro-surface flex flex-col items-center justify-between gap-4 bg-card px-5 py-4 md:flex-row">
        <span className="font-heading text-xs uppercase tracking-[0.14em] text-muted-foreground">
          © {new Date().getFullYear()} amarbhaiya.in
        </span>
        <div className="flex flex-wrap gap-4 text-xs font-semibold text-muted-foreground">
          <Link href="/contact" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link href="/contact" className="hover:text-foreground transition-colors">Terms</Link>
          <Link href="/contact" className="hover:text-foreground transition-colors">Refund Policy</Link>
        </div>
        </div>
      </div>
    </footer>
  );
}
