# Complete Neo4j Schema for Flow 1 → Knowledge Graph

**Purpose:** Define the complete graph schema to store all 4,166 data points per cycle from Flow 1

**Date:** October 20, 2025

**Reference:** See `FLOW_1_DATA_COMPLETE.md` for source data structures

---

## Schema Design Principles

1. **Multi-tenant isolation:** Every node has `familyId` property
2. **Temporal tracking:** All relationships have `timestamp` property
3. **Provenance:** Track data source (survey, interview, habit, etc.)
4. **Aggregation-friendly:** Enable fast cognitive load calculations
5. **Cypher-optimized:** Structure for common queries (imbalance, patterns, predictions)

---

## Node Types (8 Primary + 3 Supporting = 11 Total)

### 1. Person (Core Identity)

**Purpose:** Family member with aggregated metrics

**Properties:**
```cypher
CREATE (p:Person {
  // Identity
  userId: 'stefan_palsson_agent',          // Firestore user ID
  familyId: 'palsson_family_simulation',    // Multi-tenant isolation
  name: 'Stefan',
  role: 'parent' | 'child',
  age: 42,

  // Computed metrics (updated from survey data)
  cognitiveLoad: 0.27,                      // 0-1 scale (27% of household)
  anticipationScore: 2,                     // Count of anticipation tasks
  monitoringScore: 1,                       // Count of monitoring tasks
  executionScore: 10,                       // Count of execution tasks
  totalLoadScore: 15.5,                     // Weighted: (2×2.0) + (1×1.5) + (10×1.0)

  // ELO ratings
  eloRating: 1313,                          // Global ELO rating
  eloUncertainty: 125,                      // Confidence (350 → 50)
  eloMatchCount: 72,                        // Number of survey questions answered

  // Additional metrics
  invisibleLaborScore: 35,                  // 0-100 scale
  burnoutRisk: 0.15,                        // 0-1 scale (15% risk)

  // Metadata
  createdAt: datetime(),
  lastSurveyDate: datetime('2025-11-18T15:30:00Z'),
  lastUpdated: datetime()
})
```

**Indexes:**
```cypher
CREATE INDEX person_family_id FOR (p:Person) ON (p.familyId);
CREATE INDEX person_user_id FOR (p:Person) ON (p.userId);
CREATE CONSTRAINT unique_person_user FOR (p:Person) REQUIRE p.userId IS UNIQUE;
```

---

### 2. Survey (Assessment Instance)

**Purpose:** Record of a completed survey

**Properties:**
```cypher
CREATE (s:Survey {
  // Identity
  surveyId: 'survey_reassessment_palsson_family_20251118',
  familyId: 'palsson_family_simulation',

  // Type
  surveyType: 'initial' | 'weekly' | 're-assessment',
  cycleNumber: 1,
  weekNumber: 1,                            // For weekly check-ins

  // Completion
  completedAt: datetime('2025-11-18T15:30:00Z'),
  duration: 1200,                           // seconds
  totalQuestions: 72,

  // Metrics (aggregated from responses)
  overallImbalance: 0.32,                   // After this survey
  previousImbalance: 0.46,                  // Before (if re-assessment)
  improvement: 0.14,                        // Change

  // Member participation
  respondents: ['stefan_palsson', 'kimberly_palsson'],
  respondentCount: 2,

  // Source
  generatedBy: 'DynamicSurveyGenerator' | 'StaticQuestions',

  createdAt: datetime()
})
```

**Indexes:**
```cypher
CREATE INDEX survey_family_id FOR (s:Survey) ON (s.familyId);
CREATE INDEX survey_cycle FOR (s:Survey) ON (s.cycleNumber);
```

---

### 3. SurveyResponse (Individual Answer)

**Purpose:** Single question response with weight

