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
    <footer className="border-t border-neutral-800">
      {/* Main footer content */}
      <div className="px-6 md:px-12 py-16">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="text-sm font-medium tracking-[0.2em] uppercase text-neutral-400">
              amarbhaiya
            </Link>
            <p className="text-sm text-neutral-600 max-w-sm leading-relaxed mt-4">
              School se college tak — coding, fitness, career, aur life skills.
              Bina kisi gatekeeping ke. Seedha, practical, kaam ka content.
            </p>
          </div>

          {/* Platform */}
          <div className="space-y-4">
            <h4 className="text-xs tracking-widest uppercase text-neutral-500">Platform</h4>
            <div className="space-y-3">
              {platformLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="block text-sm text-neutral-600 hover:text-neutral-300 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Connect */}
          <div className="space-y-4">
            <h4 className="text-xs tracking-widest uppercase text-neutral-500">Connect</h4>
            <div className="space-y-3">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-sm text-neutral-600 hover:text-neutral-300 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-neutral-800 px-6 md:px-12 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="text-xs text-neutral-600">
          © {new Date().getFullYear()} amarbhaiya.in
        </span>
        <div className="flex gap-6 text-xs text-neutral-600">
          <Link href="/contact" className="hover:text-neutral-400 transition-colors">Privacy</Link>
          <Link href="/contact" className="hover:text-neutral-400 transition-colors">Terms</Link>
          <Link href="/contact" className="hover:text-neutral-400 transition-colors">Refund Policy</Link>
        </div>
      </div>
    </footer>
  );
}
