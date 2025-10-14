// src/services/EventStore.fixed.js - Fixed version that prevents event loops
import { db } from './firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, 
  query, where, serverTimestamp, limit
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

class EventStore {
  constructor() {
    this.listeners = new Set();
    this.eventCache = new Map();
    this.lastRefresh = Date.now();
    this._refreshInProgress = false;
    this._lastRefreshResult = null;
    this._standardizationLock = new Set(); // Track events being standardized to prevent loops
    this._notificationTimes = new Map(); // Track notification times to prevent loops
    this._requestsInProgress = {}; // Track API requests in progress
    
    // Check for pending events on initialization
    if (typeof window !== 'undefined') {
      setTimeout(() => this.checkAndRecoverPendingEvents(), 5000);
    }
  }

  /**
   * Standardize event data with strong anti-recursion protections
   */
  standardizeEvent(eventData) {
    if (!eventData) {
      console.warn('Attempted to standardize null or undefined event');
      return { 
        title: "Empty Event", 
        dateTime: new Date().toISOString(),
        _standardized: true,
        id: `empty-${Date.now()}`
      };
    }
    
    // If event is already standardized, return as-is
    if (eventData._standardized === true) {
      return eventData;
    }
    
    // Get event ID for tracking
    const eventId = eventData.id || eventData.firestoreId || eventData.universalId;
    
    // Prevent recursive standardization
    if (eventId && this._standardizationLock.has(eventId)) {
      console.warn(`Prevented recursive standardization for event: ${eventId}`);
      return { ...eventData, _standardized: true };
    }
    
    // Add to lock set if we have an ID
    if (eventId) {
      this._standardizationLock.add(eventId);
    }
    
    try {
      // Get date objects with safe error handling
      let startDate = new Date();
      try {
        if (eventData.dateObj instanceof Date && !isNaN(eventData.dateObj.getTime())) {
          startDate = new Date(eventData.dateObj);
        } else if (eventData.start?.dateTime) {
          startDate = new Date(eventData.start.dateTime);
        } else if (eventData.dateTime) {
          startDate = new Date(eventData.dateTime);
        } else if (eventData.date) {
          startDate = new Date(eventData.date);
        }
      } catch (error) {
        console.error("Error parsing start date, using current time instead");
        startDate = new Date();
      }
      
      // Calculate end date with error handling
      let endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour
      try {
        if (eventData.dateEndObj instanceof Date && !isNaN(eventData.dateEndObj.getTime())) {
          endDate = new Date(eventData.dateEndObj);
        } else if (eventData.end?.dateTime) {
          endDate = new Date(eventData.end.dateTime);
        } else if (eventData.endDateTime) {
          endDate = new Date(eventData.endDateTime);
        }
      } catch (error) {
        console.error("Error parsing end date, using start date + 1 hour instead");
      }
      
      // Generate a unique ID if not provided
      const universalId = eventData.universalId || eventData.id || `event-${uuidv4()}`;
      
      // Create signature for deduplication
      const title = eventData.title || eventData.summary || "";
      const childInfo = eventData.childId || eventData.childName || "";
      const category = eventData.eventType || eventData.category || "general";
      const dateString = startDate.toISOString().split('T')[0];
      const signatureBase = `${title}-${dateString}-${childInfo}-${category}`.toLowerCase();
      const eventSignature = `sig-${this.hashString(signatureBase)}`;
      
      // Return a standardized event
      return {
        // Identity fields
        id: eventData.id || eventData.firestoreId || universalId,
        firestoreId: eventData.firestoreId || eventData.id || null,
        universalId: universalId,
        eventSignature: eventSignature,
        
        // Flag to prevent re-standardization
        _standardized: true,
        
        // Core event data
        title: eventData.title || eventData.summary || "Untitled Event",
        summary: eventData.summary || eventData.title || "Untitled Event",
        description: eventData.description || "",
        
        // Date information
        date: startDate.toISOString(),
        dateTime: startDate.toISOString(),
        dateObj: startDate,
        dateEndObj: endDate,
        endDateTime: endDate.toISOString(),
        start: {
          dateTime: startDate.toISOString(),
          timeZone: eventData.start?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: eventData.end?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        
        // Classification
        location: eventData.location || "",
        category: eventData.category || eventData.eventType || "general",
        eventType: eventData.eventType || eventData.category || "general",
        
        // Relation fields
        familyId: eventData.familyId,
        userId: eventData.userId,
        childId: eventData.childId || null,
        childName: eventData.childName || null,
        attendingParentId: eventData.attendingParentId || null,
        siblingIds: Array.isArray(eventData.siblingIds) ? eventData.siblingIds : [],
        siblingNames: Array.isArray(eventData.siblingNames) ? eventData.siblingNames : [],
        
        // Relationships
        attendees: Array.isArray(eventData.attendees) ? eventData.attendees : [],
        documents: Array.isArray(eventData.documents) ? eventData.documents : [],
        providers: Array.isArray(eventData.providers) ? eventData.providers : [],
        
        // Specific fields
        doctorName: eventData.doctorName || eventData.appointmentDetails?.doctorName || null,
        appointmentDetails: eventData.appointmentDetails || null,
        activityDetails: eventData.activityDetails || null,
        
        // Additional metadata
        extraDetails: {
          ...(eventData.extraDetails || {}),
          creationSource: eventData.extraDetails?.creationSource || eventData.source || "manual",
          parsedWithAI: eventData.extraDetails?.parsedWithAI || false,
          lastStandardized: new Date().toISOString()
        },
        
        // Other fields
        source: eventData.source || eventData.extraDetails?.creationSource || "manual",
        linkedEntity: eventData.linkedEntity || null,
        reminders: eventData.reminders || { useDefault: true, overrides: [] },
        notes: eventData.notes || eventData.extraDetails?.notes || "",
        
        // Timestamps
        createdAt: eventData.createdAt || new Date().toISOString(),
        updatedAt: eventData.updatedAt || new Date().toISOString()
      };
    } finally {
      // Always remove from lock set
      if (eventId) {
        this._standardizationLock.delete(eventId);
      }
    }
  }
  
  // Simple hash function for generating event signatures
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
   * Get events for a user with timeout protection
   */
  async getEventsForUser(userId, startDate = null, endDate = null) {
    if (!userId) {
      console.warn("User ID is required for getEventsForUser");
      return [];
    }
    
    // Default date range
    if (!startDate) {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }
    
    if (!endDate) {
      endDate = new Date();
      endDate.setDate(endDate.getDate() + 60);
    }
    
    // Check if a refresh is already in progress
    if (this._refreshInProgress) {
      console.log("Event refresh already in progress, returning cached result");
      return this._lastRefreshResult || [];
    }
    
    // Check if we have a request in progress for this user
    const requestKey = `getEvents_${userId}`;
    if (this._requestsInProgress[requestKey]) {
      console.log("Request already in progress for this user, returning cached result");
      return this._lastRefreshResult || [];
    }
    
    // Set request in progress flag
    this._requestsInProgress[requestKey] = true;
    this._refreshInProgress = true;
    
    try {
      // Create a query with limit to prevent overwhelming the client
      const eventsQuery = query(
        collection(db, "events"),
        where("userId", "==", userId),
        limit(500) // Reasonable limit to prevent issues
      );
      
      const querySnapshot = await getDocs(eventsQuery);
      const events = [];
      
      // Process each event
      querySnapshot.forEach((doc) => {
        try {
          const eventData = doc.data();
          
          // Skip standardization if already standardized
          const standardizedEvent = eventData._standardized === true
            ? eventData
            : this.standardizeEvent({
                ...eventData,
                firestoreId: doc.id
              });
          
          // Parse event date
          let eventStartDate;
          try {
            if (standardizedEvent.start?.dateTime) {
              eventStartDate = new Date(standardizedEvent.start.dateTime);
            } else if (standardizedEvent.dateTime) {
              eventStartDate = new Date(standardizedEvent.dateTime);
            } else if (standardizedEvent.dateObj) {
              eventStartDate = standardizedEvent.dateObj;
            } else if (standardizedEvent.date) {
              eventStartDate = new Date(standardizedEvent.date);
            } else {
              eventStartDate = new Date();
            }
          } catch (dateError) {
            console.error(`Error parsing date for event ${doc.id}`);
            eventStartDate = new Date();
          }
          
          // Always include the event if date parsing failed
          const dateParsingFailed = isNaN(eventStartDate.getTime());
          const withinDateRange = dateParsingFailed || 
                              (eventStartDate >= startDate && eventStartDate <= endDate);
          
          if (withinDateRange) {
            events.push(standardizedEvent);
            
            // Update cache
            this.eventCache.set(standardizedEvent.universalId, standardizedEvent);
          }
        } catch (docError) {
          console.error(`Error processing event document ${doc.id}`);
        }
      });
      
      // Sort by date
      const sortedEvents = events.sort((a, b) => {
        try {
          const dateA = new Date(a.start?.dateTime || a.dateTime || a.date || Date.now());
          const dateB = new Date(b.start?.dateTime || b.dateTime || b.date || Date.now());
          return dateA - dateB;
        } catch (e) {
          return 0;
        }
      });
      
      // Store the result
      this._lastRefreshResult = sortedEvents;
      
      return sortedEvents;
    } catch (error) {
      console.error("Error getting events:", error);
      return [];
    } finally {
      // Clear flags with delay to prevent immediate re-entry
      setTimeout(() => {
        this._refreshInProgress = false;
        this._requestsInProgress[requestKey] = false;
      }, 500);
    }
  }
  
  /**
   * Get a specific event by ID
   */
  async getEventById(eventId) {
    if (!eventId) {
      console.warn("Event ID is required for getEventById");
      return null;
    }
    
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
   * Add a new event
   */
  async addEvent(eventData, userId, familyId) {
    if (!userId) {
      console.warn("User ID is required for addEvent");
      return { success: false, error: "User ID is required" };
    }
    
    const requestKey = `addEvent_${Date.now()}`;
    
    try {
      // Prevent duplicate requests
      if (this._requestsInProgress[requestKey]) {
        return { success: false, error: "Request already in progress" };
      }
      
      this._requestsInProgress[requestKey] = true;
      
      // Standardize the event data
      const standardizedEvent = this.standardizeEvent({
        ...eventData,
        userId,
        familyId
      });
      
      // Check for duplicates
      try {
        const eventsQuery = query(
          collection(db, "events"),
          where("eventSignature", "==", standardizedEvent.eventSignature),
          where("userId", "==", userId),
          limit(1)
        );
        
        const querySnapshot = await getDocs(eventsQuery);
        
        if (!querySnapshot.empty) {
          // Found duplicate, return it
          const existingEvent = querySnapshot.docs[0].data();
          
          this.eventCache.set(existingEvent.universalId, existingEvent);
          
          return {
            success: true,
            eventId: existingEvent.firestoreId,
            universalId: existingEvent.universalId,
            isDuplicate: true,
            existingEvent
          };
        }
      } catch (dupError) {
        console.warn("Duplicate check failed:", dupError);
      }
      
      // Create a new document
      const eventCollection = collection(db, "events");
      const docRef = doc(eventCollection);
      const firestoreId = docRef.id;
      
      // Add Firestore ID to the event
      const eventToSave = {
        ...standardizedEvent,
        firestoreId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Save to Firestore
      await setDoc(docRef, eventToSave);
      
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
      
      // Try to save to localStorage as fallback
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
        } catch (localStorageError) {
          console.error("LocalStorage fallback failed:", localStorageError);
        }
      }
      
      return { success: false, error: error.message };
    } finally {
      // Clear flag
      setTimeout(() => {
        this._requestsInProgress[requestKey] = false;
      }, 500);
    }
  }
  
  /**
   * Update an existing event
   */
  async updateEvent(eventId, updateData, userId) {
    if (!eventId) {
      console.warn("Event ID is required for updateEvent");
      return { success: false, error: "Event ID is required" };
    }
    
    const requestKey = `updateEvent_${eventId}`;
    
    try {
      // Prevent duplicate requests
      if (this._requestsInProgress[requestKey]) {
        return { success: false, error: "Request already in progress" };
      }
      
      this._requestsInProgress[requestKey] = true;
      
      // Get the event from Firestore directly (not from cache)
      const eventRef = doc(db, "events", eventId);
      const eventSnapshot = await getDoc(eventRef);
      
      if (!eventSnapshot.exists()) {
        throw new Error(`Event with ID ${eventId} not found`);
      }
      
      const existingEvent = eventSnapshot.data();
      
      // Combine existing data with update data
      const mergedEvent = {
        ...existingEvent,
        ...updateData,
        firestoreId: eventId,
        universalId: existingEvent.universalId || eventId,
        updatedAt: new Date().toISOString()
      };
      
      // Create a standardized event
      const updatedEvent = this.standardizeEvent(mergedEvent);
      
      // Save to Firestore
      await updateDoc(eventRef, {
        ...updatedEvent,
        updatedAt: serverTimestamp()
      });
      
      // Update cache
      this.eventCache.set(updatedEvent.universalId, updatedEvent);
      
      // Also update any cache entries with matching firestoreId
      for (const [key, cachedEvent] of this.eventCache.entries()) {
        if (cachedEvent.firestoreId === eventId && cachedEvent.universalId !== updatedEvent.universalId) {
          this.eventCache.set(key, updatedEvent);
        }
      }
      
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
    } finally {
      // Clear flag
      setTimeout(() => {
        this._requestsInProgress[requestKey] = false;
      }, 500);
    }
  }
  
  /**
   * Delete an event
   */
  async deleteEvent(eventId, userId) {
    if (!eventId) {
      console.warn("Event ID is required for deleteEvent");
      return { success: false, error: "Event ID is required" };
    }
    
    const requestKey = `deleteEvent_${eventId}`;
    
    try {
      // Prevent duplicate requests
      if (this._requestsInProgress[requestKey]) {
        return { success: false, error: "Request already in progress" };
      }
      
      this._requestsInProgress[requestKey] = true;
      
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
    } finally {
      // Clear flag
      setTimeout(() => {
        this._requestsInProgress[requestKey] = false;
      }, 500);
    }
  }
  
  /**
   * Notify listeners with anti-loop protection
   */
  notifyListeners(action, event) {
    // Skip if we don't have a valid event
    if (!event || (!event.id && !event.firestoreId && !event.universalId)) {
      console.warn("Attempted to notify with invalid event");
      return;
    }
    
    // Get unique key for this event and action
    const eventKey = `${event.firestoreId || event.id || event.universalId}-${action}`;
    const now = Date.now();
    const lastNotification = this._notificationTimes.get(eventKey) || 0;
    
    // Skip if we've notified about this exact event and action in the last 2 seconds
    if (now - lastNotification < 2000) {
      return;
    }
    
    // Update the timestamp
    this._notificationTimes.set(eventKey, now);
    
    // Clean up old entries from the map (keep only last 100 entries)
    if (this._notificationTimes.size > 100) {
      const entries = Array.from(this._notificationTimes.entries());
      entries.sort((a, b) => a[1] - b[1]);
      
      // Delete oldest entries
      for (let i = 0; i < entries.length - 100; i++) {
        this._notificationTimes.delete(entries[i][0]);
      }
    }
    
    // Call all registered listeners
    this.listeners.forEach(listener => {
      try {
        listener(action, event);
      } catch (error) {
        console.error("Error in event listener:", error);
      }
    });
    
    // Dispatch DOM events for compatibility
    if (typeof window !== 'undefined') {
      // Dispatch with minimal data to prevent large event objects
      window.dispatchEvent(new CustomEvent('force-calendar-refresh', {
        detail: {
          source: 'event-store-notify',
          eventId: event.firestoreId || event.id || event.universalId,
          universalId: event.universalId,
          timestamp: now,
          action: action
        }
      }));
    }
  }
  
  /**
   * Subscribe to event changes
   */
  subscribe(callback) {
    if (typeof callback === 'function') {
      this.listeners.add(callback);
      return () => this.listeners.delete(callback);
    }
    return () => {};
  }
  
  /**
   * Clear the event cache
   */
  clearCache() {
    this.eventCache.clear();
    this.lastRefresh = Date.now();
    return true;
  }
  
  /**
   * Refresh events with protection against recursive calls
   */
  async refreshEvents(userId, familyId = null, cycleNumber = null) {
    if (!userId) return [];
    
    // Prevent recursive refreshes
    if (this._refreshInProgress) {
      console.log("Refresh already in progress, skipping duplicate call");
      return this._lastRefreshResult || [];
    }
    
    // Set flag to prevent recursive calls
    this._refreshInProgress = true;
    
    try {
      // Clear cache
      this.eventCache.clear();
      this.lastRefresh = Date.now();
      
      // Query database without filters
      const eventsQuery = query(
        collection(db, "events"),
        where("userId", "==", userId),
        limit(500) // Reasonable limit
      );
      
      const querySnapshot = await getDocs(eventsQuery);
      const events = [];
      
      // Process results
      querySnapshot.forEach((doc) => {
        try {
          const eventData = doc.data();
          
          // Skip standardization if already standardized
          const standardizedEvent = eventData._standardized ? 
            eventData : 
            this.standardizeEvent({
              ...eventData,
              firestoreId: doc.id
            });
          
          // Add all events
          events.push(standardizedEvent);
          
          // Update cache
          this.eventCache.set(standardizedEvent.universalId, standardizedEvent);
        } catch (docError) {
          console.error(`Error processing event document ${doc.id}`);
        }
      });
      
      // Store the result
      this._lastRefreshResult = events;
      
      return events;
    } catch (error) {
      console.error("Error in direct refresh:", error);
      
      // Fall back to regular getEventsForUser
      const fallbackEvents = await this.getEventsForUser(userId);
      this._lastRefreshResult = fallbackEvents;
      return fallbackEvents;
    } finally {
      // Clear flag with delay to prevent immediate re-entry
      setTimeout(() => {
        this._refreshInProgress = false;
      }, 500);
    }
  }
  
  /**
   * Recover pending events from localStorage
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
        
        // Clear pending events
        localStorage.removeItem('pendingEvents');
      }
    } catch (error) {
      console.error("Error checking for pending events:", error);
    }
  }
}

// Create and export a singleton instance
const eventStore = new EventStore();
export default eventStore;