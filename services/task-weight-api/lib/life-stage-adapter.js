/**
 * Life Stage Adaptation System
 * 
 * This module provides dynamic family weighting adjustments based on life stages
 * of children and family transitions, ensuring weights reflect the current reality
 * of family responsibilities.
 */

const admin = require('firebase-admin');
const logger = require('./logger');
const dataStorage = require('./data-storage');

// ------------------- Life Stage Models -------------------

// Child life stages and their age ranges
const CHILD_LIFE_STAGES = {
  INFANT: {
    name: 'infant',
    minAge: 0,
    maxAge: 1.99,
    description: 'Babies under 2 years old'
  },
  TODDLER: {
    name: 'toddler',
    minAge: 2,
    maxAge: 4.99,
    description: 'Children 2-4 years old'
  },
  PRESCHOOL: {
    name: 'preschool',
    minAge: 5,
    maxAge: 6.99,
    description: 'Children 5-6 years old'
  },
  SCHOOL_AGE: {
    name: 'school_age',
    minAge: 7,
    maxAge: 12.99,
    description: 'Children 7-12 years old'
  },
  TEEN: {
    name: 'teen',
    minAge: 13,
    maxAge: 18.99,
    description: 'Teenagers 13-18 years old'
  },
  YOUNG_ADULT: {
    name: 'young_adult',
    minAge: 19,
    maxAge: 24.99,
    description: 'Young adults 19-24 years old'
  }
};

// Key transition periods
const TRANSITION_PERIODS = {
  NEWBORN: 'newborn_transition',
  STARTING_CHILDCARE: 'childcare_transition',
  STARTING_SCHOOL: 'school_transition',
  STARTING_MIDDLE_SCHOOL: 'middle_school_transition',
  STARTING_HIGH_SCHOOL: 'high_school_transition',
  COLLEGE_TRANSITION: 'college_transition',
  EMPTY_NEST: 'empty_nest_transition'
};

// Life stage task weight multipliers
const LIFE_STAGE_MULTIPLIERS = {
  // Infant stage task weights
  infant: {
    'Sleep Management': 1.5,
    'Feeding': 1.5,
    'Physical Care': 1.4,
    'Health Monitoring': 1.3,
    'Emotional Bonding': 1.2,
    'Development Support': 1.1,
    'Household Management': 1.3, // Higher due to less time
    'Social Activities': 0.7,    // Lower priority during infant stage
    'Personal Time': 0.7,        // Reduced during infant stage
    'Career Development': 0.8    // Often reduced during infant period
  },
  
  // Toddler stage task weights
  toddler: {
    'Safety Management': 1.5,
    'Emotional Development': 1.4,
    'Routine Establishment': 1.3,
    'Social Skills': 1.2,
    'Physical Activity': 1.3,
    'Nutrition Management': 1.3,
    'Behavioral Guidance': 1.4,
    'Household Management': 1.2,
    'Social Activities': 0.9,
    'Personal Time': 0.8
  },
  
  // Preschool stage task weights
  preschool: {
    'Early Education': 1.4,
    'Social Development': 1.3,
    'Independence Skills': 1.3,
    'Creative Activities': 1.2,
    'School Preparation': 1.4,
    'Emotional Coaching': 1.3,
    'Communication Skills': 1.3,
    'Household Management': 1.1,
    'Social Activities': 1.0,
    'Personal Time': 0.9
  },
  
  // School age task weights
  school_age: {
    'Academic Support': 1.4,
    'Extracurricular Activities': 1.3,
    'Friend Management': 1.2,
    'Transportation': 1.3,
    'Life Skills Teaching': 1.2,
    'Technology Management': 1.2,
    'Sports/Activities': 1.3,
    'Household Management': 1.0,
    'Social Activities': 1.1,
    'Personal Time': 1.0
  },
  
  // Teen stage task weights
  teen: {
    'Academic Guidance': 1.3,
    'Emotional Support': 1.4,
    'Independence Fostering': 1.3,
    'College/Future Planning': 1.4,
    'Social Navigation': 1.2,
    'Identity Development': 1.2,
    'Driving/Transportation': 1.3,
    'Boundaries Setting': 1.3,
    'Household Management': 1.0,
    'Social Activities': 1.2,
    'Personal Time': 1.1
  },
  
  // Young adult stage task weights
  young_adult: {
    'Career Guidance': 1.2,
    'Life Skills Support': 1.3,
    'Financial Education': 1.4,
    'Emotional Support': 1.3,
    'Independence Support': 1.2,
    'Relationship Guidance': 1.1,
    'Household Management': 0.9,
    'Social Activities': 1.2,
    'Personal Time': 1.2,
    'Career Development': 1.2
  }
};

