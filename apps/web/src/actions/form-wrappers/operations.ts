"use server";

import {
  updateInstructorCourseAction,
  updateCourseVisibilityAction,
  updateUserRoleAction,
} from "../operations";

export async function updateInstructorCourseFormAction(formData: FormData): Promise<void> {
  await updateInstructorCourseAction(formData);
}

export async function updateCourseVisibilityFormAction(formData: FormData): Promise<void> {
  await updateCourseVisibilityAction(formData);
}

export async function updateUserRoleFormAction(formData: FormData): Promise<void> {
  await updateUserRoleAction(formData);
}
