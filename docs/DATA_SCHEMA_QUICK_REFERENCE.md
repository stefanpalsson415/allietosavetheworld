# Allie Data Schema - Quick Reference

**Based on:** 2 days of agent-driven test data (Palsson Family Simulation)
**Generated:** October 22, 2025
**See Also:** TEST_DATA_EXTRACTION_MASTER.md for full context

## Core Collections

### 1. `families/{familyId}`

**Purpose:** Root document for each family

**Required Fields:**
```javascript
{
  familyName: string,                    // "Palsson Family"
  createdAt: Timestamp,
  updatedAt: Timestamp,
  currentWeek: number,                   // 1-52 for cycle tracking
  familyMembers: Array<FamilyMember>     // See structure below
}
```

**FamilyMember Structure (CRITICAL - Triple ID Pattern):**
```javascript
{
  // ALL THREE IDs REQUIRED (different services expect different fields)
  id: string,              // FamilyContext uses this
  memberId: string,        // FamilyProfileService uses this
  userId: string,          // Original field, used for Firestore queries

  name: string,
  role: "parent" | "child",
  isParent: boolean,
  age: number,
  email: string,           // Required for parents
  phone: string,           // E.164 format: +14155551234
  avatar: string,          // Emoji or URL

  // Agent Simulation Fields (optional)
  personality: {
    helpfulness: number,   // 0.0-1.0
    awareness: number,     // 0.0-1.0
    followThrough: number, // 0.0-1.0
    initiative: number     // 0.0-1.0
  },
  mentalLoad: number,              // 0.0-1.0 scale
  taskCreationRate: number,        // 0.0-1.0 scale
  agentType: string,               // "StefanAgent", "KimberlyAgent", etc.
  isSimulatedAgent: boolean
}
```

---

### 2. `families/{familyId}/habits/{habitId}`

**Purpose:** Track parent habits for each cycle

**Required Fields:**
```javascript
{
  userId: string,                  // Must match familyMembers[].userId
  userName: string,
  habitText: string,
  description: string,
  category: "home" | "kids" | "work" | "self",

  // CRITICAL: CycleId format
  cycleId: string,                 // "45" (NOT "weekly_45") - UI expects just number
  cycleType: "weekly" | "monthly",

  createdAt: Timestamp,
  completionCount: number,         // 0-5 (target is usually 5)
  targetFrequency: number,         // Usually 5
  eloRating: number,               // Starts at 1200, adapts based on effectiveness
  active: boolean
}
```

**Query Pattern:**
```javascript
// UI queries with just the cycle number
await getHabits(familyId, '45')  // NOT 'weekly_45'
```

---

### 3. `families/{familyId}/cycles/weekly/cycles/{cycleId}`

**Purpose:** Track cycle progress (Habits → Survey → Meeting)

**Document ID:** `weekly_45` (includes cycle type prefix)
**Query ID:** `'45'` (just the number)

**Structure:**
```javascript
{
  cycleNumber: number,             // 45
  cycleType: "weekly",
  startDate: Timestamp,
  endDate: Timestamp,
  step: number,                    // 1=Habits, 2=Survey, 3=Meeting

  habits: {
    selected: boolean,
    completed: boolean,
    completedAt: Timestamp
  },

  survey: {
    completed: boolean,
    completedAt: Timestamp
  },

  meeting: {
    completed: boolean,
    scheduledDate: Timestamp,
    completedAt: Timestamp
  }
}
```

---

### 4. `families/{familyId}/surveyData/{surveyId}`

**Purpose:** Store survey responses (72 questions each)

**Structure:**
```javascript
{
  userId: string,
  userName: string,
  surveyType: "weekly" | "monthly",
  cycleNumber: number,
  startedAt: Timestamp,
  completedAt: Timestamp,

  responses: {
    [questionId]: {
      value: number,         // 0-10 scale
      text: string          // Optional explanation
    }
  },

  // Calculated scores
  anticipationScore: number,    // 0.0-1.0
  monitoringScore: number,      // 0.0-1.0
  executionScore: number,       // 0.0-1.0
  cognitiveLoad: number         // Weighted combination
}
```

**72 Question Structure (Auto-syncs to Neo4j):**
- Questions 1-24: Anticipation (noticing what needs to be done)
- Questions 25-48: Monitoring (tracking and checking)
- Questions 49-72: Execution (actually doing the work)

---

### 5. `families/{familyId}/events/{eventId}`

**Purpose:** Calendar events (Google sync + manual)

**CRITICAL:** Must include `userId` field for security rules

