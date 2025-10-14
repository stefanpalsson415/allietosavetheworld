# Fix: NA'd Questions Now Tracked Per Member

## Problem
When Stefan marked a question as "Not Applicable" (NA), it was being removed from the survey for all family members. This meant Kimberly would only see 71 questions instead of 72 because Stefan had marked one as NA.

## Root Cause
The `getFilteredQuestionsForAdult` function in `SurveyContext.js` was fetching excluded questions at the family level rather than per member. The `QuestionFeedbackService.getQuestionsToExclude` was being called without a userId, returning family-wide exclusions.

## Solution
Updated the question exclusion system to track NA'd questions per member:

### 1. Updated `SurveyContext.js`
- Modified `getFilteredQuestionsForAdult` to accept a `userId` parameter
- Now passes the userId to `QuestionFeedbackService.getQuestionsToExclude`

### 2. Updated `SurveyScreen.jsx`
- Updated the call to `getFilteredQuestionsForAdult` to include `selectedUser?.id`

### 3. Updated `QuestionFeedbackService.js`
- Modified `recordQuestionFeedback` to store feedback with userId
- Added `updateMemberExcludedQuestions` method for member-specific exclusions
- Updated `getQuestionsToExclude` to return member-specific exclusions when userId is provided
- Stores member exclusions in `memberQuestionSettings` collection with document ID format: `{familyId}-{userId}`

## Impact
- Each family member now has their own set of excluded questions
- Stefan's NA'd questions won't affect Kimberly's survey
- Each member sees the full set of questions unless they personally mark them as NA

## Migration
Created `migrate-question-exclusions.js` script to help migrate existing family-wide exclusions to member-specific ones if needed.

## Verification
To verify the fix:
1. Have Stefan take the survey and mark a question as NA
2. Switch to Kimberly's profile and take the survey
3. Kimberly should see all 72 questions (not 71)
4. The question Stefan marked as NA should still appear for Kimberly