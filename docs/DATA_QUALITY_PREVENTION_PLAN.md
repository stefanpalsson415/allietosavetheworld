# Data Quality Prevention Plan

**Created:** October 22, 2025
**Purpose:** Prevent data quality issues discovered during Palsson Family simulation from recurring
**Status:** PLAN - Ready for implementation

---

## 🎯 The Problem

We've discovered 3 critical data quality bugs through testing:

1. **Triple ID Pattern** - Family members missing `id`, `memberId`, or `userId` → Runtime errors
2. **CycleId Format** - Habits created with `"weekly_45"` instead of `"45"` → Empty UI lists
3. **Security userId** - Events without `userId` → Firestore security rule failures

**Migrations fix OLD data. We need PREVENTION to stop NEW bad data.**

---

## 🛡️ Prevention Strategy (5 Layers of Defense)

### Layer 1: Factory Functions (Enforce Patterns at Creation)
**Goal:** Make it impossible to create bad data objects

**What to Create:**
- `/src/factories/FamilyMemberFactory.js`
- `/src/factories/HabitFactory.js`
- `/src/factories/EventFactory.js`
- `/src/factories/ContactFactory.js`

**How it Works:**
```javascript
// INSTEAD OF THIS (error-prone):
const member = {
  userId: 'stefan_test',
  name: 'Stefan',
  // Missing id and memberId!
};

// USE THIS (pattern enforced):
import { createFamilyMember } from './factories/FamilyMemberFactory';

const member = createFamilyMember({
  userId: 'stefan_test',
  name: 'Stefan',
  role: 'parent',
  age: 40
});
// Automatically includes: id, memberId, userId (all matching)
```

**Benefits:**
- ✅ Triple ID pattern enforced automatically
- ✅ Default values for required fields
- ✅ Validation built-in
- ✅ Single source of truth

**Effort:** 1-2 days

---

### Layer 2: Service Layer Validation (Block Bad Writes)
**Goal:** All Firestore writes go through validated services

**What to Create:**
- Enhance existing services (DatabaseService, HabitService2, etc.)
- Add validation before every write

**How it Works:**
```javascript
// In HabitService2.js
import { validateHabit } from '../utils/dataValidation';

async createHabit(familyId, habitData) {
  // VALIDATE BEFORE WRITE
  const validation = validateHabit(habitData);
  if (!validation.valid) {
    console.error('Invalid habit data:', validation.errors);
    throw new Error(`Cannot create habit: ${validation.errors.join(', ')}`);
  }

  // CRITICAL: Enforce cycleId format (just the number)
  if (habitData.cycleId && habitData.cycleId.includes('_')) {
    throw new Error(`Invalid cycleId format: "${habitData.cycleId}". Must be just number like "45"`);
  }

  // Safe to write
  return await db.collection('families')
    .doc(familyId)
    .collection('habits')
    .add(habitData);
}
```

**Where to Add:**
- `DatabaseService.js` - Family creation/updates
- `HabitService2.js` - Habit CRUD
- `CalendarServiceV2.js` - Event creation
- Any service that writes to Firestore

**Benefits:**
- ✅ Centralized validation
- ✅ Catch bugs before data is written
- ✅ Clear error messages for developers
- ✅ Works for all code paths

**Effort:** 2-3 days

---

### Layer 3: Development-Time Warnings (ESLint + Pre-commit)
**Goal:** Warn developers when they write bad patterns in code

**What to Create:**

#### A. Custom ESLint Rule
`/.eslintrc.js` - Add custom rule:

```javascript
rules: {
  // Warn when creating objects that might violate patterns
  'no-incomplete-family-member': 'error',
  'no-prefixed-cycle-id': 'error'
}
```

