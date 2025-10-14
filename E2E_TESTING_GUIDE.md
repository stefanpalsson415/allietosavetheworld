# End-to-End Testing Guide for Allie

## Overview
Comprehensive E2E tests for the complete user journey from signup to balanced family using Playwright.

## Test Structure

```
e2e/
├── complete-journey/
│   ├── 01-discovery-signup.spec.js    # Landing → Quiz → Signup
│   ├── 02-onboarding.spec.js          # Account creation → Verification → Setup
│   ├── 03-initial-setup.spec.js       # Dashboard → Survey completion (TODO)
│   ├── 04-feature-adoption.spec.js    # Allie chat → Email → Calendar → Tasks (TODO)
│   ├── 05-collaboration.spec.js       # Workload → Children → Habits (TODO)
│   └── 06-balance-verification.spec.js # Weekly check-ins → Success metrics (TODO)
└── utils/
    └── test-helpers.js                # Shared test utilities
```

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Tests

**All E2E tests:**
```bash
npm run test:e2e
```

**With browser UI:**
```bash
npm run test:e2e:headed
```

**With Playwright UI (interactive):**
```bash
npm run test:e2e:ui
```

**Debug mode:**
```bash
npm run test:e2e:debug
```

**Specific stage:**
```bash
npm run test:stage1  # Just Stage 1: Discovery & Signup
```

**Complete journey tests:**
```bash
npm run test:journey
```

### 3. View Results

Results are saved to:
- `test-results/html-report/` - HTML report with screenshots
- `test-results/results.json` - JSON results for CI
- `test-results/screenshots/` - Timestamped screenshots

## Test Coverage Status

### ✅ Implemented

#### Stage 1: Discovery & Signup (01-discovery-signup.spec.js)
- [x] 1.1 Landing page loads correctly
- [x] 1.2 Sales chat hidden on mobile
- [x] 1.3 Complete balance quiz (80 questions)
- [x] 1.4 Email report functionality
- [x] 1.5 Transition to signup
- [x] Console error monitoring
- [x] Critical element verification

**Test Count:** 7 tests
**Estimated Duration:** ~5-8 minutes

#### Stage 2: Onboarding Flow (02-onboarding.spec.js)
- [x] 2.1 Account creation with password
- [x] 2.2 Phone verification (SMS flow)
- [x] 2.3 Parent 1 email verification
- [x] 2.4 Parent 2 email verification
- [x] 2.5 Family email setup (@families.checkallie.com)
- [x] 2.6 Payment setup with coupon codes
- [x] 2.7 Complete end-to-end onboarding
- [x] 2.8 Family document validation

**Test Count:** 8 tests
**Estimated Duration:** ~10-15 minutes

### 🔄 Pending Implementation

#### Stage 3: Initial Setup & Survey
- [ ] Dashboard first load
- [ ] Initial 72-question survey (both parents)
- [ ] Children's age-appropriate survey
- [ ] Survey data persistence
- [ ] Balance metrics calculation

#### Stage 4: Core Features Usage
- [ ] Allie chat introduction
- [ ] Email integration (Document Hub)
- [ ] Calendar sync (Google)
- [ ] Task management (Kanban)
- [ ] Real-time sync verification

#### Stage 5: Family Collaboration
- [ ] Mental load redistribution
- [ ] Children's features (SANTA system)
- [ ] Habit formation
- [ ] Domain rotation

#### Stage 6: Balance Achievement
- [ ] Weekly check-in surveys
- [ ] Balance score improvement
- [ ] Power features activation
- [ ] Success metrics validation

## Test Utilities

### Shared Helpers (`utils/test-helpers.js`)

```javascript
// Generate unique test family
const testFamily = generateTestFamily();

// Wait for element with custom timeout
await waitForElement(page, selector, { timeout: 30000 });

// Fill input with realistic typing
await fillInput(page, selector, value);

// Click and wait for navigation
await clickAndWait(page, selector);

// Take timestamped screenshot
await takeTimestampedScreenshot(page, 'step-name');

// Verify no console errors
const errors = await verifyNoConsoleErrors(page);

// Complete balance quiz
await completeBalanceQuiz(page, testFamily);

// Complete onboarding flow
await completeOnboarding(page, testFamily);

// Complete initial survey
await completeInitialSurvey(page, 'Sarah');
```

