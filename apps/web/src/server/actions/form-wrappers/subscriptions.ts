"use server";

import {
  cancelSubscriptionAction,
  adminCreateSubscriptionAction,
  adminUpdateSubscriptionAction,
} from "../subscriptions";

export async function cancelSubscriptionFormAction(formData: FormData): Promise<any> {
  return await cancelSubscriptionAction(formData);
}

export async function adminCreateSubscriptionFormAction(formData: FormData): Promise<any> {
  return await adminCreateSubscriptionAction(formData);
}

export async function adminUpdateSubscriptionFormAction(formData: FormData): Promise<any> {
  return await adminUpdateSubscriptionAction(formData);
}
