import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Images ────────────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.appwrite.io",
      },
      {
        protocol: "https",
        hostname: "cloud.appwrite.io",
      },
    ],
  },

  // ── Server Packages ───────────────────────────────────────────────────────
  serverExternalPackages: ["node-appwrite"],
};

export default nextConfig;
