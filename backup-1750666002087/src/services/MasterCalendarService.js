// MasterCalendarService.js - The 25th Century Family Calendar System
// A robust, family-focused calendar service that integrates with all app features

import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, 
  query, where, orderBy, limit, serverTimestamp, writeBatch,
  onSnapshot, Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { v4 as uuidv4 } from 'uuid';
import { addDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, isValid } from 'date-fns';

class MasterCalendarService {
  constructor() {
    this.initialized = false;
    this.listeners = new Map();
    this.eventCache = new Map();
    this.subscriptions = new Map();
    this.syncInProgress = false;
    this.lastSyncTime = null;
    this.errorRetryCount = 0;
    this.maxRetries = 3;
    
    // Event types for family activities
    this.eventTypes = {
      APPOINTMENT: 'appointment',
      ACTIVITY: 'activity',
      SCHOOL: 'school',
      BIRTHDAY: 'birthday',
      MEETING: 'meeting',
      PLAYDATE: 'playdate',
      VACATION: 'vacation',
      REMINDER: 'reminder',
      TASK: 'task',
      GENERAL: 'general'
    };
    
    // Initialize the service
    this.initialize();
  }
  
  async initialize() {
    if (this.initialized) return;
    
    try {
      console.log('🚀 Initializing MasterCalendarService...');
      
      // Set up offline persistence
      if (typeof window !== 'undefined') {
        // Enable Firestore offline persistence
        this.setupOfflineSync();
      }
      
      this.initialized = true;
      console.log('✅ MasterCalendarService initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize MasterCalendarService:', error);
      throw error;
    }
  }
  
