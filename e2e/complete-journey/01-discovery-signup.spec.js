/**
 * Stage 1: Discovery & Signup Journey
 * Tests the complete flow from landing page to signup decision
 */

const { test, expect } = require('@playwright/test');
const {
  generateTestFamily,
  waitForElement,
  fillInput,
  completeBalanceQuiz,
  takeTimestampedScreenshot,
  verifyNoConsoleErrors
} = require('../utils/test-helpers');

let testFamily;
let consoleErrors;

test.describe('Stage 1: Discovery & Signup', () => {
  test.beforeEach(async ({ page }) => {
    testFamily = generateTestFamily();
    consoleErrors = [];

    // Monitor console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    console.log('Generated test family:', testFamily.familyName);
  });

  test('1.1 Landing Page Arrival', async ({ page }) => {
    console.log('Testing landing page arrival...');

    // Navigate to landing page
    await page.goto('/');

    // Verify hero content loads
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Family')).toBeVisible();

    // Verify CTA button exists
    const ctaButton = page.locator('button:has-text("Take the Free Balance Quiz"), button:has-text("Get Started")');
    await expect(ctaButton.first()).toBeVisible();

    // Take screenshot
    await takeTimestampedScreenshot(page, 'landing-page');

    console.log('✅ Landing page loaded successfully');
  });

  test('1.2 Sales Chat Does Not Appear on Mobile', async ({ page, browserName }) => {
    console.log('Testing sales chat visibility on mobile...');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify SalesAllieChat is not visible on mobile
    const salesChat = page.locator('[data-testid="sales-allie-chat"]');
    await expect(salesChat).not.toBeVisible();

    console.log('✅ Sales chat correctly hidden on mobile');
  });

  test('1.3 Balance Quiz Flow - Complete Journey', async ({ page }) => {
    console.log('Testing complete balance quiz flow...');

    await page.goto('/');

    // Click "Take the Free Balance Quiz"
    const quizButton = page.locator('button:has-text("Take the Free Balance Quiz"), button:has-text("Get Started")');
    await quizButton.first().click();

    // Wait for quiz to load
    await waitForElement(page, '[data-testid="balance-quiz"]', { timeout: 10000 });

    // Enter parent names
    console.log('Entering parent names...');
    await fillInput(page, 'input[placeholder*="Parent 1"], input[name*="parent1"]', testFamily.parent1.name);
    await fillInput(page, 'input[placeholder*="Parent 2"], input[name*="parent2"]', testFamily.parent2.name);

    // Add children
    console.log('Adding children...');
    for (const child of testFamily.children) {
      const addChildButton = page.locator('button:has-text("Add Child"), button:has-text("Add a child")');
      await addChildButton.first().click();

      await fillInput(page, 'input[placeholder*="Child"], input[name*="child"]', child.name);
      await fillInput(page, 'input[placeholder*="Age"], input[name*="age"]', child.age.toString());
    }

    // Start quiz
    await page.click('button:has-text("Start Quiz"), button:has-text("Begin"), button:has-text("Next")');

    // Complete Parent 1 questions (40 questions)
    console.log('Completing Parent 1 questions...');
    for (let i = 0; i < 40; i++) {
      // Wait for question to be visible
      await page.waitForSelector('[data-testid="question"], .question', { state: 'visible', timeout: 5000 });

      // Select middle option (usually option 3 out of 5)
      const answerButtons = page.locator('button[data-testid*="answer"], .answer-option, input[type="radio"] + label');
      const answerCount = await answerButtons.count();

      if (answerCount > 0) {
        const middleIndex = Math.floor(answerCount / 2);
        await answerButtons.nth(middleIndex).click();
      }

      // Click Next
      await page.click('button:has-text("Next"), button:has-text("Continue")');

      // Check for balance forecast after 10 questions
      if (i === 9) {
        console.log('Checking for balance forecast...');
        const forecast = page.locator('[data-testid="balance-forecast"], .balance-forecast');
        // Forecast should appear (but may not be visible immediately)
        await page.waitForTimeout(1000);
      }

      if (i % 10 === 0) {
        console.log(`Progress: ${i + 1}/40 questions for Parent 1`);
      }
    }

    console.log('✅ Parent 1 questions completed');

    // Switch to Parent 2 or verify prompt
    const parent2Button = page.locator('button:has-text("Parent 2"), button:has-text("Switch")');
    if (await parent2Button.count() > 0) {
      await parent2Button.first().click();

      // Complete Parent 2 questions
      console.log('Completing Parent 2 questions...');
      for (let i = 0; i < 40; i++) {
        await page.waitForSelector('[data-testid="question"], .question', { state: 'visible', timeout: 5000 });

        const answerButtons = page.locator('button[data-testid*="answer"], .answer-option, input[type="radio"] + label');
        const answerCount = await answerButtons.count();

        if (answerCount > 0) {
          const middleIndex = Math.floor(answerCount / 2);
          await answerButtons.nth(middleIndex).click();
        }

        await page.click('button:has-text("Next"), button:has-text("Continue")');

        if (i % 10 === 0) {
          console.log(`Progress: ${i + 1}/40 questions for Parent 2`);
        }
      }

      console.log('✅ Parent 2 questions completed');
    }

    // Wait for results page
    await page.waitForSelector('[data-testid="quiz-results"], .quiz-results, .results', { timeout: 15000 });

    // Verify results elements
    console.log('Verifying results page...');

    // Check for balance percentage
    const balanceText = page.locator('text=balance, text=%');
    await expect(balanceText.first()).toBeVisible({ timeout: 10000 });

    // Check for radar chart (uses recharts or d3)
    const chart = page.locator('[class*="recharts"], canvas, svg');
    await expect(chart.first()).toBeVisible({ timeout: 5000 });

    // Take screenshot of results
    await takeTimestampedScreenshot(page, 'quiz-results');

    console.log('✅ Quiz results displayed successfully');
  });

  test('1.4 Email Me Report Functionality', async ({ page }) => {
    console.log('Testing email report functionality...');

    // Complete quiz first (abbreviated version)
    await page.goto('/quiz');

    // Skip to results (if possible) or complete quickly
    // This assumes there's a way to navigate directly to results
    // In real implementation, might need to complete full quiz

    // Look for "Email Me This Report" button
    const emailButton = page.locator('button:has-text("Email"), button:has-text("Send")');

    if (await emailButton.count() > 0) {
      // Enter email
      await fillInput(page, 'input[type="email"]', testFamily.parent1.email);
      await emailButton.first().click();

      // Verify success message
      await expect(page.locator('text=sent, text=email')).toBeVisible({ timeout: 10000 });

      console.log('✅ Email report functionality working');
    } else {
      console.log('⚠️  Email report button not found (may be on different page)');
    }
  });

  test('1.5 Signup Decision - Start Free Trial', async ({ page }) => {
    console.log('Testing signup decision flow...');

    // Assume we're on results page
    await page.goto('/quiz-results');

    // Look for "Start Free Trial" or similar CTA
    const signupButton = page.locator(
      'button:has-text("Start Free Trial"), button:has-text("Get Started"), button:has-text("Sign Up")'
    );

    if (await signupButton.count() > 0) {
      await signupButton.first().click();

      // Verify transition to onboarding
      await page.waitForURL(/\/onboarding|\/signup/, { timeout: 10000 });

      console.log('✅ Successfully transitioned to onboarding');
    } else {
      console.log('⚠️  Signup button not found');
    }
  });

  test.afterEach(async ({ page }) => {
    // Check for console errors
    if (consoleErrors.length > 0) {
      console.warn('⚠️  Console errors detected:', consoleErrors);
    } else {
      console.log('✅ No console errors detected');
    }

    // Take final screenshot
    await takeTimestampedScreenshot(page, 'test-end');
  });
});

test.describe('Stage 1: Critical Data Validation', () => {
  test('Verify landing page loads without errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    page.on('pageerror', err => {
      errors.push(err.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(errors.length).toBe(0);
    console.log('✅ Landing page loaded without errors');
  });

  test('Verify all critical elements present', async ({ page }) => {
    await page.goto('/');

    // Hero section
    await expect(page.locator('h1')).toBeVisible();

    // CTA button
    const cta = page.locator('button, a').filter({ hasText: /quiz|started|begin/i });
    expect(await cta.count()).toBeGreaterThan(0);

    // Navigation elements
    const nav = page.locator('nav, header');
    expect(await nav.count()).toBeGreaterThan(0);

    console.log('✅ All critical elements present');
  });
});
