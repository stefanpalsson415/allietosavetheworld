// src/services/ImprovedEventStore.js
import { db } from './firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  deleteDoc, query, where, serverTimestamp 
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

/**
 * Enhanced event storage service with better categorization and standardization
 */
class ImprovedEventStore {
  constructor() {
    this.listeners = new Set();
    this.eventCache = new Map();
    this.lastRefresh = Date.now();
    this.refreshInProgress = false;
    
    // Check for pending events on initialization
    if (typeof window !== 'undefined') {
      setTimeout(() => this.checkAndRecoverPendingEvents(), 5000);
    }
  }
  
  /**
   * Creates a stable hash for an event signature
   * @param {string} str String to hash
   * @returns {string} Hashed string
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
  
  /**
   * Standardizes an event object to ensure consistent structure
   * @param {Object} eventData Raw event data
   * @returns {Object} Standardized event object
   */
  standardizeEvent(eventData) {
    // Process date objects with error handling
    let dateObj = new Date();
    try {
      if (eventData.dateObj instanceof Date && !isNaN(eventData.dateObj.getTime())) {
        dateObj = eventData.dateObj;
      } else if (eventData.dateTime) {
        dateObj = new Date(eventData.dateTime);
      } else if (eventData.start?.dateTime) {
        dateObj = new Date(eventData.start.dateTime);
      } else if (eventData.date) {
        dateObj = new Date(eventData.date);
      }
    } catch (e) {
      console.error("Error parsing date:", e);
    }
    
    // Calculate end date
    let dateEndObj = new Date(dateObj);
    dateEndObj.setHours(dateEndObj.getHours() + 1);
    
    try {
      if (eventData.dateEndObj instanceof Date && !isNaN(eventData.dateEndObj.getTime())) {
        dateEndObj = eventData.dateEndObj;
      } else if (eventData.endDateTime) {
        dateEndObj = new Date(eventData.endDateTime);
      } else if (eventData.end?.dateTime) {
        dateEndObj = new Date(eventData.end.dateTime);
      }
    } catch (e) {
      console.error("Error parsing end date:", e);
    }
    
    // Generate a unique ID if not provided
    const universalId = eventData.universalId || eventData.id || `event-${uuidv4()}`;
    
    // Create signature for deduplication
    const title = eventData.title || eventData.summary || "";
    const childInfo = eventData.childId || eventData.childName || "";
    const category = eventData.eventType || eventData.category || "general";
    const dateString = dateObj.toISOString().split('T')[0];
    
    const signatureBase = `${title}-${dateString}-${childInfo}-${category}`.toLowerCase();
    const eventSignature = `sig-${this.hashString(signatureBase)}`;
    
    // Process attendees with standardization
    let attendees = [];
    
    if (eventData.attendees) {
      if (Array.isArray(eventData.attendees)) {
        attendees = eventData.attendees.map(attendee => {
          if (typeof attendee === 'string') {
            return { id: attendee, name: attendee, role: 'general' };
          }
          return {
            id: attendee.id || 'unknown-id',
            name: attendee.name || 'Unknown Attendee',
            role: attendee.role || 'general',
            ...(attendee.photoURL ? { photoURL: attendee.photoURL } : {})
          };
        });
      }
    }
    
    // Determine event category for better organization
    let category_normalized = (eventData.category || eventData.eventType || 'general').toLowerCase();
    
    // Map various category names to standardized categories
    const categoryMapping = {
      'appointment': 'appointment',
      'doctor': 'appointment',
      'medical': 'appointment',
      'healthcare': 'appointment',
      'dentist': 'appointment',
      'therapy': 'appointment',
      
      'activity': 'activity',
      'sport': 'activity',
      'class': 'activity',
      'practice': 'activity',
      'game': 'activity',
      'lesson': 'activity',
      
      'birthday': 'birthday',
      'bday': 'birthday',
      'celebration': 'birthday',
      
      'meeting': 'meeting',
      'family meeting': 'meeting',
      
      'date': 'date-night',
      'date night': 'date-night',
      'date-night': 'date-night',
      'datenight': 'date-night',
      'relationship': 'date-night',
      
      'task': 'task',
      'chore': 'task',
      'homework': 'task',
      'assignment': 'task',
      
      'general': 'general'
    };
    
    // Look up the standardized category or default to 'general'
    const standardizedCategory = categoryMapping[category_normalized] || 'general';
    
    // Create standardized event object
    const standardizedEvent = {
      // Identity fields
      id: eventData.id || eventData.firestoreId || universalId,
      firestoreId: eventData.firestoreId || eventData.id || null,
      universalId: universalId,
      eventSignature: eventSignature,
      
      // Core event data
      title: eventData.title || eventData.summary || "Untitled Event",
      summary: eventData.summary || eventData.title || "Untitled Event",
      description: eventData.description || "",
      
      // Date information in all required formats
      date: dateObj.toISOString(),
      dateTime: dateObj.toISOString(),
      dateObj: dateObj,
      dateEndObj: dateEndObj,
      endDateTime: dateEndObj.toISOString(),
      start: {
        dateTime: dateObj.toISOString(),
        timeZone: eventData.start?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: dateEndObj.toISOString(),
        timeZone: eventData.end?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      
      // Classification
      location: eventData.location || "",
      coordinates: eventData.coordinates || null,
      category: standardizedCategory,
      eventType: standardizedCategory,
      
      // Relation fields
      familyId: eventData.familyId,
      userId: eventData.userId,
      childId: eventData.childId || null,
      childName: eventData.childName || null,
      attendingParentId: eventData.attendingParentId || null,
      
      // Family members attending
      attendees: attendees,
      
      // Document and provider relationships
      documents: Array.isArray(eventData.documents) ? eventData.documents : [],
      provider: eventData.provider || null,
      babysitter: eventData.babysitter || null,
      
      // Cross-tab linking
      linkedEntity: eventData.linkedEntity || null,
      
      // Type-specific details
      isFamilyMeeting: eventData.isFamilyMeeting || eventData.category === 'meeting' || false,
      cycleNumber: eventData.cycleNumber || null,
      taskPriority: eventData.taskPriority || null,
      
      // Recurrence information
      isRecurring: eventData.isRecurring || false,
      recurrence: eventData.recurrence || {
        frequency: 'never',
        days: [],
        endDate: ''
      },
      
      // Additional metadata
      extraDetails: {
        ...(eventData.extraDetails || {}),
        creationSource: eventData.extraDetails?.creationSource || eventData.source || "manual",
        parsedWithAI: eventData.extraDetails?.parsedWithAI || false,
        lastModified: new Date().toISOString()
      },
      
      // Source tracking
      source: eventData.source || eventData.extraDetails?.creationSource || "manual",
      
      // Timestamps
      createdAt: eventData.createdAt || new Date().toISOString(),
      updatedAt: eventData.updatedAt || new Date().toISOString()
    };
    
    // Remove any undefined values
    Object.keys(standardizedEvent).forEach(key => {
      if (standardizedEvent[key] === undefined) {
        delete standardizedEvent[key];
      }
    });
    
    return standardizedEvent;
  }
  
  /**
   * Add a new event to the database
   * @param {Object} eventData Event data to add
   * @param {string} userId User ID 
   * @param {string} familyId Family ID
   * @returns {Promise<Object>} Result with success flag
   */
  async addEvent(eventData, userId, familyId) {
    try {
      if (!userId) throw new Error("User ID is required");
      
      // Standardize and validate the event
      const standardizedEvent = this.standardizeEvent({
        ...eventData,
        userId,
        familyId
      });
      
      // Check for duplicates first
      try {
        const eventsQuery = query(
          collection(db, "events"),
          where("eventSignature", "==", standardizedEvent.eventSignature),
          where("userId", "==", userId)
        );
        
        const querySnapshot = await getDocs(eventsQuery);
        
        if (!querySnapshot.empty) {
          // Found potential duplicate
          const existingEvent = querySnapshot.docs[0].data();
          
          // Update cache with the existing event
          this.eventCache.set(existingEvent.universalId, existingEvent);
          
          return {
            success: true,
            eventId: existingEvent.firestoreId,
            universalId: existingEvent.universalId,
            isDuplicate: true,
            existingEvent: existingEvent
          };
        }
      } catch (dupError) {
        // Log but continue even if duplicate check fails
        console.warn("Duplicate check failed:", dupError);
      }
      
      // Save to Firestore with retry
      let firestoreId = null;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          // Create a new document in the events collection
          const eventCollection = collection(db, "events");
          const docRef = doc(eventCollection);
          firestoreId = docRef.id;
          
          // Add the Firestore ID to the event data
          const eventToSave = {
            ...standardizedEvent,
            firestoreId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          // Save to Firestore
          await setDoc(docRef, eventToSave);
          
          // Success - break the retry loop
          break;
        } catch (saveError) {
          console.error(`Error on save attempt ${attempt}:`, saveError);
          
          if (attempt === 3) throw saveError;
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
        }
      }
      
      // Update cache
      this.eventCache.set(standardizedEvent.universalId, {
        ...standardizedEvent,
        firestoreId
      });
      
      // Notify listeners
      this.notifyListeners('add', {
        ...standardizedEvent,
        firestoreId
      });
      
      return {
        success: true,
        eventId: firestoreId,
        universalId: standardizedEvent.universalId
      };
    } catch (error) {
      console.error("Error adding event:", error);
      
      // Create last-ditch attempt to save event to localStorage
      if (typeof window !== 'undefined') {
        try {
          const pendingEvents = JSON.parse(localStorage.getItem('pendingEvents') || '[]');
          pendingEvents.push({
            event: eventData,
            timestamp: Date.now(),
            userId,
            familyId
          });
          localStorage.setItem('pendingEvents', JSON.stringify(pendingEvents));
          console.log("Event saved to localStorage as fallback");
        } catch (localStorageError) {
          console.error("LocalStorage fallback failed:", localStorageError);
        }
      }
      
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Update an existing event
   * @param {string} eventId Event ID to update
   * @param {Object} updateData Updated event data
   * @param {string} userId User ID
   * @returns {Promise<Object>} Result with success flag
   */
  async updateEvent(eventId, updateData, userId) {
    try {
      // Get the event
      const eventRef = doc(db, "events", eventId);
      const eventSnapshot = await getDoc(eventRef);
      
      if (!eventSnapshot.exists()) {
        throw new Error(`Event with ID ${eventId} not found`);
      }
      
      const existingEvent = eventSnapshot.data();
      
      // Create updated event
      const updatedEvent = this.standardizeEvent({
        ...existingEvent,
        ...updateData,
        firestoreId: eventId,
        updatedAt: new Date().toISOString()
      });
      
      // Save to Firestore
      await updateDoc(eventRef, {
        ...updatedEvent,
        updatedAt: serverTimestamp()
      });
      
      // Update cache
      this.eventCache.set(updatedEvent.universalId, updatedEvent);
      
      // Notify listeners
      this.notifyListeners('update', updatedEvent);
      
      return {
        success: true,
        eventId,
        universalId: updatedEvent.universalId
      };
    } catch (error) {
      console.error("Error updating event:", error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Delete an event from the database
   * @param {string} eventId Event ID to delete
   * @param {string} userId User ID
   * @returns {Promise<Object>} Result with success flag
   */
  async deleteEvent(eventId, userId) {
    try {
      // Get the event
      const eventRef = doc(db, "events", eventId);
      const eventSnapshot = await getDoc(eventRef);
      
      if (!eventSnapshot.exists()) {
        throw new Error(`Event with ID ${eventId} not found`);
      }
      
      const existingEvent = eventSnapshot.data();
      
      // Delete from Firestore
      await deleteDoc(eventRef);
      
      // Remove from cache
      this.eventCache.delete(existingEvent.universalId);
      
      // Notify listeners
      this.notifyListeners('delete', {
        id: eventId,
        universalId: existingEvent.universalId
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error deleting event:", error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get all events for a user
   * @param {string} userId User ID
   * @param {Date} startDate Optional start date for filtering
   * @param {Date} endDate Optional end date for filtering
   * @returns {Promise<Array>} List of events
   */
  async getEventsForUser(userId, startDate = null, endDate = null) {
    try {
      if (!userId) throw new Error("User ID is required");
      
      // Default date range if not provided
      if (!startDate) {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
      }
      
      if (!endDate) {
        endDate = new Date();
        endDate.setDate(endDate.getDate() + 90); // Extend to 3 months for better coverage
      }
      
      // Query Firestore
      const eventsQuery = query(
        collection(db, "events"),
        where("userId", "==", userId)
      );
      
      const querySnapshot = await getDocs(eventsQuery);
      const events = [];
      
      // Process results
      querySnapshot.forEach((doc) => {
        try {
          const eventData = doc.data();
          const standardizedEvent = this.standardizeEvent({
            ...eventData,
            firestoreId: doc.id
          });
          
          // Skip filtering by date to ensure we have all events
          events.push(standardizedEvent);
          
          // Update cache
          this.eventCache.set(standardizedEvent.universalId, standardizedEvent);
        } catch (docError) {
          console.error(`Error processing event document ${doc.id}:`, docError);
        }
      });
      
      // Sort by date
      return events.sort((a, b) => {
        try {
          return a.dateObj - b.dateObj;
        } catch (e) {
          return 0; // If date parsing fails, don't change order
        }
      });
    } catch (error) {
      console.error("Error getting events:", error);
      return [];
    }
  }
  
  /**
   * Get a specific event by ID
   * @param {string} eventId Event ID to retrieve
   * @returns {Promise<Object|null>} Event object or null if not found
   */
  async getEventById(eventId) {
    try {
      // Check cache first
      const cachedEvent = Array.from(this.eventCache.values())
        .find(event => event.firestoreId === eventId || event.id === eventId || event.universalId === eventId);
      
      if (cachedEvent) return cachedEvent;
      
      // Get from Firestore
      const eventRef = doc(db, "events", eventId);
      const eventSnapshot = await getDoc(eventRef);
      
      if (!eventSnapshot.exists()) {
        return null;
      }
      
      const eventData = eventSnapshot.data();
      const standardizedEvent = this.standardizeEvent({
        ...eventData,
        firestoreId: eventId
      });
      
      // Update cache
      this.eventCache.set(standardizedEvent.universalId, standardizedEvent);
      
      return standardizedEvent;
    } catch (error) {
      console.error("Error getting event:", error);
      return null;
    }
  }
  
  /**
   * Get events for a specific family cycle
   * @param {string} familyId Family ID
   * @param {number} cycleNumber Cycle number
   * @returns {Promise<Array>} List of events for the cycle
   */
  async getEventsForCycle(familyId, cycleNumber) {
    try {
      if (!familyId) throw new Error("Family ID is required");
      
      // Query for cycle events
      const eventsQuery = query(
        collection(db, "events"),
        where("familyId", "==", familyId),
        where("cycleNumber", "==", cycleNumber)
      );
      
      const querySnapshot = await getDocs(eventsQuery);
      const events = [];
      
      querySnapshot.forEach((doc) => {
        const eventData = doc.data();
        const standardizedEvent = this.standardizeEvent({
          ...eventData,
          firestoreId: doc.id
        });
        
        events.push(standardizedEvent);
        
        // Update cache
        this.eventCache.set(standardizedEvent.universalId, standardizedEvent);
      });
      
      return events;
    } catch (error) {
      console.error("Error getting cycle events:", error);
      return [];
    }
  }
  
  /**
   * Clear the event cache
   * @returns {boolean} Success flag
   */
  clearCache() {
    console.log("Clearing event cache");
    this.eventCache.clear();
    this.lastRefresh = Date.now();
    return true;
  }
  
  /**
   * Check for and recover pending events from localStorage
   * @returns {Promise<void>}
   */
  async checkAndRecoverPendingEvents() {
    if (typeof window === 'undefined') return;
    
    try {
      const pendingEvents = JSON.parse(localStorage.getItem('pendingEvents') || '[]');
      
      if (pendingEvents.length > 0) {
        console.log(`Found ${pendingEvents.length} pending events to recover`);
        
        for (const item of pendingEvents) {
          try {
            await this.addEvent(item.event, item.userId, item.familyId);
          } catch (error) {
            console.error("Error recovering event:", error);
          }
        }
        
        // Clear pending events after recovery attempt
        localStorage.removeItem('pendingEvents');
      }
    } catch (error) {
      console.error("Error checking for pending events:", error);
    }
  }
  
  /**
   * Refresh all events from the database
   * @param {string} userId User ID
   * @param {string} familyId Family ID
   * @param {number} cycleNumber Optional cycle number
   * @returns {Promise<Array>} Refreshed events
   */
  async refreshEvents(userId, familyId = null, cycleNumber = null) {
    if (!userId) return [];
    
    // Prevent parallel refreshes
    if (this.refreshInProgress) {
      console.log("Refresh already in progress, skipping duplicate call");
      return Array.from(this.eventCache.values());
    }
    
    this.refreshInProgress = true;
    
    try {
      // Clear cache
      this.eventCache.clear();
      this.lastRefresh = Date.now();
      
      // Choose query based on parameters
      let events = [];
      
      if (cycleNumber && familyId) {
        events = await this.getEventsForCycle(familyId, cycleNumber);
      } else {
        events = await this.getEventsForUser(userId);
      }
      
      return events;
    } catch (error) {
      console.error("Error refreshing events:", error);
      return [];
    } finally {
      // Release the lock with a small delay
      setTimeout(() => {
        this.refreshInProgress = false;
      }, 200);
    }
  }
  
  /**
   * Subscribe to event changes
   * @param {Function} callback Callback function to call on changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    if (typeof callback === 'function') {
      this.listeners.add(callback);
      return () => this.listeners.delete(callback);
    }
    return () => {};
  }
  
  /**
   * Notify all listeners of event changes
   * @param {string} action Action type (add, update, delete)
   * @param {Object} event Event object
   */
  notifyListeners(action, event) {
    this.listeners.forEach(listener => {
      try {
        listener(action, event);
      } catch (error) {
        console.error("Error in event listener:", error);
      }
    });
    
    // Also dispatch DOM events for legacy components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('force-calendar-refresh'));
      window.dispatchEvent(new CustomEvent(`calendar-event-${action}d`, {
        detail: { 
          eventId: event.id || event.firestoreId,
          universalId: event.universalId,
          event: event
        }
      }));
    }
  }
}

// Create and export a singleton instance
const improvedEventStore = new ImprovedEventStore();
export default improvedEventStore;