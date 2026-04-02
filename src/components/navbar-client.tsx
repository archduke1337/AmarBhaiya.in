"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LayoutDashboard, Menu, X } from "lucide-react";

import { logoutAction } from "@/lib/appwrite/actions";

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/80 backdrop-blur-md border-b border-border"
            : "bg-transparent"
        }`}
      >
        <div className="flex items-center justify-between px-6 md:px-12 h-14">
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

          <nav className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />

            {isAuthenticated ? (
              <>
                <span className="text-xs uppercase tracking-widest text-muted-foreground hidden lg:inline">
                  Hi {firstName || "Learner"}
                </span>
                <Link
                  href={dashboardHref}
                  className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
                >
                  <LayoutDashboard className="size-3.5" />
                  Dashboard
                </Link>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="text-xs tracking-widest uppercase bg-foreground text-background px-5 py-2 hover:bg-foreground/90 transition-colors"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="text-xs tracking-widest uppercase bg-foreground text-background px-5 py-2 hover:bg-foreground/90 transition-colors"
                >
                  Start Learning
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-0 z-40 bg-background pt-14"
          >
            <nav className="flex flex-col items-start px-6 py-8 gap-6">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-2xl font-light tracking-tight text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}

              <div className="border-t border-border w-full pt-6 mt-4 flex flex-col gap-4">
                {isAuthenticated ? (
                  <>
                    <Link
                      href={dashboardHref}
                      onClick={() => setMobileOpen(false)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Open Dashboard
                    </Link>
                    <form action={logoutAction}>
                      <button
                        type="submit"
                        className="inline-block bg-foreground text-background px-6 py-3 text-sm font-medium w-fit"
                      >
                        Sign out
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      className="inline-block bg-foreground text-background px-6 py-3 text-sm font-medium w-fit"
                    >
                      Start Learning
                    </Link>
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