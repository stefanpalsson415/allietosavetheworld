// src/components/calendar-v2/services/CalendarSyncService.js

export class CalendarSyncService {
  constructor() {
    this.syncAdapters = new Map();
    this.syncStatus = new Map();
  }

  /**
   * Register a sync adapter for a calendar provider
   */
  registerAdapter(provider, adapter) {
    this.syncAdapters.set(provider, adapter);
  }

  /**
   * Initialize sync for a provider
   */
  async initializeSync(provider, config) {
    const adapter = this.syncAdapters.get(provider);
    if (!adapter) {
      throw new Error(`No adapter registered for provider: ${provider}`);
    }

    try {
      await adapter.initialize(config);
      this.setSyncStatus(provider, 'connected');
      return true;
    } catch (error) {
      this.setSyncStatus(provider, 'error', error.message);
      throw error;
    }
  }

  /**
   * Sync events from external calendar to local
   */
  async syncFromExternal(provider, options = {}) {
    const adapter = this.syncAdapters.get(provider);
    if (!adapter) {
      throw new Error(`No adapter registered for provider: ${provider}`);
    }

    this.setSyncStatus(provider, 'syncing');

    try {
      const { startDate, endDate } = options;
      const externalEvents = await adapter.fetchEvents(startDate, endDate);
      
      // Transform external events to our format
      const transformedEvents = externalEvents.map(event => 
        this.transformExternalEvent(event, provider)
      );

      this.setSyncStatus(provider, 'connected', null, new Date());
      return transformedEvents;
    } catch (error) {
      this.setSyncStatus(provider, 'error', error.message);
      throw error;
    }
  }

  /**
   * Sync local events to external calendar
   */
  async syncToExternal(provider, events) {
    const adapter = this.syncAdapters.get(provider);
    if (!adapter) {
      throw new Error(`No adapter registered for provider: ${provider}`);
    }

    this.setSyncStatus(provider, 'syncing');

    try {
      const results = [];
      
      for (const event of events) {
        if (event.syncedCalendars?.[provider]) {
          // Update existing event
          const result = await adapter.updateEvent(
            event.syncedCalendars[provider].id,
            this.transformToExternalEvent(event, provider)
          );
          results.push({ ...event, syncStatus: 'updated', externalId: result.id });
        } else {
          // Create new event
          const result = await adapter.createEvent(
            this.transformToExternalEvent(event, provider)
          );
          results.push({ 
            ...event, 
            syncStatus: 'created', 
            externalId: result.id,
            syncedCalendars: {
              ...event.syncedCalendars,
              [provider]: { id: result.id, lastSync: new Date() }
            }
          });
        }
      }

      this.setSyncStatus(provider, 'connected', null, new Date());
      return results;
    } catch (error) {
      this.setSyncStatus(provider, 'error', error.message);
      throw error;
    }
  }

  /**
   * Delete event from external calendar
   */
  async deleteFromExternal(provider, eventId, externalId) {
    const adapter = this.syncAdapters.get(provider);
    if (!adapter) {
      throw new Error(`No adapter registered for provider: ${provider}`);
    }

    try {
      await adapter.deleteEvent(externalId);
      return true;
    } catch (error) {
      console.error(`Failed to delete event from ${provider}:`, error);
      return false;
    }
  }

  /**
   * Transform external event to our format
   */
  transformExternalEvent(externalEvent, provider) {
    const baseEvent = {
      title: externalEvent.summary || externalEvent.subject || 'Untitled Event',
      startTime: new Date(externalEvent.start.dateTime || externalEvent.start.date),
      endTime: new Date(externalEvent.end.dateTime || externalEvent.end.date),
      description: externalEvent.description || externalEvent.body?.content || '',
      location: externalEvent.location || externalEvent.location?.displayName || '',
      source: provider,
      externalId: externalEvent.id,
      syncedCalendars: {
        [provider]: {
          id: externalEvent.id,
          lastSync: new Date()
        }
      }
    };

    // Handle all-day events
    if (externalEvent.start.date && !externalEvent.start.dateTime) {
      baseEvent.allDay = true;
    }

    // Handle attendees
    if (externalEvent.attendees) {
      baseEvent.externalAttendees = externalEvent.attendees.map(att => ({
        email: att.email || att.emailAddress?.address,
        name: att.displayName || att.emailAddress?.name,
        responseStatus: att.responseStatus || att.status?.response
      }));
    }

    // Handle recurrence
    if (externalEvent.recurrence || externalEvent.recurrencePattern) {
      baseEvent.recurrence = this.parseRecurrence(
        externalEvent.recurrence || externalEvent.recurrencePattern
      );
    }

    // Handle reminders
    if (externalEvent.reminders?.overrides || externalEvent.reminder) {
      baseEvent.reminders = this.parseReminders(
        externalEvent.reminders || externalEvent.reminder
      );
    }

    // Map categories
    baseEvent.category = this.mapCategory(externalEvent);

    return baseEvent;
  }

