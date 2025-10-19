# 🎯 COMPREHENSIVE TEST COVERAGE PLAN
## Complete User Lifecycle - From Landing Page to Balanced Family

**Created:** October 18, 2025
**Based on:** Landing page at https://checkallie.com + Current codebase analysis
**Goal:** 100% coverage of every user journey and feature

---

## 📋 EXECUTIVE SUMMARY

### Current Coverage: ~20%
### Target Coverage: 95%+
### Gap: 75 percentage points

**Critical Findings:**
- ✅ **Authentication & Onboarding**: 85% covered (GOOD)
- ❌ **Core Family Lifecycle**: 15% covered (CRITICAL GAP)
- ❌ **AI Features**: 10% covered (CRITICAL GAP)
- ❌ **Children's Systems**: 0% covered (CRITICAL GAP)

---

## 🌊 THE COMPLETE USER JOURNEY (From Landing Page)

### Phase 1: Discovery & Signup
### Phase 2: Family Assessment
### Phase 3: AI Command Center Setup
### Phase 4: Family Memory Building
### Phase 5: Weekly Balance Progress
### Phase 6: Sustainable Family Harmony

---

## 📊 DETAILED FEATURE BREAKDOWN & TEST PLAN

---

## 🎪 **PHASE 1: DISCOVERY & SIGNUP**

### 1.1 Landing Page Experience
**Features from Landing Page:**
- Hero section with value proposition
- Interactive demo (5 steps)
- Journey roadmap (5 stages)
- Problem/solution display
- CTA buttons (Start Free Trial, Watch Demo)

**Test Coverage Needed:**

#### **E2E Tests (NEW - 0% coverage):**
```javascript
// tests/e2e/01-landing-page.spec.js

test('Landing page loads and displays all sections', async ({ page }) => {
  // 1. Navigate to checkallie.com
  // 2. Verify hero section loads
  // 3. Verify all 5 demo steps are present
  // 4. Verify roadmap steps 1-5 visible
  // 5. Verify CTA buttons functional
  // 6. Verify no console errors
});

test('Interactive demo carousel works', async ({ page }) => {
  // 1. Click through all 5 demo steps
  // 2. Verify each step displays correct content:
  //    - Step 1: The Complete Family Assistant
  //    - Step 2: Allie Chat
  //    - Step 3: Family Command Center
  //    - Step 4: Your Family Memory
  //    - Step 5: Data-Driven Approach
  // 3. Test navigation arrows
  // 4. Test step dots/indicators
});

test('CTA buttons navigate correctly', async ({ page }) => {
  // 1. Click "Start Free Trial" → Should go to /onboarding
  // 2. Click "Watch Demo" → Should go to /demo
  // 3. Click "Try Mini Assessment" → Should go to /mini-survey
  // 4. Click "View pitch deck" → Should go to /investor/access
});
```

**Current Status:** ✅ IMPLEMENTED
**Test File:** `tests/e2e/complete-journey/01-discovery-signup.spec.js`
**Coverage:** 7 tests (landing, quiz, signup transition)

---

## 🔐 **PHASE 2: FAMILY ASSESSMENT & ONBOARDING**

### 2.1 Account Creation (Multiple Auth Methods)
**Features from Landing Page:**
- "Full Family Assessment" - comprehensive survey
- Captures workload distribution, child development needs, communication patterns

**Test Coverage Needed:**

#### **E2E Tests - Password Auth (COMPLETE ✅):**
- ✅ Password creation (8+ chars, uppercase, number)
- ✅ Password strength indicator
- ✅ Confirmation matching
- **Coverage:** 53 unit tests + 3 E2E tests (90%)

#### **E2E Tests - Google Auth (PARTIAL ⚠️):**
```javascript
// tests/e2e/02-onboarding-google.spec.js (NEW)

test('Google Auth popup flow - complete journey', async ({ page }) => {
  // 1. Navigate to /onboarding
  // 2. Reach Step 10 (Password Creation)
  // 3. Click "Use Google Sign-In instead"
  // 4. Verify popup opens (not redirect)
  // 5. Select Google account
  // 6. Verify no blank page
  // 7. Verify success confirmation shows user email
  // 8. Continue to next step
  // 9. Verify family creation succeeds
  // 10. Verify no "undefined" field errors in console
});

test('Google Auth enables calendar integration', async ({ page }) => {
  // 1. Complete Google Auth onboarding
  // 2. Navigate to Calendar tab
  // 3. Verify Google Calendar sync available
  // 4. Verify OAuth tokens stored correctly
  // 5. Verify auto-refresh works (5 min before expiry)
});
```

**Current Status:** ⚠️ PARTIAL (40% coverage)
**Missing:** Popup flow E2E, calendar integration validation, token refresh

---

### 2.2 Family Assessment Survey (CRITICAL GAP ❌)
**Features from Landing Page:**
- "Comprehensive survey captures your current workload distribution"
- "Child development needs"
- "Communication patterns"

**Test Coverage Needed:**

