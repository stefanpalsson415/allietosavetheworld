import React, { useState } from 'react';
import { Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';
import { useEvents } from '../../contexts/NewEventContext';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../../contexts/FamilyContext';
import UserAvatar from '../common/UserAvatar';
import EventDrawer from '../calendar/EventDrawer';

const NotionUpcomingEvents = () => {
  const navigate = useNavigate();
  const { events, loading, refreshEvents } = useEvents();
  const { familyMembers } = useFamily();

  // Event drawer state
  const [isEventDrawerOpen, setIsEventDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Force refresh on mount - always try to load events
  React.useEffect(() => {
    if (refreshEvents) {
      // Immediate refresh
      refreshEvents();

      // Also schedule a delayed refresh in case initial one doesn't work
      const timer = setTimeout(() => {
        refreshEvents();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []); // Run only once on mount

  // Get upcoming events (next 7 days)
  const getUpcomingEvents = () => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    console.log('📅 Filtering events between:', now, 'and', nextWeek);

    const upcomingEvents = events
      .filter(event => {
        // Try multiple date fields to ensure we catch all events
        const dateStr = event.dateTime || event.date || event.start?.dateTime || event.startTime;
        if (!dateStr) {
          console.log('📅 Event missing date:', event);
          return false;
        }

        const eventDate = new Date(dateStr);
        const isUpcoming = eventDate >= now && eventDate <= nextWeek;

        if (isUpcoming) {
          console.log('📅 Upcoming event found:', event.title || event.summary, eventDate);
        }

        return isUpcoming;
      })
      .sort((a, b) => {
        const dateA = new Date(a.dateTime || a.date || a.start?.dateTime || a.startTime);
        const dateB = new Date(b.dateTime || b.date || b.start?.dateTime || b.startTime);
        return dateA - dateB;
      })
      .slice(0, 5); // Show max 5 events

    console.log('📅 Found upcoming events:', upcomingEvents.length);
    return upcomingEvents;
  };
  
  const formatEventDate = (event) => {
    const date = new Date(event.dateTime || event.date || event.start?.dateTime);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if today
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`;
    }
    
    // Check if tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`;
    }
    
    // Other days
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  // Handle event click - open in event drawer for editing
  const handleEventClick = (event) => {
    // Pass the complete event object to ensure all data is preserved
    const fullEvent = {
      ...event,
      // Ensure we have all the fields including firestoreId for updates
      id: event.firestoreId || event.id,
      firestoreId: event.firestoreId,
      universalId: event.universalId || event.id,
      title: event.title || event.summary || '',
      description: event.description || '',
      location: event.location || '',
      startTime: event.dateTime || event.date || event.start?.dateTime,
      endTime: event.endDateTime || event.end?.dateTime || null,
      attendees: event.attendees || [],
      allDay: event.allDay || false,
      recurrence: event.recurrence || null,
      source: event.source || 'manual',
      color: event.color || event.colorId || '#3B82F6',
      reminders: event.reminders || [],
      createdAt: event.createdAt
    };

    setSelectedEvent(fullEvent);
    setIsEventDrawerOpen(true);
  };

  const handleEventUpdate = (updatedEvent) => {
    // Update local state
    setSelectedEvent(updatedEvent);

    // Refresh events from context
    if (refreshEvents) {
      refreshEvents();
    }
  };

  const handleEventDrawerClose = () => {
    setIsEventDrawerOpen(false);
    setSelectedEvent(null);
  };
  
  const upcomingEvents = getUpcomingEvents();
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Upcoming Events
          </h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Upcoming Events
          </h3>
          <button
            onClick={() => navigate('/dashboard?tab=notionCalendar')}
            className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            View all
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      
      {upcomingEvents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No events in the next 7 days</p>
          <button 
            onClick={() => navigate('/dashboard?tab=notionCalendar')}
            className="mt-2 text-sm text-purple-600 hover:text-purple-700"
          >
            Add an event
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingEvents.map((event) => (
            <div 
              key={event.id || event.universalId}
              className="p-3 rounded-lg border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all duration-200 cursor-pointer"
              onClick={() => handleEventClick(event)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">
                    {event.title || event.summary || 'Untitled Event'}
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-gray-600">
                      <Clock className="w-3 h-3" />
                      {formatEventDate(event)}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </span>
                    )}
                  </div>
                  {event.attendees && event.attendees.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <div className="flex -space-x-2">
                        {event.attendees.slice(0, 3).map((attendee, idx) => {
                          // Try to find the family member by email or name
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
                                size={24}
                                className="border-2 border-white"
                              />
                            </div>
                          );
                        })}
                      </div>
                      {event.attendees.length > 3 && (
                        <span className="text-xs text-gray-500 ml-1">
                          +{event.attendees.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="ml-2">
                  <div className={`w-2 h-2 rounded-full ${
                    event.category === 'medical' ? 'bg-red-500' :
                    event.category === 'school' ? 'bg-blue-500' :
                    event.category === 'activity' ? 'bg-green-500' :
                    'bg-purple-500'
                  }`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Event Drawer */}
      <EventDrawer
        isOpen={isEventDrawerOpen}
        onClose={handleEventDrawerClose}
        event={selectedEvent}
        onUpdate={handleEventUpdate}
      />
    </>
  );
};

export default NotionUpcomingEvents;