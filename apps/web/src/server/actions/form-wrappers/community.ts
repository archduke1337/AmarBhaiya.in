"use server";

import {
  createForumReplyAction,
  deleteForumReplyAction,
  lockThreadAction,
  unlockThreadAction,
} from "../community";

export async function createForumReplyFormAction(formData: FormData): Promise<any> {
  return await createForumReplyAction(formData);
}

export async function deleteForumReplyFormAction(formData: FormData): Promise<any> {
  return await deleteForumReplyAction(formData);
}

export async function lockThreadFormAction(formData: FormData): Promise<any> {
  return await lockThreadAction(formData);
}

export async function unlockThreadFormAction(formData: FormData): Promise<any> {
  return await unlockThreadAction(formData);
}
