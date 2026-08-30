"use client";

import { useState } from "react";
import { Eye, EyeOff, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

type BlogPreviewProps = {
  content: string;
};

export function BlogPreviewButton({ content }: BlogPreviewProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setShowPreview(!showPreview)}
      >
        {showPreview ? (
          <>
            <EyeOff className="size-3.5" />
            Hide Preview
          </>
        ) : (
          <>
            <Eye className="size-3.5" />
            Preview
          </>
        )}
      </Button>

      {showPreview && (
        <div className="overflow-hidden rounded-xl border border-border/40 bg-surface">
          <div className="border-b border-border/40 bg-surface-hover px-4 py-2.5">
            <div className="flex items-center gap-2">
              <FileText className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">
                Content Preview
              </span>
            </div>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none p-4">
            {content.split("\n").filter(Boolean).map((paragraph, i) => {
              const trimmed = paragraph.trim();
              if (!trimmed) return null;

              if (trimmed.startsWith("## ")) {
                return (
                  <h2
                    key={i}
                    className="mt-5 mb-2 font-heading text-lg font-normal tracking-[-0.02em] first:mt-0"
                  >
                    {trimmed.replace(/^## /, "")}
                  </h2>
                );
              }

              if (trimmed.startsWith("### ")) {
                return (
                  <h3
                    key={i}
                    className="mt-4 mb-1.5 font-heading text-base font-bold"
                  >
                    {trimmed.replace(/^### /, "")}
                  </h3>
                );
              }

              if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                return (
                  <ul key={i} className="my-1 list-disc pl-5 text-sm leading-7 text-muted-foreground">
                    <li>{trimmed.replace(/^[-*] /, "")}</li>
                  </ul>
                );
              }

              return (
                <p
                  key={i}
                  className="my-2 text-sm leading-7 text-muted-foreground first:mt-0"
                >
                  {trimmed}
                </p>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
