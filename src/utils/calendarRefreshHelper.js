// src/utils/calendarRefreshHelper.js
// Helper to ensure calendar refreshes properly after chat events

/**
 * Force a calendar refresh after a delay
 * Used when Allie creates calendar events
 */
export const forceCalendarRefresh = (delay = 2000) => {
  setTimeout(() => {
    console.log('🔄 Forcing calendar refresh...');
    
    // Dispatch refresh event
    window.dispatchEvent(new CustomEvent('force-calendar-refresh', {
      detail: { 
        source: 'calendar-refresh-helper',
        timestamp: Date.now()
      }
    }));
    
    // If on calendar tab, also trigger component-specific refresh
    if (window.location.href.includes('tab=calendar')) {
      // Dispatch calendar-specific refresh
      window.dispatchEvent(new CustomEvent('refresh-calendar-view', {
        detail: { source: 'calendar-refresh-helper' }
      }));
    }
    
    // If on tasks tab, refresh cycle progress
    if (window.location.href.includes('tab=tasks')) {
      window.dispatchEvent(new CustomEvent('reload-cycle-progress', {
        detail: { source: 'calendar-refresh-helper' }
      }));
    }
  }, delay);
};

/**
 * Listen for chat-created calendar events and force refresh
 */
export const setupCalendarRefreshListener = () => {
  window.addEventListener('calendar-event-created', (event) => {
    if (event.detail?.source === 'chat') {
      console.log('📅 Chat created calendar event, scheduling refresh...');
      forceCalendarRefresh(3000); // Wait 3 seconds for event to save
    }
  });
  
  window.addEventListener('family-meeting-date-updated', (event) => {
    console.log('📅 Family meeting date updated, scheduling refresh...');
    forceCalendarRefresh(2000); // Wait 2 seconds
  });
};