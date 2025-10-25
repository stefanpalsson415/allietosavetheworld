# Flow 1 Complete Data Catalog + Algorithms

**Purpose:** Complete reference for all data collected in Flow 1 (Understanding/Assessment) and the algorithms that process it

**Date:** October 20, 2025

---

## Part 1: Complete Flow 1 Data Points

### 1.1 Survey Data (Most Comprehensive)

**Collection Method:** `SurveyContext.js`, `DynamicSurveyGenerator.js`

**Data Points Collected:**

#### Question Response Data
```javascript
{
  questionId: "q45",
  memberId: "stefan_palsson",
  memberName: "Stefan",
  memberRole: "parent", // or "child"
  memberAge: 42,

  // Answer
  answer: "Mama" | "Papa" | "Both" | "Neither",

  // Question metadata
  category: "Visible Household Tasks" | "Invisible Household Tasks" |
            "Visible Parental Tasks" | "Invisible Parental Tasks" |
            "Relationship Health",
  text: "Who is responsible for cleaning floors in your home?",

  // Weight calculation inputs (7 factors)
  baseWeight: 3,                    // Factor 1: Default 3, range 1-5
  frequency: "daily",               // Factor 2: daily, several, weekly, monthly, quarterly
  invisibility: "partially",        // Factor 3: highly, partially, mostly, completely
  emotionalLabor: "moderate",       // Factor 4: minimal, low, moderate, high, extreme
  researchImpact: "high",          // Factor 5: high, medium, standard
  childDevelopment: "moderate",    // Factor 6: high, moderate, limited
  priority: "highest",             // Factor 7: highest, secondary, tertiary, none

  // Calculated output
  totalWeight: 13.4,               // Result of 7-factor algorithm

  // Timestamp
  timestamp: "2025-10-20T14:30:00Z",
  responseTime: 4500,              // milliseconds to answer

  // Context
  surveyType: "initial" | "weekly" | "re-assessment",
  cycleNumber: 1,
  weekNumber: 1
}
```

#### Aggregated Survey Data (per member)
```javascript
{
  memberId: "kimberly_palsson",
  totalResponses: 72,
  responsesByCategory: {
    "Visible Household Tasks": 18,
    "Invisible Household Tasks": 18,
    "Visible Parental Tasks": 18,
    "Invisible Parental Tasks": 18
  },

  // Cognitive load calculation (from responses)
  cognitiveLoad: {
    anticipationTasks: 12,    // "Who notices/plans" questions
    monitoringTasks: 8,       // "Who tracks/checks" questions
    executionTasks: 5,        // "Who does" questions

    // Calculated score
    totalScore: 41,           // (12 × 2.0) + (8 × 1.5) + (5 × 1.0) = 41
    percentage: 0.73          // 73% of household load
  },

  // Balance metrics
  balanceScores: {
    overallBalance: {
      mama: 73,               // percentage
      papa: 27,
      imbalance: 0.46         // absolute difference
    },
    categoryBalance: {
      "Visible Household Tasks": { mama: 65, papa: 35, imbalance: 0.30 },
      "Invisible Household Tasks": { mama: 85, papa: 15, imbalance: 0.70 },
      "Visible Parental Tasks": { mama: 70, papa: 30, imbalance: 0.40 },
      "Invisible Parental Tasks": { mama: 90, papa: 10, imbalance: 0.80 }
    }
  },

  // Completion metadata
  completedAt: "2025-10-20T15:45:00Z",
  duration: 1200,            // seconds
  revisitCount: 3            // number of times they changed answers
}
```

#### ELO Ratings Data (stored in `familyELORatings` collection)
```javascript
{
  familyId: "palsson_family",

  // Global ratings (across all categories)
  globalRatings: {
    Mama: {
      rating: 1687,          // ELO rating
      uncertainty: 125,      // confidence (starts 350, min 50)
      matchCount: 72         // number of questions answered
    },
    Papa: {
      rating: 1313,
      uncertainty: 125,
      matchCount: 72
    }
  },

  // Category-level ratings
  categories: {
    "Visible Household Tasks": {
      Mama: { rating: 1620, uncertainty: 135, matchCount: 18 },
      Papa: { rating: 1380, uncertainty: 135, matchCount: 18 }
    },
    "Invisible Household Tasks": {
      Mama: { rating: 1875, uncertainty: 110, matchCount: 18 },
      Papa: { rating: 1125, uncertainty: 110, matchCount: 18 }
    }
    // ... other categories
  },

  // Task-level ratings (NEW - individual task tracking)
  taskRatings: {
    "Meal planning": {
      Mama: { rating: 1920, uncertainty: 95, matchCount: 5 },
      Papa: { rating: 1080, uncertainty: 95, matchCount: 5 },
      category: "Invisible Household Tasks",
      bothCount: 2,          // times answered "Both"
      neitherCount: 0        // times answered "Neither"
    },
    "Floor cleaning": {
      Mama: { rating: 1450, uncertainty: 140, matchCount: 3 },
      Papa: { rating: 1550, uncertainty: 140, matchCount: 3 },
      category: "Visible Household Tasks",
      bothCount: 1,
      neitherCount: 0
    }
    // ... 50-100+ task-level ratings
  },

  // Uncovered tasks (neither parent does)
  uncoveredTasks: {
    total: 5,
    byCategory: {
      "Invisible Household Tasks": 3,
      "Visible Parental Tasks": 2
    },
    byTask: {
      "Future planning for kids' education": 1,
      "Tracking kids' emotional development": 1,
      "Researching parenting strategies": 1,
      "Organizing family traditions": 1,
      "Managing digital subscriptions": 1
    }
  },

  lastUpdated: "2025-10-20T15:45:00Z"
}
```

