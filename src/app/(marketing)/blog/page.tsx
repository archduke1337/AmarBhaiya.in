import type { Metadata } from "next";
import Link from "next/link";

import { BLOG_POSTS } from "@/lib/utils/content";

type SearchParams = Promise<{
  category?: string;
}>;

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Read practical notes on learning systems, productivity, fitness, and student career execution.",
};

export default async function BlogPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const activeCategory = typeof params.category === "string" ? params.category : "all";

  const categories = Array.from(new Set(BLOG_POSTS.map((post) => post.category)));

  const visiblePosts =
    activeCategory === "all"
      ? BLOG_POSTS
      : BLOG_POSTS.filter((post) => post.category === activeCategory);

  return (
    <div className="px-6 md:px-12 py-20 md:py-28 space-y-12">
      <section className="max-w-5xl mx-auto space-y-5">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Blog</p>
        <h1 className="text-4xl md:text-6xl leading-tight">Notes from the learning trenches.</h1>
        <p className="text-muted-foreground text-lg leading-relaxed max-w-3xl">
          Tactical writing for students and early builders who want practical
          systems and clear execution frameworks.
        </p>
      </section>

      <section className="max-w-5xl mx-auto border border-border p-4 md:p-5">
        <form className="flex flex-wrap items-center gap-3" method="GET">
          <label className="text-xs uppercase tracking-widest text-muted-foreground" htmlFor="category">
            Filter by category
          </label>
          <select
            id="category"
            name="category"
            defaultValue={activeCategory}
            className="h-10 bg-background border border-border px-3 text-sm"
          >
            <option value="all">All</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <button className="h-10 px-4 bg-foreground text-background text-sm" type="submit">
            Apply
          </button>
        </form>
      </section>

      <section className="max-w-5xl mx-auto space-y-4">
        {visiblePosts.map((post) => (
          <article key={post.slug} className="border border-border p-6 md:p-7 space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground uppercase tracking-widest">
              <span>{post.category}</span>
              <span>-</span>
              <span>{new Date(post.publishedAt).toLocaleDateString("en-IN")}</span>
              <span>-</span>
              <span>{post.readMinutes} min read</span>
            </div>
            <h2 className="text-2xl md:text-3xl leading-tight">{post.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{post.excerpt}</p>
            <Link href={`/blog/${post.slug}`} className="text-sm underline underline-offset-4">
              Read article
            </Link>
          </article>
        ))}
      </section>

      {visiblePosts.length === 0 && (
        <section className="max-w-5xl mx-auto border border-border p-10 text-center text-muted-foreground">
          No blog posts in this category yet.
        </section>
      )}
    </div>
  );
}
