"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Courses", href: "#courses" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
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
            ? "bg-black/80 backdrop-blur-md border-b border-neutral-800/50"
            : "bg-transparent"
        }`}
      >
        <div className="flex items-center justify-between px-6 md:px-12 h-14">
          {/* Brand */}
          <Link href="/" className="text-sm font-medium tracking-[0.2em] uppercase text-neutral-400 hover:text-white transition-colors">
            amarbhaiya
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-xs tracking-widest uppercase text-neutral-500 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/login"
              className="text-xs tracking-widest uppercase text-neutral-500 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="text-xs tracking-widest uppercase bg-white text-black px-5 py-2 hover:bg-neutral-200 transition-colors"
            >
              Start Learning
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-neutral-400 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-0 z-40 bg-black pt-14"
          >
            <nav className="flex flex-col items-start px-6 py-8 gap-6">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-2xl font-light tracking-tight text-neutral-300 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="border-t border-neutral-800 w-full pt-6 mt-4 flex flex-col gap-4">
                <Link href="/login" className="text-sm text-neutral-500 hover:text-white transition-colors">
                  Log in
                </Link>
                <Link href="/register" className="inline-block bg-white text-black px-6 py-3 text-sm font-medium w-fit">
                  Start Learning
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
