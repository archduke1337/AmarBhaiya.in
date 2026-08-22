"use server";

import {
  createStandaloneResourceAction,
  updateStandaloneResourceAction,
  deleteStandaloneResourceAction,
} from "../standalone-resources";

export async function createStandaloneResourceFormAction(formData: FormData): Promise<any> {
  return await createStandaloneResourceAction(formData);
}

export async function updateStandaloneResourceFormAction(formData: FormData): Promise<any> {
  return await updateStandaloneResourceAction(formData);
}

export async function deleteStandaloneResourceFormAction(formData: FormData): Promise<any> {
  return await deleteStandaloneResourceAction(formData);
}
