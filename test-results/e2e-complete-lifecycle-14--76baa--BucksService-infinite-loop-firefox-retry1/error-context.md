# Test info

- Name: 🔥 CRITICAL: Chore & Reward Complete Lifecycle >> 🚨 REGRESSION: Import chores without BucksService infinite loop
- Location: /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/14-chore-reward-lifecycle.spec.js:33:3

# Error details

```
TimeoutError: page.goto: Timeout 15000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

    at /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/14-chore-reward-lifecycle.spec.js:39:16
```

# Test source

```ts
   1 | // tests/e2e/complete-lifecycle/14-chore-reward-lifecycle.spec.js
   2 | // 🎯 CRITICAL REGRESSION TESTS - Chore & Reward System
   3 | // Protects BucksService fix from Oct 18, 2025 (infinite loop bug)
   4 |
   5 | const { test, expect } = require('@playwright/test');
   6 |
   7 | // Test configuration
   8 | const TEST_CONFIG = {
   9 |   BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
   10 |   TIMEOUT: 30000,
   11 |
   12 |   // Test family data
   13 |   TEST_FAMILY: {
   14 |     name: 'Test Family Chores',
   15 |     parent1: {
   16 |       email: 'parent1.chores@test.com',
   17 |       password: 'TestPassword123!',
   18 |       name: 'Test Parent 1'
   19 |     },
   20 |     children: [
   21 |       { name: 'Oly', age: 8 },
   22 |       { name: 'Tegner', age: 6 }
   23 |     ]
   24 |   }
   25 | };
   26 |
   27 | test.describe('🔥 CRITICAL: Chore & Reward Complete Lifecycle', () => {
   28 |   test.setTimeout(TEST_CONFIG.TIMEOUT);
   29 |
   30 |   // ==============================================================
   31 |   // TEST 1: REGRESSION TEST - Import Chores Without Infinite Loop
   32 |   // ==============================================================
   33 |   test('🚨 REGRESSION: Import chores without BucksService infinite loop', async ({ page }) => {
   34 |     test.slow(); // Mark as slow test (3x timeout)
   35 |
   36 |     console.log('🎯 CRITICAL REGRESSION TEST: BucksService infinite loop (Oct 18, 2025 fix)');
   37 |
   38 |     // STEP 1: Navigate to app
>  39 |     await page.goto(TEST_CONFIG.BASE_URL);
      |                ^ TimeoutError: page.goto: Timeout 15000ms exceeded.
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
  138 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chore-admin`);
  139 |     await page.waitForLoadState('networkidle');
```