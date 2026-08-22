"use server";


import type { ActionResult } from "@/lib/errors/action-result";
import {
  deleteCourseAction,
  deleteModuleAction,
  deleteLessonAction,
  deleteLiveSessionAction,
} from "../delete";

export async function deleteCourseFormAction(formData: FormData): Promise<ActionResult> {
  return await deleteCourseAction(formData);
}

export async function deleteModuleFormAction(formData: FormData): Promise<ActionResult> {
  return await deleteModuleAction(formData);
}

export async function deleteLessonFormAction(formData: FormData): Promise<ActionResult> {
  return await deleteLessonAction(formData);
}

export async function deleteLiveSessionFormAction(formData: FormData): Promise<ActionResult> {
  return await deleteLiveSessionAction(formData);
}
