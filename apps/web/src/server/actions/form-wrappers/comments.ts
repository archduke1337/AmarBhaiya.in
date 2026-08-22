"use server";

import {
  postLessonCommentAction,
  postCourseCommentAction,
} from "../comments";

export async function postLessonCommentFormAction(formData: FormData): Promise<any> {
  return await postLessonCommentAction(formData);
}

export async function postCourseCommentFormAction(formData: FormData): Promise<any> {
  return await postCourseCommentAction(formData);
}
