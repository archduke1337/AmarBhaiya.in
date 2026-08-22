"use server";


import type { ActionResult } from "@/lib/errors/action-result";
import {
  updateInstructorCourseAction,
  updateCourseVisibilityAction,
  updateUserRoleAction,
} from "../operations";

export async function updateInstructorCourseFormAction(formData: FormData): Promise<ActionResult> {
  return await updateInstructorCourseAction(formData);
}

export async function updateCourseVisibilityFormAction(formData: FormData): Promise<ActionResult> {
  return await updateCourseVisibilityAction(formData);
}

export async function updateUserRoleFormAction(formData: FormData): Promise<ActionResult> {
  return await updateUserRoleAction(formData);
}
