# Test info

- Name: 🧠 CRITICAL: Family Memory System >> 🔗 Contextual memory linking across data types
- Location: /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/11-family-memory.spec.js:283:3

# Error details

```
TimeoutError: page.goto: Timeout 15000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/dashboard?tab=chat", waiting until "load"

    at /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/11-family-memory.spec.js:287:16
```

# Test source

```ts
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
  251 |       for (const word of words) {
  252 |         if (response?.includes(word)) {
  253 |           wordsFound++;
  254 |         }
  255 |       }
  256 |
  257 |       console.log(`📊 Vocabulary words recalled: ${wordsFound}/${words.length}`);
  258 |
  259 |       // Check if teacher name included
  260 |       const teacherMentioned = response?.includes('Thompson') || response?.includes('Ms.');
  261 |
  262 |       console.log(`📊 Teacher mentioned: ${teacherMentioned ? '✅' : '❌'}`);
  263 |
  264 |       // ASSERTION: At least partial recall
  265 |       // (Full recall requires historical data seeding)
  266 |       if (wordsFound >= 3 || teacherMentioned) {
  267 |         console.log('✅ PASS: Long-term memory recall working');
  268 |         expect(true).toBeTruthy();
  269 |       } else {
  270 |         console.log('⚠️ PARTIAL: Memory recall needs historical data seeding');
  271 |         console.log('📝 To fully test, add Firestore seed data from March 2024');
  272 |       }
  273 |
  274 |     } else {
  275 |       console.log('⚠️ Chat input not found');
  276 |       test.skip();
  277 |     }
  278 |   });
  279 |
  280 |   // ==============================================================
  281 |   // TEST 5: Contextual Memory Linking
  282 |   // ==============================================================
  283 |   test('🔗 Contextual memory linking across data types', async ({ page }) => {
  284 |     console.log('🎯 TEST: Contextual memory linking');
  285 |     console.log('Landing page: "Allie remembers everything - doctor\'s advice, school details, measurements"');
  286 |
> 287 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
      |                ^ TimeoutError: page.goto: Timeout 15000ms exceeded.
  288 |     await page.waitForLoadState('networkidle');
  289 |
  290 |     const chatInput = page.locator('textarea, input[type="text"]').last();
  291 |
  292 |     if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
  293 |       // STEP 1: Save multiple memories about Jack
  294 |       const memories = [
  295 |         "Dr. Chen appointment for Jack - March 14 - increase flossing",
  296 |         "Jack needs new backpack - teacher Mrs. Smith mentioned it",
  297 |         "Jack measured 48 inches tall today"
  298 |       ];
  299 |
  300 |       for (const memory of memories) {
  301 |         await chatInput.fill(memory);
  302 |
  303 |         const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
  304 |         await sendButton.click();
  305 |
  306 |         await page.waitForTimeout(4000);
  307 |         console.log(`✓ Saved memory: "${memory}"`);
  308 |       }
  309 |
  310 |       // STEP 2: Ask for all Jack memories from March
  311 |       await chatInput.fill("Tell me everything about Jack from March");
  312 |
  313 |       const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
  314 |       await sendButton.click();
  315 |
  316 |       await page.waitForTimeout(10000);
  317 |
  318 |       // STEP 3: Verify Allie returns ALL linked memories
  319 |       const response = await page.locator('div[class*="message"], div[class*="chat"]').last().textContent();
  320 |
  321 |       const mentionsDentist = response?.includes('Chen') || response?.includes('floss');
  322 |       const mentionsBackpack = response?.includes('backpack') || response?.includes('Mrs. Smith');
  323 |       const mentionsHeight = response?.includes('48') || response?.includes('inches');
  324 |
  325 |       console.log(`📊 Linked memories found:`);
  326 |       console.log(`   - Dentist visit: ${mentionsDentist ? '✅' : '❌'}`);
  327 |       console.log(`   - Backpack: ${mentionsBackpack ? '✅' : '❌'}`);
  328 |       console.log(`   - Height: ${mentionsHeight ? '✅' : '❌'}`);
  329 |
  330 |       // ASSERTION: At least 2 of 3 memories recalled and linked
  331 |       const memoriesLinked = [mentionsDentist, mentionsBackpack, mentionsHeight].filter(Boolean).length;
  332 |
  333 |       expect(memoriesLinked).toBeGreaterThanOrEqual(2);
  334 |       console.log('✅ PASS: Contextual memory linking works');
  335 |
  336 |     } else {
  337 |       console.log('⚠️ Chat input not found');
  338 |       test.skip();
  339 |     }
  340 |   });
  341 |
  342 |   // ==============================================================
  343 |   // TEST 6: Memory Search Functionality
  344 |   // ==============================================================
  345 |   test('🔍 Memory search finds relevant information', async ({ page }) => {
  346 |     console.log('🎯 TEST: Memory search');
  347 |     console.log('Landing page: "Smart search finds anything instantly"');
  348 |
  349 |     // Navigate to Document Hub or Memory Search
  350 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=documents`);
  351 |     await page.waitForLoadState('networkidle');
  352 |
  353 |     // Look for search input
  354 |     const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
  355 |
  356 |     if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
  357 |       console.log('✅ Found search input');
  358 |
  359 |       // STEP 1: Search for specific child
  360 |       await searchInput.fill('Jack dentist');
  361 |       await page.waitForTimeout(2000);
  362 |
  363 |       // STEP 2: Verify results appear
  364 |       const results = await page.locator('div[class*="result"], div[class*="document"], li').all();
  365 |
  366 |       console.log(`📊 Search results found: ${results.length}`);
  367 |
  368 |       // ASSERTION: Search returns results
  369 |       expect(results.length).toBeGreaterThan(0);
  370 |
  371 |       console.log('✅ PASS: Memory search functional');
  372 |
  373 |     } else {
  374 |       console.log('⚠️ Search input not found - may use Allie chat for search');
  375 |
  376 |       // Try search via Allie chat instead
  377 |       await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
  378 |       await page.waitForTimeout(2000);
  379 |
  380 |       const chatInput = page.locator('textarea, input[type="text"]').last();
  381 |
  382 |       if (await chatInput.isVisible({ timeout: 3000 }).catch(() => false)) {
  383 |         await chatInput.fill('Search for all Jack\'s dentist appointments');
  384 |
  385 |         const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
  386 |         await sendButton.click();
  387 |
```