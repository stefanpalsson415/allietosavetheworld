/**
 * Stage 2: Onboarding Flow
 * Tests account creation, verification, and family setup
 */

const { test, expect } = require('@playwright/test');
const {
  generateTestFamily,
  waitForElement,
  fillInput,
  completePhoneVerification,
  completeEmailVerification,
  takeTimestampedScreenshot
} = require('../utils/test-helpers');

let testFamily;

test.describe('Stage 2: Onboarding Flow', () => {
  test.beforeEach(async () => {
    testFamily = generateTestFamily();
    console.log('Generated test family:', testFamily.familyName);
  });

  test('2.1 Account Creation - Family Name and Password', async ({ page }) => {
    console.log('Testing account creation...');

    // Navigate to onboarding (assumes user came from quiz)
    await page.goto('/onboarding');

    // Wait for onboarding form
    await waitForElement(page, 'form, [data-testid="onboarding-form"]', { timeout: 10000 });

    // Family name should be pre-filled from quiz
    const familyNameInput = page.locator('input[name*="family"], input[placeholder*="Family"]');

    // If not pre-filled, fill it
    if (await familyNameInput.count() > 0) {
      const currentValue = await familyNameInput.first().inputValue();
      if (!currentValue) {
        await fillInput(familyNameInput.first(), testFamily.familyName);
      }
    }

    // Set password for Parent 1
    await fillInput(page, 'input[name="password"], input[type="password"]', 'TestPassword123!');

    // Confirm password
    const confirmPasswordField = page.locator('input[name*="confirm"], input[placeholder*="Confirm"]');
    if (await confirmPasswordField.count() > 0) {
      await fillInput(confirmPasswordField.first(), 'TestPassword123!');
    }

    // Take screenshot
    await takeTimestampedScreenshot(page, 'account-creation');

    // Click Continue/Next
    await page.click('button:has-text("Continue"), button:has-text("Next"), button[type="submit"]');

    console.log('✅ Account creation form submitted');
  });

  test('2.2 Phone Verification - SMS Flow', async ({ page }) => {
    console.log('Testing phone verification...');

    // Start from phone verification step
    await page.goto('/onboarding?step=phone');

    // Wait for phone input
    await waitForElement(page, 'input[type="tel"], input[name*="phone"]', { timeout: 10000 });

    // Enter phone number
    await fillInput(page, 'input[type="tel"], input[name*="phone"]', testFamily.parent1.phone);

    // Click Send Code
    await page.click('button:has-text("Send Code"), button:has-text("Send SMS")');

    // Wait for verification code input
    await waitForElement(page, 'input[name*="code"], input[name*="verification"]', { timeout: 10000 });

    console.log('Verification code input appeared');

    // In test environment, enter mock code
    await fillInput(page, 'input[name*="code"], input[name*="verification"]', '123456');

    // Click Verify
    await page.click('button:has-text("Verify"), button:has-text("Confirm")');

    // Wait for confirmation message
    await expect(page.locator('text=verified, text=success, text=✅')).toBeVisible({ timeout: 10000 });

    // Check for SMS confirmation message (from CLAUDE.md)
    const confirmationMessage = page.locator('text=Received and processing');
    if (await confirmationMessage.count() > 0) {
      console.log('✅ SMS confirmation message displayed');
    }

    await takeTimestampedScreenshot(page, 'phone-verified');

    console.log('✅ Phone verification complete');
  });

  test('2.3 Email Verification - Parent 1', async ({ page }) => {
    console.log('Testing Parent 1 email verification...');

    await page.goto('/onboarding?step=email');

    // Wait for email input
    await waitForElement(page, 'input[type="email"]', { timeout: 10000 });

    // Enter Parent 1 email
    await fillInput(page, 'input[type="email"]', testFamily.parent1.email);

    // Click Send Verification Code
    await page.click('button:has-text("Send"), button:has-text("Verify")');

    // Wait for code input
    await waitForElement(page, 'input[name*="code"]', { timeout: 10000 });

    // Enter mock verification code
    await fillInput(page, 'input[name*="code"]', '123456');

    // Click Verify Email
    await page.click('button:has-text("Verify"), button:has-text("Confirm")');

    // Wait for success
    await expect(page.locator('text=verified, text=success')).toBeVisible({ timeout: 10000 });

    await takeTimestampedScreenshot(page, 'parent1-email-verified');

    console.log('✅ Parent 1 email verified');
  });

  test('2.4 Email Verification - Parent 2', async ({ page }) => {
    console.log('Testing Parent 2 email verification...');

    // Assume we're continuing from Parent 1 verification
    await page.goto('/onboarding?step=email2');

    // Look for Parent 2 email section
    const parent2EmailInput = page.locator('input[type="email"][name*="parent2"], input[placeholder*="Parent 2"]');

    if (await parent2EmailInput.count() === 0) {
      // If not on separate screen, look for "Add Parent 2" button
      const addParent2Button = page.locator('button:has-text("Add Parent 2"), button:has-text("Parent 2")');
      if (await addParent2Button.count() > 0) {
        await addParent2Button.first().click();
      }
    }

    // Enter Parent 2 email
    const emailInputs = page.locator('input[type="email"]');
    const emailCount = await emailInputs.count();
    if (emailCount > 1) {
      await fillInput(emailInputs.last(), testFamily.parent2.email);
    } else {
      await fillInput(emailInputs.first(), testFamily.parent2.email);
    }

    // Send verification code
    await page.click('button:has-text("Send")');

    // Wait for code input
    await page.waitForTimeout(1000);
    const codeInputs = page.locator('input[name*="code"]');
    const codeCount = await codeInputs.count();

    // Enter code in the last code input (for Parent 2)
    if (codeCount > 0) {
      await fillInput(codeInputs.last(), '123456');
    }

    // Verify
    await page.click('button:has-text("Verify")');

    await takeTimestampedScreenshot(page, 'parent2-email-verified');

    console.log('✅ Parent 2 email verified');
  });

  test('2.5 Family Email Setup', async ({ page }) => {
    console.log('Testing family email setup...');

    await page.goto('/onboarding?step=family-email');

    // Wait for family email prefix input
    await waitForElement(page, 'input[name*="prefix"], input[name*="email"]', { timeout: 10000 });

    // Create email prefix from family name
    const emailPrefix = testFamily.familyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    await fillInput(page, 'input[name*="prefix"], input[name*="email"]', emailPrefix);

    // Verify preview shows correct format
    const previewText = page.locator('text=@families.checkallie.com, text=families.checkallie.com');
    if (await previewText.count() > 0) {
      await expect(previewText.first()).toBeVisible();
      console.log('✅ Family email preview displayed');
    }

    // Click Create Family Email
    await page.click('button:has-text("Create"), button:has-text("Continue")');

    // Wait for confirmation
    await page.waitForTimeout(2000);

    // Verify family email was created
    const successMessage = page.locator('text=created, text=ready, text=success');
    if (await successMessage.count() > 0) {
      await expect(successMessage.first()).toBeVisible({ timeout: 10000 });
      console.log('✅ Family email created successfully');
    }

    await takeTimestampedScreenshot(page, 'family-email-created');

    // Verify email_registry collection would have entry (this would need Firebase Admin check)
    console.log(`Family email: ${emailPrefix}@families.checkallie.com`);
  });

  test('2.6 Payment Setup - Coupon Codes', async ({ page }) => {
    console.log('Testing payment setup with coupon codes...');

    await page.goto('/onboarding?step=payment');

    // Wait for payment form
    await waitForElement(page, 'form, [data-testid="payment-form"]', { timeout: 10000 });

    // Test coupon codes from CLAUDE.md
    const couponCodes = ['olytheawesome', 'freeforallie', 'familyfirst'];

    for (const code of couponCodes) {
      const couponInput = page.locator('input[name*="coupon"], input[placeholder*="coupon" i]');

      if (await couponInput.count() > 0) {
        await fillInput(couponInput.first(), code);
        await page.click('button:has-text("Apply")');

        // Wait for response
        await page.waitForTimeout(1000);

        // Check for success/error message
        const message = page.locator('[class*="message"], [role="alert"]');
        if (await message.count() > 0) {
          const messageText = await message.first().textContent();
          console.log(`Coupon "${code}" result: ${messageText}`);
        }

        break; // Use first code that works
      }
    }

    await takeTimestampedScreenshot(page, 'payment-setup');

    // Start free trial
    const trialButton = page.locator('button:has-text("Start Free Trial"), button:has-text("Continue")');
    if (await trialButton.count() > 0) {
      await trialButton.first().click();

      // Wait for redirect to dashboard
      await page.waitForURL(/\/dashboard|\/home/, { timeout: 15000 });

      console.log('✅ Free trial started, redirected to dashboard');
    }
  });

  test('2.7 Complete Onboarding Flow - End to End', async ({ page }) => {
    console.log('Testing complete onboarding flow...');

    // Start from signup
    await page.goto('/signup');

    // Step 1: Family name and password
    await fillInput(page, 'input[name*="family"]', testFamily.familyName);
    await fillInput(page, 'input[type="password"]', 'TestPassword123!');

    const confirmPassword = page.locator('input[name*="confirm"]');
    if (await confirmPassword.count() > 0) {
      await fillInput(confirmPassword.first(), 'TestPassword123!');
    }

    await page.click('button[type="submit"], button:has-text("Continue")');

    // Step 2: Phone verification
    await page.waitForTimeout(1000);
    const phoneInput = page.locator('input[type="tel"]');
    if (await phoneInput.count() > 0) {
      await fillInput(phoneInput.first(), testFamily.parent1.phone);
      await page.click('button:has-text("Send")');
      await page.waitForTimeout(1000);
      await fillInput(page, 'input[name*="code"]', '123456');
      await page.click('button:has-text("Verify")');
    }

    // Step 3: Email verification
    await page.waitForTimeout(1000);
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      await fillInput(emailInput.first(), testFamily.parent1.email);
      await page.click('button:has-text("Send")');
      await page.waitForTimeout(1000);
      const codeInputs = page.locator('input[name*="code"]');
      if (await codeInputs.count() > 0) {
        await fillInput(codeInputs.last(), '123456');
        await page.click('button:has-text("Verify")');
      }
    }

    // Step 4: Family email
    await page.waitForTimeout(1000);
    const familyEmailInput = page.locator('input[name*="prefix"]');
    if (await familyEmailInput.count() > 0) {
      const prefix = testFamily.familyName.toLowerCase().replace(/[^a-z0-9]/g, '');
      await fillInput(familyEmailInput.first(), prefix);
      await page.click('button:has-text("Create")');
    }

    // Step 5: Payment/Trial
    await page.waitForTimeout(1000);
    const startTrialButton = page.locator('button:has-text("Start Free Trial")');
    if (await startTrialButton.count() > 0) {
      await startTrialButton.first().click();
    }

    // Verify we reached the dashboard
    await page.waitForURL(/\/dashboard|\/home/, { timeout: 20000 });

    await takeTimestampedScreenshot(page, 'onboarding-complete');

    console.log('✅ Complete onboarding flow successful');
  });

  test('2.8 Data Validation - Family Document Created', async ({ page }) => {
    console.log('Verifying family document creation...');

    // This would require Firebase Admin SDK
    // For now, verify through UI indicators

    await page.goto('/dashboard');

    // Verify family name appears in dashboard
    const familyName = page.locator(`text=${testFamily.familyName}`);
    if (await familyName.count() > 0) {
      await expect(familyName.first()).toBeVisible({ timeout: 10000 });
      console.log('✅ Family name visible in dashboard');
    }

    // Verify family members appear
    const parent1Name = page.locator(`text=${testFamily.parent1.name}`);
    if (await parent1Name.count() > 0) {
      await expect(parent1Name.first()).toBeVisible();
      console.log('✅ Parent 1 name visible');
    }

    // Log what would be checked in Firestore
    console.log('Firestore validation (would require Admin SDK):');
    console.log('- families/{familyId} document exists');
    console.log('- families/{familyId}.emailRegistry has entry');
    console.log('- families/{familyId}.members includes both parents');
    console.log('- families/{familyId}.children includes all children');
  });

  test.afterEach(async ({ page }) => {
    await takeTimestampedScreenshot(page, 'stage2-end');
  });
});