// Weight adjustments for transition periods
const TRANSITION_MULTIPLIERS = {
  [TRANSITION_PERIODS.NEWBORN]: {
    'Sleep Management': 1.8,
    'Feeding': 1.7,
    'Physical Care': 1.6,
    'Health Monitoring': 1.5,
    'Partner Support': 1.6,
    'Household Management': 1.5,
    'Outside Support': 1.4,
    'Self-Care': 1.5
  },
  
  [TRANSITION_PERIODS.STARTING_CHILDCARE]: {
    'Childcare Logistics': 1.5,
    'Emotional Adjustment': 1.4,
    'New Routines': 1.3,
    'Health Management': 1.3,
    'Work Balance': 1.4
  },
  
  [TRANSITION_PERIODS.STARTING_SCHOOL]: {
    'School Preparation': 1.5,
    'Educational Support': 1.4,
    'Social Adjustment': 1.3,
    'New Routines': 1.3,
    'After-School Care': 1.4
  },
  
  [TRANSITION_PERIODS.STARTING_MIDDLE_SCHOOL]: {
    'Academic Support': 1.4,
    'Social Navigation': 1.5,
    'Independence Training': 1.3,
    'Emotional Support': 1.4,
    'Technology Management': 1.3
  },
  
  [TRANSITION_PERIODS.STARTING_HIGH_SCHOOL]: {
    'Academic Planning': 1.4,
    'Future Discussions': 1.3,
    'Increased Independence': 1.3,
    'Peer Pressure Support': 1.4,
    'Transportation Logistics': 1.3
  },
  
  [TRANSITION_PERIODS.COLLEGE_TRANSITION]: {
    'College Preparation': 1.5,
    'Financial Planning': 1.4,
    'Life Skills Training': 1.4,
    'Emotional Support': 1.3,
    'Logistics Support': 1.3
  },
  
  [TRANSITION_PERIODS.EMPTY_NEST]: {
    'Relationship Rekindling': 1.4,
    'Personal Rediscovery': 1.3,
    'Home Reorganization': 1.2,
    'Long-distance Support': 1.3,
    'New Routines': 1.2
  }
};

// ------------------- Core Life Stage Adaptation Functions -------------------

/**
 * Analyze a family's life stages based on children's ages
 * @param {string} familyId - Family identifier
 * @returns {Object} Life stage analysis
 */
