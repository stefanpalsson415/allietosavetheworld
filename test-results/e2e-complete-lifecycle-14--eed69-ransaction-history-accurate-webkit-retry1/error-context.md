# Test info

- Name: 🔥 CRITICAL: Chore & Reward Complete Lifecycle >> 📊 Verify transaction history accurate
- Location: /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/14-chore-reward-lifecycle.spec.js:302:3

# Error details

```
TimeoutError: page.goto: Timeout 15000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/dashboard", waiting until "load"

    at /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/14-chore-reward-lifecycle.spec.js:305:16
```

# Test source

```ts
  205 |       } else {
  206 |         console.log('⚠️ Title input not found');
  207 |         test.skip();
  208 |       }
  209 |     } else {
  210 |       console.log('⚠️ Create Chore button not found');
  211 |       test.skip();
  212 |     }
  213 |   });
  214 |
  215 |   // ==============================================================
  216 |   // TEST 4: Complete Chore-to-Reward Cycle (FULL E2E)
  217 |   // ==============================================================
  218 |   test('🎪 FULL E2E: Complete chore → approval → bucks → reward cycle', async ({ page }) => {
  219 |     test.slow(); // This is the big one!
  220 |
  221 |     console.log('🎯 FULL E2E TEST: Complete chore-to-reward lifecycle');
  222 |     console.log('This test validates the entire SANTA system end-to-end');
  223 |
  224 |     // This is a complex test - we'll build it step by step
  225 |     // For now, just scaffold the structure
  226 |
  227 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
  228 |     await page.waitForLoadState('networkidle');
  229 |
  230 |     console.log('📝 Step 1: Import chores (if not already done)');
  231 |     // Navigate to admin, import chores
  232 |
  233 |     console.log('📝 Step 2: Assign chore to child');
  234 |     // Select chore, assign to Oly
  235 |
  236 |     console.log('📝 Step 3: Child completes chore (with photo)');
  237 |     // Login as child (or simulate), mark complete, upload photo
  238 |
  239 |     console.log('📝 Step 4: Parent approves chore');
  240 |     // View pending approvals, approve
  241 |
  242 |     console.log('📝 Step 5: Verify bucks awarded');
  243 |     // Check balance increased
  244 |
  245 |     console.log('📝 Step 6: Child purchases reward');
  246 |     // Navigate to rewards, purchase item
  247 |
  248 |     console.log('📝 Step 7: Parent approves reward');
  249 |     // View reward requests, approve
  250 |
  251 |     console.log('📝 Step 8: Verify transaction history');
  252 |     // Check complete audit trail
  253 |
  254 |     console.log('⚠️ FULL E2E TEST - Scaffolded (needs implementation)');
  255 |     console.log('This will be the most important test - validates entire value chain');
  256 |   });
  257 |
  258 |   // ==============================================================
  259 |   // TEST 5: Chore Assignment to Child
  260 |   // ==============================================================
  261 |   test('👶 Assign chore to child', async ({ page }) => {
  262 |     console.log('🎯 TEST: Assign chore to child');
  263 |
  264 |     // Placeholder - will implement after understanding UI flow
  265 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chore-admin`);
  266 |     await page.waitForLoadState('networkidle');
  267 |
  268 |     console.log('📝 Look for existing chore to assign');
  269 |     // Find chore, click assign, select child
  270 |
  271 |     console.log('⚠️ Test scaffolded - needs UI exploration');
  272 |   });
  273 |
  274 |   // ==============================================================
  275 |   // TEST 6: Child Completes Chore with Photo
  276 |   // ==============================================================
  277 |   test('📸 Child completes chore with photo proof', async ({ page }) => {
  278 |     console.log('🎯 TEST: Child completes chore with photo');
  279 |
  280 |     // This requires child login - will implement after auth setup
  281 |     console.log('⚠️ Test scaffolded - needs child authentication flow');
  282 |   });
  283 |
  284 |   // ==============================================================
  285 |   // TEST 7: Parent Approves Chore
  286 |   // ==============================================================
  287 |   test('✅ Parent approves chore and awards bucks', async ({ page }) => {
  288 |     console.log('🎯 TEST: Parent approves chore');
  289 |
  290 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chore-admin`);
  291 |     await page.waitForLoadState('networkidle');
  292 |
  293 |     console.log('📝 Look for pending approvals section');
  294 |     // Find pending, approve, verify bucks awarded
  295 |
  296 |     console.log('⚠️ Test scaffolded - needs approval UI flow');
  297 |   });
  298 |
  299 |   // ==============================================================
  300 |   // TEST 8: Transaction History Verification
  301 |   // ==============================================================
  302 |   test('📊 Verify transaction history accurate', async ({ page }) => {
  303 |     console.log('🎯 TEST: Transaction history verification');
  304 |
> 305 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      |                ^ TimeoutError: page.goto: Timeout 15000ms exceeded.
  306 |     await page.waitForLoadState('networkidle');
  307 |
  308 |     console.log('📝 Navigate to transaction history');
  309 |     // View history, verify all transactions recorded
  310 |
  311 |     console.log('⚠️ Test scaffolded - needs transaction UI exploration');
  312 |   });
  313 |
  314 | });
  315 |
  316 | // ==============================================================
  317 | // HELPER FUNCTIONS
  318 | // ==============================================================
  319 |
  320 | /**
  321 |  * Create a test family with children for chore testing
  322 |  */
  323 | async function createTestFamily(page, familyData) {
  324 |   // This will be implemented when we build the onboarding test helpers
  325 |   console.log('📝 createTestFamily() - To be implemented');
  326 | }
  327 |
  328 | /**
  329 |  * Login as child user
  330 |  */
  331 | async function loginAsChild(page, childName) {
  332 |   console.log(`📝 loginAsChild(${childName}) - To be implemented`);
  333 | }
  334 |
  335 | /**
  336 |  * Upload photo for chore completion
  337 |  */
  338 | async function uploadChorePhoto(page, photoPath) {
  339 |   console.log('📝 uploadChorePhoto() - To be implemented');
  340 | }
  341 |
  342 | /**
  343 |  * Wait for console errors and collect them
  344 |  */
  345 | async function monitorConsoleErrors(page) {
  346 |   const errors = [];
  347 |   page.on('console', msg => {
  348 |     if (msg.type() === 'error') {
  349 |       errors.push({
  350 |         text: msg.text(),
  351 |         timestamp: new Date().toISOString()
  352 |       });
  353 |     }
  354 |   });
  355 |   return errors;
  356 | }
  357 |
```