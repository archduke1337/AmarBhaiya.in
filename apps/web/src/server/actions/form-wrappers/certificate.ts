"use server";


import type { ActionResult } from "@/lib/errors/action-result";
import {
  issueCertificateAction,
} from "../certificate";

export async function issueCertificateFormAction(formData: FormData): Promise<ActionResult> {
  return await issueCertificateAction(formData);
}
