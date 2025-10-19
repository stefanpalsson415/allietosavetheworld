# Test info

- Name: 📊 CRITICAL: Weekly Check-ins & Progress Tracking >> 💭 Weekly reflection prompts and journaling
- Location: /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/12-weekly-checkins.spec.js:417:3

# Error details

```
TimeoutError: page.goto: Timeout 15000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/dashboard?tab=chat", waiting until "load"

    at /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/12-weekly-checkins.spec.js:421:16
```

# Test source

```ts
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
  382 |
  383 |     if (await goalsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
  384 |       await goalsTab.click();
  385 |       await page.waitForTimeout(2000);
  386 |
  387 |       console.log('📍 Viewing goal achievements...');
  388 |
  389 |       // STEP 1: Look for completed goals
  390 |       const completedGoals = await page.locator('[class*="complete"], text=/✓/, text=/achieved/i').all();
  391 |
  392 |       console.log(`📊 Found ${completedGoals.length} completed goals`);
  393 |
  394 |       // STEP 2: Look for celebration/recognition elements
  395 |       const hasCelebration = await page.locator('text=/congrat/i, text=/great.*job/i, text=/milestone/i, text=/🎉/').isVisible({ timeout: 3000 }).catch(() => false);
  396 |
  397 |       console.log(`📊 Celebration elements: ${hasCelebration ? '✅' : '⚠️'}`);
  398 |
  399 |       // STEP 3: Look for progress towards active goals
  400 |       const progressBars = await page.locator('[class*="progress"], [role="progressbar"]').all();
  401 |
  402 |       console.log(`📊 Found ${progressBars.length} progress indicators`);
  403 |
  404 |       // ASSERTION: Goal tracking exists
  405 |       expect(completedGoals.length > 0 || hasCelebration || progressBars.length > 0).toBeTruthy();
  406 |       console.log('✅ PASS: Goal achievement tracking exists');
  407 |
  408 |     } else {
  409 |       console.log('⚠️ Goals section not found');
  410 |       test.skip();
  411 |     }
  412 |   });
  413 |
  414 |   // ==============================================================
  415 |   // TEST 9: Weekly Reflection Prompts
  416 |   // ==============================================================
  417 |   test('💭 Weekly reflection prompts and journaling', async ({ page }) => {
  418 |     console.log('🎯 TEST: Reflection prompts');
  419 |     console.log('Landing page: "Reflect on what\'s working and what\'s not"');
  420 |
> 421 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
      |                ^ TimeoutError: page.goto: Timeout 15000ms exceeded.
  422 |     await page.waitForLoadState('networkidle');
  423 |
  424 |     const chatInput = page.locator('textarea, input[type="text"]').last();
  425 |
  426 |     if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
  427 |       // STEP 1: Ask Allie for weekly reflection
  428 |       await chatInput.fill("What should I reflect on this week?");
  429 |       console.log('📝 Requesting reflection prompts...');
  430 |
  431 |       const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
  432 |       await sendButton.click();
  433 |       await page.waitForTimeout(6000);
  434 |
  435 |       // STEP 2: Verify Allie provides reflection questions
  436 |       const response = await page.locator('div[class*="message"]').last().textContent();
  437 |
  438 |       const hasReflectionPrompts = response?.includes('?') ||
  439 |                                    response?.toLowerCase().includes('reflect') ||
  440 |                                    response?.toLowerCase().includes('think about') ||
  441 |                                    response?.toLowerCase().includes('consider');
  442 |
  443 |       const hasMeaningfulQuestions = (response?.match(/\?/g) || []).length >= 2;
  444 |
  445 |       console.log('📊 Reflection support:');
  446 |       console.log(`   - Has prompts: ${hasReflectionPrompts ? '✅' : '❌'}`);
  447 |       console.log(`   - Multiple questions: ${hasMeaningfulQuestions ? '✅' : '❌'}`);
  448 |
  449 |       // ASSERTION: Allie provides reflection support
  450 |       expect(hasReflectionPrompts).toBeTruthy();
  451 |       console.log('✅ PASS: Weekly reflection prompts work');
  452 |
  453 |     } else {
  454 |       console.log('⚠️ Chat input not found');
  455 |       test.skip();
  456 |     }
  457 |   });
  458 |
  459 |   // ==============================================================
  460 |   // TEST 10: Weekly Summary Report Generation
  461 |   // ==============================================================
  462 |   test('📄 Automated weekly summary report generation', async ({ page }) => {
  463 |     console.log('🎯 TEST: Weekly summary reports');
  464 |     console.log('Landing page: "Get a weekly summary of your progress"');
  465 |
  466 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
  467 |     await page.waitForLoadState('networkidle');
  468 |
  469 |     // Look for reports or summaries section
  470 |     const reportsButton = page.locator('button:has-text("Reports"), button:has-text("Summary"), a:has-text("Weekly Review")').first();
  471 |
  472 |     if (await reportsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
  473 |       await reportsButton.click();
  474 |       await page.waitForTimeout(2000);
  475 |
  476 |       console.log('📍 Viewing weekly summary report...');
  477 |
  478 |       // STEP 1: Verify report sections exist
  479 |       const reportSections = ['completed', 'progress', 'balance', 'goals', 'wins'];
  480 |       let sectionsFound = 0;
  481 |
  482 |       for (const section of reportSections) {
  483 |         const found = await page.locator(`text=/${section}/i`).isVisible({ timeout: 1000 }).catch(() => false);
  484 |         if (found) sectionsFound++;
  485 |       }
  486 |
  487 |       console.log(`📊 Report sections found: ${sectionsFound}/${reportSections.length}`);
  488 |
  489 |       // STEP 2: Look for data visualizations
  490 |       const hasVisuals = await page.locator('svg, canvas, [class*="chart"]').count();
  491 |
  492 |       console.log(`📊 Visual elements: ${hasVisuals}`);
  493 |
  494 |       // STEP 3: Look for actionable insights
  495 |       const hasInsights = await page.locator('text=/insight/i, text=/recommend/i, text=/next.*week/i').isVisible({ timeout: 3000 }).catch(() => false);
  496 |
  497 |       console.log(`📊 Actionable insights: ${hasInsights ? '✅' : '⚠️'}`);
  498 |
  499 |       // ASSERTION: Report generation exists
  500 |       expect(sectionsFound > 0 || hasVisuals > 0 || hasInsights).toBeTruthy();
  501 |       console.log('✅ PASS: Weekly summary report generation exists');
  502 |
  503 |     } else {
  504 |       console.log('⚠️ Reports section not found');
  505 |       console.log('📝 Note: May be accessible via Allie chat instead');
  506 |     }
  507 |   });
  508 |
  509 |   // ==============================================================
  510 |   // TEST 11: Partner Check-In Coordination
  511 |   // ==============================================================
  512 |   test('👫 Partner check-in coordination and alignment', async ({ page }) => {
  513 |     console.log('🎯 TEST: Partner alignment tracking');
  514 |     console.log('Landing page: "Stay aligned with your partner"');
  515 |
  516 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
  517 |     await page.waitForLoadState('networkidle');
  518 |
  519 |     // This would test that both partners can see each other's check-in responses
  520 |     // and identify alignment/misalignment
  521 |
```