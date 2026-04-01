"use server";

import { revalidatePath } from "next/cache";
import { createSessionClient } from "@/lib/appwrite/server";
import { requireAuth } from "@/lib/appwrite/auth";

// ── Send Verification Email ─────────────────────────────────────────────────
// Sends a magic link to the user's email. When clicked, Appwrite confirms
// the email and sets emailVerification = true on the user record.

export async function sendVerificationEmailAction(): Promise<void> {
  await requireAuth();

  try {
    const { account } = await createSessionClient();

    // The URL the user will be redirected to after clicking the email link.
    // Must be an allowed URL in Appwrite Console → Auth → Security → Hostname.
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://amarbhaiya.in"}/verify-email`;

    await account.createVerification({ url: verificationUrl });
  } catch (error) {
    console.error(
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
): Promise<{ success: boolean; error?: string }> {
  try {
    const { account } = await createSessionClient();
    await account.updateVerification({ userId, secret });
    revalidatePath("/app/profile/edit");
    revalidatePath("/app/dashboard");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Verification failed. The link may have expired.",
    };
  }
}

// ── Send Password Recovery Email ────────────────────────────────────────────
// Public action — doesn't require auth. Sends a reset link to the email.

export async function sendPasswordRecoveryAction(
  formData: FormData
): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return;

  try {
    const { account } = await createSessionClient();
    const recoveryUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://amarbhaiya.in"}/reset-password`;
    await account.createRecovery({ email, url: recoveryUrl });
  } catch (error) {
    // Don't reveal whether the email exists — silently log
    console.error(
      error instanceof Error ? error.message : "Failed to send recovery email."
    );
  }
}

// ── Confirm Password Recovery ───────────────────────────────────────────────
// Called when user lands on /reset-password?userId=...&secret=...

export async function confirmPasswordRecoveryAction(
  formData: FormData
): Promise<void> {
  const userId = String(formData.get("userId") ?? "");
  const secret = String(formData.get("secret") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!userId || !secret || !password || password.length < 8) return;

  try {
    const { account } = await createSessionClient();
    await account.updateRecovery({ userId, secret, password });
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to reset password."
    );
  }
}
