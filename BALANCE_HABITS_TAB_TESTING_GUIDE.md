# Balance & Habits Tab - Complete Testing Guide

**Generated:** October 22, 2025
**Tab Path:** `/dashboard?tab=tasks`
**Component:** `TasksTab.jsx` (1,300+ lines)

## Overview

The Balance & Habits tab is the core feature for tracking workload balance, survey cycles, and habit formation in Parentload/Allie.

## Main Component

**File:** `/src/components/dashboard/tabs/TasksTab.jsx`
- **Size:** 37,524 tokens (one of the largest components)
- **Lines:** 1,300+ lines
- **Type:** Complex React component with extensive state management

## Key Imports & Dependencies

### Core React & Contexts
- `useFamily` - Family member data
- `useSurvey` - Survey cycle management
- `useChatDrawer` - Allie chat integration
- `useAuth` - User authentication
- `useEvents` - Event management
- `useCycleDueDate` - Cycle due date tracking

### Services (11 major services)
1. **DatabaseService** - Firestore operations
2. **AllieAIService** - AI-powered insights
3. **HabitGenerationService** - Generate personalized habits
4. **HabitCyclesService** - Manage habit cycles
5. **HabitService2** - Habit CRUD operations
6. **CalendarService** - Calendar integration
7. **ELORatingService** - Habit effectiveness rating
8. **SubCategoryAnalyzer** - Survey subcategory analysis
9. **SurveyResponseCategorizer** - Categorize survey responses
10. **eventStore** - Event data management
11. **knowledgeBase** (AllieKnowledgeBase) - AI knowledge

### Sub-Components (8 major components)
1. **CycleJourney** - Visual cycle progress tracker
2. **HabitHelperSection** - Habit suggestions and management
3. **FourCategoryRadar** - 4-category workload radar chart
4. **FamilyHabitsView** - Family-wide habit view
5. **HabitDrawer** - Habit detail drawer
6. **EnhancedEventManager** - Event management UI
7. **FloatingCalendar** - Calendar picker
8. **BalanceCelebrationModal** - Celebration animations

### Utilities
- `analyzeTaskImbalances` - Find workload imbalances
- `generatePersonalizedExplanation` - Explain imbalances
- `findMostAppropriateHabit` - Match habits to imbalances
- `SurveyAnalysisUtil` - Survey analysis utilities

## What This Tab Does

### 1. Cycle Management (Weekly/Monthly)
- Displays current cycle progress (Week 1, Week 2, etc.)
- Shows cycle due dates
- Tracks cycle completion status:
  - Survey completion
  - Family meeting scheduling
  - Habit selection and tracking

### 2. Workload Balance Visualization
- **FourCategoryRadar** - Shows balance across 4 categories:
  - Home (🏠)
  - Kids (👶)
  - Work (💼)
  - Self (❤️)
- Color-coded imbalance indicators
- Compare yourself vs. partner

### 3. Habit System
- **Habit Generation:** AI-generated personalized habits based on:
  - Survey responses
  - Workload imbalances
  - Subcategory analysis
- **Habit Tracking:** Check-in system with:
  - Daily progress
  - ELO rating (effectiveness)
  - Completion celebrations (confetti 🎉)
- **Habit Cycles:** Habits last 1 cycle (weekly or monthly)
- **Habit Carry-Over:** Dialog for carrying habits to next cycle

### 4. Survey Integration
- Links to current survey
- Shows survey completion status for all family members
- Displays member progress

### 5. Family Meeting
- Schedule family meetings
- Track meeting completion
- Integration with calendar

### 6. Allie Chat Integration
- "Ask Allie" button opens chat drawer
- Context-aware suggestions
- Habit recommendation questions

## Key Features to Test

### A. Cycle System
- [ ] Cycle progress displays correctly (Week 1/4, Week 2/4, etc.)
- [ ] Due dates show correctly
- [ ] Cycle transitions work (weekly → weekly+1, monthly → monthly+1)
- [ ] "Start New Cycle" button works
- [ ] Cycle history displays

### B. Survey Flow
- [ ] Survey completion status accurate for all family members
- [ ] Member avatars show completion checkmarks
- [ ] "Take Survey" button navigates correctly
- [ ] Survey results trigger habit generation

### C. Workload Radar
- [ ] 4-category radar chart renders
- [ ] Categories show correct percentages:
  - Home
  - Kids
  - Work
  - Self
- [ ] Imbalances highlighted (red/yellow/green)
- [ ] Hovering shows subcategory breakdowns
- [ ] Compare mode shows partner data

### D. Habit Generation
- [ ] Habits generated after survey completion
- [ ] Habits match survey imbalances
- [ ] 3-5 habits suggested per person
- [ ] Habit descriptions are personalized
- [ ] "Why this habit?" explanations display

