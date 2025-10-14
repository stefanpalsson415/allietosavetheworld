/**
 * Cultural Contextualization System
 * 
 * This module provides cultural adaptations for task weights and recommendations,
 * respecting diverse family structures, cultural backgrounds, and values.
 */

const admin = require('firebase-admin');
const logger = require('./logger');

// ------------------- Cultural Models -------------------

// Cultural dimensions
const CULTURAL_DIMENSIONS = {
  INDIVIDUALISM_COLLECTIVISM: 'individualism_collectivism',
  POWER_DISTANCE: 'power_distance',
  UNCERTAINTY_AVOIDANCE: 'uncertainty_avoidance',
  MASCULINITY_FEMININITY: 'masculinity_femininity',
  LONG_TERM_ORIENTATION: 'long_term_orientation',
  INDULGENCE_RESTRAINT: 'indulgence_restraint'
};

// Cultural value systems
const CULTURAL_VALUE_SYSTEMS = {
  WESTERN_INDIVIDUALIST: 'western_individualist',
  EAST_ASIAN_COLLECTIVIST: 'east_asian_collectivist',
  SOUTH_ASIAN_FAMILY_CENTRIC: 'south_asian_family_centric',
  LATIN_AMERICAN_FAMILIAL: 'latin_american_familial',
  AFRICAN_COMMUNAL: 'african_communal',
  MIDDLE_EASTERN_TRADITIONAL: 'middle_eastern_traditional',
  NORDIC_EGALITARIAN: 'nordic_egalitarian',
  INDIGENOUS_COMMUNITY: 'indigenous_community'
};

// Cultural context adjustments by dimension and value system
const CULTURAL_ADJUSTMENTS = {
  // Individualism vs Collectivism
  [CULTURAL_DIMENSIONS.INDIVIDUALISM_COLLECTIVISM]: {
    high: { // High individualism
      'Personal Time': 1.3,
      'Individual Goals': 1.3,
      'Child Independence': 1.25,
      'Self-Care': 1.2,
      'Career Development': 1.15,
      'Extended Family Support': 0.8,
      'Community Integration': 0.85
    },
    low: { // High collectivism
      'Extended Family Support': 1.3,
      'Community Integration': 1.25,
      'Family Reputation': 1.2,
      'Collective Celebrations': 1.2,
      'Multi-generational Living': 1.25,
      'Personal Time': 0.9,
      'Individual Goals': 0.85
    }
  },
  
  // Power Distance
  [CULTURAL_DIMENSIONS.POWER_DISTANCE]: {
    high: { // High power distance
      'Parental Authority': 1.3,
      'Respect for Elders': 1.25,
      'Formal Education': 1.2,
      'Family Hierarchy': 1.15,
      'Respectful Communication': 1.15,
      'Child-Led Activities': 0.85,
      'Negotiated Boundaries': 0.8
    },
    low: { // Low power distance
      'Child-Led Activities': 1.2,
      'Democratic Family Process': 1.15,
      'Negotiated Boundaries': 1.15,
      'Child Autonomy': 1.2,
      'Informal Learning': 1.1,
      'Parental Authority': 0.9,
      'Family Hierarchy': 0.85
    }
  },
  
  // Uncertainty Avoidance
  [CULTURAL_DIMENSIONS.UNCERTAINTY_AVOIDANCE]: {
    high: { // High uncertainty avoidance
      'Structured Routines': 1.3,
      'Educational Planning': 1.25,
      'Safety Protocols': 1.2,
      'Financial Security': 1.2,
      'Preparation Activities': 1.15,
      'Spontaneous Events': 0.8,
      'Risk-Taking Activities': 0.75
    },
    low: { // Low uncertainty avoidance
      'Flexibility': 1.2,
      'Adaptability': 1.15,
      'Creative Exploration': 1.2,
      'Risk-Taking Activities': 1.15,
      'Spontaneous Events': 1.1,
      'Structured Routines': 0.9,
      'Rigid Scheduling': 0.8
    }
  },
  
  // Masculinity vs Femininity (in cultural context)
  [CULTURAL_DIMENSIONS.MASCULINITY_FEMININITY]: {
    high: { // High masculinity (achievement-oriented)
      'Achievement Recognition': 1.3,
      'Competitive Activities': 1.25,
      'Career Success': 1.2,
      'Academic Excellence': 1.2,
      'Financial Achievement': 1.15,
      'Emotional Expression': 0.85,
      'Work-Life Balance': 0.9
    },
    low: { // High femininity (quality of life oriented)
      'Work-Life Balance': 1.3,
      'Emotional Expression': 1.25,
      'Relationship Nurturing': 1.2,
      'Inclusive Activities': 1.15,
      'Collaborative Projects': 1.1,
      'Competitive Activities': 0.85,
      'Status Symbols': 0.8
    }
  },
  
  // Long Term vs Short Term Orientation
  [CULTURAL_DIMENSIONS.LONG_TERM_ORIENTATION]: {
    high: { // Long-term oriented
      'Educational Investment': 1.3,
      'Financial Planning': 1.25,
      'Tradition Preservation': 1.2,
      'Future Planning': 1.2,
      'Delayed Gratification': 1.15,
      'Immediate Gratification': 0.8,
      'Short-term Rewards': 0.85
    },
    low: { // Short-term oriented
      'Present Enjoyment': 1.2,
      'Immediate Family Needs': 1.15,
      'Current Celebration': 1.1,
      'Quick Results': 1.1,
      'Short-term Rewards': 1.15,
      'Long-term Planning': 0.9,
      'Delayed Gratification': 0.85
    }
  },
  
  // Indulgence vs Restraint
  [CULTURAL_DIMENSIONS.INDULGENCE_RESTRAINT]: {
    high: { // High indulgence
      'Leisure Activities': 1.25,
      'Play Time': 1.2,
      'Self-Expression': 1.15,
      'Experiential Learning': 1.15,
      'Family Fun': 1.1,
      'Discipline Structures': 0.9,
      'Impulse Control': 0.85
    },
    low: { // High restraint
      'Discipline Structures': 1.2,
      'Impulse Control': 1.15,
      'Educational Focus': 1.15,
      'Work Ethic': 1.2,
      'Responsibility Development': 1.15,
      'Leisure Activities': 0.9,
      'Free Play': 0.85
    }
  }
};

