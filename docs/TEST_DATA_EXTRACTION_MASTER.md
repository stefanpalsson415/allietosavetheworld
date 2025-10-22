# Test Data Extraction Master Document

**Generated:** October 22, 2025
**Purpose:** Extract maximum value from 2 days of agent-driven test data creation

## What We Built

Over the past two days, we created a comprehensive agent-driven simulation system that generated an entire year of realistic family data for the Palsson Family:

- **5 AI Agents** (Stefan, Kimberly, Lillian, Oly, Tegner) with unique personalities
- **365 Days** of family activity simulation
- **327 Calendar Events** (doctor appointments, school activities, sports)
- **443 Tasks** created with realistic patterns
- **84 Surveys Completed** across 225 weekly cycles
- **280+ Allie AI Interactions** with context-aware responses
- **100 Family Contacts** (doctors, teachers, coaches, friends)
- **25 Documents** uploaded with OCR processing
- **74 Emails + 32 SMS** received through inbox system
- **Full Neo4j Knowledge Graph** with 16,200+ survey responses synced

## File Structure

This master document indexes all the outputs we're creating:

### 1. Data Schema Documentation
📄 `/docs/DATA_SCHEMA.md` - Complete Firestore collection schemas

### 2. Seed Data System
📁 `/scripts/seed-data/` - Reusable family templates
- `seed-templates.js` - Family archetypes (busy family, single parent, etc.)
- `seed-demo-family.js` - Quick demo family generation
- `seed-development.js` - Local dev environment seeding

### 3. Data Validation
📄 `/src/utils/dataValidation.js` - Field validators and business rules

### 4. TypeScript Interfaces
📄 `/src/types/dataModels.ts` - Complete type definitions

### 5. Test Suite
📄 `/src/tests/data-integrity.test.js` - Data integrity tests

### 6. Migration Utilities
📁 `/scripts/migrations/` - Data migration and cleanup scripts

### 7. API Documentation
📄 `/docs/API_DATA_FORMATS.md` - Request/response formats

### 8. Test Fixtures
📁 `/src/fixtures/` - Sample data for tests

## Key Data Discoveries

### Family Member Structure
- **Required IDs**: Both `id`, `memberId`, AND `userId` fields (FamilyContext vs FamilyProfileService)
- **Personality Traits**: helpfulness, awareness, followThrough, initiative (0.0-1.0 scale)
- **Mental Load Tracking**: mentalLoad, taskCreationRate (evolves over time)
- **Agent Metadata**: agentType, isSimulatedAgent for simulation tracking

### Cycle System
- **CycleId Format Mismatch**: UI expects `'45'`, but document ID is `'weekly_45'`
- **3-Step Process**: Habits → Survey → Meeting
- **Progress Tracking**: Per-step completion timestamps and status flags
- **Weekly Cycles**: 52 cycles per year, stored in nested subcollections

### Habits System
- **Completion Tracking**: completionCount, targetFrequency (usually 5)
- **ELO Rating**: Effectiveness score that adapts (starts at 1200)
- **Cycle Linkage**: Must use string cycleId, not numeric
- **Category Mapping**: 4 categories (Home, Kids, Work, Self)

### Survey Structure (72 Questions)
- **Response Format**: Numeric 0-10 scale + optional text
- **Category Breakdown**: Anticipation, Monitoring, Execution scores
- **Neo4j Sync**: Auto-syncs to knowledge graph via Cloud Functions
- **Cognitive Load Calculation**: Weighted combination of all 3 dimensions

### Contacts Database (100 Contacts)
- **8 Categories**: Medical, School, Sports, Education, Childcare, Friends, Family, Services
- **Structured Fields**: name, category, role, phone, email, address
- **Realistic Distribution**: 12 medical, 12 school, 12 sports, ~60 others

### Calendar Events
- **Required Fields**: familyId, userId (for security queries)
- **Timestamp Format**: Firestore Timestamp for startTime/endTime
- **Source Tracking**: 'google' vs 'manual' for sync conflict resolution
- **Reminder Structure**: Array of {minutes, method} objects

## Simulation Statistics (1-Year Run)

From `simulation-results-1760881438633.json`:

