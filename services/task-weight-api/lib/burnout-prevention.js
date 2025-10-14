/**
 * Burnout Prevention Intelligence System
 * 
 * This module provides early detection and mitigation of burnout risk
 * in family members based on workload distribution, task patterns,
 * and engagement signals.
 */

const admin = require('firebase-admin');
const logger = require('./logger');
const dataStorage = require('./data-storage');

// ------------------- Core Models and Constants -------------------

// Burnout risk thresholds
const BURNOUT_THRESHOLDS = {
  MINIMAL: 0.15,  // Less than 15% imbalance
  LOW: 0.30,      // 15-30% imbalance
  MODERATE: 0.45, // 30-45% imbalance
  HIGH: 0.60,     // 45-60% imbalance
  SEVERE: 0.75    // Over 60% imbalance
};

// Task categories and their burnout impact factors
const CATEGORY_BURNOUT_IMPACT = {
  'Visible Household Tasks': 0.7,
  'Invisible Household Tasks': 1.1,
  'Visible Parental Tasks': 0.8,
  'Invisible Parental Tasks': 1.2,
  'Administrative Tasks': 0.9,
  'Financial Tasks': 0.8,
  'Emotional Support': 1.3,
  'Healthcare Management': 1.0,
  'Education Support': 0.9,
  'Social Management': 0.8
};

// Types of burnout signals
const BURNOUT_SIGNALS = {
  WORKLOAD: 'workload_imbalance',
  EMOTIONAL: 'emotional_labor',
  INVISIBLE: 'invisible_tasks',
  TEMPORAL: 'temporal_concentration',
  COMPLEXITY: 'high_complexity'
};

// Intervention types
const INTERVENTION_TYPES = {
  TASK_REBALANCE: 'task_rebalancing',
  EXTERNAL_SUPPORT: 'external_support',
  SELF_CARE: 'self_care_recommendation',
  COMMUNICATION: 'communication_prompt',
  TASK_REDUCTION: 'task_reduction'
};

// ------------------- Burnout Detection Functions -------------------

/**
 * Analyze balance data to detect burnout risk
 * @param {string} familyId - Family identifier
 * @returns {Object} Burnout risk assessment
 */
async function assessBurnoutRisk(familyId) {
  try {
    logger.info('Assessing burnout risk', { familyId });
    
    // Get recent balance results
    const balanceHistory = await dataStorage.getFamilyBalanceHistory(familyId, 3);
    
    if (!balanceHistory || balanceHistory.length === 0) {
      logger.warn('No balance data available for burnout assessment', { familyId });
      return {
        familyId,
        assessmentDate: new Date().toISOString(),
        hasRisk: false,
        riskLevel: 'unknown',
        message: 'Insufficient data to assess burnout risk'
      };
    }
    
    // Get most recent balance result
    const latestBalance = balanceHistory[0];
    
    // Get family profile for context
    const familyProfile = await admin.firestore()
      .collection('families')
      .doc(familyId)
      .get();
    
    if (!familyProfile.exists) {
      throw new Error(`Family profile not found for ID: ${familyId}`);
    }
    
    const profileData = familyProfile.data();
    
    // Calculate overall burnout risk
    const burnoutAssessment = calculateBurnoutRisk(latestBalance, balanceHistory, profileData);
    
    // Store the assessment
    await storeBurnoutAssessment(familyId, burnoutAssessment);
    
    logger.info('Completed burnout risk assessment', { 
      familyId, 
      riskLevel: burnoutAssessment.riskLevel 
    });
    
    return burnoutAssessment;
  } catch (error) {
    logger.error('Error assessing burnout risk', { error: error.message, familyId });
    throw error;
  }
}

/**
 * Calculate burnout risk based on balance data and family profile
 * @param {Object} latestBalance - Most recent balance result
 * @param {Array} balanceHistory - Historical balance data
 * @param {Object} profileData - Family profile information
 * @returns {Object} Burnout risk assessment
 */
