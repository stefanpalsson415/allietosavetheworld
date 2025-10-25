# Allie Product Strategy 2025
## The Intelligent Family Operating System

**Document Purpose:** Technical architecture, product vision, and implementation roadmap for Allie's two-flow system powered by Knowledge Graph intelligence.

**Created:** October 20, 2025
**Authors:** CTO + CPO + AI/Data Strategy
**Status:** Active Development Roadmap

---

## Executive Summary

Allie is not a task manager. Allie is not a calendar app. Allie is the first **intelligent family operating system** that breaks the mental load crisis through continuous learning and proactive rebalancing.

**The Core Innovation:**

We've built two symbiotic user flows that create a perpetual improvement cycle:

1. **Flow 1: Understanding (Assessment & Learning)** - Why is our family imbalanced?
2. **Flow 2: Execution (Daily Operations)** - How do we run our family day-to-day?

The breakthrough is that **these flows feed each other through a Knowledge Graph** that consolidates all family data—surveys, habits, tasks, events, chores, communications—into a unified intelligence layer that drives personalized insights and proactive interventions.

**The Aha Moment:**

Traditional apps show you *what* happened (calendar) or *who* did it (task tracker). Allie shows you *why* your family is imbalanced, *predicts* what will overwhelm you next, and *proactively intervenes* to rebalance before burnout happens.

**Market Opportunity:**

- **40%** increased cardiovascular disease risk for women with disproportionate cognitive load
- **20%** of mothers experience mental health disorders (doubled since 2010)
- **35.5%** relationship quality improvement proven possible with daily digital engagement
- **81%** of different-sex couples show women performing more cognitive labor
- **$2.8B** relationship app market growing 12% annually
- **Zero** apps currently integrate household labor equity with relationship quality improvement

**Our Competitive Moat:**

1. **Dual-flow architecture** - Assessment informs execution, execution refines assessment
2. **Knowledge Graph intelligence** - Consolidates all family data into predictive insights
3. **Proactive AI agent** - Allie intervenes before problems escalate
4. **Evidence-based design** - Built on Fair Play methodology + relationship science
5. **Interconnected data** - Events, tasks, contacts, communications all linked
6. **Year-one simulation** - Families see value before committing real data

---

## Part 1: The Two-Flow Architecture

### Flow 1: Understanding (Assessment & Learning Cycle)

**Purpose:** Help families understand *why* they're imbalanced and *how* to improve.

**User Journey:**

```
1. Initial Assessment
   ↓
   Family takes comprehensive surveys (both parents + kids)
   - Cognitive Load Index (anticipation, monitoring, execution)
   - Fair Play Card Distribution (who owns what)
   - Relationship Quality Metrics (MQoRS scale)
   - Parenting Style Assessment (for each parent)
   - Child Development Markers (for each kid)
   - Family Dynamics Inventory (communication, conflict, appreciation)
   ↓

2. Interview Mode (Optional but Powerful)
   ↓
   Allie conducts voice-based family interview
   - Multi-person detection (auto-identifies who's speaking)
   - Probing questions based on survey red flags
   - Captures nuance surveys miss (tone, emotion, family dynamics)
   - Example: "I noticed you both said 'bedtime' is stressful. Can you walk me through a typical evening?"
   ↓

3. Analysis & Insights
   ↓
   Allie processes all data through Knowledge Graph
   - Invisible Labor Analysis: "Kimberly anticipates 78% of tasks"
   - Cognitive Load Imbalance: "Kimberly's load is 3.5x Stefan's"
   - Burnout Risk Score: "Kimberly at 0.85/1.0 (critical threshold)"
   - Pattern Detection: "Sunday night planning spike (68% of week's tasks)"
   - Child Development Gaps: "Tegner ready for more responsibility"
   ↓

4. Collaborative Habit Selection
   ↓
   Parents pick 3-5 habits to work on together
   - Sourced from Fair Play methodology
   - Personalized based on survey results
   - Examples:
     * "Transfer 'After-School Activities' card from Kimberly to Stefan"
     * "Implement Sunday evening joint planning session"
     * "Set 'no monitoring' boundary for delegated tasks"
     * "Practice appreciation ritual (1 specific thing daily)"
     * "Establish 'mental load check-in' at Family Meeting"
   ↓

5. Practice Period (30-90 days)
   ↓
   Family works on habits in daily life
   - Allie provides daily prompts and reminders
   - Tracks completion through Flow 2 data (tasks, events, interactions)
   - Offers encouragement and course corrections
   - Sends weekly progress reports
   ↓

6. Re-Assessment
   ↓
   Family retakes surveys to measure improvement
   - Cognitive Load Index (has imbalance reduced?)
   - Relationship Quality (has satisfaction improved?)
   - Fair Play Distribution (has ownership shifted?)
   - Habit Adherence (how consistent was practice?)
   ↓

7. Family Meeting
   ↓
   Structured session to review progress together
   - Allie facilitates with data-driven talking points
   - Celebrates wins ("Cognitive load imbalance reduced 32%!")
   - Identifies remaining gaps ("Meal planning still imbalanced")
   - Selects next round of habits
   ↓

8. Cycle Continues
   ↓
   Next survey is smarter based on previous data
   - Focuses on areas still needing work
   - Introduces new habits as family masters current ones
   - Adapts difficulty based on success rate
   - Tracks long-term trends (cognitive load trajectory over 6-12 months)
```

**Key Design Principles:**

1. **Both partners required** - Cannot proceed without both parents completing surveys
2. **Non-judgmental framing** - "Us vs. The Mental Load" not "You vs. Me"
3. **Data-driven empathy** - "This is what the data shows" removes blame
4. **Collaborative goal-setting** - Parents choose habits together, not imposed by Allie
5. **Measurable progress** - Concrete metrics (cognitive load ratio, task distribution %)
6. **Adaptive difficulty** - Start with 3 easy habits, scale to 5 advanced as competence builds
7. **Family-inclusive** - Kids participate in age-appropriate assessments

**Technical Requirements:**

- Survey engine with branching logic (skip patterns based on family structure)
- Voice interview system with speaker diarization (multi-person detection)
- Statistical analysis pipeline (cognitive load calculation, Fair Play scoring)
- Habit tracking system (completion rates, streak detection, plateau identification)
- Progress visualization (before/after comparisons, trend lines, milestone markers)
- Family meeting facilitation mode (structured agenda, data presentation, decision capture)

---

### Flow 2: Execution (Daily Operations)

**Purpose:** Help families run their household efficiently while *proactively rebalancing* based on Flow 1 insights.

**User Journey:**

```
Daily Operations Interface
   ↓
   Family uses Allie to manage everything:

   📅 Calendar
   - All family events with attendees
   - Auto-generated prep tasks ("Pack volleyball gear")
   - Linked to contacts (coaches, teachers, doctors)
   - Connected to source emails/SMS
   - Conflict detection (overlapping commitments)

   ✅ Task Board
   - Kanban-style workflow (To Do, In Progress, Done)
   - Auto-assignment based on Fair Play cards
   - Smart suggestions: "Stefan, you own 'After-School Activities' now—want to pack Lillian's gear?"
   - Task dependencies (can't "make dinner" until "grocery shop" done)
   - Deadline tracking with escalation

   📥 Unified Inbox
   - Emails, SMS, documents in one view
   - AI processing: categorization, summary, actionable item extraction
   - Auto-event creation ("Volleyball practice schedule" → Calendar event)
   - Auto-contact creation (Coach Martinez added with phone/email)
   - Smart routing: "After-School Activities" emails go to Stefan now

   👶 Kids Section
   - Chore Chart: Age-appropriate tasks, daily assignments
   - Reward Party: Bucks economy, redemption system
   - Palsson Bucks: Balance tracking, earning history, spending patterns
   - Development tracking: Skill progression, consistency scoring

   💬 Allie Chat (Everywhere)
   - Context-aware: Knows what you're viewing, recent interactions
   - Proactive: "Hey Kimberly, I noticed you're creating a lot of tasks. Can Stefan take some?"
   - Predictive: "Based on last year, volleyball playoffs start next week. Want me to prep?"
   - Supportive: "You've completed 15 tasks this week—great teamwork!"

   ↓

Proactive Rebalancing (THE MAGIC)
   ↓
   Flow 1 insights drive Flow 2 behavior:

   Example 1: Task Assignment
   - Survey shows: Kimberly anticipates 78% of tasks
   - Fair Play decision: Transfer "After-School Activities" to Stefan
   - Flow 2 action: New task "Schedule Oly's science club pickup" auto-assigned to Stefan
   - Result: Kimberly's anticipation load decreases, Stefan builds competence

   Example 2: Event Attachment
   - Survey shows: Kimberly attends 90% of school events with Lillian
   - Habit selected: "Stefan to handle 50% of school events"
   - Flow 2 action: New event "Lillian's parent-teacher conference" auto-assigns Stefan as attendee
   - Allie prompts: "Stefan, this is on your calendar—want me to send a reminder?"
   - Result: Event attendance rebalances toward 50/50

   Example 3: Inbox Routing
   - Survey shows: Kimberly processes 85% of school emails
   - Fair Play decision: Stefan owns "School Communication" card
   - Flow 2 action: School emails now route to Stefan's inbox view first
   - Allie suggests: "Stefan, Lillian's teacher sent an update—want to create a task or event?"
   - Result: Cognitive load of "monitoring school info" shifts to Stefan

   Example 4: Chore Progression
   - Survey shows: Tegner (age 7) completes chores 85% consistently
   - Development marker: Ready for more responsibility
   - Flow 2 action: Allie suggests new chore "Set the table" (2 bucks)
   - Parents approve → Schedule updates → Tegner's earning potential increases
   - Result: Child development tracked and supported

   Example 5: Burnout Prevention
   - Real-time detection: Kimberly created 12 tasks today (3x normal)
   - Cognitive load spike: 0.85 → 0.92 (critical zone)
   - Flow 2 action: Allie intervenes with Stefan: "Kimberly's mental load is spiking—can you take on these 3 tasks?"
   - Stefan accepts → Tasks reassigned → Load rebalances
   - Result: Prevents burnout before it happens
```

