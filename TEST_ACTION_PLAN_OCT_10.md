# Test Suite Action Plan - October 10, 2025

**Goal:** Address critical testing gaps identified in Weekly Test Audit
**Timeline:** 2 weeks (Oct 10-24, 2025)
**Focus:** High-impact, critical-path testing

---

## 🎯 Strategic Priorities

### Why This Plan?

**Current Reality:**
- ✅ Excellent regression coverage (8/8 October bugs)
- ✅ Good E2E test foundation (20 files)
- ❌ **CRITICAL GAP:** 95% of services have zero unit tests
- ❌ **CRITICAL GAP:** 98% of components have zero unit tests
- ❌ **BUSINESS RISK:** No tests for authentication, AI core, or payment systems

**Our Approach:**
1. **Don't boil the ocean** - Focus on critical paths, not 100% coverage
2. **Business impact first** - Test what breaks the business if it fails
3. **Quick wins** - Start with baseline metrics and cleanup
4. **Sustainable pace** - 2-3 services per week is realistic

---

## 📋 Phase 1: Foundation (Week 1 - Oct 10-16)

### Day 1 (Today): Quick Wins & Baseline ⚡

**Task 1.1: Generate Coverage Report** (30 minutes)
```bash
npm test -- --coverage
```
**Why:** Need baseline metrics to track progress
**Output:** coverage/coverage-summary.json
**Success Metric:** Coverage report generated, see actual % numbers

**Task 1.2: Review Skipped Tests** (1 hour)
```bash
# Check what's skipped
grep -r "test.skip\|test.fixme" tests/
```
**Files to review:**
- `tests/authenticated-tests.spec.js`
- `tests/manual-testing-session.spec.js`

**Decision Matrix:**
- If test is obsolete → DELETE
- If test needs auth setup → FIX and re-enable
- If test is flaky → Add to flaky test tracker

**Task 1.3: Document Test Patterns** (1 hour)
Create `TESTING_PATTERNS.md` with:
- Mock data factories (how to create test users, families, events)
- Authentication helpers (how to mock Firebase auth)
- Common assertions (what to check in tests)
- Service test template (copy-paste starting point)

**End of Day 1 Deliverables:**
- ✅ Coverage report generated
- ✅ Skipped tests fixed or removed
- ✅ Test patterns documented

---

### Days 2-5: Critical Service Testing 🔐

**Focus:** Services that break the business if they fail

#### Task 2.1: OTPAuthService.js Tests (1.5 days)

**Why Critical:**
- Users can't log in if this breaks
- Revenue impact: No login = No users = No revenue
- Security: Authentication is the gateway

**Test Cases (25-30 tests):**

**Phone Verification (8 tests):**
1. ✅ sendVerificationCode() - Valid phone number
2. ✅ sendVerificationCode() - Invalid phone format
3. ✅ sendVerificationCode() - Rate limiting (too many requests)
4. ✅ sendVerificationCode() - Firebase Function error handling
5. ✅ verifyCode() - Valid code
6. ✅ verifyCode() - Invalid code
7. ✅ verifyCode() - Expired code
8. ✅ verifyCode() - Code already used

**Email Verification (8 tests):**
9. ✅ sendEmailCode() - Valid email
10. ✅ sendEmailCode() - Invalid email format
11. ✅ sendEmailCode() - Rate limiting
12. ✅ sendEmailCode() - SendGrid error
13. ✅ verifyEmailCode() - Valid code
14. ✅ verifyEmailCode() - Invalid code
15. ✅ verifyEmailCode() - Expired code (>10 min)
16. ✅ verifyEmailCode() - Case sensitivity

**User Creation (6 tests):**
17. ✅ createUserWithOTP() - New user
18. ✅ createUserWithOTP() - Existing user
19. ✅ createUserWithOTP() - Missing family data
20. ✅ createUserWithOTP() - Firebase auth error
21. ✅ createUserWithOTP() - Firestore write error
22. ✅ createUserWithOTP() - Rollback on failure

**Session Management (6 tests):**
23. ✅ getCurrentUser() - Valid session
24. ✅ getCurrentUser() - Expired session
25. ✅ getCurrentUser() - No session
26. ✅ signOut() - Clean logout
27. ✅ signOut() - Already signed out
28. ✅ refreshSession() - Token refresh

**Edge Cases (4 tests):**
29. ✅ Network offline during verification
30. ✅ Concurrent login attempts
31. ✅ Invalid Firebase config
32. ✅ Browser doesn't support localStorage

**File to create:** `src/services/__tests__/OTPAuthService.test.js`

---

#### Task 2.2: ClaudeService.js Tests (1.5 days)

**Why Critical:**
- Core AI functionality - Allie can't respond without this
- Revenue impact: Users pay for AI features
- Cost impact: API errors = wasted API calls

**Test Cases (25-30 tests):**

