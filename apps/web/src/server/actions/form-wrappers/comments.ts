"use server";


import {
  postLessonCommentAction,
  postCourseCommentAction,
} from "../comments";

export async function postLessonCommentFormAction(formData: FormData): Promise<void> {
  await postLessonCommentAction(formData);
}

export async function postCourseCommentFormAction(formData: FormData): Promise<void> {
  await postCourseCommentAction(formData);
}
