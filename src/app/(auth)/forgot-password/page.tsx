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
      <div className="w-full max-w-[400px] animate-fade-in">
        <div className="mb-10">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to sign in
          </Link>
          <h1 className="text-3xl mt-6 mb-2">Check your email</h1>
          <p className="text-muted-foreground text-sm">
            If an account exists for <span className="text-foreground">{email}</span>, 
            we&apos;ve sent a password reset link.
          </p>
        </div>

        <Button
          onClick={() => { setSent(false); setEmail(""); }}
          variant="outline"
          className="w-full h-11 border-border hover:bg-card transition-colors cursor-pointer"
        >
          Try a different email
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px] animate-fade-in">
      {/* Header */}
      <div className="mb-10">
        <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to sign in
        </Link>
        <h1 className="text-3xl mt-6 mb-2">Reset password</h1>
        <p className="text-muted-foreground text-sm">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-3 border border-destructive/30 bg-destructive/5 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground">
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
            className="h-11 bg-card border-border focus:border-foreground transition-colors"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-foreground text-background hover:bg-foreground/90 transition-colors cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 border border-background/30 border-t-background animate-spin" style={{ borderRadius: "50%" }} />
              Sending...
            </span>
          ) : (
            "Send reset link"
          )}
        </Button>
      </form>

      {/* Footer */}
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link href="/login" className="text-foreground hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
