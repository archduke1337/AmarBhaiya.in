// Pure utility functions — NOT server actions.
// These are synchronous helpers that can run anywhere (server components, client, etc.)

import type { Role } from "@/lib/utils/constants";

interface AppwriteUserLike {
  labels?: string[];
}

// ── Get User Role ──────────────────────────────────────────────────────────
// Priority: admin > instructor > moderator > student

export function getUserRole(user: AppwriteUserLike | null): Role {
  if (!user) return "student";
  const labels = user.labels || [];
  if (labels.includes("admin")) return "admin";
  if (labels.includes("instructor")) return "instructor";
  if (labels.includes("moderator")) return "moderator";
  return "student";
}

// ── Check if User Has Role ──────────────────────────────────────────────────

export function hasRole(user: AppwriteUserLike | null, role: Role): boolean {
  if (!user) return role === "student";
  return (user.labels || []).includes(role);
}
