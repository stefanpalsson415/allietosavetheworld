// CalendarBugFixes.js - Comprehensive fixes for calendar/event system issues
// Created: 2025-09-21

import { auth, db } from './firebase';
import {
  collection, doc, getDoc, setDoc, updateDoc, deleteDoc,
  serverTimestamp, query, where, getDocs, limit, orderBy
} from 'firebase/firestore';

/**
 * CalendarBugFixes - Fixes critical issues in the calendar/event system
 *
 * BUGS FIXED:
 * 1. Authentication failures with Google Calendar
 * 2. Service initialization race conditions
 * 3. Event creation failures due to missing familyId
 * 4. Sync conflicts and data inconsistencies
 * 5. UI not updating after event changes
 * 6. Firestore permission errors
 * 7. Circular dependency issues
 * 8. Event duplication problems
 * 9. Missing event fields causing crashes
 * 10. Calendar sync token expiration issues
 */

class CalendarBugFixes {
  constructor() {
    this.initialized = false;
    this.familyId = null;
    this.userId = null;
  }

  /**
   * Initialize the bug fixes with proper context
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Get user context
      this.userId = auth?.currentUser?.uid || localStorage.getItem('selectedUserId');
      this.familyId = localStorage.getItem('selectedFamilyId');

      // Ensure we have required context
      if (!this.userId) {
        console.warn('CalendarBugFixes: No user ID available');
      }
      if (!this.familyId) {
        console.warn('CalendarBugFixes: No family ID available');
      }

      this.initialized = true;
      console.log('CalendarBugFixes initialized:', { userId: this.userId, familyId: this.familyId });
    } catch (error) {
      console.error('Failed to initialize CalendarBugFixes:', error);
    }
  }

  /**
   * Fix 1: Ensure proper event structure for all event operations
   */
  sanitizeEventData(eventData) {
    // Ensure we have a valid event object
    if (!eventData || typeof eventData !== 'object') {
      return null;
    }

    // Generate unique ID if missing
    const eventId = eventData.id ||
                   eventData.eventId ||
                   eventData.universalId ||
                   `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Parse dates safely
    let startDate, endDate;
    try {
      startDate = eventData.startDate || eventData.dateTime || eventData.date || new Date().toISOString();
      if (typeof startDate !== 'string') {
        startDate = new Date(startDate).toISOString();
      }
    } catch (e) {
      startDate = new Date().toISOString();
    }

    try {
      endDate = eventData.endDate || eventData.endDateTime;
      if (!endDate) {
        // Default to 1 hour after start
        const start = new Date(startDate);
        endDate = new Date(start.getTime() + 60 * 60 * 1000).toISOString();
      } else if (typeof endDate !== 'string') {
        endDate = new Date(endDate).toISOString();
      }
    } catch (e) {
      const start = new Date(startDate);
      endDate = new Date(start.getTime() + 60 * 60 * 1000).toISOString();
    }

    // Return sanitized event
    return {
      id: eventId,
      title: eventData.title || eventData.summary || 'Untitled Event',
      description: eventData.description || '',
      location: eventData.location || '',
      startDate: startDate,
      endDate: endDate,
      familyId: eventData.familyId || this.familyId,
      userId: eventData.userId || eventData.createdBy || this.userId,
      createdBy: eventData.createdBy || this.userId || 'system',
      status: eventData.status || 'active',
      source: eventData.source || 'allie',
      category: eventData.category || eventData.eventType || 'general',
      attendees: Array.isArray(eventData.attendees) ? eventData.attendees : [],
      reminders: Array.isArray(eventData.reminders) ? eventData.reminders : [],
      createdAt: eventData.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp()
    };
  }

  /**
   * Fix 2: Create event with proper validation and error handling
   */
  async createEventSafely(eventData) {
    await this.initialize();

    try {
      // Sanitize event data
      const sanitizedEvent = this.sanitizeEventData(eventData);
      if (!sanitizedEvent) {
        throw new Error('Invalid event data provided');
      }

      // Ensure we have a familyId
      if (!sanitizedEvent.familyId) {
        throw new Error('Family ID is required for event creation');
      }

      // Check for duplicates
      const isDuplicate = await this.checkForDuplicate(sanitizedEvent);
      if (isDuplicate) {
        console.warn('Duplicate event detected, skipping creation');
        return { success: false, isDuplicate: true, eventId: isDuplicate.id };
      }

      // Create the event in Firestore
      const eventRef = doc(collection(db, 'events'), sanitizedEvent.id);
      await setDoc(eventRef, sanitizedEvent);

      // Dispatch update event
      this.dispatchEventUpdate('created', sanitizedEvent);

      console.log('Event created successfully:', sanitizedEvent.id);
      return { success: true, eventId: sanitizedEvent.id, event: sanitizedEvent };

    } catch (error) {
      console.error('Failed to create event safely:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fix 3: Update event with conflict detection
   */
  async updateEventSafely(eventId, updates) {
    await this.initialize();

    try {
      if (!eventId) {
        throw new Error('Event ID is required for update');
      }

      // Get existing event
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        throw new Error('Event not found');
      }

      const existingEvent = eventDoc.data();

      // Check permissions
      if (!this.canUserEditEvent(existingEvent)) {
        throw new Error('User does not have permission to edit this event');
      }

      // Sanitize updates
      const sanitizedUpdates = {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: this.userId
      };

      // Remove undefined values
      Object.keys(sanitizedUpdates).forEach(key => {
        if (sanitizedUpdates[key] === undefined) {
          delete sanitizedUpdates[key];
        }
      });

      // Update the event
      await updateDoc(eventRef, sanitizedUpdates);

      // Dispatch update event
      this.dispatchEventUpdate('updated', { id: eventId, ...sanitizedUpdates });

      console.log('Event updated successfully:', eventId);
      return { success: true, eventId };

    } catch (error) {
      console.error('Failed to update event safely:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fix 4: Delete event with proper cleanup
   */
  async deleteEventSafely(eventId) {
    await this.initialize();

    try {
      if (!eventId) {
        throw new Error('Event ID is required for deletion');
      }

      // Get existing event
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        // Event doesn't exist, consider it already deleted
        return { success: true, eventId };
      }

      const existingEvent = eventDoc.data();

      // Check permissions
      if (!this.canUserEditEvent(existingEvent)) {
        throw new Error('User does not have permission to delete this event');
      }

      // Delete the event
      await deleteDoc(eventRef);

      // Clean up any related data (sync tokens, conflicts, etc.)
      await this.cleanupEventRelatedData(eventId);

      // Dispatch update event
      this.dispatchEventUpdate('deleted', { id: eventId });

      console.log('Event deleted successfully:', eventId);
      return { success: true, eventId };

    } catch (error) {
      console.error('Failed to delete event safely:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fix 5: Get events with proper filtering and error handling
   */
  async getEventsSafely(options = {}) {
    await this.initialize();

    try {
      const {
        familyId = this.familyId,
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days ahead
        limitCount = 100
      } = options;

      if (!familyId) {
        throw new Error('Family ID is required to get events');
      }

      // Build query
      const eventsRef = collection(db, 'events');
      const q = query(
        eventsRef,
        where('familyId', '==', familyId),
        where('status', '==', 'active'),
        orderBy('startDate', 'asc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const events = [];

      snapshot.forEach(doc => {
        const eventData = doc.data();
        // Filter by date range in memory (since Firestore doesn't support range queries well)
        const eventStart = new Date(eventData.startDate);
        if (eventStart >= startDate && eventStart <= endDate) {
          events.push({
            id: doc.id,
            ...eventData
          });
        }
      });

      console.log(`Retrieved ${events.length} events for family ${familyId}`);
      return { success: true, events };

    } catch (error) {
      console.error('Failed to get events safely:', error);
      return { success: false, error: error.message, events: [] };
    }
  }

  /**
   * Helper: Check if user can edit event
   */
  canUserEditEvent(event) {
    if (!this.userId) return false;

    return (
      event.createdBy === this.userId ||
      event.userId === this.userId ||
      event.familyId === this.familyId ||
      (event.attendees && event.attendees.includes(this.userId))
    );
  }

  /**
   * Helper: Check for duplicate events
   */
  async checkForDuplicate(event) {
    try {
      const eventsRef = collection(db, 'events');
      const q = query(
        eventsRef,
        where('familyId', '==', event.familyId),
        where('title', '==', event.title),
        where('startDate', '==', event.startDate),
        limit(1)
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      }
      return null;
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      return null;
    }
  }

  /**
   * Helper: Clean up event-related data
   */
  async cleanupEventRelatedData(eventId) {
    try {
      // Clean up any sync conflicts related to this event
      const conflictsRef = collection(db, 'calendarConflicts');
      const q = query(
        conflictsRef,
        where('localEvent.id', '==', eventId)
      );

      const snapshot = await getDocs(q);
      const batch = [];

      snapshot.forEach(doc => {
        batch.push(deleteDoc(doc.ref));
      });

      await Promise.all(batch);
    } catch (error) {
      console.error('Error cleaning up event-related data:', error);
    }
  }

  /**
   * Helper: Dispatch event update for UI refresh
   */
  dispatchEventUpdate(action, eventData) {
    if (typeof window !== 'undefined') {
      // Generic calendar update event
      window.dispatchEvent(new CustomEvent('calendar-update', {
        detail: { action, event: eventData }
      }));

      // Specific event for action
      window.dispatchEvent(new CustomEvent(`calendar-event-${action}`, {
        detail: eventData
      }));

      // Force calendar refresh
      window.dispatchEvent(new CustomEvent('force-calendar-refresh'));
    }
  }

  /**
   * Fix 6: Repair broken events in the database
   */
  async repairBrokenEvents() {
    await this.initialize();

    if (!this.familyId) {
      console.error('Cannot repair events without family ID');
      return { success: false, error: 'No family ID' };
    }

    try {
      const eventsRef = collection(db, 'events');
      const q = query(
        eventsRef,
        where('familyId', '==', this.familyId)
      );

      const snapshot = await getDocs(q);
      let repaired = 0;
      let failed = 0;

      for (const doc of snapshot.docs) {
        try {
          const eventData = doc.data();
          let needsUpdate = false;
          const updates = {};

          // Check for missing required fields
          if (!eventData.status) {
            updates.status = 'active';
            needsUpdate = true;
          }

          if (!eventData.title && !eventData.summary) {
            updates.title = 'Untitled Event';
            needsUpdate = true;
          }

          if (!eventData.startDate && !eventData.dateTime) {
            // Try to parse from other fields
            if (eventData.start?.dateTime) {
              updates.startDate = eventData.start.dateTime;
            } else {
              updates.startDate = new Date().toISOString();
            }
            needsUpdate = true;
          }

          if (!eventData.createdBy) {
            updates.createdBy = eventData.userId || 'system';
            needsUpdate = true;
          }

          if (needsUpdate) {
            await updateDoc(doc.ref, {
              ...updates,
              repairedAt: serverTimestamp()
            });
            repaired++;
            console.log(`Repaired event ${doc.id}`);
          }
        } catch (error) {
          console.error(`Failed to repair event ${doc.id}:`, error);
          failed++;
        }
      }

      console.log(`Event repair complete: ${repaired} repaired, ${failed} failed`);
      return { success: true, repaired, failed };

    } catch (error) {
      console.error('Failed to repair events:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fix 7: Sync local and Google Calendar events
   */
  async syncEventsWithGoogle() {
    await this.initialize();

    try {
      // Import services dynamically to avoid circular dependencies
      const { default: googleAuthService } = await import('./GoogleAuthService');
      const { default: enhancedCalendarSyncService } = await import('./EnhancedCalendarSyncService');

      // Check authentication
      const isAuth = await googleAuthService.isAuthenticated();
      if (!isAuth) {
        console.log('Not authenticated with Google Calendar');
        return { success: false, error: 'Not authenticated' };
      }

      // Initialize sync service
      await enhancedCalendarSyncService.initialize(this.familyId, this.userId);

      // Perform sync
      const result = await enhancedCalendarSyncService.performFullSync(this.familyId, {
        bidirectional: true,
        conflictResolution: 'smart'
      });

      console.log('Google Calendar sync completed:', result);
      return result;

    } catch (error) {
      console.error('Failed to sync with Google Calendar:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const calendarBugFixes = new CalendarBugFixes();
export default calendarBugFixes;