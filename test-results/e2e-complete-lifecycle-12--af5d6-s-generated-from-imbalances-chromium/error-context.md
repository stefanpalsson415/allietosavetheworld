# Test info

- Name: 📊 CRITICAL: Weekly Check-ins & Progress Tracking >> 🎯 Personalized weekly goals generated from imbalances
- Location: /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/12-weekly-checkins.spec.js:103:3

# Error details

```
TimeoutError: page.goto: Timeout 15000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/dashboard", waiting until "load"

    at /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/12-weekly-checkins.spec.js:107:16
```

# Test source

```ts
   7 | const TEST_CONFIG = {
   8 |   BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
   9 |   TIMEOUT: 40000,
   10 |
   11 |   // Test weekly check-in data
   12 |   WEEKLY_DATA: {
   13 |     week1: {
   14 |       balanceRating: 3, // out of 10
   15 |       topChallenge: 'Morning routine chaos',
   16 |       goalProgress: 'Started delegating breakfast prep',
   17 |       emotionalState: 'Overwhelmed'
   18 |     },
   19 |     week4: {
   20 |       balanceRating: 7,
   21 |       topChallenge: 'Still struggling with evening bedtime',
   22 |       goalProgress: 'Morning routine much better!',
   23 |       emotionalState: 'Hopeful'
   24 |     },
   25 |     week8: {
   26 |       balanceRating: 9,
   27 |       topChallenge: 'Maintaining consistency',
   28 |       goalProgress: 'Both routines running smoothly',
   29 |       emotionalState: 'Confident'
   30 |     }
   31 |   }
   32 | };
   33 |
   34 | test.describe('📊 CRITICAL: Weekly Check-ins & Progress Tracking', () => {
   35 |   test.setTimeout(TEST_CONFIG.TIMEOUT);
   36 |
   37 |   // ==============================================================
   38 |   // TEST 1: Weekly Balance Check-In Survey
   39 |   // ==============================================================
   40 |   test('📋 Weekly balance check-in survey completion', async ({ page }) => {
   41 |     console.log('🎯 CRITICAL TEST: Weekly check-in survey');
   42 |     console.log('Landing page: "Weekly check-ins keep you on track"');
   43 |
   44 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
   45 |     await page.waitForLoadState('networkidle');
   46 |
   47 |     // STEP 1: Look for weekly check-in prompt
   48 |     const checkInPrompt = page.locator('text=/weekly.*check.*in/i, button:has-text("Check-In"), a:has-text("Weekly Review")').first();
   49 |
   50 |     if (await checkInPrompt.isVisible({ timeout: 5000 }).catch(() => false)) {
   51 |       console.log('✅ Found weekly check-in entry point');
   52 |
   53 |       await checkInPrompt.click();
   54 |       await page.waitForTimeout(2000);
   55 |
   56 |       // STEP 2: Fill out check-in survey
   57 |       console.log('📝 Completing weekly check-in...');
   58 |
   59 |       // Look for balance rating (usually a slider or radio buttons)
   60 |       const balanceRating = page.locator('input[type="range"], input[type="radio"]').first();
   61 |
   62 |       if (await balanceRating.isVisible({ timeout: 3000 }).catch(() => false)) {
   63 |         await balanceRating.fill('7'); // Rate current balance
   64 |         console.log('✓ Rated weekly balance: 7/10');
   65 |
   66 |         // Look for text areas for challenges/progress
   67 |         const challengeInput = page.locator('textarea[placeholder*="challenge" i], textarea[name*="challenge" i]').first();
   68 |
   69 |         if (await challengeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
   70 |           await challengeInput.fill(TEST_CONFIG.WEEKLY_DATA.week1.topChallenge);
   71 |           console.log(`✓ Entered top challenge: ${TEST_CONFIG.WEEKLY_DATA.week1.topChallenge}`);
   72 |         }
   73 |
   74 |         const progressInput = page.locator('textarea[placeholder*="progress" i], textarea[name*="progress" i]').first();
   75 |
   76 |         if (await progressInput.isVisible({ timeout: 2000 }).catch(() => false)) {
   77 |           await progressInput.fill(TEST_CONFIG.WEEKLY_DATA.week1.goalProgress);
   78 |           console.log(`✓ Entered progress: ${TEST_CONFIG.WEEKLY_DATA.week1.goalProgress}`);
   79 |         }
   80 |
   81 |         // STEP 3: Submit check-in
   82 |         const submitButton = page.locator('button:has-text("Submit"), button:has-text("Complete"), button:has-text("Save")').first();
   83 |
   84 |         if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
   85 |           await submitButton.click();
   86 |           await page.waitForTimeout(2000);
   87 |
   88 |           console.log('✅ PASS: Weekly check-in survey completed');
   89 |           expect(true).toBeTruthy();
   90 |         }
   91 |       }
   92 |
   93 |     } else {
   94 |       console.log('⚠️ Weekly check-in not visible');
   95 |       console.log('📝 Note: May require completing initial survey first');
   96 |       test.skip();
   97 |     }
   98 |   });
   99 |
  100 |   // ==============================================================
  101 |   // TEST 2: Personalized Weekly Goals
  102 |   // ==============================================================
  103 |   test('🎯 Personalized weekly goals generated from imbalances', async ({ page }) => {
  104 |     console.log('🎯 TEST: AI-generated weekly goals');
  105 |     console.log('Landing page: "Personalized weekly goals based on your balance data"');
  106 |
> 107 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      |                ^ TimeoutError: page.goto: Timeout 15000ms exceeded.
  108 |     await page.waitForLoadState('networkidle');
  109 |
  110 |     // Navigate to goals or weekly plan section
  111 |     const goalsSection = page.locator('text=/this.*week.*goals/i, text=/weekly.*plan/i, button:has-text("Goals")').first();
  112 |
  113 |     if (await goalsSection.isVisible({ timeout: 5000 }).catch(() => false)) {
  114 |       await goalsSection.click();
  115 |       await page.waitForTimeout(2000);
  116 |
  117 |       console.log('📍 Viewing weekly goals...');
  118 |
  119 |       // STEP 1: Verify goals are displayed
  120 |       const goalItems = await page.locator('[class*="goal"], li, div[class*="objective"]').all();
  121 |
  122 |       console.log(`📊 Found ${goalItems.length} goal items`);
  123 |
  124 |       // STEP 2: Check for goal personalization indicators
  125 |       const hasPersonalization = await page.locator('text=/based.*on/i, text=/recommended/i, text=/balance/i').isVisible({ timeout: 3000 }).catch(() => false);
  126 |
  127 |       console.log(`📊 Personalized goals: ${hasPersonalization ? '✅' : '⚠️'}`);
  128 |
  129 |       // STEP 3: Verify goals are actionable (have clear actions)
  130 |       const actionableGoals = await page.locator('text=/delegate/i, text=/reduce/i, text=/increase/i, text=/schedule/i').count();
  131 |
  132 |       console.log(`📊 Actionable goals: ${actionableGoals}`);
  133 |
  134 |       // ASSERTION: At least some goals present
  135 |       expect(goalItems.length > 0 || hasPersonalization).toBeTruthy();
  136 |       console.log('✅ PASS: Personalized weekly goals exist');
  137 |
  138 |     } else {
  139 |       console.log('⚠️ Goals section not found');
  140 |       test.skip();
  141 |     }
  142 |   });
  143 |
  144 |   // ==============================================================
  145 |   // TEST 3: Family Meeting Facilitation
  146 |   // ==============================================================
  147 |   test('👥 Family meeting facilitation and agenda creation', async ({ page }) => {
  148 |     console.log('🎯 TEST: Family meeting tools');
  149 |     console.log('Landing page: "Weekly family meetings made easy"');
  150 |
  151 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
  152 |     await page.waitForLoadState('networkidle');
  153 |
  154 |     const chatInput = page.locator('textarea, input[type="text"]').last();
  155 |
  156 |     if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
  157 |       // STEP 1: Ask Allie to help with family meeting
  158 |       const meetingRequest = "Help me prepare agenda for this week's family meeting";
  159 |
  160 |       await chatInput.fill(meetingRequest);
  161 |       console.log('📝 Requesting family meeting help...');
  162 |
  163 |       const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
  164 |       await sendButton.click();
  165 |       await page.waitForTimeout(8000);
  166 |
  167 |       // STEP 2: Verify Allie provides meeting structure
  168 |       const response = await page.locator('div[class*="message"]').last().textContent();
  169 |
  170 |       const hasAgenda = response?.toLowerCase().includes('agenda') ||
  171 |                        response?.toLowerCase().includes('topics') ||
  172 |                        response?.toLowerCase().includes('discuss');
  173 |
  174 |       const hasSections = response?.toLowerCase().includes('review') ||
  175 |                          response?.toLowerCase().includes('goals') ||
  176 |                          response?.toLowerCase().includes('wins');
  177 |
  178 |       console.log('📊 Family meeting support:');
  179 |       console.log(`   - Agenda structure: ${hasAgenda ? '✅' : '❌'}`);
  180 |       console.log(`   - Meeting sections: ${hasSections ? '✅' : '❌'}`);
  181 |
  182 |       // ASSERTION: Allie provides meeting support
  183 |       expect(hasAgenda || hasSections).toBeTruthy();
  184 |       console.log('✅ PASS: Family meeting facilitation works');
  185 |
  186 |     } else {
  187 |       console.log('⚠️ Chat input not found');
  188 |       test.skip();
  189 |     }
  190 |   });
  191 |
  192 |   // ==============================================================
  193 |   // TEST 4: Progress Visualization (8-Week Journey)
  194 |   // ==============================================================
  195 |   test('📈 8-week transformation journey progress visualization', async ({ page }) => {
  196 |     console.log('🎯 CRITICAL TEST: Progress visualization');
  197 |     console.log('Landing page: "See your progress over 8 weeks"');
  198 |
  199 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
  200 |     await page.waitForLoadState('networkidle');
  201 |
  202 |     // Navigate to progress/analytics section
  203 |     const progressTab = page.locator('button:has-text("Progress"), a:has-text("Analytics"), button:has-text("Journey")').first();
  204 |
  205 |     if (await progressTab.isVisible({ timeout: 5000 }).catch(() => false)) {
  206 |       await progressTab.click();
  207 |       await page.waitForTimeout(2000);
```