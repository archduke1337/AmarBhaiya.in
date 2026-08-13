"use server";

import {
  submitAssignmentAction,
  gradeSubmissionAction,
} from "../submissions";

export async function submitAssignmentFormAction(formData: FormData): Promise<void> {
  await submitAssignmentAction(formData);
}

export async function gradeSubmissionFormAction(formData: FormData): Promise<void> {
  await gradeSubmissionAction(formData);
}
