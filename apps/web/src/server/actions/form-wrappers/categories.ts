"use server";


import type { ActionResult } from "@/lib/errors/action-result";
import {
  createCategoryAction,
  updateCategoryAction,
} from "../categories";
import {
  deleteCategoryAction,
} from "../delete";

export async function createCategoryFormAction(formData: FormData): Promise<ActionResult> {
  return await createCategoryAction(formData);
}

export async function updateCategoryFormAction(formData: FormData): Promise<ActionResult> {
  return await updateCategoryAction(formData);
}

export async function deleteCategoryFormAction(formData: FormData): Promise<ActionResult> {
  return await deleteCategoryAction(formData);
}
