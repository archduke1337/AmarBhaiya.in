"use server";

import {
  rsvpToSessionAction,
  changePasswordAction,
  updateDisplayNameAction,
} from "../account";

export async function rsvpToSessionFormAction(formData: FormData): Promise<void> {
  await rsvpToSessionAction(formData);
}

export async function changePasswordFormAction(formData: FormData): Promise<void> {
  await changePasswordAction(formData);
}

export async function updateDisplayNameFormAction(formData: FormData): Promise<void> {
  await updateDisplayNameAction(formData);
}
