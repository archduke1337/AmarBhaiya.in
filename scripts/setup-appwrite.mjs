#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * amarbhaiya.in — Appwrite Database Setup Script (v2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Uses TablesDB (not deprecated Databases) with object-params style.
 * Creates tables with inline columns + indexes in a single call.
 *
 * Prerequisites:
 *   1. Appwrite instance running (cloud or self-hosted)
 *   2. Project created in Appwrite Console
 *   3. API key generated with full scopes
 *   4. .env file populated
 *
 * Usage:
 *   node scripts/setup-appwrite.mjs
 */

import { Client, TablesDB, Storage, Permission, Role } from "node-appwrite";
import { config } from "dotenv";

config();

// ── Configuration ───────────────────────────────────────────────────────────

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DB = "amarbhaiya_db";

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error("❌ Missing environment variables. Set:");
  console.error("   NEXT_PUBLIC_APPWRITE_ENDPOINT");
  console.error("   NEXT_PUBLIC_APPWRITE_PROJECT_ID");
  console.error("   APPWRITE_API_KEY");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const tablesDB = new TablesDB(client);
const storage = new Storage(client);

// ── Helpers ─────────────────────────────────────────────────────────────────

async function safe(name, fn) {
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

// Column shorthand helpers
const varchar = (key, size, required = false) => ({ key, type: "varchar", size, required });
const text = (key, required = false) => ({ key, type: "text", required });
const mediumtext = (key, required = false) => ({ key, type: "mediumtext", required });
const integer = (key, required = false, xdefault = undefined) => ({ key, type: "integer", required, ...(xdefault !== undefined && { xdefault }) });
const float = (key, required = false, xdefault = undefined) => ({ key, type: "float", required, ...(xdefault !== undefined && { xdefault }) });
const boolean = (key, required = false, xdefault = undefined) => ({ key, type: "boolean", required, ...(xdefault !== undefined && { xdefault }) });
const datetime = (key, required = false) => ({ key, type: "datetime", required });
const enumCol = (key, elements, required = false, xdefault = undefined) => ({ key, type: "enum", elements, required, ...(xdefault !== undefined && { xdefault }) });
const url = (key, required = false) => ({ key, type: "url", required });
const email = (key, required = false) => ({ key, type: "email", required });
const varcharArray = (key, size, required = false) => ({ key, type: "varchar", size, required, array: true });

// Index shorthand
const idx = (key, attributes, type = "key") => ({ key, type, attributes });
const unique = (key, attributes) => ({ key, type: "unique", attributes });
const fulltext = (key, attributes) => ({ key, type: "fulltext", attributes });

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🚀 amarbhaiya.in — Appwrite Setup (v2 — TablesDB)\n");
  console.log(`   Endpoint: ${ENDPOINT}`);
  console.log(`   Project:  ${PROJECT_ID}\n`);

  // ── Create Database ─────────────────────────────────────────────────────
  console.log("📦 Creating database...");
  await safe("Database: amarbhaiya_db", () =>
    tablesDB.create({ databaseId: DB, name: "amarbhaiya.in" })
  );

  // ── Tables ──────────────────────────────────────────────────────────────

  console.log("\n📁 Creating tables...\n");

  // 1. categories
  console.log("1. categories");
  await safe("Table: categories", () =>
    tablesDB.createTable({
      databaseId: DB, tableId: "categories", name: "categories",
      permissions: [
        Permission.read(Role.any()),
        Permission.create(Role.label("admin")),
        Permission.update(Role.label("admin")),
        Permission.delete(Role.label("admin")),
      ],
      columns: [
        varchar("name", 100, true),
        varchar("slug", 100, true),
        text("description"),
        integer("order", false, 0),
        varchar("createdBy", 50),
      ],
      indexes: [
        unique("idx_slug", ["slug"]),
        idx("idx_order", ["order"]),
      ],
    })
  );

  // 2. courses
  console.log("\n2. courses");
  await safe("Table: courses", () =>
    tablesDB.createTable({
      databaseId: DB, tableId: "courses", name: "courses",
      permissions: [
        Permission.read(Role.any()),
        Permission.create(Role.label("admin")),
        Permission.create(Role.label("instructor")),
        Permission.update(Role.label("admin")),
        Permission.delete(Role.label("admin")),
      ],
      columns: [
        varchar("title", 200, true),
        varchar("slug", 200, true),
        mediumtext("description", true),
        text("shortDescription"),
        varchar("instructorId", 50, true),
        varchar("instructorName", 200),
        varchar("categoryId", 50),
        integer("price", false, 0),
        enumCol("accessModel", ["free", "paid", "subscription"], true, "free"),
        boolean("isPublished", false, false),
        boolean("isFeatured", false, false),
        varchar("thumbnailId", 100),
        integer("totalDuration", false, 0),
        integer("totalLessons", false, 0),
        integer("enrollmentCount", false, 0),
        float("rating", false, 0),
        integer("ratingCount", false, 0),
        varcharArray("tags", 50),
        varcharArray("requirements", 200),
        varcharArray("whatYouLearn", 200),
      ],
      indexes: [
        unique("idx_slug", ["slug"]),
        idx("idx_categoryId", ["categoryId"]),
        idx("idx_instructorId", ["instructorId"]),
        idx("idx_isPublished", ["isPublished"]),
        idx("idx_isFeatured", ["isFeatured"]),
        fulltext("idx_title_ft", ["title"]),
      ],
    })
  );

  // 3. modules
  console.log("\n3. modules");
  await safe("Table: modules", () =>
    tablesDB.createTable({
      databaseId: DB, tableId: "modules", name: "modules",
      permissions: [
        Permission.read(Role.any()),
        Permission.create(Role.label("admin")),
        Permission.create(Role.label("instructor")),
        Permission.update(Role.label("admin")),
        Permission.update(Role.label("instructor")),
        Permission.delete(Role.label("admin")),
        Permission.delete(Role.label("instructor")),
      ],
      columns: [
        varchar("courseId", 50, true),
        varchar("title", 200, true),
        text("description"),
        integer("order", false, 0),
      ],
      indexes: [
        idx("idx_courseId", ["courseId"]),
      ],
    })
  );

  // 4. lessons
  console.log("\n4. lessons");
  await safe("Table: lessons", () =>
    tablesDB.createTable({
      databaseId: DB, tableId: "lessons", name: "lessons",
      permissions: [
        Permission.read(Role.any()),
        Permission.create(Role.label("admin")),
        Permission.create(Role.label("instructor")),
        Permission.update(Role.label("admin")),
        Permission.update(Role.label("instructor")),
        Permission.delete(Role.label("admin")),
        Permission.delete(Role.label("instructor")),
      ],
      columns: [
        varchar("moduleId", 50, true),
        varchar("courseId", 50, true),
        varchar("title", 200, true),
        text("description"),
        varchar("videoFileId", 100),
        integer("duration", false, 0),
        integer("order", false, 0),
        boolean("isFree", false, false),
      ],
      indexes: [
        idx("idx_moduleId", ["moduleId"]),
        idx("idx_courseId", ["courseId"]),
        idx("idx_order", ["order"]),
      ],
    })
  );

  // 5. resources
  console.log("\n5. resources");
  await safe("Table: resources", () =>
    tablesDB.createTable({
      databaseId: DB, tableId: "resources", name: "resources",
      permissions: [
        Permission.read(Role.users()),
        Permission.create(Role.label("admin")),
        Permission.create(Role.label("instructor")),
        Permission.update(Role.label("admin")),
        Permission.update(Role.label("instructor")),
        Permission.delete(Role.label("admin")),
        Permission.delete(Role.label("instructor")),
      ],
      columns: [
        varchar("lessonId", 50, true),
        varchar("title", 200, true),
        varchar("fileId", 100),
        enumCol("type", ["pdf", "link", "file"], true, "file"),
        url("url"),
      ],
      indexes: [
        idx("idx_lessonId", ["lessonId"]),
      ],
    })
  );

  // 6. enrollments
  console.log("\n6. enrollments");
  await safe("Table: enrollments", () =>
    tablesDB.createTable({
      databaseId: DB, tableId: "enrollments", name: "enrollments",
      permissions: [
        Permission.read(Role.users()),
        Permission.create(Role.label("admin")),
        Permission.update(Role.label("admin")),
        Permission.delete(Role.label("admin")),
      ],
      rowSecurity: true,
      columns: [
        varchar("userId", 50, true),
        varchar("courseId", 50, true),
        datetime("enrolledAt", true),
        varchar("paymentId", 50),
        enumCol("accessModel", ["free", "paid", "subscription"], true, "free"),
        boolean("isActive", false, true),
      ],
      indexes: [
        idx("idx_userId", ["userId"]),
        idx("idx_courseId", ["courseId"]),
        unique("idx_user_course", ["userId", "courseId"]),
      ],
    })
  );

  // 7. progress
  console.log("\n7. progress");
  await safe("Table: progress", () =>
    tablesDB.createTable({
      databaseId: DB, tableId: "progress", name: "progress",
      permissions: [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.label("admin")),
      ],
      rowSecurity: true,
      columns: [
        varchar("userId", 50, true),
        varchar("courseId", 50, true),
        varchar("lessonId", 50, true),
        datetime("completedAt"),
        float("percentComplete", false, 0),
      ],
      indexes: [
        idx("idx_userId", ["userId"]),
        idx("idx_courseId", ["courseId"]),
        unique("idx_user_lesson", ["userId", "lessonId"]),
      ],
    })
  );

  // 8. quizzes
  console.log("\n8. quizzes");
  await safe("Table: quizzes", () =>
    tablesDB.createTable({
      databaseId: DB, tableId: "quizzes", name: "quizzes",
      permissions: [
        Permission.read(Role.users()),
        Permission.create(Role.label("admin")),
        Permission.create(Role.label("instructor")),
        Permission.update(Role.label("admin")),
        Permission.update(Role.label("instructor")),
        Permission.delete(Role.label("admin")),
      ],
      columns: [
        varchar("lessonId", 50),
        varchar("courseId", 50, true),
        varchar("title", 200, true),
        integer("passMark", false, 60),
        integer("timeLimit", false, 0),
      ],
      indexes: [
        idx("idx_courseId", ["courseId"]),
        idx("idx_lessonId", ["lessonId"]),
      ],
    })
  );

  // 9. quiz_questions
  console.log("\n9. quiz_questions");
  await safe("Table: quiz_questions", () =>
    tablesDB.createTable({
      databaseId: DB, tableId: "quiz_questions", name: "quiz_questions",
      permissions: [
        Permission.read(Role.users()),
        Permission.create(Role.label("admin")),
        Permission.create(Role.label("instructor")),
        Permission.update(Role.label("admin")),
        Permission.update(Role.label("instructor")),
        Permission.delete(Role.label("admin")),
      ],
      columns: [
        varchar("quizId", 50, true),
        text("text", true),
        enumCol("type", ["mcq", "true_false", "short_answer"], true, "mcq"),
        varcharArray("options", 500),
        varchar("correctAnswer", 500, true),
        integer("order", false, 0),
      ],
      indexes: [
        idx("idx_quizId", ["quizId"]),
      ],
    })
  );

  // 10. quiz_attempts
  console.log("\n10. quiz_attempts");
  await safe("Table: quiz_attempts", () =>
    tablesDB.createTable({
      databaseId: DB, tableId: "quiz_attempts", name: "quiz_attempts",
      permissions: [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.label("admin")),
      ],
      rowSecurity: true,
      columns: [
        varchar("userId", 50, true),
        varchar("quizId", 50, true),
        integer("score", false, 0),
        varcharArray("answers", 500),
        datetime("completedAt"),
        boolean("passed", false, false),
      ],
      indexes: [
        idx("idx_userId", ["userId"]),
        idx("idx_quizId", ["quizId"]),
      ],
    })
  );

  // 11. assignments
  console.log("\n11. assignments");
  await safe("Table: assignments", () =>
    tablesDB.createTable({
      databaseId: DB, tableId: "assignments", name: "assignments",
      permissions: [
        Permission.read(Role.users()),
        Permission.create(Role.label("admin")),
        Permission.create(Role.label("instructor")),
        Permission.update(Role.label("admin")),
        Permission.update(Role.label("instructor")),
        Permission.delete(Role.label("admin")),
      ],
      columns: [
        varchar("lessonId", 50),
        varchar("courseId", 50, true),
        varchar("title", 200, true),
        mediumtext("description"),
        datetime("dueDate"),
      ],
      indexes: [
        idx("idx_courseId", ["courseId"]),
        idx("idx_lessonId", ["lessonId"]),
      ],
    })
  );

  // 12. submissions
  console.log("\n12. submissions");
  await safe("Table: submissions", () =>
    tablesDB.createTable({
      databaseId: DB, tableId: "submissions", name: "submissions",
      permissions: [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.label("admin")),
        Permission.update(Role.label("instructor")),
      ],
      rowSecurity: true,
      columns: [
        varchar("assignmentId", 50, true),
        varchar("userId", 50, true),
        varchar("fileId", 100),
        datetime("submittedAt"),
        integer("grade", false, 0),
        text("feedback"),
      ],
      indexes: [
        idx("idx_assignmentId", ["assignmentId"]),
        idx("idx_userId", ["userId"]),
      ],
    })
  );

  // 13. certificates
  console.log("\n13. certificates");
  await safe("Table: certificates", () =>
    tablesDB.createTable({
      databaseId: DB, tableId: "certificates", name: "certificates",
      permissions: [
        Permission.read(Role.any()),
        Permission.create(Role.label("admin")),
        Permission.update(Role.label("admin")),
        Permission.delete(Role.label("admin")),
      ],
      columns: [
        varchar("userId", 50, true),
        varchar("courseId", 50, true),
        datetime("issuedAt", true),
        varchar("fileId", 100),
        url("shareUrl"),
      ],
      indexes: [
        idx("idx_userId", ["userId"]),
        idx("idx_courseId", ["courseId"]),
        unique("idx_user_course", ["userId", "courseId"]),
      ],
    })
  );

  // 14. live_sessions
  console.log("\n14. live_sessions");
  await safe("Table: live_sessions", () =>
    tablesDB.createTable({
      databaseId: DB, tableId: "live_sessions", name: "live_sessions",
      permissions: [
        Permission.read(Role.users()),
        Permission.create(Role.label("admin")),
        Permission.create(Role.label("instructor")),
        Permission.update(Role.label("admin")),
        Permission.update(Role.label("instructor")),
        Permission.delete(Role.label("admin")),
      ],
      columns: [
        varchar("courseId", 50, true),
        varchar("instructorId", 50, true),
        varchar("title", 200, true),
        text("description"),
        datetime("scheduledAt", true),
        varchar("streamId", 100),
        enumCol("status", ["scheduled", "live", "ended"], true, "scheduled"),
        url("recordingUrl"),
        integer("duration", false, 0),
      ],
      indexes: [
        idx("idx_courseId", ["courseId"]),
        idx("idx_instructorId", ["instructorId"]),
        idx("idx_scheduledAt", ["scheduledAt"]),
        idx("idx_status", ["status"]),
      ],
    })
  );

  // 15. session_rsvps
  console.log("\n15. session_rsvps");
  await safe("Table: session_rsvps", () =>
    tablesDB.createTable({
      databaseId: DB, tableId: "session_rsvps", name: "session_rsvps",
      permissions: [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.delete(Role.users()),
      ],
      rowSecurity: true,
      columns: [
        varchar("sessionId", 50, true),
        varchar("userId", 50, true),
        datetime("rsvpedAt", true),
      ],
      indexes: [
        idx("idx_sessionId", ["sessionId"]),
        unique("idx_session_user", ["sessionId", "userId"]),
      ],
    })
  );

  // 16. course_comments
  console.log("\n16. course_comments");
  await safe("Table: course_comments", () =>
    tablesDB.createTable({
      databaseId: DB, tableId: "course_comments", name: "course_comments",
      permissions: [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.label("admin")),
        Permission.update(Role.label("moderator")),
        Permission.delete(Role.label("admin")),
        Permission.delete(Role.label("moderator")),
      ],
      rowSecurity: true,
      columns: [
        varchar("lessonId", 50, true),
        varchar("courseId", 50, true),
        varchar("userId", 50, true),
        varchar("userName", 200),
        varchar("userRole", 50),
        text("text", true),
        varchar("parentId", 50),
        datetime("createdAt"),
        boolean("isPinned", false, false),
        boolean("isDeleted", false, false),
        integer("likes", false, 0),
      ],
      indexes: [
        idx("idx_lessonId", ["lessonId"]),
        idx("idx_courseId", ["courseId"]),
        idx("idx_userId", ["userId"]),
        idx("idx_parentId", ["parentId"]),
      ],
    })
  );

  // 17. forum_categories
  console.log("\n17. forum_categories");
  await safe("Table: forum_categories", () =>
    tablesDB.createTable({
      databaseId: DB, tableId: "forum_categories", name: "forum_categories",
      permissions: [
        Permission.read(Role.any()),
        Permission.create(Role.label("admin")),
        Permission.update(Role.label("admin")),
        Permission.delete(Role.label("admin")),
      ],
      columns: [
        varchar("name", 100, true),
        text("description"),
        varchar("slug", 100, true),
        integer("order", false, 0),
        varchar("createdBy", 50),
        integer("threadCount", false, 0),
      ],
      indexes: [
        unique("idx_slug", ["slug"]),
        idx("idx_order", ["order"]),
      ],
    })
  );

  // 18. forum_threads
  console.log("\n18. forum_threads");
  await safe("Table: forum_threads", () =>
    tablesDB.createTable({
      databaseId: DB, tableId: "forum_threads", name: "forum_threads",
      permissions: [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.label("admin")),
        Permission.update(Role.label("moderator")),
        Permission.delete(Role.label("admin")),
        Permission.delete(Role.label("moderator")),
      ],
      rowSecurity: true,
      columns: [
        varchar("forumCatId", 50, true),
        varchar("userId", 50, true),
        varchar("userName", 200),
        varchar("userRole", 50),
        varchar("title", 300, true),
        mediumtext("body", true),
        datetime("createdAt"),
        boolean("isPinned", false, false),
        boolean("isLocked", false, false),
        integer("replyCount", false, 0),
        datetime("lastReplyAt"),
      ],
      indexes: [
        idx("idx_forumCatId", ["forumCatId"]),
        idx("idx_userId", ["userId"]),
        fulltext("idx_title_ft", ["title"]),
      ],
    })
  );

  // 19. forum_replies
  console.log("\n19. forum_replies");
  await safe("Table: forum_replies", () =>
    tablesDB.createTable({
      databaseId: DB, tableId: "forum_replies", name: "forum_replies",
      permissions: [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.label("admin")),
        Permission.update(Role.label("moderator")),
        Permission.delete(Role.label("admin")),
        Permission.delete(Role.label("moderator")),
      ],
      rowSecurity: true,
      columns: [
        varchar("threadId", 50, true),
        varchar("userId", 50, true),
        varchar("userName", 200),
        varchar("userRole", 50),
        mediumtext("body", true),
        datetime("createdAt"),
        boolean("isDeleted", false, false),
      ],
      indexes: [
        idx("idx_threadId", ["threadId"]),
        idx("idx_userId", ["userId"]),
      ],
    })
  );

  // 20. payments
  console.log("\n20. payments");
  await safe("Table: payments", () =>
    tablesDB.createTable({
      databaseId: DB, tableId: "payments", name: "payments",
      permissions: [
        Permission.read(Role.label("admin")),
        Permission.create(Role.label("admin")),
        Permission.update(Role.label("admin")),
      ],
      columns: [
        varchar("userId", 50, true),
        varchar("courseId", 50, true),
        integer("amount", true),
        varchar("currency", 10),
        enumCol("method", ["razorpay", "phonepe"], true),
        enumCol("status", ["pending", "completed", "failed", "refunded"], true, "pending"),
        varchar("providerRef", 200),
        datetime("createdAt", true),
      ],
      indexes: [
        idx("idx_userId", ["userId"]),
        idx("idx_courseId", ["courseId"]),
        idx("idx_status", ["status"]),
      ],
    })
  );

  // 21. subscriptions
  console.log("\n21. subscriptions");
  await safe("Table: subscriptions", () =>
    tablesDB.createTable({
      databaseId: DB, tableId: "subscriptions", name: "subscriptions",
      permissions: [
        Permission.read(Role.label("admin")),
        Permission.create(Role.label("admin")),
        Permission.update(Role.label("admin")),
      ],
      columns: [
        varchar("userId", 50, true),
        varchar("planId", 50, true),
        datetime("startDate", true),
        datetime("endDate"),
        enumCol("status", ["active", "expired", "cancelled"], true, "active"),
        varchar("paymentId", 50),
      ],
      indexes: [
        idx("idx_userId", ["userId"]),
        idx("idx_status", ["status"]),
      ],
    })
  );

  // 22. moderation_actions
  console.log("\n22. moderation_actions");
  await safe("Table: moderation_actions", () =>
    tablesDB.createTable({
      databaseId: DB, tableId: "moderation_actions", name: "moderation_actions",
      permissions: [
        Permission.read(Role.label("admin")),
        Permission.read(Role.label("moderator")),
        Permission.create(Role.label("admin")),
        Permission.create(Role.label("moderator")),
        Permission.update(Role.label("admin")),
      ],
      columns: [
        varchar("moderatorId", 50, true),
        varchar("moderatorName", 200),
        varchar("targetUserId", 50, true),
        varchar("targetUserName", 200),
        enumCol("action", ["warn", "mute", "timeout", "delete_post", "pin", "unpin", "remove_from_chat", "flag"], true),
        enumCol("scope", ["course", "platform"], true, "platform"),
        text("reason", true),
        varchar("duration", 50),
        varchar("entityType", 50),
        varchar("entityId", 50),
        datetime("createdAt"),
        varchar("revertedBy", 50),
        datetime("revertedAt"),
      ],
      indexes: [
        idx("idx_targetUserId", ["targetUserId"]),
        idx("idx_moderatorId", ["moderatorId"]),
        idx("idx_action", ["action"]),
      ],
    })
  );

  // 23. audit_logs
  console.log("\n23. audit_logs");
  await safe("Table: audit_logs", () =>
    tablesDB.createTable({
      databaseId: DB, tableId: "audit_logs", name: "audit_logs",
      permissions: [
        Permission.read(Role.label("admin")),
        Permission.create(Role.label("admin")),
      ],
      columns: [
        varchar("actorId", 50, true),
        varchar("actorName", 200),
        varchar("action", 200, true),
        varchar("entity", 100, true),
        varchar("entityId", 50, true),
        mediumtext("metadata"),
        datetime("createdAt", true),
      ],
      indexes: [
        idx("idx_actorId", ["actorId"]),
        idx("idx_entity", ["entity"]),
        idx("idx_createdAt", ["createdAt"]),
      ],
    })
  );

  // 24. notifications
  console.log("\n24. notifications");
  await safe("Table: notifications", () =>
    tablesDB.createTable({
      databaseId: DB, tableId: "notifications", name: "notifications",
      permissions: [
        Permission.read(Role.users()),
        Permission.create(Role.label("admin")),
        Permission.update(Role.users()),
        Permission.delete(Role.label("admin")),
      ],
      rowSecurity: true,
      columns: [
        varchar("userId", 50, true),
        varchar("type", 50, true),
        varchar("title", 200, true),
        text("message", true),
        boolean("isRead", false, false),
        url("actionUrl"),
        datetime("createdAt", true),
      ],
      indexes: [
        idx("idx_userId", ["userId"]),
        idx("idx_isRead", ["isRead"]),
        idx("idx_createdAt", ["createdAt"]),
      ],
    })
  );

  // ── Storage Buckets ─────────────────────────────────────────────────────

  console.log("\n\n🪣 Creating storage buckets...\n");

  await safe("Bucket: course_videos", () =>
    storage.createBucket("course_videos", "Course Videos", [
      Permission.read(Role.users()),
      Permission.create(Role.label("admin")),
      Permission.create(Role.label("instructor")),
      Permission.delete(Role.label("admin")),
    ], false, true, undefined, ["video/mp4", "video/webm", "video/quicktime"], 524288000)
  );

  await safe("Bucket: course_thumbnails", () =>
    storage.createBucket("course_thumbnails", "Course Thumbnails", [
      Permission.read(Role.any()),
      Permission.create(Role.label("admin")),
      Permission.create(Role.label("instructor")),
      Permission.delete(Role.label("admin")),
    ], false, true, undefined, ["image/jpeg", "image/png", "image/webp"], 5242880)
  );

  await safe("Bucket: course_resources", () =>
    storage.createBucket("course_resources", "Course Resources", [
      Permission.read(Role.users()),
      Permission.create(Role.label("admin")),
      Permission.create(Role.label("instructor")),
      Permission.delete(Role.label("admin")),
    ], false, true, undefined, ["application/pdf", "application/zip", "text/plain"], 52428800)
  );

  await safe("Bucket: user_avatars", () =>
    storage.createBucket("user_avatars", "User Avatars", [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ], false, true, undefined, ["image/jpeg", "image/png", "image/webp"], 2097152)
  );

  await safe("Bucket: certificates", () =>
    storage.createBucket("certificates", "Certificates", [
      Permission.read(Role.any()),
      Permission.create(Role.label("admin")),
      Permission.delete(Role.label("admin")),
    ], false, true, undefined, ["image/png", "image/jpeg", "application/pdf"], 10485760)
  );

  await safe("Bucket: blog_images", () =>
    storage.createBucket("blog_images", "Blog Images", [
      Permission.read(Role.any()),
      Permission.create(Role.label("admin")),
      Permission.delete(Role.label("admin")),
    ], false, true, undefined, ["image/jpeg", "image/png", "image/webp", "image/gif"], 10485760)
  );

  console.log("\n\n✨ Setup complete! Your Appwrite backend is ready.\n");
  console.log("📌 Next steps:");
  console.log("   1. Run: appwrite generate --language typescript --output ./src/generated");
  console.log("   2. Enable OAuth providers in Appwrite Console (Google)");
  console.log("   3. Create your first admin user and assign the 'admin' label\n");
}

main().catch(console.error);
