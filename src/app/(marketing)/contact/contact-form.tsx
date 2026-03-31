"use client";

import { useState } from "react";
import emailjs from "@emailjs/browser";

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
    <form onSubmit={handleSubmit} className="border border-border p-7 md:p-8 space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <label className="space-y-2 text-sm">
          <span className="text-muted-foreground">Name</span>
          <input
            required
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="w-full h-11 border border-border bg-background px-3"
            name="name"
            type="text"
            placeholder="Your full name"
          />
        </label>

        <label className="space-y-2 text-sm">
          <span className="text-muted-foreground">Email</span>
          <input
            required
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            className="w-full h-11 border border-border bg-background px-3"
            name="email"
            type="email"
            placeholder="you@example.com"
          />
        </label>
      </div>

      <label className="space-y-2 text-sm block">
        <span className="text-muted-foreground">Subject</span>
        <input
          required
          value={form.subject}
          onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
          className="w-full h-11 border border-border bg-background px-3"
          name="subject"
          type="text"
          placeholder="What can we help with?"
        />
      </label>

      <label className="space-y-2 text-sm block">
        <span className="text-muted-foreground">Message</span>
        <textarea
          required
          value={form.message}
          onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
          className="w-full min-h-36 border border-border bg-background px-3 py-2"
          name="message"
          placeholder="Write your message"
        />
      </label>

      <button
        type="submit"
        disabled={status === "loading"}
        className="h-11 px-6 bg-foreground text-background text-sm font-medium disabled:opacity-60"
      >
        {status === "loading" ? "Sending..." : "Send message"}
      </button>

      {feedback && (
        <p className={status === "success" ? "text-sm text-emerald-600" : "text-sm text-destructive"}>
          {feedback}
        </p>
      )}
    </form>
  );
}