**Key Design Principles:**

1. **Proactive not reactive** - Allie suggests rebalancing, doesn't wait for user to realize problem
2. **Contextual intelligence** - Knows who owns what based on Fair Play cards from Flow 1
3. **Gentle nudges** - Suggestions not commands ("Want to..." not "You must...")
4. **Explainable AI** - "Based on your Fair Play agreement..." provides reasoning
5. **Escape hatches** - User can always override Allie's suggestions
6. **Real-time adaptation** - Rebalancing happens daily, not just at survey cycles
7. **Interconnected data** - Everything links (email → event → contact → task → person)

**Technical Requirements:**

- Real-time cognitive load calculation (tracks task creation rate, anticipation burden)
- Smart assignment engine (Fair Play card ownership + capacity + preference)
- Event intelligence (auto-generate prep tasks, detect conflicts, suggest attendees)
- Inbox AI processing (categorization, summarization, entity extraction, routing)
- Child development engine (skill tracking, readiness detection, progression suggestions)
- Proactive intervention system (threshold detection, suggestion generation, escalation paths)

---

### The Feedback Loop: How Flows Feed Each Other

**Flow 1 → Flow 2 (Assessment Informs Execution)**

```
Survey Result: Kimberly owns "After-School Activities" card
   ↓
Fair Play Decision: Transfer to Stefan
   ↓
Flow 2 Changes:
   - New tasks in this category auto-assign to Stefan
   - Emails from coaches/teachers route to Stefan
   - Calendar events auto-attach Stefan as attendee
   - Allie prompts Stefan with prep reminders
   ↓
Result: Execution layer actively rebalances cognitive load
```

**Flow 2 → Flow 1 (Execution Refines Assessment)**

```
Flow 2 Data: Stefan completed 45 "After-School Activities" tasks in 30 days
   ↓
Pattern Analysis:
   - Completion rate: 89% (high competence)
   - Time to complete: Decreased over month (learning curve)
   - Questions asked: 12 first week → 2 fourth week (independence building)
   ↓
Next Survey:
   - Asks targeted questions: "Stefan, do you feel confident managing after-school logistics?"
   - Updates cognitive load calculation (Stefan's anticipation burden increased)
   - Suggests next card transfer: "Ready to shift 'Meal Planning' next?"
   ↓
Result: Assessment layer gets smarter based on real behavior
```

**The Virtuous Cycle:**

```
Survey identifies imbalance
   ↓
Parents select habits to rebalance
   ↓
Flow 2 proactively assigns tasks/events to rebalance
   ↓
Real behavior data shows progress (or lack thereof)
   ↓
Next survey focuses on remaining gaps
   ↓
New habits selected, cycle continues
   ↓
Over 6-12 months: Cognitive load equalizes, relationship quality improves, burnout prevented
```

---

## Part 2: The Knowledge Graph Intelligence Layer

### What Gets Consolidated

**The Knowledge Graph is the central nervous system of Allie.** It consolidates *all* family data from both flows into a unified graph structure that enables:

1. **Cross-domain insights** - "Kimberly's cognitive load spike correlates with volleyball season"
2. **Pattern detection** - "Sunday night planning spike happens every week"
3. **Predictive analytics** - "Based on last year, burnout risk increases in October"
4. **Relationship mapping** - "After-School Activities card connects to 12 tasks, 4 events, 3 contacts"
5. **Impact analysis** - "Transferring card to Stefan reduced Kimberly's load by 23%"

**Data Consolidated into Knowledge Graph:**

```
From Flow 1 (Assessment):
   - Survey responses (cognitive load scores, Fair Play distributions)
   - Interview transcripts (with speaker labels, sentiment, topics)
   - Habit selections (which habits, commitment dates, progress tracking)
   - Re-assessment results (before/after comparisons, improvement metrics)
   - Family meeting notes (decisions made, cards transferred, goals set)

From Flow 2 (Execution):
   - Tasks (who created, who assigned, who completed, time taken, category)
   - Events (who organized, who attended, prep tasks generated, source communication)
   - Contacts (relationship type, interaction frequency, linked events/tasks)
   - Inbox items (emails/SMS processed, events created, tasks generated, routing)
   - Chores (child assigned, completion rate, consistency, skill progression)
   - Rewards (what redeemed, bucks spent, preferences, motivation patterns)

From Allie Interactions:
   - Chat conversations (topics, sentiment, requests, proactive interventions)
   - Voice sessions (interview data, family meeting facilitation, check-ins)
   - Acceptances/rejections (which suggestions taken, which ignored, why)
   - Satisfaction signals (explicit feedback, usage patterns, retention)
```

**Graph Structure:**

```
Nodes:
   - Person (parent, child, external contact)
   - Task (individual work item)
   - Event (calendar occurrence)
   - FairPlayCard (responsibility category)
   - Habit (behavior change goal)
   - Communication (email, SMS)
   - Document (file, form, record)
   - Chore (child task template)
   - Reward (child motivation item)
   - Survey (assessment instance)
   - Metric (cognitive load, relationship quality, etc.)

Relationships:
   - Person -[CREATES]-> Task (anticipation)
   - Person -[MONITORS]-> Task (mental load)
   - Person -[EXECUTES]-> Task (physical work)
   - Person -[OWNS]-> FairPlayCard (responsibility)
   - Person -[PRACTICES]-> Habit (behavior change)
   - Person -[ORGANIZES]-> Event (planning labor)
   - Person -[ATTENDS]-> Event (physical presence)
   - Event -[GENERATED_FROM]-> Communication (inbox → calendar)
   - Event -[INVOLVES]-> Person (external contact)
   - Task -[MAPS_TO]-> FairPlayCard (categorization)
   - Task -[PREP_FOR]-> Event (dependency)
   - Chore -[ASSIGNED_TO]-> Person (child responsibility)
   - Person -[REDEEMS]-> Reward (motivation)
   - Survey -[MEASURES]-> Metric (assessment data)
   - Habit -[TARGETS]-> Metric (improvement goal)

Properties on Relationships:
   - Timestamps (when created, completed, updated)
   - Cognitive load weight (anticipation: 2.0, monitoring: 1.5, execution: 1.0)
   - Emotional load (frustration, anxiety, satisfaction)
   - Lead time (how far in advance anticipated)
   - Frequency (daily, weekly, monthly, one-time)
   - Completion quality (self-rated or partner-rated)
```

**Example Query:**

"Show me all tasks that Kimberly ANTICIPATES but Stefan EXECUTES over the last 30 days, grouped by Fair Play card."

```cypher
MATCH (kimberly:Person {name: 'Kimberly'})-[ant:ANTICIPATES]->(t:Task)
MATCH (stefan:Person {name: 'Stefan'})-[exec:EXECUTES]->(t)
MATCH (t)-[:MAPS_TO]->(card:FairPlayCard)
WHERE ant.timestamp > datetime() - duration({days: 30})
RETURN card.name, count(t) as taskCount,
       avg(ant.leadTimeDays) as avgLeadTime,
       sum(ant.emotionalLoad) as totalEmotionalBurden
ORDER BY totalEmotionalBurden DESC
```

**Result:** "Kimberly anticipated 45 tasks in 'After-School Activities' that Stefan executed, with an average lead time of 4.2 days and high emotional burden (0.78 average). This card should be transferred to reduce Kimberly's invisible labor."

---

### How Knowledge Graph Powers Insights

**1. Invisible Labor Quantification**

```
Query: Who performs the most anticipation work?

MATCH (p:Person)-[r:ANTICIPATES]->(t:Task)
WHERE p.familyId = $familyId AND r.timestamp > $startDate
WITH p, count(t) as anticipationCount,
     sum(r.leadTimeDays) as totalLeadTime,
     avg(r.emotionalLoad) as avgEmotionalLoad
RETURN p.name,
       anticipationCount,
       totalLeadTime,
       avgEmotionalLoad,
       (anticipationCount * 2.0 + totalLeadTime * 0.5 + avgEmotionalLoad * 2.0) as invisibleLaborScore
ORDER BY invisibleLaborScore DESC

Result:
Kimberly: 1,138 tasks, 4,578 lead-time days, 0.76 emotional load → Score: 3,851
Stefan: 322 tasks, 890 lead-time days, 0.42 emotional load → Score: 1,073

Insight: "Kimberly's invisible labor score is 3.6x higher than Stefan's. The primary driver is anticipation volume (1,138 vs 322 tasks). Recommendation: Transfer 3 Fair Play cards to Stefan to reduce Kimberly's anticipation burden."
```

**2. Burnout Risk Prediction**

