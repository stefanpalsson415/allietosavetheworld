// src/services/MedicalReminderScheduler.js
import { db } from './firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  deleteDoc, query, where, serverTimestamp, Timestamp 
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import MedicalEventService from './MedicalEventHandler';

/**
 * Service to schedule and manage medical reminders
 */
class MedicalReminderScheduler {
  constructor() {
    this.remindersCollection = collection(db, "medicalReminders");
    this.reminderLogsCollection = collection(db, "medicalReminderLogs");
  }
  
  /**
   * Create a scheduled reminder
   * @param {string} familyId - The family ID
   * @param {string} userId - The user ID
   * @param {Object} reminderData - Reminder data
   * @returns {Promise<Object>} Created reminder info
   */
  async scheduleReminder(familyId, userId, reminderData) {
    try {
      // Generate reminder ID
      const reminderId = uuidv4();
      
      // Get default reminder date based on type if not provided
      let reminderDate = null;
      if (reminderData.reminderDate) {
        reminderDate = new Date(reminderData.reminderDate);
      } else if (reminderData.eventDate) {
        // Default reminder times based on type
        const eventDate = new Date(reminderData.eventDate);
        
        switch (reminderData.reminderType) {
          case 'preparation':
            // 3 days before appointment for preparation
            reminderDate = new Date(eventDate);
            reminderDate.setDate(reminderDate.getDate() - 3);
            break;
          case 'document':
            // 1 week before appointment for documents
            reminderDate = new Date(eventDate);
            reminderDate.setDate(reminderDate.getDate() - 7);
            break;
          case 'appointment':
            // 1 day before appointment
            reminderDate = new Date(eventDate);
            reminderDate.setDate(reminderDate.getDate() - 1);
            break;
          case 'medication':
            // Same day for medication, but at specific time
            reminderDate = new Date(eventDate);
            reminderDate.setHours(9, 0, 0, 0); // Default to 9 AM
            break;
          default:
            // Default to 1 day before
            reminderDate = new Date(eventDate);
            reminderDate.setDate(reminderDate.getDate() - 1);
        }
      } else {
        // Default to tomorrow if no dates provided
        reminderDate = new Date();
        reminderDate.setDate(reminderDate.getDate() + 1);
      }
      
      // Prepare reminder document
      const reminder = {
        id: reminderId,
        familyId,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // Reminder information
        title: reminderData.title || 'Medical Reminder',
        description: reminderData.description || '',
        reminderType: reminderData.reminderType || 'general',
        reminderDate: Timestamp.fromDate(reminderDate),
        
        // Related event information
        eventId: reminderData.eventId || null,
        patientId: reminderData.patientId || null,
        patientName: reminderData.patientName || '',
        
        // Status tracking
        status: 'scheduled', // scheduled, sent, dismissed, completed
        dismissedBy: null,
        dismissedAt: null,
        completedBy: null,
        completedAt: null,
        
        // Repeat settings
        repeat: reminderData.repeat || false,
        repeatFrequency: reminderData.repeatFrequency || 'none', // none, daily, weekly, monthly
        repeatEndDate: reminderData.repeatEndDate ? Timestamp.fromDate(new Date(reminderData.repeatEndDate)) : null,
        
        // Notification settings
        notificationChannels: reminderData.notificationChannels || ['app'],
        primaryChannel: reminderData.primaryChannel || 'app',
        
        // Custom fields for different reminder types
        metadata: reminderData.metadata || {}
      };
      
      // Save the reminder document
      await setDoc(doc(this.remindersCollection, reminderId), reminder);
      
      return {
        success: true,
        reminderId,
        reminder
      };
    } catch (error) {
      console.error("Error scheduling reminder:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Update a reminder
   * @param {string} reminderId - The reminder ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Update result
   */
  async updateReminder(reminderId, updateData) {
    try {
      // Get current reminder
      const reminderDoc = await getDoc(doc(this.remindersCollection, reminderId));
      
      if (!reminderDoc.exists()) {
        throw new Error(`Reminder with ID ${reminderId} not found`);
      }
      
      // Prepare update object
      const update = {
        ...updateData,
        updatedAt: serverTimestamp()
      };
      
      // Handle date conversion for reminderDate
      if (updateData.reminderDate && !(updateData.reminderDate instanceof Timestamp)) {
        update.reminderDate = Timestamp.fromDate(new Date(updateData.reminderDate));
      }
      
      // Handle date conversion for repeatEndDate
      if (updateData.repeatEndDate && !(updateData.repeatEndDate instanceof Timestamp)) {
        update.repeatEndDate = Timestamp.fromDate(new Date(updateData.repeatEndDate));
      }
      
      // Update the reminder
      await updateDoc(doc(this.remindersCollection, reminderId), update);
      
      return { success: true };
    } catch (error) {
      console.error("Error updating reminder:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Delete a reminder
   * @param {string} reminderId - The reminder ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteReminder(reminderId) {
    try {
      await deleteDoc(doc(this.remindersCollection, reminderId));
      
      return { success: true };
    } catch (error) {
      console.error("Error deleting reminder:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Get reminders for a family
   * @param {string} familyId - The family ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Reminders
   */
  async getRemindersForFamily(familyId, filters = {}) {
    try {
      let remindersQuery = query(
        this.remindersCollection,
        where("familyId", "==", familyId)
      );
      
      // Apply additional filters
      if (filters.patientId) {
        remindersQuery = query(remindersQuery, where("patientId", "==", filters.patientId));
      }
      
      if (filters.status) {
        remindersQuery = query(remindersQuery, where("status", "==", filters.status));
      }
      
      if (filters.reminderType) {
        remindersQuery = query(remindersQuery, where("reminderType", "==", filters.reminderType));
      }
      
      const reminderDocs = await getDocs(remindersQuery);
      const reminders = [];
      
      reminderDocs.forEach(doc => {
        reminders.push(doc.data());
      });
      
      // Sort by reminder date (default ascending)
      reminders.sort((a, b) => {
        const dateA = a.reminderDate.toDate();
        const dateB = b.reminderDate.toDate();
        
        return filters.sortOrder === 'desc' 
          ? dateB - dateA 
          : dateA - dateB;
      });
      
      return reminders;
    } catch (error) {
      console.error("Error getting reminders:", error);
      return [];
    }
  }
  
  /**
   * Mark a reminder as sent
   * @param {string} reminderId - The reminder ID
   * @returns {Promise<Object>} Update result
   */
  async markReminderAsSent(reminderId) {
    try {
      // Update reminder status
      await updateDoc(doc(this.remindersCollection, reminderId), {
        status: 'sent',
        updatedAt: serverTimestamp()
      });
      
      // Log the reminder
      await this.logReminderAction(reminderId, 'sent', null);
      
      return { success: true };
    } catch (error) {
      console.error("Error marking reminder as sent:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Mark a reminder as dismissed
   * @param {string} reminderId - The reminder ID
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} Update result
   */
  async dismissReminder(reminderId, userId) {
    try {
      // Update reminder status
      await updateDoc(doc(this.remindersCollection, reminderId), {
        status: 'dismissed',
        dismissedBy: userId,
        dismissedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Log the action
      await this.logReminderAction(reminderId, 'dismissed', userId);
      
      return { success: true };
    } catch (error) {
      console.error("Error dismissing reminder:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Mark a reminder as completed
   * @param {string} reminderId - The reminder ID
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} Update result
   */
  async completeReminder(reminderId, userId) {
    try {
      // Update reminder status
      await updateDoc(doc(this.remindersCollection, reminderId), {
        status: 'completed',
        completedBy: userId,
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Log the action
      await this.logReminderAction(reminderId, 'completed', userId);
      
      // If this is a repeating reminder, create the next one
      const reminderDoc = await getDoc(doc(this.remindersCollection, reminderId));
      
      if (reminderDoc.exists()) {
        const reminder = reminderDoc.data();
        
        if (reminder.repeat && reminder.repeatFrequency !== 'none') {
          await this.createNextRepeatingReminder(reminder);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error completing reminder:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Log a reminder action
   * @param {string} reminderId - The reminder ID
   * @param {string} action - The action performed
   * @param {string} userId - The user ID
   * @returns {Promise<void>}
   */
  async logReminderAction(reminderId, action, userId) {
    try {
      const logId = uuidv4();
      
      await setDoc(doc(this.reminderLogsCollection, logId), {
        id: logId,
        reminderId,
        action,
        userId,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error logging reminder action:", error);
    }
  }
  
  /**
   * Create the next instance of a repeating reminder
   * @param {Object} currentReminder - The current reminder
   * @returns {Promise<Object>} Creation result
   */
  async createNextRepeatingReminder(currentReminder) {
    try {
      // Calculate the next reminder date
      const currentDate = currentReminder.reminderDate.toDate();
      let nextDate = new Date(currentDate);
      
      switch (currentReminder.repeatFrequency) {
        case 'daily':
          nextDate.setDate(nextDate.getDate() + 1);
          break;
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        default:
          return { success: false, error: "Invalid repeat frequency" };
      }
      
      // Check if we've reached the end date
      if (currentReminder.repeatEndDate) {
        const endDate = currentReminder.repeatEndDate.toDate();
        
        if (nextDate > endDate) {
          return { success: true, message: "Repeat end date reached" };
        }
      }
      
      // Prepare data for the new reminder
      const reminderData = {
        title: currentReminder.title,
        description: currentReminder.description,
        reminderType: currentReminder.reminderType,
        reminderDate: nextDate,
        eventId: currentReminder.eventId,
        patientId: currentReminder.patientId,
        patientName: currentReminder.patientName,
        repeat: currentReminder.repeat,
        repeatFrequency: currentReminder.repeatFrequency,
        repeatEndDate: currentReminder.repeatEndDate,
        notificationChannels: currentReminder.notificationChannels,
        primaryChannel: currentReminder.primaryChannel,
        metadata: currentReminder.metadata
      };
      
      // Create the new reminder
      return await this.scheduleReminder(
        currentReminder.familyId,
        currentReminder.createdBy,
        reminderData
      );
    } catch (error) {
      console.error("Error creating next repeating reminder:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Generate preparation reminders for upcoming events
   * @returns {Promise<Array>} Created reminders
   */
  async generatePreparationReminders() {
    try {
      // Get appointment reminders for the next 7 days
      const preparationReminders = await MedicalEventService.generatePreAppointmentReminders(7);
      const createdReminders = [];
      
      // For each event that needs preparation, create a reminder
      for (const reminder of preparationReminders) {
        if (reminder.type === 'preparation' && reminder.incompleteSteps > 0) {
          // Create a reminder for the event
          const result = await this.scheduleReminder(
            reminder.familyId,
            reminder.createdBy || 'system',
            {
              title: `Preparation for ${reminder.title}`,
              description: `You have ${reminder.incompleteSteps} preparation steps to complete for ${reminder.patientName}'s appointment.`,
              reminderType: 'preparation',
              eventId: reminder.eventId,
              patientId: reminder.patientId,
              patientName: reminder.patientName,
              eventDate: reminder.appointmentDate.toDate(),
              notificationChannels: ['app'],
              metadata: {
                incompleteSteps: reminder.incompleteSteps,
                steps: reminder.steps
              }
            }
          );
          
          if (result.success) {
            createdReminders.push(result.reminder);
          }
        }
      }
      
      return createdReminders;
    } catch (error) {
      console.error("Error generating preparation reminders:", error);
      return [];
    }
  }
  
  /**
   * Generate document reminders for upcoming events
   * @returns {Promise<Array>} Created reminders
   */
  async generateDocumentReminders() {
    try {
      // Get appointment reminders for the next 7 days
      const documentReminders = await MedicalEventService.generatePreAppointmentReminders(7);
      const createdReminders = [];
      
      // For each event that needs documents, create a reminder
      for (const reminder of documentReminders) {
        if (reminder.type === 'documents' && reminder.neededDocuments > 0) {
          // Create a reminder for the event
          const result = await this.scheduleReminder(
            reminder.familyId,
            reminder.createdBy || 'system',
            {
              title: `Documents for ${reminder.title}`,
              description: `You need ${reminder.neededDocuments} documents for ${reminder.patientName}'s appointment.`,
              reminderType: 'document',
              eventId: reminder.eventId,
              patientId: reminder.patientId,
              patientName: reminder.patientName,
              eventDate: reminder.appointmentDate.toDate(),
              notificationChannels: ['app'],
              metadata: {
                neededDocuments: reminder.neededDocuments,
                documents: reminder.documents
              }
            }
          );
          
          if (result.success) {
            createdReminders.push(result.reminder);
          }
        }
      }
      
      return createdReminders;
    } catch (error) {
      console.error("Error generating document reminders:", error);
      return [];
    }
  }
  
  /**
   * Get due reminders for a family
   * @param {string} familyId - The family ID
   * @returns {Promise<Array>} Due reminders
   */
  async getDueReminders(familyId) {
    try {
      // Get current date
      const now = new Date();
      
      // Query for due reminders
      const dueRemindersQuery = query(
        this.remindersCollection,
        where("familyId", "==", familyId),
        where("status", "in", ["scheduled", "sent"]),
        where("reminderDate", "<=", Timestamp.fromDate(now))
      );
      
      const reminderDocs = await getDocs(dueRemindersQuery);
      const dueReminders = [];
      
      reminderDocs.forEach(doc => {
        dueReminders.push(doc.data());
      });
      
      return dueReminders;
    } catch (error) {
      console.error("Error getting due reminders:", error);
      return [];
    }
  }
}

export default new MedicalReminderScheduler();