async function analyzeLifeStages(familyId) {
  try {
    logger.info('Analyzing family life stages', { familyId });
    
    // Get family data
    const familyDoc = await admin.firestore()
      .collection('families')
      .doc(familyId)
      .get();
    
    if (!familyDoc.exists) {
      throw new Error(`Family with ID ${familyId} not found`);
    }
    
    const familyData = familyDoc.data();
    
    // Check if family has children
    if (!familyData.children || !Array.isArray(familyData.children) || familyData.children.length === 0) {
      logger.info('Family has no children recorded', { familyId });
      return {
        familyId,
        hasChildren: false,
        lifeStages: [],
        transitions: [],
        weightAdjustments: {}
      };
    }
    
    // Analyze each child's life stage
    const childLifeStages = [];
    const now = new Date();
    
    for (const child of familyData.children) {
      // Skip if no age data
      if (child.birthDate === undefined && child.age === undefined) {
        continue;
      }
      
      // Calculate child's age
      let age;
      if (child.birthDate) {
        const birthDate = new Date(child.birthDate);
        const ageDiff = now - birthDate;
        age = ageDiff / (1000 * 60 * 60 * 24 * 365.25); // Convert to years
      } else {
        age = parseFloat(child.age);
      }
      
      // Determine life stage
      const lifeStage = determineChildLifeStage(age);
      
      // Add to results
      childLifeStages.push({
        childId: child.id,
        name: child.name,
        age,
        lifeStage: lifeStage.name,
        stageRange: `${lifeStage.minAge}-${lifeStage.maxAge} years`,
        description: lifeStage.description
      });
    }
    
    // Identify transitions
    const transitions = identifyTransitions(familyData, childLifeStages);
    
    // Calculate weight adjustments for these life stages and transitions
    const weightAdjustments = calculateLifeStageAdjustments(childLifeStages, transitions);
    
    const result = {
      familyId,
      hasChildren: true,
      childCount: childLifeStages.length,
      lifeStages: childLifeStages,
      transitions,
      weightAdjustments,
      analyzedAt: new Date().toISOString()
    };
    
    // Store the analysis
    await storeLifeStageAnalysis(familyId, result);
    
    logger.info('Completed life stage analysis', { 
      familyId, 
      childCount: childLifeStages.length,
      transitionCount: transitions.length
    });
    
    return result;
  } catch (error) {
    logger.error('Error analyzing life stages', { error: error.message, familyId });
    throw error;
  }
}

/**
 * Determine a child's life stage based on age
 * @param {number} age - Child's age in years
 * @returns {Object} Life stage information
 */
function determineChildLifeStage(age) {
  if (age < 0) {
    // Invalid age
    return {
      name: 'unknown',
      minAge: null,
      maxAge: null,
      description: 'Unknown life stage due to invalid age'
    };
  }
  
  // Find matching life stage
  for (const stage of Object.values(CHILD_LIFE_STAGES)) {
    if (age >= stage.minAge && age <= stage.maxAge) {
      return stage;
    }
  }
  
  // Default for adults older than our defined stages
  return {
    name: 'adult',
    minAge: 25,
    maxAge: null,
    description: 'Adult over 25 years old'
  };
}

/**
 * Identify transition periods the family is experiencing
 * @param {Object} familyData - Family data
 * @param {Array} childLifeStages - Analyzed child life stages
 * @returns {Array} Active transitions
 */
function identifyTransitions(familyData, childLifeStages) {
  const transitions = [];
  const now = new Date();
  
  // Check for each child's transitions
  for (const child of childLifeStages) {
    // Check for age-based transitions
    if (child.age < 0.25) {
      transitions.push({
        type: TRANSITION_PERIODS.NEWBORN,
        childId: child.childId,
        name: child.name,
        description: 'Newborn transition period (first 3 months)',
        intensityLevel: 'high'
      });
    }
    
    if (child.age >= 2 && child.age <= 2.5) {
      transitions.push({
        type: TRANSITION_PERIODS.STARTING_CHILDCARE,
        childId: child.childId,
        name: child.name,
        description: 'Transition to childcare/preschool',
        intensityLevel: 'moderate'
      });
    }
    
    if (child.age >= 5 && child.age <= 5.5) {
      transitions.push({
        type: TRANSITION_PERIODS.STARTING_SCHOOL,
        childId: child.childId,
        name: child.name,
        description: 'Starting elementary school',
        intensityLevel: 'moderate'
      });
    }
    
    if (child.age >= 11 && child.age <= 11.5) {
      transitions.push({
        type: TRANSITION_PERIODS.STARTING_MIDDLE_SCHOOL,
        childId: child.childId,
        name: child.name,
        description: 'Starting middle school',
        intensityLevel: 'moderate'
      });
    }
    
    if (child.age >= 14 && child.age <= 14.5) {
      transitions.push({
        type: TRANSITION_PERIODS.STARTING_HIGH_SCHOOL,
        childId: child.childId,
        name: child.name,
        description: 'Starting high school',
        intensityLevel: 'moderate'
      });
    }
    
    if (child.age >= 18 && child.age <= 18.5) {
      transitions.push({
        type: TRANSITION_PERIODS.COLLEGE_TRANSITION,
        childId: child.childId,
        name: child.name,
        description: 'Transition to college/independent living',
        intensityLevel: 'high'
      });
    }
  }
  
  // Check for family-wide transitions
  const allChildrenOlderThan18 = childLifeStages.every(child => child.age >= 18);
  const anyChildLeftHomeRecently = familyData.children.some(child => 
    child.livingAtHome === false && 
    child.moveOutDate && 
    (now - new Date(child.moveOutDate)) / (1000 * 60 * 60 * 24) < 180 // Within 6 months
  );
  
  if (allChildrenOlderThan18 && anyChildLeftHomeRecently) {
    transitions.push({
      type: TRANSITION_PERIODS.EMPTY_NEST,
      description: 'Empty nest transition (all children moved out)',
      intensityLevel: 'high'
    });
  }
  
  return transitions;
}

