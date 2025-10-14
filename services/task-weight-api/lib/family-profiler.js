/**
 * Family Profiler for Task Weight API
 * 
 * Manages family-specific profiles that customize task weight calculations
 * Enables personalized weight adjustments based on family structure, preferences, and behavior
 */

const admin = require('firebase-admin');
const logger = require('./logger');

/**
 * Get a family's weight adjustment profile
 * @param {string} familyId - Family identifier
 * @returns {Object} Family profile data for weight calculations
 */
async function getFamilyProfile(familyId) {
  try {
    if (!familyId) {
      throw new Error('Family ID is required');
    }
    
    // Get basic family data
    const familyDoc = await admin.firestore()
      .collection('families')
      .doc(familyId)
      .get();
    
    if (!familyDoc.exists) {
      throw new Error(`Family with ID ${familyId} not found`);
    }
    
    const familyData = familyDoc.data();
    
    // Get weight adjustment profile
    const profileDoc = await admin.firestore()
      .collection('weightProfiles')
      .doc(familyId)
      .get();
    
    let weightProfile = {};
    if (profileDoc.exists) {
      weightProfile = profileDoc.data();
    } else {
      // Create default profile if none exists
      weightProfile = await createDefaultProfile(familyId, familyData);
    }
    
    // Combine family data with weight profile for a complete profile
    const familyProfile = {
      familyId,
      // Basic family info
      familyType: familyData.familyType || 'nuclear',
      culturalContext: familyData.culturalContext || 'standard',
      relationshipType: familyData.relationshipType || 'standard',
      // Children information for life-stage adaptation
      childrenLifeStages: extractChildLifeStages(familyData),
      // Weight adjustment data
      taskAdjustments: weightProfile.taskAdjustments || [],
      categoryAdjustments: weightProfile.categoryAdjustments || {},
      priorityAreas: weightProfile.priorityAreas || [],
      workloadPreference: weightProfile.workloadPreference || 'balanced',
      // Learning system data
      feedbackHistory: weightProfile.feedbackHistory || [],
      adaptationLevel: weightProfile.adaptationLevel || 'standard',
      lastProfileUpdate: weightProfile.lastUpdated || new Date().toISOString()
    };
    
    return familyProfile;
  } catch (error) {
    logger.error('Error retrieving family profile', { error: error.message, familyId });
    // Return a basic default profile instead of failing
    return {
      familyId,
      familyType: 'nuclear',
      culturalContext: 'standard',
      childrenLifeStages: [],
      taskAdjustments: [],
      categoryAdjustments: {},
      priorityAreas: [],
      workloadPreference: 'balanced',
      adaptationLevel: 'standard',
      isDefaultProfile: true
    };
  }
}

/**
 * Create a default weight profile for a family
 * @param {string} familyId - Family identifier 
 * @param {Object} familyData - Basic family information
 * @returns {Object} Default weight profile
 */
