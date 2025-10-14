// src/services/ActivityManager.js
import { db, firebase } from './firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  deleteDoc, query, where, serverTimestamp, arrayUnion, arrayRemove,
  Timestamp, orderBy, limit 
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import CalendarService from './CalendarService';
import ChildTrackingService from './ChildTrackingService';

/**
 * ActivityManager service
 * Manages extracurricular activities with features like equipment tracking,
 * transportation coordination, skill development, and schedule management
 */
class ActivityManager {
  constructor() {
    this.activitiesCollection = collection(db, "activities");
    this.equipmentCollection = collection(db, "equipment");
    this.transportationCollection = collection(db, "transportation");
    this.skillsCollection = collection(db, "skills");
    this.scheduleCollection = collection(db, "activitySchedules");
  }
  
  /**
   * Get activities for a family with optional filters
   * @param {string} familyId - The family ID
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} List of activities
   */
  static async getActivitiesForFamily(familyId, options = {}) {
    try {
      // Mock data for development
      return Promise.resolve([
        {
          id: '1',
          name: 'Soccer Practice',
          participantName: 'Jamie',
          participantId: 'child1',
          type: 'sports',
          organizationName: 'City Youth Soccer',
          isRecurring: true,
          startDate: { toDate: () => new Date() },
          status: 'active',
          location: 'Memorial Field',
          schedule: [
            { day: 1, startTime: '15:30', endTime: '17:00' },
            { day: 3, startTime: '15:30', endTime: '17:00' }
          ],
          equipment: [
            { id: 'eq1', name: 'Soccer Cleats', status: 'needed', type: 'uniform' },
            { id: 'eq2', name: 'Shin Guards', status: 'owned', type: 'equipment' }
          ],
          requiresEquipment: true,
          transportationArrangements: [
            { id: 'tr1', day: 1, type: 'dropoff', assignedToName: 'Dad' },
            { id: 'tr2', day: 1, type: 'pickup', assignedToName: 'Mom' },
            { id: 'tr3', day: 3, type: 'carpool', assignedToName: 'Smith Family' }
          ],
          requiresTransportation: true
        },
        {
          id: '2',
          name: 'Piano Lessons',
          participantName: 'Alex',
          participantId: 'child2',
          type: 'music',
          organizationName: 'Smith Music Academy',
          isRecurring: true,
          startDate: { toDate: () => new Date() },
          status: 'active',
          location: '123 Main St',
          schedule: [
            { day: 2, startTime: '16:00', endTime: '17:00' }
          ],
          equipment: [
            { id: 'eq3', name: 'Practice Book', status: 'needed', type: 'supplies' }
          ],
          requiresEquipment: true,
          transportationArrangements: [
            { id: 'tr4', day: 2, type: 'dropoff', assignedToName: 'Mom' },
            { id: 'tr5', day: 2, type: 'pickup', assignedToName: 'Dad' }
          ],
          requiresTransportation: true
        },
        {
          id: '3',
          name: 'Swimming',
          participantName: 'Jamie',
          participantId: 'child1',
          type: 'sports',
          organizationName: 'City Pool',
          isRecurring: true,
          startDate: { toDate: () => new Date() },
          status: 'active',
          location: 'Community Pool',
          schedule: [
            { day: 4, startTime: '16:30', endTime: '18:00' }
          ],
          equipment: [
            { id: 'eq4', name: 'Swimsuit', status: 'owned', type: 'uniform' },
            { id: 'eq5', name: 'Goggles', status: 'needed', type: 'equipment' },
            { id: 'eq6', name: 'Swim Cap', status: 'owned', type: 'equipment' }
          ],
          requiresEquipment: true,
          transportationArrangements: [
            { id: 'tr6', day: 4, type: 'dropoff', assignedToName: 'Dad' },
            { id: 'tr7', day: 4, type: 'pickup', assignedToName: 'Dad' }
          ],
          requiresTransportation: true
        }
      ]);
    } catch (error) {
      console.error('Error getting activities:', error);
      return [];
    }
  }
  
  /**
   * Get equipment needs for a family's activities
   * @param {string} familyId - The family ID
   * @returns {Promise<Array>} List of equipment needs
   */
  static async getEquipmentNeeds(familyId) {
    try {
      // Mock data for development
      return Promise.resolve([
        { id: 'eq1', name: 'Soccer Cleats', status: 'needed', activityName: 'Soccer Practice', type: 'uniform', childName: 'Jamie' },
        { id: 'eq3', name: 'Practice Book', status: 'needed', activityName: 'Piano Lessons', type: 'supplies', childName: 'Alex' },
        { id: 'eq5', name: 'Goggles', status: 'needed', activityName: 'Swimming', type: 'equipment', childName: 'Jamie' }
      ]);
    } catch (error) {
      console.error('Error getting equipment needs:', error);
      return [];
    }
  }
  
