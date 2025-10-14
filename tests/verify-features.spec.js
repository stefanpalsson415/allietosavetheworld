// tests/verify-features.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Verify Key Features', () => {
  test('Complete feature verification with proper login', async ({ page }) => {
    console.log('\n🔐 LOGGING IN...');
    
    // Go to login page directly
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('domcontentloaded');
    
    // Fill login form
    await page.fill('input[type="email"]', 'spalsson@gmail.com');
    await page.fill('input[type="password"]', 'Stegner1');
    await page.click('button[type="submit"]:has-text("Log In")');
    
    console.log('✅ Submitted login form');
    
    // Wait for navigation or family selection
    await page.waitForTimeout(5000);
    
    // If still on login page, select family member
    if (page.url().includes('/login')) {
      console.log('📋 Selecting family member...');
      const stefanCard = page.locator('div:has-text("Stefan")').first();
      if (await stefanCard.isVisible()) {
        await stefanCard.click();
        console.log('✅ Selected Stefan');
      } else {
        await page.locator('.cursor-pointer').first().click();
        console.log('✅ Selected first family member');
      }
      await page.waitForTimeout(3000);
    }
    
    // Now verify we're on dashboard
    const currentUrl = page.url();
    console.log(`\n📍 Current URL: ${currentUrl}`);
    
    if (!currentUrl.includes('/dashboard')) {
      console.log('❌ Not on dashboard, trying direct navigation...');
      await page.goto('http://localhost:3000/dashboard?tab=home');
      await page.waitForLoadState('domcontentloaded');
    }
    
    console.log('\n🏠 CHECKING HOME TAB CONTENT:');
    console.log('=' .repeat(50));
    
    // Wait for content to load
    await page.waitForTimeout(3000);
    
    // Get page content
    const pageContent = await page.locator('body').textContent();
    
    // Check for key elements
    const checks = [
      { name: 'User name in sidebar', search: 'Stefan' },
      { name: 'Family name', search: 'Palsson Family' },
      { name: 'Navigation items', search: 'Balance & Habits' },
      { name: 'Home content', search: 'Home' }
    ];
    
    for (const check of checks) {
      const found = pageContent.includes(check.search);
      console.log(`${check.name}: ${found ? '✅ Found' : '❌ Not found'}`);
    }
    
    // Look for the PersonalizedHomePage content
    console.log('\n🔍 LOOKING FOR TRUST SECTION:');
    
    // Get all elements that might contain "trust" or "transparency"
    const allElements = await page.locator('*').all();
    let foundTrustSection = false;
    
    for (const element of allElements) {
      try {
        const text = await element.textContent({ timeout: 100 });
        if (text && (text.includes('trust') || text.includes('transparency'))) {
          const tagName = await element.evaluate(el => el.tagName);
          if (tagName !== 'SCRIPT' && tagName !== 'STYLE') {
            console.log(`Found in ${tagName}: "${text.substring(0, 100)}..."`);
            foundTrustSection = true;
          }
        }
      } catch (e) {
        // Element might have been removed, continue
      }
    }
    
    if (!foundTrustSection) {
      console.log('❌ No trust/transparency section found');
      
      // Take screenshot to see what's actually on the page
      await page.screenshot({ 
        path: 'test-results/actual-home-content.png',
        fullPage: true 
      });
      console.log('📸 Screenshot saved to: test-results/actual-home-content.png');
    }
    
    // Try each tab to see what content loads
    console.log('\n📑 CHECKING ALL TABS:');
    
    const tabs = [
      { name: 'Home', url: 'home' },
      { name: 'Balance & Habits', url: 'tasks' },
      { name: 'Family Calendar', url: 'calendar' },
      { name: 'Document Hub', url: 'documents' }
    ];
    
    for (const tab of tabs) {
      await page.goto(`http://localhost:3000/dashboard?tab=${tab.url}`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      
      const h1 = await page.locator('h1').first().textContent();
      console.log(`${tab.name} - H1 title: "${h1}"`);
    }
  });
});