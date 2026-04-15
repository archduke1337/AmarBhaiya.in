"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Menu, X } from "lucide-react";

import { PUBLIC_NAV_ITEMS } from "@/lib/utils/constants";
import { logoutAction } from "@/lib/appwrite/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { ThemeToggle } from "./theme-toggle";

type NavbarClientProps = {
  isAuthenticated: boolean;
  dashboardHref: string;
  firstName: string;
};

export function NavbarClient({
  isAuthenticated,
  dashboardHref,
  firstName,
}: NavbarClientProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);
  const mobileMenuRef = React.useRef<HTMLDivElement>(null);

  const navItems = useMemo(
    () => PUBLIC_NAV_ITEMS.filter((item) => item.href !== "/"),
    []
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen || !mobileMenuRef.current) {
      return;
    }

    const firstFocusable = mobileMenuRef.current.querySelector(
      'a, button, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement | null;
    firstFocusable?.focus();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileOpen]);

  function isActive(path: string) {
    if (path === "/") {
      return pathname === "/";
    }

    return pathname === path || pathname.startsWith(`${path}/`);
  }

  return (
    <>
      <header className="sticky top-0 z-50 px-3 pt-3 md:px-4">
        <div
          className={`mx-auto max-w-7xl rounded-[calc(var(--radius)+8px)] border-2 border-border bg-[color:var(--surface-card)] transition-all ${
            scrolled ? "shadow-retro" : "shadow-retro-sm"
          }`}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center"
                aria-label="Amar Bhaiya home"
              >
                <Image
                  src="/AMAR%20BHAIYA.png"
                  alt="Amar Bhaiya"
                  width={180}
                  height={60}
                  priority
                  className="h-10 w-auto object-contain md:h-11"
                />
              </Link>
              <div className="hidden min-w-0 xl:block">
                <p className="font-heading text-[0.68rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
                  Learn from Bhaiya
                </p>
                <p className="truncate text-sm font-medium text-foreground/75">
                  School-first learning, with skills and career tracks layered in as students grow.
                </p>
              </div>
            </div>

            <nav className="hidden items-center gap-2 lg:flex">
              {navItems.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`inline-flex h-10 items-center rounded-[calc(var(--radius)+2px)] border-2 px-3.5 font-heading text-[0.72rem] font-black uppercase tracking-[0.14em] transition-all ${
                    isActive(link.href)
                      ? "border-border bg-[color:var(--surface-secondary)] text-foreground shadow-retro-sm"
                      : "border-transparent bg-transparent text-muted-foreground hover:border-border hover:bg-[color:var(--surface-accent)] hover:text-foreground hover:shadow-retro-sm"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              <ThemeToggle />

              {isAuthenticated ? (
                <>
                  <Badge variant="outline" className="hidden xl:inline-flex">
                    Hi {firstName || "Learner"}
                  </Badge>
                  <Button asChild variant="secondary" size="sm">
                    <Link href={dashboardHref}>
                      <LayoutDashboard className="size-3.5" />
                      Dashboard
                    </Link>
                  </Button>
                  <form action={logoutAction}>
                    <Button type="submit" variant="outline" size="sm">
                      Sign out
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <Button asChild variant="link" size="sm">
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/register">Start learning</Link>
                  </Button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <ThemeToggle />
              <Button
                ref={menuButtonRef}
                onClick={() => setMobileOpen((current) => !current)}
                variant="secondary"
                size="icon-sm"
                aria-label="Toggle menu"
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-x-3 top-[5.6rem] z-40 md:hidden">
          <div
            ref={mobileMenuRef}
            className="rounded-[calc(var(--radius)+8px)] border-2 border-border bg-[color:var(--surface-card)] shadow-retro"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <nav className="flex flex-col gap-2 p-4">
              {navItems.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-[calc(var(--radius)+2px)] border-2 px-4 py-3 font-heading text-base font-black uppercase tracking-[0.08em] ${
                    isActive(link.href)
                      ? "border-border bg-[color:var(--surface-secondary)] text-foreground shadow-retro-sm"
                      : "border-border bg-[color:var(--surface-card)] text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="mt-2 grid gap-3 border-t-2 border-border pt-4">
                {isAuthenticated ? (
                  <>
                    <Button asChild variant="secondary">
                      <Link href={dashboardHref} onClick={() => setMobileOpen(false)}>
                        Open dashboard
                      </Link>
                    </Button>
                    <form action={logoutAction}>
                      <Button type="submit" variant="outline" className="w-full">
                        Sign out
                      </Button>
                    </form>
                  </>
                ) : (
                  <>
                    <Button asChild variant="outline">
                      <Link href="/login" onClick={() => setMobileOpen(false)}>
                        Log in
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link href="/register" onClick={() => setMobileOpen(false)}>
                        Create account
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
