# Test info

- Name: 📊 CRITICAL: Weekly Check-ins & Progress Tracking >> 👫 Partner check-in coordination and alignment
- Location: /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/12-weekly-checkins.spec.js:512:3

# Error details

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://localhost:3000/dashboard", waiting until "load"

    at /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/12-weekly-checkins.spec.js:516:16
```

# Test source

```ts
  416 |   // ==============================================================
  417 |   test('💭 Weekly reflection prompts and journaling', async ({ page }) => {
  418 |     console.log('🎯 TEST: Reflection prompts');
  419 |     console.log('Landing page: "Reflect on what\'s working and what\'s not"');
  420 |
  421 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
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
> 516 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      |                ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  517 |     await page.waitForLoadState('networkidle');
  518 |
  519 |     // This would test that both partners can see each other's check-in responses
  520 |     // and identify alignment/misalignment
  521 |
  522 |     const balanceTab = page.locator('button:has-text("Balance"), button:has-text("Co-Ownership")').first();
  523 |
  524 |     if (await balanceTab.isVisible({ timeout: 5000 }).catch(() => false)) {
  525 |       await balanceTab.click();
  526 |       await page.waitForTimeout(2000);
  527 |
  528 |       console.log('📍 Checking partner alignment...');
  529 |
  530 |       // STEP 1: Look for both partner's perspectives
  531 |       const partnerIndicators = await page.locator('text=/partner/i, text=/mama/i, text=/papa/i, text=/parent/i').all();
  532 |
  533 |       console.log(`📊 Found ${partnerIndicators.length} partner indicators`);
  534 |
  535 |       // STEP 2: Look for alignment metrics
  536 |       const hasAlignment = await page.locator('text=/aligned/i, text=/agreement/i, text=/both/i').isVisible({ timeout: 3000 }).catch(() => false);
  537 |
  538 |       console.log(`📊 Alignment tracking: ${hasAlignment ? '✅' : '⚠️'}`);
  539 |
  540 |       // STEP 3: Look for discussion prompts when misaligned
  541 |       const hasDiscussionPrompts = await page.locator('text=/discuss/i, text=/talk.*about/i').isVisible({ timeout: 3000 }).catch(() => false);
  542 |
  543 |       console.log(`📊 Discussion prompts: ${hasDiscussionPrompts ? '✅' : '⚠️'}`);
  544 |
  545 |       // ASSERTION: Partner coordination exists
  546 |       expect(partnerIndicators.length > 0 || hasAlignment).toBeTruthy();
  547 |       console.log('✅ PASS: Partner check-in coordination exists');
  548 |
  549 |     } else {
  550 |       console.log('⚠️ Balance section not found');
  551 |       test.skip();
  552 |     }
  553 |   });
  554 |
  555 |   // ==============================================================
  556 |   // TEST 12: Weekly Goal Adjustment Based on Feedback
  557 |   // ==============================================================
  558 |   test('🎚️ Dynamic goal adjustment based on weekly feedback', async ({ page }) => {
  559 |     console.log('🎯 TEST: Adaptive goal adjustment');
  560 |     console.log('Landing page: "Goals that adapt to your reality"');
  561 |
  562 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
  563 |     await page.waitForLoadState('networkidle');
  564 |
  565 |     const chatInput = page.locator('textarea, input[type="text"]').last();
  566 |
  567 |     if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
  568 |       // STEP 1: Report that a goal was too ambitious
  569 |       const feedback = "This week's goal to delegate 5 tasks was too much. I could only do 2.";
  570 |
  571 |       await chatInput.fill(feedback);
  572 |       console.log('📝 Providing goal feedback...');
  573 |
  574 |       const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
  575 |       await sendButton.click();
  576 |       await page.waitForTimeout(8000);
  577 |
  578 |       // STEP 2: Verify Allie adjusts expectations
  579 |       const response = await page.locator('div[class*="message"]').last().textContent();
  580 |
  581 |       const acknowledgesReality = response?.toLowerCase().includes('understand') ||
  582 |                                   response?.toLowerCase().includes('adjust') ||
  583 |                                   response?.toLowerCase().includes('realistic');
  584 |
  585 |       const suggestsAdjustment = response?.toLowerCase().includes('next week') ||
  586 |                                 response?.toLowerCase().includes('2 tasks') ||
  587 |                                 response?.toLowerCase().includes('smaller');
  588 |
  589 |       console.log('📊 Adaptive response:');
  590 |       console.log(`   - Acknowledges feedback: ${acknowledgesReality ? '✅' : '❌'}`);
  591 |       console.log(`   - Suggests adjustment: ${suggestsAdjustment ? '✅' : '❌'}`);
  592 |
  593 |       // ASSERTION: Allie adapts to feedback
  594 |       expect(acknowledgesReality || suggestsAdjustment).toBeTruthy();
  595 |       console.log('✅ PASS: Dynamic goal adjustment works');
  596 |
  597 |     } else {
  598 |       console.log('⚠️ Chat input not found');
  599 |       test.skip();
  600 |     }
  601 |   });
  602 |
  603 | });
  604 |
  605 | // ==============================================================
  606 | // HELPER FUNCTIONS
  607 | // ==============================================================
  608 |
  609 | /**
  610 |  * Calculate improvement percentage between two balance ratings
  611 |  */
  612 | function calculateImprovement(weekOld, weekNew) {
  613 |   const improvement = ((weekNew.balanceRating - weekOld.balanceRating) / 10) * 100;
  614 |   return improvement.toFixed(1);
  615 | }
  616 |
```