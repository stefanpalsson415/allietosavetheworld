// src/components/calendar-v2/views/NotionDayView.js

import React, { useState, useEffect, useRef } from 'react';
import { format, isSameDay, isToday } from 'date-fns';
import { useCalendar } from '../hooks/useCalendar';
import { useFamily } from '../../../contexts/FamilyContext';
import UserAvatar from '../../common/UserAvatar';

export function NotionDayView({ selectedDate, onEventClick, onDateClick }) {
  const { getEventsForDate } = useCalendar();
  const { familyMembers } = useFamily();
  const [currentTime, setCurrentTime] = useState(new Date());
  const scrollContainerRef = useRef(null);
  const events = getEventsForDate(selectedDate);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Scroll to current time on mount and when date changes
  useEffect(() => {
    if (scrollContainerRef.current && isToday(selectedDate)) {
      const currentHour = new Date().getHours();
      const currentMinutes = new Date().getMinutes();
      const scrollPosition = (currentHour * 100) + (currentMinutes * 100 / 60) - 300; // Center on screen
      scrollContainerRef.current.scrollTop = Math.max(0, scrollPosition);
    }
  }, [selectedDate]);

  // Calculate current time position
  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    return (hours * 100) + (minutes * 100 / 60); // 100px per hour
  };

  // Get events for a specific hour
  const getEventsForHour = (hour) => {
    return events.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      const hourStart = new Date(selectedDate);
      hourStart.setHours(hour, 0, 0, 0);
      const hourEnd = new Date(selectedDate);
      hourEnd.setHours(hour, 59, 59, 999);

      return isSameDay(eventStart, selectedDate) && 
             eventStart <= hourEnd && 
             eventEnd > hourStart;
    });
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="notion-day-view">
      {/* Header */}
      <div className="day-header-notion">
        <div className="day-header-content">
          <h2 className="day-title">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h2>
          {isToday(selectedDate) && (
            <span className="today-badge">Today</span>
          )}
        </div>
      </div>

      {/* Scrollable time grid */}
      <div className="day-grid-container" ref={scrollContainerRef}>
        {/* Current time indicator */}
        {isToday(selectedDate) && (
          <div 
            className="current-time-indicator"
            style={{ top: `${getCurrentTimePosition()}px` }}
          >
            <div className="time-indicator-label">
              {format(currentTime, 'h:mm a')}
            </div>
            <div className="time-indicator-line"></div>
          </div>
        )}

        {/* Time grid */}
        <div className="day-time-grid">
          {hours.map(hour => {
            const hourEvents = getEventsForHour(hour);
            
            return (
              <div key={hour} className="day-hour-row">
                <div className="hour-label-notion">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
                <div 
                  className="hour-content"
                  onDoubleClick={() => {
                    if (onDateClick) {
                      // Create a date object for this specific hour
                      const clickedDate = new Date(selectedDate);
                      clickedDate.setHours(hour, 0, 0, 0);
                      onDateClick(clickedDate);
                    }
                  }}
                >
                  <div className="hour-grid-line"></div>
                  {hourEvents.map((event, index) => {
                    const eventStart = new Date(event.startTime);
                    const eventEnd = new Date(event.endTime);
                    const startHour = eventStart.getHours();
                    const startMinutes = eventStart.getMinutes();
                    const endHour = eventEnd.getHours();
                    const endMinutes = eventEnd.getMinutes();
                    
                    // Calculate position and height (100px per hour)
                    const top = startHour === hour ? (startMinutes * 100 / 60) : 0;
                    const durationMinutes = ((endHour * 60 + endMinutes) - (startHour * 60 + startMinutes));
                    const height = Math.min(durationMinutes * 100 / 60, 100 - top);
                    
                    // Calculate left offset for overlapping events
                    const overlappingEvents = hourEvents.filter(e => {
                      const eStart = new Date(e.startTime);
                      const eEnd = new Date(e.endTime);
                      return (eStart < eventEnd && eEnd > eventStart);
                    });
                    const overlapIndex = overlappingEvents.indexOf(event);
                    const overlapCount = overlappingEvents.length;
                    const width = overlapCount > 1 ? `${90 / overlapCount}%` : '90%';
                    const left = overlapCount > 1 ? `${5 + (overlapIndex * (90 / overlapCount))}%` : '5%';
                    
                    return (
                      <div
                        key={event.id}
                        className="event-block-day"
                        style={{
                          top: `${top}px`,
                          height: `${Math.max(20, height)}px`,
                          backgroundColor: getCategoryColor(event.category),
                          left: left,
                          width: width,
                          zIndex: index + 1
                        }}
                        onClick={() => onEventClick(event)}
                      >
                        <div className="event-time">
                          {format(eventStart, 'h:mm a')}
                        </div>
                        <div className="event-title">{event.title}</div>
                        {event.location && (
                          <div className="event-location">{event.location}</div>
                        )}
                        {/* Show attendees avatars */}
                        {event.attendees && event.attendees.length > 0 && (
                          <div className="event-attendees-avatars">
                            {event.attendees.slice(0, 3).map((attendeeId, idx) => {
                              const attendee = familyMembers.find(m => m.id === attendeeId);
                              return attendee ? (
                                <UserAvatar 
                                  key={idx}
                                  user={attendee} 
                                  size={20} 
                                  className="event-attendee-avatar"
                                />
                              ) : null;
                            })}
                            {event.attendees.length > 3 && (
                              <span className="event-attendees-more">+{event.attendees.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getCategoryColor(category) {
  const colors = {
    personal: '#E3F2FD',
    work: '#F3E5F5',
    medical: '#FFEBEE',
    school: '#E8F5E9',
    activity: '#FFF3E0'
  };
  return colors[category] || '#F5F5F5';
}