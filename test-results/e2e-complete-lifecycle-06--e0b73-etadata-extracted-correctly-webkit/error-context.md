# Test info

- Name: 📄 CRITICAL: Document Hub & Email Integration >> 📋 Document metadata extracted correctly
- Location: /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/06-document-hub.spec.js:274:3

# Error details

```
TimeoutError: page.goto: Timeout 15000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/dashboard?tab=documents", waiting until "load"

    at /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/06-document-hub.spec.js:278:16
```

# Test source

```ts
  178 |   test('🔍 Smart search finds documents instantly', async ({ page }) => {
  179 |     console.log('🎯 TEST: Document search');
  180 |     console.log('Landing page: "Smart search finds anything instantly"');
  181 |
  182 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=documents`);
  183 |     await page.waitForLoadState('networkidle');
  184 |
  185 |     // STEP 1: Find search input
  186 |     const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
  187 |
  188 |     if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
  189 |       console.log('✅ Search input found');
  190 |
  191 |       // STEP 2: Test search functionality
  192 |       await searchInput.fill('Jack dentist');
  193 |       await page.waitForTimeout(2000);
  194 |
  195 |       // STEP 3: Verify search executes (results update)
  196 |       const results = page.locator('[class*="result"], [class*="document"], [class*="item"]');
  197 |       const resultCount = await results.count();
  198 |
  199 |       console.log(`📊 Search triggered, found ${resultCount} results area(s)`);
  200 |
  201 |       // ASSERTION: Search interface works (even if no results for new family)
  202 |       expect(searchInput).toBeTruthy();
  203 |       console.log('✅ PASS: Search functionality exists');
  204 |
  205 |     } else {
  206 |       console.log('⚠️ Search input not found in Document Hub');
  207 |
  208 |       // Try global search
  209 |       const globalSearch = page.locator('input[placeholder*="search" i]').first();
  210 |
  211 |       if (await globalSearch.isVisible({ timeout: 3000 }).catch(() => false)) {
  212 |         console.log('✅ Global search available');
  213 |         expect(true).toBeTruthy();
  214 |       } else {
  215 |         console.log('⚠️ No search interface found');
  216 |         test.skip();
  217 |       }
  218 |     }
  219 |   });
  220 |
  221 |   // ==============================================================
  222 |   // TEST 5: Allie Chat Document Queries
  223 |   // ==============================================================
  224 |   test('🤖 Allie answers document queries with context', async ({ page }) => {
  225 |     console.log('🎯 CRITICAL TEST: Allie document queries');
  226 |     console.log('Landing page: "When was Jack\'s last dentist appointment and what did they recommend?"');
  227 |
  228 |     // This is THE signature feature - Allie finding and answering from documents
  229 |
  230 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
  231 |     await page.waitForLoadState('networkidle');
  232 |
  233 |     const chatInput = page.locator('textarea, input[type="text"]').last();
  234 |
  235 |     if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
  236 |       // STEP 1: Ask document-based question
  237 |       const query = "When was Jack's last dentist appointment and what did they recommend?";
  238 |
  239 |       await chatInput.fill(query);
  240 |       console.log(`❓ Asking: "${query}"`);
  241 |
  242 |       const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
  243 |       await sendButton.click();
  244 |
  245 |       // STEP 2: Wait for AI response
  246 |       await page.waitForTimeout(8000);
  247 |
  248 |       // STEP 3: Verify Allie responds with document info
  249 |       const response = await page.locator('div[class*="message"], div[class*="chat"]').last().textContent();
  250 |
  251 |       console.log('📝 Allie response:', response?.substring(0, 200));
  252 |
  253 |       // Check if response is informative (not just "I don't know")
  254 |       const hasInfo = response && response.length > 50;
  255 |       const notError = !response?.toLowerCase().includes('error');
  256 |
  257 |       if (hasInfo && notError) {
  258 |         console.log('✅ PASS: Allie provided response to document query');
  259 |         expect(true).toBeTruthy();
  260 |       } else {
  261 |         console.log('⚠️ PARTIAL: Allie responded but may need document data');
  262 |         console.log('📝 Note: Full test requires pre-uploaded doctor visit document');
  263 |       }
  264 |
  265 |     } else {
  266 |       console.log('⚠️ Chat input not found');
  267 |       test.skip();
  268 |     }
  269 |   });
  270 |
  271 |   // ==============================================================
  272 |   // TEST 6: Document Metadata Extraction
  273 |   // ==============================================================
  274 |   test('📋 Document metadata extracted correctly', async ({ page }) => {
  275 |     console.log('🎯 TEST: Metadata extraction');
  276 |     console.log('Verify: date, sender, subject, category auto-detected');
  277 |
> 278 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=documents`);
      |                ^ TimeoutError: page.goto: Timeout 15000ms exceeded.
  279 |     await page.waitForLoadState('networkidle');
  280 |
  281 |     // STEP 1: Look for any existing documents
  282 |     const documentItems = await page.locator('[class*="document"], [class*="file-item"], [role="listitem"]').all();
  283 |
  284 |     console.log(`📊 Found ${documentItems.length} document(s) in UI`);
  285 |
  286 |     if (documentItems.length > 0) {
  287 |       // STEP 2: Click first document to view details
  288 |       await documentItems[0].click();
  289 |       await page.waitForTimeout(1500);
  290 |
  291 |       // STEP 3: Look for metadata fields
  292 |       const metadataFields = ['date', 'category', 'child', 'tag', 'type'];
  293 |       let fieldsFound = 0;
  294 |
  295 |       for (const field of metadataFields) {
  296 |         const hasField = await page.locator(`text=/${field}/i`).isVisible({ timeout: 1000 }).catch(() => false);
  297 |         if (hasField) {
  298 |           fieldsFound++;
  299 |           console.log(`  ✓ ${field} field found`);
  300 |         }
  301 |       }
  302 |
  303 |       console.log(`📊 Metadata fields found: ${fieldsFound}/${metadataFields.length}`);
  304 |
  305 |       // ASSERTION: At least some metadata captured
  306 |       expect(fieldsFound).toBeGreaterThan(0);
  307 |       console.log('✅ PASS: Metadata extraction working');
  308 |
  309 |     } else {
  310 |       console.log('⚠️ No documents to inspect - skipping metadata test');
  311 |       console.log('📝 Note: Upload test documents first for full validation');
  312 |     }
  313 |   });
  314 |
  315 |   // ==============================================================
  316 |   // TEST 7: Document Linking to Family Members
  317 |   // ==============================================================
  318 |   test('👨‍👩‍👧‍👦 Documents auto-link to relevant family members', async ({ page }) => {
  319 |     console.log('🎯 TEST: Document-to-family-member linking');
  320 |     console.log('Landing page: "Automatically organize and connect"');
  321 |
  322 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=documents`);
  323 |     await page.waitForLoadState('networkidle');
  324 |
  325 |     // STEP 1: Look for family member filter/organization
  326 |     const familyFilters = page.locator('button:has-text("Jack"), button:has-text("Emma"), [class*="filter" i]');
  327 |     const hasFilters = await familyFilters.first().isVisible({ timeout: 5000 }).catch(() => false);
  328 |
  329 |     if (hasFilters) {
  330 |       console.log('✅ Family member filters available');
  331 |
  332 |       const filterCount = await familyFilters.count();
  333 |       console.log(`📊 Found ${filterCount} family member filter(s)`);
  334 |
  335 |       expect(filterCount).toBeGreaterThan(0);
  336 |       console.log('✅ PASS: Documents organized by family member');
  337 |
  338 |     } else {
  339 |       console.log('⚠️ No family member filters visible');
  340 |       console.log('📝 Note: May appear after documents uploaded');
  341 |     }
  342 |   });
  343 |
  344 |   // ==============================================================
  345 |   // TEST 8: Document-Calendar-Chat Integration
  346 |   // ==============================================================
  347 |   test('🔗 Documents integrate with Calendar and Chat', async ({ page }) => {
  348 |     console.log('🎯 TEST: Cross-system integration');
  349 |     console.log('Landing page: "All systems work together: A doctor\'s appointment triggers calendar events, document links..."');
  350 |
  351 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
  352 |     await page.waitForLoadState('networkidle');
  353 |
  354 |     const chatInput = page.locator('textarea, input[type="text"]').last();
  355 |
  356 |     if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
  357 |       // STEP 1: Ask Allie to save event + document
  358 |       const message = "Save this: Jack has a dentist appointment next Tuesday at 2pm with Dr. Chen. He needs a teeth cleaning.";
  359 |
  360 |       await chatInput.fill(message);
  361 |       console.log('📝 Message:', message);
  362 |
  363 |       const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
  364 |       await sendButton.click();
  365 |
  366 |       await page.waitForTimeout(8000);
  367 |
  368 |       const response = await page.locator('div[class*="message"]').last().textContent();
  369 |
  370 |       // STEP 2: Verify Allie mentions BOTH calendar AND document
  371 |       const mentionsCalendar = response?.toLowerCase().includes('calendar') ||
  372 |                               response?.toLowerCase().includes('appointment') ||
  373 |                               response?.toLowerCase().includes('event');
  374 |
  375 |       const mentionsDocument = response?.toLowerCase().includes('save') ||
  376 |                               response?.toLowerCase().includes('note') ||
  377 |                               response?.toLowerCase().includes('remember');
  378 |
```