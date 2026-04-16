"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "@/lib/appwrite/actions";
import { Input, Button } from "@heroui/react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await forgotPasswordAction({ email });

    if (result.success) {
      setSent(true);
    } else {
      setError(result.error || "Something went wrong.");
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="w-full flex flex-col gap-6 animate-fade-in-up">
        <div className="mb-2">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-black tracking-[-0.03em] leading-none mb-3">
            Check your email
          </h2>
          <p className="text-foreground/60 text-base font-medium">
            If an account exists for <span className="text-foreground font-semibold">{email}</span>, 
            we&apos;ve sent a password reset link.
          </p>
        </div>

        <Button
          onPress={() => { setSent(false); setEmail(""); }}
          variant="outline"
          size="lg"
          fullWidth
          className="font-bold border-border/60 hover:bg-surface-hover"
        >
          Try a different email
        </Button>
        
        <p className="mt-4 text-center text-sm font-medium text-foreground/60">
          <Link href="/login" className="text-foreground font-bold hover:text-accent transition-colors">
            ← Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in-up">
      <div className="mb-2">
        <h2 className="text-[clamp(2rem,4vw,3rem)] font-black tracking-[-0.03em] leading-none mb-3">
          Reset password
        </h2>
        <p className="text-foreground/60 text-base font-medium">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-foreground/70">Email address</label>
          <Input
            required
            placeholder="you@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="bg-surface shadow-[var(--field-shadow)]"
          />
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          variant="primary"
          isPending={loading}
          className="mt-2 font-bold bg-accent text-accent-foreground text-base shadow-[0_4px_16px_color-mix(in_oklab,var(--accent)_30%,transparent)]"
        >
          {loading ? "Sending link..." : "Send reset link"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm font-medium text-foreground/60">
        Remember your password?{" "}
        <Link href="/login" className="text-foreground font-bold hover:text-accent transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
