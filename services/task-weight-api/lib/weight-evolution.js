/**
 * Dynamic Weight Evolution System
 * 
 * This module enables task weights to learn and adapt over time based on:
 * - Family feedback on weights
 * - Observed task patterns across families
 * - Effectiveness of interventions
 * - Changes in family circumstances
 */

const admin = require('firebase-admin');
const logger = require('./logger');
const dataStorage = require('./data-storage');
const versionManager = require('./version-manager');

// ------------------- Core Evolution Functions -------------------

/**
 * Process feedback and generate weight adjustments
 * Analyzes feedback across families and identifies patterns
 * 
 * @returns {Object} Summary of processed feedback and adjustments
 */
async function processFeedbackBatch() {
  try {
    logger.info('Starting feedback batch processing');
    
    // Get pending feedback entries
    const snapshot = await admin.firestore()
      .collection('weightFeedback')
      .where('status', '==', 'pending')
      .orderBy('timestamp')
      .limit(100)
      .get();
    
    if (snapshot.empty) {
      logger.info('No pending feedback to process');
      return { processed: 0 };
    }
    
    // Group feedback by task
    const taskFeedback = {};
    const familySpecificFeedback = {};
    
    snapshot.forEach(doc => {
      const feedback = {
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate().toISOString() || null
      };
      
      // Skip invalid feedback
      if (!feedback.taskId || feedback.calculatedWeight === undefined || 
          feedback.suggestedWeight === undefined) {
        return;
      }
      
      // Group by task
      if (!taskFeedback[feedback.taskId]) {
        taskFeedback[feedback.taskId] = [];
      }
      taskFeedback[feedback.taskId].push(feedback);
      
      // Group by family for family-specific patterns
      if (feedback.familyId) {
        if (!familySpecificFeedback[feedback.familyId]) {
          familySpecificFeedback[feedback.familyId] = [];
        }
        familySpecificFeedback[feedback.familyId].push(feedback);
      }
    });
    
    // Process global adjustments
    const globalAdjustments = await analyzeGlobalPatterns(taskFeedback);
    
    // Process family-specific adjustments
    const familyAdjustments = await analyzeFamilyPatterns(familySpecificFeedback);
    
    // Update feedback status to 'processed'
    const batch = admin.firestore().batch();
    snapshot.forEach(doc => {
      batch.update(doc.ref, { status: 'processed' });
    });
    await batch.commit();
    
    // Log learning data
    await dataStorage.storeAlgorithmLearning({
      type: 'feedback_batch',
      feedbackCount: snapshot.size,
      globalAdjustments,
      familyAdjustmentsCount: Object.keys(familyAdjustments).length,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Completed feedback batch processing', { 
      count: snapshot.size,
      globalAdjustments: Object.keys(globalAdjustments).length,
      familyAdjustments: Object.keys(familyAdjustments).length
    });
    
    return {
      processed: snapshot.size,
      globalAdjustments,
      familyAdjustments
    };
  } catch (error) {
    logger.error('Error processing feedback batch', { error: error.message });
    throw error;
  }
}

/**
 * Analyze feedback across all families for global patterns
 * @param {Object} taskFeedback - Feedback grouped by task
 * @returns {Object} Global task adjustments to apply
 */
async function analyzeGlobalPatterns(taskFeedback) {
  const globalAdjustments = {};
  
  // For each task with feedback
  for (const [taskId, feedbackList] of Object.entries(taskFeedback)) {
    // Only consider tasks with sufficient feedback
    if (feedbackList.length < 3) continue;
    
    // Calculate average adjustment
    const adjustments = feedbackList.map(f => f.adjustment);
    const averageAdjustment = adjustments.reduce((sum, adj) => sum + adj, 0) / adjustments.length;
    
    // Only adjust if the average deviation is significant
    if (Math.abs(averageAdjustment) < 0.5) continue;
    
    // Calculate adjustment confidence based on sample size and consistency
    const stdDev = calculateStandardDeviation(adjustments);
    const sampleSizeFactor = Math.min(feedbackList.length / 10, 1); // Max out at 10 samples
    const consistencyFactor = Math.max(0, 1 - (stdDev / Math.abs(averageAdjustment)));
    
    const confidenceScore = sampleSizeFactor * consistencyFactor;
    
    // Only apply adjustment if confidence is sufficient
    if (confidenceScore < 0.3) continue;
    
    // Determine an appropriate adjustment amount based on confidence
    // More confidence = closer to the full average adjustment
    const appliedAdjustment = averageAdjustment * confidenceScore;
    
    globalAdjustments[taskId] = {
      taskId,
      adjustment: roundToDecimal(appliedAdjustment, 2),
      confidence: roundToDecimal(confidenceScore, 2),
      sampleSize: feedbackList.length,
      averageAdjustment: roundToDecimal(averageAdjustment, 2),
      stdDev: roundToDecimal(stdDev, 2)
    };
  }
  
  return globalAdjustments;
}

