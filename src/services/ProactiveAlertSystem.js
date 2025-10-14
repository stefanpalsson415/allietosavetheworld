// src/services/ProactiveAlertSystem.js
import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import CalendarService from './CalendarService';
import EventStore from './EventStore';
import ActivityManager from './ActivityManager';
import { format, isSameDay, addDays, isBefore, isAfter, differenceInDays, startOfDay, endOfDay } from 'date-fns';

/**
 * ProactiveAlertSystem service
 * Provides proactive notifications, morning briefings, busy period warnings,
 * and schedule optimization suggestions for families
 */
class ProactiveAlertSystem {
  constructor() {
    this.alertsCollection = collection(db, "proactiveAlerts");
    this.activityManager = ActivityManager;
    
    // Alert types with their priorities (1-5, with 5 being highest)
    this.alertTypes = {
      MORNING_BRIEFING: { priority: 3, id: 'morning_briefing', title: 'Morning Briefing' },
      BUSY_PERIOD: { priority: 4, id: 'busy_period', title: 'Busy Period Ahead' },
      SCHEDULE_CONFLICT: { priority: 5, id: 'schedule_conflict', title: 'Schedule Conflict' },
      SCHEDULE_OPTIMIZATION: { priority: 2, id: 'schedule_optimization', title: 'Schedule Optimization' },
      UPCOMING_EVENT: { priority: 3, id: 'upcoming_event', title: 'Upcoming Event' },
      EQUIPMENT_NEEDED: { priority: 4, id: 'equipment_needed', title: 'Equipment Needed' },
      TRANSPORTATION_NEEDED: { priority: 4, id: 'transportation_needed', title: 'Transportation Needed' },
      WEATHER_IMPACT: { priority: 4, id: 'weather_impact', title: 'Weather Impact' }
    };
  }
  
  /**
   * Creates a new alert
   * @param {string} familyId - The family ID
   * @param {string} alertType - The type of alert (from alertTypes)
   * @param {Object} alertData - Alert data
   * @param {Array} targetMemberIds - Optional IDs of family members to target, or null for whole family
   * @returns {Promise<Object>} Created alert info
   */
  async createAlert(familyId, alertType, alertData, targetMemberIds = null) {
    try {
      // Generate alert ID
      const alertId = uuidv4();
      
      // Get alert type info
      const alertTypeInfo = this.alertTypes[alertType];
      if (!alertTypeInfo) {
        throw new Error(`Invalid alert type: ${alertType}`);
      }
      
      // Prepare expiration time (defaults to 24 hours if not specified)
      const expiration = alertData.expiration 
        ? new Date(alertData.expiration) 
        : addDays(new Date(), 1);
        
      // Prepare alert document
      const alert = {
        id: alertId,
        familyId,
        createdAt: serverTimestamp(),
        alertType,
        title: alertData.title || alertTypeInfo.title,
        message: alertData.message || '',
        priority: alertData.priority || alertTypeInfo.priority,
        expiration: Timestamp.fromDate(expiration),
        targetMemberIds: targetMemberIds || [],
        wholeFamily: targetMemberIds === null,
        isDismissed: false,
        isActionTaken: false,
        actionType: alertData.actionType || null,
        actionData: alertData.actionData || null,
        relatedEvents: alertData.relatedEvents || [],
        additionalData: alertData.additionalData || {}
      };
      
      // Save the alert document
      await setDoc(doc(this.alertsCollection, alertId), alert);
      
      return {
        success: true,
        alertId,
        alert
      };
    } catch (error) {
      console.error("Error creating alert:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Get active alerts for a family member
   * @param {string} familyId - The family ID
   * @param {string} memberId - The family member ID
   * @param {boolean} includeRead - Include read alerts (default false)
   * @returns {Promise<Array>} Active alerts
   */
  async getAlertsForMember(familyId, memberId, includeRead = false) {
    try {
      const now = new Date();
      const alerts = [];
      
      // Query alerts specific to this member or whole family
      const alertsQuery = query(
        this.alertsCollection,
        where("familyId", "==", familyId),
        where("expiration", ">", Timestamp.fromDate(now)),
        orderBy("expiration", "asc")
      );
      
      const querySnapshot = await getDocs(alertsQuery);
      
      querySnapshot.forEach(doc => {
        const alert = doc.data();
        
        // Include the alert if:
        // 1. It's for the whole family OR it targets this specific member
        // 2. It hasn't been dismissed OR includeRead is true
        if ((alert.wholeFamily || alert.targetMemberIds.includes(memberId)) &&
            (!alert.isDismissed || includeRead)) {
          alerts.push(alert);
        }
      });
      
      // Sort by priority (higher first) and then by creation time
      return alerts.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Higher priority first
        }
        
        // If same priority, sort by creation time (newer first)
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime - aTime;
      });
    } catch (error) {
      console.error("Error getting alerts:", error);
      return [];
    }
  }
  
