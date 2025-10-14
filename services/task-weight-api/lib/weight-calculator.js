/**
 * Task Weight Calculator Library
 * 
 * Enhanced version of the original TaskWeightCalculator with additional features:
 * - Version-based calculation methods
 * - Family profile customization
 * - Advanced weighting factors
 * - Seasonal/temporal adjustments
 */

const logger = require('./logger');
const versionManager = require('./version-manager');

// Base multiplier values
const FREQUENCY_MULTIPLIERS = {
  'daily': 1.5,
  'several': 1.3, // several times weekly
  'weekly': 1.2,
  'monthly': 1.0,
  'quarterly': 0.8,
  'yearly': 0.7,
  'seasonal': 0.9
};

const INVISIBILITY_MULTIPLIERS = {
  'highly': 1.0, // highly visible
  'partially': 1.2,
  'mostly': 1.35,
  'completely': 1.5
};

const EMOTIONAL_LABOR_MULTIPLIERS = {
  'minimal': 1.0,
  'low': 1.1,
  'moderate': 1.2,
  'high': 1.3,
  'extreme': 1.4
};

const RESEARCH_IMPACT_MULTIPLIERS = {
  'high': 1.3,
  'medium': 1.15,
  'standard': 1.0
};

const CHILD_DEVELOPMENT_MULTIPLIERS = {
  'high': 1.25,
  'moderate': 1.15,
  'limited': 1.0
};

const PRIORITY_MULTIPLIERS = {
  'highest': 1.5,
  'secondary': 1.3,
  'tertiary': 1.1,
  'none': 1.0
};

// New multipliers for enhanced system
const TIME_REQUIRED_MULTIPLIERS = {
  'minimal': 0.8,
  'short': 0.9,
  'moderate': 1.0,
  'extended': 1.2,
  'significant': 1.4
};

const SKILL_COMPLEXITY_MULTIPLIERS = {
  'simple': 0.9,
  'basic': 1.0,
  'moderate': 1.1,
  'complex': 1.2,
  'specialized': 1.3
};

const LIFE_STAGE_MULTIPLIERS = {
  'infant': {
    'feeding': 1.4,
    'sleep': 1.3,
    'health': 1.3,
    'development': 1.2
  },
  'toddler': {
    'safety': 1.4,
    'feeding': 1.2,
    'development': 1.3,
    'socialization': 1.1
  },
  'preschool': {
    'education': 1.3,
    'socialization': 1.2,
    'emotional': 1.3,
    'independence': 1.2
  },
  'school_age': {
    'education': 1.4,
    'activities': 1.3,
    'independence': 1.1,
    'friends': 1.2
  },
  'teen': {
    'independence': 1.3,
    'guidance': 1.4,
    'academic': 1.3,
    'emotional': 1.4
  }
};

// Cultural context multipliers
const CULTURAL_CONTEXT_ADJUSTMENTS = {
  'collectivist': {
    'family_support': 0.8,
    'elder_care': 1.2,
    'communal_activities': 1.1
  },
  'individualist': {
    'personal_space': 1.2,
    'independence_training': 1.3,
    'scheduled_activities': 1.1
  }
};

// Category base weights
const CATEGORY_WEIGHTS = {
  'Visible Household Tasks': 1.0,
  'Invisible Household Tasks': 1.2,
  'Visible Parental Tasks': 1.1,
  'Invisible Parental Tasks': 1.5,
  'Administrative Tasks': 1.3,
  'Financial Tasks': 1.2,
  'Emotional Support': 1.4,
  'Healthcare Management': 1.3,
  'Education Support': 1.2,
  'Social Management': 1.1
};

// ------------------- Calculation Methods -------------------

/**
 * Version 1.0 weight calculation (original)
 * @param {Object} task - Task to calculate weight for
 * @param {Object} familyPriorities - Family priority settings
 * @returns {number} - Calculated weight
 */
function calculateWeightV1(task, familyPriorities) {
  // Get base weight from task
  const baseWeight = task.baseWeight || 3; // Default to middle value if not set
    
  // Get multipliers
  const frequencyMultiplier = FREQUENCY_MULTIPLIERS[task.frequency] || 1.0;
  const invisibilityMultiplier = INVISIBILITY_MULTIPLIERS[task.invisibility] || 1.0;
  const emotionalLaborMultiplier = EMOTIONAL_LABOR_MULTIPLIERS[task.emotionalLabor] || 1.0;
  const researchImpactMultiplier = RESEARCH_IMPACT_MULTIPLIERS[task.researchImpact] || 1.0;
  const childDevelopmentMultiplier = CHILD_DEVELOPMENT_MULTIPLIERS[task.childDevelopment] || 1.0;
    
  // Determine priority multiplier
  let priorityMultiplier = PRIORITY_MULTIPLIERS.none;
  if (familyPriorities) {
    if (familyPriorities.highestPriority === task.category) {
      priorityMultiplier = PRIORITY_MULTIPLIERS.highest;
    } else if (familyPriorities.secondaryPriority === task.category) {
      priorityMultiplier = PRIORITY_MULTIPLIERS.secondary;
    } else if (familyPriorities.tertiaryPriority === task.category) {
      priorityMultiplier = PRIORITY_MULTIPLIERS.tertiary;
    }
  }
    
  // Calculate the total weight
  const totalWeight = baseWeight * 
    frequencyMultiplier * 
    invisibilityMultiplier * 
    emotionalLaborMultiplier * 
    researchImpactMultiplier * 
    childDevelopmentMultiplier * 
    priorityMultiplier;
        
  return totalWeight;
}

