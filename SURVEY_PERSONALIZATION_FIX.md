# Survey Personalization Bug & Fix

**Issue:** Weekly/cycle surveys show generic questions instead of hyper-personalized questions based on Knowledge Graph data.

**Error:** `TypeError: t.invisibleLabor.find is not a function at SurveyContext.js:950`

---

## Root Cause Analysis

### The Problem

**Frontend Expectation (SurveyContext.js:950):**
```javascript
const kgData = kgInsights.invisibleLabor.find(
  insight => insight.category === kgCategory
);
```

Expects `invisibleLabor` to be an **ARRAY** with structure:
```javascript
[
  {
    category: "Home",
    anticipation: {
      leader: "Kimberly",
      percentageDifference: 35,
      tasks: 45
    },
    monitoring: {
      leader: "Kimberly",
      percentageDifference: 28,
      checks: 120
    },
    execution: {
      leader: "Stefan",
      percentageDifference: 12,
      completed: 38
    }
  },
  {
    category: "Kids",
    anticipation: {...},
    monitoring: {...},
    execution: {...}
  }
]
```

**Backend Reality (server/routes/knowledge-graph.js:38):**
```javascript
// Current /invisible-labor endpoint returns:
{
  success: true,
  data: {
    analysis: [
      { name: "Kimberly", taskCount: 65, avgLoad: 0.78 },
      { name: "Stefan", taskCount: 28, avgLoad: 0.42 }
    ],
    summary: "Found 2 family members with task data"
  }
}
```

**Data Structure Mismatch:**
- Frontend needs: **Array of category-based breakdowns**
- Backend returns: **Object with analysis array**
- Result: `.find()` called on object → TypeError

---

## The Fix

### Step 1: Create Category-Based Backend Endpoint

**File:** `/server/routes/knowledge-graph.js`

Add new endpoint that returns category-based invisible labor data:

```javascript
/**
 * POST /api/knowledge-graph/invisible-labor-by-category
 * Get invisible labor analysis broken down by category (Home, Kids, Work, Self)
 * Format optimized for survey personalization
 */
router.post('/invisible-labor-by-category', async (req, res) => {
  try {
    const { familyId } = req.body;

    if (!familyId) {
      return res.status(400).json({ error: 'familyId is required' });
    }

    // Query Neo4j for category-based analysis
    // Group tasks by category and labor type (anticipation, monitoring, execution)
    const query = `
      MATCH (p:Person {familyId: $familyId})
      OPTIONAL MATCH (p)-[ant:ANTICIPATES]->(t:Task)
      OPTIONAL MATCH (p)-[mon:MONITORS]->(task:Task)
      OPTIONAL MATCH (p)-[exe:EXECUTES]->(completed:Task)

      WITH p.name as person,
           t.category as category,
           count(DISTINCT ant) as anticipated,
           count(DISTINCT mon) as monitored,
           count(DISTINCT exe) as executed

      WHERE category IS NOT NULL

      WITH category,
           collect({
             person: person,
             anticipated: anticipated,
             monitored: monitored,
             executed: executed
           }) as personData

      // Calculate leader and percentage differences per category
      WITH category, personData,
           [p IN personData | p.anticipated] as anticipationCounts,
           [p IN personData | p.monitored] as monitoringCounts,
           [p IN personData | p.executed] as executionCounts

      WITH category, personData,
           reduce(s = 0, x IN anticipationCounts | s + x) as totalAnticipation,
           reduce(s = 0, x IN monitoringCounts | s + x) as totalMonitoring,
           reduce(s = 0, x IN executionCounts | s + x) as totalExecution

      // Find leaders
      WITH category, personData, totalAnticipation, totalMonitoring, totalExecution,
           head([p IN personData | p.anticipated]) as maxAnticipation,
           head([p IN personData | p.monitored]) as maxMonitoring,
           head([p IN personData | p.executed]) as maxExecution

      RETURN category,
             {
               leader: head([p IN personData WHERE p.anticipated = maxAnticipation | p.person]),
               percentageDifference: CASE
                 WHEN totalAnticipation > 0
                 THEN toFloat(maxAnticipation - head([p IN personData WHERE p.person <> head([x IN personData WHERE x.anticipated = maxAnticipation | x.person]) | p.anticipated])) / totalAnticipation * 100
                 ELSE 0
               END,
               tasks: maxAnticipation
             } as anticipation,
             {
               leader: head([p IN personData WHERE p.monitored = maxMonitoring | p.person]),
               percentageDifference: CASE
                 WHEN totalMonitoring > 0
                 THEN toFloat(maxMonitoring - head([p IN personData WHERE p.person <> head([x IN personData WHERE x.monitored = maxMonitoring | x.person]) | p.monitored])) / totalMonitoring * 100
                 ELSE 0
               END,
               checks: maxMonitoring
             } as monitoring,
             {
               leader: head([p IN personData WHERE p.executed = maxExecution | p.person]),
               percentageDifference: CASE
                 WHEN totalExecution > 0
                 THEN toFloat(maxExecution - head([p IN personData WHERE p.person <> head([x IN personData WHERE x.executed = maxExecution | x.person]) | p.executed])) / totalExecution * 100
                 ELSE 0
               END,
               completed: maxExecution
             } as execution
    `;

    const results = await neo4jService.runQuery(query, { familyId });

    res.json({
      success: true,
      data: results  // Array of {category, anticipation, monitoring, execution}
    });
  } catch (error) {
    console.error('Error getting category-based invisible labor:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

### Step 2: Update Frontend Service

**File:** `/src/services/KnowledgeGraphService.js`

Add new method:

```javascript
/**
 * Get invisible labor analysis by category
 * Returns array of category breakdowns for survey personalization
 */
