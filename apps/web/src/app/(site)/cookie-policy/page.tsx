import type { Metadata } from "next";
import Link from "next/link";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "How amarbhaiya.in uses cookies, localStorage and similar technologies — essential, preferences, analytics, and how to control them.",
};

const LAST_UPDATED = "23 August 2026";

const cookies = [
  {
    title: "1. What are cookies & storage?",
    body: "Cookies are small text files set by your browser; localStorage is similar browser storage. Both store data on your device to remember auth, preferences and to keep the platform secure. This policy covers both, as we use localStorage for theme and dismissed announcements and cookies for the Appwrite session.",
  },
  {
    title: "2. Strictly necessary (always on)",
    body: "a_session_{PROJECT_ID} — Appwrite session (auth, httpOnly on subdomains via proxy.ts), rate-limit keys (rate-limiter.ts), CSRF Origin check (proxy.ts:131/CSRF:15) and Razorpay/Stream session handling. Without these you cannot stay logged in or access protected /app, /admin, /instructor, /moderator routes. No consent needed; they are required by law to provide the service.",
  },
  {
    title: "3. Preferences (functional)",
    body: "theme (light/dark/system via theme-provider.tsx localStorage theme), dismissed announcement hash (announcement-banner.tsx ab-announcement-dismissed:{hash} per announcement), and draft auto-saves (use-auto-save.ts buff-draft-*) that flush on unmount. These remember choices and do not track across other sites.",
  },
  {
    title: "4. Analytics & performance",
    body: "Vercel Analytics (@vercel/analytics) if enabled — aggregated page views, Web Vitals (vitals.vercel-insights.com via CSP next.config.ts:83), no advertising profile. You can block analytics via content blockers without breaking the app.",
  },
  {
    title: "5. Third-party cookies",
    body: "Razorpay checkout (checkout.razorpay.com script/frame next.config.ts:79) and Stream (chat.stream.io) set their own cookies under their policies when you pay or use chat. Video embeds (YouTube/Vimeo frame-src next.config.ts:84) may set player cookies. We do not allow third-party advertising or cross-site tracking cookies.",
  },
  {
    title: "6. How long they last",
    body: "Session cookies expire on logout or Appwrite expiry (validated cached 15s proxy.ts:18); preference keys persist until you clear them; Upstash Redis rate-limit keys expire in 60s (rate-limiter.ts:1); analytics cookies per Vercel's retention. You can delete localStorage keys buff-draft-* and theme manually and they are recreated.",
  },
  {
    title: "7. Your choices & controls",
    body: "Browser settings let you block or clear cookies/site data at any time — clearing them signs you out, resets theme and re-shows announcements, but does not affect purchases/enrollments (stored server-side). For theme, use the toggle (theme-toggle.tsx) instead of blocking storage. Do Not Track is not required to be honoured, but blocking analytics still works.",
  },
  {
    title: "8. Changes & contact",
    body: "We will update the Last updated date here and link from the privacy policy. Combined with /privacy, this explains everything stored on your device — questions? Use /contact or the grievance officer on /grievance-redressal.",
  },
];

export default function CookiePolicyPage() {
  return (
    <div className="space-y-12 px-4 py-14 md:px-6 md:py-20 xl:space-y-16 xl:py-24">
      <section className="mx-auto max-w-6xl space-y-6">
        <SectionHeading
          eyebrow="Legal"
          title="Cookie policy"
          description="Exactly what we store on your device — and what we don't."
          titleAs="h1"
        />
        <RetroPanel tone="secondary" className="space-y-3">
          <p className="text-sm font-medium leading-7 text-foreground/80">
            Last updated: {LAST_UPDATED} · Effective: {LAST_UPDATED}
          </p>
          <p className="text-sm font-medium leading-7 text-foreground/80">
            Pairs with the{" "}
            <Link href="/privacy" className="font-bold text-accent hover:underline">
              privacy policy
            </Link>
            . Questions → <Link href="/contact" className="font-bold text-accent hover:underline">contact</Link>.
          </p>
        </RetroPanel>
      </section>

      <section className="mx-auto max-w-6xl grid gap-4">
        {cookies.map((item, index) => (
          <RetroPanel key={item.title} tone={index % 2 === 0 ? "card" : "muted"} className="space-y-3">
            <h2 className="font-heading text-2xl font-black tracking-[-0.05em]">{item.title}</h2>
            <p className="text-sm font-medium leading-7 text-foreground/80">{item.body}</p>
          </RetroPanel>
        ))}
      </section>
    </div>
  );
}
