import { Client, Account, TablesDB, Storage } from "appwrite";
import { APPWRITE_CONFIG } from "./config";

// ── Browser-side Appwrite Client ────────────────────────────────────────────
// Used ONLY for client-side features: Realtime subscriptions, file previews.
// Authentication is handled server-side via node-appwrite.

const client = new Client()
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId);

export const account = new Account(client);
export const tablesDB = new TablesDB(client);
export const storage = new Storage(client);

export { client };
