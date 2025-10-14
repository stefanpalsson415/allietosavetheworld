// src/hooks/useEvent.fixed.js - Fixed version that prevents event loops
import { useState, useEffect, useCallback } from 'react';
import eventStore from '../services/EventStore.fixed'; // Import fixed version
import { useAuth } from '../contexts/AuthContext';

export function useEvents(options = {}) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { currentUser } = useAuth();
  
    const {
      startDate = null,
      endDate = null,
      familyId = null,
      cycleNumber = null,
      filterBy = null,
      childId = null,
      category = null
    } = options;
  
    useEffect(() => {
      if (!currentUser) return;
  
      let isMounted = true;
      setLoading(true);
  
      const loadEvents = async () => {
        try {
          let eventData;
          
          if (cycleNumber && familyId) {
            // Get events for a specific cycle
            eventData = await eventStore.getEventsForCycle(familyId, cycleNumber);
          } else {
            // Get all events for user
            eventData = await eventStore.getEventsForUser(currentUser.uid, startDate, endDate);
          }
          
          // Apply filters
          let filteredEvents = eventData;
          
          if (childId) {
            filteredEvents = filteredEvents.filter(event => 
              event.childId === childId || 
              (event.attendees && event.attendees.some(a => a.id === childId))
            );
          }
          
          if (category) {
            filteredEvents = filteredEvents.filter(event => 
              event.category === category || event.eventType === category
            );
          }
          
          if (filterBy && typeof filterBy === 'function') {
            filteredEvents = filteredEvents.filter(filterBy);
          }
          
          if (isMounted) {
            setEvents(filteredEvents);
            setError(null);
          }
        } catch (err) {
          if (isMounted) {
            setError(err.message);
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };
  
      loadEvents();
  
      // Subscribe to changes with anti-loop protection
      const unsubscribe = eventStore.subscribe((action, updatedEvent) => {
        if (!isMounted) return;
        
        if (action === 'add') {
          // Apply filters to new events
          let shouldAdd = true;
          
          if (childId && 
              updatedEvent.childId !== childId && 
              (!updatedEvent.attendees || !updatedEvent.attendees.some(a => a.id === childId))) {
            shouldAdd = false;
          }
          
          if (shouldAdd && category && 
              updatedEvent.category !== category && 
              updatedEvent.eventType !== category) {
            shouldAdd = false;
          }
          
          if (shouldAdd && filterBy && typeof filterBy === 'function' && !filterBy(updatedEvent)) {
            shouldAdd = false;
          }
          
          if (shouldAdd) {
            setEvents(prev => {
              // Skip if event already exists
              if (prev.some(e => 
                e.id === updatedEvent.id || 
                e.firestoreId === updatedEvent.firestoreId || 
                e.universalId === updatedEvent.universalId
              )) {
                return prev;
              }
              return [...prev, updatedEvent];
            });
          }
        } else if (action === 'update') {
          setEvents(prev => prev.map(event => 
            (event.id === updatedEvent.id || 
             event.firestoreId === updatedEvent.firestoreId || 
             event.universalId === updatedEvent.universalId) 
              ? updatedEvent : event
          ));
        } else if (action === 'delete') {
          setEvents(prev => prev.filter(event => 
            event.id !== updatedEvent.id && 
            event.firestoreId !== updatedEvent.firestoreId && 
            event.universalId !== updatedEvent.universalId
          ));
        }
      });
  
      // Track calendar refresh requests
      let lastRefreshTime = 0;
      let refreshTimeout = null;
      
      // Listen for calendar refresh events with anti-loop protection
      const handleCalendarRefresh = (event) => {
        if (!isMounted) return;
        
        // Skip frequent refreshes
        const now = Date.now();
        if (now - lastRefreshTime < 2000) {
          return;
        }
        
        // Skip self-triggered refreshes
        const source = event?.detail?.source || 'unknown';
        if (source === 'useEvent-hook') {
          return;
        }
        
        // Debounce refreshes
        if (refreshTimeout) {
          clearTimeout(refreshTimeout);
        }
        
        // Set a new debounced refresh
        refreshTimeout = setTimeout(() => {
          lastRefreshTime = Date.now();
          loadEvents();
        }, 500);
      };
      
      if (typeof window !== 'undefined') {
        window.addEventListener('force-calendar-refresh', handleCalendarRefresh);
      }
      
      return () => {
        isMounted = false;
        unsubscribe();
        
        if (refreshTimeout) {
          clearTimeout(refreshTimeout);
        }
        
        if (typeof window !== 'undefined') {
          window.removeEventListener('force-calendar-refresh', handleCalendarRefresh);
        }
      };
    }, [currentUser, startDate, endDate, familyId, cycleNumber, childId, category, filterBy]);
  
    // Add a new event
    const addEvent = useCallback(async (eventData) => {
      if (!currentUser) return { success: false, error: 'User not authenticated' };
      
      try {
        // Use the eventStore directly
        return await eventStore.addEvent(eventData, currentUser.uid, familyId);
      } catch (error) {
        console.error("Error in addEvent:", error);
        return { success: false, error: error.message };
      }
    }, [currentUser, familyId]);
  
    // Update an event
    const updateEvent = useCallback(async (eventId, updateData) => {
      if (!currentUser) return { success: false, error: 'User not authenticated' };
      
      try {
        // Use the eventStore directly
        return await eventStore.updateEvent(eventId, updateData, currentUser.uid);
      } catch (error) {
        console.error("Error in updateEvent:", error);
        return { success: false, error: error.message };
      }
    }, [currentUser]);
  
    // Delete an event
    const deleteEvent = useCallback(async (eventId) => {
      if (!currentUser) return { success: false, error: 'User not authenticated' };
      
      try {
        // Use the eventStore directly
        return await eventStore.deleteEvent(eventId, currentUser.uid);
      } catch (error) {
        console.error("Error in deleteEvent:", error);
        return { success: false, error: error.message };
      }
    }, [currentUser]);
  
    // Refresh events
    const refreshEvents = useCallback(async () => {
      if (!currentUser) return;
      
      setLoading(true);
      
      try {
        // Clear cache
        eventStore.clearCache();
        
        // Refresh events
        const refreshedEvents = await eventStore.refreshEvents(currentUser.uid, familyId);
        
        // Apply filters
        let filteredEvents = refreshedEvents;
        
        if (childId) {
          filteredEvents = filteredEvents.filter(event => 
            event.childId === childId || 
            (event.attendees && event.attendees.some(a => a.id === childId))
          );
        }
        
        if (category) {
          filteredEvents = filteredEvents.filter(event => 
            event.category === category || event.eventType === category
          );
        }
        
        if (filterBy && typeof filterBy === 'function') {
          filteredEvents = filteredEvents.filter(filterBy);
        }
        
        // Update state
        setEvents(filteredEvents);
      } catch (error) {
        console.error("Error refreshing events:", error);
      } finally {
        setLoading(false);
      }
    }, [currentUser, childId, category, filterBy, familyId]);
  
    return {
      events,
      loading,
      error,
      addEvent,
      updateEvent,
      deleteEvent,
      refreshEvents
    };
  }
  
  // Re-export useCycleDueDate 
  export function useCycleDueDate(familyId, cycleNumber) {
    const [dueEvent, setDueEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { currentUser } = useAuth();
  
    useEffect(() => {
      if (!familyId || !cycleNumber || !currentUser) return;
  
      let isMounted = true;
      setLoading(true);
  
      const loadDueDate = async () => {
        try {
          const event = await eventStore.getCycleDueDateEvent(familyId, cycleNumber);
          if (isMounted) {
            setDueEvent(event);
            setError(null);
          }
        } catch (err) {
          if (isMounted) {
            setError(err.message);
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };
  
      loadDueDate();
  
      // Subscribe to changes
      const unsubscribe = eventStore.subscribe((action, updatedEvent) => {
        if (!isMounted) return;
        
        if (action === 'delete' && dueEvent &&
            (updatedEvent.id === dueEvent.id ||
             updatedEvent.firestoreId === dueEvent.firestoreId ||
             updatedEvent.universalId === dueEvent.universalId)) {
          setDueEvent(null);
        } else {
          // If an event changes that could be our due date, reload
          loadDueDate();
        }
      });
  
      return () => {
        isMounted = false;
        unsubscribe();
      };
    }, [familyId, cycleNumber, currentUser, dueEvent]);
  
    // Update the due date event
    const updateDueDate = useCallback(async (newDate) => {
      if (!currentUser) return { success: false, error: 'User not authenticated' };
      
      try {
        if (dueEvent) {
          // Update existing event
          return await eventStore.updateEvent(dueEvent.firestoreId, {
            start: {
              dateTime: newDate.toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
              dateTime: new Date(newDate.getTime() + 60 * 60 * 1000).toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            date: newDate.toISOString(),
            dateTime: newDate.toISOString(),
            dateObj: newDate
          }, currentUser.uid);
        } else {
          // Create new due date event
          return await eventStore.addEvent({
            title: `Cycle ${cycleNumber} Due Date`,
            description: `Family meeting for Cycle ${cycleNumber} to discuss survey results and set goals.`,
            category: 'cycle-due-date',
            eventType: 'cycle-due-date',
            cycleNumber: cycleNumber,
            dateTime: newDate.toISOString(),
            universalId: `cycle-due-date-${familyId}-${cycleNumber}`
          }, currentUser.uid, familyId);
        }
      } catch (error) {
        console.error("Error updating due date:", error);
        return { success: false, error: error.message };
      }
    }, [dueEvent, cycleNumber, familyId, currentUser]);
  
    return {
      dueEvent,
      dueDate: dueEvent ? new Date(dueEvent.dateTime) : null,
      loading,
      error,
      updateDueDate
    };
  }