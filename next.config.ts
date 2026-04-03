import type { NextConfig } from "next";

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  {
    protocol: "https",
    hostname: "**.appwrite.io",
  },
  {
    protocol: "https",
    hostname: "cloud.appwrite.io",
  },
];

const appwriteEndpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
if (appwriteEndpoint) {
  try {
    const endpointUrl = new URL(appwriteEndpoint);
    remotePatterns.push({
      protocol: endpointUrl.protocol.replace(":", "") as "http" | "https",
      hostname: endpointUrl.hostname,
      port: endpointUrl.port || undefined,
    });
  } catch {
    // Ignore malformed endpoint values here; runtime config will still fail loudly.
  }
}

const nextConfig: NextConfig = {
  // ── Images ────────────────────────────────────────────────────────────────
  images: {
    remotePatterns,
  },

  // ── Server Packages ───────────────────────────────────────────────────────
  serverExternalPackages: ["node-appwrite"],
};

export default nextConfig;
