"use client";

import { useState, useCallback, useRef } from "react";
import { Eye, EyeOff, Edit3, Code2, Link2, List, ListOrdered, Heading1, Heading2, Bold, Italic } from "lucide-react";
import { MarkdownRenderer } from "./markdown-renderer";

type MarkdownEditorProps = {
  id: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  label?: string;
  minHeight?: string;
  required?: boolean;
  minLength?: number;
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
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [content, setContent] = useState(defaultValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback((value: string) => {
    setContent(value);
  }, []);

  const insertMarkdown = useCallback((before: string, after = "") => {
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

    // Re-focus and set selection
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
  }, [content]);

  const toolbarButtons = [
    { icon: Bold, label: "Bold", action: () => insertMarkdown("**", "**") },
    { icon: Italic, label: "Italic", action: () => insertMarkdown("*", "*") },
    { icon: Heading1, label: "Heading 1", action: () => insertMarkdown("# ") },
    { icon: Heading2, label: "Heading 2", action: () => insertMarkdown("## ") },
    { icon: List, label: "Unordered list", action: () => insertMarkdown("- ") },
    { icon: ListOrdered, label: "Ordered list", action: () => insertMarkdown("1. ") },
    { icon: Link2, label: "Link", action: () => insertMarkdown("[", "](url)") },
    { icon: Code2, label: "Code block", action: () => insertMarkdown("```\n", "\n```") },
  ];

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-foreground">
          {label}
        </label>
      )}

      <div className="overflow-hidden rounded-xl border border-border/40 bg-surface">
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
              {toolbarButtons.map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  onClick={btn.action}
                  title={btn.label}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
                >
                  <btn.icon className="size-3.5" />
                </button>
              ))}
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
            required={required}
            minLength={minLength}
            className={`w-full ${minHeight} resize-y border-0 bg-transparent p-4 text-sm leading-7 text-foreground outline-none placeholder:text-muted-foreground/50`}
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

      {mode === "write" && (
        <p className="text-[10px] font-semibold text-muted-foreground">
          Supports markdown: **bold** *italic* [links](url) `code` ```code blocks``` # headings - lists
        </p>
      )}
    </div>
  );
}
