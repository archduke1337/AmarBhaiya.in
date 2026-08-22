"use server";


import type { ActionResult } from "@/lib/errors/action-result";
import {
  createAssignmentAction,
  deleteAssignmentAction,
} from "../assignments";

export async function createAssignmentFormAction(formData: FormData): Promise<ActionResult> {
  return await createAssignmentAction(formData);
}

export async function deleteAssignmentFormAction(formData: FormData): Promise<ActionResult> {
  return await deleteAssignmentAction(formData);
}
