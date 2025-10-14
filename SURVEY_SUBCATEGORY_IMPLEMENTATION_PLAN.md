# Survey Sub-Category Implementation Plan

## Overview
This plan ensures the 24 sub-categories (6 per main category) are fully integrated throughout the app, enabling granular habit recommendations based on specific task imbalances.

## Current State
- ✅ 72 initial survey questions, 20 cycle questions
- ✅ 4 main categories defined
- ✅ 24 sub-categories defined in FourCategoryRadar.jsx
- ❌ Survey questions not mapped to sub-categories
- ❌ Sub-category data is mocked, not real
- ❌ Habits target categories, not sub-categories
- ❌ Allie doesn't use sub-category data

## Implementation Steps

### Phase 1: Update Survey Question Generation

#### 1.1 Modify AIQuestionGenerator.js
```javascript
// Add subcategory mapping to generated questions
const SUB_CATEGORY_DISTRIBUTION = {
  "Invisible Parental Tasks": {
    subcategories: [
      { id: 'worrying', label: 'Worrying About Kids', questionCount: 3 },
      { id: 'planning_ahead', label: 'Planning Kids\' Schedules', questionCount: 3 },
      { id: 'remembering', label: 'Remembering Everything', questionCount: 3 },
      { id: 'emotional_support', label: 'Emotional Support', questionCount: 3 },
      { id: 'anticipating', label: 'Anticipating Needs', questionCount: 3 },
      { id: 'mediating', label: 'Mediating Conflicts', questionCount: 3 }
    ]
  },
  // ... other categories
};

// Ensure each subcategory gets coverage in the 72 questions
// 72 questions / 24 subcategories = 3 questions per subcategory
```

#### 1.2 Update Question Structure
```javascript
{
  "id": "q1",
  "text": "Who tracks when the children need new clothes as they grow?",
  "category": "Invisible Parental Tasks",
  "subcategory": "anticipating", // NEW FIELD
  "subcategoryLabel": "Anticipating Needs", // NEW FIELD
  // ... rest of question fields
}
```

### Phase 2: Store Sub-Category Responses

#### 2.1 Update Survey Response Structure
```javascript
// Current structure (category level only):
surveyResponses: {
  "q1": "Mama",
  "q2": "Papa",
  // ...
}

// New structure (includes subcategory data):
surveyResponses: {
  questions: {
    "q1": {
      answer: "Mama",
      category: "Invisible Parental Tasks",
      subcategory: "anticipating"
    },
    // ...
  },
  subcategoryAnalysis: {
    "Invisible Parental Tasks": {
      "worrying": { mama: 2, papa: 1, total: 3 },
      "planning_ahead": { mama: 3, papa: 0, total: 3 },
      // ... other subcategories
    },
    // ... other categories
  }
}
```

### Phase 3: Update Analysis Functions

#### 3.1 Create SubCategoryAnalyzer.js
```javascript
export class SubCategoryAnalyzer {
  static analyzeSubCategories(surveyResponses) {
    const analysis = {};
    
    // Initialize all 24 subcategories
    Object.entries(SUB_CATEGORY_DEFINITIONS).forEach(([category, data]) => {
      analysis[category] = {};
      data.subcategories.forEach(sub => {
        analysis[category][sub.id] = {
          mama: 0,
          papa: 0,
          total: 0,
          imbalancePercent: 0
        };
      });
    });
    
    // Count responses by subcategory
    // Calculate imbalance percentages
    // Return detailed analysis
    
    return analysis;
  }
  
  static getMostImbalancedSubcategory(analysis) {
    // Find the subcategory with highest imbalance
    // Return category, subcategory, and imbalance data
  }
}
```

### Phase 4: Update Habit Generation

#### 4.1 Enhance ImbalanceHabitGenerator.js
```javascript
// Add subcategory-specific habit templates
const SUB_CATEGORY_HABIT_TEMPLATES = {
  "Invisible Parental Tasks": {
    "worrying": [
      {
        title: "Weekly Worry Check-In",
        description: "Share concerns about kids' wellbeing together",
        cue: "Sunday evening after kids are in bed",
        action: "Spend 15 minutes discussing any worries about the children",
        // ...
      }
    ],
    "planning_ahead": [
      {
        title: "Shared Calendar Planning",
        description: "Plan kids' schedules together for the week",
        // ...
      }
    ],
    // ... other subcategories
  },
  // ... other categories
};

export const generateHabitForSubCategory = (category, subcategory, imbalanceData) => {
  // Generate habit specifically for the subcategory imbalance
};
```

### Phase 5: Update Allie Integration

#### 5.1 Enhance AllieAIService.js
```javascript
async getFamilyContext(familyId) {
  // ... existing code ...
  
  // Add subcategory analysis
  const subcategoryAnalysis = await this.getSubCategoryAnalysis(familyId);
  
  return {
    // ... existing fields ...
    subcategoryAnalysis,
    mostImbalancedSubcategory: subcategoryAnalysis.mostImbalanced,
    subcategoryInsights: this.generateSubCategoryInsights(subcategoryAnalysis)
  };
}

generatePersonalizedTasks(familyContext) {
  // Use subcategory data for more targeted tasks
  const { mostImbalancedSubcategory } = familyContext;
  
  // Generate tasks that specifically address subcategory imbalances
}
```

### Phase 6: Update UI Components

#### 6.1 Update FourCategoryRadar.jsx
```javascript
// Replace mock data with real subcategory analysis
const subRadarData = useMemo(() => {
  if (!selectedCategory || !surveyData) return { mama: [], papa: [] };
  
  // Use real subcategory data from survey responses
  const subcategoryData = surveyData.subcategoryAnalysis?.[selectedCategory.id] || {};
  
  // ... process real data instead of Math.random()
}, [selectedCategory, surveyData]);
```

### Phase 7: Migration and Testing

#### 7.1 Create Migration Script
```javascript
// Script to analyze existing survey responses and populate subcategory data
async function migrateSurveyResponses() {
  // For each family's survey responses:
  // 1. Map questions to subcategories
  // 2. Calculate subcategory analysis
  // 3. Update response structure
}
```

#### 7.2 Testing Plan
1. Verify 72 questions cover all 24 subcategories (3 each)
2. Test subcategory analysis calculations
3. Verify habit recommendations target specific subcategories
4. Test Allie's use of subcategory data
5. Verify UI shows real subcategory data

## Benefits

1. **More Targeted Habits**: Instead of "balance invisible parental tasks", recommend "share worry check-ins" or "alternate remembering school events"

2. **Better Insights**: "You handle 90% of remembering everything, but planning is well-balanced"

3. **Progress Tracking**: See improvement at subcategory level

4. **Personalized Priority**: Focus on the specific subcategories causing most stress

## Timeline

- Phase 1-2: 2 days (Question generation and storage)
- Phase 3-4: 2 days (Analysis and habit generation)
- Phase 5: 1 day (Allie integration)
- Phase 6: 1 day (UI updates)
- Phase 7: 2 days (Migration and testing)

Total: ~8 days of development