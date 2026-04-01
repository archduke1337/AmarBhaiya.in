import {
  createBlogPostAction,
  upsertSiteCopyAction,
  updateBlogPostAction,
  deleteBlogPostAction,
  getAdminBlogPosts,
} from "@/actions/operations";
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

export default async function AdminMarketingPage() {
  await requireRole(["admin"]);
  const posts = await getAdminBlogPosts();

  return (
    <div className="space-y-8 max-w-6xl">
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Marketing CMS
        </p>
        <h1 className="text-3xl md:text-4xl">Content Sync Dashboard</h1>
        <p className="text-muted-foreground max-w-3xl">
          Use these forms to sync homepage/about/contact content and manage blog
          posts.
        </p>
      </section>

      <section className="grid xl:grid-cols-2 gap-5">
        {/* Site Copy */}
        <article className="border border-border p-6 space-y-4">
          <h2 className="text-xl">Upsert site copy</h2>
          <form action={upsertSiteCopyAction} className="space-y-3">
            <input
              name="key"
              className="w-full h-11 border border-border bg-background px-3"
              placeholder="Key (example: home.domains)"
              required
            />
            <input
              name="title"
              className="w-full h-11 border border-border bg-background px-3"
              placeholder="Title (optional)"
            />
            <textarea
              name="body"
              className="w-full min-h-20 border border-border bg-background px-3 py-2"
              placeholder="Body text (optional)"
            />
            <textarea
              name="payload"
              className="w-full min-h-44 border border-border bg-background px-3 py-2 font-mono text-xs"
              placeholder="JSON payload for structured sections"
            />
            <label className="space-y-2 text-sm block">
              <span className="text-muted-foreground">Publish state</span>
              <select
                name="isPublished"
                className="w-full h-11 border border-border bg-background px-3"
                defaultValue="true"
              >
                <option value="true">Published</option>
                <option value="false">Draft</option>
              </select>
            </label>
            <button
              type="submit"
              className="h-10 px-4 bg-foreground text-background text-sm"
            >
              Sync site copy
            </button>
          </form>

          <div className="border border-border p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Suggested keys
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedSiteKeys.map((key) => (
                <span
                  key={key}
                  className="text-xs border border-border px-2 py-1 text-muted-foreground"
                >
                  {key}
                </span>
              ))}
            </div>
          </div>
        </article>

        {/* New Blog Post */}
        <article className="border border-border p-6 space-y-4">
          <h2 className="text-xl">Publish blog post</h2>
          <form action={createBlogPostAction} className="space-y-3">
            <input
              name="title"
              className="w-full h-11 border border-border bg-background px-3"
              placeholder="Post title"
              required
              minLength={6}
            />
            <input
              name="slug"
              className="w-full h-11 border border-border bg-background px-3"
              placeholder="Slug (optional)"
            />
            <textarea
              name="excerpt"
              className="w-full min-h-20 border border-border bg-background px-3 py-2"
              placeholder="Short excerpt"
              required
              minLength={12}
            />
            <div className="grid md:grid-cols-2 gap-3">
              <input
                name="category"
                className="w-full h-11 border border-border bg-background px-3"
                placeholder="Category"
                required
              />
              <input
                name="authorName"
                className="w-full h-11 border border-border bg-background px-3"
                placeholder="Author name"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <input
                type="datetime-local"
                name="publishedAt"
                className="w-full h-11 border border-border bg-background px-3"
              />
              <input
                type="number"
                min={1}
                name="readMinutes"
                defaultValue={5}
                className="w-full h-11 border border-border bg-background px-3"
              />
            </div>
            <textarea
              name="content"
              className="w-full min-h-52 border border-border bg-background px-3 py-2"
              placeholder="Write full post content here"
              required
              minLength={24}
            />
            <label className="space-y-2 text-sm block">
              <span className="text-muted-foreground">Publish state</span>
              <select
                name="isPublished"
                className="w-full h-11 border border-border bg-background px-3"
                defaultValue="true"
              >
                <option value="true">Published</option>
                <option value="false">Draft</option>
              </select>
            </label>
            <button
              type="submit"
              className="h-10 px-4 bg-foreground text-background text-sm"
            >
              Save post
            </button>
          </form>
        </article>
      </section>

      {/* Existing Blog Posts */}
      <section className="border border-border">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-medium">
            Blog Posts ({posts.length})
          </h2>
        </div>

        {posts.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            No blog posts yet. Create one above.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {posts.map((post) => (
              <div key={post.id} className="px-5 py-4 space-y-3">
                {/* Post header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-medium">{post.title}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      /{post.slug} · {post.category}
                      {post.publishedAt &&
                        ` · ${new Date(post.publishedAt).toLocaleDateString("en-IN")}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {post.excerpt}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] uppercase tracking-wider border px-1.5 py-0.5 ${
                        post.isPublished
                          ? "border-emerald-500/30 text-emerald-600"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {post.isPublished ? "Published" : "Draft"}
                    </span>
                    <form action={deleteBlogPostAction}>
                      <input type="hidden" name="postId" value={post.id} />
                      <button
                        type="submit"
                        className="text-xs text-destructive hover:underline"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>

                {/* Quick edit form */}
                <form
                  action={updateBlogPostAction}
                  className="grid gap-2 md:grid-cols-4"
                >
                  <input type="hidden" name="postId" value={post.id} />
                  <input
                    name="title"
                    defaultValue={post.title}
                    placeholder="Title"
                    className="h-8 border border-border bg-background px-2 text-xs"
                  />
                  <input
                    name="excerpt"
                    defaultValue={post.excerpt}
                    placeholder="Excerpt"
                    className="h-8 border border-border bg-background px-2 text-xs"
                  />
                  <select
                    name="isPublished"
                    defaultValue={post.isPublished ? "true" : "false"}
                    className="h-8 border border-border bg-background px-2 text-xs"
                  >
                    <option value="true">Published</option>
                    <option value="false">Draft</option>
                  </select>
                  <button
                    type="submit"
                    className="h-8 border border-border px-2 text-xs hover:bg-muted transition-colors"
                  >
                    Update
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}