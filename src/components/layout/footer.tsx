/**
 * Footer — amarbhaiya.in
 * ──────────────────────
 * Minimal editorial footer.
 * iOS safe-area aware (pb-safe).
 * HeroUI-compatible: pure Tailwind v4 classes.
 */

import Link from "next/link";

const LINKS = {
  Learn: [
    { label: "Courses",   href: "/courses" },
    { label: "Notes",     href: "/notes"   },
    { label: "Live Sessions", href: "/app/live" },
    { label: "Blog",      href: "/blog"    },
  ],
  Platform: [
    { label: "About Bhaiya", href: "/about"   },
    { label: "Contact",      href: "/contact" },
    { label: "Certificates", href: "/certificates" },
    { label: "Community",    href: "/app/community" },
  ],
  Account: [
    { label: "Login",        href: "/login"    },
    { label: "Register",     href: "/register" },
    { label: "Dashboard",    href: "/app/dashboard" },
  ],
};

export function Footer() {
  return (
    <footer
      className="mt-auto border-t border-border/40 pb-safe"
      aria-label="Site footer"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
        {/* Top row */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2" aria-label="amarbhaiya.in home">
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
                style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                aria-hidden
              >
                A
              </span>
              <span className="font-bold text-sm text-foreground/80">
                amarbhaiya<span style={{ color: "var(--accent)" }}>.in</span>
              </span>
            </Link>
            <p className="text-sm text-foreground/50 leading-relaxed max-w-[200px]">
              Simple, honest, useful — padhai ke liye banaya hua.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([group, links]) => (
            <div key={group}>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-foreground/40 mb-4">
                {group}
              </p>
              <ul className="space-y-3" role="list">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground/60 hover:text-foreground transition-colors duration-200 min-h-[44px] flex items-center"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-border/30 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-foreground/40">
          <p>© {new Date().getFullYear()} amarbhaiya.in · Amarnath Pandey</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground/70 transition-colors">Privacy</Link>
            <Link href="/terms"   className="hover:text-foreground/70 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
