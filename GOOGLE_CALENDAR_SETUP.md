# Google Calendar Integration Setup

## Current Status
✅ Google OAuth credentials are configured in `.env`
✅ Firestore rules updated to allow calendar sync collections
✅ Calendar sync functionality is implemented

## Google OAuth Verification Warning

When you first connect Google Calendar, you'll see:
> "Google hasn't verified this app"

**This is normal for apps in development.** To proceed:

1. Click "Continue" (not "Back to safety")
2. On the next screen, click "Continue" to grant calendar permissions
3. The app will then sync your Google Calendar events

## How to Use Google Calendar Sync

1. **Navigate to Calendar Tab**
   - Click on "Family Calendar" in the dashboard

2. **Open Calendar Settings**
   - Click the settings icon in the calendar header
   - Or look for "Sync Calendar" button

3. **Connect Google Calendar**
   - Click "Connect Google Calendar"
   - Sign in with your Google account
   - Click "Continue" when you see the verification warning
   - Grant calendar permissions

4. **Select Calendars to Sync**
   - Choose which Google calendars to sync
   - Enable "Two-way Sync" if you want changes in Allie to sync back to Google

5. **Click "Sync Now"**
   - Events will be imported from Google Calendar
   - New events created in Allie will sync to Google (if two-way sync is enabled)

## Troubleshooting

### "Missing or insufficient permissions" Error
This has been fixed. If you still see this error:
1. Refresh the page
2. Try syncing again

### Events Not Showing
1. Make sure you've selected at least one calendar to sync
2. Check that the calendar has events in the current/next month
3. Try clicking "Sync Now" again

## For Production Deployment

To get the app verified by Google (removes the warning):

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to "APIs & Services" > "OAuth consent screen"
4. Click "PUBLISH APP" to submit for verification
5. Fill out the verification form with:
   - App description
   - Privacy policy URL
   - Terms of service URL
   - Support email
   - Authorized domains

The verification process typically takes 4-6 weeks.

## Technical Details

### OAuth Configuration
- **Client ID**: `363935868004-obmgvsk5s9m55rkov4bumpnissnb1sm8.apps.googleusercontent.com`
- **API Key**: Configured in `.env`
- **Scopes**: `https://www.googleapis.com/auth/calendar` (full calendar access)

### Firestore Collections Used
- `googleCalendarSync` - Stores sync status
- `events` - Stores calendar events
- `processed_emails` - Tracks email history

### Files Involved
- `/src/services/CalendarIntegrationService.js` - Main sync logic
- `/src/components/calendar-v2/views/SimpleCalendarSync.jsx` - UI component
- `/src/components/calendar-v2/services/GoogleCalendarAdapter.js` - Google API adapter
- `/firestore.rules` - Database permissions

## Security Notes

- The OAuth credentials are restricted to your domain
- Access tokens are stored in localStorage (cleared on logout)
- All calendar data is stored in Firestore with family-level access control
- Two-way sync is optional and can be disabled

## Next Steps

1. Test the calendar sync with your Google account
2. Verify events appear in both directions (if two-way sync enabled)
3. Consider implementing:
   - Selective event sync (by category/tag)
   - Conflict resolution for overlapping events
   - Automatic periodic sync
   - Support for multiple family member calendars