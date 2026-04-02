import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pin, Lock, MessageSquare } from "lucide-react";

import { requireAuth } from "@/lib/appwrite/auth";
import {
  createForumReplyAction,
  deleteForumReplyAction,
  getForumThreadDetail,
  getForumThreadReplies,
} from "@/actions/community";
import { getUserRole } from "@/lib/appwrite/auth-utils";
import { formatRelativeTime } from "@/lib/utils/format";
import { EmptyState } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";

type PageProps = {
  params: Promise<{ threadId: string }>;
};

export default async function ThreadDetailPage({ params }: PageProps) {
  const user = await requireAuth();
  const role = getUserRole(user);
  const isMod = role === "admin" || role === "moderator";
  const { threadId } = await params;

  const [thread, replies] = await Promise.all([
    getForumThreadDetail(threadId),
    getForumThreadReplies(threadId),
  ]);

  if (!thread) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Back link */}
      <Link
        href="/app/community"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="size-4" />
        Back to Community
      </Link>

      {/* Thread header */}
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{thread.categoryName}</Badge>
          {thread.pinned && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Pin className="size-3" />
              Pinned
            </span>
          )}
          {thread.locked && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="size-3" />
              Locked
            </span>
          )}
        </div>

        <h1 className="text-2xl font-medium leading-tight">{thread.title}</h1>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            by{" "}
            <span className="text-foreground font-medium">
              {thread.author}
            </span>
          </span>
          {thread.authorRole !== "student" && (
            <Badge variant="outline" className="text-[10px]">
              {thread.authorRole}
            </Badge>
          )}
          {thread.createdAt && (
            <span>{formatRelativeTime(thread.createdAt)}</span>
          )}
        </div>
      </header>

      {/* Thread body */}
      <article className="border border-border p-5">
        <div className="prose prose-sm max-w-none text-foreground">
          <p className="whitespace-pre-wrap">{thread.body}</p>
        </div>
      </article>

      {/* Replies section */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">
          Replies ({replies.length})
        </h2>

        {replies.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No replies yet"
            description={
              thread.locked
                ? "This thread is locked. No new replies can be added."
                : "Be the first to reply to this discussion."
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {replies.map((reply) => (
              <article
                key={reply.id}
                className="border border-border p-4"
              >
                <div className="mb-2 flex items-center gap-3 text-sm">
                  <span className="font-medium">{reply.userName}</span>
                  {reply.userRole !== "student" && (
                    <Badge variant="outline" className="text-[10px]">
                      {reply.userRole}
                    </Badge>
                  )}
                  {reply.createdAt && (
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(reply.createdAt)}
                    </span>
                  )}
                </div>

                {reply.isDeleted ? (
                  <p className="text-sm italic text-muted-foreground">
                    [This reply has been removed by a moderator]
                  </p>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap text-sm">
                      {reply.body}
                    </p>
                    {isMod && (
                      <form action={deleteForumReplyAction} className="mt-2">
                        <input type="hidden" name="replyId" value={reply.id} />
                        <input type="hidden" name="threadId" value={thread.id} />
                        <button
                          type="submit"
                          className="text-[10px] text-destructive hover:underline"
                        >
                          Remove reply
                        </button>
                      </form>
                    )}
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Reply form */}
      {thread.locked ? (
        <div className="border border-border bg-muted/30 px-5 py-4 text-sm text-muted-foreground">
          <Lock className="mb-1 inline-block size-4" /> This thread is locked.
          New replies are disabled.
        </div>
      ) : (
        <section className="border border-border">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-medium">Write a Reply</h2>
          </div>
          <form
            action={createForumReplyAction}
            className="flex flex-col gap-4 p-5"
          >
            <input type="hidden" name="threadId" value={thread.id} />

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Your reply</span>
              <textarea
                name="body"
                required
                minLength={3}
                rows={4}
                placeholder="Share your thoughts, answer the question, or join the discussion..."
                className="border border-border bg-background px-3 py-2 text-sm"
              />
            </label>

            <div className="flex justify-end">
              <button
                type="submit"
                className="h-9 bg-foreground px-4 text-sm text-background transition-opacity hover:opacity-90"
              >
                Post Reply
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
