import firebase from './firebase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for managing medications and medication schedules
 */
class MedicationManager {
  constructor() {
    this.db = firebase.firestore();
    this.medicationsCollection = this.db.collection('medications');
    this.schedulesCollection = this.db.collection('medicationSchedules');
    this.remindersCollection = this.db.collection('reminders');
  }

  /**
   * Create a new medication
   * @param {Object} medicationData - Medication information
   * @param {string} medicationData.name - Medication name
   * @param {string} medicationData.dosage - Dosage information
   * @param {string} medicationData.instructions - Special instructions
   * @param {string} medicationData.familyMemberId - ID of family member taking the medication
   * @param {string} [medicationData.prescribedBy] - Provider who prescribed the medication
   * @param {Date} [medicationData.startDate] - When to start taking the medication
   * @param {Date} [medicationData.endDate] - When to stop taking the medication
   * @param {boolean} [medicationData.isActive=true] - Whether the medication is active
   * @returns {Promise<string>} - ID of the created medication
   */
  async createMedication(medicationData) {
    try {
      const medicationId = medicationData.id || uuidv4();
      const medication = {
        id: medicationId,
        name: medicationData.name,
        dosage: medicationData.dosage,
        instructions: medicationData.instructions,
        familyMemberId: medicationData.familyMemberId,
        prescribedBy: medicationData.prescribedBy || null,
        startDate: medicationData.startDate || firebase.firestore.Timestamp.now(),
        endDate: medicationData.endDate || null,
        isActive: medicationData.isActive !== undefined ? medicationData.isActive : true,
        refillInfo: medicationData.refillInfo || null,
        sideEffectsToWatch: medicationData.sideEffectsToWatch || [],
        createdAt: firebase.firestore.Timestamp.now(),
        updatedAt: firebase.firestore.Timestamp.now(),
        relatedMedicalEvents: medicationData.relatedMedicalEvents || [],
      };

      await this.medicationsCollection.doc(medicationId).set(medication);
      return medicationId;
    } catch (error) {
      console.error('Error creating medication:', error);
      throw error;
    }
  }

  /**
   * Update an existing medication
   * @param {string} medicationId - ID of the medication to update
   * @param {Object} medicationData - Updated medication data
   * @returns {Promise<void>}
   */
  async updateMedication(medicationId, medicationData) {
    try {
      const updatedData = {
        ...medicationData,
        updatedAt: firebase.firestore.Timestamp.now()
      };
      await this.medicationsCollection.doc(medicationId).update(updatedData);
    } catch (error) {
      console.error('Error updating medication:', error);
      throw error;
    }
  }

  /**
   * Delete a medication
   * @param {string} medicationId - ID of the medication to delete
   * @returns {Promise<void>}
   */
  async deleteMedication(medicationId) {
    try {
      // Delete the medication schedules as well
      const schedules = await this.schedulesCollection
        .where('medicationId', '==', medicationId)
        .get();
      
      const batch = this.db.batch();
      schedules.forEach(doc => batch.delete(doc.ref));
      
      // Delete the medication document
      batch.delete(this.medicationsCollection.doc(medicationId));
      
      await batch.commit();
    } catch (error) {
      console.error('Error deleting medication:', error);
      throw error;
    }
  }

  /**
   * Fetch a medication by ID
   * @param {string} medicationId - ID of the medication to fetch
   * @returns {Promise<Object|null>} - Medication data or null if not found
   */
  async getMedicationById(medicationId) {
    try {
      const doc = await this.medicationsCollection.doc(medicationId).get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      console.error('Error fetching medication:', error);
      throw error;
    }
  }

