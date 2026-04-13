import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { getPublicBlogPostBySlug } from "@/lib/appwrite/marketing-content";

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
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPublicBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="px-6 py-20 md:px-12 md:py-28">
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
            <h1 className="font-heading text-4xl font-black leading-[0.94] tracking-[-0.06em] md:text-6xl">
              {post.title}
            </h1>
            <p className="max-w-3xl text-lg font-medium leading-8 text-muted-foreground">
              {post.excerpt}
            </p>
          </div>

          <RetroPanel tone="accent" className="space-y-2">
            <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Why this matters
            </p>
            <p className="text-base font-semibold leading-7 text-foreground/85">
              This article is written for people who need a usable mental model, not just a good sentence to remember later.
            </p>
          </RetroPanel>
        </RetroPanel>

        <RetroPanel tone="muted" size="lg">
          <div className="mx-auto max-w-3xl space-y-6">
            {post.content.map((paragraph, index) => (
              <p
                key={`${index}-${paragraph.slice(0, 24)}`}
                className="text-base font-medium leading-8 text-foreground/85 md:text-lg"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </RetroPanel>
      </div>
    </article>
  );
}
