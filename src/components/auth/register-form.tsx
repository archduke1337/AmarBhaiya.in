"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Checkbox, Button, Input } from "@heroui/react";

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
      setError("Please agree to the privacy policy to continue.");
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
    <div className="w-full flex flex-col gap-6 animate-fade-in-up">
      <div className="mb-2">
        <h2 className="text-[clamp(2rem,4vw,3rem)] font-black tracking-[-0.03em] leading-none mb-3">
          Create account
        </h2>
        <p className="text-foreground/60 text-base font-medium">
          Join thousands of students learning with Bhaiya.
        </p>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-foreground/70">Full Name</label>
          <Input
            required
            placeholder="Amar Pandey"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            classNames={{
              inputWrapper: "bg-surface shadow-[var(--field-shadow)]",
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-foreground/70">Email address</label>
          <Input
            required
            placeholder="you@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            classNames={{
              inputWrapper: "bg-surface shadow-[var(--field-shadow)]",
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-foreground/70">Password</label>
          <Input
            required
            placeholder="Min 8 chars, 1 letter, 1 number"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            classNames={{
              inputWrapper: "bg-surface shadow-[var(--field-shadow)]",
            }}
          />
          <p className="text-xs text-foreground/50 px-2 font-medium">
            At least 8 characters with a letter and a number.
          </p>
        </div>

        <div className="bg-surface/50 border border-border/40 rounded-xl px-4 py-3 flex items-start gap-3 mt-1">
          <Checkbox
            isSelected={consent}
            onValueChange={setConsent}
            color="primary"
            size="sm"
            classNames={{
              wrapper: "mt-0.5",
            }}
          >
            <span className="text-sm font-medium text-foreground/80 leading-relaxed block">
              I agree to the{" "}
              <Link href="/privacy" className="text-accent hover:underline font-semibold">
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link href="/terms" className="text-accent hover:underline font-semibold">
                Terms of Service
              </Link>.
            </span>
          </Checkbox>
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          color="primary"
          variant="solid"
          isPending={loading}
          className="mt-2 font-bold bg-accent text-accent-foreground text-base shadow-[0_4px_16px_color-mix(in_oklab,var(--accent)_30%,transparent)]"
        >
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm font-medium text-foreground/60">
        Already have an account?{" "}
        <Link href={loginHref} className="text-foreground font-bold hover:text-accent transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
