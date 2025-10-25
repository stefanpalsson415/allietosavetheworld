# Flow Connection Plan: Making Flow 1 Drive Flow 2 Through Knowledge Graph

**Focus:** Two critical connections that make Allie intelligent
1. **Flow 1 → Flow 2:** How assessment insights trigger execution changes
2. **Knowledge Graph:** How all data connects to power insights

**Date:** October 20, 2025
**Status:** Active Implementation Plan

**IMPORTANT:** See `FLOW_1_DATA_COMPLETE.md` for complete data catalog (8 data types, 4,166 data points per cycle, ELO + 7-factor algorithms)

---

## Part 1: What Flow 1 Data Drives Flow 2 Behaviors

### The Data Flow Architecture

```
FLOW 1 (Understanding)          KNOWLEDGE GRAPH              FLOW 2 (Execution)
     ↓                                ↓                             ↓
Survey Responses         →    Person Nodes + Metrics     →    Task Assignment
Interview Transcripts    →    Relationship Patterns      →    Event Attendees
Habit Selections        →    Behavior Change Goals      →    Inbox Routing
Cognitive Load Scores   →    Real-time Load Tracking    →    Proactive Alerts
Re-Assessment Results   →    Progress Measurements      →    Allie Suggestions
Meeting Decisions       →    Commitment Records         →    Automation Rules
```

### Concrete Data Mappings

#### 1. Survey Responses → Task Assignment Logic

**Flow 1 Data Collected:**
```javascript
Survey: "Who typically handles these household tasks?"

Questions:
- "Who usually notices when groceries are running low?" → Kimberly
- "Who typically schedules doctor appointments?" → Kimberly
- "Who monitors if kids have clean clothes for school?" → Kimberly
- "Who makes sure homework gets done?" → Kimberly
- "Who handles school communications?" → Kimberly

Result: Survey calculates imbalance
{
  kimberly: {
    anticipationTasks: 12,  // She notices things need doing
    monitoringTasks: 8,     // She checks if things are done
    executionTasks: 5       // She actually does things
  },
  stefan: {
    anticipationTasks: 2,
    monitoringTasks: 1,
    executionTasks: 10      // He does work but doesn't notice/monitor
  }
}

Cognitive Load Calculation:
Kimberly: (12 × 2.0) + (8 × 1.5) + (5 × 1.0) = 41 points
Stefan: (2 × 2.0) + (1 × 1.5) + (10 × 1.0) = 15.5 points
Imbalance: 73% / 27% (Kimberly is overwhelmed)
```

**Knowledge Graph Storage:**
```cypher
// Store survey results
MERGE (kimberly:Person {userId: 'kimberly_id', familyId: 'family_123'})
MERGE (survey:Survey {surveyId: 'survey_001', type: 'cognitive_load'})
MERGE (survey)-[:MEASURES {
  metricName: 'anticipation_load',
  value: 12,
  weight: 2.0,
  timestamp: datetime()
}]->(kimberly)

MERGE (survey)-[:MEASURES {
  metricName: 'monitoring_load',
  value: 8,
  weight: 1.5,
  timestamp: datetime()
}]->(kimberly)

// Calculate cognitive load
WITH kimberly
MATCH (s:Survey)-[m:MEASURES]->(kimberly)
WHERE s.type = 'cognitive_load'
WITH kimberly,
     sum(m.value * m.weight) as cognitiveLoad
SET kimberly.cognitiveLoad = cognitiveLoad,
    kimberly.lastSurveyDate = datetime()
```

**Flow 2 Impact:**
```javascript
// When new task is created in Flow 2
async function createTask(taskData) {
  // Query Knowledge Graph for cognitive load
  const cognitiveLoad = await neo4j.run(`
    MATCH (p:Person {familyId: $familyId})
    RETURN p.userId, p.name, p.cognitiveLoad
    ORDER BY p.cognitiveLoad ASC
  `, { familyId });

  // Suggest assignment to person with LOWEST cognitive load
  const suggestedAssignee = cognitiveLoad[0]; // Stefan (15.5 points)

  // Allie intervenes
  return {
    task: taskData,
    suggestedAssignee: suggestedAssignee.userId,
    reason: `${suggestedAssignee.name} has lower cognitive load (${suggestedAssignee.cognitiveLoad} vs ${cognitiveLoad[1].cognitiveLoad}). Assigning to ${suggestedAssignee.name} helps rebalance.`
  };
}

// Result: When Kimberly creates task "Schedule dentist appointment"
// Allie suggests: "Stefan's mental load is lower. Want to assign this to him?"
```

---

#### 2. Interview Transcripts → Pattern Detection

