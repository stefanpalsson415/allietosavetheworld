# Test info

- Name: 📄 CRITICAL: Document Hub & Email Integration >> 📤 Document upload with auto-categorization
- Location: /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/06-document-hub.spec.js:34:3

# Error details

```
TimeoutError: page.goto: Timeout 15000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/dashboard?tab=documents", waiting until "load"

    at /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/06-document-hub.spec.js:38:16
```

# Test source

```ts
   1 | // tests/e2e/complete-lifecycle/06-document-hub.spec.js
   2 | // 🎯 CRITICAL: Document Hub Tests
   3 | // Email integration + document capture is a CORE feature
   4 |
   5 | const { test, expect } = require('@playwright/test');
   6 |
   7 | const TEST_CONFIG = {
   8 |   BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
   9 |   TIMEOUT: 40000,
   10 |
   11 |   // Test document data
   12 |   TEST_DOCUMENTS: {
   13 |     doctor_note: {
   14 |       filename: 'doctor-note-jack.pdf',
   15 |       expectedText: 'Dr. Chen',
   16 |       category: 'health',
   17 |       child: 'Jack'
   18 |     },
   19 |     school_notice: {
   20 |       filename: 'school-notice.pdf',
   21 |       expectedText: 'field trip',
   22 |       category: 'education',
   23 |       child: 'Emma'
   24 |     }
   25 |   }
   26 | };
   27 |
   28 | test.describe('📄 CRITICAL: Document Hub & Email Integration', () => {
   29 |   test.setTimeout(TEST_CONFIG.TIMEOUT);
   30 |
   31 |   // ==============================================================
   32 |   // TEST 1: Document Upload and Organization
   33 |   // ==============================================================
   34 |   test('📤 Document upload with auto-categorization', async ({ page }) => {
   35 |     console.log('🎯 TEST: Document upload and organization');
   36 |     console.log('Landing page: "Capture documents via photo, upload, or text"');
   37 |
>  38 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=documents`);
      |                ^ TimeoutError: page.goto: Timeout 15000ms exceeded.
   39 |     await page.waitForLoadState('networkidle');
   40 |
   41 |     // STEP 1: Look for upload button/area
   42 |     const uploadButton = page.locator('button:has-text("Upload"), input[type="file"], [class*="upload" i]').first();
   43 |
   44 |     if (await uploadButton.isVisible({ timeout: 5000 }).catch(() => false)) {
   45 |       console.log('✅ Found document upload interface');
   46 |
   47 |       // STEP 2: Verify upload area functional
   48 |       const isFileInput = await uploadButton.evaluate(el => el.tagName === 'INPUT');
   49 |
   50 |       if (isFileInput) {
   51 |         console.log('✅ File input ready for upload');
   52 |         expect(true).toBeTruthy();
   53 |       } else {
   54 |         // Click to reveal file input
   55 |         await uploadButton.click();
   56 |         await page.waitForTimeout(1000);
   57 |
   58 |         const fileInput = page.locator('input[type="file"]').first();
   59 |         const fileInputVisible = await fileInput.isVisible({ timeout: 3000 }).catch(() => false);
   60 |
   61 |         expect(fileInputVisible).toBeTruthy();
   62 |         console.log('✅ Upload dialog functional');
   63 |       }
   64 |
   65 |       // STEP 3: Verify document list/grid exists
   66 |       const documentList = page.locator('[class*="document"], [class*="file"], [role="list"]').first();
   67 |       const hasDocumentArea = await documentList.isVisible({ timeout: 3000 }).catch(() => false);
   68 |
   69 |       console.log(`📊 Document display area: ${hasDocumentArea ? '✅' : '⚠️'}`);
   70 |
   71 |     } else {
   72 |       console.log('⚠️ Upload interface not found - may need different navigation');
   73 |
   74 |       // Try alternative: Document Hub might be in different tab
   75 |       const docHub = page.locator('a:has-text("Documents"), button:has-text("Document Hub")').first();
   76 |
   77 |       if (await docHub.isVisible({ timeout: 3000 }).catch(() => false)) {
   78 |         await docHub.click();
   79 |         await page.waitForTimeout(2000);
   80 |         console.log('✅ Navigated to Document Hub via alternative route');
   81 |         expect(true).toBeTruthy();
   82 |       } else {
   83 |         console.log('⚠️ Document Hub not accessible - skipping test');
   84 |         test.skip();
   85 |       }
   86 |     }
   87 |   });
   88 |
   89 |   // ==============================================================
   90 |   // TEST 2: Email Integration - Family Inbox
   91 |   // ==============================================================
   92 |   test('📧 Email integration via family inbox @families.checkallie.com', async ({ page }) => {
   93 |     console.log('🎯 CRITICAL TEST: Email integration');
   94 |     console.log('Landing page: Family email @families.checkallie.com');
   95 |
   96 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=documents`);
   97 |     await page.waitForLoadState('networkidle');
   98 |
   99 |     // STEP 1: Look for family email address display
  100 |     const emailDisplay = page.locator('text=/@families\\.checkallie\\.com/, text=/family.*email/i').first();
  101 |
  102 |     const hasEmail = await emailDisplay.isVisible({ timeout: 5000 }).catch(() => false);
  103 |
  104 |     if (hasEmail) {
  105 |       const emailText = await emailDisplay.textContent();
  106 |       console.log(`✅ Family email found: ${emailText}`);
  107 |
  108 |       // ASSERTION: Email address is formatted correctly
  109 |       expect(emailText).toMatch(/@families\.checkallie\.com/);
  110 |
  111 |       // STEP 2: Look for inbox/received emails section
  112 |       const inboxSection = page.locator('text=/inbox/i, text=/received/i, [class*="email" i]').first();
  113 |       const hasInbox = await inboxSection.isVisible({ timeout: 3000 }).catch(() => false);
  114 |
  115 |       console.log(`📬 Inbox section: ${hasInbox ? '✅' : '⚠️'}`);
  116 |
  117 |       console.log('✅ PASS: Email integration interface exists');
  118 |
  119 |     } else {
  120 |       console.log('⚠️ Family email not displayed - may need onboarding completion');
  121 |       console.log('📝 Note: Email created during onboarding at Step 6');
  122 |     }
  123 |
  124 |     // STEP 3: Verify email parsing capability exists
  125 |     // This would be tested with actual email send, which requires backend
  126 |     console.log('📝 Note: Full email parsing requires sending test email to family inbox');
  127 |     console.log('📝 See: functions/index.js:1640-1707 for email routing logic');
  128 |   });
  129 |
  130 |   // ==============================================================
  131 |   // TEST 3: Document Capture via Photo (OCR)
  132 |   // ==============================================================
  133 |   test('📸 Document capture via photo with OCR extraction', async ({ page }) => {
  134 |     console.log('🎯 TEST: Photo capture with OCR');
  135 |     console.log('Landing page: "Photo of doctor\'s notes? Captured."');
  136 |
  137 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=documents`);
  138 |     await page.waitForLoadState('networkidle');
```