**Required Fields:**
```javascript
{
  familyId: string,           // REQUIRED for multi-tenant queries
  userId: string,             // REQUIRED for security rules + filtering

  title: string,
  description: string,

  // BOTH timestamp formats required
  startTime: Timestamp,       // Firestore Timestamp (for queries)
  endTime: Timestamp,
  startDate: string,          // ISO string (compatibility)
  endDate: string,

  allDay: boolean,
  location: string,

  source: "google" | "manual",
  googleEventId: string,      // If source === "google"

  reminders: [{
    minutes: number,          // Minutes before event
    method: string            // "popup", "email", etc.
  }],

  attendees: [string],        // Array of family member names
  category: string,           // "Medical", "School", "Sports", etc.

  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

### 6. `families/{familyId}/contacts/{contactId}`

**Purpose:** Family contact database (100 contacts in test data)

**Structure:**
```javascript
{
  name: string,               // "Dr. Sarah Johnson"
  category: string,           // "Medical", "School", "Sports", "Education",
                             // "Childcare", "Friends", "Family", "Services"
  role: string,              // "Pediatrician", "Teacher", "Coach", etc.
  phone: string,             // E.164: +14155551234
  email: string,
  address: string,

  notes: string,
  favorite: boolean,

  createdAt: Timestamp
}
```

**Test Data Distribution:**
- Medical: 12 contacts (doctors, dentists, therapists)
- School: 12 contacts (teachers, principals, counselors)
- Sports: 12 contacts (coaches, instructors)
- Education: 12 contacts (tutors, teachers)
- Childcare: 10 contacts (babysitters, nannies)
- Friends: 10 contacts (family friends)
- Family: 12 contacts (grandparents, aunts, uncles)
- Services: 20 contacts (salon, mechanic, house cleaning, etc.)

---

### 7. `families/{familyId}/inbox/emails/{emailId}`

**Purpose:** Centralized email inbox

**Structure:**
```javascript
{
  from: {
    name: string,
    email: string
  },
  to: [string],              // Recipient emails
  subject: string,
  body: string,              // Plain text
  htmlBody: string,          // HTML version

  receivedAt: Timestamp,
  read: boolean,
  starred: boolean,
  archived: boolean,

  category: string,          // Auto-categorized by AI
  priority: "high" | "medium" | "low",

  attachments: [{
    filename: string,
    url: string,
    size: number
  }],

  processedByAllie: boolean,
  allieExtractedTasks: [string],
  allieExtractedEvents: [string]
}
```

---

### 8. `families/{familyId}/inbox/sms/{smsId}`

**Purpose:** SMS messages

**Structure:**
```javascript
{
  from: string,              // Phone number or contact name
  to: string,
  body: string,
  receivedAt: Timestamp,
  read: boolean,

  category: string,
  priority: string,

  processedByAllie: boolean
}
```

---

## Subcollections

### Messages
`families/{familyId}/messages/{messageId}`
- Allie AI conversation history
- 280+ interactions in test data

### Documents
`families/{familyId}/documents/{documentId}`
- Uploaded documents with OCR
- 25 documents in test data
- PDF, images, scanned forms

### Tasks
`families/{familyId}/tasks/{taskId}` or `kanbanTasks/{taskId}`
- 443 tasks in test data
- Task management system

### Chores (Kids)
`families/{familyId}/choreInstances/{choreId}`
- Kid-specific chore assignments
- Points/rewards system

---

## Critical Data Patterns

### Pattern 1: Triple ID Requirement
**Problem:** Different services expect different ID fields
**Solution:** Always include all three:
```javascript
{ id: userId, memberId: userId, userId: userId }
```

### Pattern 2: CycleId Format Mismatch
**Problem:** Document ID uses `weekly_45`, UI queries `'45'`
**Solution:**
- Document path: `cycles/weekly/cycles/weekly_45`
- Query parameter: `getHabits(familyId, '45')`
- Habit document: `{ cycleId: '45' }` (just the number)

### Pattern 3: Timestamp Duality
**Problem:** Mix of Firestore Timestamp and ISO strings
**Solution:** Store both formats:
```javascript
{
  startTime: Timestamp,      // For Firestore queries
  startDate: string          // For compatibility/display
}
```

### Pattern 4: Security userId Requirement
**Problem:** Events without userId fail security rules
**Solution:** Always include userId in events:
```javascript
{ familyId, userId, ...otherFields }
```

---

## Indexes Required

**Habits:**
```
families/{familyId}/habits
- cycleId (ascending) + userId (ascending)
- active (ascending) + cycleId (ascending)
```

**Events:**
```
families/{familyId}/events
- userId (ascending) + startTime (ascending)
- familyId (ascending) + startTime (ascending)
```

**Surveys:**
```
families/{familyId}/surveyData
- userId (ascending) + completedAt (descending)
- cycleNumber (descending)
```

---

## Validation Rules

### Email Format
RFC 5322: `user@domain.com`

### Phone Format
E.164: `+14155551234` (country code + area + number, no spaces)

### Age Ranges
- Children: 0-17
- Adults: 18+

### Personality Traits
All values: 0.0-1.0 scale

### Survey Responses
Numeric: 0-10 scale
Text: Optional, max 500 characters

### Cycle Numbers
Weekly: 1-52
Monthly: 1-12

### Habit Completion
0-100% progress (completionCount / targetFrequency * 100)

---

## Neo4j Sync

**Auto-Sync Cloud Functions:**
1. `syncFamilyToNeo4j` - Family members → Person nodes
2. `syncSurveyToNeo4j` - Survey responses → Survey nodes + 72 Question nodes
3. `syncTaskToNeo4j` - Tasks → Task nodes
4. `syncEventToNeo4j` - Events → Event nodes

**Result:** 16,200+ SurveyResponse nodes in test data (225 surveys × 72 questions)

---

## Quick Reference: Test Data Scale

- **Family Members:** 5 (2 parents, 3 children)
- **Contacts:** 100 (8 categories)
- **Calendar Events:** 327 (1 year)
- **Tasks:** 443 (1 year)
- **Surveys:** 225 cycles (84 completed)
- **Habits:** 10 per cycle (5 per parent)
- **Emails:** 74
- **SMS:** 32
- **Documents:** 25
- **Allie Interactions:** 280+
- **Neo4j Nodes:** 16,200+ survey responses

---

**Next:** See `/docs/DATA_SCHEMA.md` for complete field-by-field documentation
