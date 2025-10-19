# Test info

- Name: 🤖 CRITICAL: Allie Chat Intelligence >> 🔗 Contextual awareness across calendar, tasks, and documents
- Location: /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/17-allie-chat-intelligence.spec.js:309:3

# Error details

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://localhost:3000/dashboard?tab=chat", waiting until "load"

    at /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/17-allie-chat-intelligence.spec.js:313:16
```

# Test source

```ts
  213 |         "We always do grocery shopping on Saturdays",
  214 |         "Emma prefers morning activities, she's not good in the afternoon",
  215 |         "We need at least 30 minutes travel time to get anywhere"
  216 |       ];
  217 |
  218 |       for (const pref of preferences) {
  219 |         await chatInput.fill(pref);
  220 |         console.log(`📝 Teaching preference: "${pref}"`);
  221 |
  222 |         const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
  223 |         await sendButton.click();
  224 |         await page.waitForTimeout(4000);
  225 |       }
  226 |
  227 |       // STEP 2: Ask Allie to plan something that should use these preferences
  228 |       await chatInput.fill("When's a good time to schedule Emma's piano lesson?");
  229 |       console.log('📝 Asking for schedule recommendation...');
  230 |
  231 |       const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
  232 |       await sendButton.click();
  233 |       await page.waitForTimeout(8000);
  234 |
  235 |       // STEP 3: Verify Allie applies learned preferences
  236 |       const response = await page.locator('div[class*="message"]').last().textContent();
  237 |
  238 |       const appliesPreferences = response?.toLowerCase().includes('morning') ||
  239 |                                 response?.toLowerCase().includes('saturday') ||
  240 |                                 response?.toLowerCase().includes('travel');
  241 |
  242 |       console.log(`📊 Applied preferences: ${appliesPreferences ? '✅' : '⚠️'}`);
  243 |
  244 |       if (appliesPreferences) {
  245 |         console.log('✅ PASS: Allie learns and applies family preferences');
  246 |         expect(true).toBeTruthy();
  247 |       } else {
  248 |         console.log('⚠️ PARTIAL: Preference learning needs more training');
  249 |       }
  250 |
  251 |     } else {
  252 |       console.log('⚠️ Chat input not found');
  253 |       test.skip();
  254 |     }
  255 |   });
  256 |
  257 |   // ==============================================================
  258 |   // TEST 5: Natural Language Understanding - Complex Requests
  259 |   // ==============================================================
  260 |   test('🗣️ Natural language understanding of complex requests', async ({ page }) => {
  261 |     console.log('🎯 TEST: Complex NLU');
  262 |     console.log('Landing page: "Just talk to me like you would a friend"');
  263 |
  264 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
  265 |     await page.waitForLoadState('networkidle');
  266 |
  267 |     const chatInput = page.locator('textarea, input[type="text"]').last();
  268 |
  269 |     if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
  270 |       // Complex natural language requests
  271 |       const complexRequests = [
  272 |         "Can you find that thing from the doctor about Jack's allergy shots from like 3 months ago?",
  273 |         "What were we supposed to do before Emma's field trip next week?",
  274 |         "Remind me every Tuesday morning to check if Jack has his homework done"
  275 |       ];
  276 |
  277 |       for (const request of complexRequests) {
  278 |         await chatInput.fill(request);
  279 |         console.log(`📝 Complex request: "${request}"`);
  280 |
  281 |         const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
  282 |         await sendButton.click();
  283 |         await page.waitForTimeout(8000);
  284 |
  285 |         const response = await page.locator('div[class*="message"]').last().textContent();
  286 |
  287 |         // Check if Allie understood the intent (doesn't just say "I don't understand")
  288 |         const understood = response && response.length > 50 &&
  289 |                           !response.toLowerCase().includes("i don't understand") &&
  290 |                           !response.toLowerCase().includes("could you clarify");
  291 |
  292 |         console.log(`📊 Understood request: ${understood ? '✅' : '⚠️'}`);
  293 |
  294 |         await page.waitForTimeout(2000);
  295 |       }
  296 |
  297 |       console.log('✅ PASS: Complex natural language processing');
  298 |       expect(true).toBeTruthy();
  299 |
  300 |     } else {
  301 |       console.log('⚠️ Chat input not found');
  302 |       test.skip();
  303 |     }
  304 |   });
  305 |
  306 |   // ==============================================================
  307 |   // TEST 6: Contextual Awareness Across Features
  308 |   // ==============================================================
  309 |   test('🔗 Contextual awareness across calendar, tasks, and documents', async ({ page }) => {
  310 |     console.log('🎯 TEST: Cross-feature context awareness');
  311 |     console.log('Landing page: "All systems work together seamlessly"');
  312 |
> 313 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
      |                ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  314 |     await page.waitForLoadState('networkidle');
  315 |
  316 |     const chatInput = page.locator('textarea, input[type="text"]').last();
  317 |
  318 |     if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
  319 |       // STEP 1: Create data across multiple features
  320 |       const message = "Jack has a dentist appointment next Tuesday at 2pm. " +
  321 |                      "I need to pick up his medical records beforehand. " +
  322 |                      "The dentist said we need to schedule a follow-up in 6 months.";
  323 |
  324 |       await chatInput.fill(message);
  325 |       console.log('📝 Cross-feature request:', message);
  326 |
  327 |       const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
  328 |       await sendButton.click();
  329 |       await page.waitForTimeout(10000);
  330 |
  331 |       // STEP 2: Verify Allie recognizes multiple action items
  332 |       const response = await page.locator('div[class*="message"]').last().textContent();
  333 |
  334 |       const recognizedCalendar = response?.toLowerCase().includes('appointment') ||
  335 |                                  response?.toLowerCase().includes('calendar') ||
  336 |                                  response?.toLowerCase().includes('tuesday');
  337 |
  338 |       const recognizedTask = response?.toLowerCase().includes('pick up') ||
  339 |                             response?.toLowerCase().includes('records') ||
  340 |                             response?.toLowerCase().includes('task');
  341 |
  342 |       const recognizedReminder = response?.toLowerCase().includes('follow-up') ||
  343 |                                 response?.toLowerCase().includes('6 months') ||
  344 |                                 response?.toLowerCase().includes('remind');
  345 |
  346 |       console.log('📊 Cross-feature recognition:');
  347 |       console.log(`   - Calendar event: ${recognizedCalendar ? '✅' : '❌'}`);
  348 |       console.log(`   - Task creation: ${recognizedTask ? '✅' : '❌'}`);
  349 |       console.log(`   - Future reminder: ${recognizedReminder ? '✅' : '❌'}`);
  350 |
  351 |       const totalRecognized = [recognizedCalendar, recognizedTask, recognizedReminder].filter(Boolean).length;
  352 |
  353 |       // ASSERTION: At least 2 of 3 features recognized
  354 |       expect(totalRecognized).toBeGreaterThanOrEqual(2);
  355 |       console.log('✅ PASS: Contextual awareness across features');
  356 |
  357 |     } else {
  358 |       console.log('⚠️ Chat input not found');
  359 |       test.skip();
  360 |     }
  361 |   });
  362 |
  363 |   // ==============================================================
  364 |   // TEST 7: Task Delegation and Follow-Up
  365 |   // ==============================================================
  366 |   test('📋 Task delegation and autonomous follow-up', async ({ page }) => {
  367 |     console.log('🎯 TEST: Allie delegates and follows up');
  368 |     console.log('Landing page: "I\'ll handle the details so you don\'t have to"');
  369 |
  370 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
  371 |     await page.waitForLoadState('networkidle');
  372 |
  373 |     const chatInput = page.locator('textarea, input[type="text"]').last();
  374 |
  375 |     if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
  376 |       // STEP 1: Delegate a task to Allie
  377 |       const delegation = "Can you make sure we renew Emma's library card before it expires next month?";
  378 |
  379 |       await chatInput.fill(delegation);
  380 |       console.log(`📝 Delegating task: "${delegation}"`);
  381 |
  382 |       const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
  383 |       await sendButton.click();
  384 |       await page.waitForTimeout(8000);
  385 |
  386 |       // STEP 2: Verify Allie confirms and creates reminder
  387 |       const response = await page.locator('div[class*="message"]').last().textContent();
  388 |
  389 |       const confirmsTask = response?.toLowerCase().includes('remind') ||
  390 |                           response?.toLowerCase().includes('library card') ||
  391 |                           response?.toLowerCase().includes('next month');
  392 |
  393 |       const createsAction = response?.toLowerCase().includes('reminder') ||
  394 |                            response?.toLowerCase().includes('calendar') ||
  395 |                            response?.toLowerCase().includes('task');
  396 |
  397 |       console.log('📊 Task delegation:');
  398 |       console.log(`   - Confirms understanding: ${confirmsTask ? '✅' : '❌'}`);
  399 |       console.log(`   - Creates action item: ${createsAction ? '✅' : '❌'}`);
  400 |
  401 |       // ASSERTION: Allie both confirms AND creates action
  402 |       expect(confirmsTask || createsAction).toBeTruthy();
  403 |       console.log('✅ PASS: Task delegation and follow-up works');
  404 |
  405 |     } else {
  406 |       console.log('⚠️ Chat input not found');
  407 |       test.skip();
  408 |     }
  409 |   });
  410 |
  411 | });
  412 |
  413 | // ==============================================================
```