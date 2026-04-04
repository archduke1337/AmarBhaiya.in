type SubmissionReviewRecord = Record<string, unknown> & {
  $createdAt?: string;
  $updatedAt?: string;
};

export function getSubmissionSubmittedAt(row: SubmissionReviewRecord): string {
  if (typeof row.submittedAt === "string" && row.submittedAt.trim().length > 0) {
    return row.submittedAt;
  }

  if (typeof row.$createdAt === "string" && row.$createdAt.trim().length > 0) {
    return row.$createdAt;
  }

  return "";
}

export function getSubmissionReviewedAt(
  row: SubmissionReviewRecord
): string | null {
  if (typeof row.gradedAt === "string" && row.gradedAt.trim().length > 0) {
    return row.gradedAt;
  }

  const feedback =
    typeof row.feedback === "string" ? row.feedback.trim() : "";
  const grade = Number(row.grade ?? 0);

  if (feedback.length > 0 || grade !== 0) {
    if (typeof row.$updatedAt === "string" && row.$updatedAt.trim().length > 0) {
      return row.$updatedAt;
    }

    const submittedAt = getSubmissionSubmittedAt(row);
    return submittedAt || null;
  }

  return null;
}

export function isSubmissionReviewed(row: SubmissionReviewRecord): boolean {
  return getSubmissionReviewedAt(row) !== null;
}
