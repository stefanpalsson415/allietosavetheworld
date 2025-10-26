# Survey Personalization: Initial vs Weekly Surveys

## Executive Summary

**Initial Survey (72 questions):** Hyper-personalized with AI using names, locations, seasons, ages, cultural context
**Weekly Survey (20 questions):** Adaptive based on patterns from previous responses, ELO ratings, and Knowledge Graph insights

## The Key Difference

### Initial Survey = Claude AI Generation with Rich Context
### Weekly Survey = Pattern-Based Adaptation from Historical Data

---

## 🎯 Initial Survey (Mode: 'initial')

**Location:** `SurveyScreen.jsx` lines 325-380
**Generator:** `DynamicSurveyGenerator.js` with Claude AI
**Question Count:** 72 questions (full comprehensive baseline)

### How It Works:

1. **Gathers Rich Contextual Data** (`DynamicSurveyGenerator.js:20-99`):
   ```javascript
   const context = {
     // Family Members
     memberName: "Stefan",
     memberRole: "parent",
     memberAge: 40,

     // Location & Culture
     location: {
       city: "Stockholm",
       country: "Sweden",
       latitude: 59.3,
       longitude: 18.1
     },

     // Temporal Context
     season: "winter",  // Based on month + latitude
     dayOfWeek: "Monday",

     // Family Structure
     familyStructure: {
       parentCount: 2,
       parentNames: ["Stefan", "Kimberly"],
       childCount: 3,
       childrenAges: [
         { name: "Lillian", age: 14 },
         { name: "Oly", age: 11 },
         { name: "Tegner", age: 7 }
       ]
     },

     // Cultural Context
     culturalContext: {
       workCulture: "Strong emphasis on work-life balance, generous parental leave",
       familyNorms: "Equal parenting expected, fika tradition, outdoor activities valued",
       specificTasks: [
         "Managing barnvagn (stroller) in snow",
         "Coordinating förskola (preschool)",
         "Planning semester (vacation)"
       ]
     },

     // Family Priorities
     priorities: ["balanced parenting", "outdoor time", "equal distribution"],

     // Interview Insights (from previous conversations)
     interviewInsights: {
       invisibleWorkPatterns: { /* KG data */ },
       stressCapacity: { /* stress levels */ },
       decisionMaking: { /* how family makes decisions */ }
     }
   };
   ```

2. **Claude AI Generates Hyper-Personalized Questions** (`DynamicSurveyGenerator.js:194-279`):

   **System Prompt includes:**
   - Real names: "Stefan", "Kimberly", "Lillian", "Oly", "Tegner"
   - Location: "Stockholm, Sweden"
   - Season: "During winter, who..."
   - Ages: "Who manages winter clothing for Lillian (14)?"
   - Culture: "Who coordinates fika supplies?"
   - Family structure: References ALL 5 family members by name

   **Example Generated Questions:**
   ```
   "During winter in Stockholm, who ensures Tegner (7) has warm mittens and snowsuit ready?"
   "Who coordinates förskola (preschool) pickups for Oly on weekdays?"
   "When it comes to planning your family's summer semester, who typically researches destinations?"
   "In your family, who remembers to schedule fika time on weekends?"
   "Who notices when Lillian (14) needs new winter boots as she grows?"
   ```

3. **AI Ensures Distribution** across 4 categories:
   - Visible Household Tasks: 18 questions
   - Invisible Household Tasks: 18 questions
   - Visible Parental Tasks: 18 questions
   - Invisible Parental Tasks: 18 questions

4. **Caching:** Questions cached for 7 days (same questions for all family members during initial survey period)

---

## 📅 Weekly Survey (Mode: 'weekly')

**Location:** `SurveyContext.js` lines 624-1517
**Generator:** `generateWeeklyQuestions()` function
**Question Count:** 20 questions (focused follow-up)

### How It Works:

1. **Analyzes Previous Response Patterns** (`SurveyContext.js:746-823`):
   ```javascript
   // Count responses by category from PREVIOUS surveys
   const imbalanceData = {
     "Visible Household Tasks": { mama: 12, papa: 3, imbalance: 60% },
     "Invisible Household Tasks": { mama: 15, papa: 2, imbalance: 76% },
     "Visible Parental Tasks": { mama: 10, papa: 8, imbalance: 11% },
     "Invisible Parental Tasks": { mama: 14, papa: 4, imbalance: 56% }
   };

   // Sorts categories by imbalance
   // Prioritizes categories with highest imbalance
   ```

