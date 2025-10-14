// School Calendar Sync Service
// Fetches and syncs iCalendar feeds from school management systems (InfoMentor, Skolon, etc.)
// Integrates with Allie's existing calendar system

import { db } from './firebase';
import {
  collection, doc, setDoc, getDocs, query, where,
  serverTimestamp, Timestamp, writeBatch
} from 'firebase/firestore';
import ICAL from 'ical.js';

class SchoolCalendarSyncService {
  constructor() {
    this.schoolCalendars = new Map(); // childId -> calendar config
    this.syncInterval = null;
    this.syncInProgress = false;

    // Configuration
    this.config = {
      syncIntervalMs: 3600000, // 1 hour
      batchSize: 50,
      maxRetries: 3
    };
  }

  /**
   * Add a school calendar for a child
   * @param {string} childId - The child's ID
   * @param {string} childName - The child's name
   * @param {string} calendarUrl - The webcal:// or https:// URL to the iCal feed
   * @param {string} schoolName - The school name (e.g., "InfoMentor")
   */
  async addSchoolCalendar(familyId, childId, childName, calendarUrl, schoolName = 'School') {
    // Convert webcal:// to https://
    const httpUrl = calendarUrl.replace(/^webcal:\/\//, 'https://');

    const config = {
      familyId,
      childId,
      childName,
      calendarUrl: httpUrl,
      schoolName,
      lastSync: null,
      enabled: true,
      createdAt: new Date().toISOString()
    };

    this.schoolCalendars.set(childId, config);

    // Save to Firestore
    await this.saveCalendarConfig(familyId, childId, config);

    // Perform initial sync
    await this.syncSchoolCalendar(childId);

    console.log(`✅ Added school calendar for ${childName}: ${schoolName}`);

    return config;
  }

  /**
   * Save calendar configuration to Firestore
   */
  async saveCalendarConfig(familyId, childId, config) {
    const configRef = doc(db, 'schoolCalendarConfigs', `${familyId}_${childId}`);
    await setDoc(configRef, {
      ...config,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Load all school calendar configurations for a family
   */
  async loadSchoolCalendars(familyId) {
    const configsRef = collection(db, 'schoolCalendarConfigs');
    const q = query(configsRef, where('familyId', '==', familyId));
    const snapshot = await getDocs(q);

    snapshot.forEach(doc => {
      const config = doc.data();
      if (config.enabled) {
        this.schoolCalendars.set(config.childId, config);
      }
    });

    console.log(`📚 Loaded ${this.schoolCalendars.size} school calendar(s) for family ${familyId}`);

    return Array.from(this.schoolCalendars.values());
  }

  /**
   * Fetch and parse iCalendar feed
   */
  async fetchICalFeed(url) {
    try {
      // Use a CORS proxy for development, or backend proxy for production
      const proxyUrl = process.env.NODE_ENV === 'production'
        ? `${process.env.REACT_APP_API_URL || 'https://allie-claude-api-4eckwlczwa-uc.a.run.app'}/api/proxy-ical?url=${encodeURIComponent(url)}`
        : url; // In dev, try direct access (may fail due to CORS)

      console.log(`📅 Fetching iCal feed from: ${url}`);

      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/calendar, text/plain, */*'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch calendar: ${response.status} ${response.statusText}`);
      }

      const icalData = await response.text();
      console.log(`📅 Received iCal data (${icalData.length} characters)`);

      return icalData;

    } catch (error) {
      console.error('Error fetching iCal feed:', error);
      throw error;
    }
  }

  /**
   * Parse iCalendar data into events
   */
  parseICalData(icalData) {
    try {
      const jcalData = ICAL.parse(icalData);
      const comp = new ICAL.Component(jcalData);
      const vevents = comp.getAllSubcomponents('vevent');

      const events = vevents.map(vevent => {
        const event = new ICAL.Event(vevent);

        // Extract event data
        const uid = event.uid || `imported-${Date.now()}-${Math.random()}`;
        const summary = event.summary || 'Untitled Event';
        const description = event.description || '';
        const location = event.location || '';

        // Handle dates
        let startDate, endDate, allDay;

        if (event.startDate) {
          startDate = event.startDate.toJSDate();
          allDay = event.startDate.isDate; // True if no time component
        }

        if (event.endDate) {
          endDate = event.endDate.toJSDate();
        } else {
          // Default to 1 hour duration if no end date
          endDate = new Date(startDate.getTime() + 3600000);
        }

        // Handle recurrence rules
        let recurrence = null;
        if (event.isRecurring()) {
          const rrule = vevent.getFirstPropertyValue('rrule');
          if (rrule) {
            recurrence = rrule.toString();
          }
        }

        return {
          uid,
          title: summary,
          description,
          location,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          allDay: allDay || false,
          recurrence,
          source: 'school'
        };
      });

      console.log(`📅 Parsed ${events.length} events from iCal feed`);
      return events;

    } catch (error) {
      console.error('Error parsing iCal data:', error);
      throw new Error(`Failed to parse iCal data: ${error.message}`);
    }
  }

  /**
   * Sync a specific child's school calendar
   */
  async syncSchoolCalendar(childId) {
    const config = this.schoolCalendars.get(childId);
    if (!config) {
      throw new Error(`No calendar config found for child ${childId}`);
    }

    if (!config.enabled) {
      console.log(`📅 Calendar sync disabled for ${config.childName}`);
      return { success: false, reason: 'disabled' };
    }

    console.log(`📅 Starting sync for ${config.childName}'s ${config.schoolName} calendar...`);

    try {
      // Fetch iCal feed
      const icalData = await this.fetchICalFeed(config.calendarUrl);

      // Parse events
      const events = this.parseICalData(icalData);

      // Import events to Firestore
      const result = await this.importEventsToFirestore(config.familyId, childId, config.childName, events);

      // Update last sync time
      config.lastSync = new Date().toISOString();
      await this.saveCalendarConfig(config.familyId, childId, config);

      console.log(`✅ Sync completed for ${config.childName}: ${result.imported} events imported`);

      return {
        success: true,
        ...result
      };

    } catch (error) {
      console.error(`❌ Sync failed for ${config.childName}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Import parsed events to Firestore
   */
  async importEventsToFirestore(familyId, childId, childName, events) {
    const eventsRef = collection(db, 'events');
    const batch = writeBatch(db);

    let imported = 0;
    let skipped = 0;
    let updated = 0;

    // Get existing school events for this child to avoid duplicates
    const existingQuery = query(
      eventsRef,
      where('familyId', '==', familyId),
      where('source', '==', 'school'),
      where('childId', '==', childId)
    );
    const existingSnapshot = await getDocs(existingQuery);
    const existingEvents = new Map();
    existingSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.schoolEventUid) {
        existingEvents.set(data.schoolEventUid, { id: doc.id, ...data });
      }
    });

    console.log(`📅 Found ${existingEvents.size} existing school events for ${childName}`);

    for (const event of events) {
      const existing = existingEvents.get(event.uid);

      // Create event data
      const eventData = {
        familyId,
        childId,
        childName,
        schoolEventUid: event.uid,
        title: event.title,
        description: event.description,
        location: event.location,
        startDate: event.startDate,
        endDate: event.endDate,
        allDay: event.allDay,
        source: 'school',
        sourceType: 'infomentor', // Could be 'skolon', 'google-classroom', etc.
        category: 'school',
        color: '#4285F4', // Blue for school events
        editable: false, // School events are read-only
        deletable: false
      };

      // Add Firestore Timestamps for queries (compatibility with existing calendar system)
      eventData.startTime = Timestamp.fromDate(new Date(event.startDate));
      eventData.endTime = Timestamp.fromDate(new Date(event.endDate));

      if (event.recurrence) {
        eventData.recurrence = event.recurrence;
      }

      if (existing) {
        // Check if event has changed
        const hasChanged = this.hasEventChanged(existing, eventData);

        if (hasChanged) {
          const eventRef = doc(db, 'events', existing.id);
          batch.update(eventRef, {
            ...eventData,
            updatedAt: serverTimestamp()
          });
          updated++;
        } else {
          skipped++;
        }
      } else {
        // Create new event
        const newEventRef = doc(eventsRef);
        batch.set(newEventRef, {
          ...eventData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        imported++;
      }
    }

    // Commit batch
    if (imported > 0 || updated > 0) {
      await batch.commit();
      console.log(`✅ Batch committed: ${imported} created, ${updated} updated, ${skipped} skipped`);
    } else {
      console.log(`📅 No changes detected, skipped ${skipped} events`);
    }

    return {
      imported,
      updated,
      skipped,
      total: events.length
    };
  }

  /**
   * Check if event has changed (for update detection)
   */
  hasEventChanged(existing, newEvent) {
    const fieldsToCheck = ['title', 'description', 'location', 'startDate', 'endDate', 'allDay'];

    for (const field of fieldsToCheck) {
      if (existing[field] !== newEvent[field]) {
        return true;
      }
    }

    return false;
  }

  /**
   * Sync all school calendars
   */
  async syncAllSchoolCalendars() {
    if (this.syncInProgress) {
      console.log('⏳ Sync already in progress');
      return { success: false, error: 'Sync already in progress' };
    }

    this.syncInProgress = true;

    try {
      const results = [];

      for (const [childId, config] of this.schoolCalendars) {
        const result = await this.syncSchoolCalendar(childId);
        results.push({
          childId,
          childName: config.childName,
          ...result
        });
      }

      console.log(`✅ Synced ${results.length} school calendar(s)`);

      return {
        success: true,
        results
      };

    } catch (error) {
      console.error('❌ School calendar sync failed:', error);
      return {
        success: false,
        error: error.message
      };

    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Start periodic sync
   */
  startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      if (!this.syncInProgress && this.schoolCalendars.size > 0) {
        console.log('🔄 Starting periodic school calendar sync...');
        await this.syncAllSchoolCalendars();
      }
    }, this.config.syncIntervalMs);

    console.log(`🔄 Periodic sync started (every ${this.config.syncIntervalMs / 60000} minutes)`);
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('🛑 Periodic sync stopped');
    }
  }

  /**
   * Remove a school calendar
   */
  async removeSchoolCalendar(familyId, childId) {
    const config = this.schoolCalendars.get(childId);
    if (!config) {
      return { success: false, error: 'Calendar not found' };
    }

    // Disable in Firestore
    await this.saveCalendarConfig(familyId, childId, { ...config, enabled: false });

    // Remove from memory
    this.schoolCalendars.delete(childId);

    console.log(`🗑️ Removed school calendar for child ${childId}`);

    return { success: true };
  }

  /**
   * Get school events for a child
   */
  async getSchoolEvents(familyId, childId, startDate, endDate) {
    const eventsRef = collection(db, 'events');
    const q = query(
      eventsRef,
      where('familyId', '==', familyId),
      where('childId', '==', childId),
      where('source', '==', 'school'),
      where('startTime', '>=', Timestamp.fromDate(startDate)),
      where('startTime', '<=', Timestamp.fromDate(endDate))
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

// Export singleton instance
const schoolCalendarSyncService = new SchoolCalendarSyncService();
export default schoolCalendarSyncService;
