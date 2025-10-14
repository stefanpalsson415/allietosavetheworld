import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin } from 'lucide-react';
import { useEvents } from '../../contexts/NewEventContext';
import { useFamily } from '../../contexts/FamilyContext';
import UserAvatar from '../common/UserAvatar';
import EventDrawer from '../calendar/EventDrawer';

const WeeklyTimelineView = () => {
  const { events, loading } = useEvents();
  const { familyMembers } = useFamily();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day; // Sunday
    return new Date(today.setDate(diff));
  });

  // Debug logging
  console.log('WeeklyTimelineView - events:', events?.length, 'loading:', loading);
  if (events?.length > 0) {
    console.log('Sample event:', events[0]);
  }

  // Event drawer state
  const [isEventDrawerOpen, setIsEventDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Get the 7 days of the current week
  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      days.push(date);
    }
    return days;
  };

  // Get events for a specific day
  const getEventsForDay = (date) => {
    // Use local date comparison to avoid timezone issues
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    console.log('getEventsForDay - Looking for:', dateStr, 'Total events:', events?.length);

    const filtered = events.filter(event => {
      // Handle Firestore Timestamp (startTime) or string dates (startDate)
      let eventDate;
      if (event.startTime?.toDate) {
        // Firestore Timestamp from synced events
        eventDate = event.startTime.toDate();
      } else if (event.startTime) {
        // Already a Date or string
        eventDate = new Date(event.startTime);
      } else {
        // Fallback to old field names
        eventDate = new Date(event.dateTime || event.date || event.start?.dateTime || event.startDate);
      }

      // Use local date for comparison (not UTC)
      const eventDateStr = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
      const matches = eventDateStr === dateStr;
      if (matches) {
        console.log('  Found match:', event.title, 'on', eventDateStr);
      }
      return matches;
    }).sort((a, b) => {
      const getTime = (evt) => {
        if (evt.startTime?.toDate) return evt.startTime.toDate();
        if (evt.startTime) return new Date(evt.startTime);
        return new Date(evt.dateTime || evt.date || evt.start?.dateTime || evt.startDate);
      };
      return getTime(a) - getTime(b);
    });

    console.log('getEventsForDay - Found', filtered.length, 'events for', dateStr);
    return filtered;
  };

  const handlePreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const handleThisWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    setCurrentWeekStart(new Date(today.setDate(diff)));
  };

  const handleEventClick = (event) => {
    // Extract reminders array from Google Calendar format
    let reminders = [];
    if (Array.isArray(event.reminders)) {
      reminders = event.reminders;
    } else if (event.reminders?.overrides && Array.isArray(event.reminders.overrides)) {
      reminders = event.reminders.overrides;
    }

    const fullEvent = {
      ...event,
      id: event.firestoreId || event.id,
      firestoreId: event.firestoreId,
      universalId: event.universalId || event.id,
      title: event.title || event.summary || '',
      description: event.description || '',
      location: event.location || '',
      // Preserve existing startTime/endTime, fallback to old fields
      startTime: event.startTime || event.dateTime || event.date || event.start?.dateTime,
      endTime: event.endTime || event.endDateTime || event.end?.dateTime || null,
      attendees: event.attendees || [],
      allDay: event.allDay || false,
      recurrence: event.recurrence || null,
      source: event.source || 'manual',
      color: event.color || event.colorId || '#3B82F6',
      reminders: reminders,
      createdAt: event.createdAt
    };

    setSelectedEvent(fullEvent);
    setIsEventDrawerOpen(true);
  };

  const formatTime = (event) => {
    // Handle Firestore Timestamp (startTime) or string dates
    let date;
    if (event.startTime?.toDate) {
      date = event.startTime.toDate();
    } else if (event.startTime) {
      date = new Date(event.startTime);
    } else {
      date = new Date(event.dateTime || event.date || event.start?.dateTime || event.startDate);
    }
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const weekDays = getWeekDays();
  const weekRange = `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-7 gap-2">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              This Week
            </h3>
            <p className="text-sm text-gray-500 mt-1">{weekRange}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleThisWeek}
              className="px-3 py-1.5 text-sm bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNextWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Next week"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Weekly Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weekDays.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isTodayDate = isToday(day);

            return (
              <div
                key={index}
                className={`
                  rounded-lg border transition-all duration-200
                  ${isTodayDate ? 'bg-purple-50 border-purple-300 shadow-sm' : 'bg-gray-50 border-gray-200'}
                  hover:shadow-md
                `}
              >
                {/* Day Header */}
                <div className={`
                  p-2 text-center border-b
                  ${isTodayDate ? 'border-purple-200 bg-purple-100' : 'border-gray-200'}
                `}>
                  <div className="text-xs font-medium text-gray-600">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={`
                    text-lg font-bold
                    ${isTodayDate ? 'text-purple-600' : 'text-gray-900'}
                  `}>
                    {day.getDate()}
                  </div>
                </div>

                {/* Events */}
                <div className="p-1.5 space-y-1 min-h-[120px] max-h-[200px] overflow-y-auto">
                  {dayEvents.length === 0 ? (
                    <div className="text-xs text-gray-400 text-center py-4">
                      No events
                    </div>
                  ) : (
                    dayEvents.slice(0, 5).map((event) => (
                      <button
                        key={event.id || event.universalId}
                        onClick={() => handleEventClick(event)}
                        className="w-full text-left p-1.5 rounded bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-all duration-150 group"
                      >
                        <div className="flex items-start gap-1">
                          <div className={`w-1 h-1 rounded-full mt-1 flex-shrink-0 ${
                            event.category === 'medical' ? 'bg-red-500' :
                            event.category === 'school' ? 'bg-blue-500' :
                            event.category === 'activity' ? 'bg-green-500' :
                            'bg-purple-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-900 truncate group-hover:text-blue-600">
                              {event.title || event.summary || 'Untitled'}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock className="w-2.5 h-2.5 text-gray-400" />
                              <span className="text-[10px] text-gray-500">
                                {formatTime(event)}
                              </span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <MapPin className="w-2.5 h-2.5 text-gray-400" />
                                <span className="text-[10px] text-gray-500 truncate">
                                  {event.location}
                                </span>
                              </div>
                            )}
                            {event.attendees && event.attendees.length > 0 && (
                              <div className="flex -space-x-1 mt-1">
                                {event.attendees.slice(0, 3).map((attendee, idx) => {
                                  const familyMember = familyMembers?.find(member =>
                                    member.email === attendee.email ||
                                    member.name === attendee.name
                                  );
                                  return (
                                    <div key={idx} className="relative">
                                      <UserAvatar
                                        user={familyMember || {
                                          name: attendee.name || attendee.email,
                                          email: attendee.email
                                        }}
                                        size={16}
                                        className="border border-white"
                                      />
                                    </div>
                                  );
                                })}
                                {event.attendees.length > 3 && (
                                  <div className="w-4 h-4 rounded-full bg-gray-200 border border-white flex items-center justify-center">
                                    <span className="text-[8px] text-gray-600">
                                      +{event.attendees.length - 3}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                  {dayEvents.length > 5 && (
                    <div className="text-[10px] text-gray-500 text-center py-1">
                      +{dayEvents.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Drawer */}
      <EventDrawer
        isOpen={isEventDrawerOpen}
        onClose={() => setIsEventDrawerOpen(false)}
        event={selectedEvent}
        onUpdate={(updatedEvent) => {
          setSelectedEvent(updatedEvent);
        }}
      />
    </>
  );
};

export default WeeklyTimelineView;
