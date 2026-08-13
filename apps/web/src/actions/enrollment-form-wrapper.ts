/**
 * Wrapper server action that accepts ActionResult-returning actions
 * and discards the return value for HTML form compatibility
 */
"use server";

import {
  enrollInCourseAction,
  adminEnrollAction,
  adminUnenrollAction,
} from "@/actions/enroll";
import { markLessonCompleteAction } from "@/actions/progress";

/**
 * Form-compatible wrappers that discard ActionResult returns.
 * Next.js <form action={...}> requires Promise<void>.
 */

export async function enrollInCourseFormAction(
  formData: FormData
): Promise<void> {
  await enrollInCourseAction(formData);
}

export async function adminEnrollFormAction(
  formData: FormData
): Promise<void> {
  await adminEnrollAction(formData);
}

export async function adminUnenrollFormAction(
  formData: FormData
): Promise<void> {
  await adminUnenrollAction(formData);
}

export async function markLessonCompleteFormAction(
  formData: FormData
): Promise<void> {
  await markLessonCompleteAction(formData);
}

