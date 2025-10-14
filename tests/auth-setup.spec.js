// tests/auth-setup.spec.js
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('Authentication Setup', () => {
  test('Login and save authentication state', async ({ page, context }) => {
    // Go to the app
    await page.goto('http://localhost:3000');
    
    // Wait for any redirects
    await page.waitForLoadState('domcontentloaded');
    
    // Check if we're on login page
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('login')) {
      console.log('On login page, logging in...');
      
      // Fill in the login form
      await page.fill('input[type="email"], input[name="email"], #email', 'spalsson@gmail.com');
      await page.fill('input[type="password"], input[name="password"], #password', 'Stegner1');
      
      // Click login button
      await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
      
      // Wait for navigation after login
      await page.waitForNavigation({ timeout: 30000 }).catch(() => {
        console.log('Navigation wait timed out, checking if logged in anyway...');
      });
      
      // Wait a bit more for any additional loading
      await page.waitForTimeout(5000);
    }
    
    // Save the authentication state
    const authDir = path.join(__dirname, '.auth');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
    
    await context.storageState({ path: path.join(authDir, 'user.json') });
    console.log('✅ Authentication state saved!');
    
    // Verify we're logged in by checking for dashboard elements
    const isDashboard = await page.url().includes('dashboard');
    const hasUserDropdown = await page.locator('.user-dropdown-container').isVisible().catch(() => false);
    
    if (isDashboard || hasUserDropdown) {
      console.log('✅ Successfully logged in and on dashboard!');
    } else {
      console.log('⚠️ May not be fully logged in, current URL:', page.url());
    }
  });
});