import type { Metadata } from "next";
import Link from "next/link";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "Community Guidelines",
  description:
    "Rules for amarbhaiya.in community — respect, privacy, no plagiarism, moderation tiers and how to report.",
  alternates: { canonical: "/community-guidelines" },
};

const LAST_UPDATED = "23 August 2026";

const rules = [
  {
    title: "1. Be respectful — no harassment or hate",
    body: "Treat every member like a classmate. No personal attacks, bullying, hate speech, caste/religion/gender slurs, or harassment in any language. Repeated or severe violations lead to suspension or ban (moderation_actions: warn→mute→timeout→remove_from_chat→flag).",
  },
  {
    title: "2. Stay on topic — learning only",
    body: "Community is for notes, courses, doubts, exams and study guidance (forum_threads, course_comments). No promotions, spam, referral links, or off-topic self-promotion — such posts are removed and the account flagged.",
  },
  {
    title: "3. Protect privacy — no doxxing",
    body: "Do not share your or anyone else's phone, address, ID, or private accounts — including other students'. This violates IT Rules 2021 and our privacy policy. Guardians can request removal via /grievance-redressal.",
  },
  {
    title: "4. No plagiarism, piracy or cheating",
    body: "Do not re-upload platform videos/notes, share paid course material, post copyrighted books, or request/provide exam paper leaks. Instructors may remove posts and revoke community access. We honour valid takedown requests within 36 hours per IT Rules 2021.",
  },
  {
    title: "5. Ask well — search first, then ask",
    body: "There are no silly questions, but search existing threads (forum_threads title fulltext) before posting. Put the subject, class and chapter in the title so others find answers. Low-effort duplicates may be merged.",
  },
  {
    title: "6. No misinformation & safe study advice",
    body: "Do not post false exam dates, fake leaks, or medical/mental-health advice beyond your competence. Cite sources for claims. Moderators may add context or remove harmful misinformation.",
  },
  {
    title: "7. Report, don't retaliate",
    body: "If you see a violation, use Report or /contact — do not argue publicly. Do not brigade or dogpile. Moderators review reports, apply warn/mute/timeout/delete_post/pin/unpin/flag (moderation_actions) and log revertedBy when resolved.",
  },
  {
    title: "8. Moderation & appeals",
    body: "All actions are logged (moderation_actions, audit_logs for payments). You may appeal via /contact or /grievance-redressal with your userId and action reference. Grievances are acknowledged in 24h and resolved in 15 days per IT Rules 2021.",
  },
];

export default function CommunityGuidelinesPage() {
  return (
    <div className="space-y-12 px-4 py-14 md:px-6 md:py-20 xl:space-y-16 xl:py-24">
      <section className="mx-auto max-w-6xl space-y-6">
        <SectionHeading
          eyebrow="Community"
          title="Community guidelines"
          description="Simple, enforceable rules that keep the community safe and useful for students."
          titleAs="h1"
        />
        <RetroPanel tone="secondary" className="space-y-3">
          <p className="text-sm font-medium leading-7 text-foreground/80">
            Last updated: {LAST_UPDATED} · Enforced by moderators (moderator/) via moderation_actions · See also{" "}
            <Link href="/terms" className="font-bold text-accent hover:underline">terms</Link> and{" "}
            <Link href="/privacy" className="font-bold text-accent hover:underline">privacy</Link>.
          </p>
        </RetroPanel>
      </section>

      <section className="mx-auto max-w-6xl grid gap-4 md:grid-cols-2">
        {rules.map((item, index) => (
          <RetroPanel key={item.title} tone={index % 2 === 0 ? "card" : "muted"} className="space-y-3">
            <h2 className="font-heading text-2xl font-black tracking-[-0.05em]">{item.title}</h2>
            <p className="text-sm font-medium leading-7 text-foreground/80">{item.body}</p>
          </RetroPanel>
        ))}
      </section>

      <section className="mx-auto max-w-6xl grid gap-4">
        <RetroPanel tone="secondary" className="space-y-3">
          <h2 className="font-heading text-2xl font-black tracking-[-0.05em]">Reporting a violation</h2>
          <p className="text-sm font-medium leading-7 text-foreground/80">
            Use <Link href="/contact" className="font-bold text-accent hover:underline">contact</Link> or the Report button on any thread/reply. Parents see{" "}
            <Link href="/parents" className="font-bold text-accent hover:underline">parents</Link> and escalate via{" "}
            <Link href="/grievance-redressal" className="font-bold text-accent hover:underline">grievance redressal</Link>. For account/data deletion, email the grievance officer with your userId.
          </p>
        </RetroPanel>
      </section>
    </div>
  );
}
