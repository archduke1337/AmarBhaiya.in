"use server";

import { type ActionResult } from "@/lib/errors/action-result";
import {
  upsertSiteCopyAction,
  createBlogPostAction,
  updateBlogPostAction,
  deleteBlogPostAction,
  checkSlugUniquenessAction,
} from "../marketing";

export async function upsertSiteCopyFormAction(formData: FormData): Promise<any> {
  return await upsertSiteCopyAction(formData);
}

export async function createBlogPostFormAction(formData: FormData): Promise<any> {
  return await createBlogPostAction(formData);
}

export async function updateBlogPostFormAction(formData: FormData): Promise<any> {
  return await updateBlogPostAction(formData);
}

export async function deleteBlogPostFormAction(formData: FormData): Promise<any> {
  return await deleteBlogPostAction(formData);
}

export async function checkSlugUniquenessFormAction(formData: FormData): Promise<ActionResult<{ available: boolean }>> {
  return checkSlugUniquenessAction(formData);
}