/**
 * Version 2.0 weight calculation (enhanced)
 * Adds time, complexity, and seasonality considerations
 */
function calculateWeightV2(task, familyPriorities, familyProfile = null) {
  // Start with V1 calculation as base
  let totalWeight = calculateWeightV1(task, familyPriorities);
  
  // Add new multipliers
  const timeRequiredMultiplier = TIME_REQUIRED_MULTIPLIERS[task.timeRequired] || 1.0;
  const skillComplexityMultiplier = SKILL_COMPLEXITY_MULTIPLIERS[task.complexity] || 1.0;
  
  // Apply new multipliers
  totalWeight *= timeRequiredMultiplier * skillComplexityMultiplier;
  
  // Apply temporal adjustment (season-based)
  if (task.seasonal === true) {
    // Check current season and task's relevant season
    const currentSeason = getCurrentSeason();
    if (task.relevantSeason === currentSeason) {
      totalWeight *= 1.3; // Increase weight if task is relevant this season
    } else {
      totalWeight *= 0.7; // Decrease weight if task is out of season
    }
  }
  
  // Apply family profile adjustments if available
  if (familyProfile && familyProfile.taskAdjustments) {
    // Look for specific task adjustment
    const taskAdjustment = familyProfile.taskAdjustments.find(
      adj => adj.taskId === task.id || adj.taskType === task.type
    );
    
    if (taskAdjustment) {
      totalWeight *= taskAdjustment.multiplier;
    }
    
    // Apply life stage adjustments
    if (familyProfile.childrenLifeStages && task.childRelated) {
      let lifeStageMultiplier = 1.0;
      
      // Check each child's life stage
      familyProfile.childrenLifeStages.forEach(child => {
        const lifeStage = child.lifeStage;
        const taskCategory = task.childCategory || 'general';
        
        if (LIFE_STAGE_MULTIPLIERS[lifeStage] && 
            LIFE_STAGE_MULTIPLIERS[lifeStage][taskCategory]) {
          // Use the highest multiplier if multiple children
          lifeStageMultiplier = Math.max(
            lifeStageMultiplier, 
            LIFE_STAGE_MULTIPLIERS[lifeStage][taskCategory]
          );
        }
      });
      
      totalWeight *= lifeStageMultiplier;
    }
    
    // Apply cultural context adjustments
    if (familyProfile.culturalContext && task.culturalCategory) {
      const culturalContext = familyProfile.culturalContext;
      if (CULTURAL_CONTEXT_ADJUSTMENTS[culturalContext] && 
          CULTURAL_CONTEXT_ADJUSTMENTS[culturalContext][task.culturalCategory]) {
        totalWeight *= CULTURAL_CONTEXT_ADJUSTMENTS[culturalContext][task.culturalCategory];
      }
    }
  }
  
  return totalWeight;
}

/**
 * Determine current season based on date and hemisphere
 * @returns {string} season name
 */
function getCurrentSeason() {
  const now = new Date();
  const month = now.getMonth();
  
  // Default to northern hemisphere
  let hemisphere = 'northern';
  
  // TODO: Improve to detect hemisphere based on user location
  
  if (hemisphere === 'northern') {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  } else {
    if (month >= 2 && month <= 4) return 'fall';
    if (month >= 5 && month <= 7) return 'winter';
    if (month >= 8 && month <= 10) return 'spring';
    return 'summer';
  }
}

/**
 * Calculate task weight using the specified version (or latest)
 * @param {Object} task - Task to calculate weight for
 * @param {Object} familyPriorities - Family priority settings
 * @param {Object} familyProfile - Family specific profile data
 * @param {string} version - Calculation version to use
 * @returns {Object} - Weight result with metadata
 */
