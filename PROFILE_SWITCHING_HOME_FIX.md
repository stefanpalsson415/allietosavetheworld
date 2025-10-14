# Profile Switching Fix for Home Screen

## Issue
When using the profile switcher to select "Stefan", the home screen was still showing Kimberly's perspective:
- Survey status showed "Kimberly (You)" instead of "Stefan (You)"
- Survey cards were based on Kimberly's completion status

## Root Cause
The BasicNotionHomePage component was using `currentUser` (the actual logged-in user from Firebase Auth) instead of `selectedUser` (the profile selected in the switcher).

## Fix Applied
Updated BasicNotionHomePage.jsx to use the selected profile consistently:

1. **Active User ID**: Now uses `selectedUser?.id || currentUser?.uid`
2. **Survey Status**: Checks survey completion for the selected profile
3. **"(You)" Label**: Shows next to the selected profile name, not the logged-in user
4. **Greeting**: Already correctly using selectedUser for the name

## Changes Made

### Before:
```javascript
const currentMember = familyMembers.find(member => member.id === currentUser?.uid);
const isCurrentUser = member.id === currentUser?.uid;
```

### After:
```javascript
const activeUserId = selectedUser?.id || currentUser?.uid;
const currentMember = familyMembers.find(member => member.id === activeUserId);
const isActiveUser = member.id === (selectedUser?.id || currentUser?.uid);
```

## How It Works Now

1. **Kimberly logged in, viewing as Kimberly**:
   - Shows "Kimberly (You)" in survey status
   - Shows Kimberly's survey card if not completed

2. **Kimberly logged in, viewing as Stefan**:
   - Shows "Stefan (You)" in survey status
   - Shows Stefan's survey card if not completed
   - Other family members shown as gray badges

## Testing

Run the test script in browser console:
```javascript
// Copy from: /public/test-profile-context.js
```

This will show:
- Current logged-in user
- Selected profile from localStorage
- All family members and their survey status

## Files Modified
- `/src/components/dashboard/BasicNotionHomePage.jsx`
  - Updated to use selectedUser throughout
  - Fixed survey status badges
  - Fixed checklist item generation