#### ELO Match History (stored in `familyELOHistory` collection)
```javascript
{
  familyId: "palsson_family",
  questionId: "q45",
  category: "Visible Household Tasks",
  taskType: "Floor cleaning",
  response: "Mama",
  result: 1,                 // 1 = Mama wins, 0 = Papa wins, 0.5 = Draw

  // Weight impact
  questionWeight: 7.2,       // calculated from 7 factors
  weightMultiplier: 1.44,    // 7.2 / 5 (average weight)

  // Category ratings change
  categoryRatings: {
    beforeRatings: { Mama: { rating: 1600 }, Papa: { rating: 1400 } },
    afterRatings: { Mama: { rating: 1623 }, Papa: { rating: 1377 } },
    expectedScores: { Mama: 0.64, Papa: 0.36 },
    ratingChanges: { Mama: +23, Papa: -23 }
  },

  // Task ratings change
  taskRatings: {
    beforeRatings: { Mama: { rating: 1420 }, Papa: { rating: 1580 } },
    afterRatings: { Mama: { rating: 1455 }, Papa: { rating: 1545 } },
    expectedScores: { Mama: 0.41, Papa: 0.59 },
    ratingChanges: { Mama: +35, Papa: -35 }
  },

  // Impact score (for analytics)
  impactScore: {
    Mama: 165.6,             // |+23| × 7.2
    Papa: 165.6              // |-23| × 7.2
  },

  timestamp: "2025-10-20T14:35:00Z"
}
```

#### Family Priorities Data
```javascript
{
  familyId: "palsson_family",
  priorities: {
    highestPriority: "Invisible Parental Tasks",      // 1.5x multiplier
    secondaryPriority: "Visible Parental Tasks",      // 1.3x multiplier
    tertiaryPriority: "Invisible Household Tasks",    // 1.1x multiplier
    // No priority: "Visible Household Tasks"         // 1.0x multiplier
  },
  setAt: "2025-01-15T10:00:00Z",
  setBy: "kimberly_palsson",
  reason: "Kids' emotional wellbeing is our top focus right now"
}
```

---

### 1.2 Interview Data (Qualitative Insights)

**Collection Method:** `InterviewOrchestrator.js`, `InterviewChat.jsx`

**Data Points Collected:**

#### Interview Session Data
```javascript
{
  id: "interview_1729436400000_invisible_work_discovery_palsson_family",
  familyId: "palsson_family",
  interviewType: "invisible_work_discovery" | "stress_capacity" |
                 "decision_making_styles" | "family_rules_archaeology" |
                 "future_selves_visioning",

  status: "active" | "completed" | "abandoned",

  // Participants
  conductedBy: {
    userId: "kimberly_palsson",
    name: "Kimberly",
    role: "parent"
  },
  participants: [
    { userId: "kimberly_palsson", name: "Kimberly", role: "parent", age: null },
    { userId: "stefan_palsson", name: "Stefan", role: "parent", age: null }
  ],

  // Timing
  startedAt: "2025-10-20T16:00:00Z",
  completedAt: "2025-10-20T16:35:00Z",
  totalDuration: 2100,       // seconds

  // Questions & Responses
  responses: [
    {
      questionNumber: 1,
      questionText: "Walk me through your morning routine - what are you thinking about before anyone else wakes up?",
      questionType: "base",

      // Speaker-identified responses
      turns: [
        {
          speaker: {
            userId: "kimberly_palsson",
            name: "Kimberly",
            role: "parent",
            isParent: true
          },
          transcript: "I wake up around 5:30am and immediately start thinking about what everyone needs for the day. Did I pack Lillian's volleyball gear? Does Oly have her science project? What's for dinner tonight?",
          confidence: 0.92,       // speaker detection confidence
          detectionMethod: "auto_high_confidence",
          timestamp: "2025-10-20T16:02:15Z",
          audioFile: "gs://parentload-audio/kimberly_turn_1.wav",

          // AI analysis (optional)
          emotionalMarkers: ["stress", "anticipation", "mental_load"],
          keyThemes: ["invisible_work", "morning_planning", "children_needs"]
        },
        {
          speaker: {
            userId: "stefan_palsson",
            name: "Stefan",
            role: "parent",
            isParent: true
          },
          transcript: "I usually sleep until the alarm goes off. I don't really think about the day until I'm getting ready.",
          confidence: 0.87,
          detectionMethod: "auto_high_confidence",
          timestamp: "2025-10-20T16:02:45Z",

          emotionalMarkers: ["oblivious", "relaxed"],
          keyThemes: ["reactive_vs_proactive", "planning_gap"]
        }
      ],

      // Follow-up triggered
      followUpTriggered: true,
      followUpQuestion: "It sounds like that creates some stress for you. Can you tell me more about what that feels like?",
      followUpReason: "stress marker detected"
    }
    // ... 8-12 questions per interview
  ],

  // Metadata
  metadata: {
    interviewTitle: "Discovering Invisible Work Patterns",
    estimatedDuration: 30,   // minutes
    participantCount: 2,
    totalTurns: 47,          // number of times someone spoke
    averageTurnLength: 85,   // words
    interruptionCount: 3     // times someone interrupted
  }
}
```