async function calculateTaskWeight(task, familyPriorities, familyProfile = null, version = 'latest') {
  try {
    // Determine which calculation version to use
    let calculationVersion = version;
    if (version === 'latest') {
      calculationVersion = await versionManager.getLatestVersion();
    }
    
    // Select calculation method based on version
    let weightValue;
    switch (calculationVersion) {
      case '1.0':
        weightValue = calculateWeightV1(task, familyPriorities);
        break;
      case '2.0':
        weightValue = calculateWeightV2(task, familyPriorities, familyProfile);
        break;
      default:
        // Default to latest implemented version
        weightValue = calculateWeightV2(task, familyPriorities, familyProfile);
        break;
    }
    
    // Round to 2 decimal places for consistent presentation
    const roundedWeight = Math.round(weightValue * 100) / 100;
    
    // Return weight with metadata
    return {
      taskId: task.id,
      weight: roundedWeight,
      calculationVersion: calculationVersion,
      calculationDate: new Date().toISOString(),
      factors: {
        baseWeight: task.baseWeight || 3,
        frequency: task.frequency,
        invisibility: task.invisibility,
        emotionalLabor: task.emotionalLabor,
        category: task.category
      }
    };
  } catch (error) {
    logger.error('Error calculating task weight', { error: error.message, task: task.id });
    throw new Error(`Failed to calculate weight: ${error.message}`);
  }
}

/**
 * Calculate family balance scores based on survey responses
 * Enhanced from original implementation with more sophisticated weighting
 */
