import type { MetadataRoute } from "next";
import { APPWRITE_CONFIG } from "@/server/appwrite/config";
import { createAdminClient } from "@/server/appwrite/server";
import { safeListAllRows, type AnyRow } from "@/server/appwrite/dashboard-data/internal";

const STATIC_ROUTES = [
  { path: "/", priority: 1.0, changeFreq: "weekly" as const },
  { path: "/courses", priority: 0.9, changeFreq: "daily" as const },
  { path: "/notes", priority: 0.8, changeFreq: "weekly" as const },
  { path: "/blog", priority: 0.8, changeFreq: "weekly" as const },
  { path: "/about", priority: 0.6, changeFreq: "monthly" as const },
  { path: "/pricing", priority: 0.6, changeFreq: "monthly" as const },
  { path: "/faq", priority: 0.5, changeFreq: "monthly" as const },
  { path: "/contact", priority: 0.5, changeFreq: "monthly" as const },
  { path: "/support", priority: 0.4, changeFreq: "monthly" as const },
  { path: "/parents", priority: 0.4, changeFreq: "monthly" as const },
  { path: "/legal", priority: 0.4, changeFreq: "yearly" as const },
  { path: "/privacy", priority: 0.3, changeFreq: "yearly" as const },
  { path: "/terms", priority: 0.3, changeFreq: "yearly" as const },
  { path: "/refund-policy", priority: 0.3, changeFreq: "yearly" as const },
  { path: "/cookie-policy", priority: 0.3, changeFreq: "yearly" as const },
  { path: "/grievance-redressal", priority: 0.3, changeFreq: "yearly" as const },
  { path: "/community-guidelines", priority: 0.3, changeFreq: "yearly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://amarbhaiya.in";

  const staticEntries = STATIC_ROUTES.map((r) => ({
    url: `${baseUrl}${r.path}`,
    lastModified: new Date(),
    changeFrequency: r.changeFreq as "weekly" | "daily" | "monthly" | "yearly",
    priority: r.priority,
  }));

  try {
    const { tablesDB } = await createAdminClient();

    const [courseRows, blogRows] = await Promise.all([
      safeListAllRows<AnyRow>(tablesDB, APPWRITE_CONFIG.tables.courses),
      safeListAllRows<AnyRow>(tablesDB, APPWRITE_CONFIG.tables.blogPosts),
    ]);

    const courseEntries = courseRows.map((course) => ({
      url: `${baseUrl}/courses/${String(course.slug || course.$id)}`,
      lastModified: new Date(String(course.$updatedAt ?? Date.now())),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    const blogEntries = blogRows.map((post) => ({
      url: `${baseUrl}/blog/${String(post.slug || post.$id)}`,
      lastModified: new Date(String(post.$updatedAt ?? Date.now())),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

    return [...staticEntries, ...courseEntries, ...blogEntries];
  } catch {
    return staticEntries;
  }
}
