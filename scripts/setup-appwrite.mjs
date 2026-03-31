#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * amarbhaiya.in — Appwrite Database Setup Script
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Run this AFTER your Appwrite instance is live and configured.
 *
 * Prerequisites:
 *   1. Appwrite self-hosted instance running
 *   2. Project created in Appwrite Console
 *   3. API key generated with full scopes
 *   4. .env file populated with endpoint, project ID, and API key
 *
 * Usage:
 *   node scripts/setup-appwrite.mjs
 *
 * This script creates:
 *   - 1 Database
 *   - 24 Collections with all attributes
 *   - 5 Storage Buckets
 *   - No data is deleted — safe to re-run (will skip existing resources)
 */

import { Client, Databases, Storage, ID, Permission, Role } from "node-appwrite";
import { config } from "dotenv";

config();

// ── Configuration ───────────────────────────────────────────────────────────

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = "amarbhaiya_db";

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error("❌ Missing environment variables. Please set:");
  console.error("   NEXT_PUBLIC_APPWRITE_ENDPOINT");
  console.error("   NEXT_PUBLIC_APPWRITE_PROJECT_ID");
  console.error("   APPWRITE_API_KEY");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

// ── Helpers ─────────────────────────────────────────────────────────────────

async function safeCreate(name, fn) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
  } catch (err) {
    if (err.code === 409) {
      console.log(`  ⏭️  ${name} (already exists)`);
    } else {
      console.error(`  ❌ ${name}: ${err.message}`);
    }
  }
}

async function createStringAttr(collId, key, size, required = false) {
  await safeCreate(`  attr: ${key}`, () =>
    databases.createStringAttribute(DATABASE_ID, collId, key, size, required)
  );
}

async function createIntAttr(collId, key, required = false, defaultVal = undefined) {
  await safeCreate(`  attr: ${key}`, () =>
    databases.createIntegerAttribute(DATABASE_ID, collId, key, required, undefined, undefined, defaultVal)
  );
}

async function createFloatAttr(collId, key, required = false, defaultVal = undefined) {
  await safeCreate(`  attr: ${key}`, () =>
    databases.createFloatAttribute(DATABASE_ID, collId, key, required, undefined, undefined, defaultVal)
  );
}

async function createBoolAttr(collId, key, required = false, defaultVal = undefined) {
  await safeCreate(`  attr: ${key}`, () =>
    databases.createBooleanAttribute(DATABASE_ID, collId, key, required, defaultVal)
  );
}

async function createEmailAttr(collId, key, required = false) {
  await safeCreate(`  attr: ${key}`, () =>
    databases.createEmailAttribute(DATABASE_ID, collId, key, required)
  );
}

async function createEnumAttr(collId, key, elements, required = false, defaultVal = undefined) {
  await safeCreate(`  attr: ${key}`, () =>
    databases.createEnumAttribute(DATABASE_ID, collId, key, elements, required, defaultVal)
  );
}

