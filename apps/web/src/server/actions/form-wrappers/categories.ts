"use server";

import {
  createCategoryAction,
  updateCategoryAction,
} from "../categories";
import {
  deleteCategoryAction,
} from "../delete";

export async function createCategoryFormAction(formData: FormData): Promise<any> {
  return await createCategoryAction(formData);
}

export async function updateCategoryFormAction(formData: FormData): Promise<any> {
  return await updateCategoryAction(formData);
}

export async function deleteCategoryFormAction(formData: FormData): Promise<any> {
  return await deleteCategoryAction(formData);
}