```json
{
  "calendarEvents": 327,
  "tasksCreated": 443,
  "documentsUploaded": 25,
  "surveysCompleted": 84,
  "allieInteractions": 280,
  "messages": 106,
  "emailsReceived": 74,
  "smsReceived": 32,
  "contactsCreated": 10,
  "interviewsCompleted": 5,
  "familyMeetings": 22,
  "habitsFormed": 0
}
```

## Agent Personalities

### Stefan (Dad, 40) - Growth Journey
**Initial**: Low awareness (0.30), low initiative (0.40), high follow-through (0.90)
**Growth**: Learns to anticipate needs, mental load goes from 0.30 → 0.48
**Task Creation**: 0.15 → 0.40 (learns to create tasks proactively)

### Kimberly (Mom, 38) - Balance Journey
**Initial**: High everything (awareness 0.95, initiative 0.90, follow-through 0.98)
**Growth**: Learns to delegate, mental load decreases from 0.85 → 0.62
**Task Creation**: Maintains 0.65 (balanced responsibility)

### Lillian (14) - Skeptical → Helpful
**Journey**: Volleyball player learning responsibility
**Growth**: Plant care tasks, family meeting participation

### Oly (11) - Curious → Contributing
**Journey**: Science club member becoming more helpful
**Growth**: Asking questions → Taking action

### Tegner (7) - Chaotic → Engaged
**Journey**: High energy swimmer learning structure
**Growth**: Swimming practice → Time management

## Script Inventory

### Agent System (`/scripts/agents/`)
- `PersonaAgent.js` - Base agent class with personality
- `StefanAgent.js`, `KimberlyAgent.js` - Parent agents
- `ChildAgent.js` - Base child agent
- `LillianAgent.js`, `OlyAgent.js`, `TegnerAgent.js` - Individual child agents
- `AgentOrchestrator.js` - Coordinates all 5 agents
- `simulate-family-year.js` - Main simulation entry point
- `create-agent-family.js` - Initialize family in Firestore
- `test-agents.js` - Unit tests for agents

### Data Generation (`/functions/`)
- `generate-cycle-history.js` - 225 weekly survey cycles
- `generate-family-inbox-data.js` - Emails, SMS, contacts
- `generate-kids-activity.js` - Children's schedules and activities
- `generate-current-chores.js` - Chore assignments and tracking

### Diagnostic Scripts (`/scripts/`)
- `debug-cycle-45-habits.js` - Check habit data structure
- `verify-cycle-45-fix.js` - Verify cycleId format fix
- `check-simulation-dates.js` - Validate simulation date ranges
- `complete-cycle-45-habits.js` - Mark habits as completed

## Cloud Functions Integration

### Auto-Sync to Neo4j
- `syncFamilyToNeo4j` - Family member sync
- `syncTaskToNeo4j` - Task creation sync
- `syncEventToNeo4j` - Calendar event sync
- `syncChoreToNeo4j` - Chore assignment sync
- `syncSurveyToNeo4j` - **Critical**: Survey → Knowledge Graph sync
- `syncFairPlayToNeo4j` - Fair Play card distribution sync

**Trigger**: All fire on `onCreate`/`onWrite` for respective collections

## Neo4j Knowledge Graph

### Node Types
- `Person` - Family members with cognitive load metrics
- `Task` - Tasks with anticipation/monitoring/execution
- `Event` - Calendar events
- `Survey` - 225 survey cycles
- `SurveyResponse` - 16,200 individual question responses (72 questions × 225 cycles)
- `Question` - 72 unique survey questions
- `FairPlayCard` - Fair Play card assignments

### Relationship Types
- `CREATED` - Who created a task/event
- `ANTICIPATES` - Who noticed it needs doing (invisible labor!)
- `MONITORS` - Who checks if it's done (mental load!)
- `EXECUTES` - Who actually does it
- `ORGANIZES` - Who planned the event
- `COMPLETED_SURVEY` - Survey completion tracking
- `ANSWERED` - Question response linkage

## Known Data Patterns & Edge Cases

