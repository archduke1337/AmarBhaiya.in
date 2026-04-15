import Image from "next/image";
import Link from "next/link";
import { ArrowRight, FileText, Mail, MessageSquare, PlayCircle } from "lucide-react";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OWNER, PUBLIC_NAV_ITEMS } from "@/lib/utils/constants";

export function Footer() {
  const platformLinks = PUBLIC_NAV_ITEMS.filter((item) => item.href !== "/");

  const socialLinks = [
    { label: "YouTube", href: OWNER.social.youtube },
    { label: "Instagram", href: OWNER.social.instagram },
    { label: "LinkedIn", href: OWNER.social.linkedin },
    { label: "Twitter", href: OWNER.social.twitter },
  ];

  return (
    <footer className="mt-16 px-4 pb-8 pt-2 md:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <RetroPanel tone="card" size="lg" className="space-y-6">
          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.9fr_0.8fr_0.9fr]">
            <RetroPanel tone="secondary" className="space-y-4">
              <Link href="/" className="inline-flex items-center" aria-label="Amar Bhaiya home">
                <Image
                  src="/AMAR%20BHAIYA.png"
                  alt="Amar Bhaiya"
                  width={220}
                  height={74}
                  className="h-12 w-auto object-contain"
                />
              </Link>
              <p className="max-w-sm text-sm font-medium leading-7 text-foreground/80">
                amarbhaiya.in is built around the way students actually study:
                one useful note, one clear lesson, one honest explanation at a
                time. School learning comes first. Skill tracks grow from there.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Study notes</Badge>
                <Badge variant="outline">Courses</Badge>
                <Badge variant="outline">Live sessions</Badge>
                <Badge variant="outline">Community</Badge>
              </div>
            </RetroPanel>

            <RetroPanel tone="accent" className="space-y-4">
              <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
                Explore
              </p>
              <div className="flex flex-col gap-3">
                {platformLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="inline-flex items-center justify-between gap-3 text-sm font-semibold text-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                    <ArrowRight className="size-3.5" />
                  </Link>
                ))}
              </div>
            </RetroPanel>

            <RetroPanel tone="muted" className="space-y-4">
              <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
                Contact
              </p>
              <a
                href={`mailto:${OWNER.email}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
              >
                <Mail className="size-4" />
                {OWNER.email}
              </a>
              <div className="flex flex-col gap-3">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </RetroPanel>

            <RetroPanel tone="card" className="space-y-4">
              <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
                Need a starting point?
              </p>
              <p className="text-sm font-medium leading-7 text-foreground/80">
                New student? Start with the notes library. Ready to commit to a
                full path? Move into a course and study with structure.
              </p>
              <div className="grid gap-3">
                <Button asChild variant="ghost">
                  <Link href="/notes">
                    <FileText className="size-4" />
                    Open notes
                  </Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/courses">
                    <PlayCircle className="size-4" />
                    Browse courses
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/contact">
                    <MessageSquare className="size-4" />
                    Contact us
                  </Link>
                </Button>
              </div>
            </RetroPanel>
          </div>
        </RetroPanel>

        <RetroPanel tone="muted" className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <span className="font-heading text-[0.72rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
            © {new Date().getFullYear()} amarbhaiya.in
          </span>
          <div className="flex flex-wrap justify-center gap-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground md:justify-end">
            <Link href="/contact" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
            <Link href="/contact" className="transition-colors hover:text-foreground">
              Terms
            </Link>
            <Link href="/contact" className="transition-colors hover:text-foreground">
              Refund policy
            </Link>
          </div>
        </RetroPanel>
      </div>
    </footer>
  );
}
