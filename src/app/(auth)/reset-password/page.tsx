import Link from "next/link";
import { confirmPasswordRecoveryAction } from "@/actions/verification";

type PageProps = {
  searchParams: Promise<{ userId?: string; secret?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { userId, secret } = await searchParams;

  if (!userId || !secret) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md border border-border p-8 text-center">
          <h1 className="text-2xl font-medium">Invalid Reset Link</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This password reset link is invalid or has expired.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block text-sm underline underline-offset-4"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md border border-border p-8">
        <h1 className="text-2xl font-medium text-center">Reset Password</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Enter a new password for your account.
        </p>

        <form
          action={confirmPasswordRecoveryAction}
          className="mt-6 flex flex-col gap-4"
        >
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="secret" value={secret} />

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">New Password</span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="Minimum 8 characters"
              className="h-10 border border-border bg-background px-3 text-sm"
            />
          </label>

          <button
            type="submit"
            className="h-10 w-full bg-foreground text-sm text-background transition-opacity hover:opacity-90"
          >
            Reset Password
          </button>

          <Link
            href="/login"
            className="text-center text-sm text-muted-foreground underline underline-offset-4"
          >
            Back to Login
          </Link>
        </form>
      </div>
    </div>
  );
}
