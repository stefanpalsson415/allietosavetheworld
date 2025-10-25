# Agent-Driven Palsson Family Simulation Plan

**Date:** October 19, 2025
**Purpose:** Create AI agents with realistic personas that simulate 1 year of app usage + test EE user-driven process

---

## 👨‍👩‍👧‍👦 The Palsson Family (Your Real Family!)

### **Stefan Palsson** (Parent 1 - Father)
**Age:** Mid-30s to early-40s
**Personality Traits:**
- Well-intentioned but overwhelmed
- Wants to contribute but lacks visibility into what needs doing
- Handles dishes and laundry (visible tasks)
- Work-life balance struggles (Poor rating)
- Underestimates invisible labor (thinks Kimberly carries 43% when she actually carries 87%)

**Behavioral Patterns:**
- **Task Creation:** Creates 15% of family tasks (mostly visible: errands, physical chores)
- **Calendar Usage:** Weekly - adds work meetings, kid pickups when specifically assigned
- **Document Uploads:** Rare - only when explicitly reminded
- **Survey Participation:** 50% completion rate (forgets unless nudged)
- **Response Style:** Brief, action-oriented ("Got it", "On it", "Done")
- **Strengths:** Consistent with assigned tasks (Oly's science club, Tegner's swimming)

### **Kimberly Palsson** (Parent 2 - Mother)
**Age:** Mid-30s to early-40s
**Personality Traits:**
- Chief Mental Load Officer
- Always the one who remembers everything
- Anticipates needs before they become urgent
- Stressed about logistics and coordination
- Feels unseen in her invisible labor

**Behavioral Patterns:**
- **Task Creation:** Creates 85% of family tasks (invisible labor: coordination, planning, anticipation)
- **Calendar Usage:** Daily - manages all 3 kids' activities + family events
- **Document Uploads:** Frequent - vaccination cards, permission slips, medical records
- **Survey Participation:** 95% completion rate (values self-reflection)
- **Response Style:** Detailed, context-rich ("Lillian has volleyball at 4pm, but we need to leave by 3:30 because...")
- **Invisible Work:** Coordinates 3 kids' activities (6+ hours/week), weight score 13.4

### **Lillian Palsson** (Child 1)
**Age:** 14
**Personality Traits:**
- Independent and helpful (after transformation)
- Busy with school
- Becoming more responsible

**Behavioral Patterns:**
- **Activities:** Volleyball practice 2x/week, plant care habit
- **Task Participation:** Minimal at start → increases over year
- **Response to Allie:** Initially skeptical → becomes engaged user
- **Strengths:** School organization, remembers her own schedule

### **Oly Palsson** (Child 2)
**Age:** 11
**Personality Traits:**
- Wants to help but doesn't always know how
- Science-oriented (science club, science fair)
- Social (classmate birthday parties)

**Behavioral Patterns:**
- **Activities:** Science club (Thursday 3:30pm), experiments with Tegner
- **Task Participation:** Eager but needs guidance
- **Response to Allie:** Asks lots of questions, loves science experiment suggestions
- **Study Time Habit:** Developing consistency with Allie's help

### **Tegner Palsson** (Child 3)
**Age:** 7
**Personality Traits:**
- Full of energy
- Gets bored easily ("There's nothing to dooooo!")
- Loves science experiments and swimming

**Behavioral Patterns:**
- **Activities:** Swimming lessons (Wednesdays with Stefan), science experiments with Oly
- **Task Participation:** Simple morning chores
- **Sleep Improvement:** 40% better when Stefan reads stories
- **Response to Allie:** Short attention span but loves activity suggestions

---

## 🤖 Agent Architecture

### Core Agent Components:

