# Route Coverage Map & Phase Checklist

Generated on: 2026-04-01
Source of truth: implementation_plan.md + current src/app tree

## Coverage Snapshot

- Planned page routes: 33
- Implemented page routes: 11
- Missing page routes: 22
- Planned API routes: 9
- Implemented API routes: 9
- Missing API routes: 0
- Planned framework routes (`not-found.tsx`, `error.tsx`): 2
- Implemented framework routes: 0
- Missing framework routes: 2

## Implemented Page Routes

- `src/app/(marketing)/page.tsx` -> `/`
- `src/app/(marketing)/about/page.tsx` -> `/about`
- `src/app/(marketing)/courses/page.tsx` -> `/courses`
- `src/app/(marketing)/courses/[slug]/page.tsx` -> `/courses/[slug]`
- `src/app/(marketing)/blog/page.tsx` -> `/blog`
- `src/app/(marketing)/blog/[slug]/page.tsx` -> `/blog/[slug]`
- `src/app/(marketing)/contact/page.tsx` -> `/contact`
- `src/app/(auth)/login/page.tsx` -> `/login`
- `src/app/(auth)/register/page.tsx` -> `/register`
- `src/app/(auth)/forgot-password/page.tsx` -> `/forgot-password`
- `src/app/(dashboard)/app/dashboard/page.tsx` -> `/app/dashboard`

## Missing Page Routes

### Public Group (`(marketing)` target)

- None

### Student App Group (`(dashboard)/app`)

- `src/app/(dashboard)/app/courses/[id]/page.tsx` -> `/app/courses/[id]`
- `src/app/(dashboard)/app/community/page.tsx` -> `/app/community`
- `src/app/(dashboard)/app/profile/[id]/page.tsx` -> `/app/profile/[id]`

### Instructor Group (`(dashboard)/instructor`)

- `src/app/(dashboard)/instructor/page.tsx` -> `/instructor`
- `src/app/(dashboard)/instructor/courses/page.tsx` -> `/instructor/courses`
- `src/app/(dashboard)/instructor/courses/new/page.tsx` -> `/instructor/courses/new`
- `src/app/(dashboard)/instructor/courses/[id]/page.tsx` -> `/instructor/courses/[id]`
- `src/app/(dashboard)/instructor/courses/[id]/curriculum/page.tsx` -> `/instructor/courses/[id]/curriculum`
- `src/app/(dashboard)/instructor/students/page.tsx` -> `/instructor/students`
- `src/app/(dashboard)/instructor/live/page.tsx` -> `/instructor/live`

### Moderator Group (`(dashboard)/moderator`)

- `src/app/(dashboard)/moderator/page.tsx` -> `/moderator`
- `src/app/(dashboard)/moderator/reports/page.tsx` -> `/moderator/reports`
- `src/app/(dashboard)/moderator/students/page.tsx` -> `/moderator/students`
- `src/app/(dashboard)/moderator/community/page.tsx` -> `/moderator/community`

### Admin Group (`(dashboard)/admin`)

- `src/app/(dashboard)/admin/page.tsx` -> `/admin`
- `src/app/(dashboard)/admin/users/page.tsx` -> `/admin/users`
- `src/app/(dashboard)/admin/courses/page.tsx` -> `/admin/courses`
- `src/app/(dashboard)/admin/categories/page.tsx` -> `/admin/categories`
- `src/app/(dashboard)/admin/payments/page.tsx` -> `/admin/payments`
- `src/app/(dashboard)/admin/live/page.tsx` -> `/admin/live`
- `src/app/(dashboard)/admin/moderation/page.tsx` -> `/admin/moderation`
- `src/app/(dashboard)/admin/audit/page.tsx` -> `/admin/audit`

### Framework Routes

- `src/app/not-found.tsx`
- `src/app/error.tsx`

## API Route Coverage

### Implemented

- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/api/auth/oauth/route.ts`
- `src/app/api/payments/razorpay/create-order/route.ts`
- `src/app/api/payments/razorpay/webhook/route.ts`
- `src/app/api/payments/phonepe/create-order/route.ts`
- `src/app/api/payments/phonepe/webhook/route.ts`
- `src/app/api/stream/token/route.ts`

### Missing

- None

## Completed In This Pass (Option 2)

- Added payments helper: `src/lib/payments/razorpay.ts`
- Added payments helper: `src/lib/payments/phonepe.ts`
- Added Stream helper: `src/lib/stream/client.ts`
- Added OAuth callback API route with secure session cookie set
- Added Razorpay order/webhook API routes with Appwrite payment + enrollment sync
- Added PhonePe order/webhook API routes with Appwrite payment + enrollment sync
- Added Stream token API route using authenticated Appwrite session user
- Added auth login/register/logout API routes with validation and session cookie lifecycle
- Added public routes: about, courses list/detail, blog list/detail, and contact page
- Added shared content module for course and blog route rendering

## Phase-Aligned Execution Checklist

### Phase A: Close API Auth Gap (High Priority)

- [x] Implement `src/app/api/auth/register/route.ts`
- [x] Implement `src/app/api/auth/login/route.ts`
- [x] Implement `src/app/api/auth/logout/route.ts`
- [ ] Add API contract tests for auth route handlers

### Phase B: Public Route Completion (High Priority)

- [x] Build `/about`
- [x] Build `/courses` and `/courses/[slug]`
- [x] Build `/blog` and `/blog/[slug]`
- [x] Build `/contact`

### Phase C: Core Student Experience (High Priority)

- [ ] Build `/app/courses/[id]`
- [ ] Build `/app/community`
- [ ] Build `/app/profile/[id]`

### Phase D: Role Dashboards (Medium Priority)

- [ ] Build instructor route set (7 routes)
- [ ] Build moderator route set (4 routes)
- [ ] Build admin route set (8 routes)

### Phase E: Framework Safety Net (Medium Priority)

- [ ] Add `src/app/not-found.tsx`
- [ ] Add `src/app/error.tsx`
- [ ] Ensure user-friendly fallback UI and route-safe recoverability

## Validation Commands

Run after each phase to keep the codebase stable:

```bash
npm run lint
npm run build
```
