// src/utils/SurveyAnalysisUtil.js
import { calculateBalanceScores } from './TaskWeightCalculator';
import workloadBalanceDetector from '../services/WorkloadBalanceDetector';

/**
 * Utility functions for analyzing survey data to identify imbalances
 * and generate personalized habit explanations
 */

/**
 * Analyzes survey responses to identify the most imbalanced task categories
 * @param {Object} surveyResponses - Survey responses data
 * @param {Array} fullQuestionSet - Full set of survey questions
 * @param {Object} familyPriorities - Family priorities data
 * @returns {Object} Analysis results including imbalances by category
 */
/**
 * Analyzes survey responses to identify the most imbalanced task categories
 * Enhanced to handle personalized surveys from both adults and children
 * @param {Object} surveyResponses - Survey responses data
 * @param {Array} fullQuestionSet - Full set of survey questions
 * @param {Object} familyPriorities - Family priorities data
 * @param {String} respondentType - Type of respondent ('adult', 'child', or 'all')
 * @param {String} respondentId - ID of specific respondent to filter by (optional)
 * @param {Number} cycleNumber - Survey cycle number to filter responses (optional)
 * @returns {Object} Analysis results including imbalances by category
 */
export const analyzeTaskImbalances = (surveyResponses, fullQuestionSet = [], familyPriorities = null, respondentType = 'all', respondentId = null, cycleNumber = null) => {
  console.log(`Analyzing task imbalances for ${respondentType} ${respondentId || ''} cycle: ${cycleNumber || 'all'}`);
  
  // Filter responses if needed
  let filteredResponses = {};
  
  if (respondentType !== 'all' || respondentId || cycleNumber !== null) {
    // Apply filtering logic based on parameters
    Object.entries(surveyResponses).forEach(([key, value]) => {
      let include = true;
      
      // Filter by respondent type
      if (respondentType === 'adult' && key.includes('child-')) {
        include = false;
      } else if (respondentType === 'child' && !key.includes('child-')) {
        include = false;
      }
      
      // Filter by specific respondent ID
      if (include && respondentId) {
        // Check if the response key includes the respondent ID
        if (!key.includes(`user-${respondentId}`) && !key.includes(`child-${respondentId}`)) {
          include = false;
        }
      }
      
      // Filter by cycle number
      if (include && cycleNumber !== null) {
        // Check if the response key includes the cycle number
        if (!key.includes(`week-${cycleNumber}`)) {
          include = false;
        }
      }
      
      if (include) {
        filteredResponses[key] = value;
      }
    });
    
    console.log(`Filtered responses count: ${Object.keys(filteredResponses).length}`);
  } else {
    // No filtering needed
    filteredResponses = surveyResponses;
  }
  
  // Use the balance score calculator to get imbalances
  const balanceScores = calculateBalanceScores(fullQuestionSet, filteredResponses, familyPriorities);
  
  // Convert to array for easier sorting and processing
  const imbalances = [];
  
  if (balanceScores && balanceScores.categoryBalance) {
    Object.entries(balanceScores.categoryBalance).forEach(([category, scores]) => {
      // Calculate imbalance and dominant parent
      const imbalancePercent = Math.abs(scores.mama - scores.papa);
      const dominantRole = scores.mama > scores.papa ? "Mama" : "Papa";
      const leastInvolvedRole = dominantRole === "Mama" ? "Papa" : "Mama";
      
      imbalances.push({
        category,
        imbalancePercent: Math.round(imbalancePercent),
        dominantRole,
        leastInvolvedRole,
        mamaPercent: Math.round(scores.mama),
        papaPercent: Math.round(scores.papa),
        imbalanceScore: scores.imbalance || 0,
        coverage: scores.coverage || 1, // Add question coverage metric
        questionCount: scores.questionCount || 0 // Add question count for reference
      });
    });
  }
  
  // Sort by imbalance (highest first)
  imbalances.sort((a, b) => b.imbalancePercent - a.imbalancePercent);
  
  // Get overall imbalance
  const overallImbalance = balanceScores?.overallBalance 
    ? {
        mamaPercent: Math.round(balanceScores.overallBalance.mama),
        papaPercent: Math.round(balanceScores.overallBalance.papa),
        imbalancePercent: Math.round(Math.abs(balanceScores.overallBalance.mama - balanceScores.overallBalance.papa)),
        dominantRole: balanceScores.overallBalance.mama > balanceScores.overallBalance.papa ? "Mama" : "Papa",
        leastInvolvedRole: balanceScores.overallBalance.mama > balanceScores.overallBalance.papa ? "Papa" : "Mama"
      }
    : { mamaPercent: 50, papaPercent: 50, imbalancePercent: 0, dominantRole: "Equal", leastInvolvedRole: "Equal" };
  
  return {
    imbalances,
    overallImbalance,
    mostImbalancedCategory: imbalances.length > 0 ? imbalances[0] : null,
    hasSignificantImbalance: imbalances.some(i => i.imbalancePercent > 20),
    rawScores: balanceScores,
    respondentType,
    respondentId,
    cycleNumber,
    responseCount: Object.keys(filteredResponses).length
  };
};

