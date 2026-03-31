import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BLOG_POSTS, getBlogPostBySlug } from "@/lib/utils/content";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

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
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="px-6 md:px-12 py-20 md:py-28">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href="/blog" className="text-sm text-muted-foreground underline underline-offset-4">
          Back to blog
        </Link>

        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {post.category} - {new Date(post.publishedAt).toLocaleDateString("en-IN")} - {post.readMinutes} min
          </p>
          <h1 className="text-4xl md:text-5xl leading-tight">{post.title}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">{post.excerpt}</p>
        </header>

        <div className="border-t border-border pt-8 space-y-6">
          {post.content.map((paragraph) => (
            <p key={paragraph} className="text-base text-muted-foreground leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </article>
  );
}
