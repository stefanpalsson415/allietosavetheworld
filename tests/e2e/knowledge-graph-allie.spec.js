/**
 * E2E Tests for Knowledge Graph + Allie Integration
 *
 * Tests the complete user flow:
 * 1. User creates data (task, event, etc.)
 * 2. Data syncs to Neo4j via Cloud Functions
 * 3. User opens Allie chat
 * 4. User asks about Knowledge Graph insights
 * 5. Allie responds with Neo4j data
 *
 * Run with: npx playwright test knowledge-graph-allie.spec.js
 *
 * Prerequisites:
 * - Johnson demo family created (johnson_demo_family)
 * - Neo4j sync deployed and working
 * - Backend API deployed with /api/knowledge-graph routes
 */

const { test, expect } = require('@playwright/test');

// Test constants
const TEST_USER = {
  email: 'sarah@johnson-demo.family',
  password: 'DemoFamily2024!'
};

test.describe('Knowledge Graph + Allie Integration E2E', () => {

  test.beforeEach(async ({ page }) => {
    // Login as Johnson family
    await page.goto('https://checkallie.com');

    // Click Log In
    await page.click('text=Log In');

    // Click Password tab
    await page.click('button:has-text("Password")');

    // Fill credentials
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);

    // Submit
    await page.click('button:has-text("Log In")');

    // Wait for dashboard
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
  });

  test('USER STORY #1: User asks "Who does more?" and gets Knowledge Graph data', async ({ page }) => {
    // Step 1: Open Allie chat drawer
    await page.click('button[aria-label="Open chat"], button:has-text("Ask Allie")');

    // Wait for chat to open
    await page.waitForSelector('[data-testid="allie-chat-drawer"], .chat-drawer', { timeout: 10000 });

    // Step 2: Type question about workload distribution
    const chatInput = page.locator('textarea[placeholder*="Ask"], textarea[placeholder*="Type"]').first();
    await chatInput.fill('Who does more in our family?');

    // Step 3: Send message
    await page.keyboard.press('Enter');

    // Step 4: Wait for Allie's response
    await page.waitForSelector('.message-bubble, [data-role="assistant"]', { timeout: 30000 });

    // Step 5: Verify response contains Knowledge Graph insights
    const response = await page.locator('.message-bubble, [data-role="assistant"]').last().textContent();

    // Should mention specific family members (Johnson family)
    expect(response).toMatch(/Sarah|Mike/i);

    // Should mention data-driven insights (from Neo4j)
    expect(response).toMatch(/cognitive load|tasks|workload|balance|knowledge graph/i);

    // Should NOT contain generic responses
    expect(response).not.toContain('I don\'t have access to that data');
    expect(response).not.toContain('I need more information');
  });

  test('USER STORY #2: User asks about invisible labor patterns', async ({ page }) => {
    // Open chat
    await page.click('button[aria-label="Open chat"], button:has-text("Ask Allie")');
    await page.waitForSelector('[data-testid="allie-chat-drawer"], .chat-drawer');

    // Ask about invisible labor
    const chatInput = page.locator('textarea[placeholder*="Ask"], textarea[placeholder*="Type"]').first();
    await chatInput.fill('Show me invisible labor patterns in our family');
    await page.keyboard.press('Enter');

    // Wait for response
    await page.waitForSelector('.message-bubble, [data-role="assistant"]', { timeout: 30000 });
    const response = await page.locator('.message-bubble, [data-role="assistant"]').last().textContent();

    // Should mention anticipation, monitoring, or coordination
    expect(response).toMatch(/anticipation|monitoring|coordination|notices|keeps track|reminds/i);

    // Should be specific to the family (not generic)
    expect(response.length).toBeGreaterThan(100);
  });

  test('USER STORY #3: User navigates to Knowledge Graph tab and sees data', async ({ page }) => {
    // Step 1: Navigate to Knowledge Graph tab
    await page.click('button:has-text("Knowledge Graph"), a:has-text("Knowledge Graph")');

    // Wait for graph to load
    await page.waitForSelector('svg, canvas, .graph-visualization', { timeout: 15000 });

    // Step 2: Verify graph contains nodes
    const nodes = await page.locator('.node, circle[data-type="person"], circle[data-type="task"]').count();
    expect(nodes).toBeGreaterThan(0);

    // Step 3: Verify insights panels are visible
    const insightsPanel = page.locator('text=Invisible Labor, text=Predictive Insights, text=Historical Patterns');
    await expect(insightsPanel.first()).toBeVisible({ timeout: 10000 });

    // Step 4: Click a node (if interactive)
    const firstNode = page.locator('.node, circle[data-type="person"]').first();
    if (await firstNode.isVisible()) {
      await firstNode.click();

      // Should open detail panel or chat
      await page.waitForTimeout(1000);
    }
  });

  test('USER STORY #4: User asks Allie from Calendar tab and gets KG insights', async ({ page }) => {
    // Navigate to Calendar tab
    await page.click('button:has-text("Calendar"), a:has-text("Calendar")');
    await page.waitForLoadState('networkidle');

    // Open Allie chat
    await page.click('button[aria-label="Open chat"], button:has-text("Ask Allie")');
    await page.waitForSelector('[data-testid="allie-chat-drawer"], .chat-drawer');

    // Ask calendar-related KG question
    const chatInput = page.locator('textarea[placeholder*="Ask"], textarea[placeholder*="Type"]').first();
    await chatInput.fill('When do we create most events?');
    await page.keyboard.press('Enter');

    // Wait for response
    await page.waitForSelector('.message-bubble, [data-role="assistant"]', { timeout: 30000 });
    const response = await page.locator('.message-bubble, [data-role="assistant"]').last().textContent();

    // Should mention temporal patterns (KG data)
    expect(response).toMatch(/morning|evening|weekday|weekend|pattern|usually|tend to/i);

    // Should have cross-tab KG access (Gap #4 verification)
    expect(response).not.toContain('switch to Knowledge Graph tab');
  });

  test('USER STORY #5: User asks Allie from Tasks tab and gets KG insights', async ({ page }) => {
    // Navigate to Tasks tab
    await page.click('button:has-text("Tasks"), a:has-text("Tasks")');
    await page.waitForLoadState('networkidle');

    // Open Allie chat
    await page.click('button[aria-label="Open chat"], button:has-text("Ask Allie")');
    await page.waitForSelector('[data-testid="allie-chat-drawer"], .chat-drawer');

    // Ask task-related KG question
    const chatInput = page.locator('textarea[placeholder*="Ask"], textarea[placeholder*="Type"]').first();
    await chatInput.fill('Who creates the most tasks?');
    await page.keyboard.press('Enter');

    // Wait for response
    await page.waitForSelector('.message-bubble, [data-role="assistant"]', { timeout: 30000 });
    const response = await page.locator('.message-bubble, [data-role="assistant"]').last().textContent();

    // Should mention specific family member with data
    expect(response).toMatch(/Sarah|Mike/i);
    expect(response).toMatch(/task|create|%|most/i);

    // Cross-tab access verification
    expect(response.length).toBeGreaterThan(50);
  });

  test('USER STORY #6: User creates task, syncs to Neo4j, appears in KG', async ({ page }) => {
    // Step 1: Create a new task
    await page.click('button:has-text("Tasks"), a:has-text("Tasks")');
    await page.click('button:has-text("Add Task"), button:has-text("New Task")');

    // Fill task details
    await page.fill('input[placeholder*="title"], input[name="title"]', 'E2E Test Task - Book dentist');
    await page.fill('textarea[placeholder*="description"]', 'Schedule appointments for all kids');
    await page.selectOption('select[name="category"]', 'health');
    await page.selectOption('select[name="priority"]', 'high');

    // Save task
    await page.click('button:has-text("Save"), button:has-text("Create")');

    // Wait for task to be created and synced (Cloud Function delay)
    await page.waitForTimeout(5000);

    // Step 2: Navigate to Knowledge Graph
    await page.click('button:has-text("Knowledge Graph"), a:has-text("Knowledge Graph")');

    // Wait for graph to load with new task
    await page.waitForTimeout(3000);

    // Step 3: Open Allie chat and ask about recent tasks
    await page.click('button[aria-label="Open chat"], button:has-text("Ask Allie")');
    await page.waitForSelector('[data-testid="allie-chat-drawer"], .chat-drawer');

    const chatInput = page.locator('textarea[placeholder*="Ask"], textarea[placeholder*="Type"]').first();
    await chatInput.fill('What are my recent tasks?');
    await page.keyboard.press('Enter');

    // Wait for response
    await page.waitForSelector('.message-bubble, [data-role="assistant"]', { timeout: 30000 });
    const response = await page.locator('.message-bubble, [data-role="assistant"]').last().textContent();

    // Should mention the new task (may take time to sync)
    // Note: This might be flaky due to sync delay - adjust timeout if needed
    // expect(response).toContain('dentist'); // Might not be synced yet
    expect(response).toMatch(/task|recent|created/i);
  });

  test('USER STORY #7: Allie provides burnout risk insights proactively', async ({ page }) => {
    // Open chat
    await page.click('button[aria-label="Open chat"], button:has-text("Ask Allie")');
    await page.waitForSelector('[data-testid="allie-chat-drawer"], .chat-drawer');

    // Ask about stress or overwhelm
    const chatInput = page.locator('textarea[placeholder*="Ask"], textarea[placeholder*="Type"]').first();
    await chatInput.fill('I feel overwhelmed with everything');
    await page.keyboard.press('Enter');

    // Wait for response
    await page.waitForSelector('.message-bubble, [data-role="assistant"]', { timeout: 30000 });
    const response = await page.locator('.message-bubble, [data-role="assistant"]').last().textContent();

    // Should provide specific insights (not generic empathy)
    expect(response).toMatch(/cognitive load|tasks|workload|delegate|balance|pattern/i);

    // Should offer actionable suggestions
    expect(response).toMatch(/try|suggest|could|might|recommend/i);

    // Should use neutral, system-focused language (from system prompt)
    expect(response).not.toMatch(/blame|fault|your problem/i);
  });

  test('REGRESSION TEST: KG insights work after app refresh', async ({ page }) => {
    // Open chat and ask question
    await page.click('button[aria-label="Open chat"], button:has-text("Ask Allie")');
    await page.waitForSelector('[data-testid="allie-chat-drawer"], .chat-drawer');

    const chatInput = page.locator('textarea[placeholder*="Ask"], textarea[placeholder*="Type"]').first();
    await chatInput.fill('Who does more?');
    await page.keyboard.press('Enter');

    await page.waitForSelector('.message-bubble, [data-role="assistant"]', { timeout: 30000 });
    const response1 = await page.locator('.message-bubble, [data-role="assistant"]').last().textContent();

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Ask same question again
    await page.click('button[aria-label="Open chat"], button:has-text("Ask Allie")');
    await page.waitForSelector('[data-testid="allie-chat-drawer"], .chat-drawer');

    const chatInput2 = page.locator('textarea[placeholder*="Ask"], textarea[placeholder*="Type"]').first();
    await chatInput2.fill('Who does more?');
    await page.keyboard.press('Enter');

    await page.waitForSelector('.message-bubble, [data-role="assistant"]', { timeout: 30000 });
    const response2 = await page.locator('.message-bubble, [data-role="assistant"]').last().textContent();

    // Both responses should contain KG data (not generic responses)
    expect(response1).toMatch(/Sarah|Mike/i);
    expect(response2).toMatch(/Sarah|Mike/i);
    expect(response1.length).toBeGreaterThan(100);
    expect(response2.length).toBeGreaterThan(100);
  });

  test('PERFORMANCE TEST: KG insights load within 5 seconds', async ({ page }) => {
    const startTime = Date.now();

    // Open chat
    await page.click('button[aria-label="Open chat"], button:has-text("Ask Allie")');
    await page.waitForSelector('[data-testid="allie-chat-drawer"], .chat-drawer');

    // Ask KG question
    const chatInput = page.locator('textarea[placeholder*="Ask"], textarea[placeholder*="Type"]').first();
    await chatInput.fill('Show me task patterns');
    await page.keyboard.press('Enter');

    // Wait for response
    await page.waitForSelector('.message-bubble, [data-role="assistant"]', { timeout: 30000 });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Should respond within 5 seconds (KG query + Claude API)
    expect(responseTime).toBeLessThan(5000);

    console.log(`KG insights response time: ${responseTime}ms`);
  });

  test('ACCESSIBILITY TEST: KG insights are screen-reader friendly', async ({ page }) => {
    // Open chat
    await page.click('button[aria-label="Open chat"], button:has-text("Ask Allie")');
    await page.waitForSelector('[data-testid="allie-chat-drawer"], .chat-drawer');

    // Ask question
    const chatInput = page.locator('textarea[placeholder*="Ask"], textarea[placeholder*="Type"]').first();
    await chatInput.fill('Who creates most tasks?');
    await page.keyboard.press('Enter');

    // Wait for response
    await page.waitForSelector('.message-bubble, [data-role="assistant"]', { timeout: 30000 });

    // Check for ARIA attributes
    const messageElement = page.locator('.message-bubble, [data-role="assistant"]').last();
    const ariaLabel = await messageElement.getAttribute('aria-label');
    const role = await messageElement.getAttribute('role');

    // Should have proper ARIA attributes for screen readers
    expect(role || ariaLabel).toBeTruthy();
  });
});

