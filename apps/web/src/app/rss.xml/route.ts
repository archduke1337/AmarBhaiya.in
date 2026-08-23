import { getPublicBlogPageData } from "@/server/appwrite/marketing-content";

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://amarbhaiya.in";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  let posts: Awaited<ReturnType<typeof getPublicBlogPageData>>["posts"] = [];
  try {
    const data = await getPublicBlogPageData({});
    posts = data.posts;
  } catch (error) {
    console.error("[RSS] Failed to fetch blog data", error);
    posts = [];
  }

  const items = posts
    .map((post) => {
      const pubDate = new Date(post.publishedAt);
      const rfcDate = isNaN(pubDate.getTime())
        ? new Date().toUTCString()
        : pubDate.toUTCString();

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE_URL}/blog/${encodeURIComponent(post.slug)}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${encodeURIComponent(post.slug)}</guid>
      <description>${escapeXml(post.excerpt)}</description>
      <category>${escapeXml(post.category)}</category>
      <dc:creator>${escapeXml(post.authorName)}</dc:creator>
      <pubDate>${rfcDate}</pubDate>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>amarbhaiya.in — Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>Practical notes on learning systems, productivity, fitness, and student career execution from Amar Bhaiya.</description>
    <language>en-in</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}