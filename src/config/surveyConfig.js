// Survey Configuration
export const surveyConfig = {
  // Enable AI-powered dynamic question generation
  enableDynamicQuestions: true,
  
  // Minimum questions per category
  minQuestionsPerCategory: 18,
  
  // Total questions for initial survey
  initialSurveyQuestionCount: 72,
  
  // Total questions for weekly/cycle surveys
  weeklySurveyQuestionCount: 20,
  
  // Enable location-based personalization
  enableLocationPersonalization: true,
  
  // Enable seasonal personalization
  enableSeasonalPersonalization: true,
  
  // Enable cultural context
  enableCulturalContext: true,
  
  // Cache dynamic questions for performance
  cacheDynamicQuestions: true,
  
  // Cache duration in hours
  cacheDurationHours: 24,
  
  // Fallback to static questions if dynamic generation fails
  fallbackToStatic: true,
  
  // Categories for question distribution
  categories: {
    "Visible Household Tasks": {
      weight: 0.25,
      examples: ["cleaning", "cooking", "laundry", "yard work"]
    },
    "Invisible Household Tasks": {
      weight: 0.25,
      examples: ["planning", "scheduling", "budgeting", "organizing"]
    },
    "Visible Parental Tasks": {
      weight: 0.25,
      examples: ["driving kids", "homework help", "bedtime routines"]
    },
    "Invisible Parental Tasks": {
      weight: 0.25,
      examples: ["emotional support", "anticipating needs", "worrying", "planning futures"]
    }
  }
};