async getInvisibleLaborByCategory(familyId) {
  const cacheKey = `invisible_labor_category_${familyId}`;
  const cached = this._getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${this.apiUrl}/api/knowledge-graph/invisible-labor-by-category`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ familyId })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    this._setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Failed to get category-based invisible labor:', error);
    throw error;
  }
}
```

### Step 3: Update Survey Context

**File:** `/src/contexts/SurveyContext.js`

Update the KG insights fetching (around line 689):

```javascript
// OLD (line 689):
const [invisibleLabor, coordination, temporal] = await Promise.all([
  knowledgeGraphService.getInvisibleLaborAnalysis(familyData.familyId).catch(...)
  // ...
]);

// NEW:
const [invisibleLabor, coordination, temporal] = await Promise.all([
  knowledgeGraphService.getInvisibleLaborByCategory(familyData.familyId).catch(err => {
    console.warn('Failed to fetch invisible labor by category:', err);
    return { success: false, data: [] };  // Return empty array on failure
  }),
  // ...
]);
```

Update data extraction (around line 705):

```javascript
// OLD:
const kgInsights = {
  invisibleLabor: invisibleLabor?.success ? invisibleLabor.data : null,
  // ...
};

// NEW:
const kgInsights = {
  invisibleLabor: invisibleLabor?.success ? invisibleLabor.data : [],  // Array, not null
  coordination: coordination?.success ? coordination.data : null,
  temporal: temporal?.success ? temporal.data : null,
  hasData: !!(invisibleLabor?.success || coordination?.success || temporal?.success)
};
```

---

## How Surveys Build on Each Other

### Initial Survey (Cycle 1)

**Purpose:** Establish baseline understanding of family dynamics

**Data Sources:**
- Family structure (# kids, ages, household type)
- Location data (neighborhood, school district)
- Parent roles/occupations
- No historical data yet

**Question Selection:**
1. Start with 600+ question bank
2. Select 72 questions (18 per category)
3. **NO Knowledge Graph data** (family just started)
4. Focus on comprehensive coverage across all categories
5. Questions are generic but well-balanced

**Example Questions:**
- "Who does the grocery shopping?"
- "Who plans meals for the family?"
- "Who schedules doctor appointments?"
- "Who helps with homework?"

### Cycle 2+ Surveys (Weekly Check-Ins)

**Purpose:** Detect changes, validate trends, probe imbalances

**Data Sources:**
- **Knowledge Graph:**
  - Anticipation burden (who notices tasks first)
  - Monitoring overhead (who follows up)
  - Execution split (who actually does tasks)
  - Temporal patterns (when tasks created)
  - Coordination bottlenecks
- **ELO Ratings:** Category-specific imbalance scores
- **Previous Surveys:** Historical responses (up to 52 weeks)
- **Uncovered Tasks:** Tasks from events/habits not in survey
- **Fair Play Cards:** Which cards are owned by whom

**Question Selection Algorithm:**

1. **Analyze Imbalances** (30 questions)
   - Get category ELO scores
   - Sort by imbalance (highest first)
   - Select from most imbalanced categories
   - Example: If "Invisible Parental Tasks" shows 78% Kimberly, ask 10 questions about invisible kid tasks

2. **Knowledge Graph Priority** (25 questions)
   - Calculate priority score per question:
     - Anticipation gap × 2.0 (most important)
     - Monitoring gap × 1.5
     - Execution gap × 1.0
   - Sort questions by priority
   - Select highest priority
   - Example: If KG shows Kimberly anticipates 85% of "Kids" tasks, prioritize questions about who notices when kids need things

3. **Temporal Insights** (10 questions)
   - Identify time-based patterns (Sunday night planning spikes)
   - Probe specific time periods
   - Example: "Last Sunday evening, who was thinking about this week's schedule?"

4. **Uncovered Tasks** (7 questions)
   - Find tasks from calendar/habits not covered in previous surveys
   - Generate specific questions
   - Example: "Who arranged Lillian's volleyball carpool this week?"

**Personalized Explanations:**

Each question includes context:

```javascript
{
  id: "q73",
  text: "Who schedules Lillian's volleyball practices?",
  category: "Visible Parental Tasks",
  explanation: "The Knowledge Graph shows Kimberly creates 82% of kid activity tasks. This question helps us understand if that pattern holds for sports coordination.",
  kgPriority: 45.2,  // High priority
  kgSource: 'real_behavior',
  kgData: {
    anticipationGap: 35,  // Kimberly 85%, Stefan 50%
    monitoringGap: 28,
    executionGap: 12,
    leader: "Kimberly"
  }
}
```

### Data Flow Visualization

```
Initial Survey (Week 1)
└─> Responses saved to Firebase
    └─> ELO ratings calculated
        └─> Knowledge Graph synced

Weekly Survey (Week 2+)
├─> Load KG insights by category
│   ├─> Anticipation: [Home: Kimberly 78%, Kids: Kimberly 85%, ...]
│   ├─> Monitoring: [Home: Kimberly 65%, Kids: Kimberly 72%, ...]
│   └─> Execution: [Home: Stefan 52%, Kids: Kimberly 58%, ...]
│
├─> Load ELO category imbalances
│   └─> Invisible Parental Tasks: 78% imbalanced (Kimberly heavy)
│
├─> Load previous survey responses
│   └─> Compare this week vs last week (detect changes)
│
├─> Generate personalized questions
│   ├─> Weight by KG priority
│   ├─> Focus on imbalanced categories
│   ├─> Probe temporal patterns
│   └─> Cover uncovered tasks
│
└─> Present 20 hyper-specific questions
    └─> Each with personalized explanation
```

---

## Implementation Checklist

- [ ] **Backend:** Add `/invisible-labor-by-category` endpoint
- [ ] **Backend:** Test endpoint returns proper array structure
- [ ] **Frontend:** Add `getInvisibleLaborByCategory()` method to KnowledgeGraphService
- [ ] **Frontend:** Update SurveyContext to use new method
- [ ] **Frontend:** Update data extraction to handle array structure
- [ ] **Deploy:** Backend Cloud Run update
- [ ] **Test:** Take weekly survey and verify personalized questions
- [ ] **Verify:** Console logs show KG data loaded and used

---

## Testing

### Manual Test

1. **Complete Initial Survey** (if not done)
   - Creates baseline ELO ratings
   - Syncs to Knowledge Graph

2. **Wait 1 week OR manually trigger cycle advance**

3. **Start Weekly Check-In**
   - Open browser console
   - Look for: `📊 Knowledge Graph data available for survey personalization`
   - Should NOT see: `⚠️ Weekly generation failed, using fallback`

4. **Verify Questions are Personalized**
   - Questions should reference specific family members
   - Explanations should mention KG insights
   - Questions should focus on known imbalanced areas

### Console Verification

```javascript
// Should see:
✅ KG insights loaded: {hasInvisibleLabor: true, hasCoordination: true, hasTemporal: true}
✅ Applying KG weighting to survey questions...
✅ KG-weighted 72 questions. Top priority: 45.2

// Should NOT see:
❌ TypeError: t.invisibleLabor.find is not a function
❌ Weekly generation failed, using fallback
```

---

## Success Criteria

- [ ] No TypeErrors in console
- [ ] KG insights successfully loaded
- [ ] Questions show personalized explanations
- [ ] Questions focus on family-specific imbalances
- [ ] Each survey builds on previous survey data
- [ ] Survey feels "hyper-personalized" not generic

---

**Files to Modify:**
1. `server/routes/knowledge-graph.js` - Add new endpoint
2. `src/services/KnowledgeGraphService.js` - Add new method
3. `src/contexts/SurveyContext.js` - Update KG data fetching

**Estimated Time:** 30 minutes
**Priority:** HIGH (breaks core survey personalization feature)
