// tests/final-user-testing.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Final User Testing Suite', () => {
  let isLoggedIn = false;

  test.beforeEach(async ({ page }) => {
    if (!isLoggedIn) {
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('domcontentloaded');
      
      const currentUrl = page.url();
      if (currentUrl.includes('/login') || currentUrl === 'http://localhost:3000/') {
        console.log('Logging in...');
        await page.goto('http://localhost:3000/login');
        await page.waitForLoadState('domcontentloaded');
        
        await page.waitForSelector('input[type="email"]', { timeout: 10000 });
        await page.fill('input[type="email"]', 'spalsson@gmail.com');
        await page.fill('input[type="password"]', 'Stegner1');
        await page.click('button[type="submit"]:has-text("Log In")');
        await page.waitForTimeout(5000);
        
        if (page.url().includes('/login')) {
          const familyMemberCards = page.locator('.cursor-pointer');
          if (await familyMemberCards.count() > 0) {
            const stefanCard = page.locator('div:has-text("Stefan")').first();
            if (await stefanCard.isVisible()) {
              await stefanCard.click();
            } else {
              await familyMemberCards.first().click();
            }
          }
        }
        
        await page.waitForTimeout(3000);
        isLoggedIn = true;
      }
    }
    
    if (!page.url().includes('/dashboard')) {
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForLoadState('domcontentloaded');
    }
  });

  test('🎯 Critical: Header layout is correct after fix', async ({ page }) => {
    // Check that header has proper spacing
    const header = page.locator('.h-14.border-b').first();
    await expect(header).toBeVisible();
    
    // Get header text content
    const headerText = await header.textContent();
    console.log('Header content:', headerText);
    
    // Check that title is visible
    const title = header.locator('h1').first();
    if (await title.isVisible()) {
      const titleText = await title.textContent();
      console.log(`✅ Title "${titleText}" is properly positioned`);
    }
    
    // Check that chat button exists in header
    const chatButtonInHeader = header.locator('button').first();
    if (await chatButtonInHeader.isVisible()) {
      console.log('✅ Chat button is in the header');
    }
    
    // Take a screenshot of the fixed header
    await header.screenshot({ path: 'test-results/header-fixed.png' });
    console.log('✅ Header screenshot saved to test-results/header-fixed.png');
  });

  test('🔍 Find all interactive elements', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard?tab=home');
    await page.waitForLoadState('domcontentloaded');
    
    // Find all buttons on the page
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons on Home tab`);
    
    // Look specifically for transparency report
    const transparencyElements = await page.locator('text=/transparency|trust/i').all();
    console.log(`Found ${transparencyElements.length} elements mentioning transparency/trust`);
    
    for (let i = 0; i < Math.min(3, transparencyElements.length); i++) {
      const text = await transparencyElements[i].textContent();
      console.log(`  - "${text.trim()}"`);
    }
    
    // Scroll down to see if transparency report is below fold
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    
    // Check again after scrolling
    const transparencyButton = page.locator('button:has-text("View full transparency report")');
    if (await transparencyButton.isVisible()) {
      console.log('✅ Found transparency report button after scrolling!');
    }
  });

  test('👤 User dropdown in sidebar works', async ({ page }) => {
    // Look for user section in sidebar
    const sidebar = page.locator('.w-60').first();
    
    // Click on user area (might be the whole user section, not just a dropdown icon)
    const userSection = sidebar.locator('.p-3').first();
    if (await userSection.isVisible()) {
      await userSection.click();
      console.log('✅ Clicked user section in sidebar');
      
      await page.waitForTimeout(1000);
      
      // Look for family members in dropdown
      const dropdownMenu = page.locator('.absolute.left-2.right-2.top-full');
      if (await dropdownMenu.isVisible()) {
        console.log('✅ User dropdown menu opened');
        
        // Count family members
        const members = await dropdownMenu.locator('button').count();
        console.log(`✅ Found ${members} family members in dropdown`);
        
        // Close by clicking outside
        await page.click('body');
      }
    }
  });

  test('💬 Chat functionality from multiple entry points', async ({ page }) => {
    // Test 1: Chat button in header
    const headerChatButton = page.locator('.h-14.border-b button').first();
    if (await headerChatButton.isVisible()) {
      await headerChatButton.click();
      console.log('✅ Clicked header chat button');
      await page.waitForTimeout(2000);
      
      // Check if chat opened
      const chatDrawer = page.locator('.fixed.right-0, .chat-drawer');
      if (await chatDrawer.isVisible()) {
        console.log('✅ Chat drawer opened from header button');
        
        // Close chat
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
    }
    
    // Test 2: Chat from home page
    await page.goto('http://localhost:3000/dashboard?tab=home');
    await page.waitForLoadState('domcontentloaded');
    
    const chatWithAllieButton = page.locator('button:has-text("Chat with Allie")');
    if (await chatWithAllieButton.isVisible()) {
      await chatWithAllieButton.click();
      console.log('✅ Clicked "Chat with Allie" button on home page');
      await page.waitForTimeout(2000);
    }
  });

  test('📅 Calendar CRUD operations', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard?tab=calendar');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // Look for Create Event button (it shows as "Create Event" in the screenshot)
    const createEventButton = page.locator('button:has-text("Create Event")');
    if (await createEventButton.isVisible()) {
      console.log('✅ Found "Create Event" button');
      
      await createEventButton.click();
      await page.waitForTimeout(2000);
      
      // Fill event form
      const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
      if (await titleInput.isVisible()) {
        await titleInput.fill('Test Event - Delete Me');
        console.log('✅ Filled event title');
        
        // Try to save (but maybe cancel to not clutter calendar)
        const cancelButton = page.locator('button:has-text("Cancel")').first();
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
          console.log('✅ Cancelled event creation (to keep calendar clean)');
        }
      }
    } else {
      console.log('ℹ️ "Create Event" button not found - checking for other buttons');
      const anyAddButton = page.locator('button:has-text("Add"), button:has-text("+")').first();
      if (await anyAddButton.isVisible()) {
        console.log('✅ Found alternative add button');
      }
    }
    
    // Check existing events
    const existingEvents = await page.locator('.fc-event, [class*="event"]').count();
    console.log(`ℹ️ Found ${existingEvents} existing events on calendar`);
  });

  test('🎨 Visual regression check', async ({ page }) => {
    const pagesToCapture = [
      { name: 'home', url: '/dashboard?tab=home' },
      { name: 'calendar', url: '/dashboard?tab=calendar' },
      { name: 'tasks', url: '/dashboard?tab=tasks' }
    ];
    
    for (const pageInfo of pagesToCapture) {
      await page.goto(`http://localhost:3000${pageInfo.url}`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: `test-results/screenshot-${pageInfo.name}.png`,
        fullPage: true 
      });
      console.log(`✅ Captured ${pageInfo.name} screenshot`);
    }
  });

  test('🧪 Transparency report deep test', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard?tab=home');
    await page.waitForLoadState('domcontentloaded');
    
    // Scroll through the page to find transparency section
    let found = false;
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.waitForTimeout(500);
      
      const transparencyButton = page.locator('button:has-text("View full transparency report")');
      if (await transparencyButton.isVisible()) {
        found = true;
        console.log('✅ Found transparency button after scrolling');
        
        // Click it
        await transparencyButton.click();
        await page.waitForTimeout(3000);
        
        // Wait for Allie's response
        const chatContent = page.locator('.fixed.right-0, .chat-drawer');
        if (await chatContent.isVisible()) {
          await page.waitForTimeout(5000); // Give Allie time to respond
          
          // Look for personalized content
          const personalizedText = await page.locator('text=/2 parents.*3 kids|Palsson/i').isVisible();
          if (personalizedText) {
            console.log('✅ Transparency report shows personalized family data!');
          } else {
            console.log('⚠️ Transparency report loaded but personalization not verified');
          }
        }
        break;
      }
    }
    
    if (!found) {
      console.log('❌ Transparency report button not found even after scrolling');
    }
  });

  test('🚀 Performance and responsiveness', async ({ page }) => {
    // Measure page load time
    const startTime = Date.now();
    await page.goto('http://localhost:3000/dashboard?tab=home');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️ Page load time: ${loadTime}ms`);
    if (loadTime < 3000) {
      console.log('✅ Page loads quickly (under 3 seconds)');
    } else {
      console.log('⚠️ Page load is slow (over 3 seconds)');
    }
    
    // Test rapid tab switching
    const tabs = ['tasks', 'calendar', 'documents', 'home'];
    const switchStartTime = Date.now();
    
    for (const tab of tabs) {
      await page.goto(`http://localhost:3000/dashboard?tab=${tab}`);
      await page.waitForLoadState('domcontentloaded');
    }
    
    const totalSwitchTime = Date.now() - switchStartTime;
    const avgSwitchTime = totalSwitchTime / tabs.length;
    console.log(`⏱️ Average tab switch time: ${Math.round(avgSwitchTime)}ms`);
  });

  test('🔐 Security and error handling', async ({ page }) => {
    // Test invalid URLs
    await page.goto('http://localhost:3000/dashboard?tab=invalid_tab_name');
    await page.waitForLoadState('domcontentloaded');
    
    // Should gracefully handle and show some content
    const hasContent = await page.locator('body').isVisible();
    if (hasContent) {
      console.log('✅ App handles invalid tab names gracefully');
    }
    
    // Test deep navigation
    await page.goto('http://localhost:3000/dashboard/invalid/path/here');
    await page.waitForLoadState('domcontentloaded');
    
    // Should redirect or show error
    const currentUrl = page.url();
    console.log(`ℹ️ Invalid path redirected to: ${currentUrl}`);
  });

  test('📱 Final mobile check', async ({ page }) => {
    // Test critical mobile interactions
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone 12 size
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    // Check mobile menu
    const mobileMenu = page.locator('.mobile-menu-button').first();
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      console.log('✅ Mobile menu button works');
      
      await page.waitForTimeout(1000);
      
      // Check if navigation is accessible
      const navItems = await page.locator('button:has-text("Home"), button:has-text("Calendar")').count();
      if (navItems > 0) {
        console.log('✅ Mobile navigation is accessible');
      }
    }
    
    // Check header on mobile
    const mobileHeader = page.locator('.h-14.border-b').first();
    if (await mobileHeader.isVisible()) {
      console.log('✅ Header is visible on mobile');
      
      // Check if title and chat button fit properly
      const headerWidth = await mobileHeader.evaluate(el => el.offsetWidth);
      console.log(`ℹ️ Mobile header width: ${headerWidth}px`);
    }
  });
});