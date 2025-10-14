# Survey Data Flow Map - Complete Integration Plan

## Overview
This document maps how survey response data flows through the system to all visualization and analysis components.

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Survey Responses                          │
│  Format: { questionId: { answer, weight, category... }}     │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│              Survey Response Storage                         │
│  /surveyResponses/{familyId}_{memberId}_{type}_{timestamp}  │
│  - Atomic saves with checkpoints                            │
│  - Includes totalWeight for each response                   │
└───────────────┬─────────────────────────────────────────────┘
                │
                ├─────────────────┬─────────────────┬─────────────────┐
                ▼                 ▼                 ▼                 ▼
         [Category Scores]  [ELO Ratings]   [Subcategories]   [Habits]

```

## Component Integration Points

### 1. **FourCategoryRadar** (Main Balance Visualization)
**Location**: `/src/components/dashboard/FourCategoryRadar.jsx`
**Data Needs**:
- Category scores (Visible/Invisible × Household/Parental)
- Subcategory breakdowns (24 total subcategories)
- Response counts by category

**Current Data Source**:
```javascript
// From FamilyContext
const scores = calculateBalanceScores(fullQuestionSet, responses, priorities);
```

**New Data Source**:
```javascript
// From surveyResponses collection
const surveyDoc = await getDoc(doc(db, 'surveyResponses', surveyId));
const responses = surveyDoc.data().responses;
const scores = calculateBalanceScores(questions, responses, priorities);
```

### 2. **ProjectedBalanceRadar** (Forecast Chart)
**Location**: `/src/components/survey/ProjectedBalanceRadar.jsx`
**Data Needs**:
- Current responses (in-progress survey)
- Projected scores if all questions answered same way
- Category breakdowns

**Integration**:
- Reads from `currentSurveyResponses` in SurveyContext
- Will read from checkpoint data in new system

### 3. **ELORatingsDisplay** (Balance Tracking)
**Location**: `/src/components/dashboard/ELORatingsDisplay.jsx`
**Data Needs**:
- Current ELO ratings
- Match history with task weights
- Weight statistics

**Current Flow**:
```javascript
Survey Response → ELORatingService.processSurveyResponse() → familyELOHistory
```

**New Integration**:
```javascript
// In SurveyResponseManager.completeSurvey()
await ELORatingService.processSurveyResponses(
  this.familyId,
  this.responses, // includes totalWeight
  this.surveyType
);
```

### 4. **ImbalanceHabitGenerator** (Habit Recommendations)
**Location**: `/src/utils/ImbalanceHabitGenerator.js`
**Data Needs**:
- Category imbalance scores
- Subcategory analysis
- Task weight data

**Current Source**:
```javascript
const recommendations = generateHabitRecommendations(
  categoryScores,
  subcategoryAnalysis,
  familyContext
);
```

**New Integration**:
- Reads from surveyAggregates collection
- Uses subcategory data from responses

### 5. **EnhancedHabitsSection** (Habit Display)
**Location**: `/src/components/dashboard/EnhancedHabitsSection.jsx`
**Data Needs**:
- Habit recommendations based on survey data
- Progress tracking
- Category balance scores

### 6. **SurveyStatusChecker** (Progress Tracking)
**Location**: `/src/components/dashboard/SurveyStatusChecker.jsx`
**Data Needs**:
- Response counts per member
- Completion status
- Last activity timestamps

**New Source**:
```javascript
// From surveyAggregates collection
const aggregateDoc = await getDoc(
  doc(db, 'surveyAggregates', `${surveyType}_${familyId}`)
);
const memberStatus = aggregateDoc.data().memberStatus;
```

### 7. **SubCategoryAnalyzer** (Detailed Analysis)
**Location**: `/src/services/SubCategoryAnalyzer.js`
**Data Needs**:
- Individual question responses
- Subcategory mappings
- Weight calculations

**Integration**:
```javascript
const subcategoryData = SubCategoryAnalyzer.analyzeResponses(
  responses, // from surveyResponses doc
  questions
);
```

## Key Data Transformations

### 1. Response Format Standardization
```javascript
// Old format variations:
'Mama' | 'Papa' | 'Draw' | 'Both' | 'Neither'

// New standardized format:
'Mama' | 'Papa' | 'Both'
```

### 2. Weight Inclusion
```javascript
// Old response:
{ [questionId]: 'Mama' }

// New response with weight:
{
  [questionId]: {
    answer: 'Mama',
    questionText: '...',
    category: 'Invisible Parental Tasks',
    subcategory: 'worrying',
    weight: 4,
    totalWeight: 13.42,
    answeredAt: Timestamp
  }
}
```

### 3. Category Score Calculation
```javascript
// calculateBalanceScores needs to handle new format
export const calculateBalanceScores = (questions, responses, priorities) => {
  // Extract answer from response object
  const answer = typeof response === 'object' ? response.answer : response;
  const weight = typeof response === 'object' ? response.totalWeight : 
    calculateTaskWeight(question, priorities);
  
  // Apply weighted scoring
  if (answer === 'Mama') {
    categories[category].mama += weight;
  } else if (answer === 'Papa') {
    categories[category].papa += weight;
  } else if (answer === 'Both') {
    categories[category].mama += weight * 0.5;
    categories[category].papa += weight * 0.5;
  }
};
```

## Migration Requirements

### 1. Update calculateBalanceScores
- Handle both old string responses and new object responses
- Use totalWeight when available

### 2. Update FourCategoryRadar
- Read from new surveyResponses structure
- Handle subcategory data from responses

### 3. Update ELO Integration
- Process responses with embedded weights
- Store weight data in match history

### 4. Update Habit Generation
- Use weighted imbalance scores
- Consider subcategory imbalances

## Benefits of New System

1. **Atomic Operations**: No partial data states
2. **Weight Preservation**: Total weight stored with each response
3. **Better Analytics**: Aggregates pre-calculated
4. **Reliable Resume**: Checkpoint system ensures consistency
5. **Subcategory Tracking**: All 24 subcategories properly tracked

## Implementation Order

1. **Phase 1**: Core survey system (SurveyResponseManager, Resume Service)
2. **Phase 2**: Update calculateBalanceScores to handle new format
3. **Phase 3**: Update visualization components (FourCategoryRadar, ELO)
4. **Phase 4**: Update habit generation system
5. **Phase 5**: Migration of existing data

This ensures all dashboards, charts, and analysis tools continue working with the new survey system.