/**
 * Calculate task weight adjustments based on life stages and transitions
 * @param {Array} childLifeStages - Children's life stages
 * @param {Array} transitions - Active family transitions
 * @returns {Object} Weight adjustments
 */
function calculateLifeStageAdjustments(childLifeStages, transitions) {
  const adjustments = {
    taskAdjustments: {},
    categoryAdjustments: {},
    transitionMultipliers: {}
  };
  
  // Process each child's life stage
  childLifeStages.forEach(child => {
    const stageName = child.lifeStage;
    
    // Skip if we don't have multipliers for this stage
    if (!LIFE_STAGE_MULTIPLIERS[stageName]) {
      return;
    }
    
    // Apply each task multiplier
    for (const [task, multiplier] of Object.entries(LIFE_STAGE_MULTIPLIERS[stageName])) {
      if (!adjustments.taskAdjustments[task]) {
        adjustments.taskAdjustments[task] = {
          multiplier: 1.0,
          contributors: []
        };
      }
      
      // Track current max multiplier
      const currentMultiplier = adjustments.taskAdjustments[task].multiplier;
      
      // Take the highest multiplier if multiple children affect this task
      if (multiplier > currentMultiplier) {
        adjustments.taskAdjustments[task].multiplier = multiplier;
      }
      
      // Track which child contributed to this adjustment
      adjustments.taskAdjustments[task].contributors.push({
        childId: child.childId,
        name: child.name,
        lifeStage: stageName,
        multiplier
      });
    }
    
    // Add category adjustments based on life stage
    switch (stageName) {
      case 'infant':
        adjustments.categoryAdjustments['Visible Parental Tasks'] = 1.3;
        adjustments.categoryAdjustments['Invisible Parental Tasks'] = 1.4;
        break;
      case 'toddler':
        adjustments.categoryAdjustments['Visible Parental Tasks'] = 1.2;
        adjustments.categoryAdjustments['Invisible Parental Tasks'] = 1.3;
        break;
      case 'preschool':
        adjustments.categoryAdjustments['Education Support'] = 1.2;
        break;
      case 'school_age':
        adjustments.categoryAdjustments['Education Support'] = 1.3;
        adjustments.categoryAdjustments['Social Management'] = 1.1;
        break;
      case 'teen':
        adjustments.categoryAdjustments['Emotional Support'] = 1.3;
        adjustments.categoryAdjustments['Education Support'] = 1.2;
        break;
    }
  });
  
  // Process transitions
  transitions.forEach(transition => {
    const transitionType = transition.type;
    
    // Skip if we don't have multipliers for this transition
    if (!TRANSITION_MULTIPLIERS[transitionType]) {
      return;
    }
    
    // Store transition multipliers
    if (!adjustments.transitionMultipliers[transitionType]) {
      adjustments.transitionMultipliers[transitionType] = {
        tasks: {},
        intensity: transition.intensityLevel || 'moderate',
        description: transition.description
      };
    }
    
    // Apply each transition task multiplier
    for (const [task, multiplier] of Object.entries(TRANSITION_MULTIPLIERS[transitionType])) {
      // Store in transition multipliers
      adjustments.transitionMultipliers[transitionType].tasks[task] = multiplier;
      
      // Apply to main task adjustments
      if (!adjustments.taskAdjustments[task]) {
        adjustments.taskAdjustments[task] = {
          multiplier: 1.0,
          contributors: []
        };
      }
      
      // Take the highest multiplier
      const currentMultiplier = adjustments.taskAdjustments[task].multiplier;
      if (multiplier > currentMultiplier) {
        adjustments.taskAdjustments[task].multiplier = multiplier;
      }
      
      // Track which transition contributed to this adjustment
      adjustments.taskAdjustments[task].contributors.push({
        transition: transitionType,
        description: transition.description,
        multiplier,
        childId: transition.childId,
        childName: transition.name
      });
    }
    
    // Add special category adjustments for certain transitions
    switch (transitionType) {
      case TRANSITION_PERIODS.NEWBORN:
        adjustments.categoryAdjustments['Invisible Parental Tasks'] = 1.5;
        adjustments.categoryAdjustments['Visible Parental Tasks'] = 1.4;
        break;
      case TRANSITION_PERIODS.STARTING_SCHOOL:
        adjustments.categoryAdjustments['Education Support'] = 1.4;
        break;
      case TRANSITION_PERIODS.EMPTY_NEST:
        adjustments.categoryAdjustments['Emotional Support'] = 1.3;
        break;
    }
  });
  
  return adjustments;
}

