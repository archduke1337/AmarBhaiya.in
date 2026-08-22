"use server";


import type { ActionResult } from "@/lib/errors/action-result";
import {
  submitAssignmentAction,
  gradeSubmissionAction,
} from "../submissions";

export async function submitAssignmentFormAction(formData: FormData): Promise<ActionResult> {
  return await submitAssignmentAction(formData);
}

export async function gradeSubmissionFormAction(formData: FormData): Promise<ActionResult> {
  return await gradeSubmissionAction(formData);
}
