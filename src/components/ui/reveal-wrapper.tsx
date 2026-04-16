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

type RevealTag =
  | "div"
  | "span"
  | "nav"
  | "p"
  | "h1"
  | "h2"
  | "h3"
  | "section"
  | "article"
  | "main";

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

  const classes = cn("reveal", className);

  if (as === "span") {
    return (
      <span ref={ref as React.RefObject<HTMLSpanElement>} className={classes}>
        {children}
      </span>
    );
  }

  if (as === "nav") {
    return (
      <nav ref={ref as React.RefObject<HTMLElement>} className={classes}>
        {children}
      </nav>
    );
  }

  if (as === "p") {
    return (
      <p ref={ref as React.RefObject<HTMLParagraphElement>} className={classes}>
        {children}
      </p>
    );
  }

  if (as === "h1") {
    return (
      <h1 ref={ref as React.RefObject<HTMLHeadingElement>} className={classes}>
        {children}
      </h1>
    );
  }

  if (as === "h2") {
    return (
      <h2 ref={ref as React.RefObject<HTMLHeadingElement>} className={classes}>
        {children}
      </h2>
    );
  }

  if (as === "h3") {
    return (
      <h3 ref={ref as React.RefObject<HTMLHeadingElement>} className={classes}>
        {children}
      </h3>
    );
  }

  if (as === "section") {
    return (
      <section ref={ref as React.RefObject<HTMLElement>} className={classes}>
        {children}
      </section>
    );
  }

  if (as === "article") {
    return (
      <article ref={ref as React.RefObject<HTMLElement>} className={classes}>
        {children}
      </article>
    );
  }

  if (as === "main") {
    return (
      <main ref={ref as React.RefObject<HTMLElement>} className={classes}>
        {children}
      </main>
    );
  }

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={classes}>
      {children}
    </div>
  );
}
