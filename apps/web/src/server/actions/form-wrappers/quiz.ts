"use server";


import type { ActionResult } from "@/lib/errors/action-result";
import {
  createQuizAction,
  addQuizQuestionAction,
  deleteQuizAction,
} from "../quiz";

export async function createQuizFormAction(formData: FormData): Promise<ActionResult> {
  return await createQuizAction(formData);
}

export async function addQuizQuestionFormAction(formData: FormData): Promise<ActionResult> {
  return await addQuizQuestionAction(formData);
}

export async function deleteQuizFormAction(formData: FormData): Promise<ActionResult> {
  return await deleteQuizAction(formData);
}
