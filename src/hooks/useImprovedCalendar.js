// src/hooks/useImprovedCalendar.js
// Comprehensive React hook for calendar operations with Google Calendar integration

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  addDays, addWeeks, addMonths, addYears,
  startOfDay, endOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, startOfYear, endOfYear,
  isSameDay, isBefore, isAfter, isWithinInterval,
  differenceInMinutes, parseISO, format
} from 'date-fns';
import { useFamily } from '../contexts/FamilyContext';
import { useAuth } from '../contexts/AuthContext';
import googleAuthService from '../services/GoogleAuthService';
import enhancedCalendarSyncService from '../services/EnhancedCalendarSyncService';
import CalendarService from '../services/CalendarService';
import CalendarIntegrationService from '../services/CalendarIntegrationService';

const useImprovedCalendar = (options = {}) => {
  // Core calendar hook with createEvent, updateEvent, deleteEvent operations
  // Provides navigate, goToToday, goToDate navigation functions
  const { familyId } = useFamily();
  const { currentUser } = useAuth();

  // Use singleton service instances
  // Services are already initialized as singletons

  // Configuration
  const {
    autoSync = true,
    syncInterval = 60000, // 1 minute
    conflictStrategy = 'smart',
    enableWebhooks = true,
    cacheDuration = 5 * 60 * 1000, // 5 minutes
    defaultView = 'month'
  } = options;

  // State
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState(defaultView);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dateRange, setDateRange] = useState({ start: null, end: null });

  // Refs for cleanup
  const syncIntervalRef = useRef(null);
  const cacheTimerRef = useRef(null);
  const lastFetchRef = useRef(null);
  const eventsCache = useRef(new Map());

  // Initialize on mount
  useEffect(() => {
    const initServices = async () => {
      if (currentUser && familyId) {
        await googleAuthService.initialize();
        await enhancedCalendarSyncService.initialize(familyId, currentUser.uid);
        await initialize();
      }
    };

    initServices();

    // Cleanup on unmount
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      if (cacheTimerRef.current) {
        clearTimeout(cacheTimerRef.current);
      }
    };
  }, [familyId, currentUser]);

  // Update date range when view mode or current date changes
  useEffect(() => {
    const range = calculateDateRange(currentDate, viewMode);
    setDateRange(range);
  }, [currentDate, viewMode]);

  // Load events when date range changes
  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      loadEvents();
    }
  }, [dateRange, familyId]);

  /**
   * Initialize calendar
   */
  const initialize = useCallback(async () => {
    try {
      // Check Google auth status
      const isAuthenticated = await googleAuthService.isAuthenticated();
      setConnected(isAuthenticated);

      // Set up sync service conflict strategy
      if (enhancedCalendarSyncService.setConflictStrategy) {
        enhancedCalendarSyncService.setConflictStrategy(conflictStrategy);
      }

      // Start auto sync if connected
      if (isAuthenticated && autoSync) {
        startAutoSync();
      }

      // Load initial events
      await loadEvents();

      // Check for conflicts
      if (familyId) {
        const unresolvedConflicts = await enhancedCalendarSyncService.getUnresolvedConflicts(familyId);
        setConflicts(unresolvedConflicts);
      }

      return () => {
        unsubscribe();
        unsubscribeAuth();
      };
    } catch (err) {
      console.error('Failed to initialize calendar:', err);
      setError(err.message);
    }
  }, [familyId, autoSync, conflictStrategy]);

  /**
   * Calculate date range for view
   */
  const calculateDateRange = useCallback((date, view) => {
    let start, end;

    switch (view) {
      case 'day':
        start = startOfDay(date);
        end = endOfDay(date);
        break;

      case 'week':
        start = startOfWeek(date);
        end = endOfWeek(date);
        break;

      case 'month':
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);
        start = startOfWeek(monthStart);
        end = endOfWeek(monthEnd);
        break;

      case 'year':
        start = startOfYear(date);
        end = endOfYear(date);
        break;

      case 'agenda':
        start = date;
        end = addMonths(date, 3);
        break;

      default:
        start = startOfMonth(date);
        end = endOfMonth(date);
    }

    return { start, end };
  }, []);

  /**
   * Load events for current date range
   */
  const loadEvents = useCallback(async (forceRefresh = false) => {
    if (!familyId || !dateRange.start || !dateRange.end) return;

    // Check cache
    const cacheKey = `${familyId}-${dateRange.start.toISOString()}-${dateRange.end.toISOString()}`;

    if (!forceRefresh && eventsCache.current.has(cacheKey)) {
      const cached = eventsCache.current.get(cacheKey);
      if (Date.now() - cached.timestamp < cacheDuration) {
        setEvents(cached.events);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch events from CalendarService
      const fetchedEvents = await CalendarService.getEventsByDateRange(
        familyId,
        dateRange.start,
        dateRange.end
      );

      // Process and enhance events
      const processedEvents = await processEvents(fetchedEvents);

      // Update cache
      eventsCache.current.set(cacheKey, {
        events: processedEvents,
        timestamp: Date.now()
      });

      setEvents(processedEvents);
      lastFetchRef.current = Date.now();

    } catch (err) {
      console.error('Failed to load events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [familyId, dateRange, cacheDuration]);

  /**
   * Process and enhance events
   */
  const processEvents = useCallback(async (rawEvents) => {
    const processed = rawEvents.map(event => {
      // Add computed properties
      const startDate = parseISO(event.startDate || event.startTime);
      const endDate = event.endDate ? parseISO(event.endDate || event.endTime) : startDate;

      return {
        ...event,
        _startDate: startDate,
        _endDate: endDate,
        _duration: differenceInMinutes(endDate, startDate),
        _isAllDay: event.allDay || (!event.startTime && !event.endTime),
        _isRecurring: !!event.recurrence,
        _isGoogleEvent: !!event.googleId,
        _hasConflict: false, // Will be updated after conflict check
        _conflictsWith: []
      };
    });

    // Check for conflicts
    for (let i = 0; i < processed.length; i++) {
      for (let j = i + 1; j < processed.length; j++) {
        if (eventsOverlap(processed[i], processed[j])) {
          processed[i]._hasConflict = true;
          processed[j]._hasConflict = true;
          processed[i]._conflictsWith.push(processed[j].id);
          processed[j]._conflictsWith.push(processed[i].id);
        }
      }
    }

    return processed;
  }, []);

  /**
   * Check if two events overlap
   */
  const eventsOverlap = useCallback((event1, event2) => {
    // All-day events don't conflict with timed events
    if (event1._isAllDay || event2._isAllDay) {
      return false;
    }

    const interval1 = { start: event1._startDate, end: event1._endDate };
    const interval2 = { start: event2._startDate, end: event2._endDate };

    return (
      isWithinInterval(event1._startDate, interval2) ||
      isWithinInterval(event2._startDate, interval1)
    );
  }, []);

  /**
   * Create a new event
   */
  const createEvent = useCallback(async (eventData) => {
    try {
      setLoading(true);
      setError(null);

      // Create event locally first
      const localEvent = await CalendarService.addEvent(eventData, currentUser?.uid || 'system');

      // If connected to Google and two-way sync is enabled, sync to Google
      if (connected && syncStatus?.google?.twoWaySync) {
        try {
          const googleEvent = await enhancedCalendarSyncService.createGoogleEvent(localEvent);

          // Update local event with Google ID
          await CalendarService.updateEvent(localEvent.id, {
            googleId: googleEvent.id,
            googleEtag: googleEvent.etag
          });

          localEvent.googleId = googleEvent.id;
        } catch (syncError) {
          console.error('Failed to sync to Google:', syncError);
          // Continue anyway - event is created locally
        }
      }

      // Reload events to show the new one
      await loadEvents(true);

      return localEvent;

    } catch (err) {
      console.error('Failed to create event:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [connected, syncStatus, currentUser, loadEvents]);

  /**
   * Update an existing event
   */
  const updateEvent = useCallback(async (eventId, updates) => {
    try {
      setLoading(true);
      setError(null);

      // Find the event
      const event = events.find(e => e.id === eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // Update locally
      await CalendarService.updateEvent(eventId, updates);

      // If it's a Google event and connected, update in Google
      if (event.googleId && connected) {
        try {
          await enhancedCalendarSyncService.updateGoogleEvent(
            event.googleId,
            { ...event, ...updates }
          );
        } catch (syncError) {
          console.error('Failed to update in Google:', syncError);
          // Continue anyway - event is updated locally
        }
      }

      // Reload events
      await loadEvents(true);

    } catch (err) {
      console.error('Failed to update event:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [events, connected, loadEvents]);

  /**
   * Delete an event
   */
  const deleteEvent = useCallback(async (eventId) => {
    try {
      setLoading(true);
      setError(null);

      // Find the event
      const event = events.find(e => e.id === eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // Delete locally
      await CalendarService.deleteEvent(eventId);

      // If it's a Google event and connected, delete from Google
      if (event.googleId && connected) {
        try {
          await enhancedCalendarSyncService.deleteGoogleEvent(event.googleId);
        } catch (syncError) {
          console.error('Failed to delete from Google:', syncError);
          // Continue anyway - event is deleted locally
        }
      }

      // Reload events
      await loadEvents(true);

    } catch (err) {
      console.error('Failed to delete event:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [events, connected, loadEvents]);

  /**
   * Create event from natural language
   */
  const createEventFromText = useCallback(async (text, options = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Parse event from text using AI
      const parsedEvent = await CalendarIntegrationService.parseEventFromText(
        text,
        options.familyMembers || []
      );

      if (!parsedEvent) {
        throw new Error('Could not parse event from text');
      }

      // Create the event
      return await createEvent(parsedEvent);

    } catch (err) {
      console.error('Failed to create event from text:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [createEvent]);

  /**
   * Connect to Google Calendar
   */
  const connectGoogleCalendar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await googleAuthService.authenticate({
        prompt: 'select_account'
      });

      setConnected(true);

      // Perform initial sync
      if (familyId) {
        await syncCalendar();
      }

    } catch (err) {
      console.error('Failed to connect Google Calendar:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  /**
   * Disconnect from Google Calendar
   */
  const disconnectGoogleCalendar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await googleAuthService.revoke();
      setConnected(false);
      stopAutoSync();

    } catch (err) {
      console.error('Failed to disconnect:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Sync calendar with Google
   */
  const syncCalendar = useCallback(async (options = {}) => {
    if (!familyId || syncing) return;

    try {
      setSyncing(true);
      setError(null);

      const result = await enhancedCalendarSyncService.performFullSync(familyId, {
        bidirectional: options.bidirectional !== false,
        ...options
      });

      if (result.success) {
        // Reload events after sync
        await loadEvents(true);

        // Check for new conflicts
        const unresolvedConflicts = await enhancedCalendarSyncService.getUnresolvedConflicts(familyId);
        setConflicts(unresolvedConflicts);
      } else {
        setError(result.error || 'Sync failed');
      }

      return result;

    } catch (err) {
      console.error('Sync failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setSyncing(false);
    }
  }, [familyId, syncing, loadEvents]);

  /**
   * Start automatic sync
   */
  const startAutoSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }

    syncIntervalRef.current = setInterval(async () => {
      if (connected && !syncing) {
        await syncCalendar({ silent: true });
      }
    }, syncInterval);
  }, [connected, syncing, syncCalendar, syncInterval]);

  /**
   * Stop automatic sync
   */
  const stopAutoSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  }, []);

  /**
   * Navigate calendar
   */
  const navigate = useCallback((direction) => {
    setCurrentDate(prev => {
      switch (viewMode) {
        case 'day':
          return direction === 'next' ? addDays(prev, 1) :
                 direction === 'prev' ? addDays(prev, -1) : new Date();
        case 'week':
          return direction === 'next' ? addWeeks(prev, 1) :
                 direction === 'prev' ? addWeeks(prev, -1) : new Date();
        case 'month':
          return direction === 'next' ? addMonths(prev, 1) :
                 direction === 'prev' ? addMonths(prev, -1) : new Date();
        case 'year':
          return direction === 'next' ? addYears(prev, 1) :
                 direction === 'prev' ? addYears(prev, -1) : new Date();
        default:
          return direction === 'next' ? addMonths(prev, 1) :
                 direction === 'prev' ? addMonths(prev, -1) : new Date();
      }
    });
  }, [viewMode]);

  /**
   * Go to today
   */
  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  /**
   * Go to a specific date
   */
  const goToDate = useCallback((date) => {
    setCurrentDate(date);
  }, []);

  /**
   * Change view mode
   */
  const changeView = useCallback((mode) => {
    setViewMode(mode);
  }, []);

  /**
   * Get events for a specific date
   */
  const getEventsForDate = useCallback((date) => {
    return events.filter(event => {
      const eventDate = event._startDate || parseISO(event.startDate || event.startTime);
      return isSameDay(eventDate, date);
    });
  }, [events]);

  /**
   * Search events
   */
  const searchEvents = useCallback((query) => {
    if (!query) return events;

    const lowerQuery = query.toLowerCase();
    return events.filter(event =>
      event.title?.toLowerCase().includes(lowerQuery) ||
      event.description?.toLowerCase().includes(lowerQuery) ||
      event.location?.toLowerCase().includes(lowerQuery)
    );
  }, [events]);

  /**
   * Filter events
   */
  const filterEvents = useCallback((filters) => {
    let filtered = [...events];

    if (filters.members?.length > 0) {
      filtered = filtered.filter(event =>
        event.attendees?.some(att => filters.members.includes(att.id || att.email)) ||
        filters.members.includes(event.createdBy) ||
        filters.members.includes(event.assignedTo)
      );
    }

    if (filters.categories?.length > 0) {
      filtered = filtered.filter(event =>
        filters.categories.includes(event.category)
      );
    }

    if (filters.dateRange) {
      filtered = filtered.filter(event => {
        const eventDate = event._startDate || parseISO(event.startDate || event.startTime);
        return isWithinInterval(eventDate, filters.dateRange);
      });
    }

    return filtered;
  }, [events]);

  /**
   * Export calendar
   */
  const exportCalendar = useCallback(async (format = 'ics') => {
    try {
      if (format === 'ics') {
        const icsContent = await CalendarService.exportToICS(events);

        // Create download link
        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `calendar-${format(new Date(), 'yyyy-MM-dd')}.ics`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to export calendar:', err);
      setError(err.message);
      throw err;
    }
  }, [events]);

  /**
   * Import calendar
   */
  const importCalendar = useCallback(async (file) => {
    try {
      setLoading(true);
      setError(null);

      const content = await file.text();

      if (file.name.endsWith('.ics')) {
        const importedEvents = await CalendarService.importFromICS(content, familyId);
        await loadEvents(true);
        return importedEvents;
      }

      throw new Error('Unsupported file format');

    } catch (err) {
      console.error('Failed to import calendar:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [familyId, loadEvents]);

  /**
   * Resolve conflict
   */
  const resolveConflict = useCallback(async (conflictId, resolution) => {
    try {
      // Mark conflict as resolved in database
      // Implementation depends on your conflict resolution strategy

      // Reload conflicts
      const unresolvedConflicts = await enhancedCalendarSyncService.getUnresolvedConflicts(familyId);
      setConflicts(unresolvedConflicts);

    } catch (err) {
      console.error('Failed to resolve conflict:', err);
      setError(err.message);
      throw err;
    }
  }, [familyId]);

  return {
    // State
    events,
    loading,
    error,
    syncing,
    connected,
    syncStatus,
    conflicts,
    selectedEvent,
    viewMode,
    currentDate,
    dateRange,

    // Event operations
    createEvent,
    updateEvent,
    deleteEvent,
    createEventFromText,
    setSelectedEvent,

    // Calendar operations
    loadEvents,
    getEventsForDate,
    searchEvents,
    filterEvents,
    exportCalendar,
    importCalendar,

    // Navigation
    navigate,
    goToToday,
    goToDate,
    changeView,

    // Google Calendar
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    syncCalendar,
    startAutoSync,
    stopAutoSync,

    // Conflict resolution
    resolveConflict
  };
};

export default useImprovedCalendar;