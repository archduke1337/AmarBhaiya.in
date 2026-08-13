"use server";

import {
  issueCertificateAction,
} from "../certificate";

export async function issueCertificateFormAction(formData: FormData): Promise<void> {
  await issueCertificateAction(formData);
}