function calculateBurnoutRisk(latestBalance, balanceHistory, profileData) {
  // Extract overall balance
  const overallBalance = latestBalance.overallBalance || {};
  const categoryBalance = latestBalance.categoryBalance || {};
  
  // Initialize risk signals
  const riskSignals = [];
  
  // 1. Assess imbalance severity
  const imbalance = overallBalance.imbalance || 0;
  let riskLevel = 'minimal';
  
  if (imbalance >= BURNOUT_THRESHOLDS.SEVERE) {
    riskLevel = 'severe';
  } else if (imbalance >= BURNOUT_THRESHOLDS.HIGH) {
    riskLevel = 'high';
  } else if (imbalance >= BURNOUT_THRESHOLDS.MODERATE) {
    riskLevel = 'moderate';
  } else if (imbalance >= BURNOUT_THRESHOLDS.LOW) {
    riskLevel = 'low';
  }
  
  // 2. Determine who is more at risk
  const mamaPercent = overallBalance.mama || 0;
  const papaPercent = overallBalance.papa || 0;
  const atRiskParent = mamaPercent > papaPercent ? 'mama' : 'papa';
  const parentImbalance = Math.abs(mamaPercent - papaPercent);
  
  if (parentImbalance >= BURNOUT_THRESHOLDS.MODERATE) {
    riskSignals.push({
      type: BURNOUT_SIGNALS.WORKLOAD,
      severity: riskLevel,
      message: `${atRiskParent === 'mama' ? 'Mama' : 'Papa'} is handling ${Math.round(Math.max(mamaPercent, papaPercent))}% of family workload`,
      affectedParent: atRiskParent
    });
  }
  
  // 3. Check for specific category imbalances
  const categoryRisks = [];
  
  for (const [category, data] of Object.entries(categoryBalance)) {
    const categoryImbalance = data.imbalance || 0;
    const burnoutImpact = CATEGORY_BURNOUT_IMPACT[category] || 1.0;
    const adjustedImbalance = categoryImbalance * burnoutImpact;
    
    if (adjustedImbalance >= BURNOUT_THRESHOLDS.HIGH) {
      let categoryRiskLevel = 'high';
      if (adjustedImbalance >= BURNOUT_THRESHOLDS.SEVERE) {
        categoryRiskLevel = 'severe';
      }
      
      const moreWorkParent = data.mama > data.papa ? 'mama' : 'papa';
      
      categoryRisks.push({
        category,
        imbalance: categoryImbalance,
        adjustedImbalance,
        riskLevel: categoryRiskLevel,
        moreWorkParent
      });
      
      // Add to risk signals
      riskSignals.push({
        type: category.includes('Invisible') ? BURNOUT_SIGNALS.INVISIBLE : BURNOUT_SIGNALS.WORKLOAD,
        severity: categoryRiskLevel,
        message: `${moreWorkParent === 'mama' ? 'Mama' : 'Papa'} is handling ${Math.round(Math.max(data.mama, data.papa))}% of ${category.toLowerCase()}`,
        affectedParent: moreWorkParent,
        category
      });
    }
    
    // Check for emotional labor overload
    if (category === 'Emotional Support' && adjustedImbalance >= BURNOUT_THRESHOLDS.MODERATE) {
      const moreWorkParent = data.mama > data.papa ? 'mama' : 'papa';
      
      riskSignals.push({
        type: BURNOUT_SIGNALS.EMOTIONAL,
        severity: adjustedImbalance >= BURNOUT_THRESHOLDS.HIGH ? 'high' : 'moderate',
        message: `${moreWorkParent === 'mama' ? 'Mama' : 'Papa'} is handling most of the emotional labor`,
        affectedParent: moreWorkParent
      });
    }
  }
  
  // 4. Detect trends (worsening or improving)
  if (balanceHistory.length > 1) {
    const previousBalance = balanceHistory[1].overallBalance || {};
    const previousImbalance = previousBalance.imbalance || 0;
    
    const trend = imbalance - previousImbalance;
    const trendDescription = Math.abs(trend) < 0.05 ? 'stable' : 
                             trend > 0 ? 'worsening' : 'improving';
    
    // Add trend to risk signals if significant and negative
    if (trendDescription === 'worsening' && trend > 0.1) {
      riskSignals.push({
        type: BURNOUT_SIGNALS.WORKLOAD,
        severity: 'increasing',
        message: `Workload imbalance is increasing (${Math.round(trend * 100)}% change)`,
        affectedParent: atRiskParent
      });
    }
  }
  
  // 5. Consider family context
  const hasYoungChildren = profileData.children && 
                          profileData.children.some(child => child.age < 5);
  const isSingleParent = profileData.familyType === 'single_parent';
  
  // Adjust risk level based on family context
  let contextAdjustedRiskLevel = riskLevel;
  
  if (hasYoungChildren && (riskLevel === 'moderate' || riskLevel === 'high')) {
    contextAdjustedRiskLevel = riskLevel === 'moderate' ? 'high' : 'severe';
    
    riskSignals.push({
      type: BURNOUT_SIGNALS.COMPLEXITY,
      severity: 'high',
      message: `Family has young children (under 5), increasing burnout risk`,
      affectedParent: atRiskParent
    });
  }
  
  if (isSingleParent && riskLevel !== 'minimal') {
    contextAdjustedRiskLevel = upgradeRiskLevel(riskLevel);
    
    riskSignals.push({
      type: BURNOUT_SIGNALS.WORKLOAD,
      severity: 'high',
      message: `Single parent status increases burnout vulnerability`,
      affectedParent: profileData.parentType || 'unknown'
    });
  }
  
  // 6. Generate appropriate interventions
  const interventions = generateInterventions(
    contextAdjustedRiskLevel, 
    riskSignals, 
    atRiskParent, 
    profileData
  );
  
  return {
    familyId: profileData.id,
    assessmentDate: new Date().toISOString(),
    hasRisk: contextAdjustedRiskLevel !== 'minimal',
    riskLevel: contextAdjustedRiskLevel,
    atRiskParent,
    imbalance,
    riskSignals,
    categoryRisks,
    interventions
  };
}