#### Interview Insights (extracted by AI)
```javascript
{
  familyId: "palsson_family",
  interviewId: "interview_1729436400000_invisible_work_discovery_palsson_family",

  // Extracted patterns
  invisibleWorkPatterns: {
    primary_planner: "Kimberly",
    planning_activities: [
      "Morning routine coordination",
      "Meal planning",
      "Activity scheduling",
      "Anticipating needs"
    ],

    mental_load_indicators: [
      "Wakes up early thinking about family needs",
      "Tracks multiple children's schedules mentally",
      "Worries about forgotten tasks"
    ],

    imbalance_severity: "high",
    quote: "I wake up around 5:30am and immediately start thinking about what everyone needs for the day"
  },

  // Stress capacity (for parent or child interviews)
  stressCapacityData: {
    stressTriggers: ["busy mornings", "schedule conflicts", "forgotten items"],
    copingMechanisms: ["early wake-up", "list-making", "mental rehearsal"],
    supportNeeds: ["more planning help from partner", "shared calendar"],
    resilience_level: "moderate"
  },

  // Decision-making styles
  decisionMakingStyles: {
    Kimberly: {
      style: "proactive_planner",
      ownership: ["children schedules", "household planning", "meals"],
      frustrations: ["partner doesn't anticipate", "solo decision burden"]
    },
    Stefan: {
      style: "reactive_executor",
      ownership: ["home repairs", "technology", "weekend activities"],
      frustrations: ["feels out of the loop", "wants more involvement"]
    },

    conflict_areas: ["schedule planning", "meal decisions"],
    agreement_areas: ["kids' education", "financial decisions"]
  },

  // Relationship to create in Knowledge Graph
  graphRelationships: [
    {
      type: "ANTICIPATES",
      from: "kimberly_palsson",
      properties: {
        categories: ["morning_routine", "children_needs", "meals"],
        leadTime: "1+ days",
        emotionalLoad: "high",
        frequency: "daily"
      }
    },
    {
      type: "EXECUTES",
      from: "stefan_palsson",
      properties: {
        categories: ["home_repairs", "technology"],
        style: "reactive",
        frequency: "as_needed"
      }
    }
  ],

  extractedAt: "2025-10-20T16:40:00Z",
  extractedBy: "claude-opus-4-1"
}
```

---

### 1.3 Habit Data (Behavior Change Tracking)

**Collection Method:** `HabitGenerationService.js`, `FamilyHabitsView.jsx`

**Data Points Collected:**

#### Selected Habit Data
```javascript
{
  habitId: "habit_stefan_school_monitoring",
  familyId: "palsson_family",
  assignedTo: "stefan_palsson",

  // Habit definition
  title: "Monitor Lillian's School Performance",
  description: "Check homework completion and communicate with teachers",
  category: "Invisible Parental Tasks",

  // Target behavior
  targetBehavior: {
    action: "Check Lillian's planner and email teacher",
    frequency: "3x per week",
    duration: "15 minutes",
    timeOfDay: "evening"
  },

  // Metrics to improve
  targetMetric: {
    type: "cognitive_load_reduction",
    for: "kimberly_palsson",
    currentLoad: 41,
    goalLoad: 32,            // reduce by 22%
    expectedReduction: 9     // points
  },

  // Source data (why this habit was suggested)
  generatedFrom: {
    surveyData: {
      imbalanceCategory: "Invisible Parental Tasks",
      mamaPercentage: 90,
      papaPercentage: 10,
      severity: "severe"
    },
    interviewData: {
      interviewId: "interview_1729436400000_invisible_work_discovery_palsson_family",
      quote: "I'm the only one who tracks if homework is done or communicates with teachers"
    }
  },

  // Practice tracking
  practiceSchedule: {
    startDate: "2025-10-21",
    endDate: "2025-11-18",   // 4 weeks
    practiceWeeks: 4,
    requiredCompletions: 12  // 3x/week × 4 weeks
  },

  status: "active" | "completed" | "abandoned",

  createdAt: "2025-10-20T17:00:00Z",
  selectedAt: "2025-10-20T17:05:00Z"
}
```