#### **E2E Tests - Initial 72-Question Survey (NEW - 0% coverage):**
```javascript
// tests/e2e/03-initial-survey.spec.js (NEW - CRITICAL)

test('Parent 1 completes initial family assessment', async ({ page }) => {
  // 1. Login as Parent 1
  // 2. Navigate to survey
  // 3. Answer all 72 questions:
  //    - Workload distribution (20 questions)
  //    - Invisible mental load (15 questions)
  //    - Child development tracking (12 questions)
  //    - Communication patterns (10 questions)
  //    - Household domains (15 questions)
  // 4. Verify progress saved after each page
  // 5. Submit survey
  // 6. Verify data saved to Firestore
  // 7. Verify survey completion flag set
});

test('Multi-parent survey coordination', async ({ page }) => {
  // 1. Parent 1 completes first half (36 questions)
  // 2. Parent 2 logs in, sees progress
  // 3. Parent 2 completes second half (36 questions)
  // 4. Verify combined responses in Firestore
  // 5. Verify family profile updated
  // 6. Verify balance metrics calculated
});

test('Survey data persistence and recovery', async ({ page }) => {
  // 1. Start survey
  // 2. Answer 20 questions
  // 3. Close browser
  // 4. Reopen and login
  // 5. Verify progress restored
  // 6. Continue from question 21
});

test('Balance metrics calculation from survey', async ({ page }) => {
  // CRITICAL TEST - This is the foundation of Allie's value proposition
  // 1. Complete survey with known imbalance:
  //    - Parent 1: 70% visible household tasks
  //    - Parent 1: 85% invisible mental load
  //    - Parent 2: 30% visible household tasks
  //    - Parent 2: 15% invisible mental load
  // 2. Verify balance analytics calculated:
  //    - Overall imbalance score
  //    - Domain-specific imbalances
  //    - Workload distribution charts
  // 3. Verify data matches landing page promise:
  //    "TaskWeight = BaseTime × Frequency × Invisibility × EmotionalLabor × Priority"
});
```

**Current Status:** ❌ **0% COVERAGE - CRITICAL GAP**
**Priority:** 🔴 **HIGHEST** (This is the foundation of the entire platform!)
**Impact:** Without this, balance analytics don't work, AI has no context

---

### 2.3 Child Development Survey (CRITICAL GAP ❌)
**Features from Landing Page:**
- "Child development needs"
- "Age-appropriate surveys"
- "Child Development Tracking: Monitoring growth, health, education, and milestones"

**Test Coverage Needed:**

#### **E2E Tests - Children's Surveys (NEW - 0% coverage):**
```javascript
// tests/e2e/04-child-surveys.spec.js (NEW - CRITICAL)

test('Age-appropriate survey for child (8 years old)', async ({ page }) => {
  // 1. Parent assigns survey to child
  // 2. Child logs in with kid-friendly UI
  // 3. Complete age-appropriate questions (simpler language)
  // 4. Verify child's responses saved
  // 5. Verify linked to child profile
});

test('Child development milestone tracking', async ({ page }) => {
  // 1. Record milestones (walked, talked, potty trained)
  // 2. Track growth (height, weight)
  // 3. Record health info (doctor visits, vaccines)
  // 4. Track education (grades, subjects)
  // 5. Verify all data appears in Child Development dashboard
});
```

**Current Status:** ❌ **0% COVERAGE**
**Priority:** 🔴 **HIGH**

---

## 🎛️ **PHASE 3: AI-POWERED COMMAND CENTER**

### 3.1 Family Command Center
**Features from Landing Page:**
- "Centralized hub for scheduling, documents, and family management"
- Calendar Command, Document Command, Child Development, Relationship Command
- Wardrobe Concierge, Family Resources
- "Seamless Integration: All systems work together"

**Test Coverage Needed:**

#### **E2E Tests - Calendar System (PARTIAL ⚠️):**
```javascript
// tests/e2e/05-calendar-integration.spec.js (EXPAND)

test('Extract events from screenshots', async ({ page }) => {
  // Landing page promise: "Extract events from screenshots, emails, or conversation"
  // 1. Upload screenshot of birthday invitation
  // 2. Allie extracts: event name, date, time, location
  // 3. Verify event added to calendar
  // 4. Verify reminder options offered
});

test('Extract events from email', async ({ page }) => {
  // 1. Send email to family inbox with event details
  // 2. Verify Allie parses email
  // 3. Verify event extracted and saved
  // 4. Verify linked to Document Hub
});

test('Extract events from chat conversation', async ({ page }) => {
  // 1. Chat: "Tyler's birthday party is Saturday, April 19 at 2pm at Adventure Zone"
  // 2. Verify Allie extracts event details
  // 3. Verify asks for confirmation
  // 4. Verify event added to calendar
});

test('Google Calendar bidirectional sync', async ({ page }) => {
  // 1. Add event in Allie → Verify appears in Google Calendar
  // 2. Add event in Google Calendar → Verify appears in Allie
  // 3. Edit event in Allie → Verify syncs to Google
  // 4. Delete event in Google → Verify removed from Allie
  // 5. Test conflict resolution
  // 6. Test recurring events
});

test('Family schedule coordination', async ({ page }) => {
  // Landing page: "See everyone's schedule in one view"
  // 1. Add events for each family member
  // 2. View family timeline (weekly view)
  // 3. Verify color coding by person
  // 4. Test conflict detection
  // 5. Verify shared events vs individual events
});
```

