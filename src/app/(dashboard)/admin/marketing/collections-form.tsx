"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { BookOpen, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAutoSave } from "./use-auto-save";
import { CollectionReorder } from "./collection-reorder";
import { CollectionPreview } from "./collection-preview";

type CollectionsFormProps = {
  upsertSiteCopyFormAction: (formData: FormData) => Promise<void>;
  defaults: {
    title: string;
    payload: string;
  };
};

export function CollectionsForm({ upsertSiteCopyFormAction, defaults }: CollectionsFormProps) {
  const [title, setTitle] = useState(defaults.title);
  const [payload, setPayload] = useState(defaults.payload);
  const [restored, setRestored] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Track JSON from hidden input for auto-save
  const getHiddenPayload = useCallback((): string => {
    const hidden = formRef.current?.querySelector<HTMLInputElement>('input[type="hidden"][name="payload"]');
    return hidden?.value ?? payload;
  }, [payload]);

  // Read current payload from the form for preview
  const [previewPayload, setPreviewPayload] = useState(payload);

  const autoSave = useAutoSave({
    key: "collections",
    fields: {
      title,
      payload: getHiddenPayload(),
    },
    delay: 2000,
  });

  // Handle restore from draft
  const handleRestore = useCallback(() => {
    const draft = autoSave.restore();
    if (draft) {
      if (draft.title) setTitle(draft.title);
      if (draft.payload) {
        setPayload(draft.payload);
        setPreviewPayload(draft.payload);
        // Also update hidden input in CollectionReorder
        const hidden = formRef.current?.querySelector<HTMLInputElement>('input[type="hidden"][name="payload"]');
        if (hidden) hidden.value = draft.payload;
      }
      setRestored(true);
      setTimeout(() => setRestored(false), 3000);
    }
  }, [autoSave]);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      upsertSiteCopyFormAction(formData);
      autoSave.clear();
    },
    [upsertSiteCopyFormAction, autoSave]
  );

  // Sync preview payload periodically (every 800ms debounce)
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncPreview = useCallback(() => {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(() => {
      setPreviewPayload(getHiddenPayload());
    }, 800);
  }, [getHiddenPayload]);

  // Cleanup preview timer on unmount
  useEffect(() => {
    return () => {
      if (previewTimerRef.current) {
        clearTimeout(previewTimerRef.current);
      }
    };
  }, []);

  const handleReorderChange = useCallback((json: string) => {
    setPayload(json);
    syncPreview();
  }, [syncPreview]);

  const hasDraft = autoSave.hasDraft();

  return (
    <form
      ref={formRef}
      action={upsertSiteCopyFormAction}
      className="flex flex-col gap-4 p-5"
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="key" value="home.collections" />
      <input type="hidden" name="isPublished" value="true" />

      {/* Draft restore banner */}
      {hasDraft && !restored && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-accent/40 bg-accent/5 px-4 py-3">
          <div>
            <p className="text-xs font-bold text-foreground">Unsaved collection draft found</p>
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

      <label className="space-y-1.5">
        <Label htmlFor="collections-title">Collection Title</Label>
        <Input
          id="collections-title"
          name="title"
          placeholder="e.g. Curated Learning Packs"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      <CollectionReorder
        id="collections-payload"
        name="payload"
        defaultValue={payload}
        onChange={handleReorderChange}
      />

      {/* Auto-save indicator */}
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
        {autoSave.saved && (
          <span className="inline-flex items-center gap-1">
            <Save className="size-3" />
            Auto-saved {autoSave.lastSaved?.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Live preview */}
      <CollectionPreview jsonValue={previewPayload} />

      <div className="flex justify-end">
        <Button type="submit" className="w-full sm:w-auto">
          <BookOpen className="size-4" />
          Save Collections
        </Button>
      </div>
    </form>
  );
}
