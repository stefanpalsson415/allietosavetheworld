# 🎯 Allie Survey System Architecture

## Executive Summary

The Allie Survey System is an AI-powered, adaptive survey engine that creates personalized questions based on family context, learns from responses, and evolves with family progress. It integrates deeply with the Family Knowledge Graph to provide continuous insight generation and behavioral change tracking.

## 🏗️ System Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                      Survey System Flow                        │
├─────────────────────────────────────────────────────────────┤
│                                                                │
│  1. Context Analysis → 2. Dynamic Generation → 3. Collection   │
│           ↓                    ↓                     ↓         │
│  Family Context        AI Questions         Response Storage   │
│  Season/Location       Personalized         Firestore DB      │
│  Life Events          Categories            Local Cache       │
│           ↓                    ↓                     ↓         │
│  4. Analysis → 5. Learning → 6. Knowledge Graph Integration   │
│           ↓           ↓                ↓                       │
│  Imbalance Detection  Feedback Loop    Entity Creation        │
│  Behavior Tracking    Question Tuning  Relationship Mapping   │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

## 📁 Core Components

### 1. **Dynamic Survey Generator** (`DynamicSurveyGenerator.js`)
- **Purpose**: AI-powered question generation using Claude API
- **Features**:
  - Generates personalized questions based on family context
  - Considers location, season, family structure, ages
  - Creates culturally relevant questions
  - Caches questions for 24 hours for performance
- **Categories**:
  - Visible Household Tasks (25%)
  - Invisible Household Tasks (25%)
  - Visible Parental Tasks (25%)
  - Invisible Parental Tasks (25%)

### 2. **Context-Aware Survey Engine** (`ContextAwareSurveyEngine.js`)
- **Purpose**: Adapts questions based on real-time context
- **Context Factors**:
  - **Seasonal**: Holidays, school year, summer
  - **Life Events**: New baby, job change, moving
  - **Stress Levels**: From various family indicators
  - **Cultural Calendar**: Religious/cultural observances
  - **Calendar Context**: Upcoming events and schedules

### 3. **Progressive Survey Adapter** (`ProgressiveSurveyAdapter.js`)
- **Purpose**: Evolves survey difficulty based on family maturity
- **Progression Levels**:
  1. **AWARENESS**: Basic "who does what" questions
  2. **RECOGNITION**: Acknowledging imbalances
  3. **PLANNING**: How to redistribute tasks
  4. **IMPLEMENTATION**: Tracking specific changes
  5. **OPTIMIZATION**: Fine-tuning and sustainability
- **Progression Requirements**:
  - Minimum 3 surveys completed
  - 70%+ accuracy rate
  - 20%+ improvement rate

### 4. **Survey Feedback Learning Service** (`SurveyFeedbackLearningService.js`)
- **Purpose**: Learn from user feedback to improve future surveys
- **Learning Mechanisms**:
  - Track "not applicable" responses
  - Identify excluded categories per family
  - Find high-value questions
  - Category preference analysis
  - Cross-family learning patterns

### 5. **Survey Analysis Utility** (`SurveyAnalysisUtil.js`)
- **Purpose**: Analyze responses to identify imbalances
- **Analysis Features**:
  - Task imbalance detection by category
  - Role distribution analysis (Mama vs Papa)
  - Coverage and question count tracking
  - Filtering by respondent type (adult/child)
  - Cycle-specific analysis

### 6. **Knowledge Graph Integration** (`SurveyKnowledgeGraphIntegration.js`)
- **Purpose**: Convert survey data into knowledge graph entities
- **Integration Points**:
  - Creates survey entities with metadata
  - Links surveys to respondents
  - Extracts insights as separate entities
  - Maps relationships between responses
  - Tracks temporal changes

## 🔄 Survey Lifecycle

### Phase 1: Survey Creation
```javascript
// 1. Get family context
const context = await DynamicSurveyGenerator.getFamilyContext(familyId, memberId);

// 2. Analyze contextual factors
const contextAnalysis = await ContextAwareSurveyEngine.analyzeContext(familyData);

// 3. Generate personalized questions
const questions = await DynamicSurveyGenerator.generatePersonalizedQuestions(
  category,
  questionCount,
  context
);

// 4. Apply progressive adaptation
const adaptedQuestions = await ProgressiveSurveyAdapter.getProgressiveQuestions(
  familyData,
  questions,
  weekNumber
);
```

### Phase 2: Response Collection
```javascript
// 1. Store responses locally (for recovery)
localStorage.setItem(`surveyInProgress_${userId}`, JSON.stringify({
  responses,
  timestamp,
  questionIndex
}));

// 2. Save to Firestore
await db.collection('surveyResponses').add({
  familyId,
  userId,
  responses,
  completedAt: serverTimestamp()
});

// 3. Track question feedback
await QuestionFeedbackService.recordFeedback({
  questionId,
  feedbackType: 'not_applicable',
  familyId,
  userId
});
```

### Phase 3: Analysis & Learning
```javascript
// 1. Analyze imbalances
const imbalances = analyzeTaskImbalances(
  surveyResponses,
  fullQuestionSet,
  familyPriorities
);

// 2. Learn from feedback
const patterns = await SurveyFeedbackLearningService.analyzeFeedbackPatterns(familyId);

// 3. Update question effectiveness
const effectiveness = await QuestionEffectivenessAnalyzer.analyzeEffectiveness(
  surveyId,
  familyId
);
```