**1. PersonaAgent** (Base class)
```javascript
class PersonaAgent {
  constructor(profile) {
    this.userId = profile.userId;
    this.name = profile.name;
    this.role = profile.role; // 'parent' | 'child'
    this.personality = profile.personality;
    this.behaviorPatterns = profile.behaviorPatterns;
    this.currentState = { mood: 'neutral', energy: 1.0, stress: 0.5 };
  }

  // Core decision-making
  async decideNextAction(context) {
    // Uses Claude API with persona prompt
    // Returns: { action: 'createTask' | 'completeChore' | 'uploadDoc' | 'chat', data: {...} }
  }

  // Simulate time passage
  tick(minutesElapsed) {
    // Update mood, energy, stress based on time and events
  }

  // Respond to Allie's suggestions
  async respondToSuggestion(suggestion) {
    // Personality-based acceptance rate
  }
}
```

**2. StefanAgent extends PersonaAgent**
```javascript
class StefanAgent extends PersonaAgent {
  constructor() {
    super({
      name: 'Stefan',
      personality: {
        helpfulness: 0.8,
        awareness: 0.3,  // Low visibility into invisible labor
        followThrough: 0.9,  // High once task is assigned
        initiative: 0.4,  // Needs prompting
        detailOrientation: 0.5
      },
      behaviorPatterns: {
        taskCreationRate: 0.15,  // Creates 15% of tasks
        calendarCheckFrequency: 'weekly',
        surveyCompletionRate: 0.5,
        documentUploadLikelihood: 0.2,
        responseStyle: 'brief'
      }
    });
  }

  async decideNextAction(context) {
    // Stefan-specific decision logic
    // More likely to create tasks on weekends
    // Responds to explicit assignments
    // Underestimates time requirements
  }
}
```

**3. KimberlyAgent extends PersonaAgent**
```javascript
class KimberlyAgent extends PersonaAgent {
  constructor() {
    super({
      name: 'Kimberly',
      personality: {
        helpfulness: 1.0,
        awareness: 0.95,  // High visibility into family needs
        followThrough: 0.98,
        initiative: 0.95,
        detailOrientation: 0.9
      },
      behaviorPatterns: {
        taskCreationRate: 0.85,  // Creates 85% of tasks
        anticipationWindow: '3-7 days',  // Plans ahead
        calendarCheckFrequency: 'daily',
        surveyCompletionRate: 0.95,
        documentUploadLikelihood: 0.9,
        responseStyle: 'detailed'
      }
    });
  }

  async decideNextAction(context) {
    // Kimberly-specific logic
    // Anticipates needs (permission slips, appointments)
    // Creates tasks before they become urgent
    // Coordinates multiple activities simultaneously
  }
}
```

**4. ChildAgent extends PersonaAgent** (for Lillian, Oly, Tegner)
```javascript
class ChildAgent extends PersonaAgent {
  constructor(profile) {
    super({
      ...profile,
      personality: {
        curiosity: profile.age < 10 ? 0.9 : 0.6,
        responsibility: profile.age * 0.05,  // Grows with age
        initiative: profile.age * 0.04,
        boredomThreshold: 10 - profile.age  // Younger = bores faster
      }
    });
  }

  // Children have simpler decision trees
  async decideNextAction(context) {
    // Age-appropriate actions
    // Lillian: More independent, creates own tasks
    // Oly: Asks questions, seeks help
    // Tegner: Gets bored, needs activity suggestions
  }
}
```

---

## 📅 Simulation Timeline (1 Year Simulation)

### **Phase 1: Chaos (Months 1-2)** - Before Allie
- Kimberly stress: **87%**
- Stefan awareness: **30%**
- Missed events: **12**
- Family conflict: **High**

**Agent Behaviors:**
- Kimberly creates 40+ tasks/week manually
- Stefan misses 50% of kid activities
- Permission slips uploaded day-before deadline
- Survey responses: Stefan 20%, Kimberly 90%

### **Phase 2: Discovery (Months 3-4)** - Onboarding
- Complete multi-person interview (all 5 agents)
- Fair Play assessment (72 questions, both parents)
- Initial invisible labor analysis reveals gap
- Stefan's awareness increases: **30% → 55%**

**Agent Behaviors:**
- Agents answer interview questions based on personas
- Kimberly reveals coordination burden
- Stefan realizes perception gap (thought 43%, actually 87%)

### **Phase 3: Integration (Months 5-7)** - Habit Formation
- Allie starts suggesting task redistributions
- Stefan takes on: Oly's science club, Tegner's swimming
- Family implements weekly check-ins
- Kimberly stress: **87% → 62%**

**Agent Behaviors:**
- Stefan accepts 60% of Allie's suggestions (grows to 85%)
- Children develop chore habits (Lillian: plants, Oly: study, Tegner: morning)
- Document uploads increase: Stefan 20% → 60%

### **Phase 4: Transformation (Months 8-10)** - Balanced System
- Mental load: Kimberly 62%, Stefan 48% (balanced!)
- Family conflict: **Low**
- Kids contributing meaningfully
- Calendar coordination automated

**Agent Behaviors:**
- Stefan proactively creates tasks (15% → 40%)
- Allie handles 80% of invisible coordination
- Children use Allie for homework help, activity ideas

### **Phase 5: Thriving (Months 11-12)** - Peak Performance
- Kimberly feels **"Energized & Supported"**
- Stefan **"Balanced & Present"**
- Children **"Contributing & Proud"**
- Knowledge Graph shows balanced family system

**Agent Behaviors:**
- Agents use Allie naturally for all coordination
- Neo4j graph shows healthy relationship patterns
- Predictive insights prevent conflicts before they happen

---

## 🎭 Realistic Behavior Simulation

### **Task Creation Patterns:**

**Kimberly's Tasks (85%):**
```javascript
// Morning (6am-9am): Coordination tasks
{
  type: 'invisible_labor',
  title: 'Coordinate who takes Lillian to volleyball',
  anticipation: true,
  created: '2025-11-20 06:30', // 3 days before practice
  weight: 8.2
}

// Afternoon (2pm-5pm): Permission slips, appointments
{
  type: 'admin',
  title: 'Upload Oly\'s vaccination records for science camp',
  deadline: '2025-12-01',
  documents: ['vaccination_card.jpg'],
  weight: 11.3
}

// Evening (8pm-10pm): Next-day planning
{
  type: 'monitoring',
  title: 'Check if Tegner has clean swim clothes for tomorrow',
  weight: 3.1
}
```

**Stefan's Tasks (15% → 40% with Allie):**
```javascript
// Weekends: Physical tasks
{
  type: 'chore',
  title: 'Grocery shopping',
  completed: true,
  style: 'brief'  // No detailed list, just "got groceries"
}

// After Allie intervention:
{
  type: 'coordination',
  title: 'Take Oly to science club Thursday 3:30pm',
  assignedBy: 'Allie',
  accepted: true,
  calendarAdded: true
}
```

### **Document Upload Simulation:**

**Kimberly (90% upload rate):**
- Medical: Vaccination cards, doctor's notes
- School: Permission slips, report cards
- Activities: Registration forms, schedules

**Stefan (20% → 60% with Allie):**
- Initially: Only when explicitly asked
- With Allie: Receipts, activity photos, swim meet results

### **Survey Participation:**

**Weekly Check-ins:**
- Stefan: 5-minute version, skips open-ended questions initially
- Kimberly: Full 15-minute version, detailed responses
- Children: Lillian (10 min), Oly (7 min), Tegner (skips, too young)

**Fair Play Assessment (72 questions):**
- Stefan: 45 minutes, realizes gaps mid-survey
- Kimberly: 60 minutes, validates her experience

---

## 🧪 Testing EE (External Engineer) User-Driven Process

### **What This Tests:**

1. **Onboarding Flow:** Can EE follow documentation and create agent-driven family?
2. **Persona Definition:** Are personality traits configurable enough?
3. **Behavior Realism:** Do agents create believable family dynamics?
4. **Data Richness:** Does 1 year of simulation generate useful demo data?
5. **Knowledge Graph:** Does Neo4j show meaningful invisible labor patterns?

