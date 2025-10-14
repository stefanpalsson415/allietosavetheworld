// src/components/calendar-v2/views/UpcomingMeetings.js

import React from 'react';
import { format, isToday, isTomorrow, differenceInMinutes } from 'date-fns';
import { Clock, MapPin, Users, Video } from 'lucide-react';
import { useCalendar } from '../hooks/useCalendar';

export function UpcomingMeetings({ limit = 5, onEventClick }) {
  const calendarContext = useCalendar();
  
  if (!calendarContext) {
    console.error('UpcomingMeetings: No calendar context available');
    return (
      <div className="upcoming-meetings">
        <h3 className="upcoming-title">Upcoming</h3>
        <p className="no-meetings">Calendar context not available</p>
      </div>
    );
  }
  
  const { getFilteredEvents } = calendarContext;
  const events = getFilteredEvents ? getFilteredEvents() : [];
  const now = new Date();

  console.log('UpcomingMeetings - Total events:', events.length);
  console.log('UpcomingMeetings - Current time:', now.toISOString());
  
  // Get upcoming events
  const upcomingEvents = events
    .filter(event => {
      const eventTime = new Date(event.startTime);
      const isUpcoming = eventTime > now;
      console.log(`Event "${event.title}" at ${eventTime.toISOString()} is upcoming:`, isUpcoming);
      return isUpcoming;
    })
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .slice(0, limit);
  
  console.log('UpcomingMeetings - Upcoming events:', upcomingEvents.length);

  const getTimeUntil = (eventTime) => {
    const minutes = differenceInMinutes(new Date(eventTime), now);
    
    if (minutes < 60) {
      return `in ${minutes} min`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      return `in ${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `in ${days} day${days > 1 ? 's' : ''}`;
    }
  };

  const getDateLabel = (date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
  };

  if (upcomingEvents.length === 0) {
    return (
      <div className="upcoming-meetings">
        <h3 className="upcoming-title">Upcoming</h3>
        <p className="no-meetings">No upcoming events</p>
      </div>
    );
  }

  return (
    <div className="upcoming-meetings">
      <h3 className="upcoming-title">Upcoming in {getTimeUntil(upcomingEvents[0].startTime)}</h3>
      
      <div className="upcoming-list">
        {upcomingEvents.map((event) => {
          const eventDate = new Date(event.startTime);
          const isVirtual = event.location?.toLowerCase().includes('zoom') || 
                           event.location?.toLowerCase().includes('meet') ||
                           event.location?.toLowerCase().includes('teams');

          return (
            <div 
              key={event.id} 
              className="upcoming-event"
              onClick={() => onEventClick(event)}
            >
              <div className="upcoming-event-header">
                <div className="upcoming-event-title">{event.title}</div>
                <div className="upcoming-event-time">
                  {format(eventDate, 'h:mm a')}
                </div>
              </div>
              
              <div className="upcoming-event-details">
                <div className="upcoming-event-date">
                  <Clock size={14} />
                  {getDateLabel(eventDate)} • {getTimeUntil(event.startTime)}
                </div>
                
                {event.location && (
                  <div className="upcoming-event-location">
                    {isVirtual ? <Video size={14} /> : <MapPin size={14} />}
                    {event.location}
                  </div>
                )}
                
                {event.attendees && event.attendees.length > 0 && (
                  <div className="upcoming-event-attendees">
                    <Users size={14} />
                    {event.attendees.length} attendee{event.attendees.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {differenceInMinutes(eventDate, now) <= 15 && (
                <button className="join-button">
                  Join meeting
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}