// src/services/ChoreService.js
import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp, 
  serverTimestamp, 
  deleteDoc,
  arrayUnion,
  increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import ScalableDataService from './ScalableDataService';

class ChoreService {
  constructor() {
    this.db = db;
    this.storage = storage;
  }

  // ---- Chore Template Methods ----

  /**
   * Create a new chore template
   * @param {string} familyId - Family ID
   * @param {Object} templateData - Template data
   * @returns {Promise<string>} - Template ID
   */
  async createChoreTemplate(familyId, templateData) {
    console.log(`[DEBUG] ChoreService.createChoreTemplate called with:`, { familyId, templateData });
    try {
      console.log(`[DEBUG] Creating reference to 'choreTemplates' collection`);
      const choreTemplateRef = collection(this.db, 'choreTemplates');
      
      // Check if a similar template already exists to avoid duplicates
      console.log(`[DEBUG] Checking for duplicate chore templates with title:`, templateData.title);
      const q = query(
        collection(this.db, 'choreTemplates'),
        where('familyId', '==', familyId),
        where('title', '==', templateData.title)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        console.log(`[DEBUG] Found existing chore template with the same title:`, templateData.title);
        const existingId = querySnapshot.docs[0].id;
        console.log(`[DEBUG] Returning existing template ID:`, existingId);
        return existingId;
      }
      
      console.log(`[DEBUG] No duplicate found, preparing template object`);
      // Map reward value to bucksReward if it exists
      const bucksReward = templateData.bucksReward || templateData.rewardValue || 1;
      console.log(`[DEBUG] Using bucksReward value:`, bucksReward);
      
      const template = {
        familyId,
        title: templateData.title,
        description: templateData.description || '',
        icon: templateData.icon || 'task',
        customIconUrl: templateData.customIconUrl || null,
        bucksReward: bucksReward,
        requiredProof: templateData.requiredProof || 'photo',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isArchived: false,
        tags: templateData.tags || [],
        timeOfDay: templateData.timeOfDay || 'anytime',
        estimatedDuration: templateData.estimatedDuration || 5,
        aiPrompts: templateData.aiPrompts || []
      };
      
      console.log(`[DEBUG] Template object prepared:`, template);
      console.log(`[DEBUG] Adding document to Firestore`);
      const docRef = await addDoc(choreTemplateRef, template);
      console.log(`[DEBUG] Document added successfully with ID:`, docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("[DEBUG] Error creating chore template:", error);
      throw error;
    }
  }

  /**
   * Upload a custom icon for a chore template
   * @param {string} familyId - Family ID
   * @param {string} templateId - Template ID
   * @param {File} file - Icon file
   * @returns {Promise<string>} - Download URL
   */
  async uploadChoreIcon(familyId, templateId, file) {
    try {
      const fileExtension = file.name.split('.').pop();
      const filePath = `families/${familyId}/chores/icons/${templateId}.${fileExtension}`;
      const storageRef = ref(this.storage, filePath);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Update the template with the icon URL
      const templateRef = doc(this.db, 'choreTemplates', templateId);
      await updateDoc(templateRef, {
        customIconUrl: downloadURL,
        updatedAt: serverTimestamp()
      });
      
      return downloadURL;
    } catch (error) {
      console.error("Error uploading chore icon:", error);
      throw error;
    }
  }

  /**
   * Get all chore templates for a family
   * @param {string} familyId - Family ID
   * @param {boolean} includeArchived - Whether to include archived templates
   * @returns {Promise<Array>} - Array of chore templates
   */
  async getChoreTemplates(familyId, includeArchived = false) {
    try {
      console.log(`[DEBUG] Getting chore templates for family: ${familyId}, includeArchived: ${includeArchived}`);
      
      // Try to use the index-based query first if it exists
      try {
        // This query uses the index defined in firestore.indexes.json
        const indexedQuery = query(
          collection(this.db, 'choreTemplates'),
          where('familyId', '==', familyId),
          where('isArchived', '==', false),
          orderBy('title')
        );
        
        // Only attempt this query if we're not including archived templates
        if (!includeArchived) {
          console.log(`[DEBUG] Attempting optimized query with index`);
          const indexedSnapshot = await getDocs(indexedQuery);
          console.log(`[DEBUG] Index-based query successful, got ${indexedSnapshot.docs.length} templates`);
          
          // Process results directly from the optimized query
          return indexedSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
          }));
        }
      } catch (indexError) {
        // If index doesn't exist or query fails, log and fall back to the client-side approach
        console.log(`[DEBUG] Index-based query failed, using client-side filtering fallback. Error: ${indexError.message}`);
      }
      
      // Use ScalableDataService for paginated query
      console.log(`[DEBUG] Using ScalableDataService for paginated query`);
      const result = await ScalableDataService.getPaginatedData(
        'choreTemplates',
        familyId,
        {
          pageSize: 100, // Reasonable limit for templates
          orderByField: 'title',
          orderDirection: 'asc',
          filters: includeArchived ? [] : [where('isArchived', '!=', true)],
          useCache: true
        }
      );
      
      console.log(`[DEBUG] Got ${result.items.length} templates for family ${familyId}`);
      
      // Process results
      let results = result.items.map(doc => ({
        ...doc,
        createdAt: doc.createdAt?.toDate(),
        updatedAt: doc.updatedAt?.toDate()
      }));
      
      // Filter out archived templates if needed
      if (!includeArchived) {
        const beforeCount = results.length;
        results = results.filter(template => template.isArchived !== true);
        console.log(`[DEBUG] Filtered out archived templates: ${beforeCount} -> ${results.length}`);
      }
      
      // Sort by title in memory
      results.sort((a, b) => {
        const titleA = a.title?.toLowerCase() || '';
        const titleB = b.title?.toLowerCase() || '';
        return titleA.localeCompare(titleB);
      });
      
