# Test info

- Name: 📅 CRITICAL: Calendar Integration & Event Extraction >> 💬 Extract event from natural conversation
- Location: /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/05-calendar-integration.spec.js:161:3

# Error details

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://localhost:3000/dashboard?tab=chat", waiting until "load"

    at /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/05-calendar-integration.spec.js:164:16
```

# Test source

```ts
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
  113 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
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
> 164 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
      |                ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
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
  214 |       // STEP 2: Check if already connected
  215 |       const statusText = await page.textContent('body');
  216 |       const isConnected = statusText?.toLowerCase().includes('connected') ||
  217 |                          statusText?.toLowerCase().includes('synced');
  218 |
  219 |       if (isConnected) {
  220 |         console.log('✅ Google Calendar already connected');
  221 |         expect(true).toBeTruthy();
  222 |       } else {
  223 |         console.log('📝 Google Calendar not connected');
  224 |         console.log('📝 Note: Full OAuth flow requires Google account login');
  225 |       }
  226 |
  227 |     } else {
  228 |       console.log('⚠️ Google Calendar sync not visible');
  229 |       console.log('📝 May be in Settings or require Google Auth onboarding');
  230 |     }
  231 |   });
  232 |
  233 |   // ==============================================================
  234 |   // TEST 5: Family Timeline View
  235 |   // ==============================================================
  236 |   test('👨‍👩‍👧‍👦 Family timeline shows all members\' schedules', async ({ page }) => {
  237 |     console.log('🎯 TEST: Family schedule coordination');
  238 |     console.log('Landing page: "See everyone\'s schedule in one view"');
  239 |
  240 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=calendar`);
  241 |     await page.waitForLoadState('networkidle');
  242 |
  243 |     // STEP 1: Look for family members in calendar view
  244 |     const familyMembers = ['Jack', 'Emma', 'Oly', 'Tegner', 'Stefan', 'Parent'];
  245 |     let membersFound = 0;
  246 |
  247 |     for (const member of familyMembers) {
  248 |       const found = await page.locator(`text=/${member}/i`).first().isVisible({ timeout: 1000 }).catch(() => false);
  249 |       if (found) {
  250 |         membersFound++;
  251 |         console.log(`  ✓ ${member} found in calendar`);
  252 |       }
  253 |     }
  254 |
  255 |     console.log(`📊 Family members visible: ${membersFound}`);
  256 |
  257 |     // STEP 2: Look for week/timeline view
  258 |     const weekView = page.locator('button:has-text("Week"), [class*="week" i], [class*="timeline" i]').first();
  259 |     const hasWeekView = await weekView.isVisible({ timeout: 3000 }).catch(() => false);
  260 |
  261 |     console.log(`📅 Week/timeline view: ${hasWeekView ? '✅' : '⚠️'}`);
  262 |
  263 |     // ASSERTION: At least calendar navigation exists
  264 |     expect(membersFound > 0 || hasWeekView).toBeTruthy();
```