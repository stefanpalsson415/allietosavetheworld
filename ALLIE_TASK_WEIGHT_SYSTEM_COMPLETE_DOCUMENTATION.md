# Allie Task Weight System - Complete Technical Documentation

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [The 7-Factor Task Weighting System](#the-7-factor-task-weighting-system)
4. [Research Foundation](#research-foundation)
5. [ELO Rating Integration](#elo-rating-integration)
6. [Implementation Details](#implementation-details)
7. [Data Flow](#data-flow)
8. [UI/UX Components](#uiux-components)
9. [Future Enhancement Opportunities](#future-enhancement-opportunities)

---

## Executive Summary

The Allie Task Weight System is a scientifically-grounded approach to measuring and balancing household labor distribution. It combines:
- **7 research-backed factors** that determine task burden
- **ELO rating system** adapted from chess for dynamic balance tracking
- **Peer-reviewed research** linking task types to relationship satisfaction
- **Real-time weight adjustments** that make invisible labor visible

### Key Innovation
Unlike simple task counters or time trackers, Allie quantifies the *true burden* of household tasks by considering frequency, invisibility, emotional toll, and research-proven relationship impacts.

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Survey Questions                         │
│  (80 initial questions with task attributes)                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│               Task Weight Calculator                         │
│  Input: Task attributes + Family priorities                  │
│  Process: 7-factor multiplication                            │
│  Output: Weight (1.9 - 14.2 range)                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  ELO Rating Service                          │
│  Input: Survey response + Task weight                        │
│  Process: Weight-adjusted K-factor calculation               │
│  Output: Updated ratings + match history                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 Balance Visualization                        │
│  • ELO ratings display with weight impact                    │
│  • Weighted load distribution                                │
│  • Research transparency                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## The 7-Factor Task Weighting System

### Formula
```
TaskWeight = BaseTime × Frequency × Invisibility × EmotionalLabor × ResearchImpact × ChildDevelopment × Priority
```

### Factor 1: Time-Based Weighting (Base Weight)
**Range**: 1-5
**Implementation**: `baseWeight` property on each question
**Details**:
- 1 = Quick task (< 5 minutes)
- 2 = Short task (5-15 minutes)
- 3 = Medium task (15-30 minutes)
- 4 = Substantial task (30-60 minutes)
- 5 = Major task (> 60 minutes)

**Note**: Currently combines direct time + mental load. Future enhancement could separate these.

### Factor 2: Frequency Factor
**Implementation**: `FREQUENCY_MULTIPLIERS`
```javascript
'daily': 1.5,        // Every day
'several': 1.3,      // Several times weekly
'weekly': 1.2,       // Once a week
'monthly': 1.0,      // Once a month
'quarterly': 0.8     // Every few months
```
**Rationale**: Daily tasks create more cumulative burden than occasional tasks

### Factor 3: Invisibility Multiplier
**Implementation**: `INVISIBILITY_MULTIPLIERS`
```javascript
'highly': 1.0,       // Highly visible (everyone notices)
'partially': 1.2,    // Partially visible
'mostly': 1.35,      // Mostly invisible
'completely': 1.5    // Completely invisible
```
**Research Basis**: Invisible work creates additional stress because it goes unrecognized (DeGroot & Vik, 2020)

### Factor 4: Emotional Labor Index
**Implementation**: `EMOTIONAL_LABOR_MULTIPLIERS`
```javascript
'minimal': 1.0,      // Little emotional investment
'low': 1.1,          // Some emotional energy
'moderate': 1.2,     // Moderate emotional toll
'high': 1.3,         // High emotional burden
'extreme': 1.4       // Extreme emotional labor
```
**Examples**: 
- Minimal: Taking out trash
- Extreme: Managing family conflicts, emotional support during crises

### Factor 5: Research-Backed Impact
**Implementation**: `RESEARCH_IMPACT_MULTIPLIERS` + `ResearchBackedTaskImpact.js`
```javascript
'high': 1.3,         // Tasks proven to cause most relationship strain
'medium': 1.15,      // Moderate relationship impact
'standard': 1.0      // Lower conflict potential
```

**Research Mapping**:
- **High Impact**: Daily cooking, cleaning, laundry, mental load planning
  - Carlson et al. (2020): "Routine housework at center of gender inequality"
  - 59% of women do more chores vs. 6% of men
- **Medium Impact**: Grocery planning, appointment scheduling, seasonal tasks
  - Sullivan (1997): Women's time more frequently interrupted
- **Standard Impact**: Car maintenance, yard work, major purchases
  - Gallup: These tasks show more equal distribution

### Factor 6: Child Development Impact
**Implementation**: `CHILD_DEVELOPMENT_MULTIPLIERS`
```javascript
'high': 1.25,        // Significantly shapes children's attitudes
'moderate': 1.15,    // Some modeling impact
'limited': 1.0       // Minimal developmental influence
```
**Research**: Children's future attitudes about gender roles are shaped by observed task distribution

### Factor 7: Priority-Based Personalization
**Implementation**: `PRIORITY_MULTIPLIERS`
```javascript
'highest': 1.5,      // Family's top priority category
'secondary': 1.3,    // Second priority
'tertiary': 1.1,     // Third priority
'none': 1.0          // Not prioritized
```
**Categories**: 
- Visible Household Tasks
- Invisible Household Tasks
- Visible Parental Tasks
- Invisible Parental Tasks

---

## Research Foundation

### Academic Studies Database
Located in: `src/data/ResearchBackedTaskImpact.js`

#### Key Citations:
1. **Carlson, D.L., Petts, R.J., & Pepin, J.R. (2020)**
   - Finding: Routine housework is most contested in couples
   - Impact: Justifies 1.3x multiplier for daily tasks

2. **Daminger, A. (2019)** - American Sociological Review
   - Finding: Women complete more cognitive labor in 81% of couples
   - Impact: Mental load tasks get high impact rating

3. **Pew Research Center (2020)**
   - Finding: Only 38% of women satisfied with chore division
   - Quantifies the problem we're solving

4. **Bright Horizons (2017)** - Modern Family Index
   - Finding: 90% of mothers solely responsible for family schedules
   - 72% of working moms experience scheduling burnout

5. **DeGroot, J.M. & Vik, T.A. (2020)**
   - Finding: Mental labor is "exhausting, frustrating, energy-consuming"
   - Validates invisibility multiplier

### Quantitative Metrics
```javascript
relationshipSatisfactionCorrelations: {
  partnerSatisfaction: 0.56,  // r = .56 (p < .001)
  feelingsOfEquity: 0.31,     // r = .31 (p < .001)
  communicationQuality: 0.53   // r = .53 (p < .001)
}
```

### Task Category Research Mapping
**High Impact Categories** (1.3x):
- Daily Cooking and Meal Preparation
- Daily Cleaning and Tidying
- Laundry and Clothing Management
- Mental Load - Planning and Organizing
- Daily Childcare Routines

**Medium Impact Categories** (1.15x):
- Grocery Shopping and Meal Planning
- Appointment Scheduling
- Deep Cleaning and Organizing
- Gift Planning and Holidays

**Standard Impact Categories** (1.0x):
- Car Maintenance
- Yard Work
- Home Repairs
- Major Financial Planning

---

## ELO Rating Integration

### Core Innovation
Task weights directly influence ELO rating changes through K-factor adjustment:

```javascript
// Weight multiplier calculation (capped for stability)
const AVERAGE_WEIGHT = 5;
const weightMultiplier = Math.min(2.5, Math.max(0.4, taskWeight / AVERAGE_WEIGHT));

// Apply to K-factor
const kFactorA = this.K_FACTOR * (uncertaintyA / 100) * weightMultiplier;
const kFactorB = this.K_FACTOR * (uncertaintyB / 100) * weightMultiplier;
```

### Impact Examples:
- **Light task** (weight 2.5): 0.5x rating change
- **Average task** (weight 5.0): 1.0x rating change  
- **Heavy task** (weight 10.0): 2.0x rating change
- **Maximum task** (weight 14.2): 2.5x rating change (capped)

### Match History Storage
Each match records:
```javascript
{
  questionId: string,
  taskType: string,
  response: 'Mama' | 'Papa' | 'Both',
  questionWeight: number,
  weightMultiplier: number,
  categoryRatings: { before, after, changes },
  taskRatings: { before, after, changes },
  impactScore: { Mama: number, Papa: number }
}
```

### Analytics Methods
- `getRecentMatchHistory()`: Retrieves matches with weight data
- `getWeightStatistics()`: Calculates weighted load distribution
- `getFilteredSurveyResponses()`: Role-based filtering (parents/kids/all)

---

## Implementation Details

### File Structure
```
src/
├── utils/
│   └── TaskWeightCalculator.js         # Core weight calculation
├── services/
│   └── ELORatingService.js            # ELO with weight integration
├── data/
│   └── ResearchBackedTaskImpact.js    # Research database
├── components/
│   └── dashboard/
│       ├── ELORatingsDisplay.jsx      # Weight-aware UI
│       ├── TaskWeightBadge.jsx        # Weight visualization
│       └── ResearchBasisDisplay.jsx   # Research transparency
└── contexts/
    └── FamilyContext.js               # Exposes weight methods
```

### Key Functions

#### TaskWeightCalculator.js
```javascript
export const calculateTaskWeight = (question, familyPriorities) => {
  // 1. Extract base weight (time component)
  // 2. Apply frequency multiplier
  // 3. Apply invisibility multiplier
  // 4. Apply emotional labor multiplier
  // 5. Determine research impact (auto or manual)
  // 6. Apply child development multiplier
  // 7. Apply family priority boost
  // Return: final weight (typically 1.9 - 14.2)
}
```

#### ELORatingService.js
```javascript
calculateELO(ratingA, ratingB, result, uncertaintyA, uncertaintyB, taskWeight) {
  // 1. Calculate expected scores
  // 2. Apply weight multiplier to K-factor
  // 3. Calculate new ratings
  // 4. Return ratings + weight data
}
```

### Weight Ranges
- **Minimum**: ~1.9 (quarterly, visible, minimal impact task)
- **Average**: ~5.0 (weekly, partially visible, moderate impact)
- **Maximum**: ~14.2 (daily, invisible, high emotional labor, high impact)

---

## Data Flow

### 1. Survey Generation
```javascript
// SurveyContext.js
questions = [{
  id: 'q1',
  text: 'Who typically plans weekly meals?',
  category: 'Invisible Household Tasks',
  baseWeight: 4,
  frequency: 'weekly',
  invisibility: 'mostly',
  emotionalLabor: 'moderate',
  researchImpact: 'high',    // Or auto-determined
  childDevelopment: 'moderate',
  // Calculated: totalWeight: 13.42
}]
```

### 2. User Response
```javascript
// SurveyScreen.jsx → FamilyContext.js
completeInitialSurvey(memberId, {
  'q1': 'Mama',
  'q2': 'Papa',
  // ...
})
```

### 3. ELO Update
```javascript
// FamilyContext → ELORatingService
updateRatingsForResponse(familyId, questionId, response, questionData) {
  // Extract weight: questionData.totalWeight
  // Calculate ELO with weight
  // Store in match history
  // Update ratings
}
```

### 4. Visualization
```javascript
// ELORatingsDisplay.jsx
- Shows total weighted load per parent
- Displays high-weight task wins
- Recent match history with weight impact
- Research basis for calculations
```

---

## UI/UX Components

### 1. TaskWeightBadge
**Purpose**: Visual indicator of task weight
**Features**:
- Color coding (green/yellow/red)
- Hover for weight breakdown
- Feedback button for weight accuracy

### 2. ELORatingsDisplay
**Enhanced with**:
- Task Weight Impact section
- Weighted load totals (points not just counts)
- High-impact task tracking
- Weight multiplier indicators

### 3. ResearchBasisDisplay
**Shows**:
- Which studies support the weight
- Key statistics
- Why certain tasks weighted higher
- Expandable research details

### 4. Survey Questions
**Could enhance with**:
- Weight preview during survey
- "Why this matters" research tooltips
- Real-time impact visualization

---

## Future Enhancement Opportunities

### 1. Separate Mental Load Component
Currently `baseWeight` combines time + mental load. Could split:
```javascript
baseTimeInvestment: 3,
ongoingMentalLoad: 2,
// Total base: 5
```

### 2. Seasonal Adjustments
Some tasks vary by season:
```javascript
seasonalMultiplier: {
  'yard work': { summer: 1.3, winter: 0.7 },
  'holiday planning': { december: 1.5, june: 0.8 }
}
```

### 3. Family Size Scaling
Larger families = higher burden:
```javascript
familySizeMultiplier = 1 + (0.1 * (numChildren - 1))
```

### 4. Cultural Adaptations
Different cultures prioritize different tasks:
```javascript
culturalPriorities: {
  'extended family coordination': { 
    'collectivist': 1.3, 
    'individualist': 1.0 
  }
}
```

### 5. Learning System
Track prediction accuracy:
- Compare weights to actual time/stress reports
- Adjust multipliers based on family feedback
- Personalized weight learning

### 6. Burden Forecasting
Predict future imbalance:
```javascript
if (currentTrajectory.continue(90days)) {
  mamaELO: 1750,  // +250 overload
  papaELO: 1250,  // -250 underload
  riskLevel: 'high'
}
```

### 7. Integration Points
- Calendar: Weight tasks by deadline proximity
- Chore system: Use weights for fair distribution
- Rewards: Weight-based buck calculations

---

## Critical Implementation Notes

### 1. Weight Capping
Multipliers capped at 2.5x to prevent extreme rating swings:
```javascript
const weightMultiplier = Math.min(2.5, Math.max(0.4, taskWeight / AVERAGE_WEIGHT));
```

### 2. No Historical Recalculation
Existing ELO ratings preserved; weights apply going forward only.

### 3. Research Automation
If `researchImpact` not provided, system auto-determines from task description:
```javascript
const impactLevel = getTaskImpactLevel(question.text, question.category);
```

### 4. Transparency First
Users can always see:
- How weights are calculated
- Which research supports weights  
- Why their tasks matter

---

## Performance Considerations

### Caching
- Question weights calculated once during survey generation
- Research mappings loaded once at startup
- Weight statistics cached and refreshed periodically

### Firestore Indexes
Required for efficient queries:
```
familyELOHistory: familyId, timestamp (DESC)
```

### Bundle Size
- ResearchBackedTaskImpact.js: ~15KB
- Consider lazy loading for research display components

---

## Success Metrics

### System Accuracy
- Weight predictions vs. actual reported burden
- User feedback on weight accuracy
- Correlation with relationship satisfaction

### User Engagement  
- % users viewing research basis
- Feedback submissions on weights
- Task redistribution success rate

### Technical Performance
- Weight calculation time < 10ms
- ELO update time < 100ms
- UI render time < 16ms

---

## Conclusion

The Allie Task Weight System represents a significant innovation in household labor quantification. By combining:
- Comprehensive factor analysis
- Peer-reviewed research backing
- Dynamic ELO integration
- Transparent methodology

We've created a system that makes invisible labor visible, validates lived experiences with data, and provides actionable insights for family balance. The architecture is extensible, scientifically grounded, and user-centered.

This documentation serves as the definitive reference for understanding, maintaining, and extending the Allie task weighting system.