/**
 * Store life stage analysis results
 * @param {string} familyId - Family identifier
 * @param {Object} analysis - Life stage analysis
 * @returns {string} Document ID
 */
async function storeLifeStageAnalysis(familyId, analysis) {
  try {
    // Store complete analysis
    const docRef = await admin.firestore()
      .collection('lifeStageAnalysis')
      .add({
        ...analysis,
        created: admin.firestore.FieldValue.serverTimestamp()
      });
    
    // Update summary in family document
    await admin.firestore()
      .collection('families')
      .doc(familyId)
      .update({
        lifeStageAnalysis: {
          id: docRef.id,
          lifeStages: analysis.lifeStages.map(stage => ({
            childName: stage.name,
            lifeStage: stage.lifeStage
          })),
          transitions: analysis.transitions.map(t => t.type),
          hasActiveTransitions: analysis.transitions.length > 0,
          analyzedAt: analysis.analyzedAt
        }
      });
    
    return docRef.id;
  } catch (error) {
    logger.error('Error storing life stage analysis', { error: error.message, familyId });
    throw error;
  }
}

/**
 * Get the latest life stage analysis for a family
 * @param {string} familyId - Family identifier
 * @returns {Object} Latest life stage analysis
 */
async function getLatestLifeStageAnalysis(familyId) {
  try {
    // First check for cached analysis in family document
    const familyDoc = await admin.firestore()
      .collection('families')
      .doc(familyId)
      .get();
    
    if (!familyDoc.exists) {
      throw new Error(`Family with ID ${familyId} not found`);
    }
    
    const familyData = familyDoc.data();
    
    // If we have a cached analysis, fetch the full version
    if (familyData.lifeStageAnalysis && familyData.lifeStageAnalysis.id) {
      const analysisDoc = await admin.firestore()
        .collection('lifeStageAnalysis')
        .doc(familyData.lifeStageAnalysis.id)
        .get();
      
      if (analysisDoc.exists) {
        return {
          ...analysisDoc.data(),
          id: analysisDoc.id
        };
      }
    }
    
    // If no cached analysis or it wasn't found, get the latest one
    const snapshot = await admin.firestore()
      .collection('lifeStageAnalysis')
      .where('familyId', '==', familyId)
      .orderBy('created', 'desc')
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      // No analysis found, perform a new one
      return await analyzeLifeStages(familyId);
    }
    
    // Return the latest analysis
    const doc = snapshot.docs[0];
    return {
      ...doc.data(),
      id: doc.id
    };
  } catch (error) {
    logger.error('Error retrieving latest life stage analysis', { error: error.message, familyId });
    throw error;
  }
}

