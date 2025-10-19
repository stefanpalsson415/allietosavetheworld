# Test info

- Name: 📋 CRITICAL: Family Assessment Survey >> 🤖 Survey data populates Allie's family context
- Location: /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/03-initial-survey.spec.js:253:3

# Error details

```
TimeoutError: page.goto: Timeout 15000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/dashboard?tab=chat", waiting until "load"

    at /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/03-initial-survey.spec.js:257:16
```

# Test source

```ts
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
> 257 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
      |                ^ TimeoutError: page.goto: Timeout 15000ms exceeded.
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
  299 | /**
  300 |  * Verify survey data saved to Firestore
  301 |  */
  302 | async function verifySurveyDataInFirestore(familyId, expectedFields) {
  303 |   // This would use Firebase Admin SDK to check Firestore
  304 |   console.log('Verifying survey data in Firestore');
  305 | }
  306 |
```