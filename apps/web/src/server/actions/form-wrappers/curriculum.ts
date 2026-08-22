"use server";


import type { ActionResult } from "@/lib/errors/action-result";
import {
  createCurriculumModuleAction,
  createCurriculumLessonAction,
  updateCurriculumModuleAction,
  updateCurriculumLessonAction,
} from "../curriculum";

export async function createCurriculumModuleFormAction(formData: FormData): Promise<ActionResult> {
  return await createCurriculumModuleAction(formData);
}

export async function createCurriculumLessonFormAction(formData: FormData): Promise<ActionResult> {
  return await createCurriculumLessonAction(formData);
}

export async function updateCurriculumModuleFormAction(formData: FormData): Promise<ActionResult> {
  return await updateCurriculumModuleAction(formData);
}

export async function updateCurriculumLessonFormAction(formData: FormData): Promise<ActionResult> {
  return await updateCurriculumLessonAction(formData);
}
