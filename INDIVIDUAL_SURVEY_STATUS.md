# Individual Family Member Survey Status

## Summary
Modified the home screen to show individual survey boxes for each family member instead of a single "Take the Initial Family Survey" card.

## What Changed

### 1. Individual Survey Cards
- Each family member who hasn't completed the survey gets their own card
- Stefan (who completed his survey) won't see a survey card for himself
- Other family members (wife and kids) will each have their own card showing they need to complete the survey

### 2. Visual Differences
- **Your survey card**: Blue background, actionable - takes you to the survey
- **Other members' cards**: Gray background, shows "waiting for [name] to complete"
- Clicking other members' cards opens Allie chat to help send reminders

### 3. Survey Status Summary
Added a visual summary showing all family members with badges:
- ✓ Green badge: Survey completed
- ○ Blue badge: Current user (not completed)
- ○ Gray badge: Other family members (not completed)

### 4. Smart Ordering
- Your own survey (if not completed) appears first
- Other family members' surveys appear after
- Progress percentage reflects all surveys across the family

## How It Works Now

1. **Stefan's View** (after completing survey):
   - No survey card for himself
   - Individual gray cards for each family member who hasn't completed survey
   - Can click to send reminders through Allie

2. **Other Family Members' View**:
   - Blue actionable card to take their own survey
   - Gray cards showing other family members who need to complete

3. **Progress Tracking**:
   - Each family member's survey is tracked individually
   - Overall progress percentage considers all family members
   - Once everyone completes, additional features unlock

## Benefits
- Clear visibility of who has/hasn't completed the survey
- Easy way to send reminders to specific family members
- No confusion about whether you've already completed your survey
- Family-wide progress tracking encourages completion

## Files Modified
- `/src/components/dashboard/BasicNotionHomePage.jsx`
  - Modified `getInitialChecklistItems` to create dynamic survey items per member
  - Updated completion tracking to handle individual survey IDs
  - Enhanced UI to show survey status summary and differentiate card types