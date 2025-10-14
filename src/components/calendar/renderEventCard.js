// src/components/calendar/renderEventCard.js
import React from 'react';
import UserAvatar from '../common/UserAvatar';

/**
 * Renders an event card for the calendar with support for handling overlapping events
 * 
 * @param {Object} event - The event to render
 * @param {number} top - The top position in pixels
 * @param {number} height - The height in pixels
 * @param {string} eventTime - The formatted event time
 * @param {boolean} isEventInPast - Whether the event is in the past
 * @param {Function} handleEventClick - Click handler for the event
 * @param {number} columnIndex - Optional index for handling overlapping events (0 or 1)
 * @param {number} totalColumns - Optional total number of columns for overlapping events (1 or 2)
 */
const renderEventCard = (
  event, 
  top, 
  height, 
  eventTime, 
  isEventInPast, 
  handleEventClick,
  columnIndex = 0,
  totalColumns = 1
) => {
  const getEventColor = (event) => {
    switch (event.eventType || event.category) {
      case 'appointment':
        return 'bg-red-200 border-red-300 text-red-900 shadow-sm';
      case 'activity':
        return 'bg-emerald-200 border-emerald-300 text-emerald-900 shadow-sm';
      case 'birthday':
        return 'bg-purple-200 border-purple-300 text-purple-900 shadow-sm';
      case 'meeting':
        return 'bg-amber-200 border-amber-300 text-amber-900 shadow-sm';
      case 'date-night':
        return 'bg-pink-200 border-pink-300 text-pink-900 shadow-sm';
      case 'task':
        return 'bg-blue-200 border-blue-300 text-blue-900 shadow-sm';
      default:
        return 'bg-indigo-100 border-indigo-200 text-indigo-800 shadow-sm';
    }
  };

  // Determine position and width based on whether this event overlaps with others
  const leftPosition = totalColumns > 1 ? `${columnIndex * (100 / totalColumns)}%` : '0';
  const width = totalColumns > 1 ? `${100 / totalColumns}%` : '100%';
  
  // Add a small offset when events overlap to create a staggered visual effect
  const topOffset = columnIndex > 0 ? 2 : 0;
  
  // Add stronger borders and shadows to make overlapping events more distinct
  const borderStyle = totalColumns > 1 ? 'border-2' : 'border';
  const shadowStyle = totalColumns > 1 ? 'shadow-md' : 'shadow-sm';
  
  return (
    <div
      key={`${event.id || event.firestoreId || event.idx}`}
      className={`calendar-event absolute p-1 rounded cursor-pointer overflow-hidden 
        ${getEventColor(event)} 
        ${isEventInPast ? 'opacity-60' : ''} 
        ${borderStyle} ${shadowStyle}`}
      style={{ 
        top: `${top + topOffset}px`, 
        height: `${height}px`,
        left: leftPosition,
        width: width,
        right: totalColumns > 1 ? 'auto' : '0',
        marginLeft: totalColumns > 1 ? '1px' : '4px',
        marginRight: totalColumns > 1 ? '1px' : '4px',
        zIndex: 1000 - columnIndex // Higher z-index for first column
      }}
      onClick={(e) => handleEventClick(event, e)}
    >
      <div className="text-xs font-semibold truncate">{event.title || 'Untitled Event'}</div>
      {height > 40 && (
        <div className="flex justify-between items-center">
          <div className="text-xs truncate">{eventTime}</div>
          {event.attendees && event.attendees.length > 0 && height > 55 && (
            <div className="flex -space-x-1 rtl:space-x-reverse overflow-hidden">
              {event.attendees.slice(0, 3).map((attendee, idx) => (
                <UserAvatar 
                  key={attendee.id || idx}
                  user={attendee}
                  size={totalColumns > 1 ? 20 : 24}
                  className="border-2 border-white shadow-sm"
                />
              ))}
              {event.attendees.length > 3 && (
                <div className="flex items-center justify-center w-[24px] h-[24px] text-[10px] font-medium text-white bg-indigo-500 rounded-full border-2 border-white shadow-sm">
                  +{event.attendees.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default renderEventCard;