  // Core method to create a new event with all necessary validations
  async createEvent(eventData, userId, familyId) {
    try {
      console.log('📅 Creating new event:', eventData.title || 'Untitled');
      
      // Validate required fields
      if (!userId) throw new Error('User ID is required');
      if (!familyId) throw new Error('Family ID is required');
      if (!eventData.title && !eventData.summary) throw new Error('Event title is required');
      
      // Generate unique IDs
      const eventId = uuidv4();
      const firestoreId = `event-${eventId}`;
      
      // Parse and validate dates
      const startDate = this.parseEventDate(eventData.start?.dateTime || eventData.startDate || eventData.dateTime || eventData.date);
      const endDate = this.parseEventDate(
        eventData.end?.dateTime || eventData.endDate || eventData.endDateTime,
        new Date(startDate.getTime() + 60 * 60 * 1000) // Default 1 hour duration
      );
      
      // Build the complete event object
      const newEvent = {
        // IDs
        id: firestoreId,
        eventId: eventId,
        firestoreId: firestoreId,
        universalId: eventId,
        
        // Basic info
        title: eventData.title || eventData.summary || 'Untitled Event',
        summary: eventData.summary || eventData.title || 'Untitled Event',
        description: eventData.description || '',
        
        // Dates
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        start: {
          dateTime: startDate.toISOString(),
          timeZone: eventData.start?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: eventData.end?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        
        // Classification
        eventType: eventData.eventType || eventData.category || this.eventTypes.GENERAL,
        category: eventData.category || eventData.eventType || this.eventTypes.GENERAL,
        
        // Location
        location: eventData.location || '',
        locationDetails: eventData.locationDetails || null,
        
        // Family relationships
        familyId: familyId,
        userId: userId,
        createdBy: userId,
        childId: eventData.childId || null,
        childName: eventData.childName || null,
        attendingParentId: eventData.attendingParentId || null,
        
        // Attendees
        attendees: Array.isArray(eventData.attendees) ? eventData.attendees : [],
        guests: Array.isArray(eventData.guests) ? eventData.guests : [],
        
        // Related entities
        documents: Array.isArray(eventData.documents) ? eventData.documents : [],
        providers: Array.isArray(eventData.providers) ? eventData.providers : [],
        
        // Reminders
        reminders: eventData.reminders || { useDefault: true, overrides: [] },
        notification: eventData.notification || '30',
        
        // Metadata
        source: eventData.source || 'allie-chat',
        creationSource: eventData.creationSource || 'manual',
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // Status
        status: 'confirmed',
        _standardized: true,
        
        // Extra details for specific event types
        extraDetails: {
          ...(eventData.extraDetails || {}),
          originalData: eventData,
          createdFrom: 'MasterCalendarService'
        }
      };
      
      // Add type-specific details
      if (eventData.appointmentDetails) {
        newEvent.appointmentDetails = eventData.appointmentDetails;
        newEvent.doctorName = eventData.appointmentDetails?.doctorName;
      }
      
      if (eventData.activityDetails) {
        newEvent.activityDetails = eventData.activityDetails;
      }
      
      // Save to Firestore
      const eventRef = doc(db, 'events', firestoreId);
      await setDoc(eventRef, newEvent);
      
      // Update cache
      this.eventCache.set(firestoreId, newEvent);
      
      // Notify listeners
      this.notifyListeners('created', newEvent);
      
      // Log success
      console.log('✅ Event created successfully:', firestoreId);
      
      return {
        success: true,
        eventId: firestoreId,
        universalId: eventId,
        event: newEvent
      };
      
    } catch (error) {
      console.error('❌ Error creating event:', error);
      
      // Retry logic for transient errors
      if (this.shouldRetry(error) && this.errorRetryCount < this.maxRetries) {
        this.errorRetryCount++;
        console.log(`🔄 Retrying event creation (attempt ${this.errorRetryCount}/${this.maxRetries})...`);
        await this.delay(1000 * this.errorRetryCount);
        return this.createEvent(eventData, userId, familyId);
      }
      
      this.errorRetryCount = 0;
      throw error;
    }
  }
  
  // Update an existing event
  async updateEvent(eventId, updates, userId) {
    try {
      console.log('📝 Updating event:', eventId);
      
      if (!eventId) throw new Error('Event ID is required');
      if (!userId) throw new Error('User ID is required');
      
      // Get the existing event
      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);
      
      if (!eventSnap.exists()) {
        throw new Error(`Event ${eventId} not found`);
      }
      
      const existingEvent = eventSnap.data();
      
      // Parse dates if provided
      if (updates.start?.dateTime || updates.startDate || updates.dateTime) {
        const startDate = this.parseEventDate(updates.start?.dateTime || updates.startDate || updates.dateTime);
        updates.startTime = startDate.toISOString();
        updates.start = {
          dateTime: startDate.toISOString(),
          timeZone: updates.start?.timeZone || existingEvent.start?.timeZone
        };
      }
      
      if (updates.end?.dateTime || updates.endDate || updates.endDateTime) {
        const endDate = this.parseEventDate(updates.end?.dateTime || updates.endDate || updates.endDateTime);
        updates.endTime = endDate.toISOString();
        updates.end = {
          dateTime: endDate.toISOString(),
          timeZone: updates.end?.timeZone || existingEvent.end?.timeZone
        };
      }
      
      // Merge updates
      const updatedEvent = {
        ...existingEvent,
        ...updates,
        updatedAt: serverTimestamp(),
        lastModifiedBy: userId
      };
      
      // Save to Firestore
      await updateDoc(eventRef, updatedEvent);
      
      // Update cache
      this.eventCache.set(eventId, updatedEvent);
      
      // Notify listeners
      this.notifyListeners('updated', updatedEvent);
      
      console.log('✅ Event updated successfully');
      
      return {
        success: true,
        event: updatedEvent
      };
      
    } catch (error) {
      console.error('❌ Error updating event:', error);
      throw error;
    }
  }
  
