"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  NotebookPen,
  Trash2,
  ExternalLink,
  Link,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownEditor } from "../marketing/markdown-editor";
import { checkSlugUniquenessFormAction } from "@/server/actions/form-wrappers/marketing";

type EditBlogPostFormProps = {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    category: string;
    content: string;
    isPublished: boolean;
    publishedAt: string;
  };
  updateBlogPostFormAction: (formData: FormData) => Promise<void>;
  deleteBlogPostFormAction: (formData: FormData) => Promise<void>;
};

export function EditBlogPostForm({
  post,
  updateBlogPostFormAction,
  deleteBlogPostFormAction,
}: EditBlogPostFormProps) {
  const [slug, setSlug] = useState(post.slug);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [content, setContent] = useState(post.content);
  const slugManuallyEdited = useRef(false);
  const slugTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deleteFormRef = useRef<HTMLFormElement>(null);

  // Ensure content reaches the FormData — the MarkdownEditor textarea is
  // unmounted in preview mode, so fall back to the React state then.
  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const formData = new FormData(form);
      if (!formData.has("content")) {
        formData.set("content", content);
      }
      updateBlogPostFormAction(formData);
    },
    [content, updateBlogPostFormAction]
  );

  // Debounced slug uniqueness check
  const checkSlug = useCallback((slugToCheck: string) => {
    if (slugTimerRef.current) clearTimeout(slugTimerRef.current);
    if (!slugToCheck || slugToCheck === post.slug) {
      setSlugAvailable(null);
      setSlugChecking(false);
      return;
    }
    setSlugChecking(true);
    slugTimerRef.current = setTimeout(async () => {
      const fd = new FormData();
      fd.set("slug", slugToCheck);
      fd.set("excludeId", post.id);
      const result = await checkSlugUniquenessFormAction(fd);
      setSlugAvailable(result.success && result.data?.available === true);
      setSlugChecking(false);
    }, 500);
  }, [post.id, post.slug]);

  useEffect(() => {
    return () => {
      if (slugTimerRef.current) clearTimeout(slugTimerRef.current);
    };
  }, []);

  return (
    <>
    <form
      action={updateBlogPostFormAction}
      onSubmit={handleSubmit}
      className="border-t border-border/40 bg-surface-hover p-5 space-y-4"
    >
      <input type="hidden" name="postId" value={post.id} />

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1.5">
          <Label htmlFor={`post-title-${post.id}`}>Title</Label>
          <Input
            id={`post-title-${post.id}`}
            name="title"
            defaultValue={post.title}
            placeholder="Title"
            onChange={(e) => {
              const newTitle = e.target.value;
              if (!slugManuallyEdited.current) {
                const newSlug = newTitle
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-+|-+$/g, "");
                setSlug(newSlug);
                setSlugAvailable(null);
                checkSlug(newSlug);
              }
            }}
          />
        </label>

        <label className="space-y-1.5">
          <Label htmlFor={`post-slug-${post.id}`}>Slug</Label>
          <Input
            id={`post-slug-${post.id}`}
            name="slug"
            value={slug}
            placeholder="slug"
            onChange={(e) => {
              slugManuallyEdited.current = true;
              const val = e.target.value;
              setSlug(val);
              setSlugAvailable(null);
              checkSlug(val);
            }}
          />
          <div className="flex items-center gap-2 min-h-[1.25rem]">
            {slug && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                <Link className="size-3" />
                /blog/{slug}
              </span>
            )}
            {slugChecking && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/50" />
                Checking…
              </span>
            )}
            {!slugChecking && slugAvailable === false && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                <AlertTriangle className="size-3" />
                Slug already taken
              </span>
            )}
            {!slugChecking && slugAvailable === true && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                Available
              </span>
            )}
          </div>
        </label>

        <label className="space-y-1.5">
          <Label htmlFor={`post-category-${post.id}`}>Category</Label>
          <Input
            id={`post-category-${post.id}`}
            name="category"
            defaultValue={post.category}
            placeholder="Category"
          />
        </label>
      </div>

      <label className="space-y-1.5">
        <Label htmlFor={`post-excerpt-${post.id}`}>Excerpt</Label>
        <textarea
          id={`post-excerpt-${post.id}`}
          name="excerpt"
          defaultValue={post.excerpt}
          className="input-field--textarea min-h-20 w-full"
        />
      </label>

      <div>
        <MarkdownEditor
          id={`post-content-${post.id}`}
          name="content"
          defaultValue={post.content}
          label="Content"
          minHeight="min-h-28"
          onChange={setContent}
        />
      </div>

      <label className="space-y-1.5">
        <Label htmlFor={`post-state-${post.id}`}>Publish state</Label>
        <select
          id={`post-state-${post.id}`}
          name="isPublished"
          defaultValue={post.isPublished ? "true" : "false"}
          className="input-field--select w-full"
        >
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </select>
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button type="submit" size="sm">
            <NotebookPen className="size-3.5" />
            Save Changes
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={deleting}
            onClick={() => {
              if (confirm("Delete this post? This cannot be undone.")) {
                setDeleting(true);
                deleteFormRef.current?.requestSubmit();
              }
            }}
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="xs" variant="outline">
            <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer">
              View
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
          {!post.isPublished && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Draft
            </p>
          )}
        </div>
      </div>
    </form>

    {/* Delete form — must be a sibling, not nested, to avoid invalid HTML */}
    <form
      ref={deleteFormRef}
      action={deleteBlogPostFormAction}
      className="hidden"
      aria-hidden="true"
    >
      <input type="hidden" name="postId" value={post.id} />
    </form>
    </>
  );
}