2. **Integrates ELO Rating System** (`SurveyContext.js:746-779`):
   ```javascript
   // Uses ELO ratings to identify TRUE imbalances
   const eloImbalances = await ELORatingService.getCategoryImbalances(familyId);
   // Returns: Categories sorted by actual task completion patterns
   // Not just survey responses, but REAL behavior data
   ```

3. **Loads Knowledge Graph Insights** (`SurveyContext.js:698-743`):
   ```javascript
   const kgInsights = {
     invisibleLabor: [
       {
         category: "household",
         anticipation: 908, // Kimberly anticipates 908 tasks
         monitoring: 342,
         execution: 651,
         leader: "Kimberly",
         percentageDifference: 36.7 // 36.7% imbalance
       }
     ],
     coordination: { /* who organizes events */ },
     temporal: { /* when tasks are created */ }
   };
   ```

4. **Question Selection Strategy** (`SurveyContext.js:828-1119`):
   ```javascript
   // STEP 1: Find most imbalanced categories
   const topImbalances = imbalanceData
     .sort((a, b) => b.imbalance - a.imbalance)
     .slice(0, 2); // Top 2 most imbalanced categories

   // STEP 2: Weight questions by category imbalance
   const weightedQuestions = questions.map(q => ({
     ...q,
     priority: kgInsights?.invisibleLabor?.find(il =>
       il.category === categoryMap[q.category]
     )?.percentageDifference * 2.0 || 1.0
   }));

   // STEP 3: Select questions targeting imbalances
   // - 50% from most imbalanced category
   // - 25% from second most imbalanced
   // - 25% from other categories
   ```

5. **Adaptive Question Generation** (`SurveyContext.js:1120-1350`):
   ```javascript
   // Uses STATIC question pool but selects based on:
   // - Previous answers (what wasn't asked yet)
   // - Category imbalances (where problems exist)
   // - ELO ratings (real behavior patterns)
   // - Knowledge Graph (invisible labor data)

   // Example: If KG shows Kimberly coordinates 80% of events
   // → Weekly survey asks MORE coordination questions
   // → Targets the specific imbalance discovered
   ```

---

## Why Weekly Surveys Feel Less Personalized

### Initial Survey (72 questions):
- ✅ Uses real names: "Stefan", "Kimberly", "Lillian"
- ✅ Uses location: "Stockholm, Sweden"
- ✅ Uses season: "During winter..."
- ✅ Uses ages: "for Tegner (7)"
- ✅ Uses culture: "fika", "förskola", "semester"
- ✅ AI generates UNIQUE questions for YOUR family
- ✅ Questions feel like written by someone who knows you

### Weekly Survey (20 questions):
- ❌ Uses generic templates: "Who is responsible for..."
- ❌ No names in questions (selects from static pool)
- ❌ No location context
- ❌ No season context
- ⚠️ ADAPTIVE but not PERSONALIZED

**Why?**
- Initial survey: AI generates fresh questions (expensive, slow)
- Weekly survey: Selects from static pool (fast, cheap, pattern-based)

**Trade-off:**
- Initial: High personalization, high cost (Claude API $$$)
- Weekly: Lower personalization, but SMARTER selection based on YOUR patterns

---

## The Static Question Pool Problem

**Located:** `SurveyContext.js` lines 21-159

```javascript
const questionTexts = {
  "Visible Household Tasks": [
    "Who is responsible for cleaning floors in your home?",
    "Who usually washes the dishes after meals?",
    "Who typically cooks meals for the family?",
    // ... 25 more generic questions
  ],
  "Invisible Parental Tasks": [
    "Who coordinates the 'emotional climate' of the family?",
    "Who keeps mental track of each child's emotional triggers?",
    // EVENT ROLE QUESTIONS - Invisible
    "Who coordinates carpools with other families for activities?",
    "Who communicates with coaches, teachers, and activity leaders?",
    // ... 18 more questions
  ]
};
```

**These questions are:**
- Generic (no names)
- Context-free (no location, season, culture)
- Static (same for everyone)

**But selection is SMART:**
- Targets your imbalances
- Adapts based on previous answers
- Follows ELO patterns
- Informed by Knowledge Graph

---

## Solution: Make Weekly Surveys More Personalized

### Option 1: Add Names to Static Questions (Low Cost)

**Before:**
```javascript
"Who coordinates carpools with other families for activities?"
```

**After:**
```javascript
// Use family member names
"Who coordinates carpools for Lillian's volleyball and Oly's science club?"
```

