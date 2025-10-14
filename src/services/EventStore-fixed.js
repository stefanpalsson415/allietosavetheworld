// src/services/EventStore.js
import { db } from './firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  deleteDoc, query, where, serverTimestamp 
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

class EventStore {
  constructor() {
    this.listeners = new Set();
    this.eventCache = new Map();
    this.lastRefresh = Date.now();
    this._refreshInProgress = false;
    this._lastRefreshResult = null;
    
    // Check for pending events on initialization
    if (typeof window !== 'undefined') {
      setTimeout(() => this.checkAndRecoverPendingEvents(), 5000);
    }
  }

  // FIXED standardizeEvent method with better logging control and loop prevention
  standardizeEvent(eventData) {
    // CRITICAL FIX: If event already has _standardized flag, return it as-is to prevent loops
    if (eventData._standardized === true) {
      return eventData;
    }

    const isDevelopment = process.env.NODE_ENV === 'development';
    const debugLogging = false; // Set to false to reduce console noise
    
    // Get date objects from various possible sources with improved error handling
    let startDate = null;
    try {
      if (debugLogging) {
        console.log("Standardizing event:", eventData.title || "Untitled", "Source:", eventData.source || "unknown");
      }
      
      if (eventData.dateObj instanceof Date && !isNaN(eventData.dateObj.getTime())) {
        startDate = new Date(eventData.dateObj);
      } else if (eventData.start?.dateTime) {
        startDate = new Date(eventData.start.dateTime);
      } else if (eventData.dateTime) {
        startDate = new Date(eventData.dateTime);
      } else if (eventData.date) {
        if (typeof eventData.date === 'string' && eventData.date.includes('T')) {
          // Handle ISO date strings
          startDate = new Date(eventData.date);
        } else if (typeof eventData.date === 'string') {
          // Handle date-only strings (add time component)
          startDate = new Date(eventData.date + 'T12:00:00');
        } else {
          // Handle Date objects
          startDate = new Date(eventData.date);
        }
      } else {
        startDate = new Date();
      }
    } catch (error) {
      console.error("Error parsing start date:", error, "Using current time instead");
      startDate = new Date();
    }

    // Calculate end date (default 1 hour duration) with better error handling
    let endDate = null;
    try {
      if (eventData.dateEndObj instanceof Date && !isNaN(eventData.dateEndObj.getTime())) {
        endDate = new Date(eventData.dateEndObj);
      } else if (eventData.end?.dateTime) {
        endDate = new Date(eventData.end.dateTime);
      } else if (eventData.endDateTime) {
        endDate = new Date(eventData.endDateTime);
      } else {
        endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      }
    } catch (error) {
      console.error("Error parsing end date:", error, "Using start date + 1 hour instead");
      endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    }

    // Make sure startDate and endDate are valid dates
    if (isNaN(startDate.getTime())) {
      console.warn("Invalid start date detected, using current time instead");
      startDate = new Date();
    }

    if (isNaN(endDate.getTime())) {
      console.warn("Invalid end date detected, using start date + 1 hour instead");
      endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    }

    // Generate a unique, permanent ID if not provided 
    const universalId = eventData.universalId || eventData.id || `event-${uuidv4()}`;

    // Create signature for deduplication with more reliable field access
    const title = eventData.title || eventData.summary || "";
    const childInfo = eventData.childId || eventData.childName || "";
    const category = eventData.eventType || eventData.category || "general";
    const dateString = startDate.toISOString().split('T')[0];
    
    const signatureBase = `${title}-${dateString}-${childInfo}-${category}`.toLowerCase();
    
    // Calculate a deterministic hash for this event to aid in deduplication
    const eventSignature = `sig-${this.hashString(signatureBase)}`;

    // Standardize attendees format if provided
    let attendees = [];
    if (eventData.attendees && Array.isArray(eventData.attendees)) {
      attendees = eventData.attendees.map(attendee => {
        // Handle both string and object formats
        if (typeof attendee === 'string') {
          return { id: attendee, name: attendee, role: 'general' };
        }
        
        // Ensure ID, name, and role always exist
        return {
          id: attendee.id || 'unknown-id',
          name: attendee.name || 'Unknown Attendee',
          role: attendee.role || 'general',
          ...attendee
        };
      });
    }

    // Ensure we have document and providers arrays
    const documents = Array.isArray(eventData.documents) ? eventData.documents : [];
    const providers = Array.isArray(eventData.providers) ? eventData.providers : [];

    // Return a fully standardized event object with ALL required fields
    const standardizedEvent = {
      // Identity fields
      id: eventData.id || eventData.firestoreId || universalId,
      firestoreId: eventData.firestoreId || eventData.id || null,
      universalId: universalId,
      eventSignature: eventSignature,
      
      // CRITICAL FIX: Add flags to prevent re-standardization
      _standardized: true,
      _stableId: universalId,
      
      // Core event data
      title: eventData.title || eventData.summary || "Untitled Event",
      summary: eventData.summary || eventData.title || "Untitled Event",
      description: eventData.description || "",
      
      // Date information in all required formats for backwards compatibility
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
      
      // Family members attending - now properly standardized
      attendees: attendees,
      
      // Document and provider relationships - now properly standardized
      documents: documents,
      providers: providers,
      
      // Doctor name (crucial for appointments) - explicitly added
      doctorName: eventData.doctorName || eventData.appointmentDetails?.doctorName || null,
      
      // Add appointment-specific details if this is a medical appointment
      appointmentDetails: eventData.appointmentDetails || null,
      
      // Add activity-specific details if present
      activityDetails: eventData.activityDetails || null,
      
      // Additional metadata
      extraDetails: {
        ...(eventData.extraDetails || {}),
        // Ensure these critical fields exist for chat-created events
        creationSource: eventData.extraDetails?.creationSource || eventData.source || "manual",
        parsedWithAI: eventData.extraDetails?.parsedWithAI || false,
        // Add our last standardized timestamp to track freshness
        lastStandardized: new Date().toISOString()
      },
      
      // Keep original source field but ensure it exists
      source: eventData.source || eventData.extraDetails?.creationSource || "manual",
      linkedEntity: eventData.linkedEntity || null,
      
      // Enhanced context
      reminders: eventData.reminders || {
        useDefault: true,
        overrides: []
      },
      notes: eventData.notes || eventData.extraDetails?.notes || "",
      
      // Timestamps
      createdAt: eventData.createdAt || new Date().toISOString(),
      updatedAt: eventData.updatedAt || new Date().toISOString()
    };
    
    // Only log in development to reduce console spam
    if (debugLogging && isDevelopment) {
      console.log("Standardized event:", {
        title: standardizedEvent.title,
        date: standardizedEvent.dateObj.toDateString(),
        source: standardizedEvent.source,
        _standardized: standardizedEvent._standardized
      });
    }

    // Ensure we don't have undefined values that might cause Firebase errors
    Object.keys(standardizedEvent).forEach(key => {
      if (standardizedEvent[key] === undefined) {
        delete standardizedEvent[key];
      }
    });

    // Ensure critical fields have fallback values
    if (!standardizedEvent.title) standardizedEvent.title = "Untitled Event";
    if (!standardizedEvent.eventType) standardizedEvent.eventType = "general";
    if (!standardizedEvent.category) standardizedEvent.category = "general";

    return standardizedEvent;
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

  // FIXED updateEvent method with better date handling
  async updateEvent(eventId, updateData, userId) {
    try {
      if (!eventId) throw new Error("Event ID is required for update");
      
      const debugLogging = false; // Set to false to reduce console noise
      
      if (debugLogging) {
        console.log("Updating event:", { 
          eventId, 
          updateFields: Object.keys(updateData), 
          hasDate: !!updateData.date || !!updateData.dateTime || !!updateData.start?.dateTime 
        });
      }
      
      // Get the event from Firestore directly (not from cache)
      const eventRef = doc(db, "events", eventId);
      const eventSnapshot = await getDoc(eventRef);
      
      if (!eventSnapshot.exists()) {
        throw new Error(`Event with ID ${eventId} not found`);
      }
      
      const existingEvent = eventSnapshot.data();
      
      // Get the current date object from existing event
      let currentDate;
      try {
        currentDate = new Date(existingEvent.dateTime || existingEvent.start?.dateTime || existingEvent.date);
      } catch (dateError) {
        console.error("Error parsing existing date:", dateError);
        currentDate = new Date();
      }
      
      // Check if updateData has a new date to use
      let newDate = null;
      try {
        if (updateData.dateObj instanceof Date && !isNaN(updateData.dateObj.getTime())) {
          newDate = new Date(updateData.dateObj);
        } else if (updateData.start?.dateTime) {
          newDate = new Date(updateData.start.dateTime);
        } else if (updateData.dateTime) {
          newDate = new Date(updateData.dateTime);
        } else if (updateData.date) {
          if (typeof updateData.date === 'string' && updateData.date.includes('T')) {
            newDate = new Date(updateData.date);
          } else {
            newDate = new Date(updateData.date);
          }
        }
      } catch (dateError) {
        console.error("Error parsing update date:", dateError);
      }
      
      // Combine the existing data with update data, prioritizing new values
      const mergedEvent = {
        ...existingEvent,
        ...updateData,
        firestoreId: eventId, // Always preserve the correct ID
        universalId: existingEvent.universalId || eventId,
        updatedAt: new Date().toISOString()
      };
      
      // Get dates from updateData with robust error handling
      let updatedStartDate = null; 
      let updatedEndDate = null;
      
      // 1. Try to get start date
      try {
        if (updateData.dateObj instanceof Date && !isNaN(updateData.dateObj.getTime())) {
          updatedStartDate = new Date(updateData.dateObj);
        } else if (updateData.start?.dateTime) {
          updatedStartDate = new Date(updateData.start.dateTime);
        } else if (updateData.dateTime) {
          updatedStartDate = new Date(updateData.dateTime);
        } else if (updateData.date) {
          updatedStartDate = new Date(updateData.date);
        } else {
          // Fallback to existing date
          updatedStartDate = new Date(existingEvent.dateTime || existingEvent.start?.dateTime || existingEvent.date || new Date());
        }
      } catch (dateError) {
        console.error("Error getting start date:", dateError);
        updatedStartDate = new Date();
      }
      
      // Check if updatedStartDate is valid
      if (isNaN(updatedStartDate.getTime())) {
        console.error("Invalid start date detected, using current time instead");
        updatedStartDate = new Date();
      }
      
      // 2. Try to get or calculate end date
      try {
        if (updateData.dateEndObj instanceof Date && !isNaN(updateData.dateEndObj.getTime())) {
          updatedEndDate = new Date(updateData.dateEndObj);
        } else if (updateData.end?.dateTime) {
          updatedEndDate = new Date(updateData.end.dateTime);
        } else if (updateData.endDateTime) {
          updatedEndDate = new Date(updateData.endDateTime);
        } else {
          // Keep the same duration as before
          const oldDuration = existingEvent.endDateTime ? 
            new Date(existingEvent.endDateTime).getTime() - new Date(existingEvent.dateTime).getTime() : 
            60 * 60 * 1000;
          
          updatedEndDate = new Date(updatedStartDate.getTime() + oldDuration);
        }
      } catch (endDateError) {
        console.error("Error calculating end date:", endDateError);
        updatedEndDate = new Date(updatedStartDate.getTime() + 60 * 60 * 1000);
      }
      
      // Check if updatedEndDate is valid
      if (isNaN(updatedEndDate.getTime())) {
        console.error("Invalid end date detected, using start date + 1 hour instead");
        updatedEndDate = new Date(updatedStartDate.getTime() + 60 * 60 * 1000);
      }
      
      // Make sure end date is not before start date
      if (updatedEndDate < updatedStartDate) {
        console.warn("End date is before start date, adding 1 hour to start date");
        updatedEndDate = new Date(updatedStartDate.getTime() + 60 * 60 * 1000);
      }
      
      // Override ALL date fields with the new date
      const explicitlySetDateFields = {
        // Date strings
        dateTime: updatedStartDate.toISOString(),
        date: updatedStartDate.toISOString(),
        endDateTime: updatedEndDate.toISOString(),
        
        // Date objects
        dateObj: updatedStartDate,
        dateEndObj: updatedEndDate,
        
        // Google Calendar format
        start: {
          ...(mergedEvent.start || {}),
          dateTime: updatedStartDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          ...(mergedEvent.end || {}),
          dateTime: updatedEndDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        
        // Extra debugging
        extraDetails: {
          ...(mergedEvent.extraDetails || {}),
          updatedDate: updatedStartDate.toISOString(),
          lastUpdateSource: 'event-store-force-update',
          lastUpdateTime: new Date().toISOString()
        }
      };
      
      // Apply all date fields to the merged event
      Object.assign(mergedEvent, explicitlySetDateFields);
      
      // Create updated event with standardization
      const updatedEvent = this.standardizeEvent(mergedEvent);
      
      // Save to Firestore with error handling and retries
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await updateDoc(eventRef, {
            ...updatedEvent,
            updatedAt: serverTimestamp()
          });
          
          if (debugLogging) {
            console.log(`Event ${eventId} updated successfully on attempt ${attempt}`);
          }
          break;
        } catch (updateError) {
          console.error(`Error updating event on attempt ${attempt}:`, updateError);
          
          if (attempt === 3) throw updateError;
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
        }
      }
      
      // Update cache and force remove any old cached versions with this ID
      this.eventCache.set(updatedEvent.universalId, updatedEvent);
      
      // Also update any cache entries with matching firestoreId
      for (const [key, cachedEvent] of this.eventCache.entries()) {
        if (cachedEvent.firestoreId === eventId && cachedEvent.universalId !== updatedEvent.universalId) {
          if (debugLogging) {
            console.log(`Updating additional cache entry with firestoreId ${eventId}`);
          }
          this.eventCache.set(key, updatedEvent);
        }
      }
      
      // Notify listeners with a more explicit update event
      this.notifyListeners('update', updatedEvent);
      
      // Schedule a deferred calendar refresh to ensure UI is updated
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('force-calendar-refresh', {
            detail: { 
              source: 'event-store-update',
              eventId: eventId,
              universalId: updatedEvent.universalId,
              timestamp: Date.now()
            }
          }));
        }
      }, 500);
      
      return {
        success: true,
        eventId,
        universalId: updatedEvent.universalId,
        date: updatedEvent.date // Include date for debugging
      };
    } catch (error) {
      console.error("Error updating event:", error);
      return { success: false, error: error.message };
    }
  }

  // Delete an event
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
        endDate.setDate(endDate.getDate() + 60);
      }
      
      // If we're already refreshing, don't run another query
      if (this._refreshInProgress) {
        return this._lastRefreshResult || [];
      }
      
      // Query Firestore - IMPROVED: No additional filters that might exclude events
      const eventsQuery = query(
        collection(db, "events"),
        where("userId", "==", userId)
      );
      
      const querySnapshot = await getDocs(eventsQuery);
      
      const events = [];
      
      // Process results with more robust logging
      querySnapshot.forEach((doc) => {
        try {
          const eventData = doc.data();
          const standardizedEvent = this.standardizeEvent({
            ...eventData,
            firestoreId: doc.id
          });
          
          // IMPROVED: More flexible date handling with fallbacks
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
            console.error(`Error parsing date for event ${doc.id}:`, dateError);
            eventStartDate = new Date(); // Fallback to current date
          }
          
          // Add event regardless of date if date parsing failed
          const dateParsingFailed = isNaN(eventStartDate.getTime());
          const withinDateRange = dateParsingFailed || 
                              (eventStartDate >= startDate && eventStartDate <= endDate);
          
          if (withinDateRange) {
            events.push(standardizedEvent);
            
            // Update cache
            this.eventCache.set(standardizedEvent.universalId, standardizedEvent);
          }
        } catch (docError) {
          console.error(`Error processing event document ${doc.id}:`, docError);
        }
      });
      
      // Sort by date with error handling
      return events.sort((a, b) => {
        try {
          const dateA = new Date(a.start?.dateTime || a.dateTime || a.date || Date.now());
          const dateB = new Date(b.start?.dateTime || b.dateTime || b.date || Date.now());
          return dateA - dateB;
        } catch (e) {
          return 0; // If date parsing fails, don't change order
        }
      });
    } catch (error) {
      console.error("Error getting events:", error);
      return [];
    }
  }

  // Get a specific event by ID
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

  // Add event method
  async addEvent(eventData, userId, familyId) {
    try {
      if (!userId) throw new Error("User ID is required");

      const debugLogging = false; // Set to false to reduce console noise
      
      // Log the attempt
      if (debugLogging) {
        console.log("EventStore: Adding event:", { 
          title: eventData.title || "Untitled", 
          type: eventData.eventType || "general",
          userId, 
          familyId
        });
      }

      // Standardize and validate the event
      const standardizedEvent = this.standardizeEvent({
        ...eventData,
        userId,
        familyId
      });
      
      // Enhanced duplicate detection
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
          if (debugLogging) {
            console.log("Duplicate event detected:", existingEvent.firestoreId);
          }
          
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
        
      // Save to Firestore with retry logic
      let eventRef = null;
      let firestoreId = null;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          if (debugLogging) {
            console.log(`Attempt ${attempt} to save event to Firestore`);
          }
          
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
          eventRef = docRef;
          if (debugLogging) {
            console.log(`Event saved successfully on attempt ${attempt} with ID: ${firestoreId}`);
          }
          break;
        } catch (saveError) {
          console.error(`Error on save attempt ${attempt}:`, saveError);
          
          if (attempt === 3) throw saveError;
          
          // Wait before retrying with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
        }
      }
      
      if (!eventRef) {
        throw new Error("Failed to save event after multiple attempts");
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
      
      if (debugLogging) {
        console.log("Event successfully added and listeners notified");
      }
      
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

  // Recover pending events
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

  clearCache() {
    console.log("Clearing event cache");
    this.eventCache.clear();
    this.lastRefresh = Date.now();
    return true;
  }

  // Get events for a specific cycle
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

  // Find specific cycle due date event
  async getCycleDueDateEvent(familyId, cycleNumber) {
    try {
      if (!familyId) throw new Error("Family ID is required");
      
      // Check cache first
      const cachedEvent = Array.from(this.eventCache.values())
        .find(event => 
          event.familyId === familyId && 
          (event.cycleNumber === cycleNumber) &&
          (event.eventType === 'cycle-due-date' || event.category === 'cycle-due-date' ||
           (event.title && event.title.includes(`Cycle ${cycleNumber}`) && event.title.includes('Due Date')))
        );
      
      if (cachedEvent) return cachedEvent;
      
      // Query for cycle due date events
      const eventsQuery = query(
        collection(db, "events"),
        where("familyId", "==", familyId)
      );
      
      const querySnapshot = await getDocs(eventsQuery);
      let dueEvent = null;
      
      querySnapshot.forEach((doc) => {
        const event = doc.data();
        
        const isCycleDueDate = 
          (event.cycleNumber === cycleNumber) &&
          (event.eventType === 'cycle-due-date' || event.category === 'cycle-due-date' ||
           (event.title && event.title.includes(`Cycle ${cycleNumber}`) && event.title.includes('Due Date')));
        
        if (isCycleDueDate) {
          dueEvent = this.standardizeEvent({
            ...event,
            firestoreId: doc.id
          });
          
          // Update cache
          this.eventCache.set(dueEvent.universalId, dueEvent);
        }
      });
      
      return dueEvent;
    } catch (error) {
      console.error("Error finding cycle due date event:", error);
      return null;
    }
  }

  // Subscribe to event changes
  subscribe(callback) {
    if (typeof callback === 'function') {
      this.listeners.add(callback);
      return () => this.listeners.delete(callback);
    }
    return () => {};
  }

  // Notify all listeners of event changes - ENHANCED to ensure UI updates
  notifyListeners(action, event) {
    const debugLogging = false; // Set to false to reduce console noise
    
    // First log what's happening
    if (debugLogging) {
      console.log(`EventStore notifying listeners: action=${action}, event=${event.title}, id=${event.firestoreId || event.id}`);
    }
    
    // Call all registered listeners
    this.listeners.forEach(listener => {
      try {
        listener(action, event);
      } catch (error) {
        console.error("Error in event listener:", error);
      }
    });
    
    // Dispatch DOM events for legacy components
    if (typeof window !== 'undefined') {
      // Include the event data in the refresh event
      window.dispatchEvent(new CustomEvent('force-calendar-refresh', {
        detail: { 
          source: 'event-store-notify',
          eventId: event.firestoreId || event.id,
          universalId: event.universalId,
          timestamp: Date.now(),
          eventData: { ...event } // Include a copy of the event data
        }
      }));
      
      // Also dispatch the specific event action
      window.dispatchEvent(new CustomEvent(`calendar-event-${action}d`, {
        detail: { 
          eventId: event.firestoreId || event.id,
          universalId: event.universalId,
          eventData: { ...event } // Include a copy of the event data
        }
      }));
    }
  }

  // FIXED - Enhanced refreshEvents method with recursive protection
  async refreshEvents(userId, familyId = null, cycleNumber = null) {
    if (!userId) return [];
    
    // Critical fix: Prevent recursive refreshes
    if (this._refreshInProgress) {
      console.log("Refresh already in progress, skipping duplicate call");
      return this._lastRefreshResult || [];
    }
    
    // Set flag to prevent recursive calls
    this._refreshInProgress = true;
    
    try {
      // Clear cache completely to ensure fresh data
      this.eventCache.clear();
      this.lastRefresh = Date.now();
      
      // Run a direct database query with no filters to get all events
      try {
        const eventsQuery = query(
          collection(db, "events"),
          where("userId", "==", userId)
        );
        
        const querySnapshot = await getDocs(eventsQuery);
        const events = [];
        
        // Process results without excessive logging
        querySnapshot.forEach((doc) => {
          try {
            const eventData = doc.data();
            
            // CRITICAL FIX: Only standardize if not already standardized
            const standardizedEvent = eventData._standardized ? 
              eventData : 
              this.standardizeEvent({
                ...eventData,
                firestoreId: doc.id
              });
            
            // Add all events regardless of date range
            events.push(standardizedEvent);
            
            // Update cache
            this.eventCache.set(standardizedEvent.universalId, standardizedEvent);
          } catch (docError) {
            console.error(`Error processing event document ${doc.id}:`, docError);
          }
        });
        
        // Store the result for any duplicate refreshes that happen during this one
        this._lastRefreshResult = events;
        
        return events;
      } catch (error) {
        console.error("Error in direct refresh:", error);
        
        // Fall back to regular getEventsForUser
        const fallbackEvents = await this.getEventsForUser(userId);
        this._lastRefreshResult = fallbackEvents;
        return fallbackEvents;
      }
    } finally {
      // Always clear the in-progress flag with a delay to prevent immediate re-entry
      setTimeout(() => {
        this._refreshInProgress = false;
      }, 200);
    }
  }
}

// Create and export a singleton instance
const eventStore = new EventStore();
export default eventStore;