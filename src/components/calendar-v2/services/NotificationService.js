// src/components/calendar-v2/services/NotificationService.js

export class NotificationService {
  constructor() {
    // Check if Notification API exists before accessing it
    this.permission = (typeof Notification !== 'undefined' && Notification?.permission) || 'default';
    this.activeNotifications = new Map();
    this.scheduledReminders = new Map();
  }

  /**
   * Request notification permission
   */
  async requestPermission() {
    // Check if Notification API exists
    if (typeof Notification === 'undefined' || !('Notification' in window)) {
      console.warn('Notifications not supported in this browser');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  /**
   * Schedule a reminder for an event
   */
  scheduleReminder(event, reminderMinutes = 15) {
    const reminderId = `${event.id}-${reminderMinutes}`;
    
    // Clear existing reminder if any
    this.cancelReminder(reminderId);

    const eventTime = new Date(event.startTime);
    const reminderTime = new Date(eventTime.getTime() - reminderMinutes * 60 * 1000);
    const now = new Date();

    if (reminderTime <= now) {
      // Reminder time has passed
      return;
    }

    const timeout = reminderTime.getTime() - now.getTime();

    const timeoutId = setTimeout(() => {
      this.showNotification({
        title: `Upcoming: ${event.title}`,
        body: this.formatReminderBody(event, reminderMinutes),
        icon: '/logo192.png',
        tag: reminderId,
        data: { eventId: event.id, type: 'reminder' },
        requireInteraction: reminderMinutes <= 5,
        actions: [
          { action: 'view', title: 'View Event' },
          { action: 'snooze', title: 'Snooze 5 min' }
        ]
      });

      // Remove from scheduled
      this.scheduledReminders.delete(reminderId);
    }, timeout);

    this.scheduledReminders.set(reminderId, {
      timeoutId,
      event,
      reminderTime,
      reminderMinutes
    });
  }

  /**
   * Format reminder body based on event details
   */
  formatReminderBody(event, reminderMinutes) {
    const time = new Date(event.startTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });

    let body = `Starts at ${time}`;

    if (reminderMinutes === 0) {
      body = `Starting now!`;
    } else if (reminderMinutes < 60) {
      body = `In ${reminderMinutes} minutes at ${time}`;
    } else {
      const hours = Math.floor(reminderMinutes / 60);
      body = `In ${hours} hour${hours > 1 ? 's' : ''} at ${time}`;
    }

    if (event.location) {
      body += `\n📍 ${event.location}`;
    }

    if (event.attendees?.length > 0) {
      body += `\n👥 ${event.attendees.length} attendees`;
    }

    return body;
  }

  /**
   * Show a notification
   */
  async showNotification(options) {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return null;

    // Check if Notification API exists
    if (typeof Notification === 'undefined') {
      console.log('Notification API not available');
      return null;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon,
        badge: '/logo192.png',
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        actions: options.actions || []
      });

      // Store active notification
      if (options.tag) {
        this.activeNotifications.set(options.tag, notification);
      }

      // Handle notification events
      notification.onclick = (event) => {
        event.preventDefault();
        this.handleNotificationClick(options.data);
        notification.close();
      };

      notification.onclose = () => {
        if (options.tag) {
          this.activeNotifications.delete(options.tag);
        }
      };

      return notification;
    } catch (error) {
      console.error('Failed to show notification:', error);
      // Fallback to in-app notification
      this.showInAppNotification(options);
      return null;
    }
  }

  /**
   * Handle notification click
   */
  handleNotificationClick(data) {
    if (data?.eventId) {
      // Navigate to event or open event modal
      window.focus();
      // Dispatch custom event that the app can listen to
      window.dispatchEvent(new CustomEvent('calendar:viewEvent', {
        detail: { eventId: data.eventId }
      }));
    }
  }

  /**
   * Show in-app notification (fallback)
   */
  showInAppNotification(options) {
    // Dispatch custom event for in-app notification system
    window.dispatchEvent(new CustomEvent('calendar:notification', {
      detail: {
        title: options.title,
        body: options.body,
        type: options.data?.type || 'info',
        eventId: options.data?.eventId
      }
    }));
  }

  /**
   * Cancel a scheduled reminder
   */
  cancelReminder(reminderId) {
    const reminder = this.scheduledReminders.get(reminderId);
    if (reminder) {
      clearTimeout(reminder.timeoutId);
      this.scheduledReminders.delete(reminderId);
    }
  }

  /**
   * Cancel all reminders for an event
   */
  cancelEventReminders(eventId) {
    for (const [reminderId, reminder] of this.scheduledReminders) {
      if (reminder.event.id === eventId) {
        this.cancelReminder(reminderId);
      }
    }
  }

  /**
   * Schedule smart reminders based on event type
   */
  scheduleSmartReminders(event) {
    const reminderTimes = this.getSmartReminderTimes(event);
    
    reminderTimes.forEach(minutes => {
      this.scheduleReminder(event, minutes);
    });
  }

  /**
   * Get smart reminder times based on event characteristics
   */
  getSmartReminderTimes(event) {
    const reminders = [];

    // Base reminder - 15 minutes before
    reminders.push(15);

    // Category-specific reminders
    switch (event.category) {
      case 'medical':
        // Medical appointments need more prep time
        reminders.push(60); // 1 hour before
        reminders.push(24 * 60); // 1 day before
        break;
      
      case 'school':
        // School events might need prep the night before
        reminders.push(12 * 60); // 12 hours before
        break;
      
      case 'activity':
        // Activities might need gear preparation
        reminders.push(30); // 30 minutes before
        break;
      
      case 'work':
        // Work meetings might need document review
        reminders.push(5); // 5 minutes before
        reminders.push(30); // 30 minutes before
        break;
    }

    // Location-based reminders
    if (event.location && this.requiresTravel(event.location)) {
      const travelTime = this.estimateTravelTime(event.location);
      reminders.push(travelTime + 15); // Travel time + buffer
    }

    // Time-based reminders
    const eventHour = new Date(event.startTime).getHours();
    if (eventHour < 9) {
      // Early morning events - remind the night before
      const hoursUntil = this.hoursUntilEvent(event.startTime);
      if (hoursUntil > 12) {
        reminders.push(12 * 60); // Night before
      }
    }

    // Remove duplicates and sort
    return [...new Set(reminders)].sort((a, b) => b - a);
  }

  /**
   * Check if location requires travel
   */
  requiresTravel(location) {
    const travelKeywords = ['drive', 'miles', 'km', 'airport', 'station'];
    return travelKeywords.some(keyword => 
      location.toLowerCase().includes(keyword)
    );
  }

  /**
   * Estimate travel time based on location
   */
  estimateTravelTime(location) {
    // Simple estimation - could be enhanced with maps API
    if (location.toLowerCase().includes('airport')) return 90;
    if (location.toLowerCase().includes('downtown')) return 45;
    if (location.toLowerCase().includes('drive')) return 30;
    return 20; // Default travel time
  }

  /**
   * Calculate hours until event
   */
  hoursUntilEvent(eventTime) {
    const now = new Date();
    const event = new Date(eventTime);
    return (event - now) / (1000 * 60 * 60);
  }

  /**
   * Get all scheduled reminders
   */
  getScheduledReminders() {
    const reminders = [];
    for (const [id, reminder] of this.scheduledReminders) {
      reminders.push({
        id,
        eventId: reminder.event.id,
        eventTitle: reminder.event.title,
        reminderTime: reminder.reminderTime,
        reminderMinutes: reminder.reminderMinutes
      });
    }
    return reminders.sort((a, b) => a.reminderTime - b.reminderTime);
  }

  /**
   * Clear all notifications and reminders
   */
  clearAll() {
    // Clear scheduled reminders
    for (const [reminderId] of this.scheduledReminders) {
      this.cancelReminder(reminderId);
    }

    // Close active notifications
    for (const [tag, notification] of this.activeNotifications) {
      notification.close();
    }
  }

  /**
   * Send follow-up notification
   */
  async sendFollowUp(event, type) {
    const followUpMessages = {
      'missed': {
        title: `Missed: ${event.title}`,
        body: 'Would you like to reschedule this event?'
      },
      'completed': {
        title: `Completed: ${event.title}`,
        body: 'Great job! Any notes to add?'
      },
      'reminder': {
        title: `Don't forget: ${event.title}`,
        body: 'This event is coming up soon!'
      }
    };

    const message = followUpMessages[type];
    if (message) {
      await this.showNotification({
        ...message,
        tag: `${event.id}-followup`,
        data: { eventId: event.id, type: 'followup', followUpType: type }
      });
    }
  }
}