**Properties:**
```cypher
CREATE (sr:SurveyResponse {
  // Identity
  responseId: 'response_survey_001_q45_stefan',
  questionId: 'q45',

  // Answer
  answer: 'Mama' | 'Papa' | 'Both' | 'Neither',

  // Question context
  questionText: 'Who monitors children\'s emotional wellbeing?',
  category: 'Invisible Parental Tasks',

  // 7-factor weight inputs
  baseWeight: 5,
  frequency: 'daily',
  invisibility: 'completely',
  emotionalLabor: 'extreme',
  researchImpact: 'high',
  childDevelopment: 'high',
  priority: 'highest',

  // Calculated weight
  totalWeight: 15.2,

  // Timing
  responseTime: 4500,                       // milliseconds to answer
  timestamp: datetime('2025-11-18T15:15:00Z')
})
```

**Indexes:**
```cypher
CREATE INDEX response_question FOR (sr:SurveyResponse) ON (sr.questionId);
CREATE INDEX response_category FOR (sr:SurveyResponse) ON (sr.category);
```

---

### 4. ELORating (Rating Snapshot)

**Purpose:** Historical ELO rating record

**Properties:**
```cypher
CREATE (er:ELORating {
  // Identity
  ratingId: 'elo_palsson_family_category_invisible_parental_20251118',
  familyId: 'palsson_family_simulation',

  // Scope
  ratingType: 'global' | 'category' | 'task',
  category: 'Invisible Parental Tasks',    // For category/task ratings
  taskName: 'Monitor emotional wellbeing', // For task ratings

  // Ratings
  mamaRating: 1875,
  papaRating: 1125,
  ratingGap: 750,                           // Absolute difference

  // Uncertainty
  mamaUncertainty: 110,
  papaUncertainty: 110,

  // Match count
  mamaMatchCount: 18,
  papaMatchCount: 18,

  // Imbalance metrics
  imbalanceScore: 750,                      // Rating gap
  imbalanceSeverity: 'severe',              // mild, moderate, severe
  confidence: 0.69,                         // 1 - (avgUncertainty / 350)

  // Metadata
  snapshotDate: datetime('2025-11-18T15:45:00Z'),
  createdAt: datetime()
})
```

**Indexes:**
```cypher
CREATE INDEX elo_family FOR (er:ELORating) ON (er.familyId);
CREATE INDEX elo_type FOR (er:ELORating) ON (er.ratingType);
CREATE INDEX elo_category FOR (er:ELORating) ON (er.category);
```

---

### 5. Interview (Qualitative Session)

**Purpose:** Interview session record

**Properties:**
```cypher
CREATE (i:Interview {
  // Identity
  interviewId: 'interview_1729436400000_invisible_work_discovery_palsson_family',
  familyId: 'palsson_family_simulation',

  // Type
  interviewType: 'invisible_work_discovery' | 'stress_capacity' |
                 'decision_making_styles' | 'family_rules_archaeology' |
                 'future_selves_visioning',

  // Participants
  conductedBy: 'kimberly_palsson',
  participantIds: ['kimberly_palsson', 'stefan_palsson'],
  participantCount: 2,

  // Timing
  startedAt: datetime('2025-10-20T16:00:00Z'),
  completedAt: datetime('2025-10-20T16:35:00Z'),
  duration: 2100,                           // seconds

  // Content
  questionCount: 10,
  turnCount: 47,                            // Number of speaking turns
  totalWords: 3995,

  // Status
  status: 'completed',

  // Analysis (from Claude extraction)
  primaryInsight: 'Kimberly handles 90% of invisible planning work',
  emotionalMarkers: ['stress', 'anticipation', 'overwhelm'],
  keyThemes: ['invisible_work', 'planning_gap', 'communication'],

  createdAt: datetime()
})
```

**Indexes:**
```cypher
CREATE INDEX interview_family FOR (i:Interview) ON (i.familyId);
CREATE INDEX interview_type FOR (i:Interview) ON (i.interviewType);
```

---

### 6. InterviewResponse (Turn in conversation)

**Purpose:** Individual speaking turn with speaker identification

