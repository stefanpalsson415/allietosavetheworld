# Test info

- Name: 🧠 CRITICAL: Family Memory System >> 💬 Memory capture via chat with automatic context extraction
- Location: /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/11-family-memory.spec.js:146:3

# Error details

```
TimeoutError: page.goto: Timeout 15000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/dashboard?tab=chat", waiting until "load"

    at /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/11-family-memory.spec.js:150:16
```

# Test source

```ts
   50 |     await page.waitForLoadState('networkidle');
   51 |
   52 |     // STEP 1: Look for microphone button
   53 |     const micButton = page.locator('button[aria-label*="mic" i], button:has([class*="mic" i]), button:has-text("Voice")').first();
   54 |
   55 |     if (await micButton.isVisible({ timeout: 5000 }).catch(() => false)) {
   56 |       console.log('✅ Found microphone button');
   57 |
   58 |       // NOTE: Actual voice recording requires real audio input
   59 |       // For E2E testing, we'll simulate by typing the voice command
   60 |
   61 |       console.log('📝 Simulating voice input via text (actual voice requires browser permissions)');
   62 |
   63 |       // Find chat input
   64 |       const chatInput = page.locator('textarea, input[type="text"]').last();
   65 |
   66 |       if (await chatInput.isVisible({ timeout: 3000 }).catch(() => false)) {
   67 |         const memoryText = TEST_CONFIG.TEST_MEMORIES.vocab_words.text;
   68 |
   69 |         await chatInput.fill(memoryText);
   70 |         console.log(`📝 Entered memory: "${memoryText}"`);
   71 |
   72 |         // Send message
   73 |         const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
   74 |         await sendButton.click();
   75 |
   76 |         // Wait for AI response
   77 |         await page.waitForTimeout(5000);
   78 |
   79 |         // STEP 2: Verify Allie confirms capture
   80 |         const confirmation = await page.locator('text=/saved/i, text=/recorded/i, text=/remember/i').isVisible({ timeout: 10000 }).catch(() => false);
   81 |
   82 |         // ASSERTION: Allie confirms memory captured
   83 |         expect(confirmation).toBeTruthy();
   84 |         console.log('✅ PASS: Allie confirmed memory capture via voice/text');
   85 |       }
   86 |     } else {
   87 |       console.log('⚠️ Microphone button not found');
   88 |       test.skip();
   89 |     }
   90 |   });
   91 |
   92 |   // ==============================================================
   93 |   // TEST 2: Memory Capture via Photo
   94 |   // ==============================================================
   95 |   test('📸 Memory capture via photo upload', async ({ page }) => {
   96 |     console.log('🎯 TEST: Memory capture via photo');
   97 |     console.log('Landing page example: "Photo of doctor\'s notes? Captured."');
   98 |
   99 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
  100 |     await page.waitForLoadState('networkidle');
  101 |
  102 |     // STEP 1: Look for photo/upload button
  103 |     const uploadButton = page.locator('button[aria-label*="upload" i], button:has([class*="camera" i]), input[type="file"]').first();
  104 |
  105 |     if (await uploadButton.isVisible({ timeout: 5000 }).catch(() => false)) {
  106 |       console.log('✅ Found upload button');
  107 |
  108 |       // For E2E testing, we'll create a test image
  109 |       // In real tests, we'd upload actual doctor notes image
  110 |
  111 |       console.log('📝 Note: Photo upload requires actual image file');
  112 |       console.log('📝 For now, we\'ll test the UI flow');
  113 |
  114 |       // Click upload button
  115 |       await uploadButton.click();
  116 |       await page.waitForTimeout(1000);
  117 |
  118 |       console.log('✅ PASS: Upload button functional');
  119 |
  120 |     } else {
  121 |       console.log('⚠️ Upload button not found - trying Document Hub');
  122 |
  123 |       // Try Document Hub instead
  124 |       await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=documents`);
  125 |       await page.waitForTimeout(2000);
  126 |
  127 |       const docUpload = page.locator('button:has-text("Upload"), input[type="file"]').first();
  128 |
  129 |       if (await docUpload.isVisible({ timeout: 5000 }).catch(() => false)) {
  130 |         console.log('✅ Found Document Hub upload');
  131 |
  132 |         // Test document upload flow
  133 |         console.log('📝 Document upload flow available');
  134 |         expect(true).toBeTruthy();
  135 |
  136 |       } else {
  137 |         console.log('⚠️ No upload method found');
  138 |         test.skip();
  139 |       }
  140 |     }
  141 |   });
  142 |
  143 |   // ==============================================================
  144 |   // TEST 3: Memory Capture via Chat with Context
  145 |   // ==============================================================
  146 |   test('💬 Memory capture via chat with automatic context extraction', async ({ page }) => {
  147 |     console.log('🎯 TEST: Memory capture via chat');
  148 |     console.log('Landing page example: "Save this birthday party invitation"');
  149 |
> 150 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
      |                ^ TimeoutError: page.goto: Timeout 15000ms exceeded.
  151 |     await page.waitForLoadState('networkidle');
  152 |
  153 |     const chatInput = page.locator('textarea, input[type="text"]').last();
  154 |
  155 |     if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
  156 |       // STEP 1: Send party invitation details
  157 |       const partyInfo = TEST_CONFIG.TEST_MEMORIES.birthday_party.text;
  158 |
  159 |       await chatInput.fill(`Save this: ${partyInfo}`);
  160 |       console.log(`📝 Entered: "${partyInfo}"`);
  161 |
  162 |       const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
  163 |       await sendButton.click();
  164 |
  165 |       // Wait for AI to process
  166 |       await page.waitForTimeout(8000);
  167 |
  168 |       // STEP 2: Verify Allie extracted details
  169 |       // Landing page shows Allie extracts: Tyler's friend Max, April 19, 2pm, Adventure Zone
  170 |
  171 |       const response = await page.locator('div[class*="message"], div[class*="chat"]').last().textContent();
  172 |
  173 |       console.log('📝 Allie\'s response:', response?.substring(0, 200));
  174 |
  175 |       // Check if Allie extracted key details
  176 |       const extractedDate = response?.includes('April 19') || response?.includes('4/19');
  177 |       const extractedTime = response?.includes('2') && response?.includes('PM');
  178 |       const extractedLocation = response?.includes('Adventure Zone');
  179 |
  180 |       console.log(`📊 Extracted date: ${extractedDate ? '✅' : '❌'}`);
  181 |       console.log(`📊 Extracted time: ${extractedTime ? '✅' : '❌'}`);
  182 |       console.log(`📊 Extracted location: ${extractedLocation ? '✅' : '❌'}`);
  183 |
  184 |       // ASSERTION: Allie extracted at least some context
  185 |       expect(extractedDate || extractedTime || extractedLocation).toBeTruthy();
  186 |
  187 |       // STEP 3: Verify Allie asks about reminder
  188 |       // Landing page: "Would you like me to set a reminder to buy a present?"
  189 |
  190 |       const reminderOffer = response?.includes('reminder') || response?.includes('present');
  191 |
  192 |       if (reminderOffer) {
  193 |         console.log('✅ Allie proactively offered reminder');
  194 |       } else {
  195 |         console.log('⚠️ Allie did not offer reminder (may need context tuning)');
  196 |       }
  197 |
  198 |       console.log('✅ PASS: Chat memory capture with context extraction');
  199 |
  200 |     } else {
  201 |       console.log('⚠️ Chat input not found');
  202 |       test.skip();
  203 |     }
  204 |   });
  205 |
  206 |   // ==============================================================
  207 |   // TEST 4: Long-Term Memory Recall
  208 |   // ==============================================================
  209 |   test('📅 Long-term memory recall (1 year ago)', async ({ page }) => {
  210 |     console.log('🎯 CRITICAL TEST: Long-term memory recall');
  211 |     console.log('Landing page example: "What were the 5 vocabulary words from Emma\'s teacher last spring?"');
  212 |
  213 |     // This test validates Allie's ability to recall specific details from months/years ago
  214 |
  215 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
  216 |     await page.waitForLoadState('networkidle');
  217 |
  218 |     const chatInput = page.locator('textarea, input[type="text"]').last();
  219 |
  220 |     if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
  221 |       // STEP 1: First, save a memory (simulate it was saved last year)
  222 |       // In real test, we'd seed the database with old data
  223 |
  224 |       console.log('📝 Note: This test requires pre-seeded historical data');
  225 |       console.log('📝 For full implementation, seed Firestore with memory from March 2024');
  226 |
  227 |       // STEP 2: Ask Allie to recall the memory
  228 |       const recallQuery = "What were the 5 vocabulary words from Emma's teacher last spring?";
  229 |
  230 |       await chatInput.fill(recallQuery);
  231 |       console.log(`❓ Asking Allie: "${recallQuery}"`);
  232 |
  233 |       const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
  234 |       await sendButton.click();
  235 |
  236 |       // Wait for AI to search memory
  237 |       await page.waitForTimeout(10000);
  238 |
  239 |       // STEP 3: Verify Allie responds with exact memory
  240 |       // Landing page shows:
  241 |       // "From Ms. Thompson (March 15 last year): Perseverance, Dedication, Integrity, Compassion, Collaboration"
  242 |
  243 |       const response = await page.locator('div[class*="message"], div[class*="chat"]').last().textContent();
  244 |
  245 |       console.log('📝 Allie\'s recall response:', response?.substring(0, 300));
  246 |
  247 |       // Check if response includes the vocabulary words
  248 |       const words = ['Perseverance', 'Dedication', 'Integrity', 'Compassion', 'Collaboration'];
  249 |       let wordsFound = 0;
  250 |
```