```
Query: Calculate cognitive load trajectory and predict burnout risk

MATCH (p:Person)-[r:ANTICIPATES|MONITORS|CREATES]->(t:Task)
WHERE p.userId = $userId AND r.timestamp > datetime() - duration({days: 90})
WITH p, date.truncate('week', r.timestamp) as week,
     count(CASE WHEN type(r) = 'ANTICIPATES' THEN 1 END) * 2.0 as weeklyAnticipation,
     count(CASE WHEN type(r) = 'MONITORS' THEN 1 END) * 1.5 as weeklyMonitoring,
     count(CASE WHEN type(r) = 'CREATES' THEN 1 END) * 1.0 as weeklyCreation
WITH p, week, (weeklyAnticipation + weeklyMonitoring + weeklyCreation) as weeklyCognitiveLoad
ORDER BY week
WITH p, collect(weeklyCognitiveLoad) as loadHistory
WITH p, loadHistory,
     loadHistory[-1] as currentLoad,
     (loadHistory[-1] - loadHistory[-4]) / 4.0 as weeklyTrend

RETURN p.name, currentLoad, weeklyTrend,
       CASE
         WHEN currentLoad > 85 AND weeklyTrend > 5 THEN 'CRITICAL'
         WHEN currentLoad > 75 AND weeklyTrend > 3 THEN 'HIGH'
         WHEN currentLoad > 60 THEN 'MODERATE'
         ELSE 'LOW'
       END as burnoutRisk

Result:
Kimberly: currentLoad=92, weeklyTrend=+7.2, burnoutRisk='CRITICAL'

Insight: "Kimberly's cognitive load has increased 7.2 points per week over the last month and is now at 92 (critical threshold is 85). Immediate intervention required to prevent burnout."

Allie Action: Sends urgent message to Stefan: "Kimberly's mental load is in the red zone. Can you take these 5 tasks today to help rebalance?"
```

**3. Task Pattern Learning**

```
Query: What tasks are typically generated before volleyball practice events?

MATCH (e:Event {title: 'Volleyball practice'})<-[r:PREP_FOR]-(t:Task)
WITH t.title as taskTitle, count(*) as frequency,
     avg(duration.between(t.createdAt, e.startTime).hours) as avgLeadTimeHours
RETURN taskTitle, frequency, avgLeadTimeHours
ORDER BY frequency DESC

Result:
"Pack volleyball gear for Lillian": 52 times, 2.3 hours before
"Pick up Lillian from volleyball practice": 52 times, created day-of
"Wash volleyball uniform": 12 times, 1 day before

Insight: "Volleyball practice always needs these 3 prep tasks. Allie can auto-generate them."

Allie Action: When new volleyball event created, automatically suggest these tasks with appropriate lead times and assign to Stefan (owner of "After-School Activities").
```

**4. Fair Play Card Impact Analysis**

```
Query: Measure cognitive load change after transferring "After-School Activities" card

// Before transfer (baseline)
MATCH (kimberly:Person {name: 'Kimberly'})-[r:ANTICIPATES|MONITORS|EXECUTES]->(t:Task)-[:MAPS_TO]->(card:FairPlayCard {name: 'After-School Activities'})
WHERE r.timestamp >= $transferDate - duration({days: 30}) AND r.timestamp < $transferDate
WITH count(t) as beforeCount,
     sum(CASE WHEN type(r) = 'ANTICIPATES' THEN 2.0 WHEN type(r) = 'MONITORS' THEN 1.5 ELSE 1.0 END) as beforeLoad

// After transfer
MATCH (kimberly:Person {name: 'Kimberly'})-[r:ANTICIPATES|MONITORS|EXECUTES]->(t:Task)-[:MAPS_TO]->(card:FairPlayCard {name: 'After-School Activities'})
WHERE r.timestamp >= $transferDate AND r.timestamp < $transferDate + duration({days: 30})
WITH beforeCount, beforeLoad, count(t) as afterCount,
     sum(CASE WHEN type(r) = 'ANTICIPATES' THEN 2.0 WHEN type(r) = 'MONITORS' THEN 1.5 ELSE 1.0 END) as afterLoad

RETURN beforeCount, afterCount, (beforeCount - afterCount) as taskReduction,
       beforeLoad, afterLoad, (beforeLoad - afterLoad) / beforeLoad * 100 as loadReductionPercent

Result:
Before: 45 tasks, load=89.5
After: 8 tasks, load=18.0
Reduction: 37 tasks (-82%), load -79.9%

Insight: "Transferring 'After-School Activities' to Stefan reduced Kimberly's cognitive load by 80% in this category. This is a successful rebalancing."

Allie Action: At next Family Meeting, Allie presents this data: "Great teamwork! Transferring this card had a major impact. Ready to try another?"
```

**5. Child Development Tracking**

```
Query: Is Tegner ready for more advanced chores?

MATCH (tegner:Person {name: 'Tegner'})-[:ASSIGNED_TO]->(instance:ChoreInstance)
WHERE instance.date > datetime() - duration({days: 90})
WITH tegner,
     count(instance) as totalChores,
     sum(CASE WHEN instance.status = 'completed' THEN 1 ELSE 0 END) as completed,
     avg(instance.bucksAwarded) as avgBucksPerChore,
     collect(DISTINCT instance.templateId) as uniqueChoreTypes

WITH tegner, totalChores, completed,
     toFloat(completed) / totalChores as completionRate,
     avgBucksPerChore,
     size(uniqueChoreTypes) as choreVariety

RETURN tegner.name, completionRate, avgBucksPerChore, choreVariety,
       CASE
         WHEN completionRate > 0.85 AND avgBucksPerChore < 3 THEN 'READY_FOR_ADVANCEMENT'
         WHEN completionRate > 0.70 THEN 'PROGRESSING_WELL'
         WHEN completionRate < 0.50 THEN 'NEEDS_SUPPORT'
         ELSE 'MAINTAINING'
       END as developmentStatus

Result:
Tegner: completionRate=0.89, avgBucksPerChore=2.1, choreVariety=3, status='READY_FOR_ADVANCEMENT'

Insight: "Tegner completes 89% of chores consistently and is currently doing low-difficulty tasks (avg 2.1 bucks). He's ready for more responsibility."

Allie Action: Suggests to parents: "Tegner has mastered his current chores. Want to add 'Set the table' (3 bucks) to build new skills?"
```

---

### Allie's Proactive Intelligence

**Allie is everywhere because the Knowledge Graph is everywhere.**

Allie's AI agent has three operating modes:

**1. Reactive (Traditional Chatbot)**
- User asks: "What tasks do I have today?"
- Allie queries KG: `MATCH (user)-[:ASSIGNED_TO]->(t:Task) WHERE t.dueDate = today() RETURN t`
- Allie responds: "You have 5 tasks today: [list]"

**2. Contextual (Smart Assistant)**
- User viewing calendar event "Volleyball practice Tue 5pm"
- Allie proactively checks KG: Are prep tasks created? Is gear packed? Who's picking up?
- Allie prompts: "I see volleyball practice tomorrow. Want me to remind Stefan to pack Lillian's gear? (He owns After-School Activities now)"

**3. Predictive (Intelligent Agent)**
- Background process monitors KG in real-time
- Detects: Kimberly created 12 tasks in 2 hours (3x normal rate)
- Calculates: Cognitive load spiked from 0.78 → 0.94 (critical zone)
- Pattern matches: Similar spike happened last October → led to burnout
- Predicts: High risk of burnout within 48 hours if not addressed
- Intervenes:
  - Messages Stefan: "Kimberly's mental load is spiking. Can you take these 3 tasks?"
  - Messages Kimberly: "You've created a lot of tasks today. Want me to help redistribute?"
  - Creates task: "Check in with Kimberly about stress level" assigned to Stefan

**Where Allie Appears:**

```
📅 Calendar View
- Hovering over event: "This event has 2 prep tasks assigned to Stefan"
- Creating new event: "Based on pattern, you'll need these 3 prep tasks"
- Conflict detected: "This overlaps with Oly's science club—Stefan is double-booked"

✅ Task Board
- Creating task: "This maps to 'Meal Planning' card—assign to Kimberly?"
- Task overdue: "This is late. Want me to ask Stefan to help?"
- Pattern detected: "You create a lot of tasks on Sunday nights—want to set up joint planning?"

📥 Unified Inbox
- New email from coach: "This is about volleyball. Create event + prep tasks?"
- SMS from teacher: "This mentions parent-teacher conference. Add to Stefan's calendar? (He owns School Communication)"
- Document uploaded: "This looks like a medical form. Link to Dr. Chen contact?"

👶 Kids Section
- Chore completion: "Tegner finished 10 chores this week—great job! Ready for harder tasks?"
- Reward redemption: "Lillian spent 50 bucks on arcade trip. She's saving for something bigger—should we create a goal?"
- Balance low: "Oly has 12 bucks left. Want to assign extra chores this week?"

💬 Allie Chat
- Opening chat: "Hey! I noticed you're viewing the calendar. Want help with something?"
- Proactive message: "Heads up: volleyball season starts next week. Based on last year, you'll need to pack gear 2x/week. Want me to auto-generate those tasks?"
- Check-in: "It's Sunday evening and you haven't created tasks yet. Want to do joint planning with Stefan instead?"

📊 Knowledge Graph Hub
- Viewing graph: "The graph shows Kimberly owns 12 Fair Play cards, Stefan owns 8. The imbalance is in 'Kid Activities' and 'Meal Planning'."
- Natural language query: "Why am I so tired?" → Allie runs invisible labor analysis → "You're anticipating 78% of tasks, which is 3.6x more mental load than Stefan."
```

**Proactive Intervention Triggers:**

