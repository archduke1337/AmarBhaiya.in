"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPublicClient, createSessionClient } from "@/server/appwrite/server";
import { requireAuth } from "@/server/appwrite/auth";
import { passwordSchema, forgotPasswordSchema } from "@/server/validators/auth";
import { checkRateLimit } from "@/server/rate-limiter";
import { actionSuccess, actionError } from "@/lib/errors/action-result";
import type { ActionResult } from "@/lib/errors/action-result";

async function getClientIpKey(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}

// ── Send Verification Email ─────────────────────────────────────────────────
// Sends a magic link to the user's email. When clicked, Appwrite confirms
// the email and sets emailVerification = true on the user record.

export async function sendVerificationEmailAction(): Promise<ActionResult> {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return actionError("You must be signed in to verify your email.");
  }

  const rateLimit = await checkRateLimit(`verify-email:${user.$id}`, 3);
  if (!rateLimit.allowed) {
    return actionError("Too many verification emails. Please try again later.");
  }

  try {
    const { account } = await createSessionClient();

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://amarbhaiya.in"}/verify-email`;

    await account.createVerification({ url: verificationUrl });
    return actionSuccess();
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to send verification email."
    );
    return actionError(
      error instanceof Error ? error.message : "Failed to send verification email."
    );
  }
}

// ── Confirm Verification ────────────────────────────────────────────────────
// Called when the user lands on /verify-email?userId=...&secret=...
// Appwrite SDK handles the confirmation.

export async function confirmEmailVerificationAction(
  userId: string,
  secret: string
): Promise<ActionResult> {
  const rateLimit = await checkRateLimit(
    `${await getClientIpKey()}:verify-email-confirm`,
    10
  );
  if (!rateLimit.allowed) {
    return actionError("Too many attempts. Please try again later.");
  }

  try {
    const { account } = await createPublicClient();
    await account.updateVerification({ userId, secret });
    revalidatePath("/app/profile/edit");
    revalidatePath("/app/dashboard");
    return actionSuccess();
  } catch (error) {
    return actionError(
      error instanceof Error
        ? error.message
        : "Verification failed. The link may have expired."
    );
  }
}

// ── Send Password Recovery Email ────────────────────────────────────────────
// Public action — doesn't require auth. Sends a reset link to the email.
// Always returns success to prevent email enumeration.

export async function sendPasswordRecoveryAction(
  formData: FormData
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const parsedEmail = forgotPasswordSchema.safeParse({ email });
  if (!parsedEmail.success) {
    return actionError(parsedEmail.error.issues[0].message);
  }

  const rateLimit = await checkRateLimit(
    `${await getClientIpKey()}:password-recovery`,
    3
  );
  if (!rateLimit.allowed) {
    return actionError("Too many requests. Please try again later.");
  }

  try {
    const { account } = await createPublicClient();
    const recoveryUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://amarbhaiya.in"}/reset-password`;
    await account.createRecovery({ email: parsedEmail.data.email, url: recoveryUrl });
  } catch {
    // Don't reveal whether the email exists — silently log
    console.error("Failed to send recovery email.");
  }

  // Always return success to prevent email enumeration
  return actionSuccess();
}

// ── Confirm Password Recovery ───────────────────────────────────────────────
// Called when user lands on /reset-password?userId=...&secret=...
// On success, redirects to /login?reset=success.
// On failure, returns an error result so the page can display it.

export async function confirmPasswordRecoveryAction(
  formData: FormData
): Promise<ActionResult> {
  const userId = String(formData.get("userId") ?? "");
  const secret = String(formData.get("secret") ?? "");
  const password = String(formData.get("password") ?? "");
  const parsedPassword = passwordSchema.safeParse(password);

  if (!userId || !secret) {
    return actionError("Invalid reset link. Please request a new one.");
  }

  if (!parsedPassword.success) {
    return actionError(parsedPassword.error.issues[0].message);
  }

  const rateLimit = await checkRateLimit(
    `${await getClientIpKey()}:password-recovery-confirm`,
    10
  );
  if (!rateLimit.allowed) {
    return actionError("Too many attempts. Please try again later.");
  }

  try {
    const { account } = await createPublicClient();
    await account.updateRecovery({
      userId,
      secret,
      password: parsedPassword.data,
    });
    redirect("/login?reset=success");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to reset password."
    );
    return actionError(
      error instanceof Error ? error.message : "Failed to reset password. The link may have expired."
    );
  }
}
