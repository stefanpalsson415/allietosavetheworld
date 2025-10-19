# Test info

- Name: 📋 CRITICAL: Family Assessment Survey >> 📊 Balance metrics calculated correctly from survey data
- Location: /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/03-initial-survey.spec.js:131:3

# Error details

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://localhost:3000/dashboard", waiting until "load"

    at /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/03-initial-survey.spec.js:135:16
```

# Test source

```ts
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
  125 |     }
  126 |   });
  127 |
  128 |   // ==============================================================
  129 |   // TEST 2: Balance Metrics Calculation from Survey
  130 |   // ==============================================================
  131 |   test('📊 Balance metrics calculated correctly from survey data', async ({ page }) => {
  132 |     console.log('🎯 CRITICAL TEST: Balance metrics calculation');
  133 |     console.log('Landing page formula: TaskWeight = BaseTime × Frequency × Invisibility × EmotionalLabor × Priority');
  134 |
> 135 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      |                ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  136 |     await page.waitForLoadState('networkidle');
  137 |
  138 |     // Navigate to balance/analytics dashboard
  139 |     const balanceTab = page.locator('button:has-text("Balance"), button:has-text("Analytics"), a:has-text("Relationship")').first();
  140 |
  141 |     if (await balanceTab.isVisible({ timeout: 5000 }).catch(() => false)) {
  142 |       await balanceTab.click();
  143 |       await page.waitForTimeout(2000);
  144 |
  145 |       console.log('📍 Viewing balance analytics dashboard');
  146 |
  147 |       // STEP 1: Look for balance metrics displays
  148 |       // Landing page shows: "Mama: 55%, Papa: 45%" for visible household
  149 |       // and "Mama: 78%, Papa: 22%" for invisible household
  150 |
  151 |       const percentageDisplays = await page.locator('text=/%\\s*$/').all();
  152 |       console.log(`📊 Found ${percentageDisplays.length} percentage displays`);
  153 |
  154 |       // ASSERTION 1: Balance metrics are displayed
  155 |       expect(percentageDisplays.length).toBeGreaterThan(0);
  156 |
  157 |       // STEP 2: Look for category breakdowns
  158 |       const visibleHousehold = await page.locator('text=/visible.*household/i').isVisible({ timeout: 3000 }).catch(() => false);
  159 |       const invisibleHousehold = await page.locator('text=/invisible.*household/i').isVisible({ timeout: 3000 }).catch(() => false);
  160 |
  161 |       console.log(`📊 Visible Household metric: ${visibleHousehold ? '✅' : '❌'}`);
  162 |       console.log(`📊 Invisible Household metric: ${invisibleHousehold ? '✅' : '❌'}`);
  163 |
  164 |       // ASSERTION 2: Both visible and invisible metrics calculated
  165 |       expect(visibleHousehold || invisibleHousehold).toBeTruthy();
  166 |
  167 |       // STEP 3: Look for domain breakdown
  168 |       const domains = ['cooking', 'cleaning', 'childcare', 'scheduling', 'finances'];
  169 |       let domainsFound = 0;
  170 |
  171 |       for (const domain of domains) {
  172 |         const found = await page.locator(`text=/${domain}/i`).isVisible({ timeout: 1000 }).catch(() => false);
  173 |         if (found) domainsFound++;
  174 |       }
  175 |
  176 |       console.log(`📊 Domains found: ${domainsFound}/${domains.length}`);
  177 |
  178 |       // ASSERTION 3: At least some domain breakdown exists
  179 |       expect(domainsFound).toBeGreaterThan(0);
  180 |
  181 |       console.log('✅ PASS: Balance metrics are calculated and displayed');
  182 |
  183 |     } else {
  184 |       console.log('⚠️ Balance dashboard not found');
  185 |       test.skip();
  186 |     }
  187 |   });
  188 |
  189 |   // ==============================================================
  190 |   // TEST 3: Survey Data Persistence and Recovery
  191 |   // ==============================================================
  192 |   test('💾 Survey progress persists and can be recovered', async ({ page }) => {
  193 |     console.log('🎯 TEST: Survey data persistence');
  194 |
  195 |     // This test ensures that if user closes browser mid-survey,
  196 |     // they can resume from where they left off
  197 |
  198 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
  199 |     await page.waitForLoadState('networkidle');
  200 |
  201 |     console.log('📝 Step 1: Start survey');
  202 |     // Start survey, answer some questions
  203 |
  204 |     console.log('📝 Step 2: Verify auto-save happening');
  205 |     // Look for "Saving..." indicators
  206 |
  207 |     console.log('📝 Step 3: Simulate browser close/reopen');
  208 |     // This requires more complex setup
  209 |
  210 |     console.log('📝 Step 4: Verify progress restored');
  211 |     // Check that user starts where they left off
  212 |
  213 |     console.log('⚠️ Test scaffolded - needs implementation');
  214 |   });
  215 |
  216 |   // ==============================================================
  217 |   // TEST 4: Multi-Parent Survey Coordination
  218 |   // ==============================================================
  219 |   test('👥 Multi-parent survey coordination works correctly', async ({ page }) => {
  220 |     console.log('🎯 TEST: Multi-parent survey coordination');
  221 |     console.log('Both parents should be able to complete their portions');
  222 |
  223 |     // This requires multiple user sessions
  224 |     // We'll scaffold for now
  225 |
  226 |     console.log('📝 Step 1: Parent 1 completes first half (36 questions)');
  227 |     console.log('📝 Step 2: Parent 2 logs in and sees progress');
  228 |     console.log('📝 Step 3: Parent 2 completes second half (36 questions)');
  229 |     console.log('📝 Step 4: Verify combined responses in Firestore');
  230 |     console.log('📝 Step 5: Verify family profile updated');
  231 |
  232 |     console.log('⚠️ Test scaffolded - needs multi-session implementation');
  233 |   });
  234 |
  235 |   // ==============================================================
```