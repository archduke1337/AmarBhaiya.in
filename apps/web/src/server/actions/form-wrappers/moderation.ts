"use server";


import type { ActionResult } from "@/lib/errors/action-result";
import {
  resolveModerationAction,
  applyModerationAction,
} from "../moderation";

export async function resolveModerationActionFormAction(formData: FormData): Promise<ActionResult> {
  return await resolveModerationAction(formData);
}

export async function applyModerationActionFormAction(formData: FormData): Promise<ActionResult> {
  return await applyModerationAction(formData);
}