/**
 * Analyze family-specific feedback patterns
 * @param {Object} familyFeedback - Feedback grouped by family
 * @returns {Object} Family-specific adjustments to apply
 */
async function analyzeFamilyPatterns(familyFeedback) {
  const familyAdjustments = {};
  
  // For each family with feedback
  for (const [familyId, feedbackList] of Object.entries(familyFeedback)) {
    // Skip families with very little feedback
    if (feedbackList.length < 2) continue;
    
    // Group by task
    const taskAdjustments = {};
    feedbackList.forEach(feedback => {
      if (!taskAdjustments[feedback.taskId]) {
        taskAdjustments[feedback.taskId] = [];
      }
      taskAdjustments[feedback.taskId].push(feedback.adjustment);
    });
    
    // Analyze patterns within each task
    const familyTaskAdjustments = [];
    
    for (const [taskId, adjustments] of Object.entries(taskAdjustments)) {
      // For repeated feedback on the same task, take the average
      if (adjustments.length > 0) {
        const avgAdjustment = adjustments.reduce((sum, adj) => sum + adj, 0) / adjustments.length;
        
        // Only include significant adjustments
        if (Math.abs(avgAdjustment) >= 0.5) {
          familyTaskAdjustments.push({
            taskId,
            adjustment: roundToDecimal(avgAdjustment, 2),
            sampleSize: adjustments.length
          });
        }
      }
    }
    
    // Look for category patterns
    const categoryPatterns = await detectCategoryPatterns(feedbackList);
    
    // Only store if we found task or category adjustments
    if (familyTaskAdjustments.length > 0 || Object.keys(categoryPatterns).length > 0) {
      familyAdjustments[familyId] = {
        familyId,
        taskAdjustments: familyTaskAdjustments,
        categoryAdjustments: categoryPatterns,
        totalFeedbackCount: feedbackList.length
      };
    }
  }
  
  return familyAdjustments;
}

/**
 * Detect patterns in how a family values different categories of tasks
 * @param {Array} feedbackList - List of feedback from a family
 * @returns {Object} Category adjustment factors
 */
async function detectCategoryPatterns(feedbackList) {
  try {
    // Group feedback by task category
    const categoryFeedback = {};
    
    // Get task details for each feedback item
    for (const feedback of feedbackList) {
      // Skip items without task details
      if (!feedback.taskId) continue;
      
      // Get task details from database
      try {
        const taskDoc = await admin.firestore()
          .collection('tasks')
          .doc(feedback.taskId)
          .get();
        
        if (taskDoc.exists) {
          const task = taskDoc.data();
          const category = task.category;
          
          if (category) {
            if (!categoryFeedback[category]) {
              categoryFeedback[category] = [];
            }
            categoryFeedback[category].push(feedback.adjustment);
          }
        }
      } catch (error) {
        logger.warn('Error fetching task details', { taskId: feedback.taskId, error: error.message });
        // Continue with next feedback item
      }
    }
    
    // Analyze each category
    const categoryAdjustments = {};
    
    for (const [category, adjustments] of Object.entries(categoryFeedback)) {
      // Need multiple data points for a category
      if (adjustments.length < 2) continue;
      
      // Calculate average adjustment for category
      const avgAdjustment = adjustments.reduce((sum, adj) => sum + adj, 0) / adjustments.length;
      
      // Only include if the pattern is significant
      if (Math.abs(avgAdjustment) >= 0.3) {
        // Convert to a multiplier
        const multiplier = 1 + (avgAdjustment / 5); // Convert adjustment to a reasonable multiplier
        
        categoryAdjustments[category] = {
          multiplier: roundToDecimal(multiplier, 2),
          sampleSize: adjustments.length,
          averageAdjustment: roundToDecimal(avgAdjustment, 2)
        };
      }
    }
    
    return categoryAdjustments;
  } catch (error) {
    logger.error('Error detecting category patterns', { error: error.message });
    return {};
  }
}

