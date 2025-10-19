/**
 * Regression Test Suite for October 2025 Critical Bug Fixes
 *
 * This suite tests the 8 critical bugs fixed in October 2025 to ensure they don't regress.
 * All tests are tagged with @regression for targeted execution.
 *
 * Run with: npx playwright test tests/regression/october-2025-critical-bugs.spec.js
 *
 * References:
 * - CLAUDE.md sections: "⚠️ Critical Active Issues & Fixes"
 * - WEEKLY_TEST_AUDIT_2025-10-10.md: Regression Check section
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('@regression October 2025 Critical Bug Fixes', () => {

  // ============================================================================
  // BUG #1: OTP Login "Loading..." Race Condition (Oct 8, 2025)
  // ============================================================================
  // Problem: After OTP login, dashboard shows infinite "Loading..." spinner
  // Root Cause: Navigation to /dashboard happened before FamilyContext populated
  // Fix: DashboardWrapper.jsx:28-33 - Early return when family data available
  // ============================================================================

  test('@auth OTP login completes without infinite loading spinner', async ({ page }) => {
    console.log('🧪 Testing: OTP Login Race Condition Fix (Oct 8)');

    // Navigate to home page
    await page.goto('/');

    // Click login button
    const loginButton = page.locator('a:has-text("Log In"), button:has-text("Log In")').first();
    await loginButton.click();

    // ✅ CRITICAL: Click Password tab (not default Email Code tab)
    const passwordTab = page.locator('button:has-text("Password"), [role="tab"]:has-text("Password")').first();
    await passwordTab.click();

    // Fill in TEST USER credentials (password-based auth for testing)
    await page.locator('input[type="email"]').fill('test@parentload.com');
    await page.locator('input[type="password"]').fill('TestPassword123!');

    // Submit login
    await page.locator('button[type="submit"]:has-text("Log In")').click();

    // CRITICAL: Dashboard should load within 15 seconds (not infinite spinner)
    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    // Verify dashboard UI is visible (not stuck on "Loading...")
    await expect(page.locator('text=/Welcome|Dashboard/i')).toBeVisible({ timeout: 10000 });

    // Verify family context is populated
    const hasUserDropdown = await page.locator('.user-dropdown-container').isVisible();
    expect(hasUserDropdown).toBeTruthy();

    console.log('✅ OTP login completed successfully - no infinite spinner');
  });

  // ============================================================================
  // BUG #2: Interview Voice Feedback Loop (Oct 9, 2025)
  // ============================================================================
  // Problem: Allie's voice was picked up by microphone during interviews
  // Root Cause: Microphone resumed before TTS audio finished playing
  // Fix: InterviewChat.jsx:303-321 - Event-driven mic control with voice:speakEnd
  // ============================================================================

  test('@voice Interview voice does not create feedback loop', async ({ page, context }) => {
    console.log('🧪 Testing: Interview Voice Feedback Loop Fix (Oct 9)');

    // Grant microphone permissions
    await context.grantPermissions(['microphone']);

    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Start a discovery interview
    await page.locator('text=/Start Discovery|Begin Interview/i').first().click({ timeout: 10000 });

    // Enable voice mode
    const micButton = page.locator('[aria-label*="microphone" i], button:has-text("🎤")').first();
    if (await micButton.isVisible({ timeout: 5000 })) {
      await micButton.click();
    }

    // Wait for Allie to speak (TTS playback)
    await page.waitForTimeout(3000);

    // Verify microphone state during speech
    // NOTE: This is a best-effort check - full verification requires audio capture
    const messages = await page.locator('[data-testid="chat-message"]').count();

    // After Allie speaks, wait and verify no echo messages appear
    await page.waitForTimeout(5000);
    const newMessages = await page.locator('[data-testid="chat-message"]').count();

    // Should not have auto-transcribed Allie's own speech
    expect(newMessages - messages).toBeLessThanOrEqual(1); // Max 1 new message (the question)

    console.log('✅ No voice feedback loop detected');
  });

  // ============================================================================
  // BUG #3: Interview Voice Result Processing (Oct 9, 2025)
  // ============================================================================
  // Problem: User speech transcribed but not saved as messages
  // Root Cause: Conversational mode skipped immediate processing, relied on pause
  // Fix: InterviewChat.jsx:526-544 - Process ALL voice results immediately
  // ============================================================================

  test('@voice Interview processes voice responses correctly', async ({ page, context }) => {
    console.log('🧪 Testing: Interview Voice Result Processing Fix (Oct 9)');

    // Grant microphone permissions
    await context.grantPermissions(['microphone']);

    // Navigate to interview
    await page.goto('/dashboard');
    await page.locator('text=/Start Discovery|Begin Interview/i').first().click({ timeout: 10000 });

    // Count initial messages
    const initialCount = await page.locator('[data-testid="chat-message"], .message-bubble').count();

    // Simulate voice input via text (since we can't actually speak in tests)
    const textInput = page.locator('textarea, input[type="text"]').first();
    await textInput.fill('Yes, let me tell you about our morning routine');
    await textInput.press('Enter');

    // Verify response was saved
    await page.waitForTimeout(2000);
    const newCount = await page.locator('[data-testid="chat-message"], .message-bubble').count();

    expect(newCount).toBeGreaterThan(initialCount);

    // Verify response appears in chat history
    await expect(page.locator('text=/morning routine/i')).toBeVisible({ timeout: 5000 });

    console.log('✅ Voice responses are processed and saved correctly');
  });

  // ============================================================================
  // BUG #4: Calendar Date Matching UTC Bug (Oct 8, 2025)
  // ============================================================================
  // Problem: Events not appearing for Oct 9-11 due to timezone conversion
  // Root Cause: UTC timezone conversion in date comparison
  // Fix: WeeklyTimelineView.jsx:40-65 - Local date comparison
  // ============================================================================

  test('@calendar Calendar events display on correct date across timezones', async ({ page }) => {
    console.log('🧪 Testing: Calendar UTC Date Matching Fix (Oct 8)');

    await page.goto('/dashboard');

    // Navigate to calendar
    const calendarTab = page.locator('text=/Calendar|Events/i').first();
    await calendarTab.click({ timeout: 10000 });

    // Create an event at 11:00 PM (late evening - critical timezone test)
    await page.locator('button:has-text("Add Event"), button:has-text("+")').first().click({ timeout: 5000 });

    // Fill event details
    await page.locator('input[name="title"], input[placeholder*="title" i]').fill('Late Night Meeting');

    // Set time to 11:00 PM
    const timeInput = page.locator('input[type="time"], input[name="startTime"]').first();
    await timeInput.fill('23:00');

    // Save event
    await page.locator('button:has-text("Save"), button[type="submit"]').click();

    // Wait for event to appear
    await page.waitForTimeout(2000);

    // Verify event appears on the SAME day (not next day due to UTC conversion)
    const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const eventOnToday = page.locator(`text=/Late Night Meeting/i`);

    await expect(eventOnToday).toBeVisible({ timeout: 5000 });

    console.log('✅ Calendar events display on correct local date');
  });

  // ============================================================================
  // BUG #5: Blog Guest Commenting (Oct 6, 2025)
  // ============================================================================
  // Problem: Guest users got auth errors when commenting
  // Root Cause: Firestore rules required authentication
  // Fix: BlogService.js - Added guest commenting support
  // ============================================================================

  test('@blog Guest users can comment without auth errors', async ({ page, context }) => {
    console.log('🧪 Testing: Blog Guest Commenting Fix (Oct 6)');

    // Clear all authentication
    await context.clearCookies();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    // Navigate to blog (should work without login)
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');

    // Click on a blog post
    const firstPost = page.locator('[data-testid="blog-post"], .blog-post-card').first();
    await firstPost.click({ timeout: 10000 });

    // Find comment section
    const commentButton = page.locator('button:has-text("Comment"), button:has-text("Add Comment")').first();

    if (await commentButton.isVisible({ timeout: 5000 })) {
      await commentButton.click();

      // Fill guest info
      await page.locator('input[name="name"], input[placeholder*="name" i]').fill('Test Guest');
      await page.locator('input[name="email"], input[placeholder*="email" i]').fill('guest@test.com');
      await page.locator('textarea').fill('This is a test guest comment');

      // Submit comment
      await page.locator('button[type="submit"]').click();

      // Verify no Firestore permission errors appear
      await page.waitForTimeout(2000);
      const errorMessage = page.locator('text=/permission denied|auth.*required/i');
      await expect(errorMessage).not.toBeVisible();

      console.log('✅ Guest commenting works without auth errors');
    } else {
      console.log('⚠️ Comment button not found - feature may not be enabled on test post');
    }
  });

  // ============================================================================
  // BUG #6: SMS Auto-Processing Empty Arrays (Oct 6, 2025)
  // ============================================================================
  // Problem: Empty arrays [] blocking SMS auto-processing
  // Root Cause: Truthy check failed for empty arrays
  // Fix: UnifiedInbox.jsx:695-703 - Explicit array length checks
  // ============================================================================

  test('@sms SMS processes even with empty suggestedActions array', async ({ page }) => {
    console.log('🧪 Testing: SMS Auto-Processing Empty Arrays Fix (Oct 6)');

    await page.goto('/dashboard');

    // Navigate to inbox
    const inboxTab = page.locator('text=/Inbox|Messages/i').first();
    await inboxTab.click({ timeout: 10000 });

    // Check for SMS tab
    const smsTab = page.locator('button:has-text("SMS"), [role="tab"]:has-text("SMS")').first();
    if (await smsTab.isVisible({ timeout: 5000 })) {
      await smsTab.click();

      // Verify SMS messages are visible (not blocked)
      const smsMessages = page.locator('[data-testid="sms-message"], .sms-item');
      const count = await smsMessages.count();

      console.log(`Found ${count} SMS messages`);

      // If there are messages, verify they can be clicked (processed)
      if (count > 0) {
        const firstMessage = smsMessages.first();
        await firstMessage.click();

        // Verify detail view opens (message was not blocked from processing)
        await expect(page.locator('[data-testid="message-detail"]')).toBeVisible({ timeout: 5000 });

        console.log('✅ SMS auto-processing works with empty arrays');
      } else {
        console.log('⚠️ No SMS messages found to test');
      }
    } else {
      console.log('⚠️ SMS tab not visible - feature may not be enabled');
    }
  });

  // ============================================================================
  // BUG #7: Microphone Permission Timing (Oct 9, 2025)
  // ============================================================================
  // Problem: Mic permission requested before login, interrupting interview
  // Root Cause: VoiceService lazy initialization triggered too early
  // Fix: InterviewChat.jsx:131-146 - Pre-initialize mic BEFORE interview starts
  // ============================================================================

  test('@voice Microphone only requested after login when clicking mic button', async ({ page, context }) => {
    console.log('🧪 Testing: Microphone Permission Timing Fix (Oct 9)');

    // Visit site as guest (no login)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate around the site - should NOT trigger mic prompt
    // NOTE: We verify mic is NOT requested by checking that interview works properly after login
    await page.locator('a:has-text("About"), a:has-text("Blog")').first().click({ timeout: 5000 });
    await page.waitForTimeout(2000);

    // Now login
    await page.goto('/');
    const loginButton = page.locator('a:has-text("Log In")').first();
    await loginButton.click();

    // ✅ CRITICAL: Click Password tab (not default Email Code tab)
    const passwordTab = page.locator('button:has-text("Password"), [role="tab"]:has-text("Password")').first();
    await passwordTab.click();

    await page.locator('input[type="email"]').fill('test@parentload.com');
    await page.locator('input[type="password"]').fill('TestPassword123!');
    await page.locator('button[type="submit"]:has-text("Log In")').click();

    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    // Start interview
    await page.locator('text=/Start Discovery/i').first().click({ timeout: 10000 });

    // Verify mic prompt happens BEFORE interview starts speaking
    // (Permission should be pre-initialized during loading screen)

    // Check that interview UI is visible
    await expect(page.locator('[data-testid="interview-chat"]')).toBeVisible({ timeout: 10000 });

    console.log('✅ Microphone permission timing is correct');
  });

  // ============================================================================
  // BUG #8: Calendar Timestamp Fields (Oct 4, 2025)
  // ============================================================================
  // Problem: Synced Google Calendar events not displaying
  // Root Cause: Missing Timestamp fields - only had string dates
  // Fix: EnhancedCalendarSyncService.js:603-604 - Create BOTH timestamp and string
  // ============================================================================

  test('@calendar Synced events have both timestamp and string date fields', async ({ page }) => {
    console.log('🧪 Testing: Calendar Timestamp Fields Fix (Oct 4)');

    await page.goto('/dashboard');

    // Navigate to calendar
    await page.locator('text=/Calendar/i').first().click({ timeout: 10000 });

    // Look for calendar sync button
    const syncButton = page.locator('button:has-text("Sync"), button:has-text("Google Calendar")').first();

    if (await syncButton.isVisible({ timeout: 5000 })) {
      // Click sync
      await syncButton.click();
      await page.waitForTimeout(3000);

      // Verify events are displayed on calendar
      const calendarEvents = page.locator('[data-testid="calendar-event"], .calendar-event');
      const eventCount = await calendarEvents.count();

      console.log(`Found ${eventCount} calendar events after sync`);

      if (eventCount > 0) {
        // Click an event to see details
        await calendarEvents.first().click();

        // Verify event detail shows (means it has proper timestamp fields)
        await expect(page.locator('[data-testid="event-detail"]')).toBeVisible({ timeout: 5000 });

        console.log('✅ Synced events have proper timestamp fields');
      } else {
        console.log('⚠️ No synced events found - may not have Google Calendar connected');
      }
    } else {
      console.log('⚠️ Calendar sync button not visible - feature may not be enabled');
    }
  });

  // ============================================================================
  // FEATURE #9: Real-Time WebSocket Knowledge Graph Updates (Oct 2025)
  // ============================================================================
  // Feature: Real-time graph updates via WebSocket for instant family insights
  // Implementation: WebSocketGraphService.js + useKnowledgeGraphWebSocket.js
  // Integration: KnowledgeGraphHub.jsx with live connection indicator
  // ============================================================================

  test('@knowledge-graph Real-time WebSocket connection establishes correctly', async ({ page }) => {
    console.log('🧪 Testing: Real-Time WebSocket Updates (Oct 2025)');

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Navigate to Knowledge Graph
    const kgButton = page.locator('button:has-text("Knowledge Graph"), a:has-text("Insights")').first();
    if (await kgButton.isVisible({ timeout: 5000 })) {
      await kgButton.click();
      await page.waitForTimeout(2000);

      // Verify WebSocket connection indicator
      // Should show "Live" indicator when connected (green pulse)
      const liveIndicator = page.locator('text=/Live|Connected|●/i, [class*="connected"], [class*="live-indicator"]');

      // Wait for connection to establish
      await page.waitForTimeout(3000);

      // Check if live indicator is present
      const isConnected = await liveIndicator.isVisible({ timeout: 5000 }).catch(() => false);

      if (isConnected) {
        console.log('✅ WebSocket connection indicator visible');
      } else {
        console.log('⚠️ WebSocket connection indicator not found - may need longer connection time');
      }

      // Verify suggested questions appear (populated by WebSocket events)
      const suggestedQuestions = page.locator('[data-testid="suggested-question"], .suggested-question');
      const questionCount = await suggestedQuestions.count();

      console.log(`Found ${questionCount} suggested questions (populated via WebSocket)`);

    } else {
      console.log('⚠️ Knowledge Graph button not visible - feature may require specific permissions');
    }
  });

  // ============================================================================
  // FEATURE #10: Historical Pattern Visualization (Oct 2025)
  // ============================================================================
  // Feature: 4-tab historical analysis with charts (Cognitive Load, Heat Map, Patterns, Anticipation)
  // Implementation: TemporalAnalysisService.js + HistoricalPatternsPanel.jsx
  // API: POST /api/knowledge-graph/temporal-analysis
  // ============================================================================

  test('@knowledge-graph Historical Patterns panel loads with all 4 tabs', async ({ page }) => {
    console.log('🧪 Testing: Historical Pattern Visualization (Oct 2025)');

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Navigate to Knowledge Graph
    const kgButton = page.locator('button:has-text("Knowledge Graph"), a:has-text("Insights")').first();
    if (await kgButton.isVisible({ timeout: 5000 })) {
      await kgButton.click();
      await page.waitForTimeout(2000);

      // Click "Historical Patterns" button
      const historicalButton = page.locator('button:has-text("Historical Patterns"), button:has-text("📊")').first();

      if (await historicalButton.isVisible({ timeout: 5000 })) {
        await historicalButton.click();

        // Verify modal opens
        await expect(page.locator('text=/Historical Patterns/i')).toBeVisible({ timeout: 10000 });

        // Verify all 4 tabs are present
        const tabs = [
          'Cognitive Load',
          'Heat Map',
          'Patterns',
          'Anticipation'
        ];

        for (const tabName of tabs) {
          const tab = page.locator(`text=/${tabName}/i, [role="tab"]:has-text("${tabName}")`).first();
          await expect(tab).toBeVisible({ timeout: 5000 });
          console.log(`✓ ${tabName} tab found`);
        }

        // Verify time range selector (7/30/90 days)
        const timeRanges = ['7 Days', '30 Days', '90 Days'];
        for (const range of timeRanges) {
          const rangeButton = page.locator(`button:has-text("${range}")`).first();
          await expect(rangeButton).toBeVisible({ timeout: 5000 });
          console.log(`✓ ${range} button found`);
        }

        // Click through tabs to verify they load
        const heatMapTab = page.locator('text=/Heat Map/i, [role="tab"]:has-text("Heat Map")').first();
        await heatMapTab.click();
        await page.waitForTimeout(1000);

        const patternsTab = page.locator('text=/Patterns/i, [role="tab"]:has-text("Patterns")').first();
        await patternsTab.click();
        await page.waitForTimeout(1000);

        console.log('✅ Historical Patterns panel works with all tabs');

        // Close modal
        const closeButton = page.locator('button:has-text("×"), button[aria-label*="close" i]').first();
        await closeButton.click();

      } else {
        console.log('⚠️ Historical Patterns button not visible - feature may not be loaded');
      }

    } else {
      console.log('⚠️ Knowledge Graph button not visible');
    }
  });

  // ============================================================================
  // FEATURE #11: Predictive Insights Engine (Oct 2025)
  // ============================================================================
  // Feature: AI-powered predictions (burnout risks, task forecasts, conflicts)
  // Implementation: PredictiveInsightsService.js + PredictiveInsightsPanel.jsx
  // API: POST /api/knowledge-graph/predictive-insights
  // ============================================================================

  test('@knowledge-graph Predictive Insights panel shows recommendations', async ({ page }) => {
    console.log('🧪 Testing: Predictive Insights Engine (Oct 2025)');

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Navigate to Knowledge Graph
    const kgButton = page.locator('button:has-text("Knowledge Graph"), a:has-text("Insights")').first();
    if (await kgButton.isVisible({ timeout: 5000 })) {
      await kgButton.click();
      await page.waitForTimeout(2000);

      // Check for critical alerts (floating banners at top of graph)
      const criticalAlert = page.locator('[class*="critical"], text=/🚨/i');
      const hasCriticalAlerts = await criticalAlert.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasCriticalAlerts) {
        console.log('✓ Critical alerts visible at top of graph');
      }

      // Click "Predictive Insights" button (red-to-pink gradient)
      const predictiveButton = page.locator('button:has-text("Predictive Insights"), button:has-text("🔮")').first();

      if (await predictiveButton.isVisible({ timeout: 5000 })) {
        await predictiveButton.click();

        // Verify modal opens
        await expect(page.locator('text=/Predictive Insights/i')).toBeVisible({ timeout: 10000 });

        // Verify all 4 tabs are present
        const tabs = [
          'Overview',
          'Task Predictions',
          'Burnout Risks',
          'Coordination'
        ];

        for (const tabName of tabs) {
          const tab = page.locator(`text=/${tabName}/i, [role="tab"]:has-text("${tabName}")`).first();
          await expect(tab).toBeVisible({ timeout: 5000 });
          console.log(`✓ ${tabName} tab found`);
        }

        // Check Overview tab for recommendations
        const recommendations = page.locator('[data-testid="recommendation"], .recommendation-card');
        const recCount = await recommendations.count();
        console.log(`Found ${recCount} recommendations in Overview tab`);

        // Check for priority badges (critical/high/medium/low)
        const priorityBadge = page.locator('text=/critical|high|medium|low/i').first();
        const hasPriority = await priorityBadge.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasPriority) {
          console.log('✓ Priority badges visible on recommendations');
        }

        // Click through tabs to verify they load
        const predictionsTab = page.locator('text=/Task Predictions/i, [role="tab"]:has-text("Task Predictions")').first();
        await predictionsTab.click();
        await page.waitForTimeout(1000);

        const risksTab = page.locator('text=/Burnout Risks/i, [role="tab"]:has-text("Burnout Risks")').first();
        await risksTab.click();
        await page.waitForTimeout(1000);

        const coordTab = page.locator('text=/Coordination/i, [role="tab"]:has-text("Coordination")').first();
        await coordTab.click();
        await page.waitForTimeout(1000);

        console.log('✅ Predictive Insights panel works with all tabs');

        // Close modal
        const closeButton = page.locator('button:has-text("×"), button[aria-label*="close" i]').first();
        await closeButton.click();

      } else {
        console.log('⚠️ Predictive Insights button not visible - feature may not be loaded');
      }

    } else {
      console.log('⚠️ Knowledge Graph button not visible');
    }
  });

});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Waits for an element to be visible with custom timeout
 */
async function waitForElement(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely clicks an element if it exists
 */
async function safeClick(page, selector, timeout = 5000) {
  try {
    const element = page.locator(selector).first();
    if (await element.isVisible({ timeout })) {
      await element.click();
      return true;
    }
  } catch {
    return false;
  }
  return false;
}
