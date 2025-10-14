/**
 * Relationship Style Integration System
 * 
 * This module adapts task weights and recommendations based on relationship styles,
 * communication patterns, and couple dynamics to better support diverse families.
 */

const admin = require('firebase-admin');
const logger = require('./logger');

// ------------------- Relationship Style Models -------------------

// Relationship style types
const RELATIONSHIP_STYLES = {
  TRADITIONAL: 'traditional',
  EGALITARIAN: 'egalitarian',
  COMPLEMENTARY: 'complementary',
  INDEPENDENT: 'independent',
  COLLABORATIVE: 'collaborative'
};

// Communication pattern types
const COMMUNICATION_PATTERNS = {
  DIRECT: 'direct',
  INDIRECT: 'indirect',
  EMOTIONAL: 'emotional',
  ANALYTICAL: 'analytical',
  MIXED: 'mixed'
};

// Conflict resolution styles
const CONFLICT_STYLES = {
  COMPROMISING: 'compromising',
  ACCOMMODATING: 'accommodating',
  AVOIDING: 'avoiding',
  COMPETING: 'competing',
  COLLABORATING: 'collaborating'
};

// Task division approaches
const TASK_DIVISION_APPROACHES = {
  GENDERED: 'gendered',
  BALANCED: 'balanced',
  EXPERTISE_BASED: 'expertise_based',
  PREFERENCE_BASED: 'preference_based',
  AVAILABILITY_BASED: 'availability_based'
};

// Task category weight adjustments by relationship style
const STYLE_CATEGORY_ADJUSTMENTS = {
  [RELATIONSHIP_STYLES.TRADITIONAL]: {
    'Visible Household Tasks': { mama: 1.3, papa: 0.7 },
    'Invisible Household Tasks': { mama: 1.4, papa: 0.6 },
    'Visible Parental Tasks': { mama: 1.3, papa: 0.7 },
    'Invisible Parental Tasks': { mama: 1.4, papa: 0.6 },
    'Administrative Tasks': { mama: 1.2, papa: 0.8 },
    'Financial Tasks': { mama: 0.7, papa: 1.3 },
    'Emotional Support': { mama: 1.3, papa: 0.7 },
    'Healthcare Management': { mama: 1.4, papa: 0.6 },
    'Education Support': { mama: 1.3, papa: 0.7 },
    'Social Management': { mama: 1.3, papa: 0.7 }
  },
  
  [RELATIONSHIP_STYLES.EGALITARIAN]: {
    'Visible Household Tasks': { mama: 1.0, papa: 1.0 },
    'Invisible Household Tasks': { mama: 1.0, papa: 1.0 },
    'Visible Parental Tasks': { mama: 1.0, papa: 1.0 },
    'Invisible Parental Tasks': { mama: 1.0, papa: 1.0 },
    'Administrative Tasks': { mama: 1.0, papa: 1.0 },
    'Financial Tasks': { mama: 1.0, papa: 1.0 },
    'Emotional Support': { mama: 1.0, papa: 1.0 },
    'Healthcare Management': { mama: 1.0, papa: 1.0 },
    'Education Support': { mama: 1.0, papa: 1.0 },
    'Social Management': { mama: 1.0, papa: 1.0 }
  },
  
  [RELATIONSHIP_STYLES.COMPLEMENTARY]: {
    // Varies by family - set during analysis
  },
  
  [RELATIONSHIP_STYLES.INDEPENDENT]: {
    'Visible Household Tasks': { mama: 1.0, papa: 1.0 },
    'Invisible Household Tasks': { mama: 1.0, papa: 1.0 },
    'Visible Parental Tasks': { mama: 1.0, papa: 1.0 },
    'Invisible Parental Tasks': { mama: 1.0, papa: 1.0 },
    'Administrative Tasks': { mama: 1.0, papa: 1.0 },
    'Financial Tasks': { mama: 1.0, papa: 1.0 },
    'Emotional Support': { mama: 1.0, papa: 1.0 },
    'Healthcare Management': { mama: 1.0, papa: 1.0 },
    'Education Support': { mama: 1.0, papa: 1.0 },
    'Social Management': { mama: 1.0, papa: 1.0 }
  },
  
  [RELATIONSHIP_STYLES.COLLABORATIVE]: {
    'Visible Household Tasks': { mama: 1.0, papa: 1.0 },
    'Invisible Household Tasks': { mama: 1.1, papa: 0.9 }, // Slight imbalance often remains
    'Visible Parental Tasks': { mama: 1.0, papa: 1.0 },
    'Invisible Parental Tasks': { mama: 1.1, papa: 0.9 }, // Slight imbalance often remains
    'Administrative Tasks': { mama: 1.0, papa: 1.0 },
    'Financial Tasks': { mama: 1.0, papa: 1.0 },
    'Emotional Support': { mama: 1.1, papa: 0.9 }, // Slight imbalance often remains
    'Healthcare Management': { mama: 1.1, papa: 0.9 }, // Slight imbalance often remains
    'Education Support': { mama: 1.0, papa: 1.0 },
    'Social Management': { mama: 1.1, papa: 0.9 } // Slight imbalance often remains
  }
};

// ------------------- Core Functions -------------------

/**
 * Analyze relationship style for a couple
 * @param {string} familyId - Family identifier
 * @returns {Object} Relationship style analysis
 */