async function calculateBalanceScores(fullQuestionSet, responses, priorities = null, version = 'latest') {
  try {
    // Determine which calculation version to use
    let calculationVersion = version;
    if (version === 'latest') {
      calculationVersion = await versionManager.getLatestVersion();
    }
    
    // Define expanded categories
    const categories = {
      "Visible Household Tasks": { mama: 0, papa: 0, neutral: 0, total: 0, questionCount: 0 },
      "Invisible Household Tasks": { mama: 0, papa: 0, neutral: 0, total: 0, questionCount: 0 },
      "Visible Parental Tasks": { mama: 0, papa: 0, neutral: 0, total: 0, questionCount: 0 },
      "Invisible Parental Tasks": { mama: 0, papa: 0, neutral: 0, total: 0, questionCount: 0 },
      "Administrative Tasks": { mama: 0, papa: 0, neutral: 0, total: 0, questionCount: 0 },
      "Financial Tasks": { mama: 0, papa: 0, neutral: 0, total: 0, questionCount: 0 },
      "Emotional Support": { mama: 0, papa: 0, neutral: 0, total: 0, questionCount: 0 },
      "Healthcare Management": { mama: 0, papa: 0, neutral: 0, total: 0, questionCount: 0 },
      "Education Support": { mama: 0, papa: 0, neutral: 0, total: 0, questionCount: 0 },
      "Social Management": { mama: 0, papa: 0, neutral: 0, total: 0, questionCount: 0 }
    };
    
    // Start with base category weights
    const categoryWeights = { ...CATEGORY_WEIGHTS };
    
    // If priorities provided, adjust category weights
    if (priorities) {
      if (priorities.highestPriority && categories[priorities.highestPriority]) {
        categoryWeights[priorities.highestPriority] = 1.5;
      }
      if (priorities.secondaryPriority && categories[priorities.secondaryPriority]) {
        categoryWeights[priorities.secondaryPriority] = 1.3;
      }
      if (priorities.tertiaryPriority && categories[priorities.tertiaryPriority]) {
        categoryWeights[priorities.tertiaryPriority] = 1.1;
      }
    }
    
    // Track all questions that could have been asked vs. ones actually asked
    const possibleQuestionsByCategory = {};
    for (const category in categories) {
      possibleQuestionsByCategory[category] = fullQuestionSet.filter(q => q.category === category).length;
    }
    
    // Process all responses
    Object.entries(responses).forEach(([key, value]) => {
      // Skip non-relevant responses
      if (!value || (value !== 'Mama' && value !== 'Papa' && value !== 'Neutral' && 
                   value !== 'Both' && value !== 'Neither')) {
        return;
      }
      
      // Extract the question ID
      let questionId = key;
      // Handle prefixed question IDs like "week-1-user-123-q45"
      if (key.includes('-q')) {
        questionId = 'q' + key.split('-q')[1];
      } else if (key.includes('-')) {
        // Try to extract just the question part
        const parts = key.split('-');
        questionId = parts[parts.length - 1];
      }
      
      // Find the question in the full set
      const question = fullQuestionSet.find(q => q.id === questionId);
      
      if (question && question.category && categories[question.category]) {
        const category = question.category;
        
        // Get task weight - use the advanced calculation in V2.0+
        let weight;
        if (calculationVersion === '1.0') {
          weight = parseFloat(question.totalWeight || 1);
        } else {
          // For V2.0+, use the more sophisticated calculation
          // Convert to task format for weight calculation
          const taskFormat = {
            id: question.id,
            baseWeight: question.baseWeight || 3,
            frequency: question.frequency || 'weekly',
            invisibility: question.invisibility || 'partially',
            emotionalLabor: question.emotionalLabor || 'moderate',
            category: question.category,
            timeRequired: question.timeRequired || 'moderate',
            complexity: question.complexity || 'basic'
          };
          
          // Use synchronous calculation to avoid promises in forEach
          const weightResult = calculateWeightV2(taskFormat, priorities);
          weight = weightResult;
        }
        
        // Track that we've seen a question from this category
        categories[category].questionCount++;
        
        // Add weighted score based on response
        if (value === 'Mama') {
          categories[category].mama += weight;
          categories[category].total += weight;
        } else if (value === 'Papa') {
          categories[category].papa += weight;
          categories[category].total += weight;
        } else if (value === 'Both' || value === 'Neutral' || value === 'Neither') {
          // For neutral responses, split the weight evenly
          categories[category].mama += weight / 2;
          categories[category].papa += weight / 2;
          categories[category].neutral += weight;
          categories[category].total += weight;
        }
      }
    });
    
    // Calculate percentages for each category, normalizing for question count
    const categoryBalance = {};
    
    for (const [category, data] of Object.entries(categories)) {
      // Only include categories with responses
      if (data.total > 0) {
        const mamaPercent = (data.mama / data.total) * 100;
        const papaPercent = (data.papa / data.total) * 100;
        const neutralPercent = (data.neutral / data.total) * 100;
        
        // Calculate normalized imbalance - adjust for question distribution
        const questionCoverage = data.questionCount / (possibleQuestionsByCategory[category] || 1);
        const normalizedImbalance = Math.abs(mamaPercent - papaPercent) * 
                                   (questionCoverage >= 0.5 ? 1 : 0.5 + questionCoverage);
        
        // Add burnout risk indicator (new in v2.0+)
        let burnoutRisk = 'low';
        if (calculationVersion !== '1.0') {
          if (mamaPercent > 75) {
            burnoutRisk = mamaPercent > 90 ? 'severe' : 'high';
          } else if (papaPercent > 75) {
            burnoutRisk = papaPercent > 90 ? 'severe' : 'high';
          } else if (Math.abs(mamaPercent - papaPercent) > 40) {
            burnoutRisk = 'moderate';
          }
        }
        
        categoryBalance[category] = {
          mama: mamaPercent,
          papa: papaPercent,
          neutral: neutralPercent,
          imbalance: normalizedImbalance,
          questionCount: data.questionCount,
          possibleQuestions: possibleQuestionsByCategory[category] || 0,
          coverage: questionCoverage,
          burnoutRisk: burnoutRisk
        };
      }
    }
    
    // Calculate overall weighted balance across all categories
    let totalWeight = 0;
    let weightedMama = 0;
    let weightedPapa = 0;
    let weightedNeutral = 0;
    let weightedImbalance = 0;
    
    for (const [category, data] of Object.entries(categoryBalance)) {
      const catWeight = categoryWeights[category] || 1;
      const questionWeight = data.questionCount;
      const combinedWeight = catWeight * questionWeight;
      
      weightedMama += data.mama * combinedWeight;
      weightedPapa += data.papa * combinedWeight;
      weightedNeutral += data.neutral * combinedWeight;
      weightedImbalance += data.imbalance * combinedWeight;
      totalWeight += combinedWeight;
    }
    
    const overallBalance = totalWeight > 0 ? {
      mama: weightedMama / totalWeight,
      papa: weightedPapa / totalWeight,
      neutral: weightedNeutral / totalWeight,
      imbalance: weightedImbalance / totalWeight,
      // Calculate overall burnout risk in v2.0+
      burnoutRisk: calculationVersion !== '1.0' ? calculateBurnoutRisk(weightedMama / totalWeight, weightedPapa / totalWeight) : 'unknown'
    } : { mama: 50, papa: 50, neutral: 0, imbalance: 0, burnoutRisk: 'unknown' };
    
    return {
      categoryBalance,
      overallBalance,
      calculationVersion,
      calculationDate: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error calculating balance scores', { error: error.message });
    throw new Error(`Failed to calculate balance scores: ${error.message}`);
  }
}

/**
 * Calculate burnout risk based on workload distribution
 */
function calculateBurnoutRisk(mamaPercent, papaPercent) {
  const imbalance = Math.abs(mamaPercent - papaPercent);
  
  if (imbalance > 50) return 'severe';
  if (imbalance > 35) return 'high';
  if (imbalance > 20) return 'moderate';
  if (imbalance > 10) return 'low';
  return 'minimal';
}

module.exports = {
  calculateTaskWeight,
  calculateBalanceScores,
  // Export internal methods for testing
  _calculateWeightV1: calculateWeightV1,
  _calculateWeightV2: calculateWeightV2
};