"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Menu, X } from "lucide-react";

import { PUBLIC_NAV_ITEMS } from "@/lib/utils/constants";
import { logoutAction } from "@/lib/appwrite/actions";
import { Button } from "@/components/ui/button";

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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function isActive(path: string) {
    if (path === "/") {
      return pathname === "/";
    }

    return pathname === path || pathname.startsWith(`${path}/`);
  }

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b bg-card/95 backdrop-blur-sm transition-shadow ${
          scrolled ? "shadow-sm" : ""
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          {/* Logo */}
          <Link
            href="/"
            className="inline-flex shrink-0 items-center"
            aria-label="Amar Bhaiya home"
          >
            <Image
              src="/AMAR%20BHAIYA.png"
              alt="Amar Bhaiya"
              width={160}
              height={53}
              priority
              className="h-8 w-auto object-contain md:h-9"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`inline-flex h-9 items-center rounded-lg px-3 text-sm font-semibold transition-colors ${
                  isActive(link.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />

            {isAuthenticated ? (
              <>
                <span className="hidden text-sm font-semibold text-muted-foreground xl:inline">
                  Hi, {firstName || "Learner"}
                </span>
                <Button asChild variant="default" size="sm">
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
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">Start free</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile right side */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Button
              ref={menuButtonRef}
              onClick={() => setMobileOpen((current) => !current)}
              variant="outline"
              size="icon-sm"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen ? (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Menu */}
          <div
            ref={mobileMenuRef}
            className="fixed inset-x-0 top-[57px] z-50 max-h-[calc(100dvh-57px)] overflow-y-auto bg-card border-b border-border shadow-lg md:hidden animate-in fade-in slide-in-from-top-2 duration-200"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <nav className="flex flex-col p-4 pb-safe">
              {navItems.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`rounded-lg px-4 py-3 text-base font-semibold transition-colors ${
                    isActive(link.href)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="mt-3 grid gap-2 border-t border-border pt-4">
                {isAuthenticated ? (
                  <>
                    <Button asChild variant="default">
                      <Link href={dashboardHref}>
                        <LayoutDashboard className="size-4" />
                        Open Dashboard
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
                      <Link href="/login">
                        Log in
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link href="/register">
                        Create free account
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        </>
      ) : null}
    </>
  );
}
