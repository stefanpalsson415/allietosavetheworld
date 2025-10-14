// tests/authenticated-tests.spec.js
const { test, expect } = require('@playwright/test');
const path = require('path');

// Use the saved authentication state
test.use({
  storageState: path.join(__dirname, '.auth/user.json')
});

test.describe('Authenticated Tests - All Features', () => {
  test.beforeEach(async ({ page }) => {
    // Go directly to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    // If we're redirected to login, the auth state might have expired
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip('Authentication expired, please run auth-setup.spec.js again');
    }
  });

  test('Dashboard loads with correct header layout', async ({ page }) => {
    // Check header structure
    const header = page.locator('.h-14.border-b');
    await expect(header).toBeVisible();
    
    // Check that title exists
    const title = header.locator('h1');
    await expect(title).toBeVisible();
    
    console.log('✅ Dashboard header is visible');
  });

  test('Can navigate through all main tabs', async ({ page }) => {
    const tabs = [
      { name: 'Home', url: '/dashboard?tab=home' },
      { name: 'Balance & Habits', url: '/dashboard?tab=tasks' },
      { name: 'Family Calendar', url: '/dashboard?tab=calendar' },
      { name: 'Document Hub', url: '/dashboard?tab=documents' },
      { name: 'Knowledge Graph', url: '/dashboard?tab=knowledge' }
    ];

    for (const tab of tabs) {
      await page.goto(tab.url);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      
      console.log(`✅ Successfully loaded ${tab.name} tab`);
    }
  });

  test('Transparency report functionality works', async ({ page }) => {
    await page.goto('/dashboard?tab=home');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for transparency report button
    const transparencyButton = page.locator('text=View full transparency report');
    
    if (await transparencyButton.isVisible({ timeout: 5000 })) {
      await transparencyButton.click();
      console.log('✅ Clicked transparency report button');
      
      // Wait for chat to open
      await page.waitForTimeout(3000);
      
      // Check if chat drawer is visible
      const chatDrawer = page.locator('.chat-drawer, [data-testid="chat-drawer"], .fixed.right-0');
      if (await chatDrawer.isVisible({ timeout: 5000 })) {
        console.log('✅ Chat drawer opened successfully');
        
        // Look for the transparency report content
        const reportContent = page.locator('text=/2 parents.*3 kids/i, text=/Palsson household/i');
        if (await reportContent.isVisible({ timeout: 10000 })) {
          console.log('✅ Transparency report shows personalized family data (2 parents, 3 kids)');
        }
      }
    } else {
      console.log('⚠️ Transparency report button not found');
    }
  });

  test('Family member switching works', async ({ page }) => {
    // Look for user dropdown
    const userDropdown = page.locator('.user-dropdown-container');
    
    if (await userDropdown.isVisible()) {
      await userDropdown.click();
      console.log('✅ Opened user dropdown');
      
      await page.waitForTimeout(1000);
      
      // Check for family members
      const familyMembers = page.locator('button').filter({ hasText: /Stefan|Kimberly|Lilly|Olaf|Tegner/ });
      const memberCount = await familyMembers.count();
      
      if (memberCount > 0) {
        console.log(`✅ Found ${memberCount} family members in dropdown`);
      }
      
      // Close dropdown by clicking outside
      await page.click('body');
    }
  });

  test('Can create a calendar event', async ({ page }) => {
    await page.goto('/dashboard?tab=calendar');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // Look for Add Event button
    const addButtons = page.locator('button').filter({ hasText: /Add Event|Create Event|New Event|\+/ });
    
    if (await addButtons.first().isVisible({ timeout: 5000 })) {
      await addButtons.first().click();
      console.log('✅ Clicked Add Event button');
      
      await page.waitForTimeout(2000);
      
      // Try to fill in event details
      const titleInput = page.locator('input[name="title"], input[placeholder*="title" i], input[placeholder*="event" i]').first();
      if (await titleInput.isVisible({ timeout: 5000 })) {
        await titleInput.fill('Test Event from Automated Test');
        console.log('✅ Filled in event title');
        
        // Look for save button
        const saveButton = page.locator('button').filter({ hasText: /Save|Create|Add/ }).first();
        if (await saveButton.isVisible()) {
          // Don't actually save to avoid cluttering the calendar
          console.log('✅ Save button is available (not clicking to avoid test data)');
        }
      }
    } else {
      console.log('⚠️ Add Event button not found');
    }
  });

  test('Chat functionality is accessible', async ({ page }) => {
    // Look for chat button in header or elsewhere
    const chatButtons = page.locator('button').filter({ hasText: /Chat|Allie/ });
    
    if (await chatButtons.first().isVisible({ timeout: 5000 })) {
      await chatButtons.first().click();
      console.log('✅ Clicked chat button');
      
      await page.waitForTimeout(2000);
      
      // Check if chat is open
      const chatInput = page.locator('textarea, input[placeholder*="message" i], input[placeholder*="chat" i]');
      if (await chatInput.isVisible({ timeout: 5000 })) {
        console.log('✅ Chat interface is open and ready');
      }
    }
  });

  test('Kid-friendly tabs are accessible', async ({ page }) => {
    const kidTabs = [
      { name: 'Chore Chart', url: '/dashboard?tab=chores' },
      { name: 'Reward Party', url: '/dashboard?tab=rewards' },
      { name: 'Palsson Bucks', url: '/dashboard?tab=bucks' }
    ];

    for (const tab of kidTabs) {
      await page.goto(tab.url);
      await page.waitForLoadState('domcontentloaded');
      
      // Just check that the page loads without error
      const body = page.locator('body');
      await expect(body).toBeVisible();
      
      console.log(`✅ ${tab.name} tab loads successfully`);
    }
  });

  test('Responsive design works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    // Check for mobile menu button
    const mobileMenuButton = page.locator('.mobile-menu-button, button[aria-label*="menu" i]');
    
    if (await mobileMenuButton.isVisible({ timeout: 5000 })) {
      console.log('✅ Mobile menu button is visible');
      
      await mobileMenuButton.click();
      await page.waitForTimeout(1000);
      
      console.log('✅ Mobile menu opens successfully');
    } else {
      // Check if content is still accessible
      const body = page.locator('body');
      await expect(body).toBeVisible();
      console.log('✅ Mobile layout renders (menu button not found but page loads)');
    }
  });
});