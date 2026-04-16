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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RetroPanel } from "@/components/marketing/retro-panel";
import { Textarea } from "@/components/ui/textarea";

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
    <div className="flex max-w-5xl flex-col gap-6">
      {/* Back link */}
      <Link
        href="/app/community"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="size-4" />
        Back to Community
      </Link>

      {/* Thread header */}
      <RetroPanel tone="card" size="lg" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{thread.categoryName}</Badge>
          {thread.pinned && (
            <Badge variant="ghost">
              <Pin className="size-3" />
              Pinned
            </Badge>
          )}
          {thread.locked && (
            <Badge variant="outline">
              <Lock className="size-3" />
              Locked
            </Badge>
          )}
        </div>

        <h1 className="font-heading text-3xl font-black leading-tight tracking-[-0.05em] md:text-5xl">
          {thread.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-muted-foreground">
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
      </RetroPanel>

      {/* Thread body */}
      <RetroPanel tone="muted">
        <p className="whitespace-pre-wrap text-sm font-medium leading-8 text-foreground/85">
          {thread.body}
        </p>
      </RetroPanel>

      {/* Replies section */}
      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-lg font-black tracking-[-0.03em] text-muted-foreground">
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
              <RetroPanel
                key={reply.id}
                tone={reply.userRole !== "student" ? "secondary" : "card"}
                className="space-y-3"
              >
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-semibold">{reply.userName}</span>
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
                    This reply has been removed by a moderator.
                  </p>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap text-sm font-medium leading-7 text-foreground/85">
                      {reply.body}
                    </p>
                    {isMod && (
                      <form action={deleteForumReplyAction} className="mt-2">
                        <input type="hidden" name="replyId" value={reply.id} />
                        <input type="hidden" name="threadId" value={thread.id} />
                        <Button
                          type="submit"
                          variant="destructive"
                          size="xs"
                        >
                          Remove reply
                        </Button>
                      </form>
                    )}
                  </>
                )}
              </RetroPanel>
            ))}
          </div>
        )}
      </section>

      {/* Reply form */}
      {thread.locked ? (
        <RetroPanel tone="muted" className="text-sm font-medium text-muted-foreground">
          <Lock className="mb-1 inline-block size-4" /> This thread is locked.
          New replies are disabled.
        </RetroPanel>
      ) : (
        <RetroPanel tone="card" className="space-y-0 p-0">
          <div className="border-b-2 border-border px-5 py-4">
            <h2 className="font-heading text-lg font-black tracking-[-0.03em]">
              Write a reply
            </h2>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Help clearly. Short answer bhi chalega, bas useful ho.
            </p>
          </div>
          <form
            action={createForumReplyAction}
            className="flex flex-col gap-4 p-5"
          >
            <input type="hidden" name="threadId" value={thread.id} />

            <div className="space-y-2">
              <Label htmlFor="reply-body">Your reply</Label>
              <Textarea
                id="reply-body"
                name="body"
                required
                minLength={3}
                rows={4}
                placeholder="Answer, suggestion, ya follow-up doubt likho..."
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" variant="secondary">
                Post reply
              </Button>
            </div>
          </form>
        </RetroPanel>
      )}
    </div>
  );
}
