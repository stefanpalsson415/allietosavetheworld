/**
 * Production Auth Setup for E2E Tests
 *
 * Logs into the Palsson Family Simulation demo account on production
 * and saves the authentication state for tests to use.
 */

const { chromium } = require('@playwright/test');

async function globalSetup() {
  console.log('\n🔐 Setting up production authentication for demo account...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to production login
    console.log('📍 Navigating to https://checkallie.com...');
    await page.goto('https://checkallie.com');

    // Wait for login page
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('📧 Entering demo account email...');

    // Look for email input (try multiple selectors)
    const emailInput = await page.locator('input[type="email"], input[placeholder*="email" i]').first();
    await emailInput.fill('demo@parentload.com');

    console.log('🔑 Entering password...');

    // Look for password input
    const passwordInput = await page.locator('input[type="password"]').first();
    await passwordInput.fill('DemoFamily2024!');

    console.log('🚀 Clicking login button...');

    // Click login button (try multiple selectors)
    const loginButton = await page.locator('button:has-text("Log In"), button:has-text("Sign In"), button[type="submit"]').first();
    await loginButton.click();

    // Wait for navigation to dashboard
    console.log('⏳ Waiting for dashboard to load...');
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged into production!');

    // Save authentication state
    await context.storageState({ path: 'tests/.auth/production-user.json' });
    console.log('💾 Saved auth state to tests/.auth/production-user.json\n');

  } catch (error) {
    console.error('❌ Auth setup failed:', error.message);
    console.log('\n⚠️  Manual login required:');
    console.log('   1. Browser window will stay open');
    console.log('   2. Please log into https://checkallie.com with demo account');
    console.log('   3. Navigate to /dashboard?tab=knowledge');
    console.log('   4. Press Enter in this terminal when ready...\n');

    // Keep browser open for manual login
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    await new Promise(resolve => {
      rl.question('Press Enter after logging in...', () => {
        rl.close();
        resolve();
      });
    });

    // Save whatever state we have now
    await context.storageState({ path: 'tests/.auth/production-user.json' });
    console.log('💾 Saved auth state from manual login\n');
  }

  await browser.close();
  console.log('✨ Production auth setup complete!\n');
}

module.exports = globalSetup;
