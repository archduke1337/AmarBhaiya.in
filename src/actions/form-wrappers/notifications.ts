"use server";

import {
  sendNotificationAction,
  broadcastNotificationAction,
} from "../notifications";

export async function sendNotificationFormAction(formData: FormData): Promise<void> {
  await sendNotificationAction(formData);
}

export async function broadcastNotificationFormAction(formData: FormData): Promise<void> {
  await broadcastNotificationAction(formData);
}
