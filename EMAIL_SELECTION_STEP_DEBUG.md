# Email Selection Step Debug Guide

## Fixes Applied

### 1. Button Text Fix
- Changed button text on step 12 from "Finish" to "Continue"
- Step 13 now shows "Review & Finish" 
- This should make it clear that step 12 is not the final step

### 2. Debug Logging Added
Added extensive logging to help diagnose if step 12 is being skipped:

#### In OnboardingFlow.jsx:
- `[OnboardingFlow] Advancing from step X to step Y` - Shows navigation
- `[OnboardingFlow] Current familyData:` - Shows state during navigation
- `[OnboardingFlow] IMPORTANT: Moving from phone step (11) to email selection step (12)` - Special alert for step 11->12
- `[OnboardingFlow] RENDERING EMAIL SELECTION STEP (Step 12)` - Confirms step 12 is rendering

#### In EmailSelectionStep.jsx:
- `[EmailSelectionStep] Component mounted with familyName:` - Shows family name received
- `[EmailSelectionStep] Generated prefixes:` - Shows raw suggestions
- `[EmailSelectionStep] Formatted suggestions:` - Shows full email addresses
- `[EmailSelectionStep] Pre-selected:` - Shows which email was auto-selected

## Expected Behavior

For a family named "Palsson", you should see:
1. First suggestion: `palsson@families.checkallie.com` (pre-selected)
2. Other suggestions: `palssonfamily@families.checkallie.com`, etc.

## How to Debug

1. Open browser developer console (F12)
2. Go through onboarding flow
3. Watch for these key logs:
   - When you click "Continue" on step 11 (phone), you should see:
     ```
     [OnboardingFlow] Advancing from step 11 to step 12
     [OnboardingFlow] IMPORTANT: Moving from phone step (11) to email selection step (12)
     [OnboardingFlow] RENDERING EMAIL SELECTION STEP (Step 12)
     [EmailSelectionStep] Component mounted with familyName: Palsson
     [EmailSelectionStep] Generated prefixes: ["palsson", "palssonfamily", ...]
     [EmailSelectionStep] Pre-selected: palsson@families.checkallie.com
     ```

## Possible Issues

1. **Step is skipped entirely**: Check if logs show jump from step 11 to 13
2. **Step renders but is not visible**: Check if step 12 render log appears
3. **Wrong suggestions**: Check what prefixes are generated
4. **Family name not passed**: Check if familyName is undefined in logs

## Quick Test

To quickly test if step 12 is accessible:
1. Complete phone verification (step 11) or check "Skip for now"
2. Click "Continue" 
3. You should see "Choose Your Family Email" heading
4. First suggestion should be `palsson@families.checkallie.com`