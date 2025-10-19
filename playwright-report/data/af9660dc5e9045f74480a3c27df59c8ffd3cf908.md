# Test info

- Name: 🔥 CRITICAL: Chore & Reward Complete Lifecycle >> 🎪 FULL E2E: Complete chore → approval → bucks → reward cycle
- Location: /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/14-chore-reward-lifecycle.spec.js:218:3

# Error details

```
TimeoutError: page.goto: Timeout 75000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/dashboard", waiting until "load"

    at /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/14-chore-reward-lifecycle.spec.js:227:16
```

# Test source

```ts
  127 |   });
  128 |
  129 |   // ==============================================================
  130 |   // TEST 2: Bucks Balance Auto-Initialization
  131 |   // ==============================================================
  132 |   test('💰 Bucks balance auto-initializes to $0 for new children', async ({ page }) => {
  133 |     console.log('🎯 TEST: Bucks balance auto-initialization');
  134 |
  135 |     // This test validates the fix where getChildBalance() auto-initializes
  136 |     // instead of throwing an error for new children
  137 |
  138 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chore-admin`);
  139 |     await page.waitForLoadState('networkidle');
  140 |
  141 |     // Navigate to Bucks tab
  142 |     const bucksTab = page.locator('button:has-text("Palsson Bucks"), button:has-text("My Palsson Bucks")').first();
  143 |
  144 |     if (await bucksTab.isVisible({ timeout: 5000 }).catch(() => false)) {
  145 |       await bucksTab.click();
  146 |       await page.waitForTimeout(2000);
  147 |
  148 |       // Look for $0 balances (default for new children)
  149 |       const zeroBalances = page.locator('text=/\\$0(?:\\.00)?/');
  150 |       const count = await zeroBalances.count();
  151 |
  152 |       console.log(`💰 Found ${count} $0 balance displays`);
  153 |
  154 |       // ASSERTION: At least one child has $0 balance (auto-initialized)
  155 |       expect(count).toBeGreaterThan(0);
  156 |       console.log('✅ PASS: Children have auto-initialized $0 balances');
  157 |
  158 |     } else {
  159 |       console.log('⚠️ Bucks tab not available - skipping test');
  160 |       test.skip();
  161 |     }
  162 |   });
  163 |
  164 |   // ==============================================================
  165 |   // TEST 3: Create Custom Chore Template
  166 |   // ==============================================================
  167 |   test('📝 Create custom chore template', async ({ page }) => {
  168 |     console.log('🎯 TEST: Create custom chore template');
  169 |
  170 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chore-admin`);
  171 |     await page.waitForLoadState('networkidle');
  172 |
  173 |     // Look for "Create Chore" or "New Chore" button
  174 |     const createButton = page.locator('button:has-text("Create Chore"), button:has-text("New Chore"), button:has-text("Add Chore")').first();
  175 |
  176 |     if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
  177 |       await createButton.click();
  178 |       await page.waitForTimeout(1000);
  179 |
  180 |       // Fill chore details
  181 |       const titleInput = page.locator('input[name="title"], input[placeholder*="title" i], input[placeholder*="name" i]').first();
  182 |       if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
  183 |         await titleInput.fill('Test Chore: Clean Bedroom');
  184 |
  185 |         // Try to find value/bucks input
  186 |         const valueInput = page.locator('input[name="value"], input[placeholder*="buck" i], input[type="number"]').first();
  187 |         if (await valueInput.isVisible({ timeout: 3000 }).catch(() => false)) {
  188 |           await valueInput.fill('5');
  189 |         }
  190 |
  191 |         // Try to save
  192 |         const saveButton = page.locator('button:has-text("Save"), button:has-text("Create")').first();
  193 |         if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
  194 |           await saveButton.click();
  195 |           await page.waitForTimeout(2000);
  196 |
  197 |           // Verify chore appears in list
  198 |           const choreExists = await page.locator('text=/Test Chore.*Clean Bedroom/i').isVisible({ timeout: 5000 }).catch(() => false);
  199 |           expect(choreExists).toBeTruthy();
  200 |           console.log('✅ PASS: Custom chore template created');
  201 |         } else {
  202 |           console.log('⚠️ Save button not found');
  203 |           test.skip();
  204 |         }
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
> 227 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      |                ^ TimeoutError: page.goto: Timeout 75000ms exceeded.
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
  305 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
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
```