### E. Habit Tracking
- [ ] Check-in button works
- [ ] Confetti celebration triggers on completion
- [ ] Firestore updates immediately
- [ ] Habit progress persists across sessions
- [ ] ELO rating updates based on effectiveness

### F. Habit Drawer
- [ ] Opens when clicking habit card
- [ ] Shows habit details:
  - Description
  - Why recommended
  - Current progress
  - ELO rating
- [ ] Edit/delete buttons work
- [ ] Close button works

### G. Family Habits View
- [ ] Toggle "View Family Habits" works
- [ ] Shows all family members' habits
- [ ] Each member's habits display correctly
- [ ] Can navigate back to personal view

### H. Habit Carry-Over
- [ ] Dialog appears at cycle end
- [ ] Shows current cycle habits
- [ ] Checkboxes for selecting habits to carry
- [ ] "Carry Over Selected" button works
- [ ] New cycle starts with carried habits

### I. Calendar Integration
- [ ] "Schedule Meeting" opens calendar picker
- [ ] Selected date saves to Firestore
- [ ] Meeting date displays on CycleJourney
- [ ] Integration with Family Calendar tab

### J. Event Management
- [ ] EnhancedEventManager renders
- [ ] Can add events from this tab
- [ ] Events sync with calendar
- [ ] Event categories match survey categories

### K. Allie Chat
- [ ] "Ask Allie" button opens drawer
- [ ] Suggested questions appear:
  - "Why am I imbalanced?"
  - "What habits should I try?"
  - "How do I reduce [category] load?"
- [ ] Chat context includes:
  - Current cycle
  - Survey results
  - Habits
  - Imbalances

## Data Flow

### Survey → Analysis → Habits Pipeline

```
1. User completes survey
   ↓
2. SurveyResponseCategorizer categorizes responses
   ↓
3. SubCategoryAnalyzer analyzes imbalances
   ↓
4. analyzeTaskImbalances() finds top imbalances
   ↓
5. HabitGenerationService generates personalized habits
   ↓
6. findMostAppropriateHabit() matches habits to imbalances
   ↓
7. Habits saved to Firestore: families/{familyId}/habits/{habitId}
   ↓
8. TasksTab renders habits with HabitHelperSection
```

### Habit Check-In Flow

```
1. User clicks "Check In" on habit card
   ↓
2. updateDoc() increments completionCount
   ↓
3. Confetti animation triggers
   ↓
4. ELORatingService updates effectiveness rating
   ↓
5. HabitCyclesService checks if cycle complete
   ↓
6. If cycle complete → Show carry-over dialog
```

## Firestore Schema

### Habits Collection
```
families/{familyId}/habits/{habitId}
{
  userId: string,
  habitText: string,
  description: string,
  category: "home" | "kids" | "work" | "self",
  subcategory: string,
  imbalanceReason: string,
  cycleId: string,
  cycleType: "weekly" | "monthly",
  createdAt: Timestamp,
  completionCount: number,
  targetFrequency: number,
  eloRating: number,
  carryOverFromCycle: string | null
}
```

### Cycles Collection
```
families/{familyId}/cycles/{cycleType}/{cycleId}
{
  cycleNumber: number,
  startDate: Timestamp,
  endDate: Timestamp,
  dueDate: Timestamp,
  survey: {
    completed: boolean,
    completedAt: Timestamp,
    memberProgress: {
      [userId]: {
        completed: boolean,
        completedAt: Timestamp
      }
    }
  },
  meeting: {
    completed: boolean,
    scheduledDate: Timestamp,
    completedAt: Timestamp
  },
  habits: {
    selected: boolean,
    habits: Array<habitId>
  }
}
```

## Testing Commands

### Unit Tests
```bash
# Test habit services
npm test -- --testPathPattern=HabitGenerationService
npm test -- --testPathPattern=HabitCyclesService
npm test -- --testPathPattern=HabitService2

# Test survey analysis
npm test -- --testPathPattern=SurveyAnalysisUtil
npm test -- --testPathPattern=SubCategoryAnalyzer
```

### E2E Tests
```bash
# Test Balance & Habits tab
npx playwright test tests/e2e/balance-habits.spec.js

# Test full cycle flow
npx playwright test tests/e2e/complete-lifecycle/
```

### Manual Testing Checklist
```
1. Login as parent (stefan_palsson_agent)
2. Navigate to Balance & Habits tab
3. Verify cycle progress displays
4. Check radar chart renders
5. Complete survey if not done
6. Wait for habits to generate (< 5 seconds)
7. Check-in on a habit
8. Verify confetti animation
9. Open habit drawer
10. View family habits
11. Schedule family meeting
12. Ask Allie a question
13. Wait for cycle end
14. Test carry-over dialog
15. Start new cycle
```

## Known Issues to Test For

### Critical
- [ ] Habits not generating after survey completion
- [ ] Radar chart showing NaN or undefined
- [ ] Check-in button not updating Firestore
- [ ] Cycle not advancing after due date
- [ ] Survey completion status incorrect

