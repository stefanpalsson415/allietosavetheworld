// src/utils/choreCleanup.js
import ChoreService from '../services/ChoreService';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Check if cleanup is needed for a family
 * @param {string} familyId - Family ID
 * @param {Date} date - Date to check
 * @returns {Promise<boolean>} - True if cleanup is needed
 */
export async function needsCleanup(familyId, date = new Date()) {
  try {
    // Convert date to start and end of day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const startTimestamp = Timestamp.fromDate(startOfDay);
    const endTimestamp = Timestamp.fromDate(endOfDay);
    
    // Get all instances for this family and date
    const instancesQuery = query(
      collection(db, 'choreInstances'),
      where('familyId', '==', familyId),
      where('date', '>=', startTimestamp),
      where('date', '<=', endTimestamp)
    );
    
    const instancesSnapshot = await getDocs(instancesQuery);
    
    // Group instances by template-child combination
    const instanceGroups = new Map();
    
    instancesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const key = `${data.templateId}-${data.childId}`;
      
      if (!instanceGroups.has(key)) {
        instanceGroups.set(key, 0);
      }
      
      instanceGroups.set(key, instanceGroups.get(key) + 1);
    });
    
    // Check if any group has duplicates
    for (const [key, count] of instanceGroups) {
      if (count > 1) {
        console.log(`[CLEANUP CHECK] Found ${count} instances for ${key}`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking if cleanup is needed:', error);
    return false;
  }
}

/**
 * Clean up excessive chore instances for a specific date
 * Keeps only one instance per template-child combination
 * @param {string} familyId - Family ID
 * @param {Date} date - Date to clean up
 * @returns {Promise<number>} - Number of instances deleted
 */
export async function cleanupExcessiveChoreInstances(familyId, date = new Date()) {
  try {
    console.log(`[CLEANUP] Starting cleanup for family: ${familyId}, date: ${date.toISOString().split('T')[0]}`);
    
    // Use ChoreService's cleanup method
    const deletedCount = await ChoreService.cleanupDuplicateInstances(familyId, date);
    
    console.log(`[CLEANUP] Completed. Deleted ${deletedCount} duplicate instances`);
    return deletedCount;
  } catch (error) {
    console.error('[CLEANUP] Error during cleanup:', error);
    throw error;
  }
}

/**
 * Clean up all duplicate schedules for a family
 * @param {string} familyId - Family ID
 * @returns {Promise<number>} - Number of schedules deactivated
 */
export async function cleanupDuplicateSchedules(familyId) {
  try {
    console.log(`[CLEANUP] Starting schedule cleanup for family: ${familyId}`);
    
    // Use ChoreService's cleanup method
    const deactivatedCount = await ChoreService.cleanupDuplicateSchedules(familyId);
    
    console.log(`[CLEANUP] Completed. Deactivated ${deactivatedCount} duplicate schedules`);
    return deactivatedCount;
  } catch (error) {
    console.error('[CLEANUP] Error during schedule cleanup:', error);
    throw error;
  }
}

/**
 * Completely recreate chore instances for a date after cleanup
 * This ensures proper instances exist after removing duplicates
 * @param {string} familyId - Family ID
 * @param {string} childId - Child ID (optional, if not provided will recreate for all children)
 * @param {Date} date - Date to recreate instances for
 * @returns {Promise<Object>} - Cleanup and creation results
 */
export async function recreateChoreInstances(familyId, childId = null, date = new Date()) {
  try {
    console.log(`[RECREATE] Starting recreation for family: ${familyId}, date: ${date.toISOString().split('T')[0]}`);
    
    // Step 1: Clean up duplicates
    const deletedCount = await cleanupExcessiveChoreInstances(familyId, date);
    
    // Step 2: Generate new instances if needed
    let createdCount = 0;
    if (childId) {
      // Create default instances for specific child
      await ChoreService.createDefaultInstancesIfNeeded(familyId, childId, date);
      createdCount = 1; // We don't get exact count from this method
    } else {
      // Generate instances based on schedules
      const instanceIds = await ChoreService.generateChoreInstances(familyId, date);
      createdCount = instanceIds.length;
    }
    
    console.log(`[RECREATE] Completed. Deleted: ${deletedCount}, Created: ${createdCount}`);
    
    return {
      deletedCount,
      createdCount,
      success: true
    };
  } catch (error) {
    console.error('[RECREATE] Error during recreation:', error);
    throw error;
  }
}

/**
 * Get statistics about chore instances for debugging
 * @param {string} familyId - Family ID
 * @param {Date} date - Date to check
 * @returns {Promise<Object>} - Statistics object
 */
export async function getChoreInstanceStats(familyId, date = new Date()) {
  try {
    // Convert date to start and end of day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const startTimestamp = Timestamp.fromDate(startOfDay);
    const endTimestamp = Timestamp.fromDate(endOfDay);
    
    // Get all instances for this family and date
    const instancesQuery = query(
      collection(db, 'choreInstances'),
      where('familyId', '==', familyId),
      where('date', '>=', startTimestamp),
      where('date', '<=', endTimestamp)
    );
    
    const instancesSnapshot = await getDocs(instancesQuery);
    
    // Collect statistics
    const stats = {
      totalInstances: instancesSnapshot.size,
      byChild: {},
      byTemplate: {},
      byStatus: {
        pending: 0,
        completed: 0,
        approved: 0,
        rejected: 0,
        missed: 0,
        expired: 0
      },
      duplicates: []
    };
    
    // Group instances for analysis
    const instanceGroups = new Map();
    
    instancesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const key = `${data.templateId}-${data.childId}`;
      
      // Count by child
      if (!stats.byChild[data.childId]) {
        stats.byChild[data.childId] = 0;
      }
      stats.byChild[data.childId]++;
      
      // Count by template
      if (!stats.byTemplate[data.templateId]) {
        stats.byTemplate[data.templateId] = 0;
      }
      stats.byTemplate[data.templateId]++;
      
      // Count by status
      if (stats.byStatus[data.status] !== undefined) {
        stats.byStatus[data.status]++;
      }
      
      // Track duplicates
      if (!instanceGroups.has(key)) {
        instanceGroups.set(key, []);
      }
      instanceGroups.get(key).push({
        id: doc.id,
        status: data.status,
        createdAt: data.createdAt
      });
    });
    
    // Find duplicates
    for (const [key, instances] of instanceGroups) {
      if (instances.length > 1) {
        stats.duplicates.push({
          key,
          count: instances.length,
          instances
        });
      }
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting chore instance stats:', error);
    throw error;
  }
}