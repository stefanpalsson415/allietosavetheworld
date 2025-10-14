// src/components/calendar/RevisedFloatingCalendarWidget.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Calendar, PlusCircle, Filter, X, Check, AlertCircle, Info, User, FileText, Phone } from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import { useEvents } from '../../contexts/EventContext'; // Import EventContext
import CalendarService from '../../services/CalendarService';
import CalendarErrorHandler from '../../utils/CalendarErrorHandler';
import { useNavigate } from 'react-router-dom';
import DocumentLibrary from '../document/DocumentLibrary';
import ProviderDirectory from '../document/ProviderDirectory';

// Import sub-components
import EnhancedEventManager from './EnhancedEventManager';
import EventSourceBadge from './EventSourceBadge';
import GoogleStyleCalendarView from './GoogleStyleCalendarView';

/**
 * RevisedFloatingCalendarWidget - A comprehensive floating calendar with filtering, 
 * event management, and detail views with improved metadata handling and duplicate prevention.
 * @param {Object} props
 * @param {string} props.initialSelectedMember - The ID of the initially selected member
 * @param {boolean} props.embedded - Whether the widget is embedded in another component
 */
const RevisedFloatingCalendarWidget = ({ initialSelectedMember, embedded = false }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { 
    taskRecommendations, 
    currentWeek, 
    weekStatus,
    familyMembers,
    familyId,
    coupleCheckInData
  } = useFamily();
  
  // Get events from EventContext
  const { 
    events, 
    loading: eventsLoading, 
    addEvent, 
    updateEvent, 
    deleteEvent,
    refreshEvents 
  } = useEvents();
  
  // UI State
  const [isOpen, setIsOpen] = useState(embedded ? true : false);
  const [widgetHeight, setWidgetHeight] = useState(embedded ? 60 : 45); // Taller when embedded
  const [widgetWidth, setWidgetWidth] = useState(embedded ? 100 : 64); // Wider when embedded
  const [isDragging, setIsDragging] = useState(null);
  const [startDragPos, setStartDragPos] = useState({ x: 0, y: 0 });
  const [startDimensions, setStartDimensions] = useState({ width: 0, height: 0 });
  
  // Calendar/Event State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('all'); // 'all', 'tasks', 'appointments', 'activities', etc.
  const [selectedMember, setSelectedMember] = useState(initialSelectedMember || 'all');
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [loading, setLoading] = useState(false);
  const [showEventManager, setShowEventManager] = useState(false);
  const [showAiParseInfo, setShowAiParseInfo] = useState(false);
  

  // Event collections
  const [eventCache, setEventCache] = useState(new Map()); // Cache for deduplication
  const [addedEvents, setAddedEvents] = useState({});
  const [showAddedMessage, setShowAddedMessage] = useState({});
  const [conflictingEvents, setConflictingEvents] = useState([]);
  
  // Event detail/editing state
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [editedEvent, setEditedEvent] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Refs
  const widgetRef = useRef(null);
  const dragHandleRef = useRef(null);
  const DEBOUNCE_INTERVAL = 1000; // Wait 1 second between refreshes
  
  // We're simplifying the approach - no additional event listeners for date changes
  // All date changes will flow through React props to avoid infinite loops
  
  // For effective debouncing of selected date events
  const selectedDateEventsRef = useRef({
    date: null,
    member: null,
    view: null,
    events: [],
    timestamp: 0
  });
  
  // For effective debouncing of upcoming events
  const upcomingEventsRef = useRef({
    member: null,
    view: null,
    events: [],
    timestamp: 0,
    lastEventsUpdate: 0 // Track when events array was last updated
  });

  
  // Initialize error handling
  useEffect(() => {
    CalendarErrorHandler.suppressApiErrors();
    return () => {
      CalendarErrorHandler.restoreConsoleError();
    };
  }, []);
  
  // Set up automatic refresh interval
  useEffect(() => {
    if (isOpen) {
      const refreshInterval = setInterval(() => {
        setLastRefresh(Date.now()); // Trigger a refresh
      }, 30000); // Check every 30 seconds
      
      return () => clearInterval(refreshInterval);
    }
  }, [isOpen]);
  
  // Listen for calendar update events with debouncing to prevent infinite loops
// Add this ref at the top level of the component, outside any useEffect
const lastRefreshTimeRef = useRef(0);

// State for provider and document modals
const [showProviderDirectory, setShowProviderDirectory] = useState(false);
const [showDocumentLibrary, setShowDocumentLibrary] = useState(false);
const [documentSelectionCallback, setDocumentSelectionCallback] = useState(null);
const [providerSelectionCallback, setProviderSelectionCallback] = useState(null);

// In RevisedFloatingCalendarWidget.jsx - improved handleForceRefresh function with proper locking
const handleForceRefresh = async () => {
  const now = Date.now();
  
  // Check if we're already processing a refresh or if one happened too recently
  if (window._calendarRefreshInProgress) {
    console.log("🔴 Calendar refresh already in progress, skipping");
    return;
  }
  
  // Log force refresh event regardless of debouncing 
  console.log("🔴 Force calendar refresh requested at", new Date(now).toLocaleTimeString());
  
  // Apply debouncing check
  if (now - lastRefreshTimeRef.current < DEBOUNCE_INTERVAL) {
    console.log("🔴 Force calendar refresh debounced - too soon after previous refresh");
    return;
  }
  
  console.log("🔴 Force calendar refresh executing - passed debounce check");
  lastRefreshTimeRef.current = now;
  
  // Set flag to prevent parallel refreshes
  window._calendarRefreshInProgress = true;
  
  try {
    // Reset local cache
    resetEventCache();
    
    // IMPORTANT: Directly call refreshEvents from context first with explicit debugging
    if (typeof refreshEvents === 'function') {
      try {
        console.log("🔴 Calling explicit refreshEvents() from context");
        await refreshEvents();
        console.log("🔴 Explicit refreshEvents() completed");
      } catch (error) {
        console.warn("🔴 Error refreshing events:", error);
      }
    } else {
      console.log("🔴 No refreshEvents function available, using lastRefresh update");
      setLastRefresh(now);
    }
    
    // Safely reset selected date to force re-render - use a function version to prevent stale state
    setSelectedDate(prevDate => {
      const currentDate = new Date(prevDate);
      return new Date(currentDate);
    });
    
    // Don't try to log events here as it may not be in scope when called from event listeners
    console.log("🔴 Calendar refresh completed, UI will update");
  } finally {
    // Clear the flag whether refresh succeeds or fails
    // Add small delay to prevent immediate re-triggering
    setTimeout(() => {
      window._calendarRefreshInProgress = false;
      console.log("🔴 Calendar refresh complete, lock released");
    }, 200);
  }
};


// Flag to prevent repeated refreshes during initialization
const isInitialLoadRef = useRef(true);

useEffect(() => {
  const DEBOUNCE_INTERVAL = 1000; // Wait 1 second between refreshes
  
  const refreshEventsHandler = (e) => {
    const now = Date.now();
    // Only refresh if enough time has passed since last refresh
    if (now - lastRefreshTimeRef.current > DEBOUNCE_INTERVAL) {
      console.log("Calendar event refresh triggered", e?.type || 'manual refresh');
      lastRefreshTimeRef.current = now;
      
      // IMPROVED: Reset cache AND call the context's refreshEvents() method
      resetEventCache();
      
      // CRITICAL FIX: Prevent cascading refreshes by checking if we're in an update cycle
      if (!window._calendarRefreshInProgress) {
        window._calendarRefreshInProgress = true;
        
        // FIXED: Use the context's refreshEvents function, not just state update
        if (typeof refreshEvents === 'function') {
          console.log("Calling context refreshEvents() from event handler");
          refreshEvents()
            .catch(err => console.error("Error refreshing events:", err))
            .finally(() => {
              // Always clear the flag when done, even on error
              window._calendarRefreshInProgress = false;
            });
        } else {
          console.log("No refreshEvents function available, falling back to state update");
          setLastRefresh(now);
          window._calendarRefreshInProgress = false;
        }
      } else {
        console.log("⚠️ Skipping refresh as one is already in progress");
      }
    } else {
      console.log("Event refresh debounced - too soon after previous refresh");
    }
  };
  
  // Handler for opening provider directory
  const handleOpenProviderDirectory = (event) => {
    console.log("🔍 Open provider directory event received", event.detail);
    if (event.detail && event.detail.onSelect) {
      setProviderSelectionCallback(() => event.detail.onSelect);
      setShowProviderDirectory(true);
    }
  };
  
  // Handler for opening document library
  const handleOpenDocumentLibrary = (event) => {
    console.log("📄 Open document library event received", event.detail);
    if (event.detail && event.detail.onSelect) {
      setDocumentSelectionCallback(() => event.detail.onSelect);
      setShowDocumentLibrary(true);
    }
  };
  
  // IMPROVED: Add event listener for the specific calendar-event-updated event
  window.addEventListener('force-calendar-refresh', handleForceRefresh);
  window.addEventListener('calendar-event-added', refreshEventsHandler);
  window.addEventListener('calendar-child-event-added', refreshEventsHandler);
  window.addEventListener('calendar-event-updated', refreshEventsHandler);
  
  // Add event listeners for opening provider directory and document library
  window.addEventListener('open-provider-directory', handleOpenProviderDirectory);
  window.addEventListener('open-document-library', handleOpenDocumentLibrary);
  
  // IMPROVED: Only perform initial load once, when component first mounts
  if (isInitialLoadRef.current && typeof refreshEvents === 'function') {
    console.log("Calendar widget mounted, performing initial data load");
    isInitialLoadRef.current = false;
    
    // Add a slight delay to prevent race conditions with other mounting effects
    const initialLoadTimer = setTimeout(() => {
      if (!window._calendarRefreshInProgress) {
        window._calendarRefreshInProgress = true;
        refreshEvents()
          .catch(err => console.error("Error in initial refresh:", err))
          .finally(() => {
            window._calendarRefreshInProgress = false;
          });
      }
    }, 100);
    
    return () => clearTimeout(initialLoadTimer);
  }
  
  return () => {
    window.removeEventListener('force-calendar-refresh', handleForceRefresh);
    window.removeEventListener('calendar-event-added', refreshEventsHandler);
    window.removeEventListener('calendar-child-event-added', refreshEventsHandler);
    window.removeEventListener('calendar-event-updated', refreshEventsHandler);
    window.removeEventListener('open-provider-directory', handleOpenProviderDirectory);
    window.removeEventListener('open-document-library', handleOpenDocumentLibrary);
  };
}, [refreshEvents]); // FIXED: Add refreshEvents as a dependency
  
  // Drag to resize functionality
  useEffect(() => {
    if (!isDragging || !widgetRef.current) return;

    const handleMouseMove = (e) => {
      e.preventDefault();
      
      const deltaX = e.clientX - startDragPos.x;
      const deltaY = e.clientY - startDragPos.y;
      
      if (isDragging === 'width' || isDragging === 'both') {
        const newWidth = Math.max(40, startDimensions.width + deltaX / 16);
        setWidgetWidth(newWidth);
      }
      
      if (isDragging === 'height' || isDragging === 'both') {
        // For top handle: when dragging up (negative deltaY), increase height
        // when dragging down (positive deltaY), decrease height
        const newHeight = Math.max(30, startDimensions.height - deltaY / 16);
        setWidgetHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startDragPos, startDimensions]);
  
  // Start drag operation
  const startDrag = (e, direction) => {
    e.preventDefault();
    setIsDragging(direction);
    setStartDragPos({ x: e.clientX, y: e.clientY });
    setStartDimensions({ width: widgetWidth, height: widgetHeight });
  };
  
  /**
   * Generate a unique event signature for deduplication
   * @param {Object} event - Calendar event
   * @returns {String} - Unique event signature
   */
  const createEventSignature = (event) => {
    // Normalize title/summary
    const title = event.summary || event.title || '';
    
    // Get child name if available
    const childName = event.childName || '';
    
    // Normalize date format
    let dateStr = '';
    if (event.start?.dateTime) {
      dateStr = event.start.dateTime;
    } else if (event.start?.date) {
      dateStr = event.start.date;
    } else if (event.date) {
      dateStr = event.date;
    } else if (event.dateTime) {
      dateStr = typeof event.dateTime === 'object' ? 
        event.dateTime.toISOString() : event.dateTime;
    } else if (event.dateObj) {
      dateStr = event.dateObj.toISOString();
    }
    
    // Extract just the date part for consistency
    const datePart = typeof dateStr === 'string' ? dateStr.split('T')[0] : '';
    
    // Include event type for better uniqueness
    const eventType = event.eventType || event.category || 'event';
    
    // Create signature that will match similar events
    return `${childName}-${title}-${datePart}-${eventType}`.toLowerCase();
  };
  
  /**
   * Reset the event cache for fresh loading
   */
  const resetEventCache = () => {
    setEventCache(new Map());
  };
  
  /**
   * Check if an event exists in cache to prevent duplicates
   * @param {Object} event - Event to check
   * @returns {Boolean} - True if event exists in cache
   */
  const eventExists = (event) => {
    const signature = createEventSignature(event);
    return eventCache.has(signature);
  };
  
  /**
   * Add event to cache to prevent future duplicates
   * @param {Object} event - Event to add to cache
   */
  const addEventToCache = (event) => {
    const signature = createEventSignature(event);
    const updatedCache = new Map(eventCache);
    updatedCache.set(signature, true);
    setEventCache(updatedCache);
  };
  
  /**
   * Helper function to get a unique key for an event
   * @param {Object} event - Event to get key for
   * @returns {String} - Unique key for event
   */
  const getEventKey = (event) => {
    if (!event) return null;
    
    let key = '';
    
    if (event.id) key += event.id; // Use ID first if available
    else if (event.firestoreId) key += event.firestoreId; // Then try firestoreId
    else if (event.universalId) key += event.universalId; // Then try universalId
    else {
      // Otherwise create a compound key
      if (event.title) key += event.title;
      if (event.dateObj) key += '-' + event.dateObj.toISOString().split('T')[0];
      if (event.childName) key += '-' + event.childName;
    }
    
    return key.toLowerCase().replace(/\s+/g, '-');
  };
  
  // Handle form cancellation
  const handleCancel = () => {
    // Simply close the widget, since there's no onCancel prop
    setIsOpen(false);
  };
  
  // Add event handlers
  // In RevisedFloatingCalendarWidget.jsx
// In RevisedFloatingCalendarWidget.jsx
const handleEventClick = async (event) => {
  console.log("🔍 Event clicked:", event);
  
  // First verify we have a valid event object to prevent errors
  if (!event || typeof event !== 'object') {
    console.error("Clicked on invalid event:", event);
    CalendarService.showNotification("Cannot open event details - invalid event data", "error");
    return;
  }

  // Create a properly formatted event object for the editor
  // with better date handling to avoid issues
  const formattedEvent = {
    ...event,
    // Make sure we have these fields properly set
    title: event.title || event.summary || 'Untitled Event',
    description: event.description || '',
    location: event.location || '',
    // Handle dates more carefully to avoid invalid date objects
    dateTime: (event.dateObj instanceof Date && !isNaN(event.dateObj)) 
      ? event.dateObj.toISOString() 
      : (event.start?.dateTime || new Date().toISOString()),
    endDateTime: (event.dateEndObj instanceof Date && !isNaN(event.dateEndObj))
      ? event.dateEndObj.toISOString()
      : (event.end?.dateTime || new Date(new Date().getTime() + 60*60*1000).toISOString()),
    childId: event.childId || null,
    childName: event.childName || null,
    attendingParentId: event.attendingParentId || null,
    eventType: event.eventType || 'general',
    category: event.category || 'general',
    siblingIds: event.siblingIds || [],
    siblingNames: event.siblingNames || [],
    // Make sure we have the ID for updating
    firestoreId: event.firestoreId || event.id,
    // Ensure coordinates are included if they exist
    coordinates: event.coordinates || null
  };
  
  // Store the selected event
  setSelectedEvent(formattedEvent);
  
  try {
    // Check for conflicts
    const conflicts = await checkForEventConflicts(event);
    setConflictingEvents(conflicts);
    
    // CHANGED: Skip details view and go directly to edit mode
    setShowEventDetails(false);
    setIsEditingEvent(true);
    setEditedEvent(formattedEvent);
  } catch (error) {
    console.error("Error preparing event for viewing:", error);
    CalendarService.showNotification("Error loading event details", "error");
  }
};
  
const handleEventAdd = async (event) => {
  try {
    // Check if event already exists locally
    if (eventExists(event)) {
      console.log("Event already exists in calendar, preventing duplicate");
      CalendarService.showNotification("Event already exists in your calendar", "info");
      return;
    }
    
    // Add the event using EventContext
    const result = await addEvent(event);
    
    if (result.success) {
      // Check if this was a duplicate detected server-side
      if (result.isDuplicate) {
        console.log("Server detected duplicate event:", result.existingEvent?.firestoreId);
        
        // Still mark as added to prevent further addition attempts
        setAddedEvents(prev => ({
          ...prev,
          [getEventKey(event)]: true
        }));
        
        // Show message but make it clear it was already there
        CalendarService.showNotification("This event already exists in your calendar", "info");
        
        // Refresh events to make sure we show the existing event
        setLastRefresh(Date.now());
        return;
      }
      
      // Add to cache to prevent duplicates
      addEventToCache({
        ...event,
        id: result.eventId,
        firestoreId: result.firestoreId,
        universalId: result.universalId
      });
      
      // Mark as added
      setAddedEvents(prev => ({
        ...prev,
        [getEventKey(event)]: true
      }));
      
      // Show "Added" message temporarily
      setShowAddedMessage(prev => ({
        ...prev,
        [getEventKey(event)]: true
      }));
      
      setTimeout(() => {
        setShowAddedMessage(prev => ({
          ...prev,
          [getEventKey(event)]: false
        }));
      }, 3000);
      
      // Show notification
      CalendarService.showNotification("Event added to calendar", "success");
      
      // Refresh events
      setLastRefresh(Date.now());
    }
  } catch (error) {
    console.error("Error adding event:", error);
    CalendarService.showNotification("Failed to add event to calendar", "error");
  }
};
  
  const handleEventEdit = (event) => {
    console.log("🖊️ Event edit requested:", {
      id: event.firestoreId || event.id,
      title: event.title,
      hasLocation: !!event.location
    });
    
    // Create a properly formatted event object for the editor
    const formattedEvent = {
      ...event,
      // Make sure we have these fields properly set
      title: event.title || event.summary,
      description: event.description || '',
      location: event.location || '',
      dateTime: event.dateObj?.toISOString() || event.start?.dateTime || new Date().toISOString(),
      endDateTime: event.dateEndObj?.toISOString() || event.end?.dateTime,
      childId: event.childId || null,
      childName: event.childName || null,
      attendingParentId: event.attendingParentId || null,
      eventType: event.eventType || 'general',
      category: event.category || 'general',
      siblingIds: event.siblingIds || [],
      siblingNames: event.siblingNames || [],
      // Make sure we have the ID for updating
      firestoreId: event.firestoreId || event.id,
      // Ensure coordinates are included if they exist
      coordinates: event.coordinates || null
    };
    
    // Log detailed event data for debugging
    console.log("🖊️ Formatted event for editor:", {
      id: formattedEvent.firestoreId,
      title: formattedEvent.title,
      location: formattedEvent.location,
      hasCoordinates: !!formattedEvent.coordinates,
      dateTime: formattedEvent.dateTime
    });
    
    setSelectedEvent(formattedEvent);
    setShowEventDetails(false);
    setIsEditingEvent(true);
    setEditedEvent(formattedEvent);
  };
  
  // Add task to calendar
  const handleAddTaskToCalendar = async (task) => {
    try {
      if (!currentUser || !task) return;
      
      // Create event from task
      const event = CalendarService.createEventFromTask(task);
      
      // Use selected date
      if (selectedDate) {
        const customDate = new Date(selectedDate);
        customDate.setHours(10, 0, 0, 0); // Set to 10 AM
        
        event.start.dateTime = customDate.toISOString();
        const endTime = new Date(customDate);
        endTime.setHours(endTime.getHours() + 1);
        event.end.dateTime = endTime.toISOString();
      }
      
      // Add task's linkedEntity information
      event.linkedEntity = {
        type: 'task',
        id: task.id
      };
      
      // Add event using EventContext
      const result = await addEvent(event);
      
      if (result.success) {
        // Add to cache to prevent duplicates
        addEventToCache({
          ...event,
          id: result.eventId,
          firestoreId: result.firestoreId,
          universalId: result.universalId
        });
        
        // Mark as added
        setAddedEvents(prev => ({
          ...prev,
          [getEventKey(task)]: true
        }));
        
        // Show "Added" message temporarily
        setShowAddedMessage(prev => ({
          ...prev,
          [getEventKey(task)]: true
        }));
        
        setTimeout(() => {
          setShowAddedMessage(prev => ({
            ...prev,
            [getEventKey(task)]: false
          }));
        }, 3000);
        
        // Show notification
        CalendarService.showNotification("Task added to calendar", "success");
        
        // Refresh events
        setLastRefresh(Date.now());
      }
    } catch (error) {
      console.error("Error adding task to calendar:", error);
      CalendarService.showNotification("Failed to add task to calendar", "error");
    }
  };
  
  // Add meeting to calendar
  const handleAddMeetingToCalendar = async (meeting) => {
    try {
      if (!currentUser || !meeting) return;
      
      // Create event from meeting
      const event = CalendarService.createFamilyMeetingEvent(meeting.weekNumber, meeting.dateObj);
      
      // Rename from "Week" to "Cycle" in the title
      event.summary = event.summary.replace("Week", "Cycle");
      
      // Add meeting's linkedEntity information
      event.linkedEntity = meeting.linkedEntity || {
        type: 'meeting',
        id: meeting.weekNumber
      };
      
      // Add event using EventContext
      const result = await addEvent(event);
      
      if (result.success) {
        // Add to cache to prevent duplicates
        addEventToCache({
          ...event,
          id: result.eventId,
          firestoreId: result.firestoreId,
          universalId: result.universalId
        });
        
        // Mark as added
        setAddedEvents(prev => ({
          ...prev,
          [getEventKey(meeting)]: true
        }));
        
        // Show "Added" message temporarily
        setShowAddedMessage(prev => ({
          ...prev,
          [getEventKey(meeting)]: true
        }));
        
        setTimeout(() => {
          setShowAddedMessage(prev => ({
            ...prev,
            [getEventKey(meeting)]: false
          }));
        }, 3000);
        
        // Show notification
        CalendarService.showNotification("Meeting added to calendar", "success");
        
        // Refresh events
        setLastRefresh(Date.now());
      }
    } catch (error) {
      console.error("Error adding meeting to calendar:", error);
      CalendarService.showNotification("Failed to add meeting to calendar", "error");
    }
  };
  
  // Add child event to calendar
  const handleAddChildEventToCalendar = async (event) => {
    try {
      if (!currentUser || !event) return;
      
      // Format child event using CalendarOperations
      const calendarEvent = {
        title: event.title,
        description: event.description || '',
        dateTime: event.dateObj || new Date(event.dateTime),
        location: event.location || '',
        duration: 60, // Default to 1 hour
        childId: event.childId,
        childName: event.childName,
        attendingParentId: event.attendingParentId,
        eventType: event.eventType || 'other',
        extraDetails: {
          ...(event.extraDetails || {}),
          parsedWithAI: event.extraDetails?.parsedWithAI || false,
          extractionConfidence: event.extraDetails?.extractionConfidence || null,
          parsedFromImage: event.extraDetails?.parsedFromImage || false,
          originalText: event.extraDetails?.originalText || '',
          creationSource: event.extraDetails?.creationSource || 'manual'
        }
      };
      
      // Add event using EventContext
      const result = await addEvent(calendarEvent);
      
      if (result.success) {
        // Add to cache to prevent duplicates
        addEventToCache({
          ...calendarEvent,
          id: result.eventId,
          firestoreId: result.firestoreId,
          universalId: result.universalId
        });
        
        // Mark as added
        setAddedEvents(prev => ({
          ...prev,
          [getEventKey(event)]: true
        }));
        
        // Show "Added" message temporarily
        setShowAddedMessage(prev => ({
          ...prev,
          [getEventKey(event)]: true
        }));
        
        setTimeout(() => {
          setShowAddedMessage(prev => ({
            ...prev,
            [getEventKey(event)]: false
          }));
        }, 3000);
        
        // Show notification
        const eventDescription = event.childName ? `${event.childName}'s ${event.title}` : event.title;
        CalendarService.showNotification(`${eventDescription} added to calendar`, "success");
        
        // Refresh events
        setLastRefresh(Date.now());
      }
    } catch (error) {
      console.error("Error adding event to calendar:", error);
      CalendarService.showNotification("Failed to add event to calendar", "error");
    }
  };
  
  // Delete event
  const handleDeleteEvent = async (event) => {
    try {
      setPendingAction('delete');
      
      if (!event) {
        CalendarService.showNotification("No event selected to delete", "error");
        setPendingAction(null);
        return;
      }
      
      if (!window.confirm("Are you sure you want to delete this event?")) {
        setPendingAction(null);
        return;
      }
      
      // Use Firestore ID if available, or universal ID, or regular ID
      const eventId = event.firestoreId || event.universalId || event.id;
      
      if (!eventId) {
        CalendarService.showNotification("Cannot delete this event - no valid ID found", "error");
        setPendingAction(null);
        return;
      }
      
      // Delete using EventContext
      const result = await deleteEvent(eventId);
      
      if (result.success) {
        // Remove from cache
        const signature = createEventSignature(event);
        const updatedCache = new Map(eventCache);
        updatedCache.delete(signature);
        setEventCache(updatedCache);
        
        // Update local state
        setAddedEvents(prev => {
          const newState = {...prev};
          delete newState[getEventKey(event)];
          return newState;
        });
        
        // Close the details modal
        setShowEventDetails(false);
        
        // Refresh events
        setTimeout(() => {
          setLastRefresh(Date.now());
        }, 300);
      } else {
        CalendarService.showNotification(result.error || "Failed to delete event", "error");
      }
      
      setPendingAction(null);
    } catch (error) {
      console.error("Error deleting event:", error);
      CalendarService.showNotification("Failed to delete event: " + error.message, "error");
      setPendingAction(null);
    }
  };
  
 // IMPROVED: Enhanced handleUpdateEvent with better date/time handling
const handleUpdateEvent = async (updatedEvent) => {
  try {
    setPendingAction('update');
    
    // CRITICAL FIX: Check for refresh in progress and abort if active
    if (window._calendarRefreshInProgress) {
      console.log("⚠️ Skipping event update as a refresh is already in progress");
      CalendarService.showNotification("Please wait while the calendar refreshes", "info");
      setPendingAction(null);
      return;
    }
    
    if (!updatedEvent || !updatedEvent.firestoreId) {
      CalendarService.showNotification("Cannot update this event - no valid ID found", "error");
      setPendingAction(null);
      return;
    }
    
    console.log("🔄 Updating event with data:", {
      id: updatedEvent.firestoreId,
      title: updatedEvent.title,
      location: updatedEvent.location,
      dateTime: updatedEvent.dateTime,
      hasCoordinates: !!updatedEvent.coordinates
    });
    
    // CRITICAL FIX: Add more explicit debugging for date handling
    console.log("🔍 ALL DATE FIELDS:", {
      dateTime: updatedEvent.dateTime,
      date: updatedEvent.date,
      dateObj: updatedEvent.dateObj instanceof Date ? updatedEvent.dateObj.toISOString() : String(updatedEvent.dateObj),
      start: updatedEvent.start,
      end: updatedEvent.end,
      endDateTime: updatedEvent.endDateTime,
      dateEndObj: updatedEvent.dateEndObj instanceof Date ? updatedEvent.dateEndObj.toISOString() : String(updatedEvent.dateEndObj)
    });
    
    // IMPROVED: Extract and validate date with detailed logging - PRESERVE TIMES CAREFULLY
    let newDate, dateSrc;
    let hours = 0, minutes = 0;

    // First extract the date and preserve the hours/minutes from the input
    if (updatedEvent.dateObj instanceof Date && !isNaN(updatedEvent.dateObj.getTime())) {
      newDate = new Date(updatedEvent.dateObj);
      hours = newDate.getHours();
      minutes = newDate.getMinutes();
      dateSrc = "dateObj";
    } else if (updatedEvent.dateTime && typeof updatedEvent.dateTime === 'string') {
      newDate = new Date(updatedEvent.dateTime);
      hours = newDate.getHours();
      minutes = newDate.getMinutes();
      dateSrc = "dateTime (string)";
    } else if (updatedEvent.dateTime && updatedEvent.dateTime instanceof Date) {
      newDate = new Date(updatedEvent.dateTime);
      hours = newDate.getHours();
      minutes = newDate.getMinutes();
      dateSrc = "dateTime (Date)";
    } else if (updatedEvent.start?.dateTime) {
      newDate = new Date(updatedEvent.start.dateTime);
      hours = newDate.getHours();
      minutes = newDate.getMinutes();
      dateSrc = "start.dateTime";
    } else if (updatedEvent.date) {
      newDate = new Date(updatedEvent.date);
      // For date-only formats, explicitly preserve time if available from a time source
      if (updatedEvent.start?.dateTime) {
        const timeDate = new Date(updatedEvent.start.dateTime);
        hours = timeDate.getHours();
        minutes = timeDate.getMinutes();
      }
      dateSrc = "date";
    } else {
      newDate = new Date(); // Last resort fallback
      hours = newDate.getHours();
      minutes = newDate.getMinutes();
      dateSrc = "fallback";
    }

    // CRITICAL FIX: Ensure time component is preserved
    // This is the key fix for the time defaulting to midnight
    if (hours === 0 && minutes === 0) {
      // If we have a time of midnight, check if there's another source with a non-midnight time
      let foundNonMidnightTime = false;
      
      // Try to get time from other sources
      if (updatedEvent.start?.dateTime) {
        const startTime = new Date(updatedEvent.start.dateTime);
        if (startTime.getHours() !== 0 || startTime.getMinutes() !== 0) {
          hours = startTime.getHours();
          minutes = startTime.getMinutes();
          foundNonMidnightTime = true;
          console.log("📅 Preserved non-midnight time from start.dateTime:", `${hours}:${minutes}`);
        }
      }
      
      if (!foundNonMidnightTime && typeof updatedEvent.dateTime === 'string') {
        const dateTimeVal = new Date(updatedEvent.dateTime);
        if (dateTimeVal.getHours() !== 0 || dateTimeVal.getMinutes() !== 0) {
          hours = dateTimeVal.getHours();
          minutes = dateTimeVal.getMinutes();
          foundNonMidnightTime = true;
          console.log("📅 Preserved non-midnight time from dateTime string:", `${hours}:${minutes}`);
        }
      }
      
      // Always explicitly set the hours and minutes
      newDate.setHours(hours, minutes, 0, 0);
      console.log(`📅 Final time used: ${hours}:${minutes}${foundNonMidnightTime ? " (preserved from source)" : ""}`);
    } else {
      // Just to be safe, explicitly set hours/minutes
      newDate.setHours(hours, minutes, 0, 0);
      console.log(`📅 Using time: ${hours}:${minutes} from source: ${dateSrc}`);
    }

    // More detailed validation of the date - verify with explicit logging
    if (isNaN(newDate.getTime())) {
      console.error("❌ INVALID DATE DETECTED FOR EVENT UPDATE:", {
        dateObj: updatedEvent.dateObj,
        dateTime: updatedEvent.dateTime,
        startDateTime: updatedEvent.start?.dateTime,
        date: updatedEvent.date
      });
      CalendarService.showNotification("Invalid date format for event update", "error");
      setPendingAction(null);
      return;
    }

    console.log(`📅 Final event date for update (${dateSrc}):`, 
      newDate.toISOString(), `Time: ${newDate.getHours()}:${newDate.getMinutes()}`);
    
    // Calculate end time (preserve duration if possible)
    let endDate;
    let duration = 60 * 60 * 1000; // Default 1 hour duration
    
    if (updatedEvent.dateEndObj instanceof Date && !isNaN(updatedEvent.dateEndObj.getTime())) {
      endDate = new Date(updatedEvent.dateEndObj);
      duration = endDate.getTime() - new Date(updatedEvent.dateObj).getTime();
    } else if (updatedEvent.endDateTime) {
      endDate = new Date(updatedEvent.endDateTime);
      if (updatedEvent.dateTime) {
        duration = endDate.getTime() - new Date(updatedEvent.dateTime).getTime();
      }
    } else if (updatedEvent.end?.dateTime) {
      endDate = new Date(updatedEvent.end.dateTime);
      if (updatedEvent.start?.dateTime) {
        duration = endDate.getTime() - new Date(updatedEvent.start.dateTime).getTime();
      }
    } else {
      // Default to original duration or 1 hour
      endDate = new Date(newDate.getTime() + duration);
    }
    
    // FIXED: Make sure end date has same date as start date but with correct duration
    endDate = new Date(newDate.getTime() + duration);
    console.log(`📅 End time calculated with duration of ${duration/60000} minutes:`, 
                endDate.toISOString(), `Time: ${endDate.getHours()}:${endDate.getMinutes()}`);
    
    // IMPROVED: Log location data specifically to track issues
    console.log("📍 Location data for update:", {
      location: updatedEvent.location || "(empty)",
      hasCoordinates: !!updatedEvent.coordinates,
      coordinates: updatedEvent.coordinates,
      locationFromExtraDetails: updatedEvent.extraDetails?.manualLocationInput ? "manual input" : "places API"
    });
    
    // Create updated event object with required fields - COMPREHENSIVE UPDATE
    const eventUpdate = {
      ...updatedEvent, // First include ALL fields from the updated event 
      
      // Then override specific fields for consistency
      summary: updatedEvent.title,
      title: updatedEvent.title, // Add explicit title field
      description: updatedEvent.description || '',
      
      // CRITICAL FIX: Ensure location is properly included from all possible sources
      location: updatedEvent.location || '',
      
      // FIXED: Set all date formats with PRESERVED TIME for maximum compatibility
      date: newDate.toISOString(),
      dateTime: newDate.toISOString(),
      dateObj: newDate,
      dateEndObj: endDate,
      endDateTime: endDate.toISOString(),
      start: {
        dateTime: newDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      
      // IMPROVED: Add coordinates directly at top level for better preservation
      coordinates: updatedEvent.coordinates || null,
      
      // Include document and provider references - ensure proper deep copying
      documents: updatedEvent.documents ? [...updatedEvent.documents] : [],
      providers: updatedEvent.providers ? [...updatedEvent.providers] : [],
      
      // Include attendees with proper deep copying
      attendees: updatedEvent.attendees ? [...updatedEvent.attendees] : [],
      
      // Child and parent associations
      childId: updatedEvent.childId,
      childName: updatedEvent.childName,
      attendingParentId: updatedEvent.attendingParentId,
      siblingIds: updatedEvent.siblingIds ? [...updatedEvent.siblingIds] : [],
      siblingNames: updatedEvent.siblingNames ? [...updatedEvent.siblingNames] : [],
      
      // Ensure reminders object is preserved correctly
      reminders: updatedEvent.reminders ? {
        ...updatedEvent.reminders,
        overrides: updatedEvent.reminders.overrides ? 
          [...updatedEvent.reminders.overrides] : []
      } : undefined,
      
      notes: updatedEvent.notes || updatedEvent.extraDetails?.notes,
      
      // Event type/category
      category: updatedEvent.category || updatedEvent.eventType || 'general',
      eventType: updatedEvent.eventType || updatedEvent.category || 'general',
      
      // Explicitly include key fields that might be missed
      birthdayDetails: updatedEvent.birthdayDetails ? {...updatedEvent.birthdayDetails} : undefined,
      meetingDetails: updatedEvent.meetingDetails ? {...updatedEvent.meetingDetails} : undefined,
      appointmentDetails: updatedEvent.appointmentDetails ? {...updatedEvent.appointmentDetails} : undefined,
      
      // Flag to prevent cached copies in the UI
      _lastUpdated: Date.now(),
      
      // Ensure we preserve and extend AI metadata
      extraDetails: {
        ...(updatedEvent.extraDetails || {}),
        parsedWithAI: updatedEvent.extraDetails?.parsedWithAI || false,
        extractionConfidence: updatedEvent.extraDetails?.extractionConfidence || null,
        parsedFromImage: updatedEvent.extraDetails?.parsedFromImage || false,
        originalText: updatedEvent.extraDetails?.originalText || '',
        creationSource: updatedEvent.extraDetails?.creationSource || 'manual',
        updatedAt: new Date().toISOString(), // Add timestamp
        lastUpdateFrom: 'RevisedFloatingCalendarWidget',
        
        // NEW: Save time explicitly to ensure it's preserved
        eventHours: hours,
        eventMinutes: minutes,
        
        // IMPROVED: Additional location tracking in extraDetails
        locationLastUpdated: new Date().toISOString(),
        savedLocation: updatedEvent.location || '',
        
        // Provider details for appointments
        ...(updatedEvent.category === 'appointment' && updatedEvent.providers?.[0] ? {
          providerName: updatedEvent.providers[0].name,
          providerSpecialty: updatedEvent.providers[0].specialty,
          providerPhone: updatedEvent.providers[0].phone,
          providerAddress: updatedEvent.providers[0].address
        } : {}),
        
        // Birthday details preservation
        ...(updatedEvent.category === 'birthday' || updatedEvent.birthdayDetails ? {
          birthdayChildName: updatedEvent.birthdayDetails?.birthdayChildName || 
                            updatedEvent.extraDetails?.birthdayChildName,
          birthdayChildAge: updatedEvent.birthdayDetails?.birthdayChildAge || 
                           updatedEvent.extraDetails?.birthdayChildAge
        } : {})
      }
    };
    
    // FIXED: Set an update lock that blocks both UI updates and API calls to prevent duplicate notifications
    // This global flag will be checked by multiple components
    window._eventUpdateInProgress = true; 
    window._calendarRefreshInProgress = true;
    
    try {
      // Clear the event cache BEFORE updating to prevent any stale data issues
      resetEventCache();
      setEventCache(new Map());
      
      console.log(`📤 Sending update for event ${updatedEvent.firestoreId}:`, {
        title: eventUpdate.title,
        location: eventUpdate.location,
        date: eventUpdate.dateTime,
        time: `${hours}:${minutes}`,
        coordinates: eventUpdate.coordinates
      });
      
      // CRITICAL FIX: Ensure the date object is a valid Date instance in the database
      if (!(eventUpdate.dateObj instanceof Date)) {
        console.warn("Converting dateObj to proper Date instance", eventUpdate.dateObj);
        eventUpdate.dateObj = newDate;
      }
      
      // Update event using EventContext - CRITICAL FIX: Pass 'edit' mode to prevent 'added' notification
      const result = await updateEvent(updatedEvent.firestoreId, eventUpdate, 'edit');
      
      if (result.success) {
        console.log("✅ Event updated successfully:", result);
        
        // Close UI elements first before triggering refreshes
        setIsEditingEvent(false);
        setSelectedEvent(null);
        setShowEventManager(false); // Make sure to close the event manager
        
        // CRITICAL FIX: Set a global flag to ensure we only show one notification for this event
        if (typeof window !== 'undefined') {
          window._lastEventAction = 'updated';
          window._lastEventId = updatedEvent.firestoreId;
          
          // SIMPLIFIED: Just update our date state directly - no events
          // which avoids all the infinite loops and update issues
          setSelectedDate(newDate);
        }
        
        // FIXED: Single notification to prevent duplicates
        // Show notification but suppress duplicates if another component shows one
        if (!window._notificationShown && window._lastEventAction === 'updated') {
          window._notificationShown = true;
          CalendarService.showNotification("Event updated successfully", "success");
          
          // Reset notification flag after a delay
          setTimeout(() => {
            window._notificationShown = false;
          }, 3000);
        }
        
        // Show success animation
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
        }, 2000);
        
        // ENHANCED REFRESH STRATEGY: More aggressive refresh to ensure calendar updates
        
        // 1. Clear any internal state that might hold stale data
        setAddedEvents({});
        setShowAddedMessage({});
        setConflictingEvents([]);
        resetEventCache();
        setEventCache(new Map());
        
        // 2. Initial state update - IMPROVED: Use a function to prevent stale state
        setLastRefresh(Date.now());
        setSelectedDate(prevDate => newDate); // Update selected date to match the updated event
        
        // 3. Perform both context refresh and direct event dispatch for redundancy
        try {
          // IMPORTANT: Trigger a global calendar refresh event that all components will see
          if (typeof window !== 'undefined') {
            console.log("🔄 Dispatching global calendar refresh events");
            window.dispatchEvent(new CustomEvent('force-calendar-refresh', { detail: { eventId: updatedEvent.firestoreId, forceRender: true } }));
            
            // Also dispatch specific event update for targeted components
            window.dispatchEvent(new CustomEvent('calendar-event-updated', { 
              detail: { 
                eventId: updatedEvent.firestoreId, 
                updated: true, 
                success: true,
                forceRender: true,
                timestamp: Date.now(),
                // Include full event data to ensure it's available to listeners
                eventData: eventUpdate
              }
            }));
          }
        } catch (refreshError) {
          console.warn("Error dispatching refresh events:", refreshError);
        }
        
        // 4. Use the context's refreshEvents for a full data refresh
        setTimeout(() => {
          if (typeof refreshEvents === 'function') {
            console.log("🔄 Performing explicit refresh from context");
            refreshEvents()
              .then(() => {
                console.log("✅ Context refresh completed successfully");
                // After refresh, trigger a re-render by forcing a state update
                // Note: We don't have a setEvents since events come from context
                // Instead, just log that the update is complete and rely on context refresh
                console.log("✅ Events refreshed from context, checking for local event...");
                
                // Find the index of the event in the events array (just for logging purposes)
                const eventIndex = events.findIndex(e => 
                  e.firestoreId === updatedEvent.firestoreId || 
                  e.id === updatedEvent.firestoreId
                );
                
                if (eventIndex >= 0) {
                  console.log(`✅ Found updated event in events array at index ${eventIndex}`);
                } else {
                  console.log("⚠️ Could not find event in context events array");
                }
                
                // Force a re-render by updating lastRefresh
                setLastRefresh(Date.now());
              })
              .catch(err => console.warn("Error in context refresh:", err))
              .finally(() => {
                // Final refresh of the UI as a last resort
                setTimeout(() => {
                  console.log("🔄 Performing final state refresh");
                  setLastRefresh(Date.now());
                  
                  // Release the update locks after all processing is complete
                  window._eventUpdateInProgress = false;
                  window._calendarRefreshInProgress = false;
                  console.log("✅ Update completed and all locks released");
                }, 500);
              });
          } else {
            // Fallback if refreshEvents isn't available
            setLastRefresh(Date.now());
            
            // Release locks
            setTimeout(() => {
              window._eventUpdateInProgress = false;
              window._calendarRefreshInProgress = false;
            }, 300);
          }
        }, 200);
      } else {
        console.error("❌ Failed to update event:", result.error);
        CalendarService.showNotification(result.error || "Failed to update event", "error");
        window._eventUpdateInProgress = false;
        window._calendarRefreshInProgress = false;
      }
    } catch (error) {
      console.error("❌ Error in update event flow:", error);
      window._eventUpdateInProgress = false;
      window._calendarRefreshInProgress = false;
      throw error; // Re-throw to be caught by outer try/catch
    }
    
    setPendingAction(null);
  } catch (error) {
    console.error("❌ Error updating event:", error);
    CalendarService.showNotification("Failed to update event: " + error.message, "error");
    setPendingAction(null);
    
    // Ensure all locks are released in case of error
    window._eventUpdateInProgress = false;
    window._calendarRefreshInProgress = false;
  }
};
  
  // Navigate to a different view based on the event's linked entity
  const navigateToLinkedEntity = (event) => {
    if (!event.linkedEntity) return;
    
    const { type, id } = event.linkedEntity;
    
    switch(type) {
      case 'task':
        navigate('/dashboard?tab=tasks');
        break;
      case 'relationship':
        navigate('/dashboard?tab=relationship');
        break;
      case 'child':
        navigate('/dashboard?tab=children');
        break;
      case 'meeting':
        if (typeof window !== 'undefined') {
          if (window.openFamilyMeeting) {
            window.openFamilyMeeting();
          } else {
            const meetingEvent = new CustomEvent('open-family-meeting', { 
              detail: { weekNumber: id } 
            });
            window.dispatchEvent(meetingEvent);
            navigate('/dashboard?tab=tasks');
          }
        } else {
          navigate('/dashboard?tab=tasks');
        }
        break;
      default:
        // Do nothing
    }
    
    // Close the details modal
    setShowEventDetails(false);
  };
  
  /**
   * Check for scheduling conflicts for a given event
   * @param {Object} event - Event to check for conflicts
   * @returns {Promise<Array>} Conflicting events
   */
  const checkForEventConflicts = async (event) => {
    if (!event) return [];
    
    try {
      // Get event date and time
      let eventDate;
      if (event.dateObj) {
        eventDate = new Date(event.dateObj);
      } else if (event.dateTime) {
        eventDate = new Date(event.dateTime);
      } else if (event.start?.dateTime) {
        eventDate = new Date(event.start.dateTime);
      } else {
        return []; // No valid date to check
      }
      
      // Define time window to check for conflicts (1 hour before to 1 hour after)
      const startCheck = new Date(eventDate);
      startCheck.setHours(startCheck.getHours() - 1);
      
      const endCheck = new Date(eventDate);
      endCheck.setHours(endCheck.getHours() + 1);
      
      // Find events within the time window - use events from context
      return events.filter(existingEvent => {
        // Skip the event itself
        if (existingEvent.id === event.id || 
            existingEvent.firestoreId === event.firestoreId ||
            existingEvent.universalId === event.universalId) {
          return false;
        }
        
        // Get event time
        let existingDate;
        if (existingEvent.dateObj) {
          existingDate = existingEvent.dateObj;
        } else if (existingEvent.dateTime) {
          existingDate = new Date(existingEvent.dateTime);
        } else if (existingEvent.start?.dateTime) {
          existingDate = new Date(existingEvent.start.dateTime);
        } else {
          return false; // No valid date
        }
        
        // Check if dates are on the same day
        const sameDay = existingDate.getDate() === eventDate.getDate() &&
                        existingDate.getMonth() === eventDate.getMonth() &&
                        existingDate.getFullYear() === eventDate.getFullYear();
        
        if (!sameDay) return false;
        
        // Check if times overlap
        const startTime = existingDate.getTime();
        const endTime = existingDate.getTime() + 60 * 60 * 1000; // Add 1 hour
        
        return (startTime <= endCheck.getTime() && endTime >= startCheck.getTime());
      });
    } catch (error) {
      console.error("Error checking for conflicts:", error);
      return [];
    }
  };
  
  // Handle filter changes
  const handleViewChange = (newView) => {
    setView(newView);
  };
  
  const handleMemberChange = (memberId) => {
    setSelectedMember(memberId);
  };
  
  const handleResetFilters = () => {
    setView('all');
    setSelectedMember('all');
  };
  
  // When in embedded mode, always render the full calendar
  // When in floating mode, render the minimized button if not open
  if (!isOpen && !embedded) {
    return (
      <div className="fixed bottom-4 left-4 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-black text-white p-3 rounded-full hover:bg-gray-800 shadow-lg"
        >
          <Calendar size={24} />
        </button>
      </div>
    );
  }
  

// Use the selectedDateEventsRef from the top level

/**
 * Get events for currently selected date with improved date comparison
 * Enhanced with advanced debouncing to prevent flickering
 * @returns {Array} Filtered events for selected date
 */
const getEventsForSelectedDate = () => {
  if (!selectedDate) return [];
  
  const now = Date.now();
  const CACHE_LIFETIME = 5000; // 5 seconds cache lifetime (increased from 2 seconds)
  
  // Create a stable, unique cache key based on all relevant factors
  const cacheKey = `${selectedDate.toDateString()}_${selectedMember}_${view}_${lastRefresh}`;
  
  // Check if we have the same cache key as before - this is the most reliable way to check
  if (selectedDateEventsRef.current.cacheKey === cacheKey &&
      now - selectedDateEventsRef.current.timestamp < CACHE_LIFETIME &&
      Array.isArray(selectedDateEventsRef.current.events)) {
    console.log("Using cached events for date:", selectedDate.toDateString());
    return selectedDateEventsRef.current.events;
  }
  
  // If we need to compute fresh events
  // Only log when debugging is enabled to reduce console spam
  const isDebugMode = false;
  
  if (isDebugMode) {
    console.log("🔴 Finding events for date:", selectedDate.toDateString(), 
      "with member:", selectedMember, "and view:", view);
  }
  
  // Filter events for the selected date
  const filteredEvents = events.filter(event => {
    // Ensure we have a valid date object with better handling
    let eventDate = null;
    
    try {
      // Try to get the date from any of the possible date fields
      if (event.dateObj instanceof Date && !isNaN(event.dateObj.getTime())) {
        eventDate = event.dateObj;
      } else if (event.start?.dateTime) {
        eventDate = new Date(event.start.dateTime);
      } else if (event.start?.date) {
        eventDate = new Date(event.start.date);
      } else if (event.dateTime) {
        eventDate = new Date(event.dateTime);
      } else if (event.date) {
        eventDate = new Date(event.date);
      }
      
      // Skip events with invalid dates
      if (!eventDate || isNaN(eventDate.getTime())) {
        return false;
      }
      
      // CRITICAL FIX: Use toDateString() for comparison to ignore time component
      const eventDateString = eventDate.toDateString();
      const selectedDateString = selectedDate.toDateString();
      
      // Log match info only when debugging to reduce console spam
      if (isDebugMode) {
        console.log(`🔴 Comparing dates: Event (${event.title}): ${eventDateString}, Selected: ${selectedDateString}`);
      }
      
      const dateMatch = eventDateString === selectedDateString;
      
      // If date doesn't match, return false immediately
      if (!dateMatch) return false;
      
      // Check member filter
      if (selectedMember !== 'all') {
        // For child events
        if (event.childName && selectedMember !== event.childId && selectedMember !== event.childName) {
          return false;
        }
        
        // For parent-assigned tasks
        if (event.assignedTo && selectedMember !== event.assignedTo && 
            event.assignedToName && selectedMember !== event.assignedToName) {
          return false;
        }
        
        // For family events, check attendees
        const hasSelectedMember = event.attendees?.some(
          attendee => attendee.id === selectedMember || attendee.name === selectedMember
        );
        
        if (!hasSelectedMember && !event.childName && !event.assignedTo) {
          return false;
        }
      }
      
      // Log successful matches only when debugging
      if (dateMatch && isDebugMode) {
        console.log(`🔴 Found matching event: "${event.title}" for date ${eventDateString}`);
      }
      
      return dateMatch;
    } catch (err) {
      // Safely handle any parse errors
      console.warn("Error processing event date", err);
      return false;
    }
  });
  
  // Apply view filter
  const viewFilteredEvents = filterEventsByView(filteredEvents);
  
  // Cache the results to prevent flickering
  selectedDateEventsRef.current = {
    date: selectedDate,
    member: selectedMember,
    view: view,
    events: viewFilteredEvents.map(e => ({...e, _stableId: e._stableId || e.universalId || e.id || e.firestoreId})),
    timestamp: now,
    cacheKey
  };
  
  return viewFilteredEvents;
};
  
  /**
   * Filter events based on the current view type including AI parsed events
   * @param {Array} events - Events to filter
   * @returns {Array} Filtered events
   */
  const filterEventsByView = (events) => {
    return events.filter(event => 
      view === 'all' || 
      (view === 'appointments' && (event.category === 'medical' || event.eventType === 'appointment')) ||
      (view === 'activities' && (event.category === 'activity' || event.eventType === 'activity')) ||
      (view === 'tasks' && (event.category === 'task' || event.eventType === 'task' || event.eventType === 'homework')) ||
      (view === 'meetings' && (event.category === 'meeting' || event.eventType === 'meeting')) ||
      (view === 'ai-parsed' && event.extraDetails?.parsedWithAI)
    );
  };
  
  // Use the upcomingEventsRef from the top level
  
  /**
   * Get upcoming events, filtered by view and member
   * Enhanced with advanced caching to prevent flickering
   * @returns {Array} Upcoming filtered events
   */
  const getUpcomingEvents = () => {
    const now = Date.now();
    const CACHE_LIFETIME = 5000; // 5 seconds cache lifetime (increased from 2 seconds)
    
    // Create a stable cache key that captures all relevant state
    const cacheKey = `upcoming_${selectedMember}_${view}_${lastRefresh}`;
    
    // Check if we can use cached events with the cache key for higher reliability
    if (upcomingEventsRef.current.cacheKey === cacheKey &&
        now - upcomingEventsRef.current.timestamp < CACHE_LIFETIME &&
        Array.isArray(upcomingEventsRef.current.events)) {
      console.log("Using cached upcoming events");
      return upcomingEventsRef.current.events;
    }
    
    // Otherwise compute fresh filtered events
    // Apply member filter
    let filtered = events.filter(event => {
      if (selectedMember === 'all') return true;
      
      // For child events
      if (event.childName && 
          (selectedMember === event.childId || selectedMember === event.childName)) {
        return true;
      }
      
      // For tasks
      if ((event.assignedTo && selectedMember === event.assignedTo) || 
          (event.assignedToName && selectedMember === event.assignedToName)) {
        return true;
      }
      
      // For other events, check attendees
      return event.attendees?.some(a => a.id === selectedMember || a.name === selectedMember);
    });
    
    // Apply view filter
    filtered = filterEventsByView(filtered);
    
    // Sort by date (upcoming first)
    const result = filtered.sort((a, b) => {
      try {
        // Convert to date objects if they aren't already
        const dateA = a.dateObj instanceof Date ? a.dateObj : new Date(a.dateObj);
        const dateB = b.dateObj instanceof Date ? b.dateObj : new Date(b.dateObj);
        return dateA - dateB;
      } catch (err) {
        console.warn("Error comparing dates:", err);
        return 0;
      }
    }).slice(0, 5);
    
    // Cache the results to prevent flickering on subsequent renders
    upcomingEventsRef.current = {
      member: selectedMember,
      view: view,
      events: result.map(e => ({...e, _stableId: e._stableId || e.universalId || e.id || e.firestoreId})),
      timestamp: now,
      lastEventsUpdate: lastRefresh,
      cacheKey // Store the cache key for reliable comparisons
    };
    
    return result;
  };
  
  // Event date objects for calendar highlighting
  const eventDates = events
    .filter(event => {
      // Apply member filter
      if (selectedMember !== 'all') {
        // For child events
        if (event.childName && selectedMember !== event.childId && selectedMember !== event.childName) {
          return false;
        }
        // For tasks
        if (event.assignedTo && selectedMember !== event.assignedTo && 
            event.assignedToName && selectedMember !== event.assignedToName) {
          return false;
        }
        // For other events, check attendees
        if (!event.attendees?.some(a => a.id === selectedMember || a.name === selectedMember)) {
          return false;
        }
      }
      // Make sure the event has a valid dateObj before including it
      return event.dateObj instanceof Date && !isNaN(event.dateObj);
    })
    .map(event => event.dateObj);
  
  return (
    <div className={embedded ? "w-full h-full" : "fixed bottom-4 left-4 z-40"}>
      {/* When floating widget is closed, show just the icon */}
      {!isOpen && !embedded ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-black text-white p-3 rounded-full hover:bg-gray-800 shadow-lg"
        >
          <Calendar size={24} />
        </button>
      ) : (
        <div 
          ref={widgetRef}
          className="bg-white border border-gray-200 shadow-lg rounded-lg flex flex-col relative overflow-hidden"
          style={{ 
            height: embedded ? "100%" : `${widgetHeight}rem`, 
            width: embedded ? "100%" : `${widgetWidth}rem`
          }}
        >
          {/* Google Style Calendar View */}
          <GoogleStyleCalendarView
            events={events}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onViewChange={(newView) => {
              // Map Google Calendar view terminology to our current filters
              if (newView === 'all' || newView === 'week' || newView === 'month' || newView === 'day' || newView === '4days') {
                setView(newView);
              }
            }}
            onEventClick={handleEventClick}
            onEventEdit={handleEventEdit}
            onEventDelete={handleDeleteEvent}
            onAddEvent={() => setShowEventManager(true)}
            familyMembers={familyMembers}
            loading={loading || eventsLoading}
            embedded={embedded}
            onClose={() => setIsOpen(false)}
          />
          
          {/* Resize handles - only shown in floating mode */}
          {!embedded && (
            <>
              {/* Corner resize handle (for both width and height) */}
              <div
                className="absolute bottom-0 right-0 w-4 h-4 bg-gray-200 rounded-bl-lg cursor-nwse-resize flex items-center justify-center"
                onMouseDown={(e) => startDrag(e, 'both')}
                ref={dragHandleRef}
              >
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <path d="M9 1L1 9M6 1L1 6M9 4L4 9" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>

              {/* Top height resize handle - moved from bottom to top */}
              <div
                className="absolute top-0 right-1/2 w-16 h-3 bg-gray-200 rounded-b-lg cursor-ns-resize transform translate-x-1/2 z-20"
                onMouseDown={(e) => startDrag(e, 'height')}
              >
                <div className="flex justify-center items-center h-full">
                  <div className="w-4 h-1 bg-gray-400 rounded"></div>
                </div>
              </div>

              {/* Right width resize handle */}
              <div
                className="absolute right-0 top-1/2 h-16 w-3 bg-gray-200 rounded-l-lg cursor-ew-resize transform -translate-y-1/2"
                onMouseDown={(e) => startDrag(e, 'width')}
              >
                <div className="flex justify-center items-center h-full">
                  <div className="h-4 w-1 bg-gray-400 rounded"></div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
      
{/* Event details are now handled directly in the GoogleStyleCalendarView component */}

{/* Enhanced Event Manager - now displayed as an overlay within the calendar widget container */}
{(showEventManager || (selectedEvent && isEditingEvent)) && (
  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-lg w-full max-h-[85vh] overflow-y-auto">
      <EnhancedEventManager
        initialEvent={isEditingEvent ? selectedEvent : null}
        selectedDate={selectedDate}
        onSave={async (eventToSave) => {
          console.log("🔄 EnhancedEventManager onSave called with event:", {
            title: eventToSave?.title,
            eventType: eventToSave?.eventType,
            isEdit: isEditingEvent
          });
          
          try {
            // Handle the event save based on whether it's a new event or edit
            if (isEditingEvent) {
              console.log("🔄 Updating existing event");
              
              // Call our improved handler with the event data
              await handleUpdateEvent(eventToSave);
              
              // Close forms since handleUpdateEvent handles everything else
              setShowEventManager(false);
              setShowEventDetails(false);
              setIsEditingEvent(false);
              
              // Return a success result
              return { 
                success: true, 
                firestoreId: eventToSave.firestoreId || eventToSave.id,
                message: "Event updated successfully" 
              };
            } else {
              console.log("🔄 Creating new event");
              
              // CRITICAL FIX: Set the lock to prevent parallel operations
              window._calendarRefreshInProgress = true;
              
              try {
                // Add event using the context's addEvent function
                let saveResult;
                if (typeof addEvent === 'function') {
                  saveResult = await addEvent(eventToSave);
                  console.log("✅ Event added with result:", saveResult);
                } else {
                  console.warn("⚠️ No addEvent function available, simulating success");
                  saveResult = { success: true, firestoreId: Date.now().toString() };
                }
                
                // Show notification
                CalendarService.showNotification("Event added successfully", "success");
                
                // Show success animation
                setShowSuccess(true);
                
                // Refresh events to display the new event
                try {
                  // Reset cache to ensure fresh data
                  resetEventCache();
                  
                  // Explicitly call refresh if available
                  if (typeof refreshEvents === 'function') {
                    await refreshEvents();
                  } else {
                    setLastRefresh(Date.now());
                  }
                  
                  // Dispatch DOM event to notify other components
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('calendar-event-updated', { 
                      detail: { 
                        updated: true, 
                        success: true,
                        eventId: saveResult?.firestoreId || saveResult?.eventId 
                      }
                    }));
                  }
                } catch (refreshError) {
                  console.warn("Error refreshing events:", refreshError);
                  setLastRefresh(Date.now());
                }
                
                // Wait a moment to show success message, then close the form
                setTimeout(() => {
                  setShowSuccess(false);
                  // Close the editor/creator
                  setShowEventManager(false);
                  setShowEventDetails(false);
                  setIsEditingEvent(false);
                  
                  // Release the refresh lock
                  window._calendarRefreshInProgress = false;
                }, 1500);
                
                // Return a success result with the event data to ensure it's available to the callback
                return {
                  success: true,
                  eventData: eventToSave,
                  firestoreId: saveResult?.firestoreId || saveResult?.eventId,
                  message: "Event added successfully"
                };
              } catch (saveError) {
                console.error("❌ Error saving event:", saveError);
                window._calendarRefreshInProgress = false;
                CalendarService.showNotification("Failed to save event", "error");
                return { success: false, error: saveError.message };
              }
            }
          } catch (error) {
            console.error("❌ General error in event save handling:", error);
            // Release the lock if it was set
            if (window._calendarRefreshInProgress) {
              window._calendarRefreshInProgress = false;
            }
            // Show error notification
            CalendarService.showNotification("Error processing event", "error");
            return { success: false, error: error.message };
          }
        }}
        onCancel={() => {
          setShowEventManager(false);
          setShowEventDetails(false);
          setIsEditingEvent(false);
        }}
        mode={isEditingEvent ? (selectedEvent.viewOnly ? "view" : "edit") : "create"}
        conflictingEvents={conflictingEvents}
        showAiMetadata={true}
        onDelete={isEditingEvent ? handleDeleteEvent : null}
      />
    </div>
  </div>
)}

      
      
      {/* Success animation - bottom right corner notification */}
      {showSuccess && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-white rounded-lg p-3 shadow-lg flex items-center space-x-3 animate-fadeIn">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-green-100">
              <Check size={18} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-sm">
                {isEditingEvent ? 'Event Updated!' : 'Event Added!'}
              </h3>
            </div>
          </div>
        </div>
      )}
      
      {/* Provider Directory Modal */}
      {showProviderDirectory && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">Select Provider</h3>
              <button 
                onClick={() => setShowProviderDirectory(false)}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>
            
            <ProviderDirectory 
              onClose={() => setShowProviderDirectory(false)}
              selectMode={true}
              onSelectProvider={(provider) => {
                console.log("Provider selected:", provider);
                // Call the callback provided in the custom event
                if (providerSelectionCallback) {
                  providerSelectionCallback(provider);
                }
                setShowProviderDirectory(false);
              }}
            />
          </div>
        </div>
      )}
      
      {/* Document Library Modal */}
      {showDocumentLibrary && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">Select Document</h3>
              <button 
                onClick={() => setShowDocumentLibrary(false)}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>
            
            <DocumentLibrary 
              onClose={() => setShowDocumentLibrary(false)}
              selectMode={true}
              onSelectDocument={(document) => {
                console.log("Document selected:", document);
                // Call the callback provided in the custom event
                if (documentSelectionCallback) {
                  documentSelectionCallback(document);
                }
                setShowDocumentLibrary(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RevisedFloatingCalendarWidget;