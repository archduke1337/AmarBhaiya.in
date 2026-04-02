// ── Appwrite Row Interfaces ─────────────────────────────────────────────────
// These map exactly to the tables defined in scripts/setup-appwrite.mjs
// and configured in src/lib/appwrite/config.ts

import type { Models } from "appwrite";

// ── Base ────────────────────────────────────────────────────────────────────

/** Every Appwrite document/row has these system fields */
export type AppwriteRow = Models.Document;

// ── Core LMS ────────────────────────────────────────────────────────────────

export interface Category extends AppwriteRow {
  name: string;
  slug: string;
  description: string;
  order: number;
  createdBy: string;
}

export interface Course extends AppwriteRow {
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  instructorId: string;
  instructorName: string;
  categoryId: string;
  price: number;
  accessModel: "free" | "paid" | "subscription";
  isPublished: boolean;
  isFeatured: boolean;
  thumbnailId: string;
  totalDuration: number;
  totalLessons: number;
  enrollmentCount: number;
  rating: number;
  ratingCount: number;
  tags: string[];
  requirements: string[];
  whatYouLearn: string[];
}

export interface Module extends AppwriteRow {
  courseId: string;
  title: string;
  description: string;
  order: number;
}

export interface Lesson extends AppwriteRow {
  moduleId: string;
  courseId: string;
  title: string;
  description: string;
  videoFileId: string;
  duration: number;
  order: number;
  isFree: boolean;
  isFreePreview: boolean;
}

export interface Resource extends AppwriteRow {
  lessonId: string;
  title: string;
  fileId: string;
  type: "pdf" | "link" | "file";
  url: string;
}

// ── Student Progress ────────────────────────────────────────────────────────

export interface Enrollment extends AppwriteRow {
  userId: string;
  courseId: string;
  enrolledAt: string;
  paymentId: string;
  accessModel: "free" | "paid" | "subscription";
  isActive: boolean;
  completedLessons: number;
  progress: number;
  completedAt: string;
  status: "active" | "completed";
}

export interface Progress extends AppwriteRow {
  userId: string;
  courseId: string;
  lessonId: string;
  completedAt: string;
  percentComplete: number;
}

// ── Assessments ─────────────────────────────────────────────────────────────

export interface Quiz extends AppwriteRow {
  lessonId: string;
  courseId: string;
  title: string;
  passMark: number;
  timeLimit: number;
}

export interface QuizQuestion extends AppwriteRow {
  quizId: string;
  text: string;
  type: "mcq" | "true_false" | "short_answer";
  options: string[];
  correctAnswer: string;
  order: number;
}

export interface QuizAttempt extends AppwriteRow {
  userId: string;
  quizId: string;
  score: number;
  answers: string[];
  completedAt: string;
  passed: boolean;
}

export interface Assignment extends AppwriteRow {
  lessonId: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
}

export interface Submission extends AppwriteRow {
  assignmentId: string;
  userId: string;
  fileId: string;
  submittedAt: string;
  grade: number;
  feedback: string;
}

export interface Certificate extends AppwriteRow {
  userId: string;
  courseId: string;
  courseTitle: string;
  userName: string;
  issuedAt: string;
  fileId: string;
  shareUrl: string;
  verificationToken: string;
  isPublished: boolean;
}

// ── Live & Community ────────────────────────────────────────────────────────

export interface LiveSession extends AppwriteRow {
  courseId: string;
  instructorId: string;
  title: string;
  description: string;
  scheduledAt: string;
  streamId: string;
  status: "scheduled" | "live" | "ended";
  recordingUrl: string;
  duration: number;
}

export interface SessionRsvp extends AppwriteRow {
  sessionId: string;
  userId: string;
  rsvpedAt: string;
}

export interface CourseComment extends AppwriteRow {
  lessonId: string;
  courseId: string;
  userId: string;
  userName: string;
  userRole: string;
  text: string;
  parentId: string;
  createdAt: string;
  isPinned: boolean;
  isDeleted: boolean;
  likes: number;
}

export interface ForumCategory extends AppwriteRow {
  name: string;
  description: string;
  slug: string;
  order: number;
  createdBy: string;
  threadCount: number;
}

export interface ForumThread extends AppwriteRow {
  forumCatId: string;
  userId: string;
  userName: string;
  userRole: string;
  title: string;
  body: string;
  createdAt: string;
  isPinned: boolean;
  isLocked: boolean;
  replyCount: number;
  lastReplyAt: string;
}

export interface ForumReply extends AppwriteRow {
  threadId: string;
  userId: string;
  userName: string;
  userRole: string;
  body: string;
  createdAt: string;
  isDeleted: boolean;
}

// ── Payments & Admin ────────────────────────────────────────────────────────

export interface Payment extends AppwriteRow {
  userId: string;
  courseId: string;
  amount: number;
  currency: string;
  method: "razorpay" | "phonepe";
  status: "pending" | "completed" | "failed" | "refunded";
  providerRef: string;
  createdAt: string;
}

export interface Subscription extends AppwriteRow {
  userId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "cancelled";
  paymentId: string;
}

export interface ModerationAction extends AppwriteRow {
  moderatorId: string;
  moderatorName: string;
  targetUserId: string;
  targetUserName: string;
  action: "warn" | "mute" | "timeout" | "delete_post" | "pin" | "unpin" | "remove_from_chat" | "flag";
  scope: "course" | "platform";
  reason: string;
  duration: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  revertedBy: string;
  revertedAt: string;
}

export interface AuditLog extends AppwriteRow {
  actorId: string;
  actorName: string;
  action: string;
  entity: string;
  entityId: string;
  metadata: string;
  createdAt: string;
}

export interface Notification extends AppwriteRow {
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl: string;
  createdAt: string;
}

// ── Marketing & Editorial ─────────────────────────────────────────────────

export interface BlogPostRecord extends AppwriteRow {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  authorName: string;
  publishedAt: string;
  readMinutes: number;
  content: string;
  isPublished: boolean;
}

export interface SiteCopyRecord extends AppwriteRow {
  key: string;
  title: string;
  body: string;
  payload: string;
  updatedAt: string;
  isPublished: boolean;
}
