"use server";

import {
  sendNotificationAction,
  broadcastNotificationAction,
} from "../notifications";

export async function sendNotificationFormAction(formData: FormData): Promise<any> {
  return await sendNotificationAction(formData);
}

export async function broadcastNotificationFormAction(formData: FormData): Promise<any> {
  return await broadcastNotificationAction(formData);
}
