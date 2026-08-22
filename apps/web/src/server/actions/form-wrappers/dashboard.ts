"use server";

import {
  createForumThreadAction,
  createCourseDraftAction,
  createLiveSessionAction,
  updateLiveSessionAction,
} from "../dashboard";

export async function createForumThreadFormAction(formData: FormData): Promise<any> {
  return await createForumThreadAction(formData);
}

export async function createCourseDraftFormAction(formData: FormData): Promise<any> {
  return await createCourseDraftAction(formData);
}

export async function createLiveSessionFormAction(formData: FormData): Promise<any> {
  return await createLiveSessionAction(formData);
}

export async function updateLiveSessionFormAction(formData: FormData): Promise<any> {
  return await updateLiveSessionAction(formData);
}
