"use client";

import { useState } from "react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

type Collection = {
  id: string;
  title: string;
  subtitle?: string;
  courseSlugs: string[];
  cta?: string;
};

type CollectionPreviewProps = {
  jsonValue: string;
};

function parseCollections(json: string): Collection[] {
  try {
    const parsed = JSON.parse(json);
    if (parsed?.collections && Array.isArray(parsed.collections)) {
      return parsed.collections as Collection[];
    }
  } catch {
    // invalid JSON
  }
  return [];
}

export function CollectionPreview({ jsonValue }: CollectionPreviewProps) {
  const [showPreview, setShowPreview] = useState(false);
  const collections = parseCollections(jsonValue);

  if (collections.length === 0) return null;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setShowPreview(!showPreview)}
        className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors"
      >
        {showPreview ? (
          <>
            <EyeOff className="size-3.5" />
            Hide homepage preview
          </>
        ) : (
          <>
            <Eye className="size-3.5" />
            Show homepage preview
          </>
        )}
      </button>

      {showPreview && (
        <div className="overflow-hidden rounded-xl border border-border/40 bg-surface">
          {/* Preview header */}
          <div className="border-b border-border/40 bg-surface-hover px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                Homepage Preview
              </span>
              <span className="text-[10px] text-muted-foreground/50">
                · {collections.length} collection{collections.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {/* Collections carousel */}
          <div className="flex gap-4 overflow-x-auto p-4 snap-x snap-mandatory scrollbar-none">
            {collections.map((collection, i) => (
              <div
                key={collection.id}
                className="snap-start shrink-0 w-[260px]"
              >
                <div className="rounded-xl border border-border/40 bg-surface-hover p-5 flex flex-col gap-4 min-h-[160px]">
                  {/* Number icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-black"
                    style={{
                      background: "color-mix(in oklab, var(--accent) 12%, transparent)",
                      color: "var(--accent)",
                    }}
                  >
                    {i + 1}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-foreground">
                      {collection.title || "Untitled"}
                    </h4>
                    {collection.subtitle && (
                      <p className="text-xs text-foreground/55 mt-1 leading-relaxed">
                        {collection.subtitle}
                      </p>
                    )}
                    <p className="text-[11px] text-foreground/40 mt-2">
                      {collection.courseSlugs.length} course
                      {collection.courseSlugs.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  {/* CTA */}
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
                    {collection.cta || "Explore"}
                    <ArrowRight className="size-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border/40 bg-surface-hover px-4 py-2">
            <p className="text-[10px] font-semibold text-muted-foreground">
              This preview reflects unsaved changes. The section title comes from the &quot;Collection Title&quot; field above.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
