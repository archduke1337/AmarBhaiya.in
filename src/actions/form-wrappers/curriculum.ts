"use server";

import {
  createCurriculumModuleAction,
  createCurriculumLessonAction,
  updateCurriculumModuleAction,
  updateCurriculumLessonAction,
} from "../curriculum";

export async function createCurriculumModuleFormAction(formData: FormData): Promise<void> {
  await createCurriculumModuleAction(formData);
}

export async function createCurriculumLessonFormAction(formData: FormData): Promise<void> {
  await createCurriculumLessonAction(formData);
}

export async function updateCurriculumModuleFormAction(formData: FormData): Promise<void> {
  await updateCurriculumModuleAction(formData);
}

export async function updateCurriculumLessonFormAction(formData: FormData): Promise<void> {
  await updateCurriculumLessonAction(formData);
}
