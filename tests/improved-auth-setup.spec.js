// tests/improved-auth-setup.spec.js
const { test, expect, chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('Improved Authentication Setup', () => {
  test('Login with automatic family selection', async ({ browser }) => {
    // Create a new context and page
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Go to the app
    await page.goto('http://localhost:3000');
    
    // Wait for any redirects
    await page.waitForLoadState('domcontentloaded');
    
    // Check if we're on login page
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    if (currentUrl.includes('/login') || currentUrl.includes('login')) {
      console.log('On login page, filling credentials...');
      
      // Wait for the email input to be visible
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      
      // Fill in the email
      await page.fill('input[type="email"]', 'spalsson@gmail.com');
      console.log('✅ Filled email');
      
      // Fill in the password
      await page.fill('input[type="password"]', 'Stegner1');
      console.log('✅ Filled password');
      
      // Click the submit button
      await page.click('button[type="submit"]:has-text("Log In")');
      console.log('✅ Clicked login button');
      
      // Wait for navigation - the app should auto-select family and redirect to dashboard
      try {
        await page.waitForURL('**/dashboard**', { timeout: 30000 });
        console.log('✅ Successfully navigated to dashboard!');
      } catch (e) {
        console.log('⚠️ Did not auto-navigate to dashboard, checking for family selection...');
        
        // Check if we're on family selection screen
        if (page.url().includes('/login')) {
          // Look for family member cards
          await page.waitForSelector('.cursor-pointer', { timeout: 10000 });
          
          // Click the first family member (preferably Stefan)
          const stefanCard = page.locator('div:has-text("Stefan")').first();
          if (await stefanCard.isVisible()) {
            await stefanCard.click();
            console.log('✅ Selected Stefan from family members');
          } else {
            // Click the first available member
            await page.click('.cursor-pointer');
            console.log('✅ Selected first available family member');
          }
          
          // Wait for dashboard navigation
          await page.waitForURL('**/dashboard**', { timeout: 15000 });
          console.log('✅ Navigated to dashboard after family selection');
        }
      }
    } else if (currentUrl.includes('/dashboard')) {
      console.log('✅ Already logged in and on dashboard!');
    }
    
    // Save the authentication state
    const authDir = path.join(__dirname, '.auth');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
    
    // Save storage state
    await context.storageState({ path: path.join(authDir, 'user.json') });
    console.log('✅ Authentication state saved!');
    
    // Also save cookies and localStorage separately for debugging
    const cookies = await context.cookies();
    const localStorage = await page.evaluate(() => Object.entries(localStorage));
    
    fs.writeFileSync(
      path.join(authDir, 'auth-debug.json'), 
      JSON.stringify({ cookies, localStorage }, null, 2)
    );
    
    console.log('✅ Debug auth info saved');
    
    // Verify we're properly logged in
    const finalUrl = page.url();
    if (finalUrl.includes('/dashboard')) {
      console.log('✅ Successfully authenticated and on dashboard!');
      
      // Check for user dropdown to confirm we're fully loaded
      try {
        await page.waitForSelector('.user-dropdown-container', { timeout: 5000 });
        console.log('✅ User dropdown is visible - fully authenticated!');
      } catch (e) {
        console.log('⚠️ User dropdown not found, but we are on dashboard');
      }
    } else {
      console.log('⚠️ Final URL is not dashboard:', finalUrl);
    }
    
    // Keep the context alive for a moment to ensure state is saved
    await page.waitForTimeout(2000);
    
    // Close the context
    await context.close();
  });
});

// Also export a utility function to create authenticated context
module.exports.createAuthenticatedContext = async (browser) => {
  const authFile = path.join(__dirname, '.auth/user.json');
  
  if (fs.existsSync(authFile)) {
    return await browser.newContext({
      storageState: authFile
    });
  } else {
    console.log('No auth file found, creating new context');
    return await browser.newContext();
  }
};