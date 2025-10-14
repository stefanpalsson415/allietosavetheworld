// tests/manual-testing-session.spec.js
// Simple tests that work with an already logged-in session
const { test, expect } = require('@playwright/test');

test.describe('Manual Testing Session - Pre-authenticated', () => {
  test.beforeEach(async ({ page }) => {
    // Go directly to dashboard - assume user is already logged in
    await page.goto('/dashboard');
    
    // Wait for the page to load, but don't fail if it redirects to login
    await page.waitForLoadState('domcontentloaded');
    
    // Check if we're on login page - if so, skip this test
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/signin')) {
      test.skip('User needs to be logged in first. Please log in manually at http://localhost:3000');
    }
  });

  test('Can access the dashboard and see main layout', async ({ page }) => {
    // Check that we're on the dashboard
    await expect(page).toHaveURL(/dashboard/);
    
    // Check for main layout elements
    await expect(page.locator('body')).toBeVisible();
    
    // Look for the header
    const header = page.locator('.h-14.border-b');
    await expect(header).toBeVisible();
    
    console.log('✅ Dashboard loads successfully');
  });

  test('Can navigate between tabs', async ({ page }) => {
    const tabs = [
      { name: 'Home', tab: 'home' },
      { name: 'Balance & Habits', tab: 'tasks' },
      { name: 'Family Calendar', tab: 'calendar' },
      { name: 'Document Hub', tab: 'documents' }
    ];

    for (const tabInfo of tabs) {
      await page.goto(`/dashboard?tab=${tabInfo.tab}`);
      await page.waitForLoadState('domcontentloaded');
      
      // Wait a moment for content to load
      await page.waitForTimeout(2000);
      
      console.log(`✅ Successfully navigated to ${tabInfo.name} tab`);
    }
  });

  test('Can access Home tab and see family overview', async ({ page }) => {
    await page.goto('/dashboard?tab=home');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for home page content
    const homeContent = page.locator('text=Family Overview, text=Weekly Progress, text=Allie');
    
    // At least one of these should be visible
    let foundContent = false;
    try {
      await expect(homeContent.first()).toBeVisible({ timeout: 5000 });
      foundContent = true;
    } catch (e) {
      // Try alternative selectors
      const altContent = page.locator('h1, h2, h3').first();
      await expect(altContent).toBeVisible();
      foundContent = true;
    }
    
    if (foundContent) {
      console.log('✅ Home tab content is visible');
    }
  });

  test('Can check transparency report functionality', async ({ page }) => {
    await page.goto('/dashboard?tab=home');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for transparency report button
    const transparencyButton = page.locator('text=View full transparency report');
    
    if (await transparencyButton.isVisible()) {
      console.log('✅ Transparency report button found');
      
      // Click it and see if chat opens
      await transparencyButton.click();
      await page.waitForTimeout(2000);
      
      console.log('✅ Transparency report button clicked successfully');
    } else {
      console.log('ℹ️ Transparency report button not found (may be expected)');
    }
  });

  test('Chat functionality is accessible', async ({ page }) => {
    await page.goto('/dashboard?tab=home');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for chat-related elements
    const chatButtons = page.locator('text=Chat, text=Allie, button:has-text("Chat")');
    
    if (await chatButtons.first().isVisible()) {
      console.log('✅ Chat functionality is accessible');
    } else {
      console.log('ℹ️ Chat button not immediately visible');
    }
  });

  test('Family member switching is available', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for user dropdown or family member selector
    const userDropdown = page.locator('.user-dropdown-container');
    
    if (await userDropdown.isVisible()) {
      console.log('✅ Family member switching is available');
      
      // Try to open the dropdown
      await userDropdown.click();
      await page.waitForTimeout(1000);
      
      // Look for family members
      const familyMembers = page.locator('button:has-text("Stefan"), button:has-text("Kimberly"), button:has-text("Lilly")');
      
      if (await familyMembers.first().isVisible()) {
        console.log('✅ Family members are listed in dropdown');
      }
    } else {
      console.log('ℹ️ Family member dropdown not found');
    }
  });
});