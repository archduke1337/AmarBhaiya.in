import Link from "next/link";
import { confirmPasswordRecoveryAction } from "@/actions/verification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PageProps = {
  searchParams: Promise<{ userId?: string; secret?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { userId, secret } = await searchParams;

  if (!userId || !secret) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="retro-surface bg-card p-8">
          <h1 className="text-4xl">Invalid Reset Link</h1>
          <p className="mt-3 text-sm font-semibold text-muted-foreground">
            This password reset link is invalid or has expired.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block font-heading text-xs uppercase tracking-[0.16em] underline underline-offset-4"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="retro-surface bg-card p-8">
        <h1 className="text-center text-4xl">Reset Password</h1>
        <p className="mt-3 text-center text-sm font-semibold text-muted-foreground">
          Enter a new password for your account.
        </p>

        <form
          action={confirmPasswordRecoveryAction}
          className="mt-6 flex flex-col gap-5"
        >
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="secret" value={secret} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="Minimum 8 characters"
              className="bg-card"
            />
          </div>

          <Button type="submit" size="lg" className="w-full">
            Reset Password
          </Button>

          <Link
            href="/login"
            className="text-center font-heading text-xs uppercase tracking-[0.16em] text-muted-foreground underline underline-offset-4"
          >
            Back to Login
          </Link>
        </form>
      </div>
    </div>
  );
}
