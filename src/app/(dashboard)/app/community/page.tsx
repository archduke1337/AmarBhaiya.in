import { MessageSquare, Pin, ExternalLink } from "lucide-react";

import { createForumThreadAction } from "@/actions/dashboard";
import { requireAuth } from "@/lib/appwrite/auth";
import {
  getCommunityCategoriesData,
  getCommunityThreadsData,
} from "@/lib/appwrite/dashboard-data";
import { PageHeader, EmptyState } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";

export default async function CommunityPage() {
  await requireAuth();
  const [threads, categories] = await Promise.all([
    getCommunityThreadsData(),
    getCommunityCategoriesData(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Community"
        title="Learn with the cohort, not alone."
        description="Share insights, ask questions, and connect with fellow learners and mentors."
      />

      {/* Create thread form */}
      <section className="border border-border">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-medium">Start a Discussion</h2>
        </div>

        {categories.length === 0 ? (
          <div className="px-5 py-6 text-sm text-muted-foreground">
            No forum categories have been created yet. Ask an admin to set up categories.
          </div>
        ) : (
          <form action={createForumThreadAction} className="flex flex-col gap-4 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-muted-foreground">Category</span>
                <select
                  name="forumCatId"
                  className="h-10 border border-border bg-background px-3 text-sm"
                  required
                  defaultValue={categories[0]?.id ?? ""}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-muted-foreground">Thread Title</span>
                <input
                  type="text"
                  name="title"
                  placeholder="Your question or topic"
                  className="h-10 border border-border bg-background px-3 text-sm"
                  required
                  minLength={6}
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Your Message</span>
              <textarea
                name="body"
                placeholder="Write your question, insight, or discussion topic..."
                className="min-h-[100px] border border-border bg-background px-3 py-2 text-sm"
                required
                minLength={12}
              />
            </label>

            <div className="flex justify-end">
              <button
                className="h-9 bg-foreground px-4 text-sm text-background transition-opacity hover:opacity-90"
                type="submit"
              >
                Post thread
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Thread list */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">
          Discussions ({threads.length})
        </h2>

        {threads.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No discussions yet"
            description="Be the first to start a conversation. Post a thread above to get things going."
          />
        ) : (
          threads.map((thread) => (
            <article
              key={thread.id}
              className="group border border-border p-5 transition-colors hover:border-foreground/20"
            >
              <div className="flex items-center justify-between gap-4 mb-2">
                <Badge variant="outline">{thread.category}</Badge>
                {thread.pinned && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Pin className="size-3" />
                    Pinned
                  </span>
                )}
              </div>

              <h3 className="text-lg font-medium leading-tight">
                {thread.title}
              </h3>

              <div className="mt-3 flex items-center gap-5 text-sm text-muted-foreground">
                <span>by {thread.author}</span>
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="size-4" />
                  {thread.replies} replies
                </span>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
