import Link from "next/link";
import {
  ArrowUpRight,
  FileText,
  Globe2,
  Megaphone,
  NotebookPen,
  RefreshCw,
  Trash2,
} from "lucide-react";

import {
  createBlogPostAction,
  upsertSiteCopyAction,
  updateBlogPostAction,
  deleteBlogPostAction,
  getAdminBlogPosts,
} from "@/actions/operations";
import { PageHeader } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireRole } from "@/lib/appwrite/auth";

const suggestedSiteKeys = [
  "home.domains",
  "home.learnItems",
  "home.whyItems",
  "home.metrics",
  "home.featuredCourses",
  "about.identityCards",
  "about.journey",
  "about.mission",
  "contact.channels",
];

const routePreviews: Array<{
  title: string;
  href: string;
  keyHint: string;
  description: string;
}> = [
  {
    title: "Homepage",
    href: "/",
    keyHint: "home.*",
    description: "Hero sections, metrics, and featured courses.",
  },
  {
    title: "About",
    href: "/about",
    keyHint: "about.*",
    description: "Identity cards, mission, and journey timeline.",
  },
  {
    title: "Courses",
    href: "/courses",
    keyHint: "home.featuredCourses",
    description: "Featured courses and discovery surface.",
  },
  {
    title: "Blog",
    href: "/blog",
    keyHint: "blogPosts",
    description: "Published blog posts and editorial feed.",
  },
  {
    title: "Contact",
    href: "/contact",
    keyHint: "contact.channels",
    description: "Support channels and communication CTAs.",
  },
];

const fieldTextareaClassName =
  "min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