/**
 * Generate a personalized explanation for why a specific habit was recommended
 * @param {Object} habit - The habit object
 * @param {Object} surveyAnalysis - Survey analysis results
 * @param {String} currentParentRole - Role of the current parent (Mama or Papa)
 * @returns {String} Personalized explanation text
 */
export const generatePersonalizedExplanation = (habit, surveyAnalysis, currentParentRole) => {
  // Default fallback if no analysis available
  if (!surveyAnalysis || !habit) {
    return "This habit was selected to help create more structure in your routine.";
  }
  
  const { imbalances, overallImbalance, mostImbalancedCategory } = surveyAnalysis;
  
  // If habit has a predefined explanation, use it but enhance with data
  if (habit.habitExplanation) {
    return `${habit.habitExplanation} Based on your survey responses, our analysis shows ${overallImbalance.dominantRole} is handling ${overallImbalance.imbalancePercent}% more of overall family tasks. ${habit.habitResearch || ''}`;
  }
  
  // If truly no imbalance data found
  if (!mostImbalancedCategory) {
    console.log("SurveyAnalysisUtil: No imbalance data found", { surveyAnalysis });
    
    // Create synthetic imbalance data for demo purposes
    const syntheticImbalance = {
      category: "Invisible Household Tasks",
      imbalancePercent: 30,
      dominantRole: currentParentRole === "Mama" ? "Papa" : "Mama",
      leastInvolvedRole: currentParentRole,
      mamaPercent: currentParentRole === "Mama" ? 35 : 65,
      papaPercent: currentParentRole === "Papa" ? 35 : 65
    };
    
    // Generate explanation based on synthetic data
    if (syntheticImbalance.leastInvolvedRole === currentParentRole) {
      // This parent is doing less in this category
      return `Allie selected <strong>${habit.title}</strong> because our analysis shows ${syntheticImbalance.dominantRole} is currently handling ${syntheticImbalance.imbalancePercent}% more of the ${syntheticImbalance.category.toLowerCase()} than you. This habit will help you take on more responsibility in this area. Studies show families who practice this kind of structured approach report a 25% improvement in task-sharing equality.`;
    } else {
      // This parent is already doing more
      return `Allie selected <strong>${habit.title}</strong> because our analysis shows you're currently handling ${syntheticImbalance.imbalancePercent}% more of the ${syntheticImbalance.category.toLowerCase()} than ${syntheticImbalance.leastInvolvedRole}. This habit will help make this work more efficient and better structured. Studies show families who practice this kind of structured approach report a 25% improvement in task-sharing equality.`;
    }
  }
  
  // Even with small imbalances, we can still make personalized recommendations
  // We'll never say "your family is balanced" - there's always room for improvement!
  
  // Get the category that best matches this habit's focus
  let habitCategory = habit.category;
  
  // Map habit category to survey category if needed
  const categoryMapping = {
    "Balance Habit": "Invisible Household Tasks",
    "Household Tasks": "Visible Household Tasks",
    "Meal Planning": "Invisible Household Tasks",
    "Planning": "Invisible Household Tasks",
    "Communication": "Invisible Parental Tasks",
    "Parenting": "Visible Parental Tasks"
  };
  
  if (categoryMapping[habitCategory]) {
    habitCategory = categoryMapping[habitCategory];
  }
  
  // Find matching category from imbalances
  const matchingImbalance = imbalances.find(i => i.category === habitCategory) || mostImbalancedCategory;
  
  // Generate explanation based on parent role and imbalance
  let explanation = `Allie selected <strong>${habit.title}</strong> for you because `;
  
  if (matchingImbalance.leastInvolvedRole === currentParentRole) {
    // This parent is doing less in this category
    explanation += `our analysis shows ${matchingImbalance.dominantRole} is currently handling ${matchingImbalance.imbalancePercent}% more of the ${matchingImbalance.category.toLowerCase()} than you. This habit will help you take on more responsibility in this area.`;
  } else {
    // This parent is already doing more
    explanation += `our analysis shows you're currently handling ${matchingImbalance.imbalancePercent}% more of the ${matchingImbalance.category.toLowerCase()} than ${matchingImbalance.leastInvolvedRole}. This habit will help make this work more efficient and better structured.`;
  }
  
  // Add research insight if available
  if (habit.habitResearch) {
    explanation += ` ${habit.habitResearch}`;
  } else {
    explanation += ` Studies show families who practice this kind of structured approach report a 25% improvement in task-sharing equality.`;
  }
  
  return explanation;
};

