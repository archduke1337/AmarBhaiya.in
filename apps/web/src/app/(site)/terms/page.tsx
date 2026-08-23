import type { Metadata } from "next";
import Link from "next/link";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms governing use of amarbhaiya.in — accounts, courses, payments, content, termination and Indian governing law.",
  alternates: { canonical: "/terms" },
};

const LAST_UPDATED = "23 August 2026";

const terms = [
  {
    title: "1. Acceptance & eligibility",
    body: "By creating an account or using amarbhaiya.in you agree to these Terms and our Privacy Policy and Cookie Policy. You must be at least 13 years old; if you are under 18, your guardian agrees on your behalf (parentName/parentPhone collected at billing). We may update Terms; material changes are notified via the site or email and continued use means acceptance.",
  },
  {
    title: "2. Accounts & security",
    body: "You are responsible for your credentials (Appwrite session a_session_{PROJECT_ID}) and all activity under your account. Provide accurate details, keep your password strong (min 8 chars, letter+number+symbol) and private, and notify us promptly of unauthorised use via /contact. We may suspend accounts that violate Terms or pose security risk.",
  },
  {
    title: "3. Courses, notes & access",
    body: "We offer free notes (standalone_resources, free), paid courses (accessModel paid), and subscription content (subscription). Publishing, enrollment counts and progress (totalLessons, enrollmentCount, progress) are shown on course pages. Free preview lessons (isFreePreview) are accessible without enrollment; paid lessons require active enrollment (isActive !== false && status !== cancelled) or active subscription (access.ts). We may update, reorder or retire content with notice.",
  },
  {
    title: "4. Payments, pricing & coupons",
    body: "Prices are in INR (prices shown on course pages; server is source of truth — create-order validates price and coupon via validateCouponAction). Payments are processed by Razorpay (order → HMAC verify → webhook). Coupons (coupons table) are limited by maxUses/expiresAt/isActive and incremented transactionally (coupons.ts). Failed/refunded payments do not grant access. Taxes/fees, if any, are shown at checkout.",
  },
  {
    title: "5. Subscriptions",
    body: "Plans (subscriptions) have startDate/endDate and status active|expired|cancelled. You may cancel before the next cycle; cancellation stops future charges, current period remains until endDate. Expiry/cancellation revokes subscription-gated access (access.ts now checks subscriptions). Deactivating other active plans on purchase is disclosed at checkout.",
  },
  {
    title: "6. Content, IP & license",
    body: "Course videos (course_videos 5GB), thumbnails, resources and notes remain our or licensors' IP. We grant you a non-transferable, non-exclusive licence to view/download for personal learning only while enrolled/subscribed. Do not re-upload, share, scrape, or redistribute. Uploaded avatars/resources must be yours, within size limits (2MB avatar, 5MB thumb, etc.) and pass magic-byte checks (sanitize.ts); we may remove violating content.",
  },
  {
    title: "7. User conduct (community & comments)",
    body: "Follow Community Guidelines and IT Rules 2021. Do not post hate, harassment, spam, plagiarism, piracy, or personal data. Moderators may warn/mute/timeout/delete/pin/flag (moderation_actions) and instructors may grade. See /community-guidelines and /grievance-redressal for enforcement and appeals.",
  },
  {
    title: "8. Certificates",
    body: "Certificates (certificates) are issued when progress reaches 100% and completion criteria are met, verifiable via /certificates/[id] (robots noindex). Revoked enrollments (failed/refunded) deactivate certificates.",
  },
  {
    title: "9. Disclaimers & limitation",
    body: "Service is provided \"as is\" without warranties. We do not guarantee exam outcomes, employment or specific results. To the fullest extent permitted by Indian law, our liability for any claim is limited to the amount you paid for the relevant course/subscription in the 3 months before the claim. We are not liable for indirect or consequential losses.",
  },
  {
    title: "10. Termination",
    body: "You may stop using the service or request deletion via /contact or grievance officer. We may suspend/terminate for Terms violation, fraud, or legal requirement, with or without notice for serious breaches. On termination, paid access ends per Refund Policy; free notes remain public.",
  },
  {
    title: "11. Governing law & disputes",
    body: "These Terms are governed by the laws of India. Courts at Mumbai, Maharashtra have exclusive jurisdiction. For consumer disputes, you may also approach forums under the Consumer Protection Act 2019. Grievances are first handled via our 15-day redressal (see /grievance-redressal); unresolved matters may be escalated to the Data Protection Board or courts.",
  },
  {
    title: "12. Contact & updates",
    body: "Questions? Use /contact or the grievance officer on /grievance-redressal. We will post updates here and change the Last updated date; material changes may also be emailed or bannered.",
  },
];

export default function TermsPage() {
  return (
    <div className="space-y-12 px-4 py-14 md:px-6 md:py-20 xl:space-y-16 xl:py-24">
      <section className="mx-auto max-w-6xl space-y-6">
        <SectionHeading
          eyebrow="Legal"
          title="Terms of service"
          description="Your rights and responsibilities while using amarbhaiya.in — please read carefully."
          titleAs="h1"
        />
        <RetroPanel tone="secondary" className="space-y-3">
          <p className="text-sm font-medium leading-7 text-foreground/80">
            Last updated: {LAST_UPDATED} · Effective: {LAST_UPDATED}
          </p>
          <p className="text-sm font-medium leading-7 text-foreground/80">
            Operated by Amarnath Pandey, India —{" "}
            <Link href="/privacy" className="font-bold text-accent hover:underline">privacy</Link> ·{" "}
            <Link href="/refund-policy" className="font-bold text-accent hover:underline">refund</Link> ·{" "}
            <Link href="/contact" className="font-bold text-accent hover:underline">contact</Link>.
          </p>
        </RetroPanel>
      </section>

      <section className="mx-auto max-w-6xl grid gap-4">
        {terms.map((item, index) => (
          <RetroPanel key={item.title} tone={index % 2 === 0 ? "card" : "muted"} className="space-y-3">
            <h2 className="font-heading text-2xl font-black tracking-[-0.05em]">{item.title}</h2>
            <p className="text-sm font-medium leading-7 text-foreground/80">{item.body}</p>
          </RetroPanel>
        ))}
      </section>
    </div>
  );
}
