// src/contexts/NewEventContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useFamily } from './FamilyContext';
import EventStore from '../services/EventStore';

// Create the event context
const NewEventContext = createContext();

/**
 * Custom hook to use the event context
 * @returns {Object} Event context value
 */
export function useEvents() {
  return useContext(NewEventContext);
}

/**
 * Provider component for event data and operations
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children Child components
 * @returns {JSX.Element} Event context provider
 */
export function NewEventProvider({ children }) {
  // Get auth and family context
  const { currentUser } = useAuth();
  const { familyId, familyMembers } = useFamily();
  
  // Core state
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  
  // Local cache management to prevent unnecessary rerenders
  const [eventCache, setEventCache] = useState(new Map());
  
  // Flag to prevent parallel refresh operations
  const refreshInProgressRef = React.useRef(false);

  /**
   * Load all events for the current user
   */
  const loadEvents = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("Loading events for user:", currentUser.uid);
      const eventsData = await EventStore.getEventsForUser(currentUser.uid);
      
      // Process and standardize events
      const processedEvents = eventsData.map(event => {
        // Ensure we have proper date objects for each event
        try {
          let dateObj;
          if (event.dateObj instanceof Date) {
            dateObj = event.dateObj;
          } else if (event.dateTime) {
            dateObj = new Date(event.dateTime);
          } else if (event.start?.dateTime) {
            dateObj = new Date(event.start.dateTime);
          } else if (event.date) {
            dateObj = new Date(event.date);
          } else {
            dateObj = new Date();
          }
          
          // Ensure attendees are in consistent format
          const attendees = Array.isArray(event.attendees) 
            ? event.attendees.map(attendee => {
                if (typeof attendee === 'string') {
                  // Convert simple attendee IDs to objects
                  const familyMember = familyMembers.find(m => m.id === attendee);
                  return {
                    id: attendee,
                    name: familyMember?.name || 'Unknown',
                    role: familyMember?.role || 'general',
                  };
                }
                return attendee;
              })
            : [];
          
          return {
            ...event,
            dateObj,
            attendees,
          };
        } catch (e) {
          console.error("Error processing event:", e);
          return event;
        }
      });
      
      console.log(`Loaded ${processedEvents.length} events`);
      setEvents(processedEvents);
      
      // Update the event cache
      const newCache = new Map();
      processedEvents.forEach(event => {
        if (event.id) {
          newCache.set(event.id, event);
        }
        if (event.firestoreId && event.firestoreId !== event.id) {
          newCache.set(event.firestoreId, event);
        }
        if (event.universalId && event.universalId !== event.id && event.universalId !== event.firestoreId) {
          newCache.set(event.universalId, event);
        }
      });
      setEventCache(newCache);
      
    } catch (err) {
      console.error("Error loading events:", err);
      setError(err.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [currentUser, familyMembers]);

  /**
   * Refresh all events from the database
   * @returns {Promise<Array>} Refreshed events
   */
  const refreshEvents = useCallback(async () => {
    if (!currentUser || refreshInProgressRef.current) {
      console.log("Refresh skipped - no user or already in progress");
      return events;
    }
    
    refreshInProgressRef.current = true;
    console.log("Refreshing events from database");
    
    try {
      await loadEvents();
      setLastRefresh(Date.now());
      
      // Dispatch DOM event for components listening for refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('calendar-events-refreshed', {
          detail: { timestamp: Date.now() }
        }));
      }
      
      return events;
    } catch (err) {
      console.error("Error refreshing events:", err);
      throw err;
    } finally {
      // Add a small delay to prevent rapid consecutive refreshes
      setTimeout(() => {
        refreshInProgressRef.current = false;
      }, 300);
    }
  }, [currentUser, events, loadEvents]);

  /**
   * Add a new event to the calendar
   * @param {Object} eventData Event data to add
   * @returns {Promise<Object>} Result object with success flag
   */
  const addEvent = useCallback(async (eventData) => {
    if (!currentUser) {
      return { success: false, error: "User not authenticated" };
    }
    
    try {
      console.log("Adding event:", eventData.title);
      
      // Ensure attendees are in the correct format
      const standardizedEvent = {
        ...eventData,
        userId: currentUser.uid,
        familyId: familyId,
      };
      
      // Add event to database
      const result = await EventStore.addEvent(standardizedEvent, currentUser.uid, familyId);
      
      if (result.success) {
        // Refresh the events list to include the new event
        refreshEvents();
        
        // Force calendar refresh via DOM event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('force-calendar-refresh'));
        }
      }
      
      return result;
    } catch (err) {
      console.error("Error adding event:", err);
      return { success: false, error: err.message || "Failed to add event" };
    }
  }, [currentUser, familyId, refreshEvents]);

  /**
   * Update an existing event
   * @param {string} eventId ID of the event to update
   * @param {Object} updateData Updated event data
   * @returns {Promise<Object>} Result object with success flag
   */
  const updateEvent = useCallback(async (eventId, updateData) => {
    if (!currentUser) {
      return { success: false, error: "User not authenticated" };
    }
    
    try {
      console.log(`Updating event ${eventId}:`, updateData.title);
      
      // Ensure we have an existing event
      const existingEvent = eventCache.get(eventId);
      if (!existingEvent && !updateData.firestoreId) {
        console.error(`Event ${eventId} not found in cache`);
      }
      
      // Update event in database
      const result = await EventStore.updateEvent(eventId, updateData, currentUser.uid);
      
      if (result.success) {
        // Refresh events to get the updated event
        refreshEvents();
        
        // Force calendar refresh via DOM event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('force-calendar-refresh'));
        }
      }
      
      return result;
    } catch (err) {
      console.error("Error updating event:", err);
      return { success: false, error: err.message || "Failed to update event" };
    }
  }, [currentUser, eventCache, refreshEvents]);

  /**
   * Delete an event from the calendar
   * @param {string} eventId ID of the event to delete
   * @returns {Promise<Object>} Result object with success flag
   */
  const deleteEvent = useCallback(async (eventId) => {
    if (!currentUser) {
      return { success: false, error: "User not authenticated" };
    }
    
    try {
      console.log(`Deleting event ${eventId}`);
      
      // Delete event from database
      const result = await EventStore.deleteEvent(eventId, currentUser.uid);
      
      if (result.success) {
        // Remove from local state
        setEvents(prev => prev.filter(event => 
          event.id !== eventId && 
          event.firestoreId !== eventId &&
          event.universalId !== eventId
        ));
        
        // Force calendar refresh via DOM event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('force-calendar-refresh'));
        }
      }
      
      return result;
    } catch (err) {
      console.error("Error deleting event:", err);
      return { success: false, error: err.message || "Failed to delete event" };
    }
  }, [currentUser]);

  /**
   * Get events filtered by various criteria
   * @param {Object} filters Filter options
   * @param {string} [filters.childId] Filter by child ID
   * @param {string} [filters.category] Filter by category
   * @param {string} [filters.eventType] Filter by event type
   * @param {Date} [filters.startDate] Filter by start date
   * @param {Date} [filters.endDate] Filter by end date
   * @param {Function} [filters.customFilter] Custom filter function
   * @returns {Array} Filtered events
   */
  const getFilteredEvents = useCallback((filters = {}) => {
    const {
      childId,
      category,
      eventType,
      startDate,
      endDate,
      customFilter,
      memberIds,
    } = filters;
    
    return events.filter(event => {
      // Date range filter
      if (startDate && event.dateObj < startDate) {
        return false;
      }
      if (endDate && event.dateObj > endDate) {
        return false;
      }
      
      // Category or event type filter
      if (category && event.category !== category && event.eventType !== category) {
        return false;
      }
      if (eventType && event.eventType !== eventType) {
        return false;
      }
      
      // Child filter
      if (childId && event.childId !== childId && 
          !event.attendees?.some(a => a.id === childId)) {
        return false;
      }
      
      // Member IDs filter (for any family member)
      if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
        // Check if any of the required members are attendees
        const hasAnyMember = memberIds.some(memberId => 
          event.attendees?.some(a => a.id === memberId)
        );
        if (!hasAnyMember) {
          return false;
        }
      }
      
      // Custom filter function
      if (customFilter && typeof customFilter === 'function') {
        return customFilter(event);
      }
      
      return true;
    });
  }, [events]);

  /**
   * Get events for a specific date
   * @param {Date} date The date to get events for
   * @returns {Array} Events on the specified date
   */
  const getEventsForDate = useCallback((date) => {
    if (!date) return [];
    
    // Create a date string for comparison - using just the date part
    const dateString = date.toISOString().split('T')[0];
    console.log("Looking for events on date:", dateString);
    
    return events.filter(event => {
      if (!event || !event.dateObj) return false;
      
      // Handle potential date parsing issues
      let eventDate;
      try {
        if (event.dateObj instanceof Date) {
          eventDate = event.dateObj;
        } else if (typeof event.dateObj === 'string') {
          eventDate = new Date(event.dateObj);
        } else {
          // Try other date fields if available
          if (event.dateTime) {
            eventDate = new Date(event.dateTime);
          } else if (event.start?.dateTime) {
            eventDate = new Date(event.start.dateTime);
          } else {
            console.warn("Event has invalid date:", event);
            return false;
          }
        }
        
        // Compare just the date part (YYYY-MM-DD)
        const eventDateString = eventDate.toISOString().split('T')[0];
        const match = eventDateString === dateString;
        
        if (match) {
          console.log("Found matching event:", event.title, "on", eventDateString);
        }
        
        return match;
      } catch (e) {
        console.error("Error parsing event date:", e, event);
        return false;
      }
    });
  }, [events]);

  // Load events when the user or family changes
  useEffect(() => {
    if (currentUser) {
      loadEvents();
      
      // Subscribe to event changes via EventStore
      const unsubscribe = EventStore.subscribe((action, updatedEvent) => {
        if (action === 'add') {
          console.log("Adding event to context:", updatedEvent.title);
          // Add a stable ID before adding to context if none exists
          const eventToAdd = {
            ...updatedEvent,
            _stableId: updatedEvent._stableId || `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          };
          setEvents(prev => [...prev, eventToAdd]);
        } else if (action === 'update') {
          console.log("Updating event in context:", updatedEvent.title);
          setEvents(prev => prev.map(event => 
            (event.id === updatedEvent.id || 
             event.firestoreId === updatedEvent.firestoreId || 
             event.universalId === updatedEvent.universalId) 
              ? {...updatedEvent, _stableId: event._stableId || `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`} : event
          ));
        } else if (action === 'delete') {
          console.log("Deleting event from context:", updatedEvent.id);
          setEvents(prev => prev.filter(event => 
            event.id !== updatedEvent.id && 
            event.firestoreId !== updatedEvent.firestoreId &&
            event.universalId !== updatedEvent.universalId
          ));
        }
      });
      
      // Listen for calendar refresh requests
      const handleForceRefresh = () => {
        refreshEvents();
      };
      
      if (typeof window !== 'undefined') {
        window.addEventListener('force-calendar-refresh', handleForceRefresh);
      }
      
      return () => {
        unsubscribe();
        if (typeof window !== 'undefined') {
          window.removeEventListener('force-calendar-refresh', handleForceRefresh);
        }
      };
    }
  }, [currentUser, loadEvents, refreshEvents]);

  // Context value
  const value = {
    events,
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    refreshEvents,
    getFilteredEvents,
    getEventsForDate,
    lastRefresh,
  };

  return (
    <NewEventContext.Provider value={value}>
      {children}
    </NewEventContext.Provider>
  );
}

export default NewEventContext;