**Properties:**
```cypher
CREATE (ir:InterviewResponse {
  // Identity
  responseId: 'turn_interview_001_01',
  turnNumber: 1,

  // Speaker
  speakerId: 'kimberly_palsson',
  speakerName: 'Kimberly',
  speakerRole: 'parent',

  // Speaker detection
  confidence: 0.92,
  detectionMethod: 'auto_high_confidence' | 'manual_selection' | 'voice_enrollment',

  // Content
  questionText: 'Walk me through your morning routine...',
  transcript: 'I wake up around 5:30am and immediately start thinking...',
  wordCount: 85,

  // AI analysis
  emotionalMarkers: ['stress', 'anticipation'],
  keyThemes: ['invisible_work', 'morning_planning'],

  // Audio
  audioFile: 'gs://parentload-audio/kimberly_turn_1.wav',

  // Timing
  timestamp: datetime('2025-10-20T16:02:15Z')
})
```

---

### 7. Habit (Behavior Change Goal)

**Purpose:** Selected habit to practice

**Properties:**
```cypher
CREATE (h:Habit {
  // Identity
  habitId: 'habit_stefan_school_monitoring',
  familyId: 'palsson_family_simulation',

  // Assignment
  assignedTo: 'stefan_palsson',

  // Definition
  title: 'Monitor Lillian\'s School Performance',
  description: 'Check homework completion and communicate with teachers',
  category: 'Invisible Parental Tasks',

  // Target
  targetAction: 'Check Lillian\'s planner and email teacher',
  targetFrequency: '3x per week',
  targetDuration: 15,                       // minutes

  // Impact goal
  targetMetricType: 'cognitive_load_reduction',
  targetPerson: 'kimberly_palsson',
  currentLoad: 41,
  goalLoad: 32,
  expectedReduction: 9,

  // Practice schedule
  startDate: date('2025-10-21'),
  endDate: date('2025-11-18'),
  practiceWeeks: 4,
  requiredCompletions: 12,

  // Status
  status: 'active' | 'completed' | 'abandoned',

  // Source (why suggested)
  generatedFromSurveyImbalance: 0.80,       // 80% imbalance in category
  generatedFromInterviewId: 'interview_001',

  createdAt: datetime(),
  completedAt: datetime('2025-11-18T20:00:00Z')
})
```

**Indexes:**
```cypher
CREATE INDEX habit_family FOR (h:Habit) ON (h.familyId);
CREATE INDEX habit_assigned FOR (h:Habit) ON (h.assignedTo);
CREATE INDEX habit_status FOR (h:Habit) ON (h.status);
```

---

### 8. HabitInstance (Practice Completion)

**Purpose:** Single habit practice event

**Properties:**
```cypher
CREATE (hi:HabitInstance {
  // Identity
  instanceId: 'practice_20251022_habit_stefan_school_monitoring',

  // Completion
  completed: true,
  completedAt: datetime('2025-10-22T19:30:00Z'),
  scheduledFor: date('2025-10-22'),

  // Details
  duration: 12,                             // minutes (vs 15 target)
  difficulty: 'medium',                     // easy, medium, hard

  // Reflection
  whatWentWell: 'Found her planner right away...',
  whatWasHard: 'Remembering to do it without reminder',
  improvements: 'Set phone reminder for Mon/Wed/Fri at 7pm',
  confidence: 7,                            // 1-10

  // Children involved
  childrenInvolved: ['lillian_palsson'],
  childParticipation: 'high',

  // Impact
  perceivedImpact: 'slight_reduction',      // kimberly's load

  // Adherence
  weekNumber: 1,
  completionNumber: 2,                      // 2nd this week
  onSchedule: true
})
```

---

### 9. FamilyMeeting (Decision Record)

**Purpose:** Family meeting with decisions

**Properties:**
```cypher
CREATE (fm:FamilyMeeting {
  // Identity
  meetingId: 'meeting_palsson_family_cycle_1',
  familyId: 'palsson_family_simulation',

  // Type
  meetingType: 'family' | 'couple',
  cycleNumber: 1,

  // Attendance
  attendeeIds: ['stefan_palsson', 'kimberly_palsson', 'lillian_palsson', 'oly_palsson'],
  attendeeCount: 4,

  // Timing
  scheduledFor: datetime('2025-11-19T19:00:00Z'),
  startedAt: datetime('2025-11-19T19:05:00Z'),
  completedAt: datetime('2025-11-19T19:42:00Z'),
  duration: 2220,                           // seconds

  // Outcomes
  decisionCount: 3,
  commitmentCount: 3,
  appreciationCount: 2,

  // Mood
  meetingMood: 'positive',
  avgSatisfaction: 8.5,                     // 1-10

  // Content
  notes: 'Great energy tonight. Kids were engaged...',

  // Status
  status: 'completed',

  createdAt: datetime()
})
```

