"use server";


import type { ActionResult } from "@/lib/errors/action-result";
import {
  postLessonCommentAction,
  postCourseCommentAction,
} from "../comments";

export async function postLessonCommentFormAction(formData: FormData): Promise<ActionResult> {
  return await postLessonCommentAction(formData);
}

export async function postCourseCommentFormAction(formData: FormData): Promise<ActionResult> {
  return await postCourseCommentAction(formData);
}