**Current Status:** ⚠️ 50% coverage (CRUD works, sync missing)
**Priority:** 🟡 **MEDIUM-HIGH**

---

#### **E2E Tests - Document Hub (CRITICAL GAP ❌):**
```javascript
// tests/e2e/06-document-hub.spec.js (NEW - CRITICAL)

test('Document capture via photo', async ({ page }) => {
  // Landing page: "Capture documents via photo, upload, or text"
  // 1. Click "Capture Document" button
  // 2. Upload photo of doctor's notes
  // 3. Verify OCR extracts text
  // 4. Verify auto-categorized (health → Jack)
  // 5. Verify searchable
});

test('Document upload and organization', async ({ page }) => {
  // 1. Upload PDF from daycare
  // 2. Verify auto-categorized
  // 3. Verify metadata extracted (date, sender, subject)
  // 4. Verify linked to relevant child
  // 5. Verify appears in Document Hub
});

test('Email integration - family inbox', async ({ page }) => {
  // Landing page: Family email @families.checkallie.com
  // 1. Send email to family@families.checkallie.com
  // 2. Verify email appears in Document Hub
  // 3. Verify attachments extracted
  // 4. Verify email parsed for events/tasks
  // 5. Verify linked to relevant family members
});

test('Document search and retrieval', async ({ page }) => {
  // Landing page: "Smart search finds anything instantly"
  // 1. Upload 20 documents (various types)
  // 2. Search: "Jack dentist"
  // 3. Verify finds all Jack's dentist documents
  // 4. Search: "March 2025"
  // 5. Verify finds all documents from March
});

test('Allie Chat document queries', async ({ page }) => {
  // Landing page example: "When was Jack's last dentist appointment and what did they recommend?"
  // 1. Upload dentist notes: "Jack - March 14, 2025 - Dr. Chen - increase flossing to daily"
  // 2. Ask Allie: "When was Jack's last dentist appointment?"
  // 3. Verify Allie responds: "March 14, 2025 with Dr. Chen"
  // 4. Ask: "What did they recommend?"
  // 5. Verify: "Increase flossing to daily instead of 3x/week"
});
```

**Current Status:** ❌ **0% COVERAGE - CRITICAL GAP**
**Priority:** 🔴 **CRITICAL** (Email integration is a core feature!)

---

#### **E2E Tests - Child Development Tracking (CRITICAL GAP ❌):**
```javascript
// tests/e2e/07-child-development.spec.js (NEW - CRITICAL)

test('Growth tracking - height and weight', async ({ page }) => {
  // Landing page: "Monitoring growth, health, education, and milestones"
  // 1. Add child's height measurement
  // 2. Add child's weight measurement
  // 3. Verify data saved to child profile
  // 4. View growth chart
  // 5. Verify trend line displayed
});

test('Health tracking - doctor visits', async ({ page }) => {
  // 1. Record doctor visit (date, provider, notes)
  // 2. Upload doctor's recommendations (photo/PDF)
  // 3. Record vaccines
  // 4. Set follow-up reminders
  // 5. Verify all linked to child's health timeline
});

test('Education tracking - grades and subjects', async ({ page }) => {
  // 1. Record grades for each subject
  // 2. Track teacher names
  // 3. Upload report cards
  // 4. Record parent-teacher meeting notes
  // 5. View education dashboard
});

test('Milestone tracking', async ({ page }) => {
  // 1. Record milestone: "First word - Mama - Jan 15, 2024"
  // 2. Record milestone: "First steps - March 2, 2024"
  // 3. View milestone timeline
  // 4. Verify shareable with family
});

test('Voice-enabled quick updates', async ({ page }) => {
  // Landing page: "Voice-enabled quick updates"
  // 1. Click voice button
  // 2. Say: "Jack grew to 48 inches tall"
  // 3. Verify Allie confirms: "I've recorded Jack's height as 48 inches"
  // 4. Verify saved to growth tracker
});
```

**Current Status:** ❌ **0% COVERAGE**
**Priority:** 🔴 **HIGH**

---

#### **E2E Tests - Relationship Command (NEW ❌):**
```javascript
// tests/e2e/08-relationship-analytics.spec.js (NEW)

test('Balance analytics dashboard', async ({ page }) => {
  // Landing page: "Balance analytics, guided family meetings, and research-backed strategies"
  // 1. Navigate to Relationship Command
  // 2. View workload balance charts:
  //    - Visible Household (Mama: 55%, Papa: 45%)
  //    - Invisible Household (Mama: 78%, Papa: 22%)
  // 3. Verify weekly progress chart shows improvement
  // 4. Verify domain breakdown (cooking, cleaning, childcare, etc.)
});

test('Guided family meeting', async ({ page }) => {
  // Landing page: "Guided family meetings"
  // 1. Start family meeting session
  // 2. Review balance data together
  // 3. Set weekly goals for improvement
  // 4. Assign domain rotation tasks
  // 5. Save meeting notes
  // 6. Schedule next check-in
});

test('Research-backed strategies', async ({ page }) => {
  // 1. View suggested strategies for imbalance
  // 2. Verify linked to research papers
  // 3. Apply strategy to family
  // 4. Track effectiveness over time
});
```

