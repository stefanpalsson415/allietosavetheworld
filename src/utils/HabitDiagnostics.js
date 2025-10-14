/**
 * HabitDiagnostics.js
 * A utility for monitoring and debugging habit flow issues
 */
import { doc, getDoc, collection, query, where, getDocs, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Debugger class for habit flows
 */
class HabitDiagnostics {
  constructor() {
    this.isEnabled = true;
    this.logStack = [];
    this.maxLogs = 100;
    this.persistErrors = true;
    this.lastError = null;
  }

  /**
   * Enable or disable diagnostics
   */
  enable(isEnabled = true) {
    this.isEnabled = isEnabled;
    this.log(`Diagnostics ${isEnabled ? 'enabled' : 'disabled'}`);
    return this;
  }

  /**
   * Add a log entry with optional data
   */
  log(message, data = null, type = 'info') {
    if (!this.isEnabled) return;
    
    const entry = {
      timestamp: new Date().toISOString(),
      message,
      data: data ? this.sanitize(data) : null,
      type
    };
    
    this.logStack.push(entry);
    
    // Keep log stack from getting too large
    if (this.logStack.length > this.maxLogs) {
      this.logStack.shift();
    }
    
    // Output to console based on type
    switch (type) {
      case 'error':
        console.error(`[HabitDiagnostics] ${message}`, data);
        this.lastError = entry;
        break;
      case 'warn':
        console.warn(`[HabitDiagnostics] ${message}`, data);
        break;
      default:
        console.log(`[HabitDiagnostics] ${message}`, data);
    }
    
    return this;
  }

  /**
   * Log an error and optional trace
   */
  error(message, error = null) {
    const errorData = error ? { 
      message: error.message,
      stack: error.stack,
      name: error.name
    } : null;
    
    return this.log(message, errorData, 'error');
  }

  /**
   * Log a warning
   */
  warn(message, data = null) {
    return this.log(message, data, 'warn');
  }

  /**
   * Track a step in the habit lifecycle
   */
  trackStep(stepName, habitId, data = null) {
    return this.log(`STEP: ${stepName} for habit ${habitId}`, data);
  }

  /**
   * Sanitize data for logging to avoid circular references
   */
  sanitize(data) {
    try {
      // Convert undefined values
      if (data === undefined) return "undefined";
      
      // Convert simple primitives
      if (data === null || typeof data !== 'object') {
        return data;
      }
      
      // Handle array
      if (Array.isArray(data)) {
        return data.map(item => this.sanitize(item));
      }
      
      // Skip Firebase internals which can cause circular refs
      if (data._firestore || data.firestore) {
        return "[Firebase Reference]";
      }
      
      // Process object
      const sanitized = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          try {
            sanitized[key] = this.sanitize(data[key]);
          } catch (e) {
            sanitized[key] = "[Error: Could not sanitize]";
          }
        }
      }
      return sanitized;
    } catch (error) {
      return `[Error sanitizing: ${error.message}]`;
    }
  }

  /**
   * Get diagnostic information about a habit's persistence
   * @param {string} familyId - The family ID
   * @param {string} habitId - The habit ID
   * @returns {Promise<object>} - Diagnostic result
   */
  async diagnoseHabitPersistence(familyId, habitId) {
    if (!familyId || !habitId) {
      this.error("Cannot diagnose habit: missing familyId or habitId");
      return { error: "Missing parameters", exists: false };
    }
    
    try {
      this.log(`Diagnosing habit persistence for habit ${habitId}`);
      
      const result = {
        habitId,
        familyId,
        locations: {},
        instances: { exists: false, count: 0 },
        streaks: { exists: false, value: 0 },
        errors: []
      };
      
      // Check families/familyId/habits/habitId
      try {
        const familyHabitRef = doc(db, 'families', familyId, 'habits', habitId);
        const familyHabitDoc = await getDoc(familyHabitRef);
        
        result.locations.familiesCollection = {
          exists: familyHabitDoc.exists(),
          data: familyHabitDoc.exists() ? this.sanitize(familyHabitDoc.data()) : null
        };
      } catch (error) {
        result.errors.push({
          location: 'familiesCollection',
          error: error.message
        });
        this.error(`Error checking families collection for habit ${habitId}`, error);
      }
      
      // Check habits/habitId
      try {
        const topLevelHabitRef = doc(db, 'habits', habitId);
        const topLevelHabitDoc = await getDoc(topLevelHabitRef);
        
        result.locations.topLevelCollection = {
          exists: topLevelHabitDoc.exists(),
          data: topLevelHabitDoc.exists() ? this.sanitize(topLevelHabitDoc.data()) : null
        };
      } catch (error) {
        result.errors.push({
          location: 'topLevelCollection',
          error: error.message
        });
        this.error(`Error checking top-level collection for habit ${habitId}`, error);
      }
      
      // Check families/familyId/habitInstances/habitId
      try {
        const habitInstancesRef = doc(db, 'families', familyId, 'habitInstances', habitId);
        const habitInstancesDoc = await getDoc(habitInstancesRef);
        
        if (habitInstancesDoc.exists()) {
          const instances = habitInstancesDoc.data().instances || [];
          result.instances = {
            exists: true,
            count: instances.length,
            data: this.sanitize(instances)
          };
        }
      } catch (error) {
        result.errors.push({
          location: 'habitInstances',
          error: error.message
        });
        this.error(`Error checking habit instances for habit ${habitId}`, error);
      }
      
      // Check streak data in families/familyId
      try {
        const familyRef = doc(db, 'families', familyId);
        const familyDoc = await getDoc(familyRef);
        
        if (familyDoc.exists()) {
          const familyData = familyDoc.data();
          const streaks = familyData.habitStreaks || {};
          const streakValue = streaks[habitId] || 0;
          const recordValue = streaks[`${habitId}_record`] || 0;
          
          result.streaks = {
            exists: streakValue > 0,
            value: streakValue,
            record: recordValue
          };
        }
      } catch (error) {
        result.errors.push({
          location: 'streaks',
          error: error.message
        });
        this.error(`Error checking streaks for habit ${habitId}`, error);
      }
      
      // Determine overall persistence state
      result.persists = (
        result.locations.familiesCollection?.exists ||
        result.locations.topLevelCollection?.exists
      );
      
      // Determine if habit data is consistent
      result.isConsistent = (
        (result.instances.exists && result.instances.count > 0) ?
        (result.persists && result.streaks.exists) : true
      );
      
      this.log(`Habit persistence diagnosis complete for ${habitId}`, result);
      
      return result;
    } catch (error) {
      this.error(`Overall error diagnosing habit ${habitId}`, error);
      return { 
        error: error.message, 
        stack: error.stack,
        exists: false
      };
    }
  }

  /**
   * Diagnose all habits for a family to identify any persistence issues
   * @param {string} familyId - The family ID
   * @returns {Promise<Array>} - Array of diagnostic results
   */
  async diagnoseAllHabits(familyId) {
    if (!familyId) {
      this.error("Cannot diagnose habits: missing familyId");
      return { error: "Missing familyId", results: [] };
    }
    
    try {
      this.log(`Diagnosing all habits for family ${familyId}`);
      
      const allHabitIds = new Set();
      const results = {
        summary: {
          totalHabits: 0,
          persistingHabits: 0,
          inconsistentHabits: 0,
          errorHabits: 0
        },
        details: []
      };
      
      // Collect all habit IDs from families collection
      try {
        const familyHabitsQuery = query(
          collection(db, 'families', familyId, 'habits')
        );
        const familyHabitsSnapshot = await getDocs(familyHabitsQuery);
        
        familyHabitsSnapshot.docs.forEach(doc => {
          allHabitIds.add(doc.id);
        });
        
        this.log(`Found ${familyHabitsSnapshot.size} habits in families collection`);
      } catch (error) {
        this.error("Error querying families collection", error);
      }
      
      // Collect all habit IDs from top-level collection
      try {
        const topLevelQuery = query(
          collection(db, 'habits'),
          where('familyId', '==', familyId)
        );
        const topLevelSnapshot = await getDocs(topLevelQuery);
        
        topLevelSnapshot.docs.forEach(doc => {
          allHabitIds.add(doc.id);
        });
        
        this.log(`Found ${topLevelSnapshot.size} habits in top-level collection`);
      } catch (error) {
        this.error("Error querying top-level collection", error);
      }
      
      // Collect all habit IDs from habitInstances
      try {
        const habitInstancesQuery = query(
          collection(db, 'families', familyId, 'habitInstances')
        );
        const habitInstancesSnapshot = await getDocs(habitInstancesQuery);
        
        habitInstancesSnapshot.docs.forEach(doc => {
          allHabitIds.add(doc.id);
        });
        
        this.log(`Found ${habitInstancesSnapshot.size} habit instances`);
      } catch (error) {
        this.error("Error querying habit instances", error);
      }
      
      // Set totals
      results.summary.totalHabits = allHabitIds.size;
      
      // Diagnose each habit
      for (const habitId of allHabitIds) {
        try {
          const habitDiagnosis = await this.diagnoseHabitPersistence(familyId, habitId);
          
          // Update summary counts
          if (habitDiagnosis.persists) {
            results.summary.persistingHabits++;
          }
          
          if (!habitDiagnosis.isConsistent) {
            results.summary.inconsistentHabits++;
          }
          
          if (habitDiagnosis.errors && habitDiagnosis.errors.length > 0) {
            results.summary.errorHabits++;
          }
          
          // Add to details
          results.details.push(habitDiagnosis);
        } catch (diagError) {
          this.error(`Error diagnosing habit ${habitId}`, diagError);
          results.details.push({
            habitId,
            error: diagError.message,
            persists: false,
            isConsistent: false
          });
          results.summary.errorHabits++;
        }
      }
      
      this.log(`Habit diagnosis complete for family ${familyId}`, results.summary);
      
      return results;
    } catch (error) {
      this.error(`Overall error diagnosing habits for family ${familyId}`, error);
      return { 
        error: error.message, 
        results: []
      };
    }
  }

  /**
   * Create a repair plan for fixing habit persistence issues
   * @param {string} familyId - The family ID
   * @returns {Promise<object>} - The repair plan
   */
  async createHabitRepairPlan(familyId) {
    try {
      const diagnosis = await this.diagnoseAllHabits(familyId);
      
      if (diagnosis.error) {
        return {
          error: diagnosis.error,
          canRepair: false
        };
      }
      
      const repairPlan = {
        familyId,
        totalHabits: diagnosis.summary.totalHabits,
        actionsNeeded: 0,
        actions: []
      };
      
      // Process each habit with issues
      for (const habitDiag of diagnosis.details) {
        if (!habitDiag.persists || !habitDiag.isConsistent) {
          let action = {
            habitId: habitDiag.habitId,
            type: 'unknown',
            steps: []
          };
          
          // Define repair steps based on diagnosis
          if (!habitDiag.persists) {
            action.type = 'restore';
            action.description = 'Habit does not persist in any collection';
            
            // Check if we have instance data to restore from
            if (habitDiag.instances.exists && habitDiag.instances.count > 0) {
              action.steps.push({
                step: 'recreate_from_instances',
                description: `Recreate habit from ${habitDiag.instances.count} instances`
              });
            } else {
              action.steps.push({
                step: 'recreate_empty',
                description: 'Recreate empty habit structure'
              });
            }
          } else if (!habitDiag.isConsistent) {
            action.type = 'repair';
            action.description = 'Habit persistence is inconsistent';
            
            // Figure out what's wrong
            if (!habitDiag.streaks.exists && habitDiag.instances.count > 0) {
              action.steps.push({
                step: 'recreate_streaks',
                description: 'Recreate streak data from instances'
              });
            }
            
            // Check for location inconsistencies
            const inFamilies = habitDiag.locations.familiesCollection?.exists;
            const inTopLevel = habitDiag.locations.topLevelCollection?.exists;
            
            if (!inFamilies && inTopLevel) {
              action.steps.push({
                step: 'copy_to_families',
                description: 'Copy habit from top-level to families collection'
              });
            } else if (inFamilies && !inTopLevel) {
              action.steps.push({
                step: 'copy_to_toplevel',
                description: 'Copy habit from families to top-level collection'
              });
            }
          }
          
          // Add the action if it has steps
          if (action.steps.length > 0) {
            repairPlan.actions.push(action);
            repairPlan.actionsNeeded += action.steps.length;
          }
        }
      }
      
      return repairPlan;
    } catch (error) {
      this.error(`Error creating repair plan for family ${familyId}`, error);
      return { 
        error: error.message,
        canRepair: false
      };
    }
  }
  
  /**
   * Execute a repair plan for a specific habit
   * @param {string} familyId - The family ID
   * @param {string} habitId - The habit ID to repair
   * @returns {Promise<object>} - The repair result
   */
  async repairHabit(familyId, habitId) {
    try {
      if (!familyId || !habitId) {
        this.error("Cannot repair habit: missing familyId or habitId");
        return { success: false, error: "Missing parameters" };
      }
      
      this.log(`Starting repair for habit ${habitId}`);
      
      // First run a diagnosis
      const diagnosis = await this.diagnoseHabitPersistence(familyId, habitId);
      
      if (diagnosis.error) {
        this.error(`Error diagnosing habit ${habitId} for repair`, diagnosis.error);
        return { success: false, error: diagnosis.error };
      }
      
      // If habit is already consistent, no action needed
      if (diagnosis.persists && diagnosis.isConsistent) {
        this.log(`Habit ${habitId} is already consistent, no repair needed`);
        return { success: true, message: "Habit is already in good state", repairNeeded: false };
      }
      
      const result = {
        habitId,
        familyId,
        repairNeeded: true,
        actionsPerformed: [],
        success: false
      };
      
      try {
        // If the habit doesn't persist at all but we have instances
        if (!diagnosis.persists && diagnosis.instances.exists && diagnosis.instances.count > 0) {
          this.trackStep("REPAIR_RECREATE_FROM_INSTANCES", habitId);
          
          // Attempt to recreate the habit from instances
          const instances = diagnosis.instances.data || [];
          
          if (instances.length > 0) {
            // Extract information from instances to recreate the habit
            const latestInstance = instances[instances.length - 1];
            const habitData = {
              id: habitId,
              familyId,
              title: latestInstance.notes || "Restored Habit", 
              description: `Habit restored from ${instances.length} instances`,
              createdAt: new Date().toISOString(),
              lastCompleted: latestInstance.timestamp,
              streak: instances.length,
              record: instances.length,
              isUserGenerated: true,
              completionInstances: instances,
              // Add minimum required fields for atomic habit structure
              cue: "Restored habit cue",
              action: "Restored habit action",
              reward: "Restored habit reward",
              identity: "I am someone who maintains healthy habits"
            };
            
            // Save to families/familyId/habits collection
            await setDoc(doc(db, 'families', familyId, 'habits', habitId), habitData);
            
            result.actionsPerformed.push("recreated_from_instances");
          }
        }
        
        // If habit exists in one location but not another, replicate it
        const inFamilies = diagnosis.locations.familiesCollection?.exists;
        const inTopLevel = diagnosis.locations.topLevelCollection?.exists;
        
        if (inFamilies && !inTopLevel) {
          this.trackStep("REPAIR_COPY_TO_TOPLEVEL", habitId);
          
          // Copy from families to top-level
          const familyHabitData = diagnosis.locations.familiesCollection.data;
          if (familyHabitData) {
            await setDoc(doc(db, 'habits', habitId), {
              ...familyHabitData,
              id: habitId,
              familyId,
              updatedAt: new Date().toISOString()
            });
            
            result.actionsPerformed.push("copied_to_toplevel");
          }
        } else if (!inFamilies && inTopLevel) {
          this.trackStep("REPAIR_COPY_TO_FAMILIES", habitId);
          
          // Copy from top-level to families
          const topLevelData = diagnosis.locations.topLevelCollection.data;
          if (topLevelData) {
            await setDoc(doc(db, 'families', familyId, 'habits', habitId), {
              ...topLevelData,
              id: habitId,
              familyId,
              updatedAt: new Date().toISOString()
            });
            
            result.actionsPerformed.push("copied_to_families");
          }
        }
        
        // If streak data is missing but we have instances, recreate streaks
        if (diagnosis.instances.exists && diagnosis.instances.count > 0 && !diagnosis.streaks.exists) {
          this.trackStep("REPAIR_RECREATE_STREAKS", habitId);
          
          const instances = diagnosis.instances.data || [];
          if (instances.length > 0) {
            // Update streaks in family document
            await updateDoc(doc(db, 'families', familyId), {
              [`habitStreaks.${habitId}`]: instances.length,
              [`habitStreaks.${habitId}_record`]: instances.length
            });
            
            result.actionsPerformed.push("recreated_streaks");
          }
        }
        
        // Run final diagnostic to verify the repair worked
        const finalDiagnosis = await this.diagnoseHabitPersistence(familyId, habitId);
        
        result.success = finalDiagnosis.persists && finalDiagnosis.isConsistent;
        result.finalState = {
          persists: finalDiagnosis.persists,
          isConsistent: finalDiagnosis.isConsistent,
          locations: Object.keys(finalDiagnosis.locations).filter(key => 
            finalDiagnosis.locations[key]?.exists).join(", ")
        };
        
        this.log(`Repair completed for habit ${habitId}`, {
          success: result.success,
          actionsPerformed: result.actionsPerformed
        });
        
        return result;
      } catch (repairError) {
        this.error(`Error during repair of habit ${habitId}`, repairError);
        return {
          success: false,
          error: repairError.message,
          habitId,
          familyId
        };
      }
    } catch (error) {
      this.error(`Overall error repairing habit ${habitId}`, error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Execute repairs for multiple habits in a family
   * @param {string} familyId - The family ID
   * @param {Array<string>} habitIds - Optional array of specific habit IDs to repair
   * @returns {Promise<object>} - The batch repair results
   */
  async executeBatchRepair(familyId, habitIds = null) {
    try {
      if (!familyId) {
        this.error("Cannot run batch repair: missing familyId");
        return { success: false, error: "Missing familyId" };
      }
      
      this.log(`Starting batch repair for family ${familyId}`);
      
      // Get a repair plan first
      const repairPlan = await this.createHabitRepairPlan(familyId);
      
      if (repairPlan.error) {
        this.error("Error creating repair plan", repairPlan.error);
        return { success: false, error: repairPlan.error };
      }
      
      // If nothing needs to be repaired
      if (repairPlan.actionsNeeded === 0) {
        this.log("No repairs needed, all habits are consistent");
        return { 
          success: true, 
          repairsNeeded: 0,
          message: "All habits are in good state"
        };
      }
      
      const result = {
        totalHabits: repairPlan.totalHabits,
        habitsRepaired: 0,
        repairsAttempted: 0,
        repairsSucceeded: 0,
        results: []
      };
      
      // Filter to specific habitIds if provided
      const habitsToRepair = habitIds 
        ? repairPlan.actions.filter(action => habitIds.includes(action.habitId))
        : repairPlan.actions;
      
      // Execute repairs for each habit
      for (const action of habitsToRepair) {
        try {
          this.log(`Repairing habit ${action.habitId}`);
          result.repairsAttempted++;
          
          const repairResult = await this.repairHabit(familyId, action.habitId);
          
          result.results.push(repairResult);
          
          if (repairResult.success) {
            result.repairsSucceeded++;
            // Only count as a repaired habit if actual changes were made
            if (repairResult.repairNeeded) {
              result.habitsRepaired++;
            }
          }
        } catch (habitError) {
          this.error(`Error repairing habit ${action.habitId}`, habitError);
          result.results.push({
            habitId: action.habitId,
            success: false,
            error: habitError.message
          });
        }
      }
      
      // Final summary
      result.success = result.repairsSucceeded === result.repairsAttempted;
      
      this.log(`Batch repair completed for family ${familyId}`, {
        habitsRepaired: result.habitsRepaired,
        repairsAttempted: result.repairsAttempted,
        repairsSucceeded: result.repairsSucceeded
      });
      
      return result;
    } catch (error) {
      this.error(`Overall error in batch repair for family ${familyId}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Return complete diagnostic report
   */
  getReport() {
    return {
      isEnabled: this.isEnabled,
      logs: [...this.logStack],
      lastError: this.lastError
    };
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logStack = [];
    this.lastError = null;
    return this;
  }
}

// Create and export singleton instance
const habitDiagnostics = new HabitDiagnostics();
export default habitDiagnostics;