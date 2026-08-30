import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MarkdownRenderer } from "@/components/marketing/markdown-renderer";
import { RetroPanel } from "@/components/marketing/retro-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { getPublicBlogPostBySlug } from "@/server/appwrite/marketing-content";

export const revalidate = 3600;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublicBlogPostBySlug(slug);

  if (!post) {
    return { title: "Post not found" };
  }

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      siteName: "amarbhaiya.in",
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPublicBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="site-container py-12 sm:py-20 md:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://amarbhaiya.in/",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Blog",
                item: "https://amarbhaiya.in/blog",
              },
              {
                "@type": "ListItem",
                position: 3,
                name: post.title,
              },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.excerpt,
            url: `https://amarbhaiya.in/blog/${slug}`,
            datePublished: post.publishedAt,
            author: { "@type": "Person", name: post.authorName },
            publisher: {
              "@type": "Organization",
              name: "amarbhaiya.in",
              url: "https://amarbhaiya.in",
            },
            mainEntityOfPage: `https://amarbhaiya.in/blog/${slug}`,
          }).replace(/</g, "\\u003c"),
        }}
      />
      <div className="mx-auto max-w-5xl space-y-8">
        <Button asChild variant="link" size="sm">
          <Link href="/blog">Back to blog</Link>
        </Button>

        <RetroPanel tone="card" size="lg" className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline">{post.category}</Badge>
            <Badge variant="secondary">{post.readMinutes} min read</Badge>
            <Badge variant="ghost">{new Date(post.publishedAt).toLocaleDateString("en-IN")}</Badge>
          </div>

          <div className="space-y-4">
            <h1 className="max-w-[16ch] font-heading text-[clamp(2.25rem,6vw,4.5rem)] font-normal leading-[1.05] tracking-[-0.02em]">
              {post.title}
            </h1>
            <p className="max-w-3xl text-lg font-medium leading-8 text-muted-foreground">
              {post.excerpt}
            </p>
          </div>

          <RetroPanel tone="accent" className="space-y-2">
            <p className="site-kicker font-sans">
              Why this matters
            </p>
            <p className="text-base font-semibold leading-7 text-foreground/85">
              This article is written for people who need a usable mental model, not just a good sentence to remember later.
            </p>
          </RetroPanel>
        </RetroPanel>

        <RetroPanel tone="muted" size="lg">
          <div className="mx-auto max-w-3xl space-y-6">
            <MarkdownRenderer content={post.content.join("\n\n")} />
          </div>
        </RetroPanel>
      </div>
    </article>
  );
}