      console.log(`[DEBUG] Returning ${results.length} sorted templates`);
      return results;
    } catch (error) {
      console.error("Error getting chore templates:", error);
      
      // If there's any error, return empty array instead of loading ALL templates
      console.error("Returning empty array due to error - NOT loading all templates");
      return [];
    }
  }

  /**
   * Get a single chore template
   * @param {string} templateId - Template ID
   * @returns {Promise<Object>} - Chore template data
   */
  async getChoreTemplate(templateId) {
    try {
      const docRef = doc(this.db, 'choreTemplates', templateId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error(`Chore template with ID ${templateId} not found`);
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
        updatedAt: docSnap.data().updatedAt?.toDate()
      };
    } catch (error) {
      console.error("Error getting chore template:", error);
      throw error;
    }
  }

  /**
   * Update a chore template
   * @param {string} templateId - Template ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<void>}
   */
  async updateChoreTemplate(templateId, updateData) {
    try {
      const docRef = doc(this.db, 'choreTemplates', templateId);
      
      // Add updatedAt timestamp
      const data = {
        ...updateData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(docRef, data);
    } catch (error) {
      console.error("Error updating chore template:", error);
      throw error;
    }
  }

  /**
   * Archive a chore template (soft delete)
   * @param {string} templateId - Template ID
   * @returns {Promise<void>}
   */
  async archiveChoreTemplate(templateId) {
    try {
      const docRef = doc(this.db, 'choreTemplates', templateId);
      
      await updateDoc(docRef, {
        isArchived: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error archiving chore template:", error);
      throw error;
    }
  }

  // ---- Chore Schedule Methods ----

  /**
   * Create a new chore schedule
   * @param {string} familyId - Family ID
   * @param {string} templateId - Template ID
   * @param {string} childId - Child ID
   * @param {Object} scheduleData - Schedule configuration
   * @returns {Promise<string>} - Schedule ID
   */
  async createChoreSchedule(familyId, templateId, childId, scheduleData) {
    try {
      // Check if an active schedule already exists for this template and child
      const existingQuery = query(
        collection(this.db, 'choreSchedules'),
        where('familyId', '==', familyId),
        where('templateId', '==', templateId),
        where('childId', '==', childId),
        where('isActive', '==', true)
      );
      
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        console.log(`[DEBUG] Active schedule already exists for template ${templateId} and child ${childId}, skipping creation`);
        return existingSnapshot.docs[0].id;
      }
      
      const choreScheduleRef = collection(this.db, 'choreSchedules');
      
      const schedule = {
        familyId,
        templateId,
        childId,
        schedule: {
          type: scheduleData.type || 'repeating',
          frequency: scheduleData.frequency,
          daysOfWeek: scheduleData.daysOfWeek || [],
          daysOfMonth: scheduleData.daysOfMonth || [],
          date: scheduleData.date || null,
          timeOfDay: scheduleData.timeOfDay || 'anytime',
          startDate: scheduleData.startDate || Timestamp.now(),
          endDate: scheduleData.endDate || null
        },
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(choreScheduleRef, schedule);
      console.log(`[DEBUG] Created new schedule ${docRef.id} for template ${templateId} and child ${childId}`);
      return docRef.id;
    } catch (error) {
      console.error("Error creating chore schedule:", error);
      throw error;
    }
  }

  /**
   * Get all chore schedules for a child
   * @param {string} familyId - Family ID
   * @param {string} childId - Child ID
   * @param {boolean} activeOnly - If true, only return active schedules
   * @returns {Promise<Array>} - Array of chore schedules
   */
  async getChoreSchedulesForChild(familyId, childId, activeOnly = true) {
    try {
      // Use ScalableDataService for paginated query
      const filters = [
        where('childId', '==', childId)
      ];
      
      if (activeOnly) {
        filters.push(where('isActive', '==', true));
      }
      
      const result = await ScalableDataService.getPaginatedData(
        'choreSchedules',
        familyId,
        {
          pageSize: 50, // Reasonable limit for schedules per child
          orderByField: 'createdAt',
          orderDirection: 'desc',
          filters,
          useCache: true
        }
      );
      
      return result.items.map(doc => ({
        ...doc,
        createdAt: doc.createdAt?.toDate(),
        updatedAt: doc.updatedAt?.toDate(),
        schedule: {
          ...doc.schedule,
          startDate: doc.schedule?.startDate?.toDate(),
          endDate: doc.schedule?.endDate?.toDate(),
          date: doc.schedule?.date?.toDate()
        }
      }));
    } catch (error) {
      console.error("Error getting chore schedules for child:", error);
      throw error;
    }
  }

  /**
   * Update a chore schedule
   * @param {string} scheduleId - Schedule ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<void>}
   */
  async updateChoreSchedule(scheduleId, updateData) {
    try {
      const docRef = doc(this.db, 'choreSchedules', scheduleId);
      
      // Format the schedule data if it exists
      const data = { ...updateData };
      if (data.schedule) {
        // Ensure dates are Timestamps
        if (data.schedule.startDate) {
          data.schedule.startDate = Timestamp.fromDate(new Date(data.schedule.startDate));
        }
        if (data.schedule.endDate) {
          data.schedule.endDate = Timestamp.fromDate(new Date(data.schedule.endDate));
        }
        if (data.schedule.date) {
          data.schedule.date = Timestamp.fromDate(new Date(data.schedule.date));
        }
      }
      
      // Add updatedAt timestamp
      data.updatedAt = serverTimestamp();
      
      await updateDoc(docRef, data);
    } catch (error) {
      console.error("Error updating chore schedule:", error);
      throw error;
    }
  }

  /**
   * Deactivate a chore schedule
   * @param {string} scheduleId - Schedule ID
   * @returns {Promise<void>}
   */
  async deactivateChoreSchedule(scheduleId) {
    try {
      const docRef = doc(this.db, 'choreSchedules', scheduleId);
      
      await updateDoc(docRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error deactivating chore schedule:", error);
      throw error;
    }
  }

  /**
   * Clean up duplicate schedules for a family
   * Keeps only one active schedule per template-child combination
   * @param {string} familyId - Family ID
   * @returns {Promise<number>} - Number of schedules deactivated
   */
  async cleanupDuplicateSchedules(familyId) {
    try {
      console.log(`[DEBUG] Starting cleanup of duplicate schedules for family: ${familyId}`);
      
      // Get all active schedules for this family
      const schedulesQuery = query(
        collection(this.db, 'choreSchedules'),
        where('familyId', '==', familyId),
        where('isActive', '==', true)
      );
      
      const schedulesSnapshot = await getDocs(schedulesQuery);
      console.log(`[DEBUG] Found ${schedulesSnapshot.size} active schedules`);
      
      // Group schedules by template-child combination
      const scheduleGroups = new Map();
      
      schedulesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const key = `${data.templateId}-${data.childId}`;
        
        if (!scheduleGroups.has(key)) {
          scheduleGroups.set(key, []);
        }
        
        scheduleGroups.get(key).push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate()
        });
      });
      
      let deactivatedCount = 0;
      
      // For each group, keep only the oldest schedule and deactivate the rest
      for (const [key, schedules] of scheduleGroups) {
        if (schedules.length > 1) {
          console.log(`[DEBUG] Found ${schedules.length} duplicate schedules for ${key}`);
          
          // Sort by creation date (oldest first)
          schedules.sort((a, b) => {
            const dateA = a.createdAt || new Date(0);
            const dateB = b.createdAt || new Date(0);
            return dateA - dateB;
          });
          
          // Keep the first (oldest) and deactivate the rest
          for (let i = 1; i < schedules.length; i++) {
            await this.deactivateChoreSchedule(schedules[i].id);
            deactivatedCount++;
            console.log(`[DEBUG] Deactivated duplicate schedule ${schedules[i].id}`);
          }
        }
      }
      
      console.log(`[DEBUG] Cleanup complete. Deactivated ${deactivatedCount} duplicate schedules`);
      return deactivatedCount;
    } catch (error) {
      console.error("Error cleaning up duplicate schedules:", error);
      throw error;
    }
  }

  /**
   * Batch fetch templates for multiple instances
   * @param {Array} instances - Array of chore instances
   * @returns {Promise<Array>} - Instances with template data merged
   */
  async batchFetchTemplatesForInstances(instances) {
    if (!instances || instances.length === 0) return [];
    
    // Group instances by templateId
    const templateIds = [...new Set(instances.map(i => i.templateId).filter(Boolean))];
    
    if (templateIds.length === 0) {
      // No templates to fetch, return instances as-is
      return instances;
    }
    
    // Fetch all unique templates in one batch
    const templateMap = new Map();
    
    // Use batching to fetch templates efficiently (Firestore allows up to 10 in a single 'in' query)
    const batchSize = 10;
    for (let i = 0; i < templateIds.length; i += batchSize) {
      const batch = templateIds.slice(i, i + batchSize);
      
      try {
        const templateQuery = query(
          collection(this.db, 'choreTemplates'),
          where('__name__', 'in', batch)
        );
        
        const snapshot = await getDocs(templateQuery);
        snapshot.docs.forEach(doc => {
          templateMap.set(doc.id, {
            id: doc.id,
            ...doc.data()
          });
        });
      } catch (error) {
        console.error('Error fetching template batch:', error);
      }
    }
    
    // Merge template data with instances
    return instances.map(instance => ({
      ...instance,
      template: instance.templateId ? templateMap.get(instance.templateId) : null
    }));
  }

  // ---- Chore Instance Methods ----

  /**
   * Generate chore instances based on schedules
   * @param {string} familyId - Family ID
   * @param {Date} date - Date to generate instances for
   * @returns {Promise<Array>} - Array of generated instance IDs
   */
  async generateChoreInstances(familyId, date = new Date()) {
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const lockKey = `chore-gen-${familyId}-${dateString}`;
    
    try {
      console.log(`[DEBUG] Generating chore instances for family: ${familyId}, date: ${dateString}`);
      
      const dateTimestamp = Timestamp.fromDate(date);
      const lockTimestamp = Date.now();
      
      // Check if generation is already in progress (within last 10 seconds)
      const existingLock = sessionStorage.getItem(lockKey);
      if (existingLock) {
        const lockTime = parseInt(existingLock);
        if (lockTimestamp - lockTime < 10000) {
          console.log(`[DEBUG] Generation already in progress for ${dateString}, skipping`);
          return [];
        }
      }
      
      // Set the lock
      sessionStorage.setItem(lockKey, lockTimestamp.toString());
      
      // Get all active schedules for this family
      const schedulesQuery = query(
        collection(this.db, 'choreSchedules'),
        where('familyId', '==', familyId),
        where('isActive', '==', true)
      );
      
      const schedulesSnapshot = await getDocs(schedulesQuery);
      const schedules = schedulesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`[DEBUG] Found ${schedules.length} active schedules`);
      
      // Check each schedule to see if it applies to this date
      const instancePromises = [];
      
      for (const schedule of schedules) {
        const shouldGenerate = this.shouldGenerateInstance(schedule, date);
        
        if (shouldGenerate) {
          // Get the template data
          const template = await this.getChoreTemplate(schedule.templateId);
          
          // Check if an instance already exists for this schedule and date
          const existingQuery = query(
            collection(this.db, 'choreInstances'),
            where('familyId', '==', familyId),
            where('scheduleId', '==', schedule.id),
            where('date', '==', dateTimestamp)
          );
          
          const existingSnapshot = await getDocs(existingQuery);
          
          // Only create if no instance exists OR if it's a multi-completion chore that expired
          const frequency = schedule.schedule.frequency;
          const allowsMultiple = frequency === 'weekly' || frequency === 'weekend';
          
          let shouldCreate = existingSnapshot.empty;
          
          // For multi-completion chores, check if existing instance has expired
          if (!shouldCreate && allowsMultiple && !existingSnapshot.empty) {
            const existingInstance = existingSnapshot.docs[0].data();
            const expirationDate = existingInstance.expirationDate?.toDate();
            if (expirationDate && date > expirationDate) {
              shouldCreate = true;
            }
          }
          
          if (shouldCreate) {
            const expirationDate = this.getInstanceExpirationDate(frequency, date);
            
            const instanceData = {
              familyId,
              scheduleId: schedule.id,
              templateId: schedule.templateId,
              childId: schedule.childId,
              date: dateTimestamp,
              expirationDate: Timestamp.fromDate(expirationDate),
              timeOfDay: template.timeOfDay || schedule.schedule.timeOfDay || 'anytime',
              status: 'pending',
              bucksAwarded: template.bucksReward,
              frequency: frequency,
              allowsMultipleCompletions: allowsMultiple,
              completionCount: 0,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              sequence: this.getSequenceForTimeOfDay(template.timeOfDay || 'anytime'),
              streakCount: 0 // Will be updated when completed
            };
            
            const instancePromise = addDoc(collection(this.db, 'choreInstances'), instanceData)
              .then(docRef => docRef.id);
            
            instancePromises.push(instancePromise);
          }
        }
      }
      
      // Wait for all instances to be created
      const instanceIds = await Promise.all(instancePromises);
      
      // Clear the lock after successful generation
      sessionStorage.removeItem(lockKey);
      
      return instanceIds;
    } catch (error) {
      console.error("Error generating chore instances:", error);
      // Clear the lock on error too
      sessionStorage.removeItem(lockKey);
      throw error;
    } finally {
      // Always clear the lock
      sessionStorage.removeItem(lockKey);
    }
  }

  /**
   * Determine if an instance should be generated for a schedule on a given date
   * @param {Object} schedule - Schedule object
   * @param {Date} date - Date to check
   * @returns {boolean} - Whether an instance should be generated
   */
  shouldGenerateInstance(schedule, date) {
    try {
      const scheduleData = schedule.schedule;
      const frequency = scheduleData.frequency;
      
      // Check if the schedule is active for this date range
      const startDate = scheduleData.startDate?.toDate();
      const endDate = scheduleData.endDate?.toDate();
      
      if (startDate && date < startDate) {
        return false;
      }
      
      if (endDate && date > endDate) {
        return false;
      }
      
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      
      switch (frequency) {
        case 'daily':
          // Create instance every day
          return true;
          
        case 'weekdays':
          // Monday (1) through Friday (5)
          return dayOfWeek >= 1 && dayOfWeek <= 5;
          
        case 'weekly':
          // For weekly, create instance on Sunday that lasts all week
          return dayOfWeek === 0; // Sunday
          
        case 'weekend':
          // Only create on Saturday, lasts through Sunday
          return dayOfWeek === 6; // Saturday
          
        case 'as-needed':
          // Check if this is the scheduled date
          const scheduledDate = scheduleData.date?.toDate();
          if (!scheduledDate) return false;
          
          // Check if it's the original date
          if (this.isSameDay(scheduledDate, date)) {
            return true;
          }
          
          // Check for repeat dates if configured
          if (scheduleData.repeatInterval && scheduleData.repeatUnit) {
            return this.isRepeatDate(scheduledDate, date, scheduleData.repeatInterval, scheduleData.repeatUnit);
          }
          
          return false;
          
        default:
          // Legacy support for old schedule types
          if (scheduleData.type === 'one-time') {
            const scheduleDate = scheduleData.date?.toDate();
            return scheduleDate && this.isSameDay(scheduleDate, date);
          }
          return false;
      }
    } catch (error) {
      console.error("Error in shouldGenerateInstance:", error);
      return false;
    }
  }

  /**
   * Check if two dates are the same day
   * @param {Date} date1 - First date
   * @param {Date} date2 - Second date
   * @returns {boolean} - Whether the dates are the same day
   */
  isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  }
  
  /**
   * Check if a date is a repeat date for as-needed chores
   * @param {Date} originalDate - Original scheduled date
   * @param {Date} checkDate - Date to check
   * @param {number} interval - Repeat interval
   * @param {string} unit - Repeat unit ('days', 'weeks', 'months')
   * @returns {boolean}
   */
  isRepeatDate(originalDate, checkDate, interval, unit) {
    const daysDiff = Math.floor((checkDate - originalDate) / (1000 * 60 * 60 * 24));
    
    switch (unit) {
      case 'days':
        return daysDiff > 0 && daysDiff % interval === 0;
        
      case 'weeks':
        return daysDiff > 0 && daysDiff % (interval * 7) === 0;
        
      case 'months':
        const monthsDiff = (checkDate.getFullYear() - originalDate.getFullYear()) * 12 + 
                          (checkDate.getMonth() - originalDate.getMonth());
        return monthsDiff > 0 && monthsDiff % interval === 0 && 
               checkDate.getDate() === originalDate.getDate();
        
      default:
        return false;
    }
  }
  
  /**
   * Get the expiration date for a chore instance based on frequency
   * @param {string} frequency - Frequency type
   * @param {Date} startDate - Start date of the instance
   * @returns {Date} - Expiration date
   */
  getInstanceExpirationDate(frequency, startDate) {
    const expirationDate = new Date(startDate);
    
    switch (frequency) {
      case 'daily':
      case 'weekdays':
        // Daily and weekday chores expire at midnight
        expirationDate.setHours(23, 59, 59, 999);
        break;
        
      case 'weekly':
        // Weekly chores expire Sunday night
        const daysUntilSunday = 7 - startDate.getDay();
        expirationDate.setDate(expirationDate.getDate() + daysUntilSunday);
        expirationDate.setHours(23, 59, 59, 999);
        break;
        
      case 'weekend':
        // Weekend chores expire Sunday night
        if (startDate.getDay() === 6) { // Saturday
          expirationDate.setDate(expirationDate.getDate() + 1); // Sunday
        }
        expirationDate.setHours(23, 59, 59, 999);
        break;
        
      case 'as-needed':
        // As-needed chores expire at end of the scheduled day by default
        expirationDate.setHours(23, 59, 59, 999);
        break;
        
      default:
        expirationDate.setHours(23, 59, 59, 999);
    }
    
    return expirationDate;
  }

  /**
   * Get a sequence number for ordering chores by time of day
   * @param {string} timeOfDay - Time of day ('morning', 'afternoon', 'evening', 'anytime')
   * @returns {number} - Sequence number
   */
  getSequenceForTimeOfDay(timeOfDay) {
    switch (timeOfDay) {
      case 'morning': return 1;
      case 'afternoon': return 2;
      case 'evening': return 3;
      case 'anytime':
      default: return 4;
    }
  }
  
  /**
   * Process expired chores at midnight
   * This should be called by a scheduled function or cron job
   * @param {string} familyId - Family ID
   * @param {Date} currentDate - Current date (for timezone handling)
   * @returns {Promise<Object>} - Summary of processed chores
   */
  async processExpiredChores(familyId, currentDate = new Date()) {
    try {
      console.log(`[DEBUG] Processing expired chores for family: ${familyId}`);
      
      // Get all active instances that have expired
      const expiredQuery = query(
        collection(this.db, 'choreInstances'),
        where('familyId', '==', familyId),
        where('status', '==', 'pending'),
        where('expirationDate', '<=', Timestamp.fromDate(currentDate))
      );
      
      const expiredSnapshot = await getDocs(expiredQuery);
      console.log(`[DEBUG] Found ${expiredSnapshot.size} expired pending chores`);
      
      const summary = {
        totalExpired: expiredSnapshot.size,
        dailyMissed: 0,
        weeklyExpired: 0,
        weekendExpired: 0
      };
      
      // Process each expired chore
      for (const doc of expiredSnapshot.docs) {
        const instance = doc.data();
        const frequency = instance.frequency;
        
        // Update status based on frequency type
        if (frequency === 'daily' || frequency === 'weekdays') {
          // Mark as missed for parent visibility
          await updateDoc(doc.ref, {
            status: 'missed',
            missedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          summary.dailyMissed++;
        } else if (frequency === 'weekly' || frequency === 'weekend') {
          // These just expire without being marked as missed
          await updateDoc(doc.ref, {
            status: 'expired',
            expiredAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          
          if (frequency === 'weekly') summary.weeklyExpired++;
          else summary.weekendExpired++;
        }
      }
      
      console.log(`[DEBUG] Processed expired chores:`, summary);
      return summary;
      
    } catch (error) {
      console.error("Error processing expired chores:", error);
      throw error;
    }
  }

  /**
   * Create default chore instances if no schedules exist but templates are available
   * This ensures children see chores even if parents haven't set up schedules
   * @param {string} familyId - Family ID
   * @param {string} childId - Child ID
   * @param {Date} date - Date to create instances for
   */
  async createDefaultInstancesIfNeeded(familyId, childId, date) {
    try {
      console.log(`[DEBUG] Checking if default instances needed for family: ${familyId}, child: ${childId}`);
      
      // Check if there are any instances for this child today
      const dateTimestamp = Timestamp.fromDate(date);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const startTimestamp = Timestamp.fromDate(startOfDay);
      const endTimestamp = Timestamp.fromDate(endOfDay);
      
      // Check for existing instances - use a more specific query
      const existingQuery = query(
        collection(this.db, 'choreInstances'),
        where('familyId', '==', familyId),
        where('childId', '==', childId),
        where('date', '>=', startTimestamp),
        where('date', '<=', endTimestamp)
      );
      
      const existingSnapshot = await getDocs(existingQuery);
      
      // Only skip if we have a reasonable number of instances (not hundreds)
      if (!existingSnapshot.empty && existingSnapshot.size < 50) {
        console.log(`[DEBUG] Found ${existingSnapshot.size} existing instances, skipping default creation`);
        return;
      } else if (existingSnapshot.size >= 50) {
        console.warn(`[DEBUG] Found ${existingSnapshot.size} instances - this seems excessive for one day. Not creating more.`);
        // Don't create more instances if there are already too many
        return;
      }
      
      // Check if this child has any active schedules
      const activeSchedulesQuery = query(
        collection(this.db, 'choreSchedules'),
        where('familyId', '==', familyId),
        where('childId', '==', childId),
        where('isActive', '==', true)
      );
      
      const schedulesSnapshot = await getDocs(activeSchedulesQuery);
      
      if (!schedulesSnapshot.empty) {
        console.log(`[DEBUG] Child has ${schedulesSnapshot.size} active schedules, skipping default creation`);
        return;
      }
      
      
      // Get all active chore templates for this family
      const templates = await this.getChoreTemplates(familyId, false);
      
      // Filter templates to only those assigned to this child
      const assignedTemplates = templates.filter(template => 
        template.assignedToIds && template.assignedToIds.includes(childId)
      );
      
      console.log(`[DEBUG] Found ${assignedTemplates.length} templates assigned to this child`);
      
      if (assignedTemplates.length === 0) {
        console.log(`[DEBUG] No templates assigned to this child, nothing to create`);
        return;
      }
      
      // Check which templates already have instances today
      const existingTemplateIds = new Set();
      existingSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.templateId) {
          existingTemplateIds.add(data.templateId);
        }
      });
      
      // Only create instances for templates that don't already have instances today
      const templatesToCreate = assignedTemplates.filter(template => 
        !existingTemplateIds.has(template.id)
      );
      
      console.log(`[DEBUG] Creating instances for ${templatesToCreate.length} templates that don't have instances yet`);
      
      if (templatesToCreate.length === 0) {
        console.log(`[DEBUG] All assigned templates already have instances for today`);
        return;
      }
      
      // Create instances for each assigned template that doesn't have one yet
      const instancePromises = templatesToCreate.map(async (template) => {
        const instanceData = {
          familyId,
          scheduleId: null, // No schedule, this is a default instance
          templateId: template.id,
          childId,
          date: dateTimestamp,
          timeOfDay: template.timeOfDay || 'anytime',
          status: 'pending',
          bucksAwarded: template.bucksReward || template.rewardValue || 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          sequence: this.getSequenceForTimeOfDay(template.timeOfDay || 'anytime'),
          streakCount: 0,
          isDefault: true // Mark as default instance
        };
        
        console.log(`[DEBUG] Creating default instance for template: ${template.title}`);
        return addDoc(collection(this.db, 'choreInstances'), instanceData);
      });
      
      await Promise.all(instancePromises);
      console.log(`[DEBUG] Created ${instancePromises.length} default chore instances`);
    } catch (error) {
      console.error("[DEBUG] Error creating default instances:", error);
      // Don't throw - this is a helper function, we don't want to break the main flow
    }
  }

  /**
   * Get chore instances for a child on a specific date
   * @param {string} familyId - Family ID
   * @param {string} childId - Child ID
   * @param {Date} date - Date to get instances for
   * @returns {Promise<Array>} - Array of chore instances
   */
  async getChoreInstancesForChild(familyId, childId, date = new Date(), skipDefaultCreation = false) {
    try {
      console.log(`[DEBUG] Getting chore instances for family: ${familyId}, child: ${childId}, date: ${date.toISOString().split('T')[0]}`);
      
      // Skip default instance creation if requested (for performance)
      if (!skipDefaultCreation) {
        await this.createDefaultInstancesIfNeeded(familyId, childId, date);
      }
      
      // Convert date to start and end of day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Convert to Firestore Timestamps
      const startTimestamp = Timestamp.fromDate(startOfDay);
      const endTimestamp = Timestamp.fromDate(endOfDay);
      
      // Try the indexed query first if available
      try {
        // This query uses the index defined in firestore.indexes.json for choreInstances
        console.log(`[DEBUG] Attempting optimized query with index for date range`);
        const indexedQuery = query(
          collection(this.db, 'choreInstances'),
          where('familyId', '==', familyId),
          where('childId', '==', childId),
          where('date', '>=', startTimestamp),
          where('date', '<=', endTimestamp),
          orderBy('date'),
          orderBy('sequence')
        );
        
        const indexedSnapshot = await getDocs(indexedQuery);
        console.log(`[DEBUG] Index-based query successful, got ${indexedSnapshot.docs.length} instances`);
        
        // Process results
        const instances = indexedSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate(),
          completedAt: doc.data().completedAt?.toDate(),
          approvedAt: doc.data().approvedAt?.toDate(),
          rejectedAt: doc.data().rejectedAt?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        }));
        
        // Fetch template data for each instance - optimized with batching
        const instancesWithTemplates = await this.batchFetchTemplatesForInstances(instances);
        
        return instancesWithTemplates;
      } catch (indexError) {
        console.log(`[DEBUG] Index-based query failed, using fallback. Error: ${indexError.message}`);
      }
      
      // If index query fails, try a simpler query with client-side filtering
      console.log(`[DEBUG] Using simple query with client-side filtering`);
      // Try an alternate query using just the index we know exists
      try {
        const alternateQuery = query(
          collection(this.db, 'choreInstances'),
          where('familyId', '==', familyId),
          where('childId', '==', childId),
          where('date', '>=', startTimestamp)
        );
        
        const altSnapshot = await getDocs(alternateQuery);
        console.log(`[DEBUG] Alternative query successful, got ${altSnapshot.docs.length} instances`);
        
        // Filter for date range and sort in memory
        const filteredInstances = altSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate(),
            completedAt: doc.data().completedAt?.toDate(),
            approvedAt: doc.data().approvedAt?.toDate(),
            rejectedAt: doc.data().rejectedAt?.toDate(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
          }))
          .filter(instance => {
            return instance.date <= endOfDay;
          })
          .sort((a, b) => {
            // Sort by date first
            const dateCompare = a.date - b.date;
            if (dateCompare !== 0) return dateCompare;
            
            // Then by sequence
            return (a.sequence || 0) - (b.sequence || 0);
          });
        
        // Fetch template data for each instance - optimized with batching
        const instancesWithTemplates = await this.batchFetchTemplatesForInstances(filteredInstances);
        
        return instancesWithTemplates;
      } catch (altError) {
        console.log(`[DEBUG] Alternative query failed, using basic query. Error: ${altError.message}`);
      }
      
      // Last resort - use the most basic query
      const basicQuery = query(
        collection(this.db, 'choreInstances'),
        where('familyId', '==', familyId),
        where('childId', '==', childId)
      );
      
      const querySnapshot = await getDocs(basicQuery);
      console.log(`[DEBUG] Basic query successful, got ${querySnapshot.docs.length} instances`);
      
      // Filter for date range and sort in memory
      const filteredInstances = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate(),
          completedAt: doc.data().completedAt?.toDate(),
          approvedAt: doc.data().approvedAt?.toDate(),
          rejectedAt: doc.data().rejectedAt?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        }))
        .filter(instance => {
          return instance.date >= startOfDay && instance.date <= endOfDay;
        })
        .sort((a, b) => {
          // Sort by date first
          const dateCompare = a.date - b.date;
          if (dateCompare !== 0) return dateCompare;
          
          // Then by sequence
          return (a.sequence || 0) - (b.sequence || 0);
        });
      
      // Fetch template data for each instance - optimized with batching
      const instancesWithTemplates = await this.batchFetchTemplatesForInstances(filteredInstances);
      
      return instancesWithTemplates;
    } catch (error) {
      console.error("Error getting chore instances for child:", error);
      
      // Fallback method with even simpler query if needed
      try {
        console.error("Using fallback method for getting chore instances");
        
        // Just get all instances for this family
        const simpleQuery = query(
          collection(this.db, 'choreInstances'),
          where('familyId', '==', familyId)
        );
        
        const allInstancesSnapshot = await getDocs(simpleQuery);
        
        // Convert date to start and end of day
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        // Filter and sort in memory
        const filteredInstances = allInstancesSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate(),
            completedAt: doc.data().completedAt?.toDate(),
            approvedAt: doc.data().approvedAt?.toDate(),
            rejectedAt: doc.data().rejectedAt?.toDate(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
          }))
          .filter(instance => 
            instance.childId === childId && 
            instance.date >= startOfDay && 
            instance.date <= endOfDay
          )
          .sort((a, b) => {
            // Sort by date first
            const dateCompare = a.date - b.date;
            if (dateCompare !== 0) return dateCompare;
            
            // Then by sequence
            return (a.sequence || 0) - (b.sequence || 0);
          });
        
        // Fetch template data
        const instancesWithTemplates = await Promise.all(filteredInstances.map(async instance => {
          try {
            const template = await this.getChoreTemplate(instance.templateId);
            return { ...instance, template };
          } catch (templateError) {
            console.error(`Error fetching template ${instance.templateId}:`, templateError);
            return instance;
          }
        }));
        
        return instancesWithTemplates;
      } catch (fallbackError) {
        console.error("Fallback method also failed:", fallbackError);
        throw error; // Throw the original error
      }
    }
  }

  /**
   * Mark a chore instance as completed by child
   * @param {string} instanceId - Instance ID
   * @param {Object} completionData - Completion data
   * @param {File} photoFile - Optional photo file
   * @returns {Promise<Object>} - Updated instance data
   */
  async completeChoreInstance(instanceId, completionData, photoFile = null) {
    try {
      const docRef = doc(this.db, 'choreInstances', instanceId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error(`Chore instance with ID ${instanceId} not found`);
      }
      
      const instance = docSnap.data();
      let photoUrl = null;
      
      // Upload photo if provided
      if (photoFile) {
        const filePath = `families/${instance.familyId}/chores/completion/${instanceId}.jpg`;
        const storageRef = ref(this.storage, filePath);
        
        const snapshot = await uploadBytes(storageRef, photoFile);
        photoUrl = await getDownloadURL(snapshot.ref);
      }
      
      // Check if this chore allows multiple completions
      const allowsMultiple = instance.allowsMultipleCompletions || false;
      const currentCompletionCount = instance.completionCount || 0;
      
      // For multi-completion chores, we don't change status to completed
      // Instead, we track completions in an array
      let updateData = {};
      
      if (allowsMultiple) {
        // Add to completions array
        const completionRecord = {
          completedAt: serverTimestamp(),
          completionProof: {
            type: completionData.proofType || 'photo',
            note: completionData.note || '',
            photoUrl: photoUrl || completionData.photoUrl || null,
            mood: completionData.mood || 'neutral'
          },
          completionMood: completionData.mood || 'neutral',
          bucksAwarded: instance.bucksAwarded || 0,
          approvalStatus: 'pending'
        };
        
        updateData = {
          completions: arrayUnion(completionRecord),
          completionCount: increment(1),
          lastCompletedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
      } else {
        // Single completion chore - original behavior
        const completionProof = {
          type: completionData.proofType || 'photo',
          note: completionData.note || '',
          photoUrl: photoUrl || completionData.photoUrl || null,
          mood: completionData.mood || 'neutral'
        };
        
        updateData = {
          status: 'completed',
          completedAt: serverTimestamp(),
          completionProof,
          completionMood: completionData.mood || 'neutral',
          updatedAt: serverTimestamp()
        };
      }
      
      await updateDoc(docRef, updateData);
      
      // Fetch the updated document
      const updatedSnap = await getDoc(docRef);
      
      return {
        id: updatedSnap.id,
        ...updatedSnap.data(),
        date: updatedSnap.data().date?.toDate(),
        completedAt: updatedSnap.data().completedAt?.toDate(),
        createdAt: updatedSnap.data().createdAt?.toDate(),
        updatedAt: updatedSnap.data().updatedAt?.toDate()
      };
    } catch (error) {
      console.error("Error completing chore instance:", error);
      throw error;
    }
  }

  /**
   * Get all completed chores pending approval for a family
   * @param {string} familyId - Family ID
   * @returns {Promise<Array>} - Array of chore instances pending approval
   */
  async getChoresPendingApproval(familyId) {
    try {
      console.log(`[DEBUG] Getting chores pending approval for family: ${familyId}`);
      
      // Try the index-based query first if available
      try {
        // This query uses the index defined in firestore.indexes.json
        const indexedQuery = query(
          collection(this.db, 'choreInstances'),
          where('familyId', '==', familyId),
          where('status', '==', 'completed'),
          orderBy('completedAt', 'desc')
        );

        console.log(`[DEBUG] Attempting optimized query with index`);
        const indexedSnapshot = await getDocs(indexedQuery);
        console.log(`[DEBUG] Index-based query successful, got ${indexedSnapshot.docs.length} instances`);
        
        // Process and convert timestamps
        const sortedInstances = indexedSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate(),
          completedAt: doc.data().completedAt?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        }));
        
        // Fetch child and template data for each instance
        const instancesWithData = await Promise.all(sortedInstances.map(async instance => {
          try {
            const [template, childData] = await Promise.all([
              this.getChoreTemplate(instance.templateId),
              this.getChildData(familyId, instance.childId)
            ]);
            
            return { 
              ...instance, 
              template,
              child: childData
            };
          } catch (dataError) {
            console.error(`Error fetching data for instance ${instance.id}:`, dataError);
            return instance;
          }
        }));
        
        return instancesWithData;
      } catch (indexError) {
        console.log(`[DEBUG] Index-based query failed, using fallback. Error: ${indexError.message}`);
      }
      
      // If index doesn't exist, use simple query with client-side filtering
      console.log(`[DEBUG] Using simple query with client-side filtering`);
      const q = query(
        collection(this.db, 'choreInstances'),
        where('familyId', '==', familyId),
        where('status', '==', 'completed')
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`[DEBUG] Got ${querySnapshot.docs.length} instances to be sorted client-side`);
      
      // Sort by completedAt in memory
      const sortedInstances = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate(),
          completedAt: doc.data().completedAt?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        }))
        .sort((a, b) => {
          // Sort most recent first
          return (b.completedAt || 0) - (a.completedAt || 0);
        });
      
      // Fetch child and template data for each instance
      const instancesWithData = await Promise.all(sortedInstances.map(async instance => {
        // Get template and child data in parallel
        try {
          const [template, childData] = await Promise.all([
            this.getChoreTemplate(instance.templateId),
            this.getChildData(familyId, instance.childId)
          ]);
          
          return { 
            ...instance, 
            template,
            child: childData
          };
        } catch (dataError) {
          console.error(`Error fetching data for instance ${instance.id}:`, dataError);
          return instance;
        }
      }));
      
      return instancesWithData;
    } catch (error) {
      console.error("Error getting chores pending approval:", error);
      
      // If there was an error, try with an even simpler query as fallback
      try {
        console.error("Using fallback method with no status filter");
        // Get all instances for this family and filter in memory
        const simpleQuery = query(
          collection(this.db, 'choreInstances'),
          where('familyId', '==', familyId)
        );
        
        const allInstancesSnapshot = await getDocs(simpleQuery);
        
        // Filter and sort in memory
        const filteredInstances = allInstancesSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate(),
            completedAt: doc.data().completedAt?.toDate(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
          }))
          .filter(instance => instance.status === 'completed')
          .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
        
        // Fetch additional data
        const instancesWithData = await Promise.all(filteredInstances.map(async instance => {
          try {
            const [template, childData] = await Promise.all([
              this.getChoreTemplate(instance.templateId),
              this.getChildData(familyId, instance.childId)
            ]);
            
            return { 
              ...instance, 
              template,
              child: childData
            };
          } catch (dataError) {
            console.error(`Error fetching data for instance ${instance.id}:`, dataError);
            return instance;
          }
        }));
        
        return instancesWithData;
      } catch (fallbackError) {
        console.error("Fallback method also failed:", fallbackError);
        throw error; // Throw the original error if fallback fails
      }
    }
  }

  /**
   * Get child data from family members
   * @param {string} familyId - Family ID
   * @param {string} childId - Child ID
   * @returns {Promise<Object>} - Child data
   */
  async getChildData(familyId, childId) {
    try {
      // Get the family document
      const familyDocRef = doc(this.db, 'families', familyId);
      const familyDoc = await getDoc(familyDocRef);
      
      if (!familyDoc.exists()) {
        throw new Error(`Family with ID ${familyId} not found`);
      }
      
      const familyData = familyDoc.data();
      // familyMembers might be an object - convert to array first
      const familyMembersRaw = familyData.familyMembers || [];
      const familyMembers = typeof familyMembersRaw === 'object' && !Array.isArray(familyMembersRaw)
        ? Object.values(familyMembersRaw)
        : familyMembersRaw;

      // Find the child in family members
      const childData = (Array.isArray(familyMembers) ? familyMembers : []).find(member => member.id === childId);
      
      if (!childData) {
        throw new Error(`Child with ID ${childId} not found in family ${familyId}`);
      }
      
      return childData;
    } catch (error) {
      console.error("Error getting child data:", error);
      throw error;
    }
  }

  /**
   * Approve a completed chore instance
   * @param {string} instanceId - Instance ID
   * @param {string} parentId - Parent ID who is approving
   * @param {Object} approvalData - Optional approval data
   * @returns {Promise<Object>} - Updated instance data with transaction ID
   */
  async approveChoreInstance(instanceId, parentId, approvalData = {}) {
    try {
      const docRef = doc(this.db, 'choreInstances', instanceId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error(`Chore instance with ID ${instanceId} not found`);
      }
      
      const instance = docSnap.data();
      
      // Calculate streak count
      const streakCount = await this.calculateStreakCount(
        instance.familyId,
        instance.childId,
        instance.templateId,
        instance.date.toDate()
      );
      
      // Update the instance
      const updateData = {
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: parentId,
        parentFeedback: approvalData.feedback || null,
        streakCount,
        updatedAt: serverTimestamp()
      };
      
      // Apply bonuses if specified
      if (approvalData.bonusBucks) {
        updateData.bucksAwarded = instance.bucksAwarded + approvalData.bonusBucks;
      }
      
      await updateDoc(docRef, updateData);
      
      // Create a bucks transaction using BucksService
      let transactionId = null;
      try {
        const BucksService = (await import('./BucksService')).default;
        transactionId = await BucksService.rewardChore(
          instance.familyId,
          instance.childId,
          instanceId,
          updateData.bucksAwarded || instance.bucksAwarded,
          parentId
        );
      } catch (transactionError) {
        console.error("Error creating bucks transaction:", transactionError);
        // Continue even if transaction creation fails - we'll handle it later
      }
      
      // If transaction was created, update the instance with the transaction ID
      if (transactionId) {
        await updateDoc(docRef, {
          transactionId,
          updatedAt: serverTimestamp()
        });
      }
      
      // Fetch the updated document
      const updatedSnap = await getDoc(docRef);
      const updatedInstance = {
        id: updatedSnap.id,
        ...updatedSnap.data(),
        date: updatedSnap.data().date?.toDate(),
        completedAt: updatedSnap.data().completedAt?.toDate(),
        approvedAt: updatedSnap.data().approvedAt?.toDate(),
        createdAt: updatedSnap.data().createdAt?.toDate(),
        updatedAt: updatedSnap.data().updatedAt?.toDate()
      };
      
      // Create a calendar event for the completed chore
      try {
        const CalendarService = (await import('./CalendarService')).default;
        
        // Get the template data
        const template = await this.getChoreTemplate(instance.templateId);
        
        // Get child data
        const childData = await this.getChildData(instance.familyId, instance.childId);
        
        // Create event data
        const eventData = {
          title: `Completed Chore: ${template.title}`,
          summary: `${childData.name} completed ${template.title}`,
          description: `${template.description || ''}\n\nCompleted by: ${childData.name}\nBucks earned: ${updatedInstance.bucksAwarded}`,
          start: {
            dateTime: updatedInstance.completedAt || new Date(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: new Date(new Date(updatedInstance.completedAt || new Date()).getTime() + 30 * 60000), // 30 minutes later
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          location: '',
          isAllDay: false,
          attendees: [
            { id: instance.childId, name: childData.name }
          ],
          category: 'chore',
          eventType: 'chore',
          familyId: instance.familyId,
          metadata: {
            choreInstanceId: instanceId,
            choreTemplateId: instance.templateId,
            bucksAwarded: updatedInstance.bucksAwarded
          }
        };
        
        // Add parent to attendees
        eventData.attendees.push({ id: parentId, name: 'Parent' });
        
        // Import calendar retry helper
        const { createCalendarEventWithRetry, updateEntityWithCalendarId } = await import('../utils/CalendarRetryHelper');
        
        // Create the calendar event with retry logic
        const calendarResult = await createCalendarEventWithRetry(
          CalendarService.addEvent,
          eventData,
          parentId,
          {
            onRetry: (attempt, delayMs) => {
              console.log(`Retrying calendar event creation for chore (attempt ${attempt}) after ${delayMs}ms delay`);
            }
          }
        );
        
        // If successful, update the chore instance with the calendar event ID
        if (calendarResult && calendarResult.eventId) {
          await updateEntityWithCalendarId('choreInstances', instanceId, calendarResult.eventId);
          updatedInstance.calendarEventId = calendarResult.eventId;
        }
      } catch (calendarError) {
        console.error("Error creating calendar event for chore with retry:", calendarError);
        // Continue even if calendar event creation fails
      }
      
      return updatedInstance;
    } catch (error) {
      console.error("Error approving chore instance:", error);
      throw error;
    }
  }

  /**
   * Clean up duplicate instances for a specific date
   * Keeps only one instance per template-child combination for the date
   * @param {string} familyId - Family ID
   * @param {Date} date - Date to clean up
   * @returns {Promise<number>} - Number of instances deleted
   */
  async cleanupDuplicateInstances(familyId, date = new Date()) {
    try {
      console.log(`[DEBUG] Starting cleanup of duplicate instances for family: ${familyId}, date: ${date.toISOString().split('T')[0]}`);
      
      // Convert date to start and end of day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const startTimestamp = Timestamp.fromDate(startOfDay);
      const endTimestamp = Timestamp.fromDate(endOfDay);
      
      // Get all instances for this family and date
      const instancesQuery = query(
        collection(this.db, 'choreInstances'),
        where('familyId', '==', familyId),
        where('date', '>=', startTimestamp),
        where('date', '<=', endTimestamp)
      );
      
      const instancesSnapshot = await getDocs(instancesQuery);
      console.log(`[DEBUG] Found ${instancesSnapshot.size} instances for the date`);
      
      // Group instances by template-child combination
      const instanceGroups = new Map();
      
      instancesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const key = `${data.templateId}-${data.childId}`;
        
        if (!instanceGroups.has(key)) {
          instanceGroups.set(key, []);
        }
        
        instanceGroups.get(key).push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          status: data.status
        });
      });
      
      let deletedCount = 0;
      
      // For each group, keep the best instance and delete the rest
      for (const [key, instances] of instanceGroups) {
        if (instances.length > 1) {
          console.log(`[DEBUG] Found ${instances.length} duplicate instances for ${key}`);
          
          // Sort by priority: approved > completed > pending, then by creation date
          instances.sort((a, b) => {
            // Status priority
            const statusPriority = { approved: 3, completed: 2, pending: 1, rejected: 0 };
            const priorityA = statusPriority[a.status] || 0;
            const priorityB = statusPriority[b.status] || 0;
            
            if (priorityA !== priorityB) {
              return priorityB - priorityA; // Higher priority first
            }
            
            // If same status, prefer older (first created)
            const dateA = a.createdAt || new Date(0);
            const dateB = b.createdAt || new Date(0);
            return dateA - dateB;
          });
          
          // Keep the first (best) and delete the rest
          for (let i = 1; i < instances.length; i++) {
            const docRef = doc(this.db, 'choreInstances', instances[i].id);
            await deleteDoc(docRef);
            deletedCount++;
            console.log(`[DEBUG] Deleted duplicate instance ${instances[i].id}`);
          }
        }
      }
      
      console.log(`[DEBUG] Cleanup complete. Deleted ${deletedCount} duplicate instances`);
      return deletedCount;
    } catch (error) {
      console.error("Error cleaning up duplicate instances:", error);
      throw error;
    }
  }

  /**
   * Calculate streak count for a chore
   * @param {string} familyId - Family ID
   * @param {string} childId - Child ID
   * @param {string} templateId - Template ID
   * @param {Date} currentDate - Current date
   * @returns {Promise<number>} - Streak count
   */
  async calculateStreakCount(familyId, childId, templateId, currentDate) {
    try {
      console.log(`[DEBUG] Calculating streak count for family: ${familyId}, child: ${childId}, template: ${templateId}`);
      
      // Go back up to 30 days to find the most recent instance of this chore
      const thirtyDaysAgo = new Date(currentDate);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Convert to Firestore Timestamps
      const thirtyDaysAgoTimestamp = Timestamp.fromDate(thirtyDaysAgo);
      const currentDateTimestamp = Timestamp.fromDate(currentDate);
      
      // Try the indexed query first if available
      try {
        // This query uses the index defined in firestore.indexes.json
        console.log(`[DEBUG] Attempting optimized query with index for streak calculation`);
        const indexedQuery = query(
          collection(this.db, 'choreInstances'),
          where('familyId', '==', familyId),
          where('childId', '==', childId),
          where('templateId', '==', templateId),
          where('status', '==', 'approved'),
          where('date', '<', currentDateTimestamp),
          orderBy('date', 'desc'),
          limit(10) // Only need recent ones for streak calculation
        );

        const indexedSnapshot = await getDocs(indexedQuery);
        console.log(`[DEBUG] Index-based query successful, got ${indexedSnapshot.docs.length} instances`);
        
        // Filter and convert dates
        const recentInstances = indexedSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate()
          }))
          .filter(instance => instance.date >= thirtyDaysAgo);
        
        console.log(`[DEBUG] Filtered to ${recentInstances.length} instances in the last 30 days`);
        
        // Calculate streak based on these instances
        if (recentInstances.length === 0) {
          console.log(`[DEBUG] No previous instances found, first streak`);
          return 1; // First instance of this chore
        }
        
        const previousInstance = recentInstances[0]; // Already sorted by date desc
        const previousDate = previousInstance.date;
        const previousStreakCount = previousInstance.streakCount || 0;
        
        // Get the schedule to determine the expected previous date
        const schedule = await this.getChoreScheduleForTemplate(familyId, childId, templateId);
        if (!schedule) {
          console.log(`[DEBUG] No schedule found, using default streak count`);
          return 1;
        }
        
        // Calculate the expected previous date
        const expectedPrevious = this.calculatePreviousDate(currentDate, schedule);
        if (!expectedPrevious) {
          console.log(`[DEBUG] Could not determine previous date, using default streak count`);
          return 1;
        }
        
        // If the previous instance was on the expected date, increment streak
        if (this.isSameDay(previousDate, expectedPrevious)) {
          console.log(`[DEBUG] Previous chore completed on expected date, incrementing streak`);
          return previousStreakCount + 1;
        }
        
        console.log(`[DEBUG] Streak broken, previous date ${previousDate.toISOString().split('T')[0]} does not match expected ${expectedPrevious.toISOString().split('T')[0]}`);
        return 1; // Streak broken
      } catch (indexError) {
        console.log(`[DEBUG] Index-based query failed, using fallback. Error: ${indexError.message}`);
      }
      
      // Fallback to a simpler query
      console.log(`[DEBUG] Using simple query with client-side filtering for streak calculation`);
      const q = query(
        collection(this.db, 'choreInstances'),
        where('familyId', '==', familyId),
        where('childId', '==', childId),
        where('templateId', '==', templateId)
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`[DEBUG] Got ${querySnapshot.docs.length} instances to process for streak calculation`);
      
      // Filter, convert dates, and sort in memory
      const filteredInstances = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate()
        }))
        .filter(instance => 
          instance.status === 'approved' && 
          instance.date < currentDate &&
          instance.date >= thirtyDaysAgo
        )
        .sort((a, b) => b.date - a.date); // Sort descending by date
      
      console.log(`[DEBUG] Filtered to ${filteredInstances.length} relevant instances for streak`);
      
      // Get the most recent instance
      if (filteredInstances.length === 0) {
        console.log(`[DEBUG] No previous instances found, first streak`);
        return 1; // First instance of this chore
      }
      
      const previousInstance = filteredInstances[0];
      const previousDate = previousInstance.date;
      const previousStreakCount = previousInstance.streakCount || 0;
      
      // Check if the previous instance was the expected previous occurrence
      const schedule = await this.getChoreScheduleForTemplate(familyId, childId, templateId);
      
      if (!schedule) {
        console.log(`[DEBUG] No schedule found, using default streak count`);
        return 1; // Can't determine streak without schedule
      }
      
      // Calculate the expected previous date
      const expectedPrevious = this.calculatePreviousDate(currentDate, schedule);
      
      if (!expectedPrevious) {
        console.log(`[DEBUG] Could not determine previous date, using default streak count`);
        return 1; // Can't determine previous date
      }
      
      // If the previous instance was on the expected date, increment streak
      if (this.isSameDay(previousDate, expectedPrevious)) {
        console.log(`[DEBUG] Previous chore completed on expected date, incrementing streak to ${previousStreakCount + 1}`);
        return previousStreakCount + 1;
      }
      
      console.log(`[DEBUG] Streak broken, previous date ${previousDate.toISOString().split('T')[0]} does not match expected ${expectedPrevious.toISOString().split('T')[0]}`);
      return 1; // Streak broken
    } catch (error) {
      console.error("Error calculating streak count:", error);
      
      // Fallback to a very simple implementation if there's an error
      try {
        console.error("Using fallback streak calculation method");
        // Just return 1 for the first chore, or increment by 1 if there are previous chores
        const simpleQuery = query(
          collection(this.db, 'choreInstances'),
          where('familyId', '==', familyId),
          where('childId', '==', childId),
          where('templateId', '==', templateId),
          where('status', '==', 'approved')
        );
        
        const querySnapshot = await getDocs(simpleQuery);
        
        if (querySnapshot.empty) {
          return 1; // First instance
        } else {
          // Get the max streak count from previous instances
          const maxStreak = querySnapshot.docs
            .map(doc => doc.data().streakCount || 0)
            .reduce((max, current) => Math.max(max, current), 0);
          
          return maxStreak + 1;
        }
      } catch (fallbackError) {
        console.error("Fallback streak calculation failed:", fallbackError);
        return 1; // Default to 1 on error
      }
    }
  }

  /**
   * Get the chore schedule for a template
   * @param {string} familyId - Family ID
   * @param {string} childId - Child ID
   * @param {string} templateId - Template ID
   * @returns {Promise<Object>} - Schedule object
   */
  async getChoreScheduleForTemplate(familyId, childId, templateId) {
    try {
      const q = query(
        collection(this.db, 'choreSchedules'),
        where('familyId', '==', familyId),
        where('childId', '==', childId),
        where('templateId', '==', templateId),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const scheduleDoc = querySnapshot.docs[0];
      return {
        id: scheduleDoc.id,
        ...scheduleDoc.data()
      };
    } catch (error) {
      console.error("Error getting chore schedule for template:", error);
      return null;
    }
  }

  /**
   * Calculate the previous date for a chore based on its schedule
   * @param {Date} currentDate - Current date
   * @param {Object} schedule - Schedule object
   * @returns {Date|null} - Previous date or null if cannot be determined
   */
  calculatePreviousDate(currentDate, schedule) {
    try {
      const scheduleData = schedule.schedule;
      const scheduleType = scheduleData.type;
      
      if (scheduleType === 'one-time') {
        return null; // One-time chores don't have previous dates
      } else if (scheduleType === 'repeating') {
        const frequency = scheduleData.frequency;
        
        if (frequency === 'daily') {
          const previousDay = new Date(currentDate);
          previousDay.setDate(previousDay.getDate() - 1);
          return previousDay;
        } else if (frequency === 'weekly') {
          const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
          const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert to 1 = Monday, 7 = Sunday
          
          // Sort days of week in descending order
          const sortedDays = [...scheduleData.daysOfWeek].sort((a, b) => b - a);
          
          // Find the previous day of week
          let previousDayOfWeek = null;
          for (const day of sortedDays) {
            if (day < adjustedDayOfWeek) {
              previousDayOfWeek = day;
              break;
            }
          }
          
          // If no day is found, take the highest day from the previous week
          if (previousDayOfWeek === null && sortedDays.length > 0) {
            previousDayOfWeek = sortedDays[0];
            // Calculate days back to the previous occurrence
            const daysBack = adjustedDayOfWeek + (7 - previousDayOfWeek);
            const previousDate = new Date(currentDate);
            previousDate.setDate(previousDate.getDate() - daysBack);
            return previousDate;
          } else if (previousDayOfWeek !== null) {
            // Calculate days back to the previous occurrence
            const daysBack = adjustedDayOfWeek - previousDayOfWeek;
            const previousDate = new Date(currentDate);
            previousDate.setDate(previousDate.getDate() - daysBack);
            return previousDate;
          }
        } else if (frequency === 'monthly') {
          // Monthly schedules are more complex and would require additional logic
          return null;
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error in calculatePreviousDate:", error);
      return null;
    }
  }

  /**
   * Reject a completed chore instance
   * @param {string} instanceId - Instance ID
   * @param {string} parentId - Parent ID who is rejecting
   * @param {Object} rejectionData - Rejection data
   * @returns {Promise<Object>} - Updated instance data
   */
  async rejectChoreInstance(instanceId, parentId, rejectionData) {
    try {
      const docRef = doc(this.db, 'choreInstances', instanceId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error(`Chore instance with ID ${instanceId} not found`);
      }
      
      // Update the instance
      const updateData = {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectedBy: parentId,
        rejectionReason: rejectionData.reason || 'Not completed properly',
        parentFeedback: rejectionData.feedback || null,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(docRef, updateData);
      
      // Fetch the updated document
      const updatedSnap = await getDoc(docRef);
      
      return {
        id: updatedSnap.id,
        ...updatedSnap.data(),
        date: updatedSnap.data().date?.toDate(),
        completedAt: updatedSnap.data().completedAt?.toDate(),
        rejectedAt: updatedSnap.data().rejectedAt?.toDate(),
        createdAt: updatedSnap.data().createdAt?.toDate(),
        updatedAt: updatedSnap.data().updatedAt?.toDate()
      };
    } catch (error) {
      console.error("Error rejecting chore instance:", error);
      throw error;
    }
  }

  /**
   * Get chore statistics for a child
   * @param {string} familyId - Family ID
   * @param {string} childId - Child ID
   * @param {number} days - Number of days to look back
   * @returns {Promise<Object>} - Statistics object
   */
  async getChoreStats(familyId, childId, days = 30) {
    try {
      console.log(`[DEBUG] Getting chore stats for family: ${familyId}, child: ${childId}, days: ${days}`);
      
      const now = new Date();
      const startDate = new Date();
      startDate.setDate(now.getDate() - days);
      
      // Convert to Firestore Timestamps
      const startTimestamp = Timestamp.fromDate(startDate);
      const nowTimestamp = Timestamp.fromDate(now);
      
      // Try indexed query first if available
      try {
        // This query uses the index defined in firestore.indexes.json
        console.log(`[DEBUG] Attempting optimized query with index for chore stats`);
        const indexedQuery = query(
          collection(this.db, 'choreInstances'),
          where('familyId', '==', familyId),
          where('childId', '==', childId),
          where('date', '>=', startTimestamp),
          where('date', '<=', nowTimestamp),
          orderBy('date', 'desc')
        );
        
        const indexedSnapshot = await getDocs(indexedQuery);
        console.log(`[DEBUG] Index-based query successful, got ${indexedSnapshot.docs.length} instances`);
        
        // Process results directly (no need to filter date range as it was done in the query)
        const instances = indexedSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate(),
          completedAt: doc.data().completedAt?.toDate(),
          approvedAt: doc.data().approvedAt?.toDate()
        }));
        
        // Calculate statistics using these instances
        return this.calculateStatsFromInstances(instances, familyId);
      } catch (indexError) {
        console.log(`[DEBUG] Index-based query failed, using fallback. Error: ${indexError.message}`);
      }
      
      // If index doesn't exist, use a simpler query
      console.log(`[DEBUG] Using simple query with client-side filtering for chore stats`);
      const q = query(
        collection(this.db, 'choreInstances'),
        where('familyId', '==', familyId),
        where('childId', '==', childId)
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`[DEBUG] Got ${querySnapshot.docs.length} instances to process for stats`);
      
      // Filter for date range in memory
      const instances = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate() // Convert to Date objects
        }))
        .filter(instance => 
          instance.date >= startDate && 
          instance.date <= now
        );
      
      console.log(`[DEBUG] Filtered to ${instances.length} instances in the requested date range`);
      
      // Calculate statistics from the filtered instances
      return this.calculateStatsFromInstances(instances, familyId);
    } catch (error) {
      console.error("Error getting chore stats:", error);
      
      // Try fallback method with even simpler query
      try {
        console.error("Using fallback method for chore stats");
        
        // Just get all instances for this family
        const simpleQuery = query(
          collection(this.db, 'choreInstances'),
          where('familyId', '==', familyId)
        );
        
        const allInstancesSnapshot = await getDocs(simpleQuery);
        
        const now = new Date();
        const startDate = new Date();
        startDate.setDate(now.getDate() - days);
        
        // Filter in memory
        const instances = allInstancesSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate()
          }))
          .filter(instance => 
            instance.childId === childId && 
            instance.date >= startDate && 
            instance.date <= now
          );
        
        // Return basic stats without complex calculations
        return {
          totalChores: instances.length,
          completed: instances.filter(i => i.status === 'completed' || i.status === 'approved').length,
          approved: instances.filter(i => i.status === 'approved').length,
          rejected: instances.filter(i => i.status === 'rejected').length,
          pending: instances.filter(i => i.status === 'pending').length,
          pendingApproval: instances.filter(i => i.status === 'completed').length,
          totalBucksEarned: instances
            .filter(i => i.status === 'approved')
            .reduce((sum, i) => sum + (i.bucksAwarded || 0), 0),
          choreTypes: {},
          daysCompleted: {},
          longestStreak: 0
        };
      } catch (fallbackError) {
        console.error("Fallback method for stats also failed:", fallbackError);
        throw error;
      }
    }
  }
  
  /**
   * Helper method to calculate statistics from chore instances
   * @param {Array} instances - Array of chore instances
   * @param {string} familyId - Family ID (needed for template lookups)
   * @returns {Promise<Object>} - Statistics object
   */
  async calculateStatsFromInstances(instances, familyId) {
    console.log(`[DEBUG] Calculating stats from ${instances.length} instances`);
    
    // Calculate basic statistics
    const stats = {
      totalChores: instances.length,
      completed: instances.filter(i => i.status === 'completed' || i.status === 'approved').length,
      approved: instances.filter(i => i.status === 'approved').length,
      rejected: instances.filter(i => i.status === 'rejected').length,
      pending: instances.filter(i => i.status === 'pending').length,
      pendingApproval: instances.filter(i => i.status === 'completed').length,
      totalBucksEarned: instances
        .filter(i => i.status === 'approved')
        .reduce((sum, i) => sum + (i.bucksAwarded || 0), 0),
      choreTypes: {},
      daysCompleted: {},
      longestStreak: 0
    };
    
    // Calculate chore type distribution
    const choreTypeMap = {};
    for (const instance of instances) {
      if (instance.status === 'approved') {
        if (!choreTypeMap[instance.templateId]) {
          choreTypeMap[instance.templateId] = 0;
        }
        choreTypeMap[instance.templateId]++;
      }
    }
    
    // Get template details for each chore type (in parallel)
    const templatePromises = Object.keys(choreTypeMap).map(async templateId => {
      try {
        const template = await this.getChoreTemplate(templateId);
        return {
          templateId,
          template: {
            count: choreTypeMap[templateId],
            title: template.title,
            icon: template.icon,
            customIconUrl: template.customIconUrl
          }
        };
      } catch (error) {
        console.error(`Error getting template ${templateId}:`, error);
        return {
          templateId,
          template: {
            count: choreTypeMap[templateId],
            title: 'Unknown Chore',
            icon: 'task'
          }
        };
      }
    });
    
    // Await all template lookups and add to stats
    const templateResults = await Promise.all(templatePromises);
    for (const result of templateResults) {
      stats.choreTypes[result.templateId] = result.template;
    }
    
    // Calculate days completed
    for (const instance of instances) {
      if (instance.status === 'approved') {
        const dateString = instance.date.toISOString().split('T')[0]; // YYYY-MM-DD
        
        if (!stats.daysCompleted[dateString]) {
          stats.daysCompleted[dateString] = 0;
        }
        stats.daysCompleted[dateString]++;
      }
    }
    
    // Calculate longest streak
    const dates = Object.keys(stats.daysCompleted).sort();
    let currentStreak = 0;
    let maxStreak = 0;
    
    for (let i = 0; i < dates.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const currentDate = new Date(dates[i]);
        const previousDate = new Date(dates[i - 1]);
        const dayDifference = Math.floor((currentDate - previousDate) / (1000 * 60 * 60 * 24));
        
        if (dayDifference === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      }
      
      maxStreak = Math.max(maxStreak, currentStreak);
    }
    
    stats.longestStreak = maxStreak;
    console.log(`[DEBUG] Stats calculation complete, longest streak: ${maxStreak}`);
    
    return stats;
  }

  /**
   * Get completed chores for a family on a specific date
   * @param {string} familyId - Family ID
   * @param {Date} date - Date to get completed chores for
   * @returns {Promise<Array>} - Array of completed chore instances
   */
  async getCompletedChoresForFamily(familyId, date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const q = query(
        collection(this.db, 'choreInstances'),
        where('familyId', '==', familyId),
        where('status', '==', 'completed'),
        where('completedAt', '>=', Timestamp.fromDate(startOfDay)),
        where('completedAt', '<=', Timestamp.fromDate(endOfDay))
      );
      
      const querySnapshot = await getDocs(q);
      
      const completedChores = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          
          // Get template data if available
          let template = null;
          if (data.templateId) {
            const templateRef = doc(this.db, 'choreTemplates', data.templateId);
            const templateDoc = await getDoc(templateRef);
            if (templateDoc.exists()) {
              template = { id: templateDoc.id, ...templateDoc.data() };
            }
          }
          
          return {
            id: docSnap.id,
            ...data,
            template,
            completedAt: data.completedAt?.toDate(),
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate()
          };
        })
      );
      
      return completedChores;
    } catch (error) {
      console.error("Error getting completed chores for family:", error);
      return [];
    }
  }

  /**
   * Reject a completed chore
   * @param {string} choreId - Chore instance ID
   * @param {string} parentId - Parent ID who is rejecting
   * @param {Object} rejectionData - Rejection data
   * @returns {Promise<void>}
   */
  async rejectCompletedChore(choreId, parentId, rejectionData) {
    try {
      const choreRef = doc(this.db, 'choreInstances', choreId);
      
      await updateDoc(choreRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectedBy: parentId,
        rejectionReason: rejectionData.reason || 'Parent rejected',
        updatedAt: serverTimestamp()
      });
      
      // TODO: Remove bucks if they were already awarded
      
    } catch (error) {
      console.error("Error rejecting completed chore:", error);
      throw error;
    }
  }

  /**
   * Get chore analytics for a family
   * @param {string} familyId - Family ID
   * @param {number} days - Number of days to analyze (default 30)
   * @returns {Promise<Object>} - Analytics data
   */
  async getChoreAnalytics(familyId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startTimestamp = Timestamp.fromDate(startDate);

      // Get all chore instances for the time period
      const instancesQuery = query(
        collection(this.db, 'choreInstances'),
        where('familyId', '==', familyId),
        where('date', '>=', startTimestamp)
      );

      const snapshot = await getDocs(instancesQuery);
      const instances = [];
      
      snapshot.forEach((doc) => {
        instances.push({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate()
        });
      });

      // Analyze by assignee
      const byAssignee = {};
      const byCategory = {};
      const byTimeOfDay = {};
      
      instances.forEach(instance => {
        // By assignee
        if (!byAssignee[instance.childId]) {
          byAssignee[instance.childId] = {
            total: 0,
            completed: 0,
            pending: 0,
            approved: 0,
            rejected: 0
          };
        }
        byAssignee[instance.childId].total++;
        if (instance.status === 'completed') byAssignee[instance.childId].completed++;
        if (instance.status === 'pending') byAssignee[instance.childId].pending++;
        if (instance.status === 'approved') byAssignee[instance.childId].approved++;
        if (instance.status === 'rejected') byAssignee[instance.childId].rejected++;

        // By time of day
        const timeOfDay = instance.timeOfDay || 'anytime';
        if (!byTimeOfDay[timeOfDay]) {
          byTimeOfDay[timeOfDay] = {
            total: 0,
            completed: 0,
            completionRate: 0
          };
        }
        byTimeOfDay[timeOfDay].total++;
        if (instance.status === 'completed' || instance.status === 'approved') {
          byTimeOfDay[timeOfDay].completed++;
        }
      });

      // Calculate completion rates
      Object.keys(byAssignee).forEach(assignee => {
        const data = byAssignee[assignee];
        data.completionRate = data.total > 0 ? (data.completed + data.approved) / data.total : 0;
      });

      Object.keys(byTimeOfDay).forEach(timeOfDay => {
        const data = byTimeOfDay[timeOfDay];
        data.completionRate = data.total > 0 ? data.completed / data.total : 0;
      });

      return {
        analytics: {
          byAssignee,
          byCategory,
          byTimeOfDay,
          totalInstances: instances.length,
          overallCompletionRate: instances.length > 0 
            ? instances.filter(i => i.status === 'completed' || i.status === 'approved').length / instances.length 
            : 0
        }
      };
    } catch (error) {
      console.error("Error getting chore analytics:", error);
      return { analytics: {} };
    }
  }
}

export default new ChoreService();