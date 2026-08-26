"use client";

import { useState } from "react";

type Comment = {
  id: string;
  author: string;
  text: string;
  postedAt: string;
};

type CommentSectionProps = {
  initialComments?: Comment[];
};

export function CommentSection({ initialComments = [] }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [text, setText] = useState("");

  function createTempCommentId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function handlePostComment(event: React.FormEvent) {
    event.preventDefault();

    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    setComments((prev) => [
      {
        id: createTempCommentId(),
        author: "You",
        text: trimmed,
        postedAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setText("");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handlePostComment} className="space-y-3 rounded-2xl border border-border/40 bg-surface p-4 shadow-[var(--surface-shadow)]">
        <label htmlFor="comment-input" className="sr-only">
          Post a comment
        </label>
        <textarea
          id="comment-input"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Ask a doubt or share an insight from this lesson"
          aria-label="Comment input"
          className="input-field--textarea w-full min-h-24"
        />
        <button
          type="submit"
          aria-label="Post comment"
          className="inline-flex min-h-11 w-fit items-center justify-center rounded-[calc(var(--radius)+2px)] bg-foreground px-5 text-sm font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Post comment
        </button>
      </form>

      <div className="space-y-3">
        {comments.length === 0 && (
          <p className="text-sm font-medium text-muted-foreground">No comments yet for this lesson.</p>
        )}

        {comments.map((comment) => (
          <article key={comment.id} className="rounded-2xl border border-border/40 bg-surface p-4 shadow-[var(--surface-shadow)]">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-bold">{comment.author}</p>
              <p className="text-xs font-medium text-muted-foreground">
                {new Date(comment.postedAt).toLocaleString("en-IN")}
              </p>
            </div>
            <p className="text-sm leading-relaxed text-foreground/75">{comment.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
