"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type DraftData = Record<string, string>;

const STORAGE_PREFIX = "buff-draft-";

function makeKey(suffix: string): string {
  // Include pathname so drafts are scoped per-page
  const path = typeof window !== "undefined" ? window.location.pathname.replace(/\//g, "_") : "unknown";
  return `${STORAGE_PREFIX}${path}${suffix}`;
}

type UseAutoSaveOptions = {
  /** localStorage key suffix */
  key: string;
  /** Debounce delay in ms (default 1500) */
  delay?: number;
  /** Fields to watch for auto-save */
  fields: Record<string, string>;
};

export function useAutoSave({ key, delay = 1500, fields }: UseAutoSaveOptions) {
  const storageKey = makeKey(key);
  const [saved, setSaved] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);

  // Restore draft on mount
  const restore = useCallback((): DraftData | null => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as DraftData;
      return parsed;
    } catch {
      return null;
    }
  }, [storageKey]);

  // Save draft
  const save = useCallback((data: DraftData) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
      setSaved(true);
      setLastSaved(new Date());
    } catch {
      // localStorage might be full or unavailable
    }
  }, [storageKey]);

  // Clear draft
  const clear = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setSaved(false);
      setLastSaved(null);
    } catch {
      // ignore
    }
  }, [storageKey]);

  // Check if a draft exists
  const hasDraft = useCallback((): boolean => {
    try {
      return localStorage.getItem(storageKey) !== null;
    } catch {
      return false;
    }
  }, [storageKey]);

  // Auto-save on field changes with debounce
  useEffect(() => {
    // Skip the initial mount — only auto-save on actual changes
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    const hasContent = Object.values(fields).some((v) => v.trim().length > 0);
    if (!hasContent) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      save(fields);
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        // Flush pending save on unmount / field change to avoid losing last edits
        const hasContent = Object.values(fields).some((v) => v.trim().length > 0);
        if (hasContent) {
          try {
            localStorage.setItem(storageKey, JSON.stringify(fields));
          } catch {
            // ignore
          }
        }
      }
    };
  }, [fields, delay, save, storageKey]);

  return { saved, lastSaved, restore, clear, hasDraft };
}
