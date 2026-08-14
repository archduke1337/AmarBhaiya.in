import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Reset Password" };

type PageProps = {
  searchParams: Promise<{ userId?: string; secret?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { userId, secret } = await searchParams;

  if (!userId || !secret) {
    return (
      <div className="w-full flex flex-col gap-6 animate-fade-in-up">
        <div className="mb-2 text-center">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-black tracking-[-0.03em] leading-none mb-3">
            Invalid Link
          </h2>
          <p className="text-foreground/60 text-base font-medium">
            This password reset link is invalid or has expired.
          </p>
        </div>

        <Button asChild variant="outline" className="mx-auto block font-bold border-border/60 hover:bg-surface-hover px-8">
            <Link href="/login">Back to login</Link>
          </Button>
      </div>
    );
  }

  return <ResetPasswordForm userId={userId} secret={secret} />;
}
