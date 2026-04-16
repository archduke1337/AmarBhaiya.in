"use client";

/**
 * Navbar — Fluid Island Nav
 * ─────────────────────────
 * Floating glass pill detached from the top.
 * Uses HeroUI v3 Button + compound component patterns.
 * Optimized for iOS/Android: 44px touch targets, safe-area aware.
 */

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { useTheme } from "next-themes";

// ── Nav Links ─────────────────────────────────────────────────
const NAV_LINKS = [
  { label: "Courses",  href: "/courses" },
  { label: "Notes",    href: "/notes"   },
  { label: "Live",     href: "/app/live" },
  { label: "About",    href: "/about"   },
] as const;

// ── Icons (inline SVG — lightweight, no dep) ──────────────────
function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className="relative flex w-5 h-5 items-center justify-center" aria-hidden>
      {/* Top bar */}
      <span
        className="absolute h-[1.5px] w-5 bg-current transition-all duration-300"
        style={{
          transform: open ? "translateY(0) rotate(45deg)" : "translateY(-5px)",
        }}
      />
      {/* Middle bar */}
      <span
        className="absolute h-[1.5px] bg-current transition-all duration-300"
        style={{
          width: open ? 0 : "1.25rem",
          opacity: open ? 0 : 1,
        }}
      />
      {/* Bottom bar */}
      <span
        className="absolute h-[1.5px] w-5 bg-current transition-all duration-300"
        style={{
          transform: open ? "translateY(0) rotate(-45deg)" : "translateY(5px)",
        }}
      />
    </span>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" aria-hidden>
      <circle cx="12" cy="12" r="4.5"/>
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

// ── Navbar component ──────────────────────────────────────────
export function Navbar() {
  const [menuOpen, setMenuOpen]   = useState(false);
  const [scrolled, setScrolled]  = useState(false);
  const { theme, setTheme }       = useTheme();
  const menuRef                   = useRef<HTMLDivElement>(null);

  // Detect scroll to add / remove background on island
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu on route change / resize
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Trap body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <>
      {/* ── Main nav bar ──────────────────────────────────── */}
      <header
        className="fixed top-0 inset-x-0 z-40 pt-safe"
        style={{ paddingTop: `max(0.75rem, var(--safe-top))` }}
      >
        <div className="mx-auto px-4 sm:px-6 max-w-5xl">
          {/* Island pill */}
          <nav
            className="nav-island flex items-center justify-between px-4 py-2 transition-all duration-500"
            style={{
              boxShadow: scrolled
                ? "0 8px 32px oklch(0 0 0 / 0.20)"
                : undefined,
            }}
            aria-label="Main navigation"
          >
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 group"
              aria-label="amarbhaiya.in — home"
            >
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                aria-hidden
              >
                A
              </span>
              <span className="font-bold text-sm tracking-[-0.03em] text-foreground/90 hidden sm:block">
                amarbhaiya<span className="text-accent">.in</span>
              </span>
            </Link>

            {/* Desktop links */}
            <ul className="hidden md:flex items-center gap-1" role="list">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-surface transition-all duration-200 min-h-[44px] flex items-center"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <Button
                variant="ghost"
                isIconOnly
                size="sm"
                onPress={toggleTheme}
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                className="text-foreground/60 hover:text-foreground"
              >
                {theme === "dark" ? <SunIcon /> : <MoonIcon />}
              </Button>

              {/* Login */}
              <Link href="/login">
                <Button
                  variant="tertiary"
                  size="sm"
                  className="hidden sm:flex font-semibold"
                >
                  Login
                </Button>
              </Link>

              {/* CTA */}
              <Link href="/register">
                <Button
                  size="sm"
                  className="font-semibold bg-accent text-accent-foreground hover:shadow-[0_4px_16px_color-mix(in_oklab,var(--accent)_35%,transparent)]"
                >
                  Start free
                </Button>
              </Link>

              {/* Mobile hamburger */}
              <Button
                variant="ghost"
                isIconOnly
                size="sm"
                onPress={() => setMenuOpen((v) => !v)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                className="md:hidden text-foreground/70 hover:text-foreground"
              >
                <MenuIcon open={menuOpen} />
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* ── Mobile overlay menu ───────────────────────────── */}
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 md:hidden transition-all duration-500"
        style={{
          backdropFilter: menuOpen ? "blur(20px) saturate(160%)" : undefined,
          WebkitBackdropFilter: menuOpen ? "blur(20px) saturate(160%)" : undefined,
          background: menuOpen
            ? "color-mix(in oklab, var(--background) 88%, transparent)"
            : "transparent",
          pointerEvents: menuOpen ? "auto" : "none",
          opacity: menuOpen ? 1 : 0,
        }}
        aria-hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
      />

      {/* Menu panel */}
      <div
        id="mobile-menu"
        ref={menuRef}
        role="dialog"
        aria-label="Mobile navigation"
        className="fixed inset-x-0 top-0 z-35 md:hidden flex flex-col transition-all duration-500"
        style={{
          paddingTop: `max(5rem, calc(var(--safe-top) + 5rem))`,
          paddingBottom: `max(2rem, var(--safe-bottom))`,
          transform: menuOpen ? "translateY(0)" : "translateY(-100%)",
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? "auto" : "none",
        }}
      >
        <nav className="px-6 flex flex-col gap-1" aria-label="Mobile navigation links">
          {NAV_LINKS.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="reveal in-view flex items-center px-4 py-4 rounded-2xl text-xl font-bold text-foreground/80 hover:text-foreground hover:bg-surface transition-all duration-300 min-h-[60px]"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile CTA */}
        <div className="px-6 mt-6 grid gap-3">
          <Link href="/register" onClick={() => setMenuOpen(false)}>
            <Button fullWidth size="lg" className="font-bold text-base bg-accent text-accent-foreground">
              Abhi start karo — it&apos;s free
            </Button>
          </Link>
          <Link href="/login" onClick={() => setMenuOpen(false)}>
            <Button fullWidth variant="tertiary" size="lg" className="font-semibold text-base">
              Already have an account? Login
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
