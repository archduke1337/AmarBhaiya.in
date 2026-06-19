"use client";

import { useState, useCallback, useRef } from "react";
import { CheckCircle2, AlertCircle, Eye, EyeOff, Terminal } from "lucide-react";

type JsonEditorProps = {
  id: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
  label?: string;
};

export function JsonEditor({ id, name, defaultValue, placeholder, label }: JsonEditorProps) {
  const [raw, setRaw] = useState(defaultValue);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const validate = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError(null);
      return;
    }
    try {
      JSON.parse(trimmed);
      setError(null);
    } catch (e) {
      setError(e instanceof SyntaxError ? e.message : "Invalid JSON");
    }
  }, []);

  const handleChange = useCallback((value: string) => {
    setRaw(value);
    validate(value);
  }, [validate]);

  const formatJson = useCallback(() => {
    try {
      const parsed = JSON.parse(raw);
      const formatted = JSON.stringify(parsed, null, 2);
      setRaw(formatted);
      setError(null);
      // Update the textarea value
      if (textareaRef.current) {
        textareaRef.current.value = formatted;
      }
    } catch {
      // Don't format if invalid
    }
  }, [raw]);

  let previewOutput: string | null = null;
  if (showPreview) {
    try {
      const parsed = JSON.parse(raw);
      previewOutput = JSON.stringify(parsed, null, 2);
    } catch {
      previewOutput = raw;
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-foreground">
          {label}
        </label>
      )}

      <div className="overflow-hidden rounded-xl border border-border/40 bg-surface">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 border-b border-border/40 bg-surface-hover px-3 py-2">
          <div className="flex items-center gap-2">
            <Terminal className="size-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold text-muted-foreground">JSON</span>
            {error ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-destructive">
                <AlertCircle className="size-3" />
                {error}
              </span>
            ) : raw.trim() ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                <CheckCircle2 className="size-3" />
                Valid
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={formatJson}
              className="rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              title="Format JSON"
            >
              Format
            </button>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              title={showPreview ? "Hide preview" : "Show preview"}
            >
              {showPreview ? (
                <EyeOff className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Editor / Preview */}
        {showPreview && previewOutput ? (
          <div className="min-h-40 overflow-auto p-3 font-mono text-xs leading-6 text-foreground/80 whitespace-pre-wrap">
            {previewOutput}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            id={id}
            name={name}
            defaultValue={defaultValue}
            placeholder={placeholder}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full min-h-40 resize-y border-0 bg-transparent p-3 font-mono text-xs leading-6 text-foreground outline-none placeholder:text-muted-foreground/50"
            spellCheck={false}
          />
        )}
      </div>

      {error && (
        <p className="text-[10px] font-semibold text-destructive">
          ⚠ Fix the JSON before saving. Invalid JSON will be rejected by the server.
        </p>
      )}
    </div>
  );
}
