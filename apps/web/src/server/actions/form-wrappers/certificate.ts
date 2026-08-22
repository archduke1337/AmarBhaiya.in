"use server";

import {
  issueCertificateAction,
} from "../certificate";

export async function issueCertificateFormAction(formData: FormData): Promise<any> {
  return await issueCertificateAction(formData);
}
