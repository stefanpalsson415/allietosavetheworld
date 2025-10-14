# Calendar CRUD Testing Framework

This document provides an overview of the calendar CRUD testing framework developed to test the calendar functionality.

## Completed Work

1. **Enhanced Test Framework**
   - Developed robust test helper functions with multiple selector strategies
   - Added extensive error handling and recovery mechanisms
   - Implemented automatic retries for flaky operations
   - Added detailed logging and screenshots for better debugging
   - Created modular helper function library for test reusability

2. **Playwright Configuration Enhancements**
   - Increased timeouts for complex calendar operations
   - Configured sequential test execution to prevent interference
   - Added tracing, screenshots, and video recording
   - Optimized viewport settings and browser launch options

3. **Global Test Setup**
   - Created directory structure for test artifacts
   - Added optional authentication setup
   - Implemented shared configuration for tests

4. **Mock Testing Framework**
   - Developed a simple mock calendar implementation for testing
   - Created tests for all CRUD operations:
     - 1.1 Create event - Click empty slot, fill Title, set Date and Save
     - 1.2 Edit event - Open event, change title and time, Save
     - 1.3 Delete event - Open event, Delete, Confirm
     - 1.4 Unsaved change guard - Open event, change time, click X without saving, confirm dialog appears

5. **Visual Regression Tests**
   - Added tests for calendar layout verification
   - Implemented responsive design testing
   - Created view toggle tests

6. **CI Integration Documentation**
   - Added guidelines for integrating tests with CI systems
   - Documented cleanup strategies for test data
   - Provided troubleshooting steps for CI environments

## Test Files

- `tests/calendar-crud.spec.js` - Original calendar CRUD tests (requires valid authentication)
- `tests/calendar-crud-refactored.spec.js` - Refactored tests using helper functions
- `tests/calendar-visual.spec.js` - Visual regression tests for calendar layout
- `tests/simple-mock-calendar.spec.js` - Simple mock calendar tests
- `tests/helpers/calendar-test-helpers.js` - Shared test helper functions
- `tests/global-setup.js` - Global test setup and configuration
- `tests/CI_TESTING.md` - Documentation for CI integration

## Running Tests

Run the basic mock calendar tests:
```bash
npx playwright test tests/simple-mock-calendar.spec.js
```

Run the refactored tests (requires valid authentication):
```bash
npx playwright test tests/calendar-crud-refactored.spec.js
```

Run visual regression tests:
```bash
npx playwright test tests/calendar-visual.spec.js
```

Run all tests sequentially:
```bash
npx playwright test
```

Run tests with specific browser:
```bash
npx playwright test --project=chromium
```

View test report:
```bash
npx playwright show-report
```

## Authentication Issues

The actual calendar tests are currently failing because:

1. The application redirects to a login page
2. The test login credentials (`test@example.com` / `password`) are not accepted
3. After failed login, the application redirects back to the landing page rather than the dashboard

To resolve this, we need:
1. Valid test credentials for the application
2. Or a mechanism to bypass authentication in test environments

## Helper Functions

The `calendar-test-helpers.js` module provides reusable functions for:

- **Navigation**: Reliable page navigation with retry support
- **Authentication**: Robust login handling with multiple selector strategies
- **Calendar Interaction**: Finding and clicking calendar cells
- **Event Management**: Creating, editing, and deleting events
- **Form Handling**: Filling event details, selecting dates
- **Verification**: Waiting for success messages, verifying events
- **Cleanup**: Test data removal after tests

## Next Steps

1. **Fix Authentication**
   - Get valid test credentials for the application
   - Or implement a test-only authentication bypass

2. **Environment Configuration**
   - Set up a dedicated test environment with test data
   - Configure Firebase/Firestore rules to allow test operations

3. **CI Integration**
   - Add tests to CI pipeline
   - Configure artifact collection for test results

4. **Test Data Management**
   - Create fixtures for test data
   - Implement cleanup to remove test events after testing

5. **Expand Test Coverage**
   - Add tests for edge cases and error conditions
   - Test calendar filters and views
   - Test recurring events

## Using Test Helpers in New Tests

When creating new calendar tests, import the helper functions:

```javascript
const {
  navigateWithRetry,
  waitForCalendarLoad,
  login,
  createTestEvent,
  // ... other helpers
} = require('./helpers/calendar-test-helpers');

test('My new calendar test', async ({ page }) => {
  // Use helper functions for reliable testing
  await navigateWithRetry(page, '/dashboard?tab=calendar', 3);
  await waitForCalendarLoad(page);
  
  // Generate a unique title to avoid conflicts
  const eventTitle = `test-${Date.now().toString().slice(-6)}: My Event`;
  
  // Create an event using the helper
  await createTestEvent(page, eventTitle, { year: 2025, month: 5, day: 15 });
  
  // Test assertions
  await expect(page.locator(`text="${eventTitle}"`)).toBeVisible();
});
```

## Additional Enhancements

- Consider using Playwright Test API for more dynamic test creation
- Add end-to-end tests that integrate with other components
- Implement parallel test execution with isolated test data
- Add performance testing for calendar operations
- Create API-level tests for backend calendar operations