#### Habit Practice Instances
```javascript
{
  instanceId: "practice_20251022_habit_stefan_school_monitoring",
  habitId: "habit_stefan_school_monitoring",
  familyId: "palsson_family",
  userId: "stefan_palsson",

  // Completion data
  completed: true,
  completedAt: "2025-10-22T19:30:00Z",
  scheduledFor: "2025-10-22",

  // Details
  duration: 12,              // minutes (vs. 15 target)
  difficulty: "medium",      // easy, medium, hard

  // Reflection (optional)
  reflection: {
    whatWentWell: "Found her planner right away, emailed teacher about upcoming project",
    whatWasHard: "Remembering to do it without Kimberly reminding me",
    improvements: "Set phone reminder for Monday/Wednesday/Friday at 7pm",
    confidence: 7             // 1-10 scale
  },

  // Children involved (if applicable)
  childrenInvolved: [
    {
      userId: "lillian_palsson",
      name: "Lillian",
      participation: "high",
      feedback: "Happy dad is checking in on school"
    }
  ],

  // Adherence tracking
  weekNumber: 1,
  completionNumber: 2,       // 2nd completion this week
  onSchedule: true,          // within planned frequency

  // Impact (measured after practice)
  perceivedImpact: {
    kimberlyLoad: "slightly reduced",  // self-reported
    communication: "improved",
    awareness: "much better"
  }
}
```

#### Habit Adherence Summary
```javascript
{
  habitId: "habit_stefan_school_monitoring",
  userId: "stefan_palsson",

  // Overall stats
  totalScheduled: 12,
  totalCompleted: 10,
  adherenceRate: 0.83,       // 83%

  // By week
  weeklyAdherence: [
    { week: 1, scheduled: 3, completed: 3, rate: 1.0 },
    { week: 2, scheduled: 3, completed: 2, rate: 0.67 },
    { week: 3, scheduled: 3, completed: 3, rate: 1.0 },
    { week: 4, scheduled: 3, completed: 2, rate: 0.67 }
  ],

  // Difficulty trend
  difficultyTrend: [
    { week: 1, avgDifficulty: "medium" },
    { week: 2, avgDifficulty: "medium" },
    { week: 3, avgDifficulty: "easy" },
    { week: 4, avgDifficulty: "easy" }
  ],

  // Impact on balance
  balanceImprovement: {
    before: { Mama: 90, Papa: 10 },
    after: { Mama: 75, Papa: 25 },
    change: +15                // Papa increased 15 percentage points
  },

  // Success indicators
  habitFormed: true,           // adherence > 80% for 3+ weeks
  shouldContinue: true,

  completedAt: "2025-11-18T20:00:00Z"
}
```

---

### 1.4 Re-Assessment Data (Cycle Completion)

**Collection Method:** Same as 1.1 Survey Data, but marked as "re-assessment"

**Data Points Collected:**

#### Re-Assessment Survey (identical structure to initial, plus delta)
```javascript
{
  // Same structure as 1.1, plus:

  surveyType: "re-assessment",
  cycleNumber: 1,
  previousSurveyId: "survey_initial_palsson_family_20251001",

  // Comparison to previous
  delta: {
    overallImbalance: {
      before: 0.46,
      after: 0.32,
      change: -0.14,           // 14% reduction - GOOD!
      improvement: true
    },

    categoryChanges: {
      "Invisible Parental Tasks": {
        before: { Mama: 90, Papa: 10 },
        after: { Mama: 75, Papa: 25 },
        change: +15,           // Papa +15 points
        improvement: true
      },
      "Visible Household Tasks": {
        before: { Mama: 65, Papa: 35 },
        after: { Mama: 60, Papa: 40 },
        change: +5,
        improvement: true
      }
      // ... other categories
    },

    // Cognitive load change
    cognitiveLoadChange: {
      Kimberly: { before: 41, after: 32, change: -9, reduction: "22%" },
      Stefan: { before: 15.5, after: 24.5, change: +9, increase: "58%" }
    }
  },

  // Habit impact attribution
  habitImpact: {
    "habit_stefan_school_monitoring": {
      category: "Invisible Parental Tasks",
      estimatedContribution: 0.60,  // 60% of improvement due to this habit
      practiced: true,
      adherenceRate: 0.83
    }
  }
}
```

---

### 1.5 Family Meeting Data (Decisions & Commitments)

**Collection Method:** `EnhancedFamilyMeeting.jsx`, meeting components

**Data Points Collected:**

