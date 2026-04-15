import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  Mail,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { OWNER, PUBLIC_NAV_ITEMS } from "@/lib/utils/constants";

export function Footer() {
  const platformLinks = PUBLIC_NAV_ITEMS.filter((item) => item.href !== "/");

  const socialLinks = [
    { label: "YouTube", href: OWNER.social.youtube, icon: Youtube },
    { label: "Instagram", href: OWNER.social.instagram, icon: Instagram },
    { label: "LinkedIn", href: OWNER.social.linkedin, icon: ExternalLink },
    { label: "Twitter", href: OWNER.social.twitter, icon: ExternalLink },
  ];

  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        {/* Main footer grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center" aria-label="Amar Bhaiya home">
              <Image
                src="/AMAR%20BHAIYA.png"
                alt="Amar Bhaiya"
                width={160}
                height={53}
                className="h-9 w-auto object-contain"
              />
            </Link>
            <p className="max-w-xs text-sm font-medium leading-relaxed text-muted-foreground">
              Class 6 se 12th tak board prep, coding, career guidance,
              aur life skills — sab ek jagah pe, Bhaiya ke saath.
            </p>
            {/* Social icons (mobile-friendly row) */}
            <div className="flex gap-2">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={link.label}
                >
                  <link.icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Explore
            </h3>
            <nav className="flex flex-col gap-2.5">
              {platformLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm font-semibold text-foreground/80 transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Resources
            </h3>
            <nav className="flex flex-col gap-2.5">
              <Link
                href="/notes"
                className="text-sm font-semibold text-foreground/80 transition-colors hover:text-primary"
              >
                Free Study Notes
              </Link>
              <Link
                href="/courses"
                className="text-sm font-semibold text-foreground/80 transition-colors hover:text-primary"
              >
                All Courses
              </Link>
              <Link
                href="/blog"
                className="text-sm font-semibold text-foreground/80 transition-colors hover:text-primary"
              >
                Blog & Articles
              </Link>
              <Link
                href="/certificates"
                className="text-sm font-semibold text-foreground/80 transition-colors hover:text-primary"
              >
                Verify Certificate
              </Link>
            </nav>
          </div>

          {/* Contact + CTA */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Get in touch
            </h3>
            <a
              href={`mailto:${OWNER.email}`}
              className="flex items-center gap-2 text-sm font-semibold text-foreground/80 transition-colors hover:text-primary"
            >
              <Mail className="size-4 shrink-0" />
              {OWNER.email}
            </a>
            <div className="space-y-2 pt-2">
              <Button asChild size="sm" className="w-full">
                <Link href="/register">
                  Start learning free
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/contact">
                  Contact us
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Made with <Heart className="size-3 fill-primary text-primary" /> by Amar Bhaiya
            <span className="text-border">·</span>
            © {new Date().getFullYear()} amarbhaiya.in
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs font-medium text-muted-foreground sm:justify-end">
            <Link href="/contact" className="transition-colors hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/contact" className="transition-colors hover:text-foreground">
              Terms of Use
            </Link>
            <Link href="/contact" className="transition-colors hover:text-foreground">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