async function analyzeRelationshipStyle(familyId) {
  try {
    logger.info('Analyzing relationship style', { familyId });
    
    // Get family data
    const familyDoc = await admin.firestore()
      .collection('families')
      .doc(familyId)
      .get();
    
    if (!familyDoc.exists) {
      throw new Error(`Family with ID ${familyId} not found`);
    }
    
    const familyData = familyDoc.data();
    
    // Determine relationship style
    let relationshipStyle = {};
    
    // If explicitly set, use that
    if (familyData.relationshipPreferences && familyData.relationshipPreferences.style) {
      relationshipStyle.style = familyData.relationshipPreferences.style;
      relationshipStyle.isExplicitSelection = true;
      
      // Get communication and conflict preferences if available
      if (familyData.relationshipPreferences.communication) {
        relationshipStyle.communicationPattern = familyData.relationshipPreferences.communication;
      }
      
      if (familyData.relationshipPreferences.conflict) {
        relationshipStyle.conflictStyle = familyData.relationshipPreferences.conflict;
      }
      
      if (familyData.relationshipPreferences.taskDivision) {
        relationshipStyle.taskDivisionApproach = familyData.relationshipPreferences.taskDivision;
      }
    } else {
      // Infer from available data
      relationshipStyle = inferRelationshipStyle(familyData);
      relationshipStyle.isExplicitSelection = false;
    }
    
    // Process any survey data for more accurate assessment
    if (familyData.surveys && familyData.surveys.relationshipSurvey) {
      relationshipStyle = processRelationshipSurvey(
        relationshipStyle, 
        familyData.surveys.relationshipSurvey
      );
    }
    
    // Analyze balance data if available
    let balanceInsights = null;
    if (familyData.latestBalanceResults) {
      balanceInsights = analyzeBalanceData(familyData.latestBalanceResults);
      
      // Update style based on actual balance data if inference was used
      if (!relationshipStyle.isExplicitSelection) {
        relationshipStyle = refineStyleFromBalance(relationshipStyle, balanceInsights);
      }
    }
    
    // Calculate style-based weight adjustments
    const weightAdjustments = calculateStyleAdjustments(relationshipStyle);
    
    // Generate relationship insights
    const insights = generateRelationshipInsights(relationshipStyle, balanceInsights);
    
    // Create final analysis object
    const analysis = {
      familyId,
      style: relationshipStyle.style,
      communicationPattern: relationshipStyle.communicationPattern,
      conflictStyle: relationshipStyle.conflictStyle,
      taskDivisionApproach: relationshipStyle.taskDivisionApproach,
      isExplicitSelection: relationshipStyle.isExplicitSelection,
      confidenceScore: relationshipStyle.confidenceScore || 'high',
      balanceInsights,
      weightAdjustments,
      insights,
      analyzedAt: new Date().toISOString()
    };
    
    // Store the analysis
    await storeRelationshipAnalysis(familyId, analysis);
    
    logger.info('Completed relationship style analysis', { 
      familyId, 
      style: relationshipStyle.style 
    });
    
    return analysis;
  } catch (error) {
    logger.error('Error analyzing relationship style', { error: error.message, familyId });
    throw error;
  }
}

/**
 * Infer relationship style from family data
 * @param {Object} familyData - Family profile data
 * @returns {Object} Inferred relationship style
 */
function inferRelationshipStyle(familyData) {
  // Start with default style
  const style = {
    style: RELATIONSHIP_STYLES.EGALITARIAN, // Default fallback
    communicationPattern: COMMUNICATION_PATTERNS.MIXED,
    conflictStyle: CONFLICT_STYLES.COMPROMISING,
    taskDivisionApproach: TASK_DIVISION_APPROACHES.BALANCED,
    confidenceScore: 'low' // Low confidence for inference
  };
  
  // Use demographic and survey data if available
  if (familyData.demographics) {
    // Cultural background can influence relationship style
    if (familyData.demographics.culturalBackground) {
      const background = familyData.demographics.culturalBackground.toLowerCase();
      
      // These are generalized patterns and should be used with caution
      if ((background.includes('traditional') || 
           background.includes('conservative')) && 
          !background.includes('non-traditional')) {
        style.style = RELATIONSHIP_STYLES.TRADITIONAL;
        style.taskDivisionApproach = TASK_DIVISION_APPROACHES.GENDERED;
      } else if (background.includes('progressive') || 
                background.includes('liberal') || 
                background.includes('egalitarian')) {
        style.style = RELATIONSHIP_STYLES.EGALITARIAN;
        style.taskDivisionApproach = TASK_DIVISION_APPROACHES.BALANCED;
      }
    }
    
    // Religious affiliation can influence relationship style
    if (familyData.demographics.religion) {
      const religion = familyData.demographics.religion.toLowerCase();
      const religiosity = familyData.demographics.religiosity || 'moderate';
      
      // Only consider for highly religious families
      if (religiosity === 'high' || religiosity === 'very high') {
        if (religion.includes('conservative') || 
            religion.includes('orthodox') || 
            religion.includes('traditional')) {
          style.style = RELATIONSHIP_STYLES.TRADITIONAL;
          style.taskDivisionApproach = TASK_DIVISION_APPROACHES.GENDERED;
        }
      }
    }
  }
  
  // Past survey responses about division of labor
  if (familyData.surveys && familyData.surveys.divisionOfLabor) {
    const laborSurvey = familyData.surveys.divisionOfLabor;
    
    if (laborSurvey.approach) {
      if (laborSurvey.approach === 'equal') {
        style.style = RELATIONSHIP_STYLES.EGALITARIAN;
        style.taskDivisionApproach = TASK_DIVISION_APPROACHES.BALANCED;
      } else if (laborSurvey.approach === 'traditional') {
        style.style = RELATIONSHIP_STYLES.TRADITIONAL;
        style.taskDivisionApproach = TASK_DIVISION_APPROACHES.GENDERED;
      } else if (laborSurvey.approach === 'strengths') {
        style.style = RELATIONSHIP_STYLES.COMPLEMENTARY;
        style.taskDivisionApproach = TASK_DIVISION_APPROACHES.EXPERTISE_BASED;
      } else if (laborSurvey.approach === 'preferences') {
        style.style = RELATIONSHIP_STYLES.COLLABORATIVE;
        style.taskDivisionApproach = TASK_DIVISION_APPROACHES.PREFERENCE_BASED;
      } else if (laborSurvey.approach === 'separate') {
        style.style = RELATIONSHIP_STYLES.INDEPENDENT;
      }
      
      // Higher confidence if explicitly stated in a survey
      style.confidenceScore = 'medium';
    }
  }
  
  // Past assessment data
  if (familyData.latestBalanceResults) {
    style.confidenceScore = 'medium'; // Having balance data increases confidence
  }
  
  return style;
}