/**
 * Upgrade risk level to the next higher level
 * @param {string} currentLevel - Current risk level
 * @returns {string} Upgraded risk level
 */
function upgradeRiskLevel(currentLevel) {
  const levels = ['minimal', 'low', 'moderate', 'high', 'severe'];
  const currentIndex = levels.indexOf(currentLevel);
  
  if (currentIndex === -1 || currentIndex === levels.length - 1) {
    return currentLevel;
  }
  
  return levels[currentIndex + 1];
}

/**
 * Generate intervention recommendations based on burnout risk
 * @param {string} riskLevel - Overall risk level
 * @param {Array} riskSignals - Detected risk signals
 * @param {string} atRiskParent - Parent at higher risk
 * @param {Object} profileData - Family profile
 * @returns {Array} Recommended interventions
 */
function generateInterventions(riskLevel, riskSignals, atRiskParent, profileData) {
  const interventions = [];
  const parentName = atRiskParent === 'mama' ? 'Mama' : 'Papa';
  
  // 1. Add interventions based on risk level
  if (riskLevel === 'severe' || riskLevel === 'high') {
    // Recommend immediate workload reduction
    interventions.push({
      type: INTERVENTION_TYPES.TASK_REDUCTION,
      priority: 'high',
      message: `${parentName} needs immediate workload reduction`,
      description: `Identify 3-5 tasks that can be delegated, delayed, or dropped to provide immediate relief`,
      suggestedActions: [
        'Identify non-essential tasks to pause temporarily',
        'Consider short-term paid help for household tasks',
        'Simplify meal planning and preparation for 1-2 weeks',
        'Reduce standards temporarily for non-critical tasks'
      ]
    });
    
    // Recommend external support
    interventions.push({
      type: INTERVENTION_TYPES.EXTERNAL_SUPPORT,
      priority: 'high',
      message: `Consider getting additional help for ${parentName}`,
      description: `External support can help reduce overall family workload`,
      suggestedActions: [
        'Explore childcare options for regular breaks',
        'Consider meal delivery or prepared meals',
        'Look into cleaning service or household help',
        'Ask extended family for specific help'
      ]
    });
  }
  
  if (riskLevel !== 'minimal') {
    // Recommend self-care
    interventions.push({
      type: INTERVENTION_TYPES.SELF_CARE,
      priority: riskLevel === 'low' ? 'medium' : 'high',
      message: `${parentName} should prioritize self-care`,
      description: `Regular self-care is essential for preventing burnout`,
      suggestedActions: [
        'Schedule at least 30 minutes of daily personal time',
        'Prioritize adequate sleep',
        'Take breaks throughout the day',
        'Maintain social connections outside family responsibilities'
      ]
    });
  }
  
  // 2. Add interventions based on specific risk signals
  riskSignals.forEach(signal => {
    switch (signal.type) {
      case BURNOUT_SIGNALS.EMOTIONAL:
        interventions.push({
          type: INTERVENTION_TYPES.TASK_REBALANCE,
          priority: signal.severity === 'high' ? 'high' : 'medium',
          message: `Rebalance emotional labor in the family`,
          description: `${parentName} is carrying too much emotional labor, which is particularly draining`,
          suggestedActions: [
            'Explicitly discuss emotional labor distribution',
            'Create a system for sharing responsibility for family morale',
            'Schedule regular check-ins about emotional needs',
            'Consider therapy or counseling for additional support'
          ],
          relatedSignal: signal
        });
        break;
        
      case BURNOUT_SIGNALS.INVISIBLE:
        interventions.push({
          type: INTERVENTION_TYPES.COMMUNICATION,
          priority: 'medium',
          message: `Discuss invisible work distribution`,
          description: `Many invisible tasks are falling to ${parentName}`,
          suggestedActions: [
            'Make a list of all invisible household/parenting tasks',
            'Discuss who currently manages these and redistribute',
            'Set up reminders for newly shared invisible tasks',
            'Check in regularly about invisible workload'
          ],
          relatedSignal: signal
        });
        break;
        
      case BURNOUT_SIGNALS.COMPLEXITY:
        interventions.push({
          type: INTERVENTION_TYPES.EXTERNAL_SUPPORT,
          priority: 'medium',
          message: `Reduce complexity through support systems`,
          description: `The complexity of current family needs is contributing to burnout risk`,
          suggestedActions: [
            'Identify the most complex or stressful tasks',
            'Research specific resources for these challenges',
            'Connect with other families in similar situations',
            'Simplify routines where possible'
          ],
          relatedSignal: signal
        });
        break;
    }
  });
  
  // 3. Ensure we have communication interventions
  if (riskLevel !== 'minimal' && 
      !interventions.some(i => i.type === INTERVENTION_TYPES.COMMUNICATION)) {
    interventions.push({
      type: INTERVENTION_TYPES.COMMUNICATION,
      priority: riskLevel === 'low' ? 'low' : 'medium',
      message: `Schedule a workload discussion`,
      description: `Regular discussions about workload distribution can prevent burnout`,
      suggestedActions: [
        'Set aside time for a non-blaming conversation about family workload',
        'Review the current distribution of tasks together',
        'Identify opportunities to rebalance responsibilities',
        'Create a plan to check in regularly about workload'
      ]
    });
  }
  
  return interventions;
}

