"use server";

import {
  deleteCourseAction,
  deleteModuleAction,
  deleteLessonAction,
  deleteLiveSessionAction,
} from "../delete";

export async function deleteCourseFormAction(formData: FormData): Promise<any> {
  return await deleteCourseAction(formData);
}

export async function deleteModuleFormAction(formData: FormData): Promise<any> {
  return await deleteModuleAction(formData);
}

export async function deleteLessonFormAction(formData: FormData): Promise<any> {
  return await deleteLessonAction(formData);
}

export async function deleteLiveSessionFormAction(formData: FormData): Promise<any> {
  return await deleteLiveSessionAction(formData);
}
