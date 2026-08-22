"use server";


import type { ActionResult } from "@/lib/errors/action-result";
import {
  cancelSubscriptionAction,
  adminCreateSubscriptionAction,
  adminUpdateSubscriptionAction,
} from "../subscriptions";

export async function cancelSubscriptionFormAction(formData: FormData): Promise<ActionResult> {
  return await cancelSubscriptionAction(formData);
}

export async function adminCreateSubscriptionFormAction(formData: FormData): Promise<ActionResult> {
  return await adminCreateSubscriptionAction(formData);
}

export async function adminUpdateSubscriptionFormAction(formData: FormData): Promise<ActionResult> {
  return await adminUpdateSubscriptionAction(formData);
}