  // Delete an event
  async deleteEvent(eventId, userId) {
    try {
      console.log('🗑️ Deleting event:', eventId);
      
      if (!eventId) throw new Error('Event ID is required');
      if (!userId) throw new Error('User ID is required');
      
      // Get the event first to notify listeners
      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);
      
      if (!eventSnap.exists()) {
        throw new Error(`Event ${eventId} not found`);
      }
      
      const eventData = eventSnap.data();
      
      // Delete from Firestore
      await deleteDoc(eventRef);
      
      // Remove from cache
      this.eventCache.delete(eventId);
      
      // Notify listeners
      this.notifyListeners('deleted', { id: eventId, ...eventData });
      
      console.log('✅ Event deleted successfully');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error deleting event:', error);
      throw error;
    }
  }
  
  // Get events for a date range
  async getEvents(familyId, startDate, endDate, options = {}) {
    try {
      console.log('📋 Fetching events for date range');
      
      if (!familyId) throw new Error('Family ID is required');
      
      // Parse dates
      const start = this.parseEventDate(startDate);
      const end = this.parseEventDate(endDate);
      
      // Build query
      const eventsRef = collection(db, 'events');
      const q = query(
        eventsRef,
        where('familyId', '==', familyId),
        where('startTime', '>=', start.toISOString()),
        where('startTime', '<=', end.toISOString()),
        orderBy('startTime', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const events = [];
      
      snapshot.forEach(doc => {
        const eventData = doc.data();
        events.push({
          ...eventData,
          id: doc.id,
          firestoreId: doc.id
        });
      });
      
      // Apply filters if provided
      let filteredEvents = events;
      
      if (options.childId) {
        filteredEvents = filteredEvents.filter(e => e.childId === options.childId);
      }
      
      if (options.eventType) {
        filteredEvents = filteredEvents.filter(e => e.eventType === options.eventType);
      }
      
      console.log(`✅ Found ${filteredEvents.length} events`);
      
      return filteredEvents;
      
    } catch (error) {
      console.error('❌ Error fetching events:', error);
      return [];
    }
  }
  
  // Subscribe to real-time event updates
  subscribeToEvents(familyId, callback, options = {}) {
    console.log('👂 Subscribing to event updates for family:', familyId);
    
    if (!familyId) {
      console.error('Family ID is required for subscription');
      return () => {};
    }
    
    const subscriptionId = uuidv4();
    
    try {
      // Build query
      const eventsRef = collection(db, 'events');
      let q = query(eventsRef, where('familyId', '==', familyId));
      
      // Add date range if provided
      if (options.startDate) {
        const start = this.parseEventDate(options.startDate);
        q = query(q, where('startTime', '>=', start.toISOString()));
      }
      
      if (options.endDate) {
        const end = this.parseEventDate(options.endDate);
        q = query(q, where('startTime', '<=', end.toISOString()));
      }
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const events = [];
          const changes = {
            added: [],
            modified: [],
            removed: []
          };
          
          snapshot.docChanges().forEach(change => {
            const eventData = {
              ...change.doc.data(),
              id: change.doc.id,
              firestoreId: change.doc.id
            };
            
            if (change.type === 'added') {
              changes.added.push(eventData);
              this.eventCache.set(change.doc.id, eventData);
            } else if (change.type === 'modified') {
              changes.modified.push(eventData);
              this.eventCache.set(change.doc.id, eventData);
            } else if (change.type === 'removed') {
              changes.removed.push(eventData);
              this.eventCache.delete(change.doc.id);
            }
          });
          
          snapshot.forEach(doc => {
            events.push({
              ...doc.data(),
              id: doc.id,
              firestoreId: doc.id
            });
          });
          
          console.log(`📊 MasterCalendarService: Subscription update - ${events.length} total events`);
          if (events.length > 0) {
            console.log('Sample event:', {
              id: events[0].id,
              title: events[0].title,
              startTime: events[0].startTime
            });
          }
          
          // Call the callback with events and changes
          callback(events, changes);
        },
        (error) => {
          console.error('❌ Subscription error:', error);
          // Try to recover from error
          if (this.shouldRetry(error)) {
            setTimeout(() => {
              console.log('🔄 Attempting to resubscribe...');
              this.subscribeToEvents(familyId, callback, options);
            }, 5000);
          }
        }
      );
      
      // Store subscription
      this.subscriptions.set(subscriptionId, unsubscribe);
      
      // Return unsubscribe function
      return () => {
        const unsub = this.subscriptions.get(subscriptionId);
        if (unsub) {
          unsub();
          this.subscriptions.delete(subscriptionId);
        }
      };
      
    } catch (error) {
      console.error('❌ Error setting up subscription:', error);
      return () => {};
    }
  }
  
  // Search events
  async searchEvents(familyId, searchTerm, options = {}) {
    try {
      console.log('🔍 Searching events for:', searchTerm);
      
      // Get all events for the family
      const events = await this.getEvents(
        familyId,
        options.startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Default: past year
        options.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // Default: next year
      );
      
      // Search in multiple fields
      const searchLower = searchTerm.toLowerCase();
      const results = events.filter(event => {
        return (
          event.title?.toLowerCase().includes(searchLower) ||
          event.description?.toLowerCase().includes(searchLower) ||
          event.location?.toLowerCase().includes(searchLower) ||
          event.childName?.toLowerCase().includes(searchLower) ||
          event.attendees?.some(a => 
            a.name?.toLowerCase().includes(searchLower) ||
            a.email?.toLowerCase().includes(searchLower)
          )
        );
      });
      
      console.log(`✅ Found ${results.length} matching events`);
      return results;
      
    } catch (error) {
      console.error('❌ Error searching events:', error);
      return [];
    }
  }
  
  // Get upcoming events for a family member
  async getUpcomingEvents(familyId, memberId, days = 7) {
    try {
      const startDate = new Date();
      const endDate = addDays(startDate, days);
      
      const events = await this.getEvents(familyId, startDate, endDate);
      
      // Filter by member if provided
      if (memberId) {
        return events.filter(event => 
          event.userId === memberId ||
          event.childId === memberId ||
          event.attendingParentId === memberId ||
          event.attendees?.some(a => a.id === memberId)
        );
      }
      
      return events;
      
    } catch (error) {
      console.error('❌ Error getting upcoming events:', error);
      return [];
    }
  }
  
  // Helper Methods
  
  parseEventDate(dateInput, defaultDate = new Date()) {
    if (!dateInput) return defaultDate;
    
    try {
      if (dateInput instanceof Date) {
        return isValid(dateInput) ? dateInput : defaultDate;
      }
      
      if (typeof dateInput === 'string') {
        const parsed = parseISO(dateInput);
        return isValid(parsed) ? parsed : new Date(dateInput);
      }
      
      if (dateInput instanceof Timestamp) {
        return dateInput.toDate();
      }
      
      return defaultDate;
    } catch (error) {
      console.warn('Error parsing date:', error);
      return defaultDate;
    }
  }
  
  shouldRetry(error) {
    // Retry on network errors or specific Firestore errors
    return (
      error.code === 'unavailable' ||
      error.code === 'deadline-exceeded' ||
      error.code === 'internal' ||
      error.message?.includes('network')
    );
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  setupOfflineSync() {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      console.log('📶 Back online - syncing calendar...');
      this.syncOfflineChanges();
    });
    
    window.addEventListener('offline', () => {
      console.log('📵 Gone offline - calendar will sync when connection returns');
    });
  }
  
  async syncOfflineChanges() {
    if (this.syncInProgress) return;
    
    try {
      this.syncInProgress = true;
      console.log('🔄 Syncing offline changes...');
      
      // Firestore handles offline sync automatically
      // This is just for logging and UI updates
      
      this.lastSyncTime = new Date();
      console.log('✅ Sync completed');
      
    } catch (error) {
      console.error('❌ Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }
  
  notifyListeners(action, event) {
    // Notify all registered listeners
    this.listeners.forEach((callback, id) => {
      try {
        callback(action, event);
      } catch (error) {
        console.error(`Error in listener ${id}:`, error);
      }
    });
    
    // Dispatch DOM event for components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('master-calendar-change', {
        detail: { action, event }
      }));
    }
  }
  
  addListener(callback) {
    const id = uuidv4();
    this.listeners.set(id, callback);
    return () => this.listeners.delete(id);
  }
  
  // Clear all cached data
  clearCache() {
    this.eventCache.clear();
    console.log('🧹 Calendar cache cleared');
  }
  
  // Get cache statistics
  getCacheStats() {
    return {
      cachedEvents: this.eventCache.size,
      activeSubscriptions: this.subscriptions.size,
      lastSyncTime: this.lastSyncTime,
      initialized: this.initialized
    };
  }
}

// Export singleton instance
const masterCalendarService = new MasterCalendarService();
export default masterCalendarService;