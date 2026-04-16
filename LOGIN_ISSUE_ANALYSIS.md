# 🔐 Login Issue Analysis & Troubleshooting Guide

**Date:** April 5, 2026  
**Project:** AmarBhaiya.in (Next.js + Appwrite)

---

## 📋 EXECUTIVE SUMMARY

Your authentication system is **well-architected** but users cannot login. This document identifies **potential failure points** and provides solutions.

---

## 🔍 AUTHENTICATION FLOW (Current Implementation)

```
User → LoginForm (Client) 
  → loginAction() (Server Action)
  → createPublicClient() (Appwrite)
  → account.createEmailPasswordSession()
  → Set Cookie: a_session_${PROJECT_ID}
  → Redirect to /app/dashboard
```

### Stack Used:
- **Frontend:** React 19 + Next.js 16.2.1 (App Router)
- **Backend:** Appwrite v23.0.0 (node-appwrite SDK)
- **ORM:** Appwrite Tables (SQL-like DB)
- **Auth Method:** Email/Password sessions with cookies
- **Session Storage:** HTTP-only cookies (secure)

---

## ⚠️ CRITICAL FAILURE POINTS

### **1. MISSING ENVIRONMENT VARIABLES** ⭐ MOST LIKELY CAUSE
**Severity:** 🔴 CRITICAL

**Required Variables:**
```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://your-appwrite.instance.com
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
APPWRITE_API_KEY=your_api_key_here (Server-side only)
NEXT_PUBLIC_APPWRITE_DATABASE_ID=amarbhaiya_db (optional, has fallback)
```

**Location:** `.env.local` (git-ignored)

**Check:**
```bash
# In project root, verify these exist:
echo $NEXT_PUBLIC_APPWRITE_ENDPOINT
echo $NEXT_PUBLIC_APPWRITE_PROJECT_ID
echo $APPWRITE_API_KEY
```

**Impact:** 
- If missing, `requireEnv()` in `config.ts` throws an error
- Users see: "Missing required environment variable"
- Login page may not load at all

---

### **2. SESSION COOKIE NAME MISMATCH** ⭐ HIGH IMPACT
**Severity:** 🟠 HIGH

**Current Logic:**
```typescript
// config.ts
sessionCookieName: `a_session_${PROJECT_ID}`

// Required format for Appwrite:
// MUST be: a_session_<PROJECT_ID>
// Example: a_session_12345abc
```

**Problem:** If `PROJECT_ID` is undefined, cookie name becomes `a_session_undefined`.

**Check:**
- Open DevTools → Application → Cookies
- Look for: `a_session_xxx` (where xxx = your project ID)
- If missing or named differently → **Session creation failed**

---

### **3. APPWRITE PROJECT MISCONFIGURATION**
**Severity:** 🟠 HIGH

**Checklist:**
- [ ] Appwrite instance is **running** (`docker compose up`)
- [ ] Project ID in `.env` matches actual Appwrite Project ID
- [ ] Email/Password authentication method is **enabled** in project settings
- [ ] Project endpoint is **correct and reachable**

**Test Connection:**
```bash
curl -X GET https://your-endpoint/v1/health
# Should return 200 OK with health status
```

---

### **4. CORS ISSUES** (If Appwrite on different domain)
**Severity:** 🟡 MEDIUM

**Symptom:** Login form submits but gets network error.

**Solution:** Configure CORS in Appwrite Console:
```
Settings → Domains → Add your dev domain
Example: http://localhost:3000
```

---

### **5. APPWRITE SDK VERSION MISMATCH**
**Severity:** 🟡 MEDIUM

**Current:**
- `node-appwrite: ^23.0.0` (server-side)
- `appwrite: ^24.0.0` (client-side)

**Issue:** Version mismatch can cause API incompatibilities.

**Solution:** Update both to same major version:
```bash
npm install node-appwrite@^24.0.0 appwrite@^24.0.0
```

---

### **6. COOKIE SECURITY SETTINGS**
**Severity:** 🟡 MEDIUM

**Current Configuration:**
```typescript
// getSessionCookieOptions() in actions.ts
{
  path: "/",
  httpOnly: true,           // ✅ Good - prevents XSS
  sameSite: "strict",       // ✅ Good - prevents CSRF
  secure: NODE_ENV === "production",  // ⚠️ May fail in dev
  expires: new Date(expire)
}
```

**Dev Mode Issue:** 
- In development, `secure: false` (correct)
- But if you're using HTTP on production → cookies won't set

**Check:**
```typescript
// Ensure dev server runs on http://localhost:3000
// For HTTPS, Appwrite may reject non-secure cookies
```

---

### **7. USER ACCOUNT DOESN'T EXIST**
**Severity:** 🟡 MEDIUM

**Symptom:** Login fails with "Invalid credentials" for any email.