/**
 * Process relationship survey data to refine style assessment
 * @param {Object} currentStyle - Current relationship style assessment
 * @param {Object} surveyData - Relationship survey data
 * @returns {Object} Refined relationship style
 */
function processRelationshipSurvey(currentStyle, surveyData) {
  const refinedStyle = { ...currentStyle };
  
  // Detailed survey improves confidence
  refinedStyle.confidenceScore = 'high';
  
  // Decision making approach
  if (surveyData.decisionMaking) {
    if (surveyData.decisionMaking === 'joint') {
      refinedStyle.style = RELATIONSHIP_STYLES.COLLABORATIVE;
    } else if (surveyData.decisionMaking === 'specialized') {
      refinedStyle.style = RELATIONSHIP_STYLES.COMPLEMENTARY;
    } else if (surveyData.decisionMaking === 'independent') {
      refinedStyle.style = RELATIONSHIP_STYLES.INDEPENDENT;
    } else if (surveyData.decisionMaking === 'hierarchical') {
      refinedStyle.style = RELATIONSHIP_STYLES.TRADITIONAL;
    } else if (surveyData.decisionMaking === 'equal') {
      refinedStyle.style = RELATIONSHIP_STYLES.EGALITARIAN;
    }
  }
  
  // Communication style
  if (surveyData.communication) {
    if (surveyData.communication === 'direct') {
      refinedStyle.communicationPattern = COMMUNICATION_PATTERNS.DIRECT;
    } else if (surveyData.communication === 'indirect') {
      refinedStyle.communicationPattern = COMMUNICATION_PATTERNS.INDIRECT;
    } else if (surveyData.communication === 'emotional') {
      refinedStyle.communicationPattern = COMMUNICATION_PATTERNS.EMOTIONAL;
    } else if (surveyData.communication === 'analytical') {
      refinedStyle.communicationPattern = COMMUNICATION_PATTERNS.ANALYTICAL;
    } else if (surveyData.communication === 'mixed') {
      refinedStyle.communicationPattern = COMMUNICATION_PATTERNS.MIXED;
    }
  }
  
  // Conflict resolution
  if (surveyData.conflict) {
    if (surveyData.conflict === 'compromise') {
      refinedStyle.conflictStyle = CONFLICT_STYLES.COMPROMISING;
    } else if (surveyData.conflict === 'accommodate') {
      refinedStyle.conflictStyle = CONFLICT_STYLES.ACCOMMODATING;
    } else if (surveyData.conflict === 'avoid') {
      refinedStyle.conflictStyle = CONFLICT_STYLES.AVOIDING;
    } else if (surveyData.conflict === 'compete') {
      refinedStyle.conflictStyle = CONFLICT_STYLES.COMPETING;
    } else if (surveyData.conflict === 'collaborate') {
      refinedStyle.conflictStyle = CONFLICT_STYLES.COLLABORATING;
    }
  }
  
  // Task division
  if (surveyData.taskDivision) {
    if (surveyData.taskDivision === 'gendered') {
      refinedStyle.taskDivisionApproach = TASK_DIVISION_APPROACHES.GENDERED;
    } else if (surveyData.taskDivision === 'balanced') {
      refinedStyle.taskDivisionApproach = TASK_DIVISION_APPROACHES.BALANCED;
    } else if (surveyData.taskDivision === 'expertise') {
      refinedStyle.taskDivisionApproach = TASK_DIVISION_APPROACHES.EXPERTISE_BASED;
    } else if (surveyData.taskDivision === 'preference') {
      refinedStyle.taskDivisionApproach = TASK_DIVISION_APPROACHES.PREFERENCE_BASED;
    } else if (surveyData.taskDivision === 'availability') {
      refinedStyle.taskDivisionApproach = TASK_DIVISION_APPROACHES.AVAILABILITY_BASED;
    }
  }
  
  return refinedStyle;
}

/**
 * Analyze balance data for relationship insights
 * @param {Object} balanceData - Family balance data
 * @returns {Object} Balance insights
 */
