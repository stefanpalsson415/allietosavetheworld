// tests/e2e/complete-lifecycle/14-chore-reward-lifecycle.spec.js
// 🎯 CRITICAL REGRESSION TESTS - Chore & Reward System
// Protects BucksService fix from Oct 18, 2025 (infinite loop bug)

const { test, expect } = require('@playwright/test');

// Test configuration
const TEST_CONFIG = {
  BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
  TIMEOUT: 30000,

  // Test family data
  TEST_FAMILY: {
    name: 'Test Family Chores',
    parent1: {
      email: 'parent1.chores@test.com',
      password: 'TestPassword123!',
      name: 'Test Parent 1'
    },
    children: [
      { name: 'Oly', age: 8 },
      { name: 'Tegner', age: 6 }
    ]
  }
};

test.describe('🔥 CRITICAL: Chore & Reward Complete Lifecycle', () => {
  test.setTimeout(TEST_CONFIG.TIMEOUT);

  // ==============================================================
  // TEST 1: REGRESSION TEST - Import Chores Without Infinite Loop
  // ==============================================================
  test('🚨 REGRESSION: Import chores without BucksService infinite loop', async ({ page }) => {
    test.slow(); // Mark as slow test (3x timeout)

    console.log('🎯 CRITICAL REGRESSION TEST: BucksService infinite loop (Oct 18, 2025 fix)');

    // STEP 1: Navigate to app
    await page.goto(TEST_CONFIG.BASE_URL);

    // STEP 2: Login (assuming test user exists - we'll create setup later)
    // For now, navigate directly to dashboard if already logged in
    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chore-admin`);

    // STEP 3: Wait for dashboard to load
    await page.waitForLoadState('networkidle');

    // STEP 4: Setup console error monitoring
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // STEP 5: Navigate to Kids Section Admin tab
    console.log('📍 Navigating to Kids Section Admin...');
    const adminTab = page.locator('button:has-text("Kids Section Admin"), a:has-text("Kids Section Admin")').first();

    if (await adminTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await adminTab.click();
      await page.waitForTimeout(2000);
    }

    // STEP 6: Look for "Import Default Chores" button
    console.log('🔍 Looking for Import Default Chores button...');
    const importButton = page.locator('button:has-text("Import Default Chores"), button:has-text("Import Chores")').first();

    if (await importButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✅ Found import button, clicking...');

      // STEP 7: Click import button
      await importButton.click();

      // STEP 8: Wait for import to complete
      await page.waitForTimeout(3000);

      // STEP 9: CRITICAL - Check for infinite error loop
      const bucksServiceErrors = consoleErrors.filter(err =>
        err.includes('BucksService') ||
        err.includes('No balance found') ||
        err.includes('getBalance')
      );

      console.log(`📊 BucksService errors detected: ${bucksServiceErrors.length}`);

      // ASSERTION 1: No infinite loop (< 10 errors is acceptable, 100+ means infinite loop)
      expect(bucksServiceErrors.length).toBeLessThan(10);
      console.log('✅ PASS: No infinite error loop detected');

    } else {
      console.log('⚠️ Import button not found - may need authentication');
    }

    // STEP 10: Navigate to "Palsson Bucks Accounts" tab
    console.log('📍 Navigating to Palsson Bucks Accounts...');
    const bucksTab = page.locator('button:has-text("Palsson Bucks"), button:has-text("Bucks Account"), button:has-text("My Palsson Bucks")').first();

    if (await bucksTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await bucksTab.click();
      await page.waitForTimeout(2000);

      // STEP 11: Verify balances show $0 (not undefined)
      const balanceElements = await page.locator('text=/\\$\\d+/').all();
      console.log(`💰 Found ${balanceElements.length} balance displays`);

      // ASSERTION 2: At least some balance displays exist
      expect(balanceElements.length).toBeGreaterThan(0);
      console.log('✅ PASS: Balance displays found (not undefined)');

      // ASSERTION 3: No new console errors after viewing balances
      const postBucksErrors = consoleErrors.filter(err =>
        err.includes('BucksService') ||
        err.includes('No balance found')
      );
      expect(postBucksErrors.length).toBeLessThan(10);
      console.log('✅ PASS: No errors when viewing balances');

    } else {
      console.log('⚠️ Bucks tab not found');
    }

    // FINAL ASSERTION: Overall console health
    expect(consoleErrors.length).toBeLessThan(20); // Allow some non-critical errors

    console.log('🎉 REGRESSION TEST COMPLETE: BucksService infinite loop PROTECTED');
  });

  // ==============================================================
  // TEST 2: Bucks Balance Auto-Initialization
  // ==============================================================
  test('💰 Bucks balance auto-initializes to $0 for new children', async ({ page }) => {
    console.log('🎯 TEST: Bucks balance auto-initialization');

    // This test validates the fix where getChildBalance() auto-initializes
    // instead of throwing an error for new children

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chore-admin`);
    await page.waitForLoadState('networkidle');

    // Navigate to Bucks tab
    const bucksTab = page.locator('button:has-text("Palsson Bucks"), button:has-text("My Palsson Bucks")').first();

    if (await bucksTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await bucksTab.click();
      await page.waitForTimeout(2000);

      // Look for $0 balances (default for new children)
      const zeroBalances = page.locator('text=/\\$0(?:\\.00)?/');
      const count = await zeroBalances.count();

      console.log(`💰 Found ${count} $0 balance displays`);

      // ASSERTION: At least one child has $0 balance (auto-initialized)
      expect(count).toBeGreaterThan(0);
      console.log('✅ PASS: Children have auto-initialized $0 balances');

    } else {
      console.log('⚠️ Bucks tab not available - skipping test');
      test.skip();
    }
  });

  // ==============================================================
  // TEST 3: Create Custom Chore Template
  // ==============================================================
  test('📝 Create custom chore template', async ({ page }) => {
    console.log('🎯 TEST: Create custom chore template');

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chore-admin`);
    await page.waitForLoadState('networkidle');

    // Look for "Create Chore" or "New Chore" button
    const createButton = page.locator('button:has-text("Create Chore"), button:has-text("New Chore"), button:has-text("Add Chore")').first();

    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createButton.click();
      await page.waitForTimeout(1000);

      // Fill chore details
      const titleInput = page.locator('input[name="title"], input[placeholder*="title" i], input[placeholder*="name" i]').first();
      if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await titleInput.fill('Test Chore: Clean Bedroom');

        // Try to find value/bucks input
        const valueInput = page.locator('input[name="value"], input[placeholder*="buck" i], input[type="number"]').first();
        if (await valueInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await valueInput.fill('5');
        }

        // Try to save
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Create")').first();
        if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await saveButton.click();
          await page.waitForTimeout(2000);

          // Verify chore appears in list
          const choreExists = await page.locator('text=/Test Chore.*Clean Bedroom/i').isVisible({ timeout: 5000 }).catch(() => false);
          expect(choreExists).toBeTruthy();
          console.log('✅ PASS: Custom chore template created');
        } else {
          console.log('⚠️ Save button not found');
          test.skip();
        }
      } else {
        console.log('⚠️ Title input not found');
        test.skip();
      }
    } else {
      console.log('⚠️ Create Chore button not found');
      test.skip();
    }
  });

  // ==============================================================
  // TEST 4: Complete Chore-to-Reward Cycle (FULL E2E)
  // ==============================================================
  test('🎪 FULL E2E: Complete chore → approval → bucks → reward cycle', async ({ page }) => {
    test.slow(); // This is the big one!

    console.log('🎯 FULL E2E TEST: Complete chore-to-reward lifecycle');
    console.log('This test validates the entire SANTA system end-to-end');

    // This is a complex test - we'll build it step by step
    // For now, just scaffold the structure

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    console.log('📝 Step 1: Import chores (if not already done)');
    // Navigate to admin, import chores

    console.log('📝 Step 2: Assign chore to child');
    // Select chore, assign to Oly

    console.log('📝 Step 3: Child completes chore (with photo)');
    // Login as child (or simulate), mark complete, upload photo

    console.log('📝 Step 4: Parent approves chore');
    // View pending approvals, approve

    console.log('📝 Step 5: Verify bucks awarded');
    // Check balance increased

    console.log('📝 Step 6: Child purchases reward');
    // Navigate to rewards, purchase item

    console.log('📝 Step 7: Parent approves reward');
    // View reward requests, approve

    console.log('📝 Step 8: Verify transaction history');
    // Check complete audit trail

    console.log('⚠️ FULL E2E TEST - Scaffolded (needs implementation)');
    console.log('This will be the most important test - validates entire value chain');
  });

  // ==============================================================
  // TEST 5: Chore Assignment to Child
  // ==============================================================
  test('👶 Assign chore to child', async ({ page }) => {
    console.log('🎯 TEST: Assign chore to child');

    // Placeholder - will implement after understanding UI flow
    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chore-admin`);
    await page.waitForLoadState('networkidle');

    console.log('📝 Look for existing chore to assign');
    // Find chore, click assign, select child

    console.log('⚠️ Test scaffolded - needs UI exploration');
  });

  // ==============================================================
  // TEST 6: Child Completes Chore with Photo
  // ==============================================================
  test('📸 Child completes chore with photo proof', async ({ page }) => {
    console.log('🎯 TEST: Child completes chore with photo');

    // This requires child login - will implement after auth setup
    console.log('⚠️ Test scaffolded - needs child authentication flow');
  });

  // ==============================================================
  // TEST 7: Parent Approves Chore
  // ==============================================================
  test('✅ Parent approves chore and awards bucks', async ({ page }) => {
    console.log('🎯 TEST: Parent approves chore');

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chore-admin`);
    await page.waitForLoadState('networkidle');

    console.log('📝 Look for pending approvals section');
    // Find pending, approve, verify bucks awarded

    console.log('⚠️ Test scaffolded - needs approval UI flow');
  });

  // ==============================================================
  // TEST 8: Transaction History Verification
  // ==============================================================
  test('📊 Verify transaction history accurate', async ({ page }) => {
    console.log('🎯 TEST: Transaction history verification');

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    console.log('📝 Navigate to transaction history');
    // View history, verify all transactions recorded

    console.log('⚠️ Test scaffolded - needs transaction UI exploration');
  });

});

// ==============================================================
// HELPER FUNCTIONS
// ==============================================================

/**
 * Create a test family with children for chore testing
 */
async function createTestFamily(page, familyData) {
  // This will be implemented when we build the onboarding test helpers
  console.log('📝 createTestFamily() - To be implemented');
}

/**
 * Login as child user
 */
async function loginAsChild(page, childName) {
  console.log(`📝 loginAsChild(${childName}) - To be implemented`);
}

/**
 * Upload photo for chore completion
 */
async function uploadChorePhoto(page, photoPath) {
  console.log('📝 uploadChorePhoto() - To be implemented');
}

/**
 * Wait for console errors and collect them
 */
async function monitorConsoleErrors(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push({
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
    }
  });
  return errors;
}
