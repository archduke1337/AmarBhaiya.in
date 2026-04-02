"use client";

/**
 * Skip Link Component
 * Accessible link that allows keyboard users to bypass navigation
 * Only visible when focused
 */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="
        fixed top-0 left-0 z-50
        px-4 py-2
        bg-foreground text-background
        text-sm font-medium
        rounded
        -translate-y-full focus-visible:translate-y-0
        transition-transform duration-200
      "
    >
      Skip to main content
    </a>
  );
}
