# Survey Question Generation System - Detailed Documentation

## Overview
The ParentLoad survey system uses a sophisticated multi-layered approach to generate personalized questions that help identify parental workload imbalances. The system can use either static questions with smart selection or AI-powered dynamic generation.

## Initial Survey (72 Questions)

### 1. Question Generation Flow

```javascript
// In SurveyScreen.jsx - Initial survey loading
if (mode === 'initial') {
  // Step 1: Try AI-powered dynamic generation first
  try {
    const dynamicQuestions = await generateDynamicQuestions(familyId, selectedUser.id, 72);
    // If successful, use these personalized questions
  } catch (error) {
    // Step 2: Fall back to static question selection
    let personalized = selectPersonalizedInitialQuestions(fullQuestionSet, familyData);
  }
}
```

### 2. Dynamic AI-Powered Generation (Primary Method)

When `enableDynamicQuestions: true` in config:

#### 2.1 Context Gathering
```javascript
// DynamicSurveyGenerator.js - getFamilyContext()
const context = {
  // Location data
  location: {
    city: 'Stockholm',
    country: 'Sweden',
    latitude: 59.3293,
    longitude: 18.0686
  },
  
  // Temporal context
  season: 'winter',
  currentDate: '2024-01-15',
  dayOfWeek: 'Monday',
  
  // Family structure
  familyStructure: {
    parentCount: 2,
    parentNames: ['Stefan', 'Kimberly'],
    childCount: 3,
    childrenAges: [
      { name: 'Lillian', age: 12 },
      { name: 'Tegner', age: 10 },
      { name: 'Oly', age: 8 }
    ]
  },
  
  // Cultural context
  culturalContext: {
    workCulture: 'Strong emphasis on work-life balance, generous parental leave',
    familyNorms: 'Equal parenting expected, fika tradition, outdoor activities valued',
    specificTasks: ['Managing barnvagn in snow', 'Coordinating förskola', 'Planning semester']
  },
  
  // Family priorities (from onboarding)
  priorities: ['Invisible Parental Tasks', 'Mental Load Balance'],
  
  // Special circumstances
  specialCircumstances: ['Remote work', 'Multiple school schedules']
}
```

#### 2.2 AI Prompt Construction
```javascript
// The system sends this to Claude AI:
systemPrompt = `You are an expert in family dynamics and parental workload distribution.
Generate 72 highly personalized survey questions for the Palsson family in Stockholm, Sweden.

CRITICAL CONTEXT:
- Location: Stockholm, Sweden
- Current season: winter
- Family: Stefan & Kimberly with 3 children (Lillian 12, Tegner 10, Oly 8)
- Cultural context: Swedish work-life balance, förskola system, outdoor traditions

REQUIREMENTS:
- Visible Household Tasks: 18 questions
- Invisible Household Tasks: 18 questions  
- Visible Parental Tasks: 18 questions
- Invisible Parental Tasks: 18 questions

Make questions specific like:
- "During Swedish winter, who ensures all three children have appropriate outdoor clothing ready for school?"
- "Who coordinates förskola pickup times for Oly?"
- "Who plans semester (vacation) activities that work for all five family members?"
```

#### 2.3 Generated Questions Example
```json
{
  "questions": [
    {
      "id": "q1",
      "text": "Who keeps track of when Lillian, Tegner, and Oly need new winter boots as their feet grow?",
      "category": "Invisible Parental Tasks",
      "personalizedFor": "Stefan",
      "contextualRelevance": "Swedish winters require proper footwear, tracking growth for 3 children",
      "totalWeight": "10.5"
    },
    {
      "id": "q2", 
      "text": "Who manages the morning routine of getting all three kids dressed in snow gear before school?",
      "category": "Visible Parental Tasks",
      "personalizedFor": "Stefan",
      "contextualRelevance": "Daily winter task specific to Stockholm climate",
      "totalWeight": "8.2"
    }
  ]
}
```

### 3. Static Question Selection (Fallback Method)

If AI generation fails or is disabled:

#### 3.1 Base Question Pool
```javascript
// SurveyContext.js - generateFullQuestionSet()
const categories = {
  "Visible Household Tasks": [
    "Who is responsible for cleaning floors in your home?",
    "Who usually washes the dishes after meals?",
    // ... 50+ questions per category
  ],
  "Invisible Household Tasks": [
    "Who plans meals for the week?",
    "Who schedules family appointments?",
    // ... 50+ questions per category
  ]
  // ... continues for all 4 categories
}
```

#### 3.2 Personalization Algorithm
```javascript
// selectPersonalizedInitialQuestions() in SurveyContext.js

