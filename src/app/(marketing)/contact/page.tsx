import type { Metadata } from "next";

import { getContactChannelsContent } from "@/lib/appwrite/marketing-content";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Send a message to the amarbhaiya.in team for collaborations, support, or enrollment queries.",
};

export default async function ContactPage() {
  const channels = await getContactChannelsContent();

  return (
    <div className="px-6 md:px-12 py-20 md:py-28 space-y-12">
      <section className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.2fr] gap-8 md:gap-10">
        <div className="space-y-7">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Contact</p>
          <h1 className="text-4xl md:text-6xl leading-tight">Let us build your next move.</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Have a question about courses, mentoring, partnerships, or platform
            support? Share your details and we will get back shortly.
          </p>

          <div className="border border-border divide-y divide-border">
            {channels.length === 0 ? (
              <div className="px-5 py-4 text-sm text-muted-foreground">
                Contact channels are not configured yet.
              </div>
            ) : null}
            {channels.map((item) => (
              <div key={item.label} className="px-5 py-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                  {item.label}
                </p>
                <p>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <ContactForm />
      </section>
    </div>
  );
}
