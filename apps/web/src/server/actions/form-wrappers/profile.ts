"use server";

import {
  upsertStudentProfileAction,
  upsertBillingInfoAction,
} from "../profile";

export async function upsertStudentProfileFormAction(formData: FormData): Promise<any> {
  return await upsertStudentProfileAction(formData);
}

export async function upsertBillingInfoFormAction(formData: FormData): Promise<any> {
  return await upsertBillingInfoAction(formData);
}