/**
 * Apply life stage weight adjustments to calculator
 * @param {Object} task - Task to adjust
 * @param {Object} lifestageAdjustments - Adjustment data
 * @returns {Object} Adjusted task
 */
function applyLifeStageAdjustments(task, lifestageAdjustments) {
  if (!task || !lifestageAdjustments) {
    return task;
  }
  
  const adjustedTask = { ...task };
  
  // Check for task-specific adjustments
  const taskAdjustments = lifestageAdjustments.taskAdjustments || {};
  
  if (taskAdjustments[task.name] && taskAdjustments[task.name].multiplier) {
    // Apply task-specific multiplier
    adjustedTask.baseWeight = (adjustedTask.baseWeight || 3) * taskAdjustments[task.name].multiplier;
    
    // Add context about the adjustment
    adjustedTask.adjustmentContext = {
      type: 'life_stage',
      multiplier: taskAdjustments[task.name].multiplier,
      contributors: taskAdjustments[task.name].contributors
    };
  }
  
  // Check for category adjustments
  const categoryAdjustments = lifestageAdjustments.categoryAdjustments || {};
  
  if (categoryAdjustments[task.category] && !adjustedTask.adjustmentContext) {
    // Apply category multiplier (only if no task-specific adjustment)
    adjustedTask.baseWeight = (adjustedTask.baseWeight || 3) * categoryAdjustments[task.category];
    
    // Add context about the adjustment
    adjustedTask.adjustmentContext = {
      type: 'category_life_stage',
      multiplier: categoryAdjustments[task.category],
      category: task.category
    };
  }
  
  return adjustedTask;
}

/**
 * Get relevant tasks for a specific life stage
 * @param {string} lifeStage - Life stage identifier
 * @returns {Array} Relevant tasks
 */
function getLifeStageRelevantTasks(lifeStage) {
  // Skip if invalid life stage
  if (!LIFE_STAGE_MULTIPLIERS[lifeStage]) {
    return [];
  }
  
  const relevantTasks = [];
  
  // Get tasks with higher multipliers for this life stage
  for (const [task, multiplier] of Object.entries(LIFE_STAGE_MULTIPLIERS[lifeStage])) {
    if (multiplier > 1.1) {
      relevantTasks.push({
        task,
        importance: multiplier
      });
    }
  }
  
  return relevantTasks.sort((a, b) => b.importance - a.importance);
}

/**
 * Get relevant tasks for a specific transition
 * @param {string} transition - Transition identifier
 * @returns {Array} Relevant tasks
 */
function getTransitionRelevantTasks(transition) {
  // Skip if invalid transition
  if (!TRANSITION_MULTIPLIERS[transition]) {
    return [];
  }
  
  const relevantTasks = [];
  
  // Get tasks with higher multipliers for this transition
  for (const [task, multiplier] of Object.entries(TRANSITION_MULTIPLIERS[transition])) {
    if (multiplier > 1.1) {
      relevantTasks.push({
        task,
        importance: multiplier
      });
    }
  }
  
  return relevantTasks.sort((a, b) => b.importance - a.importance);
}

/**
 * Generate content recommendations based on life stages
 * @param {string} familyId - Family identifier
 * @returns {Object} Content recommendations
 */
