"use server";


import type { ActionResult } from "@/lib/errors/action-result";
import {
  createForumThreadAction,
  createCourseDraftAction,
  createLiveSessionAction,
  updateLiveSessionAction,
} from "../dashboard";

export async function createForumThreadFormAction(formData: FormData): Promise<ActionResult> {
  return await createForumThreadAction(formData);
}

export async function createCourseDraftFormAction(formData: FormData): Promise<ActionResult> {
  return await createCourseDraftAction(formData);
}

export async function createLiveSessionFormAction(formData: FormData): Promise<ActionResult> {
  return await createLiveSessionAction(formData);
}

export async function updateLiveSessionFormAction(formData: FormData): Promise<ActionResult> {
  return await updateLiveSessionAction(formData);
}
