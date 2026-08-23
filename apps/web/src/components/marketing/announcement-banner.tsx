"use client";

import { useState, useSyncExternalStore } from "react";
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

function isSafeHttpHref(href: string): boolean {
  const t = href.trim();
  if (!t) return false;
  if (t.startsWith("/") || t.startsWith("#")) {
    return !t.startsWith("//");
  }
  try {
    const u = new URL(t, "https://amarbhaiya.in");
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function getAnnouncementDismissedKey(announcement: Pick<AnnouncementData, "text" | "link"> | null): string {
  if (!announcement) return "ab-announcement-dismissed";
  // Version the key by content hash so new announcements are not permanently hidden
  let hash = 0;
  const str = `${announcement.text}::${announcement.link ?? ""}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return `ab-announcement-dismissed:${hash.toString(16)}`;
}

function safeGetDismissed(key: string): boolean {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}
function safeSetDismissed(key: string): void {
  try {
    window.localStorage.setItem(key, "true");
  } catch {
    // ignore quota / privacy mode
  }
}

type Props = {
  announcement: AnnouncementData | null;
};

export function AnnouncementBanner({ announcement }: Props) {
  const dismissKey = getAnnouncementDismissedKey(announcement);
  const storedDismissed = useSyncExternalStore(
    () => () => {},
    () => safeGetDismissed(dismissKey),
    () => true,
  );
  const [dismissedForSession, setDismissedForSession] = useState(false);
  const dismissed = storedDismissed || dismissedForSession;

  if (!announcement || !announcement.isActive || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissedForSession(true);
    safeSetDismissed(dismissKey);
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

      {announcement.link && isSafeHttpHref(announcement.link) && (
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
