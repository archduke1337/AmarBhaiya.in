"use server";

import {
  resolveModerationAction,
  applyModerationAction,
} from "../moderation";

export async function resolveModerationActionFormAction(formData: FormData): Promise<void> {
  await resolveModerationAction(formData);
}

export async function applyModerationActionFormAction(formData: FormData): Promise<void> {
  await applyModerationAction(formData);
}
