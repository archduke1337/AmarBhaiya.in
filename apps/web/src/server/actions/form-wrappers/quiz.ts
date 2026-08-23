"use server";


import {
  createQuizAction,
  addQuizQuestionAction,
  deleteQuizAction,
} from "../quiz";

export async function createQuizFormAction(formData: FormData): Promise<void> {
  await createQuizAction(formData);
}

export async function addQuizQuestionFormAction(formData: FormData): Promise<void> {
  await addQuizQuestionAction(formData);
}

export async function deleteQuizFormAction(formData: FormData): Promise<void> {
  await deleteQuizAction(formData);
}
