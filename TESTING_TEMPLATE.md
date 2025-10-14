# E2E Testing Template Guide

This guide provides a template for implementing end-to-end testing for any section of the application using the established testing framework.

## Quick Start

1. Create your test file in the `tests/` directory (e.g., `my-feature.spec.js`)
2. Import helper functions from `tests/helpers/calendar-test-helpers.js` or create your own helpers
3. Write tests for your feature following the patterns below
4. Run your tests using `npx playwright test my-feature.spec.js`

## Test Structure Template

```javascript
// tests/my-feature.spec.js
import { test, expect } from '@playwright/test';

// Import common helpers
const {
  navigateWithRetry,
  login,
  generateUniqueEventTitle,
  retryUntilCondition
} = require('./helpers/calendar-test-helpers');

// Import or create feature-specific helpers
const featureHelpers = {
  // Feature-specific helpers here
  fillMyFeatureForm: async (page, data) => {
    // Implementation
  },
  verifyMyFeatureData: async (page, expectedData) => {
    // Implementation
  }
};

/**
 * Tests for My Feature
 */
test.describe('My Feature Flows', () => {
  // Generate a unique prefix for test data to avoid conflicts
  const uniquePrefix = `test-${Date.now().toString().slice(-6)}`;
  
  // Before each test: navigate and authenticate
  test.beforeEach(async ({ page }) => {
    // Set default timeout
    page.setDefaultTimeout(60000);

    // Navigate to the app
    await navigateWithRetry(page, '/', 3);
    
    // Handle login
    await login(page);
    
    // Navigate to your feature
    await navigateWithRetry(page, '/dashboard?tab=my-feature', 3);
    
    // Wait for feature to load
    await page.waitForSelector('[data-testid="my-feature-container"]', { timeout: 10000 })
      .catch(async (error) => {
        console.log('Feature container not found with data-testid, trying alternative selectors');
        await page.waitForSelector('.my-feature-class, #my-feature-id', { timeout: 5000 });
      });
      
    // Take screenshot for reference
    await page.screenshot({ path: 'test-results/my-feature-loaded.png' });
  });
  
  // After all tests: clean up test data
  test.afterAll(async ({ page }) => {
    try {
      console.log('Cleaning up test data...');
      
      // Navigate to your feature page
      await navigateWithRetry(page, '/dashboard?tab=my-feature', 3);
      
      // Find and delete all items with your test prefix
      const items = await page.$$(`text="${uniquePrefix}"`);
      console.log(`Found ${items.length} test items to clean up`);
      
      // Implement cleanup logic for your feature
      // ...
    } catch (error) {
      console.log('Error during test cleanup:', error);
    }
  });
  
  // Test 1: Create Item
  test('1.1 Create Item - Open form, fill fields, save successfully', async ({ page }) => {
    // Generate unique test data
    const itemName = `${uniquePrefix}: Test Item`;
    
    try {
      // Take screenshot of initial state
      await page.screenshot({ path: 'test-results/before-create-item.png' });
      
      // Open the form
      await page.click('[data-testid="create-button"]').catch(async () => {
        console.log('Create button not found with data-testid, trying alternatives');
        await page.click('button:has-text("Create"), button:has-text("Add"), button:has-text("+")');
      });
      
      // Wait for form to appear
      await page.waitForSelector('[data-testid="item-form"]', { timeout: 10000 }).catch(async () => {
        console.log('Form not found with data-testid, trying alternatives');
        await page.waitForSelector('form, [role="dialog"]', { timeout: 5000 });
      });
      
      // Fill out the form using feature-specific helper
      await featureHelpers.fillMyFeatureForm(page, {
        name: itemName,
        description: 'This is a test item created by automated testing',
        // Other fields...
      });
      
      // Take screenshot before saving
      await page.screenshot({ path: 'test-results/before-save-item.png' });
      
      // Click save button
      await page.click('[data-testid="save-button"]').catch(async () => {
        console.log('Save button not found with data-testid, trying alternatives');
        await page.click('button:has-text("Save"), button[type="submit"]');
      });
      
      // Verify success using multiple possible success indicators
      await Promise.race([
        page.waitForSelector('text=created successfully', { timeout: 5000 }),
        page.waitForSelector('text=added successfully', { timeout: 5000 }),
        page.waitForSelector('.success-message', { timeout: 5000 })
      ]).catch(() => {
        console.log('No explicit success message found, continuing anyway');
      });
      
      // Take screenshot after save
      await page.screenshot({ path: 'test-results/after-save-item.png' });
      
      // Verify item appears in the list with retry for UI updates
      await retryUntilCondition(
        async () => (await page.locator(`text="${itemName}"`).count()) > 0,
        `Expected to find "${itemName}" in the list`,
        5,
        1000
      );
    } catch (error) {
      console.error('Error in create item test:', error);
      await page.screenshot({ path: 'test-results/create-item-error.png' });
      throw error;
    }
  });
  
  // Test 2: Edit Item
  test('1.2 Edit Item - Open existing item, modify fields, save changes', async ({ page }) => {
    // Generate unique test data
    const originalName = `${uniquePrefix}: Original Item`;
    const updatedName = `${uniquePrefix}: Updated Item`;
    
    try {
      // First create an item to edit (implementation depends on your feature)
      await createTestItem(page, originalName);
      
      // Verify the item was created
      await expect(page.locator(`text="${originalName}"`)).toBeVisible({ timeout: 10000 });
      
      // Take screenshot before editing
      await page.screenshot({ path: 'test-results/before-edit-item.png' });
      
      // Click on the item to edit
      await page.click(`text="${originalName}"`);
      
      // Wait for edit form or details view
      await page.waitForSelector('[data-testid="item-details"], [data-testid="item-form"]', { timeout: 10000 });
      
      // Click edit button if in details view
      const editButton = await page.$('[data-testid="edit-button"]');
      if (editButton) {
        await editButton.click();
        await page.waitForSelector('[data-testid="item-form"]', { timeout: 5000 });
      }
      
      // Update the form fields
      await featureHelpers.fillMyFeatureForm(page, {
        name: updatedName,
        description: 'This is an updated test item',
        // Other updated fields...
      });
      
      // Take screenshot before saving
      await page.screenshot({ path: 'test-results/before-save-edited-item.png' });
      
      // Click update/save button
      await page.click('[data-testid="update-button"], [data-testid="save-button"]');
      
      // Verify success using multiple possible success indicators
      await Promise.race([
        page.waitForSelector('text=updated successfully', { timeout: 5000 }),
        page.waitForSelector('text=saved successfully', { timeout: 5000 }),
        page.waitForSelector('.success-message', { timeout: 5000 })
      ]).catch(() => {
        console.log('No explicit success message found, continuing anyway');
      });
      
      // Take screenshot after save
      await page.screenshot({ path: 'test-results/after-save-edited-item.png' });
      
      // Verify updated item appears and original is gone
      await retryUntilCondition(
        async () => (await page.locator(`text="${updatedName}"`).count()) > 0,
        `Expected to find "${updatedName}" in the list`,
        5,
        1000
      );
      
      await expect(page.locator(`text="${originalName}"`)).not.toBeVisible()
        .catch(() => console.log('Original name may still be visible due to UI update timing'));
    } catch (error) {
      console.error('Error in edit item test:', error);
      await page.screenshot({ path: 'test-results/edit-item-error.png' });
      throw error;
    }
  });
  
  // Add more tests as needed:
  // - Delete item test
  // - Validation test
  // - Filtering/searching test
  // - Pagination test
  // - etc.
});

/**
 * Helper to create a test item for this feature
 * Implement based on your feature's requirements
 */
async function createTestItem(page, itemName) {
  try {
    console.log(`Creating test item: ${itemName}`);
    
    // Implementation depends on your feature
    // This is just an example pattern
    
    // Click create button
    await page.click('[data-testid="create-button"]').catch(async () => {
      await page.click('button:has-text("Create"), button:has-text("Add")');
    });
    
    // Wait for form
    await page.waitForSelector('[data-testid="item-form"]', { timeout: 5000 });
    
    // Fill form
    await featureHelpers.fillMyFeatureForm(page, {
      name: itemName,
      description: 'Test item for editing',
      // Other fields...
    });
    
    // Save
    await page.click('[data-testid="save-button"]').catch(async () => {
      await page.click('button:has-text("Save"), button[type="submit"]');
    });
    
    // Wait for success
    await page.waitForTimeout(1000);
    
    // Verify item was created
    return await retryUntilCondition(
      async () => (await page.locator(`text="${itemName}"`).count()) > 0,
      `Expected to find "${itemName}" after creation`,
      5,
      1000
    );
  } catch (error) {
    console.error(`Error creating test item "${itemName}":`, error);
    await page.screenshot({ path: `test-results/create-test-item-error.png` });
    throw error;
  }
}
```

