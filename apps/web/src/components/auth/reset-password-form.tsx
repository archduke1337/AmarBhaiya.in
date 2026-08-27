"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { confirmPasswordRecoveryAction } from "@/server/actions/verification";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { getPasswordStrength } from "@/lib/utils/password-strength";

export function ResetPasswordForm({
  userId,
  secret,
}: {
  userId: string;
  secret: string;
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("userId", userId);
    formData.set("secret", secret);

    const result = await confirmPasswordRecoveryAction(formData).catch(() => ({
      success: false,
      error: "Unable to reset the password right now. Please request a new link.",
    }));

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
        <div role="alert" aria-live="polite" className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reset-password" className="text-sm font-semibold text-foreground/70">
              New password
            </label>
            <PasswordInput
              id="reset-password"
              required
              name="password"
              placeholder="Min 8 chars, letter, number, symbol"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-surface shadow-[var(--field-shadow)]"
            />
          </div>
          {password.length > 0 && (
            <div className="flex flex-col gap-1.5 px-1 animate-fade-in-up">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      i <= strength.score ? strength.color : "bg-border"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs font-semibold px-1">
                {strength.label}
              </p>
            </div>
          )}
          {password.length === 0 && (
            <p className="text-xs text-foreground/50 px-2 font-medium">
              At least 8 characters with a letter, number, and special character.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="reset-password-confirm" className="text-sm font-semibold text-foreground/70">
            Confirm password
          </label>
          <PasswordInput
            id="reset-password-confirm"
            required
            placeholder="Re-enter your new password"
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="bg-surface shadow-[var(--field-shadow)]"
          />
          {confirmPassword.length > 0 && password !== confirmPassword && (
            <p className="text-xs font-semibold text-danger px-1 animate-fade-in-up">
              Passwords do not match
            </p>
          )}
          {confirmPassword.length > 0 && password === confirmPassword && (
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-1 animate-fade-in-up">
              Passwords match
            </p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="mt-2 w-full font-bold text-base shadow-[0_4px_16px_color-mix(in_oklab,var(--accent)_30%,transparent)]"
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
