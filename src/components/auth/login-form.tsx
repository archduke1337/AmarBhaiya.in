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
    <div className="w-full max-w-[400px] animate-fade-in">
      <div className="mb-10">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← amarbhaiya.in
        </Link>
        <h1 className="text-3xl mt-6 mb-2">Sign in</h1>
        <p className="text-muted-foreground text-sm">
          Enter your credentials to continue.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 border border-destructive/30 bg-destructive/5 text-sm text-destructive">
          {error}
        </div>
      )}

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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted-foreground">
              Password
            </Label>
            <Link
              href={forgotPasswordHref}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
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
              Signing in...
            </span>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href={registerHref} className="text-foreground hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
