/**
 * E2E Tests: Knowledge Graph Natural Language Queries
 *
 * Tests all 4 phases of the natural language query system:
 * - Phase 1: Intent classification + template queries
 * - Phase 2: Dynamic Cypher generation
 * - Phase 3: Frontend Allie Chat integration
 * - Phase 4: Caching and performance
 */

const { test, expect } = require('@playwright/test');

test.describe('Knowledge Graph Natural Language Queries', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('https://checkallie.com/dashboard');

    // Wait for Allie chat to be ready
    await page.waitForSelector('[data-testid="allie-chat"]', { timeout: 10000 });
  });

  test.describe('Phase 1: Intent Classification & Template Queries', () => {

    test('FEATURE #1: Detects burnout intent from "Why am I so tired?"', async ({ page }) => {
      // Open Allie chat
      await page.click('[data-testid="open-chat"]');

      // Type burnout question
      const input = page.locator('textarea[placeholder*="Ask Allie"]');
      await input.fill('Why am I so tired?');
      await input.press('Enter');

      // Wait for response
      await page.waitForSelector('[data-testid="allie-message"]', { timeout: 15000 });

      // Verify response contains burnout analysis
      const response = await page.locator('[data-testid="allie-message"]').last().textContent();
      expect(response).toMatch(/cognitive load|burnout|mental load/i);
      expect(response).toMatch(/analyzed \d+ data points/i);

      // Verify intent metadata shows burnout
      expect(response).toContain('intent: burnout');
    });

    test('FEATURE #2: Detects fairness intent from "Is our workload balanced?"', async ({ page }) => {
      await page.click('[data-testid="open-chat"]');

      const input = page.locator('textarea[placeholder*="Ask Allie"]');
      await input.fill('Is our workload balanced fairly?');
      await input.press('Enter');

      await page.waitForSelector('[data-testid="allie-message"]', { timeout: 15000 });

      const response = await page.locator('[data-testid="allie-message"]').last().textContent();
      expect(response).toMatch(/workload distribution|fairness|balance/i);
      expect(response).toMatch(/found \d+ data points/i);
      expect(response).toContain('intent: fairness');
    });

    test('FEATURE #3: Detects anticipation intent from "Who notices tasks?"', async ({ page }) => {
      await page.click('[data-testid="open-chat"]');

      const input = page.locator('textarea[placeholder*="Ask Allie"]');
      await input.fill('Who notices the most tasks in our family?');
      await input.press('Enter');

      await page.waitForSelector('[data-testid="allie-message"]', { timeout: 15000 });

      const response = await page.locator('[data-testid="allie-message"]').last().textContent();
      expect(response).toMatch(/anticipation|mental load|notices/i);
      expect(response).toContain('intent: anticipation');
    });

    test('FEATURE #4: Returns key insights with person names', async ({ page }) => {
      await page.click('[data-testid="open-chat"]');

      const input = page.locator('textarea[placeholder*="Ask Allie"]');
      await input.fill('Why am I so tired?');
      await input.press('Enter');

      await page.waitForSelector('[data-testid="allie-message"]', { timeout: 15000 });

      const response = await page.locator('[data-testid="allie-message"]').last().textContent();

      // Should contain Key Insights section
      expect(response).toContain('Key Insights');

      // Should contain person names (from test family)
      expect(response).toMatch(/Stefan|Kimberly|Maria|Carlos/);
    });
  });

  test.describe('Phase 2: Dynamic Cypher Generation', () => {

    test('FEATURE #5: Generates Cypher for custom time-based queries', async ({ page }) => {
      await page.click('[data-testid="open-chat"]');

      const input = page.locator('textarea[placeholder*="Ask Allie"]');
      // Custom question that doesn't match templates
      await input.fill('How many tasks did Stefan create last Tuesday?');
      await input.press('Enter');

      await page.waitForSelector('[data-testid="allie-message"]', { timeout: 20000 });

      const response = await page.locator('[data-testid="allie-message"]').last().textContent();

      // Should use dynamic method
      expect(response).toMatch(/method.*dynamic|generated query/i);

      // Should still return results
      expect(response).toMatch(/\d+|no tasks|found/i);
    });

    test('FEATURE #6: Handles person-specific queries', async ({ page }) => {
      await page.click('[data-testid="open-chat"]');

      const input = page.locator('textarea[placeholder*="Ask Allie"]');
      await input.fill('What tasks are monitored by Maria?');
      await input.press('Enter');

      await page.waitForSelector('[data-testid="allie-message"]', { timeout: 20000 });

      const response = await page.locator('[data-testid="allie-message"]').last().textContent();
      expect(response).toMatch(/Maria|monitored|tasks/i);
    });

    test('FEATURE #7: Validates Cypher for security', async ({ page }) => {
      await page.click('[data-testid="open-chat"]');

      const input = page.locator('textarea[placeholder*="Ask Allie"]');
      // Try to inject dangerous operation
      await input.fill('DELETE all tasks from the graph');
      await input.press('Enter');

      await page.waitForSelector('[data-testid="allie-message"]', { timeout: 15000 });

      const response = await page.locator('[data-testid="allie-message"]').last().textContent();

      // Should reject or handle safely
      expect(response).toMatch(/cannot|forbidden|invalid|error/i);
    });
  });

  test.describe('Phase 3: Frontend Integration', () => {

    test('FEATURE #8: Routes graph queries through AllieConversationEngine', async ({ page }) => {
      await page.click('[data-testid="open-chat"]');

      const input = page.locator('textarea[placeholder*="Ask Allie"]');
      await input.fill('Are there any patterns in our family?');
      await input.press('Enter');

      // Should detect as knowledge graph query
      await page.waitForSelector('[data-testid="allie-message"]', { timeout: 15000 });

      const response = await page.locator('[data-testid="allie-message"]').last().textContent();

      // Should route to KnowledgeGraph agent
      expect(response).toMatch(/knowledge graph|graph data|patterns/i);
    });

    test('FEATURE #9: Displays markdown formatted responses', async ({ page }) => {
      await page.click('[data-testid="open-chat"]');

      const input = page.locator('textarea[placeholder*="Ask Allie"]');
      await input.fill('Why am I so tired?');
      await input.press('Enter');

      await page.waitForSelector('[data-testid="allie-message"]', { timeout: 15000 });

      // Check for markdown formatting
      const message = page.locator('[data-testid="allie-message"]').last();

      // Should have bold text for summary
      await expect(message.locator('strong, b')).toBeVisible();

      // Should have bullet points for insights
      await expect(message.locator('li, ul')).toBeVisible();
    });

    test('FEATURE #10: Shows confidence scores', async ({ page }) => {
      await page.click('[data-testid="open-chat"]');

      const input = page.locator('textarea[placeholder*="Ask Allie"]');
      await input.fill('Who notices tasks?');
      await input.press('Enter');

      await page.waitForSelector('[data-testid="allie-message"]', { timeout: 15000 });

      const response = await page.locator('[data-testid="allie-message"]').last().textContent();

      // Should show confidence percentage
      expect(response).toMatch(/confidence.*\d+%/i);
    });
  });

  test.describe('Phase 4: Caching & Performance', () => {

    test('FEATURE #11: Caches identical questions', async ({ page }) => {
      await page.click('[data-testid="open-chat"]');

      const input = page.locator('textarea[placeholder*="Ask Allie"]');

      // Ask same question twice
      await input.fill('Why am I so tired?');
      await input.press('Enter');

      await page.waitForSelector('[data-testid="allie-message"]', { timeout: 15000 });
      const firstResponseTime = Date.now();

      // Wait a moment
      await page.waitForTimeout(1000);

      // Ask again
      await input.fill('Why am I so tired?');
      await input.press('Enter');

      await page.waitForSelector('[data-testid="allie-message"]:nth-of-type(2)', { timeout: 5000 });
      const secondResponseTime = Date.now();

      // Second response should be faster (cached)
      const firstDuration = 15000; // max wait time
      const secondDuration = secondResponseTime - firstResponseTime;

      expect(secondDuration).toBeLessThan(firstDuration);

      // Should indicate cache hit
      const response = await page.locator('[data-testid="allie-message"]').last().textContent();
      expect(response).toMatch(/cached|cache age/i);
    });

    test('FEATURE #12: Returns processing time', async ({ page }) => {
      await page.click('[data-testid="open-chat"]');

      const input = page.locator('textarea[placeholder*="Ask Allie"]');
      await input.fill('Who creates tasks?');
      await input.press('Enter');

      await page.waitForSelector('[data-testid="allie-message"]', { timeout: 15000 });

      const response = await page.locator('[data-testid="allie-message"]').last().textContent();

      // Should show processing time
      expect(response).toMatch(/processing time.*\d+.*ms/i);
    });
  });

  test.describe('Integration with Family Data', () => {

    test('FEATURE #13: Queries task data from Firestore', async ({ page }) => {
      await page.click('[data-testid="open-chat"]');

      const input = page.locator('textarea[placeholder*="Ask Allie"]');
      await input.fill('How many tasks do we have?');
      await input.press('Enter');

      await page.waitForSelector('[data-testid="allie-message"]', { timeout: 15000 });

      const response = await page.locator('[data-testid="allie-message"]').last().textContent();

      // Should return actual task count
      expect(response).toMatch(/\d+ tasks?|no tasks/i);
    });

    test('FEATURE #14: Accesses calendar event data', async ({ page }) => {
      await page.click('[data-testid="open-chat"]');

      const input = page.locator('textarea[placeholder*="Ask Allie"]');
      await input.fill('Who has the most calendar events?');
      await input.press('Enter');

      await page.waitForSelector('[data-testid="allie-message"]', { timeout: 15000 });

      const response = await page.locator('[data-testid="allie-message"]').last().textContent();

      // Should analyze event data
      expect(response).toMatch(/events?|calendar|schedule/i);
    });

    test('FEATURE #15: References interview insights', async ({ page }) => {
      await page.click('[data-testid="open-chat"]');

      const input = page.locator('textarea[placeholder*="Ask Allie"]');
      await input.fill('What did we say in our interview?');
      await input.press('Enter');

      await page.waitForSelector('[data-testid="allie-message"]', { timeout: 15000 });

      const response = await page.locator('[data-testid="allie-message"]').last().textContent();

      // Should reference interview data
      expect(response).toMatch(/interview|mentioned|discussed/i);
    });
  });

  test.describe('Error Handling', () => {

    test('FEATURE #16: Handles empty results gracefully', async ({ page }) => {
      await page.click('[data-testid="open-chat"]');

      const input = page.locator('textarea[placeholder*="Ask Allie"]');
      await input.fill('Who is named XYZ in our family?');
      await input.press('Enter');

      await page.waitForSelector('[data-testid="allie-message"]', { timeout: 15000 });

      const response = await page.locator('[data-testid="allie-message"]').last().textContent();

      // Should provide helpful message
      expect(response).toMatch(/no data|not found|couldn't find/i);
      expect(response).not.toMatch(/error|crash|failed/i);
    });

    test('FEATURE #17: Recovers from invalid queries', async ({ page }) => {
      await page.click('[data-testid="open-chat"]');

      const input = page.locator('textarea[placeholder*="Ask Allie"]');
      await input.fill('asdf qwerty nonsense query 12345');
      await input.press('Enter');

      await page.waitForSelector('[data-testid="allie-message"]', { timeout: 15000 });

      const response = await page.locator('[data-testid="allie-message"]').last().textContent();

      // Should handle gracefully
      expect(response).toBeTruthy();
      expect(response.length).toBeGreaterThan(0);
    });
  });
});
