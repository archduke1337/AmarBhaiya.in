"use server";

import {
  rsvpToSessionAction,
  changePasswordAction,
  updateDisplayNameAction,
} from "../account";

export async function rsvpToSessionFormAction(formData: FormData): Promise<any> {
  return await rsvpToSessionAction(formData);
}

export async function changePasswordFormAction(formData: FormData): Promise<any> {
  return await changePasswordAction(formData);
}

export async function updateDisplayNameFormAction(formData: FormData): Promise<any> {
  return await updateDisplayNameAction(formData);
}
