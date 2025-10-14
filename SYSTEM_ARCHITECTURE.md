# SYSTEM ARCHITECTURE - Allie (Parentload)

## ⚠️ CRITICAL: READ THIS BEFORE MAKING ANY CHANGES

This document maps the ACTUAL system architecture. Always check how things actually work before implementing changes.

Last Updated: 2025-08-24

---

## 🔴 THE EMAIL PROBLEMS THAT HAPPENED

### Problem 1: Fixed Wrong Service
**What went wrong:** Claude assumed emails were handled by Cloud Run backend and spent time fixing the wrong service.

**Reality:** 
- OTP/Verification emails are handled by **Firebase Functions** (`europe-west1-parentload-ba995.cloudfunctions.net/auth`)
- NOT by Cloud Run backend (`parentload-backend-363935868004.us-central1.run.app`)

**Why this happened:**
1. There are TWO config files that conflict:
   - `/src/config.js` → Points to Firebase Functions (auth)
   - `/src/config/index.js` → Points to Cloud Run
2. OnboardingFlow imports from `/src/config.js` (Firebase Functions)
3. Claude saw Cloud Run backend had email code and assumed that's what was being used

### Problem 2: SendGrid Sender Verification
**What broke:** Emails stopped sending with error "The from address does not match a verified Sender Identity"

**Cause:** Changed from email to `hello@allie.family` which wasn't a verified sender

**Fix:** Must use `stefan@checkallie.com` which is verified in SendGrid

### Problem 3: Wrong Name in Emails
**Issue:** Emails showed "spalsson" extracted from email instead of actual family name

**Root Cause:** 
- Login screen sends `email.split('@')[0]` as userName
- Firebase Function wasn't looking up the actual family name from Firestore

**Fix:** Firebase Function now queries Firestore to get the actual family name

---

## 📧 EMAIL FLOW - HOW IT ACTUALLY WORKS

### Verification/OTP Emails
1. **UI Component**: `OnboardingFlow.jsx` or `NotionFamilySelectionScreen.jsx`
2. **Config Used**: `/src/config.js` (NOT `/src/config/index.js`)
3. **API Called**: `https://europe-west1-parentload-ba995.cloudfunctions.net/auth/send-otp`
4. **Handler**: Firebase Function `auth` in `functions/index.js`
5. **Email Service**: SendGrid via Firebase Function's own `sendOTPEmail()` function
6. **Template Location**: Inside `functions/index.js` (lines 390-445)

### Onboarding Email Sequence (5 emails over 10 days)
1. **Trigger**: Firebase Function `onFamilyCreated` (Firestore trigger)
2. **Scheduler**: Firebase Function `processOnboardingEmails` (runs daily)
3. **Email Templates**: Defined in `functions/index.js` `getOnboardingEmailTemplate()`
4. **Status Tracking**: Firestore collections `onboardingSequences` and `onboardingSchedules`

### Family Emails (forwarding)
1. **Webhook**: `/api/emails/inbound` (Cloud Run backend)
2. **Handler**: `server/inbound-email-webhook-simple.js`
3. **Processing**: Stores in Firestore `families/{familyId}/emails`

---

## 🏗️ ARCHITECTURE OVERVIEW

