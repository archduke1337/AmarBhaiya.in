"use server";

import {
  resolveModerationAction,
  applyModerationAction,
} from "../moderation";

export async function resolveModerationActionFormAction(formData: FormData): Promise<any> {
  return await resolveModerationAction(formData);
}

export async function applyModerationActionFormAction(formData: FormData): Promise<any> {
  return await applyModerationAction(formData);
}
