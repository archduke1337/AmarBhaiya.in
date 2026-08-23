"use client";

import { useState, useCallback, useRef } from "react";
import { GripVertical, Trash2, Plus, AlertCircle, CheckCircle2, Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Collection = {
  id: string;
  title: string;
  subtitle?: string;
  courseSlugs: string[];
  cta?: string;
  imageUrl?: string;
  bgColor?: string;
};

type CollectionReorderProps = {
  id: string;
  name: string;
  defaultValue: string;
  onChange?: (json: string) => void;
};

export function CollectionReorder({ id, name, defaultValue, onChange }: CollectionReorderProps) {
  const parseCollections = useCallback((json: string): Collection[] => {
    try {
      const parsed = JSON.parse(json);
      if (parsed?.collections && Array.isArray(parsed.collections)) {
        return parsed.collections as Collection[];
      }
    } catch {
      // invalid JSON
    }
    return [];
  }, []);

  const [collections, setCollections] = useState<Collection[]>(() =>
    parseCollections(defaultValue)
  );
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const toJson = useCallback((items: Collection[]): string => {
    return JSON.stringify({ collections: items }, null, 2);
  }, []);

  const syncHiddenInput = useCallback((items: Collection[]) => {
    const json = toJson(items);
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = json;
    }
    onChange?.(json);
  }, [toJson, onChange]);

  // ── Undo / Redo history stack ───────────────────────────────────────────
  const historyRef = useRef<Collection[][]>([parseCollections(defaultValue)]);
  const historyIndexRef = useRef(0);

  const pushHistory = useCallback((items: Collection[]) => {
    const history = historyRef.current;
    const index = historyIndexRef.current;

    // Discard any redo history beyond current index
    history.splice(index + 1);

    history.push(structuredClone(items));
    // Cap history at 50 entries
    if (history.length > 50) {
      history.shift();
    }
    historyIndexRef.current = history.length - 1;

    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    const previous = historyRef.current[historyIndexRef.current];
    setCollections(previous);
    syncHiddenInput(previous);
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(true);
  }, [syncHiddenInput]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    const next = historyRef.current[historyIndexRef.current];
    setCollections(next);
    syncHiddenInput(next);
    setCanUndo(true);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, [syncHiddenInput]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      if (e.shiftKey) {
        e.preventDefault();
        redo();
      } else {
        e.preventDefault();
        undo();
      }
    }
  }, [undo, redo]);

  const emitChange = useCallback((items: Collection[]) => {
    setCollections(items);
    setError(items.length === 0 ? "Add at least one collection" : null);
    syncHiddenInput(items);
    pushHistory(items);
  }, [syncHiddenInput, pushHistory]);

  // ── Drag handlers ──────────────────────────────────────────────────────

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const updated = [...collections];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, moved);
    setDragIndex(index);
    setCollections(updated);
    syncHiddenInput(updated);
  }, [dragIndex, collections, syncHiddenInput]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
  }, []);

  // ── Item mutations ─────────────────────────────────────────────────────

  const addCollection = useCallback(() => {
    const newItem: Collection = {
      id: `collection-${Date.now()}`,
      title: "New Collection",
      subtitle: "",
      courseSlugs: [],
      cta: "View Collection",
      imageUrl: "",
      bgColor: "",
    };
    emitChange([...collections, newItem]);
  }, [collections, emitChange]);

  const removeCollection = useCallback((index: number) => {
    const updated = collections.filter((_, i) => i !== index);
    emitChange(updated);
  }, [collections, emitChange]);

  const updateField = useCallback(
    (index: number, field: keyof Collection, value: string) => {
      const updated = collections.map((item, i) => {
        if (i !== index) return item;
        if (field === "courseSlugs") {
          return { ...item, courseSlugs: value.split(",").map((s) => s.trim()).filter(Boolean) };
        }
        return { ...item, [field]: value };
      });
      emitChange(updated);
    },
    [collections, emitChange]
  );

  return (
    <div className="space-y-3">
      {/* Hidden input for form submission */}
      <input type="hidden" ref={hiddenInputRef} id={id} name={name} defaultValue={defaultValue} />

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2" onKeyDown={handleKeyDown}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Collections ({collections.length})</span>
          {error ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-destructive">
              <AlertCircle className="size-3" />
              {error}
            </span>
          ) : collections.length > 0 ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
              <CheckCircle2 className="size-3" />
              Ready
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className={`rounded-md p-1.5 transition-colors ${
              canUndo
                ? "text-muted-foreground hover:bg-surface hover:text-foreground"
                : "text-muted-foreground/30 cursor-not-allowed"
            }`}
          >
            <Undo2 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
            className={`rounded-md p-1.5 transition-colors ${
              canRedo
                ? "text-muted-foreground hover:bg-surface hover:text-foreground"
                : "text-muted-foreground/30 cursor-not-allowed"
            }`}
          >
            <Redo2 className="size-3.5" />
          </button>
          <Button type="button" size="xs" variant="outline" onClick={addCollection}>
            <Plus className="size-3.5" />
            Add Collection
          </Button>
        </div>
      </div>

      {/* Sortable list */}
      {collections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/40 bg-surface-hover p-6 text-center text-sm font-medium text-muted-foreground">
          No collections yet. Click &quot;Add Collection&quot; to create one.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {collections.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`group flex items-start gap-2 rounded-xl border bg-surface p-3 transition-all ${
                dragIndex === index
                  ? "border-accent opacity-60 shadow-md"
                  : "border-border/40 hover:border-border/60"
              }`}
            >
              {/* Drag handle */}
              <button
                type="button"
                className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Drag to reorder"
              >
                <GripVertical className="size-4" />
              </button>

              {/* Fields */}
              <div className="flex-1 grid gap-2 min-w-0 sm:grid-cols-2">
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateField(index, "title", e.target.value)}
                  placeholder="Collection title"
                  className="input-field w-full text-sm"
                />
                <input
                  type="text"
                  value={item.subtitle ?? ""}
                  onChange={(e) => updateField(index, "subtitle", e.target.value)}
                  placeholder="Subtitle (optional)"
                  className="input-field w-full text-sm"
                />
                <input
                  type="text"
                  value={item.courseSlugs.join(", ")}
                  onChange={(e) => updateField(index, "courseSlugs", e.target.value)}
                  placeholder="course-slug-1, course-slug-2"
                  className="input-field w-full text-sm sm:col-span-2 font-mono"
                />
                <input
                  type="text"
                  value={item.cta ?? ""}
                  onChange={(e) => updateField(index, "cta", e.target.value)}
                  placeholder="CTA text (optional)"
                  className="input-field w-full text-sm"
                />
                <input
                  type="text"
                  value={item.imageUrl ?? ""}
                  onChange={(e) => updateField(index, "imageUrl", e.target.value)}
                  placeholder="Banner image URL (optional)"
                  className="input-field w-full text-sm font-mono"
                />
                <input
                  type="text"
                  value={item.bgColor ?? ""}
                  onChange={(e) => updateField(index, "bgColor", e.target.value)}
                  placeholder="Background color e.g. oklch(0.85 0.15 72) (optional)"
                  className="input-field w-full text-sm font-mono"
                />
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={() => removeCollection(index)}
                className="mt-1 shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Remove collection"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
