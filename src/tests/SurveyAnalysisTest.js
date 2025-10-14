// src/tests/SurveyAnalysisTest.js

/**
 * Test file for validating the Survey Analysis utility
 * This can be run in a browser console to test the functionality
 */

import { 
  analyzeTaskImbalances, 
  generatePersonalizedExplanation, 
  findMostAppropriateHabit 
} from '../utils/SurveyAnalysisUtil';

// Mock survey data with different imbalance scenarios
const mockSurveyScenarios = {
  // Scenario 1: Papa doing significantly less household tasks
  papaLessHouseholdTasks: {
    "dishwashing": "Mama",
    "laundry": "Mama",
    "cooking": "Mama",
    "cleaning": "Mama",
    "shopping": "Both",
    "bathingKids": "Papa",
    "readingToKids": "Both",
    "morningRoutine": "Both",
    "planningMeals": "Mama",
    "appointmentScheduling": "Mama"
  },
  
  // Scenario 2: Mama doing significantly less childcare
  mamaLessChildcare: {
    "dishwashing": "Both",
    "laundry": "Both",
    "cooking": "Papa",
    "cleaning": "Both",
    "shopping": "Papa",
    "bathingKids": "Papa",
    "readingToKids": "Papa",
    "morningRoutine": "Papa",
    "planningMeals": "Both",
    "appointmentScheduling": "Mama"
  },
  
  // Scenario 3: Balanced distribution
  balancedDistribution: {
    "dishwashing": "Papa",
    "laundry": "Mama",
    "cooking": "Papa",
    "cleaning": "Mama",
    "shopping": "Both",
    "bathingKids": "Mama",
    "readingToKids": "Papa",
    "morningRoutine": "Both",
    "planningMeals": "Papa",
    "appointmentScheduling": "Mama"
  }
};

// Mock question set to match the survey keys
const mockQuestionSet = [
  { id: "dishwashing", category: "Visible Household Tasks", baseWeight: 3 },
  { id: "laundry", category: "Visible Household Tasks", baseWeight: 3 },
  { id: "cooking", category: "Visible Household Tasks", baseWeight: 4 },
  { id: "cleaning", category: "Visible Household Tasks", baseWeight: 4 },
  { id: "shopping", category: "Visible Household Tasks", baseWeight: 3 },
  { id: "bathingKids", category: "Visible Parental Tasks", baseWeight: 3 },
  { id: "readingToKids", category: "Visible Parental Tasks", baseWeight: 2 },
  { id: "morningRoutine", category: "Visible Parental Tasks", baseWeight: 3 },
  { id: "planningMeals", category: "Invisible Household Tasks", baseWeight: 3 },
  { id: "appointmentScheduling", category: "Invisible Parental Tasks", baseWeight: 3 }
];

// Mock habits to test with
const mockHabits = [
  {
    id: "habit1",
    title: "Meal Planning Check-in",
    description: "Review upcoming meal plans and grocery needs",
    category: "Invisible Household Tasks",
    habitExplanation: "This meal planning habit addresses a common source of family stress by reducing daily decision fatigue.",
    habitResearch: "Studies show that families with consistent meal planning routines report 32% less dinnertime stress."
  },
  {
    id: "habit2",
    title: "Morning Kid Routine",
    description: "Structured approach to morning child duties",
    category: "Visible Parental Tasks",
    habitExplanation: null,
    habitResearch: null
  },
  {
    id: "habit3",
    title: "Weekly House Cleaning",
    description: "Structured approach to house cleaning",
    category: "Visible Household Tasks",
    habitExplanation: null,
    habitResearch: null
  }
];

// Run tests for each scenario
export const runSurveyAnalysisTests = () => {
  Object.entries(mockSurveyScenarios).forEach(([scenarioName, surveyData]) => {
    console.log(`\nTESTING SCENARIO: ${scenarioName}`);
    
    // Analyze survey data
    const analysis = analyzeTaskImbalances(surveyData, mockQuestionSet);
    console.log('Survey Analysis Results:', analysis);
    
    // Test explanations for both parents
    for (const parentRole of ['Mama', 'Papa']) {
      for (const habit of mockHabits) {
        const explanation = generatePersonalizedExplanation(habit, analysis, parentRole);
        console.log(`\nExplanation for ${parentRole} - ${habit.title}:`);
        console.log(explanation);
      }
    }
    
    // Test habit selection
    for (const parentRole of ['Mama', 'Papa']) {
      const selectedHabit = findMostAppropriateHabit(mockHabits, analysis, parentRole);
      console.log(`\nBest habit for ${parentRole}:`, selectedHabit.title);
    }
  });
  
  return "Survey Analysis Tests Completed";
};

// For easy running in browser console
window.runSurveyAnalysisTests = runSurveyAnalysisTests;

// Export for automated testing
export default {
  runSurveyAnalysisTests,
  mockSurveyScenarios,
  mockQuestionSet,
  mockHabits
};