async function createDatetimeAttr(collId, key, required = false) {
  await safeCreate(`  attr: ${key}`, () =>
    databases.createDatetimeAttribute(DATABASE_ID, collId, key, required)
  );
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🚀 amarbhaiya.in — Appwrite Setup\n");
  console.log(`   Endpoint: ${ENDPOINT}`);
  console.log(`   Project:  ${PROJECT_ID}\n`);

  // ── Create Database ─────────────────────────────────────────────────────
  console.log("📦 Creating database...");
  await safeCreate("Database: amarbhaiya_db", () =>
    databases.create(DATABASE_ID, "amarbhaiya.in")
  );

  // ── Collections ─────────────────────────────────────────────────────────

  // 1. Categories
  console.log("\n📁 Creating collections...\n");

  console.log("1. categories");
  await safeCreate("Collection: categories", () =>
    databases.createCollection(DATABASE_ID, "categories", "categories", [
      Permission.read(Role.any()),
      Permission.create(Role.label("admin")),
      Permission.update(Role.label("admin")),
      Permission.delete(Role.label("admin")),
    ])
  );
  await createStringAttr("categories", "name", 100, true);
  await createStringAttr("categories", "slug", 100, true);
  await createStringAttr("categories", "description", 500);
  await createIntAttr("categories", "order", false, 0);
  await createStringAttr("categories", "createdBy", 50);

  // 2. Courses
  console.log("\n2. courses");
  await safeCreate("Collection: courses", () =>
    databases.createCollection(DATABASE_ID, "courses", "courses", [
      Permission.read(Role.any()),
      Permission.create(Role.label("admin")),
      Permission.create(Role.label("instructor")),
      Permission.update(Role.label("admin")),
      Permission.delete(Role.label("admin")),
    ])
  );
  await createStringAttr("courses", "title", 200, true);
  await createStringAttr("courses", "slug", 200, true);
  await createStringAttr("courses", "description", 5000, true);
  await createStringAttr("courses", "shortDescription", 500);
  await createStringAttr("courses", "instructorId", 50, true);
  await createStringAttr("courses", "instructorName", 200);
  await createStringAttr("courses", "categoryId", 50);
  await createIntAttr("courses", "price", false, 0);
  await createEnumAttr("courses", "accessModel", ["free", "paid", "subscription"], true, "free");
  await createBoolAttr("courses", "isPublished", false, false);
  await createBoolAttr("courses", "isFeatured", false, false);
  await createStringAttr("courses", "thumbnailId", 100);
  await createIntAttr("courses", "totalDuration", false, 0);
  await createIntAttr("courses", "totalLessons", false, 0);
  await createIntAttr("courses", "enrollmentCount", false, 0);
  await createFloatAttr("courses", "rating", false, 0);
  await createIntAttr("courses", "ratingCount", false, 0);

  // 3. Modules
  console.log("\n3. modules");
  await safeCreate("Collection: modules", () =>
    databases.createCollection(DATABASE_ID, "modules", "modules", [
      Permission.read(Role.any()),
      Permission.create(Role.label("admin")),
      Permission.create(Role.label("instructor")),
      Permission.update(Role.label("admin")),
      Permission.update(Role.label("instructor")),
      Permission.delete(Role.label("admin")),
      Permission.delete(Role.label("instructor")),
    ])
  );
  await createStringAttr("modules", "courseId", 50, true);
  await createStringAttr("modules", "title", 200, true);
  await createStringAttr("modules", "description", 1000);
  await createIntAttr("modules", "order", false, 0);

  // 4. Lessons
  console.log("\n4. lessons");
  await safeCreate("Collection: lessons", () =>
    databases.createCollection(DATABASE_ID, "lessons", "lessons", [
      Permission.read(Role.any()),
      Permission.create(Role.label("admin")),
      Permission.create(Role.label("instructor")),
      Permission.update(Role.label("admin")),
      Permission.update(Role.label("instructor")),
      Permission.delete(Role.label("admin")),
      Permission.delete(Role.label("instructor")),
    ])
  );
  await createStringAttr("lessons", "moduleId", 50, true);
  await createStringAttr("lessons", "courseId", 50, true);
  await createStringAttr("lessons", "title", 200, true);
  await createStringAttr("lessons", "description", 2000);
  await createStringAttr("lessons", "videoFileId", 100);
  await createIntAttr("lessons", "duration", false, 0);
  await createIntAttr("lessons", "order", false, 0);
  await createBoolAttr("lessons", "isFree", false, false);

  // 5. Resources
  console.log("\n5. resources");
  await safeCreate("Collection: resources", () =>
    databases.createCollection(DATABASE_ID, "resources", "resources", [
      Permission.read(Role.users()),
      Permission.create(Role.label("admin")),
      Permission.create(Role.label("instructor")),
      Permission.update(Role.label("admin")),
      Permission.update(Role.label("instructor")),
      Permission.delete(Role.label("admin")),
      Permission.delete(Role.label("instructor")),
    ])
  );
  await createStringAttr("resources", "lessonId", 50, true);
  await createStringAttr("resources", "title", 200, true);
  await createStringAttr("resources", "fileId", 100);
  await createEnumAttr("resources", "type", ["pdf", "link", "file"], true, "file");
  await createStringAttr("resources", "url", 500);

  // 6. Enrollments
  console.log("\n6. enrollments");
  await safeCreate("Collection: enrollments", () =>
    databases.createCollection(DATABASE_ID, "enrollments", "enrollments", [
      Permission.read(Role.users()),
      Permission.create(Role.label("admin")),
      Permission.update(Role.label("admin")),
      Permission.delete(Role.label("admin")),
    ])
  );
  await createStringAttr("enrollments", "userId", 50, true);
  await createStringAttr("enrollments", "courseId", 50, true);
  await createDatetimeAttr("enrollments", "enrolledAt", true);
  await createStringAttr("enrollments", "paymentId", 50);
  await createEnumAttr("enrollments", "accessModel", ["free", "paid", "subscription"], true, "free");
  await createBoolAttr("enrollments", "isActive", false, true);

  // 7. Progress
  console.log("\n7. progress");
  await safeCreate("Collection: progress", () =>
    databases.createCollection(DATABASE_ID, "progress", "progress", [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.label("admin")),
    ])
  );
  await createStringAttr("progress", "userId", 50, true);
  await createStringAttr("progress", "courseId", 50, true);
  await createStringAttr("progress", "lessonId", 50, true);
  await createDatetimeAttr("progress", "completedAt");
  await createFloatAttr("progress", "percentComplete", false, 0);

  // 8. Quizzes
  console.log("\n8. quizzes");
  await safeCreate("Collection: quizzes", () =>
    databases.createCollection(DATABASE_ID, "quizzes", "quizzes", [
      Permission.read(Role.users()),
      Permission.create(Role.label("admin")),
      Permission.create(Role.label("instructor")),
      Permission.update(Role.label("admin")),
      Permission.update(Role.label("instructor")),
      Permission.delete(Role.label("admin")),
    ])
  );
  await createStringAttr("quizzes", "lessonId", 50);
  await createStringAttr("quizzes", "courseId", 50, true);
  await createStringAttr("quizzes", "title", 200, true);
  await createIntAttr("quizzes", "passMark", false, 60);
  await createIntAttr("quizzes", "timeLimit", false, 0);

  // 9. Quiz Questions
  console.log("\n9. quiz_questions");
  await safeCreate("Collection: quiz_questions", () =>
    databases.createCollection(DATABASE_ID, "quiz_questions", "quiz_questions", [
      Permission.read(Role.users()),
      Permission.create(Role.label("admin")),
      Permission.create(Role.label("instructor")),
      Permission.update(Role.label("admin")),
      Permission.update(Role.label("instructor")),
      Permission.delete(Role.label("admin")),
    ])
  );
  await createStringAttr("quiz_questions", "quizId", 50, true);
  await createStringAttr("quiz_questions", "text", 2000, true);
  await createEnumAttr("quiz_questions", "type", ["mcq", "true_false", "short_answer"], true, "mcq");
  await createStringAttr("quiz_questions", "correctAnswer", 500, true);
  await createIntAttr("quiz_questions", "order", false, 0);

  // 10. Quiz Attempts
  console.log("\n10. quiz_attempts");
  await safeCreate("Collection: quiz_attempts", () =>
    databases.createCollection(DATABASE_ID, "quiz_attempts", "quiz_attempts", [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.label("admin")),
    ])
  );
  await createStringAttr("quiz_attempts", "userId", 50, true);
  await createStringAttr("quiz_attempts", "quizId", 50, true);
  await createIntAttr("quiz_attempts", "score", false, 0);
  await createDatetimeAttr("quiz_attempts", "completedAt");
  await createBoolAttr("quiz_attempts", "passed", false, false);

  // 11. Assignments
  console.log("\n11. assignments");
  await safeCreate("Collection: assignments", () =>
    databases.createCollection(DATABASE_ID, "assignments", "assignments", [
      Permission.read(Role.users()),
      Permission.create(Role.label("admin")),
      Permission.create(Role.label("instructor")),
      Permission.update(Role.label("admin")),
      Permission.update(Role.label("instructor")),
      Permission.delete(Role.label("admin")),
    ])
  );
  await createStringAttr("assignments", "lessonId", 50);
  await createStringAttr("assignments", "courseId", 50, true);
  await createStringAttr("assignments", "title", 200, true);
  await createStringAttr("assignments", "description", 3000);
  await createDatetimeAttr("assignments", "dueDate");

  // 12. Submissions
  console.log("\n12. submissions");
  await safeCreate("Collection: submissions", () =>
    databases.createCollection(DATABASE_ID, "submissions", "submissions", [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.label("admin")),
      Permission.update(Role.label("instructor")),
    ])
  );
  await createStringAttr("submissions", "assignmentId", 50, true);
  await createStringAttr("submissions", "userId", 50, true);
  await createStringAttr("submissions", "fileId", 100);
  await createDatetimeAttr("submissions", "submittedAt");
  await createIntAttr("submissions", "grade", false, 0);
  await createStringAttr("submissions", "feedback", 2000);

  // 13. Certificates
  console.log("\n13. certificates");
  await safeCreate("Collection: certificates", () =>
    databases.createCollection(DATABASE_ID, "certificates", "certificates", [
      Permission.read(Role.any()),
      Permission.create(Role.label("admin")),
      Permission.update(Role.label("admin")),
      Permission.delete(Role.label("admin")),
    ])
  );
  await createStringAttr("certificates", "userId", 50, true);
  await createStringAttr("certificates", "courseId", 50, true);
  await createDatetimeAttr("certificates", "issuedAt", true);
  await createStringAttr("certificates", "fileId", 100);
  await createStringAttr("certificates", "shareUrl", 200);

  // 14. Live Sessions
  console.log("\n14. live_sessions");
  await safeCreate("Collection: live_sessions", () =>
    databases.createCollection(DATABASE_ID, "live_sessions", "live_sessions", [
      Permission.read(Role.users()),
      Permission.create(Role.label("admin")),
      Permission.create(Role.label("instructor")),
      Permission.update(Role.label("admin")),
      Permission.update(Role.label("instructor")),
      Permission.delete(Role.label("admin")),
    ])
  );
  await createStringAttr("live_sessions", "courseId", 50, true);
  await createStringAttr("live_sessions", "instructorId", 50, true);
  await createStringAttr("live_sessions", "title", 200, true);
  await createStringAttr("live_sessions", "description", 1000);
  await createDatetimeAttr("live_sessions", "scheduledAt", true);
  await createStringAttr("live_sessions", "streamId", 100);
  await createEnumAttr("live_sessions", "status", ["scheduled", "live", "ended"], true, "scheduled");
  await createStringAttr("live_sessions", "recordingUrl", 500);
  await createIntAttr("live_sessions", "duration", false, 0);

  // 15. Session RSVPs
  console.log("\n15. session_rsvps");
  await safeCreate("Collection: session_rsvps", () =>
    databases.createCollection(DATABASE_ID, "session_rsvps", "session_rsvps", [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.delete(Role.users()),
    ])
  );
  await createStringAttr("session_rsvps", "sessionId", 50, true);
  await createStringAttr("session_rsvps", "userId", 50, true);
  await createDatetimeAttr("session_rsvps", "rsvpedAt", true);

  // 16. Course Comments
  console.log("\n16. course_comments");
  await safeCreate("Collection: course_comments", () =>
    databases.createCollection(DATABASE_ID, "course_comments", "course_comments", [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.label("admin")),
      Permission.update(Role.label("moderator")),
      Permission.delete(Role.label("admin")),
      Permission.delete(Role.label("moderator")),
    ])
  );
  await createStringAttr("course_comments", "lessonId", 50, true);
  await createStringAttr("course_comments", "courseId", 50, true);
  await createStringAttr("course_comments", "userId", 50, true);
  await createStringAttr("course_comments", "userName", 200);
  await createStringAttr("course_comments", "userRole", 50);
  await createStringAttr("course_comments", "text", 3000, true);
  await createStringAttr("course_comments", "parentId", 50);
  await createDatetimeAttr("course_comments", "createdAt");
  await createBoolAttr("course_comments", "isPinned", false, false);
  await createBoolAttr("course_comments", "isDeleted", false, false);
  await createIntAttr("course_comments", "likes", false, 0);

  // 17. Forum Categories
  console.log("\n17. forum_categories");
  await safeCreate("Collection: forum_categories", () =>
    databases.createCollection(DATABASE_ID, "forum_categories", "forum_categories", [
      Permission.read(Role.any()),
      Permission.create(Role.label("admin")),
      Permission.update(Role.label("admin")),
      Permission.delete(Role.label("admin")),
    ])
  );
  await createStringAttr("forum_categories", "name", 100, true);
  await createStringAttr("forum_categories", "description", 500);
  await createStringAttr("forum_categories", "slug", 100, true);
  await createIntAttr("forum_categories", "order", false, 0);
  await createStringAttr("forum_categories", "createdBy", 50);
  await createIntAttr("forum_categories", "threadCount", false, 0);

  // 18. Forum Threads
  console.log("\n18. forum_threads");
  await safeCreate("Collection: forum_threads", () =>
    databases.createCollection(DATABASE_ID, "forum_threads", "forum_threads", [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.label("admin")),
      Permission.update(Role.label("moderator")),
      Permission.delete(Role.label("admin")),
      Permission.delete(Role.label("moderator")),
    ])
  );
  await createStringAttr("forum_threads", "forumCatId", 50, true);
  await createStringAttr("forum_threads", "userId", 50, true);
  await createStringAttr("forum_threads", "userName", 200);
  await createStringAttr("forum_threads", "userRole", 50);
  await createStringAttr("forum_threads", "title", 300, true);
  await createStringAttr("forum_threads", "body", 10000, true);
  await createDatetimeAttr("forum_threads", "createdAt");
  await createBoolAttr("forum_threads", "isPinned", false, false);
  await createBoolAttr("forum_threads", "isLocked", false, false);
  await createIntAttr("forum_threads", "replyCount", false, 0);
  await createDatetimeAttr("forum_threads", "lastReplyAt");

  // 19. Forum Replies
  console.log("\n19. forum_replies");
  await safeCreate("Collection: forum_replies", () =>
    databases.createCollection(DATABASE_ID, "forum_replies", "forum_replies", [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.label("admin")),
      Permission.update(Role.label("moderator")),
      Permission.delete(Role.label("admin")),
      Permission.delete(Role.label("moderator")),
    ])
  );
  await createStringAttr("forum_replies", "threadId", 50, true);
  await createStringAttr("forum_replies", "userId", 50, true);
  await createStringAttr("forum_replies", "userName", 200);
  await createStringAttr("forum_replies", "userRole", 50);
  await createStringAttr("forum_replies", "body", 5000, true);
  await createDatetimeAttr("forum_replies", "createdAt");
  await createBoolAttr("forum_replies", "isDeleted", false, false);

  // 20. Payments
  console.log("\n20. payments");
  await safeCreate("Collection: payments", () =>
    databases.createCollection(DATABASE_ID, "payments", "payments", [
      Permission.read(Role.label("admin")),
      Permission.create(Role.label("admin")),
      Permission.update(Role.label("admin")),
    ])
  );
  await createStringAttr("payments", "userId", 50, true);
  await createStringAttr("payments", "courseId", 50, true);
  await createIntAttr("payments", "amount", true);
  await createStringAttr("payments", "currency", 10, false);
  await createEnumAttr("payments", "method", ["razorpay", "phonepe"], true);
  await createEnumAttr("payments", "status", ["pending", "completed", "failed", "refunded"], true, "pending");
  await createStringAttr("payments", "providerRef", 200);
  await createDatetimeAttr("payments", "createdAt", true);

  // 21. Subscriptions
  console.log("\n21. subscriptions");
  await safeCreate("Collection: subscriptions", () =>
    databases.createCollection(DATABASE_ID, "subscriptions", "subscriptions", [
      Permission.read(Role.label("admin")),
      Permission.create(Role.label("admin")),
      Permission.update(Role.label("admin")),
    ])
  );
  await createStringAttr("subscriptions", "userId", 50, true);
  await createStringAttr("subscriptions", "planId", 50, true);
  await createDatetimeAttr("subscriptions", "startDate", true);
  await createDatetimeAttr("subscriptions", "endDate");
  await createEnumAttr("subscriptions", "status", ["active", "expired", "cancelled"], true, "active");
  await createStringAttr("subscriptions", "paymentId", 50);

  // 22. Moderation Actions
  console.log("\n22. moderation_actions");
  await safeCreate("Collection: moderation_actions", () =>
    databases.createCollection(DATABASE_ID, "moderation_actions", "moderation_actions", [
      Permission.read(Role.label("admin")),
      Permission.read(Role.label("moderator")),
      Permission.create(Role.label("admin")),
      Permission.create(Role.label("moderator")),
      Permission.update(Role.label("admin")),
    ])
  );
  await createStringAttr("moderation_actions", "moderatorId", 50, true);
  await createStringAttr("moderation_actions", "moderatorName", 200);
  await createStringAttr("moderation_actions", "targetUserId", 50, true);
  await createStringAttr("moderation_actions", "targetUserName", 200);
  await createEnumAttr("moderation_actions", "action", ["warn", "mute", "timeout", "delete_post", "pin", "unpin", "remove_from_chat", "flag"], true);
  await createEnumAttr("moderation_actions", "scope", ["course", "platform"], true, "platform");
  await createStringAttr("moderation_actions", "reason", 1000, true);
  await createStringAttr("moderation_actions", "duration", 50);
  await createStringAttr("moderation_actions", "entityType", 50);
  await createStringAttr("moderation_actions", "entityId", 50);
  await createDatetimeAttr("moderation_actions", "createdAt");
  await createStringAttr("moderation_actions", "revertedBy", 50);
  await createDatetimeAttr("moderation_actions", "revertedAt");

  // 23. Audit Logs
  console.log("\n23. audit_logs");
  await safeCreate("Collection: audit_logs", () =>
    databases.createCollection(DATABASE_ID, "audit_logs", "audit_logs", [
      Permission.read(Role.label("admin")),
      Permission.create(Role.label("admin")),
    ])
  );
  await createStringAttr("audit_logs", "actorId", 50, true);
  await createStringAttr("audit_logs", "actorName", 200);
  await createStringAttr("audit_logs", "action", 200, true);
  await createStringAttr("audit_logs", "entity", 100, true);
  await createStringAttr("audit_logs", "entityId", 50, true);
  await createStringAttr("audit_logs", "metadata", 5000);
  await createDatetimeAttr("audit_logs", "createdAt", true);

  // 24. Notifications
  console.log("\n24. notifications");
  await safeCreate("Collection: notifications", () =>
    databases.createCollection(DATABASE_ID, "notifications", "notifications", [
      Permission.read(Role.users()),
      Permission.create(Role.label("admin")),
      Permission.update(Role.users()),
      Permission.delete(Role.label("admin")),
    ])
  );
  await createStringAttr("notifications", "userId", 50, true);
  await createStringAttr("notifications", "type", 50, true);
  await createStringAttr("notifications", "title", 200, true);
  await createStringAttr("notifications", "message", 1000, true);
  await createBoolAttr("notifications", "isRead", false, false);
  await createStringAttr("notifications", "actionUrl", 500);
  await createDatetimeAttr("notifications", "createdAt", true);

  // ── Storage Buckets ─────────────────────────────────────────────────────

  console.log("\n\n🪣 Creating storage buckets...\n");

  await safeCreate("Bucket: course_videos", () =>
    storage.createBucket("course_videos", "Course Videos", [
      Permission.read(Role.users()),
      Permission.create(Role.label("admin")),
      Permission.create(Role.label("instructor")),
      Permission.delete(Role.label("admin")),
    ], false, true, undefined, ["video/mp4", "video/webm", "video/quicktime"], 524288000) // 500MB max
  );

  await safeCreate("Bucket: course_thumbnails", () =>
    storage.createBucket("course_thumbnails", "Course Thumbnails", [
      Permission.read(Role.any()),
      Permission.create(Role.label("admin")),
      Permission.create(Role.label("instructor")),
      Permission.delete(Role.label("admin")),
    ], false, true, undefined, ["image/jpeg", "image/png", "image/webp"], 5242880) // 5MB max
  );

  await safeCreate("Bucket: course_resources", () =>
    storage.createBucket("course_resources", "Course Resources", [
      Permission.read(Role.users()),
      Permission.create(Role.label("admin")),
      Permission.create(Role.label("instructor")),
      Permission.delete(Role.label("admin")),
    ], false, true, undefined, ["application/pdf", "application/zip", "text/plain"], 52428800) // 50MB max
  );

  await safeCreate("Bucket: user_avatars", () =>
    storage.createBucket("user_avatars", "User Avatars", [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ], false, true, undefined, ["image/jpeg", "image/png", "image/webp"], 2097152) // 2MB max
  );

  await safeCreate("Bucket: certificates", () =>
    storage.createBucket("certificates", "Certificates", [
      Permission.read(Role.any()),
      Permission.create(Role.label("admin")),
      Permission.delete(Role.label("admin")),
    ], false, true, undefined, ["image/png", "image/jpeg", "application/pdf"], 10485760) // 10MB max
  );

  await safeCreate("Bucket: blog_images", () =>
    storage.createBucket("blog_images", "Blog Images", [
      Permission.read(Role.any()),
      Permission.create(Role.label("admin")),
      Permission.delete(Role.label("admin")),
    ], false, true, undefined, ["image/jpeg", "image/png", "image/webp", "image/gif"], 10485760) // 10MB max
  );

  console.log("\n\n✨ Setup complete! Your Appwrite backend is ready.\n");
  console.log("📌 Next steps:");
  console.log("   1. Add NEXT_PUBLIC_APPWRITE_DATABASE_ID=amarbhaiya_db to .env");
  console.log("   2. Enable OAuth providers in Appwrite Console (Google)");
  console.log("   3. Create your first admin user and assign the 'admin' label\n");
}

main().catch(console.error);