/**
 * Store burnout assessment in database
 * @param {string} familyId - Family identifier
 * @param {Object} assessment - Burnout assessment
 * @returns {string} Document ID of stored assessment
 */
async function storeBurnoutAssessment(familyId, assessment) {
  try {
    const docRef = await admin.firestore()
      .collection('burnoutAssessments')
      .add({
        ...assessment,
        created: admin.firestore.FieldValue.serverTimestamp()
      });
    
    // Update latest assessment in family document
    await admin.firestore()
      .collection('families')
      .doc(familyId)
      .update({
        latestBurnoutAssessment: {
          id: docRef.id,
          riskLevel: assessment.riskLevel,
          atRiskParent: assessment.atRiskParent,
          hasRisk: assessment.hasRisk,
          assessmentDate: assessment.assessmentDate,
          interventionCount: assessment.interventions.length
        }
      });
    
    return docRef.id;
  } catch (error) {
    logger.error('Error storing burnout assessment', { error: error.message, familyId });
    throw error;
  }
}

/**
 * Get latest burnout assessment for a family
 * @param {string} familyId - Family identifier
 * @returns {Object} Latest burnout assessment
 */
async function getLatestBurnoutAssessment(familyId) {
  try {
    // First check for cached assessment in family document
    const familyDoc = await admin.firestore()
      .collection('families')
      .doc(familyId)
      .get();
    
    if (!familyDoc.exists) {
      throw new Error(`Family with ID ${familyId} not found`);
    }
    
    const familyData = familyDoc.data();
    
    // If we have a cached assessment, fetch the full version
    if (familyData.latestBurnoutAssessment && familyData.latestBurnoutAssessment.id) {
      const assessmentDoc = await admin.firestore()
        .collection('burnoutAssessments')
        .doc(familyData.latestBurnoutAssessment.id)
        .get();
      
      if (assessmentDoc.exists) {
        return {
          ...assessmentDoc.data(),
          id: assessmentDoc.id
        };
      }
    }
    
    // If no cached assessment or it wasn't found, get the latest one
    const snapshot = await admin.firestore()
      .collection('burnoutAssessments')
      .where('familyId', '==', familyId)
      .orderBy('created', 'desc')
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      // No assessments found, perform a new one
      return await assessBurnoutRisk(familyId);
    }
    
    // Return the latest assessment
    const doc = snapshot.docs[0];
    return {
      ...doc.data(),
      id: doc.id
    };
  } catch (error) {
    logger.error('Error retrieving latest burnout assessment', { error: error.message, familyId });
    throw error;
  }
}

