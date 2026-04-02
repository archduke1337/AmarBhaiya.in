/**
 * Accessibility utilities and helpers for WCAG 2.1 AA compliance
 */

/**
 * Generate aria-describedby IDs for form errors
 */
export function getErrorDescriberId(fieldName: string): string {
  return `${fieldName}-error`;
}

/**
 * Keyboard event handler for common patterns
 */
export function handleKeyboardNavigation(e: React.KeyboardEvent) {
  // Space or Enter to activate buttons
  if ((e.key === " " || e.key === "Enter") && e.currentTarget.tagName !== "BUTTON") {
    e.preventDefault();
    (e.currentTarget as HTMLElement).click();
  }

  // Escape to close modals/dropdowns
  if (e.key === "Escape") {
    const target = e.currentTarget as HTMLElement;
    target.blur();
  }
}

/**
 * Focus management for modals and overlays
 */
export function trapFocus(e: React.KeyboardEvent, container: HTMLElement | null) {
  if (e.key !== "Tab" || !container) return;

  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  if (focusableElements.length === 0) return;

  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  if (e.shiftKey && document.activeElement === firstElement) {
    e.preventDefault();
    lastElement.focus();
  } else if (!e.shiftKey && document.activeElement === lastElement) {
    e.preventDefault();
    firstElement.focus();
  }
}

/**
 * Announce screen reader messages
 */
export function announceMessage(message: string, priority: "polite" | "assertive" = "polite") {
  const div = document.createElement("div");
  div.setAttribute("role", "status");
  div.setAttribute("aria-live", priority);
  div.setAttribute("aria-atomic", "true");
  div.className = "sr-only";
  div.textContent = message;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 1000);
}

/**
 * Skip link to main content
 */
export const SkipLink = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:fixed focus:top-0 focus:left-0 focus:z-50 focus:bg-black focus:text-white focus:p-2"
  >
    Skip to main content
  </a>
);

