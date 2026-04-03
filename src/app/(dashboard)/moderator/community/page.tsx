import { MessageSquare, Pin, Lock } from "lucide-react";

import { applyModerationActionAction } from "@/actions/operations";
import { getModeratorCommunityData } from "@/lib/appwrite/dashboard-data";
import { lockThreadAction, unlockThreadAction } from "@/actions/community";
import { PageHeader, EmptyState } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";

export default async function ModeratorCommunityPage() {
  const data = await getModeratorCommunityData();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Moderator · Community"
        title="Community Moderation Tools"
        description="Manage threads, enforce community guidelines, and track moderation action usage."
      />

      {/* Action counts breakdown */}
      <section className="grid gap-3 sm:grid-cols-5">
        {data.actionCounts.map((action) => (
          <div
            key={action.label}
            className="flex items-center justify-between border border-border px-4 py-3"
          >
            <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
              {action.label}
            </span>
            <span className="text-lg font-medium tabular-nums">
              {action.value}
            </span>
          </div>
        ))}
      </section>

      {/* Thread list */}
      <section
        id="recent-threads"
        className="scroll-mt-24 flex flex-col gap-4"
      >
        <h2 className="text-lg font-medium">
          Recent Threads ({data.recentThreads.length})
        </h2>

        {data.recentThreads.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No community threads"
            description="Threads will appear here once students and mentors begin posting."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {data.recentThreads.map((thread) => (
              <article
                key={thread.id}
                id={`thread-${thread.id}`}
                className="scroll-mt-24 border border-border"
              >
                {/* Thread header */}
                <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium">{thread.title}</h3>
                      {thread.pinned && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Pin className="size-3" />
                          Pinned
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      by {thread.author} ·{" "}
                      {thread.replies} replies ·{" "}
                      <Badge variant="outline" className="text-[10px]">
                        {thread.category}
                      </Badge>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {thread.locked && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="size-3" />
                        Locked
                      </span>
                    )}
                    <form action={thread.locked ? unlockThreadAction : lockThreadAction}>
                      <input type="hidden" name="threadId" value={thread.id} />
                      <button
                        type="submit"
                        className="text-[10px] border border-border px-2 py-0.5 hover:bg-muted transition-colors"
                      >
                        {thread.locked ? "Unlock" : "Lock"}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Moderation form */}
                {thread.authorId ? (
                  <form
                    action={applyModerationActionAction}
                    className="bg-muted/20 px-5 py-4"
                  >
                    <input type="hidden" name="targetUserId" value={thread.authorId} />
                    <input type="hidden" name="targetUserName" value={thread.author} />
                    <input type="hidden" name="scope" value="platform" />
                    <input type="hidden" name="entityType" value="forum_thread" />
                    <input type="hidden" name="entityId" value={thread.id} />

                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="flex flex-col gap-1.5 text-sm">
                        <span className="text-muted-foreground">Action</span>
                        <select
                          name="action"
                          defaultValue={thread.pinned ? "unpin" : "pin"}
                          className="h-9 border border-border bg-background px-3 text-sm"
                        >
                          <option value="pin">Pin thread</option>
                          <option value="unpin">Unpin thread</option>
                          <option value="flag">Flag thread</option>
                          <option value="delete_post">Delete thread</option>
                          <option value="warn">Warn author</option>
                          <option value="timeout">Timeout author</option>
                          <option value="ban">Ban author</option>
                        </select>
                      </label>

                      <label className="flex flex-col gap-1.5 text-sm">
                        <span className="text-muted-foreground">
                          Duration (optional)
                        </span>
                        <input
                          name="duration"
                          placeholder="24h"
                          className="h-9 border border-border bg-background px-3 text-sm"
                        />
                      </label>

                      <label className="flex flex-col gap-1.5 text-sm md:col-span-3">
                        <span className="text-muted-foreground">Reason</span>
                        <textarea
                          name="reason"
                          required
                          minLength={3}
                          defaultValue={`Thread moderation: ${thread.title}`}
                          rows={2}
                          className="border border-border bg-background px-3 py-2 text-sm"
                        />
                      </label>

                      <div className="flex justify-end md:col-span-3">
                        <button
                          type="submit"
                          className="h-8 border border-border px-3 text-xs transition-colors hover:bg-muted"
                        >
                          Apply thread action
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="bg-muted/20 px-5 py-3 text-xs text-muted-foreground">
                    Author ID unavailable — user-level actions disabled for this thread.
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