  /**
   * Get transportation arrangements for a family's activities
   * @param {string} familyId - The family ID
   * @returns {Promise<Array>} List of transportation arrangements
   */
  static async getTransportationArrangements(familyId) {
    try {
      // Mock data for development
      return Promise.resolve([
        { id: 'tr1', day: 1, type: 'dropoff', assignedToName: 'Dad', activityName: 'Soccer Practice', childName: 'Jamie', time: '15:15' },
        { id: 'tr2', day: 1, type: 'pickup', assignedToName: 'Mom', activityName: 'Soccer Practice', childName: 'Jamie', time: '17:00' },
        { id: 'tr3', day: 3, type: 'carpool', assignedToName: 'Smith Family', activityName: 'Soccer Practice', childName: 'Jamie', time: '15:15' },
        { id: 'tr4', day: 2, type: 'dropoff', assignedToName: 'Mom', activityName: 'Piano Lessons', childName: 'Alex', time: '15:45' },
        { id: 'tr5', day: 2, type: 'pickup', assignedToName: 'Dad', activityName: 'Piano Lessons', childName: 'Alex', time: '17:00' },
        { id: 'tr6', day: 4, type: 'dropoff', assignedToName: 'Dad', activityName: 'Swimming', childName: 'Jamie', time: '16:15' },
        { id: 'tr7', day: 4, type: 'pickup', assignedToName: 'Dad', activityName: 'Swimming', childName: 'Jamie', time: '18:00' }
      ]);
    } catch (error) {
      console.error('Error getting transportation arrangements:', error);
      return [];
    }
  }
  
  /**
   * Get schedule conflicts for a family's activities
   * @param {string} familyId - The family ID
   * @returns {Promise<Array>} List of schedule conflicts
   */
  static async getScheduleConflicts(familyId) {
    try {
      // Mock data for development - empty for now to avoid showing conflicts
      return Promise.resolve([]);
    } catch (error) {
      console.error('Error getting schedule conflicts:', error);
      return [];
    }
  }
  
