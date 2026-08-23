import { z } from "zod";

export const billingInfoSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required.").max(100),
    lastName: z.string().trim().min(1, "Last name is required.").max(100),
    phone: z.string().trim().min(1, "Phone is required.").max(20),
    parentName: z.string().trim().max(200).optional().or(z.literal("")),
    parentPhone: z.string().trim().max(20).optional().or(z.literal("")),
    addressLine1: z.string().trim().min(1, "Address is required.").max(300),
    addressLine2: z.string().max(300).optional().or(z.literal("")),
    city: z.string().trim().min(1, "City is required.").max(100),
    state: z.string().trim().min(1, "State is required.").max(100),
    country: z.string().trim().min(1, "Country is required.").max(100),
    zipcode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code.").max(20),
  })
  .refine(
    (data) => {
      if (data.phone && data.parentPhone && data.phone.trim() && data.parentPhone.trim() && data.phone === data.parentPhone) {
        return false;
      }
      return true;
    },
    { message: "Student phone and parent phone cannot be the same.", path: ["parentPhone"] }
  );

export type BillingInfoInput = z.infer<typeof billingInfoSchema>;
