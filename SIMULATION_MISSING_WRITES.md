# Simulation Missing Writes - Fix Required

## Current Status: Only 26.3% Complete

The simulation currently writes to **5 collections** but needs to write to **10 collections** + metadata.

---

## ✅ ALREADY WRITING (5 collections)

1. **events** (323 docs) - Calendar events ✅
2. **kanbanTasks** (858 docs) - Tasks and invisible labor ✅
3. **inboxItems** (93 docs) - Emails and SMS ✅
4. **interviewSessions** (5 docs) - Discovery interviews ✅
5. **documents** (38 docs) - Files uploaded ✅

---

## ❌ MISSING WRITES (5 collections + metadata)

### 1. **weeklyCheckins** Collection (CRITICAL)
**Expected:** ~102 documents (51 weeks × 2 parents)

**Current:** Logs to console but never writes to Firestore

**Code location:** `AgentOrchestrator.js:649-690` (completeWeeklySurvey)

**What to write:**
```javascript
await db.collection('weeklyCheckins').doc().set({
  id: docId,
  familyId: familyId,
  userId: agent.userId,
  userName: agent.name,
  surveyType: 'weekly_checkin',
  completed: true,
  responses: {
    mentalLoad: agent.currentState.mentalLoad,
    stress: agent.currentState.stress,
    satisfaction: 1.0 - agent.currentState.stress,
    hoursOfSleep: Math.floor(6 + Math.random() * 3),
    timeForSelf: Math.floor(Math.random() * 3),
    partnerSupport: agent.currentState.partnerSupport,
    // Add 8-10 survey questions based on brief/full version
  },
  duration: agentName === 'kimberly' ? 15 : 8,
  completedAt: new Date(currentDate).toISOString(),
  createdAt: admin.firestore.FieldValue.serverTimestamp()
});
```

**Why it matters:** Dashboard shows "Initial Family Survey" incomplete without this

---

### 2. **habits** Collection
**Expected:** 3 documents (Lillian: plants, Oly: study, Tegner: chores)

**Current:** Not implemented at all

**What to write:**
```javascript
// During Discovery phase (Month 3)
await db.collection('habits').doc().set({
  id: docId,
  familyId: familyId,
  userId: child.userId,
  title: habitTitle, // "Water plants", "Study time", "Morning chores"
  category: category, // "responsibility", "learning", "routine"
  frequency: "daily",
  streakCurrent: 0,
  streakBest: 0,
  completionRate: 0,
  createdAt: new Date(currentDate).toISOString(),
  status: 'active'
});
```

---

### 3. **habitCompletions** Collection
**Expected:** ~1,095 documents (3 kids × 365 days)

**Current:** Not implemented

**What to write:**
```javascript
// Daily for each habit
await db.collection('habitCompletions').doc().set({
  id: docId,
  familyId: familyId,
  userId: child.userId,
  habitId: habitId,
  completed: completionRate > Math.random(), // Based on phase
  completedAt: new Date(currentDate).toISOString(),
  notes: null
});
```

**Why it matters:** Shows habit streaks and progress over time

---

### 4. **familyMeetings** Collection
**Expected:** ~25 documents (bi-weekly after Discovery phase)

**Current:** Only writes calendar events, not meeting records

**Code location:** `AgentOrchestrator.js:695-747` (conductFamilyMeeting)

**What to write:**
```javascript
await db.collection('familyMeetings').doc().set({
  id: docId,
  familyId: familyId,
  meetingNumber: this.stats.familyMeetings,
  participants: ['Stefan', 'Kimberly', 'Lillian', 'Oly', 'Tegner'],
  duration: 30,
  topics: generateMeetingTopics(), // Based on phase
  phase: this.currentPhase,
  actionItems: [
    // Generate based on current imbalances
  ],
  notes: "Family check-in and coordination",
  conductedAt: new Date(currentDate).toISOString(),
  createdAt: admin.firestore.FieldValue.serverTimestamp()
});
```

---

### 5. **conversations** Collection (Allie Chat History)
**Expected:** ~280 documents (questions, suggestions, interactions)

**Current:** Not implemented

**What to write:**
```javascript
// Throughout the year - when family asks Allie questions
await db.collection('conversations').doc().set({
  id: docId,
  familyId: familyId,
  userId: agent.userId,
  messages: [
    {
      role: 'user',
      content: userQuestion,
      timestamp: new Date(currentDate).toISOString()
    },
    {
      role: 'assistant',
      content: allieResponse,
      timestamp: new Date(currentDate + 2000).toISOString()
    }
  ],
  topic: topic, // "task-suggestion", "schedule-help", "mental-load"
  createdAt: new Date(currentDate).toISOString()
});
```

