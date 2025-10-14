// src/components/calendar/AdvancedCalendarDemo.jsx
import React, { useState } from 'react';
import { Calendar, Clock, Save, MapPin, RefreshCw, Users, Trash, X } from 'lucide-react';
import AdvancedRecurrenceSelector from './AdvancedRecurrenceSelector';
import LocationAwareScheduler from './LocationAwareScheduler';
import EnhancedCalendarService from '../../services/EnhancedCalendarService';
import recurrencePatternBuilder from '../../utils/RecurrencePatternBuilder';

/**
 * Demo component for showcasing advanced calendar features
 */
const AdvancedCalendarDemo = ({ userId = 'demo-user' }) => {
  const [event, setEvent] = useState({
    title: 'Demo Event',
    description: '',
    location: '',
    start: {
      dateTime: new Date().toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    recurrence: [],
    attendees: []
  });
  
  const [recurrencePattern, setRecurrencePattern] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [conflicts, setConflicts] = useState([]);
  const [showRecurrenceOptions, setShowRecurrenceOptions] = useState(false);
  const [showLocationOptions, setShowLocationOptions] = useState(false);
  const [createdEvents, setCreatedEvents] = useState([]);
  
  /**
   * Format a date for input field
   * @param {string} dateTimeString The ISO date string
   * @returns {string} Formatted date string for input
   */
  const formatDateForInput = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toISOString().substring(0, 16); // Format: "2023-01-01T12:00"
  };
  
  /**
   * Handle input changes
   * @param {Event} e The input change event
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'title' || name === 'description' || name === 'location') {
      setEvent({ ...event, [name]: value });
    } else if (name === 'startDate') {
      setEvent({
        ...event,
        start: {
          ...event.start,
          dateTime: new Date(value).toISOString()
        }
      });
    } else if (name === 'endDate') {
      setEvent({
        ...event,
        end: {
          ...event.end,
          dateTime: new Date(value).toISOString()
        }
      });
    }
  };
  
  /**
   * Handle recurrence pattern change
   * @param {string} pattern The new RRULE pattern
   */
  const handleRecurrenceChange = (pattern) => {
    setRecurrencePattern(pattern);
    
    if (pattern) {
      setEvent({
        ...event,
        recurrence: [pattern]
      });
    } else {
      setEvent({
        ...event,
        recurrence: []
      });
    }
  };
  
  /**
   * Handle scheduling changes from LocationAwareScheduler
   * @param {Object} updatedEvent The updated event object
   */
  const handleScheduleChange = (updatedEvent) => {
    setEvent(updatedEvent);
  };
  
  /**
   * Handle conflicts detected by LocationAwareScheduler
   * @param {Array} detectedConflicts The detected conflicts
   */
  const handleConflictDetected = (detectedConflicts) => {
    setConflicts(detectedConflicts);
  };
  
  /**
   * Create the event with all advanced features
   */
  const createEvent = async () => {
    setIsCreating(true);
    setSuccessMessage('');
    
    try {
      // Create event or recurring series
      let result;
      
      if (event.recurrence && event.recurrence.length > 0) {
        // Parse the recurrence rule
        const parsedRule = recurrencePatternBuilder.parseFromString(event.recurrence[0]);
        const exceptions = []; // Could allow exceptions to be added in a real implementation
        
        // Create recurring series
        result = await EnhancedCalendarService.createRecurringSeries(
          event,
          userId,
          event.recurrence[0],
          exceptions
        );
        
        if (result.success) {
          setSuccessMessage(`Created recurring event series with ${result.occurrenceCount} occurrences!`);
          
          // Clear form
          setCreatedEvents([{
            id: result.baseEventId,
            title: event.title,
            isRecurring: true,
            occurrences: result.occurrenceCount,
            pattern: recurrencePatternBuilder.toFriendlyText()
          }]);
          
          resetForm();
        } else {
          setSuccessMessage(`Error creating event: ${result.error}`);
        }
      } else {
        // Create single event
        result = await EnhancedCalendarService.baseService.addEvent(event, userId);
        
        if (result.success) {
          setSuccessMessage('Event created successfully!');
          
          // Add to created events list
          setCreatedEvents([
            ...createdEvents,
            {
              id: result.eventId,
              title: event.title,
              isRecurring: false
            }
          ]);
          
          resetForm();
        } else {
          setSuccessMessage(`Error creating event: ${result.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error("Error creating event:", error);
      setSuccessMessage(`Error: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };
  
  /**
   * Reset the form to defaults
   */
  const resetForm = () => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    
    setEvent({
      title: '',
      description: '',
      location: '',
      start: {
        dateTime: now.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: oneHourLater.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      recurrence: [],
      attendees: []
    });
    
    setRecurrencePattern('');
    setConflicts([]);
    setShowRecurrenceOptions(false);
    setShowLocationOptions(false);
  };
  
  /**
   * Delete an event from the created events list
   * @param {string} eventId The event ID to delete
   */
  const deleteEvent = async (eventId) => {
    try {
      const result = await EnhancedCalendarService.baseService.deleteEvent(eventId, userId);
      
      if (result.success) {
        // Remove from the list
        setCreatedEvents(createdEvents.filter(evt => evt.id !== eventId));
        setSuccessMessage('Event deleted successfully!');
      } else {
        setSuccessMessage(`Error deleting event: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      setSuccessMessage(`Error: ${error.message}`);
    }
  };
  
  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Calendar size={20} className="text-blue-600 mr-2" />
          Advanced Calendar Integration Demo
        </h2>
        
        <div className="divide-y space-y-4">
          {/* Event Creation Form */}
          <div className="pb-4">
            <h3 className="font-medium mb-3">Create New Event</h3>
            
            <div className="space-y-4">
              {/* Title and Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="title">
                    Event Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={event.title}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    placeholder="Enter event title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="description">
                    Description
                  </label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    value={event.description}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    placeholder="Enter event description"
                  />
                </div>
              </div>
              
              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="startDate">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    id="startDate"
                    name="startDate"
                    value={formatDateForInput(event.start.dateTime)}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="endDate">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    id="endDate"
                    name="endDate"
                    value={formatDateForInput(event.end.dateTime)}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              
              {/* Advanced Options Toggles */}
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={() => setShowRecurrenceOptions(!showRecurrenceOptions)}
                  className={`py-1.5 px-3 text-sm border rounded flex items-center ${
                    showRecurrenceOptions || recurrencePattern 
                      ? 'bg-blue-50 border-blue-300 text-blue-700' 
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                >
                  <RefreshCw size={16} className="mr-1" />
                  {showRecurrenceOptions ? 'Hide Recurrence Options' : 'Set Recurrence'}
                  {recurrencePattern && !showRecurrenceOptions && (
                    <span className="ml-1 text-xs bg-blue-100 px-1 rounded text-blue-800">
                      Set
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => setShowLocationOptions(!showLocationOptions)}
                  className={`py-1.5 px-3 text-sm border rounded flex items-center ${
                    showLocationOptions || event.location 
                      ? 'bg-blue-50 border-blue-300 text-blue-700' 
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                >
                  <MapPin size={16} className="mr-1" />
                  {showLocationOptions ? 'Hide Location Options' : 'Location & Travel'}
                  {event.location && !showLocationOptions && (
                    <span className="ml-1 text-xs bg-blue-100 px-1 rounded text-blue-800">
                      Set
                    </span>
                  )}
                </button>
              </div>
              
              {/* Recurrence Options */}
              {showRecurrenceOptions && (
                <div className="mt-3 border p-3 rounded-md bg-gray-50">
                  <AdvancedRecurrenceSelector
                    initialValue={recurrencePattern}
                    onChange={handleRecurrenceChange}
                    showPreview={true}
                  />
                </div>
              )}
              
              {/* Location Options */}
              {showLocationOptions && (
                <div className="mt-3 border p-3 rounded-md bg-gray-50">
                  <LocationAwareScheduler
                    event={event}
                    userId={userId}
                    onScheduleChange={handleScheduleChange}
                    onConflictDetected={handleConflictDetected}
                    showWarnings={true}
                  />
                </div>
              )}
              
              {/* Create Button */}
              <div className="mt-4">
                <button
                  onClick={createEvent}
                  disabled={isCreating || !event.title}
                  className={`py-2 px-4 rounded flex items-center ${
                    isCreating || !event.title 
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Save size={16} className="mr-2" />
                  {isCreating 
                    ? 'Creating...' 
                    : event.recurrence && event.recurrence.length > 0 
                      ? 'Create Recurring Event' 
                      : 'Create Event'
                  }
                </button>
                
                {successMessage && (
                  <div className={`mt-2 text-sm p-2 rounded ${
                    successMessage.includes('Error') 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {successMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Created Events List */}
          <div className="pt-4">
            <h3 className="font-medium mb-3 flex items-center">
              <Clock size={18} className="text-blue-600 mr-2" />
              Created Events
            </h3>
            
            {createdEvents.length === 0 ? (
              <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
                No events created yet. Create an event above to see it listed here.
              </div>
            ) : (
              <div className="space-y-2">
                {createdEvents.map((createdEvent, index) => (
                  <div key={index} className="border rounded p-3 flex justify-between items-center">
                    <div>
                      <div className="font-medium">{createdEvent.title}</div>
                      
                      {createdEvent.isRecurring && (
                        <div className="text-sm text-blue-600 flex items-center mt-1">
                          <RefreshCw size={14} className="mr-1" />
                          {createdEvent.pattern || `Recurring (${createdEvent.occurrences} occurrences)`}
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => deleteEvent(createdEvent.id)}
                      className="text-red-600 p-1 hover:bg-red-50 rounded"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedCalendarDemo;