"use server";

import { Client, Account, TablesDB, Storage, Users } from "node-appwrite";
import { cookies } from "next/headers";
import { APPWRITE_CONFIG } from "./config";

// ── Session Client ──────────────────────────────────────────────────────────
// Used for authenticated requests on behalf of the current user.
// Creates a NEW client per request — never share between requests.

export async function createSessionClient() {
  const client = new Client()
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);

  const cookieStore = await cookies();
  const session = cookieStore.get(APPWRITE_CONFIG.sessionCookieName);

  if (!session || !session.value) {
    throw new Error("No session");
  }

  client.setSession(session.value);

  return {
    get account() {
      return new Account(client);
    },
    get tablesDB() {
      return new TablesDB(client);
    },
    get storage() {
      return new Storage(client);
    },
  };
}

// ── Admin Client ────────────────────────────────────────────────────────────
// Used for privileged operations: creating accounts, managing labels, webhooks.
// Uses API key — NEVER expose to client-side code.
// Singleton pattern — reuse across calls.

let _adminClient: Client | null = null;

function getAdminClient(): Client {
  if (!_adminClient) {
    _adminClient = new Client()
      .setEndpoint(APPWRITE_CONFIG.endpoint)
      .setProject(APPWRITE_CONFIG.projectId)
      .setKey(process.env.APPWRITE_API_KEY!);
  }
  return _adminClient;
}

export async function createAdminClient() {
  const client = getAdminClient();

  return {
    get account() {
      return new Account(client);
    },
    get tablesDB() {
      return new TablesDB(client);
    },
    get storage() {
      return new Storage(client);
    },
    get users() {
      return new Users(client);
    },
  };
}
