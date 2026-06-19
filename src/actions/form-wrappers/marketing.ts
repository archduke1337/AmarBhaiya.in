"use server";

import {
  upsertSiteCopyAction,
  createBlogPostAction,
  updateBlogPostAction,
  deleteBlogPostAction,
  checkSlugUniquenessAction,
} from "../marketing";

export async function upsertSiteCopyFormAction(formData: FormData): Promise<void> {
  await upsertSiteCopyAction(formData);
}

export async function createBlogPostFormAction(formData: FormData): Promise<void> {
  await createBlogPostAction(formData);
}

export async function updateBlogPostFormAction(formData: FormData): Promise<void> {
  await updateBlogPostAction(formData);
}

export async function deleteBlogPostFormAction(formData: FormData): Promise<void> {
  await deleteBlogPostAction(formData);
}

export async function checkSlugUniquenessFormAction(formData: FormData): Promise<ActionResult> {
  return checkSlugUniquenessAction(formData);
}

import { type ActionResult } from "@/lib/errors/action-result";
