"use server";

// ── Curriculum ──────────────────────────────────────────────────────────────

import {
  createCurriculumModuleAction,
  createCurriculumLessonAction,
  updateCurriculumModuleAction,
  updateCurriculumLessonAction,
} from "./curriculum";

export async function createCurriculumModuleFormAction(formData: FormData): Promise<void> {
  await createCurriculumModuleAction(formData);
}

export async function createCurriculumLessonFormAction(formData: FormData): Promise<void> {
  await createCurriculumLessonAction(formData);
}

export async function updateCurriculumModuleFormAction(formData: FormData): Promise<void> {
  await updateCurriculumModuleAction(formData);
}

export async function updateCurriculumLessonFormAction(formData: FormData): Promise<void> {
  await updateCurriculumLessonAction(formData);
}

// ── Quiz ────────────────────────────────────────────────────────────────────

import {
  createQuizAction,
  addQuizQuestionAction,
  deleteQuizAction,
} from "./quiz";

export async function createQuizFormAction(formData: FormData): Promise<void> {
  await createQuizAction(formData);
}

export async function addQuizQuestionFormAction(formData: FormData): Promise<void> {
  await addQuizQuestionAction(formData);
}

export async function deleteQuizFormAction(formData: FormData): Promise<void> {
  await deleteQuizAction(formData);
}

// ── Assignments ─────────────────────────────────────────────────────────────

import {
  createAssignmentAction,
  deleteAssignmentAction,
} from "./assignments";

export async function createAssignmentFormAction(formData: FormData): Promise<void> {
  await createAssignmentAction(formData);
}

export async function deleteAssignmentFormAction(formData: FormData): Promise<void> {
  await deleteAssignmentAction(formData);
}

// ── Course Resources ────────────────────────────────────────────────────────

import {
  createCourseResourceAction,
  updateCourseResourceAction,
  deleteCourseResourceAction,
} from "./course-resources";

export async function createCourseResourceFormAction(formData: FormData): Promise<void> {
  await createCourseResourceAction(formData);
}

export async function updateCourseResourceFormAction(formData: FormData): Promise<void> {
  await updateCourseResourceAction(formData);
}

export async function deleteCourseResourceFormAction(formData: FormData): Promise<void> {
  await deleteCourseResourceAction(formData);
}

// ── Standalone Resources ────────────────────────────────────────────────────

import {
  createStandaloneResourceAction,
  updateStandaloneResourceAction,
  deleteStandaloneResourceAction,
} from "./standalone-resources";

export async function createStandaloneResourceFormAction(formData: FormData): Promise<void> {
  await createStandaloneResourceAction(formData);
}

export async function updateStandaloneResourceFormAction(formData: FormData): Promise<void> {
  await updateStandaloneResourceAction(formData);
}

export async function deleteStandaloneResourceFormAction(formData: FormData): Promise<void> {
  await deleteStandaloneResourceAction(formData);
}

// ── Submissions ─────────────────────────────────────────────────────────────

import {
  submitAssignmentAction,
  gradeSubmissionAction,
} from "./submissions";

export async function submitAssignmentFormAction(formData: FormData): Promise<void> {
  await submitAssignmentAction(formData);
}

export async function gradeSubmissionFormAction(formData: FormData): Promise<void> {
  await gradeSubmissionAction(formData);
}

// ── Certificate ─────────────────────────────────────────────────────────────

import {
  issueCertificateAction,
} from "./certificate";

export async function issueCertificateFormAction(formData: FormData): Promise<void> {
  await issueCertificateAction(formData);
}

// ── Categories ──────────────────────────────────────────────────────────────

import {
  createCategoryAction,
  updateCategoryAction,
} from "./categories";
import {
  deleteCategoryAction,
} from "./delete";

export async function createCategoryFormAction(formData: FormData): Promise<void> {
  await createCategoryAction(formData);
}

export async function updateCategoryFormAction(formData: FormData): Promise<void> {
  await updateCategoryAction(formData);
}

export async function deleteCategoryFormAction(formData: FormData): Promise<void> {
  await deleteCategoryAction(formData);
}

// ── Delete (Course/Module/Lesson/Session) ───────────────────────────────────

import {
  deleteCourseAction,
  deleteModuleAction,
  deleteLessonAction,
  deleteLiveSessionAction,
} from "./delete";

export async function deleteCourseFormAction(formData: FormData): Promise<void> {
  await deleteCourseAction(formData);
}

export async function deleteModuleFormAction(formData: FormData): Promise<void> {
  await deleteModuleAction(formData);
}

export async function deleteLessonFormAction(formData: FormData): Promise<void> {
  await deleteLessonAction(formData);
}

export async function deleteLiveSessionFormAction(formData: FormData): Promise<void> {
  await deleteLiveSessionAction(formData);
}

// ── Dashboard ───────────────────────────────────────────────────────────────

import {
  createForumThreadAction,
  createCourseDraftAction,
  createLiveSessionAction,
  updateLiveSessionAction,
} from "./dashboard";

export async function createForumThreadFormAction(formData: FormData): Promise<void> {
  await createForumThreadAction(formData);
}

