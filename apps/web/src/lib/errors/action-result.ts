/**
 * Standardized Action Result Type
 * All server actions should return this for consistent error handling
 */

export type ActionResult<T = undefined> = 
  | { success: true; data?: T }
  | { success: false; error: string; code?: string };

/**
 * Success result factory
 */
export function actionSuccess<T = undefined>(data?: T): ActionResult<T> {
  return { success: true, data };
}

/**
 * Error result factory with optional error code
 */
export function actionError(message: string, code?: string): ActionResult {
  return { success: false, error: message, code };
}

/**
 * Type guard for success
 */
export function isActionSuccess<T>(result: ActionResult<T>): result is { success: true; data?: T } {
  return result.success === true;
}

/**
 * Type guard for error
 */
export function isActionError(result: ActionResult): result is { success: false; error: string } {
  return result.success === false;
}
