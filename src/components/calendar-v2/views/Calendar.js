import React, { useState } from 'react';
import { CalendarGrid } from './CalendarGrid';
import { CalendarHeader } from './CalendarHeader';
import { EventModal } from './EventModal';
import { FamilyAvailabilityBar } from './FamilyAvailabilityBar';
import { AvailabilityGrid } from './AvailabilityGrid';
import { QuickMeetingScheduler } from './QuickMeetingScheduler';
import { CalendarSyncSettings } from './CalendarSyncSettings';
import { NotificationPreferences } from './NotificationPreferences';
import { NotificationToast } from './NotificationToast';
import { MiniCalendar } from './MiniCalendar';
import { UpcomingMeetings } from './UpcomingMeetings';
import { SimpleEventDrawer } from './SimpleEventDrawer';
import EventDrawer from '../../calendar/EventDrawer';
import { useCalendar } from '../hooks/useCalendar';
import { useChatDrawer } from '../../../contexts/ChatDrawerContext';
import { useFamily } from '../../../contexts/FamilyContext';
import { addMonths } from 'date-fns';
import './Calendar.css';
import './NotionCalendar.css';

export const Calendar = () => {
  const { view, selectedDate, setSelectedDate, loading } = useCalendar();
  const { openDrawerWithPrompt, isOpen } = useChatDrawer();
  const { familyId } = useFamily();
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalDate, setModalDate] = useState(null);
  const [showAvailabilityGrid, setShowAvailabilityGrid] = useState(false);
  const [showMeetingScheduler, setShowMeetingScheduler] = useState(false);
  const [showSyncSettings, setShowSyncSettings] = useState(false);
  const [showNotificationPrefs, setShowNotificationPrefs] = useState(false);
  const [miniCalendarDate, setMiniCalendarDate] = useState(selectedDate);
  const [showEventCreation, setShowEventCreation] = useState(false);
  const [eventCreationPrompt, setEventCreationPrompt] = useState('');
  const [eventCreationDate, setEventCreationDate] = useState(null);
  const [visibleMonth, setVisibleMonth] = useState(selectedDate);
  const [currentEditingEventId, setCurrentEditingEventId] = useState(null);

  // EventDrawer state for creating/editing events
  const [isEventDrawerOpen, setIsEventDrawerOpen] = useState(false);
  const [drawerEvent, setDrawerEvent] = useState(null);
  
  // Reset editing event ID when drawer closes
  React.useEffect(() => {
    if (!isOpen) {
      setCurrentEditingEventId(null);
    }
  }, [isOpen]);

  const handleEventClick = (event) => {
    console.log('Event clicked in Family Calendar - opening EventDrawer', event);

    // Open EventDrawer with the clicked event
    setDrawerEvent(event);
    setIsEventDrawerOpen(true);
  };

  const handleDateClick = (date) => {
    // Check if this date has a specific time (from week/day view)
    const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;

    // Create a new event object with the clicked date/time pre-filled
    const newEvent = {
      id: null, // null means new event
      familyId: familyId,
      title: '',
      description: '',
      location: '',
      attendees: [],
      reminders: [{ minutes: 30, method: 'popup' }]
    };

    if (hasTime) {
      // If clicked on a specific time slot, use that time
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setHours(date.getHours() + 1); // Default 1 hour event

      newEvent.startTime = startDate;
      newEvent.endTime = endDate;
    } else {
      // For month view clicks (no specific time), set to 9 AM - 10 AM
      const startDate = new Date(date);
      startDate.setHours(9, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(10, 0, 0, 0);

      newEvent.startTime = startDate;
      newEvent.endTime = endDate;
    }

    // Open EventDrawer with new event
    setDrawerEvent(newEvent);
    setIsEventDrawerOpen(true);
  };

  const handleCloseModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
    setModalDate(null);
    setEventCreationDate(null);
  };

  if (loading) {
    return (
      <div className="calendar-loading">
        <div className="spinner"></div>
        <p>Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="calendar-v2">
      <CalendarHeader
        onCreateClick={() => {
          // Open EventDrawer directly for creating new event
          const startDate = new Date(selectedDate);
          startDate.setHours(9, 0, 0, 0); // Default to 9 AM

          const endDate = new Date(selectedDate);
          endDate.setHours(10, 0, 0, 0); // Default to 10 AM

          const newEvent = {
            id: null, // null means new event
            familyId: familyId,
            title: '',
            description: '',
            location: '',
            startTime: startDate,
            endTime: endDate,
            attendees: [],
            reminders: [{ minutes: 30, method: 'popup' }]
          };

          setDrawerEvent(newEvent);
          setIsEventDrawerOpen(true);
        }}
        onSyncClick={() => setShowSyncSettings(true)}
        onNotificationClick={() => setShowNotificationPrefs(true)}
        visibleMonth={visibleMonth}
      />
      
      <div className="calendar-container">
        {/* Main calendar content - full width */}
        <div className="calendar-main-content">
          {/* Calendar Grid container with explicit height */}
          <div style={{ flex: '1 1 auto', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
            <CalendarGrid 
              view={view}
              selectedDate={selectedDate}
              onEventClick={handleEventClick}
              onDateClick={handleDateClick}
              onVisibleMonthChange={setVisibleMonth}
            />
          </div>
          
          {/* Family Availability - commented out for future use */}
          {/* <div style={{ marginTop: '24px', flexShrink: 0 }}>
            <FamilyAvailabilityBar date={selectedDate} view={view} />
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowAvailabilityGrid(!showAvailabilityGrid)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {showAvailabilityGrid ? 'Hide' : 'Show'} Availability Grid
              </button>
            </div>
            
            {showAvailabilityGrid && (
              <div className="mt-4">
                <AvailabilityGrid />
              </div>
            )}
          </div> */}
        </div>
      </div>

      {/* Event modal removed - now handled by Allie chat */}

      {showMeetingScheduler && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <QuickMeetingScheduler onClose={() => setShowMeetingScheduler(false)} />
        </div>
      )}

      {showSyncSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <CalendarSyncSettings onClose={() => setShowSyncSettings(false)} />
        </div>
      )}

      {showNotificationPrefs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <NotificationPreferences onClose={() => setShowNotificationPrefs(false)} />
        </div>
      )}

      {/* In-app notification toasts */}
      <NotificationToast />

      {/* Event Creation Drawer */}
      <SimpleEventDrawer
        isOpen={showEventCreation}
        onClose={() => {
          setShowEventCreation(false);
          setEventCreationPrompt('');
          setEventCreationDate(null);
        }}
        initialPrompt={eventCreationPrompt}
        initialDate={eventCreationDate}
        onEventCreated={() => {
          setShowEventCreation(false);
          setEventCreationPrompt('');
          setEventCreationDate(null);
        }}
      />

      {/* EventDrawer for creating/editing events */}
      <EventDrawer
        isOpen={isEventDrawerOpen}
        onClose={() => {
          setIsEventDrawerOpen(false);
          setDrawerEvent(null);
        }}
        event={drawerEvent}
        onSave={(savedEvent) => {
          // Event saved successfully
          setIsEventDrawerOpen(false);
          setDrawerEvent(null);
        }}
      />
    </div>
  );
};