**Flow 1 Data Collected:**
```javascript
Interview Transcript:
Allie: "Tell me about a typical weekday morning."
Kimberly: "I wake up at 6am, make lunches, wake the kids, make sure they eat breakfast,
           check backpacks, sign permission slips I forgot about, drive Lillian to school..."
Stefan: "I usually get up around 7am, get ready for work, help with breakfast if needed."

Allie: "Who typically remembers things like permission slips or school events?"
Kimberly: "That's all me. I check the school portal every night."
Stefan: "Yeah, Kimberly handles all that. I don't even have the login."

Result: Interview reveals patterns
{
  patterns: {
    morningRoutine: {
      kimberly: ['wake kids', 'make lunches', 'check backpacks', 'sign forms', 'drive school'],
      stefan: ['get ready', 'help breakfast']
    },
    schoolCommunication: {
      kimberly: 'monitors portal daily',
      stefan: 'not involved'
    }
  },
  emotionalLoad: {
    kimberly: 'HIGH - uses words like "forgot", "make sure", "check"',
    stefan: 'LOW - passive role "if needed"'
  }
}
```

**Knowledge Graph Storage:**
```cypher
// Store interview insights
MERGE (kimberly:Person {userId: 'kimberly_id'})
MERGE (interview:Interview {interviewId: 'int_001', date: datetime()})

// Pattern: Morning routine tasks
MERGE (pattern:Pattern {
  name: 'morning_routine',
  description: 'Tasks that happen every weekday morning',
  frequency: 'daily'
})

// Connect Kimberly to pattern with high burden
MERGE (kimberly)-[:EXPERIENCES_PATTERN {
  burden: 'HIGH',
  taskCount: 5,
  emotionalLoad: 0.85,
  keywords: ['wake', 'make sure', 'check', 'forgot']
}]->(pattern)

// Pattern: School communication monitoring
MERGE (schoolPattern:Pattern {
  name: 'school_monitoring',
  description: 'Checking school portal, emails, forms',
  frequency: 'daily'
})

MERGE (kimberly)-[:EXPERIENCES_PATTERN {
  burden: 'HIGH',
  taskCount: 1,
  emotionalLoad: 0.90,
  visibility: 'INVISIBLE' // Stefan doesn't even know this happens
}]->(schoolPattern)
```

**Flow 2 Impact:**
```javascript
// When school-related email arrives in Flow 2 inbox
async function processEmail(email) {
  // Check Knowledge Graph for patterns
  const patterns = await neo4j.run(`
    MATCH (p:Person)-[exp:EXPERIENCES_PATTERN]->(pattern:Pattern)
    WHERE pattern.name = 'school_monitoring'
      AND p.familyId = $familyId
    RETURN p.userId, p.name, exp.burden, exp.visibility
  `, { familyId });

  if (patterns.length > 0) {
    const overloadedPerson = patterns.find(p => p.burden === 'HIGH');

    // Allie intervenes
    return {
      email: email,
      suggestedAction: 'ROUTE_TO_PARTNER',
      reason: `${overloadedPerson.name} handles all school communication (invisible labor). This should be shared with Stefan.`,
      notification: {
        to: 'stefan_id',
        message: `School email from ${email.from}. This usually goes to Kimberly, but her load is high. Can you handle this?`
      }
    };
  }
}

// Result: School emails start routing to Stefan instead of always to Kimberly
```

---

#### 3. Habit Selections → Automation Rules

**Flow 1 Data Collected:**
```javascript
Family Meeting Decision:
Habit Selected: "Stefan will handle school communications for next 30 days"
Commitment Date: 2025-10-20
Goal: Reduce Kimberly's monitoring burden by 50%

Result: Habit stored
{
  habitId: 'habit_001',
  habitName: 'Stefan handles school communications',
  targetPerson: 'stefan',
  targetMetric: 'monitoring_load',
  targetReduction: 0.50,
  startDate: '2025-10-20',
  duration: 30,
  status: 'active'
}
```

**Knowledge Graph Storage:**
```cypher
// Store habit as behavior change goal
MERGE (stefan:Person {userId: 'stefan_id'})
MERGE (habit:Habit {
  habitId: 'habit_001',
  name: 'Handle school communications',
  startDate: datetime('2025-10-20'),
  endDate: datetime('2025-11-20'),
  status: 'active'
})

// Target metric: Reduce Kimberly's monitoring load
MERGE (kimberly:Person {userId: 'kimberly_id'})
MERGE (metric:Metric {
  name: 'monitoring_load',
  currentValue: 8,
  targetValue: 4,
  person: 'kimberly'
})

// Connect habit to target
MERGE (habit)-[:TARGETS {
  reductionGoal: 0.50,
  measurementInterval: 'weekly'
}]->(metric)

// Connect Stefan to habit (he's practicing it)
MERGE (stefan)-[:PRACTICES {
  startDate: datetime('2025-10-20'),
  adherence: [],  // Will track daily completion
  currentStreak: 0
}]->(habit)
```

