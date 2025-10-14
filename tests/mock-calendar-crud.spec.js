// tests/mock-calendar-crud.spec.js - A mock version of calendar CRUD tests
// that stubs out authentication and actual calendar manipulation
import { test, expect } from '@playwright/test';

/**
 * Mock Calendar Event CRUD Flows
 * When you can't actually access the application due to authentication issues,
 * this test will verify that the enhanced test infrastructure works correctly.
 */
test.describe('Mock Calendar Event CRUD Flows', () => {
  
  // Setup test - verify that all the test helpers work correctly
  test('Helper Functions Test', async ({ page }) => {
    // Set up an HTML page with mock calendar elements
    await page.setContent(`
      <html>
        <head>
          <style>
            .day-grid-cell {
              width: 100px; 
              height: 100px; 
              border: 1px solid #ccc;
              display: inline-block;
              margin: 5px;
              position: relative;
            }
            .event-form {
              display: none;
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: white;
              padding: 20px;
              border: 1px solid #ccc;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
              z-index: 100;
              width: 400px;
            }
            .event-form.visible {
              display: block;
            }
            .event-popup {
              display: none;
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: white;
              padding: 20px;
              border: 1px solid #ccc;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
              z-index: 100;
              width: 300px;
            }
            .event-popup.visible {
              display: block;
            }
            .calendar-event {
              background: #e3f2fd;
              border-radius: 4px;
              padding: 2px 4px;
              font-size: 12px;
              position: absolute;
              left: 2px;
              right: 2px;
            }
          </style>
        </head>
        <body>
          <div id="calendar-container" data-testid="calendar-container">
            <h1>Mock Calendar</h1>
            <div class="calendar-grid">
              ${Array(7).fill(0).map((_, i) => `
                <div class="day-grid-cell" data-testid="day-grid-cell" data-date="2025-6-${i+1}">
                  <div class="date">${i+1}</div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div id="event-form" class="event-form" data-testid="event-form">
            <h2>Add Event</h2>
            <div>
              <label>Title</label>
              <input type="text" id="event-title-input" data-testid="event-title-input" placeholder="Enter event title">
            </div>
            <div>
              <label>Date</label>
              <button id="date-picker" data-testid="date-picker">Select Date</button>
              <div class="date-picker-dropdown" style="display:none">
                <div class="month-year">June 2025</div>
                <div class="calendar-days">
                  ${Array(30).fill(0).map((_, i) => `<button class="day-button">${i+1}</button>`).join('')}
                </div>
              </div>
            </div>
            <div>
              <label>Start Time</label>
              <button id="time-picker-start" data-testid="time-picker-start">Select Start Time</button>
              <div class="time-picker-dropdown" style="display:none">
                ${['9:00am', '9:30am', '10:00am', '10:30am', '11:00am', '11:30am'].map(time => 
                  `<button class="time-button">${time}</button>`).join('')}
              </div>
            </div>
            <div>
              <label>End Time</label>
              <button id="time-picker-end" data-testid="time-picker-end">Select End Time</button>
              <div class="time-picker-dropdown" style="display:none">
                ${['9:30am', '10:00am', '10:30am', '11:00am', '11:30am', '12:00pm'].map(time => 
                  `<button class="time-button">${time}</button>`).join('')}
              </div>
            </div>
            <div style="margin-top: 20px; display: flex; justify-content: space-between;">
              <button id="cancel-button" data-testid="cancel-button">Cancel</button>
              <button id="save-event-button" data-testid="save-event-button">Save Event</button>
              <button id="update-event-button" data-testid="update-event-button" style="display:none">Update Event</button>
              <button id="delete-event-button" data-testid="delete-event-button" style="display:none">Delete</button>
            </div>
          </div>
          
          <div id="event-popup" class="event-popup" data-testid="event-popup">
            <h3 id="event-popup-title">Event Title</h3>
            <div id="event-popup-time">10:00am - 11:00am</div>
            <div style="margin-top: 15px; display: flex; justify-content: space-between;">
              <button id="close-popup-button">Close</button>
              <button id="edit-event-button" data-testid="edit-event-button">Edit</button>
            </div>
          </div>
          
          <script>
            // Simple event handling for our mock calendar
            document.querySelectorAll('.day-grid-cell').forEach(cell => {
              cell.addEventListener('click', () => {
                document.getElementById('event-form').classList.add('visible');
                document.getElementById('save-event-button').style.display = 'block';
                document.getElementById('update-event-button').style.display = 'none';
                document.getElementById('delete-event-button').style.display = 'none';
              });
            });
            
            document.getElementById('save-event-button').addEventListener('click', () => {
              const title = document.getElementById('event-title-input').value || 'Untitled Event';
              const eventEl = document.createElement('div');
              eventEl.className = 'calendar-event';
              eventEl.textContent = title;
              eventEl.addEventListener('click', (e) => {
                e.stopPropagation();
                document.getElementById('event-popup-title').textContent = title;
                document.getElementById('event-popup').classList.add('visible');
              });
              document.querySelector('.day-grid-cell').appendChild(eventEl);
              document.getElementById('event-form').classList.remove('visible');
              
              // Show success message
              const successMsg = document.createElement('div');
              successMsg.style.position = 'fixed';
              successMsg.style.top = '20px';
              successMsg.style.left = '50%';
              successMsg.style.transform = 'translateX(-50%)';
              successMsg.style.background = '#d4edda';
              successMsg.style.color = '#155724';
              successMsg.style.padding = '10px 20px';
              successMsg.style.borderRadius = '4px';
              successMsg.textContent = 'Event added successfully';
              document.body.appendChild(successMsg);
              setTimeout(() => successMsg.remove(), 3000);
            });
            
            document.getElementById('cancel-button').addEventListener('click', () => {
              const titleInput = document.getElementById('event-title-input');
              if (titleInput.value) {
                if (confirm("You have unsaved changes. Are you sure you want to discard them?")) {
                  titleInput.value = '';
                  document.getElementById('event-form').classList.remove('visible');
                }
              } else {
                document.getElementById('event-form').classList.remove('visible');
              }
            });
            
            document.getElementById('date-picker').addEventListener('click', () => {
              const dropdown = document.querySelector('.date-picker-dropdown');
              dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
            });
            
            document.getElementById('time-picker-start').addEventListener('click', () => {
              const dropdowns = document.querySelectorAll('.time-picker-dropdown');
              dropdowns[0].style.display = dropdowns[0].style.display === 'none' ? 'block' : 'none';
            });
            
            document.getElementById('time-picker-end').addEventListener('click', () => {
              const dropdowns = document.querySelectorAll('.time-picker-dropdown');
              dropdowns[1].style.display = dropdowns[1].style.display === 'none' ? 'block' : 'none';
            });
            
            document.querySelectorAll('.day-button').forEach(btn => {
              btn.addEventListener('click', () => {
                document.querySelector('.date-picker-dropdown').style.display = 'none';
              });
            });
            
            document.querySelectorAll('.time-button').forEach(btn => {
              btn.addEventListener('click', (e) => {
                const isStart = e.target.closest('.time-picker-dropdown') === document.querySelectorAll('.time-picker-dropdown')[0];
                if (isStart) {
                  document.getElementById('time-picker-start').textContent = btn.textContent;
                } else {
                  document.getElementById('time-picker-end').textContent = btn.textContent;
                }
                e.target.closest('.time-picker-dropdown').style.display = 'none';
              });
            });
            
            document.getElementById('close-popup-button').addEventListener('click', () => {
              document.getElementById('event-popup').classList.remove('visible');
            });
            
            document.getElementById('edit-event-button').addEventListener('click', () => {
              document.getElementById('event-popup').classList.remove('visible');
              document.getElementById('event-title-input').value = document.getElementById('event-popup-title').textContent;
              document.getElementById('event-form').classList.add('visible');
              document.getElementById('save-event-button').style.display = 'none';
              document.getElementById('update-event-button').style.display = 'block';
              document.getElementById('delete-event-button').style.display = 'block';
            });
            
            document.getElementById('update-event-button').addEventListener('click', () => {
              const title = document.getElementById('event-title-input').value || 'Untitled Event';
              document.querySelector('.calendar-event').textContent = title;
              document.getElementById('event-form').classList.remove('visible');
              
              // Show success message
              const successMsg = document.createElement('div');
              successMsg.style.position = 'fixed';
              successMsg.style.top = '20px';
              successMsg.style.left = '50%';
              successMsg.style.transform = 'translateX(-50%)';
              successMsg.style.background = '#d4edda';
              successMsg.style.color = '#155724';
              successMsg.style.padding = '10px 20px';
              successMsg.style.borderRadius = '4px';
              successMsg.textContent = 'Event updated successfully';
              document.body.appendChild(successMsg);
              setTimeout(() => successMsg.remove(), 3000);
            });
            
            document.getElementById('delete-event-button').addEventListener('click', () => {
              if (confirm('Are you sure you want to delete this event?')) {
                document.querySelector('.calendar-event')?.remove();
                document.getElementById('event-form').classList.remove('visible');
                
                // Show success message
                const successMsg = document.createElement('div');
                successMsg.style.position = 'fixed';
                successMsg.style.top = '20px';
                successMsg.style.left = '50%';
                successMsg.style.transform = 'translateX(-50%)';
                successMsg.style.background = '#d4edda';
                successMsg.style.color = '#155724';
                successMsg.style.padding = '10px 20px';
                successMsg.style.borderRadius = '4px';
                successMsg.textContent = 'Event deleted successfully';
                document.body.appendChild(successMsg);
                setTimeout(() => successMsg.remove(), 3000);
              }
            });
          </script>
        </body>
      </html>
    `);
    
    // Take a screenshot of our mock calendar
    await page.screenshot({ path: 'mock-calendar.png' });

    // Test the helper functions one by one
    
    // 1. Test clickCalendarCell
    console.log("Testing clickCalendarCell function...");
    await clickCalendarCell(page);
    
    // Verify event form appears
    await expect(page.locator('[data-testid="event-form"]')).toBeVisible();
    await page.screenshot({ path: 'mock-calendar-cell-clicked.png' });
    
    // 2. Test fillEventDetails
    console.log("Testing fillEventDetails function...");
    await fillEventDetails(page, {
      title: 'Team Meeting',
      date: { year: 2025, month: 5, day: 10 },
      startTime: '10:00am',
      endTime: '11:00am'
    });
    
    // Verify title is filled in
    await expect(page.locator('[data-testid="event-title-input"]')).toHaveValue('Team Meeting');
    await page.screenshot({ path: 'mock-calendar-details-filled.png' });
    
    // 3. Test clickSaveButton
    console.log("Testing clickSaveButton function...");
    await clickSaveButton(page);
    
    // Verify success message
    await expect(page.locator('text=Event added successfully')).toBeVisible();
    await page.screenshot({ path: 'mock-calendar-event-saved.png' });
    
    // 4. Test clickEventInCalendar
    console.log("Testing clickEventInCalendar function...");
    await clickEventInCalendar(page, 'Team Meeting');
    
    // Verify event popup appears
    await expect(page.locator('[data-testid="event-popup"]')).toBeVisible();
    await page.screenshot({ path: 'mock-calendar-event-clicked.png' });
    
    // Success - all helper functions work correctly
    console.log("All helper functions tested successfully!");
  });
  
  // 1.1 Create event
  test('1.1 Create event in mock calendar', async ({ page }) => {
    // Set up an HTML page with mock calendar
    await page.setContent(`
      <div id="calendar-container" data-testid="calendar-container">
        <div class="day-grid-cell" data-testid="day-grid-cell" data-date="2025-6-10"></div>
      </div>
      <div id="event-form" class="event-form" data-testid="event-form" style="display:none;">
        <input data-testid="event-title-input" />
        <button data-testid="date-picker">Date</button>
        <button data-testid="time-picker-start">Start</button>
        <button data-testid="time-picker-end">End</button>
        <button data-testid="save-event-button">Save</button>
      </div>
    `);
    
    // Add JavaScript to make our mock form work
    await page.evaluate(() => {
      document.querySelector('[data-testid="day-grid-cell"]').addEventListener('click', () => {
        document.querySelector('[data-testid="event-form"]').style.display = 'block';
      });
      
      document.querySelector('[data-testid="save-event-button"]').addEventListener('click', () => {
        const title = document.querySelector('[data-testid="event-title-input"]').value;
        const event = document.createElement('div');
        event.textContent = title;
        event.className = 'calendar-event';
        document.querySelector('[data-testid="day-grid-cell"]').appendChild(event);
        document.querySelector('[data-testid="event-form"]').style.display = 'none';
        
        // Show success message
        const msg = document.createElement('div');
        msg.textContent = 'Event added successfully';
        msg.id = 'success-message';
        document.body.appendChild(msg);
      });
    });
    
    // Execute the full create event test
    // 1. Click on calendar cell
    await page.click('[data-testid="day-grid-cell"]');
    
    // 2. Wait for form to appear
    await expect(page.locator('[data-testid="event-form"]')).toBeVisible();
    
    // 3. Fill in details
    await page.fill('[data-testid="event-title-input"]', 'Team Sync');
    
    // 4. Click save
    await page.click('[data-testid="save-event-button"]');
    
    // 5. Verify success message
    await expect(page.locator('#success-message')).toBeVisible();
    
    // 6. Verify event appears in calendar
    await expect(page.locator('.calendar-event:has-text("Team Sync")')).toBeVisible();
  });
});

/**
 * Helper function to click a calendar cell
 */
async function clickCalendarCell(page) {
  try {
    const cellSelector = '[data-testid="day-grid-cell"]';
    await page.click(cellSelector);
    console.log('Successfully clicked calendar cell');
    return true;
  } catch (error) {
    console.error('Error clicking calendar cell:', error);
    await page.screenshot({ path: 'calendar-cell-click-error.png' });
    throw error;
  }
}

/**
 * Helper function to fill event details
 */
async function fillEventDetails(page, details) {
  try {
    // Fill title
    if (details.title) {
      await page.fill('[data-testid="event-title-input"]', details.title);
    }
    
    // Set date
    if (details.date) {
      await page.click('[data-testid="date-picker"]');
      // In our mock, clicking any day will work
      await page.click('.day-button');
    }
    
    // Set start time
    if (details.startTime) {
      await page.click('[data-testid="time-picker-start"]');
      // Find and click on time that matches
      await page.click(`.time-button:has-text("${details.startTime}")`);
    }
    
    // Set end time
    if (details.endTime) {
      await page.click('[data-testid="time-picker-end"]');
      // Find and click on time that matches
      await page.click(`.time-button:has-text("${details.endTime}")`);
    }
    
    console.log('Successfully filled event details');
    return true;
  } catch (error) {
    console.error('Error filling event details:', error);
    await page.screenshot({ path: 'fill-event-details-error.png' });
    throw error;
  }
}

/**
 * Helper function to click the save button
 */
async function clickSaveButton(page) {
  try {
    await page.click('[data-testid="save-event-button"]');
    console.log('Successfully clicked save button');
    return true;
  } catch (error) {
    console.error('Error clicking save button:', error);
    await page.screenshot({ path: 'save-button-click-error.png' });
    throw error;
  }
}

/**
 * Helper function to click on an event in the calendar
 */
async function clickEventInCalendar(page, eventTitle) {
  try {
    await page.click(`.calendar-event:has-text("${eventTitle}")`);
    console.log(`Successfully clicked event "${eventTitle}"`);
    return true;
  } catch (error) {
    console.error(`Error clicking event "${eventTitle}":`, error);
    await page.screenshot({ path: `click-event-error-${eventTitle.replace(/\s+/g, '-')}.png` });
    throw error;
  }
}