```python
# Pseudocode for Allie's background monitoring

while True:
    # Real-time cognitive load calculation
    for person in family.parents:
        current_load = calculate_cognitive_load(person, window='24h')
        baseline_load = calculate_cognitive_load(person, window='30d', stat='mean')

        if current_load > baseline_load * 1.5:
            # Spike detected
            trigger_intervention('load_spike', person=person, urgency='high')

        if current_load > 85 and person.trend_7d > 5:
            # Approaching burnout
            trigger_intervention('burnout_risk', person=person, urgency='critical')

    # Pattern detection
    if today.day_of_week == 'Sunday' and current_hour >= 20:
        planning_tasks = count_tasks_created_by(person='Kimberly', window='today')
        if planning_tasks > 15:
            trigger_intervention('sunday_night_spike', person='Kimberly', urgency='medium')

    # Fair Play card imbalance
    for card in family.fair_play_cards:
        if card.owner_changed_recently:
            days_since_change = (now - card.ownership_change_date).days
            if days_since_change >= 30:
                # Time to check if transfer worked
                impact = measure_card_transfer_impact(card)
                trigger_intervention('card_transfer_review', card=card, impact=impact, urgency='low')

    # Child development
    for child in family.children:
        completion_rate = calculate_chore_completion_rate(child, window='90d')
        avg_difficulty = calculate_avg_chore_difficulty(child)

        if completion_rate > 0.85 and avg_difficulty < 3:
            trigger_intervention('child_ready_advancement', child=child, urgency='low')

    # Event conflicts
    for event in upcoming_events(window='7d'):
        conflicts = detect_conflicts(event)
        if len(conflicts) > 0:
            trigger_intervention('scheduling_conflict', event=event, conflicts=conflicts, urgency='high')

    # Habit adherence
    for habit in family.active_habits:
        adherence = calculate_habit_adherence(habit, window='7d')
        if adherence < 0.5:
            trigger_intervention('habit_struggling', habit=habit, urgency='medium')

    sleep(300)  # Check every 5 minutes
```

---

## Part 3: Leveraging Demo Data for Real Families

**The demo data system we built for the Palsson Family is not just for testing—it's a production feature.**

### Why Demo Data Matters

**Problem:** Empty state problem kills adoption.

When families sign up for Allie, they see:
- Empty calendar
- Empty task board
- Empty inbox
- Empty chore chart

**Result:** "This app does nothing. Uninstall."

**Solution:** Personalized demo data that shows the value immediately.

### Demo Data as Onboarding Strategy

**Phase 1: Signup (Day 0)**

```
User Journey:
1. Family signs up (email, password)
2. Family structure questions:
   - How many parents? (1 or 2)
   - How many kids? (0-10)
   - Kids' ages? (1-18)
   - Household income range? (for bucks economy calibration)
   - Zip code? (for local contact generation)
3. Option: "Show me how Allie works with sample data" vs "Start from scratch"
   - 90% choose demo mode (hypothesis based on product research)
4. Allie generates personalized demo data:
   - Events appropriate for family with kids those ages (soccer for 7yo, volleyball for 14yo)
   - Chores matched to ages (toys for 7yo, dishes for 11yo, cooking for 14yo)
   - Contacts local to zip code (pediatricians in SF, schools in district)
   - Bucks economy scaled to income (high-income: 2x standard, low-income: 0.5x)
   - Realistic imbalance showing mental load crisis (78/22 split typical)
5. Family immediately sees:
   - Full calendar with year of events
   - Task board with prep tasks linked to events
   - Inbox with 230 items (emails, SMS, docs) connected to events/contacts
   - Chore chart with year of activity for each kid
   - Knowledge Graph with 7,845 relationships showing imbalance
```

**Phase 2: Exploration (Days 1-7)**

```
Value Discovery:
- "Wow, events are linked to the emails that created them!"
- "Look, prep tasks auto-generated for volleyball practice!"
- "The Knowledge Graph shows me Kimberly does 78% of mental load!"
- "Fair Play cards are assigned—we can see who owns what!"
- "Kids have a whole year of chore history with consistent completion!"

Key Insight: Demo data is not random—it's *realistic* and shows the *problem* (imbalance) that Allie solves.
```

**Phase 3: Assessment (Day 7-14)**

```
Flow 1 Activation:
- Allie prompts: "You've been exploring for a week. Ready to assess YOUR family's actual balance?"
- Family takes real surveys (Flow 1)
- Allie compares: "Your family is 23% more active than typical families"
- Allie identifies: "Like the demo, Kimberly anticipates 82% of tasks (even more imbalanced!)"
- Family picks habits: "Transfer After-School Activities to Stefan" (same as demo showed)
```

**Phase 4: Hybrid Mode (Weeks 2-8)**

```
Gradual Migration:
- Demo data stays as baseline comparison
- Real data enters system (Google Calendar sync, real emails, real chores)
- UI shows both:
  - Primary view: Real data
  - Comparison view: "Typical families have X, you have Y"
- Demo events marked with subtle indicator (light opacity or "Demo" tag)
- Real events replace demo events in same categories
- Analytics: "You're 18% more active than typical families" (demo baseline)
```

**Phase 5: Real Data Dominance (Month 3+)**

```
Steady State:
- Demo data fades to background (can be hidden entirely)
- Real data is primary interface
- Demo data serves as:
  - Training data for Allie's AI models
  - Baseline for "normal family" comparisons
  - Template library ("I want to add chores like the demo had")
  - Onboarding for new features ("Here's how Reward Party works" → show demo)
```

### Demo Data Technical Architecture

**Generation Pipeline:**

```javascript
// Triggered on signup
async function generatePersonalizedDemoData(familyProfile) {
  const { numParents, kids, zipCode, householdIncome, familyId } = familyProfile;

  // 1. Generate contacts (local to zip code)
  const contacts = await generateLocalContacts(zipCode, kids);
  // Returns: pediatrician in SF, dentist in SF, schools in district, coaches/instructors

  // 2. Generate events (age-appropriate activities)
  const events = await generateAgeAppropriateEvents(kids, contacts, familyId);
  // Returns: 678 events for year (soccer for 7yo, volleyball for 14yo, piano for 11yo)

  // 3. Generate inbox (emails/SMS connected to events)
  const inbox = await generateConnectedInbox(events, contacts, familyId);
  // Returns: 230 items (100 emails, 100 SMS, 30 docs) with AI processing

  // 4. Generate tasks (prep tasks for events)
  const tasks = await generateEventPrepTasks(events, numParents, familyId);
  // Returns: 110 tasks (pack gear, pickup, schedule, remind) assigned to parents

  // 5. Generate chores (age-appropriate for each kid)
  const chores = await generateAgeAppropriateChores(kids, householdIncome, familyId);
  // Returns: 15 templates, 34 schedules, 10,532 instances for year

  // 6. Generate Fair Play distribution (realistic imbalance)
  const fairPlay = await generateFairPlayImbalance(numParents, familyId);
  // Returns: 78/22 split showing mental load crisis (mom does more anticipation)

  // 7. Populate Knowledge Graph
  await populateKnowledgeGraph({
    contacts, events, inbox, tasks, chores, fairPlay, familyId
  });
  // Creates: 7,845 relationships (ANTICIPATES, MONITORS, EXECUTES, OWNS, etc.)

  // 8. Mark all as demo data
  await markAsDemo(familyId);
  // Adds: metadata.isDemo = true, metadata.generatedAt = now

  return {
    contacts: contacts.length,
    events: events.length,
    inbox: inbox.length,
    tasks: tasks.length,
    chores: chores.length,
    fairPlayCards: fairPlay.length,
    knowledgeGraphNodes: '1,200+',
    knowledgeGraphRelationships: '7,845'
  };
}
```

**Age-Appropriate Chore Generation:**

```javascript
const CHORE_DIFFICULTY_BY_AGE = {
  '3-5': {
    maxPerDay: 2,
    avgBucks: 1,
    examples: ['Put toys in bin', 'Help set table', 'Water plants (with help)']
  },
  '6-8': {
    maxPerDay: 3,
    avgBucks: 2,
    examples: ['Make bed', 'Put away clean clothes', 'Feed pet', 'Water plants']
  },
  '9-11': {
    maxPerDay: 5,
    avgBucks: 3,
    examples: ['Vacuum room', 'Load dishwasher', 'Take out trash', 'Fold laundry']
  },
  '12-14': {
    maxPerDay: 7,
    avgBucks: 5,
    examples: ['Cook simple meal', 'Deep clean bathroom', 'Mow lawn', 'Tutor younger sibling']
  },
  '15-18': {
    maxPerDay: 10,
    avgBucks: 7,
    examples: ['Grocery shop', 'Meal prep for week', 'Car maintenance', 'Manage budget']
  }
};

function generateChoresForChild(child, householdIncome) {
  const ageGroup = getAgeGroup(child.age);
  const difficulty = CHORE_DIFFICULTY_BY_AGE[ageGroup];
  const incomeMultiplier = getIncomeMultiplier(householdIncome);

  // Generate 3-5 chore templates per child
  const templates = [];
  for (let i = 0; i < random(3, 5); i++) {
    templates.push({
      title: sample(difficulty.examples),
      description: generateChoreDescription(),
      bucksReward: difficulty.avgBucks * incomeMultiplier * random(0.8, 1.2),
      difficulty: difficulty.name,
      category: determineCategory(),
      ageMin: child.age - 1,
      ageMax: child.age + 2
    });
  }

  // Generate schedules (daily or weekly)
  const schedules = templates.map(template => ({
    childId: child.id,
    templateId: template.id,
    frequency: template.difficulty < 3 ? 'daily' : 'weekly',
    daysOfWeek: template.frequency === 'daily' ? [1,2,3,4,5] : [6],
    timeOfDay: assignTimeOfDay(template),
    isActive: true
  }));

  // Generate instances for entire year
  const instances = [];
  for (const schedule of schedules) {
    const dates = generateDatesForSchedule(schedule, year=2025);
    for (const date of dates) {
      instances.push({
        scheduleId: schedule.id,
        childId: child.id,
        date: date,
        status: simulateCompletion(child.age), // Older kids = higher completion rate
        bucksAwarded: schedule.template.bucksReward,
        completedAt: simulateCompletionTime(date)
      });
    }
  }

  return { templates, schedules, instances };
}
```

