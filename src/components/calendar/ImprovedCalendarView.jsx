// src/components/calendar/ImprovedCalendarView.jsx
// Enhanced calendar view with advanced features and Google Calendar integration

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar, ChevronLeft, ChevronRight, Plus, Settings, RefreshCw,
  Users, MapPin, Clock, Bell, Repeat, CheckCircle, AlertCircle,
  Cloud, CloudOff, Loader2, Search, Filter, Download, Upload,
  Eye, EyeOff, Palette, Grid, List, Globe, User, X
} from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay,
  isToday, isPast, isFuture, parseISO, differenceInMinutes,
  addWeeks, subWeeks, startOfDay, endOfDay, isWithinInterval
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import googleAuthService from '../../services/GoogleAuthService';
import enhancedCalendarSyncService from '../../services/EnhancedCalendarSyncService';
import CalendarService from '../../services/CalendarService';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';

const ImprovedCalendarView = () => {
  const { familyId, familyMembers } = useFamily();
  const { currentUser } = useAuth();

  // View states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // month, week, day, agenda
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Events and data
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync and connection states
  const [syncStatus, setSyncStatus] = useState(enhancedCalendarSyncService.syncStatus);
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [conflicts, setConflicts] = useState([]);

  // UI states
  const [showEventModal, setShowEventModal] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    members: [],
    categories: [],
    calendars: []
  });

  // Feature toggles
  const [features, setFeatures] = useState({
    twoWaySync: true,
    autoSync: true,
    conflictDetection: true,
    smartSuggestions: true,
    weatherIntegration: false,
    travelTime: false
  });

  // Calendar preferences
  const [preferences, setPreferences] = useState({
    weekStartsOn: 0, // 0 = Sunday, 1 = Monday
    defaultView: 'month',
    defaultEventDuration: 60,
    workingHours: { start: '09:00', end: '17:00' },
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    colorScheme: 'auto' // auto, light, dark
  });

  // Initialize and load data
  useEffect(() => {
    initializeCalendar();

    // Subscribe to sync status changes
    const unsubscribe = enhancedCalendarSyncService.onSyncStatusChange(setSyncStatus);

    // Subscribe to auth changes
    const unsubscribeAuth = googleAuthService.onAuthChange(handleAuthChange);

    return () => {
      unsubscribe();
      unsubscribeAuth();
    };
  }, [familyId]);

  // Load events when date changes
  useEffect(() => {
    if (familyId) {
      loadEvents();
    }
  }, [currentDate, viewMode, familyId]);

  // Apply filters to events
  useEffect(() => {
    applyFilters();
  }, [events, searchTerm, selectedFilters]);

  /**
   * Initialize calendar
   */
  const initializeCalendar = async () => {
    try {
      setLoading(true);

      // Check Google authentication status
      const authStatus = googleAuthService.getAuthStatus();
      setIsConnected(authStatus.isAuthenticated);

      // Load preferences from localStorage
      const savedPrefs = localStorage.getItem('calendarPreferences');
      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      }

      // Load feature toggles
      const savedFeatures = localStorage.getItem('calendarFeatures');
      if (savedFeatures) {
        setFeatures(JSON.parse(savedFeatures));
      }

      // Check for unresolved conflicts
      if (familyId) {
        const unresolvedConflicts = await enhancedCalendarSyncService.getUnresolvedConflicts(familyId);
        setConflicts(unresolvedConflicts);
      }

      // Perform initial sync if connected and auto-sync enabled
      if (authStatus.isAuthenticated && features.autoSync && familyId) {
        performSync();
      }

    } catch (error) {
      console.error('Failed to initialize calendar:', error);
      setError('Failed to initialize calendar');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load events for current view
   */
  const loadEvents = async () => {
    try {
      const { startDate, endDate } = getDateRange();

      // Load events from CalendarService
      const loadedEvents = await CalendarService.getEventsByDateRange(
        familyId,
        startDate,
        endDate
      );

      setEvents(loadedEvents);

    } catch (error) {
      console.error('Failed to load events:', error);
      setError('Failed to load calendar events');
    }
  };

  /**
   * Get date range for current view
   */
  const getDateRange = () => {
    let startDate, endDate;

    switch (viewMode) {
      case 'day':
        startDate = startOfDay(currentDate);
        endDate = endOfDay(currentDate);
        break;

      case 'week':
        startDate = startOfWeek(currentDate, { weekStartsOn: preferences.weekStartsOn });
        endDate = endOfWeek(currentDate, { weekStartsOn: preferences.weekStartsOn });
        break;

      case 'month':
      default:
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        startDate = startOfWeek(monthStart, { weekStartsOn: preferences.weekStartsOn });
        endDate = endOfWeek(monthEnd, { weekStartsOn: preferences.weekStartsOn });
        break;

      case 'agenda':
        startDate = currentDate;
        endDate = addMonths(currentDate, 3);
        break;
    }

    return { startDate, endDate };
  };

  /**
   * Apply filters to events
   */
  const applyFilters = () => {
    let filtered = [...events];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Member filter
    if (selectedFilters.members.length > 0) {
      filtered = filtered.filter(event =>
        event.attendees?.some(att =>
          selectedFilters.members.includes(att.id || att.email)
        ) ||
        selectedFilters.members.includes(event.createdBy) ||
        selectedFilters.members.includes(event.assignedTo)
      );
    }

    // Category filter
    if (selectedFilters.categories.length > 0) {
      filtered = filtered.filter(event =>
        selectedFilters.categories.includes(event.category)
      );
    }

    setFilteredEvents(filtered);
  };

  /**
   * Handle auth change
   */
  const handleAuthChange = (authState) => {
    setIsConnected(authState.authenticated);
    if (authState.authenticated && features.autoSync) {
      performSync();
    }
  };

  /**
   * Connect to Google Calendar
   */
  const connectGoogleCalendar = async () => {
    try {
      await googleAuthService.authenticate({
        prompt: 'select_account'
      });

      setIsConnected(true);

      // Perform initial sync
      if (familyId) {
        await performSync();
      }

    } catch (error) {
      console.error('Failed to connect Google Calendar:', error);
      setError('Failed to connect to Google Calendar');
    }
  };

  /**
   * Disconnect from Google Calendar
   */
  const disconnectGoogleCalendar = async () => {
    try {
      await googleAuthService.revoke();
      setIsConnected(false);
      setLastSyncTime(null);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  /**
   * Perform calendar sync
   */
  const performSync = async () => {
    if (!familyId || isSyncing) return;

    try {
      setIsSyncing(true);

      const result = await enhancedCalendarSyncService.performFullSync(familyId, {
        bidirectional: features.twoWaySync
      });

      if (result.success) {
        setLastSyncTime(new Date());
        await loadEvents(); // Reload events after sync

        // Check for new conflicts
        if (features.conflictDetection) {
          const unresolvedConflicts = await enhancedCalendarSyncService.getUnresolvedConflicts(familyId);
          setConflicts(unresolvedConflicts);
        }
      } else {
        setError(result.error || 'Sync failed');
      }

    } catch (error) {
      console.error('Sync failed:', error);
      setError('Failed to sync calendar');
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Navigate calendar
   */
  const navigateCalendar = (direction) => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(prev => direction === 'next' ? addDays(prev, 1) : addDays(prev, -1));
        break;
      case 'week':
        setCurrentDate(prev => direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1));
        break;
      case 'month':
      default:
        setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
        break;
    }
  };

  /**
   * Render calendar header
   */
  const renderHeader = () => (
    <div className="bg-white border-b px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Family Calendar
          </h2>

          {/* Sync status */}
          {isConnected && (
            <div className="flex items-center gap-2 text-sm">
              <div className={`flex items-center gap-1 ${isSyncing ? 'text-blue-600' : 'text-green-600'}`}>
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="h-4 w-4" />
                    <span>Synced</span>
                  </>
                )}
              </div>
              {lastSyncTime && (
                <span className="text-gray-500">
                  {format(lastSyncTime, 'h:mm a')}
                </span>
              )}
            </div>
          )}

          {conflicts.length > 0 && (
            <div className="flex items-center gap-1 text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{conflicts.length} conflicts</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Filter button */}
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`p-2 rounded-lg transition-colors ${
              Object.values(selectedFilters).some(f => f.length > 0)
                ? 'bg-purple-100 text-purple-600'
                : 'hover:bg-gray-100'
            }`}
          >
            <Filter className="h-5 w-5" />
          </button>

          {/* View mode selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['month', 'week', 'day', 'agenda'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded ${
                  viewMode === mode
                    ? 'bg-white shadow text-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {/* Sync button */}
          {isConnected && (
            <button
              onClick={performSync}
              disabled={isSyncing}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          )}

          {/* Settings button */}
          <button
            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="h-5 w-5" />
          </button>

          {/* Add event button */}
          <button
            onClick={() => setShowEventModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Event
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
          >
            Today
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateCalendar('prev')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigateCalendar('next')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <h3 className="text-lg font-semibold">
            {format(currentDate, viewMode === 'day' ? 'EEEE, MMMM d, yyyy' : 'MMMM yyyy')}
          </h3>
        </div>

        {/* Mini family member avatars for filtering */}
        <div className="flex items-center gap-2">
          {familyMembers?.map(member => (
            <button
              key={member.id}
              onClick={() => toggleMemberFilter(member.id)}
              className={`relative ${
                selectedFilters.members.includes(member.id)
                  ? 'ring-2 ring-purple-500 rounded-full'
                  : ''
              }`}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                style={{
                  backgroundColor: member.color || '#9333ea',
                  color: 'white'
                }}
              >
                {member.name?.[0]?.toUpperCase()}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  /**
   * Toggle member filter
   */
  const toggleMemberFilter = (memberId) => {
    setSelectedFilters(prev => ({
      ...prev,
      members: prev.members.includes(memberId)
        ? prev.members.filter(id => id !== memberId)
        : [...prev.members, memberId]
    }));
  };

  /**
   * Render calendar based on view mode
   */
  const renderCalendar = () => {
    switch (viewMode) {
      case 'month':
        return renderMonthView();
      case 'week':
        return renderWeekView();
      case 'day':
        return renderDayView();
      case 'agenda':
        return renderAgendaView();
      default:
        return renderMonthView();
    }
  };

  /**
   * Render month view
   */
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: preferences.weekStartsOn });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: preferences.weekStartsOn });

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (preferences.weekStartsOn === 1) {
      weekDays.push(weekDays.shift());
    }

    return (
      <div className="bg-white rounded-lg">
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-0 border-b">
          {weekDays.map(day => (
            <div
              key={day}
              className="py-2 text-center text-sm font-medium text-gray-700 border-r last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0">
          {days.map((day, idx) => {
            const dayEvents = filteredEvents.filter(event => {
              const eventStart = parseISO(event.startDate || event.startTime);
              return isSameDay(eventStart, day);
            });

            return (
              <div
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={`
                  min-h-[120px] p-2 border-b border-r cursor-pointer
                  ${!isSameMonth(day, currentDate) ? 'bg-gray-50' : 'bg-white'}
                  ${isToday(day) ? 'bg-purple-50' : ''}
                  ${isSameDay(day, selectedDate) ? 'ring-2 ring-purple-500' : ''}
                  hover:bg-gray-50 transition-colors
                `}
              >
                <div className="flex justify-between items-start mb-1">
                  <span
                    className={`
                      text-sm font-medium
                      ${!isSameMonth(day, currentDate) ? 'text-gray-400' : ''}
                      ${isToday(day) ? 'text-purple-600' : ''}
                    `}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                {/* Event previews */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event, eventIdx) => (
                    <div
                      key={event.id || eventIdx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(event);
                      }}
                      className={`
                        text-xs p-1 rounded truncate cursor-pointer
                        ${event.googleId ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}
                        hover:opacity-80
                      `}
                      style={{
                        backgroundColor: event.color ? `${event.color}20` : undefined,
                        color: event.color || undefined
                      }}
                    >
                      {format(parseISO(event.startTime || event.startDate), 'h:mma')} {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /**
   * Render week view
   */
  const renderWeekView = () => {
    // Implementation for week view with hour slots
    return (
      <div className="bg-white rounded-lg p-4">
        <div className="text-center text-gray-500">
          Week view - Enhanced time grid coming soon
        </div>
      </div>
    );
  };

  /**
   * Render day view
   */
  const renderDayView = () => {
    // Implementation for day view with detailed schedule
    return (
      <div className="bg-white rounded-lg p-4">
        <div className="text-center text-gray-500">
          Day view - Detailed schedule coming soon
        </div>
      </div>
    );
  };

  /**
   * Render agenda view
   */
  const renderAgendaView = () => {
    const upcomingEvents = filteredEvents
      .filter(event => {
        const eventDate = parseISO(event.startDate || event.startTime);
        return isFuture(eventDate) || isToday(eventDate);
      })
      .sort((a, b) => {
        const dateA = parseISO(a.startDate || a.startTime);
        const dateB = parseISO(b.startDate || b.startTime);
        return dateA - dateB;
      });

    return (
      <div className="bg-white rounded-lg">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Upcoming Events</h3>
        </div>
        <div className="divide-y">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map(event => (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="p-4 hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{event.title}</h4>
                      {event.googleId && (
                        <Globe className="h-4 w-4 text-blue-600" />
                      )}
                      {event.recurrence && (
                        <Repeat className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {format(parseISO(event.startDate || event.startTime), 'EEE, MMM d')}
                        {event.startTime && (
                          <span>
                            {format(parseISO(event.startTime), 'h:mm a')}
                            {event.endTime && ` - ${format(parseISO(event.endTime), 'h:mm a')}`}
                          </span>
                        )}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </div>
                      )}
                      {event.attendees?.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          {event.attendees.map(att => att.name || att.email).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: event.color || '#9333ea' }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              No upcoming events
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * Render settings panel
   */
  const renderSettingsPanel = () => {
    if (!showSettingsPanel) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Calendar Settings</h3>
              <button
                onClick={() => setShowSettingsPanel(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Google Calendar Connection */}
            <div className="mb-8">
              <h4 className="font-medium mb-4">Google Calendar</h4>
              {isConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-green-900">Connected</span>
                    </div>
                    <button
                      onClick={disconnectGoogleCalendar}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Disconnect
                    </button>
                  </div>

                  {/* Sync options */}
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span>Two-way sync</span>
                      <input
                        type="checkbox"
                        checked={features.twoWaySync}
                        onChange={(e) => setFeatures(prev => ({
                          ...prev,
                          twoWaySync: e.target.checked
                        }))}
                        className="rounded"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span>Auto-sync</span>
                      <input
                        type="checkbox"
                        checked={features.autoSync}
                        onChange={(e) => setFeatures(prev => ({
                          ...prev,
                          autoSync: e.target.checked
                        }))}
                        className="rounded"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span>Conflict detection</span>
                      <input
                        type="checkbox"
                        checked={features.conflictDetection}
                        onChange={(e) => setFeatures(prev => ({
                          ...prev,
                          conflictDetection: e.target.checked
                        }))}
                        className="rounded"
                      />
                    </label>
                  </div>

                  {/* Last sync info */}
                  {lastSyncTime && (
                    <div className="text-sm text-gray-600">
                      Last synced: {format(lastSyncTime, 'MMM d, h:mm a')}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={connectGoogleCalendar}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Globe className="h-5 w-5" />
                  Connect Google Calendar
                </button>
              )}
            </div>

            {/* Display preferences */}
            <div className="mb-8">
              <h4 className="font-medium mb-4">Display Preferences</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Week starts on
                  </label>
                  <select
                    value={preferences.weekStartsOn}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      weekStartsOn: parseInt(e.target.value)
                    }))}
                    className="w-full p-2 border rounded"
                  >
                    <option value={0}>Sunday</option>
                    <option value={1}>Monday</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Default view
                  </label>
                  <select
                    value={preferences.defaultView}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      defaultView: e.target.value
                    }))}
                    className="w-full p-2 border rounded"
                  >
                    <option value="month">Month</option>
                    <option value="week">Week</option>
                    <option value="day">Day</option>
                    <option value="agenda">Agenda</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Working hours
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={preferences.workingHours.start}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        workingHours: {
                          ...prev.workingHours,
                          start: e.target.value
                        }
                      }))}
                      className="flex-1 p-2 border rounded"
                    />
                    <span className="self-center">to</span>
                    <input
                      type="time"
                      value={preferences.workingHours.end}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        workingHours: {
                          ...prev.workingHours,
                          end: e.target.value
                        }
                      }))}
                      className="flex-1 p-2 border rounded"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced features */}
            <div className="mb-8">
              <h4 className="font-medium mb-4">Advanced Features</h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span>Smart suggestions</span>
                  <input
                    type="checkbox"
                    checked={features.smartSuggestions}
                    onChange={(e) => setFeatures(prev => ({
                      ...prev,
                      smartSuggestions: e.target.checked
                    }))}
                    className="rounded"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span>Weather integration</span>
                  <input
                    type="checkbox"
                    checked={features.weatherIntegration}
                    onChange={(e) => setFeatures(prev => ({
                      ...prev,
                      weatherIntegration: e.target.checked
                    }))}
                    className="rounded"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span>Travel time calculation</span>
                  <input
                    type="checkbox"
                    checked={features.travelTime}
                    onChange={(e) => setFeatures(prev => ({
                      ...prev,
                      travelTime: e.target.checked
                    }))}
                    className="rounded"
                  />
                </label>
              </div>
            </div>

            {/* Save button */}
            <button
              onClick={() => {
                localStorage.setItem('calendarPreferences', JSON.stringify(preferences));
                localStorage.setItem('calendarFeatures', JSON.stringify(features));
                setShowSettingsPanel(false);
              }}
              className="w-full p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Save Settings
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      {renderHeader()}

      {/* Error notification */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 p-6 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : (
          renderCalendar()
        )}
      </div>

      {/* Settings panel */}
      {renderSettingsPanel()}

      {/* Filter panel */}
      {/* Event modal */}
      {/* Selected event details */}
    </div>
  );
};

export default ImprovedCalendarView;