"use client";

import { useState, useEffect } from "react";
import { X, ArrowRight } from "lucide-react";
import Link from "next/link";

export type AnnouncementData = {
  text: string;
  link?: string;
  linkLabel?: string;
  isDismissible?: boolean;
  isActive?: boolean;
  backgroundColor?: string;
};

const DISMISSED_KEY = "ab-announcement-dismissed";

type Props = {
  announcement: AnnouncementData | null;
};

export function AnnouncementBanner({ announcement }: Props) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(DISMISSED_KEY);
    setDismissed(stored === "true");
  }, []);

  if (!announcement || !announcement.isActive || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, "true");
  };

  const bgColor = announcement.backgroundColor || "var(--accent)";

  return (
    <div
      className="relative flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-semibold transition-all"
      style={{ background: bgColor, color: "var(--accent-foreground)" }}
    >
      <span className="text-center text-xs leading-5 sm:text-sm">
        {announcement.text}
      </span>

      {announcement.link && (
        <Link
          href={announcement.link}
          className="inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-[0.1em] transition-all hover:opacity-80"
          style={{
            background: "color-mix(in oklab, black 15%, transparent)",
            color: "var(--accent-foreground)",
          }}
        >
          {announcement.linkLabel || "Learn More"}
          <ArrowRight className="size-3" />
        </Link>
      )}

      {announcement.isDismissible !== false && (
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 transition-all hover:opacity-70"
          aria-label="Dismiss announcement"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
