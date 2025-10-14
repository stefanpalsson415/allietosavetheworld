// src/components/calendar-v2/views/NotionWeekView.js

import React, { useState, useEffect, useRef } from 'react';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { useCalendar } from '../hooks/useCalendar';
import { useFamily } from '../../../contexts/FamilyContext';
import UserAvatar from '../../common/UserAvatar';

export function NotionWeekView({ selectedDate, onDateClick, onEventClick }) {
  const { getFilteredEvents } = useCalendar();
  const { familyMembers } = useFamily();
  const [currentTime, setCurrentTime] = useState(new Date());
  const scrollContainerRef = useRef(null);
  const events = getFilteredEvents();

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const currentHour = new Date().getHours();
      const scrollPosition = currentHour * 60 - 200; // 60px per hour, offset by 200px
      scrollContainerRef.current.scrollTop = Math.max(0, scrollPosition);
    }
  }, []);

  const weekStart = startOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Get events for a specific day and hour
  const getEventsForDayAndHour = (day, hour) => {
    return events.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      const hourStart = new Date(day);
      hourStart.setHours(hour, 0, 0, 0);
      const hourEnd = new Date(day);
      hourEnd.setHours(hour, 59, 59, 999);

      return isSameDay(eventStart, day) && 
             eventStart <= hourEnd && 
             eventEnd > hourStart;
    });
  };

  // Calculate current time position
  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    return (hours * 60) + (minutes * 60 / 60); // 60px per hour
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="notion-week-view">
      {/* Header */}
      <div className="week-header-notion">
        <div className="time-column-header"></div>
        {weekDays.map((day, index) => (
          <div 
            key={index} 
            className={`week-day-header-notion ${isToday(day) ? 'today' : ''}`}
            onClick={() => onDateClick(day)}
          >
            <div className="day-name">{format(day, 'EEE')}</div>
            <div className={`day-number ${isToday(day) ? 'today-number' : ''}`}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Scrollable time grid */}
      <div className="week-grid-container" ref={scrollContainerRef}>
        {/* Current time indicator */}
        {isToday(weekStart) || weekDays.some(day => isToday(day)) ? (
          <div 
            className="current-time-indicator"
            style={{ top: `${getCurrentTimePosition()}px` }}
          >
            <div className="time-indicator-dot"></div>
            <div className="time-indicator-line"></div>
          </div>
        ) : null}

        {/* Time grid */}
        <div className="week-time-grid">
          {hours.map(hour => (
            <div key={hour} className="hour-row">
              <div className="hour-label-notion">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
              <div className="hour-cells">
                {weekDays.map((day, dayIndex) => {
                  const dayEvents = getEventsForDayAndHour(day, hour);
                  
                  return (
                    <div 
                      key={dayIndex} 
                      className={`hour-cell ${isToday(day) ? 'today-column' : ''}`}
                      onClick={() => {
                        const clickedDate = new Date(day);
                        clickedDate.setHours(hour);
                        onDateClick(clickedDate);
                      }}
                    >
                      {dayEvents.map((event, eventIndex) => {
                        const eventStart = new Date(event.startTime);
                        const eventEnd = new Date(event.endTime);
                        const startMinutes = eventStart.getHours() === hour ? eventStart.getMinutes() : 0;
                        const duration = Math.min(
                          60 - startMinutes,
                          (eventEnd - eventStart) / (1000 * 60)
                        );
                        
                        return (
                          <div
                            key={event.id}
                            className="event-block-notion"
                            style={{
                              top: `${startMinutes}px`,
                              height: `${Math.max(20, duration)}px`,
                              backgroundColor: getCategoryColor(event.category),
                              zIndex: eventIndex + 1
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventClick(event);
                            }}
                          >
                            <div className="event-time">
                              {format(eventStart, 'h:mm a')}
                            </div>
                            <div className="event-title">{event.title}</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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