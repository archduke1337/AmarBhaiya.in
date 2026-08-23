"use client";

import { useState, useCallback, useRef } from "react";
import { Eye, EyeOff, Edit3, Code2, Link2, List, ListOrdered, Heading1, Heading2, Bold, Italic, Image as ImageIcon, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { MarkdownRenderer } from "@/components/marketing/markdown-renderer";
import { uploadBlogImageAction } from "@/server/actions/upload";

type MarkdownEditorProps = {
  id: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  label?: string;
  minHeight?: string;
  required?: boolean;
  minLength?: number;
  onChange?: (value: string) => void;
};

type UploadState = {
  uploading: boolean;
  progress: number;
  error: string | null;
};

export function MarkdownEditor({
  id,
  name,
  defaultValue = "",
  placeholder = "Write markdown content here...",
  label,
  minHeight = "min-h-52",
  required,
  minLength,
  onChange,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [content, setContent] = useState(defaultValue);
  const [upload, setUpload] = useState<UploadState>({ uploading: false, progress: 0, error: null });
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleChange = useCallback((value: string) => {
    setContent(value);
    onChange?.(value);
  }, [onChange]);

  const insertAtCursor = useCallback((before: string, after = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const newText =
      content.substring(0, start) +
      before +
      selected +
      after +
      content.substring(end);

    setContent(newText);
    textarea.value = newText;
    onChange?.(newText);

    requestAnimationFrame(() => {
      textarea.focus();
      if (selected) {
        textarea.setSelectionRange(
          start + before.length,
          start + before.length + selected.length
        );
      } else {
        textarea.setSelectionRange(
          start + before.length,
          start + before.length
        );
      }
    });
  }, [content, onChange]);

  const insertMarkdown = useCallback((before: string, after = "") => {
    insertAtCursor(before, after);
  }, [insertAtCursor]);

  // ── Image Upload ─────────────────────────────────────────────────────────

  const handleImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are supported.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Images must be 10 MB or smaller.");
      return;
    }

    setUpload({ uploading: true, progress: 0, error: null });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadBlogImageAction(formData);

      if (!result.success) {
        setUpload({ uploading: false, progress: 0, error: result.error });
        toast.error(result.error || "Failed to upload image.");
        return;
      }

      const url = result.data?.url;
      if (!url) {
        setUpload({ uploading: false, progress: 0, error: "No URL returned from upload." });
        toast.error("Upload failed: no URL returned.");
        return;
      }
      const markdown = `![${file.name}](${url})`;
      insertAtCursor(markdown);
      setUpload({ uploading: false, progress: 100, error: null });
      toast.success("Image uploaded and inserted.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setUpload({ uploading: false, progress: 0, error: message });
      toast.error(message);
    }
  }, [insertAtCursor]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
    // Reset input so same file can be selected again
    e.target.value = "";
  }, [handleImageFile]);

  // ── Drag & Drop ──────────────────────────────────────────────────────────

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false if leaving the drop zone entirely
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageFile(files[0]);
    }
  }, [handleImageFile]);

  // ── Paste Handler ────────────────────────────────────────────────────────

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) handleImageFile(file);
        return;
      }
    }
    // If no image, let default paste happen
  }, [handleImageFile]);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-foreground">
          {label}
        </label>
      )}

      <div
        ref={dropZoneRef}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative overflow-hidden rounded-xl border bg-surface transition-all ${
          isDragging
            ? "border-accent border-dashed shadow-md"
            : "border-border/40"
        }`}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-surface/90 backdrop-blur-sm">
            <UploadCloud className="size-8 text-accent" />
            <p className="text-sm font-bold text-foreground">Drop image to upload</p>
            <p className="text-[10px] text-muted-foreground">PNG, JPG, WEBP, GIF up to 10MB</p>
          </div>
        )}

        {/* Upload progress bar */}
        {upload.uploading && (
          <div className="absolute top-0 left-0 right-0 z-10 h-1 bg-muted">
            <div className="h-full bg-accent transition-all animate-pulse" style={{ width: "60%" }} />
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Mode tabs */}
        <div className="flex items-center justify-between border-b border-border/40 bg-surface-hover">
          <div className="flex">
            <button
              type="button"
              onClick={() => setMode("write")}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors ${
                mode === "write"
                  ? "bg-surface text-foreground border-b-2 border-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Edit3 className="size-3.5" />
              Write
            </button>
            <button
              type="button"
              onClick={() => setMode("preview")}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors ${
                mode === "preview"
                  ? "bg-surface text-foreground border-b-2 border-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {mode === "preview" ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
              Preview
            </button>
          </div>

          {/* Toolbar (only in write mode) */}
          {mode === "write" && (
            <div className="flex items-center gap-0.5 pr-2">
              <button type="button" onClick={() => insertMarkdown("**", "**")} title="Bold" className="rounded-md p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors">
                <Bold className="size-3.5" />
              </button>
              <button type="button" onClick={() => insertMarkdown("*", "*")} title="Italic" className="rounded-md p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors">
                <Italic className="size-3.5" />
              </button>
              <button type="button" onClick={() => insertMarkdown("# ")} title="Heading 1" className="rounded-md p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors">
                <Heading1 className="size-3.5" />
              </button>
              <button type="button" onClick={() => insertMarkdown("## ")} title="Heading 2" className="rounded-md p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors">
                <Heading2 className="size-3.5" />
              </button>
              <button type="button" onClick={() => insertMarkdown("- ")} title="Unordered list" className="rounded-md p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors">
                <List className="size-3.5" />
              </button>
              <button type="button" onClick={() => insertMarkdown("1. ")} title="Ordered list" className="rounded-md p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors">
                <ListOrdered className="size-3.5" />
              </button>
              <button type="button" onClick={() => insertMarkdown("[", "](url)")} title="Link" className="rounded-md p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors">
                <Link2 className="size-3.5" />
              </button>
              <button type="button" onClick={() => insertMarkdown("```\n", "\n```")} title="Code block" className="rounded-md p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors">
                <Code2 className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={openFilePicker}
                title="Upload image"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
              >
                <ImageIcon className="size-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Editor / Preview */}
        {mode === "write" ? (
          <textarea
            ref={textareaRef}
            id={id}
            name={name}
            defaultValue={defaultValue}
            placeholder={placeholder}
            onChange={(e) => handleChange(e.target.value)}
            onPaste={handlePaste}
            required={required}
            minLength={minLength}
            className={`w-full ${minHeight} resize-y border-0 bg-transparent p-4 text-sm leading-7 text-foreground outline-none placeholder:text-muted-foreground/50 focus-visible:ring-[3px] focus-visible:ring-ring/40`}
            spellCheck
          />
        ) : (
          <div className={`${minHeight} overflow-auto p-4`}>
            {content.trim() ? (
              <MarkdownRenderer content={content} />
            ) : (
              <p className="text-sm text-muted-foreground italic">Nothing to preview — start writing!</p>
            )}
          </div>
        )}
      </div>

      {upload.error && (
        <p className="text-[10px] font-semibold text-destructive flex items-center gap-1">
          <X className="size-3" />
          Upload failed: {upload.error}
        </p>
      )}

      {mode === "write" && (
        <p className="text-[10px] font-semibold text-muted-foreground">
          Supports markdown: **bold** *italic* [links](url) `code` ```code blocks``` # headings - lists. Drag & drop or paste images to upload.
        </p>
      )}
    </div>
  );
}
