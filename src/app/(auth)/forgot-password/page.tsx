"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "@/lib/appwrite/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
      <div className="w-full max-w-[430px] animate-fade-in">
        <div className="mb-8">
          <Link href="/login" className="font-heading text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground transition-colors">
            ← Back to sign in
          </Link>
          <h1 className="mt-6 text-5xl">Check your email</h1>
          <p className="mt-3 text-sm font-semibold text-muted-foreground">
            If an account exists for <span className="text-foreground">{email}</span>, 
            we&apos;ve sent a password reset link.
          </p>
        </div>

        <Button
          onClick={() => { setSent(false); setEmail(""); }}
          variant="outline"
          size="lg"
          className="w-full"
        >
          Try a different email
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[430px] animate-fade-in">
      <div className="mb-8">
        <Link href="/login" className="font-heading text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground transition-colors">
          ← Back to sign in
        </Link>
        <h1 className="mt-6 text-5xl">Reset password</h1>
        <p className="mt-3 text-sm font-semibold text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-[calc(var(--radius)+2px)] border-2 border-border bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground shadow-retro-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="bg-card"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="size-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
              Sending...
            </span>
          ) : (
            "Send reset link"
          )}
        </Button>
      </form>

      <p className="mt-8 rounded-[calc(var(--radius)+2px)] border-2 border-border bg-accent px-4 py-3 text-center text-sm font-semibold text-accent-foreground shadow-retro-sm">
        Remember your password?{" "}
        <Link href="/login" className="font-heading uppercase tracking-[0.08em] text-foreground underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
