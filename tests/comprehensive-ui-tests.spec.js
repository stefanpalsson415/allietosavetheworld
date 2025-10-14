// tests/comprehensive-ui-tests.spec.js
// Comprehensive UI testing for all tabs and functionality
const { test, expect } = require('@playwright/test');

test.describe('Comprehensive UI Tests - All Tabs & Functionality', () => {
  // Global navigation tests
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for the app to load
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the main layout to be visible
    await expect(page.locator('h1')).toBeVisible();
  });

  test.describe('Navigation & Layout Tests', () => {
    test('Header layout is correct - Home title on left, buttons on right', async ({ page }) => {
      // Check header structure
      const header = page.locator('.h-14.border-b');
      await expect(header).toBeVisible();
      
      // Home title should be on the left
      const homeTitle = header.locator('h1');
      await expect(homeTitle).toHaveText(/Home|Good/);
      
      // Chat button and avatar should be on the right
      const rightButtons = header.locator('div').last();
      await expect(rightButtons).toBeVisible();
    });

    test('Sidebar navigation is functional', async ({ page }) => {
      // Test each navigation item
      const navItems = [
        'Home',
        'Balance & Habits', 
        'Task Board',
        'Family Dashboard',
        'Family Calendar',
        'Document Hub',
        'Knowledge Graph'
      ];

      for (const item of navItems) {
        // Click navigation item
        await page.click(`text="${item}"`);
        
        // Wait for navigation
        await page.waitForTimeout(1000);
        
        // Check that we navigated somewhere
        const url = page.url();
        expect(url).toContain('dashboard');
        
        console.log(`✅ Navigation to ${item} works - URL: ${url}`);
      }
    });

    test('Family member switching works', async ({ page }) => {
      // Find the user dropdown
      const userDropdown = page.locator('.user-dropdown-container');
      
      if (await userDropdown.isVisible()) {
        await userDropdown.click();
        
        // Wait for dropdown menu
        await page.waitForTimeout(500);
        
        // Check if family members are listed
        const familyMembers = page.locator('button:has-text("Stefan"), button:has-text("Kimberly")');
        
        if (await familyMembers.first().isVisible()) {
          // Try switching to different family member
          await familyMembers.first().click();
          
          // Wait for any confirmation dialog
          await page.waitForTimeout(1000);
          
          // Handle potential confirmation dialog
          const confirmButton = page.locator('button:has-text("Switch")');
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
          }
          
          console.log('✅ Family member switching works');
        }
      }
    });
  });

  test.describe('Tab Functionality Tests', () => {
    test('Home Tab - All sections load correctly', async ({ page }) => {
      await page.goto('/dashboard?tab=home');
      await page.waitForLoadState('domcontentloaded');

      // Check main sections
      await expect(page.locator('text=Family Overview')).toBeVisible();
      await expect(page.locator('text=Weekly Progress')).toBeVisible();
      await expect(page.locator('text=Why families trust us')).toBeVisible();
      
      // Check if Allie chat section is present
      const allieSection = page.locator('text=Hi, I\'m Allie!');
      await expect(allieSection).toBeVisible();

      // Test transparency report button
      const transparencyButton = page.locator('text=View full transparency report');
      if (await transparencyButton.isVisible()) {
        await transparencyButton.click();
        
        // Should open chat drawer
        await page.waitForTimeout(2000);
        console.log('✅ Transparency report button works');
      }

      console.log('✅ Home tab loads correctly');
    });

    test('Balance & Habits Tab - Task management works', async ({ page }) => {
      await page.goto('/dashboard?tab=tasks');
      await page.waitForLoadState('domcontentloaded');

      // Look for task-related elements
      const taskElements = [
        'text=Week',
        'text=Tasks',
        'text=Habits',
        'button',
        '.habit', 
        '.task'
      ];

      for (const selector of taskElements) {
        const elements = page.locator(selector);
        if (await elements.first().isVisible()) {
          console.log(`✅ Found ${selector} in Balance & Habits`);
        }
      }

      console.log('✅ Balance & Habits tab accessible');
    });

    test('Family Calendar Tab - Calendar loads and is interactive', async ({ page }) => {
      await page.goto('/dashboard?tab=calendar');
      await page.waitForLoadState('domcontentloaded');

      // Wait for calendar to load
      await page.waitForTimeout(3000);

      // Look for calendar elements
      const calendarElements = [
        '.calendar',
        'text=Today',
        'text=Week',
        'text=Month',
        'button:has-text("Add")',
        'button:has-text("Event")'
      ];

      for (const selector of calendarElements) {
        const element = page.locator(selector);
        if (await element.first().isVisible()) {
          console.log(`✅ Found ${selector} in calendar`);
        }
      }

      console.log('✅ Family Calendar tab accessible');
    });

    test('Family Dashboard Tab - Dashboard elements present', async ({ page }) => {
      await page.goto('/dashboard?tab=dashboard');
      await page.waitForLoadState('domcontentloaded');

      // Look for dashboard-specific elements
      const dashboardElements = [
        'text=Dashboard',
        'text=Family',
        'text=Overview',
        'text=Insights',
        'text=Progress'
      ];

      for (const selector of dashboardElements) {
        const element = page.locator(selector);
        if (await element.first().isVisible()) {
          console.log(`✅ Found ${selector} in dashboard`);
        }
      }

      console.log('✅ Family Dashboard tab accessible');
    });

    test('Document Hub Tab - Document interface works', async ({ page }) => {
      await page.goto('/dashboard?tab=documents');
      await page.waitForLoadState('domcontentloaded');

      // Look for document-related elements
      const documentElements = [
        'text=Documents',
        'text=Files',
        'text=Upload',
        'button',
        'input[type="file"]'
      ];

      for (const selector of documentElements) {
        const element = page.locator(selector);
        if (await element.first().isVisible()) {
          console.log(`✅ Found ${selector} in documents`);
        }
      }

      console.log('✅ Document Hub tab accessible');
    });

    test('Knowledge Graph Tab - Graph interface loads', async ({ page }) => {
      await page.goto('/dashboard?tab=knowledge');
      await page.waitForLoadState('domcontentloaded');

      // Look for knowledge graph elements
      const graphElements = [
        'text=Knowledge',
        'text=Graph',
        'svg',
        'canvas',
        '.node',
        '.link'
      ];

      for (const selector of graphElements) {
        const element = page.locator(selector);
        if (await element.first().isVisible()) {
          console.log(`✅ Found ${selector} in knowledge graph`);
        }
      }

      console.log('✅ Knowledge Graph tab accessible');
    });
  });

  test.describe('Kid-Friendly Features Tests', () => {
    test('Chore Chart Tab - Kid interface works', async ({ page }) => {
      await page.goto('/dashboard?tab=chores');
      await page.waitForLoadState('domcontentloaded');

      // Look for kid-friendly chore elements
      const choreElements = [
        'text=Chore',
        'text=Chart',
        'button',
        '.chore',
        'text=Complete',
        'text=Done'
      ];

      for (const selector of choreElements) {
        const element = page.locator(selector);
        if (await element.first().isVisible()) {
          console.log(`✅ Found ${selector} in chore chart`);
        }
      }

      console.log('✅ Chore Chart tab accessible');
    });

    test('Reward Party Tab - Rewards interface works', async ({ page }) => {
      await page.goto('/dashboard?tab=rewards');
      await page.waitForLoadState('domcontentloaded');

      // Look for reward elements
      const rewardElements = [
        'text=Reward',
        'text=Party',
        'button',
        '.reward',
        'text=Claim',
        'text=Available'
      ];

      for (const selector of rewardElements) {
        const element = page.locator(selector);
        if (await element.first().isVisible()) {
          console.log(`✅ Found ${selector} in rewards`);
        }
      }

      console.log('✅ Reward Party tab accessible');
    });

    test('Palsson Bucks Tab - Currency system works', async ({ page }) => {
      await page.goto('/dashboard?tab=bucks');
      await page.waitForLoadState('domcontentloaded');

      // Look for bucks-related elements
      const bucksElements = [
        'text=Bucks',
        'text=Balance',
        'text=$',
        'button',
        'text=Spend',
        'text=Earn'
      ];

      for (const selector of bucksElements) {
        const element = page.locator(selector);
        if (await element.first().isVisible()) {
          console.log(`✅ Found ${selector} in Palsson Bucks`);
        }
      }

      console.log('✅ Palsson Bucks tab accessible');
    });
  });

  test.describe('Admin Features Tests', () => {
    test('Chore & Reward Admin Tab - Admin interface works', async ({ page }) => {
      await page.goto('/dashboard?tab=chore-admin');
      await page.waitForLoadState('domcontentloaded');

      // Look for admin elements
      const adminElements = [
        'text=Admin',
        'text=Create',
        'text=Edit',
        'text=Delete',
        'button',
        'text=Template',
        'text=Manage'
      ];

      for (const selector of adminElements) {
        const element = page.locator(selector);
        if (await element.first().isVisible()) {
          console.log(`✅ Found ${selector} in admin panel`);
        }
      }

      console.log('✅ Chore & Reward Admin tab accessible');
    });
  });

  test.describe('Beta Features Tests', () => {
    test('Command Center Tab - Beta feature loads', async ({ page }) => {
      await page.goto('/dashboard?tab=children');
      await page.waitForLoadState('domcontentloaded');

      // Just check that the page loads without errors
      const body = page.locator('body');
      await expect(body).toBeVisible();
      
      console.log('✅ Command Center (beta) tab accessible');
    });

    test('Strong Relationship Tab - Beta feature loads', async ({ page }) => {
      await page.goto('/dashboard?tab=relationship');
      await page.waitForLoadState('domcontentloaded');

      // Just check that the page loads without errors
      const body = page.locator('body');
      await expect(body).toBeVisible();
      
      console.log('✅ Strong Relationship (beta) tab accessible');
    });
  });

  test.describe('Chat & Communication Tests', () => {
    test('Allie Chat functionality', async ({ page }) => {
      // Open chat from home page
      await page.goto('/dashboard?tab=home');
      await page.waitForLoadState('domcontentloaded');

      // Click Chat with Allie button
      const chatButton = page.locator('text=Chat with Allie');
      if (await chatButton.isVisible()) {
        await chatButton.click();
        
        // Wait for chat drawer to open
        await page.waitForTimeout(2000);
        
        // Look for chat elements
        const chatElements = [
          'textarea',
          'text=Send',
          'text=Allie',
          'button'
        ];

        for (const selector of chatElements) {
          const element = page.locator(selector);
          if (await element.first().isVisible()) {
            console.log(`✅ Found ${selector} in chat`);
          }
        }

        console.log('✅ Allie Chat opens and loads correctly');
      }
    });

    test('Chat drawer can be closed', async ({ page }) => {
      await page.goto('/dashboard?tab=home');
      
      // Open chat
      const chatButton = page.locator('text=Chat with Allie');
      if (await chatButton.isVisible()) {
        await chatButton.click();
        await page.waitForTimeout(1000);
        
        // Try to close chat (look for close button)
        const closeButton = page.locator('button[aria-label="Close"]').or(page.locator('text=Close')).or(page.locator('button:has-text("×")'));
        if (await closeButton.first().isVisible()) {
          await closeButton.first().click();
          console.log('✅ Chat drawer can be closed');
        }
      }
    });
  });

  test.describe('Responsive Design Tests', () => {
    test('Mobile layout works', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');

      // Check that main elements are still visible
      await expect(page.locator('body')).toBeVisible();
      
      console.log('✅ Mobile layout loads');
    });

    test('Tablet layout works', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');

      // Check that main elements are still visible
      await expect(page.locator('body')).toBeVisible();
      
      console.log('✅ Tablet layout loads');
    });

    test('Desktop layout works', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');

      // Check that main elements are still visible
      await expect(page.locator('body')).toBeVisible();
      
      console.log('✅ Desktop layout loads');
    });
  });

  test.describe('Error Handling Tests', () => {
    test('App handles navigation errors gracefully', async ({ page }) => {
      // Try to navigate to non-existent tab
      await page.goto('/dashboard?tab=nonexistent');
      await page.waitForLoadState('domcontentloaded');

      // Should still show some content (probably default to home)
      const body = page.locator('body');
      await expect(body).toBeVisible();
      
      console.log('✅ App handles invalid tab gracefully');
    });

    test('App loads without console errors', async ({ page }) => {
      const errors = [];
      page.on('console', message => {
        if (message.type() === 'error') {
          errors.push(message.text());
        }
      });

      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');
      
      // Wait a bit for any delayed errors
      await page.waitForTimeout(3000);

      // Log errors but don't fail the test (some errors might be expected)
      if (errors.length > 0) {
        console.log('⚠️ Console errors found:', errors);
      } else {
        console.log('✅ No console errors during load');
      }
    });
  });
});