  /**
   * Create a new activity
   * @param {string} familyId - The family ID
   * @param {string} userId - The user ID
   * @param {Object} activityData - Activity data
   * @returns {Promise<Object>} Created activity info
   */
  async createActivity(familyId, userId, activityData) {
    try {
      // Generate activity ID
      const activityId = uuidv4();
      
      // Default start date if not provided
      const startDate = activityData.startDate 
        ? new Date(activityData.startDate) 
        : new Date();
      
      // Default end date if not provided
      const endDate = activityData.endDate 
        ? new Date(activityData.endDate) 
        : null;
      
      // Prepare activity document
      const activity = {
        id: activityId,
        familyId,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // Basic activity info
        name: activityData.name || 'New Activity',
        type: activityData.type || 'sport', // sport, music, art, club, class, camp, other
        description: activityData.description || '',
        startDate: Timestamp.fromDate(startDate),
        endDate: endDate ? Timestamp.fromDate(endDate) : null,
        isRecurring: activityData.isRecurring !== false,
        isActive: activityData.isActive !== false,
        
        // Location info
        location: activityData.location || '',
        address: activityData.address || '',
        coordinate: activityData.coordinate || null,
        
        // Organization info
        organizationName: activityData.organizationName || '',
        instructorName: activityData.instructorName || '',
        contactInfo: activityData.contactInfo || {
          phone: '',
          email: '',
          website: ''
        },
        
        // Participant info
        participantId: activityData.participantId || null,
        participantName: activityData.participantName || '',
        ageGroup: activityData.ageGroup || '',
        group: activityData.group || '',
        teamName: activityData.teamName || '',
        
        // Schedule info (for recurring activities)
        schedule: activityData.schedule || [],
        
        // Equipment needs
        requiresEquipment: activityData.requiresEquipment || false,
        equipment: activityData.equipment || [],
        
        // Transportation needs
        requiresTransportation: activityData.requiresTransportation || false,
        transportationArrangements: activityData.transportationArrangements || [],
        
        // Skills and development
        skillsTracking: activityData.skillsTracking || {
          enabled: false,
          skills: []
        },
        
        // Related records
        relatedEvents: [],
        
        // Cost and payments
        cost: activityData.cost || {
          registrationFee: 0,
          recurringFee: 0,
          frequency: 'one-time', // one-time, monthly, quarterly, yearly
          equipmentCost: 0,
          additionalCosts: []
        },
        
        // Tags and notes
        tags: activityData.tags || [],
        notes: activityData.notes || '',
        
        // Notification preferences
        reminderSettings: activityData.reminderSettings || {
          enabled: true,
          scheduleReminders: true,
          equipmentReminders: true,
          transportationReminders: true
        }
      };
      
      // Process schedule if provided
      if (activityData.schedule && activityData.schedule.length > 0) {
        activity.schedule = activityData.schedule.map(session => ({
          id: session.id || uuidv4(),
          day: session.day !== undefined ? session.day : null, // 0-6 (Sunday to Saturday)
          startTime: session.startTime || '',
          endTime: session.endTime || '',
          location: session.location || activity.location,
          notes: session.notes || '',
          calendarEventId: null
        }));
      } else if (activityData.isRecurring) {
        // Create default schedule for recurring activities
        activity.schedule = [
          {
            id: uuidv4(),
            day: new Date().getDay(), // Current day of week
            startTime: '15:00',
            endTime: '16:00',
            location: activity.location,
            notes: '',
            calendarEventId: null
          }
        ];
      }
      
      // Process equipment if provided
      if (activityData.equipment && activityData.equipment.length > 0) {
        activity.equipment = activityData.equipment.map(item => ({
          id: item.id || uuidv4(),
          name: item.name || '',
          type: item.type || 'equipment', // equipment, uniform, supplies
          description: item.description || '',
          quantity: item.quantity || 1,
          status: item.status || 'needed', // needed, owned, borrowed
          cost: item.cost || 0,
          purchaseUrl: item.purchaseUrl || '',
          size: item.size || '',
          condition: item.condition || 'new', // new, good, fair, poor
          lastReplaced: item.lastReplaced ? Timestamp.fromDate(new Date(item.lastReplaced)) : null,
          notes: item.notes || ''
        }));
        
        activity.requiresEquipment = true;
      }
      
      // Process transportation if provided
      if (activityData.transportationArrangements && activityData.transportationArrangements.length > 0) {
        activity.transportationArrangements = activityData.transportationArrangements.map(arrangement => ({
          id: arrangement.id || uuidv4(),
          type: arrangement.type || 'dropoff', // dropoff, pickup, carpool, public, walk, other
          day: arrangement.day, // 0-6 (Sunday to Saturday), null for specific date
          specificDate: arrangement.specificDate ? Timestamp.fromDate(new Date(arrangement.specificDate)) : null,
          assignedTo: arrangement.assignedTo || null,
          assignedToName: arrangement.assignedToName || '',
          status: arrangement.status || 'planned', // planned, confirmed, completed
          details: arrangement.details || '',
          carpoolMembers: arrangement.carpoolMembers || []
        }));
        
        activity.requiresTransportation = true;
      }
      
      // Save the activity document
      await setDoc(doc(this.activitiesCollection, activityId), activity);
      
      // Create calendar events for recurring schedule
      if (activity.isRecurring && activity.schedule && activity.schedule.length > 0) {
        await this.createRecurringCalendarEvents(activity, userId);
      } else if (!activity.isRecurring) {
        // Create a single calendar event for non-recurring activities
        const calendarEvent = {
          title: activity.name,
          start: {
            dateTime: startDate.toISOString(),
            timeZone: 'UTC'
          },
          end: {
            dateTime: endDate ? endDate.toISOString() : new Date(startDate.getTime() + 60*60*1000).toISOString(),
            timeZone: 'UTC'
          },
          location: activity.location,
          description: `${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} activity: ${activity.description}\nOrganization: ${activity.organizationName}\nInstructor: ${activity.instructorName}`,
          familyId,
          createdBy: userId,
          category: `activity-${activity.type}`,
          metadata: {
            activityId,
            participantId: activity.participantId,
            participantName: activity.participantName
          }
        };
        
        const calendarResult = await CalendarService.createEvent(calendarEvent);
        
        if (calendarResult.success) {
          // Update activity with calendar event ID
          await updateDoc(doc(this.activitiesCollection, activityId), {
            'relatedEvents': [calendarResult.eventId]
          });
        }
      }
      
      // Add to child's activity records if participant is a child
      if (activity.participantId) {
        await ChildTrackingService.addActivity(
          familyId,
          activity.participantId,
          {
            activityId,
            activityName: activity.name,
            activityType: activity.type,
            startDate: startDate.toISOString(),
            endDate: endDate ? endDate.toISOString() : null,
            organizationName: activity.organizationName
          }
        );
      }
      
      // Return the created activity
      return {
        success: true,
        activityId,
        activity
      };
    } catch (error) {
      console.error("Error creating activity:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Create recurring calendar events for an activity schedule
   * @param {Object} activity - The activity object
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} Result with created event IDs
   */
  async createRecurringCalendarEvents(activity, userId) {
    try {
      const createdEvents = [];
      
      // Start date for recurring pattern
      const startDate = activity.startDate.toDate();
      
      // End date (default to 3 months if not specified)
      const endDate = activity.endDate 
        ? activity.endDate.toDate() 
        : new Date(startDate.getTime() + 90*24*60*60*1000);
      
      // Create events for each schedule entry
      for (const session of activity.schedule) {
        if (session.day === null) continue;
        
        // Parse the start and end times
        const [startHour, startMinute] = session.startTime.split(':').map(Number);
        const [endHour, endMinute] = session.endTime.split(':').map(Number);
        
        // Create a recurring event rule (RRULE) for this session
        const rrule = {
          freq: 'weekly',
          interval: 1,
          byDay: [this.getDayCodeForRRule(session.day)],
          dtstart: startDate,
          until: endDate
        };
        
        // Create the calendar event
        const calendarEvent = {
          title: activity.name,
          start: {
            dateTime: this.getNextOccurrence(startDate, session.day, startHour, startMinute).toISOString(),
            timeZone: 'UTC'
          },
          end: {
            dateTime: this.getNextOccurrence(startDate, session.day, endHour, endMinute).toISOString(),
            timeZone: 'UTC'
          },
          location: session.location || activity.location,
          description: `${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} activity: ${activity.description}\nOrganization: ${activity.organizationName}\nInstructor: ${activity.instructorName}\n${session.notes || ''}`,
          familyId: activity.familyId,
          createdBy: userId,
          category: `activity-${activity.type}`,
          recurring: true,
          recurrence: JSON.stringify(rrule),
          metadata: {
            activityId: activity.id,
            sessionId: session.id,
            participantId: activity.participantId,
            participantName: activity.participantName
          }
        };
        
        const calendarResult = await CalendarService.createEvent(calendarEvent);
        
        if (calendarResult.success) {
          createdEvents.push({
            sessionId: session.id,
            eventId: calendarResult.eventId
          });
        }
      }
      
      // Update activity with calendar event IDs
      if (createdEvents.length > 0) {
        // Update session calendar event IDs
        const updatedSchedule = [...activity.schedule];
        
        for (const event of createdEvents) {
          const sessionIndex = updatedSchedule.findIndex(s => s.id === event.sessionId);
          if (sessionIndex !== -1) {
            updatedSchedule[sessionIndex] = {
              ...updatedSchedule[sessionIndex],
              calendarEventId: event.eventId
            };
          }
        }
        
        // Update activity
        await updateDoc(doc(this.activitiesCollection, activity.id), {
          schedule: updatedSchedule,
          relatedEvents: createdEvents.map(e => e.eventId)
        });
      }
      
      return { success: true, events: createdEvents };
    } catch (error) {
      console.error("Error creating recurring calendar events:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Get the day code for RRule (SU, MO, TU, etc.)
   * @param {number} day - Day number (0-6, Sunday to Saturday)
   * @returns {string} Day code for RRule
   */
  getDayCodeForRRule(day) {
    const dayCodes = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    return dayCodes[day] || 'MO';
  }
  
  /**
   * Get the next occurrence of a day at a specific time
   * @param {Date} startDate - Base date
   * @param {number} dayOfWeek - Day of week (0-6, Sunday to Saturday)
   * @param {number} hour - Hour (0-23)
   * @param {number} minute - Minute (0-59)
   * @returns {Date} Next occurrence
   */
  getNextOccurrence(startDate, dayOfWeek, hour, minute) {
    const result = new Date(startDate);
    
    // Set time
    result.setHours(hour, minute, 0, 0);
    
    // Find the next occurrence of the day of week
    const currentDay = result.getDay();
    if (currentDay !== dayOfWeek) {
      const daysToAdd = (dayOfWeek - currentDay + 7) % 7;
      result.setDate(result.getDate() + daysToAdd);
    }
    
    return result;
  }
  
  /**
   * Update an activity
   * @param {string} activityId - The activity ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Update result
   */
  async updateActivity(activityId, updateData) {
    try {
      // Get current activity
      const activityDoc = await getDoc(doc(this.activitiesCollection, activityId));
      
      if (!activityDoc.exists()) {
        throw new Error(`Activity with ID ${activityId} not found`);
      }
      
      const currentActivity = activityDoc.data();
      
      // Prepare update object
      const update = {
        ...updateData,
        updatedAt: serverTimestamp()
      };
      
      // Handle date fields
      if (updateData.startDate) {
        update.startDate = Timestamp.fromDate(new Date(updateData.startDate));
      }
      
      if (updateData.endDate) {
        update.endDate = updateData.endDate === null 
          ? null 
          : Timestamp.fromDate(new Date(updateData.endDate));
      }
      
      // Update the activity
      await updateDoc(doc(this.activitiesCollection, activityId), update);
      
      // If schedule was updated, update calendar events
      if (updateData.schedule || updateData.isRecurring !== undefined) {
        // Clear existing recurring events
        if (currentActivity.relatedEvents && currentActivity.relatedEvents.length > 0) {
          for (const eventId of currentActivity.relatedEvents) {
            await CalendarService.deleteEvent(eventId);
          }
        }
        
        // Create new events if still recurring
        const isRecurring = updateData.isRecurring !== undefined 
          ? updateData.isRecurring 
          : currentActivity.isRecurring;
          
        if (isRecurring) {
          const updatedActivity = {
            ...currentActivity,
            ...update,
            id: activityId,
            familyId: currentActivity.familyId
          };
          
          await this.createRecurringCalendarEvents(updatedActivity, updateData.userId || currentActivity.createdBy);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error updating activity:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Get an activity by ID
   * @param {string} activityId - The activity ID
   * @returns {Promise<Object>} Activity data
   */
  async getActivity(activityId) {
    try {
      const activityDoc = await getDoc(doc(this.activitiesCollection, activityId));
      
      if (!activityDoc.exists()) {
        throw new Error(`Activity with ID ${activityId} not found`);
      }
      
      return activityDoc.data();
    } catch (error) {
      console.error("Error getting activity:", error);
      return null;
    }
  }
  
  /**
   * Get activities for a family
   * @param {string} familyId - The family ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Activities
   */
  async getActivitiesForFamily(familyId, filters = {}) {
    try {
      let activitiesQuery = query(
        this.activitiesCollection,
        where("familyId", "==", familyId)
      );
      
      // Apply additional filters
      if (filters.participantId) {
        activitiesQuery = query(activitiesQuery, where("participantId", "==", filters.participantId));
      }
      
      if (filters.type) {
        activitiesQuery = query(activitiesQuery, where("type", "==", filters.type));
      }
      
      if (filters.isActive !== undefined) {
        activitiesQuery = query(activitiesQuery, where("isActive", "==", filters.isActive));
      }
      
      // Add sorting
      activitiesQuery = query(
        activitiesQuery, 
        orderBy("startDate", filters.sortOrder === 'asc' ? 'asc' : 'desc')
      );
      
      const activityDocs = await getDocs(activitiesQuery);
      const activities = [];
      
      activityDocs.forEach(doc => {
        activities.push(doc.data());
      });
      
      return activities;
    } catch (error) {
      console.error("Error getting activities for family:", error);
      return [];
    }
  }
  
  /**
   * Get current activities for a participant
   * @param {string} participantId - The participant ID
   * @returns {Promise<Array>} Current activities
   */
  async getCurrentActivities(participantId) {
    try {
      const now = new Date();
      const timestamp = Timestamp.fromDate(now);
      
      // Query activities that are currently active
      const activitiesQuery = query(
        this.activitiesCollection,
        where("participantId", "==", participantId),
        where("isActive", "==", true),
        where("startDate", "<=", timestamp)
      );
      
      const activityDocs = await getDocs(activitiesQuery);
      const activities = [];
      
      // Filter out activities that have ended
      activityDocs.forEach(doc => {
        const activity = doc.data();
        
        // Include if no end date or end date is in the future
        if (!activity.endDate || activity.endDate.toDate() >= now) {
          activities.push(activity);
        }
      });
      
      return activities;
    } catch (error) {
      console.error("Error getting current activities:", error);
      return [];
    }
  }
  
  /**
   * Update equipment for an activity
   * @param {string} activityId - The activity ID
   * @param {Array} equipment - Equipment items
   * @returns {Promise<Object>} Update result
   */
  async updateEquipment(activityId, equipment) {
    try {
      // Process equipment items
      const processedEquipment = equipment.map(item => ({
        id: item.id || uuidv4(),
        name: item.name || '',
        type: item.type || 'equipment',
        description: item.description || '',
        quantity: item.quantity || 1,
        status: item.status || 'needed',
        cost: item.cost || 0,
        purchaseUrl: item.purchaseUrl || '',
        size: item.size || '',
        condition: item.condition || 'new',
        lastReplaced: item.lastReplaced 
          ? Timestamp.fromDate(new Date(item.lastReplaced)) 
          : null,
        notes: item.notes || ''
      }));
      
      // Update the activity
      await updateDoc(doc(this.activitiesCollection, activityId), {
        equipment: processedEquipment,
        requiresEquipment: processedEquipment.length > 0,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error updating equipment:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Update equipment status
   * @param {string} activityId - The activity ID
   * @param {string} equipmentId - The equipment ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Update result
   */
  async updateEquipmentStatus(activityId, equipmentId, status) {
    try {
      // Get current activity
      const activityDoc = await getDoc(doc(this.activitiesCollection, activityId));
      
      if (!activityDoc.exists()) {
        throw new Error(`Activity with ID ${activityId} not found`);
      }
      
      const activity = activityDoc.data();
      
      // Find and update equipment item
      const equipment = [...activity.equipment];
      const itemIndex = equipment.findIndex(item => item.id === equipmentId);
      
      if (itemIndex === -1) {
        throw new Error(`Equipment with ID ${equipmentId} not found`);
      }
      
      equipment[itemIndex] = {
        ...equipment[itemIndex],
        status
      };
      
      // Update the activity
      await updateDoc(doc(this.activitiesCollection, activityId), {
        equipment,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error updating equipment status:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Update transportation arrangements for an activity
   * @param {string} activityId - The activity ID
   * @param {Array} arrangements - Transportation arrangements
   * @returns {Promise<Object>} Update result
   */
  async updateTransportation(activityId, arrangements) {
    try {
      // Process transportation arrangements
      const processedArrangements = arrangements.map(arrangement => ({
        id: arrangement.id || uuidv4(),
        type: arrangement.type || 'dropoff',
        day: arrangement.day !== undefined ? arrangement.day : null,
        specificDate: arrangement.specificDate 
          ? Timestamp.fromDate(new Date(arrangement.specificDate)) 
          : null,
        assignedTo: arrangement.assignedTo || null,
        assignedToName: arrangement.assignedToName || '',
        status: arrangement.status || 'planned',
        details: arrangement.details || '',
        carpoolMembers: arrangement.carpoolMembers || []
      }));
      
      // Update the activity
      await updateDoc(doc(this.activitiesCollection, activityId), {
        transportationArrangements: processedArrangements,
        requiresTransportation: processedArrangements.length > 0,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error updating transportation arrangements:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Assign transportation to a family member
   * @param {string} activityId - The activity ID
   * @param {string} arrangementId - The arrangement ID
   * @param {string} memberId - Family member ID
   * @param {string} memberName - Family member name
   * @returns {Promise<Object>} Update result
   */
  async assignTransportation(activityId, arrangementId, memberId, memberName) {
    try {
      // Get current activity
      const activityDoc = await getDoc(doc(this.activitiesCollection, activityId));
      
      if (!activityDoc.exists()) {
        throw new Error(`Activity with ID ${activityId} not found`);
      }
      
      const activity = activityDoc.data();
      
      // Find and update transportation arrangement
      const arrangements = [...activity.transportationArrangements];
      const index = arrangements.findIndex(arr => arr.id === arrangementId);
      
      if (index === -1) {
        throw new Error(`Transportation arrangement with ID ${arrangementId} not found`);
      }
      
      arrangements[index] = {
        ...arrangements[index],
        assignedTo: memberId,
        assignedToName: memberName,
        status: 'confirmed'
      };
      
      // Update the activity
      await updateDoc(doc(this.activitiesCollection, activityId), {
        transportationArrangements: arrangements,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error assigning transportation:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Add member to carpool
   * @param {string} activityId - The activity ID
   * @param {string} arrangementId - The arrangement ID
   * @param {Object} member - Carpool member info
   * @returns {Promise<Object>} Update result
   */
  async addCarpoolMember(activityId, arrangementId, member) {
    try {
      // Get current activity
      const activityDoc = await getDoc(doc(this.activitiesCollection, activityId));
      
      if (!activityDoc.exists()) {
        throw new Error(`Activity with ID ${activityId} not found`);
      }
      
      const activity = activityDoc.data();
      
      // Find transportation arrangement
      const arrangements = [...activity.transportationArrangements];
      const index = arrangements.findIndex(arr => arr.id === arrangementId);
      
      if (index === -1) {
        throw new Error(`Transportation arrangement with ID ${arrangementId} not found`);
      }
      
      // Add member to carpool
      const carpoolMember = {
        id: member.id || uuidv4(),
        name: member.name || '',
        familyId: member.familyId || '',
        participantId: member.participantId || '',
        address: member.address || '',
        notes: member.notes || '',
        contactInfo: member.contactInfo || {
          phone: '',
          email: ''
        }
      };
      
      const carpoolMembers = [...(arrangements[index].carpoolMembers || [])];
      
      // Check if member already exists
      const memberExists = carpoolMembers.some(m => m.id === carpoolMember.id);
      
      if (!memberExists) {
        carpoolMembers.push(carpoolMember);
      }
      
      arrangements[index] = {
        ...arrangements[index],
        carpoolMembers
      };
      
      // Update the activity
      await updateDoc(doc(this.activitiesCollection, activityId), {
        transportationArrangements: arrangements,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error adding carpool member:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Remove member from carpool
   * @param {string} activityId - The activity ID
   * @param {string} arrangementId - The arrangement ID
   * @param {string} memberId - Carpool member ID
   * @returns {Promise<Object>} Update result
   */
  async removeCarpoolMember(activityId, arrangementId, memberId) {
    try {
      // Get current activity
      const activityDoc = await getDoc(doc(this.activitiesCollection, activityId));
      
      if (!activityDoc.exists()) {
        throw new Error(`Activity with ID ${activityId} not found`);
      }
      
      const activity = activityDoc.data();
      
      // Find transportation arrangement
      const arrangements = [...activity.transportationArrangements];
      const index = arrangements.findIndex(arr => arr.id === arrangementId);
      
      if (index === -1) {
        throw new Error(`Transportation arrangement with ID ${arrangementId} not found`);
      }
      
      // Remove member from carpool
      const carpoolMembers = [...(arrangements[index].carpoolMembers || [])];
      const updatedMembers = carpoolMembers.filter(m => m.id !== memberId);
      
      arrangements[index] = {
        ...arrangements[index],
        carpoolMembers: updatedMembers
      };
      
      // Update the activity
      await updateDoc(doc(this.activitiesCollection, activityId), {
        transportationArrangements: arrangements,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error removing carpool member:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Update skill tracking for an activity
   * @param {string} activityId - The activity ID
   * @param {Object} skillsTracking - Skills tracking data
   * @returns {Promise<Object>} Update result
   */
  async updateSkillsTracking(activityId, skillsTracking) {
    try {
      // Process skills data
      const processedSkillsTracking = {
        enabled: skillsTracking.enabled !== false,
        skills: (skillsTracking.skills || []).map(skill => ({
          id: skill.id || uuidv4(),
          name: skill.name || '',
          category: skill.category || '',
          description: skill.description || '',
          level: skill.level || 1,
          targetLevel: skill.targetLevel || 5,
          progress: skill.progress || 0,
          assessments: skill.assessments || [],
          notes: skill.notes || ''
        }))
      };
      
      // Update the activity
      await updateDoc(doc(this.activitiesCollection, activityId), {
        skillsTracking: processedSkillsTracking,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error updating skills tracking:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Record skill assessment for an activity
   * @param {string} activityId - The activity ID
   * @param {string} skillId - The skill ID
   * @param {Object} assessment - Assessment data
   * @returns {Promise<Object>} Update result
   */
  async recordSkillAssessment(activityId, skillId, assessment) {
    try {
      // Get current activity
      const activityDoc = await getDoc(doc(this.activitiesCollection, activityId));
      
      if (!activityDoc.exists()) {
        throw new Error(`Activity with ID ${activityId} not found`);
      }
      
      const activity = activityDoc.data();
      
      if (!activity.skillsTracking || !activity.skillsTracking.enabled) {
        throw new Error('Skills tracking is not enabled for this activity');
      }
      
      // Find the skill
      const skills = [...activity.skillsTracking.skills];
      const skillIndex = skills.findIndex(s => s.id === skillId);
      
      if (skillIndex === -1) {
        throw new Error(`Skill with ID ${skillId} not found`);
      }
      
      // Prepare assessment object
      const newAssessment = {
        id: assessment.id || uuidv4(),
        date: Timestamp.fromDate(new Date()),
        level: assessment.level || skills[skillIndex].level,
        notes: assessment.notes || '',
        progress: assessment.progress || 0,
        assessor: assessment.assessor || ''
      };
      
      // Update skill with new assessment
      const updatedSkill = {
        ...skills[skillIndex],
        level: newAssessment.level,
        progress: newAssessment.progress,
        assessments: [...(skills[skillIndex].assessments || []), newAssessment]
      };
      
      skills[skillIndex] = updatedSkill;
      
      // Update the activity
      await updateDoc(doc(this.activitiesCollection, activityId), {
        'skillsTracking.skills': skills,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error recording skill assessment:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Check for schedule conflicts
   * @param {Object} scheduleInfo - Schedule information
   * @param {string} familyId - The family ID
   * @param {string} participantId - The participant ID (optional)
   * @returns {Promise<Object>} Conflict information
   */
  async checkScheduleConflicts(scheduleInfo, familyId, participantId = null) {
    try {
      // Get all active activities for the family or participant
      let activitiesQuery;
      
      if (participantId) {
        activitiesQuery = query(
          this.activitiesCollection,
          where("familyId", "==", familyId),
          where("participantId", "==", participantId),
          where("isActive", "==", true)
        );
      } else {
        activitiesQuery = query(
          this.activitiesCollection,
          where("familyId", "==", familyId),
          where("isActive", "==", true)
        );
      }
      
      const activityDocs = await getDocs(activitiesQuery);
      const conflicts = [];
      
      // Check for conflicts with recurring schedules
      activityDocs.forEach(doc => {
        const activity = doc.data();
        
        // Skip activities without schedule
        if (!activity.isRecurring || !activity.schedule || activity.schedule.length === 0) {
          return;
        }
        
        // Check each schedule entry for conflicts
        activity.schedule.forEach(session => {
          if (session.day === scheduleInfo.day) {
            // Parse times for comparison
            const [sessionStartHour, sessionStartMinute] = session.startTime.split(':').map(Number);
            const [sessionEndHour, sessionEndMinute] = session.endTime.split(':').map(Number);
            const [newStartHour, newStartMinute] = scheduleInfo.startTime.split(':').map(Number);
            const [newEndHour, newEndMinute] = scheduleInfo.endTime.split(':').map(Number);
            
            // Convert to minutes for easier comparison
            const sessionStartMinutes = sessionStartHour * 60 + sessionStartMinute;
            const sessionEndMinutes = sessionEndHour * 60 + sessionEndMinute;
            const newStartMinutes = newStartHour * 60 + newStartMinute;
            const newEndMinutes = newEndHour * 60 + newEndMinute;
            
            // Check for overlap
            if (
              (newStartMinutes >= sessionStartMinutes && newStartMinutes < sessionEndMinutes) ||
              (newEndMinutes > sessionStartMinutes && newEndMinutes <= sessionEndMinutes) ||
              (newStartMinutes <= sessionStartMinutes && newEndMinutes >= sessionEndMinutes)
            ) {
              conflicts.push({
                activityId: activity.id,
                activityName: activity.name,
                participantId: activity.participantId,
                participantName: activity.participantName,
                day: session.day,
                startTime: session.startTime,
                endTime: session.endTime,
                location: session.location || activity.location
              });
            }
          }
        });
      });
      
      return { 
        success: true, 
        hasConflicts: conflicts.length > 0,
        conflicts
      };
    } catch (error) {
      console.error("Error checking schedule conflicts:", error);
      return { 
        success: false, 
        error: error.message || "Unknown error",
        hasConflicts: false,
        conflicts: []
      };
    }
  }
  
  /**
   * Get transportation needs for a family
   * @param {string} familyId - The family ID
   * @param {Date} startDate - Start date for the range
   * @param {Date} endDate - End date for the range
   * @returns {Promise<Array>} Transportation arrangements
   */
  async getTransportationNeeds(familyId, startDate, endDate) {
    try {
      // Get all active activities for the family
      const activitiesQuery = query(
        this.activitiesCollection,
        where("familyId", "==", familyId),
        where("isActive", "==", true),
        where("requiresTransportation", "==", true)
      );
      
      const activityDocs = await getDocs(activitiesQuery);
      const transportation = [];
      
      // Process each activity's transportation arrangements
      activityDocs.forEach(doc => {
        const activity = doc.data();
        
        if (!activity.transportationArrangements || activity.transportationArrangements.length === 0) {
          return;
        }
        
        // Add each arrangement for the date range
        activity.transportationArrangements.forEach(arrangement => {
          // Skip arrangements with specific dates outside the range
          if (arrangement.specificDate) {
            const arrangementDate = arrangement.specificDate.toDate();
            if (arrangementDate < startDate || arrangementDate > endDate) {
              return;
            }
            
            transportation.push({
              id: arrangement.id,
              activityId: activity.id,
              activityName: activity.name,
              participantId: activity.participantId,
              participantName: activity.participantName,
              type: arrangement.type,
              date: arrangementDate,
              day: null,
              assignedTo: arrangement.assignedTo,
              assignedToName: arrangement.assignedToName,
              status: arrangement.status,
              location: activity.location,
              details: arrangement.details,
              carpoolMembers: arrangement.carpoolMembers
            });
          } 
          // For recurring arrangements, add all occurrences in the date range
          else if (arrangement.day !== null && activity.isRecurring) {
            // Find matching schedule for this day
            const matchingSession = activity.schedule.find(session => session.day === arrangement.day);
            
            if (!matchingSession) return;
            
            // Generate occurrences in date range
            const occurrences = this.getOccurrencesInRange(
              arrangement.day,
              startDate,
              endDate,
              matchingSession.startTime,
              matchingSession.endTime
            );
            
            // Add each occurrence
            occurrences.forEach(occurrence => {
              transportation.push({
                id: `${arrangement.id}-${occurrence.date.toISOString()}`,
                activityId: activity.id,
                activityName: activity.name,
                participantId: activity.participantId,
                participantName: activity.participantName,
                type: arrangement.type,
                date: occurrence.date,
                time: occurrence.time,
                day: arrangement.day,
                assignedTo: arrangement.assignedTo,
                assignedToName: arrangement.assignedToName,
                status: arrangement.status,
                location: matchingSession.location || activity.location,
                details: arrangement.details,
                carpoolMembers: arrangement.carpoolMembers
              });
            });
          }
        });
      });
      
      // Sort by date
      transportation.sort((a, b) => a.date - b.date);
      
      return transportation;
    } catch (error) {
      console.error("Error getting transportation needs:", error);
      return [];
    }
  }
  
  /**
   * Get day occurrences in a date range
   * @param {number} dayOfWeek - Day of week (0-6, Sunday to Saturday)
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} startTime - Start time (HH:MM)
   * @param {string} endTime - End time (HH:MM)
   * @returns {Array} Day occurrences with date and time
   */
  getOccurrencesInRange(dayOfWeek, startDate, endDate, startTime, endTime) {
    const occurrences = [];
    const currentDate = new Date(startDate);
    
    // Move to the first occurrence of the day
    while (currentDate.getDay() !== dayOfWeek) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Add all occurrences in range
    while (currentDate <= endDate) {
      const [startHour, startMinute] = startTime.split(':').map(Number);
      
      const occurrenceDate = new Date(currentDate);
      occurrenceDate.setHours(startHour, startMinute, 0, 0);
      
      occurrences.push({
        date: new Date(occurrenceDate),
        time: startTime
      });
      
      // Move to next week
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    return occurrences;
  }
  
  /**
   * Get equipment needs for a family
   * @param {string} familyId - The family ID
   * @returns {Promise<Array>} Equipment needs
   */
  async getEquipmentNeeds(familyId) {
    try {
      // Get all active activities for the family
      const activitiesQuery = query(
        this.activitiesCollection,
        where("familyId", "==", familyId),
        where("isActive", "==", true),
        where("requiresEquipment", "==", true)
      );
      
      const activityDocs = await getDocs(activitiesQuery);
      const equipment = [];
      
      // Process each activity's equipment
      activityDocs.forEach(doc => {
        const activity = doc.data();
        
        if (!activity.equipment || activity.equipment.length === 0) {
          return;
        }
        
        // Add needed or partial equipment
        activity.equipment.forEach(item => {
          if (item.status !== 'owned') {
            equipment.push({
              id: item.id,
              activityId: activity.id,
              activityName: activity.name,
              participantId: activity.participantId,
              participantName: activity.participantName,
              name: item.name,
              type: item.type,
              description: item.description,
              quantity: item.quantity,
              status: item.status,
              cost: item.cost,
              purchaseUrl: item.purchaseUrl,
              size: item.size,
              condition: item.condition,
              lastReplaced: item.lastReplaced,
              notes: item.notes
            });
          }
        });
      });
      
      // Sort by status (needed first)
      equipment.sort((a, b) => 
        a.status === 'needed' ? -1 : b.status === 'needed' ? 1 : 0
      );
      
      return equipment;
    } catch (error) {
      console.error("Error getting equipment needs:", error);
      return [];
    }
  }
  
  /**
   * Get skill progress for a participant
   * @param {string} participantId - The participant ID
   * @returns {Promise<Array>} Skill progress
   */
  async getSkillProgress(participantId) {
    try {
      // Get all active activities for the participant
      const activitiesQuery = query(
        this.activitiesCollection,
        where("participantId", "==", participantId),
        where("isActive", "==", true)
      );
      
      const activityDocs = await getDocs(activitiesQuery);
      const skills = [];
      
      // Process each activity's skills
      activityDocs.forEach(doc => {
        const activity = doc.data();
        
        if (!activity.skillsTracking || 
            !activity.skillsTracking.enabled || 
            !activity.skillsTracking.skills || 
            activity.skillsTracking.skills.length === 0) {
          return;
        }
        
        // Add each skill
        activity.skillsTracking.skills.forEach(skill => {
          skills.push({
            id: skill.id,
            activityId: activity.id,
            activityName: activity.name,
            activityType: activity.type,
            name: skill.name,
            category: skill.category,
            description: skill.description,
            level: skill.level,
            targetLevel: skill.targetLevel,
            progress: skill.progress,
            lastAssessment: skill.assessments && skill.assessments.length > 0
              ? skill.assessments[skill.assessments.length - 1]
              : null,
            assessments: skill.assessments || []
          });
        });
      });
      
      // Group by category
      const groupedSkills = skills.reduce((groups, skill) => {
        const category = skill.category || 'Other';
        
        if (!groups[category]) {
          groups[category] = [];
        }
        
        groups[category].push(skill);
        return groups;
      }, {});
      
      return { individual: skills, grouped: groupedSkills };
    } catch (error) {
      console.error("Error getting skill progress:", error);
      return { individual: [], grouped: {} };
    }
  }
}

// Create a singleton instance
const activityManagerInstance = new ActivityManager();

// Attach static methods to the instance for compatibility
activityManagerInstance.getActivitiesForFamily = ActivityManager.getActivitiesForFamily;
activityManagerInstance.getEquipmentNeeds = ActivityManager.getEquipmentNeeds;
activityManagerInstance.getTransportationArrangements = ActivityManager.getTransportationArrangements;
activityManagerInstance.getScheduleConflicts = ActivityManager.getScheduleConflicts;

export default activityManagerInstance;