---

### 10. Cycle (Journey Progress)

**Purpose:** Cycle completion tracking

**Properties:**
```cypher
CREATE (c:Cycle {
  // Identity
  cycleId: 'cycle_palsson_family_1',
  familyId: 'palsson_family_simulation',
  cycleNumber: 1,

  // Type
  cycleType: 'family' | 'relationship',

  // Timing
  startDate: date('2025-10-01'),
  endDate: date('2025-11-19'),
  dueDate: date('2025-11-19'),
  duration: 49,                             // days

  // Progress
  step1Complete: true,
  step2Complete: true,
  step3Complete: true,

  step1CompletedAt: datetime('2025-11-15T20:00:00Z'),
  step2CompletedAt: datetime('2025-11-18T15:30:00Z'),
  step3CompletedAt: datetime('2025-11-19T19:42:00Z'),

  // Outcomes
  imbalanceReduction: 0.14,                 // 14% improvement
  habitsCompleted: 2,
  newHabitsSelected: 1,
  familyMeetingRating: 8.5,
  cycleSuccess: true,

  // Member completion
  memberCompletionRate: 1.0,                // 100% (all members completed)

  // Status
  status: 'completed',

  createdAt: datetime(),
  completedAt: datetime('2025-11-19T19:42:00Z')
})
```

---

### 11. Task (Flow 2 entity - for reference)

**Purpose:** Task from task board (Flow 2)

**Properties:**
```cypher
CREATE (t:Task {
  // Identity
  taskId: 'task_buy_groceries_001',
  familyId: 'palsson_family_simulation',

  // Content
  title: 'Buy groceries for the week',
  description: 'Need milk, eggs, bread...',
  category: 'Household',

  // Assignment
  assignedTo: 'stefan_palsson',             // Suggested by cognitive load
  createdBy: 'kimberly_palsson',

  // Status
  status: 'todo' | 'in_progress' | 'done',
  column: 'todo',
  priority: 'high',

  // Timing
  dueDate: datetime('2025-10-23T18:00:00Z'),
  createdAt: datetime('2025-10-20T10:00:00Z'),
  completedAt: datetime()
})
```

**Note:** Tasks are created in Firestore and synced to Neo4j via existing `syncTaskToNeo4j` Cloud Function

---

## Relationship Types (20+ Critical Paths)

### Survey Relationships

#### 1. Person -[:COMPLETED]-> Survey
**Purpose:** Track who completed which surveys
```cypher
MERGE (p:Person {userId: $userId})-[:COMPLETED {
  timestamp: datetime(),
  duration: 1200,                           // seconds
  responseCount: 72
}]->(s:Survey {surveyId: $surveyId})
```

#### 2. Survey -[:CONTAINS]-> SurveyResponse
**Purpose:** Link responses to survey
```cypher
MERGE (s:Survey {surveyId: $surveyId})-[:CONTAINS]->(sr:SurveyResponse {responseId: $responseId})
```

#### 3. SurveyResponse -[:ANSWERED_BY]-> Person
**Purpose:** Track who gave each answer
```cypher
MERGE (sr:SurveyResponse {responseId: $responseId})-[:ANSWERED_BY {
  answer: 'Mama',
  timestamp: datetime()
}]->(p:Person {userId: $userId})
```

#### 4. Survey -[:MEASURES]-> Person
**Purpose:** Store calculated metrics (cognitive load, etc.)
```cypher
MERGE (s:Survey {surveyId: $surveyId})-[:MEASURES {
  metricName: 'cognitive_load',
  value: 0.73,
  anticipationScore: 12,
  monitoringScore: 8,
  executionScore: 5,
  totalLoadScore: 41,
  timestamp: datetime()
}]->(p:Person {userId: 'kimberly_palsson'})
```

