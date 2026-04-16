# 🚀 AUTHENTICATION SETUP & TROUBLESHOOTING GUIDE

## Quick Start (5 minutes)

### 1. Setup Environment Variables
```bash
# Copy template to local
cp .env.example .env.local

# Edit with your Appwrite credentials
# nano .env.local  (or open in your editor)
```

**Required values:**
```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=http://localhost/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=abc123xyz...
APPWRITE_API_KEY=your_secret_key_here
```

### 2. Restart Development Server
```bash
# Kill current process
# Ctrl+C

# Start fresh
npm run dev

# Watch terminal for startup messages
# Should not show "Missing required environment variable" errors
```

### 3. Test Login
```
1. Visit http://localhost:3000/login
2. Try login with test credentials (if user exists)
3. Check browser DevTools → Console/Network for errors
```

---

## 🔧 Detailed Troubleshooting

### Issue: "Missing required environment variable"

**Cause:** `.env.local` not set up or variable missing

**Fix:**
```bash
# Verify .env.local exists
cat .env.local

# Should output:
# NEXT_PUBLIC_APPWRITE_ENDPOINT=...
# NEXT_PUBLIC_APPWRITE_PROJECT_ID=...
# APPWRITE_API_KEY=...
```

---

### Issue: "Login failed. Please try again."

**Possible Causes:**

#### A) Invalid Credentials
- User doesn't exist yet
- Password is incorrect
- Email not registered

**Fix:**
```
1. Go to http://localhost:3000/register
2. Create a new test account
3. Then try login
```

#### B) Appwrite Not Reachable
- Appwrite Docker container not running
- Wrong endpoint URL in `.env.local`

**Fix:**
```bash
# Test connection
curl http://localhost/v1/health

# Should return 200 OK with health data
# If fails, start Appwrite Docker:
docker compose up -d
```

#### C) Project ID Mismatch
- `PROJECT_ID` in `.env.local` doesn't match actual Appwrite project

**Fix:**
```
1. Open Appwrite Console
2. Go to Settings → API Keys
3. Copy your Project ID
4. Update .env.local: NEXT_PUBLIC_APPWRITE_PROJECT_ID=<copied-id>
5. Restart dev server
```

---

### Issue: Login Works But User Not Authenticated on Dashboard

**Cause:** Session cookie not persisting

**Check:**
```javascript
// In browser console:
document.cookie

// Should show: a_session_<PROJECT_ID>=...
```

**Fix:**
```javascript
// Clear cookies and try again
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
});
location.href = '/login';
```

---

### Issue: "No session" Error on Protected Routes

**Cause:** Session cookie not being read by server

**Fix:**
1. **Check `.env.local`** has `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
2. **Verify cookie name** matches (should be `a_session_<PROJECT_ID>`)
3. **Clear browser cookies** and login again

---

## 📊 Testing Auth Flow

### Manual Test (without UI)

**1. Create User via Appwrite Console**
```
Go to: Appwrite Console → Your Project → Auth → Users
Click "Add User"
Email: testuser@example.com
Password: TestPass123
```

**2. Test Login with curl**
```bash
curl -X POST http://localhost/v1/account/sessions/email \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Appwrite-Project: YOUR_PROJECT_ID" \
  -d "email=testuser@example.com&password=TestPass123"

# Should return:
# {
#   "$id": "session_id_here",
#   "secret": "session_secret",
#   "expire": "2026-04-06T..."
# }
```

**3. Test Protected Route**
```bash
# Using the session secret from response above:
curl http://localhost/v1/account \
  -H "X-Appwrite-Session: session_secret" \
  -H "X-Appwrite-Project: YOUR_PROJECT_ID"

# Should return user details
```

---

## 🗂️ File Structure Reference

```
src/
├── lib/appwrite/
│   ├── actions.ts          ← loginAction() implementation
│   ├── auth.ts             ← getLoggedInUser(), requireAuth()
│   ├── config.ts           ← APPWRITE_CONFIG with env vars
│   ├── server.ts           ← Client creation (session/admin)
│   └── auth-utils.ts       ← getUserRole(), assignRole()
│
├── components/auth/
│   └── login-form.tsx      ← Frontend form component
│
└── actions/
    └── account.ts          ← User account operations
