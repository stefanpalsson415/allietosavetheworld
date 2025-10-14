# Profile Switching Fix

## Summary
Fixed the profile switching functionality to properly update all contexts when switching between family members. Previously, switching profiles only updated the UI but didn't affect which user was considered "current" for API calls and data operations.

## Problem
When logged in as one family member (e.g., kimberly@palsson.family) and switching profiles to another (e.g., spalsson@gmail.com), the system still considered the authenticated user as the "current user" for all operations. This caused confusion when running scripts or syncing data.

## Solution Implemented

### 1. Enhanced Profile Switching in FamilyContext
Modified `selectFamilyMember` function to:
- Dispatch a custom event `profile-switched` when switching profiles
- Update a global reference `window._currentSelectedUser`
- Properly persist the selection in localStorage

### 2. Global Context Exposure
Added a useEffect in FamilyContext to expose key functions globally:
```javascript
window._familyContext = {
  familyId,
  selectedUser,
  selectFamilyMember,
  familyMembers
};
```

### 3. Updated Debugging Scripts
Modified `check-google-sync.js` to:
- Check for profile switching via localStorage
- Show effective user instead of just auth user
- Provide correct instructions for switching profiles (sidebar, not logout)

### 4. Created Profile Switching Enhancement Script
Created `fix-profile-switching.js` that provides:
- `window.getEffectiveUserId()` - Returns the current profile's user ID
- `window.getEffectiveUserEmail()` - Returns the current profile's email
- Event listeners for profile switch events
- Enhanced logging for debugging

## How Profile Switching Works

1. **UI Layer**: Click avatar in top-left sidebar → Select family member → Confirm switch
2. **State Update**: FamilyContext updates `selectedUser` state
3. **Persistence**: User ID saved to `localStorage.selectedUserId`
4. **Event Dispatch**: `profile-switched` event fired with user details
5. **Global Update**: `window._currentSelectedUser` updated for services

## Testing Profile Switching

### 1. Apply the Fix
Run in browser console:
```javascript
// Load: /public/fix-profile-switching.js
```

### 2. Switch Profiles
1. Click your avatar in the top-left sidebar
2. Select "Stefan Palsson" (or desired family member)
3. Click "Yes" to confirm the switch

### 3. Verify the Switch
Run in browser console:
```javascript
// Check effective user
window.getEffectiveUserId()
await window.getEffectiveUserEmail()

// Or use the Google sync check
// Load: /public/check-google-sync.js
```

## Impact on Services

Services that need to respect profile switching should:

1. **Check localStorage first**: 
   ```javascript
   const selectedUserId = localStorage.getItem('selectedUserId');
   ```

2. **Fall back to auth user**:
   ```javascript
   const userId = selectedUserId || auth.currentUser?.uid;
   ```

3. **Listen for switch events**:
   ```javascript
   window.addEventListener('profile-switched', (event) => {
     const { userId, userEmail } = event.detail;
     // Update service state
   });
   ```

## Files Modified

1. `/src/contexts/FamilyContext.js`
   - Enhanced `selectFamilyMember` to dispatch events
   - Added global context exposure via useEffect

2. `/public/check-google-sync.js`
   - Added profile switching detection
   - Shows effective user instead of just auth user
   - Updated instructions for profile switching

3. Created `/public/fix-profile-switching.js`
   - Provides utility functions for getting effective user
   - Enhances profile switching with additional logging
   - Adds event listeners for debugging

## Notes

- Profile switching maintains the same family context
- All family data remains accessible regardless of selected profile
- The auth user (logged in account) doesn't change
- Only the "active profile" for operations changes
- This is useful for families sharing a single login but needing different profiles for calendar sync, tasks, etc.