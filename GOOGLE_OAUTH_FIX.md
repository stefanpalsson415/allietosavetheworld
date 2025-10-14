# Google Calendar OAuth Fix

## The Issue
Google is showing "Google hasn't verified this app" because the app needs to go through Google's verification process for production use.

## Quick Fix (For Testing)
1. When you see the warning screen, click "Advanced" at the bottom left
2. Then click "Go to checkallie.com (unsafe)"
3. This will allow you to proceed with the calendar sync

## Long-term Solution (For Production)
You need to verify the app with Google by:

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select your project** (parentload-ba995)
3. **Go to APIs & Services > OAuth consent screen**
4. **Submit for verification** by:
   - Filling out all required fields
   - Adding your privacy policy URL
   - Adding authorized domains (checkallie.com)
   - Submitting for Google review

## Alternative: Use Internal App Type
1. Go to OAuth consent screen
2. Change from "External" to "Internal"
3. This bypasses verification but limits users to your Google Workspace organization

## Current Status
- ✅ Firestore permissions fixed
- ✅ Calendar sync date range extended
- ⚠️ Google OAuth verification pending
- ✅ All other calendar fixes deployed

## Test Steps After Fix
1. Go to https://checkallie.com
2. Settings → Calendar & Events
3. Click "Advanced" → "Go to checkallie.com (unsafe)"
4. Complete Google auth
5. Sync calendar - should now pull full year of events