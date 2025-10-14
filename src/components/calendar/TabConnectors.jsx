// src/components/calendar/TabConnectors.jsx
import React, { useState } from 'react';
import { 
  Calendar, PlusCircle, Clock, Tag, MapPin, 
  Users, Check, AlertCircle, ChevronRight 
} from 'lucide-react';
import { 
  useTaskCalendar, 
  useRelationshipCalendar, 
  useChildCalendar,
  useMeetingCalendar
} from '../../hooks/useCalendarIntegration';
import NewEnhancedEventManager from './NewEnhancedEventManager';

/**
 * Component for integrating calendar with the tasks tab
 * @returns {JSX.Element} Task calendar integration component
 */
export function TaskCalendarConnector() {
  const { taskEvents, addTaskEvent } = useTaskCalendar();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventManager, setShowEventManager] = useState(false);
  
  // Filter upcoming events (within next 7 days)
  const upcomingEvents = taskEvents.filter(event => {
    if (!event.dateObj) return false;
    
    const now = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    
    return event.dateObj >= now && event.dateObj <= sevenDaysLater;
  }).sort((a, b) => a.dateObj - b.dateObj);
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium flex items-center">
          <Calendar size={18} className="mr-2 text-blue-600" />
          Task Calendar
        </h3>
        <button
          onClick={() => setShowEventManager(true)}
          className="text-sm flex items-center px-3 py-1.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
        >
          <PlusCircle size={14} className="mr-1" />
          Add Task Event
        </button>
      </div>
      
      {upcomingEvents.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-500">Upcoming Tasks</h4>
          {upcomingEvents.map(event => (
            <div 
              key={event.id || event.firestoreId}
              className="p-3 bg-blue-50 rounded-md border border-blue-100"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{event.title}</h4>
                  <div className="text-xs text-gray-500 flex items-center mt-1">
                    <Clock size={12} className="mr-1" />
                    {event.dateObj.toLocaleDateString()} at {event.dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  event.taskPriority === 'high' ? 'bg-red-100 text-red-700' :
                  event.taskPriority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {event.taskPriority || 'normal'}
                </span>
              </div>
              {event.description && (
                <p className="text-sm mt-2 text-gray-600">
                  {event.description.length > 100 ? 
                    `${event.description.substring(0, 97)}...` : 
                    event.description}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <Calendar size={32} className="mx-auto mb-2 text-gray-400" />
          <p>No upcoming task events</p>
          <button
            onClick={() => setShowEventManager(true)}
            className="mt-2 text-sm px-3 py-1.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
          >
            Add your first task event
          </button>
        </div>
      )}
      
      {/* Event Manager Modal */}
      {showEventManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full">
            <NewEnhancedEventManager
              eventType="task"
              selectedDate={selectedDate}
              onSave={async (eventData) => {
                try {
                  await addTaskEvent(eventData);
                  setShowEventManager(false);
                  return { success: true };
                } catch (error) {
                  console.error("Error saving task event:", error);
                  return { success: false, error: error.message };
                }
              }}
              onCancel={() => setShowEventManager(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Component for integrating calendar with the relationship tab
 * @returns {JSX.Element} Relationship calendar integration component
 */
export function RelationshipCalendarConnector() {
  const { relationshipEvents, addDateNightEvent } = useRelationshipCalendar();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventManager, setShowEventManager] = useState(false);
  
  // Filter upcoming date nights
  const upcomingDateNights = relationshipEvents.filter(event => {
    if (!event.dateObj) return false;
    
    const now = new Date();
    return event.dateObj >= now;
  }).sort((a, b) => a.dateObj - b.dateObj);
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium flex items-center">
          <Calendar size={18} className="mr-2 text-pink-600" />
          Date Nights
        </h3>
        <button
          onClick={() => setShowEventManager(true)}
          className="text-sm flex items-center px-3 py-1.5 rounded bg-pink-50 text-pink-700 hover:bg-pink-100"
        >
          <PlusCircle size={14} className="mr-1" />
          Plan Date Night
        </button>
      </div>
      
      {upcomingDateNights.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-500">Upcoming Date Nights</h4>
          {upcomingDateNights.map(event => (
            <div 
              key={event.id || event.firestoreId}
              className="p-3 bg-pink-50 rounded-md border border-pink-100"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{event.title}</h4>
                  <div className="text-xs text-gray-500 flex items-center mt-1">
                    <Clock size={12} className="mr-1" />
                    {event.dateObj.toLocaleDateString()} at {event.dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  {event.location && (
                    <div className="text-xs text-gray-500 flex items-center mt-1">
                      <MapPin size={12} className="mr-1" />
                      {event.location}
                    </div>
                  )}
                </div>
              </div>
              {event.description && (
                <p className="text-sm mt-2 text-gray-600">
                  {event.description.length > 100 ? 
                    `${event.description.substring(0, 97)}...` : 
                    event.description}
                </p>
              )}
              {event.babysitter && (
                <div className="mt-2 text-xs bg-white p-1.5 rounded">
                  <span className="font-medium">Babysitter:</span> {event.babysitter.name}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <Calendar size={32} className="mx-auto mb-2 text-gray-400" />
          <p>No upcoming date nights</p>
          <button
            onClick={() => setShowEventManager(true)}
            className="mt-2 text-sm px-3 py-1.5 rounded bg-pink-50 text-pink-700 hover:bg-pink-100"
          >
            Plan your first date night
          </button>
        </div>
      )}
      
      {/* Event Manager Modal */}
      {showEventManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full">
            <NewEnhancedEventManager
              eventType="date-night"
              selectedDate={selectedDate}
              onSave={async (eventData) => {
                try {
                  await addDateNightEvent(eventData);
                  setShowEventManager(false);
                  return { success: true };
                } catch (error) {
                  console.error("Error saving date night:", error);
                  return { success: false, error: error.message };
                }
              }}
              onCancel={() => setShowEventManager(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Component for integrating calendar with the child tab
 * @param {Object} props Component props
 * @param {string} props.childId The child ID to show events for
 * @returns {JSX.Element} Child calendar integration component
 */
export function ChildCalendarConnector({ childId }) {
  const { childEvents, addChildEvent } = useChildCalendar(childId);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventManager, setShowEventManager] = useState(false);
  
  // Filter upcoming child events
  const upcomingEvents = childEvents.filter(event => {
    if (!event.dateObj) return false;
    
    const now = new Date();
    return event.dateObj >= now;
  }).sort((a, b) => a.dateObj - b.dateObj);
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium flex items-center">
          <Calendar size={18} className="mr-2 text-blue-600" />
          Child Schedule
        </h3>
        <button
          onClick={() => setShowEventManager(true)}
          className="text-sm flex items-center px-3 py-1.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
        >
          <PlusCircle size={14} className="mr-1" />
          Add Event
        </button>
      </div>
      
      {upcomingEvents.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-500">Upcoming Events</h4>
          {upcomingEvents.map(event => (
            <div 
              key={event.id || event.firestoreId}
              className={`p-3 rounded-md border ${
                event.eventType === 'appointment' ? 'bg-red-50 border-red-100' :
                event.eventType === 'activity' ? 'bg-green-50 border-green-100' :
                event.eventType === 'birthday' ? 'bg-purple-50 border-purple-100' :
                'bg-blue-50 border-blue-100'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{event.title}</h4>
                  <div className="text-xs text-gray-500 flex items-center mt-1">
                    <Clock size={12} className="mr-1" />
                    {event.dateObj.toLocaleDateString()} at {event.dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  {event.location && (
                    <div className="text-xs text-gray-500 flex items-center mt-1">
                      <MapPin size={12} className="mr-1" />
                      {event.location}
                    </div>
                  )}
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  event.eventType === 'appointment' ? 'bg-red-100 text-red-700' :
                  event.eventType === 'activity' ? 'bg-green-100 text-green-700' :
                  event.eventType === 'birthday' ? 'bg-purple-100 text-purple-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {event.eventType}
                </span>
              </div>
              {event.provider && (
                <div className="mt-2 text-xs bg-white p-1.5 rounded">
                  <span className="font-medium">Provider:</span> {event.provider.name}
                  {event.provider.specialty && 
                    <span className="ml-1 text-gray-500">({event.provider.specialty})</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <Calendar size={32} className="mx-auto mb-2 text-gray-400" />
          <p>No upcoming events for this child</p>
          <button
            onClick={() => setShowEventManager(true)}
            className="mt-2 text-sm px-3 py-1.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
          >
            Add an event
          </button>
        </div>
      )}
      
      {/* Event Manager Modal */}
      {showEventManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full">
            <NewEnhancedEventManager
              eventType="activity"
              initialChildId={childId}
              selectedDate={selectedDate}
              onSave={async (eventData) => {
                try {
                  await addChildEvent({
                    ...eventData,
                    childId
                  });
                  setShowEventManager(false);
                  return { success: true };
                } catch (error) {
                  console.error("Error saving child event:", error);
                  return { success: false, error: error.message };
                }
              }}
              onCancel={() => setShowEventManager(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Component for integrating calendar with the family meeting tab
 * @returns {JSX.Element} Meeting calendar integration component
 */
export function MeetingCalendarConnector() {
  const { meetingEvents, currentCycleMeeting, addFamilyMeetingEvent } = useMeetingCalendar();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventManager, setShowEventManager] = useState(false);
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium flex items-center">
          <Calendar size={18} className="mr-2 text-amber-600" />
          Family Meetings
        </h3>
        <button
          onClick={() => setShowEventManager(true)}
          className="text-sm flex items-center px-3 py-1.5 rounded bg-amber-50 text-amber-700 hover:bg-amber-100"
        >
          <PlusCircle size={14} className="mr-1" />
          Schedule Meeting
        </button>
      </div>
      
      {currentCycleMeeting ? (
        <div className="p-3 bg-amber-50 rounded-md border border-amber-100">
          <div>
            <h4 className="font-medium">{currentCycleMeeting.title}</h4>
            <div className="text-xs text-gray-500 flex items-center mt-1">
              <Clock size={12} className="mr-1" />
              {currentCycleMeeting.dateObj.toLocaleDateString()} at {currentCycleMeeting.dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
            {currentCycleMeeting.location && (
              <div className="text-xs text-gray-500 flex items-center mt-1">
                <MapPin size={12} className="mr-1" />
                {currentCycleMeeting.location}
              </div>
            )}
            {currentCycleMeeting.attendees && currentCycleMeeting.attendees.length > 0 && (
              <div className="text-xs text-gray-500 flex items-center mt-1">
                <Users size={12} className="mr-1" />
                {currentCycleMeeting.attendees.length} attendees
              </div>
            )}
          </div>
          {currentCycleMeeting.description && (
            <p className="text-sm mt-2 text-gray-600">
              {currentCycleMeeting.description.length > 100 ? 
                `${currentCycleMeeting.description.substring(0, 97)}...` : 
                currentCycleMeeting.description}
            </p>
          )}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <Calendar size={32} className="mx-auto mb-2 text-gray-400" />
          <p>No meeting scheduled for the current cycle</p>
          <button
            onClick={() => setShowEventManager(true)}
            className="mt-2 text-sm px-3 py-1.5 rounded bg-amber-50 text-amber-700 hover:bg-amber-100"
          >
            Schedule a family meeting
          </button>
        </div>
      )}
      
      {/* Previous Meetings */}
      {meetingEvents.length > 1 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Previous Meetings</h4>
          {meetingEvents
            .filter(event => event !== currentCycleMeeting)
            .slice(0, 3)
            .map(event => (
              <div 
                key={event.id || event.firestoreId}
                className="p-2 bg-gray-50 rounded-md border border-gray-100 mb-2"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="text-sm font-medium">{event.title}</h5>
                    <div className="text-xs text-gray-500">
                      {event.dateObj.toLocaleDateString()}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </div>
            ))}
        </div>
      )}
      
      {/* Event Manager Modal */}
      {showEventManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full">
            <NewEnhancedEventManager
              eventType="meeting"
              selectedDate={selectedDate}
              onSave={async (eventData) => {
                try {
                  await addFamilyMeetingEvent(eventData);
                  setShowEventManager(false);
                  return { success: true };
                } catch (error) {
                  console.error("Error saving meeting:", error);
                  return { success: false, error: error.message };
                }
              }}
              onCancel={() => setShowEventManager(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default {
  TaskCalendarConnector,
  RelationshipCalendarConnector,
  ChildCalendarConnector,
  MeetingCalendarConnector
};