// Cultural value system profiles
const CULTURAL_PROFILES = {
  [CULTURAL_VALUE_SYSTEMS.WESTERN_INDIVIDUALIST]: {
    [CULTURAL_DIMENSIONS.INDIVIDUALISM_COLLECTIVISM]: 'high',
    [CULTURAL_DIMENSIONS.POWER_DISTANCE]: 'low',
    [CULTURAL_DIMENSIONS.UNCERTAINTY_AVOIDANCE]: 'medium',
    [CULTURAL_DIMENSIONS.MASCULINITY_FEMININITY]: 'medium',
    [CULTURAL_DIMENSIONS.LONG_TERM_ORIENTATION]: 'low',
    [CULTURAL_DIMENSIONS.INDULGENCE_RESTRAINT]: 'high'
  },
  
  [CULTURAL_VALUE_SYSTEMS.EAST_ASIAN_COLLECTIVIST]: {
    [CULTURAL_DIMENSIONS.INDIVIDUALISM_COLLECTIVISM]: 'low',
    [CULTURAL_DIMENSIONS.POWER_DISTANCE]: 'high',
    [CULTURAL_DIMENSIONS.UNCERTAINTY_AVOIDANCE]: 'high',
    [CULTURAL_DIMENSIONS.MASCULINITY_FEMININITY]: 'high',
    [CULTURAL_DIMENSIONS.LONG_TERM_ORIENTATION]: 'high',
    [CULTURAL_DIMENSIONS.INDULGENCE_RESTRAINT]: 'low'
  },
  
  [CULTURAL_VALUE_SYSTEMS.SOUTH_ASIAN_FAMILY_CENTRIC]: {
    [CULTURAL_DIMENSIONS.INDIVIDUALISM_COLLECTIVISM]: 'low',
    [CULTURAL_DIMENSIONS.POWER_DISTANCE]: 'high',
    [CULTURAL_DIMENSIONS.UNCERTAINTY_AVOIDANCE]: 'medium',
    [CULTURAL_DIMENSIONS.MASCULINITY_FEMININITY]: 'high',
    [CULTURAL_DIMENSIONS.LONG_TERM_ORIENTATION]: 'high',
    [CULTURAL_DIMENSIONS.INDULGENCE_RESTRAINT]: 'low'
  },
  
  [CULTURAL_VALUE_SYSTEMS.LATIN_AMERICAN_FAMILIAL]: {
    [CULTURAL_DIMENSIONS.INDIVIDUALISM_COLLECTIVISM]: 'low',
    [CULTURAL_DIMENSIONS.POWER_DISTANCE]: 'high',
    [CULTURAL_DIMENSIONS.UNCERTAINTY_AVOIDANCE]: 'high',
    [CULTURAL_DIMENSIONS.MASCULINITY_FEMININITY]: 'medium',
    [CULTURAL_DIMENSIONS.LONG_TERM_ORIENTATION]: 'low',
    [CULTURAL_DIMENSIONS.INDULGENCE_RESTRAINT]: 'high'
  },
  
  [CULTURAL_VALUE_SYSTEMS.AFRICAN_COMMUNAL]: {
    [CULTURAL_DIMENSIONS.INDIVIDUALISM_COLLECTIVISM]: 'low',
    [CULTURAL_DIMENSIONS.POWER_DISTANCE]: 'high',
    [CULTURAL_DIMENSIONS.UNCERTAINTY_AVOIDANCE]: 'medium',
    [CULTURAL_DIMENSIONS.MASCULINITY_FEMININITY]: 'medium',
    [CULTURAL_DIMENSIONS.LONG_TERM_ORIENTATION]: 'medium',
    [CULTURAL_DIMENSIONS.INDULGENCE_RESTRAINT]: 'medium'
  },
  
  [CULTURAL_VALUE_SYSTEMS.MIDDLE_EASTERN_TRADITIONAL]: {
    [CULTURAL_DIMENSIONS.INDIVIDUALISM_COLLECTIVISM]: 'low',
    [CULTURAL_DIMENSIONS.POWER_DISTANCE]: 'high',
    [CULTURAL_DIMENSIONS.UNCERTAINTY_AVOIDANCE]: 'high',
    [CULTURAL_DIMENSIONS.MASCULINITY_FEMININITY]: 'high',
    [CULTURAL_DIMENSIONS.LONG_TERM_ORIENTATION]: 'medium',
    [CULTURAL_DIMENSIONS.INDULGENCE_RESTRAINT]: 'low'
  },
  
  [CULTURAL_VALUE_SYSTEMS.NORDIC_EGALITARIAN]: {
    [CULTURAL_DIMENSIONS.INDIVIDUALISM_COLLECTIVISM]: 'medium',
    [CULTURAL_DIMENSIONS.POWER_DISTANCE]: 'low',
    [CULTURAL_DIMENSIONS.UNCERTAINTY_AVOIDANCE]: 'low',
    [CULTURAL_DIMENSIONS.MASCULINITY_FEMININITY]: 'low',
    [CULTURAL_DIMENSIONS.LONG_TERM_ORIENTATION]: 'high',
    [CULTURAL_DIMENSIONS.INDULGENCE_RESTRAINT]: 'high'
  },
  
  [CULTURAL_VALUE_SYSTEMS.INDIGENOUS_COMMUNITY]: {
    [CULTURAL_DIMENSIONS.INDIVIDUALISM_COLLECTIVISM]: 'low',
    [CULTURAL_DIMENSIONS.POWER_DISTANCE]: 'medium',
    [CULTURAL_DIMENSIONS.UNCERTAINTY_AVOIDANCE]: 'medium',
    [CULTURAL_DIMENSIONS.MASCULINITY_FEMININITY]: 'low',
    [CULTURAL_DIMENSIONS.LONG_TERM_ORIENTATION]: 'high',
    [CULTURAL_DIMENSIONS.INDULGENCE_RESTRAINT]: 'medium'
  }
};