  /**
   * Fetch all medications for a family member
   * @param {string} familyMemberId - ID of the family member
   * @param {boolean} [activeOnly=true] - Whether to fetch only active medications
   * @returns {Promise<Array>} - Array of medication objects
   */
  async getMedicationsByFamilyMember(familyMemberId, activeOnly = true) {
    try {
      let query = this.medicationsCollection.where('familyMemberId', '==', familyMemberId);
      
      if (activeOnly) {
        query = query.where('isActive', '==', true);
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error fetching medications for family member:', error);
      throw error;
    }
  }

  /**
   * Create a medication schedule
   * @param {Object} scheduleData - Schedule information
   * @param {string} scheduleData.medicationId - ID of the medication
   * @param {string} scheduleData.familyMemberId - ID of the family member
   * @param {string} scheduleData.frequency - Frequency (e.g., 'daily', 'weekly', 'monthly')
   * @param {Array} scheduleData.times - Array of times to take the medication (e.g., ['08:00', '20:00'])
   * @param {Array} [scheduleData.daysOfWeek] - Array of days for weekly frequency (0-6, starting from Sunday)
   * @param {number} [scheduleData.dayOfMonth] - Day of month for monthly frequency
   * @param {boolean} [scheduleData.withFood=false] - Whether to take with food
   * @returns {Promise<string>} - ID of the created schedule
   */
  async createMedicationSchedule(scheduleData) {
    try {
      const scheduleId = scheduleData.id || uuidv4();
      const schedule = {
        id: scheduleId,
        medicationId: scheduleData.medicationId,
        familyMemberId: scheduleData.familyMemberId,
        frequency: scheduleData.frequency,
        times: scheduleData.times,
        daysOfWeek: scheduleData.daysOfWeek || [],
        dayOfMonth: scheduleData.dayOfMonth || null,
        withFood: scheduleData.withFood || false,
        isActive: scheduleData.isActive !== undefined ? scheduleData.isActive : true,
        createdAt: firebase.firestore.Timestamp.now(),
        updatedAt: firebase.firestore.Timestamp.now(),
      };

      await this.schedulesCollection.doc(scheduleId).set(schedule);
      
      // Generate initial reminders based on the schedule
      await this.generateMedicationReminders(schedule);
      
      return scheduleId;
    } catch (error) {
      console.error('Error creating medication schedule:', error);
      throw error;
    }
  }

  /**
   * Update a medication schedule
   * @param {string} scheduleId - ID of the schedule to update
   * @param {Object} scheduleData - Updated schedule data
   * @returns {Promise<void>}
   */
  async updateMedicationSchedule(scheduleId, scheduleData) {
    try {
      const updatedData = {
        ...scheduleData,
        updatedAt: firebase.firestore.Timestamp.now()
      };
      
      await this.schedulesCollection.doc(scheduleId).update(updatedData);
      
      // Regenerate reminders if the schedule has changed
      if (scheduleData.frequency || scheduleData.times || scheduleData.daysOfWeek || scheduleData.dayOfMonth) {
        const updatedSchedule = await this.getScheduleById(scheduleId);
        await this.clearExistingReminders(scheduleId);
        await this.generateMedicationReminders(updatedSchedule);
      }
    } catch (error) {
      console.error('Error updating medication schedule:', error);
      throw error;
    }
  }

  /**
   * Delete a medication schedule
   * @param {string} scheduleId - ID of the schedule to delete
   * @returns {Promise<void>}
   */
  async deleteMedicationSchedule(scheduleId) {
    try {
      // Delete associated reminders
      await this.clearExistingReminders(scheduleId);
      
      // Delete the schedule
      await this.schedulesCollection.doc(scheduleId).delete();
    } catch (error) {
      console.error('Error deleting medication schedule:', error);
      throw error;
    }
  }

  /**
   * Get a schedule by ID
   * @param {string} scheduleId - ID of the schedule to fetch
   * @returns {Promise<Object|null>} - Schedule data or null if not found
   */
  async getScheduleById(scheduleId) {
    try {
      const doc = await this.schedulesCollection.doc(scheduleId).get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      console.error('Error fetching schedule:', error);
      throw error;
    }
  }

  /**
   * Get all schedules for a medication
   * @param {string} medicationId - ID of the medication
   * @returns {Promise<Array>} - Array of schedule objects
   */
  async getSchedulesForMedication(medicationId) {
    try {
      const snapshot = await this.schedulesCollection
        .where('medicationId', '==', medicationId)
        .where('isActive', '==', true)
        .get();
      
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error fetching schedules for medication:', error);
      throw error;
    }
  }

  /**
   * Get all schedules for a family member
   * @param {string} familyMemberId - ID of the family member
   * @returns {Promise<Array>} - Array of schedule objects with medication information
   */
  async getSchedulesWithMedicationsForFamilyMember(familyMemberId) {
    try {
      // Get all schedules for the family member
      const schedulesSnapshot = await this.schedulesCollection
        .where('familyMemberId', '==', familyMemberId)
        .where('isActive', '==', true)
        .get();
      
      const schedules = schedulesSnapshot.docs.map(doc => doc.data());
      
      // Get all medications for these schedules
      const medicationIds = [...new Set(schedules.map(schedule => schedule.medicationId))];
      const medications = {};
      
      await Promise.all(medicationIds.map(async (medicationId) => {
        const medication = await this.getMedicationById(medicationId);
        if (medication) {
          medications[medicationId] = medication;
        }
      }));
      
      // Combine schedules with their medication information
      return schedules.map(schedule => ({
        ...schedule,
        medication: medications[schedule.medicationId] || null
      }));
    } catch (error) {
      console.error('Error fetching schedules with medications:', error);
      throw error;
    }
  }

  /**
   * Mark a medication as taken
   * @param {string} medicationId - ID of the medication
   * @param {string} scheduleId - ID of the schedule
   * @param {Date} timestamp - When the medication was taken
   * @returns {Promise<string>} - ID of the medication log entry
   */
  async logMedicationTaken(medicationId, scheduleId, timestamp = new Date()) {
    try {
      const logId = uuidv4();
      const logEntry = {
        id: logId,
        medicationId,
        scheduleId,
        familyMemberId: (await this.getMedicationById(medicationId)).familyMemberId,
        timestamp: firebase.firestore.Timestamp.fromDate(timestamp),
        status: 'taken',
        notes: '',
        createdAt: firebase.firestore.Timestamp.now()
      };
      
      await this.db.collection('medicationLogs').doc(logId).set(logEntry);
      return logId;
    } catch (error) {
      console.error('Error logging medication as taken:', error);
      throw error;
    }
  }

  /**
   * Mark a medication as skipped
   * @param {string} medicationId - ID of the medication
   * @param {string} scheduleId - ID of the schedule
   * @param {string} reason - Reason for skipping
   * @param {Date} timestamp - When the medication was skipped
   * @returns {Promise<string>} - ID of the medication log entry
   */
  async logMedicationSkipped(medicationId, scheduleId, reason, timestamp = new Date()) {
    try {
      const logId = uuidv4();
      const logEntry = {
        id: logId,
        medicationId,
        scheduleId,
        familyMemberId: (await this.getMedicationById(medicationId)).familyMemberId,
        timestamp: firebase.firestore.Timestamp.fromDate(timestamp),
        status: 'skipped',
        reason,
        notes: '',
        createdAt: firebase.firestore.Timestamp.now()
      };
      
      await this.db.collection('medicationLogs').doc(logId).set(logEntry);
      return logId;
    } catch (error) {
      console.error('Error logging medication as skipped:', error);
      throw error;
    }
  }

  /**
   * Get medication logs for a family member
   * @param {string} familyMemberId - ID of the family member
   * @param {Date} startDate - Start date for logs
   * @param {Date} endDate - End date for logs
   * @returns {Promise<Array>} - Array of medication log entries
   */
  async getMedicationLogs(familyMemberId, startDate, endDate) {
    try {
      const startTimestamp = firebase.firestore.Timestamp.fromDate(startDate);
      const endTimestamp = firebase.firestore.Timestamp.fromDate(endDate);
      
      const snapshot = await this.db.collection('medicationLogs')
        .where('familyMemberId', '==', familyMemberId)
        .where('timestamp', '>=', startTimestamp)
        .where('timestamp', '<=', endTimestamp)
        .orderBy('timestamp', 'desc')
        .get();
      
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error fetching medication logs:', error);
      throw error;
    }
  }

  /**
   * Get medication adherence statistics for a family member
   * @param {string} familyMemberId - ID of the family member
   * @param {Date} startDate - Start date for statistics
   * @param {Date} endDate - End date for statistics
   * @returns {Promise<Object>} - Adherence statistics
   */
  async getMedicationAdherenceStats(familyMemberId, startDate, endDate) {
    try {
      const logs = await this.getMedicationLogs(familyMemberId, startDate, endDate);
      
      const stats = {
        total: logs.length,
        taken: logs.filter(log => log.status === 'taken').length,
        skipped: logs.filter(log => log.status === 'skipped').length,
        adherenceRate: 0
      };
      
      if (stats.total > 0) {
        stats.adherenceRate = (stats.taken / stats.total) * 100;
      }
      
      return stats;
    } catch (error) {
      console.error('Error calculating medication adherence stats:', error);
      throw error;
    }
  }

  /**
   * Clear existing reminders for a schedule
   * @param {string} scheduleId - ID of the schedule
   * @returns {Promise<void>}
   */
  async clearExistingReminders(scheduleId) {
    try {
      const remindersSnapshot = await this.remindersCollection
        .where('scheduleId', '==', scheduleId)
        .where('type', '==', 'medication')
        .get();
      
      const batch = this.db.batch();
      remindersSnapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    } catch (error) {
      console.error('Error clearing existing reminders:', error);
      throw error;
    }
  }

  /**
   * Generate medication reminders based on a schedule
   * @param {Object} schedule - Medication schedule
   * @returns {Promise<void>}
   */
  async generateMedicationReminders(schedule) {
    try {
      const medication = await this.getMedicationById(schedule.medicationId);
      if (!medication || !medication.isActive || !schedule.isActive) {
        return;
      }
      
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // Generate reminders for the next 30 days
      
      const reminderBatch = this.db.batch();
      const remindersToCreate = [];
      
      // Generate reminder dates based on frequency
      for (let date = new Date(now); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
        const dayOfMonth = date.getDate();
        
        let shouldCreateReminder = false;
        
        switch (schedule.frequency) {
          case 'daily':
            shouldCreateReminder = true;
            break;
          case 'weekly':
            shouldCreateReminder = schedule.daysOfWeek.includes(dayOfWeek);
            break;
          case 'monthly':
            shouldCreateReminder = schedule.dayOfMonth === dayOfMonth;
            break;
          case 'specific-days':
            shouldCreateReminder = schedule.daysOfWeek.includes(dayOfWeek);
            break;
        }
        
        if (shouldCreateReminder) {
          // Create a reminder for each time in the schedule
          for (const time of schedule.times) {
            const [hours, minutes] = time.split(':').map(Number);
            const reminderDate = new Date(date);
            reminderDate.setHours(hours, minutes, 0, 0);
            
            // Skip if reminder time is in the past
            if (reminderDate <= now) {
              continue;
            }
            
            const reminderId = uuidv4();
            const reminder = {
              id: reminderId,
              type: 'medication',
              title: `Time to take ${medication.name}`,
              message: `Time to take ${medication.dosage} of ${medication.name}. ${schedule.withFood ? 'Take with food.' : ''} ${medication.instructions || ''}`,
              scheduledFor: firebase.firestore.Timestamp.fromDate(reminderDate),
              medicationId: medication.id,
              scheduleId: schedule.id,
              familyMemberId: schedule.familyMemberId,
              isActive: true,
              isAcknowledged: false,
              createdAt: firebase.firestore.Timestamp.now()
            };
            
            remindersToCreate.push(reminder);
            
            // Limit batch size to avoid exceeding Firestore limits
            if (remindersToCreate.length >= 400) {
              // Save the current batch and create a new one
              remindersToCreate.forEach(r => {
                reminderBatch.set(this.remindersCollection.doc(r.id), r);
              });
              await reminderBatch.commit();
              remindersToCreate.length = 0;
            }
          }
        }
      }
      
      // Save any remaining reminders
      if (remindersToCreate.length > 0) {
        remindersToCreate.forEach(r => {
          reminderBatch.set(this.remindersCollection.doc(r.id), r);
        });
        await reminderBatch.commit();
      }
    } catch (error) {
      console.error('Error generating medication reminders:', error);
      throw error;
    }
  }
  
  /**
   * Get upcoming medication reminders for a family member
   * @param {string} familyMemberId - ID of the family member
   * @param {number} [days=7] - Number of days to look ahead
   * @returns {Promise<Array>} - Array of reminder objects with medication information
   */
  async getUpcomingMedicationReminders(familyMemberId, days = 7) {
    try {
      const now = new Date();
      const future = new Date();
      future.setDate(future.getDate() + days);
      
      const nowTimestamp = firebase.firestore.Timestamp.fromDate(now);
      const futureTimestamp = firebase.firestore.Timestamp.fromDate(future);
      
      const snapshot = await this.remindersCollection
        .where('familyMemberId', '==', familyMemberId)
        .where('type', '==', 'medication')
        .where('isActive', '==', true)
        .where('scheduledFor', '>=', nowTimestamp)
        .where('scheduledFor', '<=', futureTimestamp)
        .orderBy('scheduledFor', 'asc')
        .get();
      
      const reminders = snapshot.docs.map(doc => doc.data());
      
      // Fetch medication details for each reminder
      const medicationIds = [...new Set(reminders.map(r => r.medicationId))];
      const medications = {};
      
      await Promise.all(medicationIds.map(async (id) => {
        const medication = await this.getMedicationById(id);
        if (medication) {
          medications[id] = medication;
        }
      }));
      
      // Add medication details to reminders
      return reminders.map(reminder => ({
        ...reminder,
        medication: medications[reminder.medicationId] || null
      }));
    } catch (error) {
      console.error('Error fetching upcoming medication reminders:', error);
      throw error;
    }
  }
  
  /**
   * Connect a medication to a medical event
   * @param {string} medicationId - ID of the medication
   * @param {string} medicalEventId - ID of the medical event
   * @returns {Promise<void>}
   */
  async connectMedicationToMedicalEvent(medicationId, medicalEventId) {
    try {
      const medication = await this.getMedicationById(medicationId);
      if (!medication) {
        throw new Error(`Medication with ID ${medicationId} not found`);
      }
      
      const relatedEvents = [...(medication.relatedMedicalEvents || [])];
      if (!relatedEvents.includes(medicalEventId)) {
        relatedEvents.push(medicalEventId);
        await this.updateMedication(medicationId, { relatedMedicalEvents: relatedEvents });
      }
    } catch (error) {
      console.error('Error connecting medication to medical event:', error);
      throw error;
    }
  }
  
  /**
   * Disconnect a medication from a medical event
   * @param {string} medicationId - ID of the medication
   * @param {string} medicalEventId - ID of the medical event
   * @returns {Promise<void>}
   */
  async disconnectMedicationFromMedicalEvent(medicationId, medicalEventId) {
    try {
      const medication = await this.getMedicationById(medicationId);
      if (!medication) {
        throw new Error(`Medication with ID ${medicationId} not found`);
      }
      
      const relatedEvents = [...(medication.relatedMedicalEvents || [])];
      const updatedEvents = relatedEvents.filter(id => id !== medicalEventId);
      
      if (relatedEvents.length !== updatedEvents.length) {
        await this.updateMedication(medicationId, { relatedMedicalEvents: updatedEvents });
      }
    } catch (error) {
      console.error('Error disconnecting medication from medical event:', error);
      throw error;
    }
  }
}

export default new MedicationManager();