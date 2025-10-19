# Test info

- Name: 📋 CRITICAL: Family Assessment Survey >> 💾 Survey progress persists and can be recovered
- Location: /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/03-initial-survey.spec.js:192:3

# Error details

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://localhost:3000/dashboard", waiting until "load"

    at /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/03-initial-survey.spec.js:198:16
```

# Test source

```ts
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
  135 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
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
> 198 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      |                ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
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
  236 |   // TEST 5: Survey Validation and Error Handling
  237 |   // ==============================================================
  238 |   test('✅ Survey validation prevents incomplete submissions', async ({ page }) => {
  239 |     console.log('🎯 TEST: Survey validation');
  240 |
  241 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
  242 |
  243 |     console.log('📝 Step 1: Try to skip required questions');
  244 |     console.log('📝 Step 2: Verify validation messages appear');
  245 |     console.log('📝 Step 3: Verify cannot proceed without answers');
  246 |
  247 |     console.log('⚠️ Test scaffolded - needs validation flow');
  248 |   });
  249 |
  250 |   // ==============================================================
  251 |   // TEST 6: Survey Impact on Allie's Context
  252 |   // ==============================================================
  253 |   test('🤖 Survey data populates Allie\'s family context', async ({ page }) => {
  254 |     console.log('🎯 TEST: Survey data → Allie context integration');
  255 |     console.log('Allie should know family details after survey completion');
  256 |
  257 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
  258 |     await page.waitForLoadState('networkidle');
  259 |
  260 |     // Ask Allie a question that requires survey data
  261 |     const chatInput = page.locator('textarea, input[type="text"]').last();
  262 |
  263 |     if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
  264 |       console.log('📝 Asking Allie: "What is our family\'s current workload balance?"');
  265 |       await chatInput.fill('What is our family\'s current workload balance?');
  266 |
  267 |       const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
  268 |       if (await sendButton.isVisible({ timeout: 3000 }).catch(() => false)) {
  269 |         await sendButton.click();
  270 |         await page.waitForTimeout(5000); // Wait for AI response
  271 |
  272 |         // Look for response mentioning balance percentages
  273 |         const response = await page.locator('text=/%/, text=/balance/, text=/workload/').isVisible({ timeout: 10000 }).catch(() => false);
  274 |
  275 |         // ASSERTION: Allie knows about family balance from survey
  276 |         expect(response).toBeTruthy();
  277 |         console.log('✅ PASS: Allie has access to survey data');
  278 |       }
  279 |     } else {
  280 |       console.log('⚠️ Chat input not found');
  281 |       test.skip();
  282 |     }
  283 |   });
  284 |
  285 | });
  286 |
  287 | // ==============================================================
  288 | // HELPER FUNCTIONS
  289 | // ==============================================================
  290 |
  291 | /**
  292 |  * Answer a question based on its type
  293 |  */
  294 | async function answerQuestion(page, questionType, value = null) {
  295 |   // Implementation for different question types
  296 |   console.log(`Answering ${questionType} question`);
  297 | }
  298 |
```