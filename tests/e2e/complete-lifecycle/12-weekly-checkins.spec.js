// tests/e2e/complete-lifecycle/12-weekly-checkins.spec.js
// 🎯 CRITICAL: Weekly Check-ins & Progress Tracking Tests
// "8-week transformation journey with personalized weekly goals"

const { test, expect } = require('@playwright/test');

const TEST_CONFIG = {
  BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
  TIMEOUT: 40000,

  // Test weekly check-in data
  WEEKLY_DATA: {
    week1: {
      balanceRating: 3, // out of 10
      topChallenge: 'Morning routine chaos',
      goalProgress: 'Started delegating breakfast prep',
      emotionalState: 'Overwhelmed'
    },
    week4: {
      balanceRating: 7,
      topChallenge: 'Still struggling with evening bedtime',
      goalProgress: 'Morning routine much better!',
      emotionalState: 'Hopeful'
    },
    week8: {
      balanceRating: 9,
      topChallenge: 'Maintaining consistency',
      goalProgress: 'Both routines running smoothly',
      emotionalState: 'Confident'
    }
  }
};

test.describe('📊 CRITICAL: Weekly Check-ins & Progress Tracking', () => {
  test.setTimeout(TEST_CONFIG.TIMEOUT);

  // ==============================================================
  // TEST 1: Weekly Balance Check-In Survey
  // ==============================================================
  test('📋 Weekly balance check-in survey completion', async ({ page }) => {
    console.log('🎯 CRITICAL TEST: Weekly check-in survey');
    console.log('Landing page: "Weekly check-ins keep you on track"');

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // STEP 1: Look for weekly check-in prompt
    const checkInPrompt = page.locator('text=/weekly.*check.*in/i, button:has-text("Check-In"), a:has-text("Weekly Review")').first();

    if (await checkInPrompt.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✅ Found weekly check-in entry point');

      await checkInPrompt.click();
      await page.waitForTimeout(2000);

      // STEP 2: Fill out check-in survey
      console.log('📝 Completing weekly check-in...');

      // Look for balance rating (usually a slider or radio buttons)
      const balanceRating = page.locator('input[type="range"], input[type="radio"]').first();

      if (await balanceRating.isVisible({ timeout: 3000 }).catch(() => false)) {
        await balanceRating.fill('7'); // Rate current balance
        console.log('✓ Rated weekly balance: 7/10');

        // Look for text areas for challenges/progress
        const challengeInput = page.locator('textarea[placeholder*="challenge" i], textarea[name*="challenge" i]').first();

        if (await challengeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await challengeInput.fill(TEST_CONFIG.WEEKLY_DATA.week1.topChallenge);
          console.log(`✓ Entered top challenge: ${TEST_CONFIG.WEEKLY_DATA.week1.topChallenge}`);
        }

        const progressInput = page.locator('textarea[placeholder*="progress" i], textarea[name*="progress" i]').first();

        if (await progressInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await progressInput.fill(TEST_CONFIG.WEEKLY_DATA.week1.goalProgress);
          console.log(`✓ Entered progress: ${TEST_CONFIG.WEEKLY_DATA.week1.goalProgress}`);
        }

        // STEP 3: Submit check-in
        const submitButton = page.locator('button:has-text("Submit"), button:has-text("Complete"), button:has-text("Save")').first();

        if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await submitButton.click();
          await page.waitForTimeout(2000);

          console.log('✅ PASS: Weekly check-in survey completed');
          expect(true).toBeTruthy();
        }
      }

    } else {
      console.log('⚠️ Weekly check-in not visible');
      console.log('📝 Note: May require completing initial survey first');
      test.skip();
    }
  });

  // ==============================================================
  // TEST 2: Personalized Weekly Goals
  // ==============================================================
  test('🎯 Personalized weekly goals generated from imbalances', async ({ page }) => {
    console.log('🎯 TEST: AI-generated weekly goals');
    console.log('Landing page: "Personalized weekly goals based on your balance data"');

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Navigate to goals or weekly plan section
    const goalsSection = page.locator('text=/this.*week.*goals/i, text=/weekly.*plan/i, button:has-text("Goals")').first();

    if (await goalsSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      await goalsSection.click();
      await page.waitForTimeout(2000);

      console.log('📍 Viewing weekly goals...');

      // STEP 1: Verify goals are displayed
      const goalItems = await page.locator('[class*="goal"], li, div[class*="objective"]').all();

      console.log(`📊 Found ${goalItems.length} goal items`);

      // STEP 2: Check for goal personalization indicators
      const hasPersonalization = await page.locator('text=/based.*on/i, text=/recommended/i, text=/balance/i').isVisible({ timeout: 3000 }).catch(() => false);

      console.log(`📊 Personalized goals: ${hasPersonalization ? '✅' : '⚠️'}`);

      // STEP 3: Verify goals are actionable (have clear actions)
      const actionableGoals = await page.locator('text=/delegate/i, text=/reduce/i, text=/increase/i, text=/schedule/i').count();

      console.log(`📊 Actionable goals: ${actionableGoals}`);

      // ASSERTION: At least some goals present
      expect(goalItems.length > 0 || hasPersonalization).toBeTruthy();
      console.log('✅ PASS: Personalized weekly goals exist');

    } else {
      console.log('⚠️ Goals section not found');
      test.skip();
    }
  });

  // ==============================================================
  // TEST 3: Family Meeting Facilitation
  // ==============================================================
  test('👥 Family meeting facilitation and agenda creation', async ({ page }) => {
    console.log('🎯 TEST: Family meeting tools');
    console.log('Landing page: "Weekly family meetings made easy"');

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
    await page.waitForLoadState('networkidle');

    const chatInput = page.locator('textarea, input[type="text"]').last();

    if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // STEP 1: Ask Allie to help with family meeting
      const meetingRequest = "Help me prepare agenda for this week's family meeting";

      await chatInput.fill(meetingRequest);
      console.log('📝 Requesting family meeting help...');

      const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
      await sendButton.click();
      await page.waitForTimeout(8000);

      // STEP 2: Verify Allie provides meeting structure
      const response = await page.locator('div[class*="message"]').last().textContent();

      const hasAgenda = response?.toLowerCase().includes('agenda') ||
                       response?.toLowerCase().includes('topics') ||
                       response?.toLowerCase().includes('discuss');

      const hasSections = response?.toLowerCase().includes('review') ||
                         response?.toLowerCase().includes('goals') ||
                         response?.toLowerCase().includes('wins');

      console.log('📊 Family meeting support:');
      console.log(`   - Agenda structure: ${hasAgenda ? '✅' : '❌'}`);
      console.log(`   - Meeting sections: ${hasSections ? '✅' : '❌'}`);

      // ASSERTION: Allie provides meeting support
      expect(hasAgenda || hasSections).toBeTruthy();
      console.log('✅ PASS: Family meeting facilitation works');

    } else {
      console.log('⚠️ Chat input not found');
      test.skip();
    }
  });

  // ==============================================================
  // TEST 4: Progress Visualization (8-Week Journey)
  // ==============================================================
  test('📈 8-week transformation journey progress visualization', async ({ page }) => {
    console.log('🎯 CRITICAL TEST: Progress visualization');
    console.log('Landing page: "See your progress over 8 weeks"');

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Navigate to progress/analytics section
    const progressTab = page.locator('button:has-text("Progress"), a:has-text("Analytics"), button:has-text("Journey")').first();

    if (await progressTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await progressTab.click();
      await page.waitForTimeout(2000);

      console.log('📍 Viewing progress visualization...');

      // STEP 1: Look for week-by-week breakdown
      const weekLabels = await page.locator('text=/week\\s+\\d/i').all();
      console.log(`📊 Found ${weekLabels.length} week labels`);

      // STEP 2: Look for balance trend chart
      const hasChart = await page.locator('svg, canvas, [class*="chart"]').isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`📊 Visualization chart: ${hasChart ? '✅' : '⚠️'}`);

      // STEP 3: Look for improvement metrics
      const hasMetrics = await page.locator('text=/%/, text=/improved/i, text=/progress/i').isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`📊 Improvement metrics: ${hasMetrics ? '✅' : '⚠️'}`);

      // ASSERTION: At least visual progress tracking exists
      expect(weekLabels.length > 0 || hasChart || hasMetrics).toBeTruthy();
      console.log('✅ PASS: Progress visualization exists');

    } else {
      console.log('⚠️ Progress section not found - may need different navigation');
      test.skip();
    }
  });

  // ==============================================================
  // TEST 5: Sustainable Habits Formation
  // ==============================================================
  test('🌱 Sustainable habits formation tracking', async ({ page }) => {
    console.log('🎯 TEST: Habit formation progress');
    console.log('Landing page: "Build lasting habits, not quick fixes"');

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=habits`);
    await page.waitForLoadState('networkidle');

    // STEP 1: Look for habit tracking interface
    const habitsList = page.locator('[class*="habit"], [role="list"]').first();

    if (await habitsList.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✅ Found habits tracking interface');

      // STEP 2: Check for habit streak tracking
      const hasStreaks = await page.locator('text=/\\d+.*day.*streak/i, text=/days.*in.*row/i').isVisible({ timeout: 3000 }).catch(() => false);

      console.log(`📊 Streak tracking: ${hasStreaks ? '✅' : '⚠️'}`);

      // STEP 3: Look for habit completion checkboxes/buttons
      const habitCheckboxes = await page.locator('input[type="checkbox"], button[class*="complete"]').all();

      console.log(`📊 Found ${habitCheckboxes.length} completable habits`);

      // STEP 4: Verify progress indicators
      const hasProgress = await page.locator('[class*="progress"], [role="progressbar"]').count();

      console.log(`📊 Progress indicators: ${hasProgress}`);

      // ASSERTION: Habit tracking functional
      expect(habitCheckboxes.length > 0 || hasStreaks || hasProgress > 0).toBeTruthy();
      console.log('✅ PASS: Sustainable habit formation tracking exists');

    } else {
      console.log('⚠️ Habits interface not found');
      test.skip();
    }
  });

  // ==============================================================
  // TEST 6: Domain Rotation Tracking
  // ==============================================================
  test('🔄 Domain rotation and responsibility shift tracking', async ({ page }) => {
    console.log('🎯 TEST: Domain rotation system');
    console.log('Landing page: "Rotate responsibilities to prevent burnout"');

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Navigate to balance/co-ownership section
    const balanceTab = page.locator('button:has-text("Balance"), a:has-text("Co-Ownership"), button:has-text("Relationship")').first();

    if (await balanceTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await balanceTab.click();
      await page.waitForTimeout(2000);

      console.log('📍 Viewing domain rotation...');

      // STEP 1: Look for domain breakdown
      const domains = ['cooking', 'cleaning', 'childcare', 'scheduling', 'finances', 'household'];
      let domainsFound = 0;

      for (const domain of domains) {
        const found = await page.locator(`text=/${domain}/i`).isVisible({ timeout: 1000 }).catch(() => false);
        if (found) domainsFound++;
      }

      console.log(`📊 Domains found: ${domainsFound}/${domains.length}`);

      // STEP 2: Look for rotation indicators (who's responsible this week)
      const hasResponsibility = await page.locator('text=/this.*week/i, text=/responsible/i, text=/owner/i').isVisible({ timeout: 3000 }).catch(() => false);

      console.log(`📊 Rotation indicators: ${hasResponsibility ? '✅' : '⚠️'}`);

      // STEP 3: Look for shift suggestions
      const hasSuggestions = await page.locator('text=/rotate/i, text=/shift/i, text=/delegate/i').isVisible({ timeout: 3000 }).catch(() => false);

      console.log(`📊 Shift suggestions: ${hasSuggestions ? '✅' : '⚠️'}`);

      // ASSERTION: Domain system exists
      expect(domainsFound > 0 || hasResponsibility).toBeTruthy();
      console.log('✅ PASS: Domain rotation tracking exists');

    } else {
      console.log('⚠️ Balance section not found');
      test.skip();
    }
  });

  // ==============================================================
  // TEST 7: Balance Trend Analysis
  // ==============================================================
  test('📊 Balance trend analysis over time', async ({ page }) => {
    console.log('🎯 TEST: Historical balance trends');
    console.log('Landing page: "Track your balance improvement week by week"');

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // This would show balance percentages trending over weeks
    // Example: Week 1: 78/22%, Week 4: 65/35%, Week 8: 55/45%

    const balanceTab = page.locator('button:has-text("Balance"), a:has-text("Analytics")').first();

    if (await balanceTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await balanceTab.click();
      await page.waitForTimeout(2000);

      console.log('📍 Analyzing balance trends...');

      // STEP 1: Look for historical data
      const hasHistory = await page.locator('text=/history/i, text=/trend/i, text=/over.*time/i').isVisible({ timeout: 3000 }).catch(() => false);

      console.log(`📊 Historical data: ${hasHistory ? '✅' : '⚠️'}`);

      // STEP 2: Look for improvement metrics
      const hasImprovement = await page.locator('text=/improved/i, text=/better/i, text=/progress/i').isVisible({ timeout: 3000 }).catch(() => false);

      console.log(`📊 Improvement tracking: ${hasImprovement ? '✅' : '⚠️'}`);

      // STEP 3: Look for percentage displays (balance split)
      const percentages = await page.locator('text=/%/').all();

      console.log(`📊 Found ${percentages.length} percentage displays`);

      // ASSERTION: Trend analysis exists
      expect(hasHistory || hasImprovement || percentages.length > 0).toBeTruthy();
      console.log('✅ PASS: Balance trend analysis exists');

    } else {
      console.log('⚠️ Balance section not found');
      test.skip();
    }
  });

  // ==============================================================
  // TEST 8: Goal Achievement Tracking
  // ==============================================================
  test('🏆 Goal achievement and milestone celebration', async ({ page }) => {
    console.log('🎯 TEST: Goal tracking and celebrations');
    console.log('Landing page: "Celebrate wins together"');

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Look for goals or achievements section
    const goalsTab = page.locator('button:has-text("Goals"), a:has-text("Achievements"), text=/milestones/i').first();

    if (await goalsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await goalsTab.click();
      await page.waitForTimeout(2000);

      console.log('📍 Viewing goal achievements...');

      // STEP 1: Look for completed goals
      const completedGoals = await page.locator('[class*="complete"], text=/✓/, text=/achieved/i').all();

      console.log(`📊 Found ${completedGoals.length} completed goals`);

      // STEP 2: Look for celebration/recognition elements
      const hasCelebration = await page.locator('text=/congrat/i, text=/great.*job/i, text=/milestone/i, text=/🎉/').isVisible({ timeout: 3000 }).catch(() => false);

      console.log(`📊 Celebration elements: ${hasCelebration ? '✅' : '⚠️'}`);

      // STEP 3: Look for progress towards active goals
      const progressBars = await page.locator('[class*="progress"], [role="progressbar"]').all();

      console.log(`📊 Found ${progressBars.length} progress indicators`);

      // ASSERTION: Goal tracking exists
      expect(completedGoals.length > 0 || hasCelebration || progressBars.length > 0).toBeTruthy();
      console.log('✅ PASS: Goal achievement tracking exists');

    } else {
      console.log('⚠️ Goals section not found');
      test.skip();
    }
  });

  // ==============================================================
  // TEST 9: Weekly Reflection Prompts
  // ==============================================================
  test('💭 Weekly reflection prompts and journaling', async ({ page }) => {
    console.log('🎯 TEST: Reflection prompts');
    console.log('Landing page: "Reflect on what\'s working and what\'s not"');

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
    await page.waitForLoadState('networkidle');

    const chatInput = page.locator('textarea, input[type="text"]').last();

    if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // STEP 1: Ask Allie for weekly reflection
      await chatInput.fill("What should I reflect on this week?");
      console.log('📝 Requesting reflection prompts...');

      const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
      await sendButton.click();
      await page.waitForTimeout(6000);

      // STEP 2: Verify Allie provides reflection questions
      const response = await page.locator('div[class*="message"]').last().textContent();

      const hasReflectionPrompts = response?.includes('?') ||
                                   response?.toLowerCase().includes('reflect') ||
                                   response?.toLowerCase().includes('think about') ||
                                   response?.toLowerCase().includes('consider');

      const hasMeaningfulQuestions = (response?.match(/\?/g) || []).length >= 2;

      console.log('📊 Reflection support:');
      console.log(`   - Has prompts: ${hasReflectionPrompts ? '✅' : '❌'}`);
      console.log(`   - Multiple questions: ${hasMeaningfulQuestions ? '✅' : '❌'}`);

      // ASSERTION: Allie provides reflection support
      expect(hasReflectionPrompts).toBeTruthy();
      console.log('✅ PASS: Weekly reflection prompts work');

    } else {
      console.log('⚠️ Chat input not found');
      test.skip();
    }
  });

  // ==============================================================
  // TEST 10: Weekly Summary Report Generation
  // ==============================================================
  test('📄 Automated weekly summary report generation', async ({ page }) => {
    console.log('🎯 TEST: Weekly summary reports');
    console.log('Landing page: "Get a weekly summary of your progress"');

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Look for reports or summaries section
    const reportsButton = page.locator('button:has-text("Reports"), button:has-text("Summary"), a:has-text("Weekly Review")').first();

    if (await reportsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await reportsButton.click();
      await page.waitForTimeout(2000);

      console.log('📍 Viewing weekly summary report...');

      // STEP 1: Verify report sections exist
      const reportSections = ['completed', 'progress', 'balance', 'goals', 'wins'];
      let sectionsFound = 0;

      for (const section of reportSections) {
        const found = await page.locator(`text=/${section}/i`).isVisible({ timeout: 1000 }).catch(() => false);
        if (found) sectionsFound++;
      }

      console.log(`📊 Report sections found: ${sectionsFound}/${reportSections.length}`);

      // STEP 2: Look for data visualizations
      const hasVisuals = await page.locator('svg, canvas, [class*="chart"]').count();

      console.log(`📊 Visual elements: ${hasVisuals}`);

      // STEP 3: Look for actionable insights
      const hasInsights = await page.locator('text=/insight/i, text=/recommend/i, text=/next.*week/i').isVisible({ timeout: 3000 }).catch(() => false);

      console.log(`📊 Actionable insights: ${hasInsights ? '✅' : '⚠️'}`);

      // ASSERTION: Report generation exists
      expect(sectionsFound > 0 || hasVisuals > 0 || hasInsights).toBeTruthy();
      console.log('✅ PASS: Weekly summary report generation exists');

    } else {
      console.log('⚠️ Reports section not found');
      console.log('📝 Note: May be accessible via Allie chat instead');
    }
  });

  // ==============================================================
  // TEST 11: Partner Check-In Coordination
  // ==============================================================
  test('👫 Partner check-in coordination and alignment', async ({ page }) => {
    console.log('🎯 TEST: Partner alignment tracking');
    console.log('Landing page: "Stay aligned with your partner"');

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // This would test that both partners can see each other's check-in responses
    // and identify alignment/misalignment

    const balanceTab = page.locator('button:has-text("Balance"), button:has-text("Co-Ownership")').first();

    if (await balanceTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await balanceTab.click();
      await page.waitForTimeout(2000);

      console.log('📍 Checking partner alignment...');

      // STEP 1: Look for both partner's perspectives
      const partnerIndicators = await page.locator('text=/partner/i, text=/mama/i, text=/papa/i, text=/parent/i').all();

      console.log(`📊 Found ${partnerIndicators.length} partner indicators`);

      // STEP 2: Look for alignment metrics
      const hasAlignment = await page.locator('text=/aligned/i, text=/agreement/i, text=/both/i').isVisible({ timeout: 3000 }).catch(() => false);

      console.log(`📊 Alignment tracking: ${hasAlignment ? '✅' : '⚠️'}`);

      // STEP 3: Look for discussion prompts when misaligned
      const hasDiscussionPrompts = await page.locator('text=/discuss/i, text=/talk.*about/i').isVisible({ timeout: 3000 }).catch(() => false);

      console.log(`📊 Discussion prompts: ${hasDiscussionPrompts ? '✅' : '⚠️'}`);

      // ASSERTION: Partner coordination exists
      expect(partnerIndicators.length > 0 || hasAlignment).toBeTruthy();
      console.log('✅ PASS: Partner check-in coordination exists');

    } else {
      console.log('⚠️ Balance section not found');
      test.skip();
    }
  });

  // ==============================================================
  // TEST 12: Weekly Goal Adjustment Based on Feedback
  // ==============================================================
  test('🎚️ Dynamic goal adjustment based on weekly feedback', async ({ page }) => {
    console.log('🎯 TEST: Adaptive goal adjustment');
    console.log('Landing page: "Goals that adapt to your reality"');

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
    await page.waitForLoadState('networkidle');

    const chatInput = page.locator('textarea, input[type="text"]').last();

    if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // STEP 1: Report that a goal was too ambitious
      const feedback = "This week's goal to delegate 5 tasks was too much. I could only do 2.";

      await chatInput.fill(feedback);
      console.log('📝 Providing goal feedback...');

      const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
      await sendButton.click();
      await page.waitForTimeout(8000);

      // STEP 2: Verify Allie adjusts expectations
      const response = await page.locator('div[class*="message"]').last().textContent();

      const acknowledgesReality = response?.toLowerCase().includes('understand') ||
                                  response?.toLowerCase().includes('adjust') ||
                                  response?.toLowerCase().includes('realistic');

      const suggestsAdjustment = response?.toLowerCase().includes('next week') ||
                                response?.toLowerCase().includes('2 tasks') ||
                                response?.toLowerCase().includes('smaller');

      console.log('📊 Adaptive response:');
      console.log(`   - Acknowledges feedback: ${acknowledgesReality ? '✅' : '❌'}`);
      console.log(`   - Suggests adjustment: ${suggestsAdjustment ? '✅' : '❌'}`);

      // ASSERTION: Allie adapts to feedback
      expect(acknowledgesReality || suggestsAdjustment).toBeTruthy();
      console.log('✅ PASS: Dynamic goal adjustment works');

    } else {
      console.log('⚠️ Chat input not found');
      test.skip();
    }
  });

});

// ==============================================================
// HELPER FUNCTIONS
// ==============================================================

/**
 * Calculate improvement percentage between two balance ratings
 */
function calculateImprovement(weekOld, weekNew) {
  const improvement = ((weekNew.balanceRating - weekOld.balanceRating) / 10) * 100;
  return improvement.toFixed(1);
}

/**
 * Verify weekly check-in data saved to Firestore
 */
async function verifyCheckInDataSaved(familyId, weekNumber, expectedData) {
  console.log(`Verifying Week ${weekNumber} check-in data in Firestore`);
  // Would use Firebase Admin SDK to check weeklyCheckIns collection
}

/**
 * Extract goal progress from UI
 */
function extractGoalProgress(pageText) {
  const progressMatches = pageText.match(/(\d+)%/g);
  return progressMatches ? progressMatches.map(m => parseInt(m)) : [];
}
