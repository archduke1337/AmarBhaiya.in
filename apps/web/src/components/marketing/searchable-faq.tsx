"use client";

/**
 * Searchable FAQ — filters questions by keyword as the user types.
 * Groups with no matching questions are hidden; a friendly empty state
 * appears when nothing matches.
 */

import { useMemo, useState } from "react";
import { Search, SearchX } from "lucide-react";

import { Input } from "@/components/ui/input";

export type FaqItem = { q: string; a: string };
export type FaqGroup = { title: string; items: FaqItem[] };

export function SearchableFaq({ groups }: { groups: FaqGroup[] }) {
  const [query, setQuery] = useState("");

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;

    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [query, groups]);

  const totalMatches = filteredGroups.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="faq-search"
          className="site-kicker font-sans block"
        >
          Search questions
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60"
            aria-hidden="true"
          />
          <Input
            id="faq-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try &ldquo;refund&rdquo;, &ldquo;notes&rdquo;, &ldquo;certificate&rdquo;…"
            className="pl-10 pr-4"
          />
        </div>
        <p
          className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground/70"
          role="status"
          aria-live="polite"
        >
          {query.trim() === ""
            ? `${groups.reduce((sum, g) => sum + g.items.length, 0)} questions across ${groups.length} topics`
            : `${totalMatches} matching question${totalMatches === 1 ? "" : "s"}`}
        </p>
      </div>

      {filteredGroups.length === 0 ? (
        <div className="rounded-[calc(var(--radius)+2px)] border border-dashed border-border bg-card px-6 py-10 text-center">
          <SearchX
            className="mx-auto mb-3 size-6 text-muted-foreground/50"
            aria-hidden="true"
          />
          <p className="text-sm font-bold">No question matches &ldquo;{query}&rdquo; yet.</p>
          <p className="mt-1 text-sm font-medium leading-6 text-muted-foreground">
            Try a different keyword, or ask us on the{" "}
            <a href="/contact" className="font-bold text-accent hover:underline">
              contact page
            </a>
            .
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map((group) => (
            <div key={group.title} className="space-y-3">
              <h2 className="font-heading text-2xl font-normal tracking-[-0.02em]">
                {group.title}
              </h2>
              {group.items.map((item) => (
                <details
                  key={item.q}
                  className="group overflow-hidden rounded-[calc(var(--radius)+2px)] border border-border bg-card shadow-[var(--surface-shadow)]"
                >
                  <summary className="flex min-h-14 cursor-pointer list-none items-start justify-between gap-4 bg-secondary/75 px-4 py-4 text-sm font-sans font-bold leading-6 tracking-[0.01em] outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span
                      className="mt-0.5 text-xs font-black text-muted-foreground transition-transform duration-200 group-open:rotate-45"
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </summary>
                  <div className="px-4 py-4">
                    <p className="text-sm font-medium leading-7 text-foreground/80">
                      {item.a}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}