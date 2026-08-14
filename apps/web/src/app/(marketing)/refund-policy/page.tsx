import type { Metadata } from "next";
import Link from "next/link";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "When and how refunds work for paid courses and premium subscriptions on amarbhaiya.in.",
};

const sections = [
  {
    title: "Paid courses",
    body: "You can request a refund within 7 days of purchasing a paid course if you have not completed more than a quarter of the course content. Refunds are returned to the original payment method. Access is revoked once the refund is processed.",
  },
  {
    title: "Premium subscriptions",
    body: "Subscription renewals can be cancelled at any time before the next billing cycle. Cancellation stops future charges; the current paid period remains active until it ends. Refunds for the current period are considered on request when the subscription has not been used.",
  },
  {
    title: "Free notes and free courses",
    body: "Free notes, free courses, and public material are not refundable — they are available at no cost by design.",
  },
  {
    title: "Failed or duplicate payments",
    body: "If your payment succeeded but your course was not activated, or you were charged twice, contact support with the payment reference and we will resolve it, including a full refund where applicable.",
  },
  {
    title: "How to request a refund",
    body: "Send your request through the contact page or directly by email, mentioning the course or subscription name, the payment reference, and the reason. Requests are processed within 7 business days of confirmation.",
  },
];

export default function RefundPolicyPage() {
  return (
    <div className="space-y-12 px-4 py-14 md:px-6 md:py-20 xl:space-y-16 xl:py-24">
      <section className="mx-auto max-w-6xl space-y-6">
        <SectionHeading
          eyebrow="Legal"
          title="Refund policy"
          description="Clear, fair refund rules for paid courses and premium subscriptions."
          titleAs="h1"
        />
        <RetroPanel tone="secondary" className="space-y-3">
          <p className="text-sm font-medium leading-7 text-foreground/80">
            Effective date: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <p className="text-sm font-medium leading-7 text-foreground/80">
            For billing help, visit{" "}
            <Link href="/support" className="font-bold text-accent hover:underline">
              support
            </Link>{" "}
            or use the{" "}
            <Link href="/contact" className="font-bold text-accent hover:underline">
              contact page
            </Link>
            .
          </p>
        </RetroPanel>
      </section>

      <section className="mx-auto max-w-6xl grid gap-4">
        {sections.map((item, index) => (
          <RetroPanel key={item.title} tone={index % 2 === 0 ? "card" : "muted"} className="space-y-3">
            <h2 className="font-heading text-2xl font-black tracking-[-0.05em]">{item.title}</h2>
            <p className="text-sm font-medium leading-7 text-foreground/80">{item.body}</p>
          </RetroPanel>
        ))}
      </section>
    </div>
  );
}