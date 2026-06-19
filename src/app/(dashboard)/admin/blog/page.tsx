import Link from "next/link";
import {
  ArrowUpRight,
  FileText,
  Globe2,
  NotebookPen,
  Trash2,
  ExternalLink,
} from "lucide-react";

import {
  createBlogPostFormAction,
  updateBlogPostFormAction,
  deleteBlogPostFormAction,
} from "@/actions/form-wrappers";
import { getAdminBlogPosts } from "@/actions/marketing";
import { formatCompactNumber } from "@/lib/utils/format";
import { PageHeader, StatCard, StatGrid } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireRole } from "@/lib/appwrite/auth";
import { BlogPreviewButton } from "../marketing/blog-preview";
import { BlogPostForm } from "../marketing/blog-post-form";
import { MarkdownEditor } from "../marketing/markdown-editor";

export default async function AdminBlogPage() {
  await requireRole(["admin"]);
  const posts = await getAdminBlogPosts();
  const publishedCount = posts.filter((post) => post.isPublished).length;
  const draftCount = posts.length - publishedCount;

  return (
    <div className="flex flex-col gap-8 max-w-7xl">
      <PageHeader
        eyebrow="Admin"
        title="Blog Manager"
        description="Write, edit, and publish blog posts. Draft updates here, publish when ready."
        actions={
          <Button asChild>
            <Link href="/blog" target="_blank" rel="noreferrer">
              <Globe2 className="size-4" />
              Public Blog
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        }
      />

      {/* ── Blog Stats ──────────────────────────────────────────────────── */}
      <StatGrid columns={4}>
        <StatCard
          label="Total Posts"
          value={posts.length}
          icon={FileText}
          description="All time"
        />
        <StatCard
          label="Published"
          value={publishedCount}
          icon={Globe2}
          description="Live on /blog"
        />
        <StatCard
          label="Drafts"
          value={draftCount}
          icon={NotebookPen}
          description="Not yet visible"
        />
        <StatCard
          label="Published %"
          value={posts.length > 0 ? Math.round((publishedCount / posts.length) * 100) : 0}
          icon={ArrowUpRight}
          description={`${publishedCount} of ${posts.length}`}
        />
      </StatGrid>

      {/* ── Create Blog Post ────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-2xl border border-border/40 bg-surface">
        <div className="flex items-center gap-2 border-b border-border/40 bg-surface-hover px-5 py-3.5">
          <NotebookPen className="size-4 text-muted-foreground" />
          <div>
            <h2 className="font-heading text-sm font-black uppercase tracking-[0.12em]">
              Create Blog Post
            </h2>
            <p className="text-xs text-muted-foreground">
              Draft and publish long-form updates. Auto-saves while you type.
            </p>
          </div>
        </div>

        <BlogPostForm createBlogPostFormAction={createBlogPostFormAction} />
      </section>

      {/* ── Blog Post Management ────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
              Blog Post Management
            </p>
            <h2 className="font-heading text-lg font-black tracking-[-0.03em]">
              Edit or remove existing posts
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Total: {posts.length}</Badge>
            <Badge variant="outline">Published: {publishedCount}</Badge>
            <Badge variant="outline">Draft: {draftCount}</Badge>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/40 bg-surface p-8 text-center text-sm font-medium text-muted-foreground">
            No blog posts available. Create your first post above.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="overflow-hidden rounded-2xl border border-border/40 bg-surface"
              >
                <div className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-heading text-lg font-black tracking-[-0.04em]">
                      {post.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      /{post.slug} · {post.category}
                      {post.publishedAt ? ` · ${formatPublishedAt(post.publishedAt)}` : ""}
                    </p>
                    <p className="max-w-4xl text-sm font-medium leading-7 text-muted-foreground line-clamp-2">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Badge variant={post.isPublished ? "default" : "outline"}>
                      {post.isPublished ? "Published" : "Draft"}
                    </Badge>

                    <BlogPreviewButton
                      title={post.title}
                      content={post.content}
                    />

                    <Button asChild size="sm" variant="outline">
                      <Link href={`/blog/${post.slug}`} target="_blank" rel="noreferrer">
                        View
                        <ExternalLink className="size-3.5" />
                      </Link>
                    </Button>

                    <form action={deleteBlogPostFormAction}>
                      <input type="hidden" name="postId" value={post.id} />
                      <Button type="submit" size="sm" variant="destructive">
                        <Trash2 className="size-3.5" />
                        Delete
                      </Button>
                    </form>
                  </div>
                </div>

                <form
                  action={updateBlogPostFormAction}
                  className="border-t border-border/40 bg-surface-hover p-5 space-y-4"
                >
                  <input type="hidden" name="postId" value={post.id} />

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="space-y-1.5">
                      <Label htmlFor={`post-title-${post.id}`}>Title</Label>
                      <Input
                        id={`post-title-${post.id}`}
                        name="title"
                        defaultValue={post.title}
                        placeholder="Title"
                      />
                    </label>

                    <label className="space-y-1.5">
                      <Label htmlFor={`post-category-${post.id}`}>Category</Label>
                      <Input
                        id={`post-category-${post.id}`}
                        name="category"
                        defaultValue={post.category}
                        placeholder="Category"
                      />
                    </label>

                    <label className="space-y-1.5 md:col-span-2">
                      <Label htmlFor={`post-excerpt-${post.id}`}>Excerpt</Label>
                      <textarea
                        id={`post-excerpt-${post.id}`}
                        name="excerpt"
                        defaultValue={post.excerpt}
                        className="input-field--textarea min-h-20 w-full"
                      />
                    </label>

                    <div className="md:col-span-2">
                      <MarkdownEditor
                        id={`post-content-${post.id}`}
                        name="content"
                        defaultValue={post.content}
                        label="Content"
                        minHeight="min-h-28"
                      />
                    </div>

                    <label className="space-y-1.5">
                      <Label htmlFor={`post-state-${post.id}`}>Publish state</Label>
                      <select
                        id={`post-state-${post.id}`}
                        name="isPublished"
                        defaultValue={post.isPublished ? "true" : "false"}
                        className="input-field--select w-full"
                      >
                        <option value="true">Published</option>
                        <option value="false">Draft</option>
                      </select>
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Button type="submit" size="sm">
                      <NotebookPen className="size-3.5" />
                      Save Changes
                    </Button>
                    {!post.isPublished && (
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Draft — publish to make visible on /blog
                      </p>
                    )}
                  </div>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function formatPublishedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