**Flow 2 Impact - Automation Rules:**
```javascript
// Create automation rule based on habit
async function createAutomationRule(habit) {
  const rule = {
    ruleId: 'rule_001',
    habitId: habit.habitId,
    trigger: 'EMAIL_RECEIVED',
    condition: {
      from: ['@school.edu', '@teacher.com', 'principal@'],
      subject_contains: ['school', 'class', 'homework', 'parent-teacher']
    },
    action: {
      type: 'ROUTE_TO_PERSON',
      targetPerson: 'stefan',
      createTask: true,
      taskTemplate: {
        title: 'Review school email from {sender}',
        description: 'Email: {subject}',
        assignedTo: 'stefan',
        priority: 'medium',
        dueDate: 'today'
      }
    },
    notifications: {
      to: 'stefan',
      message: 'New school email requires your attention (you committed to handling these)'
    }
  };

  await saveAutomationRule(rule);

  // Allie confirms to both partners
  notifyFamily({
    title: 'Automation Active',
    message: `Stefan will now receive school emails automatically. Kimberly, you can focus on other things!`
  });
}

// Result: All school emails route to Stefan, create tasks for him automatically
// Kimberly's monitoring burden decreases without her having to do anything
```

---

#### 4. Cognitive Load Scores → Real-Time Alerts

**Flow 1 Data:**
```javascript
Re-Assessment Survey (Week 2):
Kimberly's cognitive load: 41 → 38 points (7% reduction)
Stefan's cognitive load: 15.5 → 18 points (16% increase)

Progress: Good! Load is rebalancing.
```

**Flow 2 Data (Real-Time):**
```javascript
// Background monitoring detects spike
Monday 8:47 PM:
Kimberly created 12 tasks in last 2 hours:
- "Buy Halloween costumes for kids"
- "Schedule dentist appointments"
- "Plan Thanksgiving menu"
- "Order birthday gift for grandma"
- "Research winter camps"
- "Sign up for parent-teacher conferences"
- ... (6 more)

Current cognitive load: 38 → 52 points (SPIKE DETECTED)
```

**Knowledge Graph Real-Time Calculation:**
```cypher
// Background job runs every 5 minutes
MATCH (kimberly:Person {userId: 'kimberly_id'})-[r:CREATES]->(t:Task)
WHERE r.timestamp > datetime() - duration({hours: 2})
WITH kimberly, count(t) as recentTasks

// Get baseline from survey
MATCH (s:Survey)-[m:MEASURES]->(kimberly)
WHERE s.type = 'cognitive_load'
WITH kimberly, recentTasks,
     sum(m.value * m.weight) as baselineLoad

// Calculate current spike
WITH kimberly, baselineLoad, recentTasks,
     (recentTasks * 2.0) as spikeLoad,  // Assume all creation = anticipation
     baselineLoad + (recentTasks * 2.0) as currentLoad

WHERE currentLoad > baselineLoad * 1.5  // 50% spike threshold

RETURN kimberly.userId,
       baselineLoad as baseline,
       currentLoad as current,
       (currentLoad / baselineLoad) as spikeMultiplier
```

**Flow 2 Impact - Proactive Intervention:**
```javascript
// Allie detects spike and intervenes
async function handleCognitiveLoadSpike(person, spikeData) {
  // Get recent tasks created by person
  const recentTasks = await firestore
    .collection('kanbanTasks')
    .where('createdBy', '==', person.userId)
    .where('createdAt', '>=', twoHoursAgo)
    .get();

  // Find tasks that could be delegated
  const delegatableTasks = recentTasks.docs
    .filter(t => t.data().assignedTo === person.userId) // Assigned to self
    .slice(0, 5); // Top 5 most recent

  // Get partner
  const partner = await getPartner(person.userId);

  // Send proactive message to BOTH
  await sendNotification({
    to: partner.userId,
    title: '⚠️ Mental Load Alert',
    message: `${person.name}'s cognitive load just spiked to ${spikeData.current} (${spikeData.spikeMultiplier.toFixed(1)}x normal). Can you help?`,
    actions: [
      {
        label: 'Take 3 tasks',
        action: 'reassign_tasks',
        taskIds: delegatableTasks.slice(0, 3).map(t => t.id),
        newAssignee: partner.userId
      },
      {
        label: 'View all tasks',
        action: 'open_task_board'
      }
    ]
  });

  await sendNotification({
    to: person.userId,
    title: '💙 Taking Care of You',
    message: `You've created a lot of tasks tonight (${recentTasks.size} in 2 hours). I've alerted ${partner.name} to help. Want to delegate some?`,
    actions: [
      {
        label: 'Yes, delegate',
        action: 'open_delegation_flow',
        tasks: delegatableTasks.map(t => t.id)
      },
      {
        label: 'I can handle it',
        action: 'dismiss'
      }
    ]
  });
}

// Result: Real-time intervention prevents burnout before it happens
```

---

#### 5. Meeting Decisions → Event Auto-Attendees

**Flow 1 Data:**
```javascript
Family Meeting Decision:
"Stefan will take Lillian to volleyball practice on Tuesdays and Thursdays"
Reason: Reduce Kimberly's shuttling burden
Start Date: Next week
```

**Knowledge Graph Storage:**
```cypher
// Store meeting decision
MERGE (meeting:Meeting {
  meetingId: 'meeting_001',
  date: datetime(),
  type: 'family_check_in'
})