// Special task categories in different cultural contexts
const CULTURAL_TASK_CATEGORIES = {
  [CULTURAL_VALUE_SYSTEMS.WESTERN_INDIVIDUALIST]: [
    'Personal Development',
    'Individual Sports',
    'Self-expression',
    'Career Advancement',
    'Nuclear Family Activities'
  ],
  
  [CULTURAL_VALUE_SYSTEMS.EAST_ASIAN_COLLECTIVIST]: [
    'Academic Excellence',
    'Family Reputation',
    'Intergenerational Respect',
    'Group Achievement',
    'Filial Responsibility'
  ],
  
  [CULTURAL_VALUE_SYSTEMS.SOUTH_ASIAN_FAMILY_CENTRIC]: [
    'Extended Family Integration',
    'Cultural Traditions',
    'Family Celebrations',
    'Academic Achievement',
    'Community Standing'
  ],
  
  [CULTURAL_VALUE_SYSTEMS.LATIN_AMERICAN_FAMILIAL]: [
    'Family Celebrations',
    'Multi-generational Gatherings',
    'Religious Traditions',
    'Extended Family Support',
    'Cultural Heritage'
  ],
  
  [CULTURAL_VALUE_SYSTEMS.AFRICAN_COMMUNAL]: [
    'Community Involvement',
    'Collective Responsibility',
    'Elder Wisdom',
    'Extended Family Support',
    'Cultural Storytelling'
  ],
  
  [CULTURAL_VALUE_SYSTEMS.MIDDLE_EASTERN_TRADITIONAL]: [
    'Family Honor',
    'Religious Observance',
    'Elder Care',
    'Gender Role Traditions',
    'Extended Family Relations'
  ],
  
  [CULTURAL_VALUE_SYSTEMS.NORDIC_EGALITARIAN]: [
    'Work-Life Balance',
    'Gender Equality',
    'Outdoor Activities',
    'Child Autonomy',
    'Shared Parenting'
  ],
  
  [CULTURAL_VALUE_SYSTEMS.INDIGENOUS_COMMUNITY]: [
    'Land Connection',
    'Cultural Preservation',
    'Intergenerational Teaching',
    'Natural World Education',
    'Community Celebration'
  ]
};

// ------------------- Core Functions -------------------

/**
 * Analyze cultural context for a family
 * @param {string} familyId - Family identifier
 * @returns {Object} Cultural context analysis
 */
async function analyzeCulturalContext(familyId) {
  try {
    logger.info('Analyzing cultural context', { familyId });
    
    // Get family data
    const familyDoc = await admin.firestore()
      .collection('families')
      .doc(familyId)
      .get();
    
    if (!familyDoc.exists) {
      throw new Error(`Family with ID ${familyId} not found`);
    }
    
    const familyData = familyDoc.data();
    
    // Determine cultural profile - either from explicit settings or infer from data
    let culturalContext = {};
    
    if (familyData.culturalPreferences && familyData.culturalPreferences.valueSystem) {
      // Use explicitly set cultural value system
      culturalContext.valueSystem = familyData.culturalPreferences.valueSystem;
      culturalContext.isExplicitSelection = true;
      
      // Get the full profile for this value system
      culturalContext.dimensionValues = CULTURAL_PROFILES[culturalContext.valueSystem] || {};
      
      // Check for custom dimension overrides
      if (familyData.culturalPreferences.dimensionOverrides) {
        culturalContext.dimensionValues = {
          ...culturalContext.dimensionValues,
          ...familyData.culturalPreferences.dimensionOverrides
        };
      }
    } else {
      // Infer from available data
      culturalContext = inferCulturalContext(familyData);
      culturalContext.isExplicitSelection = false;
    }
    
    // Process special tasks based on cultural context
    culturalContext.specialTasks = getSpecialCulturalTasks(culturalContext.valueSystem);
    
    // Calculate weight adjustments
    culturalContext.weightAdjustments = calculateCulturalAdjustments(culturalContext.dimensionValues);
    
    // Generate cultural insights
    culturalContext.insights = generateCulturalInsights(culturalContext);
    
    // Create final analysis object
    const analysis = {
      familyId,
      valueSystem: culturalContext.valueSystem,
      isExplicitSelection: culturalContext.isExplicitSelection,
      dimensionValues: culturalContext.dimensionValues,
      specialTasks: culturalContext.specialTasks,
      weightAdjustments: culturalContext.weightAdjustments,
      insights: culturalContext.insights,
      analyzedAt: new Date().toISOString()
    };
    
    // Store the analysis
    await storeCulturalAnalysis(familyId, analysis);
    
    logger.info('Completed cultural context analysis', { 
      familyId, 
      valueSystem: culturalContext.valueSystem 
    });
    
    return analysis;
  } catch (error) {
    logger.error('Error analyzing cultural context', { error: error.message, familyId });
    throw error;
  }
}

/**
 * Infer cultural context from family data
 * @param {Object} familyData - Family profile data
 * @returns {Object} Inferred cultural context
 */
