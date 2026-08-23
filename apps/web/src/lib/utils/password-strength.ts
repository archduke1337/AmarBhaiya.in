/**
 * Shared password strength evaluator.
 * Used by register, reset-password, and any future auth forms.
 */
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", color: "bg-danger" };
  if (score <= 2) return { score, label: "Fair", color: "bg-amber-500" };
  if (score <= 3) return { score, label: "Good", color: "bg-accent" };
  return { score, label: "Strong", color: "bg-emerald-500" };
}

/**
 * Renders a password strength bar accessible to screen readers.
 * Usage: <div role="img" aria-label={getPasswordStrengthAriaLabel(password)}>
 */
export function getPasswordStrengthAriaLabel(password: string): string {
  const strength = getPasswordStrength(password);
  return `Password strength: ${strength.label} (${strength.score} of 5)`;
}
