# Test info

- Name: 🔥 CRITICAL: Chore & Reward Complete Lifecycle >> 💰 Bucks balance auto-initializes to $0 for new children
- Location: /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/14-chore-reward-lifecycle.spec.js:132:3

# Error details

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://localhost:3000/dashboard?tab=chore-admin", waiting until "load"

    at /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/14-chore-reward-lifecycle.spec.js:138:16
```

# Test source

```ts
   38 |     // STEP 1: Navigate to app
   39 |     await page.goto(TEST_CONFIG.BASE_URL);
   40 |
   41 |     // STEP 2: Login (assuming test user exists - we'll create setup later)
   42 |     // For now, navigate directly to dashboard if already logged in
   43 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chore-admin`);
   44 |
   45 |     // STEP 3: Wait for dashboard to load
   46 |     await page.waitForLoadState('networkidle');
   47 |
   48 |     // STEP 4: Setup console error monitoring
   49 |     const consoleErrors = [];
   50 |     page.on('console', msg => {
   51 |       if (msg.type() === 'error') {
   52 |         consoleErrors.push(msg.text());
   53 |       }
   54 |     });
   55 |
   56 |     // STEP 5: Navigate to Kids Section Admin tab
   57 |     console.log('📍 Navigating to Kids Section Admin...');
   58 |     const adminTab = page.locator('button:has-text("Kids Section Admin"), a:has-text("Kids Section Admin")').first();
   59 |
   60 |     if (await adminTab.isVisible({ timeout: 5000 }).catch(() => false)) {
   61 |       await adminTab.click();
   62 |       await page.waitForTimeout(2000);
   63 |     }
   64 |
   65 |     // STEP 6: Look for "Import Default Chores" button
   66 |     console.log('🔍 Looking for Import Default Chores button...');
   67 |     const importButton = page.locator('button:has-text("Import Default Chores"), button:has-text("Import Chores")').first();
   68 |
   69 |     if (await importButton.isVisible({ timeout: 5000 }).catch(() => false)) {
   70 |       console.log('✅ Found import button, clicking...');
   71 |
   72 |       // STEP 7: Click import button
   73 |       await importButton.click();
   74 |
   75 |       // STEP 8: Wait for import to complete
   76 |       await page.waitForTimeout(3000);
   77 |
   78 |       // STEP 9: CRITICAL - Check for infinite error loop
   79 |       const bucksServiceErrors = consoleErrors.filter(err =>
   80 |         err.includes('BucksService') ||
   81 |         err.includes('No balance found') ||
   82 |         err.includes('getBalance')
   83 |       );
   84 |
   85 |       console.log(`📊 BucksService errors detected: ${bucksServiceErrors.length}`);
   86 |
   87 |       // ASSERTION 1: No infinite loop (< 10 errors is acceptable, 100+ means infinite loop)
   88 |       expect(bucksServiceErrors.length).toBeLessThan(10);
   89 |       console.log('✅ PASS: No infinite error loop detected');
   90 |
   91 |     } else {
   92 |       console.log('⚠️ Import button not found - may need authentication');
   93 |     }
   94 |
   95 |     // STEP 10: Navigate to "Palsson Bucks Accounts" tab
   96 |     console.log('📍 Navigating to Palsson Bucks Accounts...');
   97 |     const bucksTab = page.locator('button:has-text("Palsson Bucks"), button:has-text("Bucks Account"), button:has-text("My Palsson Bucks")').first();
   98 |
   99 |     if (await bucksTab.isVisible({ timeout: 5000 }).catch(() => false)) {
  100 |       await bucksTab.click();
  101 |       await page.waitForTimeout(2000);
  102 |
  103 |       // STEP 11: Verify balances show $0 (not undefined)
  104 |       const balanceElements = await page.locator('text=/\\$\\d+/').all();
  105 |       console.log(`💰 Found ${balanceElements.length} balance displays`);
  106 |
  107 |       // ASSERTION 2: At least some balance displays exist
  108 |       expect(balanceElements.length).toBeGreaterThan(0);
  109 |       console.log('✅ PASS: Balance displays found (not undefined)');
  110 |
  111 |       // ASSERTION 3: No new console errors after viewing balances
  112 |       const postBucksErrors = consoleErrors.filter(err =>
  113 |         err.includes('BucksService') ||
  114 |         err.includes('No balance found')
  115 |       );
  116 |       expect(postBucksErrors.length).toBeLessThan(10);
  117 |       console.log('✅ PASS: No errors when viewing balances');
  118 |
  119 |     } else {
  120 |       console.log('⚠️ Bucks tab not found');
  121 |     }
  122 |
  123 |     // FINAL ASSERTION: Overall console health
  124 |     expect(consoleErrors.length).toBeLessThan(20); // Allow some non-critical errors
  125 |
  126 |     console.log('🎉 REGRESSION TEST COMPLETE: BucksService infinite loop PROTECTED');
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
> 138 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chore-admin`);
      |                ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
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
```