"use server";

import {
  createCourseResourceAction,
  updateCourseResourceAction,
  deleteCourseResourceAction,
} from "../course-resources";

export async function createCourseResourceFormAction(formData: FormData): Promise<any> {
  return await createCourseResourceAction(formData);
}

export async function updateCourseResourceFormAction(formData: FormData): Promise<any> {
  return await updateCourseResourceAction(formData);
}

export async function deleteCourseResourceFormAction(formData: FormData): Promise<any> {
  return await deleteCourseResourceAction(formData);
}
