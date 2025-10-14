// src/components/calendar-v2/services/NotificationManager.js

import { NotificationService } from './NotificationService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';

export class NotificationManager {
  constructor() {
    this.notificationService = new NotificationService();
    this.userPreferences = null;
    this.eventListeners = new Map();
  }

  /**
   * Initialize notification manager for a user
   */
  async initialize(userId) {
    if (!userId) return;

    // Load user preferences
    await this.loadUserPreferences(userId);

    // Request permission if preferences are enabled
    if (this.userPreferences?.enabled) {
      await this.notificationService.requestPermission();
    }

    // Set up event listener for viewing events
    window.addEventListener('calendar:viewEvent', this.handleViewEvent);
  }

  /**
   * Load user notification preferences
   */
  async loadUserPreferences(userId) {
    try {
      const docRef = doc(db, 'users', userId, 'preferences', 'notifications');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        this.userPreferences = docSnap.data();
      } else {
        // Default preferences
        this.userPreferences = {
          enabled: true,
          defaultReminders: [15],
          smartReminders: true,
          categories: {
            medical: { enabled: true, reminders: [15, 60, 1440] },
            school: { enabled: true, reminders: [15, 720] },
            activity: { enabled: true, reminders: [15, 30] },
            work: { enabled: true, reminders: [5, 15, 30] },
            personal: { enabled: true, reminders: [15] }
          },
          quietHours: { enabled: false, start: '22:00', end: '08:00' },
          travelTime: { enabled: true, defaultMinutes: 30 },
          followUps: { missed: true, completed: false }
        };
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  }

  /**
   * Schedule notifications for an event
   */
  scheduleEventNotifications(event) {
    if (!this.userPreferences?.enabled) return;

    // Check if event category is enabled
    const categoryPrefs = this.userPreferences.categories[event.category];
    if (!categoryPrefs?.enabled) return;

    // Clear existing notifications for this event
    this.notificationService.cancelEventReminders(event.id);

    if (this.userPreferences.smartReminders) {
      // Use smart reminders
      this.notificationService.scheduleSmartReminders(event);
    } else {
      // Use category-specific reminders
      categoryPrefs.reminders.forEach(minutes => {
        if (!this.isInQuietHours(event.startTime, minutes)) {
          this.notificationService.scheduleReminder(event, minutes);
        }
      });
    }

    // Add travel time reminder if enabled
    if (this.userPreferences.travelTime.enabled && event.location) {
      const travelMinutes = this.calculateTravelTime(event.location);
      const totalMinutes = travelMinutes + 15; // Add buffer
      
      if (!this.isInQuietHours(event.startTime, totalMinutes)) {
        this.notificationService.scheduleReminder(event, totalMinutes);
      }
    }
  }

  /**
   * Check if reminder would fall in quiet hours
   */
  isInQuietHours(eventTime, minutesBefore) {
    if (!this.userPreferences?.quietHours?.enabled) return false;

    const reminderTime = new Date(eventTime);
    reminderTime.setMinutes(reminderTime.getMinutes() - minutesBefore);

    const reminderHour = reminderTime.getHours();
    const startHour = parseInt(this.userPreferences.quietHours.start.split(':')[0]);
    const endHour = parseInt(this.userPreferences.quietHours.end.split(':')[0]);

    if (startHour > endHour) {
      // Quiet hours span midnight
      return reminderHour >= startHour || reminderHour < endHour;
    } else {
      return reminderHour >= startHour && reminderHour < endHour;
    }
  }

  /**
   * Calculate travel time based on location
   */
  calculateTravelTime(location) {
    if (!location) return 0;

    // Use default travel time from preferences
    let travelTime = this.userPreferences?.travelTime?.defaultMinutes || 30;

    // Adjust based on location keywords
    const locationLower = location.toLowerCase();
    if (locationLower.includes('airport')) {
      travelTime = Math.max(travelTime, 90);
    } else if (locationLower.includes('downtown') || locationLower.includes('city')) {
      travelTime = Math.max(travelTime, 45);
    }

    return travelTime;
  }

  /**
   * Handle event updates
   */
  updateEventNotifications(event, previousEvent) {
    if (!this.userPreferences?.enabled) return;

    // Check if relevant fields changed
    const timeChanged = event.startTime !== previousEvent.startTime;
    const locationChanged = event.location !== previousEvent.location;
    const categoryChanged = event.category !== previousEvent.category;

    if (timeChanged || locationChanged || categoryChanged) {
      // Reschedule notifications
      this.scheduleEventNotifications(event);
    }
  }

  /**
   * Handle event deletion
   */
  cancelEventNotifications(eventId) {
    this.notificationService.cancelEventReminders(eventId);
  }

  /**
   * Handle viewing event from notification
   */
  handleViewEvent = (event) => {
    const { eventId } = event.detail;
    // This event can be handled by the calendar component
    console.log('View event requested:', eventId);
  };

  /**
   * Send test notification
   */
  async sendTestNotification() {
    await this.notificationService.showNotification({
      title: 'Test Notification',
      body: 'This is a test of your notification settings.',
      icon: '/logo192.png',
      tag: 'test-notification'
    });
  }

  /**
   * Check for missed events and send follow-ups
   */
  async checkMissedEvents(events) {
    if (!this.userPreferences?.followUps?.missed) return;

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    events.forEach(event => {
      const eventEnd = new Date(event.endTime);
      
      // Check if event ended in the last hour and wasn't marked as completed
      if (eventEnd > oneHourAgo && eventEnd < now && !event.completed) {
        this.notificationService.sendFollowUp(event, 'missed');
      }
    });
  }

  /**
   * Get scheduled reminders
   */
  getScheduledReminders() {
    return this.notificationService.getScheduledReminders();
  }

  /**
   * Clear all notifications
   */
  clearAll() {
    this.notificationService.clearAll();
  }

  /**
   * Clean up
   */
  destroy() {
    window.removeEventListener('calendar:viewEvent', this.handleViewEvent);
    this.clearAll();
  }
}