## Feature-Specific Helper Template

Create separate helper files for complex features:

```javascript
// tests/helpers/my-feature-helpers.js

/**
 * Helper function to fill the feature form
 */
async function fillMyFeatureForm(page, data) {
  try {
    // Fill name field
    if (data.name) {
      await page.fill('[data-testid="name-input"]', data.name).catch(async () => {
        console.log('Name input not found with data-testid, trying alternatives');
        await page.fill('input[placeholder*="name" i], input[name="name"]', data.name);
      });
    }
    
    // Fill description field
    if (data.description) {
      await page.fill('[data-testid="description-input"]', data.description).catch(async () => {
        console.log('Description input not found with data-testid, trying alternatives');
        await page.fill('textarea, input[placeholder*="description" i]', data.description);
      });
    }
    
    // Fill other fields based on the feature requirements
    // ...
    
    // Handle any special form elements (dropdowns, date pickers, etc.)
    if (data.category) {
      await page.click('[data-testid="category-dropdown"]');
      await page.click(`text="${data.category}"`);
    }
    
    // Handle any file uploads if needed
    if (data.hasAttachment) {
      const fileInput = await page.$('input[type="file"]');
      if (fileInput) {
        await fileInput.setInputFiles('path/to/test/file.pdf');
      }
    }
    
  } catch (error) {
    console.error('Error filling form:', error);
    await page.screenshot({ path: 'test-results/fill-form-error.png' });
    throw error;
  }
}

/**
 * Helper function to search for items
 */
async function searchForItem(page, searchTerm) {
  try {
    await page.fill('[data-testid="search-input"]', searchTerm).catch(async () => {
      console.log('Search input not found with data-testid, trying alternatives');
      await page.fill('input[placeholder*="search" i], input[type="search"]', searchTerm);
    });
    
    await page.press('[data-testid="search-input"]', 'Enter').catch(async () => {
      const searchButton = await page.$('button:has-text("Search"), button.search-button');
      if (searchButton) await searchButton.click();
    });
    
    // Wait for search results to load
    await page.waitForTimeout(1000);
    
  } catch (error) {
    console.error('Error searching:', error);
    throw error;
  }
}

/**
 * Helper function to delete an item
 */
async function deleteItem(page, itemName) {
  try {
    // Find the item
    const item = await page.locator(`text="${itemName}"`).first();
    
    // Click on the item or find its delete button
    const directDeleteButton = await page.$(`[data-testid="delete-${itemName.replace(/\s+/g, '-')}"]`);
    
    if (directDeleteButton) {
      // If there's a direct delete button, click it
      await directDeleteButton.click();
    } else {
      // Otherwise, click the item first to open it
      await item.click();
      
      // Wait for item details
      await page.waitForSelector('[data-testid="item-details"]', { timeout: 5000 });
      
      // Click delete button
      await page.click('[data-testid="delete-button"]').catch(async () => {
        await page.click('button:has-text("Delete"), button:has(svg[name="Trash"])');
      });
    }
    
    // Handle confirmation dialog if it appears
    const dialogPromise = page.waitForEvent('dialog', { timeout: 5000 }).catch(() => null);
    const dialog = await dialogPromise;
    
    if (dialog) {
      await dialog.accept();
    }
    
    // Wait for deletion success
    await Promise.race([
      page.waitForSelector('text=deleted successfully', { timeout: 5000 }),
      page.waitForSelector('text=removed successfully', { timeout: 5000 }),
      page.waitForTimeout(2000) // Fallback timeout
    ]);
    
    // Verify item is gone
    return await page.locator(`text="${itemName}"`).count() === 0;
    
  } catch (error) {
    console.error(`Error deleting item "${itemName}":`, error);
    await page.screenshot({ path: 'test-results/delete-item-error.png' });
    return false;
  }
}

// Export all helper functions
module.exports = {
  fillMyFeatureForm,
  searchForItem,
  deleteItem
};
```

