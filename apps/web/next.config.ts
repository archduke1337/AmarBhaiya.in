import path from "node:path";
import type { NextConfig } from "next";

export default async function getConfig(): Promise<NextConfig> {
  const withBundleAnalyzer = process.env.ANALYZE === "true"
    ? (await import("@next/bundle-analyzer")).default({ enabled: true })
    : (c: NextConfig) => c;

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
    // Keep Turbopack rooted at the monorepo instead of an unrelated parent lockfile.
    turbopack: {
      root: path.join(__dirname, "../.."),
    },

    // ── Images ────────────────────────────────────────────────────────────────
    images: {
      remotePatterns,
      formats: ["image/avif", "image/webp"],
    },

    // ── Security Headers ──────────────────────────────────────────────────────
    headers: async () => [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com https://checkout.razorpay.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://*.appwrite.io https://cloud.appwrite.io https://*.vercel.app https://vercel.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.appwrite.io https://cloud.appwrite.io https://vitals.vercel-insights.com https://va.vercel-scripts.com https://chat.stream.io https://*.stream.io wss://*.stream.io https://api.razorpay.com https://api.emailjs.com",
              "frame-src 'self' https://checkout.razorpay.com https://js.stripe.com https://www.youtube.com https://player.vimeo.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ],

    experimental: {
      serverActions: {
        bodySizeLimit: "8mb",
      },
      optimizePackageImports: ["lucide-react", "radix-ui"],
    },

    // ── Server Packages ───────────────────────────────────────────────────────
    serverExternalPackages: ["node-appwrite"],
  };

  return withBundleAnalyzer(nextConfig);
}