**Current Status:** ❌ **0% COVERAGE**
**Priority:** 🟡 **MEDIUM**

---

### 3.2 Wardrobe Concierge (NEW ❌)
**Features from Landing Page:**
- "AI-powered assistance for managing children's clothing needs"
- "Growth tracking and smart shopping"

**Test Coverage Needed:**

#### **E2E Tests - Wardrobe System (NEW - 0% coverage):**
```javascript
// tests/e2e/09-wardrobe-concierge.spec.js (NEW)

test('Add clothing items to wardrobe', async ({ page }) => {
  // 1. Navigate to Wardrobe Wizard
  // 2. Add item: "Blue jeans - size 8 - Gap Kids"
  // 3. Upload photo of item
  // 4. Tag: season (summer/winter), category (pants)
  // 5. Verify saved to child's wardrobe
});

test('Growth tracking triggers size updates', async ({ page }) => {
  // 1. Child grows from 48" to 50"
  // 2. Verify Allie suggests: "Jack may need new size 10 jeans"
  // 3. View shopping recommendations
  // 4. Mark items as outgrown
});

test('Smart shopping suggestions', async ({ page }) => {
  // 1. Allie detects: missing winter coat for Jack
  // 2. Suggests: "Jack needs a size 10 winter coat"
  // 3. Provides shopping links
  // 4. Track purchase
  // 5. Add to wardrobe
});
```

**Current Status:** ❌ **0% COVERAGE**
**Priority:** 🟢 **LOW** (Nice-to-have feature)

---

### 3.3 Family Resources (NEW ❌)
**Features from Landing Page:**
- "Smart inventory management for household essentials, childcare items, and clothing"

**Test Coverage Needed:**

#### **E2E Tests - Inventory Management (NEW - 0% coverage):**
```javascript
// tests/e2e/10-family-resources.spec.js (NEW)

test('Household essentials inventory', async ({ page }) => {
  // 1. Add items: "Diapers - Size 4 - Pampers"
  // 2. Set quantity: 20
  // 3. Set reorder threshold: 5
  // 4. Track usage
  // 5. Verify low-stock alert when < 5
});

test('Shopping list generation', async ({ page }) => {
  // 1. Allie detects low inventory items
  // 2. Generates shopping list
  // 3. Add manual items via chat: "Add milk to shopping list"
  // 4. View consolidated list
  // 5. Mark items as purchased
});
```

**Current Status:** ❌ **0% COVERAGE**
**Priority:** 🟢 **LOW**

---

## 🧠 **PHASE 4: FAMILY MEMORY BUILDING**

### 4.1 Memory Capture & Retrieval
**Features from Landing Page:**
- "Your family's institutional memory, remembering everything so you don't have to"
- "Multiple ways to add information: Voice, Photos, Documents, Chat"
- "Long-term memory" - recalls details from months/years ago

**Test Coverage Needed:**

#### **E2E Tests - Memory System (NEW - CRITICAL ❌):**
```javascript
// tests/e2e/11-family-memory.spec.js (NEW - CRITICAL)

test('Memory capture via voice', async ({ page }) => {
  // Landing page example: "Voice memo about school event? Saved."
  // 1. Click voice button
  // 2. Say: "Emma's vocabulary words are: Perseverance, Dedication, Integrity, Compassion, Collaboration"
  // 3. Verify Allie confirms capture
  // 4. Verify saved to Emma's education records
  // 5. Verify tagged with date and teacher
});

test('Memory capture via photo', async ({ page }) => {
  // Landing page example: "Photo of doctor's notes? Captured."
  // 1. Upload photo of handwritten notes
  // 2. Verify OCR extracts text
  // 3. Verify auto-categorized
  // 4. Verify linked to relevant child/event
});

test('Memory capture via chat', async ({ page }) => {
  // Landing page example: Save birthday party invitation
  // 1. Upload photo with chat message: "Save this birthday party invitation"
  // 2. Verify Allie extracts: Tyler's friend Max, April 19, 2pm, Adventure Zone
  // 3. Verify asks: "Would you like me to set a reminder to buy a present?"
  // 4. Confirm reminder
  // 5. Verify event + reminder + document all linked
});

test('Long-term memory recall', async ({ page }) => {
  // Landing page example: "What were the 5 vocabulary words from Emma's teacher last spring?"
  // SETUP:
  // 1. March 15, 2024: Save "Emma's vocab words from Ms. Thompson: Perseverance, Dedication, Integrity, Compassion, Collaboration"

  // TEST (1 year later - March 2025):
  // 2. Ask Allie: "What were the 5 vocabulary words from Emma's teacher last spring?"
  // 3. Verify Allie responds with exact words + context:
  //    "From Ms. Thompson (March 15 last year): Perseverance, Dedication, Integrity, Compassion, Collaboration"
  // 4. Verify memory retrieval works across time
});

test('Contextual memory linking', async ({ page }) => {
  // Landing page: "Allie remembers everything - doctor's advice, school details, measurements"
  // 1. Save doctor's visit: "Dr. Chen - March 14 - Jack - increase flossing"
  // 2. Save school note: "Jack needs new backpack - teacher Mrs. Smith"
  // 3. Save measurement: "Jack 48 inches tall"
  // 4. Ask: "Tell me everything about Jack from March"
  // 5. Verify Allie returns ALL linked memories with context
});
```