function analyzeBalanceData(balanceData) {
  // Skip if no data
  if (!balanceData || !balanceData.overallBalance) {
    return null;
  }
  
  const insights = {
    overallImbalance: balanceData.overallBalance.imbalance || 0,
    mamaPercentage: balanceData.overallBalance.mama || 0,
    papaPercentage: balanceData.overallBalance.papa || 0,
    categoryPatterns: []
  };
  
  // Determine if substantial imbalance exists
  insights.hasSubstantialImbalance = insights.overallImbalance > 0.3; // 30% difference
  insights.moreWorkParent = insights.mamaPercentage > insights.papaPercentage ? 'mama' : 'papa';
  
  // Analyze category patterns
  if (balanceData.categoryBalance) {
    for (const [category, data] of Object.entries(balanceData.categoryBalance)) {
      // Only include categories with significant imbalance
      if (data.imbalance && data.imbalance > 0.25) {
        insights.categoryPatterns.push({
          category,
          imbalance: data.imbalance,
          mamaPercentage: data.mama,
          papaPercentage: data.papa,
          moreWorkParent: data.mama > data.papa ? 'mama' : 'papa'
        });
      }
    }
    
    // Sort by imbalance (highest first)
    insights.categoryPatterns.sort((a, b) => b.imbalance - a.imbalance);
  }
  
  return insights;
}

/**
 * Refine relationship style assessment based on balance data
 * @param {Object} currentStyle - Current relationship style assessment
 * @param {Object} balanceInsights - Balance data insights
 * @returns {Object} Refined relationship style
 */
function refineStyleFromBalance(currentStyle, balanceInsights) {
  if (!balanceInsights) {
    return currentStyle;
  }
  
  const refinedStyle = { ...currentStyle };
  
  // Analyze actual work distribution
  const imbalance = balanceInsights.overallImbalance;
  
  if (imbalance < 0.15) {
    // Very balanced - likely egalitarian or collaborative
    refinedStyle.style = refinedStyle.taskDivisionApproach === TASK_DIVISION_APPROACHES.BALANCED ? 
      RELATIONSHIP_STYLES.EGALITARIAN : RELATIONSHIP_STYLES.COLLABORATIVE;
    
  } else if (imbalance > 0.4) {
    // Highly imbalanced
    const mamaMoreWork = balanceInsights.mamaPercentage > balanceInsights.papaPercentage;
    
    // If mama does significantly more, may be traditional
    if (mamaMoreWork) {
      refinedStyle.style = RELATIONSHIP_STYLES.TRADITIONAL;
    }
    // If papa does significantly more, likely complementary
    else {
      refinedStyle.style = RELATIONSHIP_STYLES.COMPLEMENTARY;
    }
  }
  
  // Check for specialized domain patterns
  if (balanceInsights.categoryPatterns && balanceInsights.categoryPatterns.length > 0) {
    // If some categories show mama doing more while others show papa doing more,
    // this suggests a complementary approach
    let mamaCategories = 0;
    let papaCategories = 0;
    
    balanceInsights.categoryPatterns.forEach(pattern => {
      if (pattern.moreWorkParent === 'mama') {
        mamaCategories++;
      } else {
        papaCategories++;
      }
    });
    
    if (mamaCategories > 0 && papaCategories > 0) {
      refinedStyle.style = RELATIONSHIP_STYLES.COMPLEMENTARY;
      refinedStyle.taskDivisionApproach = TASK_DIVISION_APPROACHES.EXPERTISE_BASED;
    }
  }
  
  return refinedStyle;
}

/**
 * Calculate weight adjustments based on relationship style
 * @param {Object} relationshipStyle - Relationship style data
 * @returns {Object} Weight adjustments
 */
function calculateStyleAdjustments(relationshipStyle) {
  const adjustments = {
    categoryAdjustments: {}
  };
  
  const style = relationshipStyle.style;
  
  // Apply standard adjustments for the style
  if (STYLE_CATEGORY_ADJUSTMENTS[style]) {
    // Copy standard adjustments
    adjustments.categoryAdjustments = { ...STYLE_CATEGORY_ADJUSTMENTS[style] };
  }
  
  // Complementary style requires custom handling
  if (style === RELATIONSHIP_STYLES.COMPLEMENTARY) {
    // For complementary, we need more data to determine specific adjustments
    // This could come from survey data or observed patterns
    
    // Default to a moderate traditional pattern if no specifics available
    adjustments.categoryAdjustments = {
      'Visible Household Tasks': { mama: 1.1, papa: 0.9 },
      'Invisible Household Tasks': { mama: 1.2, papa: 0.8 },
      'Visible Parental Tasks': { mama: 1.1, papa: 0.9 },
      'Invisible Parental Tasks': { mama: 1.2, papa: 0.8 },
      'Administrative Tasks': { mama: 1.1, papa: 0.9 },
      'Financial Tasks': { mama: 0.9, papa: 1.1 },
      'Emotional Support': { mama: 1.2, papa: 0.8 },
      'Healthcare Management': { mama: 1.2, papa: 0.8 },
      'Education Support': { mama: 1.1, papa: 0.9 },
      'Social Management': { mama: 1.1, papa: 0.9 }
    };
  }
  
  // Task division approach can further refine adjustments
  if (relationshipStyle.taskDivisionApproach === TASK_DIVISION_APPROACHES.BALANCED) {
    // Make all adjustments more balanced
    for (const category in adjustments.categoryAdjustments) {
      adjustments.categoryAdjustments[category] = { mama: 1.0, papa: 1.0 };
    }
  } else if (relationshipStyle.taskDivisionApproach === TASK_DIVISION_APPROACHES.GENDERED) {
    // Strengthen traditional patterns
    for (const category in adjustments.categoryAdjustments) {
      const current = adjustments.categoryAdjustments[category];
      if (current.mama > current.papa) {
        adjustments.categoryAdjustments[category] = { 
          mama: Math.min(current.mama + 0.1, 1.5), 
          papa: Math.max(current.papa - 0.1, 0.5) 
        };
      } else if (current.papa > current.mama) {
        adjustments.categoryAdjustments[category] = { 
          mama: Math.max(current.mama - 0.1, 0.5), 
          papa: Math.min(current.papa + 0.1, 1.5) 
        };
      }
    }
  }
  
  return adjustments;
}