/**
 * Detect correlation between family profiles and task weights
 * @returns {Object} Profile-based adjustment insights
 */
async function analyzeProfileCorrelations() {
  try {
    // Fetch profile-linked feedback data from past 30 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    const snapshot = await admin.firestore()
      .collection('weightFeedback')
      .where('timestamp', '>=', cutoffDate)
      .where('familyId', '!=', null)
      .get();
    
    if (snapshot.empty) {
      return { correlations: [] };
    }
    
    // Fetch family profiles for all feedback entries
    const familyIds = new Set();
    snapshot.forEach(doc => {
      const familyId = doc.data().familyId;
      if (familyId) {
        familyIds.add(familyId);
      }
    });
    
    // Group profiles by similar traits
    const profileGroups = {};
    
    for (const familyId of familyIds) {
      try {
        const profileRef = await admin.firestore()
          .collection('families')
          .doc(familyId)
          .get();
        
        if (profileRef.exists) {
          const profile = profileRef.data();
          
          // Extract key profile features
          const features = {
            familyType: profile.familyType || 'unknown',
            childrenCount: (profile.children?.length || 0),
            hasInfant: (profile.children || []).some(child => child.age < 2),
            hasSchoolAge: (profile.children || []).some(child => child.age >= 5 && child.age < 13),
            hasTeen: (profile.children || []).some(child => child.age >= 13),
            culturalContext: profile.culturalContext || 'unknown'
          };
          
          // Create a profile group key
          const groupKey = `${features.familyType}-${features.childrenCount > 0 ? 'withChildren' : 'noChildren'}-${features.culturalContext}`;
          
          if (!profileGroups[groupKey]) {
            profileGroups[groupKey] = {
              features,
              families: [],
              feedback: []
            };
          }
          
          profileGroups[groupKey].families.push(familyId);
        }
      } catch (error) {
        logger.warn('Error fetching family profile', { familyId, error: error.message });
      }
    }
    
    // Add feedback to each profile group
    snapshot.forEach(doc => {
      const feedback = doc.data();
      const familyId = feedback.familyId;
      
      if (familyId) {
        // Find which group this family belongs to
        for (const [groupKey, group] of Object.entries(profileGroups)) {
          if (group.families.includes(familyId)) {
            group.feedback.push({
              id: doc.id,
              ...feedback,
              timestamp: feedback.timestamp?.toDate().toISOString() || null
            });
          }
        }
      }
    });
    
    // Analyze each profile group for patterns
    const correlations = [];
    
    for (const [groupKey, group] of Object.entries(profileGroups)) {
      // Skip groups with insufficient data
      if (group.feedback.length < 5 || group.families.length < 2) continue;
      
      // Group feedback by task
      const taskPatterns = {};
      
      group.feedback.forEach(feedback => {
        if (!feedback.taskId) return;
        
        if (!taskPatterns[feedback.taskId]) {
          taskPatterns[feedback.taskId] = [];
        }
        
        taskPatterns[feedback.taskId].push(feedback.adjustment);
      });
      
      // Find significant patterns
      const significantTasks = [];
      
      for (const [taskId, adjustments] of Object.entries(taskPatterns)) {
        // Need multiple feedback items
        if (adjustments.length < 3) continue;
        
        const avgAdjustment = adjustments.reduce((sum, adj) => sum + adj, 0) / adjustments.length;
        
        // Only include significant patterns
        if (Math.abs(avgAdjustment) >= 0.7) {
          significantTasks.push({
            taskId,
            averageAdjustment: roundToDecimal(avgAdjustment, 2),
            sampleSize: adjustments.length
          });
        }
      }
      
      // If we found significant patterns, add to correlations
      if (significantTasks.length > 0) {
        correlations.push({
          profileFeatures: group.features,
          familyCount: group.families.length,
          feedbackCount: group.feedback.length,
          significantTasks
        });
      }
    }
    
    logger.info('Completed profile correlation analysis', { 
      correlationsFound: correlations.length 
    });
    
    return { correlations };
  } catch (error) {
    logger.error('Error analyzing profile correlations', { error: error.message });
    throw error;
  }
}

/**
 * Apply global weight adjustments from learning
 * @param {Object} globalAdjustments - Task adjustments to apply
 * @returns {boolean} Success status
 */