### Phase 4: Knowledge Graph Integration
```javascript
// 1. Create survey entity
const surveyNode = await familyKnowledgeGraph.addNode(familyId, {
  type: 'survey',
  subtype: surveyType,
  metadata: { responses, insights }
});

// 2. Link to respondent
await familyKnowledgeGraph.addEdge(familyId, {
  from: respondentId,
  to: surveyNode.id,
  type: 'completed_survey'
});

// 3. Extract insights
const insights = await extractSurveyInsights(responses);
await createInsightNodes(familyId, insights, surveyNode.id);
```

## 🧠 How New Surveys Build from Old Surveys

### 1. **Question Effectiveness Tracking**
- Each question gets an effectiveness score based on:
  - Completion rate
  - Feedback (applicable vs not applicable)
  - Behavior change correlation
  - Task redistribution impact

### 2. **Feedback Loop Integration**
```javascript
// System learns which questions work for each family
const familyPatterns = {
  excludedCategories: ['pet_care'], // Family has no pets
  excludedTopics: ['commute'],      // Work from home family
  preferredQuestionTypes: ['direct', 'specific'],
  ineffectiveQuestions: [questionIds],
  highValueQuestions: [questionIds]
};
```

### 3. **Progressive Difficulty Adjustment**
- **Week 1-3**: Basic awareness questions
- **Week 4-8**: Recognition and planning questions
- **Week 9+**: Implementation and optimization questions

### 4. **Context-Based Evolution**
- **Seasonal**: Holiday questions in December
- **Life Events**: New baby triggers childcare questions
- **Stress Indicators**: Simplified questions during high stress
- **Cultural**: Culturally relevant examples and scenarios

### 5. **Cross-Family Learning**
- Successful question patterns from similar families
- Demographic-based question effectiveness
- Community-validated improvements

## 📊 Survey Configuration

```javascript
// src/config/surveyConfig.js
{
  enableDynamicQuestions: true,
  minQuestionsPerCategory: 18,
  initialSurveyQuestionCount: 72,
  weeklySurveyQuestionCount: 20,
  enableLocationPersonalization: true,
  enableSeasonalPersonalization: true,
  enableCulturalContext: true,
  cacheDynamicQuestions: true,
  cacheDurationHours: 24,
  fallbackToStatic: true
}
```

## 🔌 Integration Points

### 1. **Claude API Integration**
- Model: Opus 4.1 (internal API)
- Endpoint: `/api/claude` via Cloud Run
- Purpose: Generate contextual questions
- Fallback: Static question bank

### 2. **Firebase Firestore**
- Collections:
  - `surveyResponses`: Raw response data
  - `questionFeedback`: User feedback on questions
  - `surveyAnalytics`: Analysis results
  - `familyProgress`: Progression tracking

### 3. **Knowledge Graph**
- Entity Types:
  - `survey`: Survey instances
  - `survey_response`: Individual responses
  - `survey_insight`: Extracted insights
  - `question_effectiveness`: Question performance

### 4. **Local Storage**
- Survey progress caching
- Offline response collection
- Recovery from interruptions

## 🎯 Key Features

### 1. **Personalization Engine**
- Location-based (urban/suburban/rural)
- Season-aware (summer/winter activities)
- Family structure (single/dual parent, # of kids)
- Cultural context (holidays, traditions)
- Age-appropriate (toddler vs teenager questions)

### 2. **Adaptive Learning**
- Excludes irrelevant categories automatically
- Learns family-specific patterns
- Adjusts question frequency
- Evolves complexity over time

### 3. **Multi-Modal Input**
- Adult surveys (detailed, analytical)
- Child surveys (simple, fun)
- Quick check-ins (5-minute versions)
- Deep assessments (comprehensive)

### 4. **Intelligent Analysis**
- Imbalance detection algorithms
- Trend analysis over time
- Correlation with behavior changes
- Predictive insights

## 📈 Metrics & Analytics

### Survey Metrics
- Completion rates by family member
- Average time to complete
- Question skip rates
- Feedback sentiment

### Family Progress Metrics
- Balance improvement over time
- Task redistribution success
- Relationship satisfaction trends
- Behavioral change indicators

### System Performance
- Question generation latency
- Cache hit rates
- API success rates
- Response storage reliability

## 🚀 Future Enhancements

### Planned Features
1. **Voice-based surveys** for accessibility
2. **Visual surveys** with image-based questions
3. **Micro-surveys** (single question check-ins)
4. **Peer comparison** (anonymous family benchmarks)
5. **Predictive questioning** (anticipate needed questions)

### ML/AI Improvements
1. **GPT-4 integration** for more nuanced questions
2. **Sentiment analysis** on open-ended responses
3. **Clustering algorithms** for family grouping
4. **Reinforcement learning** for question optimization

## 🔧 Maintenance & Operations

### Daily Operations
- Cache refresh every 24 hours
- Question effectiveness recalculation
- Feedback pattern analysis

### Weekly Operations
- Family progress assessment
- Survey adaptation tuning
- Cross-family learning updates

### Monthly Operations
- System performance review
- Question bank expansion
- Algorithm refinement

## 📝 Summary

The Allie Survey System represents a sophisticated, AI-driven approach to understanding and improving family dynamics. By combining:
- Dynamic question generation
- Contextual adaptation
- Progressive difficulty
- Continuous learning
- Knowledge graph integration

The system creates a personalized, evolving survey experience that grows with each family while building a comprehensive understanding of household dynamics and driving positive behavioral change.

---
*Last Updated: 2025-09-19*
*Version: 1.0*