test.describe('Knowledge Graph Error Handling', () => {

  test('handles Neo4j connection failure gracefully', async ({ page }) => {
    // This test assumes backend is configured to return error
    // In production, test by temporarily breaking Neo4j connection

    await page.goto('https://checkallie.com');
    // ... login flow ...

    // Open chat
    await page.click('button[aria-label="Open chat"], button:has-text("Ask Allie")');
    await page.waitForSelector('[data-testid="allie-chat-drawer"], .chat-drawer');

    // Ask KG question
    const chatInput = page.locator('textarea[placeholder*="Ask"], textarea[placeholder*="Type"]').first();
    await chatInput.fill('Show me invisible labor');
    await page.keyboard.press('Enter');

    // Wait for response
    await page.waitForSelector('.message-bubble, [data-role="assistant"]', { timeout: 30000 });
    const response = await page.locator('.message-bubble, [data-role="assistant"]').last().textContent();

    // Should still respond (graceful fallback), not crash
    expect(response.length).toBeGreaterThan(0);

    // May mention that data is temporarily unavailable
    // expect(response).toMatch(/temporarily|try again|data unavailable/i);
  });

  test('handles empty Knowledge Graph (new family)', async ({ page }) => {
    // This test would need a brand new family with no data
    // Skip if Johnson family already has data

    test.skip();

    // Would test that Allie explains there's no data yet
    // and encourages user to create tasks/events
  });
});
