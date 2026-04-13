"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm({ redirectPath }: { redirectPath: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loginHref =
    redirectPath === "/app/dashboard"
      ? "/login"
      : `/login?redirect=${encodeURIComponent(redirectPath)}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!consent) {
      setError("You must agree to the privacy policy.");
      return;
    }

    setLoading(true);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ name, email, password, consent }),
    }).catch(() => null);

    if (response?.ok) {
      router.push(redirectPath);
    } else {
      const body = await response?.json().catch(() => null);
      setError(
        typeof body?.error === "string" ? body.error : "Registration failed."
      );
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[430px] animate-fade-in">
      <div className="mb-8">
        <Link href="/" className="font-heading text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground transition-colors">
          ← amarbhaiya.in
        </Link>
        <h1 className="mt-6 text-5xl">Create account</h1>
        <p className="mt-3 text-sm font-semibold text-muted-foreground">
          Join thousands of students learning with Bhaiya.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-[calc(var(--radius)+2px)] border-2 border-border bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground shadow-retro-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">
            Full Name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            className="bg-card"
          />
        </div>

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

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Min 8 chars, 1 letter, 1 number"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="bg-card"
          />
          <p className="rounded-[calc(var(--radius)+2px)] border-2 border-border bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground shadow-retro-sm">
            At least 8 characters with a letter and a number.
          </p>
        </div>

        <div className="rounded-[calc(var(--radius)+2px)] border-2 border-border bg-accent px-4 py-3 shadow-retro-sm">
        <div className="flex items-start gap-3 pt-1">
          <Checkbox
            id="consent"
            checked={consent}
            onCheckedChange={(v) => setConsent(v === true)}
            className="mt-0.5"
          />
          <Label
            htmlFor="consent"
            className="cursor-pointer font-sans text-[0.68rem] font-semibold normal-case tracking-normal leading-relaxed text-accent-foreground"
          >
            I agree to the{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/terms" className="underline">
              Terms of Service
            </Link>
            .
          </Label>
        </div>
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
              Creating account...
            </span>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <p className="mt-8 rounded-[calc(var(--radius)+2px)] border-2 border-border bg-secondary px-4 py-3 text-center text-sm font-semibold text-secondary-foreground shadow-retro-sm">
        Already have an account?{" "}
        <Link href={loginHref} className="font-heading uppercase tracking-[0.08em] text-foreground underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
