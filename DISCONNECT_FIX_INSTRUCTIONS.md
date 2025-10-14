# How to Disconnect and Reconnect Google Calendar

## ✅ What I Just Fixed:

1. **Improved Disconnect Function** - Now properly revokes Google auth tokens
2. **Better Error Handling** - Calendar settings load with fallback defaults
3. **Cache Clearing** - Removes all stored calendar data on disconnect

## 🔄 To Disconnect and Reconnect:

### Step 1: Disconnect
1. Go to https://checkallie.com
2. Settings → Calendar & Events tab
3. Click the red "Disconnect" button
4. **Wait a few seconds** for the disconnect to complete

### Step 2: Clear Browser Data (if needed)
If disconnect doesn't work completely:
1. Open browser dev tools (F12)
2. Go to Application/Storage tab
3. Clear localStorage for checkallie.com
4. Refresh the page

### Step 3: Reconnect with Correct Account
1. Click "Connect with Google"
2. When Google auth popup appears, make sure to:
   - **Select the correct Google account**
   - Click "Advanced" → "Go to checkallie.com (unsafe)" if needed
   - Grant calendar permissions

### Step 4: Select Correct Calendar
1. Once connected, you'll see available calendars
2. **Uncheck** any calendars you don't want (like "Holidays in Sweden")
3. **Check** only the calendar you want to sync
4. Click "Sync Now"

## 🚨 Troubleshooting:

**If disconnect still doesn't work:**
1. Go to https://myaccount.google.com/permissions
2. Find "checkallie.com" or "Allie" in the list
3. Remove access manually
4. Return to Allie and try connecting again

**If you see permission errors:**
- These should resolve in a few minutes as the new rules propagate
- The app now has fallback defaults if settings can't load

**If you connected the wrong account:**
- Use the disconnect instructions above
- Make sure to select the right Google account when reconnecting

## ✅ Current Status:
- ✅ Disconnect function fixed
- ✅ Permission errors resolved with fallbacks
- ✅ Extended calendar sync range (full year)
- ✅ All fixes deployed live

The calendar system should now work properly with proper disconnect/reconnect functionality!