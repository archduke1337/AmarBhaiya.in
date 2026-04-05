"use server";

import { ID } from "node-appwrite";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createAdminClient,
  createPublicClient,
  createSessionClient,
} from "./server";
import { APPWRITE_CONFIG } from "./config";
import {
  getServerActionExpiredSessionCookieOptions,
  getServerActionSessionCookieOptions,
} from "./session-cookie";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
} from "../validators/auth";
import type { LoginInput, RegisterInput, ForgotPasswordInput } from "../validators/auth";
import { getAppOrigin } from "../utils/url";

// ── Types ───────────────────────────────────────────────────────────────────

export type ActionResult = {
  success: boolean;
  error?: string;
};

function getSessionCookieOptions(expire: string) {
  return getServerActionSessionCookieOptions(expire);
}

// ── Login ───────────────────────────────────────────────────────────────────

export async function loginAction(data: LoginInput): Promise<ActionResult> {
  // Validate
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const { account } = await createAdminClient();
    const session = await account.createEmailPasswordSession({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (!session.secret) {
      throw new Error("Missing Appwrite session secret.");
    }

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set(
      APPWRITE_CONFIG.sessionCookieName,
      session.secret,
      await getSessionCookieOptions(session.expire)
    );

    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Login failed. Please try again.";
    // Appwrite returns specific error messages for invalid credentials
    if (message.includes("Invalid credentials")) {
      return { success: false, error: "Invalid email or password." };
    }
    return { success: false, error: "Login failed. Please try again." };
  }
}

// ── Register ────────────────────────────────────────────────────────────────

export async function registerAction(data: RegisterInput): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const { account: publicAccount } = await createPublicClient();

    // Create user account
    await publicAccount.create({
      userId: ID.unique(),
      email: parsed.data.email,
      password: parsed.data.password,
      name: parsed.data.name,
    });

    // Auto-login after registration
    const { account } = await createAdminClient();
    const session = await account.createEmailPasswordSession({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (!session.secret) {
      throw new Error("Missing Appwrite session secret.");
    }

    const cookieStore = await cookies();
    cookieStore.set(
      APPWRITE_CONFIG.sessionCookieName,
      session.secret,
      await getSessionCookieOptions(session.expire)
    );

    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Registration failed.";
    if (message.includes("already exists")) {
      return {
        success: false,
        error: "An account with this email already exists.",
      };
    }
    return { success: false, error: "Registration failed. Please try again." };
  }
}

// ── Forgot Password ─────────────────────────────────────────────────────────

export async function forgotPasswordAction(
  data: ForgotPasswordInput
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const { account } = await createPublicClient();
    await account.createRecovery({
      email: parsed.data.email,
      url: `${getAppOrigin()}/reset-password`,
    });
    return { success: true };
  } catch {
    // Always return success to prevent email enumeration
    return { success: true };
  }
}

// ── Logout ──────────────────────────────────────────────────────────────────

export async function logoutAction(): Promise<void> {
  try {
    const { account } = await createSessionClient();
    await account.deleteSession({ sessionId: "current" });
  } catch {
    // Session might already be expired — that's fine
  }

  const cookieStore = await cookies();
  cookieStore.set(
    APPWRITE_CONFIG.sessionCookieName,
    "",
    await getServerActionExpiredSessionCookieOptions()
  );
  redirect("/login");
}
