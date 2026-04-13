"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LayoutDashboard, Menu, X } from "lucide-react";

import { logoutAction } from "@/lib/appwrite/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { ThemeToggle } from "./theme-toggle";

const NAV_LINKS = [
  { label: "About", href: "/about" },
  { label: "Courses", href: "/courses" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

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
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);
  const mobileMenuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Focus management for mobile menu
  useEffect(() => {
    if (mobileOpen && mobileMenuRef.current) {
      // Find first interactive element
      const firstFocusable = mobileMenuRef.current.querySelector(
        'a, button, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      firstFocusable?.focus();

      // Handle Escape key to close menu
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setMobileOpen(false);
          menuButtonRef.current?.focus();
        }
      };

      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [mobileOpen]);

  return (
    <>
      <header
        className="sticky top-0 z-50 px-3 py-3 md:px-4"
      >
        <div
          className={`retro-surface mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6 ${
            scrolled ? "bg-card" : "bg-card"
          }`}
        >
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
              className="h-10 w-auto object-contain"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-full border-2 border-border bg-secondary px-3 py-2 font-heading text-[0.68rem] font-black uppercase tracking-[0.14em] text-secondary-foreground shadow-retro-sm transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-accent hover:shadow-none"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />

            {isAuthenticated ? (
              <>
                <Badge variant="outline" className="hidden lg:inline-flex">
                  Hi {firstName || "Learner"}
                </Badge>
                <Link
                  href={dashboardHref}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-accent px-3 py-2 font-heading text-[0.68rem] font-black uppercase tracking-[0.14em] text-accent-foreground shadow-retro-sm transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-secondary hover:shadow-none"
                >
                  <LayoutDashboard className="size-3.5" />
                  Dashboard
                </Link>
                <form action={logoutAction}>
                  <Button type="submit" variant="outline" size="sm">
                    Sign out
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="font-heading text-[0.72rem] font-black uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Log in
                </Link>
                <Button asChild variant="default" size="sm">
                  <Link href="/register">Start Learning</Link>
                </Button>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <Button
              ref={menuButtonRef}
              onClick={() => setMobileOpen(!mobileOpen)}
              variant="secondary"
              size="icon-sm"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            ref={mobileMenuRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-3 top-24 z-40 retro-surface bg-card p-5"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <nav className="flex flex-col items-start gap-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="w-full rounded-[calc(var(--radius)+2px)] border-2 border-border bg-secondary px-4 py-3 font-heading text-lg font-black uppercase tracking-[0.08em] text-secondary-foreground shadow-retro-sm transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-accent hover:shadow-none"
                >
                  {link.label}
                </Link>
              ))}

              <div className="mt-2 flex w-full flex-col gap-4 border-t pt-5">
                {isAuthenticated ? (
                  <>
                    <Button asChild variant="ghost">
                      <Link href={dashboardHref} onClick={() => setMobileOpen(false)}>
                        Open Dashboard
                      </Link>
                    </Button>
                    <form action={logoutAction}>
                      <Button type="submit" variant="outline">
                        Sign out
                      </Button>
                    </form>
                  </>
                ) : (
                  <>
                    <Button asChild variant="ghost">
                      <Link href="/login" onClick={() => setMobileOpen(false)}>
                        Log in
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link href="/register" onClick={() => setMobileOpen(false)}>
                        Start Learning
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
