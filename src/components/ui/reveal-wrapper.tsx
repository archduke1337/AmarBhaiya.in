"use client";

/**
 * RevealWrapper
 * ─────────────
 * IntersectionObserver-based scroll reveal.
 * Uses CSS classes (.reveal → .in-view) to animate.
 * GPU-safe: only animates transform + opacity.
 * No framer-motion, no window.scroll listeners.
 */

import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils/cn";

type RevealTag = keyof HTMLElementTagNameMap;

interface RevealWrapperProps {
  children: React.ReactNode;
  className?: string;
  as?: RevealTag;
  threshold?: number;
}

export function RevealWrapper({
  children,
  className,
  as = "div",
  threshold = 0.12,
}: RevealWrapperProps) {
  const ref = useRef<HTMLElement | null>(null);

  const setRef = (node: Element | null) => {
    ref.current = node instanceof HTMLElement ? node : null;
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("in-view");
          observer.unobserve(el); // fire once
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return React.createElement(
    as,
    {
      ref: setRef as React.RefCallback<HTMLElement>,
      className: cn("reveal", className),
    },
    children,
  );
}