**Current Status:** ❌ **0% COVERAGE**
**Priority:** 🔴 **CRITICAL** (Memory is a core differentiator!)

---

## 📈 **PHASE 5: WEEKLY BALANCE PROGRESS**

### 5.1 Guided Check-ins
**Features from Landing Page:**
- "Guided check-ins, personalized tasks, and family meetings create sustainable improvement"
- "Weekly progress tracking showing imbalance reduction over time"
- "Personalized weekly goals for balance"

**Test Coverage Needed:**

#### **E2E Tests - Weekly Check-ins (NEW - CRITICAL ❌):**
```javascript
// tests/e2e/12-weekly-checkins.spec.js (NEW - CRITICAL)

test('Weekly balance check-in survey', async ({ page }) => {
  // 1. Week 1: Initial survey shows 68% mama, 32% papa
  // 2. Complete week of tasks
  // 3. Week 2 check-in: Answer balance questions
  // 4. Verify progress: 65% mama, 35% papa (improvement!)
  // 5. View progress chart
  // 6. Verify chart shows improvement trend
});

test('Personalized weekly goals', async ({ page }) => {
  // Landing page: "Personalized weekly goals for balance"
  // 1. Allie analyzes current imbalance
  // 2. Suggests goals:
  //    - Papa: Take over Tuesday dinner prep
  //    - Papa: Handle Friday school pickup
  //    - Mama: Delegate laundry folding
  // 3. Accept goals
  // 4. Track completion during week
  // 5. Review at next check-in
});

test('Family meeting facilitation', async ({ page }) => {
  // Landing page: "Family meetings that actually work"
  // 1. Start weekly family meeting
  // 2. Review balance data together
  // 3. Discuss wins and challenges
  // 4. Set goals for next week
  // 5. Rotate domains (cooking, cleaning, childcare)
  // 6. Save meeting notes
  // 7. Schedule next meeting
});

test('Progress visualization - 8 week journey', async ({ page }) => {
  // Landing page chart shows improvement from Week 1 (68/32) to Week 8 (53/47)
  // 1. Complete 8 weekly check-ins
  // 2. View progress chart
  // 3. Verify improvement trend:
  //    Week 1: 68% mama, 32% papa
  //    Week 2: 65% mama, 35% papa
  //    Week 4: 58% mama, 42% papa
  //    Week 6: 55% mama, 45% papa
  //    Week 8: 53% mama, 47% papa
  // 4. Verify approaching 50/50 balance
});

test('Sustainable habits formation', async ({ page }) => {
  // Landing page: "Sustainable habits, not quick fixes"
  // 1. Set habit: "Papa cooks Tuesday dinners"
  // 2. Track completion for 8 weeks
  // 3. Verify habit streak maintained
  // 4. Verify balance improvement sustained
  // 5. Add new habit building on success
});
```

**Current Status:** ❌ **0% COVERAGE**
**Priority:** 🔴 **CRITICAL** (This is the transformation promise!)

---

## 🎉 **PHASE 6: SUSTAINABLE FAMILY HARMONY**

### 6.1 Results Validation
**Features from Landing Page:**
- "87% of parents report less mental clutter and anxiety"
- "4.8 hrs average weekly time saved"
- "92% reduction in conflicts related to household responsibilities"

**Test Coverage Needed:**

#### **E2E Tests - Success Metrics (NEW - ❌):**
```javascript
// tests/e2e/13-success-metrics.spec.js (NEW)

test('Mental load reduction tracking', async ({ page }) => {
  // Landing page: "87% reduced mental load"
  // 1. Initial survey: Mental load score = 8.5/10
  // 2. Use Allie for 8 weeks
  // 3. Track mental load scores weekly
  // 4. Final survey: Mental load score = 3.2/10
  // 5. Verify 87% reduction achieved
});

test('Time savings calculation', async ({ page }) => {
  // Landing page: "4.8 hrs average weekly time saved"
  // 1. Track time spent on:
  //    - Searching for information
  //    - Planning and organizing
  //    - Communication overhead
  // 2. Use Allie's memory, planning, coordination
  // 3. Measure time savings
  // 4. Verify 4.8+ hours saved per week
});

test('Conflict reduction tracking', async ({ page }) => {
  // Landing page: "92% reduction in conflicts"
  // 1. Initial survey: Log conflicts per week
  // 2. Use Allie's balance system for 8 weeks
  // 3. Track conflict frequency
  // 4. Verify 92% reduction
});

test('Overall family satisfaction', async ({ page }) => {
  // 1. Initial satisfaction score: 5.2/10
  // 2. Use Allie for 8 weeks
  // 3. Weekly satisfaction surveys
  // 4. Final satisfaction score: 8.8/10
  // 5. Verify sustained improvement
});
```

**Current Status:** ❌ **0% COVERAGE**
**Priority:** 🟡 **MEDIUM** (Marketing validation)

---

## 🧒 **CHILDREN'S SYSTEMS (CRITICAL GAP)**

### 7.1 SANTA System (Chores & Rewards)
**From Codebase + Landing Page Integration:**

**Test Coverage Needed:**

