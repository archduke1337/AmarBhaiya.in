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