**Realistic Imbalance Simulation:**

```javascript
// Generate Fair Play distribution showing mental load crisis
function generateFairPlayImbalance(parents) {
  const [parent1, parent2] = parents;

  // 78/22 split is typical (research-backed)
  const TYPICAL_SPLIT = { high: 0.78, low: 0.22 };

  // Identify higher-load parent (usually mom in different-sex couples)
  const highLoadParent = parent1.gender === 'female' ? parent1 : parent2;
  const lowLoadParent = parent1.gender === 'female' ? parent2 : parent1;

  // Assign all 100 Fair Play cards
  const cards = FAIR_PLAY_CARDS.map(card => {
    // High-load parent gets 78% of cards
    const assignToHigh = Math.random() < TYPICAL_SPLIT.high;
    const owner = assignToHigh ? highLoadParent : lowLoadParent;

    // Anticipation-heavy cards (kid activities, meal planning) ALWAYS go to high-load parent
    if (card.category === 'Kid Activities' || card.category === 'Meal Planning') {
      owner = highLoadParent;
    }

    return {
      ...card,
      owner: owner.id,
      assignedAt: randomDateInPast(90),
      minimumStandardOfCare: generateStandard(card)
    };
  });

  // Generate tasks over 365 days showing imbalance in practice
  const tasks = [];
  for (let day = 0; day < 365; day++) {
    const date = addDays(new Date(2025, 0, 1), day);

    // High-load parent creates 78% of tasks
    const tasksToday = random(2, 8);
    for (let i = 0; i < tasksToday; i++) {
      const creator = Math.random() < TYPICAL_SPLIT.high ? highLoadParent : lowLoadParent;
      const card = sample(cards.filter(c => c.owner === creator.id));

      tasks.push({
        title: generateTaskTitle(card),
        createdBy: creator.id,
        assignedTo: chooseExecutor(card, parents), // May assign to partner
        fairPlayCard: card.id,
        createdAt: date,
        dueDate: addDays(date, random(0, 3)),
        relationshipType: creator.id === assignedTo ? 'EXECUTES' : 'ANTICIPATES', // Invisible labor!
        emotionalLoad: creator.id !== assignedTo ? random(0.6, 0.9) : random(0.2, 0.4)
      });
    }
  }

  return { cards, tasks };
}
```

### How Demo Data Feeds Knowledge Graph

**All demo data gets full Neo4j treatment:**

```javascript
// Sync demo data to Knowledge Graph (same as real data)
async function syncDemoDataToNeo4j(familyId) {
  // 1. Create Person nodes for family members
  await neo4j.run(`
    MERGE (stefan:Person {userId: $stefanId, familyId: $familyId})
    SET stefan.name = 'Stefan', stefan.role = 'parent', stefan.isDemo = true

    MERGE (kimberly:Person {userId: $kimberlyId, familyId: $familyId})
    SET kimberly.name = 'Kimberly', kimberly.role = 'parent', kimberly.isDemo = true

    MERGE (lillian:Person {userId: $lillianId, familyId: $familyId})
    SET lillian.name = 'Lillian', lillian.age = 14, lillian.role = 'child', lillian.isDemo = true

    // ... etc for all family members
  `);

  // 2. Create FairPlayCard nodes
  await neo4j.run(`
    UNWIND $cards as card
    MERGE (c:FairPlayCard {cardId: card.id, familyId: $familyId})
    SET c.name = card.name, c.category = card.category, c.isDemo = true

    MERGE (owner:Person {userId: card.owner})
    MERGE (owner)-[:OWNS]->(c)
  `);

  // 3. Create Task nodes with relationships
  await neo4j.run(`
    UNWIND $tasks as task
    MERGE (t:Task {taskId: task.id, familyId: $familyId})
    SET t.title = task.title, t.createdAt = datetime(task.createdAt), t.isDemo = true

    MERGE (creator:Person {userId: task.createdBy})
    MERGE (executor:Person {userId: task.assignedTo})
    MERGE (card:FairPlayCard {cardId: task.fairPlayCard})

    MERGE (creator)-[r:ANTICIPATES]->(t)
    SET r.timestamp = t.createdAt, r.emotionalLoad = task.emotionalLoad

    MERGE (executor)-[:EXECUTES]->(t)
    MERGE (t)-[:MAPS_TO]->(card)
  `);

  // 4. Create Event nodes with relationships
  await neo4j.run(`
    UNWIND $events as event
    MERGE (e:Event {eventId: event.id, familyId: $familyId})
    SET e.title = event.title, e.startTime = datetime(event.startTime), e.isDemo = true

    MERGE (organizer:Person {userId: event.attendees[0]})
    MERGE (organizer)-[:ORGANIZES]->(e)

    UNWIND event.attendees as attendeeId
    MERGE (attendee:Person {userId: attendeeId})
    MERGE (attendee)-[:ATTENDS]->(e)
  `);

  // 5. Create Chore nodes for kids
  await neo4j.run(`
    UNWIND $choreInstances as chore
    MERGE (c:ChoreInstance {choreId: chore.id, familyId: $familyId})
    SET c.title = chore.title, c.date = date(chore.date), c.status = chore.status, c.isDemo = true

    MERGE (child:Person {userId: chore.childId})
    MERGE (child)-[:ASSIGNED_TO]->(c)
  `);

  // Result: Full Knowledge Graph with demo data marked as isDemo = true
}
```

**Query that separates demo from real:**

```cypher
// Show cognitive load for REAL data only
MATCH (p:Person {familyId: $familyId})-[r:ANTICIPATES]->(t:Task)
WHERE t.isDemo = false  // Exclude demo data
WITH p, count(t) as realAnticipation
RETURN p.name, realAnticipation

// Compare real vs demo baseline
MATCH (p:Person {familyId: $familyId})-[r:ANTICIPATES]->(demoTask:Task {isDemo: true})
WITH p, count(demoTask) as demoAnticipation
MATCH (p)-[r:ANTICIPATES]->(realTask:Task {isDemo: false})
WITH p, demoAnticipation, count(realTask) as realAnticipation
RETURN p.name,
       demoAnticipation as typicalFamilyAnticipation,
       realAnticipation as yourFamilyAnticipation,
       toFloat(realAnticipation) / demoAnticipation as comparisonRatio

// Result: "Kimberly anticipates 892 tasks vs 1,138 in typical families (0.78x, less burdened!)"
```

---

## Part 4: Implementation Roadmap

### Technical Architecture

**Stack:**

```
Frontend:
- React 18 (UI framework)
- Tailwind CSS (styling)
- Framer Motion (animations)
- D3.js (Knowledge Graph visualization)
- React Query (data fetching/caching)

Backend:
- Node.js + Express (API server)
- Firebase Firestore (primary database)
- Neo4j Aura (Knowledge Graph)
- Redis (caching, session management)
- Google Cloud Run (serverless deployment)

AI/ML:
- Claude Opus 4.1 (conversation, analysis, insights)
- OpenAI TTS-1-HD (voice synthesis)
- Web Speech API (voice input)
- Custom ML models (pattern detection, prediction)

Infrastructure:
- GCP (hosting, storage, compute)
- Firebase (auth, Firestore, functions, hosting)
- Neo4j Aura (managed graph database)
- Vercel/Firebase Hosting (frontend CDN)
```

**Data Flow Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                          USER                                │
│           (Web App + Mobile Web + Voice Interface)           │
└────────────────┬───────────────────────────────┬─────────────┘
                 │                               │
                 ▼                               ▼
┌────────────────────────────────┐  ┌──────────────────────────┐
│       Flow 1: Assessment       │  │   Flow 2: Operations     │
│  (Surveys, Interviews, Habits) │  │ (Tasks, Events, Chores)  │
└────────────────┬───────────────┘  └──────────┬───────────────┘
                 │                               │
                 │     ┌─────────────────────────┤
                 │     │                         │
                 ▼     ▼                         ▼
       ┌─────────────────────────────────────────────────────┐
       │              FIREBASE FIRESTORE                      │
       │  (Primary Database - All Raw Data Storage)          │
       └───────────────────┬─────────────────────────────────┘
                           │
                           │ Cloud Functions (Real-time sync)
                           │
                           ▼
       ┌─────────────────────────────────────────────────────┐
       │              NEO4J KNOWLEDGE GRAPH                   │
       │     (Relationship Intelligence - Insights)           │
       │  Nodes: Person, Task, Event, Card, Habit, etc       │
       │  Rels: ANTICIPATES, MONITORS, EXECUTES, OWNS, etc   │
       └───────────────────┬─────────────────────────────────┘
                           │
                           │ Query API
                           │
                           ▼
       ┌─────────────────────────────────────────────────────┐
       │         ALLIE AI AGENT (Claude Opus 4.1)            │
       │  - Runs queries on Knowledge Graph                   │
       │  - Detects patterns and anomalies                    │
       │  - Generates insights and recommendations            │
       │  - Triggers proactive interventions                  │
       └───────────────────┬─────────────────────────────────┘
                           │
                           │ Interventions
                           │
                           ▼
       ┌─────────────────────────────────────────────────────┐
       │              USER NOTIFICATIONS                      │
       │  - Push notifications (mobile)                       │
       │  - In-app messages (web)                             │
       │  - Email digest (daily/weekly)                       │
       │  - SMS urgent alerts (burnout risk)                  │
       └─────────────────────────────────────────────────────┘
