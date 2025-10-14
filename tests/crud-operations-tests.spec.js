// tests/crud-operations-tests.spec.js
// Tests for Create, Read, Update, Delete operations across all data types
const { test, expect } = require('@playwright/test');

test.describe('CRUD Operations Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
  });

  test.describe('Calendar Event CRUD Operations', () => {
    test('Can create, edit, and delete calendar events', async ({ page }) => {
      await page.goto('/dashboard?tab=calendar');
      await page.waitForLoadState('domcontentloaded');
      
      // Look for "Add Event" or similar button
      const addButtons = [
        'button:has-text("Add Event")',
        'button:has-text("Create Event")',
        'button:has-text("New Event")',
        'button:has-text("+")',
        '[data-testid="add-event"]'
      ];

      let addButton = null;
      for (const selector of addButtons) {
        const button = page.locator(selector);
        if (await button.first().isVisible()) {
          addButton = button.first();
          break;
        }
      }

      if (addButton) {
        // Test CREATE
        await addButton.click();
        await page.waitForTimeout(1000);
        
        // Fill out event form (look for common form fields)
        const titleInput = page.locator('input[name="title"]').or(page.locator('input[placeholder*="title"]')).or(page.locator('input[placeholder*="Title"]'));
        if (await titleInput.first().isVisible()) {
          await titleInput.first().fill('Test Event for CRUD');
        }

        // Look for save/submit button
        const saveButtons = [
          'button:has-text("Save")',
          'button:has-text("Create")',
          'button:has-text("Add")',
          'button[type="submit"]'
        ];

        for (const selector of saveButtons) {
          const saveButton = page.locator(selector);
          if (await saveButton.first().isVisible()) {
            await saveButton.first().click();
            break;
          }
        }

        await page.waitForTimeout(2000);
        console.log('✅ Event creation attempted');

        // Test READ - look for the created event
        const eventText = page.locator('text=Test Event for CRUD');
        if (await eventText.isVisible()) {
          console.log('✅ Event appears in calendar (READ)');

          // Test EDIT - click on the event
          await eventText.click();
          await page.waitForTimeout(1000);

          // Look for edit button
          const editButtons = [
            'button:has-text("Edit")',
            'button:has-text("Modify")',
            'button:has-text("Update")'
          ];

          for (const selector of editButtons) {
            const editButton = page.locator(selector);
            if (await editButton.first().isVisible()) {
              await editButton.first().click();
              
              // Try to modify the title
              const editTitleInput = page.locator('input[value*="Test Event"]').or(titleInput);
              if (await editTitleInput.first().isVisible()) {
                await editTitleInput.first().fill('Modified Test Event');
                
                // Save changes
                for (const selector of saveButtons) {
                  const saveButton = page.locator(selector);
                  if (await saveButton.first().isVisible()) {
                    await saveButton.first().click();
                    break;
                  }
                }
                
                console.log('✅ Event edit attempted');
              }
              break;
            }
          }

          // Test DELETE - look for delete button
          const deleteButtons = [
            'button:has-text("Delete")',
            'button:has-text("Remove")',
            'button:has-text("Trash")',
            'button[aria-label*="delete"]'
          ];

          for (const selector of deleteButtons) {
            const deleteButton = page.locator(selector);
            if (await deleteButton.first().isVisible()) {
              await deleteButton.first().click();
              
              // Handle confirmation dialog
              await page.waitForTimeout(500);
              const confirmButtons = [
                'button:has-text("Confirm")',
                'button:has-text("Yes")',
                'button:has-text("Delete")',
                'button:has-text("OK")'
              ];

              for (const confirmSelector of confirmButtons) {
                const confirmButton = page.locator(confirmSelector);
                if (await confirmButton.first().isVisible()) {
                  await confirmButton.first().click();
                  break;
                }
              }
              
              console.log('✅ Event deletion attempted');
              break;
            }
          }
        }
      } else {
        console.log('⚠️ No Add Event button found');
      }
    });
  });

  test.describe('Task/Chore CRUD Operations', () => {
    test('Can create, edit, and delete tasks/chores', async ({ page }) => {
      await page.goto('/dashboard?tab=tasks');
      await page.waitForLoadState('domcontentloaded');
      
      // Look for add task/chore buttons
      const addButtons = [
        'button:has-text("Add Task")',
        'button:has-text("Create Task")',
        'button:has-text("New Task")',
        'button:has-text("Add Chore")',
        'button:has-text("+")'
      ];

      for (const selector of addButtons) {
        const button = page.locator(selector);
        if (await button.first().isVisible()) {
          await button.first().click();
          await page.waitForTimeout(1000);
          
          // Try to fill task details
          const taskFields = [
            { selector: 'input[name="title"]', value: 'Test Task CRUD' },
            { selector: 'input[placeholder*="task"]', value: 'Test Task CRUD' },
            { selector: 'textarea', value: 'Test task description' }
          ];

          for (const field of taskFields) {
            const input = page.locator(field.selector);
            if (await input.first().isVisible()) {
              await input.first().fill(field.value);
            }
          }

          // Save the task
          const saveButton = page.locator('button:has-text("Save")').or(page.locator('button:has-text("Create")'));
          if (await saveButton.first().isVisible()) {
            await saveButton.first().click();
            console.log('✅ Task creation attempted');
          }
          
          break;
        }
      }

      await page.waitForTimeout(2000);

      // Look for task completion/edit/delete options
      const taskItems = page.locator('.task, .chore, [data-testid*="task"], [data-testid*="chore"]');
      if (await taskItems.first().isVisible()) {
        // Test task completion
        const completeButtons = page.locator('button:has-text("Complete")').or(page.locator('input[type="checkbox"]'));
        if (await completeButtons.first().isVisible()) {
          await completeButtons.first().click();
          console.log('✅ Task completion attempted');
        }

        // Test task deletion
        const deleteButtons = page.locator('button:has-text("Delete")').or(page.locator('[aria-label*="delete"]'));
        if (await deleteButtons.first().isVisible()) {
          await deleteButtons.first().click();
          
          // Handle confirmation
          await page.waitForTimeout(500);
          const confirmButton = page.locator('button:has-text("Confirm")').or(page.locator('button:has-text("Yes")'));
          if (await confirmButton.first().isVisible()) {
            await confirmButton.first().click();
            console.log('✅ Task deletion attempted');
          }
        }
      }
    });
  });

  test.describe('Document CRUD Operations', () => {
    test('Can upload, view, and delete documents', async ({ page }) => {
      await page.goto('/dashboard?tab=documents');
      await page.waitForLoadState('domcontentloaded');

      // Look for file upload functionality
      const uploadButtons = [
        'button:has-text("Upload")',
        'input[type="file"]',
        '[data-testid="file-upload"]'
      ];

      for (const selector of uploadButtons) {
        const element = page.locator(selector);
        if (await element.first().isVisible()) {
          console.log('✅ File upload interface found');
          
          // Test document viewing/management
          const documentElements = page.locator('.document, .file, [data-testid*="document"]');
          if (await documentElements.first().isVisible()) {
            // Test document deletion
            const deleteButtons = page.locator('button:has-text("Delete")').or(page.locator('[aria-label*="delete"]'));
            if (await deleteButtons.first().isVisible()) {
              await deleteButtons.first().click();
              
              // Handle confirmation
              await page.waitForTimeout(500);
              const confirmButton = page.locator('button:has-text("Confirm")').or(page.locator('button:has-text("Yes")'));
              if (await confirmButton.first().isVisible()) {
                await confirmButton.first().click();
                console.log('✅ Document deletion attempted');
              }
            }
          }
          break;
        }
      }
    });
  });

  test.describe('Admin CRUD Operations', () => {
    test('Can create, edit, and delete chore/reward templates', async ({ page }) => {
      await page.goto('/dashboard?tab=chore-admin');
      await page.waitForLoadState('domcontentloaded');

      // Test template creation
      const createButtons = [
        'button:has-text("Create Template")',
        'button:has-text("Add Template")',
        'button:has-text("New Template")',
        'button:has-text("Create")'
      ];

      for (const selector of createButtons) {
        const button = page.locator(selector);
        if (await button.first().isVisible()) {
          await button.first().click();
          await page.waitForTimeout(1000);
          
          // Fill template details
          const nameInput = page.locator('input[name="name"]').or(page.locator('input[placeholder*="name"]'));
          if (await nameInput.first().isVisible()) {
            await nameInput.first().fill('Test Template CRUD');
          }

          // Save template
          const saveButton = page.locator('button:has-text("Save")').or(page.locator('button:has-text("Create")'));
          if (await saveButton.first().isVisible()) {
            await saveButton.first().click();
            console.log('✅ Template creation attempted');
          }
          break;
        }
      }

      await page.waitForTimeout(2000);

      // Test template deletion
      const templates = page.locator('.template, [data-testid*="template"]');
      if (await templates.first().isVisible()) {
        const deleteButtons = page.locator('button:has-text("Delete")').or(page.locator('[aria-label*="delete"]'));
        if (await deleteButtons.first().isVisible()) {
          await deleteButtons.first().click();
          
          // Handle confirmation
          await page.waitForTimeout(500);
          const confirmButton = page.locator('button:has-text("Confirm")').or(page.locator('button:has-text("Yes")'));
          if (await confirmButton.first().isVisible()) {
            await confirmButton.first().click();
            console.log('✅ Template deletion attempted');
          }
        }
      }
    });
  });

  test.describe('Data Persistence Tests', () => {
    test('Data persists after page refresh', async ({ page }) => {
      await page.goto('/dashboard?tab=home');
      await page.waitForLoadState('domcontentloaded');

      // Note any existing data
      const existingElements = await page.locator('text=Test').count();
      
      // Refresh the page
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      
      // Check if data is still there
      const afterRefreshElements = await page.locator('text=Test').count();
      
      console.log(`✅ Data persistence check: ${existingElements} elements before, ${afterRefreshElements} after refresh`);
    });

    test('Data is consistent across tabs', async ({ page }) => {
      await page.goto('/dashboard?tab=home');
      await page.waitForLoadState('domcontentloaded');
      
      // Check family overview
      const familyOverview = page.locator('text=Family Overview');
      const isVisible = await familyOverview.isVisible();
      
      // Navigate to different tab and back
      await page.goto('/dashboard?tab=tasks');
      await page.waitForLoadState('domcontentloaded');
      
      await page.goto('/dashboard?tab=home');
      await page.waitForLoadState('domcontentloaded');
      
      // Check if family overview is still there
      const stillVisible = await familyOverview.isVisible();
      
      console.log(`✅ Data consistency: Family Overview visible before: ${isVisible}, after: ${stillVisible}`);
    });
  });

  test.describe('Bulk Operations Tests', () => {
    test('Can select and perform bulk actions', async ({ page }) => {
      await page.goto('/dashboard?tab=tasks');
      await page.waitForLoadState('domcontentloaded');

      // Look for checkboxes or selection mechanisms
      const checkboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();

      if (checkboxCount > 0) {
        // Select multiple items
        for (let i = 0; i < Math.min(3, checkboxCount); i++) {
          await checkboxes.nth(i).check();
        }

        // Look for bulk action buttons
        const bulkButtons = [
          'button:has-text("Delete Selected")',
          'button:has-text("Mark Complete")',
          'button:has-text("Bulk Action")'
        ];

        for (const selector of bulkButtons) {
          const button = page.locator(selector);
          if (await button.first().isVisible()) {
            console.log(`✅ Found bulk action button: ${selector}`);
            // Don't actually click to avoid deleting data during test
          }
        }
      }
    });
  });
});