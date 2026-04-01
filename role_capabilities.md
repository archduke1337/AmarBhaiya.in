# Role Capabilities: Current State vs Ideal State

> Complete mapping of what each role **CAN do** today vs what they **SHOULD be able to do** for a production LMS.

---

## 1. Capability Matrix — What Exists vs What's Missing

### Legend
- ✅ **Built** — Server action + UI exists and works
- 🟡 **Partial** — Backend exists but UI is missing or incomplete
- ❌ **Missing** — Not implemented at all
- 🔒 **By Design** — Intentionally not available for this role

---

### 🎓 STUDENT (role: `student`)

| # | Capability | Status | Notes |
|---|-----------|--------|-------|
| | **Authentication** | | |
| 1 | Register (email/password) | ✅ | `registerAction` |
| 2 | Login | ✅ | `loginAction` |
| 3 | Logout | ✅ | `logoutAction` |
| 4 | Forgot password | ✅ | `forgotPasswordAction` |
| 5 | Email verification | ❌ | No verify-email route or action |
| 6 | OAuth login (Google, GitHub) | ❌ | Not implemented |
| 7 | Update profile (name, avatar) | ❌ | No profile edit form or action |
| 8 | Change password | ❌ | No change-password action |
| | **Courses** | | |
| 9 | Browse course catalogue | ✅ | Public `/courses` page |
| 10 | View course detail page | ✅ | `/courses/[slug]` |
| 11 | Enroll in free course | ✅ | `enrollInFreeCourse` action |
| 12 | Unenroll from course | ✅ | `unenrollFromCourse` action |
| 13 | Purchase paid course | ❌ | Razorpay/PhonePe integration not built |
| 14 | View enrolled courses with progress | ✅ | `/app/courses` (just rebuilt) |
| 15 | Watch video lessons | 🟡 | Course player page exists but no video player UI |
| 16 | Mark lesson as complete | ✅ | `markLessonComplete` action |
| 17 | View course progress % | ✅ | `getCourseProgress` action |
| 18 | Download course resources | ❌ | Resources table exists, no download UI |
| 19 | Take quizzes | ❌ | Quiz tables exist, no quiz UI |
| 20 | Submit assignments | ❌ | Assignment/submission tables exist, no UI |
| 21 | View certificates | 🟡 | Profile shows count, no certificate detail/download page |
| 22 | Rate/review a course | ❌ | No rating action or UI |
| | **Community** | | |
| 23 | Post forum thread | ✅ | `createForumThreadAction` |
| 24 | View forum threads | ✅ | `/app/community` |
| 25 | Reply to thread | ❌ | `forum_replies` table exists, no reply action or UI |
| 26 | Edit own thread | ❌ | No edit action |
| 27 | Delete own thread | ❌ | No delete action |
| 28 | React to thread/reply | ❌ | No reactions system |
| 29 | Search threads | ❌ | No search functionality |
| 30 | Report content | ❌ | No flag/report action for students |
| | **Live Sessions** | | |
| 31 | View upcoming sessions | ✅ | Dashboard shows them |
| 32 | RSVP to session | ❌ | `session_rsvps` table exists, no RSVP action |
| 33 | Join live session | ❌ | No Stream/meeting integration |
| 34 | View session recording | ❌ | `recordingUrl` field exists, no UI |
| | **Notifications** | | |
| 35 | View notifications | ❌ | `notifications` table exists, no UI |
| 36 | Mark notification read | ❌ | No action |
| | **Profile** | | |
| 37 | View own profile with stats | ✅ | `/app/profile/[id]` |
| 38 | View other students' profiles | ❌ | No public profile pages |

**Score: 14/38 fully implemented (37%)**

---

### 🧑‍🏫 INSTRUCTOR (role: `instructor`)

