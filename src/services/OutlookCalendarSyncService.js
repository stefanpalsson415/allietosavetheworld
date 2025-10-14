// OutlookCalendarSyncService.js - Bidirectional sync with Outlook Calendar
import outlookAuthService from './OutlookAuthService';
import {
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

class OutlookCalendarSyncService {
  constructor() {
    this.graphEndpoint = 'https://graph.microsoft.com/v1.0';
    this.syncInProgress = false;
    this.lastSyncTime = null;
  }

  /**
   * Fetch events from Outlook Calendar
   */
  async fetchOutlookEvents(calendarIds = ['primary'], startDate = null, endDate = null) {
    const token = await outlookAuthService.getAccessToken();

    // Default to 3 months range
    if (!startDate) {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    }
    if (!endDate) {
      endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 2);
    }

    const allEvents = [];

    for (const calendarId of calendarIds) {
      try {
        const calendarPath = calendarId === 'primary' ? '/me/calendar' : `/me/calendars/${calendarId}`;
        const url = `${this.graphEndpoint}${calendarPath}/calendarView` +
          `?startDateTime=${startDate.toISOString()}` +
          `&endDateTime=${endDate.toISOString()}` +
          `&$orderby=start/dateTime` +
          `&$top=250`;

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.error(`Failed to fetch calendar ${calendarId}:`, response.status);
          continue;
        }

        const data = await response.json();
        const events = data.value || [];

        // Add calendar ID to each event
        events.forEach(event => {
          event.calendarId = calendarId;
        });

        allEvents.push(...events);
      } catch (error) {
        console.error(`Error fetching calendar ${calendarId}:`, error);
      }
    }

    console.log(`Fetched ${allEvents.length} events from Outlook Calendar`);
    return allEvents;
  }

  /**
   * Fetch calendars list from Outlook
   */
  async fetchCalendarsList() {
    const token = await outlookAuthService.getAccessToken();

    const response = await fetch(`${this.graphEndpoint}/me/calendars`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch calendars list');
    }

    const data = await response.json();
    return data.value || [];
  }

  /**
   * Create event in Outlook Calendar
   */
  async createOutlookEvent(eventData, calendarId = 'primary') {
    const token = await outlookAuthService.getAccessToken();

    const calendarPath = calendarId === 'primary' ? '/me/calendar' : `/me/calendars/${calendarId}`;
    const url = `${this.graphEndpoint}${calendarPath}/events`;

    // Convert Allie event format to Outlook format
    const outlookEvent = this.convertToOutlookFormat(eventData);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(outlookEvent)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create Outlook event: ${error}`);
    }

    return await response.json();
  }

  /**
   * Update event in Outlook Calendar
   */
  async updateOutlookEvent(eventId, eventData, calendarId = 'primary') {
    const token = await outlookAuthService.getAccessToken();

    const url = `${this.graphEndpoint}/me/events/${eventId}`;

    // Convert Allie event format to Outlook format
    const outlookEvent = this.convertToOutlookFormat(eventData);

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(outlookEvent)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update Outlook event: ${error}`);
    }

    return await response.json();
  }

  /**
   * Delete event from Outlook Calendar
   */
  async deleteOutlookEvent(eventId) {
    const token = await outlookAuthService.getAccessToken();

    const response = await fetch(`${this.graphEndpoint}/me/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok && response.status !== 404) {
      throw new Error('Failed to delete Outlook event');
    }

    return true;
  }

  /**
   * Fetch local events from Firestore
   */
  async fetchLocalEvents(familyId, startDate = null, endDate = null) {
    const eventsRef = collection(db, 'events');
    let q = query(eventsRef, where('familyId', '==', familyId));

    if (startDate) {
      q = query(q, where('start', '>=', startDate));
    }
    if (endDate) {
      q = query(q, where('start', '<=', endDate));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Perform bidirectional sync
   */
  async performSync(familyId, calendarIds = ['primary'], options = {}) {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return { success: false, message: 'Sync already in progress' };
    }

    this.syncInProgress = true;

    try {
      console.log('Starting Outlook Calendar sync...');

      // Fetch events from both sides
      const outlookEvents = await this.fetchOutlookEvents(calendarIds);
      const localEvents = await this.fetchLocalEvents(familyId);

      console.log(`Fetched ${outlookEvents.length} Outlook events, ${localEvents.length} local events`);

      const results = {
        fromOutlook: { created: 0, updated: 0, deleted: 0 },
        toOutlook: { created: 0, updated: 0, deleted: 0 }
      };

      // Create maps for faster lookup
      const outlookEventsMap = new Map();
      outlookEvents.forEach(event => {
        outlookEventsMap.set(event.id, event);
      });

      const localEventsMap = new Map();
      localEvents.forEach(event => {
        if (event.outlookEventId) {
          localEventsMap.set(event.outlookEventId, event);
        }
      });

      // Sync FROM Outlook TO Local
      for (const outlookEvent of outlookEvents) {
        const localEvent = localEventsMap.get(outlookEvent.id);

        if (!localEvent) {
          // Create new local event
          await this.createLocalEventFromOutlook(outlookEvent, familyId);
          results.fromOutlook.created++;
        } else {
          // Check if update needed
          const outlookModified = new Date(outlookEvent.lastModifiedDateTime);
          const localModified = localEvent.updatedAt?.toDate() || localEvent.createdAt?.toDate();

          if (outlookModified > localModified) {
            await this.updateLocalEventFromOutlook(localEvent.id, outlookEvent);
            results.fromOutlook.updated++;
          }
        }
      }

      // Sync FROM Local TO Outlook (two-way sync)
      if (options.twoWaySync) {
        for (const localEvent of localEvents) {
          // Skip if this event came from Outlook originally
          if (localEvent.source === 'outlook') continue;

          if (localEvent.outlookEventId) {
            const outlookEvent = outlookEventsMap.get(localEvent.outlookEventId);

            if (!outlookEvent) {
              // Event deleted from Outlook, delete from local
              await deleteDoc(doc(db, 'events', localEvent.id));
              results.fromOutlook.deleted++;
            } else {
              // Check if local was modified more recently
              const localModified = localEvent.updatedAt?.toDate() || localEvent.createdAt?.toDate();
              const outlookModified = new Date(outlookEvent.lastModifiedDateTime);

              if (localModified > outlookModified) {
                await this.updateOutlookEvent(localEvent.outlookEventId, localEvent);
                results.toOutlook.updated++;
              }
            }
          } else {
            // Local event not yet in Outlook, create it
            const primaryCalendar = calendarIds[0] || 'primary';
            const outlookEvent = await this.createOutlookEvent(localEvent, primaryCalendar);

            // Update local event with Outlook ID
            await updateDoc(doc(db, 'events', localEvent.id), {
              outlookEventId: outlookEvent.id,
              updatedAt: serverTimestamp()
            });

            results.toOutlook.created++;
          }
        }
      }

      this.lastSyncTime = new Date();
      console.log('Sync completed:', results);

      return {
        success: true,
        results,
        timestamp: this.lastSyncTime
      };
    } catch (error) {
      console.error('Sync error:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Convert Outlook event to Allie format
   */
  convertToAllieFormat(outlookEvent) {
    return {
      title: outlookEvent.subject || 'Untitled',
      start: new Date(outlookEvent.start.dateTime),
      end: new Date(outlookEvent.end.dateTime),
      description: outlookEvent.bodyPreview || outlookEvent.body?.content || '',
      location: outlookEvent.location?.displayName || '',
      outlookEventId: outlookEvent.id,
      source: 'outlook',
      calendarId: outlookEvent.calendarId || 'primary',
      isAllDay: outlookEvent.isAllDay || false,
      attendees: (outlookEvent.attendees || []).map(a => ({
        email: a.emailAddress?.address,
        name: a.emailAddress?.name,
        responseStatus: a.status?.response
      })),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
  }

  /**
   * Convert Allie event to Outlook format
   */
  convertToOutlookFormat(allieEvent) {
    const outlookEvent = {
      subject: allieEvent.title || 'Untitled',
      start: {
        dateTime: allieEvent.start instanceof Date
          ? allieEvent.start.toISOString()
          : new Date(allieEvent.start).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: allieEvent.end instanceof Date
          ? allieEvent.end.toISOString()
          : new Date(allieEvent.end).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      isAllDay: allieEvent.isAllDay || false
    };

    if (allieEvent.description) {
      outlookEvent.body = {
        contentType: 'text',
        content: allieEvent.description
      };
    }

    if (allieEvent.location) {
      outlookEvent.location = {
        displayName: allieEvent.location
      };
    }

    if (allieEvent.attendees && allieEvent.attendees.length > 0) {
      outlookEvent.attendees = allieEvent.attendees.map(a => ({
        emailAddress: {
          address: a.email,
          name: a.name || a.email
        },
        type: 'required'
      }));
    }

    return outlookEvent;
  }

  /**
   * Create local event from Outlook event
   */
  async createLocalEventFromOutlook(outlookEvent, familyId) {
    const allieEvent = this.convertToAllieFormat(outlookEvent);
    allieEvent.familyId = familyId;

    const eventId = `outlook_${outlookEvent.id}`;
    await setDoc(doc(db, 'events', eventId), allieEvent);

    return eventId;
  }

  /**
   * Update local event from Outlook event
   */
  async updateLocalEventFromOutlook(localEventId, outlookEvent) {
    const allieEvent = this.convertToAllieFormat(outlookEvent);

    await updateDoc(doc(db, 'events', localEventId), {
      ...allieEvent,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Get last sync time
   */
  getLastSyncTime() {
    return this.lastSyncTime;
  }

  /**
   * Check if sync is in progress
   */
  isSyncing() {
    return this.syncInProgress;
  }
}

// Export singleton instance
const outlookCalendarSyncService = new OutlookCalendarSyncService();
export default outlookCalendarSyncService;