async function applyGlobalAdjustments(globalAdjustments) {
  try {
    if (!globalAdjustments || Object.keys(globalAdjustments).length === 0) {
      return true;
    }
    
    // Get latest version details
    const latestVersion = await versionManager.getLatestVersion();
    
    // Create batch for updates
    const batch = admin.firestore().batch();
    
    // Apply each task adjustment
    for (const [taskId, adjustment] of Object.entries(globalAdjustments)) {
      // Get current task definition
      const taskRef = admin.firestore()
        .collection('tasks')
        .doc(taskId);
      
      const taskDoc = await taskRef.get();
      
      if (taskDoc.exists) {
        const task = taskDoc.data();
        
        // Apply the adjustment to base weight
        let baseWeight = parseFloat(task.baseWeight || 3);
        baseWeight += adjustment.adjustment;
        
        // Ensure weight stays in reasonable range
        baseWeight = Math.max(1, Math.min(baseWeight, 5));
        
        // Update the task
        batch.update(taskRef, { 
          baseWeight,
          lastAdjusted: admin.firestore.FieldValue.serverTimestamp(),
          adjustmentHistory: admin.firestore.FieldValue.arrayUnion({
            adjustment: adjustment.adjustment,
            previousWeight: task.baseWeight,
            newWeight: baseWeight,
            confidence: adjustment.confidence,
            sampleSize: adjustment.sampleSize,
            timestamp: new Date().toISOString(),
            algorithmVersion: latestVersion
          })
        });
      }
    }
    
    // Commit all updates
    await batch.commit();
    
    logger.info('Applied global weight adjustments', { 
      count: Object.keys(globalAdjustments).length 
    });
    
    return true;
  } catch (error) {
    logger.error('Error applying global adjustments', { error: error.message });
    throw error;
  }
}

/**
 * Apply family-specific weight adjustments
 * @param {Object} familyAdjustments - Adjustments grouped by family
 * @returns {boolean} Success status
 */
async function applyFamilyAdjustments(familyAdjustments) {
  try {
    if (!familyAdjustments || Object.keys(familyAdjustments).length === 0) {
      return true;
    }
    
    // For each family
    for (const [familyId, adjustments] of Object.entries(familyAdjustments)) {
      // Get the family's weight profile
      const profileRef = admin.firestore()
        .collection('weightProfiles')
        .doc(familyId);
      
      const profileDoc = await profileRef.get();
      
      // Initialize profile data
      let profileData = {
        taskAdjustments: [],
        categoryAdjustments: {},
        lastUpdated: new Date().toISOString()
      };
      
      // If profile exists, use its data
      if (profileDoc.exists) {
        profileData = {
          ...profileDoc.data(),
          lastUpdated: new Date().toISOString()
        };
      }
      
      // Process task adjustments
      if (adjustments.taskAdjustments && adjustments.taskAdjustments.length > 0) {
        // For each task adjustment
        adjustments.taskAdjustments.forEach(taskAdjustment => {
          // Check if this task already has an adjustment
          const existingIndex = profileData.taskAdjustments.findIndex(
            adj => adj.taskId === taskAdjustment.taskId
          );
          
          if (existingIndex >= 0) {
            // Update existing adjustment
            const existing = profileData.taskAdjustments[existingIndex];
            
            // Gradually shift towards the new adjustment
            const blendedAdjustment = (existing.adjustment * 0.7) + (taskAdjustment.adjustment * 0.3);
            
            // Update the entry
            profileData.taskAdjustments[existingIndex] = {
              ...existing,
              adjustment: roundToDecimal(blendedAdjustment, 2),
              sampleSize: (existing.sampleSize || 0) + taskAdjustment.sampleSize,
              lastUpdated: new Date().toISOString()
            };
          } else {
            // Add new adjustment
            // Convert adjustment to multiplier
            const multiplier = 1 + (taskAdjustment.adjustment / 5);
            
            profileData.taskAdjustments.push({
              taskId: taskAdjustment.taskId,
              multiplier: roundToDecimal(multiplier, 2),
              adjustment: taskAdjustment.adjustment,
              sampleSize: taskAdjustment.sampleSize,
              created: new Date().toISOString(),
              lastUpdated: new Date().toISOString()
            });
          }
        });
      }
      
      // Process category adjustments
      if (adjustments.categoryAdjustments && Object.keys(adjustments.categoryAdjustments).length > 0) {
        // Initialize category adjustments if needed
        if (!profileData.categoryAdjustments) {
          profileData.categoryAdjustments = {};
        }
        
        // For each category adjustment
        for (const [category, catAdj] of Object.entries(adjustments.categoryAdjustments)) {
          // If category already has an adjustment, blend them
          if (profileData.categoryAdjustments[category]) {
            const existing = profileData.categoryAdjustments[category];
            
            // Gradually shift towards the new multiplier
            const blendedMultiplier = (existing.multiplier * 0.7) + (catAdj.multiplier * 0.3);
            
            // Update the entry
            profileData.categoryAdjustments[category] = {
              ...existing,
              multiplier: roundToDecimal(blendedMultiplier, 2),
              sampleSize: (existing.sampleSize || 0) + catAdj.sampleSize,
              lastUpdated: new Date().toISOString()
            };
          } else {
            // Add new category adjustment
            profileData.categoryAdjustments[category] = {
              multiplier: catAdj.multiplier,
              sampleSize: catAdj.sampleSize,
              created: new Date().toISOString(),
              lastUpdated: new Date().toISOString()
            };
          }
        }
      }
      
      // Update the profile document
      await profileRef.set(profileData, { merge: true });
    }
    
    logger.info('Applied family-specific adjustments', { 
      count: Object.keys(familyAdjustments).length 
    });
    
    return true;
  } catch (error) {
    logger.error('Error applying family adjustments', { error: error.message });
    throw error;
  }
}