#### 5. Survey -[:GENERATED_RATING]-> ELORating
**Purpose:** Link survey to ELO rating snapshot
```cypher
MERGE (s:Survey)-[:GENERATED_RATING {
  timestamp: datetime()
}]->(er:ELORating)
```

---

### Interview Relationships

#### 6. Person -[:PARTICIPATED_IN]-> Interview
**Purpose:** Track interview participants
```cypher
MERGE (p:Person {userId: $userId})-[:PARTICIPATED_IN {
  role: 'parent',
  turnCount: 23,                            // How many times they spoke
  wordCount: 1950,
  timestamp: datetime()
}]->(i:Interview {interviewId: $interviewId})
```

#### 7. Interview -[:CONTAINS]-> InterviewResponse
**Purpose:** Link turns to interview
```cypher
MERGE (i:Interview)-[:CONTAINS {
  turnNumber: 1,
  timestamp: datetime()
}]->(ir:InterviewResponse)
```

#### 8. InterviewResponse -[:SPOKEN_BY]-> Person
**Purpose:** Speaker identification
```cypher
MERGE (ir:InterviewResponse)-[:SPOKEN_BY {
  confidence: 0.92,
  detectionMethod: 'auto_high_confidence'
}]->(p:Person {userId: $speakerId})
```

#### 9. Interview -[:REVEALED]-> Pattern (special)
**Purpose:** Extracted insights from interview (stored as properties on relationship)
```cypher
MERGE (i:Interview)-[:REVEALED {
  patternType: 'invisible_work',
  primaryPlanner: 'kimberly_palsson',
  severity: 'high',
  quote: 'I wake up around 5:30am and immediately start thinking...',
  emotionalMarkers: ['stress', 'anticipation'],
  extractedAt: datetime()
}]->(p:Person {userId: 'kimberly_palsson'})
```

---

### Habit Relationships

#### 10. Habit -[:ASSIGNED_TO]-> Person
**Purpose:** Habit ownership
```cypher
MERGE (h:Habit {habitId: $habitId})-[:ASSIGNED_TO {
  assignedAt: datetime(),
  targetReduction: 9,                       // cognitive load points
  startDate: date('2025-10-21')
}]->(p:Person {userId: 'stefan_palsson'})
```

#### 11. Habit -[:TARGETS_IMPROVEMENT_FOR]-> Person
**Purpose:** Who benefits from this habit (usually partner)
```cypher
MERGE (h:Habit)-[:TARGETS_IMPROVEMENT_FOR {
  currentLoad: 41,
  goalLoad: 32,
  expectedReduction: 9
}]->(p:Person {userId: 'kimberly_palsson'})
```

#### 12. Habit -[:GENERATED_FROM_SURVEY]-> Survey
**Purpose:** Provenance - why this habit was suggested
```cypher
MERGE (h:Habit)-[:GENERATED_FROM_SURVEY {
  imbalanceCategory: 'Invisible Parental Tasks',
  imbalanceSeverity: 0.80,
  timestamp: datetime()
}]->(s:Survey)
```

#### 13. Habit -[:GENERATED_FROM_INTERVIEW]-> Interview
**Purpose:** Provenance - interview insight led to habit
```cypher
MERGE (h:Habit)-[:GENERATED_FROM_INTERVIEW {
  insightQuote: 'I\'m the only one who tracks if homework is done',
  timestamp: datetime()
}]->(i:Interview)
```

#### 14. Habit -[:PRACTICED_AS]-> HabitInstance
**Purpose:** Link habit to practice instances
```cypher
MERGE (h:Habit)-[:PRACTICED_AS {
  weekNumber: 1,
  scheduledFor: date('2025-10-22')
}]->(hi:HabitInstance)
```

#### 15. HabitInstance -[:COMPLETED_BY]-> Person
**Purpose:** Who did the practice
```cypher
MERGE (hi:HabitInstance)-[:COMPLETED_BY {
  completedAt: datetime(),
  duration: 12,
  difficulty: 'medium',
  confidence: 7
}]->(p:Person {userId: 'stefan_palsson'})
```

---

### Meeting Relationships

