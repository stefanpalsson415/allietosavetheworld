// HabitReminderService.js - SMS/notification reminders for habits
import { 
  doc, collection, getDoc, setDoc, updateDoc, 
  query, where, getDocs, serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import BrevoService from './BrevoService';

class HabitReminderService {
  constructor() {
    this.remindersCollection = 'habitReminders';
    this.smsOptInCollection = 'smsOptIns';
  }

  // Check if user has opted in for SMS reminders
  async hasOptedInForSMS(userId, familyId) {
    try {
      // First check if user has phone verified
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return false;
      
      const userData = userDoc.data();
      if (!userData.phoneVerified || !userData.phoneNumber) return false;
      
      // Check notification preferences
      const prefsDoc = await getDoc(doc(db, 'users', userId, 'preferences', 'notifications'));
      if (prefsDoc.exists()) {
        const prefs = prefsDoc.data();
        // Check if habit SMS reminders are enabled
        return prefs.sms?.habitReminders !== false;
      }
      
      // Default to true if phone is verified but no preferences set
      return true;
    } catch (error) {
      console.error('Error checking SMS opt-in:', error);
      return false;
    }
  }

  // Opt in for SMS reminders (updates user preferences)
  async optInForSMS(userId, familyId, phoneNumber) {
    try {
      // Update notification preferences
      const prefsRef = doc(db, 'users', userId, 'preferences', 'notifications');
      await setDoc(prefsRef, {
        sms: {
          habitReminders: true,
          updatedAt: serverTimestamp()
        }
      }, { merge: true });
      
      // Also log this opt-in for tracking
      const optInLogRef = doc(collection(db, 'smsOptInLogs'));
      await setDoc(optInLogRef, {
        userId,
        familyId,
        phoneNumber,
        optedInFor: 'habitReminders',
        timestamp: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error opting in for SMS:', error);
      throw error;
    }
  }

  // Schedule a reminder for a habit
  async scheduleHabitReminder(habit, familyId, userId) {
    try {
      // Check if user has opted in for SMS
      const hasOptedIn = await this.hasOptedInForSMS(userId, familyId);
      if (!hasOptedIn) {
        console.log('User has not opted in for SMS reminders');
        return null;
      }

      // Get user's phone number from user document
      const userDoc = await getDoc(doc(db, 'users', userId));
      const phoneNumber = userDoc.data()?.phoneNumber;

      // Calculate reminder time based on habit schedule
      const reminderTime = this.calculateReminderTime(habit);
      
      // Create reminder document
      const reminderId = `reminder_${habit.habitId}_${Date.now()}`;
      const reminderData = {
        reminderId,
        habitId: habit.habitId,
        familyId,
        userId,
        phoneNumber,
        habitTitle: habit.title,
        habitCue: habit.fourLaws.obvious[0] || habit.twoMinuteVersion,
        scheduledFor: reminderTime,
        status: 'scheduled',
        createdAt: serverTimestamp(),
        type: 'habit_reminder'
      };

      // Save reminder
      const reminderRef = doc(db, 'families', familyId, this.remindersCollection, reminderId);
      await setDoc(reminderRef, reminderData);

      return reminderData;
    } catch (error) {
      console.error('Error scheduling habit reminder:', error);
      throw error;
    }
  }

  // Send immediate reminder
  async sendHabitReminder(habitId, familyId, userId) {
    try {
      // Get habit details
      const habitDoc = await getDoc(doc(db, 'families', familyId, 'habits2', habitId));
      if (!habitDoc.exists()) {
        throw new Error('Habit not found');
      }
      const habit = habitDoc.data();

      // Check SMS opt-in
      const hasOptedIn = await this.hasOptedInForSMS(userId, familyId);
      if (!hasOptedIn) {
        throw new Error('User has not opted in for SMS reminders');
      }
      
      // Get phone number from user document
      const userDoc = await getDoc(doc(db, 'users', userId));
      const phoneNumber = userDoc.data()?.phoneNumber;
      if (!phoneNumber) {
        throw new Error('User phone number not found');
      }

      // Construct reminder message
      const message = this.constructReminderMessage(habit);

      // Send SMS via Brevo
      const result = await BrevoService.sendSms({
        to: phoneNumber,
        content: message,
        sender: 'Allie'
      });

      // Log the reminder
      await this.logReminderSent(habitId, familyId, userId, phoneNumber, message);

      return result;
    } catch (error) {
      console.error('Error sending habit reminder:', error);
      throw error;
    }
  }

  // Construct a personalized reminder message
  constructReminderMessage(habit) {
    const cue = habit.fourLaws.obvious[0] || `Time for: ${habit.title}`;
    const reward = habit.fourLaws.satisfying[0] || 'You got this!';
    const twoMinVersion = habit.twoMinuteVersion || habit.title;
    
    // Keep it short for SMS (160 character limit)
    let message = `🔔 ${cue}\n\n`;
    message += `2-min version: ${twoMinVersion}\n`;
    message += `${reward} 💪`;
    
    // Truncate if too long
    if (message.length > 160) {
      message = `🔔 ${cue}\n\nTime for: ${habit.title} 💪`;
    }
    
    return message;
  }

  // Calculate when to send reminder
  calculateReminderTime(habit) {
    const { timeOfDay, reminderMinutesBefore = 15 } = habit.schedule;
    
    // Parse time (format: "14:30")
    const [hours, minutes] = timeOfDay.split(':').map(Number);
    
    // Create date object for next occurrence
    const reminderDate = new Date();
    reminderDate.setHours(hours, minutes, 0, 0);
    
    // Subtract reminder minutes
    reminderDate.setMinutes(reminderDate.getMinutes() - reminderMinutesBefore);
    
    // If time has passed today, set for tomorrow
    if (reminderDate < new Date()) {
      reminderDate.setDate(reminderDate.getDate() + 1);
    }
    
    return reminderDate;
  }

  // Log that a reminder was sent
  async logReminderSent(habitId, familyId, userId, phoneNumber, message) {
    try {
      const logRef = doc(collection(db, 'families', familyId, 'reminderLogs'));
      await setDoc(logRef, {
        habitId,
        userId,
        phoneNumber,
        message,
        sentAt: serverTimestamp(),
        type: 'sms',
        status: 'sent'
      });
    } catch (error) {
      console.error('Error logging reminder:', error);
      // Non-critical, don't throw
    }
  }

  // Get upcoming reminders for a user
  async getUpcomingReminders(userId, familyId) {
    try {
      const remindersQuery = query(
        collection(db, 'families', familyId, this.remindersCollection),
        where('userId', '==', userId),
        where('status', '==', 'scheduled')
      );
      
      const snapshot = await getDocs(remindersQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting upcoming reminders:', error);
      return [];
    }
  }

  // Cancel a scheduled reminder
  async cancelReminder(reminderId, familyId) {
    try {
      const reminderRef = doc(db, 'families', familyId, this.remindersCollection, reminderId);
      await updateDoc(reminderRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error cancelling reminder:', error);
      throw error;
    }
  }

  // Update SMS preferences
  async updateSMSPreferences(userId, familyId, preferences) {
    try {
      const optInRef = doc(db, 'families', familyId, this.smsOptInCollection, userId);
      await updateDoc(optInRef, {
        preferences: {
          ...preferences,
          updatedAt: serverTimestamp()
        }
      });
      return true;
    } catch (error) {
      console.error('Error updating SMS preferences:', error);
      throw error;
    }
  }
}

// Export as singleton
export default new HabitReminderService();