function inferCulturalContext(familyData) {
  // Start with default context
  const context = {
    valueSystem: CULTURAL_VALUE_SYSTEMS.WESTERN_INDIVIDUALIST, // Default fallback
    dimensionValues: { ...CULTURAL_PROFILES[CULTURAL_VALUE_SYSTEMS.WESTERN_INDIVIDUALIST] }
  };
  
  // Use demographic data if available
  if (familyData.demographics) {
    // Cultural background
    if (familyData.demographics.culturalBackground) {
      const background = familyData.demographics.culturalBackground.toLowerCase();
      
      // Map backgrounds to value systems
      if (background.includes('asian') && 
          (background.includes('east') || background.includes('chinese') || 
           background.includes('japanese') || background.includes('korean'))) {
        context.valueSystem = CULTURAL_VALUE_SYSTEMS.EAST_ASIAN_COLLECTIVIST;
      } else if (background.includes('asian') && 
                (background.includes('south') || background.includes('indian') || 
                 background.includes('pakistani') || background.includes('bangladeshi'))) {
        context.valueSystem = CULTURAL_VALUE_SYSTEMS.SOUTH_ASIAN_FAMILY_CENTRIC;
      } else if (background.includes('latin') || background.includes('hispanic')) {
        context.valueSystem = CULTURAL_VALUE_SYSTEMS.LATIN_AMERICAN_FAMILIAL;
      } else if (background.includes('african')) {
        context.valueSystem = CULTURAL_VALUE_SYSTEMS.AFRICAN_COMMUNAL;
      } else if (background.includes('middle east') || background.includes('arab')) {
        context.valueSystem = CULTURAL_VALUE_SYSTEMS.MIDDLE_EASTERN_TRADITIONAL;
      } else if (background.includes('scandi') || background.includes('nordic')) {
        context.valueSystem = CULTURAL_VALUE_SYSTEMS.NORDIC_EGALITARIAN;
      } else if (background.includes('indigenous') || background.includes('native')) {
        context.valueSystem = CULTURAL_VALUE_SYSTEMS.INDIGENOUS_COMMUNITY;
      }
    }
    
    // Region/country can override or supplement background
    if (familyData.demographics.region) {
      const region = familyData.demographics.region.toLowerCase();
      
      if (region.includes('north america') && region.includes('indigenous')) {
        context.valueSystem = CULTURAL_VALUE_SYSTEMS.INDIGENOUS_COMMUNITY;
      } else if (region.includes('nordic') || region.includes('scandinav')) {
        context.valueSystem = CULTURAL_VALUE_SYSTEMS.NORDIC_EGALITARIAN;
      } else if (region.includes('east asia')) {
        context.valueSystem = CULTURAL_VALUE_SYSTEMS.EAST_ASIAN_COLLECTIVIST;
      } else if (region.includes('south asia')) {
        context.valueSystem = CULTURAL_VALUE_SYSTEMS.SOUTH_ASIAN_FAMILY_CENTRIC;
      } else if (region.includes('latin america')) {
        context.valueSystem = CULTURAL_VALUE_SYSTEMS.LATIN_AMERICAN_FAMILIAL;
      } else if (region.includes('africa')) {
        context.valueSystem = CULTURAL_VALUE_SYSTEMS.AFRICAN_COMMUNAL;
      } else if (region.includes('middle east')) {
        context.valueSystem = CULTURAL_VALUE_SYSTEMS.MIDDLE_EASTERN_TRADITIONAL;
      }
    }
  }
  
  // Check religion if available (can influence cultural values)
  if (familyData.demographics && familyData.demographics.religion) {
    const religion = familyData.demographics.religion.toLowerCase();
    
    // These are generalizations and should be used carefully
    if (religion.includes('buddhis') || religion.includes('hindu') || 
        religion.includes('taois') || religion.includes('confucian')) {
      // Increase collectivism if from Eastern religions
      context.dimensionValues[CULTURAL_DIMENSIONS.INDIVIDUALISM_COLLECTIVISM] = 'low';
      context.dimensionValues[CULTURAL_DIMENSIONS.LONG_TERM_ORIENTATION] = 'high';
    } else if (religion.includes('muslim') || religion.includes('islam')) {
      // Traditional values often emphasized
      context.dimensionValues[CULTURAL_DIMENSIONS.POWER_DISTANCE] = 'high';
      context.dimensionValues[CULTURAL_DIMENSIONS.UNCERTAINTY_AVOIDANCE] = 'high';
      context.dimensionValues[CULTURAL_DIMENSIONS.INDULGENCE_RESTRAINT] = 'low';
    }
  }
  
  // Use family structure information
  if (familyData.familyStructure) {
    const structure = familyData.familyStructure;
    
    // Extended family living arrangements suggest collectivist values
    if (structure.includes('extended') || structure.includes('multi-generational')) {
      context.dimensionValues[CULTURAL_DIMENSIONS.INDIVIDUALISM_COLLECTIVISM] = 'low';
    }
    
    // Single parent or nuclear isolated family may align with more individualist values
    if (structure.includes('nuclear') || structure.includes('single parent')) {
      context.dimensionValues[CULTURAL_DIMENSIONS.INDIVIDUALISM_COLLECTIVISM] = 'high';
    }
  }
  
  // Use survey responses if available (more accurate)
  if (familyData.surveys && familyData.surveys.culturalValues) {
    const surveyData = familyData.surveys.culturalValues;
    
    // Update dimensions based on explicit survey answers
    if (surveyData.individualism !== undefined) {
      context.dimensionValues[CULTURAL_DIMENSIONS.INDIVIDUALISM_COLLECTIVISM] = 
        surveyData.individualism > 5 ? 'high' : 'low';
    }
    
    if (surveyData.powerDistance !== undefined) {
      context.dimensionValues[CULTURAL_DIMENSIONS.POWER_DISTANCE] = 
        surveyData.powerDistance > 5 ? 'high' : 'low';
    }
    
    if (surveyData.uncertaintyAvoidance !== undefined) {
      context.dimensionValues[CULTURAL_DIMENSIONS.UNCERTAINTY_AVOIDANCE] = 
        surveyData.uncertaintyAvoidance > 5 ? 'high' : 'low';
    }
    
    if (surveyData.masculinity !== undefined) {
      context.dimensionValues[CULTURAL_DIMENSIONS.MASCULINITY_FEMININITY] = 
        surveyData.masculinity > 5 ? 'high' : 'low';
    }
    
    if (surveyData.longTermOrientation !== undefined) {
      context.dimensionValues[CULTURAL_DIMENSIONS.LONG_TERM_ORIENTATION] = 
        surveyData.longTermOrientation > 5 ? 'high' : 'low';
    }
    
    if (surveyData.indulgence !== undefined) {
      context.dimensionValues[CULTURAL_DIMENSIONS.INDULGENCE_RESTRAINT] = 
        surveyData.indulgence > 5 ? 'high' : 'low';
    }
  }
  
  return context;
}

/**
 * Get special tasks important in a specific cultural context
 * @param {string} valueSystem - Cultural value system
 * @returns {Array} Special tasks
 */
function getSpecialCulturalTasks(valueSystem) {
  // Return tasks for the specified value system, or empty array if not found
  return CULTURAL_TASK_CATEGORIES[valueSystem] || [];
}

/**
 * Calculate weight adjustments based on cultural dimensions
 * @param {Object} dimensionValues - Cultural dimension values
 * @returns {Object} Weight adjustments
 */
function calculateCulturalAdjustments(dimensionValues) {
  const adjustments = {
    taskAdjustments: {}
  };
  
  // Process each dimension
  for (const [dimension, value] of Object.entries(dimensionValues)) {
    // Skip if dimension value is medium (neutral)
    if (value === 'medium') continue;
    
    // Skip if no adjustments for this dimension
    if (!CULTURAL_ADJUSTMENTS[dimension]) continue;
    
    // Get adjustments for this dimension value
    const dimensionAdjustments = CULTURAL_ADJUSTMENTS[dimension][value];
    
    if (dimensionAdjustments) {
      // Apply each task adjustment
      for (const [task, multiplier] of Object.entries(dimensionAdjustments)) {
        if (!adjustments.taskAdjustments[task]) {
          adjustments.taskAdjustments[task] = {
            multiplier: 1.0,
            contributors: []
          };
        }
        
        // Track current multiplier
        const currentMultiplier = adjustments.taskAdjustments[task].multiplier;
        
        // Combine multipliers - we use the more significant of the two
        // This prevents compounding of multiple small effects
        if (Math.abs(multiplier - 1.0) > Math.abs(currentMultiplier - 1.0)) {
          adjustments.taskAdjustments[task].multiplier = multiplier;
        }
        
        // Track which dimension contributed to this adjustment
        adjustments.taskAdjustments[task].contributors.push({
          dimension,
          value,
          multiplier
        });
      }
    }
  }
  
  return adjustments;
}

