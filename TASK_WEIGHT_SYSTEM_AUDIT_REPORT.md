# Task Weight System Audit Report

## Executive Summary

After auditing the Allie codebase against the ALLIE_TASK_WEIGHT_SYSTEM_COMPLETE_DOCUMENTATION, I found that while the core task weighting system is well-implemented, there are several opportunities to better leverage this valuable data across the application.

## Audit Findings

### ✅ What's Working Well

#### 1. **Core Weight Calculation**
- TaskWeightCalculator.js correctly implements all 7 factors
- Research-backed multipliers are properly applied
- Weight ranges (1.9-14.2) align with documentation

#### 2. **ELO Integration**
- Task weights properly influence rating changes through K-factor adjustment
- Weight multiplier correctly capped at 2.5x
- Match history stores weight data and impact scores

#### 3. **Dashboard Visualization**
- ELORatingsDisplay shows weighted load (not just task counts)
- High-weight task tracking implemented
- Research transparency available through ResearchBasisDisplay

#### 4. **Survey Personalization**
- Weekly surveys prioritize questions by weight
- Imbalanced categories get more questions
- Uncovered high-weight tasks are identified

### ⚠️ Areas Needing Improvement

#### 1. **Habit Generation Not Using Full Weight Data**

**Current State:**
```javascript
// HabitGenerationService.js only uses category-level imbalances
const imbalances = extractImbalances(weightedScores);
```

**Missing:**
- No use of task-level imbalances from ELORatingService
- Doesn't prioritize habits for high-weight tasks
- Not connected to ELO task recommendations

**Recommendation:**
Enhance habit generation to use task-level weight data:
```javascript
// Get task-level imbalances with weights
const taskImbalances = await ELORatingService.getTaskImbalances(familyId);

// Prioritize habits for high-weight imbalanced tasks
const highWeightTasks = Object.entries(taskImbalances)
  .filter(([task, data]) => data.score > 100 && task.weight > 7)
  .sort((a, b) => b[1].score * b[1].weight - a[1].score * a[1].weight);
```

#### 2. **Research Impact Auto-Detection Not Fully Utilized**

**Current State:**
Many survey questions have manually set `researchImpact` values.

**Opportunity:**
The ResearchBackedTaskImpact.js can auto-determine impact levels, but this isn't being used consistently.

**Recommendation:**
Update survey questions to leverage auto-detection:
```javascript
// In survey question generation
if (!question.researchImpact) {
  question.researchImpact = getTaskImpactLevel(question.text, question.category);
}
```

#### 3. **Missing Weight-Based Analytics**

**Current State:**
Limited analytics on weight distribution and trends.

**Opportunities:**
- Track average family task weight over time
- Identify weight imbalance (not just count imbalance)
- Show "invisible labor index" based on weight composition

#### 4. **Chore System Not Weight-Aware**

**Current State:**
Chore assignments don't consider task weights.

**Recommendation:**
Integrate weights into chore distribution:
```javascript
// Fair chore assignment based on weight, not count
const assignChoresByWeight = (chores, familyMembers) => {
  const targetWeight = totalChoreWeight / familyMembers.length;
  // Distribute to balance total weight, not task count
};
```

## Specific Component Recommendations

### 1. **Enhance HabitGenerationService.js**

```javascript
async generatePersonalizedHabits(familyData, surveyResponses, weightedScores) {
  // NEW: Get task-level imbalances
  const taskImbalances = await ELORatingService.getTaskImbalances(familyData.familyId);
  
  // NEW: Get ELO recommendations
  const eloRecommendations = await ELORatingService.getTaskRecommendations(familyData.familyId);
  
  // Combine all data sources
  const habitPriorities = this.calculateHabitPriorities({
    categoryImbalances: extractImbalances(weightedScores),
    taskImbalances,
    eloRecommendations,
    familyPriorities: familyData.familyPriorities
  });
  
  // Generate habits targeting highest-weight imbalances
  return this.createHabitsForPriorities(habitPriorities);
}
```

### 2. **Add Weight Analytics Dashboard Component**

```javascript
// New component: WeightAnalyticsDashboard.jsx
const WeightAnalyticsDashboard = () => {
  const { getWeightStatistics } = useFamily();
  
  return (
    <div>
      <h3>Invisible Labor Index</h3>
      <p>Average task weight: {stats.averageWeight}</p>
      <p>High-weight task ratio: {stats.highWeightRatio}</p>
      <WeightDistributionChart data={stats.distribution} />
      <InvisibleLaborScore score={calculateInvisibleIndex(stats)} />
    </div>
  );
};
```

### 3. **Update Survey Question Selection**

```javascript
// In SurveyContext.js generateWeeklyQuestions
// Enhance the sorting to consider both weight and imbalance
questions.sort((a, b) => {
  const weightA = parseFloat(a.totalWeight || 5);
  const weightB = parseFloat(b.totalWeight || 5);
  const imbalanceA = getQuestionImbalance(a, taskImbalances);
  const imbalanceB = getQuestionImbalance(b, taskImbalances);
  
  // Prioritize high-weight + high-imbalance questions
  return (weightB * imbalanceB) - (weightA * imbalanceA);
});
```

### 4. **Create Weight-Based Insights Component**

```javascript
// WeightBasedInsights.jsx
const WeightBasedInsights = ({ familyId }) => {
  const insights = useWeightInsights(familyId);
  
  return (
    <div className="insights-panel">
      <h3>Task Weight Insights</h3>
      
      {insights.hiddenBurden && (
        <Alert type="warning">
          <p>{insights.hiddenBurden.parent} is carrying {insights.hiddenBurden.percent}% 
          of invisible high-weight tasks. These are often unrecognized but exhausting.</p>
        </Alert>
      )}
      
      {insights.weightTrend && (
        <TrendChart 
          title="Average Task Weight Trend"
          data={insights.weightTrend}
          message="Your family's task complexity is {increasing/decreasing}"
        />
      )}
      
      <ResearchBackedRecommendation 
        tasks={insights.topWeightedTasks}
        research={TASK_IMPACT_RESEARCH}
      />
    </div>
  );
};
```

## Implementation Priority

### Phase 1: Connect Existing Systems (High Impact, Low Effort)
1. ✅ Update HabitGenerationService to use ELO task recommendations
2. ✅ Add task weight to habit selection criteria
3. ✅ Ensure all survey questions use auto-detected research impact

### Phase 2: Enhanced Analytics (Medium Impact, Medium Effort)
1. ⏳ Create weight analytics dashboard
2. ⏳ Add invisible labor index
3. ⏳ Implement weight trend tracking

### Phase 3: System-Wide Integration (High Impact, High Effort)
1. ⏳ Integrate weights into chore system
2. ⏳ Add weight-based reward calculations
3. ⏳ Create predictive imbalance models using weights

## Validation Checklist

- [ ] Habit generation uses task-level weight data
- [ ] Survey personalization prioritizes high-weight imbalanced tasks
- [ ] Dashboard shows weight-based metrics, not just counts
- [ ] Research impact auto-detection is consistently used
- [ ] Chore assignments consider task weight
- [ ] Analytics track weight trends over time

## Conclusion

The Allie task weight system is a powerful differentiator that's already well-implemented at the core. By better leveraging this data throughout the application—especially in habit generation and analytics—we can deliver even more value to families seeking balance.

The most impactful immediate improvement would be connecting the ELO task recommendations to habit generation, ensuring that the habits we suggest target the highest-weight, most imbalanced tasks in each family.