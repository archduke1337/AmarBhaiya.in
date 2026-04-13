"use client";

import { useState } from "react";
import emailjs from "@emailjs/browser";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const initialState: FormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export function ContactForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

  const canSend = Boolean(serviceId && templateId && publicKey);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setFeedback("");

    if (!canSend) {
      setStatus("error");
      setFeedback(
        "Contact form is not configured yet. Add EmailJS public env vars to enable sending."
      );
      return;
    }

    try {
      await emailjs.send(
        serviceId!,
        templateId!,
        {
          from_name: form.name,
          from_email: form.email,
          subject: form.subject,
          message: form.message,
        },
        { publicKey }
      );

      setStatus("success");
      setFeedback("Message sent successfully. You should receive a reply soon.");
      setForm(initialState);
    } catch {
      setStatus("error");
      setFeedback("Unable to send message right now. Please try again in a few minutes.");
    }
  }

  return (
    <RetroPanel asChild tone="card" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.22em] text-muted-foreground">
            Contact form
          </p>
          <h2 className="font-heading text-3xl font-black tracking-[-0.05em]">
            Start the conversation properly.
          </h2>
          <p className="text-sm font-medium leading-6 text-muted-foreground">
            Tell us what you are trying to build, solve, or decide. We will reply with something useful.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contact-name">Name</Label>
            <Input
              id="contact-name"
              required
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              name="name"
              type="text"
              placeholder="Your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-email">Email</Label>
            <Input
              id="contact-email"
              required
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              name="email"
              type="email"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-subject">Subject</Label>
          <Input
            id="contact-subject"
            required
            value={form.subject}
            onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
            name="subject"
            type="text"
            placeholder="What can we help with?"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-message">Message</Label>
          <Textarea
            id="contact-message"
            required
            value={form.message}
            onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
            name="message"
            placeholder="Give us the context, timeline, and what a helpful reply would look like."
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={status === "loading"} size="lg">
            {status === "loading" ? "Sending..." : "Send message"}
          </Button>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Replies usually land within 1-2 business days
          </p>
        </div>

        {feedback && (
          <p
            className={
              status === "success"
                ? "rounded-[calc(var(--radius)+4px)] border-2 border-border bg-secondary px-4 py-3 text-sm font-semibold text-foreground"
                : "rounded-[calc(var(--radius)+4px)] border-2 border-destructive bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
            }
          >
            {feedback}
          </p>
        )}
      </form>
    </RetroPanel>
  );
}
