// Helper to safely trigger calendar refresh without causing loops
export const triggerCalendarRefresh = (() => {
  let lastRefreshTime = 0;
  const MIN_REFRESH_INTERVAL = 2000; // 2 seconds minimum between refreshes
  
  return (source = 'manual') => {
    const now = Date.now();
    
    if (now - lastRefreshTime < MIN_REFRESH_INTERVAL) {
      console.log(`Calendar refresh throttled from ${source}`);
      return false;
    }
    
    lastRefreshTime = now;
    
    // Dispatch the refresh event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('force-calendar-refresh', {
        detail: {
          source,
          timestamp: now,
          throttled: false
        }
      }));
      
      console.log(`Calendar refresh triggered from ${source}`);
      return true;
    }
    
    return false;
  };
})();

// Helper to notify about family meeting updates
export const notifyFamilyMeetingUpdate = (meetingData) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('family-meeting-updated', {
      detail: {
        date: meetingData.date,
        title: meetingData.title,
        eventId: meetingData.eventId,
        timestamp: Date.now()
      }
    }));
  }
};