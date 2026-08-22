"use server";


import {
  createForumThreadAction,
  createCourseDraftAction,
  createLiveSessionAction,
  updateLiveSessionAction,
} from "../dashboard";

export async function createForumThreadFormAction(formData: FormData): Promise<void> {
  await createForumThreadAction(formData);
}

export async function createCourseDraftFormAction(formData: FormData): Promise<void> {
  await createCourseDraftAction(formData);
}

export async function createLiveSessionFormAction(formData: FormData): Promise<void> {
  await createLiveSessionAction(formData);
}

export async function updateLiveSessionFormAction(formData: FormData): Promise<void> {
  await updateLiveSessionAction(formData);
}