| # | Capability | Status | Notes |
|---|-----------|--------|-------|
| | **Course Management** | | |
| 1 | Create course draft | ✅ | `createCourseDraftAction` |
| 2 | Edit course metadata (title, desc, price, model) | ✅ | `updateInstructorCourseAction` |
| 3 | Publish/unpublish course | ✅ | Via edit form `isPublished` toggle |
| 4 | Delete course | ❌ | No delete action |
| 5 | Upload course thumbnail | ❌ | `courseThumbnails` bucket exists, no upload action |
| 6 | Set "What you'll learn" objectives | 🟡 | Field exists in schema, no UI to edit the array |
| 7 | Set course requirements | 🟡 | Field exists, no UI |
| 8 | Set course tags | 🟡 | Field exists, no UI |
| 9 | Duplicate/clone a course | ❌ | Not implemented |
| | **Curriculum Builder** | | |
| 10 | Create module | ✅ | `createCurriculumModuleAction` |
| 11 | Edit module | ✅ | `updateCurriculumModuleAction` |
| 12 | Delete module | ❌ | No delete action |
| 13 | Reorder modules | 🟡 | Order field exists, must manually type number |
| 14 | Create lesson | ✅ | `createCurriculumLessonAction` |
| 15 | Edit lesson | ✅ | `updateCurriculumLessonAction` |
| 16 | Delete lesson | ❌ | No delete action |
| 17 | Reorder lessons | 🟡 | Order field exists, manual number |
| 18 | Upload lesson video | ❌ | `courseVideos` bucket exists, no upload action |
| 19 | Upload lesson resources (PDF etc) | ❌ | `courseResources` bucket exists, no upload action |
| 20 | Preview lesson as student | ❌ | No preview mode |
| | **Categories** | | |
| 21 | Create category | ✅ | `createCategoryAction` (shared with admin) |
| 22 | Edit category | ✅ | `updateCategoryAction` |
| 23 | Delete category | ❌ | No delete action |
| | **Students** | | |
| 24 | View enrolled students with progress | ✅ | `/instructor/students` |
| 25 | Send message to student | ❌ | No messaging system |
| 26 | Grade assignment submission | ❌ | Submissions table exists, no grading action |
| 27 | View assignment submissions | ❌ | No submissions listing page |
| 28 | Answer student Q&A | ❌ | `courseComments` table exists, no UI |
| | **Live Sessions** | | |
| 29 | Create live session | ✅ | `createLiveSessionAction` |
| 30 | Edit live session | ❌ | No edit action |
| 31 | Delete/cancel session | ❌ | No delete action |
| 32 | Start live session (go live) | ❌ | No Stream integration |
| 33 | End live session | ❌ | No status-update action |
| 34 | Upload recording link | ❌ | No recording action |
| | **Analytics** | | |
| 35 | View course enrollment count | 🟡 | Shown in stats, not per-course |
| 36 | View course completion rate | ❌ | Not calculated |
| 37 | View revenue per course | ❌ | Not implemented |
| 38 | View student engagement metrics | ❌ | Not implemented |
| | **Quizzes** | | |
| 39 | Create quiz for a course | ❌ | Tables exist, no action |
| 40 | Add quiz questions | ❌ | Tables exist, no action |
| 41 | View quiz attempts/scores | ❌ | Table exists, no UI |

**Score: 13/41 fully implemented (32%)**

---

### 🛡️ MODERATOR (role: `moderator`)

| # | Capability | Status | Notes |
|---|-----------|--------|-------|
| | **Content Moderation** | | |
| 1 | View flagged reports | ✅ | `/moderator/reports` |
| 2 | Apply moderation action (warn/mute/timeout/remove/flag) | ✅ | `applyModerationActionAction` |
| 3 | Resolve/revert moderation action | ✅ | `resolveModerationActionAction` |
| 4 | Pin forum thread | ✅ | Via action with `entityType=forum_thread` |
| 5 | Unpin forum thread | ✅ | Same as above |
| 6 | Delete forum thread | 🟡 | `delete_post` action logs it, but doesn't actually delete the thread row |
| 7 | Delete forum reply | ❌ | No reply-level moderation |
| 8 | Lock thread (prevent replies) | ❌ | `isLocked` field exists on threads, no action to set it |
| 9 | Hide thread (soft delete) | ❌ | No `isHidden` field or action |
| 10 | Edit thread content | ❌ | Moderators can't edit user content |
| | **User Management** | | |
| 11 | View moderated users | ✅ | `/moderator/students` |
| 12 | Warn user | ✅ | Part of `applyModerationActionAction` |
| 13 | Mute user | ✅ | Part of action |
| 14 | Timeout user | ✅ | Part of action |
| 15 | Ban user permanently | ❌ | No ban action (requires admin) |
| 16 | View user's full profile/history | ❌ | Can't view user details, only moderation history |
| 17 | Search users | ❌ | No search |
| | **Community Oversight** | | |
| 18 | View community thread activity | ✅ | `/moderator/community` |
| 19 | View moderation action breakdown | ✅ | Action counts displayed |
| 20 | Search threads | ❌ | No search |
| 21 | Filter reports by type/status | ❌ | No filter controls |
| | **Communication** | | |
| 22 | Send warning message to user | ❌ | `notifications` table exists, no action |
| 23 | Post platform-wide notice | ❌ | No announcement system |
| | **Audit** | | |
| 24 | View own moderation history | ❌ | No filtered view |