#### **E2E Tests - Complete Chore & Reward Lifecycle (NEW - CRITICAL ❌):**
```javascript
// tests/e2e/14-chore-reward-lifecycle.spec.js (NEW - CRITICAL!)

test('Import default chores', async ({ page }) => {
  // REGRESSION TEST for BucksService bug fixed Oct 18, 2025
  // 1. Create new family with 2 children
  // 2. Navigate to Kids Section Admin
  // 3. Click "Import Default Chores"
  // 4. Verify no infinite console error loop
  // 5. Verify chores appear in list
  // 6. Navigate to "Palsson Bucks Accounts" tab
  // 7. Verify balances show $0 (not undefined)
  // 8. Verify NO console errors
});

test('Create custom chore template', async ({ page }) => {
  // 1. Navigate to Chore Admin
  // 2. Click "Create Chore"
  // 3. Fill: Title "Clean bedroom", Value 5 bucks, Frequency "Daily"
  // 4. Add requirements: "Make bed, pick up toys, organize desk"
  // 5. Upload example photo
  // 6. Save template
  // 7. Verify appears in template list
});

test('Assign chore to child', async ({ page }) => {
  // 1. Select chore: "Clean bedroom"
  // 2. Assign to: Jack
  // 3. Set schedule: Monday, Wednesday, Friday
  // 4. Verify appears in Jack's Chore Chart
});

test('Child completes chore with photo proof', async ({ page }) => {
  // 1. Login as Jack (child account)
  // 2. Navigate to Chore Chart
  // 3. Select chore: "Clean bedroom"
  // 4. Upload photo of clean room
  // 5. Mark as "Request Approval"
  // 6. Verify status changes to "Pending"
});

test('Parent approves chore and awards bucks', async ({ page }) => {
  // 1. Login as Parent
  // 2. Navigate to Kids Section Admin
  // 3. View pending approvals
  // 4. See Jack's "Clean bedroom" with photo
  // 5. Click "Approve"
  // 6. Verify Jack awarded 5 Palsson Bucks
  // 7. Verify balance updated: $0 → $5
  // 8. Verify no BucksService errors
});

test('Child purchases reward', async ({ page }) => {
  // 1. Login as Jack
  // 2. Navigate to Reward Party
  // 3. View available rewards: "30 min extra screen time - 5 bucks"
  // 4. Click "Purchase"
  // 5. Verify balance deducted: $5 → $0
  // 6. Verify reward status: "Pending Parent Approval"
});

test('Parent approves reward redemption', async ({ page }) => {
  // 1. Login as Parent
  // 2. View pending reward requests
  // 3. See Jack's "30 min extra screen time"
  // 4. Click "Approve"
  // 5. Verify reward marked as "Granted"
  // 6. Verify Jack can see active reward
});

test('Complete chore-to-reward lifecycle', async ({ page }) => {
  // FULL END-TO-END TEST
  // 1. Import chores → verify balances $0
  // 2. Assign chore to Jack
  // 3. Jack completes chore
  // 4. Parent approves → Jack earns 5 bucks
  // 5. Jack purchases reward (5 bucks)
  // 6. Parent approves reward
  // 7. Verify entire flow works without errors
  // 8. Verify transaction history accurate
});
```

**Current Status:** ❌ **0% COVERAGE - CRITICAL GAP!**
**Priority:** 🔴 **CRITICAL** (Just fixed major bug, no regression tests!)
**Risk:** Bug could regress without tests

---

### 7.2 Gift Wishes System
**Test Coverage Needed:**

#### **E2E Tests - Gift Wishes (NEW - 0% coverage):**
```javascript
// tests/e2e/15-gift-wishes.spec.js (NEW)

test('Child adds gift wish', async ({ page }) => {
  // 1. Login as child
  // 2. Navigate to Gift Wishes
  // 3. Add wish: "LEGO Star Wars set"
  // 4. Upload photo
  // 5. Add price: $49.99
  // 6. Verify saved
});

test('Parents view and manage gift wishes', async ({ page }) => {
  // 1. Login as parent
  // 2. View all children's wishes
  // 3. Mark wish as "Purchased"
  // 4. Add notes: "For birthday"
  // 5. Verify child cannot see purchase status
});
```

**Current Status:** ❌ **0% COVERAGE**
**Priority:** 🟢 **LOW**

---

### 7.3 Habit Helper System
**Test Coverage Needed:**

#### **E2E Tests - Habit Helper (NEW - 0% coverage):**
```javascript
// tests/e2e/16-habit-helper.spec.js (NEW)

test('Create habit for child', async ({ page }) => {
  // 1. Create habit: "Brush teeth" - Morning & Night
  // 2. Assign to child
  // 3. Set reminders
  // 4. Track completion
  // 5. View habit streak
});

test('Habit streak rewards', async ({ page }) => {
  // 1. Complete habit 7 days in a row
  // 2. Verify bonus bucks awarded
  // 3. View achievement badge
});
```

**Current Status:** ❌ **0% COVERAGE**
**Priority:** 🟡 **MEDIUM**

---

## 🤖 **ALLIE AI ASSISTANT (CORE FEATURE)**

