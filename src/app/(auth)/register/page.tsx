"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerAction } from "@/lib/appwrite/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!consent) {
      setError("You must agree to the privacy policy.");
      return;
    }

    setLoading(true);
    const result = await registerAction({ name, email, password, consent });

    if (result.success) {
      router.push("/app/dashboard");
    } else {
      setError(result.error || "Registration failed.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[400px] animate-fade-in">
      {/* Header */}
      <div className="mb-10">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← amarbhaiya.in
        </Link>
        <h1 className="text-3xl mt-6 mb-2">Create account</h1>
        <p className="text-muted-foreground text-sm">
          Join thousands of students learning with Bhaiya.
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
          <Label htmlFor="name" className="text-xs uppercase tracking-widest text-muted-foreground">
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
            className="h-11 bg-card border-border focus:border-foreground transition-colors"
          />
        </div>

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
          <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted-foreground">
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
            className="h-11 bg-card border-border focus:border-foreground transition-colors"
          />
          <p className="text-xs text-muted-foreground">
            At least 8 characters with a letter and a number.
          </p>
        </div>

        <div className="flex items-start gap-3 pt-1">
          <Checkbox
            id="consent"
            checked={consent}
            onCheckedChange={(v) => setConsent(v === true)}
            className="mt-0.5 border-border data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
          />
          <Label htmlFor="consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
            I agree to the{" "}
            <Link href="/privacy" className="text-foreground hover:underline">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/terms" className="text-foreground hover:underline">
              Terms of Service
            </Link>
            .
          </Label>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-foreground text-background hover:bg-foreground/90 transition-colors cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 border border-background/30 border-t-background animate-spin" style={{ borderRadius: "50%" }} />
              Creating account...
            </span>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      {/* Footer */}
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-foreground hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
