"use server";

import {
  resolveModerationActionAction,
  applyModerationActionAction,
} from "../moderation";

export async function resolveModerationActionFormAction(formData: FormData): Promise<void> {
  await resolveModerationActionAction(formData);
}

export async function applyModerationActionFormAction(formData: FormData): Promise<void> {
  await applyModerationActionAction(formData);
}
