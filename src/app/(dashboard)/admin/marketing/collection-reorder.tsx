"use client";

import { useState, useCallback, useRef } from "react";
import { GripVertical, Trash2, Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Collection = {
  id: string;
  title: string;
  subtitle?: string;
  courseSlugs: string[];
  cta?: string;
};

type CollectionReorderProps = {
  id: string;
  name: string;
  defaultValue: string;
};

export function CollectionReorder({ id, name, defaultValue }: CollectionReorderProps) {
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
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const toJson = useCallback((items: Collection[]): string => {
    return JSON.stringify({ collections: items }, null, 2);
  }, []);

  const syncHiddenInput = useCallback((items: Collection[]) => {
    const json = toJson(items);
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = json;
    }
  }, [toJson]);

  const emitChange = useCallback((items: Collection[]) => {
    setCollections(items);
    setError(items.length === 0 ? "Add at least one collection" : null);
    syncHiddenInput(items);
  }, [syncHiddenInput]);

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
      <div className="flex items-center justify-between gap-2">
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
        <Button type="button" size="xs" variant="outline" onClick={addCollection}>
          <Plus className="size-3.5" />
          Add Collection
        </Button>
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
