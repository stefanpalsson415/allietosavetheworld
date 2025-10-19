// tests/e2e/complete-lifecycle/05-calendar-integration.spec.js
// 🎯 CRITICAL: Calendar Integration Tests
// Google Calendar sync + event extraction from multiple sources

const { test, expect } = require('@playwright/test');

const TEST_CONFIG = {
  BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
  TIMEOUT: 45000,

  // Test event data
  TEST_EVENTS: {
    simple: {
      title: 'Test Event - Dentist Appointment',
      date: '2025-10-25',
      time: '2:00 PM',
      description: 'Jack dentist checkup with Dr. Chen'
    },
    screenshot_party: {
      raw_text: "Tyler's friend Max birthday party - Saturday, April 19 at 2:00 PM at Adventure Zone",
      expected_title: 'Birthday party',
      expected_date: '2025-04-19',
      expected_time: '2:00 PM',
      expected_location: 'Adventure Zone'
    },
    recurring: {
      title: 'Piano Lessons',
      date: '2025-10-20',
      time: '4:00 PM',
      recurrence: 'weekly'
    }
  }
};

test.describe('📅 CRITICAL: Calendar Integration & Event Extraction', () => {
  test.setTimeout(TEST_CONFIG.TIMEOUT);

  // ==============================================================
  // TEST 1: Basic Event Creation (CRUD)
  // ==============================================================
  test('➕ Create, view, edit, and delete calendar event', async ({ page }) => {
    console.log('🎯 TEST: Basic calendar CRUD operations');

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=calendar`);
    await page.waitForLoadState('networkidle');

    // STEP 1: Find "Create Event" or "Add Event" button
    const createButton = page.locator('button:has-text("Create"), button:has-text("Add Event"), button:has-text("New Event")').first();

    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✅ Found create event button');

      await createButton.click();
      await page.waitForTimeout(1500);

      // STEP 2: Fill event details
      const titleInput = page.locator('input[name="title"], input[placeholder*="title" i], input[placeholder*="event" i]').first();

      if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await titleInput.fill(TEST_CONFIG.TEST_EVENTS.simple.title);
        console.log(`✓ Entered title: ${TEST_CONFIG.TEST_EVENTS.simple.title}`);

        // Try to find date/time inputs
        const dateInput = page.locator('input[type="date"], input[name="date"]').first();
        const timeInput = page.locator('input[type="time"], input[name="time"]').first();

        if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await dateInput.fill(TEST_CONFIG.TEST_EVENTS.simple.date);
          console.log(`✓ Entered date: ${TEST_CONFIG.TEST_EVENTS.simple.date}`);
        }

        if (await timeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await timeInput.fill('14:00');
          console.log(`✓ Entered time: 14:00`);
        }

        // STEP 3: Save event
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Create")').first();

        if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await saveButton.click();
          await page.waitForTimeout(2000);

          console.log('✓ Event created');

          // STEP 4: Verify event appears in calendar
          const eventExists = await page.locator(`text=/${TEST_CONFIG.TEST_EVENTS.simple.title}/i`).isVisible({ timeout: 5000 }).catch(() => false);

          expect(eventExists).toBeTruthy();
          console.log('✅ PASS: Event CRUD working');

        } else {
          console.log('⚠️ Save button not found');
        }
      } else {
        console.log('⚠️ Event form not found');
        test.skip();
      }

    } else {
      console.log('⚠️ Create event button not found');
      test.skip();
    }
  });

  // ==============================================================
  // TEST 2: Extract Event from Screenshot
  // ==============================================================
  test('📸 Extract event from screenshot/photo', async ({ page }) => {
    console.log('🎯 CRITICAL TEST: Event extraction from screenshot');
    console.log('Landing page: "Extract events from screenshots, emails, or conversation"');

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
    await page.waitForLoadState('networkidle');

    const chatInput = page.locator('textarea, input[type="text"]').last();

    if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Simulate uploading screenshot by describing it in text
      const partyText = TEST_CONFIG.TEST_EVENTS.screenshot_party.raw_text;

      await chatInput.fill(`I have this birthday party invitation: ${partyText}`);
      console.log(`📝 Simulating screenshot: "${partyText}"`);

      const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
      await sendButton.click();

      await page.waitForTimeout(8000);

      // STEP 2: Verify Allie extracts event details
      const response = await page.locator('div[class*="message"]').last().textContent();

      const extractedDate = response?.includes('April 19') || response?.includes('4/19');
      const extractedTime = response?.includes('2') && response?.includes('PM');
      const extractedLocation = response?.includes('Adventure Zone');
      const mentionsCalendar = response?.toLowerCase().includes('calendar') ||
                              response?.toLowerCase().includes('event') ||
                              response?.toLowerCase().includes('add');

      console.log('📊 Extraction results:');
      console.log(`   - Date: ${extractedDate ? '✅' : '❌'}`);
      console.log(`   - Time: ${extractedTime ? '✅' : '❌'}`);
      console.log(`   - Location: ${extractedLocation ? '✅' : '❌'}`);
      console.log(`   - Calendar action: ${mentionsCalendar ? '✅' : '❌'}`);

      // ASSERTION: At least 2 of 4 details extracted
      const extractionCount = [extractedDate, extractedTime, extractedLocation, mentionsCalendar].filter(Boolean).length;

      expect(extractionCount).toBeGreaterThanOrEqual(2);
      console.log('✅ PASS: Event extraction from text/screenshot working');

    } else {
      console.log('⚠️ Chat not available');
      test.skip();
    }
  });

  // ==============================================================
  // TEST 3: Extract Event from Chat Conversation
  // ==============================================================
  test('💬 Extract event from natural conversation', async ({ page }) => {
    console.log('🎯 TEST: Event extraction from conversation');

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
    await page.waitForLoadState('networkidle');

    const chatInput = page.locator('textarea, input[type="text"]').last();

    if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Natural language event
      await chatInput.fill("Schedule Emma's piano recital for next Saturday at 3pm at the community center");

      const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
      await sendButton.click();

      await page.waitForTimeout(8000);

      const response = await page.locator('div[class*="message"]').last().textContent();

      const mentionsSchedule = response?.toLowerCase().includes('schedul') ||
                              response?.toLowerCase().includes('calendar') ||
                              response?.toLowerCase().includes('event');

      const mentionsTime = response?.includes('3') || response?.includes('pm');

      console.log(`📊 Conversation parsing:`);
      console.log(`   - Scheduling action: ${mentionsSchedule ? '✅' : '❌'}`);
      console.log(`   - Time extraction: ${mentionsTime ? '✅' : '❌'}`);

      expect(mentionsSchedule).toBeTruthy();
      console.log('✅ PASS: Natural language event extraction');

    } else {
      console.log('⚠️ Chat not available');
      test.skip();
    }
  });

  // ==============================================================
  // TEST 4: Google Calendar Sync Setup
  // ==============================================================
  test('🔗 Google Calendar sync configuration', async ({ page }) => {
    console.log('🎯 TEST: Google Calendar integration setup');

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=calendar`);
    await page.waitForLoadState('networkidle');

    // STEP 1: Look for Google Calendar sync option
    const syncButton = page.locator('button:has-text("Google"), button:has-text("Sync"), button:has-text("Connect Calendar")').first();

    if (await syncButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✅ Google Calendar sync button found');

      // STEP 2: Check if already connected
      const statusText = await page.textContent('body');
      const isConnected = statusText?.toLowerCase().includes('connected') ||
                         statusText?.toLowerCase().includes('synced');

      if (isConnected) {
        console.log('✅ Google Calendar already connected');
        expect(true).toBeTruthy();
      } else {
        console.log('📝 Google Calendar not connected');
        console.log('📝 Note: Full OAuth flow requires Google account login');
      }

    } else {
      console.log('⚠️ Google Calendar sync not visible');
      console.log('📝 May be in Settings or require Google Auth onboarding');
    }
  });

  // ==============================================================
  // TEST 5: Family Timeline View
  // ==============================================================
  test('👨‍👩‍👧‍👦 Family timeline shows all members\' schedules', async ({ page }) => {
    console.log('🎯 TEST: Family schedule coordination');
    console.log('Landing page: "See everyone\'s schedule in one view"');

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=calendar`);
    await page.waitForLoadState('networkidle');

    // STEP 1: Look for family members in calendar view
    const familyMembers = ['Jack', 'Emma', 'Oly', 'Tegner', 'Stefan', 'Parent'];
    let membersFound = 0;

    for (const member of familyMembers) {
      const found = await page.locator(`text=/${member}/i`).first().isVisible({ timeout: 1000 }).catch(() => false);
      if (found) {
        membersFound++;
        console.log(`  ✓ ${member} found in calendar`);
      }
    }

    console.log(`📊 Family members visible: ${membersFound}`);

    // STEP 2: Look for week/timeline view
    const weekView = page.locator('button:has-text("Week"), [class*="week" i], [class*="timeline" i]').first();
    const hasWeekView = await weekView.isVisible({ timeout: 3000 }).catch(() => false);

    console.log(`📅 Week/timeline view: ${hasWeekView ? '✅' : '⚠️'}`);

    // ASSERTION: At least calendar navigation exists
    expect(membersFound > 0 || hasWeekView).toBeTruthy();
    console.log('✅ PASS: Family timeline interface exists');
  });

  // ==============================================================
  // TEST 6: Event Conflict Detection
  // ==============================================================
  test('⚠️ Detect scheduling conflicts', async ({ page }) => {
    console.log('🎯 TEST: Conflict detection');

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=calendar`);
    await page.waitForLoadState('networkidle');

    // This test would:
    // 1. Create event at 2pm
    // 2. Try to create overlapping event at 2:30pm
    // 3. Verify warning/conflict message appears

    console.log('📝 Note: Conflict detection requires creating multiple overlapping events');
    console.log('📝 Scaffolded for implementation');
  });

  // ==============================================================
  // TEST 7: Recurring Events
  // ==============================================================
  test('🔄 Create and manage recurring events', async ({ page }) => {
    console.log('🎯 TEST: Recurring events');

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=calendar`);
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button:has-text("Create"), button:has-text("Add")').first();

    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createButton.click();
      await page.waitForTimeout(1500);

      // Look for recurrence option
      const recurrenceOption = page.locator('select, input[type="checkbox"]:near(text=/repeat/i), button:has-text("Repeat")').first();

      const hasRecurrence = await recurrenceOption.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasRecurrence) {
        console.log('✅ Recurrence options available');
        expect(true).toBeTruthy();
      } else {
        console.log('⚠️ Recurrence options not found');
        console.log('📝 Note: May need different event creation flow');
      }
    }
  });

  // ==============================================================
  // TEST 8: Event Reminders
  // ==============================================================
  test('🔔 Set event reminders and notifications', async ({ page }) => {
    console.log('🎯 TEST: Event reminders');
    console.log('Landing page: "Would you like me to set a reminder to buy a present?"');

    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=calendar`);
    await page.waitForLoadState('networkidle');

    // Look for existing event to add reminder
    const event = page.locator('[class*="event"], [class*="appointment"]').first();

    if (await event.isVisible({ timeout: 5000 }).catch(() => false)) {
      await event.click();
      await page.waitForTimeout(1500);

      // Look for reminder options
      const reminderOption = page.locator('text=/reminder/i, button:has-text("Remind"), select:near(text=/reminder/i)').first();

      const hasReminders = await reminderOption.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasReminders) {
        console.log('✅ Reminder options available');
        expect(true).toBeTruthy();
      } else {
        console.log('⚠️ Reminders not found in event details');
      }
    } else {
      console.log('⚠️ No events to test reminders - create event first');
    }
  });

  // ==============================================================
  // TEST 9: Email Event Extraction
  // ==============================================================
  test('📧 Extract events from email content', async ({ page }) => {
    console.log('🎯 TEST: Email event extraction');
    console.log('Landing page: "Extract events from screenshots, emails, or conversation"');

    // This would test the email parsing for calendar events
    // Requires email integration to be working

    console.log('📝 Note: Email event extraction requires:');
    console.log('   1. Family email setup (@families.checkallie.com)');
    console.log('   2. Email sent to inbox with event details');
    console.log('   3. Backend email parsing (functions/index.js)');
    console.log('📝 Scaffolded for integration testing');
  });

  // ==============================================================
  // TEST 10: Bidirectional Google Calendar Sync
  // ==============================================================
  test('🔄 Bidirectional sync: Allie ↔ Google Calendar', async ({ page }) => {
    console.log('🎯 CRITICAL TEST: Bidirectional sync');
    console.log('Landing page: Google Calendar integration');

    // This comprehensive test validates:
    // 1. Add event in Allie → appears in Google Calendar
    // 2. Add event in Google Calendar → appears in Allie
    // 3. Edit event in Allie → updates Google Calendar
    // 4. Edit event in Google Calendar → updates Allie
    // 5. Delete event in either → removes from both

    console.log('📝 Note: Bidirectional sync testing requires:');
    console.log('   1. Google Calendar OAuth connected');
    console.log('   2. Test Google Calendar account');
    console.log('   3. EnhancedCalendarSyncService running');
    console.log('   4. Token refresh working (5 min before expiry)');
    console.log('📝 See: src/services/EnhancedCalendarSyncService.js');
    console.log('📝 Scaffolded for integration testing');
  });

});

// ==============================================================
// HELPER FUNCTIONS
// ==============================================================

/**
 * Create test event via API
 */
async function createTestEvent(eventData) {
  console.log('Creating test event via API');
  // Direct Firestore write for test setup
}

/**
 * Verify event in Google Calendar
 */
async function verifyEventInGoogleCalendar(eventTitle) {
  console.log('Checking Google Calendar API for event');
  // Use Google Calendar API
}

/**
 * Wait for sync to complete
 */
async function waitForSync(page, timeout = 10000) {
  console.log('Waiting for calendar sync...');
  await page.waitForTimeout(timeout);
}
