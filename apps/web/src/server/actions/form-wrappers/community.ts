"use server";


import type { ActionResult } from "@/lib/errors/action-result";
import {
  createForumReplyAction,
  deleteForumReplyAction,
  lockThreadAction,
  unlockThreadAction,
} from "../community";

export async function createForumReplyFormAction(formData: FormData): Promise<ActionResult> {
  return await createForumReplyAction(formData);
}

export async function deleteForumReplyFormAction(formData: FormData): Promise<ActionResult> {
  return await deleteForumReplyAction(formData);
}

export async function lockThreadFormAction(formData: FormData): Promise<ActionResult> {
  return await lockThreadAction(formData);
}

export async function unlockThreadFormAction(formData: FormData): Promise<ActionResult> {
  return await unlockThreadAction(formData);
}
