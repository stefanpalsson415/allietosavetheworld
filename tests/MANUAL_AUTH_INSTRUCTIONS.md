# Manual Authentication Capture Instructions

Since you've already logged into the app, we can capture your auth state from Chrome DevTools!

## Option 1: Capture from Chrome DevTools (FASTEST - 30 seconds)

### Step 1: Open the app in Chrome
Go to http://localhost:3000 (should already be logged in)

### Step 2: Open DevTools
- Press `Cmd + Option + J` (Mac) or `F12` (Windows/Linux)
- Click the "Console" tab

### Step 3: Run this script in the console

```javascript
// Copy all this code and paste into Chrome DevTools Console:

(async () => {
  console.log('🔐 Capturing auth state...');

  // Get localStorage
  const localStorage = {};
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    localStorage[key] = window.localStorage.getItem(key);
  }

  // Get cookies
  const cookies = document.cookie.split(';').map(c => {
    const [name, value] = c.trim().split('=');
    return { name, value, domain: window.location.hostname };
  });

  // Create Playwright storageState format
  const storageState = {
    cookies: cookies,
    origins: [{
      origin: window.location.origin,
      localStorage: Object.entries(localStorage).map(([name, value]) => ({ name, value }))
    }]
  };

  // Check for Firebase auth
  const firebaseKeys = Object.keys(localStorage).filter(k => k.includes('firebase'));
  console.log('✅ Firebase auth keys found:', firebaseKeys.length);
  console.log('Keys:', firebaseKeys);

  // Download as JSON file
  const blob = new Blob([JSON.stringify(storageState, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'user.json';
  a.click();

  console.log('✅ Downloaded user.json - Move it to tests/.auth/user.json');
  console.log('📊 Auth state summary:');
  console.log('  - Cookies:', cookies.length);
  console.log('  - localStorage items:', Object.keys(localStorage).length);
  console.log('  - Firebase auth keys:', firebaseKeys.length);
})();
```

### Step 4: Move the downloaded file
```bash
# The script downloads user.json to your Downloads folder
# Move it to the tests directory:
mv ~/Downloads/user.json "/Users/stefanpalsson/parentload copy/parentload-clean/tests/.auth/user.json"
```

### Step 5: Verify it worked
```bash
# Check file size (should be > 1KB)
ls -lh "/Users/stefanpalsson/parentload copy/parentload-clean/tests/.auth/user.json"

# Check it contains Firebase auth
grep -o "firebase" "/Users/stefanpalsson/parentload copy/parentload-clean/tests/.auth/user.json" | wc -l
# Should show 2 or more
```

---

## Option 2: Run the Playwright Test (5 minutes)

If Option 1 doesn't work, run the Playwright test:

```bash
npx playwright test tests/manual-auth-capture.spec.js --project=setup --headed
```

**Instructions:**
1. Browser opens
2. Log in with phone + OTP
3. Wait 5 minutes
4. Auth is captured automatically

---

## How to Verify Auth Capture Worked

### Good Auth File (CORRECT):
```json
{
  "cookies": [...],
  "origins": [{
    "origin": "http://localhost:3000",
    "localStorage": [
      {
        "name": "firebase:authUser:AIza...",
        "value": "{\"uid\":\"zJ70Yc4bgkea71ztUneHfjyOuYk2\",\"email\":\"spalsson@gmail.com\",...}"
      },
      ...
    ]
  }]
}
```
**Size:** 2-5 KB
**Firebase keys:** 2+

### Bad Auth File (WRONG):
```json
{
  "cookies": [],
  "origins": []
}
```
**Size:** 36 bytes
**Firebase keys:** 0

---

## Once Auth is Captured

### Run calendar tests:
```bash
npx playwright test tests/calendar-crud-refactored.spec.js --project=chromium
```

### Expected result:
- ✅ No login modal
- ✅ Dashboard loads immediately
- ✅ Calendar visible
- ✅ Tests can create/edit/delete events

### If tests still fail with login modal:
```bash
# Delete and re-capture
rm tests/.auth/user.json
# Run Option 1 or Option 2 again
```

---

## Troubleshooting

### "File is still empty after Option 1"
- Make sure you're logged into localhost:3000 (not checkallie.com)
- Check if you're actually on the dashboard (not login screen)
- Try logging out and back in, then run script again

### "Script didn't download file"
- Check Downloads folder
- Try running script again
- Browser may have blocked download - check popup blocker

### "Tests still show login modal"
- Check file size: `ls -lh tests/.auth/user.json`
- If < 1KB, auth capture failed
- Run Option 2 (Playwright test) instead

---

## Why This Matters

**Firebase auth tokens expire:**
- Access token: 1 hour
- Refresh token: 30 days

**What this means:**
- Capture works for ~30 days
- After 30 days, re-run auth capture
- Or whenever tests start showing login modal

---

**Next:** Once auth is captured, we can continue with:
- Priority 1b: Verify calendar tests pass
- Priority 2: Add 4 regression tests
- Priority 4: Optimize test speed
- Priority 5: Add coverage tracking
