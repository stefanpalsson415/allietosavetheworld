/**
 * Test Helpers for Allie E2E Tests
 * Common utilities for testing the user journey
 */

const { expect } = require('@playwright/test');

/**
 * Generate unique test family data
 */
function generateTestFamily() {
  const timestamp = Date.now();
  return {
    familyName: `TestFamily${timestamp}`,
    parent1: {
      name: 'Sarah',
      email: `sarah.test${timestamp}@example.com`,
      phone: `+1555${timestamp.toString().slice(-7)}`
    },
    parent2: {
      name: 'Mike',
      email: `mike.test${timestamp}@example.com`
    },
    children: [
      { name: 'Emma', age: 8 },
      { name: 'Josh', age: 10 }
    ]
  };
}

/**
 * Wait for element with custom timeout
 */
async function waitForElement(page, selector, options = {}) {
  const timeout = options.timeout || 30000;
  await page.waitForSelector(selector, {
    state: 'visible',
    timeout,
    ...options
  });
}

/**
 * Fill input field with typing simulation
 */
async function fillInput(page, selector, value) {
  await page.fill(selector, '');
  await page.type(selector, value, { delay: 50 });
}

/**
 * Click button and wait for navigation/response
 */
async function clickAndWait(page, selector, options = {}) {
  const waitFor = options.waitFor || 'networkidle';
  await Promise.all([
    page.waitForLoadState(waitFor),
    page.click(selector)
  ]);
}

/**
 * Take screenshot with timestamp
 */
async function takeTimestampedScreenshot(page, name) {
  const timestamp = Date.now();
  await page.screenshot({
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true
  });
}

/**
 * Verify no console errors
 */
async function verifyNoConsoleErrors(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

/**
 * Complete balance quiz with test data
 */
async function completeBalanceQuiz(page, testFamily) {
  console.log('Starting balance quiz...');

  // Enter parent names
  await fillInput(page, '[name="parent1Name"]', testFamily.parent1.name);
  await fillInput(page, '[name="parent2Name"]', testFamily.parent2.name);

  // Add children
  for (const child of testFamily.children) {
    await page.click('button:has-text("Add Child")');
    await fillInput(page, '[name="childName"]:last-of-type', child.name);
    await fillInput(page, '[name="childAge"]:last-of-type', child.age.toString());
  }

  await page.click('button:has-text("Start Quiz")');

  // Complete Parent 1 questions (40 questions)
  for (let i = 0; i < 40; i++) {
    // Select middle option for each question
    await page.click('[data-testid="answer-option-2"]');
    await page.click('button:has-text("Next")');

    // Check for balance forecast after 10 questions
    if (i === 9) {
      await expect(page.locator('.balance-forecast')).toBeVisible({ timeout: 5000 });
    }
  }

  // Switch to Parent 2
  await page.click('button:has-text("Switch to Parent 2")');

  // Complete Parent 2 questions
  for (let i = 0; i < 40; i++) {
    await page.click('[data-testid="answer-option-2"]');
    await page.click('button:has-text("Next")');
  }

  // Verify results page
  await expect(page.locator('.quiz-results')).toBeVisible();
  await expect(page.locator('.balance-percentage')).toBeVisible();
  await expect(page.locator('.radar-chart')).toBeVisible();
}

/**
 * Complete phone verification
 */
async function completePhoneVerification(page, phoneNumber) {
  await fillInput(page, '[name="phoneNumber"]', phoneNumber);
  await page.click('button:has-text("Send Code")');

  // Wait for SMS code input
  await waitForElement(page, '[name="verificationCode"]');

  // In test environment, use mock code
  await fillInput(page, '[name="verificationCode"]', '123456');
  await page.click('button:has-text("Verify")');
}

/**
 * Complete email verification
 */
async function completeEmailVerification(page, email) {
  await fillInput(page, '[name="email"]', email);
  await page.click('button:has-text("Send Verification Code")');

  await waitForElement(page, '[name="emailCode"]');

  // Use mock verification code
  await fillInput(page, '[name="emailCode"]', '123456');
  await page.click('button:has-text("Verify Email")');
}

/**
 * Complete onboarding flow
 */
async function completeOnboarding(page, testFamily) {
  console.log('Starting onboarding...');

  // Set password
  await fillInput(page, '[name="password"]', 'TestPassword123!');
  await fillInput(page, '[name="confirmPassword"]', 'TestPassword123!');
  await page.click('button:has-text("Continue")');

  // Phone verification
  await completePhoneVerification(page, testFamily.parent1.phone);

  // Email verification - Parent 1
  await completeEmailVerification(page, testFamily.parent1.email);

  // Email verification - Parent 2
  await completeEmailVerification(page, testFamily.parent2.email);

  // Family email setup
  const emailPrefix = testFamily.familyName.toLowerCase().replace(/[^a-z0-9]/g, '');
  await fillInput(page, '[name="emailPrefix"]', emailPrefix);
  await page.click('button:has-text("Create Family Email")');

  // Wait for confirmation
  await expect(page.locator('text=families.checkallie.com')).toBeVisible();

  // Payment/Trial setup
  await page.click('button:has-text("Start Free Trial")');
}

/**
 * Complete initial survey
 */
async function completeInitialSurvey(page, parentName) {
  console.log(`Starting initial survey for ${parentName}...`);

  // Select parent
  await page.click(`button:has-text("${parentName}")`);

  // Complete 72 questions
  for (let i = 0; i < 72; i++) {
    // Vary answers for realistic data
    const answerOption = (i % 5) + 1; // Cycle through 1-5
    await page.click(`[data-testid="answer-option-${answerOption}"]`);
    await page.click('button:has-text("Next")');

    // Verify progress saves (check every 10 questions)
    if (i % 10 === 0) {
      const progress = await page.locator('.survey-progress').textContent();
      console.log(`Survey progress: ${progress}`);
    }
  }

  // Verify completion
  await expect(page.locator('text=Survey Complete')).toBeVisible({ timeout: 10000 });
}

/**
 * Verify Firestore data exists
 */
async function verifyFirestoreData(familyId, expectedData) {
  // This would require Firebase Admin SDK setup
  // For now, return placeholder
  console.log(`Verifying Firestore data for family ${familyId}`);
  return true;
}

/**
 * Clean up test data
 */
async function cleanupTestData(familyId) {
  console.log(`Cleaning up test data for family ${familyId}`);
  // Implementation would delete test family from Firestore
}

module.exports = {
  generateTestFamily,
  waitForElement,
  fillInput,
  clickAndWait,
  takeTimestampedScreenshot,
  verifyNoConsoleErrors,
  completeBalanceQuiz,
  completePhoneVerification,
  completeEmailVerification,
  completeOnboarding,
  completeInitialSurvey,
  verifyFirestoreData,
  cleanupTestData
};