/**
 * Generate insights based on cultural context
 * @param {Object} culturalContext - Cultural context data
 * @returns {Array} Cultural insights
 */
function generateCulturalInsights(culturalContext) {
  const insights = [];
  const valueSystem = culturalContext.valueSystem;
  const dimensions = culturalContext.dimensionValues;
  
  // Add value system specific insights
  switch (valueSystem) {
    case CULTURAL_VALUE_SYSTEMS.WESTERN_INDIVIDUALIST:
      insights.push({
        topic: 'Parenting Focus',
        insight: 'In Western individualist cultures, independence and self-reliance are highly valued. Parenting often focuses on developing a child\'s autonomy and personal identity.'
      });
      insights.push({
        topic: 'Achievement Recognition',
        insight: 'Personal achievement and self-expression are typically emphasized over group harmony. Consider recognizing individual accomplishments.'
      });
      break;
      
    case CULTURAL_VALUE_SYSTEMS.EAST_ASIAN_COLLECTIVIST:
      insights.push({
        topic: 'Education Priority',
        insight: 'Academic achievement is typically highly valued in East Asian cultures. Educational support and academic development may be prioritized tasks.'
      });
      insights.push({
        topic: 'Family Responsibility',
        insight: 'Filial piety and family hierarchy are important values. Children may be expected to contribute to family well-being earlier than in Western contexts.'
      });
      break;
      
    case CULTURAL_VALUE_SYSTEMS.SOUTH_ASIAN_FAMILY_CENTRIC:
      insights.push({
        topic: 'Extended Family',
        insight: 'Extended family relationships are often central, with grandparents and other relatives playing significant roles in childrearing and family decisions.'
      });
      insights.push({
        topic: 'Cultural Traditions',
        insight: 'Maintaining cultural traditions and participating in cultural celebrations may be important family responsibilities.'
      });
      break;
      
    case CULTURAL_VALUE_SYSTEMS.LATIN_AMERICAN_FAMILIAL:
      insights.push({
        topic: 'Family Bonds',
        insight: 'Family connections and loyalty are central values. Regular family gatherings and maintaining close relationships are often high priorities.'
      });
      insights.push({
        topic: 'Emotional Expression',
        insight: 'Open emotional expression and affection are typically valued. Creating warm, expressive family environments may be emphasized.'
      });
      break;
      
    case CULTURAL_VALUE_SYSTEMS.AFRICAN_COMMUNAL:
      insights.push({
        topic: 'Community Involvement',
        insight: 'The wider community often plays a significant role in child-rearing, with shared responsibility for children\'s development.'
      });
      insights.push({
        topic: 'Respect for Elders',
        insight: 'Respecting elders and learning from their wisdom is typically valued. Intergenerational relationships may be emphasized.'
      });
      break;
      
    case CULTURAL_VALUE_SYSTEMS.MIDDLE_EASTERN_TRADITIONAL:
      insights.push({
        topic: 'Family Honor',
        insight: 'Family reputation and honor are often highly valued. Children may be raised with strong awareness of how their behavior reflects on the family.'
      });
      insights.push({
        topic: 'Gender Roles',
        insight: 'Traditional gender roles may influence task distribution, though many families balance tradition with contemporary approaches.'
      });
      break;
      
    case CULTURAL_VALUE_SYSTEMS.NORDIC_EGALITARIAN:
      insights.push({
        topic: 'Gender Equality',
        insight: 'Equal parenting and balanced workload between parents is culturally valued. Tasks may be distributed with minimal gender distinction.'
      });
      insights.push({
        topic: 'Child Autonomy',
        insight: 'Children are often given significant autonomy from an early age, with emphasis on developing independent decision-making.'
      });
      break;
      
    case CULTURAL_VALUE_SYSTEMS.INDIGENOUS_COMMUNITY:
      insights.push({
        topic: 'Connection to Land',
        insight: 'Developing children\'s connection to ancestral lands and natural environments may be a valued aspect of parenting.'
      });
      insights.push({
        topic: 'Cultural Preservation',
        insight: 'Passing down cultural knowledge, language, and traditions is often a central family responsibility.'
      });
      break;
  }
  
  // Add dimension-specific insights
  if (dimensions[CULTURAL_DIMENSIONS.INDIVIDUALISM_COLLECTIVISM] === 'high') {
    insights.push({
      topic: 'Individual Focus',
      insight: 'Your family values tend to emphasize individual needs and personal development. Supporting each family member\'s unique path may be important.'
    });
  } else if (dimensions[CULTURAL_DIMENSIONS.INDIVIDUALISM_COLLECTIVISM] === 'low') {
    insights.push({
      topic: 'Group Harmony',
      insight: 'Your family values tend to emphasize group harmony and collective well-being. Maintaining family cohesion may be a higher priority than individual preferences.'
    });
  }
  
  if (dimensions[CULTURAL_DIMENSIONS.POWER_DISTANCE] === 'high') {
    insights.push({
      topic: 'Authority Structure',
      insight: 'Clear parental authority and defined family roles appear important in your family context. Children may be expected to show higher deference to parents.'
    });
  } else if (dimensions[CULTURAL_DIMENSIONS.POWER_DISTANCE] === 'low') {
    insights.push({
      topic: 'Egalitarian Approach',
      insight: 'Your family values suggest a preference for more equal relationship dynamics. Children may be included in family decisions and encouraged to express opinions.'
    });
  }
  
  return insights;
}

/**
 * Store cultural analysis in database
 * @param {string} familyId - Family identifier
 * @param {Object} analysis - Cultural analysis
 * @returns {string} Document ID
 */
async function storeCulturalAnalysis(familyId, analysis) {
  try {
    // Store complete analysis
    const docRef = await admin.firestore()
      .collection('culturalAnalysis')
      .add({
        ...analysis,
        created: admin.firestore.FieldValue.serverTimestamp()
      });
    
    // Update summary in family document
    await admin.firestore()
      .collection('families')
      .doc(familyId)
      .update({
        culturalContext: {
          id: docRef.id,
          valueSystem: analysis.valueSystem,
          isExplicitSelection: analysis.isExplicitSelection,
          specialTasks: analysis.specialTasks.slice(0, 3), // Top 3 for summary
          analyzedAt: analysis.analyzedAt
        }
      });
    
    return docRef.id;
  } catch (error) {
    logger.error('Error storing cultural analysis', { error: error.message, familyId });
    throw error;
  }
}

