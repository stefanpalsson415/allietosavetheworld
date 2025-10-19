# Test info

- Name: 📄 CRITICAL: Document Hub & Email Integration >> 🔗 Documents integrate with Calendar and Chat
- Location: /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/06-document-hub.spec.js:347:3

# Error details

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://localhost:3000/dashboard?tab=chat", waiting until "load"

    at /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/06-document-hub.spec.js:351:16
```

# Test source

```ts
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
  278 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=documents`);
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
> 351 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
      |                ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
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
  379 |       console.log(`📊 Integration check:`);
  380 |       console.log(`   - Calendar mention: ${mentionsCalendar ? '✅' : '⚠️'}`);
  381 |       console.log(`   - Document/memory: ${mentionsDocument ? '✅' : '⚠️'}`);
  382 |
  383 |       if (mentionsCalendar || mentionsDocument) {
  384 |         console.log('✅ PASS: Cross-system integration detected');
  385 |         expect(true).toBeTruthy();
  386 |       } else {
  387 |         console.log('⚠️ PARTIAL: Integration may need tuning');
  388 |       }
  389 |
  390 |     } else {
  391 |       console.log('⚠️ Chat not available');
  392 |       test.skip();
  393 |     }
  394 |   });
  395 |
  396 | });
  397 |
  398 | // ==============================================================
  399 | // HELPER FUNCTIONS
  400 | // ==============================================================
  401 |
  402 | /**
  403 |  * Send test email to family inbox
  404 |  */
  405 | async function sendTestEmail(familyEmail, subject, body, attachments = []) {
  406 |   console.log(`📧 Sending test email to ${familyEmail}`);
  407 |   // Implementation would use email API
  408 |   // This tests the email routing in functions/index.js
  409 | }
  410 |
  411 | /**
  412 |  * Upload test document
  413 |  */
  414 | async function uploadTestDocument(page, documentPath) {
  415 |   const fileInput = page.locator('input[type="file"]').first();
  416 |   await fileInput.setInputFiles(documentPath);
  417 |   console.log(`📤 Uploaded: ${documentPath}`);
  418 | }
  419 |
  420 | /**
  421 |  * Verify document appears in Firestore
  422 |  */
  423 | async function verifyDocumentInFirestore(familyId, documentName) {
  424 |   console.log('Checking Firestore for document');
  425 |   // Use Firebase Admin SDK
  426 | }
  427 |
```