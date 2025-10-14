# SMS Display Fix Summary

## Issues Fixed

1. **UnifiedInbox Component Updates** (`src/components/inbox/UnifiedInbox.jsx`):
   - Added `item.body` to content display fallback chain (SMS messages store text in `body` field)
   - Fixed title display for SMS messages to show "SMS Message" instead of "No subject"
   - Enhanced Swedish phone number formatting (+46 numbers)
   - Added detailed logging for SMS item structure

2. **Diagnostic Scripts Created**:

### 1. `public/diagnose-sms-display.js`
- Comprehensive SMS debugging tool
- Checks family context, queries SMS messages, verifies index
- Shows SMS structure and manual display test

### 2. `public/verify-sms-visibility.js`
- Verifies SMS visibility in database and UI
- Creates test SMS message if none exist
- Checks filter settings and UI rendering

### 3. `public/fix-sms-complete.js`
- **Main fix script - RUN THIS FIRST**
- Fixes all SMS messages with missing/incorrect familyId
- Creates test SMS if needed
- Forces UI refresh

### 4. `public/check-archived-sms.js`
- Checks if SMS messages are accidentally archived
- Provides `unarchiveAllSMS()` function if needed

## How to Use

1. **Run the main fix script**:
   ```javascript
   // In browser console:
   await fetch('/fix-sms-complete.js').then(r => r.text()).then(eval)
   ```

2. **If SMS still don't appear, check for archived messages**:
   ```javascript
   // In browser console:
   await fetch('/check-archived-sms.js').then(r => r.text()).then(eval)
   ```

3. **For detailed debugging**:
   ```javascript
   // In browser console:
   await fetch('/diagnose-sms-display.js').then(r => r.text()).then(eval)
   ```

## What Should Happen

After running the fix scripts:
1. All SMS messages should have the correct familyId
2. SMS messages should appear in the Unified Inbox
3. They should show:
   - Phone number (formatted nicely)
   - "SMS Message" as title
   - Message content in the preview
   - Correct timestamp

## Possible Remaining Issues

1. **Firestore Index**: If you see "failed-precondition" errors, the compound index for (familyId, receivedAt) might not be ready. This usually resolves itself within a few minutes.

2. **Filter Settings**: Make sure the "All" filter is selected, not just "Email" or "Document"

3. **Archived Messages**: Run the check-archived-sms.js script to see if messages were accidentally archived

## Next Steps

If SMS messages still don't appear after running these fixes:
1. Check the browser console for any errors
2. Try a hard refresh (Cmd/Ctrl + Shift + R)
3. Log out and log back in
4. Send a new test SMS to see if new messages appear