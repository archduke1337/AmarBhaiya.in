"use server";

import {
  createCouponAction,
  toggleCouponAction,
  deleteCouponAction,
} from "@/server/actions/coupons";

export async function createCouponFormAction(formData: FormData): Promise<void> {
  await createCouponAction(formData);
}

export async function toggleCouponFormAction(formData: FormData): Promise<void> {
  await toggleCouponAction(formData);
}

export async function deleteCouponFormAction(formData: FormData): Promise<void> {
  await deleteCouponAction(formData);
}
