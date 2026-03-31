import { createBlogPostAction, upsertSiteCopyAction } from "@/actions/operations";

const suggestedSiteKeys = [
  "home.domains",
  "home.learnItems",
  "home.whyItems",
  "home.metrics",
  "about.identityCards",
  "about.journey",
  "about.mission",
  "contact.channels",
];

export default function AdminMarketingPage() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Marketing CMS</p>
        <h1 className="text-3xl md:text-4xl">Content Sync Dashboard</h1>
        <p className="text-muted-foreground max-w-3xl">
          Use these forms to sync homepage/about/contact content and publish blog posts directly to Appwrite.
        </p>
      </section>

      <section className="grid xl:grid-cols-2 gap-5">
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
            <button type="submit" className="h-10 px-4 bg-foreground text-background text-sm">
              Sync site copy
            </button>
          </form>

          <div className="border border-border p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Suggested keys</p>
            <div className="flex flex-wrap gap-2">
              {suggestedSiteKeys.map((key) => (
                <span key={key} className="text-xs border border-border px-2 py-1 text-muted-foreground">
                  {key}
                </span>
              ))}
            </div>
          </div>
        </article>

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
            <button type="submit" className="h-10 px-4 bg-foreground text-background text-sm">
              Save post
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}