import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/errors/action-result";

/**
 * Hook to handle server action results with automatic toast notifications
 * Shows success/error messages to users and redirects on success if needed
 */
export function useActionHandler() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function executeAction<T>(
    action: () => Promise<ActionResult<T>>,
    options?: {
      successMessage?: string;
      errorMessage?: string;
      redirectTo?: string;
      onSuccess?: (data?: T) => void;
      onError?: (error: string) => void;
    }
  ): Promise<ActionResult<T> | null> {
    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          const result = await action();

          if (result.success) {
            // Show success toast
            const message = options?.successMessage || "Success!";
            toast.success(message);

            // Call success callback
            options?.onSuccess?.(result.data);

            // Redirect if specified
            if (options?.redirectTo) {
              setTimeout(() => router.push(options.redirectTo!), 500);
            }

            resolve(result);
          } else {
            // Show error toast
            const message = options?.errorMessage || result.error;
            toast.error(message);

            // Call error callback
            options?.onError?.(result.error);

            resolve(result);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Something went wrong";
          toast.error(message);
          resolve(null);
        }
      });
    });
  }

  return { executeAction, isPending };
}

/**
 * Wrapper component for forms that need automatic loading states
 */
export function FormSubmitButton({
  children,
  isPending,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { isPending?: boolean }) {
  return (
    <button
      {...props}
      disabled={disabled || isPending}
      className="inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending && (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}

