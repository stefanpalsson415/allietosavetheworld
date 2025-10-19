/**
 * End-to-End Claude API Integration Tests
 *
 * Tests the complete flow: Frontend → Backend → Claude API → User
 * CRITICAL: These tests catch integration issues before users see them
 *
 * Coverage:
 * - Habit recommendations (home page)
 * - Chat responses (Allie chat)
 * - Knowledge Graph insights
 * - Error recovery
 * - Multi-turn conversations
 *
 * Total: 12 test cases
 */

const { test, expect } = require('@playwright/test');

test.describe('Claude API End-to-End Integration', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('/');

    // Wait for app to load
    await page.waitForSelector('body', { state: 'attached' });
  });

  // ============================================================================
  // Habit Recommendations (Home Page)
  // ============================================================================
  test.describe('Habit Recommendations', () => {

    test('should generate habit recommendations on home page', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.click('button:has-text("Password")');
      await page.fill('input[type="email"]', 'test@parentload.com');
      await page.fill('input[type="password"]', 'TestPassword123!');
      await page.click('button:has-text("Log In")');

      // Wait for navigation to dashboard
      await page.waitForURL('**/dashboard', { timeout: 10000 });

      // Navigate to home page
      await page.click('button:has-text("Home")');

      // Wait for habit recommendations section
      await page.waitForSelector('text=Recommended Habits', { timeout: 5000 });

      // Check if recommendations are visible
      const recommendations = await page.locator('[data-testid="habit-recommendation"]').count();
      expect(recommendations).toBeGreaterThan(0);

      // Verify recommendations have text (from Claude)
      const firstRecommendation = page.locator('[data-testid="habit-recommendation"]').first();
      const text = await firstRecommendation.textContent();
      expect(text.length).toBeGreaterThan(10);
    });

    test('should handle recommendation generation errors gracefully', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/claude', route => {
        route.abort('failed');
      });

      await page.goto('/dashboard');
      await page.click('button:has-text("Home")');

      // Should show error message or fallback UI
      const errorElement = await page.locator('text=/error|failed|try again/i').first();
      await expect(errorElement).toBeVisible({ timeout: 10000 });
    });
  });

  // ============================================================================
  // Allie Chat Integration
  // ============================================================================
  test.describe('Allie Chat', () => {

    test.beforeEach(async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.click('button:has-text("Password")');
      await page.fill('input[type="email"]', 'test@parentload.com');
      await page.fill('input[type="password"]', 'TestPassword123!');
      await page.click('button:has-text("Log In")');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    });

    test('should send message to Claude and receive response', async ({ page }) => {
      // Open chat
      await page.click('[data-testid="open-chat"]');

      // Wait for chat to open
      await page.waitForSelector('[data-testid="chat-input"]', { timeout: 5000 });

      // Type message
      await page.fill('[data-testid="chat-input"]', 'Say "Hello test" in exactly 2 words.');

      // Send message
      await page.click('[data-testid="send-message"]');

      // Wait for Claude response
      await page.waitForSelector('[data-testid="message-assistant"]', { timeout: 15000 });

      // Verify response exists and has content
      const response = await page.locator('[data-testid="message-assistant"]').last().textContent();
      expect(response.length).toBeGreaterThan(0);
      expect(response.toLowerCase()).toContain('hello');
    });

    test('should handle multi-turn conversations', async ({ page }) => {
      await page.click('[data-testid="open-chat"]');
      await page.waitForSelector('[data-testid="chat-input"]');

      // Turn 1
      await page.fill('[data-testid="chat-input"]', 'My favorite color is blue.');
      await page.click('[data-testid="send-message"]');
      await page.waitForSelector('[data-testid="message-assistant"]', { timeout: 15000 });

      // Turn 2
      await page.fill('[data-testid="chat-input"]', 'What is my favorite color?');
      await page.click('[data-testid="send-message"]');

      // Wait for second response
      await page.waitForTimeout(2000); // Wait for second message to appear
      const messages = await page.locator('[data-testid="message-assistant"]').count();
      expect(messages).toBeGreaterThanOrEqual(2);

      // Verify Claude remembered context
      const lastResponse = await page.locator('[data-testid="message-assistant"]').last().textContent();
      expect(lastResponse.toLowerCase()).toContain('blue');
    });

    test('should show loading indicator while waiting for Claude', async ({ page }) => {
      await page.click('[data-testid="open-chat"]');
      await page.waitForSelector('[data-testid="chat-input"]');

      await page.fill('[data-testid="chat-input"]', 'Test message');
      await page.click('[data-testid="send-message"]');

      // Check for loading indicator
      const loadingIndicator = page.locator('[data-testid="message-loading"]');
      await expect(loadingIndicator).toBeVisible({ timeout: 2000 });
    });

    test('should handle chat errors gracefully', async ({ page }) => {
      // Mock API failure
      await page.route('**/api/claude', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Server error' })
        });
      });

      await page.click('[data-testid="open-chat"]');
      await page.waitForSelector('[data-testid="chat-input"]');

      await page.fill('[data-testid="chat-input"]', 'This will fail');
      await page.click('[data-testid="send-message"]');

      // Should show error message
      await page.waitForSelector('text=/error|couldn\'t|try again/i', { timeout: 5000 });
    });

    test('should clean response by removing internal tags', async ({ page }) => {
      await page.click('[data-testid="open-chat"]');
      await page.waitForSelector('[data-testid="chat-input"]');

      await page.fill('[data-testid="chat-input"]', 'Say hello');
      await page.click('[data-testid="send-message"]');

      await page.waitForSelector('[data-testid="message-assistant"]', { timeout: 15000 });

      // Verify no internal tags are visible
      const response = await page.locator('[data-testid="message-assistant"]').last().textContent();
      expect(response).not.toContain('<thinking>');
      expect(response).not.toContain('<store_family_data>');
      expect(response).not.toContain('<reflection>');
    });
  });

  // ============================================================================
  // Knowledge Graph Integration
  // ============================================================================
  test.describe('Knowledge Graph Insights', () => {

    test.beforeEach(async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.click('button:has-text("Password")');
      await page.fill('input[type="email"]', 'test@parentload.com');
      await page.fill('input[type="password"]', 'TestPassword123!');
      await page.click('button:has-text("Log In")');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    });

    test('should load knowledge graph with Claude-powered insights', async ({ page }) => {
      // Navigate to Knowledge Graph tab
      await page.click('button:has-text("Knowledge Graph")');

      // Wait for graph to load
      await page.waitForSelector('[data-testid="knowledge-graph"]', { timeout: 10000 });

      // Wait for insights panel
      await page.waitForSelector('[data-testid="insights-panel"]', { timeout: 5000 });

      // Verify insights are present (generated by Claude)
      const insights = await page.locator('[data-testid="insight-item"]').count();
      expect(insights).toBeGreaterThan(0);
    });

    test('should open chat drawer with Claude insights when clicking node', async ({ page }) => {
      await page.click('button:has-text("Knowledge Graph")');
      await page.waitForSelector('[data-testid="knowledge-graph"]');

      // Click on a node
      await page.click('[data-testid="graph-node"]');

      // Chat drawer should open
      await page.waitForSelector('[data-testid="insight-chat-drawer"]', { timeout: 5000 });

      // Should have context about the selected node
      const drawerContent = await page.locator('[data-testid="insight-chat-drawer"]').textContent();
      expect(drawerContent.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Error Recovery
  // ============================================================================
  test.describe('Error Recovery', () => {

    test('should retry failed Claude API requests', async ({ page }) => {
      let attemptCount = 0;

      // Mock first request to fail, second to succeed
      await page.route('**/api/claude', route => {
        attemptCount++;
        if (attemptCount === 1) {
          route.fulfill({
            status: 500,
            body: JSON.stringify({ error: 'Temporary error' })
          });
        } else {
          route.fulfill({
            status: 200,
            body: JSON.stringify({
              content: [{ type: 'text', text: 'Success after retry' }],
              model: 'claude-opus-4-1-20250805'
            })
          });
        }
      });

      // Login and open chat
      await page.goto('/login');
      await page.click('button:has-text("Password")');
      await page.fill('input[type="email"]', 'test@parentload.com');
      await page.fill('input[type="password"]', 'TestPassword123!');
      await page.click('button:has-text("Log In")');
      await page.waitForURL('**/dashboard');

      await page.click('[data-testid="open-chat"]');
      await page.waitForSelector('[data-testid="chat-input"]');

      await page.fill('[data-testid="chat-input"]', 'Test retry');
      await page.click('[data-testid="send-message"]');

      // Should eventually succeed
      await page.waitForSelector('text=Success after retry', { timeout: 10000 });
    });

    test('should show helpful error when API key is missing', async ({ page }) => {
      // Mock 503 API key error
      await page.route('**/api/claude', route => {
        route.fulfill({
          status: 503,
          body: JSON.stringify({
            error: 'Claude API service is not configured',
            message: 'Internal API key not set'
          })
        });
      });

      await page.goto('/login');
      await page.click('button:has-text("Password")');
      await page.fill('input[type="email"]', 'test@parentload.com');
      await page.fill('input[type="password"]', 'TestPassword123!');
      await page.click('button:has-text("Log In")');
      await page.waitForURL('**/dashboard');

      await page.click('[data-testid="open-chat"]');
      await page.waitForSelector('[data-testid="chat-input"]');

      await page.fill('[data-testid="chat-input"]', 'This will fail');
      await page.click('[data-testid="send-message"]');

      // Should show helpful error message
      await page.waitForSelector('text=/not configured|API key|service unavailable/i', { timeout: 5000 });
    });
  });
});
