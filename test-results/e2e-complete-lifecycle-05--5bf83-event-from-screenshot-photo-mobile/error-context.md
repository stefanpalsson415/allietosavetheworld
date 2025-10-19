# Test info

- Name: 📅 CRITICAL: Calendar Integration & Event Extraction >> 📸 Extract event from screenshot/photo
- Location: /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/05-calendar-integration.spec.js:109:3

# Error details

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://localhost:3000/dashboard?tab=chat", waiting until "load"

    at /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/05-calendar-integration.spec.js:113:16
```

# Test source

```ts
   13 |     simple: {
   14 |       title: 'Test Event - Dentist Appointment',
   15 |       date: '2025-10-25',
   16 |       time: '2:00 PM',
   17 |       description: 'Jack dentist checkup with Dr. Chen'
   18 |     },
   19 |     screenshot_party: {
   20 |       raw_text: "Tyler's friend Max birthday party - Saturday, April 19 at 2:00 PM at Adventure Zone",
   21 |       expected_title: 'Birthday party',
   22 |       expected_date: '2025-04-19',
   23 |       expected_time: '2:00 PM',
   24 |       expected_location: 'Adventure Zone'
   25 |     },
   26 |     recurring: {
   27 |       title: 'Piano Lessons',
   28 |       date: '2025-10-20',
   29 |       time: '4:00 PM',
   30 |       recurrence: 'weekly'
   31 |     }
   32 |   }
   33 | };
   34 |
   35 | test.describe('📅 CRITICAL: Calendar Integration & Event Extraction', () => {
   36 |   test.setTimeout(TEST_CONFIG.TIMEOUT);
   37 |
   38 |   // ==============================================================
   39 |   // TEST 1: Basic Event Creation (CRUD)
   40 |   // ==============================================================
   41 |   test('➕ Create, view, edit, and delete calendar event', async ({ page }) => {
   42 |     console.log('🎯 TEST: Basic calendar CRUD operations');
   43 |
   44 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=calendar`);
   45 |     await page.waitForLoadState('networkidle');
   46 |
   47 |     // STEP 1: Find "Create Event" or "Add Event" button
   48 |     const createButton = page.locator('button:has-text("Create"), button:has-text("Add Event"), button:has-text("New Event")').first();
   49 |
   50 |     if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
   51 |       console.log('✅ Found create event button');
   52 |
   53 |       await createButton.click();
   54 |       await page.waitForTimeout(1500);
   55 |
   56 |       // STEP 2: Fill event details
   57 |       const titleInput = page.locator('input[name="title"], input[placeholder*="title" i], input[placeholder*="event" i]').first();
   58 |
   59 |       if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
   60 |         await titleInput.fill(TEST_CONFIG.TEST_EVENTS.simple.title);
   61 |         console.log(`✓ Entered title: ${TEST_CONFIG.TEST_EVENTS.simple.title}`);
   62 |
   63 |         // Try to find date/time inputs
   64 |         const dateInput = page.locator('input[type="date"], input[name="date"]').first();
   65 |         const timeInput = page.locator('input[type="time"], input[name="time"]').first();
   66 |
   67 |         if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
   68 |           await dateInput.fill(TEST_CONFIG.TEST_EVENTS.simple.date);
   69 |           console.log(`✓ Entered date: ${TEST_CONFIG.TEST_EVENTS.simple.date}`);
   70 |         }
   71 |
   72 |         if (await timeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
   73 |           await timeInput.fill('14:00');
   74 |           console.log(`✓ Entered time: 14:00`);
   75 |         }
   76 |
   77 |         // STEP 3: Save event
   78 |         const saveButton = page.locator('button:has-text("Save"), button:has-text("Create")').first();
   79 |
   80 |         if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
   81 |           await saveButton.click();
   82 |           await page.waitForTimeout(2000);
   83 |
   84 |           console.log('✓ Event created');
   85 |
   86 |           // STEP 4: Verify event appears in calendar
   87 |           const eventExists = await page.locator(`text=/${TEST_CONFIG.TEST_EVENTS.simple.title}/i`).isVisible({ timeout: 5000 }).catch(() => false);
   88 |
   89 |           expect(eventExists).toBeTruthy();
   90 |           console.log('✅ PASS: Event CRUD working');
   91 |
   92 |         } else {
   93 |           console.log('⚠️ Save button not found');
   94 |         }
   95 |       } else {
   96 |         console.log('⚠️ Event form not found');
   97 |         test.skip();
   98 |       }
   99 |
  100 |     } else {
  101 |       console.log('⚠️ Create event button not found');
  102 |       test.skip();
  103 |     }
  104 |   });
  105 |
  106 |   // ==============================================================
  107 |   // TEST 2: Extract Event from Screenshot
  108 |   // ==============================================================
  109 |   test('📸 Extract event from screenshot/photo', async ({ page }) => {
  110 |     console.log('🎯 CRITICAL TEST: Event extraction from screenshot');
  111 |     console.log('Landing page: "Extract events from screenshots, emails, or conversation"');
  112 |
> 113 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
      |                ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  114 |     await page.waitForLoadState('networkidle');
  115 |
  116 |     const chatInput = page.locator('textarea, input[type="text"]').last();
  117 |
  118 |     if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
  119 |       // Simulate uploading screenshot by describing it in text
  120 |       const partyText = TEST_CONFIG.TEST_EVENTS.screenshot_party.raw_text;
  121 |
  122 |       await chatInput.fill(`I have this birthday party invitation: ${partyText}`);
  123 |       console.log(`📝 Simulating screenshot: "${partyText}"`);
  124 |
  125 |       const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
  126 |       await sendButton.click();
  127 |
  128 |       await page.waitForTimeout(8000);
  129 |
  130 |       // STEP 2: Verify Allie extracts event details
  131 |       const response = await page.locator('div[class*="message"]').last().textContent();
  132 |
  133 |       const extractedDate = response?.includes('April 19') || response?.includes('4/19');
  134 |       const extractedTime = response?.includes('2') && response?.includes('PM');
  135 |       const extractedLocation = response?.includes('Adventure Zone');
  136 |       const mentionsCalendar = response?.toLowerCase().includes('calendar') ||
  137 |                               response?.toLowerCase().includes('event') ||
  138 |                               response?.toLowerCase().includes('add');
  139 |
  140 |       console.log('📊 Extraction results:');
  141 |       console.log(`   - Date: ${extractedDate ? '✅' : '❌'}`);
  142 |       console.log(`   - Time: ${extractedTime ? '✅' : '❌'}`);
  143 |       console.log(`   - Location: ${extractedLocation ? '✅' : '❌'}`);
  144 |       console.log(`   - Calendar action: ${mentionsCalendar ? '✅' : '❌'}`);
  145 |
  146 |       // ASSERTION: At least 2 of 4 details extracted
  147 |       const extractionCount = [extractedDate, extractedTime, extractedLocation, mentionsCalendar].filter(Boolean).length;
  148 |
  149 |       expect(extractionCount).toBeGreaterThanOrEqual(2);
  150 |       console.log('✅ PASS: Event extraction from text/screenshot working');
  151 |
  152 |     } else {
  153 |       console.log('⚠️ Chat not available');
  154 |       test.skip();
  155 |     }
  156 |   });
  157 |
  158 |   // ==============================================================
  159 |   // TEST 3: Extract Event from Chat Conversation
  160 |   // ==============================================================
  161 |   test('💬 Extract event from natural conversation', async ({ page }) => {
  162 |     console.log('🎯 TEST: Event extraction from conversation');
  163 |
  164 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
  165 |     await page.waitForLoadState('networkidle');
  166 |
  167 |     const chatInput = page.locator('textarea, input[type="text"]').last();
  168 |
  169 |     if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
  170 |       // Natural language event
  171 |       await chatInput.fill("Schedule Emma's piano recital for next Saturday at 3pm at the community center");
  172 |
  173 |       const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
  174 |       await sendButton.click();
  175 |
  176 |       await page.waitForTimeout(8000);
  177 |
  178 |       const response = await page.locator('div[class*="message"]').last().textContent();
  179 |
  180 |       const mentionsSchedule = response?.toLowerCase().includes('schedul') ||
  181 |                               response?.toLowerCase().includes('calendar') ||
  182 |                               response?.toLowerCase().includes('event');
  183 |
  184 |       const mentionsTime = response?.includes('3') || response?.includes('pm');
  185 |
  186 |       console.log(`📊 Conversation parsing:`);
  187 |       console.log(`   - Scheduling action: ${mentionsSchedule ? '✅' : '❌'}`);
  188 |       console.log(`   - Time extraction: ${mentionsTime ? '✅' : '❌'}`);
  189 |
  190 |       expect(mentionsSchedule).toBeTruthy();
  191 |       console.log('✅ PASS: Natural language event extraction');
  192 |
  193 |     } else {
  194 |       console.log('⚠️ Chat not available');
  195 |       test.skip();
  196 |     }
  197 |   });
  198 |
  199 |   // ==============================================================
  200 |   // TEST 4: Google Calendar Sync Setup
  201 |   // ==============================================================
  202 |   test('🔗 Google Calendar sync configuration', async ({ page }) => {
  203 |     console.log('🎯 TEST: Google Calendar integration setup');
  204 |
  205 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=calendar`);
  206 |     await page.waitForLoadState('networkidle');
  207 |
  208 |     // STEP 1: Look for Google Calendar sync option
  209 |     const syncButton = page.locator('button:has-text("Google"), button:has-text("Sync"), button:has-text("Connect Calendar")').first();
  210 |
  211 |     if (await syncButton.isVisible({ timeout: 5000 }).catch(() => false)) {
  212 |       console.log('✅ Google Calendar sync button found');
  213 |
```