**Score: 10/24 fully implemented (42%)**

---

### 👑 ADMIN (role: `admin`)

| # | Capability | Status | Notes |
|---|-----------|--------|-------|
| | **Everything Instructor Can Do** | | |
| 1 | All instructor capabilities | ✅ | Admin is included in `requireRole(["admin", "instructor"])` |
| | **Everything Moderator Can Do** | | |
| 2 | All moderator capabilities | ✅ | Admin is included in `requireRole(["admin", "moderator"])` |
| | **User Management** | | |
| 3 | View all users | ✅ | `/admin/users` |
| 4 | Change user role | ✅ | `updateUserRoleAction` + inline form |
| 5 | Suspend/block user | ❌ | No suspend action (Appwrite supports `users.updateStatus`) |
| 6 | Delete user account | ❌ | No delete action |
| 7 | Reset user password | ❌ | No admin-initiated password reset |
| 8 | View user's profile details | ❌ | Only name/email/role shown |
| 9 | Search/filter users | ❌ | No search controls |
| 10 | Bulk role assignment | ❌ | One user at a time only |
| 11 | Export user list (CSV) | ❌ | No export |
| | **Course Administration** | | |
| 12 | Publish/unpublish any course | ✅ | `updateCourseVisibilityAction` |
| 13 | Feature/unfeature any course | ✅ | Same action |
| 14 | Delete any course | ❌ | No delete action |
| 15 | Transfer course ownership | ❌ | No ownership transfer action |
| 16 | View all courses across instructors | ✅ | `/admin/courses` |
| | **Payments & Revenue** | | |
| 17 | View all payments | ✅ | `/admin/payments` |
| 18 | Issue refund | ❌ | No refund action |
| 19 | View revenue analytics | ❌ | No charts or trend data |
| 20 | Export payment records | ❌ | No export |
| 21 | Configure pricing/coupons | ❌ | No coupon system |
| | **Content Marketing** | | |
| 22 | Upsert site copy (home, about, contact) | ✅ | `upsertSiteCopyAction` |
| 23 | Create blog post | ✅ | `createBlogPostAction` |
| 24 | Edit existing blog post | ❌ | No edit action (only create) |
| 25 | Delete blog post | ❌ | No delete action |
| 26 | Upload blog images | ❌ | `blogImages` bucket exists, no upload |
| 27 | Preview site copy changes | ❌ | No preview |
| | **Live Session Management** | | |
| 28 | View all sessions platform-wide | ✅ | `/admin/live` |
| 29 | Cancel any session | ❌ | No cancel action |
| 30 | Delete session | ❌ | No delete action |
| | **Moderation Governance** | | |
| 31 | View moderation summary | ✅ | `/admin/moderation` |
| 32 | Override moderator decisions | ❌ | No override action |
| 33 | Set moderation policies | ❌ | No policy config |
| | **Audit & System** | | |
| 34 | View audit logs | ✅ | `/admin/audit` |
| 35 | Filter/search audit logs | ❌ | No controls |
| 36 | Export audit logs | ❌ | No export |
| 37 | View system health/metrics | ❌ | No monitoring dashboard |
| 38 | Manage Appwrite settings | ❌ | Done in Appwrite Console directly |
| | **Notifications** | | |
| 39 | Send platform announcement | ❌ | No announcement action |
| 40 | Send notification to specific user | ❌ | No send action |

**Score: 14/40 fully implemented (35%)**