/**
 * Get the latest cultural analysis for a family
 * @param {string} familyId - Family identifier
 * @returns {Object} Latest cultural analysis
 */
async function getLatestCulturalAnalysis(familyId) {
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
    if (familyData.culturalContext && familyData.culturalContext.id) {
      const analysisDoc = await admin.firestore()
        .collection('culturalAnalysis')
        .doc(familyData.culturalContext.id)
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
      .collection('culturalAnalysis')
      .where('familyId', '==', familyId)
      .orderBy('created', 'desc')
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      // No analysis found, perform a new one
      return await analyzeCulturalContext(familyId);
    }
    
    // Return the latest analysis
    const doc = snapshot.docs[0];
    return {
      ...doc.data(),
      id: doc.id
    };
  } catch (error) {
    logger.error('Error retrieving latest cultural analysis', { error: error.message, familyId });
    throw error;
  }
}

/**
 * Apply cultural context adjustments to task weight
 * @param {Object} task - Task to adjust
 * @param {Object} culturalAdjustments - Cultural adjustment data
 * @returns {Object} Adjusted task
 */
function applyCulturalAdjustments(task, culturalAdjustments) {
  if (!task || !culturalAdjustments || !culturalAdjustments.taskAdjustments) {
    return task;
  }
  
  const adjustedTask = { ...task };
  const taskName = task.name || task.title || '';
  
  // Find matching task adjustment
  const matchingAdjustment = Object.keys(culturalAdjustments.taskAdjustments)
    .find(adjustmentKey => taskName.includes(adjustmentKey));
  
  if (matchingAdjustment) {
    const adjustment = culturalAdjustments.taskAdjustments[matchingAdjustment];
    
    // Apply multiplier to base weight
    adjustedTask.baseWeight = (adjustedTask.baseWeight || 3) * adjustment.multiplier;
    
    // Add context about the adjustment
    adjustedTask.adjustmentContext = {
      type: 'cultural_context',
      multiplier: adjustment.multiplier,
      contributors: adjustment.contributors
    };
  }
  
  return adjustedTask;
}

/**
 * Generate culturally appropriate suggestions
 * @param {string} familyId - Family identifier
 * @param {string} topicArea - Topic area for suggestions
 * @returns {Object} Cultural suggestions
 */
async function generateCulturalSuggestions(familyId, topicArea) {
  try {
    // Get latest cultural analysis
    const analysis = await getLatestCulturalAnalysis(familyId);
    
    if (!analysis.valueSystem) {
      return {
        familyId,
        topic: topicArea,
        hasSuggestions: false,
        message: 'Insufficient cultural context information'
      };
    }
    
    // Prepare suggestions object
    const suggestions = {
      familyId,
      topic: topicArea,
      valueSystem: analysis.valueSystem,
      hasSuggestions: true,
      generatedAt: new Date().toISOString(),
      suggestions: []
    };
    
    // Generate topic-specific suggestions based on cultural context
    switch (topicArea) {
      case 'parenting_approach':
        suggestions.suggestions = generateParentingSuggestions(analysis);
        break;
        
      case 'family_activities':
        suggestions.suggestions = generateActivitySuggestions(analysis);
        break;
        
      case 'education':
        suggestions.suggestions = generateEducationSuggestions(analysis);
        break;
        
      case 'communication':
        suggestions.suggestions = generateCommunicationSuggestions(analysis);
        break;
        
      case 'discipline':
        suggestions.suggestions = generateDisciplineSuggestions(analysis);
        break;
        
      default:
        // General cultural suggestions
        suggestions.suggestions = generateGeneralSuggestions(analysis);
    }
    
    return suggestions;
  } catch (error) {
    logger.error('Error generating cultural suggestions', { error: error.message, familyId });
    throw error;
  }
}

// ------------------- Suggestion Generators -------------------

/**
 * Generate parenting approach suggestions
 * @param {Object} analysis - Cultural analysis
 * @returns {Array} Parenting suggestions
 */
function generateParentingSuggestions(analysis) {
  const suggestions = [];
  const valueSystem = analysis.valueSystem;
  const dimensions = analysis.dimensionValues || {};
  
  // Individualism/Collectivism dimension
  if (dimensions[CULTURAL_DIMENSIONS.INDIVIDUALISM_COLLECTIVISM] === 'high') {
    suggestions.push({
      title: 'Support Individual Development',
      description: 'In your cultural context, supporting children\'s individual identity development is highly valued. Provide opportunities for self-expression and personal choice.',
      relevance: 'high'
    });
    suggestions.push({
      title: 'Encourage Independence',
      description: 'Foster age-appropriate independence by allowing children to make decisions and solve problems on their own when possible.',
      relevance: 'high'
    });
  } else if (dimensions[CULTURAL_DIMENSIONS.INDIVIDUALISM_COLLECTIVISM] === 'low') {
    suggestions.push({
      title: 'Emphasize Family Identity',
      description: 'In your cultural context, a strong sense of family identity is valued. Regular family traditions and activities that emphasize togetherness can support this.',
      relevance: 'high'
    });
    suggestions.push({
      title: 'Connection to Extended Family',
      description: 'Maintain strong connections with extended family members, involving them in childrearing and family decisions when appropriate.',
      relevance: 'high'
    });
  }
  
  // Value system specific suggestions
  switch (valueSystem) {
    case CULTURAL_VALUE_SYSTEMS.WESTERN_INDIVIDUALIST:
      suggestions.push({
        title: 'Balance Praise and Feedback',
        description: 'Specific praise for effort rather than just outcomes can help develop a growth mindset while supporting self-esteem.',
        relevance: 'medium'
      });
      break;
      
    case CULTURAL_VALUE_SYSTEMS.EAST_ASIAN_COLLECTIVIST:
      suggestions.push({
        title: 'Academic Excellence and Balance',
        description: 'While academic excellence is highly valued, ensure children also develop social skills and emotional well-being.',
        relevance: 'medium'
      });
      break;
      
    case CULTURAL_VALUE_SYSTEMS.SOUTH_ASIAN_FAMILY_CENTRIC:
      suggestions.push({
        title: 'Intergenerational Wisdom',
        description: 'Create opportunities for children to learn from grandparents and elders, valuing their cultural knowledge and experience.',
        relevance: 'medium'
      });
      break;
  }
  
  return suggestions;
}

