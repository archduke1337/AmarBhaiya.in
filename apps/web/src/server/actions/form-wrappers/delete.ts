"use server";


import {
  deleteCourseAction,
  deleteModuleAction,
  deleteLessonAction,
  deleteLiveSessionAction,
} from "../delete";

export async function deleteCourseFormAction(formData: FormData): Promise<void> {
  await deleteCourseAction(formData);
}

export async function deleteModuleFormAction(formData: FormData): Promise<void> {
  await deleteModuleAction(formData);
}

export async function deleteLessonFormAction(formData: FormData): Promise<void> {
  await deleteLessonAction(formData);
}

export async function deleteLiveSessionFormAction(formData: FormData): Promise<void> {
  await deleteLiveSessionAction(formData);
}
