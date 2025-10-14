// src/components/calendar/NewFloatingCalendarWidget.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, PlusCircle, Filter, X, Check, 
  AlertCircle, Info, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useEvents } from '../../contexts/NewEventContext';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';

// Import sub-components
import SimpleCalendarGrid from './SimpleCalendarGrid';
import SimpleCalendarFilters from './SimpleCalendarFilters';
import SimpleEventList from './SimpleEventList';
import NewEnhancedEventManager from './NewEnhancedEventManager';

/**
 * NewFloatingCalendarWidget - A comprehensive floating calendar 
 * with filtering, event management, and detail views
 * 
 * @param {Object} props Component props
 * @param {string} props.initialSelectedMember Initial selected member ID
 * @param {boolean} props.embedded Whether widget is embedded in another component
 * @returns {JSX.Element} Floating calendar widget
 */
const NewFloatingCalendarWidget = ({
  initialSelectedMember,
  embedded = false
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { familyMembers, familyId } = useFamily();
  
  // Get events from context
  const { 
    events, 
    loading, 
    error,
    addEvent, 
    updateEvent, 
    deleteEvent,
    refreshEvents,
    getEventsForDate,
    lastRefresh
  } = useEvents();
  
  // UI State
  const [isOpen, setIsOpen] = useState(embedded ? true : false);
  const [widgetHeight, setWidgetHeight] = useState(embedded ? 60 : 45);
  const [widgetWidth, setWidgetWidth] = useState(embedded ? 100 : 64);
  const [isDragging, setIsDragging] = useState(null);
  const [startDragPos, setStartDragPos] = useState({ x: 0, y: 0 });
  const [startDimensions, setStartDimensions] = useState({ width: 0, height: 0 });
  
  // Calendar/Event State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('all');
  const [selectedMember, setSelectedMember] = useState(initialSelectedMember || 'all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Event management state
  const [showEventManager, setShowEventManager] = useState(false);
  const [showAiInfo, setShowAiInfo] = useState(false);
  const [addedEvents, setAddedEvents] = useState({});
  const [showAddedMessage, setShowAddedMessage] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Refs
  const widgetRef = useRef(null);
  const dragHandleRef = useRef(null);
  const lastRefreshTimeRef = useRef(0);
  
  // Force refresh the calendar events
  const handleForceRefresh = async () => {
    const now = Date.now();
    
    // Debounce refreshes
    if (now - lastRefreshTimeRef.current < 1000) {
      console.log("Calendar refresh debounced - too soon after previous refresh");
      return;
    }
    
    lastRefreshTimeRef.current = now;
    setIsRefreshing(true);
    
    try {
      await refreshEvents();
    } catch (error) {
      console.error("Error refreshing events:", error);
    } finally {
      // Add slight delay before stopping refresh animation
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };
  
  // Drag to resize functionality
  useEffect(() => {
    if (!isDragging || !widgetRef.current) return;

    const handleMouseMove = (e) => {
      e.preventDefault();
      
      const deltaX = e.clientX - startDragPos.x;
      const deltaY = e.clientY - startDragPos.y;
      
      if (isDragging === 'width' || isDragging === 'both') {
        const newWidth = Math.max(40, startDimensions.width + deltaX / 16);
        setWidgetWidth(newWidth);
      }
      
      if (isDragging === 'height' || isDragging === 'both') {
        const newHeight = Math.max(30, startDimensions.height + deltaY / 16);
        setWidgetHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startDragPos, startDimensions]);
  
  // Start drag operation
  const startDrag = (e, direction) => {
    e.preventDefault();
    setIsDragging(direction);
    setStartDragPos({ x: e.clientX, y: e.clientY });
    setStartDimensions({ width: widgetWidth, height: widgetHeight });
  };
  
  // Event handlers
  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };
  
  const handleViewChange = (newView) => {
    setView(newView);
  };
  
  const handleMemberChange = (memberId) => {
    setSelectedMember(memberId);
  };
  
  const handleResetFilters = () => {
    setView('all');
    setSelectedMember('all');
  };
  
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsEditingEvent(true);
  };
  
  const handleEventEdit = (event) => {
    setSelectedEvent(event);
    setIsEditingEvent(true);
  };
  
  const handleEventAdd = async (event) => {
    try {
      const result = await addEvent(event);
      
      if (result.success) {
        // Mark as added
        const eventKey = event.id || event.firestoreId || event.universalId;
        setAddedEvents(prev => ({
          ...prev,
          [eventKey]: true
        }));
        
        // Show "Added" message temporarily
        setShowAddedMessage(prev => ({
          ...prev,
          [eventKey]: true
        }));
        
        setTimeout(() => {
          setShowAddedMessage(prev => ({
            ...prev,
            [eventKey]: false
          }));
        }, 3000);
        
        // Refresh events
        handleForceRefresh();
      }
    } catch (error) {
      console.error("Error adding event:", error);
    }
  };
  
  const handleEventDelete = async (event) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        const eventId = event.firestoreId || event.id || event.universalId;
        const result = await deleteEvent(eventId);
        
        if (result.success) {
          // Close editing modal if open
          setIsEditingEvent(false);
          setSelectedEvent(null);
          
          // Refresh events
          handleForceRefresh();
        }
      } catch (error) {
        console.error("Error deleting event:", error);
      }
    }
  };
  
  // Filter events based on current view and selected member
  const filterEvents = (events) => {
    // Ensure events is an array
    if (!Array.isArray(events)) {
      console.warn("filterEvents received non-array:", events);
      return [];
    }
    
    // Apply filters if we have an array
    return events.filter(event => {
      // Skip undefined or null events
      if (!event) return false;
      
      // Apply view filter
      if (view !== 'all') {
        if (view === 'appointments' && event.eventType !== 'appointment') {
          return false;
        }
        if (view === 'activities' && event.eventType !== 'activity') {
          return false;
        }
        if (view === 'tasks' && event.eventType !== 'task') {
          return false;
        }
        if (view === 'meetings' && event.eventType !== 'meeting') {
          return false;
        }
        if (view === 'ai-parsed' && !event.extraDetails?.parsedWithAI) {
          return false;
        }
      }
      
      // Apply member filter
      if (selectedMember !== 'all') {
        // Check if member is an attendee
        const isAttendee = event.attendees?.some(a => {
          if (typeof a === 'string') return a === selectedMember;
          return a.id === selectedMember;
        });
        
        // Check if member is the child for the event
        const isChild = event.childId === selectedMember;
        
        // Check if member is explicitly mentioned
        const isMentioned = event.assignedTo === selectedMember || event.attendingParentId === selectedMember;
        
        if (!isAttendee && !isChild && !isMentioned) {
          return false;
        }
      }
      
      return true;
    });
  };
  
  // Enhanced debounce mechanism with useRef for more stable caching
  const selectedDateEventsRef = useRef({
    date: null,
    member: null,
    view: null,
    events: [],
    timestamp: 0,
    lastEventsUpdate: 0
  });
  
  // Get events for selected date with advanced debouncing to prevent flickering
  const eventsForSelectedDate = (() => {
    try {
      const now = Date.now();
      const CACHE_LIFETIME = 30000; // 30 seconds cache lifetime - increased to fix flickering
      
      // Check if we can use cached events
      const cachedRef = selectedDateEventsRef.current;
      
      // Only use cache if nothing relevant has changed
      if (cachedRef.date && 
          cachedRef.date.toDateString() === selectedDate.toDateString() &&
          cachedRef.member === selectedMember &&
          cachedRef.view === view &&
          cachedRef.lastEventsUpdate === lastRefresh &&
          now - cachedRef.timestamp < CACHE_LIFETIME &&
          Array.isArray(cachedRef.events)) {
        // Use cached events to prevent flickering
        return cachedRef.events;
      }
      
      // Get events for date and ensure we have an array
      const dateEvents = getEventsForDate(selectedDate) || [];
      
      // Apply our filter function to the array of events
      const filtered = filterEvents(dateEvents);
      
      // Give each event a stable ID if it doesn't have one already
      const eventsWithStableIds = filtered.map(event => {
        if (!event._stableId) {
          const stableId = event.id || 
                         event.firestoreId || 
                         event.universalId || 
                         `event-${event.title}-${event.childId || ''}-${(event.dateObj ? 
                           event.dateObj.toISOString().split('T')[0] : 
                           (event.dateTime ? new Date(event.dateTime).toISOString().split('T')[0] : ''))}`;
          
          return { ...event, _stableId: stableId };
        }
        return event;
      });
      
      // Update the cache with the new results and stable IDs
      selectedDateEventsRef.current = {
        date: selectedDate,
        member: selectedMember,
        view: view,
        events: eventsWithStableIds,
        timestamp: now,
        lastEventsUpdate: lastRefresh
      };
      
      return eventsWithStableIds;
    } catch (error) {
      console.error("Error getting events for selected date:", error);
      return selectedDateEventsRef.current?.events || [];
    }
  })();
  
  // Enhanced upcoming events cache with useRef for more stability
  const upcomingEventsRef = useRef({
    member: null,
    view: null,
    events: [],
    timestamp: 0,
    lastEventsUpdate: 0
  });
  
  // Get upcoming events (next 7 days) with advanced caching 
  const upcomingEvents = (() => {
    try {
      // Ensure events is an array before filtering
      if (!Array.isArray(events)) {
        console.warn("Events is not an array:", events);
        return [];
      }
      
      const now = Date.now();
      const CACHE_LIFETIME = 30000; // 30 seconds cache lifetime - increased to fix flickering
      
      // Check if we can use cached events
      const cachedRef = upcomingEventsRef.current;
      
      // Only use cache if nothing relevant has changed
      if (cachedRef.member === selectedMember &&
          cachedRef.view === view &&
          cachedRef.lastEventsUpdate === lastRefresh &&
          now - cachedRef.timestamp < CACHE_LIFETIME &&
          Array.isArray(cachedRef.events)) {
        // Use cached events to prevent flickering
        return cachedRef.events;
      }
      
      const today = new Date();
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
      
      // First filter by date range
      const dateFilteredEvents = events.filter(event => {
        if (!event || !event.dateObj) return false;
        
        try {
          // Normalize dates to midnight for proper comparison
          const eventDate = new Date(event.dateObj);
          const eventDay = new Date(eventDate.toISOString().split('T')[0]);
          const nowDay = new Date(today.toISOString().split('T')[0]);
          const sevenDaysLaterDay = new Date(sevenDaysLater.toISOString().split('T')[0]);
          
          return eventDay >= nowDay && eventDay <= sevenDaysLaterDay;
        } catch (e) {
          console.error("Error in upcoming events date comparison:", e);
          return false;
        }
      });
      
      // Then apply our view/member filters
      const filteredEvents = filterEvents(dateFilteredEvents);
      
      // Sort and limit results
      const sortedEvents = filteredEvents
        .sort((a, b) => {
          try {
            return new Date(a.dateObj) - new Date(b.dateObj);
          } catch (e) {
            return 0;
          }
        })
        .slice(0, 5);
        
      // Give each event a stable ID if it doesn't have one already
      const result = sortedEvents.map(event => {
        if (!event._stableId) {
          const stableId = event.id || 
                         event.firestoreId || 
                         event.universalId || 
                         `event-${event.title}-${event.childId || ''}-${(event.dateObj ? 
                           event.dateObj.toISOString().split('T')[0] : 
                           (event.dateTime ? new Date(event.dateTime).toISOString().split('T')[0] : ''))}`;
          
          return { ...event, _stableId: stableId };
        }
        return event;
      });
      
      // Update cache with events that have stable IDs
      upcomingEventsRef.current = {
        member: selectedMember,
        view: view,
        events: result,
        timestamp: now,
        lastEventsUpdate: lastRefresh
      };
      
      return result;
    } catch (error) {
      console.error("Error getting upcoming events:", error);
      return upcomingEventsRef.current?.events || [];
    }
  })();
  
  // Get event dates for calendar highlighting
  const eventDates = (() => {
    try {
      // Ensure events is an array before filtering
      if (!Array.isArray(events)) {
        console.warn("Events is not an array for eventDates:", events);
        return [];
      }
      
      // Apply member filter using our robust filterEvents function
      const filteredEvents = filterEvents(events);
      
      // Extract dates and validate them
      return filteredEvents
        .map(event => event.dateObj)
        .filter(date => date instanceof Date && !isNaN(date.getTime()));
    } catch (error) {
      console.error("Error processing event dates:", error);
      return [];
    }
  })();
  
  // When in embedded mode, always render the full calendar
  // When in floating mode, render the minimized button if not open
  if (!isOpen && !embedded) {
    return (
      <div className="fixed bottom-4 left-4 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-black text-white p-3 rounded-full hover:bg-gray-800 shadow-lg"
        >
          <Calendar size={24} />
        </button>
      </div>
    );
  }
  
  return (
    <div className={embedded ? "w-full h-full" : "fixed bottom-4 left-4 z-40"}>
      <div 
        ref={widgetRef}
        className="bg-white border border-black shadow-lg rounded-lg flex flex-col relative overflow-hidden"
        style={{ 
          height: embedded ? "100%" : `${widgetHeight}rem`, 
          width: embedded ? "100%" : `${widgetWidth}rem`
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-2 border-b">
          <h2 className="text-base font-medium flex items-center">
            <Calendar size={16} className="mr-1.5" />
            Calendar
          </h2>
          <div className="flex items-center">
            <button 
              onClick={handleForceRefresh}
              className={`mr-1.5 p-1 rounded-full hover:bg-gray-100 ${isRefreshing ? 'animate-spin' : ''}`}
              title="Refresh Calendar"
            >
              <RefreshCw size={14} />
            </button>
            {!embedded && (
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100"
                title="Minimize"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        
        {/* Calendar content */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* Use a fixed min-height container to prevent layout shifts */}
          <div className="relative" style={{ minHeight: embedded ? 'auto' : '45rem' }}>
            {/* Calendar Grid */}
            <SimpleCalendarGrid
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onPrevMonth={() => {
                const prevMonth = new Date(currentMonth);
                prevMonth.setMonth(prevMonth.getMonth() - 1);
                setCurrentMonth(prevMonth);
              }}
              onNextMonth={() => {
                const nextMonth = new Date(currentMonth);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                setCurrentMonth(nextMonth);
              }}
              eventDates={eventDates}
              selectedMember={selectedMember}
            />
            
            {/* Filters */}
            <SimpleCalendarFilters
              view={view}
              onViewChange={handleViewChange}
              selectedMember={selectedMember}
              onMemberChange={handleMemberChange}
              familyMembers={familyMembers}
              onResetFilters={handleResetFilters}
              filterOptions={[
                { id: 'all', label: 'All Events' },
                { id: 'appointments', label: 'Appointments' },
                { id: 'activities', label: 'Activities' },
                { id: 'tasks', label: 'Tasks' },
                { id: 'meetings', label: 'Meetings' },
                { id: 'ai-parsed', label: 'AI Parsed' }
              ]}
            />
            
            {/* Add Event Button */}
            <div className="mb-2">
              <button
                onClick={() => setShowEventManager(true)}
                className="w-full py-1.5 px-3 bg-black text-white rounded text-xs hover:bg-gray-800 transition-colors flex items-center justify-center"
              >
                <PlusCircle size={14} className="mr-1.5" />
                Add New Event
              </button>
            </div>
            
            {/* AI Parse Info Button */}
            {events.some(event => event.extraDetails?.parsedWithAI) && (
              <div className="mb-2">
                <button
                  onClick={() => setShowAiInfo(!showAiInfo)}
                  className={`w-full py-1.5 px-3 ${showAiInfo ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-800'} rounded text-xs hover:bg-purple-200 transition-colors flex items-center justify-center`}
                >
                  <Info size={12} className="mr-1" />
                  {showAiInfo ? 'Hide AI Event Info' : 'What are AI Parsed Events?'}
                </button>
                
                {showAiInfo && (
                  <div className="mt-1 p-1.5 bg-purple-50 rounded-md text-xs text-purple-800 border border-purple-200">
                    <p className="mb-1 text-xs leading-tight"><span className="font-medium">AI Parsed Events</span> are automatically extracted from messages, images, or emails.</p>
                    <p className="text-xs leading-tight">We use AI to identify event details like dates, times, and locations from text. Look for the <span className="bg-purple-100 text-purple-800 px-1 rounded text-xs font-medium">AI</span> badge to see which events were created this way.</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Events Container - Fixed height to prevent layout shifts */}
            <div className="event-lists-container" style={{ minHeight: '15rem' }}>
              {/* Selected Date Events */}
              {(() => {
                // Extract title creation to prevent re-rendering
                const dateTitle = `Events for ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                
                // Extract render badges to stable function
                const renderEventBadges = (event) => (
                  <>
                    {event.extraDetails?.parsedWithAI && (
                      <span className="ml-1 bg-purple-100 text-purple-800 px-1 py-0.5 rounded text-xs font-medium flex items-center">
                        <span className="mr-1">AI</span>
                        {event.extraDetails.extractionConfidence && (
                          <span className="text-xs">
                            {Math.round(event.extraDetails.extractionConfidence * 100)}%
                          </span>
                        )}
                      </span>
                    )}
                  </>
                );
                
                // Return the component with stable props
                return (
                  <div className="mb-4">
                    <SimpleEventList
                      events={eventsForSelectedDate}
                      onEventClick={handleEventClick}
                      onEventEdit={handleEventEdit}
                      onEventDelete={handleEventDelete}
                      addedEvents={addedEvents}
                      showAddedMessage={showAddedMessage}
                      loading={loading}
                      title={dateTitle}
                      emptyMessage="No events scheduled for this date"
                      showActionButtons={true}
                      renderBadges={renderEventBadges}
                      familyMembers={familyMembers}
                    />
                  </div>
                );
              })()}
              
              {/* Upcoming Events */}
              {(() => {
                // Extract render badges to stable function
                const renderEventBadges = (event) => (
                  <>
                    {event.extraDetails?.parsedWithAI && (
                      <span className="ml-1 bg-purple-100 text-purple-800 px-1 py-0.5 rounded text-xs font-medium flex items-center">
                        <span className="mr-1">AI</span>
                        {event.extraDetails.extractionConfidence && (
                          <span className="text-xs">
                            {Math.round(event.extraDetails.extractionConfidence * 100)}%
                          </span>
                        )}
                      </span>
                    )}
                  </>
                );
                
                // Return the component with stable props
                return (
                  <div>
                    <SimpleEventList
                      events={upcomingEvents}
                      onEventClick={handleEventClick}
                      onEventEdit={handleEventEdit}
                      onEventDelete={handleEventDelete}
                      addedEvents={addedEvents}
                      showAddedMessage={showAddedMessage}
                      loading={loading}
                      title="Upcoming Events"
                      emptyMessage="No upcoming events"
                      showActionButtons={true}
                      renderBadges={renderEventBadges}
                      familyMembers={familyMembers}
                    />
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
        
        {/* Resize handles - only shown in floating mode */}
        {!embedded && (
          <>
            <div 
              className="absolute bottom-0 right-0 w-4 h-4 bg-gray-200 rounded-bl-lg cursor-nwse-resize flex items-center justify-center"
              onMouseDown={(e) => startDrag(e, 'both')}
              ref={dragHandleRef}
            >
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path d="M9 1L1 9M6 1L1 6M9 4L4 9" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            
            <div 
              className="absolute bottom-0 right-1/2 w-16 h-3 bg-gray-200 rounded-t-lg cursor-ns-resize transform translate-x-1/2"
              onMouseDown={(e) => startDrag(e, 'height')}
            >
              <div className="flex justify-center items-center h-full">
                <div className="w-4 h-1 bg-gray-400 rounded"></div>
              </div>
            </div>
            
            <div 
              className="absolute right-0 top-1/2 h-16 w-3 bg-gray-200 rounded-l-lg cursor-ew-resize transform -translate-y-1/2"
              onMouseDown={(e) => startDrag(e, 'width')}
            >
              <div className="flex justify-center items-center h-full">
                <div className="h-4 w-1 bg-gray-400 rounded"></div>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Calendar icon button - only shown in floating mode */}
      {!embedded && (
        <button
          onClick={() => setIsOpen(false)}
          className="bg-black text-white p-3 rounded-full hover:bg-gray-800 shadow-lg"
        >
          <Calendar size={24} />
        </button>
      )}
      
      {/* Event Manager Modal */}
      {(showEventManager || (selectedEvent && isEditingEvent)) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full">
            <NewEnhancedEventManager
              initialEvent={isEditingEvent ? selectedEvent : null}
              selectedDate={selectedDate}
              onSave={async (eventData) => {
                try {
                  if (isEditingEvent) {
                    // Update existing event
                    const eventId = selectedEvent.firestoreId || selectedEvent.id || selectedEvent.universalId;
                    await updateEvent(eventId, eventData);
                  } else {
                    // Add new event
                    await addEvent(eventData);
                  }
                  
                  // Close the modal
                  setShowEventManager(false);
                  setIsEditingEvent(false);
                  setSelectedEvent(null);
                  
                  // Show success message
                  setShowSuccess(true);
                  setTimeout(() => {
                    setShowSuccess(false);
                  }, 1500);
                  
                  // Refresh events
                  handleForceRefresh();
                  
                  return { success: true };
                } catch (error) {
                  console.error("Error saving event:", error);
                  return { success: false, error: error.message };
                }
              }}
              onCancel={() => {
                setShowEventManager(false);
                setIsEditingEvent(false);
                setSelectedEvent(null);
              }}
              onDelete={isEditingEvent ? handleEventDelete : null}
              mode={isEditingEvent ? 'edit' : 'create'}
              showAiMetadata={true}
            />
          </div>
        </div>
      )}
      
      {/* Success Animation */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-20">
          <div className="bg-white rounded-lg p-6 shadow-lg animate-bounce">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-green-100 mb-3">
                <Check size={32} className="text-green-600" />
              </div>
              <h3 className="text-lg font-medium">
                {isEditingEvent ? 'Event Updated!' : 'Event Added!'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Successfully {isEditingEvent ? 'updated in' : 'added to'} your calendar
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewFloatingCalendarWidget;