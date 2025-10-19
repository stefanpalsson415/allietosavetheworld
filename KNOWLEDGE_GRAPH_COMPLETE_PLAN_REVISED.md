 # Complete Knowledge Graph Implementation Plan (REVISED)
## Neo4j + Fair Play + Embeddings + All Research Components

**Date:** January 18, 2025
**Vision:** Build the world's most powerful family knowledge graph using Neo4j, complete Fair Play taxonomy, graph embeddings, and all research-specified components.

---

## 🎯 **Architectural Decisions (CONFIRMED)**

### **Foundation:**
- ✅ **Neo4j Graph Database** - Cypher queries, GDS library, production-ready
- ✅ **Python Backend** - LibKGE/NeuralKG for embeddings (Cloud Functions)
- ✅ **Full Fair Play 100-card taxonomy** - All cards, 3 phases each (conception, planning, execution)
- ✅ **Clean slate** - Build new system from scratch, migrate QuantumKG data later

### **What We're Building:**
1. ✅ **Child Insights** - Deep psychological understanding (Priority #1)
2. ✅ **Invisible Labor Tracking** - 60/40 split visibility, 6-phase roadmap
3. ✅ **Parent Dynamics** - Communication patterns, coordination burden
4. ✅ **Self-Reflection** - Individual parent patterns, stress triggers
5. ✅ **Visual KG** - Dual interface (Allie chat + graph visualization)

### **Deferred to Later:**
- ❌ Multi-family benchmarking (Phase 6)
- ❌ Differential privacy & ReBAC (Phase 6)
- ❌ Advanced timeline visualizations (heat maps, spiral, Gantt) - Phase 6

---

## 🏗️ **Complete System Architecture**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  USER INTERFACE LAYER                                                   │
│  ┌─────────────────────────────────┬─────────────────────────────────┐ │
│  │  Allie Chat/Voice Interface     │  Visual Knowledge Graph         │ │
│  │  (AllieChatMode.jsx)            │  (D3.js + Cytoscape.js)         │ │
│  │  - Natural language queries     │  - Force-directed layout        │ │
│  │  - Insight cards                │  - Node/edge interactions       │ │
│  │  - Audio briefings              │  - Real-time sync with chat     │ │
│  └─────────────────────────────────┴─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  APPLICATION LAYER (Node.js/React)                                      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  ParentingIntelligenceService.js (Main Orchestrator)             │  │
│  │  - Coordinates all insight engines                                │  │
│  │  - Handles queries, generates insights                            │  │
│  │  - Real-time updates via Firestore listeners                      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌────────────────────┬──────────────────────┬────────────────────────┐ │
│  │ ChildInsightEngine │ InvisibleLaborEngine │ ParentDynamicsEngine   │ │
│  │ - Personality      │ - Task creation gap  │ - Communication        │ │
│  │ - Talents          │ - Monitoring burden  │ - Coordination         │ │
│  │ - Challenges       │ - Anticipation gap   │ - Decision-making      │ │
│  └────────────────────┴──────────────────────┴────────────────────────┘ │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  DataAggregationService.js                                        │  │
│  │  - Pulls data from: Surveys, Interviews, Chat, Calendar, Tasks   │  │
│  │  - Entity resolution (Jaro-Winkler + collective)                 │  │
│  │  - Multi-source confidence fusion                                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  GRAPH LAYER                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Neo4j Graph Database                                             │  │
│  │  - Nodes: Person, Task, Responsibility, Event, Decision, Routine │  │
│  │  - Edges: 18+ relationship types (ANTICIPATES, MONITORS, etc.)   │  │
│  │  - Properties: Fair Play phases, confidence scores, timestamps   │  │
│  │  - Cypher queries for pattern detection                          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Neo4j Graph Data Science Library (GDS)                          │  │
│  │  - gds.betweenness.stream() - Coordination burden                │  │
│  │  - gds.louvain.stream() - Community detection                    │  │
│  │  - gds.pageRank.stream() - Dependency burden                     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  EMBEDDINGS LAYER (Python Cloud Functions)                              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  EmbeddingService (Python)                                        │  │
│  │  - LibKGE with RotatE model (composition patterns)               │  │
│  │  - ComplEx model (symmetric relationships - siblings, spouses)   │  │
│  │  - Link prediction for task recommendations                      │  │
│  │  - Entity similarity scoring                                      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  DATA SOURCES                                                            │
│  - Surveys (DynamicSurveyGenerator)                                     │
│  - Interviews (InterviewChat, QuantumKnowledgeGraph insights)           │
│  - Chat (AllieChat conversation history)                                │
│  - Calendar (Google Calendar via EnhancedCalendarSyncService)           │
│  - Tasks (KanbanTasks collection)                                       │
│  - Email/SMS (EmailIngestService, SMSAIProcessor)                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 **Complete File Structure**

```
parentload-clean/
│
├── functions/  (Firebase Cloud Functions)
│   ├── index.js  (existing - email/SMS routing)
│   │
│   └── graph/  (NEW - Python Cloud Functions for embeddings)
│       ├── requirements.txt
│       ├── main.py  (Cloud Function entry point)
│       └── services/
│           ├── embedding_service.py  (LibKGE RotatE/ComplEx)
│           ├── entity_resolution.py  (Jaro-Winkler + collective)
│           └── link_prediction.py   (Task assignment recommendations)
│
├── server/  (Cloud Run backend)
│   ├── production-server.js
│   ├── graph/  (NEW - Neo4j integration)
│   │   ├── neo4j-client.js  (Neo4j driver setup)
│   │   ├── cypher-queries.js  (All research queries)
│   │   └── graph-sync-service.js  (Firestore → Neo4j sync)
│   │
│   └── services/
│       ├── AllieMemoryService.js  (existing)
│       └── graph/  (NEW)
│           ├── ParentingIntelligenceService.js  (main orchestrator)
│           ├── DataAggregationService.js  (multi-source data pull)
│           │
│           ├── childInsights/
│           │   ├── ChildInsightEngine.js
│           │   ├── DevelopmentalTracker.js
│           │   └── EmotionalStateAnalyzer.js
│           │
│           ├── invisibleLabor/
│           │   ├── InvisibleLaborEngine.js
│           │   ├── DependencyAnalyzer.js
│           │   ├── LoadBalancer.js
│           │   └── AnticipationGapDetector.js
│           │
│           ├── parentDynamics/
│           │   ├── ParentDynamicsEngine.js
│           │   ├── CommunicationAnalyzer.js
│           │   ├── DecisionMakingTracker.js
│           │   └── ConflictPatternDetector.js
│           │
│           ├── selfReflection/
│           │   ├── SelfReflectionEngine.js
│           │   ├── StressTriggerAnalyzer.js
│           │   └── TimeAllocationTracker.js
│           │
│           ├── shared/
│           │   ├── ConfidenceScorer.js
│           │   ├── InsightPrioritizer.js
│           │   ├── ProactiveAlertEngine.js
│           │   ├── RecommendationEngine.js
│           │   └── FairnessMetricsCalculator.js  (Theil, Gini)
│           │
│           └── graphAnalysis/
│               ├── CentralityCalculator.js  (wraps Neo4j GDS)
│               ├── CommunityDetector.js  (Louvain)
│               ├── PathAnalyzer.js  (dependency chains)
│               └── TemporalPatternDetector.js
│
├── src/
│   ├── config/
│   │   ├── neo4jConfig.js  (NEW - Neo4j connection settings)
│   │   ├── fairPlayTaxonomy.js  (NEW - 100 cards schema)
│   │   ├── graphSchema.js  (NEW - node/edge type definitions)
│   │   └── insightPrompts.js  (NEW - Claude prompts)
│   │
│   ├── services/
│   │   ├── neo4j/  (NEW - Client-side Neo4j helpers)
│   │   │   ├── Neo4jService.js  (wrapper for queries)
│   │   │   └── GraphQueryBuilder.js  (visual Cypher builder)
│   │   │
│   │   └── intelligence/  (NEW - same as server/services/graph)
│   │       └── [symlink or shared code with server]
│   │
│   └── components/
│       └── knowledgeGraph/  (NEW)
│           ├── KnowledgeGraphHub.jsx  (main container)
│           ├── DualPaneLayout.jsx  (split view: chat + graph)
│           │
│           ├── chatInterface/
│           │   ├── ChatInsightMode.jsx
│           │   ├── AudioBriefingMode.jsx
│           │   ├── InsightDetailPanel.jsx
│           │   └── QuerySuggestions.jsx
│           │
│           ├── visualGraph/
│           │   ├── VisualGraphMode.jsx  (D3 + Cytoscape)
│           │   ├── GraphControls.jsx  (zoom, filter, time travel)
│           │   ├── NodeRenderer.jsx  (18+ node types)
│           │   ├── EdgeRenderer.jsx  (18+ edge types)
│           │   └── GraphLegend.jsx
│           │
│           ├── insights/
│           │   ├── ChildProfileCard.jsx
│           │   ├── ParentLoadCard.jsx
│           │   ├── InvisibleLaborDashboard.jsx  (60/40 split)
│           │   ├── DependencyChainView.jsx
│           │   └── ConfidenceBadge.jsx
│           │
│           └── recommendations/
│               ├── RecommendationCard.jsx
│               ├── LoadBalancingProposal.jsx
│               └── ImpactProjection.jsx
│
└── neo4j/  (NEW - Neo4j database files)
    ├── docker-compose.yml  (Neo4j container setup)
    ├── schemas/
    │   ├── fair-play-cards.cypher  (100 card taxonomy)
    │   ├── relationship-types.cypher  (18+ relationship definitions)
    │   └── indexes.cypher  (performance indexes)
    │
    └── migrations/
        └── migrate-quantum-kg.cypher  (migrate old QuantumKG data)
```

---

## 💾 **Neo4j Graph Schema (Complete)**

### **Node Types:**

```cypher
// PERSON (Parent or Child)
CREATE (p:Person {
  id: 'person_uuid',
  familyId: 'fam_abc',
  name: 'Oly Tegner',
  role: 'primary_caregiver',  // primary_caregiver, secondary_caregiver, child
  age: 38,

  // Cognitive load metrics
  cognitive_load_score: 0.68,  // 0-1 (calculated from responsibilities)
  stress_level: 0.72,  // 0-1 (self-reported or inferred)

  // Availability
  availability_windows: [
    {day: 'Monday', start: '09:00', end: '17:00', type: 'work'},
    {day: 'Monday', start: '18:00', end: '21:00', type: 'available'}
  ],

  // Skills
  skills: {
    cooking: 'expert',
    technical: 'intermediate',
    medical_knowledge: 'basic'
  },

  // Preferences
  preferences: {
    morning_person: true,
    prefers_planning: true,
    communication_style: 'direct'
  },

  // Constraints
  constraints: {
    work_schedule: 'Mon-Fri 9-5',
    medical_conditions: [],
    accessibility_needs: []
  }
})

// TASK (Individual actionable item)
CREATE (t:Task {
  id: 'task_uuid',
  familyId: 'fam_abc',

  // Basic info
  title: 'Schedule Emma dentist appointment',
  description: 'Find available time, call office, coordinate childcare',
  status: 'pending',  // pending, in_progress, completed, blocked
  priority: 'high',

  // Fair Play integration
  fairPlayCardId: 'FP_023',  // Links to Fair Play card
  fairPlayCardName: 'Medical Appointments',

  // Three phases (CRITICAL for invisible labor)
  conceptionPhase: {
    time: 15,  // minutes
    person: 'parent1',
    activities: ['Notice checkup needed', 'Identify scheduling constraints'],
    visibility: 'invisible'  // This is invisible labor!
  },
  planningPhase: {
    time: 45,  // minutes
    person: 'parent1',
    activities: ['Research dentists', 'Compare availability', 'Coordinate schedules'],
    visibility: 'invisible'  // This is invisible labor!
  },
  executionPhase: {
    time: 20,  // minutes
    person: 'parent1',
    activities: ['Make phone call', 'Update calendar'],
    visibility: 'visible'  // This is what people see
  },

  // Time tracking
  estimated_time: 80,  // total minutes
  actual_time: null,  // filled when completed

  // Recurrence
  recurrence_pattern: 'every_6_months',  // null, daily, weekly, monthly, yearly, custom

  // Impact
  consequence_if_missed: 'high',  // high, medium, low

  // Complexity
  complexity_score: 0.65,  // 0-1 (cognitive demand)

  // Dependencies
  blocked_by: ['task_xyz'],  // IDs of tasks that must complete first
  blocks: ['task_abc'],  // IDs of tasks waiting on this

  // Timestamps
  createdAt: timestamp,
  dueDate: timestamp,
  completedAt: null
})

// RESPONSIBILITY (Meta-entity for high-burden areas)
CREATE (r:Responsibility {
  id: 'resp_uuid',
  familyId: 'fam_abc',

  name: 'School Communication',
  description: 'Monitoring emails, responding to teachers, tracking deadlines, coordinating volunteering',

  // Daminger's 4 dimensions (0-1 scores)
  anticipation: 0.85,  // Proactive monitoring burden
  identification: 0.72,  // Research/option generation
  decisionMaking: 0.68,  // Authority to decide
  monitoring: 0.91,  // Follow-up burden

  // Assignment
  assigned_to: 'parent1',

  // Burden metrics
  complexity_score: 0.89,
  time_investment_per_week: 180,  // minutes
  creates_stress_level: 0.76,

  // Requirements
  requires_expertise: ['communication', 'organization'],

  // Impact
  impact_if_dropped: 'high',  // high, medium, low

  // Component tasks (links to Task nodes)
  component_task_ids: [
    'task_read_newsletter',
    'task_respond_teacher_email',
    'task_track_deadlines'
  ]
})

// EVENT (Calendar events)
CREATE (e:Event {
  id: 'event_uuid',
  familyId: 'fam_abc',

  title: 'Emma Soccer Practice',
  startTime: timestamp,
  endTime: timestamp,
  location: 'Community Field',

  // Creator vs attendees (invisible labor tracking)
  created_by: 'parent1',
  attendees: ['child1', 'parent1'],

  // Recurrence
  recurrence: 'weekly',  // null, daily, weekly, monthly, yearly

  // Links
  googleEventId: 'google_event_123',

  // Triggers
  triggers_tasks: ['task_pack_snacks', 'task_arrange_carpool']
})

// DECISION (Recorded decisions)
CREATE (d:Decision {
  id: 'decision_uuid',
  familyId: 'fam_abc',

  title: 'Choose summer camp for Emma',
  description: 'Evaluated 5 camps based on schedule, cost, activities',

  // Decision-making split (invisible labor)
  researcher: 'parent1',  // Who did the research
  research_time: 180,  // 3 hours of invisible labor

  decider: 'parent2',  // Who made final choice
  decision_time: 15,  // 15 minutes of visible decision

  // Options considered
  options: [
    {name: 'Camp A', pros: '...', cons: '...', score: 0.75},
    {name: 'Camp B', pros: '...', cons: '...', score: 0.82}
  ],

  // Final choice
  chosen_option: 'Camp B',
  rationale: 'Better schedule fit, activities Emma enjoys',

  // Timestamps
  decided_at: timestamp
})

// ROUTINE (Recurring sequences)
CREATE (r:Routine {
  id: 'routine_uuid',
  familyId: 'fam_abc',

  type: 'morning_routine',  // morning, evening, mealtime, bedtime, custom

  // Sequence of tasks
  sequence: [
    {task_id: 'wake_children', order: 1, timing: '6:30am', duration: 15, assigned_to: 'parent1'},
    {task_id: 'prepare_breakfast', order: 2, timing: '6:45am', duration: 30, assigned_to: 'parent1'},
    {task_id: 'pack_lunches', order: 3, timing: '7:15am', duration: 20, assigned_to: 'parent1'}
  ],

  // Metrics
  consistency_rating: 0.87,  // How predictable (0-1)
  flexibility_rating: 0.42,  // How adaptable (0-1)

  // Ripple effects
  ripple_effects: {
    child_illness: {
      impact: 'Parent sleep loss (-2 hours) → Work performance decline',
      severity: 0.83,
      propagation_depth: 3  // Number of downstream impacts
    }
  }
})

// MESSAGE (Email/SMS for pattern detection)
CREATE (m:Message {
  id: 'message_uuid',
  familyId: 'fam_abc',

  type: 'email',  // email, sms, chat
  from: 'teacher@school.com',
  to: 'parent1@email.com',
  subject: 'Field trip permission needed',
  content: '...',

  // Extracted entities
  mentioned_tasks: ['task_sign_form', 'task_arrange_transportation'],
  mentioned_people: ['child1'],

  // Processing
  requires_action: true,
  action_taken_by: 'parent1',  // Invisible labor: who processed this

  timestamp: timestamp
})
```

---

### **Relationship Types (18+):**

```cypher
// =============================================================
// INVISIBLE LABOR RELATIONSHIPS (CRITICAL)
// =============================================================

// 1. ANTICIPATES - Proactive cognitive labor
CREATE (p:Person)-[a:ANTICIPATES {
  proactive: true,  // Did they notice unprompted?
  lead_time: 7,  // Days before deadline noticed
  confidence: 0.85  // How sure are we?
}]->(t:Task)

// 2. MONITORS - Follow-up burden
CREATE (monitor:Person)-[m:MONITORS {
  frequency: 'daily',  // daily, weekly, continuous
  intervention_count: 5,  // How many times had to follow up
  time_spent: 30,  // minutes per week
  creates_stress: 0.72  // Stress level from monitoring
}]->(t:Task)

// 3. IDENTIFIES_OPTIONS - Research labor (invisible!)
CREATE (researcher:Person)-[i:IDENTIFIES_OPTIONS {
  time_spent: 180,  // 3 hours of research
  research_depth: 'thorough',  // quick, moderate, thorough
  options_count: 5,
  sources_consulted: ['website', 'friend_recommendation', 'reviews']
}]->(d:Decision)

// 4. DECIDES - Decision authority
CREATE (decider:Person)-[d:DECIDES {
  decision_weight: 'final',  // final, consulted, informed
  consulted_others: true,
  decision_time: 15  // minutes to decide
}]->(d:Decision)

// 5. COORDINATES - Bridging labor (relay burden)
CREATE (coordinator:Person)-[c:COORDINATES {
  parties_connected: ['school', 'partner'],
  relay_frequency: 23,  // times per month
  bridge_domains: ['school', 'home'],
  time_burden: 120  // minutes per month
}]->(r:Responsibility)

// 6. EXECUTES - Actual doer (visible labor)
CREATE (doer:Person)-[e:EXECUTES {
  execution_time: 30,  // minutes
  difficulty: 'moderate'
}]->(t:Task)

// 7. SEES_NEED - Who notices vs who doesn't
CREATE (observer:Person)-[s:SEES_NEED {
  noticed_at: timestamp,
  communicated: false  // Did they tell others?
}]->(t:Task)

// =============================================================
// TASK RELATIONSHIPS
// =============================================================

// 8. ASSIGNED_TO - Task ownership
CREATE (p:Person)-[a:ASSIGNED_TO {
  assignment_method: 'explicit',  // explicit, implicit, default
  contested: false,  // Is assignment disputed?
  visibility: 'visible'  // visible, hidden
}]->(t:Task)

// 9. DEPENDS_ON - Blocking dependencies
CREATE (t1:Task)-[d:DEPENDS_ON {
  criticality: 'high',  // high, medium, low
  dependency_type: 'prerequisite'  // prerequisite, related, optional
}]->(t2:Task)

// 10. TRIGGERS - Event-driven sequences
CREATE (e:Event)-[t:TRIGGERS {
  trigger_type: 'automatic',  // automatic, conditional
  downstream_count: 3  // Number of tasks triggered
}]->(t:Task)

// 11. CONFLICTS_WITH - Scheduling conflicts
CREATE (e1:Event)-[c:CONFLICTS_WITH {
  overlap_duration: 60,  // minutes
  severity: 'high',  // high, medium, low
  resolution: 'pending'  // pending, resolved, ignored
}]->(e2:Event)

// =============================================================
// EMOTIONAL & IMPACT RELATIONSHIPS
// =============================================================

// 12. CREATES_STRESS_FOR - Emotional labor
CREATE (t:Task)-[c:CREATES_STRESS_FOR {
  stress_level: 0.78,  // 0-1
  frequency: 'daily',
  reason: 'Time pressure + uncertainty'
}]->(p:Person)

// 13. RIPPLE_EFFECTS - Cascading impacts
CREATE (e1:Event)-[r:RIPPLE_EFFECTS {
  severity: 0.83,
  propagation_depth: 3,
  impact_chain: ['child_illness', 'parent_sleep_loss', 'work_performance_decline']
}]->(e2:Event)

// =============================================================
// FAMILY RELATIONSHIPS
// =============================================================

// 14. PARENT_OF
CREATE (p1:Person)-[r:PARENT_OF {
  custody: 'full',  // full, joint, partial
  primary_caregiver: true
}]->(p2:Person)

// 15. CHILD_OF
CREATE (child:Person)-[r:CHILD_OF]->(parent:Person)

// 16. SPOUSE_OF / PARTNER_OF
CREATE (p1:Person)-[r:SPOUSE_OF {
  relationship_quality: 0.75,  // 0-1
  communication_effectiveness: 0.68
}]->(p2:Person)

// =============================================================
// FAIR PLAY RELATIONSHIPS
// =============================================================

// 17. OWNS_FAIR_PLAY_CARD - Complete responsibility ownership
CREATE (p:Person)-[o:OWNS_FAIR_PLAY_CARD {
  card_id: 'FP_023',
  all_phases: true,  // conception + planning + execution
  since: timestamp
}]->(r:Responsibility)

// 18. PARTIAL_OWNERSHIP - Split responsibility
CREATE (p:Person)-[o:PARTIAL_OWNERSHIP {
  phases: ['execution'],  // Which phases they own
  percentage: 0.33  // What % of total burden
}]->(r:Responsibility)
```

---

## 📋 **Fair Play 100-Card Taxonomy Schema**

```javascript
// src/config/fairPlayTaxonomy.js

export const FAIR_PLAY_CARDS = {
  // HOME (23 cards)
  home: [
    {
      id: 'FP_001',
      name: 'Home Goods & Supplies',
      category: 'home',
      difficulty: 'moderate',
      typical_time_per_week: 60,
      phases: {
        conception: 'Notice when items running low',
        planning: 'Create shopping list, compare prices, decide where to buy',
        execution: 'Purchase and restock items'
      },
      invisible_labor_percentage: 0.65,  // 65% is conception + planning
      recurrence: 'weekly',
      skills_required: ['organization', 'budgeting'],
      ripple_effects: ['If missed: household disruption, emergency store runs']
    },
    {
      id: 'FP_002',
      name: 'Home Maintenance',
      category: 'home',
      difficulty: 'high',
      typical_time_per_week: 90,
      phases: {
        conception: 'Notice issues, anticipate seasonal needs',
        planning: 'Research contractors, get quotes, schedule',
        execution: 'Coordinate repairs, oversee work'
      },
      invisible_labor_percentage: 0.75,
      recurrence: 'as_needed',
      skills_required: ['technical', 'budgeting', 'negotiation']
    },
    // ... 21 more home cards
  ],

  // OUT (22 cards)
  out: [
    {
      id: 'FP_024',
      name: 'Extracurricular Activities',
      category: 'out',
      difficulty: 'high',
      typical_time_per_week: 120,
      phases: {
        conception: 'Notice child interests, identify developmental needs',
        planning: 'Research options, compare schedules, costs, register',
        execution: 'Transport, coordinate with other parents, manage gear'
      },
      invisible_labor_percentage: 0.70,
      recurrence: 'seasonal',
      skills_required: ['research', 'coordination', 'budgeting']
    },
    // ... 21 more out cards
  ],

  // CAREGIVING (21 cards)
  caregiving: [
    {
      id: 'FP_046',
      name: 'Medical Appointments',
      category: 'caregiving',
      difficulty: 'high',
      typical_time_per_week: 45,
      phases: {
        conception: 'Track when checkups due, notice symptoms',
        planning: 'Research doctors, compare availability, coordinate schedules, arrange childcare',
        execution: 'Make appointments, transport, attend, follow up'
      },
      invisible_labor_percentage: 0.80,  // Huge invisible burden!
      recurrence: 'as_needed',
      skills_required: ['medical_knowledge', 'coordination', 'advocacy']
    },
    {
      id: 'FP_047',
      name: 'School Communication',
      category: 'caregiving',
      difficulty: 'very_high',
      typical_time_per_week: 180,  // 3 hours per week!
      phases: {
        conception: 'Monitor emails, notice important dates',
        planning: 'Identify which items need response, research requirements, draft communications',
        execution: 'Respond to emails, attend meetings, coordinate with teachers'
      },
      invisible_labor_percentage: 0.85,  // Extreme invisible burden
      recurrence: 'continuous',
      skills_required: ['communication', 'organization', 'advocacy']
    },
    // ... 19 more caregiving cards
  ],

  // MAGIC (13 cards - Special occasions, traditions)
  magic: [
    {
      id: 'FP_067',
      name: 'Birthday Parties',
      category: 'magic',
      difficulty: 'very_high',
      typical_time_per_month: 300,  // 5 hours when applicable
      phases: {
        conception: 'Track upcoming birthdays, anticipate child preferences',
        planning: 'Theme selection, guest list, venue research, budget, shopping list, coordinate RSVPs',
        execution: 'Purchase supplies, set up, host, cleanup, send thank-yous'
      },
      invisible_labor_percentage: 0.75,
      recurrence: 'annual',
      skills_required: ['creativity', 'organization', 'budgeting', 'social']
    },
    // ... 12 more magic cards
  ],

  // WILD (21 cards - Unexpected, irregular)
  wild: [
    {
      id: 'FP_080',
      name: 'Electronics & IT',
      category: 'wild',
      difficulty: 'high',
      typical_time_per_week: 30,
      phases: {
        conception: 'Notice tech issues, anticipate upgrades needed',
        planning: 'Research solutions, compare products, budget',
        execution: 'Purchase, set up, troubleshoot, maintain'
      },
      invisible_labor_percentage: 0.65,
      recurrence: 'as_needed',
      skills_required: ['technical', 'problem_solving']
    },
    // ... 20 more wild cards
  ]
};

// Total: 100 cards
// Each card represents 3 separate responsibilities (conception, planning, execution)
// Total responsibility points: 300
```

---

## 🧮 **Cypher Queries (Complete Implementation)**

```javascript
// server/graph/cypher-queries.js

export const INVISIBLE_LABOR_QUERIES = {

  // =============================================================
  // 1. ANTICIPATION BURDEN - Who notices what needs doing?
  // =============================================================
  anticipationBurden: `
    MATCH (p:Person)-[a:ANTICIPATES {proactive: true}]->(t:Task)
    WHERE NOT exists((other:Person)-[:ASSIGNED_TO]->(t))
      AND p.familyId = $familyId
    RETURN p.name AS person,
           count(t) AS tasks_anticipated,
           sum(t.complexity_score) AS anticipation_burden,
           avg(a.lead_time) AS avg_lead_time_days
    ORDER BY anticipation_burden DESC
  `,

  // =============================================================
  // 2. MONITORING OVERHEAD - "Nagging coefficient"
  // =============================================================
  monitoringOverhead: `
    MATCH (monitor:Person)-[m:MONITORS]->(t:Task)-[:ASSIGNED_TO]->(assignee:Person)
    WHERE monitor <> assignee
      AND monitor.familyId = $familyId
    RETURN monitor.name AS monitor,
           count(m) AS monitoring_actions,
           collect(DISTINCT assignee.name) AS people_monitored,
           sum(m.time_spent) AS monitoring_hours_per_week,
           avg(m.intervention_count) AS avg_interventions_per_task
    ORDER BY monitoring_hours_per_week DESC
  `,

  // =============================================================
  // 3. DECISION-RESEARCH GAP - Invisible research labor
  // =============================================================
  decisionResearchGap: `
    MATCH (researcher:Person)-[i:IDENTIFIES_OPTIONS]->(d:Decision)-[:DECIDES]-(decider:Person)
    WHERE researcher <> decider
      AND researcher.familyId = $familyId
    RETURN researcher.name AS researcher,
           decider.name AS decider,
           count(d) AS decisions_researched_not_made,
           sum(i.time_spent) AS invisible_research_hours,
           avg(i.options_count) AS avg_options_generated
    ORDER BY invisible_research_hours DESC
  `,

  // =============================================================
  // 4. TASK CREATION VS EXECUTION SPLIT - 60/40 cognitive load
  // =============================================================
  taskCreationVsExecution: `
    MATCH (p:Person)
    WHERE p.familyId = $familyId

    OPTIONAL MATCH (p)-[:ANTICIPATES]->(created:Task)
    WITH p, count(created) AS tasks_created

    OPTIONAL MATCH (p)-[:EXECUTES]->(executed:Task)
    WITH p, tasks_created, count(executed) AS tasks_executed

    RETURN p.name AS person,
           tasks_created,
           tasks_executed,
           toFloat(tasks_created) / (tasks_created + tasks_executed) AS creation_ratio,
           toFloat(tasks_executed) / (tasks_created + tasks_executed) AS execution_ratio
    ORDER BY creation_ratio DESC
  `,

  // =============================================================
  // 5. BETWEENNESS CENTRALITY - Coordination bottleneck
  // =============================================================
  coordinationBottleneck: `
    CALL gds.betweenness.stream('family_network', {
      relationshipTypes: ['COORDINATES', 'MONITORS', 'TRIGGERS']
    })
    YIELD nodeId, score
    MATCH (p:Person) WHERE id(p) = nodeId AND p.familyId = $familyId
    RETURN p.name AS person,
           score AS coordination_burden,
           p.cognitive_load_score AS current_load
    ORDER BY score DESC
    LIMIT 5
  `,

  // =============================================================
  // 6. COMMUNITY FRAGMENTATION - Context-switching burden
  // =============================================================
  communityFragmentation: `
    CALL gds.louvain.stream('task_network')
    YIELD nodeId, communityId
    MATCH (t:Task)-[:ASSIGNED_TO]->(p:Person)
    WHERE id(t) = nodeId AND p.familyId = $familyId
    RETURN p.name AS person,
           count(DISTINCT communityId) AS task_clusters,
           collect(DISTINCT communityId) AS cluster_ids,
           count(t) AS total_tasks
    ORDER BY task_clusters DESC
  `,

  // =============================================================
  // 7. DEPENDENCY CHAINS - What breaks if person unavailable?
  // =============================================================
  dependencyImpact: `
    MATCH path = (p:Person)-[:ASSIGNED_TO]->(t:Task)<-[:DEPENDS_ON*1..3]-(dependent:Task)
    WHERE p.familyId = $familyId
    RETURN p.name AS person,
           count(DISTINCT dependent) AS dependent_tasks,
           collect(DISTINCT dependent.title)[0..5] AS sample_dependencies,
           max(length(path)) AS max_chain_length
    ORDER BY dependent_tasks DESC
    LIMIT 5
  `,

  // =============================================================
  // 8. FAIR PLAY PHASE DISTRIBUTION - Invisible vs visible work
  // =============================================================
  fairPlayPhaseDistribution: `
    MATCH (p:Person)-[:EXECUTES|ANTICIPATES|MONITORS]->(t:Task)
    WHERE p.familyId = $familyId AND t.fairPlayCardId IS NOT NULL

    WITH p,
         sum(t.conceptionPhase.time) AS conception_time,
         sum(t.planningPhase.time) AS planning_time,
         sum(t.executionPhase.time) AS execution_time

    RETURN p.name AS person,
           conception_time + planning_time AS invisible_labor_minutes,
           execution_time AS visible_labor_minutes,
           toFloat(conception_time + planning_time) / (conception_time + planning_time + execution_time) AS invisible_percentage
    ORDER BY invisible_percentage DESC
  `,

  // =============================================================
  // 9. RIPPLE EFFECT ANALYSIS - Cascading impact of disruptions
  // =============================================================
  rippleEffectAnalysis: `
    MATCH (trigger:Event)-[r:RIPPLE_EFFECTS*1..3]->(impacted:Event)
    WHERE trigger.familyId = $familyId
    RETURN trigger.title AS triggering_event,
           count(DISTINCT impacted) AS impacted_events,
           max(length(r)) AS max_ripple_depth,
           avg([rel in r | rel.severity]) AS avg_severity
    ORDER BY impacted_events DESC
    LIMIT 10
  `,

  // =============================================================
  // 10. TEMPORAL PATTERN - When do tasks get created?
  // =============================================================
  temporalTaskCreation: `
    MATCH (p:Person)-[:ANTICIPATES]->(t:Task)
    WHERE p.familyId = $familyId
      AND t.createdAt >= datetime($startDate)
      AND t.createdAt <= datetime($endDate)

    RETURN p.name AS person,
           date(t.createdAt).dayOfWeek AS day_of_week,
           t.createdAt.hour AS hour_of_day,
           count(t) AS tasks_created
    ORDER BY day_of_week, hour_of_day
  `
};
```

---

## 🐍 **Python Embedding Service (LibKGE)**

```python
# functions/graph/services/embedding_service.py

import numpy as np
from libkge import KgeModel
from libkge.job import TrainingJob
from libkge.util.io import load_checkpoint
import firebase_admin
from firebase_admin import firestore
import json

class GraphEmbeddingService:
    """
    Generate graph embeddings using LibKGE (RotatE/ComplEx models)
    for link prediction and entity similarity
    """

    def __init__(self):
        self.db = firestore.client()
        self.models = {
            'rotate': None,  # Best for composition patterns (A parent_of B, B has_task C → A monitors C)
            'complex': None  # Best for symmetric relationships (siblings, spouses)
        }
        self.dimension = 100  # Embedding dimension

    def export_graph_to_triples(self, family_id):
        """
        Export Neo4j graph to triple format for LibKGE
        (subject, relation, object)
        """
        # Query Firestore for graph nodes/edges
        nodes = self.db.collection('graphNodes').where('familyId', '==', family_id).stream()
        edges = self.db.collection('graphEdges').where('familyId', '==', family_id).stream()

        triples = []
        entity_to_id = {}
        relation_to_id = {}

        # Build entity mapping
        for node in nodes:
            entity_to_id[node.id] = len(entity_to_id)

        # Build relation mapping and triples
        for edge in edges:
            edge_data = edge.to_dict()

            source = edge_data['sourceNodeId']
            target = edge_data['targetNodeId']
            relation = edge_data['edgeType']

            if relation not in relation_to_id:
                relation_to_id[relation] = len(relation_to_id)

            triples.append([
                entity_to_id[source],
                relation_to_id[relation],
                entity_to_id[target]
            ])

        return np.array(triples), entity_to_id, relation_to_id

    def train_rotate_embeddings(self, family_id):
        """
        Train RotatE model for composition patterns

        RotatE represents relations as rotations in complex space:
        h + r ≈ t  (head + relation ≈ tail)

        Perfect for: parent_of + has_task = monitors
        """
        triples, entity_map, relation_map = self.export_graph_to_triples(family_id)

        # LibKGE configuration
        config = {
            'job.type': 'train',
            'model': 'rotate',
            'dataset': {
                'name': f'family_{family_id}',
                'num_entities': len(entity_map),
                'num_relations': len(relation_map),
                'files': {
                    'train': triples
                }
            },
            'train': {
                'optimizer': 'Adam',
                'lr': 0.0005,
                'batch_size': 128,
                'max_epochs': 500
            },
            'model.rotate': {
                'entity_dim': self.dimension,
                'relation_dim': self.dimension
            },
            'negative_sampling': {
                'type': 'self_adversarial',
                'alpha': 1.0  # Weight hard negatives
            }
        }

        # Train model
        job = TrainingJob.create(config)
        job.run()

        # Save embeddings
        self.models['rotate'] = job.model

        # Export embeddings to Firestore
        entity_embeddings = job.model.get_s_embedder().embed_all().detach().numpy()
        relation_embeddings = job.model.get_p_embedder().embed_all().detach().numpy()

        # Store in Firestore for fast lookup
        self.db.collection('graphEmbeddings').document(f'{family_id}_rotate').set({
            'familyId': family_id,
            'model': 'rotate',
            'dimension': self.dimension,
            'entity_embeddings': entity_embeddings.tolist(),
            'relation_embeddings': relation_embeddings.tolist(),
            'entity_map': entity_map,
            'relation_map': relation_map,
            'trained_at': firestore.SERVER_TIMESTAMP
        })

        return entity_embeddings, relation_embeddings

    def predict_link(self, head_entity, relation, tail_entity, model='rotate'):
        """
        Predict probability of missing link (task assignment recommendation)

        Example: predict_link('parent2', 'ASSIGNED_TO', 'task_school_email')
        Returns: score (higher = more likely good assignment)
        """
        if self.models[model] is None:
            raise ValueError(f'Model {model} not trained yet')

        # Get embeddings
        h = self.models[model].get_s_embedder().embed(head_entity)
        r = self.models[model].get_p_embedder().embed(relation)
        t = self.models[model].get_s_embedder().embed(tail_entity)

        # RotatE scoring: ||h + r - t||
        score = -torch.norm(h + r - t, p=2).item()

        # Convert to probability (higher score = better match)
        probability = 1 / (1 + np.exp(-score))

        return probability

    def recommend_task_assignments(self, family_id, task_id, top_k=3):
        """
        Recommend which family member should be assigned a task

        Uses embedding-based scoring + fairness constraints
        """
        # Get all family members
        members = self.db.collection('families').document(family_id) \
            .collection('members').stream()

        member_scores = []

        for member in members:
            member_id = member.id

            # 1. Embedding-based capability score
            capability_score = self.predict_link(
                member_id,
                'ASSIGNED_TO',
                task_id,
                model='rotate'
            )

            # 2. Fairness weight (penalize overloaded members)
            member_data = member.to_dict()
            current_load = member_data.get('cognitive_load_score', 0)
            fairness_weight = max(0.1, 1.0 - current_load)

            # 3. Final score
            final_score = capability_score * fairness_weight

            member_scores.append({
                'member_id': member_id,
                'member_name': member_data.get('name'),
                'capability_score': capability_score,
                'current_load': current_load,
                'fairness_weight': fairness_weight,
                'final_score': final_score
            })

        # Sort by final score
        member_scores.sort(key=lambda x: x['final_score'], reverse=True)

        return member_scores[:top_k]

    def entity_similarity(self, entity1, entity2):
        """
        Calculate similarity between two entities (e.g., two tasks)

        Uses cosine similarity of embeddings
        """
        e1 = self.models['rotate'].get_s_embedder().embed(entity1)
        e2 = self.models['rotate'].get_s_embedder().embed(entity2)

        # Cosine similarity
        similarity = torch.nn.functional.cosine_similarity(e1, e2, dim=0).item()

        return similarity


# =============================================================
# Cloud Function Entry Point
# =============================================================

def train_embeddings_http(request):
    """
    HTTP Cloud Function to train embeddings

    Triggered via: POST /trainEmbeddings
    Body: { "familyId": "fam_abc" }
    """
    request_json = request.get_json()
    family_id = request_json.get('familyId')

    if not family_id:
        return {'error': 'familyId required'}, 400

    service = GraphEmbeddingService()

    # Train RotatE embeddings
    entity_emb, relation_emb = service.train_rotate_embeddings(family_id)

    return {
        'success': True,
        'familyId': family_id,
        'model': 'rotate',
        'num_entities': len(entity_emb),
        'num_relations': len(relation_emb)
    }, 200


def recommend_assignment_http(request):
    """
    HTTP Cloud Function to get task assignment recommendations

    Triggered via: POST /recommendAssignment
    Body: { "familyId": "fam_abc", "taskId": "task_123" }
    """
    request_json = request.get_json()
    family_id = request_json.get('familyId')
    task_id = request_json.get('taskId')

    if not family_id or not task_id:
        return {'error': 'familyId and taskId required'}, 400

    service = GraphEmbeddingService()
    recommendations = service.recommend_task_assignments(family_id, task_id, top_k=3)

    return {
        'success': True,
        'task_id': task_id,
        'recommendations': recommendations
    }, 200
```

---

## 🚀 **20-Week Implementation Roadmap**

### **Phase 1: Foundation (Weeks 1-4)**
**Goal:** Neo4j setup + Fair Play taxonomy + Basic invisible labor tracking

**Week 1: Infrastructure Setup**
- ✅ Install Neo4j (Docker setup with `neo4j/docker-compose.yml`)
- ✅ Configure Neo4j driver in Node.js (`server/graph/neo4j-client.js`)
- ✅ Create Fair Play 100-card taxonomy schema (`src/config/fairPlayTaxonomy.js`)
- ✅ Define all 18+ relationship types (`neo4j/schemas/relationship-types.cypher`)
- ✅ Set up Python Cloud Functions environment for embeddings

**Week 2: Data Ingestion**
- ✅ Build `DataAggregationService.js` to pull from all sources (surveys, interviews, chat, calendar, tasks)
- ✅ Implement entity resolution (Jaro-Winkler + collective resolution)
- ✅ Multi-source confidence fusion
- ✅ Create initial graph population script (Firestore → Neo4j)

**Week 3: Invisible Labor Engine**
- ✅ Implement `InvisibleLaborEngine.js`
- ✅ Build Cypher queries: anticipation burden, monitoring overhead, decision-research gap
- ✅ Task creation vs execution tracking
- ✅ Fair Play phase tracking (conception, planning, execution)

**Week 4: Basic Insights Dashboard**
- ✅ Create `InvisibleLaborDashboard.jsx` component
- ✅ Visualize 60/40 cognitive load split (bar charts)
- ✅ Task creation by person
- ✅ Monitoring burden by person
- ✅ Anticipation gap visualization

**Deliverable:** See the 60/40 cognitive labor split even though task execution looks 50/50

---

### **Phase 2: Dependencies & Graph Analysis (Weeks 5-8)**
**Goal:** Centrality algorithms + dependency chains + child insights

**Week 5: Neo4j GDS Integration**
- ✅ Implement `CentralityCalculator.js` wrapping Neo4j GDS
- ✅ Betweenness centrality (coordination bottleneck detection)
- ✅ PageRank (dependency burden)
- ✅ Louvain community detection (task clustering)

**Week 6: Dependency Analysis**
- ✅ Build `DependencyAnalyzer.js`
- ✅ Path analysis: "What breaks if person X unavailable?"
- ✅ Critical path identification
- ✅ `DependencyChainView.jsx` component (visual chains)

**Week 7: Child Insights Engine**
- ✅ Implement `ChildInsightEngine.js`
- ✅ Claude integration with child-specific prompts
- ✅ Personality analysis (Big 5)
- ✅ Talent detection
- ✅ Challenge identification
- ✅ `ChildProfileCard.jsx` component

**Week 8: Confidence Scoring**
- ✅ Build `ConfidenceScorer.js`
- ✅ Multi-source evidence weighting
- ✅ Confidence thresholds (>75% = cache, <75% = regenerate)
- ✅ `ConfidenceBadge.jsx` visual indicator

**Deliverable:** Identify top 5 single-point-of-failure responsibilities + 5+ child insights per child

---

### **Phase 3: Embeddings & Patterns (Weeks 9-12)**
**Goal:** Graph embeddings + temporal patterns + parent dynamics

**Week 9: Python Embedding Service**
- ✅ Set up LibKGE/NeuralKG in Python Cloud Functions
- ✅ Implement RotatE model training (`embedding_service.py`)
- ✅ ComplEx model for symmetric relationships
- ✅ Export Neo4j graph to triple format
- ✅ Train embeddings on family graph

**Week 10: Link Prediction**
- ✅ Build link prediction for task recommendations
- ✅ Fairness-constrained scoring (capability × load_capacity)
- ✅ Entity similarity calculations
- ✅ HTTP Cloud Function endpoints (`/trainEmbeddings`, `/recommendAssignment`)

**Week 11: Temporal Pattern Detection**
- ✅ Implement `TemporalPatternDetector.js`
- ✅ Task creation time analysis (Sunday night spike detection)
- ✅ Routine identification
- ✅ Seasonal pattern detection
- ✅ Temporal Cypher queries

**Week 12: Parent Dynamics Engine**
- ✅ Build `ParentDynamicsEngine.js`
- ✅ Communication pattern analysis (relay frequency)
- ✅ Decision-making authority by domain
- ✅ Conflict pattern detection
- ✅ Natural language insights ("You're the coordinator between school and home - 23x/month")

**Deliverable:** Generate 10+ validated pattern insights + embedding-based recommendations

---

### **Phase 4: Recommendations & Load Balancing (Weeks 13-16)**
**Goal:** Recommendation engine + load redistribution + fairness metrics

**Week 13: Recommendation Engine**
- ✅ Build `RecommendationEngine.js`
- ✅ Skill-based matching
- ✅ Load balancing algorithm
- ✅ Cluster completeness scoring
- ✅ Multi-objective optimization (completion × fairness × skill_development)

**Week 14: Fairness Metrics**
- ✅ Implement `FairnessMetricsCalculator.js`
- ✅ Gini coefficient (0-1 inequality score)
- ✅ Theil Index (decomposable inequality)
- ✅ Composite fairness score (time + task-type + complexity + preference)

**Week 15: Load Balancing UI**
- ✅ Create `LoadBalancingProposal.jsx`
- ✅ Impact projection: "Reduces your monitoring burden 18%, saves 2 hours/week"
- ✅ Skill match visualization
- ✅ Cluster ownership transfer UI
- ✅ `ImpactProjection.jsx` component

**Week 16: Self-Reflection Engine**
- ✅ Build `SelfReflectionEngine.js`
- ✅ Stress trigger analysis
- ✅ Time allocation tracker
- ✅ Personal cognitive load trends
- ✅ Growth areas identification

**Deliverable:** Top 5 load redistribution recommendations with impact projections

---

### **Phase 5: Visual Knowledge Graph (Weeks 17-20)**
**Goal:** Dual-pane interface + D3/Cytoscape visualization + real-time sync

**Week 17: Graph Visualization Core**
- ✅ Implement `VisualGraphMode.jsx` with D3.js
- ✅ Force-directed layout with 18+ node types
- ✅ Edge rendering with relationship types
- ✅ Interactive zoom, pan, filter controls
- ✅ Graph legend component

**Week 18: Cytoscape.js Integration**
- ✅ Add Cytoscape.js for advanced layouts (hierarchical, circular, grid)
- ✅ 20+ layout algorithms
- ✅ Touch-screen compatibility for mobile
- ✅ Performance optimization (Canvas rendering for >1000 nodes)

**Week 19: Dual-Pane Layout**
- ✅ Build `DualPaneLayout.jsx` (50% chat, 50% graph)
- ✅ Real-time sync: chat mentions → graph node pulses
- ✅ Click node → display insight in chat
- ✅ `ChatInsightMode.jsx` conversational interface
- ✅ `AudioBriefingMode.jsx` voice insights

**Week 20: Proactive Alerts & Polish**
- ✅ Implement `ProactiveAlertEngine.js`
- ✅ Predictive task generation ("Winter approaching → suggest furnace service")
- ✅ Conflict detection ("Doctor appointment conflicts with Partner's meeting")
- ✅ Smart notifications (importance >0.8 triggers alert)
- ✅ UI polish, mobile optimization, final testing

**Deliverable:** Complete dual-interface knowledge graph with proactive suggestions

---

## ✅ **Success Metrics**

### **Invisible Labor:**
- ✅ Visualize 60/40 cognitive load split (even with 50/50 execution)
- ✅ Identify top 5 single-point-of-failure responsibilities
- ✅ Generate 10+ specific validated patterns ("Sunday night creates 40% of week's tasks")

### **Child Insights:**
- ✅ 90%+ confidence on personality insights
- ✅ 5+ actionable insights per child within first week
- ✅ Parents discover 3+ unknown traits per child

### **Recommendations:**
- ✅ Top 5 load redistribution suggestions with impact projections
- ✅ Implement 2 recommendations, measure cognitive load reduction
- ✅ 5 proactive task suggestions per week

### **System Performance:**
- ✅ <3s load time for knowledge graph
- ✅ <2s insight generation on query
- ✅ Real-time graph updates (<500ms)

### **User Satisfaction:**
- ✅ Sustain 55/45 cognitive load split for 6+ months
- ✅ Proactive alerts prevent 2+ issues per month
- ✅ High daily engagement

---

## 🔧 **Technical Setup Instructions**

### **1. Neo4j Setup (Docker)**

```bash
# Create Neo4j directory
cd parentload-clean
mkdir neo4j
cd neo4j

# Create docker-compose.yml
cat > docker-compose.yml <<EOF
version: '3'
services:
  neo4j:
    image: neo4j:5.15-enterprise
    container_name: allie-neo4j
    ports:
      - "7474:7474"  # HTTP
      - "7687:7687"  # Bolt
    environment:
      - NEO4J_AUTH=neo4j/parentload_secure_password
      - NEO4J_ACCEPT_LICENSE_AGREEMENT=yes
      - NEO4J_dbms_memory_heap_max__size=2G
      - NEO4J_dbms_memory_pagecache_size=1G
      - NEO4JLABS_PLUGINS=["graph-data-science"]
    volumes:
      - ./data:/data
      - ./logs:/logs
      - ./import:/var/lib/neo4j/import
      - ./plugins:/plugins
EOF

# Start Neo4j
docker-compose up -d

# Check logs
docker logs allie-neo4j

# Access Neo4j Browser: http://localhost:7474
# Login: neo4j / parentload_secure_password
```

### **2. Python Cloud Functions Setup**

```bash
# Create Python functions directory
cd functions
mkdir graph
cd graph

# Create requirements.txt
cat > requirements.txt <<EOF
firebase-admin==6.3.0
google-cloud-firestore==2.14.0
libkge==0.1.0
torch==2.1.2
numpy==1.24.3
flask==3.0.0
EOF

# Create main.py
cat > main.py <<EOF
from services.embedding_service import train_embeddings_http, recommend_assignment_http
from services.entity_resolution import resolve_entities_http

# Export Cloud Functions
train_embeddings = train_embeddings_http
recommend_assignment = recommend_assignment_http
resolve_entities = resolve_entities_http
EOF

# Deploy to Cloud Functions
gcloud functions deploy trainEmbeddings \
  --runtime python311 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point train_embeddings \
  --memory 2GB \
  --timeout 540s

gcloud functions deploy recommendAssignment \
  --runtime python311 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point recommend_assignment \
  --memory 1GB \
  --timeout 60s
```

### **3. Node.js Neo4j Client Setup**

```bash
# Install Neo4j driver
npm install neo4j-driver

# Create Neo4j client
cat > server/graph/neo4j-client.js <<EOF
import neo4j from 'neo4j-driver';

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'parentload_secure_password'
  ),
  {
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 60000
  }
);

export async function runQuery(cypher, params = {}) {
  const session = driver.session();
  try {
    const result = await session.run(cypher, params);
    return result.records.map(record => record.toObject());
  } finally {
    await session.close();
  }
}

export async function runWriteQuery(cypher, params = {}) {
  const session = driver.session({ defaultAccessMode: neo4j.session.WRITE });
  try {
    const result = await session.run(cypher, params);
    return result.records.map(record => record.toObject());
  } finally {
    await session.close();
  }
}

export default driver;
EOF
```

### **4. Load Fair Play Taxonomy into Neo4j**

```bash
# Create Fair Play schema script
cat > neo4j/schemas/fair-play-cards.cypher <<EOF
// Create all 100 Fair Play cards as nodes

// HOME CARDS (23)
CREATE (fp001:FairPlayCard {
  id: 'FP_001',
  name: 'Home Goods & Supplies',
  category: 'home',
  difficulty: 'moderate',
  typical_time_per_week: 60,
  invisible_labor_percentage: 0.65,
  conception: 'Notice when items running low',
  planning: 'Create shopping list, compare prices, decide where to buy',
  execution: 'Purchase and restock items',
  recurrence: 'weekly'
})

// ... (create all 100 cards)

// Create PART_OF relationships to organize cards
CREATE (home:Category {name: 'Home'})
CREATE (out:Category {name: 'Out'})
CREATE (caregiving:Category {name: 'Caregiving'})
CREATE (magic:Category {name: 'Magic'})
CREATE (wild:Category {name: 'Wild'})

MATCH (card:FairPlayCard {category: 'home'})
MATCH (cat:Category {name: 'Home'})
CREATE (card)-[:PART_OF]->(cat)
EOF

# Load into Neo4j
docker exec -i allie-neo4j cypher-shell -u neo4j -p parentload_secure_password < neo4j/schemas/fair-play-cards.cypher
```

---

## 🎯 **Next Steps**

1. ✅ **Confirm this revised plan meets all requirements**
2. ✅ **Begin Week 1 implementation:**
   - Set up Neo4j Docker container
   - Configure Node.js Neo4j client
   - Create Fair Play taxonomy schema
   - Set up Python Cloud Functions

3. ✅ **Week 2: Start data ingestion**
4. ✅ **Week 3: Build invisible labor queries**

---

**Status:** READY TO BUILD! Complete plan with Neo4j, Fair Play, embeddings, all research components integrated.

**Deferred to Phase 6:**
- Multi-family benchmarking
- Differential privacy & ReBAC (advanced privacy)
- Advanced timeline visualizations (heat maps, spiral, Gantt)

**Total Timeline:** 20 weeks to full system
**MVP:** Week 4 (invisible labor visibility)
**Production-Ready:** Week 20 (complete dual-interface system with proactive AI)