**Why it matters:** Shows Allie engagement and learning over time

---

## ❌ MISSING METADATA UPDATES

### 6. **Family Document** - Progress Tracking
**Current:** Only has basic family structure

**What to add:**
```javascript
await db.collection('families').doc(familyId).update({
  // Transformation tracking
  currentPhase: this.currentPhase, // chaos → discovery → integration → balanced → thriving
  transformationStartDate: startDate.toISOString(),
  daysSinceStart: daysPassed,
  
  // Survey progress
  surveys: {
    totalCompleted: this.stats.surveysCompleted,
    lastCompletedDate: this.lastSurveyDate.toISOString(),
    completionRate: 0.95 // Stefan & Kimberly participation
  },
  
  // Mental load distribution
  mentalLoad: {
    stefan: this.agents.stefan.currentState.mentalLoad,
    kimberly: this.agents.kimberly.currentState.mentalLoad,
    gap: Math.abs(stefan.mentalLoad - kimberly.mentalLoad)
  },
  
  // Fair Play cards distribution
  fairPlay: {
    stefanCards: stefanResponsibilities.length,
    kimberlyCards: kimberlyResponsibilities.length,
    balance: stefanCards / (stefanCards + kimberlyCards)
  },
  
  // Journey progress
  journeyProgress: {
    phase: this.currentPhase,
    completedMilestones: [...], // Discovery done, habits formed, etc.
    nextMilestone: "...",
    overallProgress: 0.85 // 85% through transformation
  },
  
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
});
```

---

### 7. **Family Members** - Individual Growth Tracking
**Current:** Only has basic profile data

**What to add to each member:**
```javascript
// Stefan's growth
familyMembers[stefan]: {
  ...existingData,
  
  // Survey status
  hasCompletedInitialSurvey: true,
  surveysCompleted: 51,
  lastSurveyDate: lastSurvey.toISOString(),
  
  // Awareness growth (30% → 85%)
  awareness: currentAwareness,
  awarenessHistory: [
    { date: '2025-01-01', value: 0.30 },
    { date: '2025-03-01', value: 0.50 },
    { date: '2025-06-01', value: 0.70 },
    { date: '2025-12-31', value: 0.85 }
  ],
  
  // Task participation
  taskStats: {
    created: tasksCreated,
    completed: tasksCompleted,
    completionRate: 0.90
  },
  
  // Mental load current
  mentalLoad: 0.48, // Up from 0.30
  mentalLoadHistory: [...]
}

// Lillian's growth
familyMembers[lillian]: {
  ...existingData,
  
  // Allie skepticism reduction (70% → 5%)
  allieSkepticism: 0.05,
  skepticismHistory: [...],
  
  // Helpfulness increase
  helpfulness: 0.90,
  
  // Habit streak
  plantCareStreak: 280, // days
  plantCareCompletionRate: 0.95
}

// Tegner's improvement
familyMembers[tegner]: {
  ...existingData,
  
  // Sleep quality improvement (60% → 84%)
  sleepQuality: 0.84,
  sleepHistory: [...]
}
```

---

## 📋 Implementation Checklist

To make the simulation write a **complete year of data**:

- [ ] 1. Add `weeklyCheckins` writes in `completeWeeklySurvey()`
- [ ] 2. Add habit creation in Discovery phase
- [ ] 3. Add daily `habitCompletions` 
- [ ] 4. Add `familyMeetings` records (not just calendar events)
- [ ] 5. Add `conversations` throughout year
- [ ] 6. Update family document with progress metadata
- [ ] 7. Update family members with growth metrics
- [ ] 8. Add Mental Load History tracking
- [ ] 9. Add Fair Play card distribution tracking
- [ ] 10. Add Transformation phase milestones

---

## 🎯 Expected Result After Fixes

**Completion Rate:** 100% (vs current 26.3%)

**User Experience:**
- ✅ Dashboard shows "Family has been using Allie for 365 days"
- ✅ Weekly surveys show consistent engagement (51 completed)
- ✅ Mental load chart shows Stefan's growth (30% → 48%)
- ✅ Mental load chart shows Kimberly's relief (87% → 58%)
- ✅ Habit streaks visible for all 3 kids
- ✅ Family meeting history with notes and action items
- ✅ Allie conversation history shows 280+ interactions
- ✅ Transformation journey progress bar at 85%
- ✅ Fair Play distribution shows rebalancing over time

---

**Status:** Ready to rebuild simulation with complete data ✅