---

## 2. Critical Missing Capabilities (Must Build)

### 🔴 Tier 1 — Platform Cannot Function Without These

| # | Feature | Affected Roles | Why Critical |
|---|---------|----------------|-------------|
| 1 | **Video player** for lessons | Student | Core product — students can't watch content |
| 2 | **File upload** (video, thumbnails, resources) | Instructor | Can't add lesson content without upload |
| 3 | **Payment integration** (Razorpay/PhonePe) | Student, Admin | Can't monetize courses |
| 4 | **Forum replies** | Student, Moderator | Threads without replies = dead community |
| 5 | **Profile edit** (name, avatar, password) | All | Users can't update their info |
| 6 | **Email verification** flow | Student | Account security baseline |
| 7 | **Delete actions** (course, module, lesson, thread) | Instructor, Admin | Can't clean up mistakes |

### 🟠 Tier 2 — Production-Ready Requires These

| # | Feature | Affected Roles | Why Important |
|---|---------|----------------|-------------|
| 8 | **Quiz system** (create, take, grade) | Instructor, Student | Core LMS feature |
| 9 | **Assignment submission + grading** | Instructor, Student | Assessment system |
| 10 | **Certificate generation** (PDF) | Student | Course completion reward |
| 11 | **RSVP + Join live session** | Student | Live stream access |
| 12 | **Notifications system** | All | Engagement + communication |
| 13 | **User suspend/block** | Admin | Trust & safety |
| 14 | **Search** across threads, users, courses | All dashboards | Basic usability |
| 15 | **Edit blog post** | Admin | Content management lifecycle |
| 16 | **Course analytics** | Instructor, Admin | Data-driven decisions |

### 🟡 Tier 3 — Nice to Have for MVP

| # | Feature | Affected Roles | Why Valuable |
|---|---------|----------------|-------------|
| 17 | OAuth login (Google) | Student | Reduces signup friction |
| 18 | Thread reactions | Student | Engagement signals |
| 19 | Course ratings/reviews | Student | Social proof |
| 20 | CSV exports (users, payments, audit) | Admin | Reporting |
| 21 | Bulk operations | Admin | Efficiency at scale |
| 22 | Drag-and-drop reordering | Instructor | Curriculum builder UX |
| 23 | Coupons/discount codes | Admin | Marketing tool |
| 24 | Student messaging | Instructor | Direct communication |

---

## 3. Action-to-Role Permission Map (Source of Truth)

Every server action and what role gates it:

| Action | File | Guard | Accessible By |
|--------|------|-------|---------------|
| `loginAction` | `actions.ts` | None (public) | Everyone |
| `registerAction` | `actions.ts` | None (public) | Everyone |
| `forgotPasswordAction` | `actions.ts` | None (public) | Everyone |
| `logoutAction` | `actions.ts` | Session client | Any logged-in user |
| `createForumThreadAction` | `dashboard.ts` | `requireAuth()` | Any logged-in user |
| `enrollInFreeCourse` | `enrollments.ts` | Session client | Any logged-in user |
| `unenrollFromCourse` | `enrollments.ts` | Session client | Any logged-in user |
| `markLessonComplete` | `courses.ts` | Session client | Any logged-in user |
| `getCourseProgress` | `courses.ts` | Session client | Any logged-in user |
| `createCourseDraftAction` | `dashboard.ts` | `requireRole(["admin", "instructor"])` | Admin, Instructor |
| `createLiveSessionAction` | `dashboard.ts` | `requireRole(["admin", "instructor"])` | Admin, Instructor |
| `updateInstructorCourseAction` | `operations.ts` | `requireRole(["admin", "instructor"])` + ownership | Admin, Course Owner |
| `createCurriculumModuleAction` | `operations.ts` | `requireRole(["admin", "instructor"])` + ownership | Admin, Course Owner |
| `createCurriculumLessonAction` | `operations.ts` | `requireRole(["admin", "instructor"])` + ownership | Admin, Course Owner |
| `updateCurriculumModuleAction` | `operations.ts` | `requireRole(["admin", "instructor"])` + ownership | Admin, Course Owner |
| `updateCurriculumLessonAction` | `operations.ts` | `requireRole(["admin", "instructor"])` + ownership | Admin, Course Owner |
| `createCategoryAction` | `operations.ts` | `requireRole(["admin", "instructor"])` | Admin, Instructor |
| `updateCategoryAction` | `operations.ts` | `requireRole(["admin", "instructor"])` | Admin, Instructor |
| `applyModerationActionAction` | `operations.ts` | `requireRole(["admin", "moderator"])` | Admin, Moderator |
| `resolveModerationActionAction` | `operations.ts` | `requireRole(["admin", "moderator"])` | Admin, Moderator |
| `updateUserRoleAction` | `operations.ts` | `requireRole(["admin"])` | Admin only |
| `updateCourseVisibilityAction` | `operations.ts` | `requireRole(["admin"])` | Admin only |
| `upsertSiteCopyAction` | `operations.ts` | `requireRole(["admin"])` | Admin only |
| `createBlogPostAction` | `operations.ts` | `requireRole(["admin"])` | Admin only |