/**
 * Generate family activity suggestions
 * @param {Object} analysis - Cultural analysis
 * @returns {Array} Activity suggestions
 */
function generateActivitySuggestions(analysis) {
  const suggestions = [];
  const valueSystem = analysis.valueSystem;
  
  // Value system specific suggestions
  switch (valueSystem) {
    case CULTURAL_VALUE_SYSTEMS.WESTERN_INDIVIDUALIST:
      suggestions.push({
        title: 'Child-Interest Activities',
        description: 'Plan family activities that rotate around each child\'s interests, supporting individual identity while creating family bonding.',
        relevance: 'high'
      });
      suggestions.push({
        title: 'Achievement Celebration',
        description: 'Create special celebrations for individual achievements, recognizing each family member\'s unique accomplishments.',
        relevance: 'medium'
      });
      break;
      
    case CULTURAL_VALUE_SYSTEMS.EAST_ASIAN_COLLECTIVIST:
      suggestions.push({
        title: 'Cultural Heritage Activities',
        description: 'Participate in activities that connect children to their cultural heritage, such as language learning, traditional arts, or cultural celebrations.',
        relevance: 'high'
      });
      suggestions.push({
        title: 'Family Skill Building',
        description: 'Engage in activities where family members learn and develop skills together, emphasizing shared progress over individual competition.',
        relevance: 'medium'
      });
      break;
      
    case CULTURAL_VALUE_SYSTEMS.LATIN_AMERICAN_FAMILIAL:
      suggestions.push({
        title: 'Extended Family Gatherings',
        description: 'Regular gatherings with extended family help maintain strong family bonds and cultural connections across generations.',
        relevance: 'high'
      });
      suggestions.push({
        title: 'Cultural Celebrations',
        description: 'Participation in traditional celebrations and festivals helps children develop cultural identity and family connection.',
        relevance: 'high'
      });
      break;
      
    case CULTURAL_VALUE_SYSTEMS.NORDIC_EGALITARIAN:
      suggestions.push({
        title: 'Outdoor Family Activities',
        description: 'Regular outdoor activities regardless of weather foster resilience and connection to nature, highly valued in Nordic traditions.',
        relevance: 'high'
      });
      suggestions.push({
        title: 'Democratic Family Planning',
        description: 'Include children in planning family activities and vacations, giving them age-appropriate input into decisions.',
        relevance: 'medium'
      });
      break;
      
    case CULTURAL_VALUE_SYSTEMS.INDIGENOUS_COMMUNITY:
      suggestions.push({
        title: 'Nature Connection',
        description: 'Activities that connect children to natural environments and traditional lands help develop cultural identity and environmental stewardship.',
        relevance: 'high'
      });
      suggestions.push({
        title: 'Cultural Storytelling',
        description: 'Share traditional stories and teachings, connecting children to cultural wisdom and community values.',
        relevance: 'high'
      });
      break;
      
    default:
      suggestions.push({
        title: 'Family Traditions',
        description: 'Develop unique family traditions that reflect your values and create meaningful memories together.',
        relevance: 'medium'
      });
  }
  
  return suggestions;
}

/**
 * Generate education-related suggestions
 * @param {Object} analysis - Cultural analysis
 * @returns {Array} Education suggestions
 */
function generateEducationSuggestions(analysis) {
  const suggestions = [];
  const valueSystem = analysis.valueSystem;
  const dimensions = analysis.dimensionValues || {};
  
  // Long-term orientation dimension
  if (dimensions[CULTURAL_DIMENSIONS.LONG_TERM_ORIENTATION] === 'high') {
    suggestions.push({
      title: 'Future-Focused Learning',
      description: 'Emphasize how current learning connects to future opportunities. Help children develop long-term educational goals.',
      relevance: 'high'
    });
  } else if (dimensions[CULTURAL_DIMENSIONS.LONG_TERM_ORIENTATION] === 'low') {
    suggestions.push({
      title: 'Practical Application',
      description: 'Focus on how learning applies to immediate practical situations. Connect abstract concepts to real-world experiences.',
      relevance: 'high'
    });
  }
  
  // Value system specific suggestions
  switch (valueSystem) {
    case CULTURAL_VALUE_SYSTEMS.EAST_ASIAN_COLLECTIVIST:
      suggestions.push({
        title: 'Academic Excellence',
        description: 'Support high academic achievement through structured study routines and recognizing educational accomplishments.',
        relevance: 'high'
      });
      suggestions.push({
        title: 'Balanced Development',
        description: 'While maintaining focus on academics, ensure children also develop creative thinking and social-emotional skills.',
        relevance: 'medium'
      });
      break;
      
    case CULTURAL_VALUE_SYSTEMS.WESTERN_INDIVIDUALIST:
      suggestions.push({
        title: 'Critical Thinking',
        description: 'Encourage questioning and independent thinking. Engage children in discussions that develop analytical skills.',
        relevance: 'high'
      });
      suggestions.push({
        title: 'Passion-Based Learning',
        description: 'Support children in deeply exploring subjects they are passionate about, even outside standard curriculum.',
        relevance: 'medium'
      });
      break;
      
    case CULTURAL_VALUE_SYSTEMS.INDIGENOUS_COMMUNITY:
      suggestions.push({
        title: 'Cultural Knowledge Integration',
        description: 'Connect traditional knowledge with formal education. Involve community elders in children\'s learning when possible.',
        relevance: 'high'
      });
      suggestions.push({
        title: 'Environmental Learning',
        description: 'Incorporate learning that connects to land, ecology, and sustainable practices, bridging cultural values with contemporary education.',
        relevance: 'high'
      });
      break;
  }
  
  return suggestions;
}

/**
 * Generate communication suggestions
 * @param {Object} analysis - Cultural analysis
 * @returns {Array} Communication suggestions
 */
