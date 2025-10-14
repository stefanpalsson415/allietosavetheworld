/**
 * Data Storage Service for Task Weight API
 * 
 * Handles persistence of calculation results, feedback, and historical data
 * Enables tracking of trends, learning from feedback, and evolution of weights
 */

const admin = require('firebase-admin');
const logger = require('./logger');

/**
 * Log a single task weight calculation
 * @param {Object} task - Task data
 * @param {Object} result - Calculation result
 * @param {string} familyId - Optional family ID
 * @returns {string} Log entry ID
 */
async function logCalculation(task, result, familyId = null) {
  try {
    const logEntry = {
      taskId: task.id,
      taskType: task.type,
      taskCategory: task.category,
      weight: result.weight,
      calculationVersion: result.calculationVersion,
      calculationFactors: result.factors,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      familyId: familyId
    };
    
    // Store in Firestore
    const docRef = await admin.firestore()
      .collection('weightCalculations')
      .add(logEntry);
    
    logger.debug('Logged task weight calculation', { taskId: task.id, weight: result.weight });
    return docRef.id;
  } catch (error) {
    logger.error('Error logging calculation', { error: error.message });
    // Don't throw - this is non-critical
    return null;
  }
}

/**
 * Log a batch of calculations
 * @param {Array} tasks - Task data array
 * @param {Array} results - Results array
 * @param {string} familyId - Optional family ID
 * @returns {boolean} Success status
 */
async function logBatchCalculation(tasks, results, familyId = null) {
  try {
    // Prepare batch
    const batch = admin.firestore().batch();
    
    // Add entries for each task
    tasks.forEach((task, index) => {
      if (index < results.length) {
        const result = results[index];
        
        const logEntry = {
          taskId: task.id,
          taskType: task.type,
          taskCategory: task.category,
          weight: result.weight,
          calculationVersion: result.calculationVersion,
          calculationFactors: result.factors,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          familyId: familyId,
          batchId: new Date().toISOString() // Group together calculations from same batch
        };
        
        const docRef = admin.firestore()
          .collection('weightCalculations')
          .doc(); // Auto-generate ID
        
        batch.set(docRef, logEntry);
      }
    });
    
    // Commit batch
    await batch.commit();
    
    logger.debug('Logged batch calculation', { taskCount: tasks.length });
    return true;
  } catch (error) {
    logger.error('Error logging batch calculation', { error: error.message });
    // Don't throw - this is non-critical
    return false;
  }
}

/**
 * Store feedback about a task weight
 * @param {string} taskId - Task identifier
 * @param {number} calculatedWeight - Weight from calculation
 * @param {number} suggestedWeight - Weight suggested by user
 * @param {string} familyId - Optional family ID
 * @param {string} notes - Optional feedback notes
 * @returns {string} Feedback entry ID
 */
async function storeFeedback(taskId, calculatedWeight, suggestedWeight, familyId = null, notes = null) {
  try {
    const feedbackEntry = {
      taskId,
      calculatedWeight,
      suggestedWeight,
      adjustment: suggestedWeight - calculatedWeight,
      adjustmentPercent: ((suggestedWeight - calculatedWeight) / calculatedWeight) * 100,
      familyId,
      notes,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending' // Can be 'pending', 'approved', 'rejected', 'implemented'
    };
    
    // Store in Firestore
    const docRef = await admin.firestore()
      .collection('weightFeedback')
      .add(feedbackEntry);
    
    logger.info('Stored weight feedback', { taskId, adjustment: feedbackEntry.adjustment });
    
    // If family ID provided, also store in their profile
    if (familyId) {
      await admin.firestore()
        .collection('weightProfiles')
        .doc(familyId)
        .update({
          feedbackHistory: admin.firestore.FieldValue.arrayUnion({
            taskId,
            calculatedWeight,
            suggestedWeight,
            adjustment: feedbackEntry.adjustment,
            timestamp: new Date().toISOString()
          })
        });
    }
    
    return docRef.id;
  } catch (error) {
    logger.error('Error storing feedback', { error: error.message });
    throw error;
  }
}

/**
 * Get calculation history for a specific task
 * @param {string} taskId - Task identifier
 * @param {number} limit - Maximum number of entries to return
 * @returns {Array} History entries
 */
async function getTaskHistory(taskId, limit = 10) {
  try {
    // Get entries from Firestore
    const snapshot = await admin.firestore()
      .collection('weightCalculations')
      .where('taskId', '==', taskId)
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit) || 10)
      .get();
    
    // Extract data
    const history = [];
    snapshot.forEach(doc => {
      history.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate().toISOString() || null
      });
    });
    
    return history;
  } catch (error) {
    logger.error('Error retrieving task history', { error: error.message, taskId });
    throw error;
  }
}

/**
 * Store family balance calculation results
 * @param {string} familyId - Family identifier
 * @param {Object} balanceScores - Calculated balance results
 * @returns {string} Entry ID
 */
async function storeBalanceResults(familyId, balanceScores) {
  try {
    if (!familyId) {
      throw new Error('Family ID is required');
    }
    
    const entry = {
      familyId,
      overallBalance: balanceScores.overallBalance,
      categoryBalance: balanceScores.categoryBalance,
      calculationVersion: balanceScores.calculationVersion,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Store in Firestore
    const docRef = await admin.firestore()
      .collection('balanceResults')
      .add(entry);
    
    // Also update latest in family document
    await admin.firestore()
      .collection('families')
      .doc(familyId)
      .update({
        latestBalanceResults: entry,
        balanceUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    
    logger.info('Stored balance results', { familyId });
    return docRef.id;
  } catch (error) {
    logger.error('Error storing balance results', { error: error.message, familyId });
    // Don't throw - this is non-critical
    return null;
  }
}

/**
 * Get family balance history
 * @param {string} familyId - Family identifier
 * @param {number} limit - Maximum entries to return
 * @returns {Array} History entries
 */
async function getFamilyBalanceHistory(familyId, limit = 5) {
  try {
    if (!familyId) {
      throw new Error('Family ID is required');
    }
    
    // Get entries from Firestore
    const snapshot = await admin.firestore()
      .collection('balanceResults')
      .where('familyId', '==', familyId)
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit) || 5)
      .get();
    
    // Extract data
    const history = [];
    snapshot.forEach(doc => {
      history.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate().toISOString() || null
      });
    });
    
    return history;
  } catch (error) {
    logger.error('Error retrieving balance history', { error: error.message, familyId });
    throw error;
  }
}

/**
 * Store algorithm learning information
 * @param {Object} learningData - Data about calculation improvements
 * @returns {string} Entry ID
 */
async function storeAlgorithmLearning(learningData) {
  try {
    const entry = {
      ...learningData,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Store in Firestore
    const docRef = await admin.firestore()
      .collection('algorithmLearning')
      .add(entry);
    
    logger.info('Stored algorithm learning data', { type: learningData.type });
    return docRef.id;
  } catch (error) {
    logger.error('Error storing algorithm learning', { error: error.message });
    // Don't throw - this is non-critical
    return null;
  }
}

module.exports = {
  logCalculation,
  logBatchCalculation,
  storeFeedback,
  getTaskHistory,
  storeBalanceResults,
  getFamilyBalanceHistory,
  storeAlgorithmLearning
};