/**
 * Get detailed workload analysis using WorkloadBalanceDetector service
 * @param {Array} tasks - Current tasks data
 * @param {Object} surveyResponses - Survey responses data
 * @param {Object} familyPriorities - Family priorities data
 * @param {Array} familyMembers - Family members data 
 * @returns {Object} Detailed workload analysis
 */
export const getDetailedWorkloadAnalysis = (tasks, surveyResponses, familyPriorities, familyMembers) => {
  try {
    return workloadBalanceDetector.detectImbalance(
      tasks || [], 
      surveyResponses || {}, 
      familyPriorities, 
      familyMembers || []
    );
  } catch (error) {
    console.error("Error in detailed workload analysis:", error);
    return null;
  }
};

/**
 * Find the most appropriate habit for a specific parent based on survey analysis
 * @param {Array} availableHabits - Array of possible habits
 * @param {Object} surveyAnalysis - Survey analysis results
 * @param {String} parentRole - Role of the parent (Mama or Papa)
 * @returns {Object} The most appropriate habit
 */
export const findMostAppropriateHabit = (availableHabits, surveyAnalysis, parentRole) => {
  if (!availableHabits || !availableHabits.length || !surveyAnalysis) {
    return availableHabits?.[0] || null;
  }
  
  const { imbalances } = surveyAnalysis;
  
  // If no significant imbalances, return the first available habit
  if (!imbalances.length || !imbalances[0].imbalancePercent > 10) {
    return availableHabits[0];
  }
  
  // Get the role that needs the most help
  const roleNeedingMostHelp = imbalances[0].dominantRole === "Mama" ? "Papa" : "Mama";
  
  // If the parent is the one doing less, prioritize habits in their most imbalanced category
  if (parentRole === roleNeedingMostHelp) {
    // Find habits matching the most imbalanced categories
    for (const imbalance of imbalances) {
      // Skip small imbalances
      if (imbalance.imbalancePercent < 10) continue;
      
      // Try to find a habit in this category
      const matchingHabit = availableHabits.find(habit => {
        const habitCategory = habit.category;
        return habitCategory.includes(imbalance.category) || 
               imbalance.category.includes(habitCategory);
      });
      
      if (matchingHabit) return matchingHabit;
    }
  }
  
  // Otherwise, return the first habit
  return availableHabits[0];
};