async function createDefaultProfile(familyId, familyData) {
  try {
    // Create a default profile based on family structure
    const defaultProfile = {
      taskAdjustments: [],
      categoryAdjustments: {},
      priorityAreas: detectPriorityAreas(familyData),
      workloadPreference: 'balanced',
      adaptationLevel: 'standard',
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    // Store the default profile
    await admin.firestore()
      .collection('weightProfiles')
      .doc(familyId)
      .set(defaultProfile);
    
    logger.info('Created default weight profile', { familyId });
    return defaultProfile;
  } catch (error) {
    logger.error('Error creating default profile', { error: error.message, familyId });
    throw error;
  }
}

/**
 * Update weight adjustments for a family
 * @param {string} familyId - Family identifier
 * @param {Object} adjustments - Updated adjustment data
 * @returns {boolean} Success status
 */
async function updateWeightAdjustments(familyId, adjustments) {
  try {
    if (!familyId) {
      throw new Error('Family ID is required');
    }
    
    // Validate adjustments
    if (!adjustments || typeof adjustments !== 'object') {
      throw new Error('Invalid adjustment data');
    }
    
    // Get current profile
    const profileDoc = await admin.firestore()
      .collection('weightProfiles')
      .doc(familyId)
      .get();
    
    let existingProfile = {};
    if (profileDoc.exists) {
      existingProfile = profileDoc.data();
    }
    
    // Merge with new adjustments
    const updatedProfile = {
      ...existingProfile,
      ...adjustments,
      lastUpdated: new Date().toISOString()
    };
    
    // Store updated profile
    await admin.firestore()
      .collection('weightProfiles')
      .doc(familyId)
      .set(updatedProfile, { merge: true });
    
    logger.info('Updated family weight adjustments', { familyId });
    return true;
  } catch (error) {
    logger.error('Error updating weight adjustments', { error: error.message, familyId });
    throw error;
  }
}

/**
 * Log feedback for improving the family profile
 * @param {string} familyId - Family identifier
 * @param {Object} feedback - Feedback data
 * @returns {boolean} Success status
 */
async function logProfileFeedback(familyId, feedback) {
  try {
    if (!familyId || !feedback) {
      throw new Error('Family ID and feedback data are required');
    }
    
    // Add timestamp to feedback
    const timestampedFeedback = {
      ...feedback,
      timestamp: new Date().toISOString()
    };
    
    // Store feedback in profile
    await admin.firestore()
      .collection('weightProfiles')
      .doc(familyId)
      .update({
        feedbackHistory: admin.firestore.FieldValue.arrayUnion(timestampedFeedback)
      });
    
    logger.info('Logged profile feedback', { familyId });
    return true;
  } catch (error) {
    logger.error('Error logging profile feedback', { error: error.message, familyId });
    throw error;
  }
}

/**
 * Generate recommended family-specific adjustments based on feedback and history
 * @param {string} familyId - Family identifier
 * @returns {Object} Recommended adjustments
 */
async function generateRecommendedAdjustments(familyId) {
  try {
    if (!familyId) {
      throw new Error('Family ID is required');
    }
    
    // Get family profile
    const profile = await getFamilyProfile(familyId);
    
    // Get feedback history
    const feedbackHistory = profile.feedbackHistory || [];
    
    // Get task history from data storage
    // This would be implemented to analyze past calculations
    const taskHistory = []; // TODO: Implement task history retrieval
    
    // Analyze patterns in feedback and task history
    const recommendations = {
      taskAdjustments: [],
      categoryAdjustments: {},
      adaptationLevel: profile.adaptationLevel
    };
    
    // Implement pattern recognition logic here
    // For now, return placeholder recommendations
    recommendations.message = 'Personalized adjustments based on your family feedback history';
    
    return recommendations;
  } catch (error) {
    logger.error('Error generating recommended adjustments', { error: error.message, familyId });
    throw error;
  }
}

// ------------------- Helper Functions -------------------

/**
 * Extract children's life stages from family data
 * @param {Object} familyData - Family data object
 * @returns {Array} Children with life stages
 */
function extractChildLifeStages(familyData) {
  const children = [];
  
  // Extract from children array if it exists
  if (familyData.children && Array.isArray(familyData.children)) {
    familyData.children.forEach(child => {
      // Determine life stage from age or directly from data
      let lifeStage = child.lifeStage;
      
      if (!lifeStage && child.age) {
        lifeStage = determineLifeStage(child.age);
      }
      
      if (lifeStage) {
        children.push({
          childId: child.id,
          name: child.name,
          age: child.age,
          lifeStage
        });
      }
    });
  }
  
  return children;
}

/**
 * Determine a child's life stage based on age
 * @param {number} age - Child's age
 * @returns {string} Life stage identifier
 */
function determineLifeStage(age) {
  if (age < 0) return null;
  if (age < 2) return 'infant';
  if (age < 5) return 'toddler';
  if (age < 7) return 'preschool';
  if (age < 13) return 'school_age';
  if (age < 19) return 'teen';
  return 'adult';
}

/**
 * Detect priority areas based on family structure
 * @param {Object} familyData - Family data
 * @returns {Array} Priority area identifiers
 */
function detectPriorityAreas(familyData) {
  const priorities = [];
  
  // Check for children and their ages
  if (familyData.children && Array.isArray(familyData.children)) {
    const hasInfant = familyData.children.some(child => child.age < 2);
    const hasToddler = familyData.children.some(child => child.age >= 2 && child.age < 5);
    const hasSchoolAge = familyData.children.some(child => child.age >= 5 && child.age < 13);
    const hasTeen = familyData.children.some(child => child.age >= 13 && child.age < 19);
    
    if (hasInfant) {
      priorities.push('infant_care');
    }
    
    if (hasToddler) {
      priorities.push('toddler_development');
    }
    
    if (hasSchoolAge) {
      priorities.push('education_support');
    }
    
    if (hasTeen) {
      priorities.push('teen_guidance');
    }
  }
  
  // Check for family type priorities
  if (familyData.familyType === 'single_parent') {
    priorities.push('solo_management');
  }
  
  if (familyData.familyType === 'blended') {
    priorities.push('family_cohesion');
  }
  
  return priorities;
}

module.exports = {
  getFamilyProfile,
  updateWeightAdjustments,
  logProfileFeedback,
  generateRecommendedAdjustments
};