"use server";

import {
  createAssignmentAction,
  deleteAssignmentAction,
} from "../assignments";

export async function createAssignmentFormAction(formData: FormData): Promise<void> {
  await createAssignmentAction(formData);
}

export async function deleteAssignmentFormAction(formData: FormData): Promise<void> {
  await deleteAssignmentAction(formData);
}
