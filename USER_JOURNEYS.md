# 🎬 COMPLETE USER JOURNEYS & WORKFLOWS

**Document:** Ultra-Deep Analysis - User Flows  
**Coverage:** All major user journeys through the system

---

## 👤 JOURNEY 1: First-Time Visitor to Student

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FIRST-TIME USER JOURNEY                              │
└─────────────────────────────────────────────────────────────────────────┘

STAGE 1: DISCOVERY
━━━━━━━━━━━━━━━━━━
1. User lands on amarbhaiya.in (public homepage)
   └─ URL: /
   └─ Component: marketing/page.tsx (client component)
   └─ Rendering: Full 3D shader gradient background
   
2. Sees hero section
   ├─ Animated title: "Padhai karo apne tareeke se"
   ├─ Subheading: "Class 8 se college tak..."
   ├─ CTA buttons: "Start learning" & "Browse courses"
   └─ Bottom domain strip: Learning categories

3. Scrolls and sees:
   ├─ Animated counters (students, courses, hours, years)
   ├─ About section (Amar Bhaiya's story)
   ├─ What you'll learn (3-column grid)
   ├─ Featured courses (horizontal list)
   ├─ Why choose Amar Bhaiya
   └─ Final CTA: "Abhi start karo"

STAGE 2: AUTHENTICATION
━━━━━━━━━━━━━━━━━━━━━━
4. Clicks "Start learning" or "Free account banao"
   └─ Redirects to /register

5. Registration page loads
   ├─ Form fields: name, email, password, confirm password
   ├─ User fills form
   └─ Clicks "Create Account"

6. Form validation
   ├─ Client-side: Basic checks
   ├─ Server-side (POST /api/auth/register):
   │  ├─ Validates with registerSchema
   │  ├─ Checks email doesn't exist
   │  ├─ account.create({userId: ID.unique(), ...})
   │  ├─ account.createEmailPasswordSession()
   │  └─ Sets httpOnly cookie: a_session_${PROJECT_ID}
   └─ Response: {success: true}

7. Frontend receives success
   ├─ router.push("/app/dashboard")
   └─ Browser redirects with session cookie

STAGE 3: FIRST LOGIN EXPERIENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. Dashboard loads (/app/dashboard)
   ├─ requireAuth() validates session
   ├─ Fetches 5 data sets in parallel:
   │  ├─ getStudentProfileStats()
   │  ├─ getStudentEnrolledCourses()
   │  ├─ getUpcomingLiveSessions()
   │  ├─ getUnreadNotificationCount()
   │  └─ getUserNotifications()
   └─ Page renders with real data

9. Student sees:
   ├─ Greeting: "Good morning/afternoon/evening, {firstName}"
   ├─ Stats: Streak (0), Active courses (0), Certs (0), Sessions (0)
   ├─ Empty state: "No courses in progress"
   ├─ Sidebar: No sessions, no completed courses, no notifications
   └─ CTA: "Browse courses"

STAGE 4: EXPLORATION
━━━━━━━━━━━━━━━━━━━
10. User clicks "Browse courses" or navigates to /courses
    └─ See all courses with:
       ├─ Title, description, thumbnail
       ├─ Category, instructor, rating
       ├─ Access model (free/paid)
       ├─ Enrollment count
       └─ Price (if applicable)

11. User finds interesting course
    └─ Clicks on course card → /courses/[slug]

12. Course detail page shows:
    ├─ Hero with thumbnail
    ├─ Title, description, reviews
    ├─ Instructor info
    ├─ What you'll learn
    ├─ Requirements
    ├─ Number of modules/lessons
    ├─ "Enroll Now" or "Start Free" button
    └─ Comments section

STAGE 5: ENROLLMENT
━━━━━━━━━━━━━━━━━
13. User enrolls in FREE course:
    ├─ Clicks "Start Free"
    ├─ enrollInCourseAction called
    ├─ Creates Enrollment record
    │  ├─ userId: user.$id
    │  ├─ courseId: course.id
    │  ├─ accessModel: "free"
    │  └─ isActive: true
    └─ Redirects to first lesson

14. User enrolls in PAID course:
    ├─ Clicks "Enroll Now"
    ├─ RazorpayCheckout component appears
    ├─ POST /api/payments/razorpay/create-order
    │  ├─ Creates Razorpay order
    │  └─ Returns orderId
    ├─ Opens Razorpay modal
    ├─ User enters payment details
    ├─ Razorpay processes payment
    ├─ Success callback sends to webhook
    ├─ POST /api/payments/razorpay/webhook
    │  ├─ Verifies signature
    │  ├─ Creates Enrollment
    │  ├─ Creates Payment record
    │  ├─ Creates Notification
    │  └─ Sends email
    └─ Frontend redirects to first lesson

STAGE 6: LEARNING
━━━━━━━━━━━━━━━━
15. Course player loads
    ├─ URL: /app/courses/[courseId]/[lessonId]
    ├─ Components loaded:
    │  ├─ VideoPlayer (main content area)
    │  ├─ LessonSidebar (left navigation)
    │  ├─ ProgressBar (top of video)
    │  └─ Tabs: Overview, Resources, Comments, Notes
    └─ State initialized:
       ├─ activeLessonId: first lesson
       ├─ completedLessonIds: []
       └─ notes: ""

16. User watches video
    ├─ VideoPlayer with custom controls
    ├─ Can pause, resume, adjust speed
    ├─ Can mute audio
    ├─ Can go fullscreen
    ├─ Progress bar shows playback position
    └─ Video duration displayed

17. Video ends
    ├─ Prompt: "Mark as complete?"
    ├─ User clicks "Yes"
    ├─ markLessonComplete() in state
    ├─ ProgressBar updates (from 0% to X%)
    └─ Lesson appears as completed in sidebar

18. User navigates to next lesson
    ├─ Clicks next lesson in sidebar
    ├─ activeLessonId changes
    ├─ VideoPlayer loads new video
    ├─ Notes saved (localStorage or state)
    └─ Process repeats for next lesson

STAGE 7: ASSESSMENTS
━━━━━━━━━━━━━━━━━━
19. After module completes, quiz available
    ├─ Quiz appears at lesson end
    ├─ Or navigates to /app/quiz/[quizId]
    ├─ QuizForm component loads
    └─ Quiz metadata shown:
       ├─ Title, description
       ├─ Number of questions
       ├─ Pass mark (%)
       └─ Time limit (if any)

20. User takes quiz
    ├─ Questions displayed one by one
    ├─ Options: MCQ (4), T/F (2), Short Answer
    ├─ Timer counts down (if applicable)
    ├─ Progress shows current question
    └─ User selects answers

21. User submits quiz
    ├─ Clicks "Submit Quiz"
    ├─ submitQuizAction called
    ├─ Server scores answers
    │  ├─ MCQ: Check against correctAnswer
    │  ├─ T/F: Check against correctAnswer
    │  ├─ SA: Manual review flag
    │  └─ Total score calculated
    ├─ Creates QuizAttempt record
    └─ Results displayed:
       ├─ Score: X/Y
       ├─ Pass/Fail
       ├─ Percentage
       └─ Button to retake or continue

STAGE 8: COMPLETION & CERTIFICATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
22. User completes course (all lessons + quiz)
    ├─ Progress reaches 100%
    ├─ Dashboard notifications updated
    └─ Certificate generated (if passed quizzes)

23. System generates certificate
    ├─ issueCertificateAction triggered
    ├─ Certificate PDF generated
    ├─ Stored in storage bucket: certificates
    ├─ Certificate record created
    ├─ Notification sent: "You earned a certificate!"
    └─ Email with certificate link

24. User sees on dashboard
    ├─ /app/dashboard shows completed course
    ├─ Badge shows "Done"
    ├─ Certificate visible in sidebar
    ├─ User can download/share
    └─ Counts toward "Certificates" stat

STAGE 9: CONTINUOUS ENGAGEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
25. User browses next course
    └─ Repeats STAGE 5-8 for new course

26. User attends live session
    ├─ Sees session in /app/live
    ├─ Clicks "RSVP"
    ├─ rsvpToSessionAction creates SessionRsvp
    ├─ At session time, sees "Join" button
    ├─ Joins via Stream Chat
    ├─ Real-time interaction with instructor
    └─ Session recorded for later playback

27. User engages in community
    ├─ Navigates to /app/community
    ├─ Joins forum category
    ├─ Creates discussion thread
    ├─ Replies to other threads
    └─ Interacts with other students

TOUCH POINTS FOR RE-ENGAGEMENT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
28. Notifications
    ├─ New course published
    ├─ Assignment due soon
    ├─ Quiz available
    ├─ Live session tomorrow
    ├─ Friend enrolled in course
    └─ Instructor replied to comment

29. Emails
    ├─ Welcome email
    ├─ Course completion
    ├─ Certificate earned
    ├─ Quiz reminder
    ├─ New courses in category
    └─ Weekly digest
```

---

## 👨‍🏫 JOURNEY 2: Instructor Full Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    INSTRUCTOR JOURNEY                                   │
└─────────────────────────────────────────────────────────────────────────┘

STAGE 1: ONBOARDING
━━━━━━━━━━━━━━━━━━
1. Instructor signs up as student first
   └─ Completes student journey steps 1-7

2. Applies to become instructor
   ├─ Submits application with:
   │  ├─ Bio
   │  ├─ Expertise areas
   │  ├─ Sample course idea
   │  └─ Social links
   └─ Admin reviews & approves

3. Admin assigns "instructor" role
   ├─ assignRole(userId, "instructor")
   ├─ Appwrite labels updated
   ├─ Dashboard href changes
   └─ Invitation email sent

4. Instructor logs out and back in
   ├─ Session still valid
   ├─ But role changed to "instructor"
   ├─ Dashboard href now: /instructor
   └─ Menu items change

STAGE 2: DASHBOARD & OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. Instructor navigates to /instructor
   ├─ Dashboard loads (server component)
   ├─ getInstructorDashboardStats()
   └─ Shows:
      ├─ Total courses (created + draft)
      ├─ Active enrollments (across all courses)
      ├─ Live sessions count
      ├─ Pending reviews (assignments to grade)

6. Stats displayed
   ├─ Card 1: Courses (total count)
   ├─ Card 2: Students (enrolled across courses)
   ├─ Card 3: Monthly earnings
   ├─ Card 4: Pending reviews
   └─ Secondary stats:
      ├─ Completion rate (%)
      ├─ Average rating
      ├─ Messages to review
      └─ Upcoming sessions

STAGE 3: COURSE CREATION
━━━━━━━━━━━━━━━━━━━━━━━
7. Instructor clicks "Create New Course"
   ├─ URL: /instructor/courses/new
   └─ Form appears:
      ├─ Title
      ├─ Short description
      ├─ Long description
      ├─ Category (dropdown)
      ├─ Access model (free/paid/subscription)
      ├─ Price (if not free)
      ├─ Thumbnail upload
      ├─ What you'll learn (list)
      ├─ Requirements (list)
      └─ Tags

8. Instructor fills form
   ├─ Validates in real-time
   ├─ Uses courseSchema (Zod)
   ├─ Show validation errors
   └─ Clicks "Create"

9. Server validates & creates
   ├─ POST /instructor/courses/create
   ├─ validatePermissions: User is instructor
   ├─ courseSchema.safeParse()
   ├─ Upload thumbnail to storage
   ├─ Creates Course record:
   │  ├─ title, description, slug
   │  ├─ instructorId: user.$id
   │  ├─ categoryId
   │  ├─ price, accessModel
   │  ├─ isPublished: false (draft)
   │  └─ thumbnailId
   └─ Redirects to /instructor/courses/[courseId]

STAGE 4: COURSE CONTENT BUILD-OUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10. Course dashboard shows:
    ├─ Course title
    ├─ Status: DRAFT (not published)
    ├─ Modules section: "No modules yet"
    ├─ Action buttons:
    │  ├─ "Add Module"
    │  ├─ "Edit Course"
    │  ├─ "Publish Course"
    │  └─ "Delete Course"
    └─ Sidebar: Checklist (% complete)

11. Instructor clicks "Add Module"
    ├─ Modal appears
    ├─ Form fields:
    │  ├─ Title
    │  ├─ Description
    │  └─ Module order
    ├─ Validates with moduleSchema
    └─ Creates Module record

12. Modules now listed
    ├─ Each shows:
    │  ├─ Title
    │  ├─ Number of lessons
    │  ├─ Total duration
    │  ├─ Actions: Edit, Delete, Add Lesson
    │  └─ Lessons nested below

13. Instructor adds lesson to module
    ├─ Clicks "Add Lesson"
    ├─ Form:
    │  ├─ Title
    │  ├─ Description
    │  ├─ Video upload
    │  ├─ Duration (auto-calculated)
    │  ├─ Is free preview? (T/F)
    │  └─ Order
    ├─ Video uploaded to storage bucket: course_videos
    ├─ Lesson record created:
    │  ├─ moduleId, courseId
    │  ├─ title, description
    │  ├─ videoFileId
    │  ├─ duration
    │  └─ order
    └─ Appears in module list

14. Instructor adds resources (PDF, links, files)
    ├─ For each lesson, can add resources
    ├─ Each resource has:
    │  ├─ Title
    │  ├─ Type: pdf | link | file
    │  ├─ URL or file
    │  └─ Order
    ├─ PDFs/files stored in: course_resources bucket
    └─ Resource record created

15. Instructor adds quiz to lesson
    ├─ Clicks "Add Quiz" for lesson
    ├─ Quiz form:
    │  ├─ Title
    │  ├─ Pass mark (%)
    │  ├─ Time limit (minutes, 0 = no limit)
    │  └─ "Save"
    ├─ Quiz record created
    └─ Questions section appears

16. Instructor adds quiz questions
    ├─ For each question:
    │  ├─ Text of question
    │  ├─ Type: MCQ | True/False | Short Answer
    │  ├─ Options (if MCQ or T/F):
    │  │  ├─ Option 1, 2, 3, 4 (for MCQ)
    │  │  └─ Select "Correct answer"
    │  ├─ Correct answer for SA: Hints for grading
    │  └─ Order
    ├─ Question record created
    └─ Questions appear in list

17. Instructor adds assignment
    ├─ Clicks "Add Assignment" for lesson
    ├─ Form:
    │  ├─ Title
    │  ├─ Description
    │  ├─ Instructions
    │  ├─ Due date
    │  ├─ Max attempts
    │  └─ Rubric (optional)
    ├─ Assignment record created
    └─ Students see in their assignments list

STAGE 5: COURSE PUBLICATION
━━━━━━━━━━━━━━━━━━━━━━━━━
18. Instructor reviews course
    ├─ Checks all modules, lessons, quizzes
    ├─ Verifies videos are uploaded
    ├─ Checks quiz questions
    ├─ Reviews course description
    └─ Uploads thumbnail

19. Instructor clicks "Publish Course"
    ├─ Final validation:
    │  ├─ At least 1 module
    │  ├─ At least 1 lesson
    │  ├─ Course description complete
    │  ├─ Thumbnail uploaded
    │  └─ At least 1 quiz
    ├─ Updates Course record:
    │  └─ isPublished: true
    ├─ Creates Notification for admin
    ├─ Email sent to admin: "New course published"
    └─ Course now visible on /courses

STAGE 6: STUDENT MANAGEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━
20. Instructor navigates to /instructor/students
    ├─ Lists all students enrolled in any of instructor's courses
    ├─ Shows:
    │  ├─ Student name
    │  ├─ Email
    │  ├─ Course enrolled in
    │  ├─ Progress (%)
    │  ├─ Enrollment date
    │  └─ Status: Active/Completed
    └─ Can filter by:
       ├─ Course
       ├─ Status
       └─ Progress

STAGE 7: ASSIGNMENT GRADING
━━━━━━━━━━━━━━━━━━━━━━━━
21. Instructor navigates to /instructor/submissions
    ├─ Lists all submitted assignments
    ├─ Shows:
    │  ├─ Student name
    │  ├─ Assignment title
    │  ├─ Submission date
    │  ├─ Status: Submitted | Graded
    │  ├─ Current grade (if graded)
    │  └─ Action: "Review & Grade"

22. Instructor clicks "Review & Grade"
    ├─ Can view submitted file
    ├─ Can download/open file
    ├─ Can add feedback
    ├─ Can enter grade (0-100)
    ├─ Submits grading
    ├─ Status changes to "Graded"
    ├─ Student notified: "Assignment graded"
    └─ Email sent with feedback

STAGE 8: LIVE SESSIONS
━━━━━━━━━━━━━━━━━━━━━
23. Instructor navigates to /instructor/live
    ├─ Lists upcoming sessions
    ├─ Can "Create Live Session"
    ├─ Form:
    │  ├─ Title
    │  ├─ Description
    │  ├─ Scheduled date/time
    │  ├─ Select course
    │  └─ "Create"

24. Live session record created
    ├─ Status: "scheduled"
    ├─ Stream Chat channel created: session_${sessionId}
    └─ RSVPs tracked

25. At session start time
    ├─ Status changes to "live"
    ├─ Notifications sent to enrolled students
    ├─ Instructor clicks "Start Session"
    ├─ Stream Chat UI loads
    ├─ Recording begins
    └─ Students can join via /app/live

26. During live session
    ├─ Instructor streams video
    ├─ Students can see in real-time
    ├─ Chat messages in sidebar
    ├─ Instructor can screen share (if enabled)
    ├─ Recording captures everything
    └─ Duration tracked

27. Session ends
    ├─ Instructor clicks "End Session"
    ├─ Status changes to "ended"
    ├─ Recording uploaded to storage
    ├─ Recording URL stored
    ├─ Students get notification: "Session recording available"
    └─ Students can watch playback anytime

STAGE 9: EARNINGS & ANALYTICS
━━━━━━━━━━━━━━━━━━━━━━━━━━
28. Instructor navigates to /instructor/earnings
    ├─ Shows revenue dashboard:
    │  ├─ Total lifetime earnings
    │  ├─ This month earnings
    │  ├─ Pending payout
    │  └─ Last payout date

29. Analytics by course
    ├─ For each course:
    │  ├─ Total enrollments
    │  ├─ Active students
    │  ├─ Revenue generated
    │  ├─ Average completion rate
    │  ├─ Average rating
    │  └─ Chart showing enrollment over time

30. Analytics by lesson
    ├─ Most watched lessons
    ├─ Lessons with high drop-off
    ├─ Time spent per lesson
    ├─ Quiz pass rates
    └─ Assignment completion rates

STAGE 10: CONTINUOUS MANAGEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━
31. Instructor updates course
    ├─ Adds new modules/lessons
    ├─ Updates existing content
    ├─ Updates quiz questions
    ├─ Changes course description
    ├─ Updates price
    └─ Changes access model (free → paid)

32. Instructor communicates with students
    ├─ Replies to assignment questions
    ├─ Sends announcements
    ├─ Creates additional resources
    ├─ Moderates discussion forums
    └─ Provides feedback on submissions

33. Instructor responds to feedback
    ├─ Sees low ratings
    ├─ Reads student reviews
    ├─ Updates course based on feedback
    ├─ May archive poorly-performing course
    └─ May create improved version
```

---

## 👨‍⚖️ JOURNEY 3: Admin Control Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ADMIN MANAGEMENT JOURNEY                             │
└─────────────────────────────────────────────────────────────────────────┘

ADMIN DASHBOARD: /admin
━━━━━━━━━━━━━━━━━━━━━
Stats Monitored:
├─ Total Users: Count from users table
├─ Active Enrollments: Count of active enrollments
├─ Monthly Revenue: SUM(payments.amount) WHERE month = current
├─ Live Sessions: Count of active/scheduled sessions
├─ Total Courses: COUNT(*)
├─ Published Courses: COUNT(WHERE isPublished = true)
├─ Completion Rate: (completed_enrollments / total_enrollments) * 100
└─ Total Revenue: SUM(payments.amount) all time

Alerts:
├─ If totalUsers === 0: "No users registered yet" (Setup alert)
├─ If activeEnrollments === 0: "No active enrollments" (Content alert)
├─ If monthlyRevenue === 0: "No revenue this month" (Promo alert)
└─ Else: "All systems operational" (OK status)

Quick Actions Panel:
├─ User Management
├─ Marketing CMS
├─ Course Oversight
├─ Payment Records
├─ Live Session Control
├─ Moderation Queue
└─ Audit Trail

ADMIN WORKFLOWS:

1. USER MANAGEMENT (/admin/users)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Lists all users
- Shows: name, email, role, joined date, status
- Actions:
  ├─ View profile
  ├─ Assign role (admin, instructor, moderator, student)
  ├─ Disable/suspend account
  ├─ Delete user
  └─ View activity

- Assigning instructor role:
  1. Admin selects user
  2. Clicks "Make Instructor"
  3. assignRole(userId, "instructor")
  4. User.labels updated: adds "instructor"
  5. Email sent to user: "You're now an instructor!"
  6. User sees /instructor dashboard on next login

- Banning user:
  1. User flagged for abuse
  2. Admin clicks "Ban User"
  3. User.status = false
  4. All enrollments become inactive
  5. User cannot login
  6. Email sent: Reason for ban

2. MARKETING CMS (/admin/marketing)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Homepage content management
- Edit home page sections:
  ├─ Hero title & subtitle
  ├─ About section
  ├─ Stats (students, courses, hours, years)
  ├─ Learning domains (4 blocks)
  ├─ What you'll learn (grid of blocks)
  ├─ Featured courses (manual selection)
  ├─ Why choose Amar Bhaiya (points)
  └─ CTA text

- Database: SiteCopyRecord table
  ├─ key: "hero_title"
  ├─ body: "Padhai karo apne tareeke se"
  ├─ payload: JSON with styling options
  ├─ isPublished: true/false
  └─ updatedAt: timestamp

- Admin workflow:
  1. Navigates to /admin/marketing
  2. Sees current content
  3. Clicks "Edit Section"
  4. Updates content
  5. Previews changes
  6. Clicks "Publish"
  7. Changes go live (no caching delay)
  8. revalidatePath("/") refreshes cache

3. COURSE MANAGEMENT (/admin/courses)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Lists all courses (published + draft)
- Shows: title, instructor, students enrolled, status, rating
- Actions:
  ├─ View course
  ├─ Publish/unpublish
  ├─ Feature on homepage
  ├─ Archive
  ├─ Delete

- Publishing course (by admin):
  1. Admin reviews course quality
  2. Checks title, description, thumbnail
  3. Verifies modules & lessons
  4. Checks video content
  5. Clicks "Approve & Publish"
  6. Course.isPublished = true
  7. Course visible on /courses
  8. Instructor notified

- Featuring course:
  1. Admin selects course
  2. Clicks "Feature on Homepage"
  3. Adds to featured_courses list
  4. Appears in homepage "Courses" section
  5. Increases visibility & enrollments

4. PAYMENT MANAGEMENT (/admin/payments)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Payment records dashboard
- Shows: transaction ID, amount, method, status, date
- Methods: razorpay
- Statuses: pending, completed, failed, refunded

- Admin can:
  ├─ View transaction details
  ├─ Issue refund
  ├─ Mark as completed (manual)
  ├─ Dispute transaction
  └─ Export to CSV

- Refund workflow:
  1. Admin views transaction
  2. Clicks "Issue Refund"
  3. Confirms amount to refund
  4. Calls Razorpay API (if applicable)
  5. Creates refund record
  6. Student notified
  7. Refund appears in payment history

5. LIVE SESSION CONTROL (/admin/live)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Lists all live sessions
- Shows: title, instructor, scheduled time, status, RSVP count

- Admin can:
  ├─ View session
  ├─ Join session (observer)
  ├─ End session early
  ├─ Cancel session
  └─ Download recording

- Cancelling session:
  1. Admin clicks "Cancel Session"
  2. Status changes to "cancelled"
  3. All RSVPed students notified
  4. Notification: "Session cancelled - reason: [text]"
  5. Recording removed (or archived)

6. MODERATION QUEUE (/admin/moderation)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Escalated reports from moderators
- Shows: reported content, reporter, reason, action taken
- Types: comment, post, user, thread

- Admin workflow:
  1. Views report
  2. Reviews reported content
  3. Decides action:
     ├─ Dismiss report (false alarm)
     ├─ Delete content (violates TOS)
     ├─ Mute user (temporary silence)
     ├─ Ban user (permanent removal)
     └─ Warn user (escalate to user)
  4. Creates ModerationAction record
  5. Notifies user of action taken
  6. Creates AuditLog for record

7. AUDIT LOGS (/admin/audit)
━━━━━━━━━━━━━━━━━━━━━━━━
- Complete activity log of all actions
- Records: actor, action, entity, timestamp
- Examples:
  ├─ User john_doe published course "React Basics"
  ├─ User jane_smith created assignment "Project 1"
  ├─ Admin admin_user deleted user spam_account
  ├─ Moderator mod_user muted user aggressive_user
  └─ System marked 5 quizzes as completed

- Admin can:
  ├─ Filter by actor, action, entity
  ├─ Search logs
  ├─ Export logs
  └─ Archive old logs

NOTIFICATIONS (/admin/notifications)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- System notifications for admins
- Examples:
  ├─ New course published (needs review)
  ├─ Payment failed (needs attention)
  ├─ User reported content (needs moderation)
  ├─ Instructor account pending approval
  ├─ High complaint rate for course
  └─ Server error on /api/payments

OPERATIONS (/admin/operations)
━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Advanced settings
- Options:
  ├─ Site maintenance mode (disable logins)
  ├─ Email settings (SMTP, sender)
  ├─ Payment gateway settings
  ├─ API keys management
  ├─ Backup & restore
  ├─ Database maintenance
  ├─ CDN purge cache
  └─ Admin alerts settings

ANALYTICS (/admin/analytics - Implied)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Detailed platform analytics
- Charts:
  ├─ User growth over time
  ├─ Revenue trends
  ├─ Course popularity
  ├─ Enrollment funnels
  ├─ Completion rates by course
  ├─ Quiz pass rates
  └─ Community engagement

- Reports:
  ├─ Monthly active users
  ├─ Revenue by course
  ├─ Student lifetime value
  ├─ Instructor performance
  ├─ Course performance
  └─ Community health
```

---

## 🛡️ JOURNEY 4: Moderator Enforcement

```
MODERATOR DASHBOARD: /moderator
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Stats:
├─ Open reports: count where status = "open"
├─ Muted users: count with active mute
├─ Flagged threads: count where flag = true
└─ Actions today: count where date = today

MODERATION WORKFLOWS:

1. REPORT REVIEW (/moderator/reports)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Flow:
1. User flags comment/post
   └─ reportUserAction called

2. Creates ModerationAction record:
   ├─ entityType: "comment" | "post" | "thread" | "user"
   ├─ entityId: id of reported item
   ├─ reportedBy: user.$id
   ├─ reason: string
   ├─ status: "open" (default)
   └─ createdAt: now

3. Notification sent to available moderators
   └─ "New report: [content preview]"

4. Moderator navigates to /moderator/reports
   ├─ Lists all open reports
   ├─ Shows:
   │  ├─ Content preview
   │  ├─ Reporter name
   │  ├─ Reason for report
   │  ├─ Created timestamp
   │  └─ Actions: "Review & Decide"

5. Moderator clicks "Review & Decide"
   ├─ Modal shows full content
   ├─ Shows reporter reasoning
   ├─ Moderator decides:
   │  ├─ "Dismiss" (not violation)
   │  ├─ "Delete" (violates TOS)
   │  ├─ "Warn User" (first warning)
   │  ├─ "Mute User" (temporary silence)
   │  └─ "Escalate to Admin" (serious)

6. Action taken
   ├─ updateModerationActionAction called
   ├─ ModerationAction.status = "resolved"
   ├─ ModerationAction.action = chosen action
   ├─ ModerationAction.moderatorId = mod.$id
   ├─ ModerationAction.createdAt = now
   └─ User notified of action

2. COMMUNITY MODERATION (/moderator/community)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Forum threads:
- Lists threads (all categories)
- Shows: title, author, replies, last reply
- Flags: "Pinned", "Locked", "Hidden"

Actions on thread:
├─ Pin thread (bump to top)
├─ Lock thread (no new replies)
├─ Hide thread (only moderators see)
├─ Delete thread (remove completely)
└─ Warn author

Pinning workflow:
1. Moderator clicks "Pin Thread"
2. Updates ForumThread.isPinned = true
3. Thread moves to top of category
4. Appears with "PINNED" badge
5. Helps highlight important discussions

Locking workflow:
1. Moderator clicks "Lock Thread"
2. Updates ForumThread.isLocked = true
3. Existing replies still visible
4. New replies blocked
5. Shows "Thread locked" message
6. Use case: Off-topic discussions, old threads

3. USER MANAGEMENT (/moderator/students)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Lists users with violations:
- Shows: name, email, reports count, last action
- Status: Active, Muted, Warned, Flagged

Moderator actions:
├─ View user profile
├─ View user's posts
├─ View user's reports
├─ Mute user (duration: 1h, 1d, 7d, 30d, permanent)
├─ Warn user (first step before mute)
├─ Remove from course (if abuse in course)
└─ Flag for admin review

Muting workflow:
1. Click "Mute User"
2. Select duration
3. Confirm & optionally add message
4. Updates ModerationAction:
   ├─ action: "mute"
   ├─ duration: selected time
   ├─ moderatorId: mod.$id
   └─ createdAt: now
5. User receives notification
6. User.isMuted = true (if permanent)
7. User can't post new content
8. Mute auto-expires on schedule
```

---

## 📊 CRITICAL USER INTERACTIONS SUMMARY

```
TOTAL USER FLOWS DOCUMENTED:
├─ Student journey: 29 steps across 9 stages
├─ Instructor journey: 33 steps across 10 stages
├─ Admin journey: 7 major workflows + 20+ sub-workflows
└─ Moderator journey: 3 workflows with 15+ actions

KEY CONVERSION POINTS:
1. Homepage → Registration: Hero CTA buttons
2. Registration → Login: Session creation
3. Browse → Enroll: Course detail page CTA
4. Enroll → Payment: Payment modal
5. Payment → Dashboard: Auto-redirect
6. Dashboard → Course: "Continue Learning"
7. Course → Completion → Certificate
8. Certificate → Share: Social proof loop

RETENTION MECHANISMS:
1. Progress tracking (visual bars)
2. Streaks (gamification)
3. Certificates (achievement badges)
4. Live sessions (community)
5. Notifications (re-engagement)
6. Email digests (communication)
7. Community interactions (social)
8. Leaderboards (implied, not shown)

REVENUE STREAMS:
1. Paid courses (one-time)
2. Subscription model (recurring)
3. Instructor commissions (platform revenue)
4. Premium courses (tiered)
```

---

**END OF USER JOURNEYS ANALYSIS**

