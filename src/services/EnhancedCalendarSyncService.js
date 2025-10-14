// src/services/EnhancedCalendarSyncService.js
// Advanced bidirectional calendar sync with webhook support and conflict resolution

import { db } from './firebase';
import {
  collection, doc, setDoc, getDoc, updateDoc, deleteDoc,
  serverTimestamp, writeBatch, query, where, getDocs,
  onSnapshot, Timestamp
} from 'firebase/firestore';
import googleAuthService from './GoogleAuthService';
import { differenceInMinutes, isAfter, isBefore } from 'date-fns';

class EnhancedCalendarSyncService {
  constructor() {
    this.syncQueue = [];
    this.syncInProgress = false;
    this.webhookUrl = null;
    this.watchId = null;
    this.watchExpiry = null;
    this.listeners = new Map();
    this.conflictStrategy = 'smart'; // smart, local-wins, remote-wins, manual
    this.syncInterval = null;
    this.lastSyncToken = null;
    this.offlineQueue = [];
    this.familyId = null;
    this.userId = null;

    // Configuration
    this.config = {
      batchSize: 50,
      syncIntervalMs: 60000, // 1 minute for incremental sync
      webhookRenewalBuffer: 3600000, // Renew webhook 1 hour before expiry
      conflictWindowMinutes: 5,
      maxRetries: 3,
      retryDelayMs: 1000
    };

    // Initialize sync status
    this.syncStatus = {
      google: {
        connected: false,
        syncing: false,
        lastSync: null,
        lastError: null,
        eventssynced: 0,
        pendingChanges: 0
      }
    };

    // Subscribe to auth changes
    googleAuthService.onAuthChange(this.handleAuthChange.bind(this));

    // Don't initialize on creation - wait for explicit initialization with params
  }

  /**
   * Initialize the sync service with familyId and userId
   */
  async initialize(familyId, userId) {
    try {
      this.familyId = familyId;
      this.userId = userId;

      // Ensure googleAuthService is initialized
      if (!googleAuthService.isInitialized) {
        await googleAuthService.initialize();
      }

      // Load sync state from Firestore
      await this.loadSyncState(familyId);

      // Set up offline queue persistence
      this.setupOfflineQueue();

      // Start periodic sync if authenticated
      if (googleAuthService.isTokenValid()) {
        this.startPeriodicSync();
      }

      // Set up webhook if not already active
      if (this.webhookUrl && (!this.watchExpiry || Date.now() > this.watchExpiry - this.config.webhookRenewalBuffer)) {
        await this.setupWebhook(familyId);
      }

    } catch (error) {
      console.error('Failed to initialize EnhancedCalendarSyncService:', error);
      // Continue without throwing to prevent breaking the app
    }
  }

  /**
   * Handle authentication state changes
   */
  handleAuthChange(authState) {
    if (authState.authenticated) {
      this.syncStatus.google.connected = true;
      this.startPeriodicSync();
      this.processOfflineQueue();
    } else {
      this.syncStatus.google.connected = false;
      this.stopPeriodicSync();
    }
  }

  /**
   * Perform full calendar sync
   */
  async performFullSync(familyId, options = {}) {
    const {
      startDate = options.timeMin ? new Date(options.timeMin) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago or from timeMin
      endDate = options.timeMax ? new Date(options.timeMax) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year ahead or from timeMax
      bidirectional = options.bidirectional !== undefined ? options.bidirectional : true
    } = options;

    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return { success: false, error: 'Sync already in progress' };
    }

    this.syncInProgress = true;
    this.updateSyncStatus('google', { syncing: true });

