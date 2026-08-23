import { getUserRole } from "./auth-utils";
import { createAdminClient, createSessionClient } from "./server";
import type { Role } from "@/lib/utils/constants";

// Shared auth helpers for API route handlers (not server actions —
// these must never call redirect()).

export async function getApiUser() {
  try {
    const { account } = await createSessionClient();
    return await account.get();
  } catch {
    return null;
  }
}

export type ApiUserContext = {
  userId: string;
  role: Role;
};

export async function getApiUserContext(): Promise<ApiUserContext | null> {
  try {
    const { account } = await createSessionClient();
    const sessionUser = await account.get();
    const { users } = await createAdminClient();
    const adminUser = await users.get({ userId: sessionUser.$id });

    return {
      userId: sessionUser.$id,
      role: getUserRole(adminUser),
    };
  } catch {
    return null;
  }
}

export async function getAuthenticatedManager(): Promise<{
  account: Awaited<ReturnType<typeof createSessionClient>>["account"];
  user: Awaited<ReturnType<Awaited<ReturnType<typeof createSessionClient>>["account"]["get"]>> & { labels: string[] };
  role: Role;
} | null> {
  try {
    const { account } = await createSessionClient();
    const sessionUser = await account.get();
    const { users } = await createAdminClient();
    const adminUser = await users.get({ userId: sessionUser.$id });
    const role = getUserRole(adminUser);
    return {
      account,
      user: {
        ...sessionUser,
        labels: Array.isArray((adminUser as { labels?: unknown }).labels)
          ? ((adminUser as { labels: string[] }).labels ?? [])
          : [],
      },
      role,
    };
  } catch {
    return null;
  }
}