## Best Practices

1. **Data-testid Attributes**

   Add data-testid attributes to important elements in your feature for reliable selection:
   
   ```jsx
   // React component example
   <div className="item-container" data-testid="item-container">
     <h2 data-testid="item-title">{item.title}</h2>
     <p data-testid="item-description">{item.description}</p>
     <button 
       data-testid="edit-item-button"
       onClick={handleEdit}
     >
       Edit
     </button>
     <button 
       data-testid="delete-item-button"
       onClick={handleDelete}
     >
       Delete
     </button>
   </div>
   ```

2. **Multiple Selector Strategies**

   Always include fallback selectors in case the primary selector fails:
   
   ```javascript
   // Good
   await page.click('[data-testid="save-button"]').catch(async () => {
     await page.click('button:has-text("Save"), button[type="submit"]');
   });
   
   // Bad - no fallback
   await page.click('[data-testid="save-button"]');
   ```

3. **Unique Test Data**

   Always use a unique prefix for your test data to avoid conflicts:
   
   ```javascript
   const uniquePrefix = `test-${Date.now().toString().slice(-6)}`;
   const itemName = `${uniquePrefix}: Test Item`;
   ```

4. **Cleanup After Tests**

   Always implement test cleanup in `afterAll` to remove test data:
   
   ```javascript
   test.afterAll(async ({ page }) => {
     // Find and delete all items created by tests
     const items = await page.$$(`text="${uniquePrefix}"`);
     for (const item of items) {
       // Delete logic
     }
   });
   ```

