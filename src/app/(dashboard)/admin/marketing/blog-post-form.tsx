"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  NotebookPen,
  Megaphone,
  RotateCcw,
  Save,
  Link,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAutoSave } from "./use-auto-save";
import { MarkdownEditor } from "./markdown-editor";
import { checkSlugUniquenessFormAction } from "@/actions/form-wrappers/marketing";

type BlogPostFormProps = {
  createBlogPostFormAction: (formData: FormData) => Promise<void>;
};

export function BlogPostForm({ createBlogPostFormAction }: BlogPostFormProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isPublished, setIsPublished] = useState("true");
  const [publishedAt, setPublishedAt] = useState("");
  const [readMinutes, setReadMinutes] = useState("5");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [restored, setRestored] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const slugManuallyEdited = useRef(false);
  const slugTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const autoSave = useAutoSave({
    key: "create-blog-post",
    fields: { title, slug, category, authorName, excerpt, content, isPublished, publishedAt, readMinutes },
    delay: 2000,
  });

  // Debounced slug uniqueness check
  const checkSlug = useCallback((slugToCheck: string) => {
    if (slugTimerRef.current) clearTimeout(slugTimerRef.current);
    if (!slugToCheck) {
      setSlugAvailable(null);
      setSlugChecking(false);
      return;
    }
    setSlugChecking(true);
    slugTimerRef.current = setTimeout(async () => {
      const fd = new FormData();
      fd.set("slug", slugToCheck);
      const result = await checkSlugUniquenessFormAction(fd);
      setSlugAvailable(result.success && result.data?.available === true);
      setSlugChecking(false);
    }, 500);
  }, []);

  useEffect(() => {
    return () => {
      if (slugTimerRef.current) clearTimeout(slugTimerRef.current);
    };
  }, []);

  // Restore draft on mount
  const handleRestore = useCallback(() => {
    const draft = autoSave.restore();
    if (draft) {
      setTitle(draft.title ?? "");
      setSlug(draft.slug ?? "");
      // If the draft has a non-empty slug, assume it was intentionally set
      if (draft.slug) slugManuallyEdited.current = true;
      setCategory(draft.category ?? "");
      setAuthorName(draft.authorName ?? "");
      setExcerpt(draft.excerpt ?? "");
      setContent(draft.content ?? "");
      setIsPublished(draft.isPublished ?? "true");
      setPublishedAt(draft.publishedAt ?? "");
      setReadMinutes(draft.readMinutes ?? "5");
      setRestored(true);

      // Clear the draft after restore
      setTimeout(() => setRestored(false), 3000);
    }
  }, [autoSave]);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const formData = new FormData(form);

      // Ensure textarea values are in the form (since content is managed by MarkdownEditor)
      const contentField = form.querySelector<HTMLTextAreaElement>(`#blog-content`);
      if (contentField && !formData.has("content")) {
        formData.set("content", contentField.value);
      }

      createBlogPostFormAction(formData);
      autoSave.clear();
    },
    [createBlogPostFormAction, autoSave]
  );

  const hasDraft = autoSave.hasDraft();

  return (
    <form action={createBlogPostFormAction} className="flex flex-col gap-4 p-5" onSubmit={handleSubmit}>
      {/* Draft restore banner */}
      {hasDraft && !restored && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-accent/40 bg-accent/5 px-4 py-3">
          <div>
            <p className="text-xs font-bold text-foreground">Unpublished draft found</p>
            <p className="text-[10px] text-muted-foreground">
              Saved {autoSave.lastSaved ? autoSave.lastSaved.toLocaleTimeString() : "earlier"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="xs" variant="outline" onClick={handleRestore}>
              <RotateCcw className="size-3" />
              Restore
            </Button>
            <Button type="button" size="xs" variant="ghost" onClick={autoSave.clear}>
              Discard
            </Button>
          </div>
        </div>
      )}

      {/* Restored indicator */}
      {restored && (
        <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/5 px-4 py-3">
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            ✦ Draft restored — review and save when ready
          </p>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1.5 md:col-span-2">
          <Label htmlFor="blog-title">Title</Label>
          <Input
            id="blog-title"
            name="title"
            placeholder="Post title"
            required
            minLength={6}
            value={title}
            onChange={(e) => {
              const newTitle = e.target.value;
              setTitle(newTitle);
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
          <Label htmlFor="blog-slug">Slug</Label>
          <Input
            id="blog-slug"
            name="slug"
            placeholder="optional-custom-slug"
            value={slug}
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
          <Label htmlFor="blog-category">Category</Label>
          <Input
            id="blog-category"
            name="category"
            placeholder="Guides"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </label>

        <label className="space-y-1.5">
          <Label htmlFor="blog-author">Author name</Label>
          <Input
            id="blog-author"
            name="authorName"
            placeholder="Team Amar"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
          />
        </label>

        <label className="space-y-1.5">
          <Label htmlFor="blog-status">Publish state</Label>
          <select
            id="blog-status"
            name="isPublished"
            className="input-field--select w-full"
            value={isPublished}
            onChange={(e) => setIsPublished(e.target.value)}
          >
            <option value="true">Published</option>
            <option value="false">Draft</option>
          </select>
        </label>

        <label className="space-y-1.5">
          <Label htmlFor="blog-published-at">Publish at</Label>
          <Input
            id="blog-published-at"
            type="datetime-local"
            name="publishedAt"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
          />
        </label>

        <label className="space-y-1.5">
          <Label htmlFor="blog-read-minutes">Read time (minutes)</Label>
          <Input
            id="blog-read-minutes"
            type="number"
            min={1}
            name="readMinutes"
            value={readMinutes}
            onChange={(e) => setReadMinutes(e.target.value)}
            defaultValue={5}
          />
        </label>
      </div>

      <label className="space-y-1.5">
        <Label htmlFor="blog-excerpt">Excerpt</Label>
        <textarea
          id="blog-excerpt"
          name="excerpt"
          placeholder="Short summary shown in cards and previews"
          required
          minLength={12}
          className="input-field--textarea min-h-24 w-full"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
        />
      </label>

      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
        {autoSave.saved && (
          <span className="inline-flex items-center gap-1">
            <Save className="size-3" />
            Auto-saved {autoSave.lastSaved?.toLocaleTimeString()}
          </span>
        )}
      </div>

      <MarkdownEditor
        id="blog-content"
        name="content"
        placeholder="Write full post content here using markdown..."
        label="Content"
        minHeight="min-h-52"
        required
        minLength={24}
        onChange={(value) => setContent(value)}
      />

      <Button type="submit" className="w-full sm:w-auto">
        <Megaphone className="size-4" />
        Save Blog Post
      </Button>
    </form>
  );
}