#### 16. FamilyMeeting -[:ATTENDED_BY]-> Person
**Purpose:** Who was at the meeting
```cypher
MERGE (fm:FamilyMeeting)-[:ATTENDED_BY {
  satisfactionRating: 9,                    // 1-10
  participationLevel: 'high',
  timestamp: datetime()
}]->(p:Person)
```

#### 17. FamilyMeeting -[:DECIDED]-> Habit
**Purpose:** Meeting led to habit decision
```cypher
MERGE (fm:FamilyMeeting)-[:DECIDED {
  decision: 'Continue habit',
  decisionType: 'habit_continuation',
  supporters: ['stefan_palsson', 'kimberly_palsson'],
  timestamp: datetime()
}]->(h:Habit)
```

---

### Cycle Relationships

#### 18. Cycle -[:INCLUDES_SURVEY]-> Survey
**Purpose:** Surveys in this cycle
```cypher
MERGE (c:Cycle)-[:INCLUDES_SURVEY {
  surveyType: 'initial' | 're-assessment',
  timestamp: datetime()
}]->(s:Survey)
```

#### 19. Cycle -[:INCLUDES_HABIT]-> Habit
**Purpose:** Habits practiced during cycle
```cypher
MERGE (c:Cycle)-[:INCLUDES_HABIT]->(h:Habit)
```

#### 20. Cycle -[:CONCLUDED_WITH]-> FamilyMeeting
**Purpose:** Meeting that ended the cycle
```cypher
MERGE (c:Cycle)-[:CONCLUDED_WITH]->(fm:FamilyMeeting)
```

---

### Flow 1 → Flow 2 Relationships (Critical!)

#### 21. Person -[:CREATES]-> Task
**Purpose:** Track who creates tasks (anticipation labor)
```cypher
MERGE (p:Person {userId: $createdBy})-[:CREATES {
  timestamp: datetime(),
  leadTime: duration.inDays(datetime(), $dueDate),
  context: 'Noticed while planning week'
}]->(t:Task {taskId: $taskId})
```

#### 22. Person -[:EXECUTES]-> Task
**Purpose:** Track who does tasks (execution labor)
```cypher
MERGE (p:Person {userId: $assignedTo})-[:EXECUTES {
  timestamp: datetime(),
  duration: 30,                             // minutes
  difficulty: 'easy'
}]->(t:Task {taskId: $taskId})
```

#### 23. Person -[:MONITORS]-> Task
**Purpose:** Track who checks on task status (mental load)
```cypher
MERGE (p:Person)-[:MONITORS {
  timestamp: datetime(),
  checkCount: 3,                            // How many times they checked
  anxietyLevel: 0.6                         // 0-1
}]->(t:Task)
```

---

## Key Cypher Queries (Optimized for Flow 2)

### Query 1: Get Cognitive Load for Smart Task Assignment

**Purpose:** When creating task, assign to person with lowest load

```cypher
// Get current cognitive load for all family members
MATCH (p:Person {familyId: $familyId})
OPTIONAL MATCH (p)<-[m:MEASURES]-(s:Survey)
WHERE s.surveyType IN ['initial', 're-assessment']
WITH p, m
ORDER BY m.timestamp DESC
LIMIT 1

RETURN p.userId, p.name, p.cognitiveLoad, m.value as latestLoad
ORDER BY p.cognitiveLoad ASC
LIMIT 1
```

**Usage in Flow 2:**
```javascript
// TaskBoard: Suggest assignee
const result = await neo4j.run(query, { familyId });
const suggested = result.records[0].get('p.userId');
// Show: "Suggested assignee: Stefan (lowest cognitive load)"
```

---

### Query 2: Find Habit Patterns for Event Auto-Attendees

**Purpose:** Who handles school-related activities based on habit practice?

```cypher
// Find who practices school-related habits
MATCH (p:Person {familyId: $familyId})-[:ASSIGNED_TO]-(h:Habit)
WHERE h.category CONTAINS 'Parental'
  AND (h.title CONTAINS 'school' OR h.description CONTAINS 'school')
  AND h.status = 'active'

OPTIONAL MATCH (h)-[:PRACTICED_AS]->(hi:HabitInstance)
WHERE hi.completed = true

WITH p, h, count(hi) as practiceCount
WHERE practiceCount >= 8  // Practiced at least 8 times

RETURN p.userId, p.name, h.title, practiceCount
ORDER BY practiceCount DESC
```