### 8.1 Allie Chat Functionality
**Features from Landing Page:**
- "An intelligent AI assistant that understands your family's unique context"
- "Natural conversation interface"
- "Proactive suggestions & reminders"
- "Learns your family's unique needs"

**Test Coverage Needed:**

#### **E2E Tests - Allie Chat Intelligence (EXPAND):**
```javascript
// tests/e2e/17-allie-chat-intelligence.spec.js (EXPAND)

test('Context retention across conversation', async ({ page }) => {
  // Landing page example conversation:
  // 1. User: "When was Jack's last dentist appointment and what did they recommend?"
  // 2. Allie: "Jack's last dentist appointment was on March 14, 2025 with Dr. Chen..."
  // 3. User: "When should I schedule the next one?"
  // 4. Verify Allie knows "next one" = dentist appointment for Jack
  // 5. Verify Allie suggests: "Based on Dr. Chen's recommendation, 6 months from March 14..."
});

test('Multi-step task completion via chat', async ({ page }) => {
  // Landing page example: Save birthday party invitation
  // 1. Upload photo
  // 2. Say: "Save this birthday party invitation"
  // 3. Verify Allie extracts all details
  // 4. Verify Allie adds event to calendar
  // 5. Verify Allie asks: "Would you like me to set a reminder to buy a present?"
  // 6. User: "Yes, remind me 3 days before"
  // 7. Verify reminder set
  // 8. Verify document saved
  // 9. Verify everything linked
});

test('Proactive suggestions based on patterns', async ({ page }) => {
  // Landing page: "Proactive suggestions & reminders"
  // 1. Upload 3 doctor visit notes for Jack (all 6 months apart)
  // 2. Wait for pattern recognition
  // 3. Verify Allie proactively suggests: "Jack is due for a checkup"
  // 4. Verify suggests: "Would you like me to schedule an appointment?"
});

test('Learning family preferences', async ({ page }) => {
  // Landing page: "Learns your family's unique needs"
  // 1. Always schedule Jack's appointments on Thursdays at 3pm
  // 2. After 3 appointments, ask Allie: "Schedule Jack's next dentist appointment"
  // 3. Verify Allie proactively suggests: "Thursday at 3pm?"
  // 4. Verify learned preference applied
});

test('Natural language understanding - complex requests', async ({ page }) => {
  // 1. "Remind both parents to pack lunches for the kids tomorrow morning"
  // 2. Verify Allie creates:
  //    - Reminder for Parent 1 (tomorrow 7am)
  //    - Reminder for Parent 2 (tomorrow 7am)
  //    - Context: "pack lunches for kids"
  // 3. Verify both parents receive reminders
});
```

**Current Status:** ⚠️ 30% coverage (basic chat works, intelligence missing)
**Priority:** 🔴 **CRITICAL**

---

### 8.2 Voice Interface
**Test Coverage Needed:**

#### **E2E Tests - Voice Interaction (NEW - 0% coverage):**
```javascript
// tests/e2e/18-voice-interface.spec.js (NEW)

test('Voice command - simple query', async ({ page }) => {
  // 1. Click microphone button
  // 2. Speak: "When is Jack's next dentist appointment?"
  // 3. Verify speech transcribed correctly
  // 4. Verify Allie responds with answer
  // 5. Verify Allie speaks response (TTS)
});

test('Voice command - complex multi-step', async ({ page }) => {
  // 1. Click microphone
  // 2. Speak: "Schedule a doctor appointment for Jack next Monday at 10am and remind me to fast beforehand"
  // 3. Verify Allie understands BOTH actions:
  //    - Schedule appointment (Monday 10am)
  //    - Create reminder (fast beforehand)
  // 4. Verify both created
});

test('Continuous voice conversation', async ({ page }) => {
  // 1. Enable continuous mode
  // 2. Speak: "I need to plan a birthday party"
  // 3. Allie: "Great! Who's the party for?"
  // 4. Speak: "Tyler"
  // 5. Allie: "When would you like to have it?"
  // 6. Speak: "Next Saturday at 2pm"
  // 7. Verify full conversation context maintained
});
```

**Current Status:** ⚠️ 40% coverage (basic voice works, conversation flow missing)
**Priority:** 🟡 **MEDIUM-HIGH**

---

## 📊 COMPREHENSIVE TEST SUITE SUMMARY

### Total Tests Required: **~185 E2E Tests**

| **Category** | **Tests Needed** | **Current** | **Gap** | **Priority** |
|-------------|------------------|-------------|---------|--------------|
| **Landing & Discovery** | 5 | 7 ✅ | -2 | ✅ Done |
| **Auth & Onboarding** | 15 | 19 ✅ | -4 | ✅ Done |
| **Family Assessment** | 25 | 0 ❌ | +25 | 🔴 Critical |
| **Calendar Integration** | 15 | 8 ⚠️ | +7 | 🟡 High |
| **Document Hub** | 12 | 0 ❌ | +12 | 🔴 Critical |
| **Child Development** | 15 | 0 ❌ | +15 | 🔴 High |
| **Relationship Analytics** | 10 | 0 ❌ | +10 | 🟡 Medium |
| **Wardrobe & Resources** | 8 | 0 ❌ | +8 | 🟢 Low |
| **Family Memory** | 10 | 0 ❌ | +10 | 🔴 Critical |
| **Weekly Check-ins** | 12 | 0 ❌ | +12 | 🔴 Critical |
| **Success Metrics** | 8 | 0 ❌ | +8 | 🟡 Medium |
| **Chores & Rewards** | 20 | 0 ❌ | +20 | 🔴 **CRITICAL!** |
| **Gift Wishes & Habits** | 10 | 0 ❌ | +10 | 🟡 Medium |
| **Allie Chat Intelligence** | 15 | 5 ⚠️ | +10 | 🔴 Critical |
| **Voice Interface** | 10 | 4 ⚠️ | +6 | 🟡 High |
| **TOTAL** | **185** | **43** | **+142** | - |