### Critical Issues We Fixed
1. **CycleId Format**: UI queries `'45'`, document stored as `'weekly_45'`
2. **Multiple ID Fields**: Need `id`, `memberId`, AND `userId` for different services
3. **Timestamp Types**: Mix of Firestore Timestamp and ISO strings
4. **Event Queries**: Must have `userId` field for security rules
5. **Neo4j Integer Objects**: Use `toInteger()` for all `id()` calls
6. **Property Name Conflicts**: Avoid `type` as property name (triggers conversion)

### Data Validation Rules Discovered
- Email format: Standard RFC 5322
- Phone format: E.164 international format (`+14155551234`)
- Age ranges: Children 0-17, Adults 18+
- Personality traits: Always 0.0-1.0 scale
- Task completion: 0-100% progress
- Survey responses: 0-10 numeric scale
- Cycle numbers: 1-52 for weekly, 1-12 for monthly

### Business Rules
- Max family size: 9 members (tested with Palsson family)
- Survey frequency: Weekly cycles (7 days)
- Habit target: 5 completions per cycle
- Minimum parents: At least 1 parent required
- Cycle progression: Habits → Survey → Meeting (sequential)

## Integration Points

### Frontend ↔ Backend
- `KnowledgeGraphService.js` - Fetches Neo4j data via Cloud Run API
- `AllieConversationEngine.jsx` - Loads KG insights in `buildContext()`
- `ClaudeService.js` - System prompt includes KG capabilities
- `TasksTab.jsx` - Loads habits via `HabitCyclesService.getHabits()`

### Firestore ↔ Neo4j
- Cloud Functions auto-sync on document creation
- 5-minute retry with exponential backoff
- Batch operations for performance
- Granular data (SurveyResponse, Question) excluded from UI queries

### External Integrations
- Google Calendar API - Bidirectional sync
- OpenAI TTS-1-HD - Premium voice (Nova, 0.95x speed)
- Anthropic Claude Opus 4.1 - Main AI model
- Anthropic Claude Sonnet 3.5 - Sales conversations
- Brevo - Email notifications

## Next Steps

Use this master document as an index to:

1. ✅ **Read each generated file** to understand specific patterns
2. ✅ **Run seed scripts** to populate local/staging environments
3. ✅ **Execute validation tests** to ensure data integrity
4. ✅ **Reference TypeScript interfaces** when writing new code
5. ✅ **Follow API documentation** for consistent request/response formats
6. ✅ **Use test fixtures** for unit and E2E tests
7. ✅ **Apply migrations** to fix existing data inconsistencies

## Additional Valuable Outputs

Beyond the requested 8 outputs, we should also create:

9. **Performance Benchmarks** (`/docs/PERFORMANCE_BENCHMARKS.md`)
   - Query optimization patterns discovered
   - Indexing strategies that worked
   - Caching patterns (5-min TTL for KG data)

10. **Agent Configuration Templates** (`/scripts/agents/persona-templates/`)
    - Reusable personality profiles
    - Growth trajectory templates
    - Task creation patterns

11. **Error Handling Patterns** (`/docs/ERROR_HANDLING_PATTERNS.md`)
    - All errors encountered during simulation
    - Recovery strategies that worked
    - Retry logic patterns

12. **Data Privacy Compliance** (`/docs/DATA_PRIVACY_SCHEMA.md`)
    - PII fields identified
    - Anonymization strategies for test data
    - GDPR/CCPA compliance patterns

13. **Monitoring & Observability** (`/scripts/monitoring/`)
    - Data quality metrics
    - Anomaly detection patterns
    - Alert thresholds

## File Generation Order

To maximize value extraction:

1. **DATA_SCHEMA.md** (Foundation) - Document all collections first
2. **dataModels.ts** (Types) - Type safety for all code
3. **dataValidation.js** (Rules) - Enforce discovered patterns
4. **seed-templates.js** (Seeding) - Reusable family generation
5. **data-integrity.test.js** (Testing) - Prevent regressions
6. **migrations/** (Cleanup) - Fix existing data issues
7. **API_DATA_FORMATS.md** (Integration) - API consistency
8. **fixtures/** (Development) - Fast component development

---

**Status**: Master index complete ✓
**Next**: Generate individual output files systematically
**Owner**: Extract maximum value from 2 days of test data work

