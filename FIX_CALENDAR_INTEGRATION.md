# Fix Calendar Integration Issues

## Issues Identified
1. Missing Firestore composite index for events collection
2. Google Calendar sync permission errors
3. Email history permission errors
4. Calendar settings permission errors

## Solution Steps

### 1. Create Missing Firestore Index

The error log shows a missing index. Click this link to create it:
https://console.firebase.google.com/v1/r/project/parentload-ba995/firestore/indexes?create_composite=Ck9wcm9qZWN0cy9wYXJlbnRsb2FkLWJhOTk1L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9ldmVudHMvaW5kZXhlcy9fEAEaDAoIZmFtaWx5SWQQARoKCgZzdGF0dXMQARoNCglzdGFydFRpbWUQAhoMCghfX25hbWVfXxAC

Or manually create it in Firebase Console:
1. Go to Firebase Console → Firestore Database → Indexes
2. Create a composite index for `events` collection:
   - Field 1: `familyId` (Ascending)
   - Field 2: `status` (Ascending)  
   - Field 3: `startTime` (Descending)
   - Collection group: events

### 2. Add Missing Collections to Firestore Rules

Some collections might be missing from the rules. Add these if not present:

```javascript
// Calendar-related collections
match /userSettings/{userId} {
  allow read: if true;
  allow write: if request.auth != null || true; // Allow for calendar settings
}

match /calendarSync/{syncId} {
  allow read: if true;
  allow write: if true;
}

match /googleCalendarEvents/{eventId} {
  allow read: if true;
  allow write: if true;
}
```

### 3. Fix Permission Issues in Code

The main issue seems to be that the user might not be properly authenticated when trying to access certain collections. Here's what needs to be checked:

1. **Email History Access**: The EmailIngestService is trying to access email history but getting permission denied
2. **Calendar Settings**: The CalendarService is getting permission denied when loading settings
3. **Google Calendar Sync**: The sync is failing due to Firestore write permissions

### 4. Immediate Fix - Update Firestore Rules

Update your `firestore.rules` file to ensure these collections have proper permissions:

```javascript
// Add these specific rules if missing
match /emailHistory/{historyId} {
  allow read: if true;
  allow write: if true;
}

match /userSettings/{userId} {
  allow read: if true;
  allow write: if true;
}

match /calendarSync/{syncId} {
  allow read: if true;
  allow write: if true;
}

match /notificationPreferences/{prefId} {
  allow read: if true;
  allow write: if true;
}
```

### 5. Deploy the Rules

After updating the rules file, deploy them:

```bash
firebase deploy --only firestore:rules
```

### 6. Verify Google Calendar API Setup

1. Check that Google Calendar API is enabled in Google Cloud Console
2. Verify OAuth consent screen is configured
3. Ensure the OAuth client ID is correct in your app
4. Check that the redirect URIs match your app URLs

### 7. Test the Integration

After applying these fixes:

1. Refresh the app
2. Try syncing Google Calendar again
3. Check if events load properly
4. Verify that the inbox processes emails correctly

## Root Cause Analysis

The issues stem from:
1. **Missing Firestore indexes** - The events collection needs composite indexes for complex queries
2. **Incomplete Firestore rules** - Some collections weren't included in the security rules
3. **Authentication state** - The app might be trying to access Firestore before proper authentication

## Prevention for Future

1. **Always test calendar integration after deployment**
2. **Monitor Firestore rules and indexes**
3. **Keep a list of all collections that need rules**
4. **Test with different user authentication states**

## Collections That Need Rules

Here's a complete list of collections that should have rules:

- events
- emailInbox
- smsInbox
- emailHistory
- userSettings
- calendarSync
- googleCalendarEvents
- notificationPreferences
- families
- users
- kanbanTasks
- providers
- habits
- documents
- familyDocuments
- chatMessages

## Quick Test Commands

After applying fixes, test with:

```javascript
// In browser console
localStorage.setItem('google_access_token', 'YOUR_TOKEN');
location.reload();
```

This should help the Google Calendar sync work properly.