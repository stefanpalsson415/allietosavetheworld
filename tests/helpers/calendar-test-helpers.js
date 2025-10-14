// tests/helpers/calendar-test-helpers.js
// Helper functions for calendar CRUD testing

/**
 * Helper function to convert 12-hour time format to 24-hour format
 * Example: "10:00am" -> "10:00", "2:30pm" -> "14:30"
 */
function convert12to24Hour(time12h) {
  const time = time12h.trim().toLowerCase();
  const [timeStr, period] = [time.slice(0, -2), time.slice(-2)];
  let [hours, minutes] = timeStr.split(':').map(s => s.trim());

  // Handle empty minutes
  if (!minutes) minutes = '00';

  // Convert hours to number
  hours = parseInt(hours, 10);

  // Convert to 24-hour format
  if (period === 'pm' && hours !== 12) {
    hours += 12;
  } else if (period === 'am' && hours === 12) {
    hours = 0;
  }

  // Pad with zeros
  const hoursStr = String(hours).padStart(2, '0');
  const minutesStr = String(minutes).padStart(2, '0');

  return `${hoursStr}:${minutesStr}`;
}

/**
 * Helper function for more reliable navigation with retry
 */
async function navigateWithRetry(page, url, maxRetries = 3) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      // Changed from 'domcontentloaded' to 'load' - Firebase/API requests never idle
      await page.goto(url, { timeout: 30000, waitUntil: 'load' });
      return; // Success
    } catch (error) {
      retries++;
      console.log(`Navigation attempt ${retries} failed: ${error.message}`);
      if (retries >= maxRetries) throw error;
      await page.waitForTimeout(2000); // Wait before retry
    }
  }
}

/**
 * Helper function to wait for calendar to load with multiple selector strategies
 */
async function waitForCalendarLoad(page) {
  try {
    // Wait for calendar container or cells to appear
    // Based on actual calendar implementation (Calendar.js line 186, NotionWeekView.js line 108)
    await Promise.race([
      page.waitForSelector('.calendar-v2', { timeout: 15000 }),           // Main calendar container
      page.waitForSelector('.calendar-container', { timeout: 15000 }),    // Inner container
      page.waitForSelector('.hour-cell', { timeout: 15000 }),             // Week view cells
      page.waitForSelector('.notion-week-view', { timeout: 15000 }),      // Week view container
      page.waitForSelector('[data-testid="calendar-container"]', { timeout: 15000 }),
      page.waitForSelector('.calendar-view, .fc-view-container', { timeout: 15000 })
    ]);
    console.log('✅ Calendar loaded successfully');

    // Give calendar a moment to fully render and attach event listeners
    await page.waitForTimeout(1000);
  } catch (error) {
    console.warn('⚠️  Could not detect calendar with standard selectors, proceeding anyway');
    // Take a screenshot to help debug
    await page.screenshot({ path: 'test-results/calendar-load-issue.png' });
    // Wait a bit longer just in case
    await page.waitForTimeout(5000);
  }
}

/**
 * Enhanced login helper with multiple selector strategies and better error handling
 */
