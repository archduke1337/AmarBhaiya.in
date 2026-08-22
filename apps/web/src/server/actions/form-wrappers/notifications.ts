"use server";


import type { ActionResult } from "@/lib/errors/action-result";
import {
  sendNotificationAction,
  broadcastNotificationAction,
} from "../notifications";

export async function sendNotificationFormAction(formData: FormData): Promise<ActionResult> {
  return await sendNotificationAction(formData);
}

export async function broadcastNotificationFormAction(formData: FormData): Promise<ActionResult> {
  return await broadcastNotificationAction(formData);
}
