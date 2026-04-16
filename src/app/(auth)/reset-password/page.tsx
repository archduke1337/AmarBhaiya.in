import Link from "next/link";
import { confirmPasswordRecoveryAction } from "@/actions/verification";
import { Button, Input } from "@heroui/react";

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

        <Link href="/login" className="mx-auto block">
          <Button
            variant="outline"
            className="font-bold border-border/60 hover:bg-surface-hover px-8"
          >
            Back to login
          </Button>
        </Link>
      </div>
    );
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

      <form action={confirmPasswordRecoveryAction} className="flex flex-col gap-5">
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="secret" value={secret} />

        <div className="flex flex-col gap-2">
          {/* Note: since this is a server component handling standard form submission, 
              we pass standard html inputs with HeroUI classes for styling, or 
              use standard HTML FormData in the action. We can use HeroUI Input. */}
          <Input
            isRequired
            name="password"
            label="New password"
            placeholder="Min 8 chars, 1 letter, 1 number"
            type="password"
            minLength={8}
            variant="faded"
            classNames={{
              inputWrapper: "bg-surface shadow-[var(--field-shadow)]",
              label: "font-semibold text-foreground/70",
            }}
          />
          <p className="text-xs text-foreground/50 px-2 font-medium">
            At least 8 characters with a letter and a number.
          </p>
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          variant="primary"
          className="mt-2 font-bold bg-accent text-accent-foreground text-base shadow-[0_4px_16px_color-mix(in_oklab,var(--accent)_30%,transparent)]"
        >
          Reset Password
        </Button>
      </form>

      <p className="mt-4 text-center text-sm font-medium text-foreground/60">
        <Link href="/login" className="text-foreground font-bold hover:text-accent transition-colors">
          Cancel and return to sign in
        </Link>
      </p>
    </div>
  );
}