### **EE Tasks:**

**Task 1: Setup Agent System** (2-4 hours)
```bash
# Install dependencies
npm install @anthropic-ai/sdk faker moment

# Create Palsson family agents
node scripts/create-agent-family.js --family=palsson

# Verify agent personas loaded correctly
node scripts/verify-agents.js
```

**Task 2: Run 1-Year Simulation** (8-12 hours compute time)
```bash
# Simulate 1 year at 10x speed (36 days real time → 1 year sim time)
node scripts/simulate-family-year.js --family=palsson --speed=10x

# OR fast mode: 100x speed (3.6 days real time)
node scripts/simulate-family-year.js --family=palsson --speed=100x --skipWaits
```

**Task 3: Verify Data Quality**
```bash
# Check generated data
node scripts/verify-simulation-data.js --family=palsson

# Expected output:
# ✅ 2,400+ calendar events (3 kids × 2-3 activities/week × 52 weeks)
# ✅ 1,800+ tasks created (Kimberly: 1,530, Stefan: 270)
# ✅ 450+ documents uploaded
# ✅ 100+ chore instances completed
# ✅ 52 weekly surveys completed
# ✅ 12 family meetings logged
# ✅ Knowledge Graph: 5 Person nodes, 2,400+ Task nodes, 3,000+ relationships
```

---

## 🔧 Implementation Files to Create

### **1. Base Agent System**
- `scripts/agents/PersonaAgent.js` - Base class with decision-making
- `scripts/agents/StefanAgent.js` - Stefan's persona
- `scripts/agents/KimberlyAgent.js` - Kimberly's persona
- `scripts/agents/ChildAgent.js` - Generic child agent
- `scripts/agents/AgentOrchestrator.js` - Manages all agents, simulates time

### **2. Simulation Scripts**
- `scripts/create-agent-family.js` - Initialize Palsson family with agents
- `scripts/simulate-family-year.js` - Main simulation loop
- `scripts/verify-simulation-data.js` - Data quality checks
- `scripts/verify-agents.js` - Test agent decision-making

### **3. Configuration**
- `scripts/agents/personas/palsson-family.json` - Family member profiles
- `scripts/agents/config/simulation-config.json` - Timeline, speeds, behaviors

---

## 💡 Key Benefits

### **For Demo Purposes:**
1. **Realistic Data:** 1 year of believable family usage patterns
2. **Invisible Labor Showcase:** Clear before/after transformation
3. **Knowledge Graph Richness:** 3,000+ relationships showing family dynamics
4. **All Features Tested:** Calendar, tasks, docs, surveys, chores, chat

### **For EE Onboarding:**
1. **Documentation Test:** Can external engineer follow our docs and run this?
2. **Code Quality:** Are agent interfaces clean and well-documented?
3. **Reproducibility:** Does simulation produce consistent results?
4. **Scalability:** Can we easily add more families?

### **For Product Development:**
1. **Edge Case Discovery:** Agent behaviors reveal UI/UX issues
2. **Performance Testing:** 1 year of data stresses database queries
3. **AI Training Data:** Realistic family interactions for Allie improvement
4. **Feature Validation:** Which features get used most by agents?

---

## 🚀 Next Steps

**Immediate (Today):**
1. Create `PersonaAgent.js` base class
2. Create `palsson-family.json` configuration
3. Build `StefanAgent.js` and `KimberlyAgent.js`

**Short-term (This Week):**
1. Implement simulation loop
2. Test with 1-week simulation
3. Verify data generation quality

**Medium-term (Next Week):**
1. Run full 1-year simulation
2. Create verification scripts
3. Document EE onboarding process
4. Test with external engineer

---

**Ready to build this?** This will be the most realistic demo family data in any parenting app + a robust test of our documentation and code quality!

---

*Created: 2025-10-19*
*Status: READY TO IMPLEMENT*
