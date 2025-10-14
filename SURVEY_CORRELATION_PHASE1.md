# Survey Engine Phase 1: Task Completion Correlation

## Overview
Phase 1 of the survey engine improvements connects survey responses to actual task completion data, creating a learning loop that validates whether survey insights translate to real behavioral change.

## What We Built

### 1. TaskCompletionAggregator Service
**Purpose**: Aggregates task completion data from multiple sources to provide a comprehensive view of who actually does what in the family.

**Key Features**:
- Pulls data from chore system, kanban board, and knowledge graph
- Categorizes tasks automatically based on keywords
- Calculates task weights and distribution percentages
- Provides both count-based and weight-based analysis

**Data Sources**:
- **Chore System**: Tracks who completes chores with approval workflow
- **Kanban Board**: Tracks task assignments and completions
- **Knowledge Graph**: Stores achievement history for analytics

### 2. Enhanced SurveyFeedbackLearningService
**Purpose**: Analyzes correlation between survey responses and actual task completion patterns.

**Key Methods**:
- `trackResponseTaskCorrelation()`: Main method that performs correlation analysis
- `_analyzeDetailedCorrelation()`: Compares survey answers to reality
- `_generateCorrelationInsights()`: Creates actionable insights from analysis
- `_updateFamilyLearningFromCorrelation()`: Updates learning patterns for future surveys

**Analysis Features**:
- Overall accuracy score (how well perceptions match reality)
- Category-specific accuracy breakdown
- Identification of high-imbalance areas
- Detection of invisible work awareness gaps
- Actionable recommendations based on findings

### 3. useSurveyCorrelation Hook
**Purpose**: React hook that makes it easy to track correlations in survey components.

**Key Functions**:
- `analyzeCorrelation()`: Triggers correlation analysis
- `getFormattedInsights()`: Formats insights for display
- `getMismatchesForLearning()`: Identifies specific perception vs reality gaps
- `useAutoCorrelationTracking()`: Automatically tracks after survey completion

### 4. CorrelationInsightsDisplay Component
**Purpose**: User-friendly display of correlation analysis results.

**Features**:
- Visual accuracy scores with color coding
- Category breakdown with progress bars
- Insight cards with icons and impact levels
- Prioritized recommendations
- Share and tracking options

## How It Works

### Data Flow
1. **Survey Completion**: Family members complete survey questions about who does what
2. **Task Data Aggregation**: System pulls last 30 days of task completion data
3. **Correlation Analysis**: Compares survey responses to actual task completions
4. **Insight Generation**: Creates insights about perception gaps and imbalances
5. **Learning Update**: Stores patterns to improve future surveys

### Correlation Logic
- **Match**: Survey says "Mama" and Mama does >65% of tasks in that category
- **Mismatch**: Survey says "Papa" but Mama does >65% of tasks
- **Shared**: When task distribution is between 35-65% for both parents

### Accuracy Thresholds
- **>80%**: Excellent alignment - perceptions match reality
- **60-80%**: Moderate alignment - some discrepancies exist
- **<60%**: Poor alignment - significant perception gaps

## Key Insights Generated

### 1. Overall Accuracy
Shows how well the family's perceptions align with actual behavior across all categories.

### 2. Category-Specific Analysis
Breaks down accuracy by task category (Visible/Invisible, Household/Parental).

### 3. Imbalance Detection
Identifies when one person is doing >75% of tasks in a category despite different perceptions.

### 4. Invisible Work Awareness
Highlights when families have low awareness (<50% accuracy) of who handles invisible tasks.

### 5. Perception Gaps
Detects systematic over/under-attribution of work to specific family members.

## Recommendations System

The system generates prioritized recommendations based on findings:

### High Priority
- Large perception-reality gaps (<40% accuracy)
- Extreme task imbalances (>75% by one person)
- Low invisible work awareness

### Medium Priority
- Moderate perception gaps (40-60% accuracy)
- Significant imbalances (65-75% by one person)
- Category-specific misalignments

### Action Types
- Family meetings to discuss findings
- Task redistribution for imbalanced areas
- Creating visibility for invisible work
- Regular check-ins to track progress

## Learning Loop Integration

### What Gets Stored
- Correlation accuracy scores by category
- Identified perception gaps
- Recommendation history
- Improvement tracking over time

### How It Improves Surveys
- Questions in low-accuracy categories get reframed
- High-mismatch questions are prioritized for follow-up
- Cross-family learning identifies common perception gaps
- Adaptive questioning based on accuracy trends

## Usage Example

```javascript
// In a survey completion component
import { useSurveyCorrelation, useAutoCorrelationTracking } from './hooks/useSurveyCorrelation';

function SurveyComplete({ surveyResponses, surveyCompleted }) {
  const { correlationData, isAnalyzing } = useSurveyCorrelation();
  
  // Automatically track when survey completes
  useAutoCorrelationTracking(surveyCompleted, surveyResponses);
  
  // Display insights
  if (correlationData) {
    return <CorrelationInsightsDisplay correlationData={correlationData} />;
  }
}
```

## Next Steps (Phase 2)
1. **Pattern Recognition**: Analyze which questions drive positive change
2. **Progressive Difficulty**: Questions evolve as families progress
3. **Cross-Family Learning**: Enable privacy-preserved learning across families
4. **Behavioral Change Tracking**: Monitor if insights lead to actual task redistribution

## Success Metrics
- Survey-reality correlation accuracy improves over time
- Families report better awareness of task distribution
- Invisible work becomes more recognized and valued
- Task imbalances decrease following insights
- Family satisfaction with task distribution increases