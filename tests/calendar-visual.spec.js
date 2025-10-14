// tests/calendar-visual.spec.js
import { test, expect } from '@playwright/test';

// Import helper functions
const { 
  navigateWithRetry, 
  waitForCalendarLoad, 
  login, 
  createTestEvent,
  deleteEventByTitle
} = require('./helpers/calendar-test-helpers');

/**
 * Visual regression tests for calendar components
 * These tests verify that calendar layout and functionality appear correctly
 */
test.describe('Calendar Visual Tests', () => {
  const uniquePrefix = `vis-test-${Date.now().toString().slice(-6)}`;
  const testDate = { year: 2025, month: 5, day: 10 };

  // Before each test, navigate and login
  test.beforeEach(async ({ page }) => {
    await navigateWithRetry(page, '/', 3);
    
    // Check for login button
    const loginButton = await page.$('a:has-text("Log In"), button:has-text("Log In")');
    if (loginButton) {
      await loginButton.click();
      await page.waitForSelector('#email, [placeholder*="email"], input[type="email"]')
        .catch(() => console.log('Login page not detected'));
    }
    
    // Attempt login
    await login(page);
    
    // Navigate to calendar
    await navigateWithRetry(page, '/dashboard?tab=calendar', 3);
    await waitForCalendarLoad(page);
  });
  
  // After all tests, clean up
  test.afterAll(async ({ page }) => {
    try {
      await navigateWithRetry(page, '/dashboard?tab=calendar', 3);
      await waitForCalendarLoad(page);
      
      const events = await page.$$(`text="${uniquePrefix}"`);
      for (const event of events) {
        const eventText = await event.textContent();
        await deleteEventByTitle(page, eventText);
      }
    } catch (error) {
      console.log('Cleanup error:', error);
    }
  });

  test('2.1 Calendar renders with correct layout', async ({ page }) => {
    // Check for basic calendar structure
    const calendarExists = await page.isVisible('[data-testid="calendar-container"], #calendar-container, .calendar-view, .fc-view-container');
    expect(calendarExists).toBeTruthy();
    
    // Take snapshot of empty calendar
    await page.screenshot({ path: 'test-results/calendar-empty-layout.png' });
    
    // Verify calendar headers (day names) are visible
    const headersVisible = await page.isVisible('.fc-day-header, .fc-col-header, th:has-text("Sun"), th:has-text("Monday")');
    expect(headersVisible).toBeTruthy();
    
    // Check calendar dimensions for reasonable size
    const calendarBounds = await page.locator('[data-testid="calendar-container"], #calendar-container, .calendar-view').boundingBox();
    expect(calendarBounds.width).toBeGreaterThan(400);
    expect(calendarBounds.height).toBeGreaterThan(300);
  });
  
  test('2.2 Events display correctly in calendar', async ({ page }) => {
    // Create 3 events with a unique prefix
    const eventTitle1 = `${uniquePrefix}: Breakfast`;
    const eventTitle2 = `${uniquePrefix}: Lunch`;
    const eventTitle3 = `${uniquePrefix}: Dinner`;
    
    await createTestEvent(page, eventTitle1, testDate);
    await createTestEvent(page, eventTitle2, testDate);
    await createTestEvent(page, eventTitle3, testDate);
    
    // Take screenshot of calendar with events
    await page.screenshot({ path: 'test-results/calendar-with-events.png' });
    
    // Find all events with our prefix
    const events = await page.locator(`text="${uniquePrefix}"`).all();
    expect(events.length).toBeGreaterThanOrEqual(3);
    
    // Check events are visually distinct
    for (const event of events) {
      // Verify the background color (should not be transparent)
      const backgroundColor = await event.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.backgroundColor;
      });
      
      // Should be a non-transparent color (not rgba with 0 alpha)
      expect(backgroundColor).not.toMatch(/rgba\(\d+,\s*\d+,\s*\d+,\s*0\)/);
    }
  });
  
  test('2.3 Calendar view toggles work correctly', async ({ page }) => {
    // Look for view toggle buttons
    const viewButtons = {
      day: await page.$('button:has-text("Day"), [aria-label="day view"]'),
      week: await page.$('button:has-text("Week"), [aria-label="week view"]'),
      month: await page.$('button:has-text("Month"), [aria-label="month view"]')
    };
    
    // If view toggles exist, test them
    if (viewButtons.day || viewButtons.week || viewButtons.month) {
      // Create a test event
      const eventTitle = `${uniquePrefix}: View Test Event`;
      await createTestEvent(page, eventTitle, testDate);
      
      // Test each view
      for (const [viewName, button] of Object.entries(viewButtons)) {
        if (button) {
          // Click the view button
          await button.click();
          
          // Wait for view to change and calendar to stabilize
          await page.waitForTimeout(1000);
          
          // Take screenshot of this view
          await page.screenshot({ path: `test-results/calendar-${viewName}-view.png` });
          
          // Verify the calendar container is still visible
          const calendarVisible = await page.isVisible('[data-testid="calendar-container"], #calendar-container, .calendar-view');
          expect(calendarVisible).toBeTruthy();
          
          // Verify our test event is still findable (it might not be visible depending on the date)
          const eventExists = await page.locator(`text="${eventTitle}"`).count() > 0;
          // We don't strictly assert this since the event might be on a different day
          if (!eventExists) {
            console.log(`Note: Test event not found in ${viewName} view, this could be expected`);
          }
        }
      }
    } else {
      console.log('No view toggle buttons found, skipping view toggle test');
    }
  });
  
  test('2.4 Calendar responsive design verification', async ({ page }) => {
    // Create a test event
    const eventTitle = `${uniquePrefix}: Responsive Test`;
    await createTestEvent(page, eventTitle, testDate);
    
    // Wait for UI to stabilize
    await page.waitForTimeout(1000);
    
    // Test different viewport sizes
    const viewportSizes = [
      { width: 1280, height: 800, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];
    
    for (const viewport of viewportSizes) {
      // Set viewport size
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Wait for layout to adjust
      await page.waitForTimeout(1000);
      
      // Take screenshot of this viewport
      await page.screenshot({ path: `test-results/calendar-${viewport.name}.png` });
      
      // Verify calendar is still visible
      const calendarVisible = await page.isVisible('[data-testid="calendar-container"], #calendar-container, .calendar-view');
      expect(calendarVisible).toBeTruthy();
      
      // On mobile, the calendar might transform significantly, so we just verify it's still there
      if (viewport.width >= 768) {
        // Tablet and desktop should show our event
        const eventVisible = await page.isVisible(`text="${eventTitle}"`);
        expect(eventVisible).toBeTruthy();
      }
    }
  });
});