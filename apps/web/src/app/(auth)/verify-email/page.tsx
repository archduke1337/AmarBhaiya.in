import type { Metadata } from "next";
import Link from "next/link";
import { confirmEmailVerificationAction } from "@/server/actions/verification";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Verify Email" };

type PageProps = {
  searchParams: Promise<{ userId?: string; secret?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const { userId, secret } = await searchParams;

  let result: { success: boolean; error?: string } = {
    success: false,
    error: "Missing verification parameters.",
  };

  if (userId && secret) {
    result = await confirmEmailVerificationAction(userId, secret);
  }

  return (
    <div className="w-full max-w-md text-center">
      <div className="w-full space-y-6 rounded-3xl border border-border/40 bg-surface p-6 shadow-[var(--surface-shadow)] sm:p-8">
        {result.success ? (
          <>
            <h1 className="font-heading text-[clamp(1.75rem,4vw,2.5rem)] font-normal leading-tight tracking-[-0.02em]">
              Email Verified
            </h1>
            <p className="mx-auto max-w-sm text-sm font-medium leading-6 text-muted-foreground">
              Your email has been successfully verified. You now have full access
              to all platform features.
            </p>
            <Button asChild size="lg" className="mt-2 font-bold">
              <Link href="/app/dashboard">Go to Dashboard</Link>
            </Button>
          </>
        ) : (
          <>
            <h1 className="font-heading text-[clamp(1.75rem,4vw,2.5rem)] font-normal leading-tight tracking-[-0.02em]">
              Verification Failed
            </h1>
            <p className="mx-auto max-w-sm text-sm font-medium leading-6 text-muted-foreground">
              {result.error}
            </p>
            <Button asChild variant="outline" size="lg" className="mt-2 font-bold">
              <Link href="/app/profile/edit">Back to Profile</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