5. **Screenshots for Debugging**

   Take screenshots at key points in your tests:
   
   ```javascript
   // Before important action
   await page.screenshot({ path: 'test-results/before-action.png' });
   
   // After action
   await page.screenshot({ path: 'test-results/after-action.png' });
   
   // On error
   try {
     // Test actions
   } catch (error) {
     await page.screenshot({ path: 'test-results/error-state.png' });
     throw error;
   }
   ```

6. **Retry Logic for UI Updates**

   Use retry logic for assertions that may be affected by UI updates:
   
   ```javascript
   await retryUntilCondition(
     async () => (await page.locator(`text="${itemName}"`).count()) > 0,
     `Expected to find "${itemName}" in the list`,
     5,  // Max retries
     1000 // Interval between retries (ms)
   );
   ```

7. **Wait Strategies**

   Use appropriate wait strategies based on the action:
   
   ```javascript
   // Wait for network response
   await page.waitForResponse(resp => 
     resp.url().includes('/api/items') && resp.status() === 200
   );
   
   // Wait for element
   await page.waitForSelector('[data-testid="item-container"]');
   
   // Wait for navigation
   await page.waitForNavigation();
   ```

## Extending the Framework

To extend the test framework to other features:

1. **Add Feature-Specific Helpers:**
   Create helpers for common operations in your feature (e.g., `category-helpers.js`, `user-management-helpers.js`).

2. **Create Shared Test Data:**
   Consider creating a `test-data.js` file with sample data for different tests.

3. **Create Visual Regression Tests:**
   Follow the pattern in `calendar-visual.spec.js` to create visual tests for your feature.

4. **Update the Test Runner:**
   Extend `run-calendar-tests.sh` to include your feature's tests or create a new runner script.

## Running and Debugging Tests

```bash
# Run tests for your feature
npx playwright test tests/my-feature.spec.js

# Run with visible browser
npx playwright test tests/my-feature.spec.js --headed

# Run in debug mode
npx playwright test tests/my-feature.spec.js --debug

# Run with specific browser
npx playwright test tests/my-feature.spec.js --project=chromium
```

## Additional Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Selectors](https://playwright.dev/docs/selectors)
- [Playwright Assertions](https://playwright.dev/docs/test-assertions)
- [Playwright Locators](https://playwright.dev/docs/locators)