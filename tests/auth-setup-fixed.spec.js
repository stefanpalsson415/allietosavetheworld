// tests/auth-setup-fixed.spec.js
// FIXED authentication setup that properly waits for login to complete
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('Fixed Authentication Setup', () => {
  test('Login with proper wait for dashboard', async ({ page, context }) => {
    console.log('🔐 Starting authentication setup...');

    // Go to the app homepage (uses baseURL from config)
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    console.log('📍 Landed on:', page.url());

    // Wait for and click the "Log In" button to open the modal
    try {
      const loginButton = page.locator('a:has-text("Log In"), button:has-text("Log In")').first();
      await loginButton.waitFor({ state: 'visible', timeout: 10000 });
      await loginButton.click();
      console.log('✅ Clicked Log In button - modal should appear');

      // Wait for the login modal to appear
      await page.waitForSelector('input[type="email"], input[placeholder*="email" i]', { timeout: 10000 });
      console.log('✅ Login modal is visible');
    } catch (e) {
      console.log('⚠️ Log In button not found or modal did not appear - may already be on login page');
    }

    // CRITICAL: Click the "Password" tab (default is "Email Code")
    try {
      const passwordTab = page.locator('button:has-text("Password")').first();
      await passwordTab.waitFor({ state: 'visible', timeout: 5000 });
      await passwordTab.click();
      console.log('✅ Clicked Password tab');
      await page.waitForTimeout(500); // Wait for tab transition
    } catch (e) {
      console.log('⚠️ Password tab not found - may already be on password mode');
    }

    // Fill in email (test user created by scripts/create-test-user.js)
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill('test@parentload.com');
    console.log('✅ Filled email: test@parentload.com');

    // Fill in password
    const passwordInput = page.locator('input[type="password"], input[placeholder*="password" i]').first();
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.fill('TestPassword123!');
    console.log('✅ Filled password');

    // Click the Log In submit button
    const submitButton = page.locator('button[type="submit"]:has-text("Log In"), button:has-text("Log In")').first();
    await submitButton.click();
    console.log('✅ Clicked submit button');

    // CRITICAL: Wait for navigation to dashboard - this is what previous tests missed!
    try {
      // Option 1: Wait for URL to contain 'dashboard'
      await page.waitForURL('**/dashboard**', { timeout: 30000 });
      console.log('✅ Successfully navigated to dashboard!');
    } catch (e) {
      console.log('⚠️ Did not auto-navigate to dashboard, checking for family selection...');

      // Option 2: We might be on family selection screen
      try {
        await page.waitForSelector('text=/Select.*Family Member|Choose.*Profile/i', { timeout: 10000 });
        console.log('📋 Found family selection screen');

        // Click the first family member or look for Stefan
        const stefanCard = page.locator('div:has-text("Stefan")').first();
        if (await stefanCard.isVisible()) {
          await stefanCard.click();
          console.log('✅ Selected Stefan from family members');
        } else {
          // Click first available member
          await page.locator('.cursor-pointer, [role="button"]').first().click();
          console.log('✅ Selected first available family member');
        }

        // Now wait for dashboard
        await page.waitForURL('**/dashboard**', { timeout: 15000 });
        console.log('✅ Navigated to dashboard after family selection');
      } catch (e2) {
        console.log('❌ Could not find family selection or navigate to dashboard');
        console.log('   Current URL:', page.url());
        throw new Error('Failed to reach dashboard after login');
      }
    }

    // CRITICAL: Wait for dashboard to fully load - check for actual dashboard elements
    try {
      await Promise.race([
        page.waitForSelector('.user-dropdown-container', { timeout: 10000 }),
        page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 }),
        page.waitForSelector('text=/Welcome.*|Dashboard/i', { timeout: 10000 })
      ]);
      console.log('✅ Dashboard UI elements detected - fully loaded!');
    } catch (e) {
      console.log('⚠️ Dashboard elements not immediately visible, waiting longer...');
      await page.waitForTimeout(5000); // Give it more time
    }

    // CRITICAL: Wait for Firebase auth to be set in localStorage
    // Firebase stores auth tokens in localStorage with keys starting with "firebase:"
    let authReady = false;
    for (let i = 0; i < 10; i++) {
      const localStorage = await page.evaluate(() => {
        const items = {};
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          items[key] = window.localStorage.getItem(key);
        }
        return items;
      });

      // Check if Firebase auth token exists
      const hasFirebaseAuth = Object.keys(localStorage).some(key =>
        key.includes('firebase') && localStorage[key] && localStorage[key].includes('authToken')
      );

      if (hasFirebaseAuth) {
        console.log('✅ Firebase auth tokens detected in localStorage!');
        authReady = true;
        break;
      }

      console.log(`⏳ Waiting for Firebase auth (attempt ${i+1}/10)...`);
      await page.waitForTimeout(1000);
    }

    if (!authReady) {
      console.log('⚠️ Firebase auth tokens not detected, but proceeding anyway');
    }

    // Take screenshot of successful login
    await page.screenshot({ path: 'test-results/auth-success-dashboard.png' });

    // NOW save the authentication state (with actual tokens!)
    const authDir = path.join(__dirname, '.auth');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    const authPath = path.join(authDir, 'user.json');
    await context.storageState({ path: authPath });
    console.log('✅ Authentication state saved to:', authPath);

    // Save debug info
    const cookies = await context.cookies();
    const localStorage = await page.evaluate(() => Object.entries(window.localStorage));
    const debugPath = path.join(authDir, 'auth-debug.json');

    fs.writeFileSync(
      debugPath,
      JSON.stringify({
        cookies,
        localStorage,
        url: page.url(),
        timestamp: new Date().toISOString()
      }, null, 2)
    );
    console.log('✅ Debug info saved to:', debugPath);

    // Verify we have actual auth data
    const savedState = JSON.parse(fs.readFileSync(authPath, 'utf8'));
    const hasAuthData = savedState.origins && savedState.origins.length > 0 &&
                        savedState.origins[0].localStorage &&
                        savedState.origins[0].localStorage.length > 0;

    if (hasAuthData) {
      console.log('✅ ✅ ✅ SUCCESS! Auth state contains actual data!');
      console.log('   Origins:', savedState.origins.length);
      console.log('   localStorage items:', savedState.origins[0].localStorage.length);
    } else {
      console.log('❌ WARNING: Auth state file seems empty!');
      console.log('   This means login did not complete successfully');
      throw new Error('Auth state is empty - login failed');
    }
  });
});
