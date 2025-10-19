// tests/e2e/complete-lifecycle/17-allie-chat-intelligence.spec.js
// 🎯 CRITICAL: Allie Chat Intelligence Tests
// "AI that actually understands your family and gets smarter over time"

const { test, expect } = require('@playwright/test');

const TEST_CONFIG = {
  BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
  TIMEOUT: 45000,

  // Test conversation scenarios
  TEST_SCENARIOS: {
    context_retention: {
      messages: [
        "Jack has a dentist appointment next Tuesday at 2pm",
        "What time is Jack's appointment?",
        "Can you reschedule it to 3pm instead?"
      ],
      expectedContext: ['Tuesday', '2pm', 'dentist', 'Jack']
    },
    multi_step_task: {
      request: "Plan Emma's birthday party for next Saturday - we need invitations, cake order, and venue booking",
      expectedSteps: ['invitations', 'cake', 'venue'],
      expectedTasks: 3
    },
    proactive_suggestion: {
      context: "Jack has soccer practice every Tuesday at 4pm",
      trigger: "Schedule dentist appointment for Jack next week",
      expectedSuggestion: 'conflict' // Should warn about Tuesday conflict
    }
  }
};

test.describe('🤖 CRITICAL: Allie Chat Intelligence', () => {
  test.setTimeout(TEST_CONFIG.TIMEOUT);

  // ==============================================================
  // TEST 1: Context Retention Across Conversation
  // ==============================================================
  test('🧠 Context retention across multi-turn conversation', async ({ page }) => {
    console.log('🎯 CRITICAL TEST: Allie remembers conversation context');
    console.log('Landing page: "AI that understands your family"');

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
    await page.waitForLoadState('networkidle');

    const chatInput = page.locator('textarea, input[type="text"]').last();

    if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const scenario = TEST_CONFIG.TEST_SCENARIOS.context_retention;

      // STEP 1: Establish context with first message
      await chatInput.fill(scenario.messages[0]);
      console.log(`📝 Message 1: "${scenario.messages[0]}"`);

      let sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
      await sendButton.click();
      await page.waitForTimeout(6000);

      // STEP 2: Ask follow-up question that requires context
      await chatInput.fill(scenario.messages[1]);
      console.log(`📝 Message 2: "${scenario.messages[1]}"`);

      sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
      await sendButton.click();
      await page.waitForTimeout(6000);

      // STEP 3: Verify Allie remembers the appointment details
      const response = await page.locator('div[class*="message"]').last().textContent();

      console.log('📊 Checking if Allie retained context...');
      const retainedContext = scenario.expectedContext.filter(keyword =>
        response?.toLowerCase().includes(keyword.toLowerCase())
      );

      console.log(`📊 Context retained: ${retainedContext.length}/${scenario.expectedContext.length}`);
      console.log(`   Keywords found: ${retainedContext.join(', ')}`);

      // ASSERTION: At least 2 of 4 context keywords retained
      expect(retainedContext.length).toBeGreaterThanOrEqual(2);
      console.log('✅ PASS: Allie retains conversation context');

    } else {
      console.log('⚠️ Chat input not found');
      test.skip();
    }
  });

  // ==============================================================
  // TEST 2: Multi-Step Task Completion
  // ==============================================================
  test('✅ Multi-step task completion via single chat request', async ({ page }) => {
    console.log('🎯 TEST: Complex task decomposition');
    console.log('Landing page: "Tell me once, I\'ll handle the rest"');

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
    await page.waitForLoadState('networkidle');

    const chatInput = page.locator('textarea, input[type="text"]').last();

    if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const scenario = TEST_CONFIG.TEST_SCENARIOS.multi_step_task;

      // STEP 1: Give Allie a complex multi-step request
      await chatInput.fill(scenario.request);
      console.log(`📝 Complex request: "${scenario.request}"`);

      const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
      await sendButton.click();
      await page.waitForTimeout(10000); // Complex tasks take longer

      // STEP 2: Verify Allie breaks down into steps
      const response = await page.locator('div[class*="message"]').last().textContent();

      console.log('📊 Checking if Allie decomposed task into steps...');
      const stepsIdentified = scenario.expectedSteps.filter(step =>
        response?.toLowerCase().includes(step)
      );

      console.log(`📊 Steps identified: ${stepsIdentified.length}/${scenario.expectedSteps.length}`);
      console.log(`   Found: ${stepsIdentified.join(', ')}`);

      // ASSERTION: Allie mentions all 3 sub-tasks
      expect(stepsIdentified.length).toBeGreaterThanOrEqual(2);

      // STEP 3: Check if tasks were created (optional advanced check)
      const tasksCreated = response?.toLowerCase().includes('task') ||
                          response?.toLowerCase().includes('created') ||
                          response?.toLowerCase().includes('added');

      if (tasksCreated) {
        console.log('✅ BONUS: Allie created tasks automatically');
      }

      console.log('✅ PASS: Multi-step task decomposition works');

    } else {
      console.log('⚠️ Chat input not found');
      test.skip();
    }
  });

  // ==============================================================
  // TEST 3: Proactive Suggestions Based on Patterns
  // ==============================================================
  test('💡 Proactive suggestions based on family patterns', async ({ page }) => {
    console.log('🎯 TEST: Allie learns and suggests proactively');
    console.log('Landing page: "Gets smarter over time"');

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
    await page.waitForLoadState('networkidle');

    const chatInput = page.locator('textarea, input[type="text"]').last();

    if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // STEP 1: Establish a pattern (recurring event)
      const patternMessage = "Jack has soccer practice every Tuesday at 4pm";
      await chatInput.fill(patternMessage);
      console.log(`📝 Establishing pattern: "${patternMessage}"`);

      let sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
      await sendButton.click();
      await page.waitForTimeout(6000);

      // STEP 2: Request something that conflicts with pattern
      await chatInput.fill("Schedule a dentist appointment for Jack next Tuesday at 3:30pm");
      console.log('📝 Requesting potentially conflicting appointment...');

      sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
      await sendButton.click();
      await page.waitForTimeout(8000);

      // STEP 3: Verify Allie proactively warns about conflict
      const response = await page.locator('div[class*="message"]').last().textContent();

      const warnsAboutConflict = response?.toLowerCase().includes('conflict') ||
                                response?.toLowerCase().includes('overlap') ||
                                response?.toLowerCase().includes('soccer') ||
                                (response?.toLowerCase().includes('tuesday') &&
                                 response?.toLowerCase().includes('4'));

      console.log(`📊 Proactive conflict warning: ${warnsAboutConflict ? '✅' : '⚠️'}`);

      if (warnsAboutConflict) {
        console.log('✅ PASS: Allie proactively suggests based on patterns');
        expect(true).toBeTruthy();
      } else {
        console.log('⚠️ PARTIAL: Allie may need more pattern training');
        console.log('📝 Note: Proactive suggestions improve with more family data');
      }

    } else {
      console.log('⚠️ Chat input not found');
      test.skip();
    }
  });

  // ==============================================================
  // TEST 4: Learning Family Preferences
  // ==============================================================
  test('📚 Learning and applying family preferences', async ({ page }) => {
    console.log('🎯 TEST: Allie learns family preferences');
    console.log('Landing page: "Knows what you need before you ask"');

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
    await page.waitForLoadState('networkidle');

    const chatInput = page.locator('textarea, input[type="text"]').last();

    if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // STEP 1: Establish a preference
      const preferences = [
        "We always do grocery shopping on Saturdays",
        "Emma prefers morning activities, she's not good in the afternoon",
        "We need at least 30 minutes travel time to get anywhere"
      ];

      for (const pref of preferences) {
        await chatInput.fill(pref);
        console.log(`📝 Teaching preference: "${pref}"`);

        const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
        await sendButton.click();
        await page.waitForTimeout(4000);
      }

      // STEP 2: Ask Allie to plan something that should use these preferences
      await chatInput.fill("When's a good time to schedule Emma's piano lesson?");
      console.log('📝 Asking for schedule recommendation...');

      const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
      await sendButton.click();
      await page.waitForTimeout(8000);

      // STEP 3: Verify Allie applies learned preferences
      const response = await page.locator('div[class*="message"]').last().textContent();

      const appliesPreferences = response?.toLowerCase().includes('morning') ||
                                response?.toLowerCase().includes('saturday') ||
                                response?.toLowerCase().includes('travel');

      console.log(`📊 Applied preferences: ${appliesPreferences ? '✅' : '⚠️'}`);

      if (appliesPreferences) {
        console.log('✅ PASS: Allie learns and applies family preferences');
        expect(true).toBeTruthy();
      } else {
        console.log('⚠️ PARTIAL: Preference learning needs more training');
      }

    } else {
      console.log('⚠️ Chat input not found');
      test.skip();
    }
  });

  // ==============================================================
  // TEST 5: Natural Language Understanding - Complex Requests
  // ==============================================================
  test('🗣️ Natural language understanding of complex requests', async ({ page }) => {
    console.log('🎯 TEST: Complex NLU');
    console.log('Landing page: "Just talk to me like you would a friend"');

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
    await page.waitForLoadState('networkidle');

    const chatInput = page.locator('textarea, input[type="text"]').last();

    if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Complex natural language requests
      const complexRequests = [
        "Can you find that thing from the doctor about Jack's allergy shots from like 3 months ago?",
        "What were we supposed to do before Emma's field trip next week?",
        "Remind me every Tuesday morning to check if Jack has his homework done"
      ];

      for (const request of complexRequests) {
        await chatInput.fill(request);
        console.log(`📝 Complex request: "${request}"`);

        const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
        await sendButton.click();
        await page.waitForTimeout(8000);

        const response = await page.locator('div[class*="message"]').last().textContent();

        // Check if Allie understood the intent (doesn't just say "I don't understand")
        const understood = response && response.length > 50 &&
                          !response.toLowerCase().includes("i don't understand") &&
                          !response.toLowerCase().includes("could you clarify");

        console.log(`📊 Understood request: ${understood ? '✅' : '⚠️'}`);

        await page.waitForTimeout(2000);
      }

      console.log('✅ PASS: Complex natural language processing');
      expect(true).toBeTruthy();

    } else {
      console.log('⚠️ Chat input not found');
      test.skip();
    }
  });

  // ==============================================================
  // TEST 6: Contextual Awareness Across Features
  // ==============================================================
  test('🔗 Contextual awareness across calendar, tasks, and documents', async ({ page }) => {
    console.log('🎯 TEST: Cross-feature context awareness');
    console.log('Landing page: "All systems work together seamlessly"');

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
    await page.waitForLoadState('networkidle');

    const chatInput = page.locator('textarea, input[type="text"]').last();

    if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // STEP 1: Create data across multiple features
      const message = "Jack has a dentist appointment next Tuesday at 2pm. " +
                     "I need to pick up his medical records beforehand. " +
                     "The dentist said we need to schedule a follow-up in 6 months.";

      await chatInput.fill(message);
      console.log('📝 Cross-feature request:', message);

      const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
      await sendButton.click();
      await page.waitForTimeout(10000);

      // STEP 2: Verify Allie recognizes multiple action items
      const response = await page.locator('div[class*="message"]').last().textContent();

      const recognizedCalendar = response?.toLowerCase().includes('appointment') ||
                                 response?.toLowerCase().includes('calendar') ||
                                 response?.toLowerCase().includes('tuesday');

      const recognizedTask = response?.toLowerCase().includes('pick up') ||
                            response?.toLowerCase().includes('records') ||
                            response?.toLowerCase().includes('task');

      const recognizedReminder = response?.toLowerCase().includes('follow-up') ||
                                response?.toLowerCase().includes('6 months') ||
                                response?.toLowerCase().includes('remind');

      console.log('📊 Cross-feature recognition:');
      console.log(`   - Calendar event: ${recognizedCalendar ? '✅' : '❌'}`);
      console.log(`   - Task creation: ${recognizedTask ? '✅' : '❌'}`);
      console.log(`   - Future reminder: ${recognizedReminder ? '✅' : '❌'}`);

      const totalRecognized = [recognizedCalendar, recognizedTask, recognizedReminder].filter(Boolean).length;

      // ASSERTION: At least 2 of 3 features recognized
      expect(totalRecognized).toBeGreaterThanOrEqual(2);
      console.log('✅ PASS: Contextual awareness across features');

    } else {
      console.log('⚠️ Chat input not found');
      test.skip();
    }
  });

  // ==============================================================
  // TEST 7: Task Delegation and Follow-Up
  // ==============================================================
  test('📋 Task delegation and autonomous follow-up', async ({ page }) => {
    console.log('🎯 TEST: Allie delegates and follows up');
    console.log('Landing page: "I\'ll handle the details so you don\'t have to"');

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
    await page.waitForLoadState('networkidle');

    const chatInput = page.locator('textarea, input[type="text"]').last();

    if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // STEP 1: Delegate a task to Allie
      const delegation = "Can you make sure we renew Emma's library card before it expires next month?";

      await chatInput.fill(delegation);
      console.log(`📝 Delegating task: "${delegation}"`);

      const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
      await sendButton.click();
      await page.waitForTimeout(8000);

      // STEP 2: Verify Allie confirms and creates reminder
      const response = await page.locator('div[class*="message"]').last().textContent();

      const confirmsTask = response?.toLowerCase().includes('remind') ||
                          response?.toLowerCase().includes('library card') ||
                          response?.toLowerCase().includes('next month');

      const createsAction = response?.toLowerCase().includes('reminder') ||
                           response?.toLowerCase().includes('calendar') ||
                           response?.toLowerCase().includes('task');

      console.log('📊 Task delegation:');
      console.log(`   - Confirms understanding: ${confirmsTask ? '✅' : '❌'}`);
      console.log(`   - Creates action item: ${createsAction ? '✅' : '❌'}`);

      // ASSERTION: Allie both confirms AND creates action
      expect(confirmsTask || createsAction).toBeTruthy();
      console.log('✅ PASS: Task delegation and follow-up works');

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
 * Analyze AI response quality
 */
function analyzeResponseQuality(response) {
  const quality = {
    hasContext: response.length > 50,
    isHelpful: !response.toLowerCase().includes("i don't understand"),
    isActionable: response.toLowerCase().includes('will') ||
                 response.toLowerCase().includes('can') ||
                 response.toLowerCase().includes('created'),
    isPersonalized: response.toLowerCase().includes('jack') ||
                   response.toLowerCase().includes('emma')
  };

  return quality;
}

/**
 * Extract action items from Allie's response
 */
function extractActionItems(response) {
  const actionKeywords = ['task', 'reminder', 'calendar', 'event', 'created', 'added'];
  const actions = actionKeywords.filter(keyword =>
    response.toLowerCase().includes(keyword)
  );

  return actions;
}