**Usage in Flow 2:**
```javascript
// Event creation: Auto-suggest attendees
if (eventTitle.includes('school') || eventCategory === 'education') {
  const result = await neo4j.run(query, { familyId });
  if (result.records.length > 0) {
    const handler = result.records[0].get('p.userId');
    // Pre-fill attendees: [handler]
  }
}
```

---

### Query 3: Inbox Routing Based on Interview Insights

**Purpose:** Route email to person based on interview-revealed patterns

```cypher
// Find who handles specific domains based on interview insights
MATCH (i:Interview {familyId: $familyId})-[r:REVEALED]->(p:Person)
WHERE r.patternType = 'invisible_work'
  AND ($emailDomain IN r.domains OR $emailSubject CONTAINS r.keywords)

RETURN p.userId, p.name, r.domains, r.confidence
ORDER BY r.confidence DESC
LIMIT 1
```

**Usage in Flow 2:**
```javascript
// UnifiedInbox: Smart routing
const email = { from: 'teacher@school.edu', subject: 'Lillian homework' };
const domain = extractDomain(email.from); // 'school'
const result = await neo4j.run(query, {
  familyId,
  emailDomain: domain,
  emailSubject: email.subject
});

if (result.records.length > 0) {
  email.suggestedHandler = result.records[0].get('p.userId');
}
```

---

### Query 4: Detect Cognitive Load Spike (Proactive Alert)

**Purpose:** Real-time monitoring - trigger alert if load increases suddenly

```cypher
// Get current vs. baseline cognitive load
MATCH (p:Person {userId: $userId, familyId: $familyId})
OPTIONAL MATCH (p)<-[current:MEASURES]-(s1:Survey)
WHERE s1.surveyType = 're-assessment'
WITH p, current
ORDER BY current.timestamp DESC
LIMIT 1

OPTIONAL MATCH (p)<-[baseline:MEASURES]-(s2:Survey)
WHERE s2.surveyType = 'initial'
WITH p, current, baseline
ORDER BY baseline.timestamp DESC
LIMIT 1

WITH p,
     current.value as currentLoad,
     baseline.value as baselineLoad,
     (current.value - baseline.value) as loadIncrease,
     (current.value / baseline.value) as loadRatio

WHERE loadRatio > 1.5  // 50% increase = spike!

RETURN p.userId, p.name, currentLoad, baselineLoad, loadIncrease, loadRatio
```

**Usage in Flow 2:**
```javascript
// Background service runs every 5 minutes
const spikes = await neo4j.run(query, { userId, familyId });
if (spikes.records.length > 0) {
  const { name, currentLoad, baselineLoad } = spikes.records[0];

  // Trigger proactive intervention
  await AllieChat.sendMessage({
    type: 'proactive_alert',
    message: `I noticed ${name}'s cognitive load increased from ${baselineLoad} to ${currentLoad}. Would you like to rebalance some tasks?`,
    suggestedActions: ['Reassign tasks', 'Add helper habit', 'Schedule check-in']
  });
}
```

---

### Query 5: Calculate Imbalance Improvement Across Cycles

**Purpose:** Show progress over time

```cypher
// Get imbalance trend across all completed cycles
MATCH (c:Cycle {familyId: $familyId})
WHERE c.status = 'completed'

OPTIONAL MATCH (c)-[:INCLUDES_SURVEY]->(s:Survey)
WHERE s.surveyType IN ['initial', 're-assessment']

WITH c, s
ORDER BY s.completedAt ASC

WITH c,
     collect({type: s.surveyType, imbalance: s.overallImbalance, date: s.completedAt}) as surveys

