"use server";

import {
  submitAssignmentAction,
  gradeSubmissionAction,
} from "../submissions";

export async function submitAssignmentFormAction(formData: FormData): Promise<any> {
  return await submitAssignmentAction(formData);
}

export async function gradeSubmissionFormAction(formData: FormData): Promise<any> {
  return await gradeSubmissionAction(formData);
}