**Basic Communication (8 tests):**
1. ✅ sendMessage() - Valid message
2. ✅ sendMessage() - Empty message
3. ✅ sendMessage() - Very long message (>10k chars)
4. ✅ sendMessage() - Special characters/emojis
5. ✅ sendMessage() - API key missing
6. ✅ sendMessage() - Invalid API key
7. ✅ sendMessage() - Rate limit (429 error)
8. ✅ sendMessage() - Network timeout

**Response Processing (8 tests):**
9. ✅ cleanResponse() - Removes `<thinking>` tags
10. ✅ cleanResponse() - Removes `<store_family_data>` tags
11. ✅ cleanResponse() - Keeps valid HTML tags
12. ✅ cleanResponse() - Handles nested tags
13. ✅ parseActionableItems() - Calendar events
14. ✅ parseActionableItems() - Task creation
15. ✅ parseActionableItems() - Multiple actions
16. ✅ parseActionableItems() - No actions found

**Context Management (6 tests):**
17. ✅ buildContext() - Initial conversation
18. ✅ buildContext() - With conversation history
19. ✅ buildContext() - With family data
20. ✅ buildContext() - Context too large (truncation)
21. ✅ buildContext() - Missing family context
22. ✅ buildContext() - Invalid context format

**Error Recovery (6 tests):**
23. ✅ Retry logic on 500 error
24. ✅ Retry logic on timeout
25. ✅ Max retry limit reached
26. ✅ Exponential backoff timing
27. ✅ Circuit breaker activation
28. ✅ Fallback to cached response

**Edge Cases (4 tests):**
29. ✅ API switches models mid-conversation
30. ✅ Response streaming interrupted
31. ✅ Invalid JSON in response
32. ✅ API returns 200 but empty body

**File to create:** `src/services/__tests__/ClaudeService.test.js`

---

#### Task 2.3: DatabaseService.js Tests (1 day)

**Why Critical:**
- All data operations go through this
- Data integrity: Wrong data = angry users
- Recently fixed: 3 instances of `.filter is not a function` bug

**Test Cases (20 tests):**

**Family Member Operations (8 tests):**
1. ✅ getFamilyMembers() - Returns array when stored as object
2. ✅ getFamilyMembers() - Returns array when stored as array
3. ✅ getFamilyMembers() - Empty family
4. ✅ updateMemberSurveyCompletion() - Valid member
5. ✅ updateMemberSurveyCompletion() - Member not found
6. ✅ updateMemberSurveyProgress() - Valid progress
7. ✅ updateMemberProfilePicture() - Valid URL
8. ✅ updateMemberProfilePicture() - Invalid URL

**Survey Operations (6 tests):**
9. ✅ getSurveyResponses() - Valid family
10. ✅ getSurveyResponses() - No responses
11. ✅ saveSurveyResponse() - New response
12. ✅ saveSurveyResponse() - Update existing
13. ✅ getSurveyProgress() - Calculate percentage
14. ✅ getSurveyProgress() - No questions answered

**Data Type Safety (6 tests):**
15. ✅ Handle familyMembers as object (keyed by userId)
16. ✅ Handle familyMembers as array
17. ✅ Handle familyMembers as null/undefined
18. ✅ Handle familyMembers as empty object {}
19. ✅ Handle familyMembers as empty array []
20. ✅ Reject invalid data types (string, number)

**File to create:** `src/services/__tests__/DatabaseService.test.js`

---

## 📋 Phase 2: Extended Coverage (Week 2 - Oct 17-24)

### Day 6-8: Additional Critical Services

**Task 3.1: GoogleAuthService.js Tests** (1 day)
- OAuth flow (authorization, token exchange)
- Token refresh logic
- Error handling (denied access, invalid tokens)
- **20 test cases**

**Task 3.2: EventParserService.js Tests** (1 day)
- Natural language date parsing
- Event extraction from text
- Recurring event logic
- **20 test cases**

**Task 3.3: PaymentScreen.jsx Tests** (1 day)
- Stripe integration
- Payment form validation
- Success/error flows
- **15 test cases**

### Day 9-10: September Regression Tests

**Task 4.1: Add September 2025 Bug Tests** (1 day)
Create `tests/regression/september-2025-critical-bugs.spec.js`:
- SMS Verification Production Deployment (Sept 13)
- Web Search Fixes (Sept 12)
- GEDCOM Import (Sept 11)
- Thread Message Fixes (Sept 10)
- Slack-Style Thread Panel (Sept 9)
- Messaging & Event Fixes (Sept 7)
- **6 comprehensive tests**

---

## 📊 Success Metrics

### End of Week 1 (Oct 16)
| Metric | Target | How to Measure |
|--------|--------|----------------|
| Coverage Report | Generated | `coverage/coverage-summary.json` exists |
| Skipped Tests | 0 | No `test.skip()` in codebase |
| OTPAuthService Coverage | >80% | `npm test -- OTPAuthService --coverage` |
| ClaudeService Coverage | >80% | `npm test -- ClaudeService --coverage` |
| DatabaseService Coverage | >70% | `npm test -- DatabaseService --coverage` |

