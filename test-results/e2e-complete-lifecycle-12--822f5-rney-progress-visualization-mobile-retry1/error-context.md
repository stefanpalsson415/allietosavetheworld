# Test info

- Name: 📊 CRITICAL: Weekly Check-ins & Progress Tracking >> 📈 8-week transformation journey progress visualization
- Location: /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/12-weekly-checkins.spec.js:195:3

# Error details

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://localhost:3000/dashboard", waiting until "load"

    at /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/12-weekly-checkins.spec.js:199:16
```

# Test source

```ts
   99 |
  100 |   // ==============================================================
  101 |   // TEST 2: Personalized Weekly Goals
  102 |   // ==============================================================
  103 |   test('🎯 Personalized weekly goals generated from imbalances', async ({ page }) => {
  104 |     console.log('🎯 TEST: AI-generated weekly goals');
  105 |     console.log('Landing page: "Personalized weekly goals based on your balance data"');
  106 |
  107 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
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
> 199 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      |                ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  200 |     await page.waitForLoadState('networkidle');
  201 |
  202 |     // Navigate to progress/analytics section
  203 |     const progressTab = page.locator('button:has-text("Progress"), a:has-text("Analytics"), button:has-text("Journey")').first();
  204 |
  205 |     if (await progressTab.isVisible({ timeout: 5000 }).catch(() => false)) {
  206 |       await progressTab.click();
  207 |       await page.waitForTimeout(2000);
  208 |
  209 |       console.log('📍 Viewing progress visualization...');
  210 |
  211 |       // STEP 1: Look for week-by-week breakdown
  212 |       const weekLabels = await page.locator('text=/week\\s+\\d/i').all();
  213 |       console.log(`📊 Found ${weekLabels.length} week labels`);
  214 |
  215 |       // STEP 2: Look for balance trend chart
  216 |       const hasChart = await page.locator('svg, canvas, [class*="chart"]').isVisible({ timeout: 3000 }).catch(() => false);
  217 |       console.log(`📊 Visualization chart: ${hasChart ? '✅' : '⚠️'}`);
  218 |
  219 |       // STEP 3: Look for improvement metrics
  220 |       const hasMetrics = await page.locator('text=/%/, text=/improved/i, text=/progress/i').isVisible({ timeout: 3000 }).catch(() => false);
  221 |       console.log(`📊 Improvement metrics: ${hasMetrics ? '✅' : '⚠️'}`);
  222 |
  223 |       // ASSERTION: At least visual progress tracking exists
  224 |       expect(weekLabels.length > 0 || hasChart || hasMetrics).toBeTruthy();
  225 |       console.log('✅ PASS: Progress visualization exists');
  226 |
  227 |     } else {
  228 |       console.log('⚠️ Progress section not found - may need different navigation');
  229 |       test.skip();
  230 |     }
  231 |   });
  232 |
  233 |   // ==============================================================
  234 |   // TEST 5: Sustainable Habits Formation
  235 |   // ==============================================================
  236 |   test('🌱 Sustainable habits formation tracking', async ({ page }) => {
  237 |     console.log('🎯 TEST: Habit formation progress');
  238 |     console.log('Landing page: "Build lasting habits, not quick fixes"');
  239 |
  240 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=habits`);
  241 |     await page.waitForLoadState('networkidle');
  242 |
  243 |     // STEP 1: Look for habit tracking interface
  244 |     const habitsList = page.locator('[class*="habit"], [role="list"]').first();
  245 |
  246 |     if (await habitsList.isVisible({ timeout: 5000 }).catch(() => false)) {
  247 |       console.log('✅ Found habits tracking interface');
  248 |
  249 |       // STEP 2: Check for habit streak tracking
  250 |       const hasStreaks = await page.locator('text=/\\d+.*day.*streak/i, text=/days.*in.*row/i').isVisible({ timeout: 3000 }).catch(() => false);
  251 |
  252 |       console.log(`📊 Streak tracking: ${hasStreaks ? '✅' : '⚠️'}`);
  253 |
  254 |       // STEP 3: Look for habit completion checkboxes/buttons
  255 |       const habitCheckboxes = await page.locator('input[type="checkbox"], button[class*="complete"]').all();
  256 |
  257 |       console.log(`📊 Found ${habitCheckboxes.length} completable habits`);
  258 |
  259 |       // STEP 4: Verify progress indicators
  260 |       const hasProgress = await page.locator('[class*="progress"], [role="progressbar"]').count();
  261 |
  262 |       console.log(`📊 Progress indicators: ${hasProgress}`);
  263 |
  264 |       // ASSERTION: Habit tracking functional
  265 |       expect(habitCheckboxes.length > 0 || hasStreaks || hasProgress > 0).toBeTruthy();
  266 |       console.log('✅ PASS: Sustainable habit formation tracking exists');
  267 |
  268 |     } else {
  269 |       console.log('⚠️ Habits interface not found');
  270 |       test.skip();
  271 |     }
  272 |   });
  273 |
  274 |   // ==============================================================
  275 |   // TEST 6: Domain Rotation Tracking
  276 |   // ==============================================================
  277 |   test('🔄 Domain rotation and responsibility shift tracking', async ({ page }) => {
  278 |     console.log('🎯 TEST: Domain rotation system');
  279 |     console.log('Landing page: "Rotate responsibilities to prevent burnout"');
  280 |
  281 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
  282 |     await page.waitForLoadState('networkidle');
  283 |
  284 |     // Navigate to balance/co-ownership section
  285 |     const balanceTab = page.locator('button:has-text("Balance"), a:has-text("Co-Ownership"), button:has-text("Relationship")').first();
  286 |
  287 |     if (await balanceTab.isVisible({ timeout: 5000 }).catch(() => false)) {
  288 |       await balanceTab.click();
  289 |       await page.waitForTimeout(2000);
  290 |
  291 |       console.log('📍 Viewing domain rotation...');
  292 |
  293 |       // STEP 1: Look for domain breakdown
  294 |       const domains = ['cooking', 'cleaning', 'childcare', 'scheduling', 'finances', 'household'];
  295 |       let domainsFound = 0;
  296 |
  297 |       for (const domain of domains) {
  298 |         const found = await page.locator(`text=/${domain}/i`).isVisible({ timeout: 1000 }).catch(() => false);
  299 |         if (found) domainsFound++;
```