/**
 * Generate insights based on relationship style
 * @param {Object} relationshipStyle - Relationship style data
 * @param {Object} balanceInsights - Balance data insights
 * @returns {Array} Relationship insights
 */
function generateRelationshipInsights(relationshipStyle, balanceInsights) {
  const insights = [];
  const style = relationshipStyle.style;
  
  // Add style-specific insights
  switch (style) {
    case RELATIONSHIP_STYLES.TRADITIONAL:
      insights.push({
        topic: 'Task Distribution',
        insight: 'Your family appears to follow a more traditional division of responsibilities, with distinct roles for each parent.'
      });
      if (balanceInsights && balanceInsights.hasSubstantialImbalance) {
        insights.push({
          topic: 'Work Balance',
          insight: `Current workload appears substantially higher for ${balanceInsights.moreWorkParent === 'mama' ? 'Mama' : 'Papa'}. Consider whether this balance feels sustainable and supportive for both parents.`
        });
      }
      break;
      
    case RELATIONSHIP_STYLES.EGALITARIAN:
      insights.push({
        topic: 'Equal Partnership',
        insight: 'Your family appears to value equal sharing of responsibilities, with minimal role distinction between parents.'
      });
      if (balanceInsights && balanceInsights.hasSubstantialImbalance) {
        insights.push({
          topic: 'Balance Gap',
          insight: `Despite egalitarian values, current workload appears higher for ${balanceInsights.moreWorkParent === 'mama' ? 'Mama' : 'Papa'}. This gap between values and reality is common and can be addressed through explicit task rebalancing.`
        });
      }
      break;
      
    case RELATIONSHIP_STYLES.COMPLEMENTARY:
      insights.push({
        topic: 'Complementary Strengths',
        insight: 'Your family appears to divide responsibilities based on individual strengths and preferences rather than traditional gender roles.'
      });
      if (balanceInsights && balanceInsights.categoryPatterns.length > 0) {
        const topCategory = balanceInsights.categoryPatterns[0];
        insights.push({
          topic: 'Domain Specialization',
          insight: `There's a notable division in the ${topCategory.category} category, with ${topCategory.moreWorkParent === 'mama' ? 'Mama' : 'Papa'} handling significantly more. This specialization can be efficient but may create imbalance if the total workload isn't equitable.`
        });
      }
      break;
      
    case RELATIONSHIP_STYLES.INDEPENDENT:
      insights.push({
        topic: 'Autonomous Approach',
        insight: 'Your family appears to value individual autonomy, with each parent maintaining significant independence in their responsibilities.'
      });
      if (balanceInsights && balanceInsights.hasSubstantialImbalance) {
        insights.push({
          topic: 'Coordination Gap',
          insight: `Despite an independent approach, workload appears higher for ${balanceInsights.moreWorkParent === 'mama' ? 'Mama' : 'Papa'}. Independent styles work best when there's explicit agreement about shared responsibilities.`
        });
      }
      break;
      
    case RELATIONSHIP_STYLES.COLLABORATIVE:
      insights.push({
        topic: 'Team Approach',
        insight: 'Your family appears to take a collaborative approach to responsibilities, working together as a team rather than dividing tasks rigidly.'
      });
      if (balanceInsights && balanceInsights.hasSubstantialImbalance) {
        insights.push({
          topic: 'Hidden Imbalance',
          insight: `Despite a collaborative approach, workload appears higher for ${balanceInsights.moreWorkParent === 'mama' ? 'Mama' : 'Papa'}. Collaborative styles can sometimes mask imbalances in mental load and invisible work.`
        });
      }
      break;
  }
  
  // Add communication pattern insights
  if (relationshipStyle.communicationPattern) {
    switch (relationshipStyle.communicationPattern) {
      case COMMUNICATION_PATTERNS.DIRECT:
        insights.push({
          topic: 'Communication Style',
          insight: 'Your direct communication style favors clarity and efficiency. This can be particularly helpful when addressing workload concerns directly rather than letting frustrations build.'
        });
        break;
        
      case COMMUNICATION_PATTERNS.INDIRECT:
        insights.push({
          topic: 'Communication Style',
          insight: 'Your indirect communication style values harmony and relationship preservation. Consider whether this sometimes makes it challenging to address workload imbalances directly.'
        });
        break;
        
      case COMMUNICATION_PATTERNS.EMOTIONAL:
        insights.push({
          topic: 'Communication Style',
          insight: 'Your emotional communication style emphasizes connection and feelings. This can help maintain relationship quality while navigating workload challenges.'
        });
        break;
        
      case COMMUNICATION_PATTERNS.ANALYTICAL:
        insights.push({
          topic: 'Communication Style',
          insight: 'Your analytical communication style favors logic and problem-solving. This can be helpful for finding practical solutions to workload challenges.'
        });
        break;
    }
  }
  
  // Add conflict resolution insights
  if (relationshipStyle.conflictStyle) {
    switch (relationshipStyle.conflictStyle) {
      case CONFLICT_STYLES.COMPROMISING:
        insights.push({
          topic: 'Handling Disagreements',
          insight: 'Your compromising approach to conflicts values finding middle ground. This can help ensure both parents feel their needs are partially met when addressing workload concerns.'
        });
        break;
        
      case CONFLICT_STYLES.ACCOMMODATING:
        insights.push({
          topic: 'Handling Disagreements',
          insight: 'Your accommodating approach to conflicts prioritizes relationship harmony, sometimes at the expense of one partner\'s needs. Be mindful that this doesn\'t lead to persistent imbalance over time.'
        });
        break;
        
      case CONFLICT_STYLES.AVOIDING:
        insights.push({
          topic: 'Handling Disagreements',
          insight: 'Your conflict-avoiding approach may postpone addressing workload imbalances. Consider whether scheduling regular, low-pressure discussions about family responsibilities might help prevent larger issues.'
        });
        break;
        
      case CONFLICT_STYLES.COLLABORATING:
        insights.push({
          topic: 'Handling Disagreements',
          insight: 'Your collaborative approach to conflicts seeks win-win solutions. This can be particularly effective for addressing complex workload challenges that require creative solutions.'
        });
        break;
    }
  }
  
  return insights;
}

