// src/services/EventStore.js
import { db } from './firebase';

import { 
  checkCalendarEventGuard, 
  processEmptyCalendarResult, 
  clearEmptyResultCounter 
} from '../event-loop-guard-enhanced';







import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, 
  query, where, serverTimestamp, limit, orderBy
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import ScalableDataService from './ScalableDataService';

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
        } else if (eventData.startTime) {
          // Check startTime field (Firestore Timestamp from demo data / CalendarServiceV2)
          // Firestore Timestamps have toDate() method or can be a Date object
          if (typeof eventData.startTime.toDate === 'function') {
            startDate = eventData.startTime.toDate();
          } else if (eventData.startTime instanceof Date) {
            startDate = new Date(eventData.startTime);
          } else {
            startDate = new Date(eventData.startTime);
          }
        } else if (eventData.startDate) {
          // Check startDate field (used by UnifiedInbox)
          startDate = new Date(eventData.startDate);
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
        } else if (eventData.endTime) {
          // Check endTime field (Firestore Timestamp from demo data / CalendarServiceV2)
          if (typeof eventData.endTime.toDate === 'function') {
            endDate = eventData.endTime.toDate();
          } else if (eventData.endTime instanceof Date) {
            endDate = new Date(eventData.endTime);
          } else {
            endDate = new Date(eventData.endTime);
          }
        } else if (eventData.endDate) {
          // Check endDate field (used by UnifiedInbox)
          endDate = new Date(eventData.endDate);
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
      
      // Create signature for deduplication - include time to avoid false duplicates
      const title = eventData.title || eventData.summary || "";
      const childInfo = eventData.childId || eventData.childName || "";
      const category = eventData.eventType || eventData.category || "general";
      // Include hours and minutes in signature to differentiate events at different times
      const dateTimeString = startDate.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
      const signatureBase = `${title}-${dateTimeString}-${childInfo}-${category}`.toLowerCase();
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
        description: eventData.description || "",
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
        
        // Status field - CRITICAL for CalendarServiceV2 queries
        status: eventData.status || 'active',  // Default to 'active' so events show on calendar
        
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
  async getEventsForUser(userId, startDate = null, endDate = null, familyId = null) {
    // Skip loading events on survey pages
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const isSurveyPage = currentPath.includes('/survey') || currentPath.includes('/weekly-checkin');
      if (isSurveyPage) {
        console.log('📋 EventStore: Skipping event load on survey page');
        return [];
      }
    }
    
    // Check calendar event guard to prevent loops
    if (checkCalendarEventGuard('getEventsForUser', { source: 'EventStore' })) {
      console.log("⚠️ Calendar event guard blocked getEventsForUser call");
      return [];
    }
    if (!userId) {
      console.warn("User ID is required for getEventsForUser");
      return [];
    }
    
    // DEBUG: Track where this request is coming from
    const stackTrace = new Error().stack.split('\n').slice(2,4).join('\n').trim();
    console.log(`🔍 DEBUG EventStore: getEventsForUser called for ${userId} from:\n${stackTrace}`);
    
    // Default date range - extended to 2 years to capture all calendar events
    if (!startDate) {
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1); // 1 year back
    }

    if (!endDate) {
      endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 2); // 2 years forward
    }
    
    // PERMANENT FIX: Add throttling for event refreshes
    const now = Date.now();
    const lastRefreshTime = this._lastRefreshTime || 0;
    const MIN_REFRESH_INTERVAL = 5000; // 5 seconds between refreshes
    
    // If we refreshed recently and have cached results, return them
    if (now - lastRefreshTime < MIN_REFRESH_INTERVAL && this._lastRefreshResult) {
      // Only log this message every 10th time to reduce console spam
      if (this._throttleCounter % 10 === 0) {
        console.log(`⚠️ EventStore: Event refresh throttled (${(now - lastRefreshTime)/1000}s < ${MIN_REFRESH_INTERVAL/1000}s), using cache`);
        console.log(`🔍 DEBUG EventStore: Cached results contains ${this._lastRefreshResult?.length || 0} events`);
      }
      this._throttleCounter = (this._throttleCounter || 0) + 1;
      return this._lastRefreshResult;
    }
    
    // Update last refresh time
    this._lastRefreshTime = now;
    this._throttleCounter = 0;
    
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
    
    // SAFETY CIRCUIT BREAKER - Track consecutive empty results
    if (!this._emptyResultsCounter) this._emptyResultsCounter = 0;
    if (!this._lastUserWithEmptyResults) this._lastUserWithEmptyResults = '';
    
    // If this is the same user with multiple consecutive empty results, return early
    if (this._lastUserWithEmptyResults === userId && this._emptyResultsCounter >= 3) {
      console.warn(`🛑 SAFETY CIRCUIT BREAKER in EventStore: ${this._emptyResultsCounter} consecutive empty results for user ${userId}`);
      console.log(`🔍 DEBUG EventStore: Empty results details - counter: ${this._emptyResultsCounter}, lastUser: ${this._lastUserWithEmptyResults.substring(0,6)}`);
      
      // Update global counter too
      if (typeof window !== 'undefined') {
        // Use max of local or global counter to prevent desync
        window._eventEmptyResultCounter = Math.max(window._eventEmptyResultCounter || 0, this._emptyResultsCounter);
        console.log(`🔍 DEBUG EventStore: Updated global counter to ${window._eventEmptyResultCounter}`);
      }
      
      // Only return early every other time to allow occasional retries
      if (this._emptyResultsCounter % 2 === 0) {
        console.log("⚠️ Returning empty array immediately due to circuit breaker (retry on next call)");
        
        // Check if we're in an extreme condition (too many empty results)
        if (this._emptyResultsCounter > 10) {
          console.error("🚨 CRITICAL: Too many consecutive empty results, forcing longer timeout");
          // Force a longer timeout with visual indicator
          if (typeof window !== 'undefined' && !document.getElementById('event-store-error')) {
            try {
              const div = document.createElement('div');
              div.id = 'event-store-error';
              div.style.position = 'fixed';
              div.style.bottom = '10px';
              div.style.right = '10px';
              div.style.backgroundColor = '#ffcc00';
              div.style.color = 'black';
              div.style.padding = '10px';
              div.style.borderRadius = '4px';
              div.style.zIndex = '9999';
              div.textContent = 'Calendar data issue detected - reload page';
              document.body.appendChild(div);
            } catch (e) {
              console.error("Error creating notification", e);
            }
          }
          
          // Force activate the context-level circuit breaker
          if (typeof window !== 'undefined') {
            window._eventEmptyResultCounter = this._emptyResultsCounter;
            // Force circuit breaker activation via global flag
            window._forceEventCircuitBreaker = true;
          }
        }
        
        return [];
      }
      
      // Increment counter for next time
      this._emptyResultsCounter++;
      console.log(`🔍 DEBUG EventStore: Incrementing empty counter to ${this._emptyResultsCounter}`);
    }
    
    // Set request in progress flag
    this._requestsInProgress[requestKey] = true;
    this._refreshInProgress = true;
    
    try {
      console.log(`📊 EventStore: Querying events for family ${familyId || 'unknown'}...`);
      
      // Query by familyId to get ALL family events (any family member can see all events)
      const eventsQuery = familyId ? 
        query(
          collection(db, "events"),
          where("familyId", "==", familyId),
          limit(200) // Increased limit since we're not filtering by date
        ) :
        // Fallback to userId if no familyId provided (backwards compatibility)
        query(
          collection(db, "events"),
          where("userId", "==", userId),
          limit(200)
        );
      
      console.log('🔍 DEBUG: EventStore query details:', {
        collection: 'events',
        queryingBy: familyId ? 'familyId' : 'userId',
        familyId: familyId,
        userId: userId,
        userIdType: typeof userId,
        userIdLength: userId.length
      });
      
      const querySnapshot = await getDocs(eventsQuery);
      const result = {
        items: querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      };
      
      const events = [];
      
      // Debug info about the query
      console.log(`📊 EventStore: Got ${result.items.length} event documents from cache/Firestore`);
      
      // If no events found, let's check if there are any events in the collection at all
      if (result.items.length === 0) {
        console.log('🔍 DEBUG: No events found for user. Checking if events collection has any documents...');
        try {
          const allEventsQuery = query(collection(db, "events"), limit(5));
          const allEventsSnapshot = await getDocs(allEventsQuery);
          console.log(`🔍 DEBUG: Total events in collection: ${allEventsSnapshot.size}`);
          if (allEventsSnapshot.size > 0) {
            console.log('🔍 DEBUG: Sample events from collection:');
            allEventsSnapshot.docs.forEach((doc, index) => {
              const data = doc.data();
              console.log(`  Event ${index + 1}: userId="${data.userId}", familyId="${data.familyId}", title="${data.title || data.summary || 'No title'}", id="${doc.id}"`);
              // Check if this event might belong to our user by other means
              if (data.attendees) {
                console.log(`    Attendees:`, data.attendees);
              }
              if (data.createdBy) {
                console.log(`    Created by: ${data.createdBy}`);
              }
            });
          }
        } catch (debugError) {
          console.error('🔍 DEBUG: Error checking events collection:', debugError);
        }
      }
      
      // If no events found by userId, try querying by familyId
      if (result.items.length === 0 && familyId) {
        console.log('🔍 DEBUG: No events found by userId, trying familyId query...');
        try {
          const familyEventsQuery = query(
            collection(db, "events"),
            where("familyId", "==", familyId),
            limit(200)
          );
          
          const familyQuerySnapshot = await getDocs(familyEventsQuery);
          if (familyQuerySnapshot.size > 0) {
            console.log(`🔍 DEBUG: Found ${familyQuerySnapshot.size} events by familyId`);
            result.items = familyQuerySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
          }
        } catch (familyQueryError) {
          console.error('🔍 DEBUG: Error querying by familyId:', familyQueryError);
        }
      }
      
      // Process each event
      result.items.forEach((eventDoc) => {
        try {
          const eventData = eventDoc; // Data is already extracted by ScalableDataService
          
          // Skip standardization if already standardized
          const standardizedEvent = eventData._standardized === true
            ? eventData
            : this.standardizeEvent({
                ...eventData,
                firestoreId: eventDoc.id
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
      
      // Track empty results for circuit breaking
      if (sortedEvents.length === 0) {
        // Track empty results with the enhanced guard
        processEmptyCalendarResult();
        this._lastUserWithEmptyResults = userId;
        this._emptyResultsCounter = (this._emptyResultsCounter || 0) + 1;
        
        if (this._emptyResultsCounter >= 3) {
          console.warn(`⚠️ EventStore: ${this._emptyResultsCounter} consecutive empty results for user ${userId.substring(0, 6)}...`);
        }
      } else {
        // Reset the counter if we got results
        clearEmptyResultCounter();
        this._emptyResultsCounter = 0;
        this._lastUserWithEmptyResults = '';
      }
      
      return sortedEvents;
    } catch (error) {
      console.error("Error getting events:", error);
      
      // Increment empty results counter on error too
      this._lastUserWithEmptyResults = userId;
      this._emptyResultsCounter = (this._emptyResultsCounter || 0) + 1;
      
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
      
      // Check for duplicates - use familyId if available to prevent family-wide duplicates
      try {
        const eventsQuery = familyId ? 
          query(
            collection(db, "events"),
            where("eventSignature", "==", standardizedEvent.eventSignature),
            where("familyId", "==", familyId),
            limit(1)
          ) :
          query(
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
      
      // Import Timestamp for proper date handling
      const { Timestamp } = await import('firebase/firestore');
      
      // Parse dates for Firestore Timestamps
      const startDate = standardizedEvent.start?.dateTime 
        ? new Date(standardizedEvent.start.dateTime)
        : new Date(standardizedEvent.dateTime || standardizedEvent.date);
      
      const endDate = standardizedEvent.end?.dateTime
        ? new Date(standardizedEvent.end.dateTime)
        : new Date(standardizedEvent.endDateTime || new Date(startDate.getTime() + 60 * 60 * 1000));
      
      // Debug logging to track date issues
      console.log('🗓️ EventStore: Creating event with dates:', {
        title: standardizedEvent.title,
        originalDateTime: standardizedEvent.dateTime,
        startDate: startDate.toISOString(),
        startDateLocal: startDate.toString(),
        endDate: endDate.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      
      // Add Firestore ID to the event and convert dates to Timestamps
      const eventToSave = {
        ...standardizedEvent,
        firestoreId,
        // Add startTime and endTime as Firestore Timestamps for CalendarServiceV2 compatibility
        startTime: Timestamp.fromDate(startDate),
        endTime: Timestamp.fromDate(endDate),
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
      
      // Dispatch event to refresh calendar UI
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('calendar-event-added', {
          detail: { 
            eventId: firestoreId,
            universalId: standardizedEvent.universalId,
            familyId: familyId
          }
        }));
        
        // Also dispatch a force refresh for the calendar
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('force-calendar-refresh'));
        }, 100);
      }
      
      // Check if two-way sync is enabled and sync to Google if needed
      if (localStorage.getItem('twoWaySync') === 'true' && 
          standardizedEvent.source !== 'google' && 
          familyId) {
        try {
          // Import CalendarIntegrationService dynamically to avoid circular dependencies
          const CalendarIntegrationService = (await import('./CalendarIntegrationService')).default;
          
          // Get primary calendar ID
          const selectedCalendars = JSON.parse(localStorage.getItem('selectedCalendars') || '[]');
          const primaryCalendar = selectedCalendars.find(cal => cal.primary);
          
          if (primaryCalendar) {
            console.log('Two-way sync: Creating event in Google Calendar');
            const googleEventId = await CalendarIntegrationService.createGoogleEvent(
              { ...standardizedEvent, firestoreId },
              primaryCalendar.id
            );
            
            // Update the event with Google ID
            if (googleEventId) {
              await updateDoc(docRef, {
                googleEventId: googleEventId,
                syncedToGoogle: true,
                syncedCalendarId: primaryCalendar.id,
                lastSyncedAt: serverTimestamp()
              });
            }
          }
        } catch (syncError) {
          console.error('Failed to sync to Google Calendar:', syncError);
          // Don't fail the event creation, just log the error
        }
      }
      
      return {
        success: true,
        eventId: firestoreId,
        universalId: standardizedEvent.universalId
      };
    } catch (error) {
      console.error("Error adding event:", error);
      console.error("Full error details:", {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
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
      
      // Ensure userId is preserved - use the passed userId or the existing one
      if (userId) {
        updatedEvent.userId = userId;
      } else if (!updatedEvent.userId && existingEvent.userId) {
        updatedEvent.userId = existingEvent.userId;
      }
      
      // Import Timestamp for proper date handling
      const { Timestamp } = await import('firebase/firestore');
      
      // Parse dates for Firestore Timestamps
      const startDate = updatedEvent.start?.dateTime 
        ? new Date(updatedEvent.start.dateTime)
        : new Date(updatedEvent.dateTime || updatedEvent.date);
      
      const endDate = updatedEvent.end?.dateTime
        ? new Date(updatedEvent.end.dateTime)
        : new Date(updatedEvent.endDateTime || new Date(startDate.getTime() + 60 * 60 * 1000));
      
      // Save to Firestore with Timestamp fields
      await updateDoc(eventRef, {
        ...updatedEvent,
        // Add startTime and endTime as Firestore Timestamps for CalendarServiceV2 compatibility
        startTime: Timestamp.fromDate(startDate),
        endTime: Timestamp.fromDate(endDate),
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
      
      // Check if two-way sync is enabled and sync to Google if needed
      if (localStorage.getItem('twoWaySync') === 'true' && 
          updatedEvent.source !== 'google' && 
          existingEvent.googleEventId) {
        try {
          // Import CalendarIntegrationService dynamically
          const CalendarIntegrationService = (await import('./CalendarIntegrationService')).default;
          
          // Get the calendar ID from the existing event or use primary
          let calendarId = existingEvent.syncedCalendarId;
          if (!calendarId) {
            const selectedCalendars = JSON.parse(localStorage.getItem('selectedCalendars') || '[]');
            const primaryCalendar = selectedCalendars.find(cal => cal.primary);
            calendarId = primaryCalendar?.id;
          }
          
          if (calendarId) {
            console.log('Two-way sync: Updating event in Google Calendar');
            await CalendarIntegrationService.updateGoogleEvent(
              { ...updatedEvent, googleEventId: existingEvent.googleEventId },
              calendarId
            );
            
            // Update sync timestamp
            await updateDoc(eventRef, {
              lastSyncedAt: serverTimestamp()
            });
          }
        } catch (syncError) {
          console.error('Failed to sync update to Google Calendar:', syncError);
          // Don't fail the update, just log the error
        }
      }
      
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

  /**
   * Get events for a family with proper pagination and date filtering
   * This is the scalable version that should be used going forward
   */
  async getEventsForFamily(familyId, options = {}) {
    if (!familyId) {
      console.warn("Family ID is required for getEventsForFamily");
      return { events: [], hasMore: false };
    }

    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days ahead
      pageSize = 50,
      lastDoc = null
    } = options;

    try {
      // Use simple query to avoid index requirements
      const eventsQuery = query(
        collection(db, "events"),
        where("familyId", "==", familyId),
        limit(pageSize)
      );
      
      const querySnapshot = await getDocs(eventsQuery);
      const allEvents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter by date range in memory
      const events = allEvents
        .filter(event => {
          const eventDate = new Date(event.dateTime || event.date || event.start?.dateTime);
          return eventDate >= startDate && eventDate <= endDate;
        })
        .map(eventDoc => {
          const eventData = eventDoc;
          return eventData._standardized === true
            ? eventData
            : this.standardizeEvent({
                ...eventData,
                firestoreId: eventDoc.id
              });
        });

      return {
        events,
        hasMore: querySnapshot.docs.length === pageSize,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1]
      };
    } catch (error) {
      console.error("Error getting family events:", error);
      return { events: [], hasMore: false };
    }
  }

  /**
   * Get events within a date range
   */
  async getEventsByDateRange(userIdOrFamilyId, startDate, endDate, familyId = null) {
    // Handle both userId and familyId queries
    // If familyId is provided as 4th param, use userId from first param
    // Otherwise, treat first param as familyId (for CalendarService compatibility)
    const queryByFamilyId = !familyId;
    const actualFamilyId = queryByFamilyId ? userIdOrFamilyId : familyId;
    const actualUserId = queryByFamilyId ? null : userIdOrFamilyId;
    
    if (!actualFamilyId && !actualUserId) return [];
    
    // Ensure dates are valid Date objects (defined outside try block)
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    
    try {
      
      // Query events - prioritize familyId for family calendar view
      let eventsQuery;
      if (queryByFamilyId) {
        // Query by familyId for family calendar
        eventsQuery = query(
          collection(db, "events"),
          where("familyId", "==", actualFamilyId),
          orderBy("startDate", "asc"),
          limit(1000)
        );
      } else {
        // Query by userId for personal events
        eventsQuery = query(
          collection(db, "events"),
          where("userId", "==", actualUserId),
          orderBy("dateTime", "asc"),
          limit(1000)
        );
      }
      
      const querySnapshot = await getDocs(eventsQuery);
      const events = [];
      
      querySnapshot.forEach((doc) => {
        const eventData = doc.data();
        const event = this.standardizeEvent({
          ...eventData,
          firestoreId: doc.id
        });
        
        // Filter by date range
        const eventDate = new Date(event.dateTime || event.startDate);
        if (eventDate >= start && eventDate <= end) {
          events.push(event);
        }
      });
      
      return events;
    } catch (error) {
      console.error("Error getting events by date range:", error);
      // If the compound query fails (missing index), try a simpler query
      try {
        let simpleQuery;
        if (queryByFamilyId) {
          simpleQuery = query(
            collection(db, "events"),
            where("familyId", "==", actualFamilyId),
            limit(1000)
          );
        } else {
          simpleQuery = query(
            collection(db, "events"),
            where("userId", "==", actualUserId),
            limit(1000)
          );
        }
        
        const simpleSnapshot = await getDocs(simpleQuery);
        const events = [];
        
        simpleSnapshot.forEach((doc) => {
          const eventData = doc.data();
          const event = this.standardizeEvent({
            ...eventData,
            firestoreId: doc.id
          });
          
          // Filter by date range in memory
          const eventDate = new Date(event.dateTime || event.startDate);
          if (eventDate >= start && eventDate <= end) {
            events.push(event);
          }
        });
        
        // Sort by date
        events.sort((a, b) => {
          const dateA = new Date(a.dateTime || a.startDate);
          const dateB = new Date(b.dateTime || b.startDate);
          return dateA - dateB;
        });
        
        return events;
      } catch (fallbackError) {
        console.error("Fallback query also failed:", fallbackError);
        return [];
      }
    }
  }

  /**
   * Subscribe to real-time event updates for a family (limited)
   */
  subscribeToFamilyEvents(familyId, callback, options = {}) {
    if (!familyId) {
      console.warn("Family ID is required for event subscription");
      return () => {};
    }

    const {
      limit: resultLimit = 20, // Only sync 20 most recent events
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
    } = options;

    // Use simple subscription without complex filters to avoid index issues
    return ScalableDataService.subscribeToCollection(
      'events',
      familyId,
      (events) => {
        // Filter by date range in memory and standardize
        const filteredEvents = events
          .filter(event => {
            const eventDate = new Date(event.dateTime || event.date || event.start?.dateTime);
            return eventDate >= startDate && eventDate <= endDate;
          })
          .map(event => event._standardized ? event : this.standardizeEvent(event))
          .slice(0, resultLimit); // Limit results

        callback(filteredEvents);
      },
      {
        limit: resultLimit * 2, // Get more to filter in memory
        filters: [] // No complex filters to avoid index requirements
      }
    );
  }
  
  /**
   * Subscribe to all events (for quantum integration)
   */
  subscribeToEvents(callback) {
    // Use the existing subscribe method
    return this.subscribe(callback);
  }
}

// Create and export a singleton instance
const eventStore = new EventStore();
export default eventStore;