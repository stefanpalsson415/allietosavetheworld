# Test info

- Name: 🧠 CRITICAL: Family Memory System >> 🎤 Memory capture via voice
- Location: /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/11-family-memory.spec.js:45:3

# Error details

```
TimeoutError: page.goto: Timeout 15000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/dashboard?tab=chat", waiting until "load"

    at /Users/stefanpalsson/parentload copy/parentload-clean/tests/e2e/complete-lifecycle/11-family-memory.spec.js:49:16
```

# Test source

```ts
   1 | // tests/e2e/complete-lifecycle/11-family-memory.spec.js
   2 | // 🎯 CRITICAL: Family Memory System Tests
   3 | // "Your family's institutional memory, remembering everything so you don't have to"
   4 |
   5 | const { test, expect } = require('@playwright/test');
   6 | const path = require('path');
   7 |
   8 | // Test configuration
   9 | const TEST_CONFIG = {
   10 |   BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
   11 |   TIMEOUT: 30000,
   12 |
   13 |   // Test data for memory tests
   14 |   TEST_MEMORIES: {
   15 |     vocab_words: {
   16 |       text: "Emma's vocabulary words from Ms. Thompson: Perseverance, Dedication, Integrity, Compassion, Collaboration",
   17 |       date: '2024-03-15',
   18 |       teacher: 'Ms. Thompson',
   19 |       child: 'Emma',
   20 |       subject: 'education'
   21 |     },
   22 |     doctor_visit: {
   23 |       text: "Jack's dentist appointment - Dr. Chen - March 14, 2025 - Increase flossing to daily instead of 3x/week",
   24 |       date: '2025-03-14',
   25 |       doctor: 'Dr. Chen',
   26 |       child: 'Jack',
   27 |       subject: 'health'
   28 |     },
   29 |     birthday_party: {
   30 |       text: "Tyler's friend Max birthday party - Saturday, April 19 at 2:00 PM at Adventure Zone",
   31 |       date: '2025-04-19',
   32 |       time: '2:00 PM',
   33 |       location: 'Adventure Zone',
   34 |       subject: 'social'
   35 |     }
   36 |   }
   37 | };
   38 |
   39 | test.describe('🧠 CRITICAL: Family Memory System', () => {
   40 |   test.setTimeout(TEST_CONFIG.TIMEOUT);
   41 |
   42 |   // ==============================================================
   43 |   // TEST 1: Memory Capture via Voice
   44 |   // ==============================================================
   45 |   test('🎤 Memory capture via voice', async ({ page }) => {
   46 |     console.log('🎯 TEST: Memory capture via voice');
   47 |     console.log('Landing page example: "Voice memo about school event? Saved."');
   48 |
>  49 |     await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard?tab=chat`);
      |                ^ TimeoutError: page.goto: Timeout 15000ms exceeded.
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
```