# Onboarding Data Save Fix

## Problem
The onboarding flow was collecting phone numbers, email verification status, and other data, but this information was not being saved to the database or displayed in the User Settings screen.

## Root Causes
1. **DatabaseService.createFamily()** was not saving phone/email verification data
2. **Family member records** were created without phone numbers
3. **UserSettingsScreen** was not checking family member data for phone numbers
4. **PhoneVerificationForm** was updating user documents but not family member data

## Fixes Applied

### 1. Updated DatabaseService.createFamily()
- Added extraction of phone and email verification data from familyData
- Added phone data to family member records
- Added family-level phone/email verification fields

```javascript
// Now extracts and saves:
const { phoneNumber, phoneVerified, email, emailVerified, familyEmail, familyEmailPrefix } = familyData;

// Family members now include:
phoneNumber: index === 0 && phoneNumber ? phoneNumber : parent.phoneNumber || null,
phoneVerified: index === 0 && phoneVerified ? phoneVerified : false,

// Family document now includes:
primaryEmail: email || parentData[0]?.email || null,
emailVerified: emailVerified || false,
phoneNumber: phoneNumber || null,
phoneVerified: phoneVerified || false,
familyEmail: familyEmail || null,
familyEmailPrefix: familyEmailPrefix || null,
```

### 2. Updated UserSettingsScreen
- Now checks both currentUser and selectedUser for phone data
- Displays phone number from family member data if available
- Shows verified status based on both sources

```javascript
// Phone display now checks:
currentUser?.phoneNumber || selectedUser?.phoneNumber

// Verified status checks:
(currentUser?.phoneNumber || selectedUser?.phoneVerified)
```

### 3. Updated PhoneVerificationForm
- Now updates family member data when phone is verified
- Syncs phone verification across user doc and family member

## Expected Behavior

After these fixes:
1. Phone numbers entered during onboarding will be saved with the family data
2. Email addresses will show correctly (e.g., spalsson@gmail.com instead of fake emails)
3. Phone verification status will be preserved and displayed
4. All onboarding data (communication preferences, AI preferences, etc.) will be saved

## Testing

To verify the fixes work:
1. Complete a new onboarding flow with phone verification
2. Navigate to User Settings
3. Check that:
   - Email shows the correct address (not the fake one)
   - Phone number is displayed if it was verified
   - Family preferences from onboarding are shown

## Note
Existing families may need to re-verify their phone numbers to update the family member data.