**Implementation:**
```javascript
// In generateWeeklyQuestions()
const personalized = question.text
  .replace(/{child1}/g, familyData.children[0]?.name)
  .replace(/{child2}/g, familyData.children[1]?.name)
  .replace(/{activity}/g, upcomingEvents[0]?.title);
```

### Option 2: Hybrid Approach (Medium Cost)

**Use AI for SOME weekly questions:**
- Generate 10 AI questions (targeting top imbalance)
- Select 10 static questions (for coverage)
- Total: 20 questions, half personalized

**Implementation:**
```javascript
if (weekNumber % 4 === 1) { // Every 4 weeks
  const topCategory = mostImbalancedCategory;
  const aiQuestions = await generateDynamicQuestions(
    familyId,
    memberId,
    10, // Just 10 questions
    { category: topCategory } // Focus on problem area
  );
  // Combine with 10 static questions
}
```

### Option 3: Template System (Best Balance)

**Create personalized templates:**
```javascript
const templates = {
  "carpool_coordination": {
    text: "Who coordinates carpools for {child}'s {activity} on {dayOfWeek}s?",
    variables: {
      child: familyData.children[0].name,
      activity: upcomingEvents.find(e => e.category === 'sports')?.title,
      dayOfWeek: 'Tuesday'
    }
  }
};
```

**Benefits:**
- Fast (no AI cost)
- Personalized (uses names, events, context)
- Adaptive (still targets imbalances)

---

## Recommended Implementation

### Phase 1: Enhanced Weekly Survey Generation

**Add to `generateWeeklyQuestions()` in `SurveyContext.js`:**

```javascript
// STEP 1: Load family context (similar to initial survey)
const context = {
  familyMembers: familyData.familyMembers,
  upcomingEvents: await getUpcomingEvents(familyId),
  recentTasks: await getRecentTasks(familyId),
  location: familyData.location,
  season: getCurrentSeason(familyData.location.latitude)
};

// STEP 2: Personalize static questions
const personalizeQuestion = (question, context) => {
  let text = question.text;

  // Replace placeholders
  text = text.replace(/{parent1}/g, context.familyMembers[0]?.name);
  text = text.replace(/{parent2}/g, context.familyMembers[1]?.name);
  text = text.replace(/{child1}/g, context.familyMembers.find(m => m.role === 'child')?.name);

  // Add seasonal context
  if (context.season === 'winter' && question.category.includes('Household')) {
    text = text.replace('Who', `During ${context.season}, who`);
  }

  // Add event context if relevant
  if (question.text.includes('activities') && context.upcomingEvents.length > 0) {
    const event = context.upcomingEvents[0];
    text = text.replace('activities', `${event.title} (${event.category})`);
  }

  return { ...question, text, originalText: question.text };
};

// STEP 3: Apply personalization to selected questions
const personalizedWeeklyQuestions = selectedQuestions.map(q =>
  personalizeQuestion(q, context)
);
```

### Phase 2: AI-Assisted Question Templates

**Add targeted AI generation for top imbalance:**

```javascript
// Every 4 weeks, generate fresh questions for biggest problem area
if (weekNumber % 4 === 1) {
  const topImbalance = imbalanceData[0]; // Biggest imbalance

  const focusedQuestions = await generateDynamicQuestions(
    familyId,
    memberId,
    5, // Just 5 AI questions
    {
      category: topImbalance.category,
      prompt: `Focus on ${topImbalance.category} where ${topImbalance.dominantParent} is doing ${topImbalance.imbalance}% more work`
    }
  );

  // Mix: 5 AI + 15 personalized static = 20 total
}
```

---

## Current Status

### Initial Survey: ✅ Fully Personalized
- Uses Claude AI
- Generates 72 unique questions
- Rich context: names, location, season, culture
- Costs ~$0.15 per survey (Claude API)
- Takes ~10-15 seconds to generate

### Weekly Survey: ⚠️ Adaptive but Generic
- Selects from static pool
- 20 questions
- SMART selection (ELO, KG insights, patterns)
- Fast (instant)
- Free (no API costs)
- **But:** Generic questions with no names/context

### Event Role Questions: ✅ Added to Static Pool
- 18 event role questions added
- Integrated into "Visible Parental Tasks" and "Invisible Parental Tasks"
- **But:** Still generic (no names, no specific events)

---

## Next Steps

1. **Quick Win:** Add name substitution to weekly survey static questions
2. **Medium Term:** Implement template system with context variables
3. **Long Term:** Hybrid approach (some AI, some static) based on imbalance severity

Would you like me to implement any of these enhancements?