/**
 * Run a full weight evolution cycle
 * This function orchestrates the entire learning and adaptation process
 * 
 * @returns {Object} Results of the evolution cycle
 */
async function runEvolutionCycle() {
  try {
    logger.info('Starting weight evolution cycle');
    
    // Step 1: Process feedback batch
    const feedbackResults = await processFeedbackBatch();
    
    // Step 2: Analyze profile correlations
    const correlations = await analyzeProfileCorrelations();
    
    // Step 3: Apply global adjustments from feedback
    let globalSuccess = false;
    if (feedbackResults.globalAdjustments && 
        Object.keys(feedbackResults.globalAdjustments).length > 0) {
      globalSuccess = await applyGlobalAdjustments(feedbackResults.globalAdjustments);
    }
    
    // Step 4: Apply family-specific adjustments
    let familySuccess = false;
    if (feedbackResults.familyAdjustments && 
        Object.keys(feedbackResults.familyAdjustments).length > 0) {
      familySuccess = await applyFamilyAdjustments(feedbackResults.familyAdjustments);
    }
    
    // Step 5: Store evolution cycle data
    await dataStorage.storeAlgorithmLearning({
      type: 'evolution_cycle',
      timestamp: new Date().toISOString(),
      feedbackProcessed: feedbackResults.processed || 0,
      globalAdjustmentsApplied: Object.keys(feedbackResults.globalAdjustments || {}).length,
      familyAdjustmentsApplied: Object.keys(feedbackResults.familyAdjustments || {}).length,
      correlationsFound: correlations.correlations.length,
      success: {
        global: globalSuccess,
        family: familySuccess
      }
    });
    
    logger.info('Completed weight evolution cycle');
    
    return {
      feedbackProcessed: feedbackResults.processed || 0,
      globalAdjustmentsApplied: Object.keys(feedbackResults.globalAdjustments || {}).length,
      familyAdjustmentsApplied: Object.keys(feedbackResults.familyAdjustments || {}).length,
      correlationsFound: correlations.correlations.length,
      success: globalSuccess && familySuccess
    };
  } catch (error) {
    logger.error('Error in evolution cycle', { error: error.message });
    throw error;
  }
}

// ------------------- Helper Functions -------------------

/**
 * Calculate standard deviation of an array of values
 * @param {Array} values - Numeric values
 * @returns {number} Standard deviation
 */
function calculateStandardDeviation(values) {
  const n = values.length;
  if (n === 0) return 0;
  
  // Calculate mean
  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  
  // Calculate sum of squared differences
  const squaredDiffSum = values.reduce((sum, val) => {
    const diff = val - mean;
    return sum + (diff * diff);
  }, 0);
  
  // Calculate variance and standard deviation
  const variance = squaredDiffSum / n;
  return Math.sqrt(variance);
}

/**
 * Round a number to specified decimal places
 * @param {number} value - Value to round
 * @param {number} decimals - Number of decimal places
 * @returns {number} Rounded value
 */
function roundToDecimal(value, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

module.exports = {
  processFeedbackBatch,
  analyzeGlobalPatterns,
  analyzeFamilyPatterns,
  analyzeProfileCorrelations,
  applyGlobalAdjustments,
  applyFamilyAdjustments,
  runEvolutionCycle
};