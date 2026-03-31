"use server";

import { redirect } from "next/navigation";
import { createSessionClient, createAdminClient } from "./server";
import type { Role } from "@/lib/utils/constants";
import { getUserRole } from "./auth-utils";

// ── Types ───────────────────────────────────────────────────────────────────

export interface AppwriteUser {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  name: string;
  email: string;
  phone: string;
  labels: string[];
  status: boolean;
  emailVerification: boolean;
  phoneVerification: boolean;
  prefs: Record<string, unknown>;
}

// ── Get Logged In User ──────────────────────────────────────────────────────

export async function getLoggedInUser(): Promise<AppwriteUser | null> {
  try {
    const { account } = await createSessionClient();
    return (await account.get()) as unknown as AppwriteUser;
  } catch {
    return null;
  }
}

// ── Require Authentication ──────────────────────────────────────────────────

export async function requireAuth(): Promise<AppwriteUser> {
  const user = await getLoggedInUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

// ── Require Specific Role ───────────────────────────────────────────────────

export async function requireRole(
  allowedRoles: Role[]
): Promise<{ user: AppwriteUser; role: Role }> {
  const user = await requireAuth();
  const role = getUserRole(user);
  if (!allowedRoles.includes(role)) {
    redirect("/app/dashboard");
  }
  return { user, role };
}

// ── Assign Role (Admin only) ────────────────────────────────────────────────

export async function assignRole(userId: string, role: Role): Promise<void> {
  const { users } = await createAdminClient();
  const user = await users.get({ userId });
  const currentLabels = user.labels || [];

  // Remove existing role labels and add new one
  const roleLabels = ["admin", "instructor", "moderator", "student"];
  const cleanedLabels = currentLabels.filter(
    (l: string) => !roleLabels.includes(l)
  );
  cleanedLabels.push(role);

  await users.updateLabels({ userId, labels: cleanedLabels });
}