```

**Key Technical Components:**

**1. Firestore Schema**

```javascript
// Collections
families/
  {familyId}/
    metadata: { name, createdAt, subscription, settings }
    members: [ { userId, name, role, age, ... } ]

users/
  {userId}/
    profile: { name, email, role, familyId, ... }
    preferences: { notifications, voice, theme, ... }

events/
  {eventId}/
    familyId, userId, title, description, location
    startTime (Timestamp), endTime (Timestamp)
    attendees: [userId], relatedContacts: [contactId]
    relatedTasks: [taskId], relatedEmails: [emailId]
    source: 'manual' | 'google' | 'email' | 'sms'
    status: 'active' | 'confirmed' | 'cancelled'
    metadata: { isDemo: boolean, generatedAt, ... }

kanbanTasks/
  {taskId}/
    familyId, userId, title, description, column
    createdBy, assignedTo, dueDate, priority
    relatedEventId, fairPlayCardId
    cognitiveLoadType: 'anticipation' | 'monitoring' | 'execution'
    metadata: { isDemo: boolean, emotionalLoad, ... }

fairPlayCards/
  {cardId}/
    familyId, name, category, description
    owner: userId, assignedAt, minimumStandardOfCare
    relatedTasks: [taskId], relatedEvents: [eventId]

surveys/
  {surveyId}/
    familyId, userId, surveyType, completedAt
    responses: { questionId: answer, ... }
    calculatedMetrics: { cognitiveLoad, relationshipQuality, ... }

habits/
  {habitId}/
    familyId, habitName, targetMetric, goal
    startDate, endDate, status: 'active' | 'completed'
    adherence: [ { date, completed: boolean } ]

choreTemplates/
  {templateId}/
    familyId, title, description, bucksReward
    difficulty, category, ageMin, ageMax

choreInstances/
  {instanceId}/
    familyId, childId, scheduleId, templateId
    date (Timestamp), status, bucksAwarded, completedAt

familyContacts/
  {contactId}/
    familyId, name, role, phone, email
    category, tags, relatedEvents: [eventId]

emailInbox/
  {emailId}/
    familyId, from, to, subject, body
    receivedAt, status: 'unprocessed' | 'processed'
    aiAnalysis: { summary, category, actionable, sentiment }
    relatedEventId, relatedContactId
```

**2. Neo4j Schema**

```cypher
// Node labels
:Person { userId, familyId, name, role, age, cognitiveLoad, isDemo }
:Task { taskId, familyId, title, category, status, createdAt, isDemo }
:Event { eventId, familyId, title, startTime, location, isDemo }
:FairPlayCard { cardId, familyId, name, category, isDemo }
:Habit { habitId, familyId, name, targetMetric, goal, isDemo }
:Contact { contactId, familyId, name, role, category, isDemo }
:Chore { choreId, familyId, title, bucksReward, isDemo }
:Survey { surveyId, familyId, surveyType, completedAt, isDemo }

// Relationship types
(:Person)-[:ANTICIPATES {timestamp, leadTimeDays, emotionalLoad}]->(:Task)
(:Person)-[:MONITORS {timestamp, checkCount, anxietyLevel}]->(:Task)
(:Person)-[:EXECUTES {timestamp, completedAt, quality}]->(:Task)
(:Person)-[:OWNS {assignedAt, previousOwner}]->(:FairPlayCard)
(:Person)-[:PRACTICES {startDate, adherence, streakCount}]->(:Habit)
(:Person)-[:ORGANIZES {timestamp, leadTime}]->(:Event)
(:Person)-[:ATTENDS {timestamp, status}]->(:Event)
(:Task)-[:MAPS_TO]->(:FairPlayCard)
(:Task)-[:PREP_FOR {leadTime}]->(:Event)
(:Event)-[:INVOLVES]->(:Contact)
(:Chore)-[:ASSIGNED_TO {date, status}]->(:Person)
(:Habit)-[:TARGETS {goalValue, currentValue}]->(:Person)
(:Survey)-[:MEASURES {metricName, value}]->(:Person)

// Indexes for performance
CREATE INDEX person_family_id FOR (p:Person) ON (p.familyId);
CREATE INDEX task_family_id FOR (t:Task) ON (t.familyId);
CREATE INDEX person_user_id FOR (p:Person) ON (p.userId);
CREATE CONSTRAINT unique_person_user FOR (p:Person) REQUIRE p.userId IS UNIQUE;
```

**3. Cloud Functions (Real-time Sync)**

```javascript
// functions/index.js

// Sync new tasks to Neo4j
exports.syncTaskToNeo4j = functions.firestore
  .document('kanbanTasks/{taskId}')
  .onWrite(async (change, context) => {
    const taskId = context.params.taskId;
    const data = change.after.data();

    if (!data) {
      // Task deleted
      await neo4j.run(`
        MATCH (t:Task {taskId: $taskId})
        DETACH DELETE t
      `, { taskId });
      return;
    }

    // Task created or updated
    await neo4j.run(`
      MERGE (t:Task {taskId: $taskId, familyId: $familyId})
      SET t.title = $title,
          t.category = $category,
          t.status = $status,
          t.createdAt = datetime($createdAt),
          t.isDemo = $isDemo

      MERGE (creator:Person {userId: $createdBy})
      MERGE (creator)-[r:ANTICIPATES]->(t)
      SET r.timestamp = datetime($createdAt),
          r.emotionalLoad = $emotionalLoad

      MERGE (executor:Person {userId: $assignedTo})
      MERGE (executor)-[:EXECUTES]->(t)

      WITH t
      MATCH (card:FairPlayCard {cardId: $fairPlayCardId})
      MERGE (t)-[:MAPS_TO]->(card)
    `, {
      taskId,
      familyId: data.familyId,
      title: data.title,
      category: data.category,
      status: data.status,
      createdAt: data.createdAt.toDate().toISOString(),
      isDemo: data.metadata?.isDemo || false,
      createdBy: data.createdBy,
      assignedTo: data.assignedTo,
      emotionalLoad: data.metadata?.emotionalLoad || 0.5,
      fairPlayCardId: data.fairPlayCardId
    });

    console.log(`Synced task ${taskId} to Neo4j`);
  });

// Sync new events to Neo4j
exports.syncEventToNeo4j = functions.firestore
  .document('events/{eventId}')
  .onWrite(async (change, context) => {
    const eventId = context.params.eventId;
    const data = change.after.data();

    if (!data) {
      await neo4j.run(`MATCH (e:Event {eventId: $eventId}) DETACH DELETE e`, { eventId });
      return;
    }

    await neo4j.run(`
      MERGE (e:Event {eventId: $eventId, familyId: $familyId})
      SET e.title = $title,
          e.startTime = datetime($startTime),
          e.location = $location,
          e.isDemo = $isDemo

      WITH e
      UNWIND $attendees as attendeeId
      MERGE (person:Person {userId: attendeeId})
      MERGE (person)-[:ATTENDS]->(e)

      WITH e
      MATCH (organizer:Person {userId: $organizer})
      MERGE (organizer)-[:ORGANIZES]->(e)
    `, {
      eventId,
      familyId: data.familyId,
      title: data.title,
      startTime: data.startTime.toDate().toISOString(),
      location: data.location,
      isDemo: data.metadata?.isDemo || false,
      attendees: data.attendees || [],
      organizer: data.attendees?.[0] || data.userId
    });

    console.log(`Synced event ${eventId} to Neo4j`);
  });

// Similar functions for:
// - syncFamilyToNeo4j (creates Person nodes)
// - syncChoreToNeo4j (creates Chore nodes with ASSIGNED_TO relationships)
// - syncFairPlayToNeo4j (creates FairPlayCard nodes with OWNS relationships)
// - syncSurveyToNeo4j (creates Survey nodes with MEASURES relationships)
```

**4. Allie AI Agent (Proactive System)**

```javascript
// server/services/AllieProactiveAgent.js

class AllieProactiveAgent {
  constructor() {
    this.neo4jService = new Neo4jService();
    this.claudeService = claudeService;
    this.notificationService = new NotificationService();
    this.monitoringInterval = 5 * 60 * 1000; // 5 minutes
  }

  async start() {
    console.log('Starting Allie Proactive Agent...');

    // Monitor all active families
    setInterval(() => {
      this.monitorAllFamilies();
    }, this.monitoringInterval);
  }

  async monitorAllFamilies() {
    const families = await this.getActiveFamilies();

    for (const family of families) {
      try {
        await this.monitorFamily(family.id);
      } catch (error) {
        console.error(`Error monitoring family ${family.id}:`, error);
      }
    }
  }

  async monitorFamily(familyId) {
    // Run all intervention checks
    await Promise.all([
      this.checkCognitiveLoadSpike(familyId),
      this.checkBurnoutRisk(familyId),
      this.checkSundayNightSpike(familyId),
      this.checkFairPlayCardImpact(familyId),
      this.checkChildDevelopment(familyId),
      this.checkSchedulingConflicts(familyId),
      this.checkHabitAdherence(familyId)
    ]);
  }