/**
 * Store relationship analysis in database
 * @param {string} familyId - Family identifier
 * @param {Object} analysis - Relationship analysis
 * @returns {string} Document ID
 */
async function storeRelationshipAnalysis(familyId, analysis) {
  try {
    // Store complete analysis
    const docRef = await admin.firestore()
      .collection('relationshipAnalysis')
      .add({
        ...analysis,
        created: admin.firestore.FieldValue.serverTimestamp()
      });
    
    // Update summary in family document
    await admin.firestore()
      .collection('families')
      .doc(familyId)
      .update({
        relationshipStyle: {
          id: docRef.id,
          style: analysis.style,
          communicationPattern: analysis.communicationPattern,
          conflictStyle: analysis.conflictStyle,
          taskDivisionApproach: analysis.taskDivisionApproach,
          confidenceScore: analysis.confidenceScore,
          analyzedAt: analysis.analyzedAt
        }
      });
    
    return docRef.id;
  } catch (error) {
    logger.error('Error storing relationship analysis', { error: error.message, familyId });
    throw error;
  }
}

/**
 * Get the latest relationship analysis for a family
 * @param {string} familyId - Family identifier
 * @returns {Object} Latest relationship analysis
 */
async function getLatestRelationshipAnalysis(familyId) {
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
    if (familyData.relationshipStyle && familyData.relationshipStyle.id) {
      const analysisDoc = await admin.firestore()
        .collection('relationshipAnalysis')
        .doc(familyData.relationshipStyle.id)
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
      .collection('relationshipAnalysis')
      .where('familyId', '==', familyId)
      .orderBy('created', 'desc')
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      // No analysis found, perform a new one
      return await analyzeRelationshipStyle(familyId);
    }
    
    // Return the latest analysis
    const doc = snapshot.docs[0];
    return {
      ...doc.data(),
      id: doc.id
    };
  } catch (error) {
    logger.error('Error retrieving latest relationship analysis', { error: error.message, familyId });
    throw error;
  }
}

/**
 * Apply relationship style adjustments to task weight
 * @param {Object} task - Task to adjust
 * @param {string} parentType - Parent type ('mama' or 'papa')
 * @param {Object} styleAdjustments - Relationship style adjustments
 * @returns {Object} Adjusted task
 */
function applyStyleAdjustments(task, parentType, styleAdjustments) {
  if (!task || !parentType || !styleAdjustments) {
    return task;
  }
  
  const adjustedTask = { ...task };
  
  // Check if there are category adjustments
  if (styleAdjustments.categoryAdjustments && 
      styleAdjustments.categoryAdjustments[task.category] && 
      styleAdjustments.categoryAdjustments[task.category][parentType]) {
    
    const multiplier = styleAdjustments.categoryAdjustments[task.category][parentType];
    
    // Apply multiplier to base weight
    adjustedTask.baseWeight = (adjustedTask.baseWeight || 3) * multiplier;
    
    // Add context about the adjustment
    adjustedTask.adjustmentContext = {
      type: 'relationship_style',
      multiplier,
      category: task.category,
      parentType
    };
  }
  
  return adjustedTask;
}

/**
 * Generate recommendations based on relationship style
 * @param {string} familyId - Family identifier
 * @returns {Object} Style recommendations
 */