#### B. Pre-commit Hook
`/.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run data integrity tests before allowing commit
npm run test:data-integrity

# Search for dangerous patterns in staged files
if git diff --cached --name-only | grep -E '\.(js|jsx|ts|tsx)$'; then
  # Check for hardcoded cycleId with prefix
  if git diff --cached | grep -E "cycleId.*['\"]weekly_|cycleId.*['\"]monthly_"; then
    echo "❌ COMMIT BLOCKED: Found prefixed cycleId (use just number like '45')"
    exit 1
  fi

  # Check for events without userId
  if git diff --cached | grep -E "collection\('events'\)" | grep -v "userId"; then
    echo "⚠️  WARNING: Creating event - ensure userId field is included"
  fi
fi
```

**Benefits:**
- ✅ Catch issues before they're committed
- ✅ Educate developers immediately
- ✅ Enforce patterns across team
- ✅ Automated, no manual review needed

**Effort:** 1 day

---

### Layer 4: Firestore Security Rules (Server-Side Validation)
**Goal:** Firebase rejects invalid data at the database level

**What to Update:**
`/firestore.rules` - Add validation rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function: Validate family member has all three IDs
    function hasTripleId(member) {
      return member.id == member.userId
          && member.memberId == member.userId
          && member.userId != null;
    }

    // Helper function: Validate cycleId format (just number)
    function isValidCycleId(cycleId) {
      // Must be numeric string, not prefixed
      return cycleId.matches('^[0-9]+$');
    }

    match /families/{familyId} {
      // Validate family members have triple ID pattern
      allow create, update: if request.resource.data.familyMembers != null
        && request.resource.data.familyMembers.size() > 0
        && request.resource.data.familyMembers.hasAll(['userId', 'id', 'memberId']);

      match /habits/{habitId} {
        // Validate cycleId format
        allow create, update: if isValidCycleId(request.resource.data.cycleId);
      }

      match /events/{eventId} {
        // CRITICAL: Events must have userId for security
        allow create, update: if request.resource.data.userId != null
          && request.resource.data.familyId != null;
      }
    }
  }
}
```

**Benefits:**
- ✅ Absolute last line of defense
- ✅ Works even if client code bypasses validation
- ✅ Protects against malicious writes
- ✅ No code changes needed, just rules

**Effort:** 1 day

---

### Layer 5: Continuous Monitoring (Detect & Alert)
**Goal:** Detect when bad data slips through, alert team immediately

**What to Create:**

#### A. Daily Data Quality Checks
`/scripts/monitoring/check-data-quality.js`:

```javascript
#!/usr/bin/env node

/**
 * Daily Data Quality Check
 * Runs in CI/CD or cron job
 * Alerts team if bad data is found
 */

const admin = require('firebase-admin');
const { validateFamily, validateHabit, validateEvent } = require('../src/utils/dataValidation');

async function checkDataQuality() {
  const issues = [];

  // Check families
  const families = await db.collection('families').get();
  families.forEach(doc => {
    const validation = validateFamily(doc.data());
    if (!validation.valid) {
      issues.push({
        collection: 'families',
        docId: doc.id,
        errors: validation.errors
      });
    }
  });

  // Check habits for cycleId format
  const habits = await db.collectionGroup('habits').get();
  habits.forEach(doc => {
    const habit = doc.data();
    if (habit.cycleId && (habit.cycleId.includes('weekly_') || habit.cycleId.includes('monthly_'))) {
      issues.push({
        collection: 'habits',
        docId: doc.id,
        error: `Invalid cycleId format: "${habit.cycleId}"`
      });
    }
  });

  // Report
  if (issues.length > 0) {
    console.error(`❌ Found ${issues.length} data quality issues!`);
    // Send to Slack/email/monitoring service
    await sendAlert(issues);
  } else {
    console.log('✅ Data quality check passed');
  }
}
```

#### B. Cloud Function Monitors
Add logging to existing Cloud Functions:

```javascript
// In functions/neo4j-sync.js
exports.syncHabitToNeo4j = functions.firestore
  .document('families/{familyId}/habits/{habitId}')
  .onCreate(async (snap, context) => {
    const habit = snap.data();

    // LOG WARNING if bad format detected
    if (habit.cycleId && !habit.cycleId.match(/^\d+$/)) {
      console.warn('⚠️  DATA QUALITY ISSUE: Habit created with invalid cycleId format', {
        habitId: context.params.habitId,
        cycleId: habit.cycleId,
        expected: 'Just number like "45"'
      });
      // Optionally fix on the fly
      const fixedCycleId = habit.cycleId.replace(/^(weekly_|monthly_)/, '');
      await snap.ref.update({ cycleId: fixedCycleId });
    }

    // Continue with sync...
  });
```

**Benefits:**
- ✅ Detect issues in production
- ✅ Alert team immediately
- ✅ Track data quality over time
- ✅ Can auto-fix simple issues

**Effort:** 2 days

---

## 📋 Implementation Roadmap

### Phase 1: Quick Wins (Week 1)
**Priority:** Stop the bleeding - prevent most common issues

- [ ] **Day 1-2:** Create factory functions (Layer 1)
  - `FamilyMemberFactory.js` - Triple ID pattern
  - `HabitFactory.js` - CycleId format
  - `EventFactory.js` - Security userId

- [ ] **Day 3-4:** Add service layer validation (Layer 2)
  - Update `DatabaseService.js`
  - Update `HabitService2.js`
  - Update `CalendarServiceV2.js`

- [ ] **Day 5:** Test & deploy
  - Run all tests
  - Deploy to staging
  - Verify no regressions

**Expected Impact:** 80% of data quality issues prevented

---

### Phase 2: Developer Tools (Week 2)
**Priority:** Help developers avoid mistakes

- [ ] **Day 1:** Custom ESLint rules (Layer 3)
  - Rule for cycleId format
  - Rule for userId in events

- [ ] **Day 2:** Pre-commit hooks (Layer 3)
  - Pattern detection
  - Test enforcement

- [ ] **Day 3-4:** Documentation
  - Update developer guide
  - Add examples to CLAUDE.md
  - Create "Common Mistakes" guide

- [ ] **Day 5:** Team training
  - Present new patterns
  - Demo factory functions
  - Show validation in action

**Expected Impact:** Developer education + automated enforcement

---

### Phase 3: Server-Side Protection (Week 3)
**Priority:** Absolute guarantee at database level

- [ ] **Day 1-2:** Update Firestore rules (Layer 4)
  - Add validation functions
  - Test with Firebase emulator

- [ ] **Day 3:** Deploy & test
  - Deploy rules to staging
  - Verify legitimate writes still work
  - Test that bad writes are rejected

- [ ] **Day 4-5:** Edge case handling
  - Handle legacy data gracefully
  - Add migration path for existing bad data

**Expected Impact:** 100% prevention at database level

---

### Phase 4: Continuous Monitoring (Week 4)
**Priority:** Long-term data quality assurance

- [ ] **Day 1-2:** Data quality checks (Layer 5)
  - Daily cron job
  - Slack/email alerts

- [ ] **Day 3:** Cloud Function monitors (Layer 5)
  - Add logging to sync functions
  - Auto-fix when possible

- [ ] **Day 4:** Dashboard
  - Data quality metrics
  - Trend tracking

- [ ] **Day 5:** Runbook
  - "What to do when data quality alert fires"
  - Escalation procedures

**Expected Impact:** Early detection + quick response

---

## 🎯 Success Metrics

Track these to measure prevention effectiveness:

### Baseline (Before Prevention)
- **Triple ID violations:** 15+ families (from testing)
- **CycleId format issues:** 10+ habits (caused UI bug)
- **Missing userId in events:** Unknown count
- **Time to detect:** Days/weeks (manual testing)
- **Time to fix:** Hours (write migration script)

### Target (After Prevention)
- **New violations per week:** 0
- **Time to detect:** Immediate (pre-commit) or < 1 hour (monitoring)
- **Time to fix:** Automatic (factory functions) or minutes (alerts)
- **Developer productivity:** Faster (less debugging bad data)
- **Production incidents:** 90% reduction

### Monitoring Dashboard
```
Data Quality Score: 98% ✅
  - Triple ID compliance: 100% (0 violations)
  - CycleId format: 100% (0 violations)
  - Event userId: 98% (2 legacy events)

Recent Alerts:
  - None in past 30 days

Trend:
  ↑ Improving (was 65% in September)
```

---

## 🚀 Quick Start (What to Do First)

### For Developers (Today):
1. **Use validation functions** - Import from `/src/utils/dataValidation.js`
2. **Use factory functions** (when created) - Never create raw objects
3. **Run tests before committing** - `npm run test:data-integrity`

### For Team Lead (This Week):
1. **Review this plan** - Prioritize which layers to implement
2. **Assign tasks** - Phase 1 is highest priority
3. **Schedule training** - Show team the new patterns

### For DevOps (Week 2):
1. **Set up monitoring** - Daily data quality checks
2. **Configure alerts** - Slack integration
3. **Review Firestore rules** - Ensure validation is enabled

---

## 📚 Additional Resources

### Developer Education
- [ ] Create "Data Patterns Cheat Sheet" (`/docs/DATA_PATTERNS_CHEAT_SHEET.md`)
- [ ] Add examples to `CLAUDE.md`
- [ ] Record video walkthrough of factory functions
- [ ] Create Notion page with FAQs

### Code Examples
- [ ] Example: Using FamilyMemberFactory
- [ ] Example: Service layer validation
- [ ] Example: Handling validation errors gracefully
- [ ] Example: Testing with validation

### Testing Strategy
- [ ] Unit tests for factory functions
- [ ] Integration tests for service layer validation
- [ ] E2E tests that try to create invalid data
- [ ] Regression tests for all 3 discovered bugs

---

## 🔄 Maintenance Plan

### Weekly
- Review data quality metrics dashboard
- Check for new validation rule violations
- Update factory functions if patterns change

### Monthly
- Run full data quality audit (migration scripts in dry-run mode)
- Review and update Firestore security rules
- Team retrospective: "Data quality issues this month"

### Quarterly
- Evaluate new data quality risks
- Update prevention layers as needed
- Audit test coverage for data integrity

---

## 💡 Future Enhancements

### Advanced Prevention (Later)
- **Schema versioning** - Migrate data formats safely
- **Data contracts** - TypeScript interfaces at runtime (Zod, Yup)
- **Automatic repair** - Cloud Functions auto-fix simple issues
- **Data quality SLAs** - Track as production metric

### Developer Experience
- **VS Code extension** - Real-time validation in editor
- **Code snippets** - Insert validated patterns instantly
- **AI assistant** - "Does this code violate data patterns?"

---

## ✅ Summary

**The Plan:**
1. ✅ **Layer 1** - Factory functions (make correct patterns easy)
2. ✅ **Layer 2** - Service validation (block bad writes)
3. ✅ **Layer 3** - Dev tools (catch before commit)
4. ✅ **Layer 4** - Firestore rules (absolute guarantee)
5. ✅ **Layer 5** - Monitoring (detect & alert)

**The Result:**
- 🎯 **Prevention** instead of migration
- 🚀 **Faster development** (less debugging)
- 💪 **Confidence** in data quality
- 📈 **Scalable** as team grows

**The Timeline:**
- Week 1: Quick wins (80% prevention)
- Week 2: Developer tools (education)
- Week 3: Server protection (100% guarantee)
- Week 4: Monitoring (long-term assurance)

---

**Status:** ✅ Plan complete, ready for implementation
**Next Step:** Review with team → Assign Phase 1 tasks → Begin Week 1
**Owner:** Data Quality Initiative
**Created:** October 22, 2025
