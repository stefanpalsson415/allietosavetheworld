// src/contexts/EventContext.js
import React, { createContext, useContext, useEffect } from 'react';
import { useEvents as useEventsHook } from '../hooks/useEvent';
import { useFamily } from './FamilyContext';

// Create context
const EventContext = createContext();

// Custom hook to use the context
export function useEvents() {
  return useContext(EventContext);
}

// Provider component that makes Event data available
export function EventProvider({ children }) {
  // Get familyId from FamilyContext
  const { familyId } = useFamily();
  
  // Use our hook directly - PASS familyId!
  const eventHook = useEventsHook({ familyId });

  // CRITICAL FIX: Global event loop detection
  useEffect(() => {
    // Add anti-event-loop detection at the context level
    let refreshCounter = 0;
    let lastRefreshTime = 0;
    let refreshTimeout = null;

    const handleCalendarRefresh = (event) => {
      const now = Date.now();

      // Count refreshes in a 2 second window
      if (now - lastRefreshTime < 2000) {
        refreshCounter++;
      } else {
        refreshCounter = 1;
      }
      lastRefreshTime = now;

      // If too many refreshes, block further ones
      if (refreshCounter > 5) {
        console.warn("Too many calendar refreshes detected in a short period. Blocking further refreshes.");
        event.stopImmediatePropagation();

        // Reset counter after a cool-down period
        if (refreshTimeout) {
          clearTimeout(refreshTimeout);
        }

        refreshTimeout = setTimeout(() => {
          console.log("Resetting refresh counter after cooldown period");
          refreshCounter = 0;
        }, 5000);

        return;
      }
    };

    // Listen for calendar refresh events
    window.addEventListener('force-calendar-refresh', handleCalendarRefresh, true);

    return () => {
      window.removeEventListener('force-calendar-refresh', handleCalendarRefresh, true);
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, []);

  return (
    <EventContext.Provider value={eventHook}>
      {children}
    </EventContext.Provider>
  );
}