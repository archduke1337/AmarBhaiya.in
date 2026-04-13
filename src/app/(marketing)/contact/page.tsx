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

const contactChecklist = [
  "What you are trying to solve or decide",
  "Any deadline or exam / launch timeline that matters",
  "What a useful reply would help you do next",
];

export default async function ContactPage() {
  const channels = await getContactChannelsContent();

  return (
    <div className="space-y-12 px-4 py-14 md:px-6 md:py-20 xl:space-y-16 xl:py-24">
      <section className="mx-auto grid max-w-6xl gap-8 xl:grid-cols-[0.92fr_1.08fr] xl:items-start">
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

          <RetroPanel tone="card" className="space-y-4">
            <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Before you send it
            </p>
            <div className="grid gap-3">
              {contactChecklist.map((item, index) => (
                <div
                  key={item}
                  className="grid gap-3 rounded-[calc(var(--radius)+2px)] border-2 border-border bg-[color:var(--surface-card)] px-4 py-3 shadow-retro-sm md:grid-cols-[32px_1fr] md:items-start"
                >
                  <div className="flex size-8 items-center justify-center rounded-full border-2 border-border bg-[color:var(--surface-accent)] font-heading text-sm font-black">
                    {index + 1}
                  </div>
                  <p className="text-sm font-medium leading-6 text-foreground/80">{item}</p>
                </div>
              ))}
            </div>
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

        <div className="xl:sticky xl:top-28">
          <ContactForm />
        </div>
      </section>
    </div>
  );
}
