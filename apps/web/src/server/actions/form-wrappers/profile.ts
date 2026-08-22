"use server";


import type { ActionResult } from "@/lib/errors/action-result";
import {
  upsertStudentProfileAction,
  upsertBillingInfoAction,
} from "../profile";

export async function upsertStudentProfileFormAction(formData: FormData): Promise<ActionResult> {
  return await upsertStudentProfileAction(formData);
}

export async function upsertBillingInfoFormAction(formData: FormData): Promise<ActionResult> {
  return await upsertBillingInfoAction(formData);
}