## Configuration

### Playwright Config (`playwright.config.js`)

- **Base URL:** `http://localhost:3000` (configurable via `TEST_URL` env var)
- **Timeout:** 120 seconds per test
- **Retries:** 2 (on CI only)
- **Browsers:** Chrome desktop + iPhone 13 Pro
- **Video:** Recorded on failure
- **Screenshots:** On failure only
- **Trace:** On first retry

### Environment Variables

```bash
# Custom test URL (defaults to localhost:3000)
export TEST_URL=https://checkallie.com

# Run in CI mode (enables retries)
export CI=true
```

## Critical Test Data Points

### After Signup
- ✅ Family document exists in Firestore
- ✅ Family email created: `{prefix}@families.checkallie.com`
- ✅ Email registry entry for O(1) lookup
- ✅ Both parents verified
- ✅ Children data saved

### After Survey
- ⏳ 144 total responses (72 per parent)
- ⏳ Personalized questions generated
- ⏳ Balance metrics calculated
- ⏳ 4 categories covered (Physical, Emotional, Social, Cognitive)

### After Feature Usage
- ⏳ Allie chat history persisted
- ⏳ Calendar events sync without duplicates
- ⏳ Tasks tracked with assignments
- ⏳ Habits show progress

### After Balance Work
- ⏳ Equality score increased from baseline
- ⏳ Workload distribution more even
- ⏳ Stress indicators decreased
- ⏳ Harmony score improved

## Known Issues & Workarounds

### 1. Phone Verification in Test
**Issue:** Real SMS not sent in test environment
**Workaround:** Use mock code `123456`

### 2. Email Verification in Test
**Issue:** Real emails not sent in test environment
**Workaround:** Use mock code `123456`

### 3. Firebase Firestore Access
**Issue:** Tests can't directly validate Firestore data
**Workaround:**
- Validate through UI indicators
- Use Firebase Admin SDK for deeper validation (future)

### 4. Timing Sensitivity
**Issue:** Some flows require specific timing
**Workaround:** Added strategic `waitForTimeout` calls and custom wait functions

## Debugging Failed Tests

### 1. View HTML Report
```bash
npx playwright show-report test-results/html-report
```

### 2. Run with Video
Failed tests automatically record video in `test-results/`

### 3. Debug Mode
```bash
npm run test:e2e:debug
```
Opens Playwright Inspector for step-by-step debugging

### 4. Check Screenshots
All screenshots saved to `test-results/screenshots/` with timestamps

### 5. Console Errors
Each test monitors and logs console errors automatically

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
        env:
          CI: true
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: test-results/
```

## Best Practices

### 1. Test Isolation
- Each test generates unique family data
- No dependencies between tests
- Clean up test data after completion

### 2. Realistic Simulation
- Use realistic typing delays (50ms)
- Wait for network idle
- Take screenshots at key points

### 3. Error Handling
- Monitor console errors
- Capture screenshots on failure
- Provide detailed logging

### 4. Maintainability
- Use shared helper functions
- Keep tests focused (one flow per test)
- Document test intent clearly

## Performance Targets

| Stage | Duration | Pass Rate |
|-------|----------|-----------|
| Stage 1 | 5-8 min | 95%+ |
| Stage 2 | 10-15 min | 90%+ |
| Stage 3 | 20-25 min | 85%+ |
| Stage 4 | 15-20 min | 85%+ |
| Stage 5 | 10-15 min | 90%+ |
| Stage 6 | 5-10 min | 90%+ |
| **Total** | **65-93 min** | **90%+** |

## Next Steps

1. **Implement Stage 3-6 tests** following the same pattern
2. **Add Firebase Admin SDK** for direct Firestore validation
3. **Create test data cleanup script** for CI environment
4. **Add visual regression testing** with Playwright's screenshot comparison
5. **Implement load testing** for concurrent user journeys
6. **Set up continuous monitoring** to run tests every hour

## Support

- **Documentation:** See CLAUDE.md for codebase details
- **Issues:** Report at https://github.com/anthropics/allie/issues
- **Questions:** Contact the development team

---

**Last Updated:** 2025-10-10
**Test Coverage:** 15 tests (Stages 1-2 complete)
**Status:** ✅ Ready for Stage 1-2 testing, 🔄 Stages 3-6 pending
