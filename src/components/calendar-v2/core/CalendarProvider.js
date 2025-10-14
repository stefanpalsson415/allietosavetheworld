import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useFamily } from '../../../contexts/FamilyContext';
import { useEvents } from '../../../contexts/NewEventContext';
import { ConflictDetector } from '../services/ConflictDetector';
import { NotificationManager } from '../services/NotificationManager';
import CalendarServiceV2 from '../../../services/CalendarServiceV2';

const CalendarContext = createContext();

export const useCalendarContext = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendarContext must be used within CalendarProvider');
  }
  return context;
};

export const CalendarProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { selectedFamily, familyMembers, familyId } = useFamily();
  const { 
    events: eventContextEvents = [], 
    loading: eventContextLoading = false,
    refreshEvents
  } = useEvents() || {};
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscriptionReady, setSubscriptionReady] = useState(false);
  
  // Ensure loading is set to false after a timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('CalendarProvider: Loading timeout - setting loading to false');
        setLoading(false);
      }
    }, 3000); // 3 second timeout
    
    return () => clearTimeout(timeout);
  }, [loading]);
  const [view, setView] = useState('month'); // month, week, day, agenda
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    console.log('CalendarProvider: Initializing selectedDate to today:', today.toDateString());
    return today;
  });
  const [filters, setFilters] = useState({
    categories: [],
    familyMembers: [],
    showDeclined: false
  });

  const conflictDetector = new ConflictDetector();
  const notificationManager = new NotificationManager();
  
  // Expose functions globally for emergency fixes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__calendarProviderSetEvents = setEvents;
      window.__calendarProviderSetLoading = setLoading;
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete window.__calendarProviderSetEvents;
        delete window.__calendarProviderSetLoading;
      }
    };
  }, []);

  // Initialize notification manager
  useEffect(() => {
    if (currentUser?.uid) {
      notificationManager.initialize(currentUser.uid);
    }
    return () => {
      notificationManager.destroy();
    };
  }, [currentUser?.uid]);

  // Listen for calendar sync events
  useEffect(() => {
    const handleCalendarSync = async (event) => {
      console.log('Calendar sync completed, refreshing events...', event.detail);
      if (event.detail.familyId === familyId) {
        setLoading(true);
        setSubscriptionReady(false);

        try {
          // Fetch fresh events from Firestore
          console.log('CalendarProvider: Fetching fresh events after sync for family:', familyId);
          const freshEvents = await CalendarServiceV2.getEvents(
            familyId,
            new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Past year
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)  // Next year
          );

          console.log(`CalendarProvider: Post-sync refresh loaded ${freshEvents.length} events`);

          // Transform events to ensure proper format
          const transformedEvents = freshEvents.map(event => {
            let startTime, endTime;

            if (event.startTime) {
              startTime = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
            } else if (event.start?.dateTime) {
              startTime = new Date(event.start.dateTime);
            } else {
              startTime = new Date();
            }

            if (event.endTime) {
              endTime = event.endTime instanceof Date ? event.endTime : new Date(event.endTime);
            } else if (event.end?.dateTime) {
              endTime = new Date(event.end.dateTime);
            } else {
              endTime = new Date(startTime);
              endTime.setHours(endTime.getHours() + 1);
            }

            return {
              ...event,
              startTime,
              endTime,
              id: event.id || event.firestoreId || event.universalId,
              title: event.title || event.summary || 'Untitled Event'
            };
          });

          setEvents(transformedEvents);
          setLoading(false);
          setSubscriptionReady(true);

          console.log('CalendarProvider: Successfully refreshed events after sync');
        } catch (error) {
          console.error('CalendarProvider: Error refreshing events after sync:', error);
          setLoading(false);
          setSubscriptionReady(true);
        }
      }
    };

    window.addEventListener('calendar-sync-completed', handleCalendarSync);
    return () => {
      window.removeEventListener('calendar-sync-completed', handleCalendarSync);
    };
  }, [familyId]);

  // Use events from EventContext - DISABLED to use CalendarServiceV2 instead
  useEffect(() => {
    console.log('CalendarProvider: Using CalendarServiceV2 for events');
    // Skip EventContext to avoid conflicts
    return;
    
    /* DISABLED - Using CalendarServiceV2 subscription instead
    console.log('CalendarProvider: Event context status:', {
      eventsLength: eventContextEvents?.length || 0,
      loading: eventContextLoading,
      firstEvent: eventContextEvents?.[0],
      circuitBreakerStatus: window._forceEventCircuitBreaker,
      emptyResultCounter: window._eventEmptyResultCounter
    });
    
    // If we have events from context, use them
    if (eventContextEvents && eventContextEvents.length > 0) {
      console.log('CalendarProvider: Using events from EventContext');
      
      // Transform events to ensure they have the expected format
      const transformedEvents = eventContextEvents.map(event => {
        // Handle different date formats
        let startTime, endTime;
        
        if (event.startTime) {
          startTime = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
        } else if (event.start?.dateTime) {
          startTime = new Date(event.start.dateTime);
        } else if (event.dateTime) {
          startTime = new Date(event.dateTime);
        } else if (event.date) {
          startTime = new Date(event.date);
        } else {
          console.warn('Event missing start time:', event);
          startTime = new Date();
        }
        
        if (event.endTime) {
          endTime = event.endTime instanceof Date ? event.endTime : new Date(event.endTime);
        } else if (event.end?.dateTime) {
          endTime = new Date(event.end.dateTime);
        } else {
          // Default to 1 hour after start
          endTime = new Date(startTime);
          endTime.setHours(endTime.getHours() + 1);
        }
        
        return {
          ...event,
          startTime,
          endTime,
          // Ensure required fields
          id: event.id || event.firestoreId || event.universalId || `event-${Date.now()}`,
          title: event.title || event.summary || 'Untitled Event'
        };
      });
      
      setEvents(transformedEvents);
      setLoading(false);
      
      // Schedule notifications for upcoming events
      const now = new Date();
      transformedEvents.forEach(event => {
        if (event.startTime > now) {
          notificationManager.scheduleEventNotifications(event);
        }
      });
      
      // Check for missed events
      notificationManager.checkMissedEvents(transformedEvents);
    } else if (eventContextEvents.length === 0 && !eventContextLoading && user?.uid) {
      console.log('CalendarProvider: No events from context, attempting direct load from EventStore');
      console.log('🔍 DEBUG CalendarProvider: User details:', {
        uid: user?.uid,
        displayName: user?.displayName,
        email: user?.email,
        familyId: familyId,
        selectedFamily: selectedFamily
      });
      
      // Import EventStore dynamically
      import('../../../services/EventStore').then(({ default: EventStore }) => {
        EventStore.getEventsForUser(user.uid, null, null, familyId).then(directEvents => {
          console.log('CalendarProvider: Direct load got', directEvents?.length || 0, 'events');
          if (directEvents && directEvents.length > 0) {
            // Transform and set events
            const transformedEvents = directEvents.map(event => {
              let startTime, endTime;
              
              if (event.startTime) {
                startTime = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
              } else if (event.start?.dateTime) {
                startTime = new Date(event.start.dateTime);
              } else if (event.dateTime) {
                startTime = new Date(event.dateTime);
              } else if (event.date) {
                startTime = new Date(event.date);
              } else {
                console.warn('Event missing start time:', event);
                startTime = new Date();
              }
              
              if (event.endTime) {
                endTime = event.endTime instanceof Date ? event.endTime : new Date(event.endTime);
              } else if (event.end?.dateTime) {
                endTime = new Date(event.end.dateTime);
              } else {
                // Default to 1 hour after start
                endTime = new Date(startTime);
                endTime.setHours(endTime.getHours() + 1);
              }
              
              return {
                ...event,
                startTime,
                endTime,
                id: event.id || event.firestoreId || event.universalId || `event-${Date.now()}`,
                title: event.title || event.summary || 'Untitled Event'
              };
            });
            
            setEvents(transformedEvents);
            setLoading(false);
          }
        }).catch(error => {
          console.error('CalendarProvider: Error loading events directly:', error);
        });
      });
    } else {
      setEvents([]);
      setLoading(false);
    }
    */
  }, [eventContextEvents, eventContextLoading, currentUser?.uid]);

  // Try to refresh events if none are loaded - DISABLED
  useEffect(() => {
    // Disabled to prevent conflicts with CalendarServiceV2
    return;
    /*
    if (refreshEvents && eventContextEvents.length === 0 && !eventContextLoading && user?.uid) {
      console.log('CalendarProvider: No events found, attempting to refresh from EventContext');
      refreshEvents();
    }
    */
  }, [refreshEvents, eventContextEvents.length, eventContextLoading, currentUser?.uid]);

  // Subscribe to real-time updates from CalendarServiceV2
  useEffect(() => {
    console.log('CalendarProvider: Checking subscription requirements', {
      familyId,
      user: currentUser,
      userId: currentUser?.uid || currentUser?.id,
      hasUser: !!currentUser
    });
    
    const userId = currentUser?.uid || currentUser?.id;
    if (!familyId || !userId) {
      console.log('CalendarProvider: Missing requirements for subscription', { familyId, userId });
      // Set loading to false if we can't load events
      if (!familyId) {
        setLoading(false);
      }
      return;
    }
    
    console.log('CalendarProvider: Setting up CalendarServiceV2 subscription');
    
    const unsubscribe = CalendarServiceV2.subscribeToEvents(
      familyId,
      (events, changes) => {
        console.log('CalendarProvider: Received update from CalendarServiceV2', {
          totalEvents: events.length,
          added: changes?.added?.length || 0,
          modified: changes?.modified?.length || 0,
          removed: changes?.removed?.length || 0
        });
        
        // Transform events to ensure proper format
        const transformedEvents = events.map(event => {
          let startTime, endTime;
          
          if (event.startTime) {
            startTime = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
          } else if (event.start?.dateTime) {
            startTime = new Date(event.start.dateTime);
          } else {
            startTime = new Date();
          }
          
          if (event.endTime) {
            endTime = event.endTime instanceof Date ? event.endTime : new Date(event.endTime);
          } else if (event.end?.dateTime) {
            endTime = new Date(event.end.dateTime);
          } else {
            endTime = new Date(startTime);
            endTime.setHours(endTime.getHours() + 1);
          }
          
          return {
            ...event,
            startTime,
            endTime,
            id: event.id || event.firestoreId || event.universalId,
            title: event.title || event.summary || 'Untitled Event'
          };
        });
        
        setEvents(transformedEvents);
        setLoading(false);
        setSubscriptionReady(true);
      }
    );
    
    // Initial load - get all events immediately
    console.log('CalendarProvider: Loading initial events for family:', familyId);
    CalendarServiceV2.getEvents(familyId, 
      new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Past year
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)  // Next year
    ).then(initialEvents => {
      console.log(`CalendarProvider: Initial load - ${initialEvents.length} events`);
      const transformedEvents = initialEvents.map(event => {
        let startTime, endTime;
        
        if (event.startTime) {
          startTime = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
        } else if (event.start?.dateTime) {
          startTime = new Date(event.start.dateTime);
        } else {
          startTime = new Date();
        }
        
        if (event.endTime) {
          endTime = event.endTime instanceof Date ? event.endTime : new Date(event.endTime);
        } else if (event.end?.dateTime) {
          endTime = new Date(event.end.dateTime);
        } else {
          endTime = new Date(startTime);
          endTime.setHours(endTime.getHours() + 1);
        }
        
        return {
          ...event,
          startTime,
          endTime,
          id: event.id || event.firestoreId || event.universalId,
          title: event.title || event.summary || 'Untitled Event'
        };
      });
      
      setEvents(transformedEvents);
      setLoading(false);
    }).catch(error => {
      console.error('CalendarProvider: Error loading initial events:', error);
      setLoading(false);
    });
    
    return () => {
      console.log('CalendarProvider: Cleaning up CalendarServiceV2 subscription');
      unsubscribe();
    };
  }, [familyId, currentUser?.uid, currentUser?.id, currentUser]);

  // Listen for force refresh events
  useEffect(() => {
    const handleForceRefresh = (event) => {
      console.log('CalendarProvider: Received force-calendar-refresh event', event.detail);
      // The onSnapshot listener will automatically pick up new events
      // But we can log to confirm it's working
    };

    const handleCalendarEventAdded = (event) => {
      console.log('CalendarProvider: Received calendar-event-added event', event.detail);
    };

    window.addEventListener('force-calendar-refresh', handleForceRefresh);
    window.addEventListener('calendar-event-added', handleCalendarEventAdded);

    return () => {
      window.removeEventListener('force-calendar-refresh', handleForceRefresh);
      window.removeEventListener('calendar-event-added', handleCalendarEventAdded);
    };
  }, []);

  // Check for conflicts
  const checkConflicts = (eventData, eventId = null) => {
    // Filter out the event being updated
    const otherEvents = eventId ? events.filter(e => e.id !== eventId) : events;
    return conflictDetector.detectConflicts(eventData, otherEvents, familyMembers || []);
  };

  // Create event - use CalendarServiceV2 for reliability
  const createEvent = async (eventData) => {
    console.log('CalendarProvider createEvent called with:', eventData);
    console.log('selectedFamily:', selectedFamily);
    console.log('user:', currentUser);
    
    if (!selectedFamily?.id || !currentUser?.uid) {
      console.error('Cannot create event - missing family or user:', {
        familyId: selectedFamily?.id,
        userId: currentUser?.uid
      });
      throw new Error(!selectedFamily?.id ? 'No family selected' : 'No user logged in');
    }

    // Check for conflicts
    const conflicts = checkConflicts(eventData);
    
    const newEvent = {
      ...eventData,
      familyId: selectedFamily.id,
      createdBy: currentUser.uid,
      conflicts: conflicts // Store conflicts with the event
    };

    try {
      const result = await CalendarServiceV2.createEvent(
        newEvent, 
        currentUser.uid, 
        selectedFamily.id
      );
      
      if (result.success && result.event) {
        // Schedule notifications for the new event
        notificationManager.scheduleEventNotifications(result.event);
      }
      
      return result;
    } catch (error) {
      console.error('Error creating event:', error);
      return null;
    }
  };

  // Update event - use CalendarServiceV2
  const updateEvent = async (eventId, updates) => {
    try {
      // Get the previous event data
      const previousEvent = events.find(e => e.id === eventId);
      
      // Check for conflicts with the updated data
      const conflicts = checkConflicts(updates, eventId);
      
      const result = await CalendarServiceV2.updateEvent(eventId, {
        ...updates,
        conflicts: conflicts
      }, currentUser?.uid);
      
      if (result.success && previousEvent) {
        // Update notifications if needed
        const updatedEvent = { ...previousEvent, ...updates };
        notificationManager.updateEventNotifications(updatedEvent, previousEvent);
      }
      
      return result.success;
    } catch (error) {
      console.error('Error updating event:', error);
      return false;
    }
  };

  // Delete event - use CalendarServiceV2
  const deleteEvent = async (eventId) => {
    try {
      // Cancel notifications for the event
      notificationManager.cancelEventNotifications(eventId);
      
      const result = await CalendarServiceV2.deleteEvent(eventId, currentUser?.uid);
      
      return result.success;
    } catch (error) {
      console.error('Error deleting event:', error);
      return false;
    }
  };

  // Get filtered events
  const getFilteredEvents = () => {
    console.log('CalendarProvider getFilteredEvents - Total events:', events.length);
    console.log('CalendarProvider getFilteredEvents - Current filters:', filters);
    
    const filtered = events.filter(event => {
      // Filter by category
      if (filters.categories.length > 0 && !filters.categories.includes(event.category)) {
        return false;
      }

      // Filter by family members
      if (filters.familyMembers.length > 0) {
        const hasMatchingAttendee = event.attendees?.some(attendee =>
          filters.familyMembers.includes(attendee.familyMemberId)
        );
        if (!hasMatchingAttendee) return false;
      }

      // Filter declined events
      if (!filters.showDeclined && event.status === 'declined') {
        return false;
      }

      return true;
    });
    
    console.log('CalendarProvider getFilteredEvents - Filtered events:', filtered.length);
    return filtered;
  };

  // Get events for a specific date
  const getEventsForDate = (date) => {
    return getFilteredEvents().filter(event => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Get events for a month
  const getEventsForMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    return getFilteredEvents().filter(event => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getMonth() === month &&
        eventDate.getFullYear() === year
      );
    });
  };

  // Get events for a week
  const getEventsForWeek = (weekStart) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    return getFilteredEvents().filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= weekStart && eventDate < weekEnd;
    });
  };

  const value = {
    // State
    events: getFilteredEvents(),
    allEvents: events,
    loading,
    view,
    selectedDate,
    filters,
    familyMembers,
    
    // Actions
    setView,
    setSelectedDate,
    setFilters,
    createEvent,
    updateEvent,
    deleteEvent,
    checkConflicts,
    getFilteredEvents,
    getEventsForDate,
    getEventsForMonth,
    getEventsForWeek
  };
  
  // Debug logging
  console.log('CalendarProvider value:', {
    eventsCount: value.events.length,
    allEventsCount: value.allEvents.length,
    loading: value.loading,
    familyId: familyId
  });

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};