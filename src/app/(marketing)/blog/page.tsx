import type { Metadata } from "next";
import Link from "next/link";

import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { getPublicBlogPageData } from "@/lib/appwrite/marketing-content";

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

  const { posts: visiblePosts, categories } = await getPublicBlogPageData({
    category: activeCategory,
  });

  return (
    <div className="space-y-12 px-6 py-20 md:px-12 md:py-28">
      <section className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
        <SectionHeading
          eyebrow="Blog"
          title="Notes from the learning trenches."
          description="Writing for students and early builders who want frameworks they can apply this week, not abstract motivation that fades by tomorrow."
        />
        <RetroPanel tone="secondary" size="lg" className="space-y-4 xl:translate-y-8">
          <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.22em] text-muted-foreground">
            Editorial stance
          </p>
          <p className="text-lg font-bold leading-8 tracking-[-0.03em]">
            Short on jargon. Strong on decisions, systems, and the uncomfortable details that usually get edited out.
          </p>
        </RetroPanel>
      </section>

      <section className="mx-auto max-w-6xl">
        <RetroPanel tone="accent" className="space-y-4">
          <form className="grid gap-4 md:grid-cols-[1fr_auto]" method="GET">
            <div className="space-y-2">
              <Label htmlFor="category">Editorial lane</Label>
              <select
                id="category"
                name="category"
                defaultValue={activeCategory}
                className="h-11 w-full rounded-[calc(var(--radius)+2px)] border-2 border-border bg-card px-3.5 text-sm font-semibold text-foreground shadow-retro-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" variant="default" size="lg">
                Apply
              </Button>
            </div>
          </form>
        </RetroPanel>
      </section>

      <section className="mx-auto max-w-6xl space-y-5">
        {visiblePosts.map((post, index) => (
          <RetroPanel
            key={post.slug}
            tone={index % 3 === 0 ? "card" : index % 3 === 1 ? "muted" : "secondary"}
            size="lg"
            className="grid gap-6 md:grid-cols-[120px_1fr_auto] md:items-start"
          >
            <div className="space-y-2">
              <p className="font-heading text-xs font-black uppercase tracking-[0.18em] text-primary">
                #{String(index + 1).padStart(2, "0")}
              </p>
              <Badge variant="outline">{post.category}</Badge>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <span>{new Date(post.publishedAt).toLocaleDateString("en-IN")}</span>
                <span>{post.readMinutes} min read</span>
                <span>{post.authorName}</span>
              </div>
              <div className="space-y-3">
                <h2 className="font-heading text-3xl font-black leading-[0.95] tracking-[-0.05em]">
                  {post.title}
                </h2>
                <p className="max-w-3xl text-sm font-medium leading-7 text-foreground/80">
                  {post.excerpt}
                </p>
              </div>
            </div>

            <div className="md:justify-self-end">
              <Button asChild variant="outline" size="lg">
                <Link href={`/blog/${post.slug}`}>Read article</Link>
              </Button>
            </div>
          </RetroPanel>
        ))}
      </section>

      {visiblePosts.length === 0 && (
        <section className="mx-auto max-w-5xl">
          <RetroPanel tone="muted" className="text-center">
            <p className="text-sm font-medium text-muted-foreground">
              No blog posts in this category yet.
            </p>
          </RetroPanel>
        </section>
      )}
    </div>
  );
}
