import Link from "next/link";
import { confirmEmailVerificationAction } from "@/actions/verification";
import { Button } from "@/components/ui/button";

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
      <div className="retro-surface bg-card p-8">
        {result.success ? (
          <>
            <h1 className="text-4xl">Email Verified ✓</h1>
            <p className="mt-3 text-sm font-semibold text-muted-foreground">
              Your email has been successfully verified. You now have full access
              to all platform features.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link href="/app/dashboard">Go to Dashboard</Link>
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-4xl">Verification Failed</h1>
            <p className="mt-3 text-sm font-semibold text-muted-foreground">
              {result.error}
            </p>
            <Link
              href="/app/profile/edit"
              className="mt-6 inline-block font-heading text-xs uppercase tracking-[0.16em] underline underline-offset-4"
            >
              Back to Profile
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