  async checkCognitiveLoadSpike(familyId) {
    const query = `
      MATCH (p:Person {familyId: $familyId, role: 'parent'})-[r:ANTICIPATES|MONITORS|CREATES]->(t:Task)
      WHERE r.timestamp > datetime() - duration({hours: 24})
      WITH p,
           count(CASE WHEN type(r) = 'ANTICIPATES' THEN 1 END) * 2.0 as todayAnticipation,
           count(CASE WHEN type(r) = 'MONITORS' THEN 1 END) * 1.5 as todayMonitoring,
           count(CASE WHEN type(r) = 'CREATES' THEN 1 END) * 1.0 as todayCreation
      WITH p, (todayAnticipation + todayMonitoring + todayCreation) as todayLoad

      MATCH (p)-[r:ANTICIPATES|MONITORS|CREATES]->(t:Task)
      WHERE r.timestamp > datetime() - duration({days: 30})
        AND r.timestamp < datetime() - duration({days: 1})
      WITH p, todayLoad,
           count(r) / 29.0 as avgDailyLoad

      WHERE todayLoad > avgDailyLoad * 1.5
      RETURN p.userId, p.name, todayLoad, avgDailyLoad,
             (todayLoad / avgDailyLoad) as spikeMultiplier
    `;

    const result = await this.neo4jService.runQuery(query, { familyId });

    if (result.length > 0) {
      const person = result[0];
      await this.triggerIntervention('cognitive_load_spike', {
        familyId,
        userId: person.userId,
        name: person.name,
        todayLoad: person.todayLoad,
        avgDailyLoad: person.avgDailyLoad,
        spikeMultiplier: person.spikeMultiplier
      });
    }
  }

  async triggerIntervention(type, data) {
    console.log(`Triggering intervention: ${type}`, data);

    // Generate intervention message using Claude
    const prompt = this.buildInterventionPrompt(type, data);
    const message = await this.claudeService.generateResponse(prompt);

    // Determine recipients
    const recipients = this.determineRecipients(type, data);

    // Send notifications
    for (const recipient of recipients) {
      await this.notificationService.send({
        userId: recipient.userId,
        type: type,
        title: this.getInterventionTitle(type),
        message: message,
        urgency: this.getUrgency(type, data),
        actionable: true,
        actions: this.getActions(type, data)
      });
    }
  }

  buildInterventionPrompt(type, data) {
    const prompts = {
      cognitive_load_spike: `
        ${data.name}'s cognitive load has spiked to ${data.todayLoad} today,
        which is ${data.spikeMultiplier.toFixed(1)}x their normal daily average.

        Generate a supportive, non-judgmental message to send to their partner
        suggesting they help rebalance by taking on some tasks today.

        Tone: Empathetic, collaborative ("team vs the mental load")
        Length: 2-3 sentences
        Include: Specific number (suggest taking 3-5 tasks)
      `,

      burnout_risk: `
        ${data.name}'s cognitive load has been increasing steadily over ${data.weeks} weeks
        and is now at ${data.currentLoad} (critical threshold is 85).
        Burnout risk is ${data.riskLevel}.

        Generate an urgent but compassionate message to send to their partner
        and a separate check-in message to send to ${data.name}.

        Tone: Concerned, actionable, hopeful
        Length: Partner message 3-4 sentences, check-in 2-3 sentences
      `,

      // ... other intervention prompts
    };

    return prompts[type];
  }

  determineRecipients(type, data) {
    // Logic to determine who should receive the notification
    switch(type) {
      case 'cognitive_load_spike':
        // Send to partner
        return this.getPartner(data.userId, data.familyId);

      case 'burnout_risk':
        // Send to both the person at risk and their partner
        return [
          this.getUser(data.userId),
          this.getPartner(data.userId, data.familyId)
        ];

      // ... other cases
    }
  }
}