### Medium
- [ ] Confetti animation not triggering
- [ ] Habit drawer not opening
- [ ] ELO rating not updating
- [ ] Family habits view empty
- [ ] Carry-over dialog not appearing

### Low
- [ ] Tooltips not displaying
- [ ] Colors not matching imbalance severity
- [ ] Suggested questions not loading
- [ ] Calendar picker styling issues

## Related Files to Test

### Components
- `/src/components/cycles/CycleJourney.jsx` - Cycle visualization
- `/src/components/dashboard/HabitHelperSection.jsx` - Habit UI
- `/src/components/dashboard/FourCategoryRadar.jsx` - Radar chart
- `/src/components/habits/FamilyHabitsView.jsx` - Family habits
- `/src/components/habits/HabitDrawer.jsx` - Habit details
- `/src/components/celebrations/BalanceCelebrationModal.jsx` - Celebrations

### Services
- `/src/services/HabitGenerationService.js` - Generate habits
- `/src/services/HabitCyclesService.js` - Manage cycles
- `/src/services/HabitService2.js` - Habit CRUD
- `/src/services/SubCategoryAnalyzer.js` - Analyze surveys
- `/src/services/ELORatingService.js` - Rate effectiveness

### Utilities
- `/src/utils/SurveyAnalysisUtil.js` - Survey analysis
- `/src/utils/ImbalanceHabitGenerator.js` - Generate from imbalances

### Hooks
- `/src/hooks/useHabitManager.js` - Habit state management
- `/src/hooks/useHabitCycles.js` - Cycle hooks
- `/src/hooks/useEnhancedHabitHelpers.js` - Enhanced habit features

## Production URLs to Test

### Demo Account
- **URL:** https://checkallie.com
- **Email:** demo@parentload.com
- **Password:** DemoFamily2024!
- **Family:** Palsson Family Simulation
- **Test Users:**
  - Stefan (Parent) - stefan_palsson_agent
  - Kimberly (Partner) - kimberly_palsson_agent

### Direct Link
https://checkallie.com/dashboard?tab=tasks

## Test Data Verification

### Verify Palsson Family Has:
- [ ] 225 completed survey cycles
- [ ] Active weekly cycle
- [ ] Survey data for all 9 members
- [ ] Habits generated for Stefan & Kimberly
- [ ] Family meeting dates scheduled
- [ ] Radar data for 4 categories
- [ ] Subcategory breakdowns

### Check Firestore Collections:
```javascript
// Check cycles
families/palsson_family_simulation/cycles/weekly/

// Check habits
families/palsson_family_simulation/habits/

// Check surveys
families/palsson_family_simulation/surveyData/

// Check members
families/palsson_family_simulation/members/
```

## Success Criteria

### Tab Loads Successfully
- ✅ No console errors
- ✅ Cycle progress displays within 2 seconds
- ✅ Radar chart renders with data
- ✅ Habits section appears

### User Can Complete Full Flow
- ✅ Take survey → Habits generate
- ✅ Check-in habit → Confetti + Firestore update
- ✅ Schedule meeting → Calendar saves
- ✅ Ask Allie → Get relevant response
- ✅ Complete cycle → Carry-over dialog
- ✅ Start new cycle → Reset properly

### Performance
- ✅ Initial load < 3 seconds
- ✅ Habit check-in < 1 second
- ✅ Chat drawer opens < 500ms
- ✅ Radar chart renders < 1 second
- ✅ No memory leaks on repeated navigation

## Debug Commands

### Check Habit Generation
```javascript
// In browser console on Balance & Habits tab
const familyId = 'palsson_family_simulation';
const userId = 'stefan_palsson_agent';

// Check if habits exist
firebase.firestore()
  .collection('families').doc(familyId)
  .collection('habits')
  .where('userId', '==', userId)
  .get()
  .then(snapshot => {
    console.log(`Found ${snapshot.size} habits`);
    snapshot.docs.forEach(doc => console.log(doc.data()));
  });

// Check current cycle
firebase.firestore()
  .collection('families').doc(familyId)
  .collection('cycles').doc('weekly')
  .collection('cycles')
  .orderBy('startDate', 'desc')
  .limit(1)
  .get()
  .then(snapshot => {
    console.log('Current cycle:', snapshot.docs[0]?.data());
  });
```

## Next Steps

1. **Read TasksTab.jsx** sections with offset/limit to understand full component
2. **Read all imported services** to understand data flow
3. **Create E2E test suite** for this tab
4. **Manual test on production** with demo account
5. **Verify Firestore data** matches expected schema
6. **Test edge cases:**
   - No survey data
   - Incomplete cycle
   - Missing habits
   - Calendar not synced
   - Multiple concurrent users

---

**Last Updated:** October 22, 2025
**Status:** Ready for comprehensive testing
**Priority:** HIGH - Core product feature