MERGE (decision:Decision {
  decisionId: 'dec_001',
  description: 'Stefan handles Lillian volleyball practice',
  category: 'kid_activities',
  subcategory: 'transportation'
})

MERGE (meeting)-[:MADE_DECISION]->(decision)

// Connect decision to people and events
MERGE (stefan:Person {userId: 'stefan_id'})
MERGE (lillian:Person {userId: 'lillian_id'})

// Create pattern rule
MERGE (eventPattern:EventPattern {
  name: 'volleyball_practice',
  titleContains: 'volleyball practice',
  attendeeRule: 'stefan_id',  // Always add Stefan
  childInvolved: 'lillian_id'
})

MERGE (decision)-[:CREATES_RULE]->(eventPattern)
```

**Flow 2 Impact - Auto-Attendees:**
```javascript
// When new event created with "volleyball practice" in title
async function createEvent(eventData) {
  // Check Knowledge Graph for pattern rules
  const patterns = await neo4j.run(`
    MATCH (pattern:EventPattern)
    WHERE $title CONTAINS pattern.titleContains
    RETURN pattern.attendeeRule, pattern.childInvolved
  `, { title: eventData.title.toLowerCase() });

  if (patterns.length > 0) {
    const rule = patterns[0];

    // Auto-add attendees based on rule
    eventData.attendees = [
      rule.attendeeRule,      // Stefan (parent)
      rule.childInvolved      // Lillian (child)
    ];

    // Notify about auto-assignment
    await sendNotification({
      to: rule.attendeeRule,
      message: `I added you to "${eventData.title}" based on your commitment to handle Lillian's volleyball practice.`
    });
  }

  return createEventInFirestore(eventData);
}

// Result: Future volleyball events automatically have Stefan as attendee
// Kimberly doesn't have to remember to assign him
```

---

## Part 2: How Flow 2 Data Connects in Knowledge Graph

### Complete Data Interconnection Map

```
FLOW 2 DATA SOURCES:

1. TASKS
   ├─ Created by Person (WHO noticed this needs doing)
   ├─ Assigned to Person (WHO will do it)
   ├─ Completed by Person (WHO actually did it)
   ├─ Linked to Event (prep work for event)
   ├─ Generated from Email/SMS (source)
   ├─ Due date, priority, status
   └─ Timestamps (created, completed, updated)

2. EVENTS
   ├─ Organized by Person (WHO planned it)
   ├─ Attended by Person(s) (WHO participates)
   ├─ Generated from Email/SMS (source communication)
   ├─ Involves Contact (external person)
   ├─ Generates prep Tasks (dependencies)
   ├─ Location, time, description
   └─ Timestamps (start, end, created)

3. CONTACTS
   ├─ Linked to Events (involved in)
   ├─ Linked to Communications (sent emails/SMS)
   ├─ Category (school, medical, activities, service)
   ├─ Interaction frequency
   └─ Relationship strength

4. INBOX (Emails/SMS)
   ├─ From Contact
   ├─ Generates Event (auto-created from email)
   ├─ Generates Task (action item extracted)
   ├─ Generates Contact (sender added)
   ├─ AI analysis (summary, category, actionable)
   └─ Timestamp (received, processed)

5. CHORES
   ├─ Assigned to Child
   ├─ Template → Instance (recurring chores)
   ├─ Completion status
   ├─ Bucks awarded
   ├─ Skill level, difficulty
   └─ Timestamps (assigned, completed)

6. REWARDS
   ├─ Redeemed by Child
   ├─ Bucks spent
   ├─ Preference patterns
   └─ Timestamp (redeemed)
```

### Knowledge Graph Relationships (Flow 2)

```cypher
// ═══════════════════════════════════════════════
// TASK RELATIONSHIPS
// ═══════════════════════════════════════════════

// Cognitive Labor Tracking
(Person)-[:CREATES {timestamp, leadTime}]->(Task)
  ↳ Tracks ANTICIPATION (invisible labor - noticing it needs doing)