#### Meeting Session Data
```javascript
{
  meetingId: "meeting_palsson_family_cycle_1",
  familyId: "palsson_family",
  cycleNumber: 1,
  meetingType: "family" | "couple",

  // Attendance
  attendees: [
    { userId: "stefan_palsson", name: "Stefan", role: "parent" },
    { userId: "kimberly_palsson", name: "Kimberly", role: "parent" },
    { userId: "lillian_palsson", name: "Lillian", role: "child", age: 14 },
    { userId: "oly_palsson", name: "Oly", role: "child", age: 11 }
  ],

  // Timing
  scheduledFor: "2025-11-19T19:00:00Z",
  startedAt: "2025-11-19T19:05:00Z",
  completedAt: "2025-11-19T19:42:00Z",
  duration: 2220,            // seconds (37 minutes)

  // Agenda & Discussion
  agenda: [
    {
      item: "Review Survey Results",
      duration: 10,          // minutes
      completed: true
    },
    {
      item: "Discuss Habit Progress",
      duration: 8,
      completed: true
    },
    {
      item: "Plan Next Cycle",
      duration: 12,
      completed: true
    },
    {
      item: "Family Appreciation",
      duration: 7,
      completed: true
    }
  ],

  // Decisions made
  decisions: [
    {
      decision: "Stefan will continue school monitoring habit",
      decidedBy: "consensus",
      supporters: ["stefan_palsson", "kimberly_palsson"],
      impact: "habit_continuation",
      relatedHabit: "habit_stefan_school_monitoring"
    },
    {
      decision: "Add new habit: Stefan handles Monday breakfast",
      decidedBy: "kimberly_palsson",
      supporters: ["stefan_palsson", "lillian_palsson", "oly_palsson"],
      impact: "new_habit",
      category: "Visible Household Tasks"
    },
    {
      decision: "Family will try 'no phone dinner' 3x/week",
      decidedBy: "consensus",
      supporters: ["all"],
      impact: "family_rule",
      category: "Relationship Health"
    }
  ],

  // Commitments (for next cycle)
  commitments: [
    {
      commitment: "Stefan: School monitoring 3x/week",
      assignedTo: "stefan_palsson",
      dueDate: "2025-12-17",   // next cycle end
      relatedDecision: "Stefan will continue school monitoring habit",
      trackingMethod: "habit_instance"
    },
    {
      commitment: "Stefan: Monday breakfast every week",
      assignedTo: "stefan_palsson",
      dueDate: "2025-12-17",
      relatedDecision: "Add new habit: Stefan handles Monday breakfast",
      trackingMethod: "habit_instance"
    },
    {
      commitment: "Everyone: No phones at dinner Mon/Wed/Fri",
      assignedTo: "all",
      dueDate: "2025-12-17",
      relatedDecision: "Family will try 'no phone dinner' 3x/week",
      trackingMethod: "manual_check_in"
    }
  ],

  // Appreciation shared
  appreciations: [
    {
      from: "kimberly_palsson",
      to: "stefan_palsson",
      message: "Thank you for taking on school monitoring. It's made a huge difference.",
      category: "habit_effort"
    },
    {
      from: "lillian_palsson",
      to: "kimberly_palsson",
      message: "Thanks for always making sure I have what I need for volleyball",
      category: "invisible_work"
    }
  ],

  // Mood & Satisfaction
  meetingMood: "positive",
  satisfactionRating: {
    stefan_palsson: 9,       // 1-10
    kimberly_palsson: 10,
    lillian_palsson: 8,
    oly_palsson: 7
  },

  // Notes
  notes: "Great energy tonight. Kids were engaged. Stefan's habit is really working!",

  // Next steps
  nextMeeting: {
    scheduledFor: "2025-12-17T19:00:00Z",
    agenda: ["Review Cycle 2 survey", "Check commitment adherence"]
  },

  status: "completed"
}
```

---

### 1.6 Cycle Journey Metadata (Progress Tracking)

**Collection Method:** `OptimizedCycleJourney.jsx`, `FamilyContext.js`

**Data Points Collected:**

#### Cycle Data (per family)
```javascript
{
  familyId: "palsson_family",
  currentCycle: 2,
  cycleType: "family" | "relationship",

  // Cycle 1 (completed)
  cycles: {
    1: {
      cycleNumber: 1,
      startDate: "2025-10-01",
      endDate: "2025-11-19",
      dueDate: "2025-11-19",
      duration: 49,          // days

      // Step completion
      stepComplete: {
        1: true,             // Habits practiced
        2: true,             // Re-assessment survey completed
        3: true              // Family meeting completed
      },

      // Completion timestamps
      step1CompletedAt: "2025-11-15T20:00:00Z",
      step2CompletedAt: "2025-11-18T15:30:00Z",
      step3CompletedAt: "2025-11-19T19:42:00Z",

      // Member progress
      memberProgress: {
        stefan_palsson: {
          step: 3,
          completedHabit: true,
          completedSurvey: true,
          completedMeeting: true,
          habitAdherence: 0.83
        },
        kimberly_palsson: {
          step: 3,
          completedHabit: true,
          completedSurvey: true,
          completedMeeting: true,
          habitAdherence: 0.92
        },
        lillian_palsson: {
          step: 3,
          completedHabit: true,
          completedSurvey: true,
          completedMeeting: true,
          habitAdherence: 0.75
        },
        oly_palsson: {
          step: 3,
          completedHabit: true,
          completedSurvey: true,
          completedMeeting: true,
          habitAdherence: 0.67
        }
      },

      // Outcomes
      outcomes: {
        imbalanceReduction: 0.14,     // 14% improvement
        habitsCompleted: 2,
        newHabitsSelected: 1,
        familyMeetingRating: 8.5,     // average
        cycleSuccess: true
      },

      // Linked data
      initialSurveyId: "survey_initial_palsson_family_20251001",
      reassessmentSurveyId: "survey_reassessment_palsson_family_20251118",
      meetingId: "meeting_palsson_family_cycle_1",
      habitIds: ["habit_stefan_school_monitoring"],

      status: "completed",
      completedAt: "2025-11-19T19:42:00Z"
    },

    2: {
      cycleNumber: 2,
      startDate: "2025-11-20",
      dueDate: "2026-01-08",
      duration: null,        // in progress

      stepComplete: {
        1: false,            // practicing new habit
        2: false,
        3: false
      },

      memberProgress: {
        // ... in progress
      },

      status: "active"
    }
  },

  // Historical summary
  totalCyclesCompleted: 1,
  averageCycleDuration: 49,
  overallImbalanceImprovement: 0.14,
  totalHabitsCompleted: 2,

  lastUpdated: "2025-11-20T10:00:00Z"
}
```

