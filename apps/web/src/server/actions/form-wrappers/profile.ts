"use server";


import {
  upsertStudentProfileAction,
  upsertBillingInfoAction,
} from "../profile";

export async function upsertStudentProfileFormAction(formData: FormData): Promise<void> {
  await upsertStudentProfileAction(formData);
}

export async function upsertBillingInfoFormAction(formData: FormData): Promise<void> {
  await upsertBillingInfoAction(formData);
}
