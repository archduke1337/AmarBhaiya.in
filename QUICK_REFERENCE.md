# 📚 QUICK REFERENCE GUIDE - AmarBhaiya.in Codebase

## 📁 DIRECTORY STRUCTURE QUICK REF

```
src/
├── actions/          → Server actions (16 files)
│   ├── account.ts    → User account operations
│   ├── auth.ts       → Authentication (login/register - if exists)
│   ├── dashboard.ts  → Dashboard data
│   ├── enrollment.ts → Course enrollment
│   ├── quiz.ts       → Quiz submission
│   ├── comments.ts   → Course comments
│   ├── payments.ts   → Payment handling
│   └── ...
│
├── app/              → Next.js App Router
│   ├── layout.tsx    → Root layout (ThemeProvider, Navbar)
│   ├── globals.css   → Global styles (Tailwind)
│   ├── (auth)/       → Auth routes (login, register, etc)
│   ├── (dashboard)/  → Protected dashboard routes
│   │   ├── admin/    → Admin dashboard
│   │   ├── instructor/ → Instructor dashboard
│   │   ├── moderator/  → Moderator dashboard
│   │   └── app/      → Student dashboard
│   ├── (marketing)/  → Public routes (home, courses, blog)
│   └── api/          → API routes (4 groups)
│       ├── auth/
│       ├── content/
│       ├── payments/
│       └── stream/
│
├── components/       → React components (30+)
│   ├── ui/          → Shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── tabs.tsx
│   │   └── ...
│   ├── dashboard/   → Dashboard-specific
│   │   ├── stat-card.tsx
│   │   ├── activity-feed.tsx
│   │   └── page-header.tsx
│   ├── course/      → Course player
│   │   ├── course-player.tsx
│   │   ├── video-player.tsx
│   │   ├── lesson-sidebar.tsx
│   │   └── comment-section.tsx
│   ├── layout/      → Layout components
│   │   ├── sidebar.tsx
│   │   └── dashboard-header.tsx
│   ├── navbar.tsx
│   ├── footer.tsx
│   ├── theme-provider.tsx
│   ├── theme-toggle.tsx
│   ├── quiz-form.tsx
│   ├── razorpay-checkout.tsx
│   └── ...
│
├── lib/              → Utilities & libraries
│   ├── appwrite/
│   │   ├── config.ts     → APPWRITE_CONFIG (tables, buckets, env)
│   │   ├── auth.ts       → getLoggedInUser(), requireAuth()
│   │   ├── auth-utils.ts → getUserRole()
│   │   ├── server.ts     → createSessionClient(), createAdminClient()
│   │   ├── client.ts     → Browser-safe Appwrite client
│   │   ├── actions.ts    → logoutAction(), redirects
│   │   ├── dashboard-data.ts → Dashboard queries
│   │   └── marketing-content.ts → Content queries
│   ├── payments/
│   │   ├── razorpay.ts  → getRazorpayClient(), verifyWebhook()
│   ├── stream/
│   │   └── client.ts    → Stream Chat setup, tokens
│   ├── errors/
│   │   ├── error-handler.ts → Production error handling
│   │   └── action-result.ts → Result wrapper
│   ├── utils/
│   │   ├── cn.ts         → clsx + tailwind-merge
│   │   ├── constants.ts  → Site config, routes, roles
│   │   ├── file-urls.ts  → File URL generation
│   │   └── format.ts     → Format utilities
│   ├── validators/      → Zod validation schemas
│   │   └── course.ts    → Course, Module, Lesson, Contact
│   └── utils.ts         → Main export (cn function)
│
├── types/            → TypeScript types
│   └── appwrite.ts   → Interfaces for all Appwrite collections
│
├── proxy.ts          → Appwrite SDK proxy (if needed)
│
scripts/
└── setup-appwrite.mjs → Database setup script

env files:
├── .env.local       → Local environment variables
├── .env.production  → Production secrets (not in repo)
└── .env.example     → Template (should be in repo)
```

---

## 🔑 KEY FILES TO UNDERSTAND

### 1. **Authentication & Security**
- `src/lib/appwrite/config.ts` - Appwrite configuration
- `src/lib/appwrite/auth.ts` - Auth functions
- `src/lib/appwrite/server.ts` - Admin/Session clients
- `src/lib/payments/razorpay.ts` - Payment verification

