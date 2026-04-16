"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div className="w-full max-w-[430px] animate-fade-in">
      <div className="mb-8">
        <Link href="/" className="font-heading text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground transition-colors">
          ← amarbhaiya.in
        </Link>
        <h1 className="mt-6 text-5xl">Sign in</h1>
        <p className="mt-3 text-sm font-semibold text-muted-foreground">
          Enter your credentials to continue.
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

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">
              Password
            </Label>
            <Link
              href={forgotPasswordHref}
              className="text-xs font-heading uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors"
            >
              Forgot?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
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
              Signing in...
            </span>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <p className="mt-8 rounded-[calc(var(--radius)+2px)] border-2 border-border bg-accent px-4 py-3 text-center text-sm font-semibold text-accent-foreground shadow-retro-sm">
        Don&apos;t have an account?{" "}
        <Link href={registerHref} className="font-heading uppercase tracking-[0.08em] text-foreground underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
