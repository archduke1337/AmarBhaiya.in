import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "amarbhaiya.in — Learn from Bhaiya",
    short_name: "AmarBhaiya",
    description:
      "School-first learning from Amar Bhaiya — notes, courses, and practical guidance for Class 6 to 12 students.",
    start_url: "/",
    display: "standalone",
    background_color: "#0e0e1a",
    theme_color: "#0e0e1a",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}