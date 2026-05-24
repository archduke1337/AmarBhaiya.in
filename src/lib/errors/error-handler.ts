import * as Sentry from "@sentry/nextjs";

/**
 * Production-grade error handling with logging
 * Provides standardized error logging, categorization, and recovery
 */

export type ErrorCategory = 
  | 'VALIDATION' 
  | 'AUTHENTICATION' 
  | 'AUTHORIZATION' 
  | 'NOT_FOUND' 
  | 'CONFLICT' 
  | 'RATE_LIMIT'
  | 'EXTERNAL_SERVICE' 
  | 'DATABASE' 
  | 'INTERNAL';

interface ErrorContext {
  userId?: string;
  action?: string;
  resource?: string;
  details?: Record<string, unknown>;
}

/**
 * Production-safe error message (never exposes internals)
 */
function getSafeErrorMessage(error: unknown, category: ErrorCategory): string {
  const errorMap: Record<ErrorCategory, string> = {
    VALIDATION: 'Please check your input and try again.',
    AUTHENTICATION: 'Authentication failed. Please log in again.',
    AUTHORIZATION: 'You do not have permission to perform this action.',
    NOT_FOUND: 'The requested resource was not found.',
    CONFLICT: 'This operation conflicts with existing data.',
    RATE_LIMIT: 'Too many requests. Please try again in a moment.',
    EXTERNAL_SERVICE: 'An external service is unavailable. Please try again later.',
    DATABASE: 'A database error occurred. Please try again.',
    INTERNAL: 'An unexpected error occurred. Our team has been notified.',
  };
  return errorMap[category];
}

/**
 * Log error with context (server-side only, never exposed to client)
 */
export function logError(error: unknown, context: ErrorContext & { category: ErrorCategory }): void {
  const timestamp = new Date().toISOString();
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  const logEntry = {
    timestamp,
    category: context.category,
    action: context.action,
    resource: context.resource,
    userId: context.userId,
    message,
    stack: process.env.NODE_ENV === 'development' ? stack : undefined,
    details: context.details,
  };

  if (process.env.NODE_ENV === 'production') {
    Sentry.withScope((scope) => {
      scope.setLevel('error');
      scope.setTag('category', context.category);
      if (context.action) scope.setTag('action', context.action);
      if (context.userId) scope.setUser({ id: context.userId });
      if (context.resource) scope.setExtra('resource', context.resource);
      if (context.details) scope.setExtras(context.details);
      Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
    });
  } else {
    console.error('[DEV ERROR]', logEntry);
  }
}

/**
 * Handle action error with logging and safe message
 */
export function handleActionError(
  error: unknown,
  context: ErrorContext & { category: ErrorCategory }
): string {
  logError(error, context);
  return getSafeErrorMessage(error, context.category);
}

/**
 * Common error handlers
 */
export const ErrorHandlers = {
  validation: (error: unknown, context: ErrorContext) => 
    handleActionError(error, { ...context, category: 'VALIDATION' }),
  
  notFound: (error: unknown, context: ErrorContext) => 
    handleActionError(error, { ...context, category: 'NOT_FOUND' }),
  
  authorization: (error: unknown, context: ErrorContext) => 
    handleActionError(error, { ...context, category: 'AUTHORIZATION' }),
  
  database: (error: unknown, context: ErrorContext) => 
    handleActionError(error, { ...context, category: 'DATABASE' }),
  
  externalService: (error: unknown, context: ErrorContext) => 
    handleActionError(error, { ...context, category: 'EXTERNAL_SERVICE' }),
};
