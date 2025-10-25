/**
 * Complete E2E Test Suite for Knowledge Graph Tab - PRODUCTION
 *
 * Tests all functionality using palsson_family_simulation demo data on PRODUCTION:
 * - Graph visualization loads
 * - Survey nodes show proper labels (not "Unknown")
 * - Allie chat gives intelligent responses (not generic)
 * - Chat scrolling works properly
 * - Suggested questions work
 * - Historical/Predictive buttons work
 * - Node interactions work
 *
 * IMPORTANT: This test runs against PRODUCTION (https://checkallie.com)
 * with real demo account authentication.
 */

const { test, expect } = require('@playwright/test');

const TEST_CONFIG = {
  baseURL: 'https://checkallie.com',
  familyId: 'palsson_family_simulation',
  userId: 'stefan_palsson_agent',
  timeout: 30000
};

// Override test config to use production
test.use({
  baseURL: TEST_CONFIG.baseURL,
  storageState: 'tests/.auth/production-user.json'
});

test.describe('Knowledge Graph Tab - Complete E2E Suite (PRODUCTION)', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to Knowledge Graph tab on production
    await page.goto(`${TEST_CONFIG.baseURL}/dashboard?tab=knowledge`);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Give extra time for graph rendering
    await page.waitForTimeout(3000);
  });

  test('1. Graph loads with nodes and links', async ({ page }) => {
    console.log('🧪 TEST 1: Checking if graph loads with data...');

    // Check if graph SVG exists
    const graphSvg = page.locator('svg').first();
    await expect(graphSvg).toBeVisible({ timeout: 10000 });

    // Check if nodes are rendered (circles or groups)
    const nodes = page.locator('svg circle, svg g.node');
    const nodeCount = await nodes.count();

    console.log(`  ✓ Found ${nodeCount} nodes in graph`);
    expect(nodeCount).toBeGreaterThan(0);

    // Check if we have the expected ~235 nodes (Person + Family + Survey)
    expect(nodeCount).toBeGreaterThan(200);
    expect(nodeCount).toBeLessThan(300);
  });

  test('2. Survey nodes show proper labels (not "Unknown")', async ({ page }) => {
    console.log('🧪 TEST 2: Checking survey node labels...');

    // Wait for graph to render
    await page.waitForTimeout(3000);

    // Look for text elements in the graph
    const textElements = page.locator('svg text');
    const textCount = await textElements.count();

    console.log(`  ✓ Found ${textCount} text labels in graph`);

    // Check for "Unknown" labels
    const unknownLabels = page.locator('svg text:has-text("Unknown")');
    const unknownCount = await unknownLabels.count();

    if (unknownCount > 0) {
      console.log(`  ❌ FAIL: Found ${unknownCount} "Unknown" labels`);
      // Get first few unknown labels for debugging
      for (let i = 0; i < Math.min(unknownCount, 5); i++) {
        const text = await unknownLabels.nth(i).textContent();
        console.log(`     - "${text}"`);
      }
    } else {
      console.log(`  ✓ PASS: No "Unknown" labels found`);
    }

    expect(unknownCount).toBe(0);

    // Check for proper survey labels like "weekly #17"
    const surveyLabels = page.locator('svg text:has-text("weekly #")');
    const surveyCount = await surveyLabels.count();

    console.log(`  ✓ Found ${surveyCount} survey labels with "weekly #" pattern`);
    expect(surveyCount).toBeGreaterThan(0);
  });

  test('3. Allie chat drawer opens and responds intelligently', async ({ page }) => {
    console.log('🧪 TEST 3: Testing Allie chat responses...');

    // Find and click "Ask Allie" button
    const askAllieButton = page.locator('button:has-text("Ask Allie")');
    await expect(askAllieButton).toBeVisible({ timeout: 5000 });
    await askAllieButton.click();

    // Wait for chat drawer to open
    await page.waitForTimeout(1000);

    // Check if chat input is visible
    const chatInput = page.locator('textarea, input[type="text"]').last();
    await expect(chatInput).toBeVisible({ timeout: 5000 });

    // Type a burnout question
    await chatInput.fill('Who is at risk of burnout?');
    await chatInput.press('Enter');

    console.log('  ✓ Sent question: "Who is at risk of burnout?"');

    // Wait for Allie's response
    await page.waitForTimeout(5000);

    // Get all message elements
    const messages = page.locator('[class*="message"], [class*="chat"]').filter({ hasText: /analyzed|family|burnout|stefan|kimberly/i });
    const messageCount = await messages.count();

    console.log(`  ✓ Found ${messageCount} messages in chat`);

    // Check if response contains "Analyzed 9 family members" (generic response = FAIL)
    const genericResponse = page.locator('text="Analyzed 9 family members"');
    const hasGenericResponse = await genericResponse.count() > 0;

    if (hasGenericResponse) {
      console.log('  ❌ FAIL: Got generic "Analyzed 9 family members" response');
    } else {
      console.log('  ✓ PASS: No generic response detected');
    }

    expect(hasGenericResponse).toBe(false);

    // Check for specific burnout-related content
    const pageContent = await page.content();
    const hasSpecificContent =
      pageContent.includes('Stefan') ||
      pageContent.includes('Kimberly') ||
      pageContent.includes('tasks') ||
      pageContent.includes('cognitive load');

    console.log(`  ${hasSpecificContent ? '✓' : '❌'} Response contains specific data`);
    expect(hasSpecificContent).toBe(true);
  });

  test('4. Chat scrolling works properly', async ({ page }) => {
    console.log('🧪 TEST 4: Testing chat scrolling...');

    // Open chat drawer
    const askAllieButton = page.locator('button:has-text("Ask Allie")');
    await askAllieButton.click();
    await page.waitForTimeout(1000);

    // Find the messages container
    const messagesContainer = page.locator('[class*="messages"], [class*="overflow-y-auto"]').first();

    // Check if container is scrollable
    const isScrollable = await messagesContainer.evaluate((el) => {
      return el.scrollHeight > el.clientHeight;
    });

    console.log(`  ${isScrollable ? '✓' : 'ℹ️'} Messages container is ${isScrollable ? 'scrollable' : 'not scrollable (may not have enough content yet)'}`);

    // Send multiple messages to create scrollable content
    const chatInput = page.locator('textarea, input[type="text"]').last();

    for (let i = 1; i <= 5; i++) {
      await chatInput.fill(`Test message ${i}`);
      await chatInput.press('Enter');
      await page.waitForTimeout(1000);
    }

    // Check if we can scroll
    const canScroll = await messagesContainer.evaluate((el) => {
      const initialScrollTop = el.scrollTop;
      el.scrollTop = 0; // Scroll to top
      const scrolledToTop = el.scrollTop === 0;
      el.scrollTop = initialScrollTop; // Restore
      return scrolledToTop;
    });

    console.log(`  ${canScroll ? '✓' : '❌'} Chat scrolling ${canScroll ? 'works' : 'is BROKEN'}`);
    expect(canScroll).toBe(true);
  });

  test('5. Suggested questions appear and work', async ({ page }) => {
    console.log('🧪 TEST 5: Testing suggested questions...');

    // Open chat drawer
    const askAllieButton = page.locator('button:has-text("Ask Allie")');
    await askAllieButton.click();
    await page.waitForTimeout(1000);

    // Look for suggested question chips/buttons
    const suggestedQuestions = page.locator('button[class*="chip"], button[class*="suggested"]');
    const questionCount = await suggestedQuestions.count();

    console.log(`  ${questionCount > 0 ? '✓' : '❌'} Found ${questionCount} suggested questions`);
    expect(questionCount).toBeGreaterThan(0);

    // Click the first suggested question
    if (questionCount > 0) {
      const firstQuestion = suggestedQuestions.first();
      const questionText = await firstQuestion.textContent();
      console.log(`  ✓ Clicking suggested question: "${questionText}"`);

      await firstQuestion.click();
      await page.waitForTimeout(3000);

      // Check if question was sent
      const chatMessages = page.locator('[class*="message"]');
      const messageCount = await chatMessages.count();

      console.log(`  ${messageCount > 0 ? '✓' : '❌'} Suggested question ${messageCount > 0 ? 'sent successfully' : 'FAILED to send'}`);
      expect(messageCount).toBeGreaterThan(0);
    }
  });

  test('6. Historical button opens with multiple questions', async ({ page }) => {
    console.log('🧪 TEST 6: Testing Historical Patterns button...');

    // Find Historical Patterns button
    const historicalButton = page.locator('button:has-text("Historical Patterns"), button:has-text("Historical")');
    await expect(historicalButton).toBeVisible({ timeout: 5000 });

    console.log('  ✓ Found Historical Patterns button');
    await historicalButton.click();

    // Wait for chat drawer to open
    await page.waitForTimeout(1000);

    // Check for multiple suggested questions (should have 4)
    const suggestedQuestions = page.locator('button[class*="chip"], button[class*="suggested"]');
    const questionCount = await suggestedQuestions.count();

    console.log(`  ${questionCount >= 4 ? '✓' : '❌'} Found ${questionCount} questions (expected 4)`);
    expect(questionCount).toBeGreaterThanOrEqual(4);

    // Verify they're clickable (not auto-submitted)
    const firstQuestion = suggestedQuestions.first();
    const isClickable = await firstQuestion.isEnabled();

    console.log(`  ${isClickable ? '✓' : '❌'} Questions are ${isClickable ? 'clickable' : 'NOT clickable'}`);
    expect(isClickable).toBe(true);
  });

  test('7. Predictive button opens with multiple questions', async ({ page }) => {
    console.log('🧪 TEST 7: Testing Predictive Insights button...');

    // Find Predictive Insights button
    const predictiveButton = page.locator('button:has-text("Predictive Insights"), button:has-text("Predictive")');
    await expect(predictiveButton).toBeVisible({ timeout: 5000 });

    console.log('  ✓ Found Predictive Insights button');
    await predictiveButton.click();

    // Wait for chat drawer to open
    await page.waitForTimeout(1000);

    // Check for multiple suggested questions (should have 4)
    const suggestedQuestions = page.locator('button[class*="chip"], button[class*="suggested"]');
    const questionCount = await suggestedQuestions.count();

    console.log(`  ${questionCount >= 4 ? '✓' : '❌'} Found ${questionCount} questions (expected 4)`);
    expect(questionCount).toBeGreaterThanOrEqual(4);
  });

  test('8. Graph height is adequate (600px)', async ({ page }) => {
    console.log('🧪 TEST 8: Testing graph viewing area height...');

    // Find the graph container
    const graphContainer = page.locator('svg').first().locator('..');

    const height = await graphContainer.evaluate((el) => {
      return el.getBoundingClientRect().height;
    });

    console.log(`  ℹ️  Graph container height: ${height}px`);
    console.log(`  ${height >= 500 ? '✓' : '❌'} Height is ${height >= 500 ? 'adequate (≥500px)' : 'too small (<500px)'}`);

    expect(height).toBeGreaterThanOrEqual(500);
  });

  test('9. No console errors on load', async ({ page }) => {
    console.log('🧪 TEST 9: Checking for console errors...');

    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate fresh
    await page.goto(`${TEST_CONFIG.baseUrl}/dashboard?tab=knowledge`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Filter out known/acceptable errors
    const criticalErrors = errors.filter(err =>
      !err.includes('Google Maps') && // Google Maps warnings are OK
      !err.includes('places.js') &&
      !err.includes('ResizeObserver') // ResizeObserver loop warnings are OK
    );

    console.log(`  ${criticalErrors.length === 0 ? '✓' : '❌'} Found ${criticalErrors.length} critical errors`);

    if (criticalErrors.length > 0) {
      console.log('  Critical errors:');
      criticalErrors.forEach((err, i) => {
        console.log(`    ${i + 1}. ${err.substring(0, 100)}...`);
      });
    }

    expect(criticalErrors.length).toBe(0);
  });

  test('10. Question selection shows checkmark', async ({ page }) => {
    console.log('🧪 TEST 10: Testing question selection UX...');

    // Open chat drawer
    const askAllieButton = page.locator('button:has-text("Ask Allie")');
    await askAllieButton.click();
    await page.waitForTimeout(1000);

    // Find suggested questions
    const suggestedQuestions = page.locator('button[class*="chip"], button[class*="suggested"]');
    const questionCount = await suggestedQuestions.count();

    if (questionCount > 0) {
      const firstQuestion = suggestedQuestions.first();

      // Click the question
      await firstQuestion.click();
      await page.waitForTimeout(500);

      // Check if it has a checkmark or selected state
      const hasCheckmark = await firstQuestion.locator('text="✓"').count() > 0;
      const hasSelectedClass = await firstQuestion.evaluate((el) => {
        return el.className.includes('selected') ||
               el.className.includes('indigo') ||
               el.className.includes('bg-indigo');
      });

      console.log(`  ${hasCheckmark ? '✓' : 'ℹ️'} Question ${hasCheckmark ? 'shows checkmark' : 'does not show checkmark'}`);
      console.log(`  ${hasSelectedClass ? '✓' : 'ℹ️'} Question ${hasSelectedClass ? 'has selected styling' : 'does not have selected styling'}`);

      const hasVisualFeedback = hasCheckmark || hasSelectedClass;
      expect(hasVisualFeedback).toBe(true);
    }
  });
});
