"use server";


import type { ActionResult } from "@/lib/errors/action-result";
import {
  createCouponAction,
  toggleCouponAction,
  deleteCouponAction,
} from "@/server/actions/coupons";

export async function createCouponFormAction(formData: FormData): Promise<ActionResult> {
  return await createCouponAction(formData);
}

export async function toggleCouponFormAction(formData: FormData): Promise<ActionResult> {
  return await toggleCouponAction(formData);
}

export async function deleteCouponFormAction(formData: FormData): Promise<ActionResult> {
  return await deleteCouponAction(formData);
}
