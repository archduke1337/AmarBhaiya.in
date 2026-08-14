import type { Metadata } from "next";
import Link from "next/link";

import { OWNER } from "@/lib/utils/constants";
import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How amarbhaiya.in collects, uses, and protects student and account data, including children's privacy, cookies, and rights under the DPDP Act 2023.",
};

const sections = [
  {
    title: "Who this policy applies to",
    points: [
      "This policy covers everyone who uses amarbhaiya.in — students, parents and guardians, and visitors to the public site.",
      "It is written in plain language so students and parents can both understand it. Legal wording is kept to what is genuinely needed.",
      "This is a consent-based policy under the Digital Personal Data Protection (DPDP) Act, 2023. Where the law asks for consent, we ask for it clearly before we process your data.",
    ],
  },
  {
    title: "Information we collect",
    points: [
      "Account details: name, email address, phone number (where provided), and login credentials. Email verification is required to secure your account.",
      "Student profile: date of birth, grade or class, school, city and state, hobbies, bio, and guardian name and phone number where a parent or guardian is the billing contact.",
      "Learning activity: course progress, quiz attempts and scores, assignment submissions and uploaded files, certificates earned, and live-session RSVPs.",
      "Community activity: forum threads, replies, and lesson comments, along with moderation records when content is reported.",
      "Billing information: name, phone, parent name and phone, postal address, and country — collected at checkout. Payment card details are handled entirely by Razorpay and never stored on our servers.",
      "Technical information: IP address, browser type, and device information, used for security, session handling, and abuse protection (including rate-limited login attempts).",
      "Communications: messages you send through the contact page, support requests, and grievance submissions.",
    ],
  },
  {
    title: "How we collect it",
    points: [
      "Directly from you: registration forms, profile forms, billing forms, the contact form, and community features.",
      "Automatically: cookies and local storage keep you signed in and remember your theme preference. Server logs capture IP addresses for rate limiting and abuse prevention.",
      "From payment providers: Razorpay confirms whether a payment succeeded so we can activate your course; we never receive or store your full card details.",
    ],
  },
  {
    title: "How we use it",
    points: [
      "To create, secure, and manage your account.",
      "To deliver courses, notes, certificates, progress tracking, assignments, quizzes, and community features.",
      "To process payments, issue refunds, and resolve billing issues.",
      "To improve teaching quality, product clarity, and reliability — for example, understanding which lessons students find confusing.",
      "To protect the platform: prevent fraud, abuse, and unauthorized access.",
      "To comply with legal obligations, including the DPDP Act, 2023 and Indian IT Rules.",
      "We do not sell personal data, and we do not run third-party advertising or tracking ads on the platform.",
    ],
  },
  {
    title: "Children's privacy and parental consent",
    points: [
      "amarbhaiya.in primarily serves Class 6 to 12 students, most of whom are below 18. Under the DPDP Act, 2023, a child's data may only be processed with verifiable parental consent.",
      "We treat guardians as the data principals for student accounts: billing, profile information, and account decisions for minors are made by or with the parent or guardian.",
      "Where a child registers, we collect only what is needed for learning and account security, and we do not enable features aimed at profiling or tracking children.",
      "Parents and guardians may at any time review their child's data, request corrections, or request deletion of the account through the contact page or the grievance officer.",
      "If you believe a child has provided data without your consent, contact us immediately and we will delete it within a reasonable time.",
    ],
  },
  {
    title: "Data sharing",
    points: [
      "We do not sell personal data to anyone.",
      "Data is shared only with trusted infrastructure providers needed to run the platform, including Appwrite (authentication, database, file storage), Razorpay (payments), Vercel (hosting), EmailJS (contact-form delivery), and optionally Upstash (rate-limit storage).",
      "These providers act on our instructions and are bound by their own data-processing terms. Payment pages and card handling occur on Razorpay's infrastructure.",
      "We may disclose data where required by law, court order, or a lawful government request, or where necessary to protect the rights, safety, and security of users and the platform.",
    ],
  },
  {
    title: "Data retention",
    points: [
      "Account data is kept while your account is active, and for a reasonable period after closure to handle billing, refunds, and legal obligations.",
      "Learning records (progress, quiz attempts, submissions, certificates) are kept for as long as your account is active so your progress is not lost.",
      "Grievance and support records are kept for the period needed to resolve the matter and for compliance record-keeping.",
      "You can request deletion of your data at any time; where deletion conflicts with a legal obligation, we will tell you what must remain and why.",
    ],
  },
  {
    title: "Data security",
    points: [
      "Passwords are stored hashed by Appwrite's authentication system — we never store plaintext passwords.",
      "Traffic to the platform is encrypted in transit (HTTPS), and access to production systems is restricted and authenticated.",
      "Payments are processed by Razorpay under PCI-DSS-compliant practices; card data never touches our servers.",
      "No system is 100% secure, but we follow industry-standard protections and act quickly on any reported vulnerability.",
    ],
  },
  {
    title: "Your rights",
    points: [
      "Access: you can request a copy of the personal data we hold about you.",
      "Correction: you can update inaccurate profile, billing, or account information, either in-app or by request.",
      "Erasure: you can request deletion of your account and associated data.",
      "Consent management: where processing is based on consent, you can withdraw it at any time.",
      "Grievance: if you are unhappy with any data-related response, you can raise it with the grievance officer, and after that with the Data Protection Board of India under the DPDP Act.",
      "To exercise any right, use the contact page or email the grievance officer directly. Requests are acknowledged within 24 hours and resolved within 15 days.",
    ],
  },
  {
    title: "Cookies and local storage",
    points: [
      "We use cookies and local storage for three purposes: keeping you signed in, remembering your theme preference, and security protections such as rate-limited login attempts.",
      "There are no third-party advertising or marketing cookies on the platform.",
      "Razorpay, and external video or chat services where used, may set their own cookies on their own pages according to their policies.",
      "See the cookie policy for the full breakdown and how to manage cookies from your browser.",
    ],
  },
  {
    title: "International data transfer",
    points: [
      "Our infrastructure providers (Appwrite, Vercel, Razorpay) may process data on servers located outside India, in line with their own compliance programs.",
      "Where data moves across borders, we rely on providers' standard contractual protections and their compliance with applicable data-protection frameworks.",
      "Indian users' rights under the DPDP Act, 2023 are not reduced by where infrastructure is hosted.",
    ],
  },
  {
    title: "Policy changes",
    points: [
      "We may update this policy when the platform or the law changes. Material changes will be highlighted on this page and, where practical, announced on the platform.",
      "Continued use of the platform after changes take effect means acceptance of the updated policy.",
    ],
  },
  {
    title: "Contact and grievance officer",
    points: [
      "Privacy questions: use the contact page, or email the grievance officer at " + OWNER.email + ".",
      `Grievance officer: ${OWNER.name}, Founder and Grievance Officer, amarbhaiya.in.`,
      "Grievances are acknowledged within 24 hours and addressed within 15 days. The full escalation process is on the grievance redressal page.",
      "This policy is governed by the laws of India. This page is not legal advice — if you need formal assurance, please consult a qualified professional.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="space-y-12 px-4 py-14 md:px-6 md:py-20 xl:space-y-16 xl:py-24">
      <section className="mx-auto max-w-6xl space-y-6">
        <SectionHeading
          eyebrow="Legal"
          title="Privacy policy"
          description="What data we collect, why we collect it, how we protect it, and the rights you have over it."
          titleAs="h1"
        />
        <RetroPanel tone="secondary" className="space-y-3">
          <p className="text-sm font-medium leading-7 text-foreground/80">
            Effective date: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <p className="text-sm font-medium leading-7 text-foreground/80">
            If you have questions, contact us through the <Link href="/contact" className="font-bold text-accent hover:underline">contact page</Link>, or review the{" "}
            <Link href="/cookie-policy" className="font-bold text-accent hover:underline">cookie policy</Link> and{" "}
            <Link href="/grievance-redressal" className="font-bold text-accent hover:underline">grievance redressal</Link> pages.
          </p>
        </RetroPanel>
      </section>

      <section className="mx-auto max-w-6xl grid gap-4">
        {sections.map((section, index) => (
          <RetroPanel key={section.title} tone={index % 2 === 0 ? "card" : "muted"} className="space-y-3">
            <h2 className="font-heading text-2xl font-black tracking-[-0.05em]">{section.title}</h2>
            <ul className="grid gap-2" role="list">
              {section.points.map((point) => (
                <li key={point} className="text-sm font-medium leading-7 text-foreground/80">
                  {point}
                </li>
              ))}
            </ul>
          </RetroPanel>
        ))}
      </section>
    </div>
  );
}
