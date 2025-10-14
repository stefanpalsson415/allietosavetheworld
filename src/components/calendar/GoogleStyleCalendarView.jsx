// src/components/calendar/GoogleStyleCalendarView.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar, ChevronLeft, ChevronRight, Plus, Settings,
  Search, HelpCircle, X, Edit, Trash, MoreVertical, Users
} from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import renderEventCard from './renderEventCard';
import { renderEventsWithOverlapDetection } from '../../utils/overlappingEventsHelper';

/**
 * GoogleStyleCalendarView - A component that mimics the Google Calendar interface
 * with support for week, month, and day views
 */
const GoogleStyleCalendarView = ({
  events = [],
  selectedDate = new Date(),
  onDateSelect,
  onViewChange,
  onEventClick,
  onEventEdit,
  onEventDelete,
  onAddEvent,
  familyMembers = [],
  loading = false,
  embedded = false,
  onClose
}) => {
  // State variables
  const [view, setView] = useState('week'); // week, month, day, 4days
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventPopup, setShowEventPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [eventsCache, setEventsCache] = useState([...events]); // Add local cache of events
  const timeGridRef = useRef(null);
  
  // Helper to format date for display in header
  const formatHeaderDate = () => {
    const options = { month: 'long', year: 'numeric' };
    return currentDate.toLocaleDateString('en-US', options);
  };
  
  // Navigate to today
  const goToToday = () => {
    setCurrentDate(new Date());
    if (onDateSelect) {
      onDateSelect(new Date());
    }
  };
  
  // Navigate previous/next based on current view
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (view === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (view === '4days') {
      newDate.setDate(newDate.getDate() - 4);
    }
    setCurrentDate(newDate);
    if (onDateSelect) {
      onDateSelect(newDate);
    }
  };
  
  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (view === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (view === '4days') {
      newDate.setDate(newDate.getDate() + 4);
    }
    setCurrentDate(newDate);
    if (onDateSelect) {
      onDateSelect(newDate);
    }
  };
  
  // Change the current view
  const changeView = (newView) => {
    setView(newView);
    if (onViewChange) {
      onViewChange(newView);
    }
  };
  
  // Handle event click
  const handleEventClick = (event, e) => {
    // Prevent propagation so it doesn't trigger day click
    if (e) {
      e.stopPropagation();
    }
    
    // Get popup position
    let x = 0;
    let y = 0;
    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      const containerRect = document.getElementById('calendar-container').getBoundingClientRect();
      
      x = rect.left - containerRect.left + rect.width / 2;
      y = rect.top - containerRect.top;
      
      // Adjust if popup would go off screen
      if (x + 300 > containerRect.width) {
        x = Math.max(0, containerRect.width - 300);
      }
    }
    
    setPopupPosition({ x, y });
    setSelectedEvent(event);
    setShowEventPopup(true);
    
    if (onEventClick) {
      onEventClick(event);
    }
  };
  
  // Handle event edit
  const handleEditEvent = (e) => {
    e.stopPropagation();
    if (onEventEdit && selectedEvent) {
      onEventEdit(selectedEvent);
    }
    setShowEventPopup(false);
  };
  
  // Handle event delete
  const handleDeleteEvent = (e) => {
    e.stopPropagation();
    if (onEventDelete && selectedEvent) {
      onEventDelete(selectedEvent);
    }
    setShowEventPopup(false);
  };
  
  // Handle click on a day in the calendar
  const handleDayClick = (date) => {
    setCurrentDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  // Handle click on a time slot to create a new event
  const handleTimeSlotClick = (date, hour) => {
    if (onAddEvent) {
      // Create a new date object with the specified hour
      const eventDate = new Date(date);
      eventDate.setHours(hour);
      eventDate.setMinutes(0);
      eventDate.setSeconds(0);

      // Create an end date 1 hour later
      const endDate = new Date(eventDate);
      endDate.setHours(hour + 1);

      // Call the onAddEvent with the date
      if (onAddEvent) {
        onAddEvent(eventDate);
      }
    }
  };
  
  // Helper to get initials from name
  const getInitials = (name) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('');
  };
  
  // Helper to determine if a date is today
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };
  
  // Helper to determine if a date/time is in the past
  const isPast = (date) => {
    const now = new Date();
    if (date instanceof Date) {
      return date < now;
    }
    try {
      const eventDate = new Date(date);
      return !isNaN(eventDate.getTime()) && eventDate < now;
    } catch (e) {
      return false;
    }
  };
  
  // Helper to determine if a date is the selected date
  const isSelectedDate = (date) => {
    return date.getDate() === currentDate.getDate() &&
      date.getMonth() === currentDate.getMonth() &&
      date.getFullYear() === currentDate.getFullYear();
  };
  
  // Format time for display
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };
  
  // Get events for a specific date with improved date handling and event loop prevention
  const getEventsForDate = (date) => {
    // Force date normalization to prevent edge cases
    const targetDate = new Date(date);

    // Use the latest events from props or our local cache
    const eventsToFilter = eventsCache.length > 0 ? eventsCache : events;

    // CRITICAL FIX: Limit console logging that creates event loops
    // Use a static Map to track the frequency of logging for specific dates
    if (!window._calendarDebugLog) {
      window._calendarDebugLog = new Map();
    }

    // Use date string as key
    const targetDateString = targetDate.toDateString();
    const logKey = `filter-${targetDateString}`;
    const now = Date.now();
    const lastLog = window._calendarDebugLog.get(logKey) || 0;

    // Only log if we haven't logged for this date in the last 30 seconds
    if (now - lastLog > 30000) {
      console.log(`📅 Filtering events for date: ${targetDateString}, total events: ${eventsToFilter.length}`);
      window._calendarDebugLog.set(logKey, now);

      // Clean up old entries - keep only the most recent 20 entries
      if (window._calendarDebugLog.size > 20) {
        const entries = Array.from(window._calendarDebugLog.entries());
        entries.sort((a, b) => b[1] - a[1]); // Sort by timestamp descending

        // Keep only the 20 most recent entries
        const toKeep = entries.slice(0, 20);
        window._calendarDebugLog = new Map(toKeep);
      }
    }

    return eventsToFilter.filter(event => {
      let eventDate = null;

      // Try to get the event date from various properties
      try {
        // IMPROVED: Handle all possible date field formats comprehensively
        if (event.dateObj instanceof Date && !isNaN(event.dateObj.getTime())) {
          eventDate = event.dateObj;
        } else if (event.start?.dateTime) {
          eventDate = new Date(event.start.dateTime);
        } else if (typeof event.dateTime === 'string') {
          eventDate = new Date(event.dateTime);
        } else if (event.dateTime instanceof Date) {
          eventDate = event.dateTime;
        } else if (event.date) {
          eventDate = new Date(event.date);
        } else if (event.extraDetails?.savedDate) {
          // This is a backup field we added for improved persistence
          eventDate = new Date(event.extraDetails.savedDate);
        } else {
          // No valid date found - skip excessive logging to prevent console overload
          return false;
        }

        // Check for invalid dates
        if (isNaN(eventDate.getTime())) {
          // Skip logging invalid dates to prevent console spam
          return false;
        }

        // Compare dates using date strings to ignore time component
        const eventDateString = eventDate.toDateString();
        const isMatch = eventDateString === targetDateString;

        // Debug match info selectively with rate limiting
        if (isMatch) {
          const matchLogKey = `match-${event.id || event.universalId || event.firestoreId}-${targetDateString}`;
          const lastMatchLog = window._calendarDebugLog.get(matchLogKey) || 0;

          // Only log matches every 30 seconds per event to reduce console spam
          if (now - lastMatchLog > 30000) {
            console.log(`📅 Event "${event.title || 'Untitled'}" matches date ${targetDateString}`);
            window._calendarDebugLog.set(matchLogKey, now);
          }
        }

        return isMatch;
      } catch (error) {
        // Skip error logging to prevent console spam
        return false;
      }
    });
  };
  
  // Get the event color based on type
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
  
  // Get hours for day/week view
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  // Get 30-minute time slots for day/week view
  const timeSlots = hours.flatMap(hour => [
    `${hour}:00`,
    `${hour}:30`
  ]);
  
  // Get days of the week for week view
  const getDaysOfWeek = () => {
    const days = [];
    const firstDayOfWeek = new Date(currentDate);
    
    // Adjust to first day (Sunday) of the current week
    const day = currentDate.getDay();
    firstDayOfWeek.setDate(currentDate.getDate() - day);
    
    // Create array of 7 days starting from Sunday
    for (let i = 0; i < 7; i++) {
      const date = new Date(firstDayOfWeek);
      date.setDate(firstDayOfWeek.getDate() + i);
      days.push(date);
    }
    
    return days;
  };
  
  // Get days of the month for month view
  const getDaysOfMonth = () => {
    const days = [];
    
    // Create a date for the first day of the month
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    // Add days from previous month to fill the first week
    const lastDayOfPrevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    const daysInPrevMonth = lastDayOfPrevMonth.getDate();
    
    for (let i = 0; i < firstDayOfWeek; i++) {
      const day = daysInPrevMonth - firstDayOfWeek + i + 1;
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, day);
      days.push({ date, isPreviousMonth: true });
    }
    
    // Add all days of the current month
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Add days from next month to fill the last row
    const totalDaysSoFar = firstDayOfWeek + daysInMonth;
    const remainingDays = 7 - (totalDaysSoFar % 7);
    
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
        days.push({ date, isNextMonth: true });
      }
    }
    
    return days;
  };
  
  // Sort events by start time
  const sortEventsByStartTime = (events) => {
    return [...events].sort((a, b) => {
      const getTime = (event) => {
        if (event.dateObj instanceof Date) {
          return event.dateObj.getTime();
        } else if (event.start?.dateTime) {
          return new Date(event.start.dateTime).getTime();
        } else if (event.dateTime) {
          return new Date(event.dateTime).getTime();
        } else if (event.date) {
          return new Date(event.date).getTime();
        }
        return 0;
      };
      
      return getTime(a) - getTime(b);
    });
  };
  
  // Close event popup when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showEventPopup && !e.target.closest('.event-popup') && !e.target.closest('.calendar-event')) {
        setShowEventPopup(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEventPopup]);
  
  // Update our events cache when the events prop changes (only)
  useEffect(() => {
    console.log("📅 Updating eventsCache due to events change");
    setEventsCache(events);
  }, [events]);

  // Update current time and scroll to it
  useEffect(() => {
    const updateCurrentTime = () => {
      setCurrentTime(new Date());
    };
    
    // Update current time every minute
    updateCurrentTime();
    const intervalId = setInterval(updateCurrentTime, 60000);
    
    // Scroll to current time on initial render and when view changes
    const scrollToCurrentTime = () => {
      if (timeGridRef.current && (view === 'week' || view === 'day' || view === '4days')) {
        const now = new Date();
        const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
        const scrollPosition = (minutesSinceMidnight / 60) * 75;
        
        // Scroll to position the current time in the middle of the visible area
        const containerHeight = timeGridRef.current.clientHeight;
        timeGridRef.current.scrollTop = Math.max(0, scrollPosition - containerHeight / 2);
      }
    };
    
    // Initial scroll after render
    setTimeout(scrollToCurrentTime, 300);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [view]);

  // Keep the calendar in sync with the selected date from props
  useEffect(() => {
    // Update our internal date state when selectedDate from props changes
    setCurrentDate(new Date(selectedDate));
    
    // If there's an open popup, close it when date changes
    if (showEventPopup) {
      setShowEventPopup(false);
      setSelectedEvent(null);
    }
  }, [selectedDate, showEventPopup]);
  
  // Calculate position and height for events in week/day view
  const calculateEventPosition = (event, dayOfWeek) => {
    let eventDate;
    let eventEndDate;
    
    // Get event start time
    if (event.dateObj instanceof Date) {
      eventDate = event.dateObj;
    } else if (event.start?.dateTime) {
      eventDate = new Date(event.start.dateTime);
    } else if (event.dateTime) {
      eventDate = new Date(event.dateTime);
    } else if (event.date) {
      eventDate = new Date(event.date);
    } else {
      return { top: 0, height: 75 }; // Default position
    }
    
    // Get event end time
    if (event.dateEndObj instanceof Date) {
      eventEndDate = event.dateEndObj;
    } else if (event.end?.dateTime) {
      eventEndDate = new Date(event.end.dateTime);
    } else if (event.endDateTime) {
      eventEndDate = new Date(event.endDateTime);
    } else {
      // Default to 1 hour duration
      eventEndDate = new Date(eventDate);
      eventEndDate.setHours(eventDate.getHours() + 1);
    }
    
    // Calculate position based on time
    const minutesSinceMidnight = eventDate.getHours() * 60 + eventDate.getMinutes();
    const durationMinutes = (eventEndDate.getTime() - eventDate.getTime()) / (60 * 1000);
    
    // Each hour is 75px height
    const top = (minutesSinceMidnight / 60) * 75;
    const height = Math.max(40, (durationMinutes / 60) * 75); // Minimum height of 40px
    
    return { top, height };
  };
  
  // Render month view
  const renderMonthView = () => {
    const days = getDaysOfMonth();
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <div className="month-view">
        {/* Days of week header */}
        <div className="grid grid-cols-7 text-center font-medium text-sm text-indigo-700 border-b bg-indigo-50">
          {daysOfWeek.map(day => (
            <div key={day} className="py-3">{day}</div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 grid-rows-6 h-full">
          {days.map(({ date, isCurrentMonth, isPreviousMonth, isNextMonth }, index) => {
            const dateEvents = getEventsForDate(date);
            const maxDisplayEvents = 3; // Maximum events to display per day
            const hasMoreEvents = dateEvents.length > maxDisplayEvents;
            
            return (
              <div
                key={index}
                onClick={() => handleDayClick(date)}
                className={`h-20 border-b border-r p-1 cursor-pointer ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'
                } ${isToday(date) ? 'bg-blue-100' : ''} ${
                  isSelectedDate(date) ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50' : ''
                }`}
                data-testid="day-grid-cell"
                data-date={`${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`}
              >
                <div className="flex justify-between items-center mb-1 mt-1">
                  <span className={`text-sm font-medium ${
                    isToday(date) ? 'bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-md' : ''
                  }`}>
                    {date.getDate()}
                  </span>
                </div>
                
                <div className="overflow-hidden space-y-1">
                  {sortEventsByStartTime(dateEvents).slice(0, maxDisplayEvents).map((event, idx) => {
                    // Check if event is in the past
                    const eventDate = event.dateObj instanceof Date ?
                      event.dateObj :
                      (event.start?.dateTime ? new Date(event.start.dateTime) :
                       (typeof event.dateTime === 'string' ? new Date(event.dateTime) : null));

                    const isEventInPast = eventDate ? isPast(eventDate) : false;

                    return (
                      <div
                        key={`${event.id || event.firestoreId || idx}`}
                        onClick={(e) => handleEventClick(event, e)}
                        className={`calendar-event text-xs truncate px-1 rounded cursor-pointer ${getEventColor(event)} ${isEventInPast ? 'opacity-60' : ''}`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="truncate">{event.title || 'Untitled Event'}</div>
                          {event.attendees && event.attendees.length > 0 && (
                            <div className="flex -space-x-1 rtl:space-x-reverse overflow-hidden ml-1 flex-shrink-0">
                              {event.attendees.slice(0, 2).map((attendee, idx) => (
                                <UserAvatar
                                  key={attendee.id || idx}
                                  user={attendee}
                                  size={16}
                                  className="border-2 border-white shadow-sm"
                                />
                              ))}
                              {event.attendees.length > 2 && (
                                <div className="flex items-center justify-center w-[16px] h-[16px] text-[8px] font-medium text-white bg-indigo-500 rounded-full border-2 border-white shadow-sm">
                                  +{event.attendees.length - 2}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {hasMoreEvents && (
                    <div className="text-xs text-indigo-600 font-medium">
                      +{dateEvents.length - maxDisplayEvents} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Render week view
  const renderWeekView = () => {
    const daysOfWeek = getDaysOfWeek();
    
    return (
      <div className="week-view h-full overflow-hidden flex flex-col">
        {/* Sticky header row with days */}
        <div className="grid grid-cols-8 border-b sticky top-0 bg-white z-10 shadow-sm">
          {/* Empty cell for time column */}
          <div className="h-18 border-r bg-gradient-to-b from-indigo-50 to-white"></div>
          
          {/* Day headers */}
          {daysOfWeek.map((date, index) => {
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNumber = date.getDate();
            const isDateToday = isToday(date);
            
            return (
              <div 
                key={index}
                className={`h-18 border-r flex flex-col items-center justify-center ${
                  isDateToday ? 'bg-blue-100' : ''
                }`}
                onClick={() => handleDayClick(date)}
              >
                <div className="text-sm text-indigo-600 font-medium mb-1">{dayName}</div>
                <div className={`text-xl font-semibold ${
                  isDateToday ? 'bg-indigo-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-md' : ''
                }`}>
                  {dayNumber}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Scrollable time grid */}
        <div className="overflow-y-auto flex-1" ref={timeGridRef}>
          <div className="grid grid-cols-8" style={{ minHeight: '1800px' }}>
            {/* Time column - with larger font and no border lines */}
            <div className="border-r bg-gradient-to-b from-indigo-50 to-white">
              {/* Time labels */}
              {hours.map(hour => (
                <div key={hour} className="relative h-[75px]">
                  <span className="absolute -top-3 right-2 text-sm font-semibold text-indigo-700">
                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour-12} PM`}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Days columns */}
            {daysOfWeek.map((date, index) => {
              const dateEvents = getEventsForDate(date);
              const isDateToday = isToday(date);
              const isLastColumn = index === daysOfWeek.length - 1;
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              
              return (
                <div key={index} className={`relative ${!isLastColumn ? 'border-r' : ''} ${isWeekend ? 'bg-gray-50' : ''}`}>
                  {/* Time grid for this day */}
                  <div className="relative">
                    {hours.map(hour => (
                      <div 
                        key={hour} 
                        className={`h-[75px] border-b hover:bg-gray-100 cursor-pointer transition duration-150 ${hour >= 9 && hour <= 17 ? 'bg-blue-50/20' : ''}`}
                        onClick={() => handleTimeSlotClick(date, hour)}
                      ></div>
                    ))}
                    
                    {/* Current time indicator for today */}
                    {isDateToday && (
                      <div 
                        className="absolute left-0 right-0 z-10 pointer-events-none"
                        style={{ 
                          top: `${(currentTime.getHours() * 60 + currentTime.getMinutes()) / 60 * 75}px` 
                        }}
                      >
                        <div className="flex items-center">
                          <div className="bg-red-600 rounded-full w-3 h-3 ml-1 shadow-sm"></div>
                          <div className="bg-red-600 h-[2px] flex-grow"></div>
                        </div>
                      </div>
                    )}
                    
                    {/* Events for this day with overlap detection */}
                    {renderEventsWithOverlapDetection(
                      dateEvents,
                      calculateEventPosition,
                      formatTime,
                      isPast,
                      renderEventCard,
                      handleEventClick
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
  
  // Render day view
  const renderDayView = () => {
    const dateEvents = getEventsForDate(currentDate);
    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
    const dayNumber = currentDate.getDate();
    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long' });
    const isCurrentDateToday = isToday(currentDate);
    
    return (
      <div className="day-view h-full overflow-hidden flex flex-col">
        {/* Sticky header row with day */}
        <div className="grid grid-cols-2 border-b sticky top-0 bg-white z-10 shadow-sm">
          {/* Empty cell for time column */}
          <div className="h-18 border-r bg-gradient-to-b from-indigo-50 to-white"></div>
          
          {/* Day header */}
          <div className={`h-18 border-b flex flex-col items-center justify-center ${
            isCurrentDateToday ? 'bg-blue-100' : ''
          }`}>
            <div className="text-lg text-indigo-700">{dayName}</div>
            <div className={`text-2xl font-semibold mt-1 ${
              isCurrentDateToday ? 'bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-md' : ''
            }`}>
              {dayNumber}
            </div>
          </div>
        </div>
        
        {/* Scrollable time grid */}
        <div className="overflow-y-auto flex-1" ref={timeGridRef}>
          <div className="grid grid-cols-2" style={{ minHeight: '1800px' }}>
            {/* Time column - with larger font and no border lines */}
            <div className="border-r bg-gradient-to-b from-indigo-50 to-white">
              {/* Time labels */}
              {hours.map(hour => (
                <div key={hour} className="relative h-[75px]">
                  <span className="absolute -top-3 right-2 text-sm font-semibold text-indigo-700">
                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour-12} PM`}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Day column */}
            <div className="relative">
              {/* Time grid for this day */}
              <div className="relative">
                {hours.map(hour => (
                  <div 
                    key={hour} 
                    className={`h-[75px] border-b hover:bg-gray-100 cursor-pointer transition duration-150 ${hour >= 9 && hour <= 17 ? 'bg-blue-50/20' : ''}`}
                    onClick={() => handleTimeSlotClick(currentDate, hour)}
                  ></div>
                ))}
                
                {/* Current time indicator for today */}
                {isCurrentDateToday && (
                  <div 
                    className="absolute left-0 right-0 z-10 pointer-events-none"
                    style={{ 
                      top: `${(currentTime.getHours() * 60 + currentTime.getMinutes()) / 60 * 75}px` 
                    }}
                  >
                    <div className="flex items-center">
                      <div className="bg-red-600 rounded-full w-3 h-3 ml-1 shadow-sm"></div>
                      <div className="bg-red-600 h-[2px] flex-grow"></div>
                    </div>
                  </div>
                )}
                
                {/* Events for this day - with overlap detection */}
                {renderEventsWithOverlapDetection(
                  dateEvents,
                  calculateEventPosition,
                  formatTime,
                  isPast,
                  renderEventCard,
                  handleEventClick
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render 4-day view
  const render4DayView = () => {
    const days = [];
    for (let i = 0; i < 4; i++) {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() + i);
      days.push(date);
    }
    
    return (
      <div className="four-day-view h-full overflow-hidden flex flex-col">
        {/* Sticky header row with days */}
        <div className="grid grid-cols-5 border-b sticky top-0 bg-white z-10 shadow-sm">
          {/* Empty cell for time column */}
          <div className="h-18 border-r bg-gradient-to-b from-indigo-50 to-white"></div>
          
          {/* Day headers */}
          {days.map((date, index) => {
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNumber = date.getDate();
            const isDateToday = isToday(date);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            
            return (
              <div 
                key={index}
                className={`h-18 border-r flex flex-col items-center justify-center ${
                  isDateToday ? 'bg-blue-100' : ''
                } ${isWeekend ? 'bg-gray-50/50' : ''}`}
                onClick={() => handleDayClick(date)}
              >
                <div className="text-sm text-indigo-600 font-medium mb-1">{dayName}</div>
                <div className={`text-xl font-semibold ${
                  isDateToday ? 'bg-indigo-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-md' : ''
                }`}>
                  {dayNumber}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Scrollable time grid */}
        <div className="overflow-y-auto flex-1" ref={timeGridRef}>
          <div className="grid grid-cols-5" style={{ minHeight: '1800px' }}>
            {/* Time column - with larger font and no border lines */}
            <div className="border-r bg-gradient-to-b from-indigo-50 to-white">
              {/* Time labels */}
              {hours.map(hour => (
                <div key={hour} className="relative h-[75px]">
                  <span className="absolute -top-3 right-2 text-sm font-semibold text-indigo-700">
                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour-12} PM`}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Days columns */}
            {days.map((date, index) => {
              const dateEvents = getEventsForDate(date);
              const isDateToday = isToday(date);
              const isLastColumn = index === days.length - 1;
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              
              return (
                <div key={index} className={`relative ${!isLastColumn ? 'border-r' : ''} ${isWeekend ? 'bg-gray-50/50' : ''}`}>
                  {/* Time grid for this day */}
                  <div className="relative">
                    {hours.map(hour => (
                      <div 
                        key={hour} 
                        className={`h-[75px] border-b hover:bg-gray-100 cursor-pointer transition duration-150 ${hour >= 9 && hour <= 17 ? 'bg-blue-50/20' : ''}`}
                        onClick={() => handleTimeSlotClick(date, hour)}
                      ></div>
                    ))}
                    
                    {/* Current time indicator for today */}
                    {isDateToday && (
                      <div 
                        className="absolute left-0 right-0 z-10 pointer-events-none"
                        style={{ 
                          top: `${(currentTime.getHours() * 60 + currentTime.getMinutes()) / 60 * 75}px` 
                        }}
                      >
                        <div className="flex items-center">
                          <div className="bg-red-600 rounded-full w-3 h-3 ml-1 shadow-sm"></div>
                          <div className="bg-red-600 h-[2px] flex-grow"></div>
                        </div>
                      </div>
                    )}
                    
                    {/* Events for this day - with overlap detection */}
                    {renderEventsWithOverlapDetection(
                      dateEvents,
                      calculateEventPosition,
                      formatTime,
                      isPast,
                      renderEventCard,
                      handleEventClick
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow-xl flex flex-col h-full border border-gray-200 overflow-hidden" id="calendar-container" data-testid="calendar-container">
      {/* Calendar Header */}
      <div className="p-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {!embedded && (
            <button 
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-100"
            >
              <X size={16} />
            </button>
          )}
          <div className="text-xl font-medium flex items-center text-indigo-800">
            <Calendar size={20} className="mr-2 text-indigo-600" />
            <span>Calendar</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={goToToday}
            className="px-4 py-1 text-sm border border-indigo-300 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 shadow-sm transition-colors"
          >
            Today
          </button>
          
          <button
            onClick={goToPrevious}
            className="p-1 rounded-full bg-white border border-gray-200 hover:bg-gray-100 shadow-sm"
          >
            <ChevronLeft size={16} className="text-indigo-700" />
          </button>
          
          <button
            onClick={goToNext}
            className="p-1 rounded-full bg-white border border-gray-200 hover:bg-gray-100 shadow-sm"
          >
            <ChevronRight size={16} className="text-indigo-700" />
          </button>
          
          <h2 className="text-lg font-medium text-indigo-900">
            {formatHeaderDate()}
          </h2>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View options */}
          <div className="relative inline-block">
            <select
              value={view}
              onChange={(e) => changeView(e.target.value)}
              className="appearance-none bg-white border border-indigo-200 rounded-md px-4 py-1 text-sm pr-8 text-indigo-800 shadow-sm"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="4days">4 days</option>
            </select>
            <ChevronLeft size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 rotate-90 text-gray-400" />
          </div>
          
          <button className="p-1 rounded-full hover:bg-indigo-100 text-indigo-600">
            <Search size={16} />
          </button>
          
          <button className="p-1 rounded-full hover:bg-indigo-100 text-indigo-600">
            <Settings size={16} />
          </button>
        </div>
      </div>
      
      {/* Calendar Body */}
      <div className="flex-1 overflow-hidden relative">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="h-full">
            {view === 'month' && renderMonthView()}
            {view === 'week' && renderWeekView()}
            {view === 'day' && renderDayView()}
            {view === '4days' && render4DayView()}
          </div>
        )}
      </div>
      
      {/* Add Event Button */}
      <div className="absolute bottom-4 right-4">
        <button
          onClick={() => onAddEvent && onAddEvent(new Date(currentDate))}
          className="bg-indigo-600 text-white rounded-full p-3 shadow-lg hover:bg-indigo-700 transition-colors border-2 border-white"
        >
          <Plus size={20} />
        </button>
      </div>
      
      {/* Event Popup */}
      {showEventPopup && selectedEvent && (
        <div 
          className="event-popup absolute bg-white rounded-lg shadow-xl z-50 w-72 border border-indigo-100 overflow-hidden"
          style={{ 
            top: `${popupPosition.y}px`, 
            left: `${popupPosition.x}px`,
            transform: 'translate(-50%, -100%)' 
          }}
          data-testid="event-popup"
        >
          <div className="p-3 border-b bg-gradient-to-r from-indigo-50 to-white">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-indigo-900">{selectedEvent.title || 'Untitled Event'}</h3>
              <button 
                onClick={() => setShowEventPopup(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="mt-2 text-sm text-gray-600">
              {selectedEvent.dateObj && (
                <div>
                  {new Date(selectedEvent.dateObj).toLocaleString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                  {selectedEvent.dateEndObj && (
                    <span> - {new Date(selectedEvent.dateEndObj).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}</span>
                  )}
                </div>
              )}
            </div>
            
            {selectedEvent.location && (
              <div className="mt-1 text-sm text-gray-600">
                <div className="flex items-center">
                  <div className="mr-2">📍</div>
                  <div>{selectedEvent.location}</div>
                </div>
              </div>
            )}

            {/* Event Attendees */}
            {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center mb-1">
                  <Users size={14} className="text-indigo-600 mr-1" />
                  <span className="text-xs font-medium text-indigo-700">Attendees</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedEvent.attendees.map((attendee, idx) => (
                    <UserAvatar
                      key={attendee.id || idx}
                      user={attendee}
                      size={36}
                      className="border-2 border-white shadow-sm"
                    />
                  ))}
                </div>
              </div>
            )}

            {selectedEvent.description && (
              <div className="mt-2 text-sm text-gray-600">
                {selectedEvent.description}
              </div>
            )}
          </div>
          
          <div className="flex justify-end p-2 bg-gray-50">
            <button
              onClick={handleEditEvent}
              className="text-indigo-600 hover:bg-indigo-50 p-1 rounded mr-2"
              data-testid="edit-event-button"
            >
              <Edit size={18} />
            </button>
            
            <button
              onClick={handleDeleteEvent}
              className="text-red-500 hover:bg-red-50 p-1 rounded"
              data-testid="delete-event-button"
            >
              <Trash size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleStyleCalendarView;