"use server";


import type { ActionResult } from "@/lib/errors/action-result";
import {
  rsvpToSessionAction,
  changePasswordAction,
  updateDisplayNameAction,
} from "../account";

export async function rsvpToSessionFormAction(formData: FormData): Promise<ActionResult> {
  return await rsvpToSessionAction(formData);
}

export async function changePasswordFormAction(formData: FormData): Promise<ActionResult> {
  return await changePasswordAction(formData);
}

export async function updateDisplayNameFormAction(formData: FormData): Promise<ActionResult> {
  return await updateDisplayNameAction(formData);
}