// Start the agent
const agent = new AllieProactiveAgent();
agent.start();
```

---

### Development Roadmap (6-Month Sprint Plan)

**Month 1-2: Foundation + Flow 2 MVP**

**Week 1-2: Core Infrastructure**
- ✅ Firebase setup (already done)
- ✅ Neo4j Aura setup (already done)
- ✅ Cloud Run deployment (already done)
- [ ] Redis setup for caching
- [ ] User authentication flow (email/password, Google OAuth)
- [ ] Family onboarding flow (family structure questions)

**Week 3-4: Flow 2 - Task Board**
- [ ] Kanban task board UI (To Do, In Progress, Done)
- [ ] Task creation/edit/delete
- [ ] Task assignment (manual)
- [ ] Task filtering and search
- [ ] Task dependencies
- [ ] Firestore → Neo4j sync for tasks

**Week 5-6: Flow 2 - Calendar**
- [ ] Calendar grid view (month/week/day)
- [ ] Event creation/edit/delete with attendees
- [ ] Google Calendar sync (bidirectional)
- [ ] Conflict detection
- [ ] Event → Task generation (manual trigger)
- [ ] Firestore → Neo4j sync for events

**Week 7-8: Flow 2 - Unified Inbox**
- [ ] Inbox UI (email/SMS/document tabs)
- [ ] AI processing pipeline (categorization, summarization)
- [ ] Email → Event creation (manual trigger)
- [ ] Email → Contact creation
- [ ] Contact management
- [ ] Smart routing (based on category)

**Milestone 1: Flow 2 MVP Functional** (End of Month 2)
- Users can manage tasks, events, inbox
- Basic AI processing works
- Google Calendar syncs
- Knowledge Graph populates with real data

---

**Month 3-4: Flow 1 + Allie Chat**

**Week 9-10: Flow 1 - Surveys**
- [ ] Survey engine with branching logic
- [ ] Cognitive Load Index survey (15 questions)
- [ ] Fair Play Card Distribution survey (100 cards)
- [ ] Relationship Quality survey (MQoRS)
- [ ] Parenting Style survey
- [ ] Survey results processing and storage
- [ ] Firestore → Neo4j sync for surveys

**Week 11-12: Flow 1 - Analysis & Insights**
- [ ] Invisible Labor Analysis (anticipation/monitoring/execution)
- [ ] Cognitive Load calculation and scoring
- [ ] Fair Play imbalance detection
- [ ] Burnout risk scoring
- [ ] Pattern detection (Sunday night spike, etc.)
- [ ] Insight generation (Claude API integration)

**Week 13-14: Flow 1 - Habit Selection & Tracking**
- [ ] Habit library (Fair Play-based recommendations)
- [ ] Collaborative habit selection UI (both partners choose together)
- [ ] Habit tracking system (adherence, streak, plateau detection)
- [ ] Progress visualization (before/after comparisons)
- [ ] Family Meeting facilitation mode (structured agenda)

**Week 15-16: Allie Chat Everywhere**
- [ ] Chat UI component (sidebar, drawer, modal)
- [ ] Context-aware prompts (knows current view)
- [ ] Natural language query processing
- [ ] Knowledge Graph query generation
- [ ] Voice interface (speech-to-text, text-to-speech)
- [ ] Chat history and conversation memory

**Milestone 2: Full Two-Flow System Functional** (End of Month 4)
- Users can take surveys and get insights
- Habit selection and tracking works
- Allie chat accessible from all views
- Knowledge Graph drives insights

---

**Month 5-6: Proactive Intelligence + Kids Section**

**Week 17-18: Proactive Allie**
- [ ] Proactive agent background process
- [ ] Real-time cognitive load monitoring
- [ ] Intervention trigger system
- [ ] Smart task assignment (based on Fair Play cards)
- [ ] Event attendee suggestions (based on card ownership)
- [ ] Inbox routing (based on card ownership)
- [ ] Notification system (push, in-app, email, SMS)

**Week 19-20: Kids Section**
- [ ] Chore Chart UI (daily/weekly view)
- [ ] Chore template management
- [ ] Chore schedule creation (frequency, time, days)
- [ ] Chore instance generation (daily background job)
- [ ] Chore completion tracking
- [ ] Palsson Bucks balance display
- [ ] Reward Party UI
- [ ] Reward template management
- [ ] Reward redemption flow
- [ ] Firestore → Neo4j sync for chores

**Week 21-22: Demo Data System**
- [ ] Personalized demo data generation on signup
- [ ] Age-appropriate chore generation
- [ ] Local contact generation (zip code-based)
- [ ] Realistic event generation
- [ ] Connected inbox generation
- [ ] Fair Play imbalance simulation
- [ ] Demo/real data toggle in UI
- [ ] Baseline comparison analytics

**Week 23-24: Polish + Launch Prep**
- [ ] UI/UX polish (animations, transitions, empty states)
- [ ] Mobile responsiveness (works on phone/tablet)
- [ ] Performance optimization (lazy loading, code splitting)
- [ ] Error handling and edge cases
- [ ] Onboarding tutorial (product tour)
- [ ] Help center and documentation
- [ ] Pricing page and subscription flow
- [ ] Analytics and tracking (Mixpanel/Amplitude)

**Milestone 3: Production-Ready Product** (End of Month 6)
- Proactive interventions working
- Kids section functional
- Demo data shows value immediately
- Mobile-friendly and performant
- Ready for beta launch

---

## Part 5: Success Metrics & KPIs

### Product-Market Fit Metrics

**Primary Metric: Relationship Quality Improvement**
- Target: 30%+ improvement in MQoRS score over 90 days
- Benchmark: Paired app achieved 35.5% (our target)
- Measurement: Survey at Day 0, Day 30, Day 90

**Secondary Metrics:**

**1. Cognitive Load Rebalancing**
- Starting imbalance: 78/22 split (typical)
- Target: 60/40 split within 90 days
- Measurement: Weekly calculation from Knowledge Graph

**2. Engagement (Dailiness)**
- Target: 80%+ daily active users (DAU/WAU ratio)
- Benchmark: Paired app achieved 64.3% sustained usage
- Measurement: Daily login + interaction (task complete, survey answer, chat message)

**3. Retention**
- Target: 70% retention at 30 days, 50% at 90 days
- Industry benchmark: 40% at 30 days for relationship apps
- Measurement: Cohort analysis by signup date

**4. Fair Play Card Transfers**
- Target: 3+ cards transferred within 90 days
- Indicates: Active rebalancing happening
- Measurement: Fair Play ownership changes in Firestore

**5. Habit Adherence**
- Target: 70%+ adherence rate for selected habits
- Benchmark: Habit tracking apps average 50-60%
- Measurement: Daily habit completion tracking

**6. Partner Participation**
- Target: 100% of families have both partners active
- Critical: Two-sided adoption required for success
- Measurement: Both partners complete surveys + log in weekly

**7. Proactive Intervention Acceptance**
- Target: 60%+ of Allie's suggestions accepted
- Indicates: Trust in AI recommendations
- Measurement: Suggestion shown vs accepted/rejected ratio

**8. Knowledge Graph Utilization**
- Target: 50%+ of users ask natural language questions
- Indicates: Value in insights
- Measurement: Knowledge Graph queries per user per week

### Business Metrics

**Revenue (Freemium Model)**

**Free Tier:**
- Core features: Task board, Calendar (manual), Inbox (basic), Chore chart
- Survey limit: 1 per month
- Habit limit: 3 active habits
- Allie chat: 10 messages per day
- Knowledge Graph: Basic queries only

**Premium Tier: $9.99/month or $79.99/year ($6.67/month)**
- All features unlocked
- Unlimited surveys and re-assessments
- Unlimited habits
- Unlimited Allie chat
- Advanced Knowledge Graph (custom queries, export data)
- Voice interface
- Google Calendar sync
- Priority support

**Revenue Targets:**

Year 1:
- 10,000 signups (free tier)
- 20% conversion to premium = 2,000 paying customers
- Average revenue per paying user = $100/year
- Annual revenue = $200,000

Year 2:
- 50,000 signups
- 25% conversion (improving as value proves) = 12,500 paying
- ARPU = $110/year (more annual subscribers)
- Annual revenue = $1,375,000

Year 3:
- 200,000 signups
- 30% conversion = 60,000 paying
- ARPU = $120/year
- Annual revenue = $7,200,000

**CAC (Customer Acquisition Cost):**
- Target: $30 per signup
- Channels: Content marketing (mental load crisis), SEO, Fair Play community, mom influencers
- LTV/CAC ratio: $300 LTV / $30 CAC = 10x (healthy)

**Churn:**
- Target: <5% monthly churn for premium
- Retention tactics: Proactive value delivery, continuous improvement, community features
- Churn reasons to monitor: "Partner stopped using," "Too expensive," "Didn't see results"

---

## Part 6: Competitive Positioning

### Competitive Landscape

**Direct Competitors:**

**1. Fair Play (fairplaylife.com)**
- Strengths:
  - Strong brand and book (Eve Rodsky)
  - 100-card system is proven
  - Large community
- Weaknesses:
  - Card system is manual (physical or spreadsheet)
  - No AI, no automation
  - No daily engagement mechanism
  - No relationship quality measurement
- How we win: Digital version with AI + automation + daily engagement

**2. Cozi (cozi.com)**
- Strengths:
  - Established (15+ years)
  - Free family calendar and task list
  - 15M+ users
- Weaknesses:
  - No Fair Play integration
  - No cognitive load measurement
  - No AI intelligence
  - Tracks execution only (not anticipation/monitoring)
- How we win: Invisible labor visibility + Fair Play + AI insights

**3. OurHome (ourhomeapp.com)**
- Strengths:
  - Chore tracking with rewards
  - Gamification for kids
  - Free with premium
- Weaknesses:
  - Focused on kids only (no partner equity)
  - No cognitive load concepts
  - No relationship quality focus
- How we win: Parents + kids + Fair Play + relationship science

**4. Paired (paired.com)**
- Strengths:
  - Proven 35.5% relationship quality improvement
  - Daily engagement model works
  - Strong retention (64.3%)
- Weaknesses:
  - Emotional intimacy only (no household labor)
  - No task management
  - No Fair Play methodology
- How we win: Combine relationship quality + household equity

**5. Lasting (getlasting.com)**
- Strengths:
  - Therapy-based relationship improvement
  - Strong content library
- Weaknesses:
  - No household labor focus
  - Expensive ($29.99/month)
  - No task management
- How we win: Lower price + household equity + task management

**Indirect Competitors:**

- Asana, Trello, Notion (work tools used for home)
- Google Calendar (events only)
- Chore tracking apps (ChoreMonster, Homey)
- Relationship therapy (BetterHelp, Talkspace)

### Our Unique Value Proposition

**"Allie is the only family operating system that combines Fair Play methodology, relationship science, and AI intelligence to break the mental load crisis—helping partners rebalance cognitive labor, improve relationship quality, and prevent burnout."**

**What makes us different:**

1. **Two-flow architecture** - Assessment informs execution, execution refines assessment (no one else does this)
2. **Knowledge Graph intelligence** - All family data consolidated for predictive insights
3. **Proactive AI agent** - Allie intervenes before problems escalate (not just reactive)
4. **Evidence-based design** - Built on Fair Play + Paired's proven engagement model + relationship science
5. **Invisible labor visibility** - Tracks anticipation and monitoring (not just execution)
6. **Partner equity focus** - Both partners required, collaborative from day one
7. **Year of demo data** - Families see value before committing real data
8. **Kids included** - Chores + rewards + development tracking (not just parents)

**Target Customer:**

**Primary:** Different-sex couples with kids (ages 0-18), where mom feels overwhelmed by mental load

Demographics:
- Ages 28-45
- Household income $75k-$150k+
- College-educated
- Tech-savvy (comfortable with apps)
- Values: Fairness, partnership, evidence-based parenting

Psychographics:
- Mom: "I'm exhausted from managing everything"
- Dad: "I want to help but don't know what needs doing"
- Both: "We love each other but feel like roommates, not partners"

**Secondary:** Same-sex couples, single parents (with co-parent), families without kids (household labor still imbalanced)

---

## Part 7: Next Steps & Immediate Actions

### Week 1 Priorities (CTO + CPO + AI Lead)

**CTO Focus: Infrastructure**
1. Set up Redis for caching (Allie chat history, Knowledge Graph query results)
2. Optimize Neo4j queries (add indexes, test performance at scale)
3. Build CI/CD pipeline (automated testing + deployment)
4. Set up error monitoring (Sentry or similar)
5. Create development/staging/production environments

**CPO Focus: Product Spec**
1. Write detailed user stories for Flow 2 MVP (Task Board, Calendar, Inbox)
2. Create wireframes for all core screens
3. Define interaction patterns (drag-drop, click, swipe)
4. Specify empty states, loading states, error states
5. Plan onboarding flow (signup → family setup → demo data → first survey)

**AI Lead Focus: Intelligence Layer**
1. Design cognitive load calculation algorithm (weights, formulas, thresholds)
2. Specify intervention trigger conditions (when should Allie act?)
3. Plan prompt engineering for Claude (system prompt, few-shot examples)
4. Design Knowledge Graph query patterns (common questions users will ask)
5. Build ML pipeline for pattern detection (Sunday night spike, burnout prediction)

### Month 1 Milestones

**By End of Week 4:**
- [ ] Flow 2 MVP functional (Task Board + Calendar + Inbox basics)
- [ ] Firestore → Neo4j sync working for tasks and events
- [ ] Demo family data populates automatically on signup
- [ ] User can create tasks, events, and see them in Knowledge Graph
- [ ] Basic Allie chat responds to simple queries

**Demo Goal:**
"Show a new family signing up, seeing demo data populate, taking first survey, and receiving first insight from Allie about cognitive load imbalance."

### Success Criteria for Beta Launch (Month 6)

**Must Have:**
1. Both flows functional (Assessment + Operations)
2. Knowledge Graph drives insights
3. Proactive interventions working
4. Demo data system complete
5. Mobile-responsive
6. 50+ beta families testing
7. 20%+ relationship quality improvement proven
8. Both partners using app consistently

**Nice to Have:**
1. Voice interface for Allie
2. Google Calendar sync (can be manual for beta)
3. Kids section (can launch after beta)
4. Advanced Knowledge Graph visualizations
5. Export data feature
6. Integrations (Outlook, Apple Calendar)

---

## Conclusion: The Vision Realized

**This is not just a product roadmap. This is a blueprint for breaking the mental load crisis.**

We're building Allie to be the intelligent family operating system that:

1. **Learns** why families are imbalanced (Flow 1: Surveys, interviews, assessments)
2. **Acts** to rebalance proactively (Flow 2: Smart task assignment, event attachment, inbox routing)
3. **Improves** through continuous feedback (Knowledge Graph consolidates all data, cycles improve over time)

**The magic is in the connection:**
- Surveys inform daily operations
- Daily operations generate real behavior data
- Real behavior data makes next survey smarter
- Knowledge Graph synthesizes everything into actionable insights
- Allie proactively intervenes before burnout happens

**The market is ready:**
- 40% increased heart disease risk for women with mental load
- 20% of mothers experiencing mental health disorders
- 35.5% relationship quality improvement proven possible
- $2.8B relationship app market growing fast
- Zero competitors integrating household equity + relationship quality

**We have the technology:**
- Two-flow architecture designed
- Knowledge Graph structure defined
- AI agent proactive system specified
- Demo data generation system built
- 6-month roadmap clear

**Now we execute.**

Let's build the future of family management—where no partner feels invisible, no parent burns out, and every family has the intelligence they need to thrive.

---

*Document Version: 1.0*
*Last Updated: October 20, 2025*
*Next Review: November 20, 2025*

