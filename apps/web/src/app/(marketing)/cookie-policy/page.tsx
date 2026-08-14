import type { Metadata } from "next";
import Link from "next/link";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "How amarbhaiya.in uses cookies and similar technologies, and how you can control them.",
};

const cookies = [
  {
    title: "What we use cookies for",
    body: "Cookies and local storage are used for three things: keeping you signed in (authentication session), remembering your theme preference, and protecting the platform against abuse like rate-limited login attempts. There are no third-party advertising or marketing cookies on the platform.",
  },
  {
    title: "Essential cookies",
    body: "Session and security cookies are strictly necessary for the platform to work. Without them you cannot stay logged in or access protected content. These cannot be switched off — they are set the moment you log in, which is your consent to their use.",
  },
  {
    title: "Preference cookies",
    body: "A small preference cookie remembers your chosen theme (light or dark) and any dismissed announcements. This cookie does not track you across other websites.",
  },
  {
    title: "Third-party services",
    body: "Payments are processed by Razorpay on their own pages or overlays, and video content may be delivered through external players. Those services may set their own cookies according to their policies, and we link to their policies where applicable. We do not allow third-party advertising cookies on the platform.",
  },
  {
    title: "Managing cookies",
    body: "You can clear cookies and site data at any time from your browser settings. Clearing them will sign you out and reset your theme preference, but will not affect your account or purchases. You can also browse the public parts of the site (courses, notes previews, blog) without logging in, which sets no cookies beyond what your browser needs for the page itself.",
  },
];

export default function CookiePolicyPage() {
  return (
    <div className="space-y-12 px-4 py-14 md:px-6 md:py-20 xl:space-y-16 xl:py-24">
      <section className="mx-auto max-w-6xl space-y-6">
        <SectionHeading
          eyebrow="Legal"
          title="Cookie policy"
          description="Straightforward information about the cookies amarbhaiya.in uses."
          titleAs="h1"
        />
        <RetroPanel tone="secondary" className="space-y-3">
          <p className="text-sm font-medium leading-7 text-foreground/80">
            Effective date: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <p className="text-sm font-medium leading-7 text-foreground/80">
            Combined with the{" "}
            <Link href="/privacy" className="font-bold text-accent hover:underline">
              privacy policy
            </Link>
            , this page explains everything we store on your device.
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