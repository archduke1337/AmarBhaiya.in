"use server";

import { type ActionResult } from "@/lib/errors/action-result";
import {
  upsertSiteCopyAction,
  createBlogPostAction,
  updateBlogPostAction,
  deleteBlogPostAction,
  checkSlugUniquenessAction,
} from "../marketing";

export async function upsertSiteCopyFormAction(formData: FormData): Promise<ActionResult> {
  return await upsertSiteCopyAction(formData);
}

export async function createBlogPostFormAction(formData: FormData): Promise<ActionResult> {
  return await createBlogPostAction(formData);
}

export async function updateBlogPostFormAction(formData: FormData): Promise<ActionResult> {
  return await updateBlogPostAction(formData);
}

export async function deleteBlogPostFormAction(formData: FormData): Promise<ActionResult> {
  return await deleteBlogPostAction(formData);
}

export async function checkSlugUniquenessFormAction(formData: FormData): Promise<ActionResult<{ available: boolean }>> {
  return checkSlugUniquenessAction(formData);
}