---

## 4. Database Tables — Usage Status

| Table | Used In Read | Used In Write | Missing Actions |
|-------|-------------|---------------|-----------------|
| `courses` | ✅ Extensively | ✅ CRUD (no delete) | Delete course |
| `categories` | ✅ | ✅ CRUD (no delete) | Delete category |
| `modules` | ✅ | ✅ CRUD (no delete) | Delete module |
| `lessons` | ✅ | ✅ CRUD (no delete) | Delete lesson, upload video |
| `resources` | ❌ Not read | ❌ Not written | Full CRUD needed |
| `enrollments` | ✅ | ✅ Create, soft-delete | — |
| `progress` | ✅ | ✅ Mark complete | — |
| `quizzes` | ❌ | ❌ | Full quiz system |
| `quiz_questions` | ❌ | ❌ | Full quiz system |
| `quiz_attempts` | ❌ | ❌ | Full quiz system |
| `assignments` | ✅ Read for stats | ❌ | Create, grade, submit |
| `submissions` | ✅ Read for stats | ❌ | Submit, grade |
| `certificates` | ✅ Read count | ❌ | Generate, download |
| `live_sessions` | ✅ | ✅ Create only | Edit, delete, start, end |
| `session_rsvps` | ✅ Count only | ❌ | RSVP action |
| `course_comments` | ❌ | ❌ | Full Q&A system |
| `forum_categories` | ✅ | ❌ | Admin CRUD for forum cats |
| `forum_threads` | ✅ | ✅ Create + pin | Edit, delete, lock |
| `forum_replies` | ❌ | ❌ | Create, edit, delete |
| `payments` | ✅ Read | ❌ | Payment processing, refunds |
| `subscriptions` | ❌ | ❌ | Subscription system |
| `moderation_actions` | ✅ | ✅ | — |
| `audit_logs` | ✅ Read | ❌ | Auto-log on actions |
| `notifications` | ❌ | ❌ | Full notification system |
| `blog_posts` | ✅ Read | ✅ Create only | Edit, delete |
| `site_copy` | ✅ | ✅ Upsert | — |

**Active tables: 15/26 (58%) — 11 tables are completely unused in code**

---

## 5. Recommended Build Priority

Based on the analysis above, here's what to build and in what order:

### Sprint 1: Core Missing Actions (unblocks the product)
1. **Delete actions** — course, module, lesson, category, blog post, thread
2. **Profile edit** — update name, change password
3. **Forum replies** — create reply action + thread detail page
4. **File upload** — video and thumbnail upload actions + UI

### Sprint 2: Student Experience
5. **Video player** — HTML5 player in course player page
6. **RSVP to live session** — create RSVP action
7. **Email verification** — verify flow
8. **Notifications** — read/mark-read actions + notification bell

### Sprint 3: Assessment System
9. **Quiz system** — create quiz, add questions, take quiz, view results
10. **Assignment system** — submit, grade, view submissions
11. **Certificate generation** — auto-generate on course completion

### Sprint 4: Admin Power Tools
12. **User suspend/block** — admin action
13. **Edit/delete blog posts** — admin CMS lifecycle
14. **CSV exports** — users, payments, audit
15. **Payment integration** — Razorpay/PhonePe webhooks
