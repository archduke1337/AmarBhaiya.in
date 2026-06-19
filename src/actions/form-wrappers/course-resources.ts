"use server";

import {
  createCourseResourceAction,
  updateCourseResourceAction,
  deleteCourseResourceAction,
} from "../course-resources";

export async function createCourseResourceFormAction(formData: FormData): Promise<void> {
  await createCourseResourceAction(formData);
}

export async function updateCourseResourceFormAction(formData: FormData): Promise<void> {
  await updateCourseResourceAction(formData);
}

export async function deleteCourseResourceFormAction(formData: FormData): Promise<void> {
  await deleteCourseResourceAction(formData);
}