(Person)-[:MONITORS {checkCount, anxiety}]->(Task)
  ↳ Tracks MONITORING (mental load - checking if it's done)

(Person)-[:EXECUTES {timestamp, duration, quality}]->(Task)
  ↳ Tracks EXECUTION (physical work - actually doing it)

// Task Dependencies
(Task)-[:PREP_FOR {leadTime}]->(Event)
  ↳ "Pack volleyball gear" is prep for "Volleyball practice" event

(Task)-[:DEPENDS_ON]->(Task)
  ↳ "Make dinner" depends on "Grocery shop" being done first

(Task)-[:GENERATED_FROM {aiConfidence}]->(Email)
  ↳ Task was created from email action item

// ═══════════════════════════════════════════════
// EVENT RELATIONSHIPS
// ═══════════════════════════════════════════════

// Labor Tracking
(Person)-[:ORGANIZES {timestamp, leadTime}]->(Event)
  ↳ WHO planned the event (invisible labor)

(Person)-[:ATTENDS {timestamp, role}]->(Event)
  ↳ WHO participates (physical presence)

// Event Sources & Connections
(Event)-[:GENERATED_FROM {aiConfidence}]->(Email)
  ↳ "Volleyball practice" was created from coach's email

(Event)-[:INVOLVES {relationshipType}]->(Contact)
  ↳ Event involves external person (coach, teacher, doctor)

(Event)-[:REQUIRES_PREP]->(Task)
  ↳ Event needs these tasks done beforehand

(Event)-[:CONFLICTS_WITH {overlapMinutes}]->(Event)
  ↳ Scheduling conflict detected

// ═══════════════════════════════════════════════
// CONTACT RELATIONSHIPS
// ═══════════════════════════════════════════════

(Contact)-[:SENT]->(Email)
  ↳ Contact sent this communication

(Contact)-[:INVOLVED_IN]->(Event)
  ↳ Contact is involved in these events

(Contact)-[:CATEGORY {type}]->(Category)
  ↳ Medical, School, Activities, Service provider

// ═══════════════════════════════════════════════
// INBOX (EMAIL/SMS) RELATIONSHIPS
// ═══════════════════════════════════════════════

(Email)-[:FROM]->(Contact)
  ↳ Email sender

(Email)-[:GENERATED]->(Event)
  ↳ Email created calendar event

(Email)-[:GENERATED]->(Task)
  ↳ Email created action item task

(Email)-[:GENERATED]->(Contact)
  ↳ Email added new contact

(Email)-[:ROUTED_TO {reason}]->(Person)
  ↳ Email routed to specific person based on pattern

// ═══════════════════════════════════════════════
// CHORE RELATIONSHIPS
// ═══════════════════════════════════════════════

(Child:Person)-[:ASSIGNED_TO {date}]->(ChoreInstance)
  ↳ Child assigned this chore occurrence

(ChoreInstance)-[:INSTANCE_OF]->(ChoreTemplate)
  ↳ Links to recurring chore template

(ChoreInstance)-[:EARNS {bucks}]->(BucksTransaction)
  ↳ Completion earned bucks

// ═══════════════════════════════════════════════
// REWARD RELATIONSHIPS
// ═══════════════════════════════════════════════

(Child:Person)-[:REDEEMS {timestamp, bucks}]->(Reward)
  ↳ Child spent bucks on reward

(Reward)-[:COSTS {bucks}]->(BucksTransaction)
  ↳ Reward cost transaction
```

### Example: Complete Data Connection Chain

**Scenario:** School sends email about parent-teacher conference

```cypher
// 1. Email arrives
MERGE (email:Email {
  emailId: 'email_123',
  from: 'teacher@school.edu',
  subject: 'Parent-Teacher Conference - Lillian',
  receivedAt: datetime()
})

// 2. Create/link contact
MERGE (teacher:Contact {
  email: 'teacher@school.edu',
  name: 'Mrs. Johnson',
  category: 'school'
})
MERGE (email)-[:FROM]->(teacher)

// 3. AI extracts event
MERGE (event:Event {
  eventId: 'event_456',
  title: 'Parent-Teacher Conference - Lillian',
  startTime: datetime('2025-10-25T15:30'),
  endTime: datetime('2025-10-25T16:00'),
  location: 'Room 204'
})
MERGE (email)-[:GENERATED {aiConfidence: 0.95}]->(event)
MERGE (event)-[:INVOLVES]->(teacher)

// 4. Check patterns: Who handles school communications?
MATCH (pattern:Pattern {name: 'school_monitoring'})
MATCH (p:Person)-[:EXPERIENCES_PATTERN {burden: 'HIGH'}]->(pattern)
// Found: Kimberly (overloaded)

// 5. Check habits: Did family commit to change?
MATCH (habit:Habit {name: 'Stefan handles school communications'})
MATCH (stefan:Person)-[:PRACTICES]->(habit)
WHERE habit.status = 'active'
// Found: Stefan practicing this habit

// 6. Auto-assign Stefan as organizer
MERGE (stefan)-[:ORGANIZES {
  timestamp: datetime(),
  assignedBy: 'ALLIE_AUTO',
  reason: 'habit_commitment'
}]->(event)

MERGE (lillian:Person {name: 'Lillian'})
MERGE (lillian)-[:ATTENDS]->(event)

// 7. Generate prep task
MERGE (task:Task {
  taskId: 'task_789',
  title: 'Review Lillian progress before conference',
  assignedTo: 'stefan_id',
  dueDate: datetime('2025-10-24')
})
MERGE (stefan)-[:CREATES {timestamp: datetime()}]->(task)
MERGE (stefan)-[:EXECUTES]->(task)
MERGE (task)-[:PREP_FOR]->(event)
MERGE (email)-[:GENERATED]->(task)

// 8. Track cognitive load impact
// Kimberly's monitoring load: -1 (didn't have to notice this)
// Stefan's anticipation load: +1 (assigned to notice/prepare)

MATCH (kimberly:Person {name: 'Kimberly'})
SET kimberly.cognitiveLoad = kimberly.cognitiveLoad - 1.5

MATCH (stefan:Person {name: 'Stefan'})
SET stefan.cognitiveLoad = stefan.cognitiveLoad + 2.0

// Result: Complete chain from email → event → person → task
// All automatically, based on Flow 1 insights (habit commitment)
```

---

## Part 3: Implementation Plan (Focused on Flow 1 → Flow 2 + KG)

### Phase 1: Data Collection (Flow 1 → Knowledge Graph)

**Week 1: Survey → KG Sync**

```javascript
// src/services/SurveyToKGSync.js

export async function syncSurveyToKG(surveyId, userId, familyId) {
  const survey = await firestore.collection('surveys').doc(surveyId).get();
  const responses = survey.data().responses;

  // Calculate cognitive load from responses
  const cognitiveLoad = calculateCognitiveLoad(responses);

  // Sync to Neo4j
  await neo4j.run(`
    MERGE (person:Person {userId: $userId, familyId: $familyId})
    MERGE (survey:Survey {surveyId: $surveyId, type: 'cognitive_load'})

    MERGE (survey)-[:MEASURES {
      metricName: 'anticipation_load',
      value: $anticipation,
      weight: 2.0,
      timestamp: datetime()
    }]->(person)

    MERGE (survey)-[:MEASURES {
      metricName: 'monitoring_load',
      value: $monitoring,
      weight: 1.5,
      timestamp: datetime()
    }]->(person)

    MERGE (survey)-[:MEASURES {
      metricName: 'execution_load',
      value: $execution,
      weight: 1.0,
      timestamp: datetime()
    }]->(person)

    SET person.cognitiveLoad = $cognitiveLoad,
        person.lastSurveyDate = datetime()
  `, {
    userId,
    familyId,
    surveyId,
    anticipation: cognitiveLoad.anticipation,
    monitoring: cognitiveLoad.monitoring,
    execution: cognitiveLoad.execution,
    cognitiveLoad: cognitiveLoad.total
  });

  console.log(`Synced survey ${surveyId} to KG: ${userId} cognitive load = ${cognitiveLoad.total}`);
}

// Cloud Function trigger
exports.onSurveyCompleted = functions.firestore
  .document('surveys/{surveyId}')
  .onCreate(async (snap, context) => {
    const survey = snap.data();
    await syncSurveyToKG(context.params.surveyId, survey.userId, survey.familyId);
  });
```

**Week 2: Interview → KG Pattern Extraction**

```javascript
// src/services/InterviewToKGSync.js

export async function syncInterviewToKG(interviewId, familyId) {
  const interview = await firestore.collection('interviews').doc(interviewId).get();
  const transcript = interview.data().transcript;

  // Use Claude to extract patterns
  const patterns = await claudeService.extractPatterns(transcript);

  // Sync patterns to Neo4j
  for (const pattern of patterns) {
    await neo4j.run(`
      MERGE (person:Person {userId: $userId, familyId: $familyId})
      MERGE (pattern:Pattern {
        name: $patternName,
        description: $description,
        frequency: $frequency
      })

      MERGE (person)-[:EXPERIENCES_PATTERN {
        burden: $burden,
        taskCount: $taskCount,
        emotionalLoad: $emotionalLoad,
        visibility: $visibility,
        keywords: $keywords
      }]->(pattern)
    `, {
      userId: pattern.userId,
      familyId,
      patternName: pattern.name,
      description: pattern.description,
      frequency: pattern.frequency,
      burden: pattern.burden, // HIGH, MEDIUM, LOW
      taskCount: pattern.tasks.length,
      emotionalLoad: pattern.emotionalLoad, // 0.0 - 1.0
      visibility: pattern.visibility, // VISIBLE, INVISIBLE
      keywords: pattern.keywords
    });
  }
}
```

**Week 3: Habit → KG Goal Tracking**

```javascript
// src/services/HabitToKGSync.js

export async function syncHabitToKG(habitId, familyId) {
  const habit = await firestore.collection('habits').doc(habitId).get();
  const data = habit.data();

  await neo4j.run(`
    MERGE (person:Person {userId: $userId, familyId: $familyId})
    MERGE (habit:Habit {
      habitId: $habitId,
      name: $name,
      startDate: datetime($startDate),
      endDate: datetime($endDate),
      status: $status
    })

    MERGE (targetPerson:Person {userId: $targetUserId, familyId: $familyId})
    MERGE (metric:Metric {
      name: $metricName,
      person: $targetUserId
    })

    SET metric.currentValue = $currentValue,
        metric.targetValue = $targetValue

    MERGE (habit)-[:TARGETS {
      reductionGoal: $reductionGoal,
      measurementInterval: 'weekly'
    }]->(metric)

    MERGE (person)-[:PRACTICES {
      startDate: datetime($startDate),
      adherence: [],
      currentStreak: 0
    }]->(habit)
  `, {
    userId: data.userId,
    familyId,
    habitId,
    name: data.name,
    startDate: data.startDate.toISOString(),
    endDate: data.endDate.toISOString(),
    status: data.status,
    targetUserId: data.targetPerson,
    metricName: data.targetMetric,
    currentValue: data.currentMetricValue,
    targetValue: data.targetMetricValue,
    reductionGoal: data.reductionGoal
  });
}
```

---

### Phase 2: Automation Rules (Flow 1 → Flow 2 Triggers)

**Week 4: Smart Task Assignment**

```javascript
// src/services/SmartTaskAssignment.js

export async function suggestTaskAssignment(task, familyId) {
  // Query KG for cognitive load
  const result = await neo4j.run(`
    MATCH (p:Person {familyId: $familyId, role: 'parent'})
    RETURN p.userId, p.name, p.cognitiveLoad
    ORDER BY p.cognitiveLoad ASC
  `, { familyId });

  if (result.length === 0) {
    return { assignedTo: task.createdBy }; // Default to creator
  }

  const leastLoaded = result[0];
  const mostLoaded = result[result.length - 1];
  const imbalance = mostLoaded.cognitiveLoad / leastLoaded.cognitiveLoad;

  if (imbalance > 1.5) {
    // Significant imbalance - suggest least loaded person
    return {
      assignedTo: leastLoaded.userId,
      suggestion: true,
      reason: `${leastLoaded.name} has lower mental load (${leastLoaded.cognitiveLoad} vs ${mostLoaded.cognitiveLoad}). Assigning helps rebalance.`,
      showToUser: true
    };
  }

  return { assignedTo: task.createdBy }; // No strong recommendation
}

// Integrate into task creation flow
// src/components/dashboard/tabs/TasksTab.jsx
async function createTask(taskData) {
  const suggestion = await suggestTaskAssignment(taskData, familyId);

  if (suggestion.suggestion) {
    // Show Allie suggestion
    const accepted = await showAllieSuggestion({
      message: suggestion.reason,
      actions: [
        { label: `Assign to ${suggestion.assignedTo}`, value: 'accept' },
        { label: 'I'll do it myself', value: 'reject' }
      ]
    });

    if (accepted === 'accept') {
      taskData.assignedTo = suggestion.assignedTo;
    }
  }

  await firestore.collection('kanbanTasks').add(taskData);
}
```

**Week 5: Auto-Event Attendees Based on Patterns**

```javascript
// src/services/SmartEventAttendees.js

export async function suggestEventAttendees(event, familyId) {
  // Check KG for pattern rules
  const patterns = await neo4j.run(`
    MATCH (pattern:EventPattern)
    WHERE toLower($title) CONTAINS toLower(pattern.titleContains)
    RETURN pattern.attendeeRule, pattern.childInvolved, pattern.reason
  `, { title: event.title });

  if (patterns.length > 0) {
    const rule = patterns[0];
    return {
      attendees: [rule.attendeeRule, rule.childInvolved].filter(Boolean),
      autoAssigned: true,
      reason: rule.reason
    };
  }

  // Check for category-based patterns
  const categoryPatterns = await neo4j.run(`
    MATCH (person:Person)-[:EXPERIENCES_PATTERN]->(pattern:Pattern)
    WHERE pattern.name = $category AND person.familyId = $familyId
    RETURN person.userId, pattern.burden
    ORDER BY pattern.burden DESC
  `, { category: event.category, familyId });

  if (categoryPatterns.length > 0) {
    // Don't auto-assign to most burdened person
    const leastBurdened = categoryPatterns[categoryPatterns.length - 1];
    return {
      attendees: [leastBurdened.userId],
      suggestion: true,
      reason: `${leastBurdened.name} has lower burden in ${event.category}`
    };
  }

  return { attendees: [event.createdBy] }; // Default
}
```

**Week 6: Inbox Smart Routing Based on Habits**

```javascript
// src/services/SmartInboxRouting.js

export async function routeInboxItem(email, familyId) {
  // Extract category from email
  const category = await claudeService.categorizeEmail(email);

  // Check KG for active habits related to this category
  const habits = await neo4j.run(`
    MATCH (person:Person)-[:PRACTICES {status: 'active'}]->(habit:Habit)
    MATCH (habit)-[:TARGETS]->(metric:Metric)
    MATCH (pattern:Pattern {name: $category})
    WHERE person.familyId = $familyId
    RETURN person.userId, person.name, habit.name
  `, { category, familyId });

  if (habits.length > 0) {
    const assignee = habits[0];
    return {
      routeTo: assignee.userId,
      createTask: true,
      task: {
        title: `Review ${category} email from ${email.from}`,
        description: email.subject,
        assignedTo: assignee.userId,
        dueDate: 'today'
      },
      notification: {
        to: assignee.userId,
        message: `New ${category} email requires your attention (you committed to handling these)`
      }
    };
  }

  return { routeTo: null }; // No routing rule
}

// Cloud Function to process inbox
exports.onEmailReceived = functions.firestore
  .document('emailInbox/{emailId}')
  .onCreate(async (snap, context) => {
    const email = snap.data();
    const routing = await routeInboxItem(email, email.familyId);

    if (routing.routeTo) {
      // Create task
      await firestore.collection('kanbanTasks').add(routing.task);

      // Send notification
      await sendNotification(routing.notification);

      // Update email with routing
      await snap.ref.update({
        routedTo: routing.routeTo,
        routedAt: admin.firestore.FieldValue.serverTimestamp(),
        routingReason: 'habit_commitment'
      });
    }
  });
```

---

### Phase 3: Real-Time Monitoring (KG Powers Proactive Allie)

**Week 7-8: Background Cognitive Load Monitoring**

```javascript
// server/services/CognitiveLoadMonitor.js

class CognitiveLoadMonitor {
  constructor() {
    this.neo4jService = new Neo4jService();
    this.checkInterval = 5 * 60 * 1000; // 5 minutes
  }

  async start() {
    console.log('Starting Cognitive Load Monitor...');
    setInterval(() => this.checkAllFamilies(), this.checkInterval);
  }

  async checkAllFamilies() {
    const families = await this.getActiveFamilies();

    for (const family of families) {
      await this.checkFamily(family.id);
    }
  }

  async checkFamily(familyId) {
    // Check for cognitive load spikes
    const spikes = await this.detectSpikes(familyId);

    for (const spike of spikes) {
      await this.handleSpike(spike);
    }
  }

  async detectSpikes(familyId) {
    return await this.neo4jService.runQuery(`
      // Get baseline from survey
      MATCH (person:Person {familyId: $familyId, role: 'parent'})
      MATCH (survey:Survey)-[m:MEASURES]->(person)
      WHERE survey.type = 'cognitive_load'
      WITH person, sum(m.value * m.weight) as baselineLoad

      // Get recent activity (last 24 hours)
      MATCH (person)-[r:CREATES|ANTICIPATES|MONITORS]->(t:Task)
      WHERE r.timestamp > datetime() - duration({hours: 24})
      WITH person, baselineLoad,
           count(CASE WHEN type(r) = 'CREATES' THEN 1 END) * 2.0 as recentCreation,
           count(CASE WHEN type(r) = 'ANTICIPATES' THEN 1 END) * 2.0 as recentAnticipation,
           count(CASE WHEN type(r) = 'MONITORS' THEN 1 END) * 1.5 as recentMonitoring

      WITH person, baselineLoad,
           (recentCreation + recentAnticipation + recentMonitoring) as currentLoad

      WHERE currentLoad > baselineLoad * 1.5

      RETURN person.userId, person.name,
             baselineLoad, currentLoad,
             (currentLoad / baselineLoad) as spikeMultiplier
    `, { familyId });
  }

  async handleSpike(spike) {
    // Get partner
    const partner = await this.getPartner(spike.userId);

    // Get delegatable tasks
    const tasks = await this.getDelegatableTasks(spike.userId, 5);

    // Send intervention
    await this.sendIntervention({
      type: 'cognitive_load_spike',
      person: spike,
      partner: partner,
      tasks: tasks
    });
  }

  async sendIntervention(data) {
    // Message to partner
    await sendNotification({
      to: data.partner.userId,
      title: '⚠️ Mental Load Alert',
      message: `${data.person.name}'s cognitive load spiked to ${data.person.currentLoad} (${data.person.spikeMultiplier.toFixed(1)}x normal). Can you help?`,
      actions: [
        {
          label: 'Take 3 tasks',
          action: 'reassign_tasks',
          taskIds: data.tasks.slice(0, 3).map(t => t.id),
          newAssignee: data.partner.userId
        }
      ]
    });

    // Message to person
    await sendNotification({
      to: data.person.userId,
      title: '💙 Taking Care of You',
      message: `You've been creating a lot of tasks. I've alerted ${data.partner.name} to help. Want to delegate?`,
      actions: [
        {
          label: 'Yes, delegate',
          action: 'open_delegation_flow',
          tasks: data.tasks
        }
      ]
    });
  }
}

// Start monitor
const monitor = new CognitiveLoadMonitor();
monitor.start();
```

---

## Summary: Focused Implementation Path

**Focus Area 1: Flow 1 → Flow 2 Connection**
- ✅ Week 1: Survey → KG sync (cognitive load stored)
- ✅ Week 2: Interview → KG patterns (who does what)
- ✅ Week 3: Habit → KG goals (commitments tracked)
- ✅ Week 4: Smart task assignment (uses cognitive load)
- ✅ Week 5: Auto event attendees (uses patterns)
- ✅ Week 6: Inbox routing (uses habits)

**Focus Area 2: Knowledge Graph as Intelligence Layer**
- ✅ Week 7-8: Real-time cognitive load monitoring
- ✅ Proactive interventions based on KG data
- ✅ Pattern detection from all Flow 2 activities
- ✅ Impact measurement (before/after)

**Result:**
Flow 1 insights automatically drive Flow 2 behaviors through Knowledge Graph intelligence.

---

*Next Step: Start with Week 1 - Survey → KG Sync*

