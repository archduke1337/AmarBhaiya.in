import { MessageSquare, Pin } from "lucide-react";

import { requireAuth } from "@/lib/appwrite/auth";

const THREADS = [
  {
    id: "thread-1",
    title: "How are you planning your weekly revision blocks?",
    author: "Mentor Team",
    replies: 34,
    pinned: true,
    category: "Study Systems",
  },
  {
    id: "thread-2",
    title: "Share your first coding project this week",
    author: "Coding Club",
    replies: 21,
    pinned: false,
    category: "Projects",
  },
  {
    id: "thread-3",
    title: "Fitness routine accountability check-in",
    author: "Fitness Circle",
    replies: 17,
    pinned: false,
    category: "Health",
  },
];

export default async function CommunityPage() {
  await requireAuth();

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Community
        </p>
        <h1 className="text-3xl md:text-4xl">Learn with the cohort, not alone.</h1>
        <p className="text-muted-foreground max-w-3xl leading-relaxed">
          This is the Phase 5 foundation for global discussions. Full
          moderation and forum CRUD will extend in Phase 10.
        </p>
      </section>

      <section className="border border-border p-5 md:p-6 space-y-4">
        <h2 className="text-xl">Start a discussion</h2>
        <form className="space-y-3">
          <input
            type="text"
            placeholder="Thread title"
            className="h-11 w-full border border-border bg-background px-3"
          />
          <textarea
            placeholder="Write your question or insight"
            className="w-full min-h-28 border border-border bg-background px-3 py-2"
          />
          <button className="h-9 px-4 bg-foreground text-background text-sm" type="submit">
            Post thread
          </button>
        </form>
      </section>

      <section className="space-y-3">
        {THREADS.map((thread) => (
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