async function generateStyleRecommendations(familyId) {
  try {
    // Get latest relationship analysis
    const analysis = await getLatestRelationshipAnalysis(familyId);
    
    if (!analysis.style) {
      return {
        familyId,
        hasRecommendations: false,
        message: 'Insufficient relationship style information'
      };
    }
    
    const recommendations = {
      familyId,
      style: analysis.style,
      hasRecommendations: true,
      generatedAt: new Date().toISOString(),
      recommendations: []
    };
    
    // Get balance data for context
    let balanceInsights = analysis.balanceInsights;
    if (!balanceInsights) {
      const familyDoc = await admin.firestore()
        .collection('families')
        .doc(familyId)
        .get();
      
      if (familyDoc.exists && familyDoc.data().latestBalanceResults) {
        balanceInsights = analyzeBalanceData(familyDoc.data().latestBalanceResults);
      }
    }
    
    // Generate recommendations based on style
    switch (analysis.style) {
      case RELATIONSHIP_STYLES.TRADITIONAL:
        recommendations.recommendations = generateTraditionalRecommendations(analysis, balanceInsights);
        break;
        
      case RELATIONSHIP_STYLES.EGALITARIAN:
        recommendations.recommendations = generateEgalitarianRecommendations(analysis, balanceInsights);
        break;
        
      case RELATIONSHIP_STYLES.COMPLEMENTARY:
        recommendations.recommendations = generateComplementaryRecommendations(analysis, balanceInsights);
        break;
        
      case RELATIONSHIP_STYLES.INDEPENDENT:
        recommendations.recommendations = generateIndependentRecommendations(analysis, balanceInsights);
        break;
        
      case RELATIONSHIP_STYLES.COLLABORATIVE:
        recommendations.recommendations = generateCollaborativeRecommendations(analysis, balanceInsights);
        break;
    }
    
    return recommendations;
  } catch (error) {
    logger.error('Error generating style recommendations', { error: error.message, familyId });
    throw error;
  }
}

// ------------------- Recommendation Generators -------------------

/**
 * Generate recommendations for traditional relationship style
 * @param {Object} analysis - Relationship analysis
 * @param {Object} balanceInsights - Balance data insights
 * @returns {Array} Recommendations
 */
function generateTraditionalRecommendations(analysis, balanceInsights) {
  const recommendations = [];
  
  recommendations.push({
    title: 'Honor Individual Contributions',
    description: 'In traditional arrangements, it\'s important to value and recognize the unique contributions of each parent, even when responsibilities differ.',
    actionItems: [
      'Regularly express appreciation for each other\'s domain expertise',
      'Check in about satisfaction with current role division',
      'Discuss whether either parent needs more support in their primary responsibilities'
    ]
  });
  
  if (balanceInsights && balanceInsights.hasSubstantialImbalance) {
    recommendations.push({
      title: 'Balanced Workload Within Roles',
      description: `Current workload appears higher for ${balanceInsights.moreWorkParent === 'mama' ? 'Mama' : 'Papa'}. Even within traditional role divisions, the overall workload should feel manageable for both parents.`,
      actionItems: [
        `Identify a few high-impact tasks that could be shifted to ${balanceInsights.moreWorkParent === 'mama' ? 'Papa' : 'Mama'} to create better balance`,
        'Consider whether outside help (extended family, services) could reduce overall family workload',
        'Schedule regular check-ins about workload sustainability'
      ]
    });
  }
  
  if (analysis.communicationPattern === COMMUNICATION_PATTERNS.INDIRECT) {
    recommendations.push({
      title: 'Direct Conversations About Needs',
      description: 'While your communication style tends to be indirect, discussing workload and needs directly can prevent build-up of resentment.',
      actionItems: [
        'Schedule regular "family business" meetings to discuss household management',
        'Use "I feel" statements when workload feels unbalanced',
        'Practice asking directly for specific help when needed'
      ]
    });
  }
  
  return recommendations;
}

/**
 * Generate recommendations for egalitarian relationship style
 * @param {Object} analysis - Relationship analysis
 * @param {Object} balanceInsights - Balance data insights
 * @returns {Array} Recommendations
 */
function generateEgalitarianRecommendations(analysis, balanceInsights) {
  const recommendations = [];
  
  recommendations.push({
    title: 'Track Invisible Labor',
    description: 'Even in egalitarian relationships, invisible tasks like planning, scheduling, and emotional labor often fall unevenly without explicit attention.',
    actionItems: [
      'Audit the "mental load" tasks that might not be obvious',
      'Create systems for sharing planning responsibilities',
      'Take turns being the "default parent" for child-related decisions'
    ]
  });
  
  if (balanceInsights && balanceInsights.hasSubstantialImbalance) {
    recommendations.push({
      title: 'Close the Values-Reality Gap',
      description: `Despite egalitarian values, current workload appears higher for ${balanceInsights.moreWorkParent === 'mama' ? 'Mama' : 'Papa'}. This gap between values and reality is common and can be addressed.`,
      actionItems: [
        'Conduct a detailed task audit across all household and parenting domains',
        'Redistribute responsibilities based on time requirements rather than task count',
        'Consider whether implicit biases or gendered expectations are influencing task division'
      ]
    });
  }
  
  if (balanceInsights && balanceInsights.categoryPatterns.length > 0) {
    const topCategory = balanceInsights.categoryPatterns[0];
    recommendations.push({
      title: `Balance ${topCategory.category}`,
      description: `There's a notable imbalance in the ${topCategory.category} category, with ${topCategory.moreWorkParent === 'mama' ? 'Mama' : 'Papa'} handling significantly more.`,
      actionItems: [
        `Identify specific tasks within ${topCategory.category} that could be redistributed`,
        'Discuss whether specialized knowledge or skills need to be shared',
        'Create a plan to gradually shift responsibilities toward balance'
      ]
    });
  }
  
  return recommendations;
}

/**
 * Generate recommendations for complementary relationship style
 * @param {Object} analysis - Relationship analysis
 * @param {Object} balanceInsights - Balance data insights
 * @returns {Array} Recommendations
 */
