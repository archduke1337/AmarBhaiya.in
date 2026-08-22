"use server";


import {
  createStandaloneResourceAction,
  updateStandaloneResourceAction,
  deleteStandaloneResourceAction,
} from "../standalone-resources";

export async function createStandaloneResourceFormAction(formData: FormData): Promise<void> {
  await createStandaloneResourceAction(formData);
}

export async function updateStandaloneResourceFormAction(formData: FormData): Promise<void> {
  await updateStandaloneResourceAction(formData);
}

export async function deleteStandaloneResourceFormAction(formData: FormData): Promise<void> {
  await deleteStandaloneResourceAction(formData);
}