const fieldSelectClassName =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export default async function AdminMarketingPage() {
  await requireRole(["admin"]);
  const posts = await getAdminBlogPosts();
  const publishedCount = posts.filter((post) => post.isPublished).length;
  const draftCount = posts.length - publishedCount;

  return (
    <div className="space-y-8 max-w-7xl">
      <PageHeader
        eyebrow="Admin"
        title="Marketing Command Center"
        description="Manage homepage copy, update structured sections, publish blog posts, and instantly preview the live marketing experience."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/blog" target="_blank" rel="noreferrer">
                <FileText className="size-4" />
                Public Blog
                <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
            <Button asChild>
              <Link href="/" target="_blank" rel="noreferrer">
                <Globe2 className="size-4" />
                Open Website
                <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-3 md:grid-cols-3">
        <Card size="sm" className="ring-1 ring-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Structured Site Keys</CardTitle>
            <CardDescription>Editable content map entries</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">{suggestedSiteKeys.length}</p>
          </CardContent>
        </Card>

        <Card size="sm" className="ring-1 ring-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Published Blog Posts</CardTitle>
            <CardDescription>Currently visible on /blog</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">{publishedCount}</p>
          </CardContent>
        </Card>

        <Card size="sm" className="ring-1 ring-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Draft Blog Posts</CardTitle>
            <CardDescription>Ready for publishing workflow</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">{draftCount}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="ring-1 ring-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="size-4 text-muted-foreground" />
              Upsert Site Copy
            </CardTitle>
            <CardDescription>
              Keep structured content in sync for homepage, about, and contact sections.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={upsertSiteCopyAction} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="site-copy-key">Key</Label>
                  <Input
                    id="site-copy-key"
                    name="key"
                    placeholder="example: home.domains"
                    required
                  />
                </label>

                <label className="space-y-1.5">
                  <Label htmlFor="site-copy-title">Title</Label>
                  <Input
                    id="site-copy-title"
                    name="title"
                    placeholder="Optional heading"
                  />
                </label>

                <label className="space-y-1.5">
                  <Label htmlFor="site-copy-status">Publish state</Label>
                  <select
                    id="site-copy-status"
                    name="isPublished"
                    className={fieldSelectClassName}
                    defaultValue="true"
                  >
                    <option value="true">Published</option>
                    <option value="false">Draft</option>
                  </select>
                </label>
              </div>

              <label className="space-y-1.5 block">
                <Label htmlFor="site-copy-body">Body</Label>
                <textarea
                  id="site-copy-body"
                  name="body"
                  placeholder="Short copy for this section"
                  className={fieldTextareaClassName}
                />
              </label>

              <label className="space-y-1.5 block">
                <Label htmlFor="site-copy-payload">JSON payload</Label>
                <textarea
                  id="site-copy-payload"
                  name="payload"
                  placeholder='{"items":[{"title":"Example","value":"Data"}]}'
                  className={`${fieldTextareaClassName} min-h-40 font-mono text-xs`}
                />
              </label>

              <Button type="submit" className="w-full sm:w-auto">
                <RefreshCw className="size-4" />
                Sync Site Copy
              </Button>
            </form>

            <div className="mt-5 rounded-lg border border-dashed border-border p-3">
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                Suggested Keys
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestedSiteKeys.map((key) => (
                  <Badge key={key} variant="outline" className="font-mono text-[11px]">
                    {key}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="ring-1 ring-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <NotebookPen className="size-4 text-muted-foreground" />
              Publish Blog Post
            </CardTitle>
            <CardDescription>
              Draft and publish long-form updates for the public blog route.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createBlogPostAction} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="blog-title">Title</Label>
                  <Input
                    id="blog-title"
                    name="title"
                    placeholder="Post title"
                    required
                    minLength={6}
                  />
                </label>

                <label className="space-y-1.5">
                  <Label htmlFor="blog-slug">Slug</Label>
                  <Input
                    id="blog-slug"
                    name="slug"
                    placeholder="optional-custom-slug"
                  />
                </label>

                <label className="space-y-1.5">
                  <Label htmlFor="blog-category">Category</Label>
                  <Input
                    id="blog-category"
                    name="category"
                    placeholder="Guides"
                    required
                  />
                </label>

                <label className="space-y-1.5">
                  <Label htmlFor="blog-author">Author name</Label>
                  <Input
                    id="blog-author"
                    name="authorName"
                    placeholder="Team Amar"
                  />
                </label>

                <label className="space-y-1.5">
                  <Label htmlFor="blog-status">Publish state</Label>
                  <select
                    id="blog-status"
                    name="isPublished"
                    className={fieldSelectClassName}
                    defaultValue="true"
                  >
                    <option value="true">Published</option>
                    <option value="false">Draft</option>
                  </select>
                </label>

                <label className="space-y-1.5">
                  <Label htmlFor="blog-published-at">Publish at</Label>
                  <Input id="blog-published-at" type="datetime-local" name="publishedAt" />
                </label>

                <label className="space-y-1.5">
                  <Label htmlFor="blog-read-minutes">Read time (minutes)</Label>
                  <Input
                    id="blog-read-minutes"
                    type="number"
                    min={1}
                    name="readMinutes"
                    defaultValue={5}
                  />
                </label>
              </div>

              <label className="space-y-1.5 block">
                <Label htmlFor="blog-excerpt">Excerpt</Label>
                <textarea
                  id="blog-excerpt"
                  name="excerpt"
                  placeholder="Short summary shown in cards and previews"
                  required
                  minLength={12}
                  className={fieldTextareaClassName}
                />
              </label>

              <label className="space-y-1.5 block">
                <Label htmlFor="blog-content">Content</Label>
                <textarea
                  id="blog-content"
                  name="content"
                  placeholder="Write full post content here"
                  required
                  minLength={24}
                  className={`${fieldTextareaClassName} min-h-52`}
                />
              </label>

              <Button type="submit" className="w-full sm:w-auto">
                <Megaphone className="size-4" />
                Save Blog Post
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
            Live Marketing Routes
          </p>
          <h2 className="text-xl font-semibold tracking-tight">Connected Page Previews</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {routePreviews.map((route) => (
            <Card key={route.href} size="sm" className="ring-1 ring-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{route.title}</CardTitle>
                <CardDescription className="text-xs">{route.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-[11px] text-muted-foreground">
                  Source key: <span className="font-mono">{route.keyHint}</span>
                </p>
                <Button asChild size="sm" variant="outline" className="w-full justify-between">
                  <Link href={route.href} target="_blank" rel="noreferrer">
                    Preview
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <Card className="overflow-hidden ring-1 ring-border/70">
          <CardHeader className="border-b border-border/70">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Blog Post Management</CardTitle>
                <CardDescription>Edit or remove existing blog posts.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Total: {posts.length}</Badge>
                <Badge variant="outline">Published: {publishedCount}</Badge>
                <Badge variant="outline">Draft: {draftCount}</Badge>
              </div>
            </div>
          </CardHeader>

          {posts.length === 0 ? (
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No blog posts available. Create your first post above.
            </CardContent>
          ) : (
            <div className="divide-y divide-border/70">
              {posts.map((post) => (
                <article key={post.id} className="space-y-4 px-4 py-5 md:px-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <h3 className="text-base font-medium leading-tight">{post.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        /{post.slug} · {post.category}
                        {post.publishedAt ? ` · ${formatPublishedAt(post.publishedAt)}` : ""}
                      </p>
                      <p className="max-w-4xl text-sm text-muted-foreground">{post.excerpt}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={post.isPublished ? "default" : "outline"}>
                        {post.isPublished ? "Published" : "Draft"}
                      </Badge>

                      <Button asChild size="sm" variant="outline">
                        <Link href={`/blog/${post.slug}`} target="_blank" rel="noreferrer">
                          View
                          <ArrowUpRight className="size-3.5" />
                        </Link>
                      </Button>

                      <form action={deleteBlogPostAction}>
                        <input type="hidden" name="postId" value={post.id} />
                        <Button type="submit" size="sm" variant="destructive">
                          <Trash2 className="size-3.5" />
                          Delete
                        </Button>
                      </form>
                    </div>
                  </div>

                  <form
                    action={updateBlogPostAction}
                    className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-3"
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
                          className={fieldTextareaClassName}
                        />
                      </label>

                      <label className="space-y-1.5 md:col-span-2">
                        <Label htmlFor={`post-content-${post.id}`}>Content</Label>
                        <textarea
                          id={`post-content-${post.id}`}
                          name="content"
                          defaultValue={post.content}
                          className={`${fieldTextareaClassName} min-h-28`}
                        />
                      </label>

                      <label className="space-y-1.5">
                        <Label htmlFor={`post-state-${post.id}`}>Publish state</Label>
                        <select
                          id={`post-state-${post.id}`}
                          name="isPublished"
                          defaultValue={post.isPublished ? "true" : "false"}
                          className={fieldSelectClassName}
                        >
                          <option value="true">Published</option>
                          <option value="false">Draft</option>
                        </select>
                      </label>
                    </div>

                    <Button type="submit" size="sm">
                      <NotebookPen className="size-3.5" />
                      Save Changes
                    </Button>
                  </form>
                </article>
              ))}
            </div>
          )}
        </Card>
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