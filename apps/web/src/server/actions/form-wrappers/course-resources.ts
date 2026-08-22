"use server";


import type { ActionResult } from "@/lib/errors/action-result";
import {
  createCourseResourceAction,
  updateCourseResourceAction,
  deleteCourseResourceAction,
} from "../course-resources";

export async function createCourseResourceFormAction(formData: FormData): Promise<ActionResult> {
  return await createCourseResourceAction(formData);
}

export async function updateCourseResourceFormAction(formData: FormData): Promise<ActionResult> {
  return await updateCourseResourceAction(formData);
}

export async function deleteCourseResourceFormAction(formData: FormData): Promise<ActionResult> {
  return await deleteCourseResourceAction(formData);
}
