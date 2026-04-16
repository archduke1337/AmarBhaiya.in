# 🎯 QUICK REFERENCE - LOGIN NOT WORKING

## 60 Second Fix

```bash
# 1. Create env file
cp .env.example .env.local

# 2. Edit with your Appwrite credentials:
# NEXT_PUBLIC_APPWRITE_ENDPOINT=http://localhost/v1
# NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_id
# APPWRITE_API_KEY=your_key

# 3. Restart
npm run dev

# 4. Test
# Visit http://localhost:3000/login
```

---

## Common Issues & Fixes

### "Missing required environment variable"
→ Create `.env.local` file with Appwrite credentials

### "Invalid email or password"
→ Register first at `/register` or create user in Appwrite Console

### "Login failed. Please try again"
→ Check Appwrite is running: `curl http://localhost/v1/health`

### "No session" on dashboard
→ Clear cookies: `document.cookie = ""` in browser console

### Network error / timeout
→ Wrong endpoint URL or Appwrite not running

---

## Verify Setup

```bash
# Check env file exists
test -f .env.local && echo "✓ .env.local found" || echo "✗ Missing .env.local"

# Check Appwrite reachable
curl http://localhost/v1/health

# Check port 3000 free
lsof -i :3000
```

---

## Key Files

- **Login form:** `src/components/auth/login-form.tsx`
- **Auth logic:** `src/lib/appwrite/actions.ts`
- **Config:** `src/lib/appwrite/config.ts`
- **Setup template:** `.env.example`
- **Full guide:** `AUTH_SETUP_GUIDE.md`

---

## Environment Variables Needed

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=http://localhost/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=abc123...
APPWRITE_API_KEY=secret_key...
```

Get these from Appwrite Console → Settings → API Keys

---

## Browser DevTools Checks

```javascript
// In browser console (F12):

// 1. Check cookie is set
document.cookie
// Should contain: a_session_<PROJECT_ID>=...

// 2. Check fetch succeeded
// Go to Network tab → look for POST /_action/...
// Should show 200 OK response

// 3. Clear cookies and retry
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
});
location.href = '/login';
```

---

## Need Help?

📖 Read: `AUTH_SETUP_GUIDE.md` (complete guide with diagrams)
📖 Read: `LOGIN_ISSUE_ANALYSIS.md` (7-point troubleshooting)
🔧 Run: `bash check-auth.sh` or `.\check-auth.ps1` (diagnostic)

---

## Test Without UI

```bash
# 1. Create user in Appwrite Console
# Go to Users → Add User

# 2. Test with curl
curl -X POST http://localhost/v1/account/sessions/email \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Appwrite-Project: YOUR_PROJECT_ID" \
  -d "email=user@example.com&password=Password123"

# 3. Should return session object with "secret" field
```

---

**Last Updated:** 2026-04-05