    try {
      // Ensure authentication
      await googleAuthService.authenticate({ silent: true });

      const results = {
        fromGoogle: { created: 0, updated: 0, deleted: 0, conflicts: 0 },
        toGoogle: { created: 0, updated: 0, deleted: 0, errors: 0 }
      };

      // Step 1: Fetch all Google Calendar events
      const googleEvents = await this.fetchGoogleEvents(startDate, endDate);
      console.log(`Fetched ${googleEvents.length} events from Google Calendar`);

      // Step 2: Fetch all local events
      const localEvents = await this.fetchLocalEvents(familyId, startDate, endDate);
      console.log(`Fetched ${localEvents.length} local events`);

      // Step 3: Build sync maps
      const googleMap = new Map(googleEvents.map(e => [e.id, e]));
      const localMap = new Map(localEvents.map(e => [e.googleId || e.id, e]));

      // Step 4: Sync from Google to Local
      console.log(`📝 Starting sync: Processing ${googleEvents.length} Google events...`);
      console.log(`📝 FamilyId being used: "${familyId}"`);

      let processedCount = 0;
      let errorCount = 0;

      for (const googleEvent of googleEvents) {
        const localEvent = localMap.get(googleEvent.id);

        if (!localEvent) {
          // New event from Google
          try {
            console.log(`📝 Creating event ${processedCount + 1}/${googleEvents.length}: "${googleEvent.title}" (ID: ${googleEvent.id})`);
            const createdEvent = await this.createLocalEvent(familyId, googleEvent);
            console.log(`✅ Successfully created event in Firestore with ID: ${createdEvent.id}`);
            results.fromGoogle.created++;
            processedCount++;
          } catch (error) {
            console.error(`❌ Failed to create event "${googleEvent.title}":`, {
              error: error.message,
              stack: error.stack,
              eventData: googleEvent,
              familyId
            });
            errorCount++;
            // Continue with next event instead of crashing entire sync
          }
        } else {
          // Check for updates
          const conflict = await this.detectConflict(localEvent, googleEvent);
          if (conflict) {
            const resolution = await this.resolveConflict(localEvent, googleEvent);
            if (resolution.action === 'updateLocal') {
              await this.updateLocalEvent(localEvent.id, { ...googleEvent, userId: this.userId });
              results.fromGoogle.updated++;
            } else if (resolution.action === 'updateRemote' && bidirectional) {
              await this.updateGoogleEvent(googleEvent.id, localEvent);
              results.toGoogle.updated++;
            }
            results.fromGoogle.conflicts++;
          }
          processedCount++;
        }
      }

      console.log(`📝 Sync loop completed: ${processedCount} processed, ${results.fromGoogle.created} created, ${errorCount} errors`);

      // Step 5: Sync from Local to Google (if bidirectional)
      if (bidirectional) {
        for (const localEvent of localEvents) {
          if (!localEvent.googleId) {
            // Local event not in Google
            try {
              const googleEvent = await this.createGoogleEvent(localEvent);
              await this.updateLocalEvent(localEvent.id, { googleId: googleEvent.id });
              results.toGoogle.created++;
            } catch (error) {
              console.error('Failed to create Google event:', error);
              results.toGoogle.errors++;
            }
          } else if (!googleMap.has(localEvent.googleId)) {
            // Event deleted from Google
            if (localEvent.localOnly) {
              // Keep local-only events
              continue;
            }
            await this.deleteLocalEvent(localEvent.id);
            results.fromGoogle.deleted++;
          }
        }
      }

      // Step 6: Update sync state
      await this.saveSyncState(familyId, {
        lastSync: new Date(),
        lastSyncToken: this.lastSyncToken,
        results
      });

      this.updateSyncStatus('google', {
        syncing: false,
        lastSync: new Date(),
        eventssynced: results.fromGoogle.created + results.fromGoogle.updated + results.toGoogle.created + results.toGoogle.updated
      });

      console.log('Sync completed:', results);
      return { success: true, results };

    } catch (error) {
      console.error('Sync failed:', error);
      this.updateSyncStatus('google', {
        syncing: false,
        lastError: error.message
      });
      return { success: false, error: error.message };

    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Perform incremental sync using sync tokens
   */
  async performIncrementalSync(familyId) {
    if (!this.lastSyncToken) {
      // No sync token, perform full sync
      return this.performFullSync(familyId);
    }

    try {
      // Use sync token to get only changed events
      const changes = await googleAuthService.executeWithRetry(async () => {
        const response = await window.gapi.client.calendar.events.list({
          calendarId: 'primary',
          syncToken: this.lastSyncToken,
          showDeleted: true
        });
        return response.result;
      });

      // Process changes
      const results = { created: 0, updated: 0, deleted: 0 };

      for (const item of changes.items || []) {
        if (item.status === 'cancelled') {
          // Event was deleted
          await this.deleteLocalEventByGoogleId(familyId, item.id);
          results.deleted++;
        } else {
          // Event was created or updated
          const localEvent = await this.findLocalEventByGoogleId(familyId, item.id);
          if (localEvent) {
            await this.updateLocalEvent(localEvent.id, { ...item, userId: this.userId });
            results.updated++;
          } else {
            await this.createLocalEvent(familyId, item);
            results.created++;
          }
        }
      }

      // Update sync token
      if (changes.nextSyncToken) {
        this.lastSyncToken = changes.nextSyncToken;
        await this.saveSyncState(familyId, { lastSyncToken: this.lastSyncToken });
      }

      console.log('Incremental sync completed:', results);
      return { success: true, results };

    } catch (error) {
      if (error.code === 410) {
        // Sync token expired, need full sync
        console.log('Sync token expired, performing full sync');
        this.lastSyncToken = null;
        return this.performFullSync(familyId);
      }
      throw error;
    }
  }

  /**
   * Fetch events from Google Calendar
   */
  async fetchGoogleEvents(startDate, endDate) {
    return googleAuthService.executeWithRetry(async () => {
      console.log('📅 SYNC DEBUG: Fetching Google events with date range:');
      console.log('  📍 Start Date:', startDate.toISOString(), '→', startDate.toLocaleString());
      console.log('  📍 End Date:', endDate.toISOString(), '→', endDate.toLocaleString());

      const response = await window.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 2500
      });

      const events = (response.result.items || []).map(event => this.transformGoogleEvent(event));

      console.log(`📅 SYNC DEBUG: Google Calendar returned ${events.length} events`);
      if (events.length > 0) {
        console.log('  📍 First event:', events[0].title, 'on', events[0].startDate);
        console.log('  📍 Last event:', events[events.length - 1].title, 'on', events[events.length - 1].startDate);

        // Show October 2025 events specifically
        const octoberEvents = events.filter(e => {
          const eventDate = new Date(e.startDate);
          return eventDate.getMonth() === 9 && eventDate.getFullYear() === 2025;
        });
        console.log(`  📍 October 2025 events found: ${octoberEvents.length}`);
        if (octoberEvents.length > 0) {
          octoberEvents.forEach(e => console.log('    ✓', e.title, 'on', e.startDate));
        }
      }

      return events;
    });
  }

  /**
   * Fetch local events from Firestore
   */
  async fetchLocalEvents(familyId, startDate, endDate) {
    const eventsRef = collection(db, 'events');
    const q = query(
      eventsRef,
      where('familyId', '==', familyId),
      where('startDate', '>=', Timestamp.fromDate(startDate)),
      where('startDate', '<=', Timestamp.fromDate(endDate))
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Transform Google event to local format
   */
  transformGoogleEvent(googleEvent) {
    try {
      const transformed = {
        id: googleEvent.id,
        title: googleEvent.summary || 'Untitled Event',
        description: googleEvent.description || '',
        location: googleEvent.location || '',
        startDate: googleEvent.start?.dateTime || googleEvent.start?.date,
        endDate: googleEvent.end?.dateTime || googleEvent.end?.date,
        allDay: !googleEvent.start?.dateTime,
        googleId: googleEvent.id,
        googleEtag: googleEvent.etag || '',
        googleUpdated: googleEvent.updated || '',
        status: googleEvent.status || 'confirmed',
        source: 'google'
      };

      // Only add fields that are not undefined
      if (googleEvent.recurrence) {
        transformed.recurrence = googleEvent.recurrence;
      }

      if (googleEvent.attendees && googleEvent.attendees.length > 0) {
        transformed.attendees = googleEvent.attendees.map(att => ({
          email: att.email || '',
          name: att.displayName || att.email || 'Unknown',
          responseStatus: att.responseStatus || 'needsAction',
          organizer: att.organizer || false
        }));
      }

      if (googleEvent.reminders) {
        transformed.reminders = googleEvent.reminders;
      }

      if (googleEvent.visibility) {
        transformed.visibility = googleEvent.visibility;
      }

      if (googleEvent.colorId) {
        transformed.colorId = googleEvent.colorId;
      }

      // Handle recurring events
      if (googleEvent.recurringEventId) {
        transformed.recurringEventId = googleEvent.recurringEventId;
        if (googleEvent.originalStartTime) {
          transformed.originalStartTime = googleEvent.originalStartTime;
        }
      }

      // Filter out any undefined values that might have slipped through
      const filtered = this.filterUndefinedValues(transformed);

      // Add debug logging to catch undefined values before they reach Firestore
      Object.keys(filtered).forEach(key => {
        if (filtered[key] === undefined) {
          console.error(`UNDEFINED VALUE DETECTED in field '${key}' for event '${googleEvent.id}':`, {
            originalValue: transformed[key],
            googleEvent: googleEvent,
            field: key
          });
          // Remove the undefined field
          delete filtered[key];
        }
      });

      return filtered;
    } catch (error) {
      console.error('Error transforming Google event:', googleEvent, error);
      throw error;
    }
  }

  /**
   * Remove undefined values from an object (Firestore doesn't allow them)
   */
  filterUndefinedValues(obj) {
    const filtered = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined) {
        filtered[key] = obj[key];
      }
    });
    return filtered;
  }

  /**
   * Transform local event to Google format
   */
  transformLocalEvent(localEvent) {
    const googleEvent = {
      summary: localEvent.title,
      description: localEvent.description || '',
      location: localEvent.location || '',
      start: {},
      end: {}
    };

    if (localEvent.allDay) {
      googleEvent.start.date = localEvent.startDate.split('T')[0];
      googleEvent.end.date = localEvent.endDate?.split('T')[0] || localEvent.startDate.split('T')[0];
    } else {
      googleEvent.start.dateTime = localEvent.startDate;
      googleEvent.end.dateTime = localEvent.endDate || localEvent.startDate;
      googleEvent.start.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      googleEvent.end.timeZone = googleEvent.start.timeZone;
    }

    if (localEvent.attendees?.length) {
      googleEvent.attendees = localEvent.attendees.map(att => ({
        email: att.email,
        displayName: att.name
      }));
    }

    if (localEvent.reminders) {
      googleEvent.reminders = localEvent.reminders;
    }

    if (localEvent.recurrence) {
      googleEvent.recurrence = Array.isArray(localEvent.recurrence)
        ? localEvent.recurrence
        : [localEvent.recurrence];
    }

    return googleEvent;
  }

  /**
   * Detect conflicts between local and Google events
   */
  async detectConflict(localEvent, googleEvent) {
    // Parse dates
    const localUpdated = localEvent.updatedAt?.toDate?.() || new Date(localEvent.updatedAt || 0);
    const googleUpdated = new Date(googleEvent.googleUpdated || 0);

    // Check if events were updated within conflict window
    const timeDiff = Math.abs(differenceInMinutes(localUpdated, googleUpdated));
    if (timeDiff < this.config.conflictWindowMinutes) {
      // Events were updated around the same time - potential conflict
      return {
        type: 'concurrent_update',
        localUpdated,
        googleUpdated,
        fields: this.getChangedFields(localEvent, googleEvent)
      };
    }

    // Check for content differences
    const changedFields = this.getChangedFields(localEvent, googleEvent);
    if (changedFields.length > 0) {
      return {
        type: 'content_mismatch',
        localUpdated,
        googleUpdated,
        fields: changedFields
      };
    }

    return null;
  }

  /**
   * Get changed fields between events
   */
  getChangedFields(localEvent, googleEvent) {
    const changes = [];

    if (localEvent.title !== googleEvent.title) changes.push('title');
    if (localEvent.description !== googleEvent.description) changes.push('description');
    if (localEvent.location !== googleEvent.location) changes.push('location');
    if (localEvent.startDate !== googleEvent.startDate) changes.push('startDate');
    if (localEvent.endDate !== googleEvent.endDate) changes.push('endDate');

    return changes;
  }

  /**
   * Resolve conflicts between local and Google events
   */
  async resolveConflict(localEvent, googleEvent) {
    switch (this.conflictStrategy) {
      case 'local-wins':
        return { action: 'updateRemote', event: localEvent };

      case 'remote-wins':
        return { action: 'updateLocal', event: googleEvent };

      case 'smart':
        // Smart resolution based on modification time and importance
        const localUpdated = localEvent.updatedAt?.toDate?.() || new Date(localEvent.updatedAt || 0);
        const googleUpdated = new Date(googleEvent.googleUpdated || 0);

        // Prefer the most recently updated
        if (isAfter(localUpdated, googleUpdated)) {
          return { action: 'updateRemote', event: localEvent };
        } else {
          return { action: 'updateLocal', event: googleEvent };
        }

      case 'manual':
      default:
        // Store conflict for manual resolution
        await this.storeConflict(localEvent, googleEvent);
        return { action: 'manual', localEvent, googleEvent };
    }
  }

  /**
   * Create local event from Google event
   */
  async createLocalEvent(familyId, googleEvent) {
    console.log(`📝 createLocalEvent called with:`, {
      familyId,
      eventTitle: googleEvent.title,
      eventId: googleEvent.id
    });

    if (!familyId) {
      throw new Error('createLocalEvent: familyId is required but was null/undefined');
    }

    // CRITICAL: Check if event already exists to prevent duplicates
    if (googleEvent.googleId) {
      const existing = await this.findLocalEventByGoogleId(familyId, googleEvent.googleId);
      if (existing) {
        try {
          console.log(`⚠️ Event "${googleEvent.title}" already exists (ID: ${existing.id}), updating instead of creating`);
          await this.updateLocalEvent(existing.id, { ...googleEvent, userId: this.userId });
          return existing;
        } catch (updateError) {
          // Document doesn't actually exist (stale cache or timing issue)
          // Fall through to create a new event instead
          console.log(`⚠️ Update failed for "${googleEvent.title}", creating new event instead:`, updateError.message);
        }
      }
    }

    const eventRef = doc(collection(db, 'events'));

    // Convert startDate/endDate to Firestore Timestamps for startTime/endTime
    // This ensures compatibility with CalendarServiceV2 queries
    const startTime = googleEvent.startDate ? Timestamp.fromDate(new Date(googleEvent.startDate)) : null;
    const endTime = googleEvent.endDate ? Timestamp.fromDate(new Date(googleEvent.endDate)) : null;

    const eventData = this.filterUndefinedValues({
      ...googleEvent,
      familyId,
      userId: this.userId,  // Add userId for query compatibility
      startTime,  // Add Firestore Timestamp field
      endTime,    // Add Firestore Timestamp field
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      syncedAt: serverTimestamp()
    });

    console.log(`📝 Writing to Firestore with eventData:`, {
      firestoreId: eventRef.id,
      familyId: eventData.familyId,
      title: eventData.title,
      startDate: eventData.startDate,
      startTime: eventData.startTime,
      source: eventData.source
    });

    try {
      await setDoc(eventRef, eventData);
      console.log(`✅ setDoc completed successfully for event ${eventRef.id}`);
      return { id: eventRef.id, ...eventData };
    } catch (firestoreError) {
      console.error(`❌ Firestore setDoc failed:`, {
        error: firestoreError.message,
        code: firestoreError.code,
        eventRef: eventRef.id,
        eventData
      });
      throw firestoreError;
    }
  }

  /**
   * Update local event
   */
  async updateLocalEvent(eventId, updates) {
    const eventRef = doc(db, 'events', eventId);
    const filteredUpdates = this.filterUndefinedValues({
      ...updates,
      updatedAt: serverTimestamp(),
      syncedAt: serverTimestamp()
    });
    await updateDoc(eventRef, filteredUpdates);
  }

  /**
   * Delete local event
   */
  async deleteLocalEvent(eventId) {
    const eventRef = doc(db, 'events', eventId);
    await deleteDoc(eventRef);
  }

  /**
   * Create Google Calendar event
   */
  async createGoogleEvent(localEvent) {
    const googleEvent = this.transformLocalEvent(localEvent);

    return googleAuthService.executeWithRetry(async () => {
      const response = await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: googleEvent
      });
      return response.result;
    });
  }

  /**
   * Update Google Calendar event
   */
  async updateGoogleEvent(eventId, localEvent) {
    const googleEvent = this.transformLocalEvent(localEvent);

    return googleAuthService.executeWithRetry(async () => {
      const response = await window.gapi.client.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: googleEvent
      });
      return response.result;
    });
  }

  /**
   * Delete Google Calendar event
   */
  async deleteGoogleEvent(eventId) {
    return googleAuthService.executeWithRetry(async () => {
      await window.gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      });
    });
  }

  /**
   * Set up webhook for real-time updates
   */
  async setupWebhook(familyId) {
    if (!this.webhookUrl) {
      // Generate webhook URL (in production, this would be your server endpoint)
      this.webhookUrl = `${window.location.origin}/api/calendar-webhook/${familyId}`;
    }

    try {
      const response = await googleAuthService.executeWithRetry(async () => {
        return await window.gapi.client.calendar.events.watch({
          calendarId: 'primary',
          resource: {
            id: `watch-${familyId}-${Date.now()}`,
            type: 'web_hook',
            address: this.webhookUrl,
            expiration: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
          }
        });
      });

      this.watchId = response.result.id;
      this.watchExpiry = response.result.expiration;

      // Schedule webhook renewal
      this.scheduleWebhookRenewal();

      console.log('Webhook set up successfully:', this.watchId);
      return true;

    } catch (error) {
      console.error('Failed to set up webhook:', error);
      // Fall back to polling
      this.startPeriodicSync();
      return false;
    }
  }

  /**
   * Schedule webhook renewal before expiry
   */
  scheduleWebhookRenewal() {
    if (this.webhookRenewalTimer) {
      clearTimeout(this.webhookRenewalTimer);
    }

    if (!this.watchExpiry) return;

    const renewIn = this.watchExpiry - Date.now() - this.config.webhookRenewalBuffer;
    if (renewIn > 0) {
      this.webhookRenewalTimer = setTimeout(() => {
        this.setupWebhook();
      }, renewIn);
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
      if (!this.syncInProgress && googleAuthService.isTokenValid()) {
        const familyId = this.getCurrentFamilyId();
        if (familyId) {
          await this.performIncrementalSync(familyId);
        }
      }
    }, this.config.syncIntervalMs);
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Setup offline queue
   */
  setupOfflineQueue() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('Back online, processing offline queue');
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      console.log('Gone offline, queueing changes');
    });

    // Load any existing offline queue
    const saved = localStorage.getItem('calendar_offline_queue');
    if (saved) {
      try {
        this.offlineQueue = JSON.parse(saved);
      } catch (error) {
        console.error('Failed to load offline queue:', error);
        this.offlineQueue = [];
      }
    }
  }

  /**
   * Process offline queue
   */
  async processOfflineQueue() {
    if (this.offlineQueue.length === 0) return;

    console.log(`Processing ${this.offlineQueue.length} offline changes`);

    const processed = [];
    const failed = [];

    for (const item of this.offlineQueue) {
      try {
        switch (item.action) {
          case 'create':
            await this.createGoogleEvent(item.data);
            break;
          case 'update':
            await this.updateGoogleEvent(item.eventId, item.data);
            break;
          case 'delete':
            await this.deleteGoogleEvent(item.eventId);
            break;
        }
        processed.push(item);
      } catch (error) {
        console.error('Failed to process offline item:', error);
        failed.push(item);
      }
    }

    // Update queue with failed items
    this.offlineQueue = failed;
    localStorage.setItem('calendar_offline_queue', JSON.stringify(this.offlineQueue));

    console.log(`Processed ${processed.length} items, ${failed.length} failed`);
  }

  /**
   * Add to offline queue
   */
  addToOfflineQueue(action, data) {
    const item = {
      action,
      data,
      timestamp: Date.now(),
      id: `offline-${Date.now()}-${Math.random()}`
    };

    this.offlineQueue.push(item);
    localStorage.setItem('calendar_offline_queue', JSON.stringify(this.offlineQueue));
  }

  /**
   * Update sync status
   */
  updateSyncStatus(provider, updates) {
    this.syncStatus[provider] = {
      ...this.syncStatus[provider],
      ...updates
    };

    // Notify listeners
    this.notifySyncStatusChange();
  }

  /**
   * Subscribe to sync status changes
   */
  onSyncStatusChange(callback) {
    const id = `listener-${Date.now()}-${Math.random()}`;
    this.listeners.set(id, callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(id);
    };
  }

  /**
   * Notify sync status change
   */
  notifySyncStatusChange() {
    this.listeners.forEach(callback => {
      try {
        callback(this.syncStatus);
      } catch (error) {
        console.error('Error in sync status listener:', error);
      }
    });
  }

  /**
   * Load sync state from Firestore
   */
  async loadSyncState(familyId) {
    if (!familyId) {
      familyId = this.getCurrentFamilyId();
    }
    if (!familyId) return;

    try {
      const stateDoc = await getDoc(doc(db, 'calendarSyncState', familyId));
      if (stateDoc.exists()) {
        const state = stateDoc.data();
        this.lastSyncToken = state.lastSyncToken;
        this.syncStatus.google.lastSync = state.lastSync?.toDate();
        return state;
      }
    } catch (error) {
      console.error('Failed to load sync state:', error);
    }
    return null;
  }

  /**
   * Save sync state to Firestore
   */
  async saveSyncState(familyId, updates) {
    try {
      const stateRef = doc(db, 'calendarSyncState', familyId);
      await setDoc(stateRef, {
        ...updates,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Failed to save sync state:', error);
    }
  }

  /**
   * Get current family ID
   */
  getCurrentFamilyId() {
    // Use stored familyId if available
    if (this.familyId) {
      return this.familyId;
    }

    // Try multiple sources
    return localStorage.getItem('selectedFamilyId') ||
           window.familyContext?.familyId ||
           null;
  }

  /**
   * Store conflict for manual resolution
   */
  async storeConflict(localEvent, googleEvent) {
    const conflictRef = doc(collection(db, 'calendarConflicts'));
    await setDoc(conflictRef, {
      localEvent,
      googleEvent,
      detected: serverTimestamp(),
      resolved: false
    });
  }

  /**
   * Get unresolved conflicts
   */
  async getUnresolvedConflicts(familyId) {
    const conflictsRef = collection(db, 'calendarConflicts');
    const q = query(
      conflictsRef,
      where('resolved', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Find local event by Google ID
   */
  async findLocalEventByGoogleId(familyId, googleId) {
    const eventsRef = collection(db, 'events');
    const q = query(
      eventsRef,
      where('familyId', '==', familyId),
      where('googleId', '==', googleId)
    );

    const snapshot = await getDocs(q);
    return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  }

  /**
   * Delete local event by Google ID
   */
  async deleteLocalEventByGoogleId(familyId, googleId) {
    const event = await this.findLocalEventByGoogleId(familyId, googleId);
    if (event) {
      await this.deleteLocalEvent(event.id);
    }
  }
}

// Export singleton instance
const enhancedCalendarSyncService = new EnhancedCalendarSyncService();
export default enhancedCalendarSyncService;