function generateCommunicationSuggestions(analysis) {
  const suggestions = [];
  const valueSystem = analysis.valueSystem;
  const dimensions = analysis.dimensionValues || {};
  
  // Power distance dimension
  if (dimensions[CULTURAL_DIMENSIONS.POWER_DISTANCE] === 'high') {
    suggestions.push({
      title: 'Respectful Communication',
      description: 'Maintain clear parent-child boundaries while creating safe space for children to express themselves. Emphasize respectful tone and language.',
      relevance: 'high'
    });
  } else if (dimensions[CULTURAL_DIMENSIONS.POWER_DISTANCE] === 'low') {
    suggestions.push({
      title: 'Open Dialogue',
      description: 'Encourage children to express opinions openly. Explain reasoning behind rules and decisions rather than simply enforcing them.',
      relevance: 'high'
    });
  }
  
  // Value system specific suggestions
  switch (valueSystem) {
    case CULTURAL_VALUE_SYSTEMS.LATIN_AMERICAN_FAMILIAL:
      suggestions.push({
        title: 'Emotional Expression',
        description: 'Create space for open emotional expression and affection. Help children develop emotional vocabulary to express their feelings.',
        relevance: 'high'
      });
      break;
      
    case CULTURAL_VALUE_SYSTEMS.MIDDLE_EASTERN_TRADITIONAL:
      suggestions.push({
        title: 'Respectful Discourse',
        description: 'Model and teach respectful communication, especially with elders. Help children understand appropriate ways to express disagreement.',
        relevance: 'high'
      });
      break;
      
    case CULTURAL_VALUE_SYSTEMS.NORDIC_EGALITARIAN:
      suggestions.push({
        title: 'Direct Communication',
        description: 'Value straightforward, honest communication. Discuss problems directly rather than through hints or indirect approaches.',
        relevance: 'high'
      });
      break;
  }
  
  return suggestions;
}

/**
 * Generate discipline-related suggestions
 * @param {Object} analysis - Cultural analysis
 * @returns {Array} Discipline suggestions
 */
function generateDisciplineSuggestions(analysis) {
  const suggestions = [];
  const dimensions = analysis.dimensionValues || {};
  
  // Indulgence vs restraint dimension
  if (dimensions[CULTURAL_DIMENSIONS.INDULGENCE_RESTRAINT] === 'high') {
    suggestions.push({
      title: 'Natural Consequences',
      description: 'Allow children to experience the natural consequences of their actions when safe to do so. This helps develop internal motivation rather than external control.',
      relevance: 'high'
    });
  } else if (dimensions[CULTURAL_DIMENSIONS.INDULGENCE_RESTRAINT] === 'low') {
    suggestions.push({
      title: 'Clear Structure',
      description: 'Provide clear rules and consistent expectations. Help children develop self-discipline and understand the importance of restraint.',
      relevance: 'high'
    });
  }
  
  // Uncertainty avoidance dimension
  if (dimensions[CULTURAL_DIMENSIONS.UNCERTAINTY_AVOIDANCE] === 'high') {
    suggestions.push({
      title: 'Predictable Consequences',
      description: 'Establish clear, consistent consequences for behavior. Avoid unpredictable or arbitrary discipline approaches.',
      relevance: 'high'
    });
  } else if (dimensions[CULTURAL_DIMENSIONS.UNCERTAINTY_AVOIDANCE] === 'low') {
    suggestions.push({
      title: 'Flexible Guidance',
      description: 'Adapt discipline approaches to specific situations and individual children. Focus on teaching rather than strict rule enforcement.',
      relevance: 'high'
    });
  }
  
  return suggestions;
}

/**
 * Generate general cultural suggestions
 * @param {Object} analysis - Cultural analysis
 * @returns {Array} General suggestions
 */
function generateGeneralSuggestions(analysis) {
  const suggestions = [];
  const valueSystem = analysis.valueSystem;
  
  // General suggestions based on value system
  switch (valueSystem) {
    case CULTURAL_VALUE_SYSTEMS.WESTERN_INDIVIDUALIST:
      suggestions.push({
        title: 'Balance Independence and Support',
        description: 'While fostering independence, ensure children know support is available when needed. Create safe space for trying new things.',
        relevance: 'high'
      });
      break;
      
    case CULTURAL_VALUE_SYSTEMS.EAST_ASIAN_COLLECTIVIST:
      suggestions.push({
        title: 'Family Harmony and Individual Growth',
        description: 'Balance emphasis on family harmony with supporting each child\'s individual development and personal interests.',
        relevance: 'high'
      });
      break;
      
    case CULTURAL_VALUE_SYSTEMS.SOUTH_ASIAN_FAMILY_CENTRIC:
      suggestions.push({
        title: 'Intergenerational Connection',
        description: 'Foster strong connections between children and extended family members, particularly grandparents and elders.',
        relevance: 'high'
      });
      break;
      
    case CULTURAL_VALUE_SYSTEMS.LATIN_AMERICAN_FAMILIAL:
      suggestions.push({
        title: 'Celebratory Traditions',
        description: 'Maintain and create family celebrations that honor achievements, milestones, and cultural traditions.',
        relevance: 'high'
      });
      break;
      
    case CULTURAL_VALUE_SYSTEMS.AFRICAN_COMMUNAL:
      suggestions.push({
        title: 'Community Wisdom',
        description: 'Connect children with community elders and resources that support their development beyond the nuclear family.',
        relevance: 'high'
      });
      break;
      
    case CULTURAL_VALUE_SYSTEMS.MIDDLE_EASTERN_TRADITIONAL:
      suggestions.push({
        title: 'Honor and Responsibility',
        description: 'Help children understand the connection between personal behavior and family honor, emphasizing positive responsibility.',
        relevance: 'high'
      });
      break;
      
    case CULTURAL_VALUE_SYSTEMS.NORDIC_EGALITARIAN:
      suggestions.push({
        title: 'Balanced Family Roles',
        description: 'Model and teach gender equality through balanced distribution of family responsibilities and decision-making.',
        relevance: 'high'
      });
      break;
      
    case CULTURAL_VALUE_SYSTEMS.INDIGENOUS_COMMUNITY:
      suggestions.push({
        title: 'Environmental Connection',
        description: 'Foster children\'s connection to land, nature, and sustainable practices as part of cultural identity development.',
        relevance: 'high'
      });
      break;
  }
  
  // Add a bicultural/multicultural suggestion if this seems to be a blended cultural context
  if (analysis.isExplicitSelection === false) {
    suggestions.push({
      title: 'Bicultural Integration',
      description: 'Help children integrate different cultural influences by explicitly discussing cultural values and practices, allowing them to develop a healthy multicultural identity.',
      relevance: 'medium'
    });
  }
  
  return suggestions;
}

// Export functions
module.exports = {
  analyzeCulturalContext,
  getLatestCulturalAnalysis,
  applyCulturalAdjustments,
  generateCulturalSuggestions
};