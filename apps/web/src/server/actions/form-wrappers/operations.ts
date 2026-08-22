"use server";

import {
  updateInstructorCourseAction,
  updateCourseVisibilityAction,
  updateUserRoleAction,
} from "../operations";

export async function updateInstructorCourseFormAction(formData: FormData): Promise<any> {
  return await updateInstructorCourseAction(formData);
}

export async function updateCourseVisibilityFormAction(formData: FormData): Promise<any> {
  return await updateCourseVisibilityAction(formData);
}

export async function updateUserRoleFormAction(formData: FormData): Promise<any> {
  return await updateUserRoleAction(formData);
}