// Step 1: Determine distribution based on priorities
const distribution = {
  "Visible Household Tasks": 12,     // Reduced
  "Invisible Household Tasks": 18,   // Standard
  "Visible Parental Tasks": 18,      // Standard
  "Invisible Parental Tasks": 24     // Increased (highest priority)
};

// Step 2: Filter questions by applicability
questions = questions.filter(q => {
  // Remove pet questions if no pets
  if (q.text.includes('pet') && !familyData.hasPets) return false;
  
  // Remove age-inappropriate questions
  if (q.text.includes('teenager') && maxChildAge < 13) return false;
  
  // Keep culturally relevant questions
  if (familyData.country === 'Sweden' && q.text.includes('snow')) return true;
  
  return true;
});

// Step 3: Weight and sort questions
questions.forEach(q => {
  q.relevanceScore = calculateRelevance(q, familyData);
  // Boost mental load questions if that's a priority
  if (familyData.priorities.includes('Mental Load') && 
      q.category.includes('Invisible')) {
    q.relevanceScore *= 1.5;
  }
});

// Step 4: Select top questions per category
selectedQuestions = selectTopQuestions(questions, distribution);
```

### 4. Child-Specific Adaptations

For users marked as children:

```javascript
// If user is a child, simplify language
if (selectedUser?.role === 'child') {
  const childAge = parseInt(selectedUser.age) || 10;
  
  questions = questions.map(q => {
    // Original: "Who coordinates extracurricular activity schedules?"
    // Simplified: "Which parent signs you up for sports and activities?"
    const simplifiedText = KidQuestionSimplifier.simplifyQuestionForChild(
      q, 
      childAge, 
      selectedUser.name
    );
    
    return {
      ...q,
      originalText: q.text,
      text: simplifiedText
    };
  });
}
```

### 5. Weight Calculation for Each Question

Every question gets a calculated weight that affects ELO ratings:

```javascript
// TaskWeightCalculator.js
const calculateTaskWeight = (question) => {
  const factors = {
    frequency: getFrequencyMultiplier(question),      // 1.0 - 3.0
    invisibility: getInvisibilityMultiplier(question), // 1.0 - 3.0
    emotionalLabor: getEmotionalMultiplier(question),  // 1.0 - 2.0
    researchImpact: getResearchMultiplier(question),   // 1.0 - 2.5
    childDevelopment: getChildMultiplier(question),    // 1.0 - 2.0
    priority: getPriorityMultiplier(question)          // 1.0 - 2.0
  };
  
  // Multiply all factors
  return Object.values(factors).reduce((a, b) => a * b, 1);
};

// Example: "Who worries about children's emotional wellbeing at night?"
// frequency: 3.0 (daily) × invisibility: 3.0 (completely) × 
// emotionalLabor: 2.0 (high) × priority: 2.0 (highest) = 36.0 weight
```

## Cycle/Weekly Survey (20 Questions)

### 1. Adaptive Question Generation

The cycle survey is highly personalized based on:

#### 1.1 Response Pattern Analysis
```javascript
// generateWeeklyQuestions() in SurveyContext.js

// Analyze previous responses
const patterns = analyzeResponsePatterns(previousResponses);
// Result: { mamaHeavy: 65%, papaHeavy: 20%, balanced: 15% }

// Identify imbalanced categories
const imbalancedCategories = await analyzeImbalancesByCategory();
// Result: [
//   { category: "Invisible Parental Tasks", imbalance: 45%, dominantParent: "Mama" },
//   { category: "Visible Household Tasks", imbalance: 10%, dominantParent: "Balanced" }
// ]
```

#### 1.2 Question Allocation Strategy
```javascript
// Allocate 20 questions based on needs
const allocation = {
  // 50% to most imbalanced categories
  "Invisible Parental Tasks": 6,  // Highest imbalance
  "Invisible Household Tasks": 4,  // Second highest
  
  // 30% to monitor balanced areas (prevent backsliding)
  "Visible Household Tasks": 3,    // Currently balanced
  
  // 20% to explore uncovered tasks
  "Visible Parental Tasks": 3,     // Has "no one does it" responses
  
  // Fill remaining slots
  "General Follow-up": 4           // Deep-dive questions
};
```

#### 1.3 Dynamic Question Selection
```javascript
// For each category, select questions that:
// 1. Haven't been asked recently
// 2. Focus on problem areas
// 3. Include uncovered tasks

const weeklyQuestions = [];

