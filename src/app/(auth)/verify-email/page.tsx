import Link from "next/link";
import { confirmEmailVerificationAction } from "@/actions/verification";

type PageProps = {
  searchParams: Promise<{ userId?: string; secret?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const { userId, secret } = await searchParams;

  let result = { success: false, error: "Missing verification parameters." };

  if (userId && secret) {
    result = await confirmEmailVerificationAction(userId, secret);
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md border border-border p-8 text-center">
        {result.success ? (
          <>
            <h1 className="text-2xl font-medium">Email Verified ✓</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Your email has been successfully verified. You now have full access
              to all platform features.
            </p>
            <Link
              href="/app/dashboard"
              className="mt-6 inline-block h-10 bg-foreground px-6 text-sm leading-10 text-background transition-opacity hover:opacity-90"
            >
              Go to Dashboard
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-medium">Verification Failed</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {result.error}
            </p>
            <Link
              href="/app/profile/edit"
              className="mt-6 inline-block text-sm underline underline-offset-4"
            >
              Back to Profile
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