  /**
   * Transform our event to external format
   */
  transformToExternalEvent(event, provider) {
    const externalEvent = {
      summary: event.title,
      description: event.description || '',
      location: event.location || '',
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: event.endTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    // Handle all-day events
    if (event.allDay) {
      externalEvent.start = { date: event.startTime.toISOString().split('T')[0] };
      externalEvent.end = { date: event.endTime.toISOString().split('T')[0] };
    }

    // Add provider-specific fields
    if (provider === 'outlook') {
      externalEvent.subject = event.title;
      externalEvent.body = { contentType: 'text', content: event.description || '' };
      if (event.location) {
        externalEvent.location = { displayName: event.location };
      }
    }

    return externalEvent;
  }

  /**
   * Parse recurrence rules
   */
  parseRecurrence(recurrence) {
    if (Array.isArray(recurrence)) {
      // Google Calendar format
      const rule = recurrence[0];
      return this.parseRRule(rule);
    } else {
      // Outlook format
      return {
        frequency: recurrence.pattern?.type?.toLowerCase(),
        interval: recurrence.pattern?.interval,
        daysOfWeek: recurrence.pattern?.daysOfWeek,
        endDate: recurrence.range?.endDate
      };
    }
  }

  /**
   * Parse RRULE string
   */
  parseRRule(rrule) {
    const parts = rrule.split(';').reduce((acc, part) => {
      const [key, value] = part.split('=');
      acc[key] = value;
      return acc;
    }, {});

    return {
      frequency: parts.FREQ?.toLowerCase(),
      interval: parseInt(parts.INTERVAL) || 1,
      until: parts.UNTIL ? new Date(parts.UNTIL) : null,
      count: parts.COUNT ? parseInt(parts.COUNT) : null,
      byDay: parts.BYDAY?.split(',')
    };
  }

  /**
   * Parse reminders
   */
  parseReminders(reminders) {
    if (reminders?.overrides) {
      // Google Calendar format
      return reminders.overrides.map(r => ({
        method: r.method,
        minutes: r.minutes
      }));
    } else if (typeof reminders === 'number') {
      // Outlook format (minutes before)
      return [{
        method: 'popup',
        minutes: reminders
      }];
    }
    return [];
  }

  /**
   * Map external categories to our categories
   */
  mapCategory(externalEvent) {
    const title = (externalEvent.summary || externalEvent.subject || '').toLowerCase();
    const categories = externalEvent.categories || [];

    // Check for medical keywords
    if (title.includes('doctor') || title.includes('appointment') || 
        title.includes('medical') || categories.includes('Medical')) {
      return 'medical';
    }

    // Check for school keywords
    if (title.includes('school') || title.includes('parent-teacher') || 
        title.includes('pta') || categories.includes('School')) {
      return 'school';
    }

    // Check for work keywords
    if (title.includes('meeting') || title.includes('work') || 
        categories.includes('Work')) {
      return 'work';
    }

    // Check for activity keywords
    if (title.includes('practice') || title.includes('game') || 
        title.includes('lesson') || categories.includes('Activity')) {
      return 'activity';
    }

    return 'personal';
  }

  /**
   * Get sync status for a provider
   */
  getSyncStatus(provider) {
    return this.syncStatus.get(provider) || { status: 'disconnected' };
  }

  /**
   * Set sync status
   */
  setSyncStatus(provider, status, error = null, lastSync = null) {
    this.syncStatus.set(provider, {
      status,
      error,
      lastSync: lastSync || this.syncStatus.get(provider)?.lastSync,
      lastUpdated: new Date()
    });
  }

  /**
   * Get all sync statuses
   */
  getAllSyncStatuses() {
    const statuses = {};
    for (const [provider, status] of this.syncStatus.entries()) {
      statuses[provider] = status;
    }
    return statuses;
  }

  /**
   * Handle sync conflicts
   */
  resolveConflict(localEvent, externalEvent, strategy = 'local') {
    if (strategy === 'local') {
      // Local wins - update external
      return { action: 'updateExternal', event: localEvent };
    } else if (strategy === 'external') {
      // External wins - update local
      return { action: 'updateLocal', event: externalEvent };
    } else if (strategy === 'newest') {
      // Newest wins
      const localModified = new Date(localEvent.lastModified || localEvent.createdAt);
      const externalModified = new Date(externalEvent.lastModified || externalEvent.updated);
      
      if (localModified > externalModified) {
        return { action: 'updateExternal', event: localEvent };
      } else {
        return { action: 'updateLocal', event: externalEvent };
      }
    }
    
    // Default to manual resolution
    return { action: 'manual', localEvent, externalEvent };
  }
}