---

## Part 2: The Two Critical Algorithms

### 2.1 ELO Rating System (Survey Processing)

**Purpose:** Calculate relative "ownership" of tasks/categories between Mama and Papa using chess-style ratings

**File:** `/src/services/ELORatingService.js`

#### Algorithm Details

**Core Parameters:**
```javascript
K_FACTOR = 32                 // Standard ELO K-factor (how much ratings can change)
INITIAL_RATING = 1500         // Starting rating for everyone
INITIAL_UNCERTAINTY = 350     // High initial uncertainty
MIN_UNCERTAINTY = 50          // Minimum after many matches
UNCERTAINTY_DECAY = 0.95      // Reduces by 5% each match
```

**Step 1: Calculate Expected Scores**
```javascript
expectedA = 1 / (1 + 10^((ratingB - ratingA) / 400))
expectedB = 1 - expectedA

Example:
  Mama rating: 1600
  Papa rating: 1400
  expectedA = 1 / (1 + 10^((1400 - 1600) / 400))
            = 1 / (1 + 10^(-0.5))
            = 1 / (1 + 0.316)
            = 0.76  (Mama expected to "win" 76% of the time)
  expectedB = 0.24  (Papa expected to "win" 24% of the time)
```

**Step 2: Calculate Weight Multiplier (NEW - uses task weight)**
```javascript
AVERAGE_WEIGHT = 5
weightMultiplier = min(2.5, max(0.4, taskWeight / AVERAGE_WEIGHT))

Example:
  taskWeight = 7.2 (from 7-factor algorithm)
  weightMultiplier = 7.2 / 5 = 1.44

  Capped: min(2.5, max(0.4, 1.44)) = 1.44
```

**Step 3: Calculate Dynamic K-Factor**
```javascript
kFactorA = K_FACTOR × (uncertaintyA / 100) × weightMultiplier
kFactorB = K_FACTOR × (uncertaintyB / 100) × weightMultiplier

Example:
  uncertaintyA = 125 (Mama has answered ~15 questions, uncertainty reduced from 350)
  uncertaintyB = 125
  weightMultiplier = 1.44

  kFactorA = 32 × (125 / 100) × 1.44 = 57.6
  kFactorB = 32 × (125 / 100) × 1.44 = 57.6
```

**Step 4: Determine Match Result**
```javascript
if (response === 'Mama') result = 1.0
if (response === 'Papa') result = 0.0
if (response === 'Both' or 'Draw') result = 0.5
```

**Step 5: Calculate New Ratings**
```javascript
newRatingA = ratingA + kFactorA × (result - expectedA)
newRatingB = ratingB + kFactorB × ((1 - result) - expectedB)

Example (Mama wins):
  ratingA = 1600, expectedA = 0.76, result = 1.0, kFactorA = 57.6
  newRatingA = 1600 + 57.6 × (1.0 - 0.76)
             = 1600 + 57.6 × 0.24
             = 1600 + 13.8
             = 1614  (Mama +14 points)

  ratingB = 1400, expectedB = 0.24, result = 0.0, kFactorB = 57.6
  newRatingB = 1400 + 57.6 × (0.0 - 0.24)
             = 1400 + 57.6 × (-0.24)
             = 1400 - 13.8
             = 1386  (Papa -14 points)
```

**Step 6: Reduce Uncertainty**
```javascript
newUncertaintyA = max(MIN_UNCERTAINTY, uncertaintyA × UNCERTAINTY_DECAY)
newUncertaintyB = max(MIN_UNCERTAINTY, uncertaintyB × UNCERTAINTY_DECAY)

Example:
  uncertaintyA = 125
  newUncertaintyA = max(50, 125 × 0.95) = max(50, 118.75) = 119
```

#### How Task Weight Affects ELO

**Without Task Weight (old system):**
- All questions worth the same
- "Who takes out trash?" = "Who plans family's future?" in terms of rating change
- Imbalance masked by counting quantity, not quality

**With Task Weight (new system):**
- High-weight questions (7+ points) cause larger rating swings
- Low-weight questions (2-3 points) cause smaller rating swings
- Reflects true burden: mental load > physical tasks

**Example Impact:**

```javascript
Question 1: "Who takes out trash?" (weight = 3.2)
  Mama wins
  weightMultiplier = 3.2 / 5 = 0.64
  kFactorA = 32 × 1.25 × 0.64 = 25.6
  Rating change: ~6 points

Question 2: "Who plans children's future education?" (weight = 10.8)
  Mama wins
  weightMultiplier = 10.8 / 5 = 2.16
  kFactorA = 32 × 1.25 × 2.16 = 86.4
  Rating change: ~20 points

Result: Question 2 has 3.3x more impact on ratings, reflecting its higher cognitive/emotional load!
```

#### Three-Level Tracking

**1. Global Ratings:** Overall workload across all categories
**2. Category Ratings:** Workload within each category (Visible Household, etc.)
**3. Task Ratings:** Individual task ownership (meal planning, floor cleaning, etc.)

All three use the same algorithm with independent tracking.