async function generateLifeStageRecommendations(familyId) {
  try {
    // Get latest life stage analysis
    const analysis = await getLatestLifeStageAnalysis(familyId);
    
    if (!analysis.hasChildren) {
      return {
        familyId,
        hasRecommendations: false,
        message: 'No children detected for content recommendations'
      };
    }
    
    const recommendations = {
      familyId,
      hasRecommendations: true,
      generatedAt: new Date().toISOString(),
      childSpecific: [],
      transitionSpecific: [],
      resources: []
    };
    
    // Process each child's life stage
    for (const child of analysis.lifeStages) {
      const relevantTasks = getLifeStageRelevantTasks(child.lifeStage);
      
      if (relevantTasks.length > 0) {
        recommendations.childSpecific.push({
          childName: child.name,
          childId: child.childId,
          lifeStage: child.lifeStage,
          age: child.age,
          relevantTasks: relevantTasks.slice(0, 5), // Top 5 most important tasks
          importantAreas: generateImportantAreas(child.lifeStage)
        });
      }
    }
    
    // Process each transition
    for (const transition of analysis.transitions) {
      const relevantTasks = getTransitionRelevantTasks(transition.type);
      
      if (relevantTasks.length > 0) {
        recommendations.transitionSpecific.push({
          transition: transition.type,
          description: transition.description,
          childName: transition.name,
          childId: transition.childId,
          relevantTasks: relevantTasks.slice(0, 5), // Top 5 most important tasks
          suggestedApproaches: generateTransitionApproaches(transition.type)
        });
      }
    }
    
    // Generate resource recommendations
    recommendations.resources = await generateResourceRecommendations(
      analysis.lifeStages.map(stage => stage.lifeStage),
      analysis.transitions.map(t => t.type)
    );
    
    return recommendations;
  } catch (error) {
    logger.error('Error generating life stage recommendations', { error: error.message, familyId });
    throw error;
  }
}

/**
 * Generate important development areas for a life stage
 * @param {string} lifeStage - Life stage identifier
 * @returns {Array} Important areas
 */
function generateImportantAreas(lifeStage) {
  switch (lifeStage) {
    case 'infant':
      return [
        'Physical development and motor skills',
        'Sleep patterns and routines',
        'Feeding and nutrition',
        'Parent-child bonding',
        'Sensory development'
      ];
    case 'toddler':
      return [
        'Language development',
        'Social skills and sharing',
        'Emotional regulation',
        'Potty training',
        'Independence and autonomy'
      ];
    case 'preschool':
      return [
        'Pre-literacy and numeracy skills',
        'Creativity and imagination',
        'Peer relationships',
        'Following instructions',
        'Fine motor skills'
      ];
    case 'school_age':
      return [
        'Academic foundations',
        'Friendship skills',
        'Responsibility and chores',
        'Time management',
        'Interests and activities exploration'
      ];
    case 'teen':
      return [
        'Identity development',
        'Independence with guidance',
        'Academic/career planning',
        'Healthy relationships',
        'Digital citizenship'
      ];
    case 'young_adult':
      return [
        'Life skills mastery',
        'Financial literacy',
        'Career development',
        'Healthy adult relationships',
        'Independence with support'
      ];
    default:
      return [];
  }
}

/**
 * Generate suggested approaches for transitions
 * @param {string} transition - Transition identifier
 * @returns {Array} Suggested approaches
 */
function generateTransitionApproaches(transition) {
  switch (transition) {
    case TRANSITION_PERIODS.NEWBORN:
      return [
        'Establish supportive routines for both baby and parents',
        'Prioritize rest and recovery for primary caregiver',
        'Communicate openly about needs and challenges',
        'Accept and ask for help from support networks',
        'Focus on bonding and connection over perfection'
      ];
    case TRANSITION_PERIODS.STARTING_CHILDCARE:
      return [
        'Prepare child with visits and positive conversations',
        'Create consistent drop-off routines',
        'Expect adjustment period with possible behavioral changes',
        'Maintain close communication with care providers',
        'Create special reconnection rituals for pickup time'
      ];
    case TRANSITION_PERIODS.STARTING_SCHOOL:
      return [
        'Visit the school and meet teachers before first day',
        'Practice school routines before school starts',
        'Create organized homework and study spaces',
        'Establish clear morning and after-school routines',
        'Connect with other parents and school community'
      ];
    case TRANSITION_PERIODS.STARTING_MIDDLE_SCHOOL:
      return [
        'Help develop organizational systems for multiple classes',
        'Maintain open communication about social challenges',
        'Balance increasing independence with monitoring',
        'Support healthy friend relationships',
        'Prepare for physical and emotional changes of puberty'
      ];
    case TRANSITION_PERIODS.STARTING_HIGH_SCHOOL:
      return [
        'Encourage academic ownership and self-advocacy',
        'Guide extracurricular involvement for college planning',
        'Discuss teenage social pressures openly',
        'Teach time management with greater responsibilities',
        'Balance monitoring with increasing independence'
      ];
    case TRANSITION_PERIODS.COLLEGE_TRANSITION:
      return [
        'Teach practical life skills before departure',
        'Discuss expectations for communication and visits',
        'Prepare for emotional adjustment for whole family',
        'Support without solving all problems',
        'Redefine your relationship as they become adults'
      ];
    case TRANSITION_PERIODS.EMPTY_NEST:
      return [
        'Reconnect as a couple and redefine relationship',
        'Explore new interests and activities',
        'Establish new communication patterns with adult children',
        'Redefine home spaces and routines',
        'Acknowledge and process mixed emotions'
      ];
    default:
      return [];
  }
}

