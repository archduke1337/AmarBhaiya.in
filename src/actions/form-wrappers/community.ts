"use server";

import {
  createForumReplyAction,
  deleteForumReplyAction,
  lockThreadAction,
  unlockThreadAction,
} from "../community";

export async function createForumReplyFormAction(formData: FormData): Promise<void> {
  await createForumReplyAction(formData);
}

export async function deleteForumReplyFormAction(formData: FormData): Promise<void> {
  await deleteForumReplyAction(formData);
}

export async function lockThreadFormAction(formData: FormData): Promise<void> {
  await lockThreadAction(formData);
}

export async function unlockThreadFormAction(formData: FormData): Promise<void> {
  await unlockThreadAction(formData);
}
