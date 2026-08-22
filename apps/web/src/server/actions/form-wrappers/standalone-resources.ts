"use server";


import type { ActionResult } from "@/lib/errors/action-result";
import {
  createStandaloneResourceAction,
  updateStandaloneResourceAction,
  deleteStandaloneResourceAction,
} from "../standalone-resources";

export async function createStandaloneResourceFormAction(formData: FormData): Promise<ActionResult> {
  return await createStandaloneResourceAction(formData);
}

export async function updateStandaloneResourceFormAction(formData: FormData): Promise<ActionResult> {
  return await updateStandaloneResourceAction(formData);
}

export async function deleteStandaloneResourceFormAction(formData: FormData): Promise<ActionResult> {
  return await deleteStandaloneResourceAction(formData);
}
