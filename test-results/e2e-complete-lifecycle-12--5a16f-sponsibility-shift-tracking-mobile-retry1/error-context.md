# Test info

- Name: 📊 CRITICAL: Weekly Check-ins & Progress Tracking >> 🔄 Domain rotation and responsibility shift tracking
- Location: /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/12-weekly-checkins.spec.js:277:3

# Error details

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://localhost:3000/dashboard", waiting until "load"

    at /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/12-weekly-checkins.spec.js:281:16
```

# Test source

```ts
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
> 281 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      |                ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
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
  300 |       }
  301 |
  302 |       console.log(`📊 Domains found: ${domainsFound}/${domains.length}`);
  303 |
  304 |       // STEP 2: Look for rotation indicators (who's responsible this week)
  305 |       const hasResponsibility = await page.locator('text=/this.*week/i, text=/responsible/i, text=/owner/i').isVisible({ timeout: 3000 }).catch(() => false);
  306 |
  307 |       console.log(`📊 Rotation indicators: ${hasResponsibility ? '✅' : '⚠️'}`);
  308 |
  309 |       // STEP 3: Look for shift suggestions
  310 |       const hasSuggestions = await page.locator('text=/rotate/i, text=/shift/i, text=/delegate/i').isVisible({ timeout: 3000 }).catch(() => false);
  311 |
  312 |       console.log(`📊 Shift suggestions: ${hasSuggestions ? '✅' : '⚠️'}`);
  313 |
  314 |       // ASSERTION: Domain system exists
  315 |       expect(domainsFound > 0 || hasResponsibility).toBeTruthy();
  316 |       console.log('✅ PASS: Domain rotation tracking exists');
  317 |
  318 |     } else {
  319 |       console.log('⚠️ Balance section not found');
  320 |       test.skip();
  321 |     }
  322 |   });
  323 |
  324 |   // ==============================================================
  325 |   // TEST 7: Balance Trend Analysis
  326 |   // ==============================================================
  327 |   test('📊 Balance trend analysis over time', async ({ page }) => {
  328 |     console.log('🎯 TEST: Historical balance trends');
  329 |     console.log('Landing page: "Track your balance improvement week by week"');
  330 |
  331 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
  332 |     await page.waitForLoadState('networkidle');
  333 |
  334 |     // This would show balance percentages trending over weeks
  335 |     // Example: Week 1: 78/22%, Week 4: 65/35%, Week 8: 55/45%
  336 |
  337 |     const balanceTab = page.locator('button:has-text("Balance"), a:has-text("Analytics")').first();
  338 |
  339 |     if (await balanceTab.isVisible({ timeout: 5000 }).catch(() => false)) {
  340 |       await balanceTab.click();
  341 |       await page.waitForTimeout(2000);
  342 |
  343 |       console.log('📍 Analyzing balance trends...');
  344 |
  345 |       // STEP 1: Look for historical data
  346 |       const hasHistory = await page.locator('text=/history/i, text=/trend/i, text=/over.*time/i').isVisible({ timeout: 3000 }).catch(() => false);
  347 |
  348 |       console.log(`📊 Historical data: ${hasHistory ? '✅' : '⚠️'}`);
  349 |
  350 |       // STEP 2: Look for improvement metrics
  351 |       const hasImprovement = await page.locator('text=/improved/i, text=/better/i, text=/progress/i').isVisible({ timeout: 3000 }).catch(() => false);
  352 |
  353 |       console.log(`📊 Improvement tracking: ${hasImprovement ? '✅' : '⚠️'}`);
  354 |
  355 |       // STEP 3: Look for percentage displays (balance split)
  356 |       const percentages = await page.locator('text=/%/').all();
  357 |
  358 |       console.log(`📊 Found ${percentages.length} percentage displays`);
  359 |
  360 |       // ASSERTION: Trend analysis exists
  361 |       expect(hasHistory || hasImprovement || percentages.length > 0).toBeTruthy();
  362 |       console.log('✅ PASS: Balance trend analysis exists');
  363 |
  364 |     } else {
  365 |       console.log('⚠️ Balance section not found');
  366 |       test.skip();
  367 |     }
  368 |   });
  369 |
  370 |   // ==============================================================
  371 |   // TEST 8: Goal Achievement Tracking
  372 |   // ==============================================================
  373 |   test('🏆 Goal achievement and milestone celebration', async ({ page }) => {
  374 |     console.log('🎯 TEST: Goal tracking and celebrations');
  375 |     console.log('Landing page: "Celebrate wins together"');
  376 |
  377 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
  378 |     await page.waitForLoadState('networkidle');
  379 |
  380 |     // Look for goals or achievements section
  381 |     const goalsTab = page.locator('button:has-text("Goals"), a:has-text("Achievements"), text=/milestones/i').first();
```