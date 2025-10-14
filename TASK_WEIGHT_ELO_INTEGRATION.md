# Task Weight and ELO Integration Documentation

## Current State Analysis

### 1. Task Weight Calculation System

#### Location: `src/utils/TaskWeightCalculator.js`

**Current Implementation:**
```javascript
export const calculateTaskWeight = (taskAttributes, familyPriorities) => {
  const {
    baseWeight = 3,
    frequency = "weekly",
    invisibility = "visible",
    emotionalLabor = "low",
    researchImpact = "minimal",
    childDevelopment = "none",
    relationshipImpact = "low",
    category
  } = taskAttributes;

  let weight = baseWeight;

  // Frequency multipliers
  const frequencyMultipliers = {
    daily: 1.5,
    "multiple_daily": 1.7,
    weekly: 1.0,
    biweekly: 0.9,
    monthly: 0.85,
    quarterly: 0.8
  };

  // Invisibility multipliers
  const invisibilityMultipliers = {
    visible: 1.0,
    "somewhat_visible": 1.1,
    mostly: 1.3,
    completely: 1.5
  };

  // Other multipliers...
  // Total weight = base * all multipliers
}
```

**Weight Ranges:** Tasks can have weights from ~1.9 (light, visible, quarterly) to ~14.2 (heavy, invisible, multiple daily with high impact)

### 2. ELO Rating System

#### Location: `src/services/ELORatingService.js`

**Current ELO Calculation:**
```javascript
async updateRatingsForResponse(familyId, questionId, response, questionData) {
  // ... rating retrieval ...
  
  // Standard ELO calculation
  const kFactor = 32;
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedB = 1 - expectedA;
  
  const result = response === 'Mama' ? 1 : 0;
  
  // CURRENT: Weight is NOT used here
  const newRatingA = ratingA + kFactor * (result - expectedA);
  const newRatingB = ratingB + kFactor * ((1 - result) - expectedB);
  
  // Weight IS stored in history but NOT used
  await this.addMatchToHistory(familyId, {
    questionId,
    questionText: questionData?.text || questionId,
    weight: questionData?.totalWeight || 1,  // <-- Stored but ignored!
    // ...
  });
}
```

### 3. Data Flow

1. **Survey Generation** (`SurveyContext.js`):
   - Questions are created with calculated weights
   - Each question includes `totalWeight` property

2. **Survey Response** (`SurveyScreen.jsx`):
   - When user answers, full question data (including weight) is passed
   - `completeInitialSurvey` → `updateELORatings` → `updateRatingsForResponse`

3. **ELO Update**:
   - Weight arrives at ELO service
   - Weight is stored in match history
   - **Weight is ignored in actual calculation**

### 4. Current Database Structure

**Match History Document:**
```javascript
{
  timestamp: Date,
  questionId: string,
  questionText: string,
  weight: number,        // <-- Stored here
  response: 'Mama' | 'Papa',
  ratingsBefore: { mama: number, papa: number },
  ratingsAfter: { mama: number, papa: number },
  ratingChanges: { mama: number, papa: number }
}
```

## Implementation Plan

### Phase 1: Core ELO Weight Integration

#### 1.1 Update ELO Calculation Method
```javascript
// Option A: Weight-adjusted K-factor
const baseKFactor = 32;
const averageWeight = 5; // Approximate average task weight
const weightMultiplier = (questionData?.totalWeight || averageWeight) / averageWeight;
const adjustedKFactor = baseKFactor * weightMultiplier;

// Option B: Weight-adjusted result (more nuanced)
const weightedResult = result * weightMultiplier;

// Option C: Hybrid approach (recommended)
// - Use weight to adjust K-factor
// - Cap the adjustment to prevent extreme swings
const weightMultiplier = Math.min(2.5, Math.max(0.4, weight / averageWeight));
const adjustedKFactor = baseKFactor * weightMultiplier;
```

#### 1.2 Add Weight Analytics
- Track average weight per category
- Monitor weight distribution in responses
- Calculate "weighted win rate" vs "raw win rate"

### Phase 2: UI Enhancements

#### 2.1 ELO Display Updates
- Show weight influence on recent changes
- Add "Impact Score" = ELO change × task weight
- Display cumulative weighted load

#### 2.2 Match History Enhancement
- Show task weight in match history
- Highlight high-weight victories/losses
- Add filtering by weight ranges

### Phase 3: Advanced Features

#### 3.1 Dynamic K-Factor Adjustment
- Adjust K-factor based on:
  - Task weight
  - Rating difference
  - Response consistency

#### 3.2 Weight-Based Recommendations
- Prioritize high-weight task redistribution
- Focus on invisible/emotional labor balance

## Technical Changes Required

### 1. `ELORatingService.js` - Core Changes
```javascript
// Line ~206: Update the calculation
const questionWeight = parseFloat(questionData?.totalWeight || '5');
const averageWeight = 5; // Could be dynamic based on family data
const weightMultiplier = Math.min(2.5, Math.max(0.4, questionWeight / averageWeight));

// Adjust K-factor based on task weight
const baseKFactor = 32;
const kFactorA = this.calculateKFactor(ratingA) * weightMultiplier;
const kFactorB = this.calculateKFactor(ratingB) * weightMultiplier;
```

### 2. `ELORatingsDisplay.jsx` - UI Updates
- Add weight indicator to recent changes
- Show "Impact Score" for each change
- Display total weighted load distribution

### 3. `DatabaseService.js` - Analytics
- Add method to calculate average weights
- Track weight distribution statistics

### 4. Migration Considerations
- Existing ELO ratings were calculated without weights
- Options:
  1. Keep existing ratings (simplest)
  2. Recalculate historical ratings (most accurate)
  3. Apply adjustment factor going forward

## Success Metrics

1. **Immediate**:
   - High-weight tasks create larger ELO swings
   - Weight influence visible in UI
   - No performance degradation

2. **Long-term**:
   - Better reflection of actual workload
   - Improved task redistribution recommendations
   - Higher user satisfaction with fairness metrics

## Risk Mitigation

1. **Extreme Swings**: Cap weight multiplier at 2.5x
2. **Rating Inflation**: Monitor average ratings over time
3. **User Confusion**: Clear UI explanations of weight impact
4. **Performance**: Ensure weight calculations are cached

## Next Steps

1. Implement Phase 1.1 (Core ELO calculation)
2. Add debugging/logging for weight impact
3. Update UI to show weight influence
4. Test with various weight scenarios
5. Gather user feedback and iterate