---

### 2.2 Seven-Factor Task Weight Algorithm

**Purpose:** Calculate the true "burden" of each household task based on research + family context

**File:** `/src/utils/TaskWeightCalculator.js`

#### The 7 Factors

**Formula:**
```javascript
totalWeight = baseWeight ×
              frequencyMultiplier ×
              invisibilityMultiplier ×
              emotionalLaborMultiplier ×
              researchImpactMultiplier ×
              childDevelopmentMultiplier ×
              priorityMultiplier
```

#### Factor 1: Base Weight
**Range:** 1-5 (typically 3)
**Purpose:** Inherent difficulty/time of task
**Values:**
- 1 = Very quick/easy (take out trash)
- 2 = Quick/easy (wipe counters)
- 3 = Moderate (cook dinner, schedule appointment)
- 4 = Involved (deep clean, plan vacation)
- 5 = Complex (financial planning, educational decisions)

#### Factor 2: Frequency
**Purpose:** How often the task recurs (daily tasks wear you down)
**Multipliers:**
```javascript
"daily":      1.5x  // Every day
"several":    1.3x  // Several times per week
"weekly":     1.2x  // Once per week
"monthly":    1.0x  // Once per month (baseline)
"quarterly":  0.8x  // 3-4 times per year
```

**Research Basis:** Carlson et al. 2020 - "Routine housework tasks are at the center of gender inequality"

#### Factor 3: Invisibility
**Purpose:** How hidden the work is (invisible work causes resentment)
**Multipliers:**
```javascript
"highly":     1.0x  // Everyone sees it (mowing lawn)
"partially":  1.2x  // Somewhat visible (cooking - people see meal, not planning)
"mostly":     1.35x // Mostly hidden (scheduling appointments - no one sees the calls/emails)
"completely": 1.5x  // Totally invisible (anticipating needs, worrying)
```

**Research Basis:** Daminger 2019 - "Cognitive dimension of household labor"; DeGroot & Vik 2020 - "Mental labor is exhausting, frustrating"

#### Factor 4: Emotional Labor
**Purpose:** Emotional regulation, empathy, relationship management required
**Multipliers:**
```javascript
"minimal":  1.0x  // No emotional work (folding laundry)
"low":      1.1x  // Slight emotional work (coordinating schedules)
"moderate": 1.2x  // Some emotional work (comforting upset child)
"high":     1.3x  // Significant emotional work (mediating sibling conflict)
"extreme":  1.4x  // Intense emotional work (managing partner's stress, supporting depressed child)
```

**Research Basis:** DeGroot & Vik 2020 - "Emotional labor significantly impacts well-being"

#### Factor 5: Research Impact
**Purpose:** Does research show this task causes relationship strain?
**Multipliers:**
```javascript
"high":     1.3x  // Daily repetitive tasks (dishes, meal planning) - Carlson 2020
"medium":   1.15x // Invisible/intermittent tasks - DeGroot 2020
"standard": 1.0x  // Gender-neutral tasks, less conflict
```

**Automatically determined from task description + category using research mapping:**
```javascript
// From ResearchBackedTaskImpact.js
HIGH_IMPACT_TASKS = [
  "Daily Cooking and Meal Preparation",
  "Daily Cleaning and Tidying",
  "Laundry and Clothing Management",
  "Dishes and Kitchen Cleanup",
  "Mental Load - Planning and Organizing",
  "Mental Load - Scheduling and Coordination",
  "Mental Load - Anticipating Family Needs",
  "Daily Childcare Routines",
  "Nighttime Parenting Duties"
  // ... 20+ tasks identified by research
]
```

#### Factor 6: Child Development Impact
**Purpose:** How much does this task affect children's development?
**Multipliers:**
```javascript
"high":     1.25x // Direct impact (teaching life skills, emotional support, education planning)
"moderate": 1.15x // Indirect impact (creating stable routines, providing healthy meals)
"limited":  1.0x  // Minimal impact (adult-focused tasks like lawn care)
```

**Why it matters:** Tasks that shape children's future deserve higher weight in family prioritization

#### Factor 7: Family Priority
**Purpose:** What did the family choose to prioritize? (customization)
**Multipliers:**
```javascript
"highest":   1.5x  // Family's #1 priority category
"secondary": 1.3x  // Family's #2 priority
"tertiary":  1.1x  // Family's #3 priority
"none":      1.0x  // Not prioritized
```

**Example:**
```javascript
familyPriorities = {
  highestPriority: "Invisible Parental Tasks",      // 1.5x
  secondaryPriority: "Visible Parental Tasks",      // 1.3x
  tertiaryPriority: "Invisible Household Tasks"     // 1.1x
}
```

---

### Real-World Examples

#### Example 1: "Who plans meals for the week?"

```javascript
baseWeight: 3              // Moderate complexity
frequency: "weekly"        // 1.2x (happens once per week)
invisibility: "mostly"     // 1.35x (people see meals, not the planning)
emotionalLabor: "moderate" // 1.2x (considering preferences, nutrition, schedules)
researchImpact: "high"     // 1.3x (mental load research - Daminger 2019)
childDevelopment: "moderate" // 1.15x (nutrition affects development)
priority: "tertiary"       // 1.1x (Invisible Household Tasks is #3 priority)

totalWeight = 3 × 1.2 × 1.35 × 1.2 × 1.3 × 1.15 × 1.1
            = 3 × 2.827
            = 8.48

Result: Weight = 8.5 (high burden task)
```

