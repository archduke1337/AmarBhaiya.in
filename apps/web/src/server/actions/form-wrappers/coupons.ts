"use server";

import {
  createCouponAction,
  toggleCouponAction,
  deleteCouponAction,
} from "@/server/actions/coupons";

export async function createCouponFormAction(formData: FormData): Promise<any> {
  return await createCouponAction(formData);
}

export async function toggleCouponFormAction(formData: FormData): Promise<any> {
  return await toggleCouponAction(formData);
}

export async function deleteCouponFormAction(formData: FormData): Promise<any> {
  return await deleteCouponAction(formData);
}