**Solution:** Register first or check if user exists in Appwrite Console:
```
Appwrite Console → Project → Auth → Users
```

---

## 🛠️ DIAGNOSTIC STEPS

### Step 1: Verify Environment
```bash
# Check if .env.local exists
ls -la .env.local

# Print env variables (be careful with secrets!)
env | grep APPWRITE

# In Next.js context (if running dev server):
# Check browser console for logs
```

### Step 2: Test Appwrite Connection
```bash
# Terminal: Check Appwrite is reachable
curl https://your-appwrite-endpoint/v1/health

# Browser Console (Dev Tools → Console):
# After running dev server, try:
console.log("Endpoint:", process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
console.log("Project ID:", process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
```

### Step 3: Monitor Network Requests
```
1. Open DevTools → Network tab
2. Go to /login page
3. Submit login form
4. Look for POST request to /_action/...
5. Check Response body for error message
```

### Step 4: Check Server Logs
```bash
# Terminal where `npm run dev` is running
# Look for errors like:
# - "Missing required environment variable: NEXT_PUBLIC_APPWRITE_ENDPOINT"
# - "No session" (when accessing protected routes)
# - Appwrite API errors
```

### Step 5: Database & Tables Check
```
Appwrite Console → Project → Databases → amarbhaiya_db
- Verify database exists
- Verify all tables are created (should be ~25 tables)
- If missing, run: npm run setup-appwrite
```

---

## 🔧 QUICK FIXES (Priority Order)

### FIX #1: Create `.env.local`
```bash
# In project root:
cat > .env.local << 'EOF'
NEXT_PUBLIC_APPWRITE_ENDPOINT=http://localhost/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=YOUR_PROJECT_ID_HERE
APPWRITE_API_KEY=YOUR_API_KEY_HERE
EOF
```

### FIX #2: Restart Dev Server
```bash
# Stop current process (Ctrl+C)
npm run dev
```

### FIX #3: Clear Cookies & Cache
```javascript
// In browser console:
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
});
location.reload();
```

### FIX #4: Update Dependencies
```bash
npm install node-appwrite@^24.0.0 appwrite@^24.0.0
npm run dev
```

### FIX #5: Setup Appwrite Database
```bash
# If tables don't exist:
npm run setup-appwrite
```

---

## 📊 ERROR MESSAGE MAPPING

| Error Message | Likely Cause | Solution |
|---|---|---|
| "Missing required environment variable: NEXT_PUBLIC_APPWRITE_ENDPOINT" | No `.env.local` | Create env file |
| "Invalid email or password" | Wrong credentials | Check credentials or register first |
| "No session" | Session cookie not set | Check cookie security settings |
| Network error / timeout | Appwrite unreachable | Check endpoint URL, CORS settings |
| "already exists" (on register) | User exists | Use forgot-password to reset |
| Page redirects to login infinitely | `requireAuth()` failing | Session not persisting, check cookies |

---

## 🧪 TEST AUTHENTICATION MANUALLY

### Create a Test User (via Appwrite Console)
```
1. Open Appwrite Console → Users
2. Click "Add User"
3. Enter: email@test.com, password: Test12345
4. Back on app: Login with same credentials
```

### Test with curl
```bash
curl -X POST https://your-endpoint/v1/account/sessions/email \
  -H "X-Appwrite-Project: YOUR_PROJECT_ID" \
  -d 'email=test@example.com' \
  -d 'password=Test12345'

# Should return session object with secret
```

---

## 🚀 NEXT STEPS

1. **Verify `.env.local` exists** with all 3 required variables
2. **Restart `npm run dev`**
3. **Check browser DevTools → Network → look for errors**
4. **Test in Appwrite Console directly** (create user, verify auth works)
5. **If still failing:** Share:
   - Exact error message from browser/terminal
   - Network request/response (from DevTools)
   - `.env.local` setup (without secrets)

---

## 📚 RELATED FILES

- Auth actions: `src/lib/appwrite/actions.ts`
- Config: `src/lib/appwrite/config.ts`
- Server setup: `src/lib/appwrite/server.ts`
- Login form: `src/components/auth/login-form.tsx`
- Validators: `src/lib/validators/auth.ts`
- Setup script: `scripts/setup-appwrite.mjs`

---

## ✅ CHECKLIST

- [ ] `.env.local` file created with APPWRITE env variables
- [ ] `npm run dev` restarted after env changes
- [ ] Appwrite instance is running
- [ ] Project ID in `.env` matches Appwrite Console
- [ ] Email/Password auth enabled in Appwrite project settings
- [ ] Test user created in Appwrite
- [ ] Browser cookies showing `a_session_xxx` after login attempt
- [ ] No network errors in DevTools

---

**Last Updated:** 2026-04-05

