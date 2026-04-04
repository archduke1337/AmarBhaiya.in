#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * amarbhaiya.in — Appwrite Database Setup Script (v2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Uses TablesDB (not deprecated Databases) with object-params style.
 * Creates tables, then adds columns individually for proper type support
 * (varchar, text, mediumtext, url, email, enum), then adds indexes.
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
  console.error("❌ Missing environment variables.");
  process.exit(1);
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const db = new TablesDB(client);
const storage = new Storage(client);

// ── Helpers ─────────────────────────────────────────────────────────────────

async function safe(name, fn) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
  } catch (err) {
    if (err.code === 409) console.log(`  ⏭️  ${name} (exists)`);
    else console.error(`  ❌ ${name}: ${err.message}`);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Column creators — all use object-params style
const varchar = (t, key, size, required = false) =>
  safe(`col: ${key}`, () => db.createVarcharColumn({ databaseId: DB, tableId: t, key, size, required }));

const varcharArr = (t, key, size, required = false) =>
  safe(`col: ${key}[]`, () => db.createVarcharColumn({ databaseId: DB, tableId: t, key, size, required, array: true }));

const text = (t, key, required = false) =>
  safe(`col: ${key}`, () => db.createTextColumn({ databaseId: DB, tableId: t, key, required }));

const medtext = (t, key, required = false) =>
  safe(`col: ${key}`, () => db.createMediumtextColumn({ databaseId: DB, tableId: t, key, required }));

const int = (t, key, required = false, xdefault = undefined) =>
  safe(`col: ${key}`, () => db.createIntegerColumn({ databaseId: DB, tableId: t, key, required, ...(xdefault !== undefined && { xdefault }) }));

const float = (t, key, required = false, xdefault = undefined) =>
  safe(`col: ${key}`, () => db.createFloatColumn({ databaseId: DB, tableId: t, key, required, ...(xdefault !== undefined && { xdefault }) }));

const bool = (t, key, required = false, xdefault = undefined) =>
  safe(`col: ${key}`, () => db.createBooleanColumn({ databaseId: DB, tableId: t, key, required, ...(xdefault !== undefined && { xdefault }) }));

const dt = (t, key, required = false) =>
  safe(`col: ${key}`, () => db.createDatetimeColumn({ databaseId: DB, tableId: t, key, required }));

const enumCol = (t, key, elements, required = false, xdefault = undefined) =>
  safe(`col: ${key}`, () => db.createEnumColumn({ databaseId: DB, tableId: t, key, elements, required, ...(!required && xdefault !== undefined && { xdefault }) }));

const urlCol = (t, key, required = false) =>
  safe(`col: ${key}`, () => db.createUrlColumn({ databaseId: DB, tableId: t, key, required }));

// Index creators — wait for columns to be available (Appwrite processes async)
// Only sleep once per table, before the first index
let _lastIndexTable = "";
const idx = async (t, key, cols, type = "key") => {
  if (_lastIndexTable !== t) {
    _lastIndexTable = t;
    await sleep(2000);
  }
  await safe(`idx: ${key}`, () => db.createIndex({ databaseId: DB, tableId: t, key, type, columns: cols }));
};


// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🚀 amarbhaiya.in — Appwrite Setup (v2 — TablesDB)\n");
  console.log(`   Endpoint: ${ENDPOINT}`);
  console.log(`   Project:  ${PROJECT_ID}\n`);

  // ── Database ──────────────────────────────────────────────────────────────
  console.log("📦 Creating database...");
  await safe("Database: amarbhaiya_db", () =>
    db.create({ databaseId: DB, name: "amarbhaiya.in" })
  );

  console.log("\n📁 Creating tables + columns + indexes...\n");

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. categories
  // ═══════════════════════════════════════════════════════════════════════════
  const T1 = "categories";
  console.log(`1. ${T1}`);
  await safe("table", () => db.createTable({
    databaseId: DB, tableId: T1, name: T1,
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.label("admin")),
      Permission.update(Role.label("admin")),
      Permission.delete(Role.label("admin")),
    ],
  }));
  await varchar(T1, "name", 100, true);
  await varchar(T1, "slug", 100, true);
  await text(T1, "description");
  await int(T1, "order", false, 0);
  await varchar(T1, "createdBy", 50);
  await idx(T1, "idx_slug", ["slug"], "unique");
  await idx(T1, "idx_order", ["order"]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. courses
  // ═══════════════════════════════════════════════════════════════════════════
  const T2 = "courses";
  console.log(`\n2. ${T2}`);
  await safe("table", () => db.createTable({
    databaseId: DB, tableId: T2, name: T2,
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.label("admin")),
      Permission.create(Role.label("instructor")),
      Permission.update(Role.label("admin")),
      Permission.delete(Role.label("admin")),
    ],
  }));
  await varchar(T2, "title", 200, true);
  await varchar(T2, "slug", 200, true);
  await medtext(T2, "description", true);
  await text(T2, "shortDescription");
  await varchar(T2, "instructorId", 50, true);
  await varchar(T2, "instructorName", 200);
  await varchar(T2, "categoryId", 50);
  await int(T2, "price", false, 0);
  await enumCol(T2, "accessModel", ["free", "paid", "subscription"], true, "free");
  await bool(T2, "isPublished", false, false);
  await bool(T2, "isFeatured", false, false);
  await varchar(T2, "thumbnailId", 100);
  await varchar(T2, "thumbnailFileId", 100);
  await int(T2, "totalDuration", false, 0);
  await int(T2, "totalLessons", false, 0);
  await int(T2, "enrollmentCount", false, 0);
  await float(T2, "rating", false, 0);
  await int(T2, "ratingCount", false, 0);
  await varcharArr(T2, "tags", 50);
  await varcharArr(T2, "requirements", 200);
  await varcharArr(T2, "whatYouLearn", 200);
  await idx(T2, "idx_slug", ["slug"], "unique");
  await idx(T2, "idx_categoryId", ["categoryId"]);
  await idx(T2, "idx_instructorId", ["instructorId"]);
  await idx(T2, "idx_isPublished", ["isPublished"]);
  await idx(T2, "idx_isFeatured", ["isFeatured"]);
  await idx(T2, "idx_title_ft", ["title"], "fulltext");

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. modules
  // ═══════════════════════════════════════════════════════════════════════════
  const T3 = "modules";
  console.log(`\n3. ${T3}`);
  await safe("table", () => db.createTable({
    databaseId: DB, tableId: T3, name: T3,
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.label("admin")),
      Permission.create(Role.label("instructor")),
      Permission.update(Role.label("admin")),
      Permission.update(Role.label("instructor")),
      Permission.delete(Role.label("admin")),
      Permission.delete(Role.label("instructor")),
    ],
  }));
  await varchar(T3, "courseId", 50, true);
  await varchar(T3, "title", 200, true);
  await text(T3, "description");
  await int(T3, "order", false, 0);
  await idx(T3, "idx_courseId", ["courseId"]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. lessons
  // ═══════════════════════════════════════════════════════════════════════════
  const T4 = "lessons";
  console.log(`\n4. ${T4}`);
  await safe("table", () => db.createTable({
    databaseId: DB, tableId: T4, name: T4,
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.label("admin")),
      Permission.create(Role.label("instructor")),
      Permission.update(Role.label("admin")),
      Permission.update(Role.label("instructor")),
      Permission.delete(Role.label("admin")),
      Permission.delete(Role.label("instructor")),
    ],
  }));
  await varchar(T4, "moduleId", 50, true);
  await varchar(T4, "courseId", 50, true);
  await varchar(T4, "title", 200, true);
  await text(T4, "description");
  await varchar(T4, "videoFileId", 100);
  await int(T4, "duration", false, 0);
  await int(T4, "order", false, 0);
  await bool(T4, "isFree", false, false);
  await bool(T4, "isFreePreview", false, false);
  await idx(T4, "idx_moduleId", ["moduleId"]);
  await idx(T4, "idx_courseId", ["courseId"]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. resources
  // ═══════════════════════════════════════════════════════════════════════════
  const T5 = "resources";
  console.log(`\n5. ${T5}`);
  await safe("table", () => db.createTable({
    databaseId: DB, tableId: T5, name: T5,
    permissions: [
      Permission.read(Role.users()),
      Permission.create(Role.label("admin")),
      Permission.create(Role.label("instructor")),
      Permission.update(Role.label("admin")),
      Permission.update(Role.label("instructor")),
      Permission.delete(Role.label("admin")),
      Permission.delete(Role.label("instructor")),
    ],
  }));
  await varchar(T5, "lessonId", 50, true);
  await varchar(T5, "title", 200, true);
  await varchar(T5, "fileId", 100);
  await enumCol(T5, "type", ["pdf", "link", "file"], true, "file");
  await urlCol(T5, "url");
  await idx(T5, "idx_lessonId", ["lessonId"]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. enrollments
  // ═══════════════════════════════════════════════════════════════════════════
  const T6 = "enrollments";
  console.log(`\n6. ${T6}`);
  await safe("table", () => db.createTable({
    databaseId: DB, tableId: T6, name: T6,
    permissions: [
      Permission.read(Role.users()),
      Permission.create(Role.label("admin")),
      Permission.update(Role.label("admin")),
      Permission.delete(Role.label("admin")),
    ],
    rowSecurity: true,
  }));
  await varchar(T6, "userId", 50, true);
  await varchar(T6, "courseId", 50, true);
  await dt(T6, "enrolledAt", true);
  await varchar(T6, "paymentId", 50);
  await enumCol(T6, "accessModel", ["free", "paid", "subscription"], true, "free");
  await bool(T6, "isActive", false, true);
  await int(T6, "completedLessons", false, 0);
  await int(T6, "progress", false, 0);
  await dt(T6, "completedAt");
  await enumCol(T6, "status", ["active", "completed"], false, "active");
  await idx(T6, "idx_userId", ["userId"]);
  await idx(T6, "idx_courseId", ["courseId"]);
  await idx(T6, "idx_isActive", ["isActive"]);
  await idx(T6, "idx_user_active", ["userId", "isActive"]);
  await idx(T6, "idx_course_active", ["courseId", "isActive"]);
  await idx(T6, "idx_user_course", ["userId", "courseId"], "unique");

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. progress
  // ═══════════════════════════════════════════════════════════════════════════
  const T7 = "progress";
  console.log(`\n7. ${T7}`);
  await safe("table", () => db.createTable({
    databaseId: DB, tableId: T7, name: T7,
    permissions: [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.label("admin")),
    ],
    rowSecurity: true,
  }));
  await varchar(T7, "userId", 50, true);
  await varchar(T7, "courseId", 50, true);
  await varchar(T7, "lessonId", 50, true);
  await dt(T7, "completedAt");
  await float(T7, "percentComplete", false, 0);
  await idx(T7, "idx_userId", ["userId"]);
  await idx(T7, "idx_courseId", ["courseId"]);
  await idx(T7, "idx_user_lesson", ["userId", "lessonId"], "unique");

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. quizzes
  // ═══════════════════════════════════════════════════════════════════════════
  const T8 = "quizzes";
  console.log(`\n8. ${T8}`);
  await safe("table", () => db.createTable({
    databaseId: DB, tableId: T8, name: T8,
    permissions: [
      Permission.read(Role.users()),
      Permission.create(Role.label("admin")),
      Permission.create(Role.label("instructor")),
      Permission.update(Role.label("admin")),
      Permission.update(Role.label("instructor")),
      Permission.delete(Role.label("admin")),
    ],
  }));
  await varchar(T8, "lessonId", 50);
  await varchar(T8, "courseId", 50, true);
  await varchar(T8, "title", 200, true);
  await int(T8, "passMark", false, 60);
  await int(T8, "timeLimit", false, 0);
  await idx(T8, "idx_courseId", ["courseId"]);
  await idx(T8, "idx_lessonId", ["lessonId"]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. quiz_questions
  // ═══════════════════════════════════════════════════════════════════════════
  const T9 = "quiz_questions";
  console.log(`\n9. ${T9}`);
  await safe("table", () => db.createTable({
    databaseId: DB, tableId: T9, name: T9,
    permissions: [
      Permission.read(Role.users()),
      Permission.create(Role.label("admin")),
      Permission.create(Role.label("instructor")),
      Permission.update(Role.label("admin")),
      Permission.update(Role.label("instructor")),
      Permission.delete(Role.label("admin")),
    ],
  }));
  await varchar(T9, "quizId", 50, true);
  await text(T9, "text", true);
  await enumCol(T9, "type", ["mcq", "true_false", "short_answer"], true, "mcq");
  await varcharArr(T9, "options", 500);
  await varchar(T9, "correctAnswer", 500, true);
  await int(T9, "order", false, 0);
  await idx(T9, "idx_quizId", ["quizId"]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. quiz_attempts
  // ═══════════════════════════════════════════════════════════════════════════
  const T10 = "quiz_attempts";
  console.log(`\n10. ${T10}`);
  await safe("table", () => db.createTable({
    databaseId: DB, tableId: T10, name: T10,
    permissions: [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.label("admin")),
    ],
    rowSecurity: true,
  }));
  await varchar(T10, "userId", 50, true);
  await varchar(T10, "quizId", 50, true);
  await int(T10, "score", false, 0);
  await varcharArr(T10, "answers", 500);
  await dt(T10, "completedAt");
  await bool(T10, "passed", false, false);
  await idx(T10, "idx_userId", ["userId"]);
  await idx(T10, "idx_quizId", ["quizId"]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. assignments
  // ═══════════════════════════════════════════════════════════════════════════
  const T11 = "assignments";
  console.log(`\n11. ${T11}`);
  await safe("table", () => db.createTable({
    databaseId: DB, tableId: T11, name: T11,
    permissions: [
      Permission.read(Role.users()),
      Permission.create(Role.label("admin")),
      Permission.create(Role.label("instructor")),
      Permission.update(Role.label("admin")),
      Permission.update(Role.label("instructor")),
      Permission.delete(Role.label("admin")),
    ],
  }));
  await varchar(T11, "lessonId", 50);
  await varchar(T11, "courseId", 50, true);
  await varchar(T11, "title", 200, true);
  await medtext(T11, "description");
  await dt(T11, "dueDate");
  await idx(T11, "idx_courseId", ["courseId"]);
  await idx(T11, "idx_lessonId", ["lessonId"]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. submissions
  // ═══════════════════════════════════════════════════════════════════════════
  const T12 = "submissions";
  console.log(`\n12. ${T12}`);
  await safe("table", () => db.createTable({
    databaseId: DB, tableId: T12, name: T12,
    permissions: [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.label("admin")),
      Permission.update(Role.label("instructor")),
    ],
    rowSecurity: true,
  }));
  await varchar(T12, "assignmentId", 50, true);
  await varchar(T12, "userId", 50, true);
  await varchar(T12, "fileId", 100);
  await dt(T12, "submittedAt");
  await dt(T12, "gradedAt");
  await int(T12, "grade", false, 0);
  await text(T12, "feedback");
  await idx(T12, "idx_assignmentId", ["assignmentId"]);
  await idx(T12, "idx_userId", ["userId"]);
  await idx(T12, "idx_assignment_user", ["assignmentId", "userId"], "unique");

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. certificates
  // ═══════════════════════════════════════════════════════════════════════════
  const T13 = "certificates";
  console.log(`\n13. ${T13}`);
  await safe("table", () => db.createTable({
    databaseId: DB, tableId: T13, name: T13,
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.label("admin")),
      Permission.update(Role.label("admin")),
      Permission.delete(Role.label("admin")),
    ],
  }));
  await varchar(T13, "userId", 50, true);
  await varchar(T13, "courseId", 50, true);
  await varchar(T13, "courseTitle", 200);
  await varchar(T13, "userName", 200);
  await dt(T13, "issuedAt", true);
  await varchar(T13, "fileId", 100);
  await urlCol(T13, "shareUrl");
  await varchar(T13, "verificationToken", 200);
  await bool(T13, "isPublished", false, true);
  await idx(T13, "idx_userId", ["userId"]);
  await idx(T13, "idx_courseId", ["courseId"]);
  await idx(T13, "idx_user_course", ["userId", "courseId"], "unique");

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. live_sessions
  // ═══════════════════════════════════════════════════════════════════════════
  const T14 = "live_sessions";
  console.log(`\n14. ${T14}`);
  await safe("table", () => db.createTable({
    databaseId: DB, tableId: T14, name: T14,
    permissions: [
      Permission.read(Role.users()),
      Permission.create(Role.label("admin")),
      Permission.create(Role.label("instructor")),
      Permission.update(Role.label("admin")),
      Permission.update(Role.label("instructor")),
      Permission.delete(Role.label("admin")),
    ],
  }));
  await varchar(T14, "courseId", 50, true);
  await varchar(T14, "instructorId", 50, true);
  await varchar(T14, "title", 200, true);
  await text(T14, "description");
  await dt(T14, "scheduledAt", true);
  await varchar(T14, "streamId", 100);
  await enumCol(T14, "status", ["scheduled", "live", "ended"], true, "scheduled");
  await urlCol(T14, "recordingUrl");
  await int(T14, "duration", false, 0);
  await idx(T14, "idx_courseId", ["courseId"]);
  await idx(T14, "idx_instructorId", ["instructorId"]);
  await idx(T14, "idx_scheduledAt", ["scheduledAt"]);
  await idx(T14, "idx_status", ["status"]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 15. session_rsvps
  // ═══════════════════════════════════════════════════════════════════════════
  const T15 = "session_rsvps";
  console.log(`\n15. ${T15}`);
  await safe("table", () => db.createTable({
    databaseId: DB, tableId: T15, name: T15,
    permissions: [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.delete(Role.users()),
    ],
    rowSecurity: true,
  }));
  await varchar(T15, "sessionId", 50, true);
  await varchar(T15, "userId", 50, true);
  await dt(T15, "rsvpedAt", true);
  await idx(T15, "idx_sessionId", ["sessionId"]);
  await idx(T15, "idx_session_user", ["sessionId", "userId"], "unique");

  // ═══════════════════════════════════════════════════════════════════════════
  // 16. course_comments
  // ═══════════════════════════════════════════════════════════════════════════
  const T16 = "course_comments";
  console.log(`\n16. ${T16}`);
  await safe("table", () => db.createTable({
    databaseId: DB, tableId: T16, name: T16,
    permissions: [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.label("admin")),
      Permission.update(Role.label("moderator")),
      Permission.delete(Role.label("admin")),
      Permission.delete(Role.label("moderator")),
    ],
    rowSecurity: true,
  }));
  await varchar(T16, "lessonId", 50, true);
  await varchar(T16, "courseId", 50, true);
  await varchar(T16, "userId", 50, true);
  await varchar(T16, "userName", 200);
  await varchar(T16, "userRole", 50);
  await text(T16, "text", true);
  await varchar(T16, "parentId", 50);
  await dt(T16, "createdAt");
  await bool(T16, "isPinned", false, false);
  await bool(T16, "isDeleted", false, false);
  await int(T16, "likes", false, 0);
  await idx(T16, "idx_lessonId", ["lessonId"]);
  await idx(T16, "idx_courseId", ["courseId"]);
  await idx(T16, "idx_userId", ["userId"]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 17. forum_categories
  // ═══════════════════════════════════════════════════════════════════════════
  const T17 = "forum_categories";
  console.log(`\n17. ${T17}`);
  await safe("table", () => db.createTable({
    databaseId: DB, tableId: T17, name: T17,
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.label("admin")),
      Permission.update(Role.label("admin")),
      Permission.delete(Role.label("admin")),
    ],
  }));
  await varchar(T17, "name", 100, true);
  await text(T17, "description");
  await varchar(T17, "slug", 100, true);
  await int(T17, "order", false, 0);
  await varchar(T17, "createdBy", 50);
  await int(T17, "threadCount", false, 0);
  await idx(T17, "idx_slug", ["slug"], "unique");
  await idx(T17, "idx_order", ["order"]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 18. forum_threads
  // ═══════════════════════════════════════════════════════════════════════════
  const T18 = "forum_threads";
  console.log(`\n18. ${T18}`);
  await safe("table", () => db.createTable({
    databaseId: DB, tableId: T18, name: T18,
    permissions: [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.label("admin")),
      Permission.update(Role.label("moderator")),
      Permission.delete(Role.label("admin")),
      Permission.delete(Role.label("moderator")),
    ],
    rowSecurity: true,
  }));
  await varchar(T18, "forumCatId", 50, true);
  await varchar(T18, "userId", 50, true);
  await varchar(T18, "userName", 200);
  await varchar(T18, "userRole", 50);
  await varchar(T18, "title", 300, true);
  await medtext(T18, "body", true);
  await dt(T18, "createdAt");
  await bool(T18, "isPinned", false, false);
  await bool(T18, "isLocked", false, false);
  await int(T18, "replyCount", false, 0);
  await dt(T18, "lastReplyAt");
  await idx(T18, "idx_forumCatId", ["forumCatId"]);
  await idx(T18, "idx_userId", ["userId"]);
  await idx(T18, "idx_title_ft", ["title"], "fulltext");

  // ═══════════════════════════════════════════════════════════════════════════
  // 19. forum_replies
  // ═══════════════════════════════════════════════════════════════════════════
  const T19 = "forum_replies";
  console.log(`\n19. ${T19}`);
  await safe("table", () => db.createTable({
    databaseId: DB, tableId: T19, name: T19,
    permissions: [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.label("admin")),
      Permission.update(Role.label("moderator")),
      Permission.delete(Role.label("admin")),
      Permission.delete(Role.label("moderator")),
    ],
    rowSecurity: true,
  }));
  await varchar(T19, "threadId", 50, true);
  await varchar(T19, "userId", 50, true);
  await varchar(T19, "userName", 200);
  await varchar(T19, "userRole", 50);
  await medtext(T19, "body", true);
  await dt(T19, "createdAt");
  await bool(T19, "isDeleted", false, false);
  await idx(T19, "idx_threadId", ["threadId"]);
  await idx(T19, "idx_userId", ["userId"]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 20. payments
  // ═══════════════════════════════════════════════════════════════════════════
  const T20 = "payments";
  console.log(`\n20. ${T20}`);
  await safe("table", () => db.createTable({
    databaseId: DB, tableId: T20, name: T20,
    permissions: [
      Permission.read(Role.label("admin")),
      Permission.create(Role.label("admin")),
      Permission.update(Role.label("admin")),
    ],
  }));
  await varchar(T20, "userId", 50, true);
  await varchar(T20, "courseId", 50, true);
  await int(T20, "amount", true);
  await varchar(T20, "currency", 10);
  await enumCol(T20, "method", ["razorpay", "phonepe"], true);
  await enumCol(T20, "status", ["pending", "completed", "failed", "refunded"], true, "pending");
  await varchar(T20, "providerRef", 200);
  await dt(T20, "createdAt", true);
  await idx(T20, "idx_userId", ["userId"]);
  await idx(T20, "idx_courseId", ["courseId"]);
  await idx(T20, "idx_status", ["status"]);
  await idx(T20, "idx_createdAt", ["createdAt"]);
  await idx(T20, "idx_providerRef", ["providerRef"], "unique");

  // ═══════════════════════════════════════════════════════════════════════════
  // 21. subscriptions
  // ═══════════════════════════════════════════════════════════════════════════
  const T21 = "subscriptions";
  console.log(`\n21. ${T21}`);
  await safe("table", () => db.createTable({
    databaseId: DB, tableId: T21, name: T21,
    permissions: [
      Permission.read(Role.label("admin")),
      Permission.create(Role.label("admin")),
      Permission.update(Role.label("admin")),
    ],
  }));
  await varchar(T21, "userId", 50, true);
  await varchar(T21, "planId", 50, true);
  await dt(T21, "startDate", true);
  await dt(T21, "endDate");
  await enumCol(T21, "status", ["active", "expired", "cancelled"], true, "active");
  await varchar(T21, "paymentId", 50);
  await idx(T21, "idx_userId", ["userId"]);
  await idx(T21, "idx_status", ["status"]);
  await idx(T21, "idx_user_status_endDate", ["userId", "status", "endDate"]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 22. moderation_actions
  // ═══════════════════════════════════════════════════════════════════════════
  const T22 = "moderation_actions";
  console.log(`\n22. ${T22}`);
  await safe("table", () => db.createTable({
    databaseId: DB, tableId: T22, name: T22,
    permissions: [
      Permission.read(Role.label("admin")),
      Permission.read(Role.label("moderator")),
      Permission.create(Role.label("admin")),
      Permission.create(Role.label("moderator")),
      Permission.update(Role.label("admin")),
    ],
  }));
  await varchar(T22, "moderatorId", 50, true);
  await varchar(T22, "moderatorName", 200);
  await varchar(T22, "targetUserId", 50, true);
  await varchar(T22, "targetUserName", 200);
  await enumCol(T22, "action", ["warn", "mute", "timeout", "delete_post", "pin", "unpin", "remove_from_chat", "flag"], true);
  await enumCol(T22, "scope", ["course", "platform"], true, "platform");
  await text(T22, "reason", true);
  await varchar(T22, "duration", 50);
  await varchar(T22, "entityType", 50);
  await varchar(T22, "entityId", 50);
  await dt(T22, "createdAt");
  await varchar(T22, "revertedBy", 50);
  await dt(T22, "revertedAt");
  await idx(T22, "idx_targetUserId", ["targetUserId"]);
  await idx(T22, "idx_moderatorId", ["moderatorId"]);
  await idx(T22, "idx_action", ["action"]);
  await idx(T22, "idx_createdAt", ["createdAt"]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 23. audit_logs
  // ═══════════════════════════════════════════════════════════════════════════
  const T23 = "audit_logs";
  console.log(`\n23. ${T23}`);
  await safe("table", () => db.createTable({
    databaseId: DB, tableId: T23, name: T23,
    permissions: [
      Permission.read(Role.label("admin")),
      Permission.create(Role.label("admin")),
    ],
  }));
  await varchar(T23, "actorId", 50, true);
  await varchar(T23, "actorName", 200);
  await varchar(T23, "action", 200, true);
  await varchar(T23, "entity", 100, true);
  await varchar(T23, "entityId", 50, true);
  await medtext(T23, "metadata");
  await dt(T23, "createdAt", true);
  await idx(T23, "idx_actorId", ["actorId"]);
  await idx(T23, "idx_entity", ["entity"]);
  await idx(T23, "idx_createdAt", ["createdAt"]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 24. notifications
  // ═══════════════════════════════════════════════════════════════════════════
  const T24 = "notifications";
  console.log(`\n24. ${T24}`);
  await safe("table", () => db.createTable({
    databaseId: DB, tableId: T24, name: T24,
    permissions: [
      Permission.read(Role.users()),
      Permission.create(Role.label("admin")),
      Permission.update(Role.users()),
      Permission.delete(Role.label("admin")),
    ],
    rowSecurity: true,
  }));
  await varchar(T24, "userId", 50, true);
  await varchar(T24, "type", 50, true);
  await varchar(T24, "title", 200, true);
  await text(T24, "message", true);
  await bool(T24, "isRead", false, false);
  await urlCol(T24, "actionUrl");
  await dt(T24, "createdAt", true);
  await idx(T24, "idx_userId", ["userId"]);
  await idx(T24, "idx_isRead", ["isRead"]);
  await idx(T24, "idx_createdAt", ["createdAt"]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 25. blog_posts
  // ═══════════════════════════════════════════════════════════════════════════
  const T25 = "blog_posts";
  console.log(`\n25. ${T25}`);
  await safe("table", () => db.createTable({
    databaseId: DB, tableId: T25, name: T25,
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.label("admin")),
      Permission.update(Role.label("admin")),
      Permission.delete(Role.label("admin")),
    ],
  }));
  await varchar(T25, "slug", 180, true);
  await varchar(T25, "title", 240, true);
  await text(T25, "excerpt", true);
  await varchar(T25, "category", 80, true);
  await varchar(T25, "authorName", 120);
  await dt(T25, "publishedAt", true);
  await int(T25, "readMinutes", false, 5);
  await medtext(T25, "content", true);
  await bool(T25, "isPublished", false, true);
  await idx(T25, "idx_slug", ["slug"], "unique");
  await idx(T25, "idx_category", ["category"]);
  await idx(T25, "idx_isPublished", ["isPublished"]);
  await idx(T25, "idx_publishedAt", ["publishedAt"]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 26. site_copy
  // ═══════════════════════════════════════════════════════════════════════════
  const T26 = "site_copy";
  console.log(`\n26. ${T26}`);
  await safe("table", () => db.createTable({
    databaseId: DB, tableId: T26, name: T26,
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.label("admin")),
      Permission.update(Role.label("admin")),
      Permission.delete(Role.label("admin")),
    ],
  }));
  await varchar(T26, "key", 160, true);
  await varchar(T26, "title", 220);
  await medtext(T26, "body");
  await medtext(T26, "payload");
  await dt(T26, "updatedAt", true);
  await bool(T26, "isPublished", false, true);
  await idx(T26, "idx_key", ["key"], "unique");
  await idx(T26, "idx_isPublished", ["isPublished"]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 27. student_profiles
  // ═══════════════════════════════════════════════════════════════════════════
  const T27 = "student_profiles";
  console.log(`\n27. ${T27}`);
  await safe("table", () => db.createTable({
    databaseId: DB, tableId: T27, name: T27,
    permissions: [
      Permission.read(Role.users()),
      Permission.read(Role.label("admin")),
      Permission.read(Role.label("instructor")),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.label("admin")),
    ],
    rowSecurity: true,
  }));
  await varchar(T27, "userId", 50, true);
  await varchar(T27, "dateOfBirth", 20);
  await varchar(T27, "grade", 50);
  await varchar(T27, "school", 200);
  await varchar(T27, "hobby", 300);
  await text(T27, "bio");
  await varchar(T27, "guardianName", 200);
  await varchar(T27, "guardianPhone", 20);
  await varchar(T27, "city", 100);
  await varchar(T27, "state", 100);
  await idx(T27, "idx_userId", ["userId"], "unique");

  // ═══════════════════════════════════════════════════════════════════════════
  // 28. billing_info
  // ═══════════════════════════════════════════════════════════════════════════
  const T28 = "billing_info";
  console.log(`\n28. ${T28}`);
  await safe("table", () => db.createTable({
    databaseId: DB, tableId: T28, name: T28,
    permissions: [
      Permission.read(Role.users()),
      Permission.read(Role.label("admin")),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.label("admin")),
    ],
    rowSecurity: true,
  }));
  await varchar(T28, "userId", 50, true);
  await varchar(T28, "firstName", 100, true);
  await varchar(T28, "lastName", 100, true);
  await varchar(T28, "phone", 20, true);
  await varchar(T28, "addressLine1", 300, true);
  await varchar(T28, "addressLine2", 300);
  await varchar(T28, "city", 100, true);
  await varchar(T28, "state", 100, true);
  await varchar(T28, "country", 100, true);
  await varchar(T28, "zipcode", 20, true);
  await dt(T28, "createdAt", true);
  await dt(T28, "updatedAt");
  await idx(T28, "idx_userId", ["userId"], "unique");

  // ═══════════════════════════════════════════════════════════════════════════
  // 29. standalone_resources
  // ═══════════════════════════════════════════════════════════════════════════
  const T29 = "standalone_resources";
  console.log(`\n29. ${T29}`);
  await safe("table", () => db.createTable({
    databaseId: DB, tableId: T29, name: T29,
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.label("admin")),
      Permission.create(Role.label("instructor")),
      Permission.update(Role.label("admin")),
      Permission.update(Role.label("instructor")),
      Permission.delete(Role.label("admin")),
    ],
  }));
  await varchar(T29, "instructorId", 50, true);
  await varchar(T29, "instructorName", 200);
  await varchar(T29, "title", 300, true);
  await medtext(T29, "description");
  await enumCol(T29, "type", ["notes", "worksheet", "test_paper", "video", "other"], true, "notes");
  await enumCol(T29, "accessModel", ["free", "paid"], false, "free");
  await int(T29, "price", false, 0);
  await varchar(T29, "fileId", 100);
  await varchar(T29, "thumbnailId", 100);
  await int(T29, "downloadCount", false, 0);
  await bool(T29, "isPublished", false, false);
  await varcharArr(T29, "tags", 50);
  await dt(T29, "createdAt", true);
  await idx(T29, "idx_instructorId", ["instructorId"]);
  await idx(T29, "idx_type", ["type"]);
  await idx(T29, "idx_accessModel", ["accessModel"]);
  await idx(T29, "idx_isPublished", ["isPublished"]);
  await idx(T29, "idx_title_ft", ["title"], "fulltext");

  // ═══════════════════════════════════════════════════════════════════════════
  // Storage Buckets
  // ═══════════════════════════════════════════════════════════════════════════

  console.log("\n\n🪣 Creating storage buckets...\n");

  await safe("Bucket: course_videos", () =>
    storage.createBucket({
      bucketId: "course_videos",
      name: "Course Videos",
      permissions: [
        Permission.read(Role.users()),
        Permission.create(Role.label("admin")),
        Permission.create(Role.label("instructor")),
        Permission.delete(Role.label("admin")),
      ],
      maximumFileSize: 5000000000, // 5GB
      allowedFileExtensions: ["mp4", "webm", "mov"],
      compression: "gzip",
      encryption: true,
      antivirus: true,
    })
  );

  await safe("Bucket: course_thumbnails", () =>
    storage.createBucket({
      bucketId: "course_thumbnails",
      name: "Course Thumbnails",
      permissions: [
        Permission.read(Role.any()),
        Permission.create(Role.label("admin")),
        Permission.create(Role.label("instructor")),
        Permission.delete(Role.label("admin")),
      ],
      maximumFileSize: 5242880, // 5MB
      allowedFileExtensions: ["jpg", "jpeg", "png", "webp"],
      compression: "gzip",
      encryption: true,
      antivirus: true,
    })
  );

  await safe("Bucket: course_resources", () =>
    storage.createBucket({
      bucketId: "course_resources",
      name: "Course Resources",
      permissions: [
        Permission.read(Role.users()),
        Permission.create(Role.label("admin")),
        Permission.create(Role.label("instructor")),
        Permission.delete(Role.label("admin")),
      ],
      maximumFileSize: 52428800, // 50MB
      allowedFileExtensions: ["pdf", "zip", "txt", "doc", "docx", "pptx"],
      compression: "gzip",
      encryption: true,
      antivirus: true,
    })
  );

  await safe("Bucket: user_avatars", () =>
    storage.createBucket({
      bucketId: "user_avatars",
      name: "User Avatars",
      permissions: [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ],
      fileSecurity: true,
      maximumFileSize: 2097152, // 2MB
      allowedFileExtensions: ["jpg", "jpeg", "png", "webp"],
      compression: "gzip",
      encryption: true,
      antivirus: true,
    })
  );

  await safe("Bucket: certificates", () =>
    storage.createBucket({
      bucketId: "certificates",
      name: "Certificates",
      permissions: [
        Permission.read(Role.any()),
        Permission.create(Role.label("admin")),
        Permission.delete(Role.label("admin")),
      ],
      maximumFileSize: 10485760, // 10MB
      allowedFileExtensions: ["png", "jpg", "jpeg", "pdf"],
      compression: "gzip",
      encryption: true,
      antivirus: true,
    })
  );

  await safe("Bucket: blog_images", () =>
    storage.createBucket({
      bucketId: "blog_images",
      name: "Blog Images",
      permissions: [
        Permission.read(Role.any()),
        Permission.create(Role.label("admin")),
        Permission.delete(Role.label("admin")),
      ],
      maximumFileSize: 10485760, // 10MB
      allowedFileExtensions: ["jpg", "jpeg", "png", "webp", "gif"],
      compression: "gzip",
      encryption: true,
      antivirus: true,
    })
  );

  await safe("Bucket: resource_files", () =>
    storage.createBucket({
      bucketId: "resource_files",
      name: "Resource Files",
      permissions: [
        Permission.read(Role.any()),
        Permission.create(Role.label("admin")),
        Permission.create(Role.label("instructor")),
        Permission.delete(Role.label("admin")),
      ],
      maximumFileSize: 209715200, // 200MB
      allowedFileExtensions: ["pdf", "doc", "docx", "pptx", "mp4", "webm", "zip", "txt", "jpg", "png"],
      compression: "gzip",
      encryption: true,
      antivirus: true,
    })
  );

  console.log("\n\n✨ Setup complete!\n");
  console.log("📌 Next steps:");
  console.log("   1. Enable OAuth providers in Appwrite Console (Google)");
  console.log("   2. Create your first admin user and assign the 'admin' label:");
  console.log("      node -e \"const{Client,Users}=require('node-appwrite');require('dotenv').config();");
  console.log("      const c=new Client().setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)");
  console.log("        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);");
  console.log("      new Users(c).updateLabels({userId:'YOUR_USER_ID',labels:['admin']}).then(u=>console.log(u.labels))\"");
  console.log("   3. Or assign labels in Appwrite Console → Users → Select user → Labels\n");
}

main().catch(console.error);