```

---

## 🔄 Complete Login Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   USER SUBMITS LOGIN FORM                    │
│         (email: user@example.com, password: pwd)            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │  Validation (loginSchema via Zod)   │
        │  ✓ Valid email format                │
        │  ✓ Password not empty                │
        └──────────────────────────┬───────────┘
                                   │
                      ┌────────────▼────────────┐
                      │  Validation Failed?    │
                      ├────────────┬───────────┤
                      │ No (continue)      Yes │
                      │            └─► Error  │
                      │                Display │
                      │                        │
                      └────────────┬───────────┘
                                   │
                                   ▼
        ┌──────────────────────────────────────┐
        │ createPublicClient()                 │
        │ Requires:                            │
        │ • NEXT_PUBLIC_APPWRITE_ENDPOINT     │
        │ • NEXT_PUBLIC_APPWRITE_PROJECT_ID   │
        └──────────────────────────┬───────────┘
                                   │
                      ┌────────────▼────────────┐
                      │ Env vars missing?      │
                      ├────────────┬───────────┤
                      │ No (cont)  │  Yes      │
                      │            └─► Throw  │
                      │                Error  │
                      │                        │
                      └────────────┬───────────┘
                                   │
                                   ▼
        ┌──────────────────────────────────────┐
        │ account.createEmailPasswordSession()│
        │ Makes HTTP POST to:                  │
        │ POST /v1/account/sessions/email      │
        │ With: email, password                │
        └──────────────────────────┬───────────┘
                                   │
                      ┌────────────▼────────────┐
                      │ Appwrite Response?     │
                      ├─────────┬──────┬──────┤
                      │ Success │Error │ Fail │
                      │ (cont)  │(err)│(err)│
                      │         │     │     │
                      └────┬────┴─────┴─────┘
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │ Set Session Cookie                   │
        │ Name: a_session_<PROJECT_ID>        │
        │ Value: session.secret                │
        │ Options:                             │
        │ • httpOnly: true                     │
        │ • sameSite: strict                   │
        │ • secure: production-only            │
        │ • expires: session.expire            │
        └──────────────────────────┬───────────┘
                                   │
                                   ▼
        ┌──────────────────────────────────────┐
        │ Return { success: true }             │
        └──────────────────────────┬───────────┘
                                   │
                                   ▼
        ┌──────────────────────────────────────┐
        │ Router: Redirect to dashboard        │
        │ /app/dashboard                       │
        └──────────────────────────┬───────────┘
                                   │
                                   ▼
        ┌──────────────────────────────────────┐
        │ Next.js Server Action                │
        │ requireAuth() checks:                │
        │ • getLoggedInUser()                  │
        │ • Read session cookie                │
        │ • Fetch user from Appwrite           │
        └──────────────────────────┬───────────┘
                                   │
                      ┌────────────▼────────────┐
                      │ Session Valid?         │
                      ├────────────┬───────────┤
                      │ Yes (OK)   │ No        │
                      │            └─► Redirect
                      │                 to /login
                      │
                      └────────────┬───────────┘
                                   │
                                   ▼
        ┌──────────────────────────────────────┐
        │ ✅ USER AUTHENTICATED                │
        │ Dashboard renders with user data     │
        └──────────────────────────────────────┘
```

---

## 🚨 Common Error Messages

| Error | Location | Cause | Solution |
|-------|----------|-------|----------|
| `Missing required environment variable: NEXT_PUBLIC_APPWRITE_ENDPOINT` | `config.ts` | `.env.local` not setup | Create `.env.local` with all required vars |
| `No session` | `server.ts:createSessionClient()` | Cookie not found | Login again, check cookies |
| `Invalid credentials` | Appwrite API | Wrong email/password | Register or use correct credentials |
| `404 Not Found` | Network | Appwrite endpoint unreachable | Check endpoint URL, start Docker |
| `CORS error` | Browser console | Appwrite CORS not configured | Add domain to Appwrite CORS settings |

---

## ✅ Verification Checklist

Before debugging, verify:

- [ ] `.env.local` file exists in project root
- [ ] Contains: `NEXT_PUBLIC_APPWRITE_ENDPOINT`
- [ ] Contains: `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
- [ ] Contains: `APPWRITE_API_KEY`
- [ ] `npm run dev` restarted after creating `.env.local`
- [ ] No "Missing environment variable" errors in terminal
- [ ] Appwrite instance is running
- [ ] Can access `APPWRITE_ENDPOINT/v1/health` via curl
- [ ] Test user exists in Appwrite Console

---

## 📞 Still Having Issues?

Provide this info:

1. **Exact error message** (from browser console or terminal)
2. **Full URL** you're trying to access
3. **Steps to reproduce**
4. **Terminal output** from `npm run dev`
5. **Network request/response** (DevTools → Network tab)
6. **Appwrite logs** (check Docker logs if self-hosted)