### 2. **Database Schema**
- `src/types/appwrite.ts` - All collection interfaces
- `scripts/setup-appwrite.mjs` - Database setup

### 3. **Components & Styling**
- `src/components/theme-provider.tsx` - Dark/light mode
- `src/components/ui/button.tsx` - CVA pattern example
- `src/app/layout.tsx` - Root layout

### 4. **Configuration**
- `src/lib/utils/constants.ts` - Site constants
- `src/lib/appwrite/config.ts` - Appwrite tables/buckets
- `next.config.ts` - Next.js configuration

### 5. **Error Handling**
- `src/lib/errors/error-handler.ts` - Production-grade error handling

---

## 🎯 COMMON TASKS

### Add a New Server Action
```typescript
// File: src/actions/my-feature.ts
"use server";

import { requireAuth } from "@/lib/appwrite/auth";
import { createSessionClient } from "@/lib/appwrite/server";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { ID } from "node-appwrite";

export async function myAction(formData: FormData): Promise<void> {
  const user = await requireAuth(); // Get current user
  
  try {
    const { tablesDB } = await createSessionClient();
    
    // Database operation
    await tablesDB.createRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.myTable,
      data: { /* ... */ }
    });
  } catch (error) {
    console.error(error);
  }
}
```

### Create a New Component
```typescript
// File: src/components/my-component.tsx
import { cn } from "@/lib/utils";

type MyComponentProps = {
  label: string;
  variant?: "default" | "secondary";
};

export function MyComponent({ label, variant = "default" }: MyComponentProps) {
  return (
    <div className={cn(
      "p-4 rounded-lg",
      variant === "default" && "bg-primary text-primary-foreground",
      variant === "secondary" && "bg-secondary text-secondary-foreground"
    )}>
      {label}
    </div>
  );
}
```

### Add API Route
```typescript
// File: src/app/api/my-route/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate, process, etc
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### Query Database
```typescript
import { Query } from "node-appwrite";
import { createSessionClient } from "@/lib/appwrite/server";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";

const { tablesDB } = await createSessionClient();

// Get single row
const result = await tablesDB.getRow({
  databaseId: APPWRITE_CONFIG.databaseId,
  tableId: APPWRITE_CONFIG.tables.courses,
  rowId: "course_123"
});

// List with query
const results = await tablesDB.listRows({
  databaseId: APPWRITE_CONFIG.databaseId,
  tableId: APPWRITE_CONFIG.tables.courses,
  queries: [
    Query.equal("instructorId", [userId]),
    Query.limit(10),
    Query.offset(0)
  ]
});

// Create
await tablesDB.createRow({
  databaseId: APPWRITE_CONFIG.databaseId,
  tableId: APPWRITE_CONFIG.tables.courses,
  rowId: ID.unique(),
  data: { title: "New Course" }
});

// Update
await tablesDB.updateRow({
  databaseId: APPWRITE_CONFIG.databaseId,
  tableId: APPWRITE_CONFIG.tables.courses,
  rowId: "course_123",
  data: { title: "Updated Title" }
});

// Delete
await tablesDB.deleteRow({
  databaseId: APPWRITE_CONFIG.databaseId,
  tableId: APPWRITE_CONFIG.tables.courses,
  rowId: "course_123"
});
```

### Add Authentication to Route
```typescript
// Protect with requireAuth()
import { requireAuth } from "@/lib/appwrite/auth";

export default async function MyPage() {
  const user = await requireAuth(); // Redirects to /login if not authenticated
  
  return (
    <div>
      <p>Welcome, {user.name}!</p>
    </div>
  );
}

// Protect with role check
import { requireRole } from "@/lib/appwrite/auth";

export default async function AdminPage() {
  const { user, role } = await requireRole(["admin"]);
  // Only admins can access
  
  return <div>Admin Panel</div>;
}
```

### Validate Input
```typescript
// File: src/lib/validators/my-validator.ts
import { z } from "zod";

export const mySchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  age: z.number().int().positive()
});

export type MyInput = z.infer<typeof mySchema>;

// In server action:
const parsed = mySchema.safeParse(formData);
if (!parsed.success) {
  return { error: parsed.error.flatten() };
}
```

### Handle Errors Safely
```typescript
import { handleActionError, ErrorHandlers } from "@/lib/errors/error-handler";

