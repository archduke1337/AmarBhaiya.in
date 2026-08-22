"use server";


import {
  cancelSubscriptionAction,
  adminCreateSubscriptionAction,
  adminUpdateSubscriptionAction,
} from "../subscriptions";

export async function cancelSubscriptionFormAction(formData: FormData): Promise<void> {
  await cancelSubscriptionAction(formData);
}

export async function adminCreateSubscriptionFormAction(formData: FormData): Promise<void> {
  await adminCreateSubscriptionAction(formData);
}

export async function adminUpdateSubscriptionFormAction(formData: FormData): Promise<void> {
  await adminUpdateSubscriptionAction(formData);
}
