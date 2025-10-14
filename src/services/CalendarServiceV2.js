// CalendarServiceV2.js - Consolidated calendar service
import BaseFirestoreService from './BaseFirestoreService';
import { db } from './firebase';
import { Timestamp, collection, query, where, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

class CalendarServiceV2 extends BaseFirestoreService {
  constructor() {
    super('events');
    this.retryCount = 3;
    this.retryDelay = 1000;
  }

  // Create event with proper structure
  async createEvent(eventData, userId, familyId) {
    if (!userId || !familyId) {
      throw new Error('userId and familyId are required');
    }

    // Generate consistent ID
    const eventId = eventData.id || uuidv4();

    // Parse and validate dates
    const startTime = this.parseDate(eventData.startTime || eventData.startDate || eventData.dateTime);
    const endTime = this.parseDate(
      eventData.endTime || 
      eventData.endDate || 
      new Date(startTime.getTime() + (eventData.duration || 60) * 60000)
    );

    const event = {
      // Core fields
      title: eventData.title || eventData.summary || 'Untitled Event',
      description: eventData.description || eventData.details || '',
      
      // Dates as Firestore Timestamps
      startTime: Timestamp.fromDate(startTime),
      endTime: Timestamp.fromDate(endTime),
      
      // Location
      location: eventData.location || eventData.place || '',
      
      // Categorization
      category: eventData.category || eventData.type || 'general',
      
      // Attendees
      attendees: this.normalizeAttendees(eventData.attendees || eventData.participants || []),
      
      // Standard fields
      userId,
      familyId,
      createdBy: userId,
      
      // Status
      status: eventData.status || 'active',
      
      // Source tracking
      source: eventData.source || 'manual',
      
      // Additional metadata
      metadata: eventData.metadata || {},
      
      // Reminders
      reminders: eventData.reminders || []
    };

    try {
      const created = await this.create(event, eventId);
      this.log('Event created:', created.id);
      
      // Dispatch event for compatibility
      window.dispatchEvent(new CustomEvent('calendar-event-created', {
        detail: { event: created }
      }));
      
      return {
        success: true,
        event: created,
        eventId: created.id
      };
    } catch (error) {
      this.error('Error creating event:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update event
  async updateEvent(eventId, updates, userId) {
    try {
      // Parse dates if provided
      if (updates.startTime) {
        updates.startTime = Timestamp.fromDate(this.parseDate(updates.startTime));
      }
      if (updates.endTime) {
        updates.endTime = Timestamp.fromDate(this.parseDate(updates.endTime));
      }
      
      // Normalize attendees if provided
      if (updates.attendees) {
        updates.attendees = this.normalizeAttendees(updates.attendees);
      }
      
      const result = await this.update(eventId, updates);
      
      // Dispatch event for compatibility
      window.dispatchEvent(new CustomEvent('calendar-event-updated', {
        detail: { event: result }
      }));
      
      return {
        success: true,
        event: result
      };
    } catch (error) {
      this.error('Error updating event:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Delete event
  async deleteEvent(eventId, userId) {
    try {
      await this.delete(eventId, true); // Soft delete
      
      // Dispatch event for compatibility
      window.dispatchEvent(new CustomEvent('calendar-event-deleted', {
        detail: { eventId }
      }));
      
      return { success: true };
    } catch (error) {
      this.error('Error deleting event:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get events for date range
  async getEventsByDateRange(familyId, startDate, endDate) {
    try {
      const startTimestamp = Timestamp.fromDate(this.parseDate(startDate));
      const endTimestamp = Timestamp.fromDate(this.parseDate(endDate));

      const q = query(
        collection(db, 'events'),
        where('familyId', '==', familyId),
        where('status', 'in', ['active', 'confirmed']), // Accept both manual events (active) and Google synced events (confirmed)
        where('startTime', '>=', startTimestamp),
        where('startTime', '<=', endTimestamp),
        orderBy('startTime', 'asc')
      );

      const snapshot = await getDocs(q);
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Timestamps back to Dates for the UI
        startTime: doc.data().startTime?.toDate(),
        endTime: doc.data().endTime?.toDate()
      }));

      return events;
    } catch (error) {
      this.error('Error getting events by date range:', error);

      // Fallback for missing index
      if (error.code === 'failed-precondition') {
        return this.getEventsFallback(familyId);
      }

      throw error;
    }
  }

  // Fallback query without date filtering
  async getEventsFallback(familyId) {
    // Query for both 'active' and 'confirmed' events
    const activeResult = await this.query(
      { familyId, status: 'active' },
      { orderByField: 'startTime', pageSize: 100 }
    );

    const confirmedResult = await this.query(
      { familyId, status: 'confirmed' },
      { orderByField: 'startTime', pageSize: 100 }
    );

    // Merge and deduplicate results
    const allEvents = [...activeResult.docs, ...confirmedResult.docs];
    const uniqueEvents = Array.from(
      new Map(allEvents.map(event => [event.id, event])).values()
    );

    return uniqueEvents.map(event => ({
      ...event,
      startTime: event.startTime instanceof Date ? event.startTime : new Date(event.startTime),
      endTime: event.endTime instanceof Date ? event.endTime : new Date(event.endTime)
    }));
  }

  // Get events for user (backwards compatibility)
  async getEventsForUser(userId, startDate, endDate, familyId) {
    if (!familyId) {
      throw new Error('familyId is required');
    }
    
    return this.getEventsByDateRange(familyId, startDate, endDate);
  }

  // Get events (generic method)
  async getEvents(familyId, startDate, endDate) {
    return this.getEventsByDateRange(familyId, startDate || new Date(0), endDate || new Date(2100, 0, 1));
  }

  // Subscribe to family events
  subscribeToFamilyEvents(familyId, callback) {
    // Subscribe to both 'active' and 'confirmed' events
    // Custom implementation since BaseFirestoreService.subscribe doesn't support 'in' operator
    const q = query(
      collection(db, 'events'),
      where('familyId', '==', familyId),
      where('status', 'in', ['active', 'confirmed'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = [];
      const changes = {
        added: [],
        modified: [],
        removed: []
      };

      snapshot.docChanges().forEach(change => {
        const doc = { id: change.doc.id, ...change.doc.data() };

        if (change.type === 'added') {
          changes.added.push(doc);
        } else if (change.type === 'modified') {
          changes.modified.push(doc);
        } else if (change.type === 'removed') {
          changes.removed.push(doc);
        }
      });

      snapshot.docs.forEach(doc => {
        docs.push({ id: doc.id, ...doc.data() });
      });

      // Convert timestamps for UI
      const processedEvents = docs.map(event => ({
        ...event,
        startTime: event.startTime instanceof Date ? event.startTime : new Date(event.startTime),
        endTime: event.endTime instanceof Date ? event.endTime : new Date(event.endTime)
      }));

      callback(processedEvents, changes);
    });

    return unsubscribe;
  }

  // Subscribe to events (alias for compatibility)
  subscribeToEvents(familyId, callback) {
    return this.subscribeToFamilyEvents(familyId, callback);
  }

  // Add event (backwards compatibility)
  async addEvent(eventData, userId, familyId) {
    // Map old field names to new ones
    const mappedData = {
      ...eventData,
      startTime: eventData.start?.dateTime || eventData.startTime,
      endTime: eventData.end?.dateTime || eventData.endTime
    };
    
    const result = await this.createEvent(mappedData, userId, familyId);
    return result.success ? result.eventId : null;
  }

  // Remove event (backwards compatibility)
  async removeEvent(eventId) {
    const result = await this.deleteEvent(eventId);
    return result.success;
  }

  // Parse AI-detected events (from EventStore)
  async parseAndCreateEvent(eventData, userId, familyId) {
    try {
      // Handle AI-parsed event format
      const parsedEvent = {
        title: eventData.summary || eventData.title,
        description: eventData.description,
        startTime: eventData.dateTime || eventData.startTime,
        endTime: eventData.endTime,
        location: eventData.location,
        category: eventData.category || 'general',
        source: 'ai-parsed',
        metadata: {
          originalText: eventData.originalText,
          confidence: eventData.confidence
        }
      };
      
      return this.createEvent(parsedEvent, userId, familyId);
    } catch (error) {
      this.error('Error parsing AI event:', error);
      throw error;
    }
  }

  // Helper to parse various date formats
  parseDate(dateInput) {
    if (!dateInput) return new Date();
    if (dateInput instanceof Date) return dateInput;
    if (dateInput.toDate) return dateInput.toDate(); // Firestore Timestamp
    if (typeof dateInput === 'string') {
      // Handle ISO strings and other formats
      const parsed = new Date(dateInput);
      if (!isNaN(parsed.getTime())) return parsed;
      
      // Try parsing "Today at 3pm" style strings
      // This would need a more sophisticated parser for production
      this.log('Could not parse date string:', dateInput);
      return new Date();
    }
    if (typeof dateInput === 'number') return new Date(dateInput);
    
    this.error('Invalid date format:', dateInput);
    return new Date();
  }

  // Normalize attendees format
  normalizeAttendees(attendees) {
    if (!Array.isArray(attendees)) return [];
    
    return attendees.map(attendee => {
      if (typeof attendee === 'string') {
        return {
          id: attendee,
          name: attendee,
          status: 'pending'
        };
      }
      
      return {
        id: attendee.id || attendee.memberId || attendee.userId,
        name: attendee.name || attendee.displayName || 'Unknown',
        displayName: attendee.displayName || attendee.name || 'Unknown',
        email: attendee.email || '',
        avatar: attendee.avatar || attendee.profilePictureUrl || attendee.profilePicture || '',
        photoURL: attendee.photoURL || attendee.profilePictureUrl || '',
        profilePicture: attendee.profilePicture || attendee.avatar || '',
        initials: attendee.initials || (attendee.name ? attendee.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'),
        status: attendee.status || 'pending',
        role: attendee.role || 'attendee'
      };
    });
  }

  // Check for event conflicts
  async checkConflicts(eventData, familyId) {
    try {
      const startTime = this.parseDate(eventData.startTime);
      const endTime = this.parseDate(eventData.endTime);
      
      // Get events that might conflict
      const potentialConflicts = await this.getEventsByDateRange(
        familyId,
        new Date(startTime.getTime() - 24 * 60 * 60 * 1000), // Day before
        new Date(endTime.getTime() + 24 * 60 * 60 * 1000) // Day after
      );
      
      const conflicts = potentialConflicts.filter(event => {
        if (event.id === eventData.id) return false; // Skip self
        
        const eventStart = new Date(event.startTime);
        const eventEnd = new Date(event.endTime);
        
        // Check for overlap
        return (startTime < eventEnd && endTime > eventStart);
      });
      
      return conflicts;
    } catch (error) {
      this.error('Error checking conflicts:', error);
      return [];
    }
  }
}

// Export singleton instance
export default new CalendarServiceV2();