  /**
   * Dismiss an alert
   * @param {string} alertId - The alert ID
   * @returns {Promise<Object>} Result of dismissal
   */
  async dismissAlert(alertId) {
    try {
      await updateDoc(doc(this.alertsCollection, alertId), {
        isDismissed: true
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error dismissing alert:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Take action on an alert
   * @param {string} alertId - The alert ID
   * @param {string} actionType - Type of action taken
   * @param {Object} actionData - Data about the action
   * @returns {Promise<Object>} Result of action
   */
  async takeActionOnAlert(alertId, actionType, actionData = {}) {
    try {
      await updateDoc(doc(this.alertsCollection, alertId), {
        isActionTaken: true,
        actionType,
        actionData,
        isDismissed: true
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error taking action on alert:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Generate morning briefing for a family
   * @param {string} familyId - The family ID
   * @returns {Promise<Object>} Generated briefing result
   */
  async generateMorningBriefing(familyId) {
    try {
      const today = new Date();
      const tomorrow = addDays(today, 1);
      
      // Get today's events
      const todayEvents = await this.getEventsForDay(familyId, today);
      
      // Get tomorrow's events
      const tomorrowEvents = await this.getEventsForDay(familyId, tomorrow);
      
      // Get special requirements for today
      const specialRequirements = await this.getSpecialRequirementsForDay(familyId, today);
      
      // Get transportation needs for today
      const transportationNeeds = await this.getTransportationNeedsForDay(familyId, today);
      
      // Get equipment needs for today
      const equipmentNeeds = await this.getEquipmentNeedsForDay(familyId, today);
      
      // Check for schedule conflicts
      const scheduleConflicts = await this.checkScheduleConflictsForDay(familyId, today);
      
      // Build briefing message
      let briefingTitle = `Morning Briefing: ${format(today, 'EEEE, MMMM d')}`;
      
      let briefingMessage = "Here's what's happening today:\n\n";
      
      if (todayEvents.length === 0) {
        briefingMessage += "• No events scheduled for today\n\n";
      } else {
        briefingMessage += `• ${todayEvents.length} event${todayEvents.length !== 1 ? 's' : ''} today\n`;
        
        for (const event of todayEvents) {
          const eventTime = event.startTime || 'All day';
          briefingMessage += `  - ${event.title} (${eventTime})${event.location ? ' at ' + event.location : ''}\n`;
        }
        briefingMessage += "\n";
      }
      
      if (specialRequirements.length > 0) {
        briefingMessage += "**Special Requirements:**\n";
        for (const req of specialRequirements) {
          briefingMessage += `• ${req.childName}: ${req.description} (${req.eventName})\n`;
        }
        briefingMessage += "\n";
      }
      
      if (transportationNeeds.length > 0) {
        briefingMessage += "**Transportation Today:**\n";
        for (const need of transportationNeeds) {
          const timeStr = need.time || '';
          briefingMessage += `• ${need.type} for ${need.childName} ${timeStr ? 'at ' + timeStr : ''} - ${need.location || need.eventName}\n`;
        }
        briefingMessage += "\n";
      }
      
      if (equipmentNeeds.length > 0) {
        briefingMessage += "**Equipment Needed Today:**\n";
        for (const need of equipmentNeeds) {
          briefingMessage += `• ${need.childName}: ${need.name} for ${need.activityName}\n`;
        }
        briefingMessage += "\n";
      }
      
      if (scheduleConflicts.length > 0) {
        briefingMessage += "**⚠️ Schedule Conflicts Today:**\n";
        for (const conflict of scheduleConflicts) {
          briefingMessage += `• ${conflict.childName}: ${conflict.event1} and ${conflict.event2} overlap\n`;
        }
        briefingMessage += "\n";
      }
      
      // Add tomorrow preview
      briefingMessage += `**Tomorrow (${format(tomorrow, 'EEEE')}):**\n`;
      if (tomorrowEvents.length === 0) {
        briefingMessage += "• No events scheduled\n";
      } else {
        for (const event of tomorrowEvents.slice(0, 3)) {
          const eventTime = event.startTime || 'All day';
          briefingMessage += `• ${event.title} (${eventTime})\n`;
        }
        
        if (tomorrowEvents.length > 3) {
          briefingMessage += `• And ${tomorrowEvents.length - 3} more event${tomorrowEvents.length - 3 !== 1 ? 's' : ''}\n`;
        }
      }
      
      // Create the alert for all family members
      const alertData = {
        title: briefingTitle,
        message: briefingMessage,
        expiration: addDays(today, 1), // Expires tomorrow
        relatedEvents: [...todayEvents.map(e => e.id), ...tomorrowEvents.map(e => e.id)],
        additionalData: {
          todayEvents,
          tomorrowEvents,
          specialRequirements,
          transportationNeeds,
          equipmentNeeds,
          scheduleConflicts,
          generateDate: today.toISOString()
        }
      };
      
      // Create the morning briefing alert
      const result = await this.createAlert(
        familyId,
        'MORNING_BRIEFING',
        alertData
      );
      
      return result;
    } catch (error) {
      console.error("Error generating morning briefing:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Get events for a specific day
   * @param {string} familyId - The family ID
   * @param {Date} date - The date to get events for
   * @returns {Promise<Array>} Events for the day
   */
  async getEventsForDay(familyId, date) {
    try {
      // Get start and end of day
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      // Get events from EventStore
      const events = await EventStore.getEvents(familyId, dayStart, dayEnd);
      
      // Process events into simpler format for the briefing
      return events.map(event => ({
        id: event.id,
        title: event.title,
        startTime: event.startTime || null,
        endTime: event.endTime || null,
        location: event.location || null,
        type: event.type || 'event',
        participantIds: event.participantIds || [],
        participantNames: event.participantNames || []
      }));
    } catch (error) {
      console.error("Error getting events for day:", error);
      return [];
    }
  }
  
  /**
   * Get special requirements for a specific day
   * @param {string} familyId - The family ID
   * @param {Date} date - The date to get requirements for
   * @returns {Promise<Array>} Special requirements for the day
   */
  async getSpecialRequirementsForDay(familyId, date) {
    // This is a placeholder that would connect to a real service
    // that tracks special requirements like gym clothes, instruments, etc.
    return [];
  }
  
  /**
   * Get transportation needs for a specific day
   * @param {string} familyId - The family ID
   * @param {Date} date - The date to get transportation for
   * @returns {Promise<Array>} Transportation needs for the day
   */
  async getTransportationNeedsForDay(familyId, date) {
    try {
      // Get transportation from ActivityManager
      const transportation = await this.activityManager.getTransportationNeeds(
        familyId,
        date,
        date
      );
      
      // Process and simplify for the briefing
      return transportation.map(item => ({
        id: item.id,
        type: item.type,
        time: item.time,
        childName: item.participantName,
        eventName: item.activityName,
        location: item.location,
        assignedTo: item.assignedTo,
        assignedToName: item.assignedToName,
        status: item.status
      }));
    } catch (error) {
      console.error("Error getting transportation for day:", error);
      return [];
    }
  }
  
  /**
   * Get equipment needs for a specific day
   * @param {string} familyId - The family ID
   * @param {Date} date - The date to get equipment for
   * @returns {Promise<Array>} Equipment needs for the day
   */
  async getEquipmentNeedsForDay(familyId, date) {
    try {
      // Get equipment needs from ActivityManager
      const equipmentNeeds = await this.activityManager.getEquipmentNeeds(familyId);
      
      // Get activities for the day to filter equipment by relevant activities
      const activitiesForDay = await this.getActivitiesForDay(familyId, date);
      const activityIds = activitiesForDay.map(a => a.id);
      
      // Filter equipment to only those needed for today's activities
      const relevantEquipment = equipmentNeeds.filter(item => 
        activityIds.includes(item.activityId) && item.status === 'needed'
      );
      
      return relevantEquipment;
    } catch (error) {
      console.error("Error getting equipment for day:", error);
      return [];
    }
  }
  
  /**
   * Get activities for a specific day
   * @param {string} familyId - The family ID
   * @param {Date} date - The date to get activities for
   * @returns {Promise<Array>} Activities for the day
   */
  async getActivitiesForDay(familyId, date) {
    try {
      // This is a simplified implementation
      // In a real implementation, you would query activities based on their schedule
      return [];
    } catch (error) {
      console.error("Error getting activities for day:", error);
      return [];
    }
  }
  
  /**
   * Check for schedule conflicts on a specific day
   * @param {string} familyId - The family ID
   * @param {Date} date - The date to check for conflicts
   * @returns {Promise<Array>} Schedule conflicts for the day
   */
  async checkScheduleConflictsForDay(familyId, date) {
    try {
      // This is a placeholder that would connect to a real service
      // that checks for schedule conflicts
      return [];
    } catch (error) {
      console.error("Error checking schedule conflicts:", error);
      return [];
    }
  }
  
  /**
   * Detect busy periods for a family
   * @param {string} familyId - The family ID
   * @param {number} daysToAnalyze - Number of days to look ahead
   * @param {number} eventsThreshold - Number of events per day to consider "busy"
   * @returns {Promise<Array>} Detected busy periods
   */
  async detectBusyPeriods(familyId, daysToAnalyze = 14, eventsThreshold = 3) {
    try {
      const busyPeriods = [];
      const startDate = new Date();
      
      // Analyze each day in the range
      for (let i = 0; i < daysToAnalyze; i++) {
        const currentDate = addDays(startDate, i);
        
        // Get events for this day
        const eventsForDay = await this.getEventsForDay(familyId, currentDate);
        
        // If number of events exceeds threshold, consider it a busy day
        if (eventsForDay.length >= eventsThreshold) {
          // Check if we should extend an existing busy period
          const lastPeriod = busyPeriods.length > 0 ? busyPeriods[busyPeriods.length - 1] : null;
          
          if (lastPeriod && differenceInDays(currentDate, lastPeriod.endDate) <= 1) {
            // Extend the existing period
            lastPeriod.endDate = currentDate;
            lastPeriod.days += 1;
            lastPeriod.events = [...lastPeriod.events, ...eventsForDay];
          } else {
            // Start a new busy period
            busyPeriods.push({
              startDate: currentDate,
              endDate: currentDate,
              days: 1,
              events: eventsForDay
            });
          }
        }
      }
      
      // For busy periods, create alerts
      for (const period of busyPeriods) {
        if (period.days >= 2) { // Only alert for periods of 2+ days
          const startDateStr = format(period.startDate, 'EEEE, MMMM d');
          const endDateStr = format(period.endDate, 'EEEE, MMMM d');
          
          const alertData = {
            title: 'Busy Period Coming Up',
            message: `You have a busy period from ${startDateStr} to ${endDateStr} with ${period.events.length} events scheduled.`,
            expiration: period.endDate,
            relatedEvents: period.events.map(e => e.id),
            additionalData: {
              busyPeriod: period,
              generateDate: new Date().toISOString()
            }
          };
          
          // Create the busy period alert
          await this.createAlert(
            familyId,
            'BUSY_PERIOD',
            alertData
          );
        }
      }
      
      return busyPeriods;
    } catch (error) {
      console.error("Error detecting busy periods:", error);
      return [];
    }
  }
  
  /**
   * Generate schedule optimization suggestions
   * @param {string} familyId - The family ID
   * @returns {Promise<Array>} Optimization suggestions
   */
  async generateOptimizationSuggestions(familyId) {
    try {
      // This is a placeholder that would implement more sophisticated
      // schedule optimization algorithms in a real service
      return [];
    } catch (error) {
      console.error("Error generating optimization suggestions:", error);
      return [];
    }
  }
  
  /**
   * Delete expired alerts
   * @param {string} familyId - The family ID (optional, cleans all families if not provided)
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupExpiredAlerts(familyId = null) {
    try {
      const now = new Date();
      let alertsQuery;
      
      if (familyId) {
        // Clean alerts for specific family
        alertsQuery = query(
          this.alertsCollection,
          where("familyId", "==", familyId),
          where("expiration", "<", Timestamp.fromDate(now))
        );
      } else {
        // Clean alerts for all families
        alertsQuery = query(
          this.alertsCollection,
          where("expiration", "<", Timestamp.fromDate(now))
        );
      }
      
      const querySnapshot = await getDocs(alertsQuery);
      let count = 0;
      
      // Delete each expired alert
      const deletePromises = [];
      querySnapshot.forEach(document => {
        deletePromises.push(deleteDoc(doc(this.alertsCollection, document.id)));
        count++;
      });
      
      await Promise.all(deletePromises);
      
      return { success: true, count };
    } catch (error) {
      console.error("Error cleaning up expired alerts:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
}

// Helper function to generate test alerts for demonstration
ProactiveAlertSystem.prototype.generateTestAlerts = async function(familyId, memberId) {
  try {
    const now = new Date();
    const alerts = [];
    
    // 1. Create a morning briefing
    const briefingAlert = await this.createAlert(
      familyId,
      'MORNING_BRIEFING',
      {
        title: `Morning Briefing: ${now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`,
        message: "Here's what's happening today:\n\n• 3 events today\n  - School pickup (3:00 PM)\n  - Soccer practice (4:30 PM) at Memorial Park\n  - Dinner with grandparents (6:30 PM)\n\n**Special Requirements:**\n• Sophie: Soccer uniform and cleats (Soccer practice)\n\n**Transportation Today:**\n• Pickup for Sophie at 3:00 PM - Lincoln Elementary\n• Dropoff for Sophie at 4:30 PM - Memorial Park\n\n**Tomorrow (Tuesday):**\n• Doctor appointment (10:30 AM)\n• Piano lesson (4:00 PM)",
        expiration: addDays(now, 1),
        relatedEvents: ['event1', 'event2', 'event3'],
        additionalData: {
          todayEvents: [
            { id: 'event1', title: 'School pickup', startTime: '3:00 PM', location: 'Lincoln Elementary' },
            { id: 'event2', title: 'Soccer practice', startTime: '4:30 PM', location: 'Memorial Park' },
            { id: 'event3', title: 'Dinner with grandparents', startTime: '6:30 PM', location: null }
          ],
          tomorrowEvents: [
            { id: 'event4', title: 'Doctor appointment', startTime: '10:30 AM', location: 'Pediatric Center' },
            { id: 'event5', title: 'Piano lesson', startTime: '4:00 PM', location: 'Music School' }
          ]
        }
      },
      [memberId]
    );
    alerts.push(briefingAlert);
    
    // 2. Create a busy period alert
    const busyPeriodAlert = await this.createAlert(
      familyId,
      'BUSY_PERIOD',
      {
        title: 'Busy Weekend Ahead',
        message: 'You have a busy weekend coming up with 7 events scheduled from Friday to Sunday. Would you like to see a schedule optimization?',
        priority: 4,
        expiration: addDays(now, 3),
        relatedEvents: ['event6', 'event7', 'event8', 'event9', 'event10', 'event11', 'event12'],
        additionalData: {
          busyPeriod: {
            startDate: addDays(now, 3),
            endDate: addDays(now, 5),
            days: 3,
            events: [
              { id: 'event6', title: 'School play', startTime: '7:00 PM' },
              { id: 'event7', title: 'Soccer game', startTime: '10:00 AM' },
              { id: 'event8', title: 'Birthday party', startTime: '1:00 PM' },
              { id: 'event9', title: 'Family lunch', startTime: '12:00 PM' },
              { id: 'event10', title: 'Music recital', startTime: '4:00 PM' },
              { id: 'event11', title: 'Church', startTime: '9:00 AM' },
              { id: 'event12', title: 'Sunday dinner', startTime: '6:00 PM' }
            ]
          }
        }
      },
      [memberId]
    );
    alerts.push(busyPeriodAlert);
    
    // 3. Create an equipment needed alert
    const equipmentAlert = await this.createAlert(
      familyId,
      'EQUIPMENT_NEEDED',
      {
        title: 'Soccer Uniform Needed Tomorrow',
        message: 'Sophie needs her soccer uniform, cleats, and shin guards for practice tomorrow at 4:30 PM.',
        priority: 3,
        expiration: addDays(now, 1),
        relatedEvents: ['event13'],
        additionalData: {
          equipment: [
            { name: 'Soccer uniform', status: 'needed' },
            { name: 'Cleats', status: 'needed' },
            { name: 'Shin guards', status: 'needed' }
          ],
          childName: 'Sophie',
          activityName: 'Soccer practice'
        }
      },
      [memberId]
    );
    alerts.push(equipmentAlert);
    
    // 4. Create a schedule conflict alert
    const conflictAlert = await this.createAlert(
      familyId,
      'SCHEDULE_CONFLICT',
      {
        title: 'Schedule Conflict Detected',
        message: 'There is a scheduling conflict: Sophie\'s dance recital overlaps with Tyler\'s baseball game on Saturday at 2:00 PM.',
        priority: 5,
        expiration: addDays(now, 2),
        relatedEvents: ['event14', 'event15'],
        additionalData: {
          conflicts: [
            {
              childName: 'Sophie',
              event1: 'Dance recital',
              event1Id: 'event14',
              event1Time: '2:00 PM - 3:30 PM',
              event2: 'Baseball game',
              event2Id: 'event15',
              event2Time: '1:30 PM - 3:00 PM'
            }
          ]
        }
      },
      [memberId]
    );
    alerts.push(conflictAlert);
    
    return {
      success: true,
      alerts: alerts.filter(a => a.success).map(a => a.alertId),
      count: alerts.filter(a => a.success).length
    };
  } catch (error) {
    console.error("Error generating test alerts:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
};

export default new ProactiveAlertSystem();