# User Setup Audit - How to Run

## Purpose
This script audits your current Firebase setup to identify:
- Which users exist in Firebase Auth vs Firestore
- Which users have complete family connections
- Data gaps and missing links
- Whether leads collection exists

**Run this BEFORE deleting any user data** to understand what exists.

---

## Step 1: Get Firebase Admin Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/project/parentload-ba995/settings/serviceaccounts/adminsdk)

2. Click **"Service accounts"** tab

3. Click **"Generate new private key"**

4. Click **"Generate key"** in the confirmation dialog

5. A JSON file will download (e.g., `parentload-ba995-firebase-adminsdk-xxxxx.json`)

---

## Step 2: Save Service Account Key

1. Rename the downloaded file to: `serviceAccountKey.json`

2. Move it to your project root:
   ```
   /Users/stefanpalsson/parentload copy/parentload-clean/serviceAccountKey.json
   ```

3. **IMPORTANT**: The file is already in `.gitignore` - do NOT commit it to git

---

## Step 3: Install Dependencies (if needed)

The script uses Firebase Admin SDK:

```bash
npm install firebase-admin
```

---

## Step 4: Run the Audit

```bash
cd "/Users/stefanpalsson/parentload copy/parentload-clean"
node audit-user-setup.js
```

---

## What the Script Does

### Checks:
1. **Firebase Auth** - All users with login credentials
   - Counts by auth method (password, Google OAuth, phone/OTP)
   - Email verification status
   - Last sign-in times

2. **Firestore `users` collection** - User metadata documents
   - Which users have `familyId` fields
   - Auth methods stored
   - User profiles

3. **Firestore `families` collection** - Family documents
   - Family members (parents + kids)
   - Which families have complete member arrays
   - Primary emails

4. **Firestore `leads` collection** - Marketing leads (if exists)
   - Blog subscribers
   - Quiz completions
   - Conversion status

### Identifies Gaps:
- ⚠️ Users in Auth but not Firestore (bypassed onboarding)
- ⚠️ Users without `familyId` (can't access family features)
- ⚠️ Users with invalid `familyId` (broken links)
- ⚠️ Families without parent users (orphaned data)
- ⚠️ Firestore users without Auth (shouldn't happen)

### Output:
1. **Console Report** - Summary with recommendations
2. **JSON File** - Full detailed report: `user-audit-[timestamp].json`

---

## Expected Output

```
🔍 STARTING USER SETUP AUDIT

📋 Step 1: Checking Firebase Authentication users...
   Found 5 users in Firebase Auth:
   - Password: 2
   - Google OAuth: 1
   - Phone (OTP): 2
   - Other: 0

📋 Step 2: Checking Firestore users collection...
   Found 3 user documents in Firestore:
   - With familyId: 2
   - Without familyId: 1

📋 Step 3: Checking Firestore families collection...
   Found 2 family documents:
   - With members: 2
   - Empty: 0

📋 Step 4: Checking for leads collection...
   ℹ️  Leads collection does not exist (will need to create)

📋 Step 5: Identifying data gaps...
   Gaps identified:
   - Auth-only users (no Firestore): 2
   - Users without familyId: 1
   - Families without Auth users: 0

================================================================================
USER SETUP AUDIT REPORT
================================================================================

📊 SUMMARY
Complete Users (Auth + Firestore + Family): 2
Incomplete Users: 3

⚠️  DATA GAPS
Auth-only users (missing Firestore): 2
Users without familyId: 1

💡 RECOMMENDATIONS
⚠️  2 users have login credentials but no Firestore metadata
⚠️  1 user has no familyId - cannot access family features
ℹ️  No leads collection found - need to create system for blog/quiz emails

✅ Full report saved to: user-audit-1728567890123.json
```

---

## After Running

### Review the Report:
1. Check console output for high-level summary
2. Open the JSON file for detailed data
3. Identify which users have complete setups
4. Identify which users are incomplete

### Next Steps Based on Results:

**If you have complete users:**
- Decide whether to keep or delete them
- Understand their data structure

**If you have incomplete users (likely OTP issue):**
- These are users stuck in Auth without full setup
- Missing Firestore metadata and family connections
- Should be cleaned up or completed

**If leads collection doesn't exist:**
- We'll create it for blog/quiz email collection
- Separate from full user accounts

---

## Questions?

- **"Why do some users only exist in Auth?"**
  → They logged in via OTP but didn't complete onboarding

- **"Why don't some users have familyId?"**
  → They created accounts but didn't create a family

- **"What's the difference between Auth and Firestore?"**
  → Auth = login credentials, Firestore = user data/metadata

- **"Should I delete incomplete users?"**
  → Yes, if starting fresh. They're stuck in partial setup state.

---

## Security Notes

⚠️ **IMPORTANT:**
- `serviceAccountKey.json` has full admin access to your Firebase project
- NEVER commit it to git (already in `.gitignore`)
- NEVER share it publicly
- Delete it after running the audit if you want
- Regenerate keys periodically for security

---

**Created**: October 10, 2025
**Purpose**: Pre-deletion audit to understand current user data state