RETURN c.cycleNumber, c.imbalanceReduction, surveys
ORDER BY c.cycleNumber ASC
```

**Usage in Flow 2:**
```javascript
// Dashboard: Show trend chart
const cycles = await neo4j.run(query, { familyId });
const trendData = cycles.records.map(r => ({
  cycle: r.get('c.cycleNumber'),
  reduction: r.get('c.imbalanceReduction'),
  surveys: r.get('surveys')
}));

// Chart: Line graph showing 14% → 22% → 18% improvement per cycle
```

---

## Data Sync Architecture

### Firestore → Neo4j Sync (Cloud Functions)

**Pattern:** Every Flow 1 data write triggers Neo4j sync

#### 1. Survey Completion Trigger
```javascript
// functions/index.js
exports.onSurveyCompleted = functions.firestore
  .document('surveyResponses/{surveyId}')
  .onWrite(async (change, context) => {
    const surveyData = change.after.data();
    if (surveyData.status === 'completed') {
      await syncSurveyToNeo4j(surveyData);
    }
  });

// Sync logic in /functions/neo4j-sync.js
async function syncSurveyToNeo4j(surveyData) {
  // Create Survey node
  // Create SurveyResponse nodes
  // Create relationships (COMPLETED, CONTAINS, MEASURES)
  // Update Person cognitive load properties
  // Create/update ELORating nodes
}
```

#### 2. Interview Completion Trigger
```javascript
exports.onInterviewCompleted = functions.firestore
  .document('interviews/{interviewId}')
  .onWrite(async (change, context) => {
    const interview = change.after.data();
    if (interview.status === 'completed') {
      await syncInterviewToNeo4j(interview);
    }
  });
```

#### 3. Habit Practice Trigger
```javascript
exports.onHabitInstanceCompleted = functions.firestore
  .document('habitInstances/{instanceId}')
  .onCreate(async (snap, context) => {
    const instance = snap.data();
    await syncHabitInstanceToNeo4j(instance);
  });
```

#### 4. Meeting Completion Trigger
```javascript
exports.onFamilyMeetingCompleted = functions.firestore
  .document('familyMeetings/{meetingId}')
  .onWrite(async (change, context) => {
    const meeting = change.after.data();
    if (meeting.status === 'completed') {
      await syncMeetingToNeo4j(meeting);
    }
  });
```

---

## Implementation Priority (Week-by-Week)

### Week 1: Survey → Neo4j (Foundation)
- Person nodes with cognitive load
- Survey + SurveyResponse nodes
- COMPLETED, MEASURES relationships
- Query 1: Smart task assignment

### Week 2: Interview → Neo4j (Patterns)
- Interview + InterviewResponse nodes
- PARTICIPATED_IN, REVEALED relationships
- Pattern extraction logic
- Query 3: Inbox routing

### Week 3: Habit → Neo4j (Behavior)
- Habit + HabitInstance nodes
- ASSIGNED_TO, PRACTICED_AS relationships
- Query 2: Event auto-attendees

### Week 4: ELO Ratings (Imbalance)
- ELORating nodes
- GENERATED_RATING relationships
- Historical tracking

### Week 5: Cycle + Meeting (Decisions)
- Cycle + FamilyMeeting nodes
- DECIDED, CONCLUDED_WITH relationships
- Progress tracking

### Week 6: Real-time Monitoring (Proactive)
- Query 4: Spike detection
- Background Cloud Function (runs every 5 min)
- Proactive alert system

---

## Success Metrics

**Week 1 Success:**
- ✅ Survey data syncs to Neo4j automatically
- ✅ Person.cognitiveLoad updates in real-time
- ✅ Task assignment suggests lowest-load person

**Week 2 Success:**
- ✅ Interview insights stored in graph
- ✅ Pattern-based inbox routing works
- ✅ "Stefan handles school emails" detected

**Week 3 Success:**
- ✅ Habit practice tracked in graph
- ✅ Event creation auto-suggests attendees
- ✅ "Stefan goes to volleyball" based on habit

**Weeks 4-6 Success:**
- ✅ Complete cycle history in graph
- ✅ Proactive alerts trigger when load spikes
- ✅ All Flow 1 data (4,166 points) in Neo4j

---

**Next:** See Week 1 implementation in `/src/services/SurveyToKGSync.js`
