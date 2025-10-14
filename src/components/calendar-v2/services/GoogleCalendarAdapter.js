// src/components/calendar-v2/services/GoogleCalendarAdapter.js
// This file now uses the improved GoogleAuthService and EnhancedCalendarSyncService

import googleAuthService from '../../../services/GoogleAuthService';
import enhancedCalendarSyncService from '../../../services/EnhancedCalendarSyncService';

export class GoogleCalendarAdapter {
  constructor() {
    this.googleAuth = googleAuthService;
    this.syncService = enhancedCalendarSyncService;
    this.calendarId = 'primary';
    this.isInitialized = false;
  }

  /**
   * Initialize Google Calendar API using improved services
   */
  async initialize(config) {
    const { clientId, apiKey, userId, familyId } = config;

    if (!clientId || !apiKey) {
      throw new Error('Google Calendar requires clientId and apiKey');
    }

    // Initialize GoogleAuthService (no parameters needed)
    await this.googleAuth.initialize();

    // Initialize sync service
    await this.syncService.initialize(familyId, userId);

    this.isInitialized = true;
    return true;
  }

  /**
   * Authenticate with Google using improved service
   */
  async authenticate() {
    try {
      const token = await this.googleAuth.authenticate();
      return token;
    } catch (error) {
      throw new Error(error.message || 'Authentication failed');
    }
  }

  /**
   * Check authentication status
   */
  async isAuthenticated() {
    return await this.googleAuth.isAuthenticated();
  }

  /**
   * Fetch events from Google Calendar
   */
  async fetchEvents(options = {}) {
    const {
      calendarId = this.calendarId,
      timeMin = new Date().toISOString(),
      timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      maxResults = 250,
      singleEvents = true
    } = options;

    return await this.googleAuth.executeWithRetry(async () => {
      const response = await window.gapi.client.calendar.events.list({
        calendarId,
        timeMin,
        timeMax,
        maxResults,
        singleEvents,
        orderBy: singleEvents ? 'startTime' : undefined
      });

      return response.result.items || [];
    });
  }

  /**
   * Create event in Google Calendar
   */
  async createEvent(event, calendarId = this.calendarId) {
    return await this.googleAuth.executeWithRetry(async () => {
      const response = await window.gapi.client.calendar.events.insert({
        calendarId,
        resource: event
      });

      return response.result;
    });
  }

  /**
   * Update event in Google Calendar
   */
  async updateEvent(eventId, updates, calendarId = this.calendarId) {
    return await this.googleAuth.executeWithRetry(async () => {
      const response = await window.gapi.client.calendar.events.patch({
        calendarId,
        eventId,
        resource: updates
      });

      return response.result;
    });
  }

  /**
   * Delete event from Google Calendar
   */
  async deleteEvent(eventId, calendarId = this.calendarId) {
    return await this.googleAuth.executeWithRetry(async () => {
      await window.gapi.client.calendar.events.delete({
        calendarId,
        eventId
      });

      return true;
    });
  }

  /**
   * List available calendars
   */
  async listCalendars() {
    return await this.googleAuth.executeWithRetry(async () => {
      const response = await window.gapi.client.calendar.calendarList.list();
      return response.result.items || [];
    });
  }

  /**
   * Perform full sync using EnhancedCalendarSyncService
   */
  async sync(familyId, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Adapter not initialized');
    }

    const result = await this.syncService.performFullSync(familyId, {
      bidirectional: options.bidirectional !== false,
      conflictResolution: options.conflictResolution || 'smart',
      selectedCalendars: options.selectedCalendars,
      timeMin: options.timeMin,
      timeMax: options.timeMax
    });

    return result;
  }

  /**
   * Watch for calendar changes (webhook)
   */
  async watchCalendar(calendarId = this.calendarId, webhookUrl) {
    if (!webhookUrl) {
      console.warn('Webhook URL not provided, real-time sync disabled');
      return null;
    }

    try {
      return await this.googleAuth.executeWithRetry(async () => {
        const response = await window.gapi.client.calendar.events.watch({
          calendarId,
          resource: {
            id: `watch-${Date.now()}`,
            type: 'web_hook',
            address: webhookUrl
          }
        });

        return response.result;
      });
    } catch (error) {
      console.error('Failed to setup watch:', error);
      return null;
    }
  }

  /**
   * Stop watching calendar
   */
  async stopWatch(channelId, resourceId) {
    try {
      await this.googleAuth.executeWithRetry(async () => {
        await window.gapi.client.calendar.channels.stop({
          resource: {
            id: channelId,
            resourceId: resourceId
          }
        });
      });
      return true;
    } catch (error) {
      console.error('Failed to stop watch:', error);
      return false;
    }
  }

  /**
   * Clear authentication
   */
  async disconnect() {
    await this.googleAuth.revoke();
    this.isInitialized = false;
  }

  /**
   * Get error message
   */
  getErrorMessage(error) {
    if (error?.message) return error.message;
    if (typeof error === 'string') return error;
    return 'An unknown error occurred';
  }
}

export default GoogleCalendarAdapter;