/**
 * Generate content resource recommendations
 * @param {Array} lifeStages - Life stages in the family
 * @param {Array} transitions - Transitions the family is experiencing
 * @returns {Array} Resource recommendations
 */
async function generateResourceRecommendations(lifeStages, transitions) {
  try {
    // Sample resource recommendations - in a real implementation,
    // these would come from a database or content API
    const resources = [];
    
    // Add life stage specific resources
    if (lifeStages.includes('infant')) {
      resources.push({
        title: 'Infant Development Milestones',
        type: 'article',
        lifeStage: 'infant',
        description: 'Understanding your baby\'s developmental progress'
      });
    }
    
    if (lifeStages.includes('toddler')) {
      resources.push({
        title: 'Navigating Toddler Tantrums',
        type: 'guide',
        lifeStage: 'toddler',
        description: 'Strategies for helping toddlers manage emotions'
      });
    }
    
    if (lifeStages.includes('preschool')) {
      resources.push({
        title: 'School Readiness Checklist',
        type: 'checklist',
        lifeStage: 'preschool',
        description: 'Preparing your child for kindergarten success'
      });
    }
    
    if (lifeStages.includes('school_age')) {
      resources.push({
        title: 'Supporting Elementary School Success',
        type: 'article',
        lifeStage: 'school_age',
        description: 'How parents can support learning and development'
      });
    }
    
    if (lifeStages.includes('teen')) {
      resources.push({
        title: 'Communicating with Your Teen',
        type: 'guide',
        lifeStage: 'teen',
        description: 'Building open communication during the teenage years'
      });
    }
    
    // Add transition specific resources
    if (transitions.includes(TRANSITION_PERIODS.NEWBORN)) {
      resources.push({
        title: 'Fourth Trimester Survival Guide',
        type: 'guide',
        transition: TRANSITION_PERIODS.NEWBORN,
        description: 'Supporting new parents through the first 12 weeks'
      });
    }
    
    if (transitions.includes(TRANSITION_PERIODS.STARTING_SCHOOL)) {
      resources.push({
        title: 'First Day of School Preparation',
        type: 'checklist',
        transition: TRANSITION_PERIODS.STARTING_SCHOOL,
        description: 'Making the transition to elementary school smooth'
      });
    }
    
    if (transitions.includes(TRANSITION_PERIODS.COLLEGE_TRANSITION)) {
      resources.push({
        title: 'Launching Your Young Adult',
        type: 'course',
        transition: TRANSITION_PERIODS.COLLEGE_TRANSITION,
        description: 'Supporting independence while maintaining connection'
      });
    }
    
    return resources;
  } catch (error) {
    logger.error('Error generating resource recommendations', { error: error.message });
    return [];
  }
}

// Export functions
module.exports = {
  analyzeLifeStages,
  getLatestLifeStageAnalysis,
  applyLifeStageAdjustments,
  getLifeStageRelevantTasks,
  getTransitionRelevantTasks,
  generateLifeStageRecommendations
};