try {
  // Operation
} catch (error) {
  const message = ErrorHandlers.validation(error, {
    userId: user.$id,
    action: "createCourse",
    resource: "course",
    details: { courseId }
  });
  
  return { error: message }; // Safe message sent to client
}
```

### Payment Flow
```typescript
// 1. Create order
const response = await fetch("/api/payments/razorpay/create-order", {
  method: "POST",
  body: JSON.stringify({ courseId, amount: 4999, currency: "INR" })
});
const { orderId } = await response.json();

// 2. Open Razorpay
new Razorpay({
  key: PUBLIC_KEY_ID,
  order_id: orderId,
  amount: amount * 100,
  currency: "INR",
  handler: async (response) => {
    // 3. Verify signature
    await fetch("/api/payments/razorpay/verify", {
      method: "POST",
      body: JSON.stringify({
        orderId: response.razorpay_order_id,
        paymentId: response.razorpay_payment_id,
        signature: response.razorpay_signature
      })
    });
  }
}).open();
```

---

## 🔒 ENVIRONMENT VARIABLES

```bash
# Public (browser-safe)
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=amarbhaiya_db
NEXT_PUBLIC_RAZORPAY_KEY_ID=key_id
NEXT_PUBLIC_STREAM_API_KEY=stream_key

# Private (server-only)
APPWRITE_API_KEY=secret_key
RAZORPAY_KEY_SECRET=secret_key
STREAM_API_SECRET=secret
```

---

## 📚 APPWRITE COLLECTIONS (30+)

```
CORE LMS:
- courses, categories, modules, lessons, resources

PROGRESS:
- enrollments, progress, certificates

ASSESSMENTS:
- quizzes, quiz_questions, quiz_attempts
- assignments, submissions

COMMUNITY:
- course_comments
- forum_categories, forum_threads, forum_replies

LIVE:
- live_sessions, session_rsvps

PAYMENTS:
- payments, subscriptions

ADMIN:
- moderation_actions, audit_logs
- notifications

MARKETING:
- blog_posts, site_copy

USER:
- student_profiles, billing_info, standaloneResources
```

---

## 🎨 STYLING CHEAT SHEET

```typescript
// Tailwind Classes
className="flex items-center justify-between gap-4"  // Layout
className="p-4 rounded-lg border border-border"       // Spacing
className="bg-primary text-primary-foreground"        // Colors
className="text-sm font-semibold uppercase"           // Typography
className="transition-colors hover:bg-muted"          // Interactions
className="dark:bg-slate-900 dark:text-white"        // Dark mode
className="sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" // Responsive

// CVA Button Pattern
<Button variant="primary" size="lg">Click me</Button>
// Variants: default, outline, secondary, ghost, destructive, link
// Sizes: xs, sm, default, lg, icon
```

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Set production environment variables
- [ ] Run `npm run build` successfully
- [ ] Test `npm run lint` passes
- [ ] Run `npm test` (when added)
- [ ] Verify Appwrite connection
- [ ] Verify Razorpay keys
- [ ] Test authentication flow
- [ ] Test payment flow
- [ ] Check error logging (Sentry)
- [ ] Monitor Core Web Vitals
- [ ] Setup CDN for media
- [ ] Configure backups
- [ ] Setup monitoring/alerts

---

## 📞 USEFUL COMMANDS

```bash
# Development
npm run dev           # Start dev server on port 3000

# Production
npm run build         # Build for production
npm run start         # Start production server

# Quality
npm run lint          # Run ESLint
npm test              # Run Vitest (when added)

# Database
node scripts/setup-appwrite.mjs  # Setup Appwrite collections

# Clean
rm -rf .next node_modules
npm install
```

---

## 🎯 NEXT STEPS FOR NEW DEVELOPERS

1. **Clone & Setup**
   ```bash
   git clone repo
   cd AmarBhaiya.in
   cp .env.example .env.local
   npm install
   ```

2. **Understand Project**
   - Read `DEEP_ANALYSIS.md`
   - Review `ARCHITECTURE_SUMMARY.md`
   - Check `src/lib/utils/constants.ts`

3. **Setup Local Env**
   - Create Appwrite instance
   - Run `scripts/setup-appwrite.mjs`
   - Get Razorpay test keys

4. **Run Dev Server**
   ```bash
   npm run dev
   # Open http://localhost:3000
   ```

5. **Make Changes**
   - Create feature branch
   - Follow existing patterns
   - Test thoroughly
   - Submit PR

---

**Generated:** April 3, 2026  
**Status:** Complete ✅