#### Example 2: "Who takes out the trash?"

```javascript
baseWeight: 1              // Very simple
frequency: "several"       // 1.3x (2-3x per week)
invisibility: "highly"     // 1.0x (everyone sees the trash)
emotionalLabor: "minimal"  // 1.0x (no emotional work)
researchImpact: "standard" // 1.0x (not a high-conflict task)
childDevelopment: "limited" // 1.0x (minimal impact)
priority: "none"           // 1.0x (Visible Household not prioritized)

totalWeight = 1 × 1.3 × 1.0 × 1.0 × 1.0 × 1.0 × 1.0
            = 1.3

Result: Weight = 1.3 (low burden task)
```

#### Example 3: "Who monitors children's emotional wellbeing?"

```javascript
baseWeight: 5              // Very complex
frequency: "daily"         // 1.5x (constant awareness)
invisibility: "completely" // 1.5x (totally invisible work)
emotionalLabor: "extreme"  // 1.4x (high emotional regulation required)
researchImpact: "high"     // 1.3x (mental load - anticipating needs)
childDevelopment: "high"   // 1.25x (critical for development)
priority: "highest"        // 1.5x (Invisible Parental Tasks is #1)

totalWeight = 5 × 1.5 × 1.5 × 1.4 × 1.3 × 1.25 × 1.5
            = 5 × 12.29
            = 61.5  (capped at reasonable max ~15-20 in practice)

Result: Weight = 15.0+ (extremely high burden - one of the heaviest tasks)
```

---

### How the Algorithms Work Together

**Flow:**
1. User answers survey question: "Who monitors children's emotional wellbeing?" → "Mama"
2. 7-factor algorithm calculates: weight = 15.2
3. ELO algorithm processes:
   - Uses weight to boost K-factor: `kFactor = 32 × 1.25 × (15.2 / 5) = 121.6`
   - Mama's rating increases significantly: +29 points
   - Papa's rating decreases significantly: -29 points
4. After 72 questions, ratings reflect TRUE burden distribution:
   - Mama: 1687 (high burden)
   - Papa: 1313 (lower burden)
   - Rating gap of 374 points = severe imbalance (not just counting who does what!)

**Stored in Neo4j as:**
```cypher
MATCH (m:Person {userId: 'kimberly_palsson'})
SET m.cognitiveLoad = 0.73,
    m.eloRating = 1687,
    m.invisibleLaborScore = 85

MATCH (p:Person {userId: 'stefan_palsson'})
SET p.cognitiveLoad = 0.27,
    p.eloRating = 1313,
    p.invisibleLaborScore = 35
```

---

## Summary: Complete Data Inventory

### Flow 1 Collects 8 Major Data Types:

1. **Survey Responses** (72 questions × 2+ parents = 144+ data points)
   - Question responses, task weights, ELO ratings, balance scores

2. **ELO Ratings** (3 levels × 4 categories = 12+ rating entities per family)
   - Global, category, and task-level ratings with uncertainty tracking

3. **Interview Transcripts** (5 types × 10-15 questions = 50-75 qualitative insights)
   - Speaker-identified responses, emotional markers, pattern extraction

4. **Habit Practice Data** (1-3 habits × 4 weeks × 3 instances/week = 12-36 completions)
   - Adherence tracking, difficulty ratings, impact reflections

5. **Re-Assessment Surveys** (same 72 questions + delta calculations)
   - Before/after comparison, improvement measurement, habit attribution

6. **Family Meeting Records** (1 per cycle)
   - Decisions, commitments, appreciations, satisfaction ratings

7. **Cycle Journey Metadata** (per family)
   - Step completion, member progress, outcomes, historical trends

8. **Family Priorities** (set once, used throughout)
   - Category prioritization affecting task weight calculations

### Total Data Points Per Cycle:

**Initial:**
- Survey: 144 responses × 10+ fields = 1,440+ data points
- ELO: 12 ratings × 15 fields = 180 data points
- Interview: 50 responses × 8 fields = 400 data points
- Habit selection: 3 habits × 12 fields = 36 data points

**Throughout Cycle:**
- Habit practice: 36 instances × 15 fields = 540 data points

**Re-Assessment:**
- Survey: 144 responses × 10+ fields = 1,440+ data points
- Delta: 5 categories × 10 fields = 50 data points
- Meeting: 1 meeting × 50+ fields = 50+ data points
- Cycle metadata: 1 record × 30 fields = 30 data points

**TOTAL PER CYCLE:** ~4,166 data points collected in Flow 1!

This rich data feeds directly into Flow 2 to power:
- Smart task assignment (use cognitive load)
- Auto-event attendees (use habit patterns)
- Inbox routing (use interview insights)
- Proactive alerts (use ELO imbalances)
- Allie's intelligent suggestions (use all of it!)

---

**Next Step:** Integrate this complete data model into FLOW_CONNECTION_PLAN.md and begin Week 1 implementation (Survey → Neo4j sync)
