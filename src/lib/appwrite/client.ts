import { Client, Account, Databases, Storage } from "appwrite";
import { APPWRITE_CONFIG } from "./config";

// ── Browser-side Appwrite Client ────────────────────────────────────────────
// Used ONLY for client-side features like Realtime subscriptions.
// Authentication is handled server-side via node-appwrite.

const client = new Client()
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export { client };