export async function createCourseDraftFormAction(formData: FormData): Promise<void> {
  await createCourseDraftAction(formData);
}

export async function createLiveSessionFormAction(formData: FormData): Promise<void> {
  await createLiveSessionAction(formData);
}

export async function updateLiveSessionFormAction(formData: FormData): Promise<void> {
  await updateLiveSessionAction(formData);
}

// ── Marketing ───────────────────────────────────────────────────────────────

import {
  upsertSiteCopyAction,
  createBlogPostAction,
  updateBlogPostAction,
  deleteBlogPostAction,
} from "./marketing";

export async function upsertSiteCopyFormAction(formData: FormData): Promise<void> {
  await upsertSiteCopyAction(formData);
}

export async function createBlogPostFormAction(formData: FormData): Promise<void> {
  await createBlogPostAction(formData);
}

export async function updateBlogPostFormAction(formData: FormData): Promise<void> {
  await updateBlogPostAction(formData);
}

export async function deleteBlogPostFormAction(formData: FormData): Promise<void> {
  await deleteBlogPostAction(formData);
}

// ── Moderation ──────────────────────────────────────────────────────────────

import {
  resolveModerationActionAction,
  applyModerationActionAction,
} from "./moderation";

export async function resolveModerationActionFormAction(formData: FormData): Promise<void> {
  await resolveModerationActionAction(formData);
}

export async function applyModerationActionFormAction(formData: FormData): Promise<void> {
  await applyModerationActionAction(formData);
}

// ── Operations ──────────────────────────────────────────────────────────────

import {
  updateInstructorCourseAction,
  updateCourseVisibilityAction,
  updateUserRoleAction,
} from "./operations";

export async function updateInstructorCourseFormAction(formData: FormData): Promise<void> {
  await updateInstructorCourseAction(formData);
}

export async function updateCourseVisibilityFormAction(formData: FormData): Promise<void> {
  await updateCourseVisibilityAction(formData);
}

export async function updateUserRoleFormAction(formData: FormData): Promise<void> {
  await updateUserRoleAction(formData);
}

// ── Subscriptions ───────────────────────────────────────────────────────────

import {
  cancelSubscriptionAction,
  adminCreateSubscriptionAction,
  adminUpdateSubscriptionAction,
} from "./subscriptions";

export async function cancelSubscriptionFormAction(formData: FormData): Promise<void> {
  await cancelSubscriptionAction(formData);
}

export async function adminCreateSubscriptionFormAction(formData: FormData): Promise<void> {
  await adminCreateSubscriptionAction(formData);
}

export async function adminUpdateSubscriptionFormAction(formData: FormData): Promise<void> {
  await adminUpdateSubscriptionAction(formData);
}

// ── Profile ─────────────────────────────────────────────────────────────────

import {
  upsertStudentProfileAction,
  upsertBillingInfoAction,
} from "./profile";

export async function upsertStudentProfileFormAction(formData: FormData): Promise<void> {
  await upsertStudentProfileAction(formData);
}

export async function upsertBillingInfoFormAction(formData: FormData): Promise<void> {
  await upsertBillingInfoAction(formData);
}

// ── Notifications ────────────────────────────────────────────────────────────

import {
  sendNotificationAction,
  broadcastNotificationAction,
} from "./notifications";

export async function sendNotificationFormAction(formData: FormData): Promise<void> {
  await sendNotificationAction(formData);
}

export async function broadcastNotificationFormAction(formData: FormData): Promise<void> {
  await broadcastNotificationAction(formData);
}

// ── Community ────────────────────────────────────────────────────────────────

import {
  createForumReplyAction,
  deleteForumReplyAction,
  lockThreadAction,
  unlockThreadAction,
} from "./community";

export async function createForumReplyFormAction(formData: FormData): Promise<void> {
  await createForumReplyAction(formData);
}

export async function deleteForumReplyFormAction(formData: FormData): Promise<void> {
  await deleteForumReplyAction(formData);
}

export async function lockThreadFormAction(formData: FormData): Promise<void> {
  await lockThreadAction(formData);
}

export async function unlockThreadFormAction(formData: FormData): Promise<void> {
  await unlockThreadAction(formData);
}

// ── Comments ─────────────────────────────────────────────────────────────────

import {
  postLessonCommentAction,
  postCourseCommentAction,
} from "./comments";

export async function postLessonCommentFormAction(formData: FormData): Promise<void> {
  await postLessonCommentAction(formData);
}

export async function postCourseCommentFormAction(formData: FormData): Promise<void> {
  await postCourseCommentAction(formData);
}

// ── Account ─────────────────────────────────────────────────────────────────

import {
  rsvpToSessionAction,
  changePasswordAction,
  updateDisplayNameAction,
} from "./account";

export async function rsvpToSessionFormAction(formData: FormData): Promise<void> {
  await rsvpToSessionAction(formData);
}

export async function changePasswordFormAction(formData: FormData): Promise<void> {
  await changePasswordAction(formData);
}

export async function updateDisplayNameFormAction(formData: FormData): Promise<void> {
  await updateDisplayNameAction(formData);
}
