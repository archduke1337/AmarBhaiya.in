import type { Metadata } from "next";
import Link from "next/link";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How amarbhaiya.in collects, uses, stores and protects student data under the Indian IT Act and DPDP Act. Includes your rights, retention, and grievance contact.",
  alternates: { canonical: "/privacy" },
};

const LAST_UPDATED = "23 August 2026";

const sections = [
  {
    title: "1. Overview & controller",
    body: "amarbhaiya.in (\"we\", \"us\") is operated by Amarnath Pandey, India. This policy explains what personal data we collect, why we collect it, and how we handle it when you use our website, courses, notes, community and support channels. By creating an account or using the platform you agree to this policy. If you do not agree, please do not use the service.",
  },
  {
    title: "2. Data we collect",
    points: [
      "Account data — name, email, password hash, avatar, role (student/instructor/admin/moderator) and Appwrite ID.",
      "Profile & billing data — grade, school, city, bio, guardian name/phone, address (billing_info), phone — only when you provide it.",
      "Learning activity — course enrollments (enrollments), lesson progress (progress), quiz attempts (quiz_attempts), assignment submissions (submissions), certificates (certificates), community posts (forum_threads/replies, course_comments).",
      "Transactional data — payment records (payments), subscriptions (subscriptions), coupon usage (coupons) via Razorpay.",
      "Support data — messages via contact form, EmailJS payload, moderation reports and audit logs.",
      "Technical data — IP address, device, browser, timestamps, rate-limit keys (x-forwarded-for when VERCEL/TRUST_PROXY=1), cookies/localStorage (session a_session_{PROJECT_ID}, theme, dismissed announcements).",
    ],
  },
  {
    title: "3. How & why we use data (legal bases)",
    points: [
      "Provide the service — auth, enrollment, progress tracking, certificates, community, live sessions (contract).",
      "Process payments & prevent fraud — Razorpay orders/webhooks, idempotency, coupon limits (contract + legitimate interest).",
      "Communicate — support replies, payment confirmations, moderation notices (legitimate interest).",
      "Improve & secure — analytics, error logs, rate-limiting, file signature checks, audit trails (legitimate interest).",
      "Compliance — respond to legal requests, enforce Terms, handle grievances under IT Rules 2021 (legal obligation).",
      "With consent — optional newsletters, theme/storage preferences, avatar uploads (consent, withdrawable).",
    ],
  },
  {
    title: "4. Sharing & processors",
    points: [
      "We do not sell personal data.",
      "Processors needed to run the platform: Appwrite (auth, database, storage), Razorpay (payments), Stream (chat if enabled), Vercel (hosting), Upstash Redis (rate-limit when configured), EmailJS (contact form). Each acts under its own policy and our instructions.",
      "Instructors & moderators see only what is necessary for teaching/moderation (e.g., submissions, community posts).",
      "We disclose data when required by Indian law, court order, or to protect users/platform integrity.",
      "Business transfers — if ownership changes, data moves with safeguards and notice.",
    ],
  },
  {
    title: "5. Retention",
    points: [
      "Account data — while your account is active; deleted within 30 days of verified deletion request (backups up to 90 days).",
      "Learning records & certificates — retained while needed for verification and credential history; anonymised on deletion where feasible.",
      "Payments/subscriptions — 7 years for tax/audit (Indian law) then anonymised.",
      "Support & moderation logs — 2 years or until grievance resolved, then archived.",
      "Session cookies — cleared on logout or expiry; server cache 15s (proxy.ts) then re-validated.",
    ],
  },
  {
    title: "6. Security",
    points: [
      "Encryption in transit (TLS), at rest (Appwrite bucket encryption), antivirus on storage, HMAC webhook signatures (razorpay.ts), magic-byte file checks (sanitize.ts), CSP (next.config.ts), rate-limiting (rate-limiter.ts) and CSRF origin checks (proxy.ts).",
      "No method is 100% secure — keep your password private, use a strong unique password (min 8 chars, letter+number+symbol) and log out on shared devices.",
    ],
  },
  {
    title: "7. Your rights (India DPDP Act 2023 + IT Act)",
    points: [
      "Access, correction, deletion, and withdrawal of consent — email the grievance officer with your user ID. We respond within 15 days (see Grievance Redressal).",
      "Nominate another person in case of incapacity, and request data export where technically feasible.",
      "Grievance & appeal — see /grievance-redressal (acknowledged 24h, resolved 15 days). You may also approach the Data Protection Board of India or courts.",
      "Marketing opt-out — theme/announcement prefs are local; email marketing (if any) has unsubscribe.",
    ],
  },
  {
    title: "8. Cookies",
    points: [
      "Strictly necessary — a_session_{PROJECT_ID} (auth), rate-limit keys, CSRF origin check.",
      "Preferences — theme (light/dark), dismissed announcement hash (announcement-banner.tsx).",
      "Analytics — Vercel Analytics if enabled (aggregated, no ads). Payments/video players may set their own cookies (Razorpay, Stream) per their policies. See /cookie-policy.",
    ],
  },
  {
    title: "9. Children's privacy",
    points: [
      "Service is for students (often 13+). For users under 18, guardian consent is implied via parentName/parentPhone at billing/checkout. Guardians may review, correct or delete a child's data via the grievance officer.",
      "We do not knowingly collect data from children under 13 without verifiable guardian consent — contact us to remove such data.",
    ],
  },
  {
    title: "10. International transfers",
    points: [
      "Data is stored/processed in India (Appwrite) and on Vercel's global edge. When transferred abroad, we rely on contractual safeguards and the processor's compliance.",
    ],
  },
  {
    title: "11. Changes to this policy",
    points: [
      "We will update this page and the \"Last updated\" date when material changes occur. Continued use after notice means acceptance. Material changes may also be notified via email or dashboard banner.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="site-container space-y-12 py-12 sm:py-16 xl:space-y-16 xl:py-20">
      <section className="mx-auto max-w-6xl space-y-6">
        <SectionHeading
          eyebrow="Legal"
          title="Privacy policy"
          description="How we collect, use, store and protect your data — and what rights you have under Indian law."
          titleAs="h1"
        />
        <RetroPanel tone="secondary" className="space-y-3">
          <p className="text-sm font-medium leading-7 text-foreground/80">
            Last updated: {LAST_UPDATED} · Effective: {LAST_UPDATED}
          </p>
          <p className="text-sm font-medium leading-7 text-foreground/80">
            Controller: Amarnath Pandey, amarbhaiya.in —{" "}
            <Link href="/contact" className="font-bold text-accent hover:underline">
              contact
            </Link>{" "}
            · Grievance: <Link href="/grievance-redressal" className="font-bold text-accent hover:underline">grievance officer</Link>.
          </p>
          <p className="text-xs font-medium leading-6 text-foreground/60">
            This is a plain-language summary, not legal advice. For the full legal context, see the IT Act 2000, IT Rules 2021 and the Digital Personal Data Protection Act 2023.
          </p>
        </RetroPanel>
      </section>

      <section className="mx-auto max-w-6xl grid gap-4">
        {sections.map((section, index) => (
          <RetroPanel key={section.title} tone={index % 2 === 0 ? "card" : "muted"} className="space-y-3">
            <h2 className="font-heading text-[clamp(1.35rem,3vw,2rem)] font-normal tracking-[-0.02em]">{section.title}</h2>
            {section.body && <p className="text-sm font-medium leading-7 text-foreground/80">{section.body}</p>}
            {section.points && (
              <ul className="grid gap-2 list-disc pl-5" role="list">
                {section.points.map((point) => (
                  <li key={point} className="text-sm font-medium leading-7 text-foreground/80">
                    {point}
                  </li>
                ))}
              </ul>
            )}
          </RetroPanel>
        ))}
      </section>

      <section className="mx-auto max-w-6xl">
        <RetroPanel tone="accent" className="space-y-3">
          <h2 className="font-heading text-[clamp(1.35rem,3vw,2rem)] font-normal tracking-[-0.02em]">Contact & grievance</h2>
          <p className="text-sm font-medium leading-7 text-foreground/80">
            Questions or requests (access/correction/deletion/withdrawal)? Email the grievance officer listed on{" "}
            <Link href="/grievance-redressal" className="font-bold text-accent hover:underline">grievance-redressal</Link> or use{" "}
            <Link href="/contact" className="font-bold text-accent hover:underline">contact</Link>. See also{" "}
            <Link href="/cookie-policy" className="font-bold text-accent hover:underline">cookie policy</Link> and{" "}
            <Link href="/terms" className="font-bold text-accent hover:underline">terms</Link>.
          </p>
        </RetroPanel>
      </section>
    </div>
  );
}
