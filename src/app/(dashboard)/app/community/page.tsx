import { MessageSquare, Pin } from "lucide-react";

import { createForumThreadAction } from "@/actions/dashboard";
import { requireAuth } from "@/lib/appwrite/auth";
import {
  getCommunityCategoriesData,
  getCommunityThreadsData,
} from "@/lib/appwrite/dashboard-data";

export default async function CommunityPage() {
  await requireAuth();
  const [threads, categories] = await Promise.all([
    getCommunityThreadsData(),
    getCommunityCategoriesData(),
  ]);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Community
        </p>
        <h1 className="text-3xl md:text-4xl">Learn with the cohort, not alone.</h1>
        <p className="text-muted-foreground max-w-3xl leading-relaxed">
          Live forum feed from your Appwrite community tables. Pinned threads
          stay at the top so cohort-wide announcements remain visible.
        </p>
      </section>

      <section className="border border-border p-5 md:p-6 space-y-4">
        <h2 className="text-xl">Start a discussion</h2>

        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Create at least one forum category to enable posting.
          </p>
        ) : (
          <form action={createForumThreadAction} className="space-y-3">
            <select
              name="forumCatId"
              className="h-11 w-full border border-border bg-background px-3"
              required
              defaultValue={categories[0]?.id ?? ""}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              name="title"
              placeholder="Thread title"
              className="h-11 w-full border border-border bg-background px-3"
              required
              minLength={6}
            />
            <textarea
              name="body"
              placeholder="Write your question or insight"
              className="w-full min-h-28 border border-border bg-background px-3 py-2"
              required
              minLength={12}
            />
            <button className="h-9 px-4 bg-foreground text-background text-sm" type="submit">
              Post thread
            </button>
          </form>
        )}
      </section>

      <section className="space-y-3">
        {threads.length === 0 ? (
          <article className="border border-border p-5 text-sm text-muted-foreground">
            No community threads yet. Once students and mentors begin posting,
            they will appear here automatically.
          </article>
        ) : null}

        {threads.map((thread) => (
          <article key={thread.id} className="border border-border p-5">
            <div className="flex items-center justify-between gap-4 mb-3">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {thread.category}
              </p>
              {thread.pinned && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Pin className="size-3" />
                  Pinned
                </span>
              )}
            </div>
            <h3 className="text-xl leading-tight">{thread.title}</h3>
            <div className="mt-3 flex items-center gap-5 text-sm text-muted-foreground">
              <span>by {thread.author}</span>
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="size-4" />
                {thread.replies} replies
              </span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
