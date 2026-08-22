"use server";

import {
  createAssignmentAction,
  deleteAssignmentAction,
} from "../assignments";

export async function createAssignmentFormAction(formData: FormData): Promise<any> {
  return await createAssignmentAction(formData);
}

export async function deleteAssignmentFormAction(formData: FormData): Promise<any> {
  return await deleteAssignmentAction(formData);
}
