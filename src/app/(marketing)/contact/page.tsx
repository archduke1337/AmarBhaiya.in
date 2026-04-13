import type { Metadata } from "next";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Badge } from "@/components/ui/badge";

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
    <div className="px-6 py-20 md:px-12 md:py-28">
      <section className="mx-auto grid max-w-6xl gap-8 xl:grid-cols-[0.9fr_1.1fr] xl:items-start">
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Contact"
            title="Bring us the real question, not just the headline."
            description="Whether this is a support issue, a partnership idea, or a course decision, we want the context behind it so we can reply like humans who actually read the message."
            titleAs="h1"
          />

          <RetroPanel tone="secondary" size="lg" className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Support</Badge>
              <Badge variant="outline">Collaborations</Badge>
              <Badge variant="outline">Mentoring</Badge>
            </div>
            <p className="text-sm font-semibold leading-6 text-foreground/80">
              Good messages usually include your goal, where you are stuck, and what timeline you are working with.
            </p>
          </RetroPanel>

          <div className="grid gap-4 md:grid-cols-2">
            {channels.length === 0 ? (
              <RetroPanel tone="muted" className="md:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Contact channels are not configured yet.
                </p>
              </RetroPanel>
            ) : null}

            {channels.map((item, index) => (
              <RetroPanel
                key={item.label}
                tone={index % 3 === 0 ? "accent" : index % 3 === 1 ? "card" : "muted"}
                className="space-y-2"
              >
                <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="text-lg font-bold tracking-[-0.03em]">{item.value}</p>
              </RetroPanel>
            ))}
          </div>
        </div>

        <ContactForm />
      </section>
    </div>
  );
}
