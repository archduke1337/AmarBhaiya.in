"use client";

import { useState } from "react";
import Link from "next/link";
import { confirmPasswordRecoveryAction } from "@/actions/verification";
import { Button, Input } from "@heroui/react";

export function ResetPasswordForm({
  userId,
  secret,
}: {
  userId: string;
  secret: string;
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("userId", userId);
    formData.set("secret", secret);

    const result = await confirmPasswordRecoveryAction(formData);

    if (!result.success) {
      setError(result.error || "Failed to reset password. Please try again.");
      setLoading(false);
    }
    // On success, the action calls redirect() which navigates away
  }

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in-up">
      <div className="mb-2">
        <h2 className="text-[clamp(2rem,4vw,3rem)] font-black tracking-[-0.03em] leading-none mb-3">
          New password
        </h2>
        <p className="text-foreground/60 text-base font-medium">
          Create a new password for your account.
        </p>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground/70">
              New password
            </label>
            <Input
              required
              name="password"
              placeholder="Min 8 chars, letter, number, symbol"
              type="password"
              minLength={8}
              className="bg-surface shadow-[var(--field-shadow)]"
            />
          </div>
          <p className="text-xs text-foreground/50 px-2 font-medium">
            At least 8 characters with a letter, number, and special character.
          </p>
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          variant="primary"
          isPending={loading}
          className="mt-2 font-bold bg-accent text-accent-foreground text-base shadow-[0_4px_16px_color-mix(in_oklab,var(--accent)_30%,transparent)]"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm font-medium text-foreground/60">
        <Link
          href="/login"
          className="text-foreground font-bold hover:text-accent transition-colors"
        >
          Cancel and return to sign in
        </Link>
      </p>
    </div>
  );
}
