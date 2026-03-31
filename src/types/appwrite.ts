// ── Appwrite Document Interfaces ────────────────────────────────────────────
// These map to the collections defined in src/lib/appwrite/config.ts

export interface Course {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
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

export interface Category {
  $id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
  createdBy: string;
}

export interface Module {
  $id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
}

export interface Lesson {
  $id: string;
  moduleId: string;
  courseId: string;
  title: string;
  description: string;
  videoFileId: string;
  duration: number;
  order: number;
  isFree: boolean;
}

export interface Resource {
  $id: string;
  lessonId: string;
  title: string;
  fileId: string;
  type: "pdf" | "link" | "file";
  url: string;
}

export interface Enrollment {
  $id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  paymentId: string;
  accessModel: "free" | "paid" | "subscription";
  isActive: boolean;
}

export interface Progress {
  $id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  completedAt: string;
  percentComplete: number;
}

export interface Quiz {
  $id: string;
  lessonId: string;
  courseId: string;
  title: string;
  passMark: number;
  timeLimit: number;
}

export interface QuizQuestion {
  $id: string;
  quizId: string;
  text: string;
  type: "mcq" | "true_false" | "short_answer";
  options: string[];
  correctAnswer: string;
  order: number;
}

export interface QuizAttempt {
  $id: string;
  userId: string;
  quizId: string;
  score: number;
  answers: string[];
  completedAt: string;
  passed: boolean;
}

export interface Assignment {
  $id: string;
  lessonId: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
}

export interface Submission {
  $id: string;
  assignmentId: string;
  userId: string;
  fileId: string;
  submittedAt: string;
  grade: number;
  feedback: string;
}

export interface Certificate {
  $id: string;
  userId: string;
  courseId: string;
  issuedAt: string;
  fileId: string;
  shareUrl: string;
}

export interface LiveSession {
  $id: string;
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

export interface SessionRsvp {
  $id: string;
  sessionId: string;
  userId: string;
  rsvpedAt: string;
}

export interface CourseComment {
  $id: string;
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

export interface ForumCategory {
  $id: string;
  name: string;
  description: string;
  slug: string;
  order: number;
  createdBy: string;
  threadCount: number;
}

export interface ForumThread {
  $id: string;
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

export interface ForumReply {
  $id: string;
  threadId: string;
  userId: string;
  userName: string;
  userRole: string;
  body: string;
  createdAt: string;
  isDeleted: boolean;
}

export interface Payment {
  $id: string;
  userId: string;
  courseId: string;
  amount: number;
  currency: string;
  method: "razorpay" | "phonepe";
  status: "pending" | "completed" | "failed" | "refunded";
  providerRef: string;
  createdAt: string;
}

export interface Subscription {
  $id: string;
  userId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "cancelled";
  paymentId: string;
}

export interface ModerationAction {
  $id: string;
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

export interface AuditLog {
  $id: string;
  actorId: string;
  actorName: string;
  action: string;
  entity: string;
  entityId: string;
  metadata: string;
  createdAt: string;
}

export interface Notification {
  $id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl: string;
  createdAt: string;
}