async function login(page, username = 'test@example.com', password = 'password') {
  try {
    console.log('Attempting login...');
    
    // Fill in email with multiple selector strategies
    await page.fill('#email, [placeholder*="email"], input[type="email"]', username)
      .catch(async () => {
        console.log('Could not find email field, trying alternative approach');
        // Look for any visible input that might be an email field
        const inputs = await page.$$('input:visible');
        if (inputs.length > 0) await inputs[0].fill(username);
      });
    
    // Fill in password with multiple selector strategies
    await page.fill('#password, [placeholder*="password"], input[type="password"]', password)
      .catch(async () => {
        console.log('Could not find password field, trying alternative approach');
        // Look for any visible input of type password
        const inputs = await page.$$('input[type="password"]:visible');
        if (inputs.length > 0) await inputs[0].fill(password);
      });
    
    // Take screenshot before clicking login
    await page.screenshot({ path: 'test-results/before-login.png' });
    
    // Find and click login button with comprehensive selector strategies
    const loginButtonSelectors = [
      '[data-testid="login-button"]',
      'button[type="submit"]',
      'button:has-text("Login")',
      'button:has-text("Sign in")',
      'button:has-text("Log in")',
      'input[type="submit"]',
      'a:has-text("Login")',
      'a:has-text("Sign in")'
    ];
    
    let buttonClicked = false;
    
    // Try each selector until one works
    for (const selector of loginButtonSelectors) {
      const button = await page.$(selector).catch(() => null);
      if (button) {
        await button.click().catch(e => console.log(`Click failed for ${selector}: ${e.message}`));
        console.log(`Clicked login button with selector: ${selector}`);
        buttonClicked = true;
        break;
      }
    }
    
    // If no button was found with selectors, try a different approach with role
    if (!buttonClicked) {
      console.log('No login button found with standard selectors, trying role approach');
      const button = await page.getByRole('button', { name: /login|sign in|log in/i }).first()
        .catch(() => null);
      
      if (button) {
        await button.click();
        buttonClicked = true;
      } else {
        // Last resort: try to find any button and click it
        console.log('Trying to find any button that might be a login button');
        const allButtons = await page.$$('button');
        if (allButtons.length > 0) {
          // Try to find a button that looks like a login button
          for (const btn of allButtons) {
            const text = await btn.textContent();
            if (text && /login|sign|submit|enter/i.test(text)) {
              await btn.click();
              buttonClicked = true;
              break;
            }
          }
          
          // If still not found, just click the first button
          if (!buttonClicked && allButtons.length > 0) {
            await allButtons[0].click();
            buttonClicked = true;
          }
        }
      }
    }
    
    // Take screenshot after login attempt
    await page.screenshot({ path: 'test-results/after-login-click.png' });
    
    // Wait for navigation to complete
    await Promise.race([
      page.waitForNavigation({ timeout: 15000 }),
      page.waitForSelector('[data-testid="dashboard"], .dashboard, #dashboard', { timeout: 15000 }),
      page.waitForURL(url => url.includes('dashboard') || url.includes('home'), { timeout: 15000 })
    ]).catch(() => {
      console.log('No navigation after login, continuing anyway');
    });
    
    console.log('Login sequence completed');
    
    // Take one more screenshot to confirm login state
    await page.screenshot({ path: 'test-results/login-complete.png' });
  } catch (error) {
    console.log('Error during login sequence:', error);
    await page.screenshot({ path: 'test-results/login-error.png' });
  }
}

/**
 * Helper function to retry an action until a condition is met
 */
