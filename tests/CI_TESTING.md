# Calendar Testing in CI Environment

This document provides guidelines for running the calendar CRUD tests in a Continuous Integration (CI) environment.

## CI Configuration

### Prerequisites

1. **Node.js Environment**: Ensure the CI runner has Node.js 14+ installed
2. **Playwright Dependencies**: Install the browsers and dependencies
   ```yaml
   - name: Install Playwright browsers
     run: npx playwright install --with-deps
   ```
3. **Environment Variables**: Set up the following environment variables
   ```
   BASE_URL=https://your-staging-url.com
   TEST_USERNAME=testuser@example.com 
   TEST_PASSWORD=securepassword
   SETUP_AUTH=true
   ```

### Test Execution

Add the following steps to your CI workflow:

```yaml
- name: Install dependencies
  run: npm ci

- name: Run ESLint
  run: npm run lint

- name: Create mock test artifacts directory
  run: mkdir -p test-results

- name: Run mock calendar tests
  run: npx playwright test tests/simple-mock-calendar.spec.js

- name: Run real calendar tests (if auth configured)
  run: npx playwright test tests/calendar-crud.spec.js
  env:
    SETUP_AUTH: true
    TEST_USERNAME: ${{ secrets.TEST_USERNAME }}
    TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
  if: env.SETUP_AUTH == 'true'

- name: Upload test results
  uses: actions/upload-artifact@v2
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
    retention-days: 30
```

## Test Isolation Strategies

For CI environments, use the following best practices:

1. **Unique Test Data**: Generate unique identifiers for event titles
   ```javascript
   const uniquePrefix = `test-${Date.now().toString().slice(-6)}`;
   const eventTitle = `${uniquePrefix}: Team Meeting`;
   ```

2. **Clean Up After Tests**: Add cleanup hooks to delete test events
   ```javascript
   test.afterAll(async ({ page }) => {
     // Navigate to calendar
     await page.goto('/dashboard?tab=calendar');
     
     // Find and delete all events containing the test prefix
     const events = await page.$$(`text="${uniquePrefix}"`);
     for (const event of events) {
       await deleteTestEvent(page, event);
     }
   });
   ```

3. **Isolated Storage State**: Use separate auth sessions for each test run
   ```javascript
   const storageState = `auth-state-${process.env.CI_JOB_ID || Date.now()}.json`;
   ```

## Handling Flaky Tests

Calendar tests can be flaky due to animations, network delays, and complex interactions. Use these techniques:

1. **Increased Timeouts**: For CI specifically, increase timeouts
   ```javascript
   test.setTimeout(process.env.CI ? 180000 : 120000);
   ```

2. **Conditional Retries**: Increase retries in CI
   ```javascript
   // In playwright.config.js
   retries: process.env.CI ? 3 : 1,
   ```

3. **Visual Verification**: Use screenshots to verify test state
   ```javascript
   if (process.env.CI) {
     await page.screenshot({ path: 'test-results/calendar-state.png' });
   }
   ```

## Troubleshooting CI Failures

When tests fail in CI but pass locally:

1. **View Screenshots**: Examine the screenshots in the artifacts
2. **Check Environment**: Verify environment variables are correctly set
3. **Analyze Timing Issues**: Look for race conditions that may occur in CI
4. **Trace Viewing**: Use Playwright's trace viewer
   ```
   npx playwright show-trace trace.zip
   ```

## Example CI Job Output

A successful CI run should show:

```
Running 4 tests using 1 worker
  ✓ 1.1 Create event (5.3s)
  ✓ 1.2 Edit event (6.1s)
  ✓ 1.3 Delete event (4.8s)
  ✓ 1.4 Unsaved change guard (5.2s)

4 passed (21s)
```