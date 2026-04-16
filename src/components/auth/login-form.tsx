"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input } from "@heroui/react";

export function LoginForm({ redirectPath }: { redirectPath: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const registerHref =
    redirectPath === "/app/dashboard"
      ? "/register"
      : `/register?redirect=${encodeURIComponent(redirectPath)}`;
  const forgotPasswordHref =
    redirectPath === "/app/dashboard"
      ? "/forgot-password"
      : `/forgot-password?redirect=${encodeURIComponent(redirectPath)}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    }).catch(() => null);

    if (response?.ok) {
      router.push(redirectPath);
    } else {
      const body = await response?.json().catch(() => null);
      setError(
        typeof body?.error === "string" ? body.error : "Login failed."
      );
      setLoading(false);
    }
  }

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in-up">
      <div className="mb-2">
        <h2 className="text-[clamp(2rem,4vw,3rem)] font-black tracking-[-0.03em] leading-none mb-3">
          Welcome back
        </h2>
        <p className="text-foreground/60 text-base font-medium">
          Enter your credentials to continue to your workspace.
        </p>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}

      {/* HeroUI natively supports forms, but we use standard onSubmit here */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          isRequired
          label="Email address"
          placeholder="you@example.com"
          type="email"
          value={email}
          onValueChange={setEmail}
          autoComplete="email"
          variant="faded"
          classNames={{
            inputWrapper: "bg-surface shadow-[var(--field-shadow)]",
            label: "font-semibold text-foreground/70",
          }}
        />

        <div className="flex flex-col gap-2 relative">
          <Input
            isRequired
            label="Password"
            placeholder="••••••••"
            type="password"
            value={password}
            onValueChange={setPassword}
            autoComplete="current-password"
            variant="faded"
            classNames={{
              inputWrapper: "bg-surface shadow-[var(--field-shadow)]",
              label: "font-semibold text-foreground/70",
            }}
          />
          <Link
            href={forgotPasswordHref}
            className="absolute right-2 top-3 text-xs font-bold uppercase tracking-[0.1em] text-accent hover:text-accent-foreground transition-colors z-10"
          >
            Forgot?
          </Link>
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          variant="primary"
          isPending={loading}
          className="mt-2 font-bold bg-accent text-accent-foreground text-base shadow-[0_4px_16px_color-mix(in_oklab,var(--accent)_30%,transparent)]"
        >
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm font-medium text-foreground/60">
        Don&apos;t have an account?{" "}
        <Link href={registerHref} className="text-foreground font-bold hover:text-accent transition-colors">
          Create one
        </Link>
      </p>
    </div>
  );
}
