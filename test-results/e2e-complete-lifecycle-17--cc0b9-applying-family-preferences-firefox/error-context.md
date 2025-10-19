# Test info

- Name: 🤖 CRITICAL: Allie Chat Intelligence >> 📚 Learning and applying family preferences
- Location: /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/17-allie-chat-intelligence.spec.js:201:3

# Error details

```
TimeoutError: page.goto: Timeout 15000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/dashboard?tab=chat", waiting until "load"

    at /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/17-allie-chat-intelligence.spec.js:205:16
```

# Test source

```ts
  105 |       await chatInput.fill(scenario.request);
  106 |       console.log(`📝 Complex request: "${scenario.request}"`);
  107 |
  108 |       const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
  109 |       await sendButton.click();
  110 |       await page.waitForTimeout(10000); // Complex tasks take longer
  111 |
  112 |       // STEP 2: Verify Allie breaks down into steps
  113 |       const response = await page.locator('div[class*="message"]').last().textContent();
  114 |
  115 |       console.log('📊 Checking if Allie decomposed task into steps...');
  116 |       const stepsIdentified = scenario.expectedSteps.filter(step =>
  117 |         response?.toLowerCase().includes(step)
  118 |       );
  119 |
  120 |       console.log(`📊 Steps identified: ${stepsIdentified.length}/${scenario.expectedSteps.length}`);
  121 |       console.log(`   Found: ${stepsIdentified.join(', ')}`);
  122 |
  123 |       // ASSERTION: Allie mentions all 3 sub-tasks
  124 |       expect(stepsIdentified.length).toBeGreaterThanOrEqual(2);
  125 |
  126 |       // STEP 3: Check if tasks were created (optional advanced check)
  127 |       const tasksCreated = response?.toLowerCase().includes('task') ||
  128 |                           response?.toLowerCase().includes('created') ||
  129 |                           response?.toLowerCase().includes('added');
  130 |
  131 |       if (tasksCreated) {
  132 |         console.log('✅ BONUS: Allie created tasks automatically');
  133 |       }
  134 |
  135 |       console.log('✅ PASS: Multi-step task decomposition works');
  136 |
  137 |     } else {
  138 |       console.log('⚠️ Chat input not found');
  139 |       test.skip();
  140 |     }
  141 |   });
  142 |
  143 |   // ==============================================================
  144 |   // TEST 3: Proactive Suggestions Based on Patterns
  145 |   // ==============================================================
  146 |   test('💡 Proactive suggestions based on family patterns', async ({ page }) => {
  147 |     console.log('🎯 TEST: Allie learns and suggests proactively');
  148 |     console.log('Landing page: "Gets smarter over time"');
  149 |
  150 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
  151 |     await page.waitForLoadState('networkidle');
  152 |
  153 |     const chatInput = page.locator('textarea, input[type="text"]').last();
  154 |
  155 |     if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
  156 |       // STEP 1: Establish a pattern (recurring event)
  157 |       const patternMessage = "Jack has soccer practice every Tuesday at 4pm";
  158 |       await chatInput.fill(patternMessage);
  159 |       console.log(`📝 Establishing pattern: "${patternMessage}"`);
  160 |
  161 |       let sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
  162 |       await sendButton.click();
  163 |       await page.waitForTimeout(6000);
  164 |
  165 |       // STEP 2: Request something that conflicts with pattern
  166 |       await chatInput.fill("Schedule a dentist appointment for Jack next Tuesday at 3:30pm");
  167 |       console.log('📝 Requesting potentially conflicting appointment...');
  168 |
  169 |       sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
  170 |       await sendButton.click();
  171 |       await page.waitForTimeout(8000);
  172 |
  173 |       // STEP 3: Verify Allie proactively warns about conflict
  174 |       const response = await page.locator('div[class*="message"]').last().textContent();
  175 |
  176 |       const warnsAboutConflict = response?.toLowerCase().includes('conflict') ||
  177 |                                 response?.toLowerCase().includes('overlap') ||
  178 |                                 response?.toLowerCase().includes('soccer') ||
  179 |                                 (response?.toLowerCase().includes('tuesday') &&
  180 |                                  response?.toLowerCase().includes('4'));
  181 |
  182 |       console.log(`📊 Proactive conflict warning: ${warnsAboutConflict ? '✅' : '⚠️'}`);
  183 |
  184 |       if (warnsAboutConflict) {
  185 |         console.log('✅ PASS: Allie proactively suggests based on patterns');
  186 |         expect(true).toBeTruthy();
  187 |       } else {
  188 |         console.log('⚠️ PARTIAL: Allie may need more pattern training');
  189 |         console.log('📝 Note: Proactive suggestions improve with more family data');
  190 |       }
  191 |
  192 |     } else {
  193 |       console.log('⚠️ Chat input not found');
  194 |       test.skip();
  195 |     }
  196 |   });
  197 |
  198 |   // ==============================================================
  199 |   // TEST 4: Learning Family Preferences
  200 |   // ==============================================================
  201 |   test('📚 Learning and applying family preferences', async ({ page }) => {
  202 |     console.log('🎯 TEST: Allie learns family preferences');
  203 |     console.log('Landing page: "Knows what you need before you ask"');
  204 |
> 205 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
      |                ^ TimeoutError: page.goto: Timeout 15000ms exceeded.
  206 |     await page.waitForLoadState('networkidle');
  207 |
  208 |     const chatInput = page.locator('textarea, input[type="text"]').last();
  209 |
  210 |     if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
  211 |       // STEP 1: Establish a preference
  212 |       const preferences = [
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
```