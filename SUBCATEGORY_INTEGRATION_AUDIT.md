# Sub-Category Integration Audit

## Summary
This audit identifies disconnects between the 24 sub-categories defined in FourCategoryRadar.jsx and the rest of the system. The sub-categories provide granular detail but are not fully integrated into survey questions, habit recommendations, or task weight calculations.

## Current State

### 1. Sub-Categories Defined (FourCategoryRadar.jsx)

**Invisible Parental Tasks (6 sub-categories):**
- `worrying` - Worrying About Kids
- `planning_ahead` - Planning Kids' Schedules  
- `remembering` - Remembering Everything
- `emotional_support` - Emotional Support
- `anticipating` - Anticipating Needs
- `mediating` - Mediating Conflicts

**Visible Parental Tasks (6 sub-categories):**
- `driving` - Driving to Activities
- `homework` - Homework Help
- `events` - Attending School Events
- `meals` - Making Kids' Meals
- `activities` - Activity Supervision
- `bedtime` - Bedtime Routines

**Invisible Household Tasks (6 sub-categories):**
- `meal_planning` - Meal Planning
- `scheduling` - Managing Schedules
- `research` - Researching Services
- `tracking` - Tracking Household Needs
- `organizing` - Organizing Systems
- `budgeting` - Financial Planning

**Visible Household Tasks (6 sub-categories):**
- `cleaning` - Cleaning
- `laundry` - Laundry
- `groceries` - Grocery Shopping
- `cooking` - Cooking
- `repairs` - Home Repairs
- `yard` - Yard Work

## Identified Disconnects

### 1. Survey Questions Not Mapped to Sub-Categories ❌

**Finding:** Survey questions are generated at the category level only, not sub-category level.

**Evidence:**
- `AIQuestionGenerator.js` generates questions for 4 main categories only
- `surveyConfig.js` only defines 4 categories with examples, not sub-categories
- Questions have `category` field but no `subcategory` field

**Impact:** Cannot analyze imbalances at the granular sub-category level (e.g., who does more "emotional support" vs "anticipating needs")

### 2. Sub-Category Data is Mock/Estimated ⚠️

**Finding:** Sub-category radar charts use estimated/mock data, not real survey responses.

**Evidence (SurveyBalanceRadar.jsx lines 281-292):**
```javascript
let value = surveyData[person]?.subcategories?.[selectedCategory.id]?.[subcat.id] || 
            Math.random() * 100; // Mock data for demo
```

**Impact:** Sub-category visualizations don't reflect actual survey data

### 3. Habit Recommendations Don't Use Sub-Category Analysis ❌

**Finding:** Habits are generated based on category-level imbalances only.

**Evidence:**
- `HabitGenerationService.js` extracts category imbalances but not sub-category
- No sub-category data passed to Claude for habit generation
- `FourCategoryRadar.jsx` creates habits with sub-category info but this is just UI labeling

**Impact:** Missing opportunity to create targeted habits for specific sub-categories with highest imbalances

### 4. Task Weight Calculations Ignore Sub-Categories ❌

**Finding:** Task weights are calculated without sub-category context.

**Evidence:**
- `TaskWeightCalculator.js` only considers main categories
- No sub-category-specific weight multipliers
- Research-backed impact levels don't map to sub-categories

**Impact:** Cannot properly weight tasks like "emotional support" differently from "mediating conflicts"

### 5. No Sub-Category Question Generation ❌

**Finding:** Dynamic question generation doesn't ensure coverage of all sub-categories.

**Evidence:**
- `DynamicSurveyGenerator.js` only ensures 18 questions per main category
- No logic to ensure each sub-category gets questions
- Could end up with all "Invisible Parental" questions about planning, none about emotional support

**Impact:** Survey may miss entire sub-categories, creating blind spots in analysis

## Recommendations

### 1. Add Sub-Category to Question Structure
```javascript
// In question generation
{
  "id": "q1",
  "text": "Who provides emotional support when Lillian is upset?",
  "category": "Invisible Parental Tasks",
  "subcategory": "emotional_support", // NEW
  "subcategoryLabel": "Emotional Support" // NEW
}
```

### 2. Update Survey Generation to Ensure Sub-Category Coverage
- Modify `AIQuestionGenerator.js` to generate at least 3 questions per sub-category
- Pass sub-category definitions to Claude for targeted question generation

### 3. Track Real Sub-Category Data
- Update response processing to aggregate by sub-category
- Store sub-category imbalances in survey results

### 4. Enhance Habit Generation with Sub-Category Focus
- Pass top 3 imbalanced sub-categories to habit generation
- Create habits specifically targeting those sub-categories

### 5. Add Sub-Category Weights
- Define different weight multipliers for each sub-category
- E.g., "emotional_support" could have higher emotional labor multiplier than "mediating"

### 6. Create Sub-Category Insights
- Add analysis showing which specific sub-tasks create most imbalance
- E.g., "90% imbalance in 'Remembering Everything' but only 20% in 'Meal Planning'"

## Implementation Priority

1. **High Priority:** Add subcategory field to questions (enables all other features)
2. **High Priority:** Update survey generation to ensure sub-category coverage
3. **Medium Priority:** Track and store real sub-category data
4. **Medium Priority:** Enhance habit recommendations with sub-category analysis
5. **Low Priority:** Add sub-category-specific weights and insights

## Expected Benefits

- **More Targeted Habits:** Instead of "Share invisible parental tasks", suggest "Partner takes over remembering school events"
- **Better Insights:** See exactly which invisible tasks create imbalance
- **Improved Balance:** Target specific pain points rather than broad categories
- **Research Validation:** Can map sub-categories to specific research findings