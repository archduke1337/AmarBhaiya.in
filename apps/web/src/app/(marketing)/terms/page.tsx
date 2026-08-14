import type { Metadata } from "next";
import Link from "next/link";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms that govern use of amarbhaiya.in courses, notes, and student platform features.",
};

const terms = [
  {
    title: "Platform use",
    body: "Use the platform for lawful learning and educational purposes. Do not misuse, abuse, scrape, or attempt to disrupt platform operations.",
  },
  {
    title: "Eligibility and parental consent",
    body: "Anyone may use the free public content. For student accounts, users below 18 years of age must have a parent or guardian's consent, in line with the DPDP Act, 2023. By creating an account for a minor, the parent or guardian confirms they consent to the collection and use of the child's data as described in the privacy policy.",
  },
  {
    title: "Accounts",
    body: "You are responsible for account credentials and activity under your login. Keep your credentials private and accurate. Email verification is required, and sharing your login with others is not allowed — access to courses is tied to the enrolled account only.",
  },
  {
    title: "Payments and subscriptions",
    body: "Paid plans, renewals, and cancellations follow the billing terms shown at checkout and the refund policy. All prices are shown in Indian Rupees (INR) unless stated otherwise. Failed or disputed payments may result in access being paused until resolved.",
  },
  {
    title: "Content and intellectual property",
    body: "Course videos, notes, and platform materials are provided for enrolled learner use only. Re-uploading, reselling, or unauthorized redistribution is not allowed. Your account progress, certificates, and submissions remain yours, and you keep ownership of files you upload for assignments.",
  },
  {
    title: "User content and community conduct",
    body: "Forum posts, replies, and lesson comments must follow the community guidelines. We may remove content that violates them, and repeat violations may lead to restricted or terminated access.",
  },
  {
    title: "Certificates",
    body: "Certificates are issued when completion criteria are met. Verification links are provided for authenticity checks. A certificate may be revoked if the completion was obtained through fraudulent or automated means.",
  },
  {
    title: "Termination",
    body: "You can delete your account at any time. We may suspend or terminate access for violation of these terms, fraud, or conduct that harms other users or the platform. Termination does not remove obligations already incurred, such as payment for completed billing cycles.",
  },
  {
    title: "Disclaimer and limitation of liability",
    body: "The platform and its content are provided 'as is' without warranties of any kind. We do our best to keep lessons accurate and the platform reliable, but to the maximum extent permitted by Indian law, liability for indirect or consequential losses is excluded. Nothing here limits liability that cannot be excluded by law.",
  },
  {
    title: "Disputes and governing law",
    body: `These terms are governed by the laws of India. Disputes are first handled through the grievance redressal channel (acknowledged within 24 hours, resolved within 15 days), and courts of competent jurisdiction in India remain the forum for any formal dispute.`,
  },
  {
    title: "Updates to terms",
    body: "We may update terms when platform policies or legal requirements change. Material changes are highlighted on this page, and continued use after the effective date means acceptance of the updated terms.",
  },
];

export default function TermsPage() {
  return (
    <div className="space-y-12 px-4 py-14 md:px-6 md:py-20 xl:space-y-16 xl:py-24">
      <section className="mx-auto max-w-6xl space-y-6">
        <SectionHeading
          eyebrow="Legal"
          title="Terms of service"
          description="These terms explain your rights and responsibilities while using amarbhaiya.in."
          titleAs="h1"
        />
        <RetroPanel tone="secondary" className="space-y-3">
          <p className="text-sm font-medium leading-7 text-foreground/80">
            Effective date: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <p className="text-sm font-medium leading-7 text-foreground/80">
            For clarifications, use the <Link href="/contact" className="font-bold text-accent hover:underline">contact page</Link>, or review the{" "}
            <Link href="/privacy" className="font-bold text-accent hover:underline">privacy policy</Link> and{" "}
            <Link href="/refund-policy" className="font-bold text-accent hover:underline">refund policy</Link>.
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
