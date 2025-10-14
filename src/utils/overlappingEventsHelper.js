// src/utils/overlappingEventsHelper.js

/**
 * Helper function to handle rendering of overlapping events in calendar views
 * 
 * @param {Array} dateEvents - Array of events for the current date
 * @param {Function} calculateEventPosition - Function to calculate event position
 * @param {Function} formatTime - Function to format event time
 * @param {Function} isPast - Function to check if event is in the past
 * @param {Function} renderEventCard - Function to render the event card
 * @param {Function} handleEventClick - Function to handle event click
 * @returns {Array} - Array of rendered event components
 */
export const renderEventsWithOverlapDetection = (
  dateEvents, 
  calculateEventPosition,
  formatTime,
  isPast, 
  renderEventCard,
  handleEventClick
) => {
  // Group events by time slot to detect overlaps
  const eventsByTimeSlot = {};
  const renderedEvents = [];
  
  // First, calculate positions and organize events by time slot
  dateEvents.forEach((event, idx) => {
    const { top, height } = calculateEventPosition(event);
    const eventTime = event.dateObj instanceof Date ?
      formatTime(event.dateObj) :
      (event.start?.dateTime ? formatTime(new Date(event.start.dateTime)) : '');
    
    // Check if event is in the past
    const eventDate = event.dateObj instanceof Date ?
      event.dateObj :
      (event.start?.dateTime ? new Date(event.start.dateTime) :
        (typeof event.dateTime === 'string' ? new Date(event.dateTime) : null));
    
    const isEventInPast = eventDate ? isPast(eventDate) : false;
    
    // Store event with its calculated position
    const eventWithPosition = {
      event: {...event, idx},
      top,
      height,
      eventTime,
      isEventInPast,
      bottom: top + height // Pre-calculate bottom for overlap detection
    };
    
    // Create a key for each 15-minute time slot this event occupies
    const startSlot = Math.floor(top / 15);
    const endSlot = Math.ceil((top + height) / 15);
    
    for (let slot = startSlot; slot <= endSlot; slot++) {
      if (!eventsByTimeSlot[slot]) {
        eventsByTimeSlot[slot] = [];
      }
      eventsByTimeSlot[slot].push(eventWithPosition);
    }
  });
  
  // Process all time slots to find overlapping events
  const processedEvents = new Set();
  
  Object.values(eventsByTimeSlot).forEach(slotEvents => {
    slotEvents.forEach(eventData => {
      // Skip if we've already processed this event
      if (processedEvents.has(eventData.event.id || eventData.event.idx)) {
        return;
      }
      
      // Find all events that overlap with this one
      const overlappingEvents = [];
      
      Object.values(eventsByTimeSlot).forEach(events => {
        events.forEach(otherEvent => {
          // Skip same event
          if ((otherEvent.event.id || otherEvent.event.idx) === 
              (eventData.event.id || eventData.event.idx)) {
            return;
          }
          
          // Check if events overlap in time
          if ((otherEvent.top < eventData.bottom && otherEvent.bottom > eventData.top) ||
              (otherEvent.top === eventData.top && otherEvent.bottom === eventData.bottom)) {
            overlappingEvents.push(otherEvent);
          }
        });
      });
      
      // If this event overlaps with others, render them in columns
      if (overlappingEvents.length > 0) {
        // Sort by start time to ensure deterministic layout
        const allOverlappingEvents = [eventData, ...overlappingEvents]
          .sort((a, b) => a.top - b.top || a.event.title.localeCompare(b.event.title));
        
        // Mark all these events as processed
        allOverlappingEvents.forEach(e => {
          processedEvents.add(e.event.id || e.event.idx);
        });
        
        // Render events in columns (max 2 columns for simplicity)
        allOverlappingEvents.slice(0, 2).forEach((e, columnIndex) => {
          renderedEvents.push(
            renderEventCard(
              e.event,
              e.top,
              e.height,
              e.eventTime,
              e.isEventInPast,
              handleEventClick,
              columnIndex,
              2 // Total columns (showing in a split view)
            )
          );
        });
      } else if (!processedEvents.has(eventData.event.id || eventData.event.idx)) {
        // Mark this event as processed
        processedEvents.add(eventData.event.id || eventData.event.idx);
        
        // Render standalone event (no overlaps)
        renderedEvents.push(
          renderEventCard(
            eventData.event,
            eventData.top,
            eventData.height,
            eventData.eventTime,
            eventData.isEventInPast,
            handleEventClick
          )
        );
      }
    });
  });
  
  return renderedEvents;
};

export default renderEventsWithOverlapDetection;