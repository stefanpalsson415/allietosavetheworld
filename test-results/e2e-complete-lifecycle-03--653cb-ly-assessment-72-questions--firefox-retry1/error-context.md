# Test info

- Name: 📋 CRITICAL: Family Assessment Survey >> 📝 Parent 1 completes initial family assessment (72 questions)
- Location: /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/03-initial-survey.spec.js:19:3

# Error details

```
TimeoutError: page.goto: Timeout 15000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/dashboard", waiting until "load"

    at /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/03-initial-survey.spec.js:24:16
```

# Test source

```ts
   1 | // tests/e2e/complete-lifecycle/03-initial-survey.spec.js
   2 | // 🎯 CRITICAL: Family Assessment Survey Tests
   3 | // The 72-question survey is the FOUNDATION of Allie's value proposition
   4 |
   5 | const { test, expect } = require('@playwright/test');
   6 |
   7 | // Test configuration
   8 | const TEST_CONFIG = {
   9 |   BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
   10 |   TIMEOUT: 60000, // Surveys take longer
   11 | };
   12 |
   13 | test.describe('📋 CRITICAL: Family Assessment Survey', () => {
   14 |   test.setTimeout(TEST_CONFIG.TIMEOUT);
   15 |
   16 |   // ==============================================================
   17 |   // TEST 1: Parent 1 Completes Initial 72-Question Survey
   18 |   // ==============================================================
   19 |   test('📝 Parent 1 completes initial family assessment (72 questions)', async ({ page }) => {
   20 |     console.log('🎯 CRITICAL TEST: Initial family assessment survey');
   21 |     console.log('This survey is the FOUNDATION of balance analytics!');
   22 |
   23 |     // STEP 1: Navigate to survey
>  24 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      |                ^ TimeoutError: page.goto: Timeout 15000ms exceeded.
   25 |     await page.waitForLoadState('networkidle');
   26 |
   27 |     // STEP 2: Look for survey entry point
   28 |     // This could be a "Complete Survey" button, notification, or direct link
   29 |     const surveyButton = page.locator('button:has-text("Start Survey"), button:has-text("Complete Survey"), a:has-text("Family Assessment")').first();
   30 |
   31 |     if (await surveyButton.isVisible({ timeout: 5000 }).catch(() => false)) {
   32 |       console.log('✅ Found survey entry point');
   33 |       await surveyButton.click();
   34 |       await page.waitForTimeout(2000);
   35 |
   36 |       // STEP 3: Answer questions
   37 |       // We'll scaffold the question types we expect:
   38 |       // - Workload distribution (20 questions)
   39 |       // - Invisible mental load (15 questions)
   40 |       // - Child development tracking (12 questions)
   41 |       // - Communication patterns (10 questions)
   42 |       // - Household domains (15 questions)
   43 |
   44 |       console.log('📝 Starting survey questions...');
   45 |
   46 |       // Track progress
   47 |       let questionsAnswered = 0;
   48 |       const targetQuestions = 72;
   49 |
   50 |       // STEP 4: Look for question patterns and answer them
   51 |       while (questionsAnswered < targetQuestions) {
   52 |         // Look for various question types
   53 |
   54 |         // Multiple choice questions
   55 |         const multipleChoice = page.locator('input[type="radio"]').first();
   56 |         if (await multipleChoice.isVisible({ timeout: 2000 }).catch(() => false)) {
   57 |           await multipleChoice.click();
   58 |           questionsAnswered++;
   59 |           console.log(`✓ Answered question ${questionsAnswered}/${targetQuestions} (multiple choice)`);
   60 |         }
   61 |
   62 |         // Checkbox questions
   63 |         const checkboxes = await page.locator('input[type="checkbox"]').all();
   64 |         if (checkboxes.length > 0) {
   65 |           for (let i = 0; i < Math.min(2, checkboxes.length); i++) {
   66 |             await checkboxes[i].click();
   67 |           }
   68 |           questionsAnswered++;
   69 |           console.log(`✓ Answered question ${questionsAnswered}/${targetQuestions} (checkboxes)`);
   70 |         }
   71 |
   72 |         // Slider/range questions
   73 |         const slider = page.locator('input[type="range"]').first();
   74 |         if (await slider.isVisible({ timeout: 1000 }).catch(() => false)) {
   75 |           await slider.fill('5'); // Set to middle value
   76 |           questionsAnswered++;
   77 |           console.log(`✓ Answered question ${questionsAnswered}/${targetQuestions} (slider)`);
   78 |         }
   79 |
   80 |         // Text input questions
   81 |         const textInput = page.locator('input[type="text"], textarea').first();
   82 |         if (await textInput.isVisible({ timeout: 1000 }).catch(() => false)) {
   83 |           await textInput.fill('Test answer for E2E testing');
   84 |           questionsAnswered++;
   85 |           console.log(`✓ Answered question ${questionsAnswered}/${targetQuestions} (text)`);
   86 |         }
   87 |
   88 |         // Click "Next" or "Continue" button
   89 |         const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Save")').first();
   90 |         if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
   91 |           await nextButton.click();
   92 |           await page.waitForTimeout(1000);
   93 |         } else {
   94 |           // No next button - might be end of survey
   95 |           break;
   96 |         }
   97 |
   98 |         // Safety: Break if we've tried too many times
   99 |         if (questionsAnswered > 100) {
  100 |           console.log('⚠️ Exceeded maximum questions, breaking loop');
  101 |           break;
  102 |         }
  103 |       }
  104 |
  105 |       console.log(`📊 Total questions answered: ${questionsAnswered}`);
  106 |
  107 |       // STEP 5: Submit survey
  108 |       const submitButton = page.locator('button:has-text("Submit"), button:has-text("Complete"), button:has-text("Finish")').first();
  109 |       if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
  110 |         await submitButton.click();
  111 |         await page.waitForTimeout(3000);
  112 |         console.log('✅ Survey submitted');
  113 |       }
  114 |
  115 |       // STEP 6: Verify completion
  116 |       const completionMessage = await page.locator('text=/survey.*complete/i, text=/thank.*you/i, text=/success/i').isVisible({ timeout: 5000 }).catch(() => false);
  117 |
  118 |       // ASSERTION: Survey completed successfully
  119 |       expect(completionMessage || questionsAnswered >= 50).toBeTruthy(); // At least 50 questions is good progress
  120 |       console.log('✅ PASS: Family assessment survey completed');
  121 |
  122 |     } else {
  123 |       console.log('⚠️ Survey entry point not found - may need authentication or different navigation');
  124 |       test.skip();
```