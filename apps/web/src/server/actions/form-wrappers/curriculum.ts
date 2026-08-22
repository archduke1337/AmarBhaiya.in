"use server";

import {
  createCurriculumModuleAction,
  createCurriculumLessonAction,
  updateCurriculumModuleAction,
  updateCurriculumLessonAction,
} from "../curriculum";

export async function createCurriculumModuleFormAction(formData: FormData): Promise<any> {
  return await createCurriculumModuleAction(formData);
}

export async function createCurriculumLessonFormAction(formData: FormData): Promise<any> {
  return await createCurriculumLessonAction(formData);
}

export async function updateCurriculumModuleFormAction(formData: FormData): Promise<any> {
  return await updateCurriculumModuleAction(formData);
}

export async function updateCurriculumLessonFormAction(formData: FormData): Promise<any> {
  return await updateCurriculumLessonAction(formData);
}
