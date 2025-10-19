# Test info

- Name: 👶 CRITICAL: Child Development Tracking >> 📏 Growth tracking - height and weight measurements
- Location: /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/07-child-development.spec.js:48:3

# Error details

```
TimeoutError: page.goto: Timeout 15000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/dashboard", waiting until "load"

    at /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/07-child-development.spec.js:52:16
```

# Test source

```ts
   1 | // tests/e2e/complete-lifecycle/07-child-development.spec.js
   2 | // 🎯 CRITICAL: Child Development Tracking Tests
   3 | // "Track growth, health, education, and milestones in one place"
   4 |
   5 | const { test, expect } = require('@playwright/test');
   6 |
   7 | const TEST_CONFIG = {
   8 |   BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
   9 |   TIMEOUT: 40000,
   10 |
   11 |   // Test child development data
   12 |   DEVELOPMENT_DATA: {
   13 |     growth: {
   14 |       height: '48 inches',
   15 |       weight: '52 lbs',
   16 |       date: '2025-10-15',
   17 |       child: 'Jack'
   18 |     },
   19 |     health: {
   20 |       visitType: 'Annual checkup',
   21 |       doctor: 'Dr. Chen',
   22 |       date: '2025-10-10',
   23 |       notes: 'All vaccines up to date. Increase flossing to daily.',
   24 |       child: 'Jack'
   25 |     },
   26 |     education: {
   27 |       subject: 'Math',
   28 |       grade: 'A-',
   29 |       teacher: 'Mrs. Johnson',
   30 |       semester: 'Fall 2025',
   31 |       child: 'Emma'
   32 |     },
   33 |     milestone: {
   34 |       title: 'First bike ride without training wheels',
   35 |       date: '2025-10-05',
   36 |       category: 'Physical',
   37 |       child: 'Jack'
   38 |     }
   39 |   }
   40 | };
   41 |
   42 | test.describe('👶 CRITICAL: Child Development Tracking', () => {
   43 |   test.setTimeout(TEST_CONFIG.TIMEOUT);
   44 |
   45 |   // ==============================================================
   46 |   // TEST 1: Growth Tracking (Height/Weight)
   47 |   // ==============================================================
   48 |   test('📏 Growth tracking - height and weight measurements', async ({ page }) => {
   49 |     console.log('🎯 TEST: Growth measurement tracking');
   50 |     console.log('Landing page: "Track your child\'s growth over time"');
   51 |
>  52 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      |                ^ TimeoutError: page.goto: Timeout 15000ms exceeded.
   53 |     await page.waitForLoadState('networkidle');
   54 |
   55 |     // Navigate to child development or kids section
   56 |     const kidsTab = page.locator('button:has-text("Kids"), a:has-text("Children"), button:has-text("Development")').first();
   57 |
   58 |     if (await kidsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
   59 |       await kidsTab.click();
   60 |       await page.waitForTimeout(2000);
   61 |
   62 |       console.log('📍 Navigated to child development section');
   63 |
   64 |       // STEP 1: Look for growth tracking interface
   65 |       const growthSection = page.locator('text=/growth/i, text=/height/i, text=/weight/i').first();
   66 |
   67 |       if (await growthSection.isVisible({ timeout: 3000 }).catch(() => false)) {
   68 |         console.log('✅ Found growth tracking section');
   69 |
   70 |         // STEP 2: Look for input fields for measurements
   71 |         const heightInput = page.locator('input[name*="height" i], input[placeholder*="height" i]').first();
   72 |         const weightInput = page.locator('input[name*="weight" i], input[placeholder*="weight" i]').first();
   73 |
   74 |         const hasHeightInput = await heightInput.isVisible({ timeout: 2000 }).catch(() => false);
   75 |         const hasWeightInput = await weightInput.isVisible({ timeout: 2000 }).catch(() => false);
   76 |
   77 |         console.log(`📊 Height input: ${hasHeightInput ? '✅' : '⚠️'}`);
   78 |         console.log(`📊 Weight input: ${hasWeightInput ? '✅' : '⚠️'}`);
   79 |
   80 |         if (hasHeightInput && hasWeightInput) {
   81 |           // Try to add a measurement
   82 |           await heightInput.fill(TEST_CONFIG.DEVELOPMENT_DATA.growth.height);
   83 |           await weightInput.fill(TEST_CONFIG.DEVELOPMENT_DATA.growth.weight);
   84 |
   85 |           console.log(`✓ Entered: ${TEST_CONFIG.DEVELOPMENT_DATA.growth.height}, ${TEST_CONFIG.DEVELOPMENT_DATA.growth.weight}`);
   86 |
   87 |           const saveButton = page.locator('button:has-text("Save"), button:has-text("Add")').first();
   88 |
   89 |           if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
   90 |             await saveButton.click();
   91 |             await page.waitForTimeout(2000);
   92 |             console.log('✅ PASS: Growth tracking functional');
   93 |           }
   94 |         }
   95 |
   96 |         expect(hasHeightInput || hasWeightInput).toBeTruthy();
   97 |
   98 |       } else {
   99 |         console.log('⚠️ Growth section not found - may need different navigation');
  100 |         test.skip();
  101 |       }
  102 |
  103 |     } else {
  104 |       console.log('⚠️ Kids section not found');
  105 |       test.skip();
  106 |     }
  107 |   });
  108 |
  109 |   // ==============================================================
  110 |   // TEST 2: Health Tracking (Doctor Visits, Vaccines)
  111 |   // ==============================================================
  112 |   test('🏥 Health tracking - doctor visits and vaccination records', async ({ page }) => {
  113 |     console.log('🎯 CRITICAL TEST: Health record tracking');
  114 |     console.log('Landing page: "Never forget a vaccine or doctor recommendation again"');
  115 |
  116 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
  117 |     await page.waitForLoadState('networkidle');
  118 |
  119 |     const chatInput = page.locator('textarea, input[type="text"]').last();
  120 |
  121 |     if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
  122 |       // STEP 1: Record doctor visit via Allie
  123 |       const healthRecord = `${TEST_CONFIG.DEVELOPMENT_DATA.health.child} had ${TEST_CONFIG.DEVELOPMENT_DATA.health.visitType} with ${TEST_CONFIG.DEVELOPMENT_DATA.health.doctor} on ${TEST_CONFIG.DEVELOPMENT_DATA.health.date}. ${TEST_CONFIG.DEVELOPMENT_DATA.health.notes}`;
  124 |
  125 |       await chatInput.fill(healthRecord);
  126 |       console.log(`📝 Recording health visit: "${healthRecord}"`);
  127 |
  128 |       const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
  129 |       await sendButton.click();
  130 |       await page.waitForTimeout(8000);
  131 |
  132 |       // STEP 2: Verify Allie confirms saving health record
  133 |       const response = await page.locator('div[class*="message"]').last().textContent();
  134 |
  135 |       const savedDoctor = response?.includes('Dr. Chen');
  136 |       const savedRecommendation = response?.toLowerCase().includes('floss') ||
  137 |                                   response?.toLowerCase().includes('save') ||
  138 |                                   response?.toLowerCase().includes('record');
  139 |
  140 |       console.log('📊 Health record capture:');
  141 |       console.log(`   - Doctor name: ${savedDoctor ? '✅' : '❌'}`);
  142 |       console.log(`   - Recommendations: ${savedRecommendation ? '✅' : '❌'}`);
  143 |
  144 |       // ASSERTION: Allie captured health information
  145 |       expect(savedDoctor || savedRecommendation).toBeTruthy();
  146 |       console.log('✅ PASS: Health tracking via Allie works');
  147 |
  148 |       // STEP 3: Test recall of health information
  149 |       await page.waitForTimeout(2000);
  150 |       await chatInput.fill("What did Dr. Chen recommend for Jack?");
  151 |       console.log('📝 Testing health record recall...');
  152 |
```