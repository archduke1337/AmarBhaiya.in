import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "For Parents — Safety & Learning on amarbhaiya.in",
  description:
    "How amarbhaiya.in keeps students safe: moderated community, no third-party ads on the platform, and clear channels to report concerns.",
  alternates: { canonical: "/parents" },
};

const commitments = [
  {
    title: "Learning first, always",
    body: "The platform is built for Class 6 to 12 students: notes, structured courses, and practical guidance. There are no third-party ads or promotional pop-ups inside the learning experience.",
  },
  {
    title: "A moderated community",
    body: "Community discussions and comments are reviewed by moderators. Anyone can report inappropriate content, and reports are actioned through the moderation queue.",
  },
  {
    title: "Account safety",
    body: "Students use their own login and password. Email verification is required, and access to courses is tied to the enrolled account only.",
  },
  {
    title: "No personal data shared",
    body: "We do not sell student data. Payment details are handled by Razorpay and never stored on our servers. See the privacy policy and cookie policy for details.",
  },
];

export default function ParentsPage() {
  return (
    <div className="space-y-12 px-4 py-14 md:px-6 md:py-20 xl:space-y-16 xl:py-24">
      <section className="mx-auto max-w-6xl space-y-6">
        <SectionHeading
          eyebrow="For parents"
          title="A safe place to learn"
          description="We treat amarbhaiya.in as a classroom: supervised, structured, and free of distractions. Here is what we commit to for your child."
          titleAs="h1"
        />

        <div className="grid gap-4 md:grid-cols-2">
          {commitments.map((item, index) => (
            <RetroPanel key={item.title} tone={index % 2 === 0 ? "card" : "muted"} className="space-y-3">
              <h2 className="font-heading text-2xl font-black tracking-[-0.05em]">{item.title}</h2>
              <p className="text-sm font-medium leading-7 text-foreground/80">{item.body}</p>
            </RetroPanel>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl grid gap-4">
        <RetroPanel tone="secondary" className="space-y-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="size-5 text-accent" aria-hidden />
            <h2 className="font-heading text-2xl font-black tracking-[-0.05em]">
              Concerned about something?
            </h2>
          </div>
          <p className="text-sm font-medium leading-7 text-foreground/80">
            Parents and guardians can raise concerns through the{" "}
            <Link href="/contact" className="font-bold text-accent hover:underline">
              contact page
            </Link>
            , and serious or unresolved issues can be escalated through the{" "}
            <Link href="/grievance-redressal" className="font-bold text-accent hover:underline">
              grievance redressal
            </Link>{" "}
            channel, which is handled directly by the platform owner.
          </p>
          <p className="text-sm font-medium leading-7 text-foreground/80">
            Community behaviour expectations are published in the{" "}
            <Link href="/community-guidelines" className="font-bold text-accent hover:underline">
              community guidelines
            </Link>
            , and account, payment, and certificate rules are in the{" "}
            <Link href="/terms" className="font-bold text-accent hover:underline">
              terms of service
            </Link>
            .
          </p>
        </RetroPanel>
      </section>
    </div>
  );
}