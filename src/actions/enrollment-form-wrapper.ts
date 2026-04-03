/**
 * Wrapper server action that accepts ActionResult-returning actions
 * and discards the return value for HTML form compatibility
 */
"use server";

import {
  enrollInCourseAction,
  markLessonCompleteAction,
} from "@/actions/enrollment";

export async function enrollInCourseFormAction(
  formData: FormData
): Promise<void> {
  await enrollInCourseAction(formData);
  // Discard the ActionResult for form compatibility
  // The client will handle the result via URL search params or server revalidation
}

export async function markLessonCompleteFormAction(
  formData: FormData
): Promise<void> {
  await markLessonCompleteAction(formData);
}