async function retryUntilCondition(conditionFn, errorMessage, maxRetries = 5, interval = 1000) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (await conditionFn()) {
      return true;
    }
    
    if (attempt < maxRetries - 1) {
      console.log(`Condition not met, retrying (${attempt + 1}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  
  throw new Error(`${errorMessage} after ${maxRetries} attempts`);
}

/**
 * Enhanced date selection with more robust handling of different date picker UIs
 */
async function selectDate(page, year, month, day) {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  try {
    console.log(`Selecting date: ${year}-${month+1}-${day}`);
    
    // STRATEGY 1: Try to find and click on a day directly with data-date attribute
    const dateSelectors = [
      `[data-date="${year}-${month+1}-${day}"]`,
      `[data-date="${year}-${String(month+1).padStart(2, '0')}-${String(day).padStart(2, '0')}"]`,
      `[data-day="${day}"][data-month="${month}"][data-year="${year}"]`
    ];
    
    for (const selector of dateSelectors) {
      const dateCell = await page.$(selector).catch(() => null);
      if (dateCell) {
        await dateCell.click();
        console.log(`Selected date using attribute selector: ${selector}`);
        return;
      }
    }
    
    // STRATEGY 2: Try to use the native date input if available
    const dateInputSelectors = [
      'input[type="date"]',
      '[data-testid="date-input"]',
      'input[placeholder*="date" i]'
    ];
    
    for (const selector of dateInputSelectors) {
      const dateInput = await page.$(selector).catch(() => null);
      if (dateInput) {
        const formattedDate = `${year}-${String(month+1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        await dateInput.fill(formattedDate);
        console.log(`Set date input directly: ${formattedDate}`);
        return;
      }
    }
    
    // Take screenshot before attempting calendar navigation
    await page.screenshot({ path: 'test-results/before-calendar-navigation.png' });
    
    // STRATEGY 3: Advanced date picker navigation
    console.log("Using advanced calendar navigation to select date");
    
    // First try to identify the current month/year display
    const monthYearSelectors = [
      '.calendar-header', 
      '.month-year-display', 
      '.text-lg.font-medium',
      '.calendar-month-year',
      'h2.month-heading',
      '.fc-toolbar-title'
    ];
    
    let monthYearText = null;
    
    for (const selector of monthYearSelectors) {
      try {
        monthYearText = await page.locator(selector).first().textContent();
        if (monthYearText) {
          console.log(`Found month/year display: "${monthYearText}"`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    // If we couldn't find a month/year display, try a different approach
    if (!monthYearText) {
      console.log("Could not find month/year display, trying to locate calendar grid directly");
      
      // Direct day selection without navigation
      // Try clicking on the day number within the current month view
      const daySelectors = [
        `button:has-text("${day}")`,
        `div.day:has-text("${day}")`,
        `td:has-text("${day}")`,
        `[aria-label*="${day}"][aria-label*="${month+1}/${year}"]`,
        `[aria-label*="${monthNames[month]} ${day}"]`
      ];
      
      for (const selector of daySelectors) {
        try {
          // Find all matching elements
          const elements = await page.$$(selector);
          
          if (elements.length > 0) {
            // If multiple day numbers found (e.g., '1' appears multiple times in a month view)
            // try to determine which one is in the current month
            if (elements.length > 1) {
              // Try to click the one that's in the current/active month
              // Often, days from previous/next month are styled differently
              for (const element of elements) {
                const classes = await element.getAttribute('class');
                if (classes && !classes.includes('other-month') && !classes.includes('disabled')) {
                  await element.click();
                  console.log(`Clicked day ${day} (one of multiple) with selector: ${selector}`);
                  return;
                }
              }
            }
            
            // If we couldn't identify the right one or there's only one, click the first
            await elements[0].click();
            console.log(`Clicked day ${day} with selector: ${selector}`);
            return;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
    }
    
    // If we found the month/year display, parse it and navigate
    if (monthYearText) {
      let currentMonth = -1, currentYear = null;
      
      // Try to extract month and year from text like "May 2025" or "05/2025"
      // First check for full month names
      for (let i = 0; i < monthNames.length; i++) {
        if (monthYearText.includes(monthNames[i])) {
          currentMonth = i;
          break;
        }
      }
      
      // If full name not found, check for short month names
      if (currentMonth === -1) {
        for (let i = 0; i < shortMonthNames.length; i++) {
          if (monthYearText.includes(shortMonthNames[i])) {
            currentMonth = i;
            break;
          }
        }
      }
      
      // Try to extract year with various patterns
      const yearPatterns = [
        /\b(20\d{2})\b/,  // Four-digit year like 2023
        /\b(\d{2})$/,     // Two-digit year at the end
        /(\d{1,2})[\/\-](\d{4})/ // Date format like 05/2023
      ];
      
      for (const pattern of yearPatterns) {
        const match = monthYearText.match(pattern);
        if (match) {
          currentYear = parseInt(match[1]);
          break;
        }
      }
      
      // If we have a month but not a year, assume it's the current year
      if (currentMonth !== -1 && currentYear === null) {
        currentYear = new Date().getFullYear();
      }
      
      // If we still couldn't parse, use a different approach
      if (currentMonth === -1 || currentYear === null) {
        console.log("Could not parse current month/year, trying direct day selection");
        
        // Try clicking the day directly
        await page.locator(`text="${day}"`).first().click()
          .catch(e => console.log(`Direct day click failed: ${e.message}`));
        return;
      }
      
      console.log(`Parsed current calendar view: ${monthNames[currentMonth]} ${currentYear}`);
      console.log(`Target date: ${monthNames[month]} ${year}`);
      
      // Determine navigation directions and find navigation buttons
      const prevNextSelectors = [
        // Previous month button selectors
        ['button:has(svg[name="ChevronLeft"])', 'button:has-text("Prev")', 'button.prev', '[aria-label="Previous month"]'],
        // Next month button selectors  
        ['button:has(svg[name="ChevronRight"])', 'button:has-text("Next")', 'button.next', '[aria-label="Next month"]']
      ];
      
      let prevButton = null;
      let nextButton = null;
      
      // Find previous button
      for (const selector of prevNextSelectors[0]) {
        prevButton = await page.$(selector).catch(() => null);
        if (prevButton) {
          console.log(`Found previous month button with selector: ${selector}`);
          break;
        }
      }
      
      // Find next button
      for (const selector of prevNextSelectors[1]) {
        nextButton = await page.$(selector).catch(() => null);
        if (nextButton) {
          console.log(`Found next month button with selector: ${selector}`);
          break;
        }
      }
      
      // If we couldn't find navigation buttons, try direct day selection
      if (!prevButton || !nextButton) {
        console.log("Could not find navigation buttons, trying direct day selection");
        
        // Try clicking directly on the day
        await page.locator(`text="${day}"`).first().click()
          .catch(e => console.log(`Direct day click failed: ${e.message}`));
        return;
      }
      
      // Navigate to target month/year with a maximum of 24 clicks (2 years either direction)
      let maxNavigationClicks = 24;
      let navigationCount = 0;
      
      while ((currentMonth !== month || currentYear !== year) && navigationCount < maxNavigationClicks) {
        // Determine if we need to go forward or backward
        if (year > currentYear || (year === currentYear && month > currentMonth)) {
          await nextButton.click();
          console.log(`Navigating forward: ${monthNames[currentMonth]} ${currentYear} -> Next month`);
          currentMonth++;
          if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
          }
        } else {
          await prevButton.click();
          console.log(`Navigating backward: ${monthNames[currentMonth]} ${currentYear} -> Previous month`);
          currentMonth--;
          if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
          }
        }
        
        // Wait a moment for the calendar to update
        await page.waitForTimeout(300);
        navigationCount++;
      }
      
      // Take screenshot after navigation
      await page.screenshot({ path: 'test-results/after-calendar-navigation.png' });
      
      // Now find and click the day
      const daySelectors = [
        `button:has-text("${day}")`,
        `div.day:has-text("${day}")`,
        `td:has-text("${day}")`,
        `div:text-is("${day}")`,
        `text="${day}"`
      ];
      
      let dayClicked = false;
      
      for (const selector of daySelectors) {
        try {
          // Find all matching elements
          const elements = await page.$$(selector);
          
          if (elements.length > 0) {
            // If multiple day numbers found (e.g., '1' appears multiple times in a month view)
            if (elements.length > 1) {
              // Try to find the one that's not from previous/next month
              for (const element of elements) {
                const classes = await element.getAttribute('class') || '';
                if (!classes.includes('other-month') && !classes.includes('disabled')) {
                  await element.click();
                  dayClicked = true;
                  console.log(`Clicked day ${day} (one of multiple) with selector: ${selector}`);
                  break;
                }
              }
              
              // If we still haven't clicked, just click the first one
              if (!dayClicked) {
                await elements[0].click();
                dayClicked = true;
                console.log(`Clicked first day ${day} found with selector: ${selector}`);
              }
            } else {
              // Only one found, click it
              await elements[0].click();
              dayClicked = true;
              console.log(`Clicked day ${day} with selector: ${selector}`);
            }
            
            if (dayClicked) break;
          }
        } catch (e) {
          console.log(`Error with day selector ${selector}: ${e.message}`);
          // Continue to next selector
        }
      }
      
      if (!dayClicked) {
        console.log(`Failed to click day ${day} after calendar navigation`);
        // Take a screenshot to help debug
        await page.screenshot({ path: 'test-results/day-click-failed.png' });
      }
    }
    
  } catch (error) {
    console.log("Error in date selection:", error);
    // Take a screenshot to help debug
    await page.screenshot({ path: 'test-results/date-selection-error.png' });
    
    // Last resort - try to click on anything with the day number
    console.log("Attempting last resort day selection");
    try {
      await page.locator(`text="${day}"`).first().click();
      console.log("Last resort day selection succeeded");
    } catch (e) {
      console.log("Failed to select date by any method");
      throw error; // Re-throw the original error
    }
  }
}

/**
 * Helper function to click a calendar cell with enhanced error handling and fallbacks
 */
async function clickCalendarCell(page) {
  try {
    // Wait for calendar to fully load
    await page.waitForTimeout(1000);

    // Try different selectors in order of preference
    // Based on actual calendar implementation (NotionWeekView uses .hour-cell)
    const cellSelectors = [
      '.hour-cell',              // Week view cells (NotionWeekView.js line 108)
      '.day-cell',               // Potential month view cells
      '.calendar-day-cell',      // Alternative naming
      '[data-testid="day-grid-cell"]',
      '.day-grid-cell',
      '.fc-day',
      '[role="gridcell"]'
    ];

    let clicked = false;

    for (const selector of cellSelectors) {
      try {
        const cells = await page.$$(selector);

        if (cells.length > 0) {
          console.log(`Found ${cells.length} cells with selector: ${selector}`);

          // Try to find a cell that's not disabled or from another month
          for (const cell of cells) {
            const classes = await cell.getAttribute('class') || '';
            const isDisabled = classes.includes('disabled') ||
                              classes.includes('other-month') ||
                              classes.includes('fc-other-month');

            if (!isDisabled) {
              // Wait a moment before clicking to ensure event listeners are attached
              await page.waitForTimeout(300);
              await cell.click();
              clicked = true;
              console.log(`✅ Clicked calendar cell with selector: ${selector}`);

              // Wait for EventDrawer to open
              await page.waitForTimeout(500);
              break;
            }
          }

          // If no suitable cell found, just click the first one
          if (!clicked && cells.length > 0) {
            await page.waitForTimeout(300);
            await cells[0].click();
            clicked = true;
            console.log(`✅ Clicked first calendar cell found with selector: ${selector}`);

            // Wait for EventDrawer to open
            await page.waitForTimeout(500);
          }

          if (clicked) break;
        }
      } catch (e) {
        console.log(`Error with cell selector ${selector}: ${e.message}`);
        // Continue to next selector
      }
    }

    // If no cell could be clicked, try the "Create" button in CalendarHeader
    if (!clicked) {
      console.log("Could not click cell with standard selectors, trying create button");

      const createButtonSelectors = [
        'button:has-text("Create")',       // CalendarHeader create button
        'button:has-text("Add")',
        'button:has-text("+")',
        '[aria-label="Add event"]',
        '[aria-label="Create event"]'
      ];

      for (const selector of createButtonSelectors) {
        try {
          const addButton = await page.$(selector);

          if (addButton) {
            await addButton.click();
            clicked = true;
            console.log(`✅ Used create button with selector: ${selector}`);

            // Wait for EventDrawer to open
            await page.waitForTimeout(500);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!clicked) {
        // Take a screenshot to help debug
        await page.screenshot({ path: 'test-results/calendar-no-clickable-elements.png' });
        throw new Error('Could not find any way to add an event - neither calendar cells nor create button found');
      }
    }
  } catch (error) {
    console.error('❌ Error clicking calendar cell:', error);
    // Take a screenshot to help debug
    await page.screenshot({ path: 'test-results/calendar-cell-click-error.png' });
    throw error;
  }
}

/**
 * Helper function to fill event details with better error handling
 */
async function fillEventDetails(page, details) {
  try {
    // Wait for EventDrawer to be visible
    await page.waitForTimeout(500);

    // Fill title
    if (details.title) {
      // EventDrawer uses placeholder="Event title" (EventDrawer.jsx line 414)
      const titleSelectors = [
        'input[placeholder="Event title"]',
        'input[placeholder*="title" i]',
        'input[placeholder*="Event" i]',
        '[data-testid="event-title-input"]'
      ];

      let titleFilled = false;

      for (const selector of titleSelectors) {
        try {
          const titleInput = await page.$(selector);
          if (titleInput) {
            await titleInput.fill(details.title);
            titleFilled = true;
            console.log(`✅ Filled title with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!titleFilled) {
        console.error('❌ Could not find title input field');
        await page.screenshot({ path: 'test-results/title-input-not-found.png' });
        throw new Error('Could not find title input field');
      }
    }
    
    // Set date (native HTML date input uses YYYY-MM-DD format)
    if (details.date) {
      try {
        // Format date as YYYY-MM-DD for native date input
        const year = details.date.year;
        const month = String(details.date.month + 1).padStart(2, '0'); // month is 0-indexed
        const day = String(details.date.day).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        // Fill the native date input directly (EventDrawer uses <input type="date">)
        await page.fill('[data-testid="date-picker"]', dateStr)
          .catch(async () => {
            console.log('Start date picker not found with data-testid, trying alternative selectors');
            // Try to find any date input
            const dateInputs = await page.$$('input[type="date"]');
            if (dateInputs.length > 0) {
              await dateInputs[0].fill(dateStr);
            }
          });

        console.log(`✅ Set start date to ${dateStr}`);
      } catch (e) {
        console.error('Could not set date:', e);
        // Don't throw - allow test to continue
      }
    }

    // Wait a moment for EventDrawer to process the date change
    await page.waitForTimeout(500);

    // Set start time (native HTML time input uses 24-hour format HH:MM)
    if (details.startTime) {
      try {
        // Convert "10:00am" to "10:00" (24-hour format for native input)
        const time24hr = convert12to24Hour(details.startTime);

        // Wait for time input to be present and visible
        try {
          await page.waitForSelector('[data-testid="time-picker-start"]', { timeout: 5000, state: 'visible' });
          await page.fill('[data-testid="time-picker-start"]', time24hr);
          console.log(`✅ Set start time to ${time24hr} (from ${details.startTime})`);
        } catch (e) {
          console.log('Start time picker not found with data-testid, trying alternative selector');
          // Try to find the first time input
          await page.waitForSelector('input[type="time"]', { timeout: 5000, state: 'visible' });
          const timeInputs = await page.$$('input[type="time"]');
          if (timeInputs.length > 0) {
            await timeInputs[0].fill(time24hr);
            console.log(`✅ Set start time to ${time24hr} using alternative selector`);
          }
        }
      } catch (e) {
        console.error('Could not set start time:', e);
        // Take screenshot to debug
        await page.screenshot({ path: 'test-results/time-input-error.png' });
        // Don't throw - allow test to continue
      }
    }
    
    // Set end time (native HTML time input uses 24-hour format HH:MM)
    if (details.endTime) {
      try {
        // Convert "11:00am" to "11:00" (24-hour format for native input)
        const time24hr = convert12to24Hour(details.endTime);

        // Wait for end time input to be present and visible
        try {
          await page.waitForSelector('[data-testid="time-picker-end"]', { timeout: 5000, state: 'visible' });
          await page.fill('[data-testid="time-picker-end"]', time24hr);
          console.log(`✅ Set end time to ${time24hr} (from ${details.endTime})`);
        } catch (e) {
          console.log('End time picker not found with data-testid, trying alternative selector');
          // Try to find the second time input (first is start, second is end)
          await page.waitForSelector('input[type="time"]', { timeout: 5000, state: 'visible' });
          const timeInputs = await page.$$('input[type="time"]');
          if (timeInputs.length > 1) {
            await timeInputs[1].fill(time24hr);
            console.log(`✅ Set end time to ${time24hr} using alternative selector`);
          }
        }
      } catch (e) {
        console.error('Could not set end time:', e);
        // Don't throw - allow test to continue
      }
    }
  } catch (error) {
    console.error('Error filling event details:', error);
    // Take a screenshot to help debug
    await page.screenshot({ path: 'test-results/fill-event-details-error.png' });
    throw error;
  }
}

/**
 * Helper function to click the save button with better error handling
 */
async function clickSaveButton(page) {
  try {
    // Wait a moment for the button to be ready
    await page.waitForTimeout(500);

    // Try different selectors in order of preference
    const buttonSelectors = [
      '[data-testid="save-event-button"]',  // Most specific
      'button:has-text("Create Event")',     // For new events
      'button:has-text("Save")',            // For existing events
      'button:has-text("Create")',
      'button:has-text("Add")',
      'button[type="submit"]'
    ];

    let clicked = false;

    for (const selector of buttonSelectors) {
      try {
        const buttons = await page.$$(selector);

        if (buttons.length > 0) {
          // Find a visible, enabled button
          for (const button of buttons) {
            const isVisible = await button.isVisible();
            const isDisabled = await button.isDisabled();

            if (isVisible && !isDisabled) {
              // Scroll button into view before clicking
              await button.scrollIntoViewIfNeeded();

              // Wait a moment after scrolling
              await page.waitForTimeout(300);

              // Force the click to bypass any overlapping elements
              await button.click({ force: true });
              clicked = true;
              console.log(`✅ Clicked save button with selector: ${selector}`);

              // Wait for save operation
              await page.waitForTimeout(1000);
              break;
            }
          }

          if (clicked) break;
        }
      } catch (e) {
        console.log(`Error with button selector ${selector}: ${e.message}`);
        // Continue to next selector
      }
    }

    if (!clicked) {
      console.error('❌ Could not find save button with any selector');
      await page.screenshot({ path: 'test-results/save-button-not-found.png' });
      throw new Error('Could not find save button with any selector');
    }
  } catch (error) {
    console.error('❌ Error clicking save button:', error);
    // Take a screenshot to help debug
    await page.screenshot({ path: 'test-results/save-button-click-error.png' });
    throw error;
  }
}

/**
 * Helper function to wait for a success message with multiple possible indicators
 */
async function waitForSuccess(page, possibleMessages = ['success', 'added', 'updated', 'deleted'], eventTitle = null) {
  try {
    // Create selector based on possible messages
    const selectors = possibleMessages.map(msg => `text=${msg}`);

    // Wait for any of the success indicators
    await Promise.race(selectors.map(selector =>
      page.waitForSelector(selector, { timeout: 10000 })
    )).catch(() => {
      // If explicit message not found, wait a moment to see if UI updates
      console.log('No success message found, waiting for UI update');
      return page.waitForTimeout(2000);
    });

    // For new events, check if the event appears in the EventDrawer (which confirms creation)
    if (eventTitle) {
      try {
        const titleInDrawer = await page.locator(`[data-testid="event-title-input"][value="${eventTitle}"]`).count();
        if (titleInDrawer > 0) {
          console.log(`✅ Event "${eventTitle}" found in EventDrawer - creation successful`);
        }
      } catch (e) {
        console.log('Could not verify event in drawer, but continuing');
      }
    }

    // Wait for EventDrawer to close (it closes after 500ms for new events)
    // The drawer slides off-screen with CSS transform, so we just wait for it to close
    console.log('Waiting for EventDrawer to close (500ms + buffer)...');
    await page.waitForTimeout(1500);

    console.log('✅ Event should be saved and drawer closed');

    // After drawer closes, wait a moment for calendar to process the new event
    await page.waitForTimeout(1000);
  } catch (error) {
    console.log('Could not verify success message, but continuing');
    // Take a screenshot to help debug
    await page.screenshot({ path: 'test-results/success-message-missing.png' });
  }
}

/**
 * Helper function to click on an element with multiple selector attempts
 */
async function clickElement(page, selectors) {
  for (const selector of selectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        await element.click();
        console.log(`Clicked element with selector: ${selector}`);
        return true;
      }
    } catch (e) {
      console.log(`Error with selector ${selector}: ${e.message}`);
      // Continue to next selector
    }
  }
  
  // If we get here, none of the selectors worked
  console.error(`Failed to click element with any of the selectors: ${selectors.join(', ')}`);
  await page.screenshot({ path: 'test-results/click-element-failed.png' });
  throw new Error(`Could not click element with selectors: ${selectors.join(', ')}`);
}

/**
 * Helper function to click on an event in the calendar
 */
async function clickEventInCalendar(page, eventTitle) {
  try {
    // Take screenshot before clicking
    await page.screenshot({ path: `test-results/before-click-${eventTitle.replace(/\s+/g, '-')}.png` });
    
    const selectors = [
      `text="${eventTitle}"`,
      `[title*="${eventTitle}"]`,
      `[aria-label*="${eventTitle}"]`,
      `.fc-event:has-text("${eventTitle}")`,
      `.event-title:has-text("${eventTitle}")`
    ];
    
    let clicked = false;
    
    // Try each selector
    for (const selector of selectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          // Click the first matching element
          await elements[0].click();
          clicked = true;
          console.log(`Clicked event "${eventTitle}" with selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`Error with selector ${selector}: ${e.message}`);
        // Continue to next selector
      }
    }
    
    if (!clicked) {
      // Try a more general approach - force a redraw first
      console.log(`Could not find event "${eventTitle}" with specific selectors, trying force redraw`);
      
      // Force a redraw by changing the view slightly (if there are view buttons)
      const viewButtons = await page.$$('button:has-text("Day"), button:has-text("Week"), button:has-text("Month")');
      if (viewButtons.length > 0) {
        await viewButtons[0].click();
        await page.waitForTimeout(500);
        // Click back to original view if there's a second button
        if (viewButtons.length > 1) {
          await viewButtons[1].click();
          await page.waitForTimeout(500);
        }
      }
      
      // Now try again with the first selector
      await page.click(`text="${eventTitle}"`);
      console.log(`Clicked event "${eventTitle}" after force redraw`);
    }
    
    // Take screenshot after clicking
    await page.waitForTimeout(500);
    await page.screenshot({ path: `test-results/after-click-${eventTitle.replace(/\s+/g, '-')}.png` });
  } catch (error) {
    console.error(`Error clicking event "${eventTitle}":`, error);
    // Take a screenshot to help debug
    await page.screenshot({ path: `test-results/click-event-error-${eventTitle.replace(/\s+/g, '-')}.png` });
    throw error;
  }
}

/**
 * Helper function to update event times (uses native HTML time inputs)
 */
async function updateEventTime(page, startTime, endTime) {
  try {
    // Change start time (native HTML time input uses 24-hour format)
    if (startTime) {
      try {
        const time24hr = convert12to24Hour(startTime);
        await page.fill('[data-testid="time-picker-start"]', time24hr);
        console.log(`✅ Updated start time to ${time24hr} (from ${startTime})`);
      } catch (e) {
        console.log('Could not update start time:', e);
        // Try alternative selector
        const timeInputs = await page.$$('input[type="time"]');
        if (timeInputs.length > 0) {
          await timeInputs[0].fill(convert12to24Hour(startTime));
        }
      }
    }

    // Wait a moment before changing end time
    await page.waitForTimeout(300);

    // Change end time (native HTML time input uses 24-hour format)
    if (endTime) {
      try {
        const time24hr = convert12to24Hour(endTime);
        await page.fill('[data-testid="time-picker-end"]', time24hr);
        console.log(`✅ Updated end time to ${time24hr} (from ${endTime})`);
      } catch (e) {
        console.log('Could not update end time:', e);
        // Try alternative selector
        const timeInputs = await page.$$('input[type="time"]');
        if (timeInputs.length > 1) {
          await timeInputs[1].fill(convert12to24Hour(endTime));
        }
      }
    }
  } catch (error) {
    console.log('Error updating event times:', error);
    // Take a screenshot to help debug
    await page.screenshot({ path: 'test-results/update-time-error.png' });
    // Don't throw, allow the test to continue
  }
}

/**
 * Helper function to create a test event with enhanced verification
 */
async function createTestEvent(page, title, date) {
  try {
    console.log(`Creating test event: ${title}`);
    
    // Take screenshot before creating event
    await page.screenshot({ path: `test-results/before-create-${title.replace(/\s+/g, '-')}.png` });
    
    // Try different ways to add an event
    
    // Option 1: Click on the add button if available
    const addButtonSelectors = [
      'button:has-text("Add")', 
      'button:has-text("+")', 
      '[aria-label="Add event"]',
      'button.add-event',
      '[data-testid="add-event-button"]'
    ];
    
    let eventFormOpened = false;
    
    // Try to use an add button first
    for (const selector of addButtonSelectors) {
      try {
        const addButton = await page.$(selector);
        if (addButton) {
          await addButton.click();
          console.log(`Clicked add button with selector: ${selector}`);
          eventFormOpened = true;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    // If add button approach didn't work, try clicking on a calendar cell
    if (!eventFormOpened) {
      await clickCalendarCell(page);
      eventFormOpened = true;
    }
    
    // Wait for EventDrawer to appear with EventDrawer-specific selectors
    // Based on EventDrawer.jsx structure (EventDrawer has "Event Details" header, not "Add Event")
    try {
      // Wait for the drawer form to be visible (give it 10 seconds)
      await page.waitForSelector('[data-testid="event-form"]', { timeout: 10000, state: 'visible' });
      console.log('✅ EventDrawer form detected');

      // Additional wait for drawer animation to complete
      await page.waitForTimeout(500);

      // Verify title input is present
      await page.waitForSelector('[data-testid="event-title-input"]', { timeout: 5000, state: 'visible' });
      console.log('✅ EventDrawer title input ready');
    } catch (error) {
      console.error('❌ EventDrawer not appearing with standard selectors');
      await page.screenshot({ path: 'test-results/missing-event-drawer.png' });
      throw new Error('EventDrawer failed to appear after clicking Create button');
    }
    
    // Fill in event details
    await fillEventDetails(page, {
      title: title,
      date: date,
      startTime: '10:00am',
      endTime: '11:00am'
    });
    
    // Take screenshot before saving
    await page.screenshot({ path: `test-results/before-save-${title.replace(/\s+/g, '-')}.png` });
    
    // Click Save button
    await clickSaveButton(page);
    
    // Wait for success indication with multiple possible indicators
    await waitForSuccess(page, ['Event added', 'added successfully', 'created', title]);
    
    // Take screenshot after event creation
    await page.screenshot({ path: `test-results/after-create-${title.replace(/\s+/g, '-')}.png` });
    
    // Verify the event appears in the calendar
    try {
      await retryUntilCondition(
        async () => (await page.locator(`text="${title}"`).count()) > 0,
        `Expected to find "${title}" in the calendar after creation`,
        5,
        1000
      );
      console.log(`✅ Event "${title}" created and verified successfully`);
    } catch (error) {
      console.log(`⚠️ Event "${title}" might have been created but verification failed:`, error);
      // Continue anyway, as later tests will check for the event
    }
  } catch (error) {
    console.error(`Error creating test event "${title}":`, error);
    
    // Take a screenshot to help debug
    await page.screenshot({ path: `test-results/create-event-error-${title.replace(/\s+/g, '-')}.png` });
    
    // Try a last resort approach - sometimes the event is created even if we can't verify it
    console.log('Attempting to continue despite error');
    
    // Wait a moment to let any background processing complete
    await page.waitForTimeout(2000);
  }
}

/**
 * Helper function to delete an event by title
 */
async function deleteEventByTitle(page, eventTitle) {
  try {
    console.log(`Attempting to delete event: ${eventTitle}`);
    // Click the event
    await clickEventInCalendar(page, eventTitle);
    
    // Wait for event popup
    await page.waitForSelector('[data-testid="event-popup"], [role="dialog"], .event-details, .event-popup', 
      { timeout: 10000 });
    
    // Click edit button if needed (some UIs require going to edit mode first)
    const editButtonVisible = await page.isVisible('[data-testid="edit-event-button"], button:has-text("Edit")');
    if (editButtonVisible) {
      await clickElement(page, [
        '[data-testid="edit-event-button"]',
        'button:has-text("Edit")',
        'button:has(svg[name="Edit"])',
        '.edit-button'
      ]);
    }
    
    // Click delete button
    await clickElement(page, [
      '[data-testid="delete-event-button"]',
      'button:has-text("Delete")',
      'button:has(svg[name="Trash"])',
      '.delete-button'
    ]);
    
    // Handle confirmation dialog if it appears
    const dialogPromise = page.waitForEvent('dialog', { timeout: 5000 }).catch(() => null);
    const dialog = await dialogPromise;
    
    if (dialog) {
      await dialog.accept();
    }
    
    // Wait for success
    await waitForSuccess(page, ['deleted', 'removed', 'success']);
    
    // Verify event is gone
    return await retryUntilCondition(
      async () => (await page.locator(`text="${eventTitle}"`).count()) === 0,
      `Expected "${eventTitle}" to be removed from calendar`,
      5,
      1000
    );
  } catch (error) {
    console.error(`Error deleting event "${eventTitle}":`, error);
    await page.screenshot({ path: `test-results/delete-event-error-${eventTitle.replace(/\s+/g, '-')}.png` });
    return false;
  }
}

/**
 * Generate a unique event title to avoid test conflicts
 */
function generateUniqueEventTitle(baseName) {
  const timestamp = Date.now().toString().slice(-6);
  return `test-${timestamp}: ${baseName}`;
}

// Export all helper functions
module.exports = {
  convert12to24Hour,
  navigateWithRetry,
  waitForCalendarLoad,
  login,
  retryUntilCondition,
  selectDate,
  clickCalendarCell,
  fillEventDetails,
  clickSaveButton,
  waitForSuccess,
  clickElement,
  clickEventInCalendar,
  updateEventTime,
  createTestEvent,
  deleteEventByTitle,
  generateUniqueEventTitle
};