# Kid Question Simplification Implementation

## Overview
Created an intelligent question simplification system that adapts survey questions for children based on their age, making them more understandable and relatable.

## Key Changes

### 1. Created KidQuestionSimplifier Service
**File**: `src/services/KidQuestionSimplifier.js`

Features:
- Age-based simplification (toddler, young child, preteen, teen)
- Replaces "Who" with "Which parent" for all questions
- Simplifies complex terminology to age-appropriate language
- Optional AI-powered simplification using Claude
- Caching for performance
- Batch processing capability

### 2. Updated KidFriendlySurvey Component
**File**: `src/components/survey/KidFriendlySurvey.jsx`

Changes:
- Integrated new KidQuestionSimplifier service
- Maintains backward compatibility with legacy simplification
- Supports personalization with child's name

## Age-Based Simplification Examples

### Toddler (Ages 3-5)
- **Original**: "Who is responsible for cleaning floors in your home?"
- **Simplified**: "Which parent cleans the floor?"

- **Original**: "Who provides emotional labor for the family?"
- **Simplified**: "Which parent hugs you when you're sad?"

### Young Child (Ages 6-8)
- **Original**: "Who manages the family calendar?"
- **Simplified**: "Which parent takes care of the family calendar?"

- **Original**: "Who coordinates children's schedules to prevent conflicts?"
- **Simplified**: "Which parent plans children's schedules to prevent conflicts?"

### Preteen (Ages 9-12)
- **Original**: "Who anticipates developmental needs?"
- **Simplified**: "Which parent plans ahead for what you need as you grow?"

- **Original**: "Who handles troubleshooting when household technology or appliances malfunction?"
- **Simplified**: "Which parent handles fixing problems with household technology or appliances?"

### Teen (Ages 13+)
- **Original**: "Who provides emotional labor for the family?"
- **Simplified**: "Which parent provides emotional support work for the family?"

## Key Improvements

1. **"Which parent" Format**: All questions now start with "Which parent" instead of "Who", making it clearer for kids that they're choosing between parents.

2. **Age-Appropriate Language**: 
   - Complex terms like "responsible for" become "does" or "handles"
   - Abstract concepts are made concrete for younger children
   - Technical jargon is simplified

3. **Concrete Examples**: For younger children, questions focus on tangible actions they can understand.

4. **AI Enhancement** (Optional): The system can use Claude AI to generate even more natural, conversational versions of questions.

## Testing
Created test file: `public/test-kid-question-simplifier.js` to demonstrate the simplification across different age groups.

## Usage
The simplification happens automatically in the KidFriendlySurvey component based on the child's age from their profile.

## Future Enhancements
1. Enable AI batch processing for initial question setup
2. Add voice-over support for questions
3. Create visual aids for each question type
4. Add culturally-aware simplifications