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
      <form onSubmit={handlePostComment} className="space-y-3">
        <label htmlFor="comment-input" className="sr-only">
          Post a comment
        </label>
        <textarea
          id="comment-input"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Ask a doubt or share an insight from this lesson"
          aria-label="Comment input"
          className="w-full min-h-24 border border-border bg-background px-3 py-2"
        />
        <button
          type="submit"
          aria-label="Post comment"
          className="h-9 px-4 bg-foreground text-background text-sm"
        >
          Post comment
        </button>
      </form>

      <div className="space-y-3">
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground">No comments yet for this lesson.</p>
        )}

        {comments.map((comment) => (
          <article key={comment.id} className="border border-border p-3">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-sm font-medium">{comment.author}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(comment.postedAt).toLocaleString("en-IN")}
              </p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{comment.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
