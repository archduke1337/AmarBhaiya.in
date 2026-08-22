"use server";

import {
  createQuizAction,
  addQuizQuestionAction,
  deleteQuizAction,
} from "../quiz";

export async function createQuizFormAction(formData: FormData): Promise<any> {
  return await createQuizAction(formData);
}

export async function addQuizQuestionFormAction(formData: FormData): Promise<any> {
  return await addQuizQuestionAction(formData);
}

export async function deleteQuizFormAction(formData: FormData): Promise<any> {
  return await deleteQuizAction(formData);
}