### End of Week 2 (Oct 24)
| Metric | Target | How to Measure |
|--------|--------|----------------|
| Critical Services Tested | 6/6 | All tests passing |
| Services Coverage | >15% | Up from 5% |
| Regression Tests | 14 bugs | 8 Oct + 6 Sept |
| CI/CD Integration | Working | Tests run on every commit |

---

## 🚀 How to Execute This Plan

### Step 1: Set Up Test Environment

```bash
# Ensure Jest is configured
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Ensure Firebase test utilities
npm install --save-dev @firebase/testing

# Create test directory structure
mkdir -p src/services/__tests__
mkdir -p src/components/__tests__
```

### Step 2: Create Test Utilities

**File: `src/test-utils/testHelpers.js`**
```javascript
// Mock Firebase
export const mockFirebase = () => {
  // Mock implementation
};

// Mock user factory
export const createMockUser = (overrides = {}) => ({
  uid: 'test-uid-123',
  email: 'test@example.com',
  displayName: 'Test User',
  ...overrides
});

// Mock family factory
export const createMockFamily = (overrides = {}) => ({
  id: 'test-family-123',
  name: 'Test Family',
  familyMembers: [
    { id: 'user1', name: 'Parent 1', role: 'parent' },
    { id: 'user2', name: 'Parent 2', role: 'parent' }
  ],
  ...overrides
});
```

### Step 3: Write Tests Using TDD

**For each service:**
1. Write test cases first (red)
2. Run tests - they should fail
3. Implement minimal code to pass (green)
4. Refactor if needed
5. Commit with message: `test: add unit tests for [ServiceName]`

### Step 4: Track Progress Daily

**Update todo list:**
```bash
# Mark task as in_progress when starting
# Mark task as completed when all tests pass
# Update WEEKLY_TEST_AUDIT with new coverage %
```

---

## 🎯 Risk Mitigation

### What Could Go Wrong?

**Risk 1: Tests break existing functionality**
- **Mitigation:** Run full E2E suite before committing
- **Command:** `npm run test:regression`

**Risk 2: Mocking Firebase is hard**
- **Mitigation:** Use `@firebase/testing` library
- **Reference:** Firebase docs on testing

**Risk 3: Takes longer than 2 weeks**
- **Mitigation:** Focus on OTPAuthService first (highest impact)
- **Fallback:** Extend timeline, but ship what's done

**Risk 4: Tests are flaky**
- **Mitigation:** Avoid time-based tests, use deterministic mocks
- **Pattern:** No `setTimeout()`, use async/await properly

---

## 📚 Resources for Implementation

### Jest Configuration
**File: `jest.config.js`** (if not exists)
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test-utils/setupTests.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/test-utils/**'
  ],
  coverageThresholds: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  }
};
```

### Testing Patterns
**Reference:** `TESTING_PATTERNS.md` (to be created Day 1)

### Playwright for E2E
**Keep existing setup:** Tests in `tests/` directory work great!

---

## 🏁 Definition of Done

### For Each Service Test File:
- [ ] 20-30 test cases written
- [ ] All tests passing (`npm test -- ServiceName`)
- [ ] Coverage >70% for that service
- [ ] No skipped tests (`test.skip`)
- [ ] Tests run in <10 seconds
- [ ] Committed to main branch
- [ ] Updated `WEEKLY_TEST_AUDIT_2025-10-10.md` with new metrics

### For Overall Plan:
- [ ] All Phase 1 tasks completed
- [ ] Services coverage >15% (up from 5%)
- [ ] Zero skipped tests in codebase
- [ ] Coverage report generated
- [ ] Test patterns documented
- [ ] CI/CD running tests on every commit

---

## 🔄 Daily Stand-Up Questions

**Every day at 9am, ask:**
1. What tests did I complete yesterday?
2. What tests am I working on today?
3. Any blockers? (Firebase mocking issues, flaky tests, etc.)
4. Coverage % change since yesterday?

**Track in:** `TEST_DAILY_LOG.md` (optional)

---

## 📞 Need Help?

**If stuck on:**
- **Firebase mocking:** Check `@firebase/testing` docs
- **Async test issues:** Use `async/await` consistently
- **Flaky tests:** Remove time dependencies, use deterministic data
- **Coverage not increasing:** Check `collectCoverageFrom` in jest.config.js

**Resources:**
- Jest Docs: https://jestjs.io/docs/getting-started
- React Testing Library: https://testing-library.com/react
- Firebase Testing: https://firebase.google.com/docs/rules/unit-tests

---

**Created:** October 10, 2025
**Owner:** Development Team
**Next Review:** October 17, 2025 (after Week 1)

_This is a living document - update as priorities shift!_