// High imbalance category - dig deeper
if (categoryImbalance > 30%) {
  questions.push({
    id: `q${72 + index + 1}`, // Start from q73
    text: "What prevents you from sharing 'remembering doctor appointments' more equally?",
    category: "Invisible Parental Tasks",
    weeklyExplanation: "This targets a specific imbalanced task from your previous responses"
  });
}

// Uncovered tasks - explore why
if (uncoveredTasks.includes(taskType)) {
  questions.push({
    text: "You indicated 'no one' handles vacation planning. What would help?",
    weeklyExplanation: "Identifying gaps in family task coverage"
  });
}
```

### 2. Child-Specific Weekly Questions

For children in weekly surveys:

```javascript
// Different questions based on child ID and age
const childSpecificQuestions = getChildSpecificQuestions(childId, weekNumber);

// Tegner (age 10) might get:
"Does Mom or Dad help more with your math homework this week?"
"Who made your favorite dinner this week?"

// While Lillian (age 12) gets:
"Who do you talk to when you're stressed about school?"
"Which parent manages your phone screen time limits?"
```

### 3. ELO-Informed Question Selection

```javascript
// Use ELO ratings to identify what to ask
const taskImbalances = await ELORatingService.getTaskImbalances(familyId);

// Find tasks with high uncertainty (need more data)
const uncertainTasks = taskImbalances.filter(t => t.uncertainty > 200);

// Find tasks with extreme imbalances
const extremeImbalances = taskImbalances.filter(t => 
  Math.abs(t.mamaRating - t.papaRating) > 300
);

// Generate questions targeting these specific areas
```

## Question ID Management

### Initial Survey: q1 - q72
```javascript
// Static questions use original IDs
{ id: "q1", text: "Who plans meals..." }
{ id: "q72", text: "Who manages bedtime..." }

// Dynamic questions also use q1-q72 range
{ id: "q1", text: "Who coordinates förskola for Oly..." }
```

### Weekly/Cycle Surveys: q73+
```javascript
// In generateWeeklyQuestions()
const weeklyQuestions = selectedQuestions.map((question, index) => ({
  ...question,
  id: `q${72 + index + 1}`, // q73, q74, q75...
  originalId: question.id,   // Keep reference to source question
  weeklyExplanation: "Customized explanation"
}));
```

## Data Flow

### 1. Question Display
```
SurveyScreen.jsx
  ↓ (requests questions)
SurveyContext.js
  ↓ (generates/selects)
DynamicSurveyGenerator.js (if enabled)
  OR
Static Question Pool
  ↓ (returns personalized list)
Display to User
```

### 2. Response Recording
```
User selects answer
  ↓
updateSurveyResponse(questionId, answer, questionData)
  ↓
ELORatingService.updateRatingsForResponse()
  ↓
Firebase: /surveyResponses/{familyId}-{memberId}-{surveyType}
  AND
Firebase: /eloRatings/{familyId}
```

### 3. Metadata Storage
```javascript
// Each response stored with:
{
  "q1": {
    answer: "Mama",
    category: "Invisible Parental Tasks",
    weight: "10.5",
    timestamp: "2024-01-15T10:30:00Z",
    isDynamic: true,
    context: {
      season: "winter",
      location: "Stockholm"
    }
  }
}
```

## Personalization Factors

### 1. Family Structure
- Number of parents (single parent vs two parents)
- Number and ages of children
- Special needs or circumstances

### 2. Geographic/Cultural
- Country-specific tasks (förskola in Sweden)
- Climate-related (snow management in winter)
- Cultural norms (work-life balance expectations)

### 3. Temporal
- Season (winter clothing vs summer activities)
- Day of week (weekend vs weekday tasks)
- School schedule (term time vs holidays)

### 4. Historical Data
- Previous response patterns
- Identified imbalances
- Uncovered tasks (no one does it)
- Task completion success rates

### 5. Priority-Based
- Family's stated priorities from onboarding
- Categories needing most attention
- Research-backed high-impact areas

## Benefits of This System

1. **Infinite Variety**: AI can generate unlimited unique questions
2. **Cultural Sensitivity**: Questions match family's actual context
3. **Progressive Depth**: Weekly surveys dig into problem areas
4. **Child Inclusion**: Age-appropriate versions for each child
5. **Data-Driven**: Uses ELO ratings and patterns to guide questions
6. **Flexible**: Falls back to smart static selection if AI unavailable

This system ensures that every family gets a truly personalized survey experience that evolves based on their responses and helps identify their specific parental workload imbalances.