---

## 🎯 PRIORITIZED IMPLEMENTATION ROADMAP

### **Week 1: CRITICAL REGRESSION PROTECTION (20 tests)**
**Focus:** Protect recently fixed bugs + highest-value features

1. **Chores & Rewards (8 tests)** 🔴
   - Import chores (BucksService regression test!)
   - Bucks balance initialization
   - Complete chore-to-reward cycle
   - Photo approval flow

2. **Family Assessment Survey (6 tests)** 🔴
   - Initial 72-question survey
   - Multi-parent coordination
   - Balance metrics calculation
   - Data persistence

3. **Family Memory Core (6 tests)** 🔴
   - Voice capture
   - Photo capture
   - Chat capture
   - Long-term recall

---

### **Week 2: CORE FEATURES (25 tests)**
**Focus:** Complete the main user journey

4. **Document Hub (8 tests)** 🔴
   - Email integration
   - Document upload
   - OCR extraction
   - Smart search

5. **Calendar Integration (10 tests)** 🟡
   - Google Calendar sync
   - Event extraction (screenshot, email, chat)
   - Family timeline view
   - Conflict detection

6. **Allie Chat Intelligence (7 tests)** 🔴
   - Context retention
   - Multi-step tasks
   - Proactive suggestions
   - Learning preferences

---

### **Week 3: BALANCE & PROGRESS (20 tests)**
**Focus:** The transformation journey

7. **Weekly Check-ins (12 tests)** 🔴
   - Balance surveys
   - Progress tracking
   - Personalized goals
   - Family meetings
   - 8-week journey

8. **Child Development Tracking (8 tests)** 🟡
   - Growth tracking
   - Health records
   - Education milestones
   - Voice-enabled updates

---

### **Week 4: ENHANCED FEATURES (15 tests)**
**Focus:** Advanced capabilities

9. **Relationship Analytics (10 tests)** 🟡
   - Balance dashboard
   - Domain breakdown
   - Guided meetings
   - Research strategies

10. **Voice Interface (5 tests)** 🟡
    - Complex commands
    - Continuous conversation
    - Multi-step tasks

---

### **Week 5-6: SUPPLEMENTAL FEATURES (20 tests)**
**Focus:** Nice-to-have systems

11. **Children's Systems (10 tests)** 🟡
    - Gift Wishes
    - Habit Helper
    - Achievements

12. **Wardrobe & Resources (10 tests)** 🟢
    - Wardrobe Concierge
    - Inventory management
    - Shopping lists

---

### **Week 7: VALIDATION & METRICS (8 tests)**
**Focus:** Success measurement

13. **Success Metrics (8 tests)** 🟡
    - Mental load reduction
    - Time savings
    - Conflict reduction
    - Overall satisfaction

---

## 📈 EXPECTED OUTCOMES

### Coverage Improvement
- **Current:** 20% lifecycle coverage (43 tests)
- **After Week 1:** 45% coverage (63 tests)
- **After Week 2:** 68% coverage (88 tests)
- **After Week 3:** 83% coverage (108 tests)
- **After Week 7:** **95% coverage (185+ tests)**

### Risk Reduction
- ✅ **BucksService regression** protected (Week 1)
- ✅ **Core value proposition** validated (Weeks 1-3)
- ✅ **Complete user journey** tested (Weeks 1-4)
- ✅ **All landing page promises** verified (Weeks 1-7)

---

## 🚀 GETTING STARTED

### Immediate Next Steps (TODAY):

1. **Create test file structure:**
```bash
mkdir -p tests/e2e/complete-lifecycle
touch tests/e2e/complete-lifecycle/14-chore-reward-lifecycle.spec.js
touch tests/e2e/complete-lifecycle/03-initial-survey.spec.js
touch tests/e2e/complete-lifecycle/11-family-memory.spec.js
```

2. **Start with HIGHEST priority - Chore regression test:**
```javascript
// Protect the BucksService fix from Oct 18, 2025
test('Import chores without BucksService infinite loop', async ({ page }) => {
  // CRITICAL REGRESSION TEST
  // ...
});
```

3. **Run and verify:**
```bash
npm run test:e2e -- tests/e2e/complete-lifecycle/14-chore-reward-lifecycle.spec.js
```

---

## 📞 SUPPORT & QUESTIONS

**Created by:** Claude Code
**Date:** October 18, 2025
**Based on:** Landing page analysis + codebase review
**Status:** Ready for implementation

---

**Would you like me to start implementing the Week 1 CRITICAL tests immediately?**