### Frontend (React App)
- **Hosting**: Firebase Hosting (https://checkallie.com)
- **Framework**: React with Tailwind CSS
- **State**: Context API + Local State
- **Auth**: Firebase Auth

### Backend Services (3 Separate Systems!)

#### 1. Firebase Functions (europe-west1)
- **URL**: `https://europe-west1-parentload-ba995.cloudfunctions.net`
- **Functions**:
  - `auth` - OTP email verification
  - `claude` - Claude AI proxy
  - `sendScheduledHabitReminders` - Scheduled habits
  - `onFamilyCreated` - Triggers onboarding emails
  - `processOnboardingEmails` - Sends scheduled emails

#### 2. Cloud Run Backend (us-central1)
- **URL**: `https://parentload-backend-363935868004.us-central1.run.app`
- **Server**: `server/server-simple.js`
- **Purpose**: 
  - Twilio SMS verification
  - Inbound email/SMS webhooks
  - Sales chat endpoint
  - Alternative auth endpoints (not used!)

#### 3. Local Development Servers
- Various test servers in `/server` directory
- Not deployed to production

---

## 🔌 INTEGRATIONS

### SendGrid (Email)
- **API Key**: Stored in Firebase Functions config AND Cloud Run env vars
- **From Email**: `stefan@checkallie.com` (MUST be a verified sender in SendGrid!)
- **Previous Issue**: Was using `hello@allie.family` which wasn't verified, causing emails to fail
- **Used By**: 
  - Firebase Functions (ACTUALLY SENDS EMAILS)
  - Cloud Run backend (HAS CODE BUT NOT USED FOR OTP)

### Twilio (SMS)
- **Phone**: +17197486209
- **Used By**: Cloud Run backend only
- **Endpoints**: `/api/twilio/send-verification`, `/api/twilio/verify-code`

### Claude AI (Anthropic)
- **Two API Keys**:
  - Regular: For Firebase Function proxy
  - Sales: For sales chat via Cloud Run
- **Proxy Endpoints**:
  - Firebase: `https://europe-west1-parentload-ba995.cloudfunctions.net/claude`
  - Cloud Run: `https://parentload-backend-363935868004.us-central1.run.app/api/claude`

### Firebase Services
- **Auth**: User authentication
- **Firestore**: Database
- **Storage**: File storage
- **Hosting**: Frontend hosting

### Mapbox
- **Token**: In frontend config
- **Purpose**: Location services for events

---

## 🚨 COMMON PITFALLS TO AVOID

1. **Config Confusion**: 
   - `/src/config.js` → Firebase Functions
   - `/src/config/index.js` → Cloud Run
   - Components may import different ones!

2. **Email Services**:
   - Don't modify Cloud Run email code thinking it will fix OTP emails
   - OTP emails are in Firebase Functions only

3. **Multiple Unused Endpoints**:
   - Cloud Run has `/api/auth/send-otp` but it's NOT USED
   - Many test endpoints exist but aren't connected

4. **Environment Variables**:
   - Firebase Functions use `functions.config()`
   - Cloud Run uses environment variables
   - They're separate systems!

---

## ✅ VERIFICATION CHECKLIST BEFORE CHANGES

### Before Modifying Email Functionality:
1. [ ] Check which component is calling the API
2. [ ] Verify which config file is imported
3. [ ] Confirm the actual URL being called
4. [ ] Check if it's Firebase Functions or Cloud Run
5. [ ] Look at the actual function/endpoint handling it

### Before Adding New Features:
1. [ ] Check if similar functionality already exists
2. [ ] Verify which backend should handle it
3. [ ] Ensure you're not duplicating existing code
4. [ ] Check all config files for conflicts

### Before Deploying:
1. [ ] Firebase Functions: `firebase deploy --only functions`
2. [ ] Cloud Run: `gcloud run deploy`
3. [ ] Frontend: `npm run build && firebase deploy --only hosting`
4. [ ] Check environment variables are set in the right place

---

## 📁 KEY FILES TO UNDERSTAND

### Configuration
- `/src/config.js` - Points to Firebase Functions (OLD)
- `/src/config/index.js` - Points to Cloud Run (NEWER)
- Check imports to know which is used!

### Email Templates
- **OTP Emails**: `functions/index.js` `sendOTPEmail()` function
- **Onboarding Emails**: `functions/index.js` `getOnboardingEmailTemplate()`
- **NOT USED**: `server/sendgrid-email-service.js` (Cloud Run - this confused us!)

### Email Name Resolution
1. Firebase Function receives email address
2. Queries Firestore for family with that email
3. Extracts `familyName` or `name` field from family document
4. Uses that in email greeting (e.g., "Hey Palsson Family!")
5. Falls back to email prefix only if no family found

### Authentication Flow
- **Frontend**: `src/components/onboarding/OnboardingFlow.jsx`
- **Backend**: `functions/index.js` (auth function)

### API Endpoints Actually Used
- `https://europe-west1-parentload-ba995.cloudfunctions.net/auth/send-otp`
- `https://europe-west1-parentload-ba995.cloudfunctions.net/auth/verify-otp`
- `https://parentload-backend-363935868004.us-central1.run.app/api/twilio/*`
- `https://parentload-backend-363935868004.us-central1.run.app/api/claude/sales`

---

## 🔄 HOW TO TRACE ANY FLOW

1. Start at the UI component
2. Check what it imports (config)
3. Look at the actual fetch/API call
4. Find the backend handling that URL
5. Trace through the actual handler
6. Verify where emails/SMS are sent from

**Example: OTP Email Flow**
```
OnboardingFlow.jsx 
→ imports config from '../../config' 
→ calls ${config.backend.url}/send-otp
→ config.js has url: 'https://europe-west1.../auth'
→ Firebase Function 'auth' handles it
→ sendOTPEmail() in functions/index.js sends email
```

---

## 🚀 DEPLOYMENT COMMANDS

### Firebase Functions
```bash
# Set config
firebase functions:config:set sendgrid.api_key="KEY"

# Deploy specific function
firebase deploy --only functions:auth

# Deploy all functions
firebase deploy --only functions
```

### Cloud Run
```bash
# Deploy backend
cd server
gcloud run deploy parentload-backend --source . --region us-central1

# Update env vars
gcloud run services update parentload-backend --update-env-vars KEY=VALUE
```

### Frontend
```bash
npm run build
firebase deploy --only hosting
```

---

## ⚠️ CRITICAL REMINDER

**ALWAYS** trace the actual flow before making changes. Don't assume based on:
- File names
- Code that exists but might not be used
- What "should" be happening

Check what IS happening by following the actual API calls!