function generateComplementaryRecommendations(analysis, balanceInsights) {
  const recommendations = [];
  
  recommendations.push({
    title: 'Ensure Equitable Total Workload',
    description: 'With complementary approaches, ensure domains are distributed fairly so each parent\'s total responsibility load feels balanced.',
    actionItems: [
      'Assess whether each parent\'s domains require similar time and energy',
      'Discuss whether current specializations align with each parent\'s skills and preferences',
      'Cross-train in each other\'s domains for better mutual understanding'
    ]
  });
  
  if (balanceInsights && balanceInsights.hasSubstantialImbalance) {
    recommendations.push({
      title: 'Rebalance Domain Responsibilities',
      description: `Current workload appears higher for ${balanceInsights.moreWorkParent === 'mama' ? 'Mama' : 'Papa'}. Complementary approaches work best when the total workload feels fair.`,
      actionItems: [
        'Identify which domains create the most workload imbalance',
        'Consider redistributing entire domains rather than individual tasks',
        'Discuss whether the current domain division aligns with each parent\'s capacity'
      ]
    });
  }
  
  recommendations.push({
    title: 'Avoid Domain Isolation',
    description: 'While specialization is efficient, complete separation can create knowledge gaps and overwhelm if one parent is unavailable.',
    actionItems: [
      'Create "backup" systems for essential domain knowledge',
      'Schedule occasional role swaps to maintain familiarity',
      'Document important processes for each domain'
    ]
  });
  
  return recommendations;
}

/**
 * Generate recommendations for independent relationship style
 * @param {Object} analysis - Relationship analysis
 * @param {Object} balanceInsights - Balance data insights
 * @returns {Array} Recommendations
 */
function generateIndependentRecommendations(analysis, balanceInsights) {
  const recommendations = [];
  
  recommendations.push({
    title: 'Coordinate Independent Efforts',
    description: 'Independent approaches work best with explicit coordination to ensure all family needs are met without duplication or gaps.',
    actionItems: [
      'Create shared systems for tracking family tasks and responsibilities',
      'Schedule regular coordination check-ins',
      'Define clear ownership for shared domains'
    ]
  });
  
  if (balanceInsights && balanceInsights.hasSubstantialImbalance) {
    recommendations.push({
      title: 'Address Workload Imbalance',
      description: `Current workload appears higher for ${balanceInsights.moreWorkParent === 'mama' ? 'Mama' : 'Papa'}. Independent styles require explicit agreements about shared responsibilities.`,
      actionItems: [
        'Review and renegotiate division of family responsibilities',
        'Consider whether certain tasks could be outsourced',
        'Create clear agreements about shared family workload'
      ]
    });
  }
  
  if (analysis.conflictStyle === CONFLICT_STYLES.AVOIDING) {
    recommendations.push({
      title: 'Proactive Issue Resolution',
      description: 'Independent styles combined with conflict avoidance can allow imbalances to grow. Regular check-ins can prevent this.',
      actionItems: [
        'Schedule periodic "state of the family" discussions',
        'Use written communication tools for sensitive topics if helpful',
        'Create a structured format for addressing workload concerns'
      ]
    });
  }
  
  return recommendations;
}

/**
 * Generate recommendations for collaborative relationship style
 * @param {Object} analysis - Relationship analysis
 * @param {Object} balanceInsights - Balance data insights
 * @returns {Array} Recommendations
 */
function generateCollaborativeRecommendations(analysis, balanceInsights) {
  const recommendations = [];
  
  recommendations.push({
    title: 'Maintain Collaborative Systems',
    description: 'Collaborative approaches thrive with good systems for coordination and communication.',
    actionItems: [
      'Review and refine shared planning tools and processes',
      'Check that both partners feel equally empowered in decision-making',
      'Schedule regular team meetings to discuss family management'
    ]
  });
  
  if (balanceInsights && balanceInsights.hasSubstantialImbalance) {
    recommendations.push({
      title: 'Uncover Hidden Imbalances',
      description: `Despite a collaborative approach, workload appears higher for ${balanceInsights.moreWorkParent === 'mama' ? 'Mama' : 'Papa'}. Collaborative styles can sometimes mask imbalances.`,
      actionItems: [
        'Audit mental load and invisible planning work',
        'Track time spent on family responsibilities for a week',
        'Discuss perceptions of workload balance openly'
      ]
    });
  }
  
  if (balanceInsights && balanceInsights.categoryPatterns.length > 0) {
    const topCategory = balanceInsights.categoryPatterns[0];
    if (topCategory.category.includes('Invisible')) {
      recommendations.push({
        title: 'Share Invisible Work',
        description: `There's a notable imbalance in ${topCategory.category}, often the most overlooked area in otherwise collaborative relationships.`,
        actionItems: [
          'Make invisible work visible through lists or tracking',
          'Take turns handling planning and anticipation tasks',
          'Create shared systems for managing household and family knowledge'
        ]
      });
    }
  }
  
  return recommendations;
}

// Export functions
module.exports = {
  analyzeRelationshipStyle,
  getLatestRelationshipAnalysis,
  applyStyleAdjustments,
  generateStyleRecommendations,
  // Constants for reference
  RELATIONSHIP_STYLES,
  COMMUNICATION_PATTERNS,
  CONFLICT_STYLES,
  TASK_DIVISION_APPROACHES
};