/**
 * Get burnout assessment history for a family
 * @param {string} familyId - Family identifier
 * @param {number} limit - Maximum number of entries
 * @returns {Array} Assessment history
 */
async function getBurnoutHistory(familyId, limit = 10) {
  try {
    const snapshot = await admin.firestore()
      .collection('burnoutAssessments')
      .where('familyId', '==', familyId)
      .orderBy('created', 'desc')
      .limit(parseInt(limit) || 10)
      .get();
    
    const history = [];
    snapshot.forEach(doc => {
      history.push({
        ...doc.data(),
        id: doc.id,
        created: doc.data().created?.toDate().toISOString() || null
      });
    });
    
    return history;
  } catch (error) {
    logger.error('Error retrieving burnout history', { error: error.message, familyId });
    throw error;
  }
}

/**
 * Track intervention effectiveness
 * @param {string} familyId - Family identifier
 * @param {string} interventionType - Type of intervention
 * @param {string} status - Status of intervention (suggested, started, completed, skipped)
 * @param {string} notes - Optional notes about the intervention
 * @returns {string} Document ID of tracking entry
 */
async function trackIntervention(familyId, interventionType, status, notes = null) {
  try {
    const entry = {
      familyId,
      interventionType,
      status,
      notes,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Store in Firestore
    const docRef = await admin.firestore()
      .collection('interventionTracking')
      .add(entry);
    
    logger.info('Tracked intervention', { familyId, interventionType, status });
    return docRef.id;
  } catch (error) {
    logger.error('Error tracking intervention', { error: error.message, familyId });
    throw error;
  }
}

/**
 * Analyze intervention effectiveness across families
 * @returns {Object} Effectiveness analysis
 */
async function analyzeInterventionEffectiveness() {
  try {
    // Get recent assessments with interventions
    const recentAssessments = [];
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const assessmentSnapshot = await admin.firestore()
      .collection('burnoutAssessments')
      .where('created', '>=', monthAgo)
      .get();
    
    assessmentSnapshot.forEach(doc => {
      recentAssessments.push({
        id: doc.id,
        ...doc.data(),
        created: doc.data().created?.toDate().toISOString() || null
      });
    });
    
    // Group interventions by type
    const interventionsByType = {};
    
    for (const assessment of recentAssessments) {
      const interventions = assessment.interventions || [];
      
      for (const intervention of interventions) {
        const type = intervention.type;
        
        if (!interventionsByType[type]) {
          interventionsByType[type] = {
            suggested: 0,
            started: 0,
            completed: 0,
            skipped: 0,
            effectiveness: null
          };
        }
        
        interventionsByType[type].suggested++;
      }
    }
    
    // Get tracking data for these interventions
    const trackingSnapshot = await admin.firestore()
      .collection('interventionTracking')
      .where('timestamp', '>=', monthAgo)
      .get();
    
    // Count started/completed interventions
    trackingSnapshot.forEach(doc => {
      const data = doc.data();
      const type = data.interventionType;
      const status = data.status;
      
      if (interventionsByType[type]) {
        interventionsByType[type][status]++;
      }
    });
    
    // Calculate effectiveness for each type
    for (const [type, data] of Object.entries(interventionsByType)) {
      // Effectiveness = completed / (started + completed + skipped)
      const denominator = data.started + data.completed + data.skipped;
      
      if (denominator > 0) {
        data.effectiveness = (data.completed / denominator) * 100;
      }
      
      // Calculate adoption rate (started or completed / suggested)
      data.adoptionRate = data.suggested > 0 ? 
        ((data.started + data.completed) / data.suggested) * 100 : 0;
    }
    
    logger.info('Analyzed intervention effectiveness');
    
    return {
      interventionsByType,
      analyzedAt: new Date().toISOString(),
      totalAssessmentsAnalyzed: recentAssessments.length
    };
  } catch (error) {
    logger.error('Error analyzing intervention effectiveness', { error: error.message });
    throw error;
  }
}

// ------------------- Alerting Functions -------------------

/**
 * Check if immediate notification is needed for a family
 * @param {string} familyId - Family identifier
 * @returns {Object} Alert information if needed
 */
async function checkForBurnoutAlert(familyId) {
  try {
    // Get latest assessment
    const assessment = await getLatestBurnoutAssessment(familyId);
    
    // Check if risk level warrants an alert
    if (assessment.riskLevel === 'high' || assessment.riskLevel === 'severe') {
      // Check if we've already sent an alert for this assessment
      const alertsSnapshot = await admin.firestore()
        .collection('burnoutAlerts')
        .where('assessmentId', '==', assessment.id)
        .limit(1)
        .get();
      
      if (!alertsSnapshot.empty) {
        // Already sent an alert for this assessment
        return null;
      }
      
      // Prepare alert data
      const alertData = {
        familyId,
        assessmentId: assessment.id,
        riskLevel: assessment.riskLevel,
        atRiskParent: assessment.atRiskParent,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        interventions: assessment.interventions
          .filter(i => i.priority === 'high')
          .map(i => i.message),
        message: `Burnout Alert: ${assessment.atRiskParent === 'mama' ? 'Mama' : 'Papa'} is showing ${assessment.riskLevel} risk of burnout`
      };
      
      // Store the alert
      const alertRef = await admin.firestore()
        .collection('burnoutAlerts')
        .add(alertData);
      
      logger.info('Generated burnout alert', { familyId, riskLevel: assessment.riskLevel });
      
      return {
        ...alertData,
        id: alertRef.id
      };
    }
    
    return null;
  } catch (error) {
    logger.error('Error checking for burnout alert', { error: error.message, familyId });
    throw error;
  }
}

// Export functions
module.exports = {
  assessBurnoutRisk,
  getLatestBurnoutAssessment,
  getBurnoutHistory,
  trackIntervention,
  analyzeInterventionEffectiveness,
  checkForBurnoutAlert
};