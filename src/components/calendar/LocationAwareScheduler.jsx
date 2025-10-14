// src/components/calendar/LocationAwareScheduler.jsx
import React, { useState, useEffect } from 'react';
import { MapPin, Clock, AlertTriangle, Info, Car, Calendar, CheckCircle, Calendar as CalendarIcon } from 'lucide-react';
import EnhancedCalendarService from '../../services/EnhancedCalendarService';

/**
 * Component for location-aware scheduling with travel time calculations
 * Provides intelligent scheduling based on existing events and locations
 */
const LocationAwareScheduler = ({
  event,
  userId,
  onScheduleChange,
  onConflictDetected,
  showWarnings = true
}) => {
  const [location, setLocation] = useState(event?.location || '');
  const [previousLocation, setPreviousLocation] = useState('');
  const [nextLocation, setNextLocation] = useState('');
  const [travelToPrevious, setTravelToPrevious] = useState(null);
  const [travelToNext, setTravelToNext] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [suggestedStart, setSuggestedStart] = useState(null);
  const [suggestedEnd, setSuggestedEnd] = useState(null);
  
  // Update locations and check conflicts when event changes
  useEffect(() => {
    if (event?.location) {
      setLocation(event.location);
    }
    
    // Check for scheduling conflicts on initial load
    if (event && userId) {
      checkForConflicts();
    }
  }, [event, userId]);
  
  /**
   * Check for scheduling conflicts with this event
   */
  const checkForConflicts = async () => {
    if (!event || !userId) return;
    
    setIsChecking(true);
    setHasChecked(false);
    
    try {
      // Detect scheduling conflicts
      const result = await EnhancedCalendarService.detectSchedulingConflicts(event, userId);
      
      if (result.success) {
        setConflicts(result.conflicts || []);
        
        // If conflicts were found, notify parent component
        if (result.hasConflicts && onConflictDetected) {
          onConflictDetected(result.conflicts);
        }
        
        // Find adjacent events for travel time calculation
        await findAdjacentEvents();
      } else {
        console.error("Error checking conflicts:", result.error);
      }
      
      setHasChecked(true);
    } catch (error) {
      console.error("Error in conflict detection:", error);
    } finally {
      setIsChecking(false);
    }
  };
  
  /**
   * Find events that occur before and after this event
   */
  const findAdjacentEvents = async () => {
    if (!event || !userId) return;
    
    try {
      // Get the current event's start and end times
      const eventStart = new Date(event.start?.dateTime || event.dateTime);
      const eventEnd = new Date(event.end?.dateTime || event.endDateTime);
      
      // Create a buffer for search (6 hours before and after)
      const searchStartTime = new Date(eventStart.getTime() - (6 * 60 * 60 * 1000));
      const searchEndTime = new Date(eventEnd.getTime() + (6 * 60 * 60 * 1000));
      
      // Get events in the search window
      const events = await EnhancedCalendarService.baseService.getEventsForUser(
        userId,
        searchStartTime,
        searchEndTime
      );
      
      // Find the previous and next events
      let previousEvent = null;
      let nextEvent = null;
      let maxPreviousEndTime = null;
      let minNextStartTime = null;
      
      for (const otherEvent of events) {
        // Skip if this is the same event
        if (otherEvent.id === event.id) continue;
        
        // Skip events with no location
        if (!otherEvent.location) continue;
        
        const otherStartTime = new Date(otherEvent.start?.dateTime || otherEvent.dateTime);
        const otherEndTime = new Date(otherEvent.end?.dateTime || otherEvent.endDateTime);
        
        // Check if this event is before the current event
        if (otherEndTime <= eventStart) {
          if (!maxPreviousEndTime || otherEndTime > maxPreviousEndTime) {
            maxPreviousEndTime = otherEndTime;
            previousEvent = otherEvent;
          }
        }
        
        // Check if this event is after the current event
        if (otherStartTime >= eventEnd) {
          if (!minNextStartTime || otherStartTime < minNextStartTime) {
            minNextStartTime = otherStartTime;
            nextEvent = otherEvent;
          }
        }
      }
      
      // Update state with adjacent events
      if (previousEvent) {
        setPreviousLocation(previousEvent.location);
        
        // Calculate travel time from previous event to this event
        if (location) {
          const travelInfo = await EnhancedCalendarService.calculateTravelTime(
            previousEvent.location,
            location,
            eventStart
          );
          
          setTravelToPrevious(travelInfo);
          
          // Check if we need to adjust start time
          if (travelInfo.travelTimeMinutes > 0) {
            const availableTime = (eventStart - maxPreviousEndTime) / (60 * 1000);
            
            if (travelInfo.travelTimeMinutes > availableTime) {
              // Suggest a new start time with enough travel time
              const suggestedStartTime = new Date(
                maxPreviousEndTime.getTime() + (travelInfo.travelTimeMinutes * 60 * 1000)
              );
              
              setSuggestedStart(suggestedStartTime);
            }
          }
        }
      } else {
        setPreviousLocation('');
        setTravelToPrevious(null);
        setSuggestedStart(null);
      }
      
      if (nextEvent) {
        setNextLocation(nextEvent.location);
        
        // Calculate travel time from this event to next event
        if (location) {
          const travelInfo = await EnhancedCalendarService.calculateTravelTime(
            location,
            nextEvent.location,
            eventEnd
          );
          
          setTravelToNext(travelInfo);
          
          // Check if we need to adjust end time
          if (travelInfo.travelTimeMinutes > 0) {
            const availableTime = (minNextStartTime - eventEnd) / (60 * 1000);
            
            if (travelInfo.travelTimeMinutes > availableTime) {
              // Suggest a new end time to allow enough travel time
              const suggestedEndTime = new Date(
                minNextStartTime.getTime() - (travelInfo.travelTimeMinutes * 60 * 1000)
              );
              
              setSuggestedEnd(suggestedEndTime);
            }
          }
        }
      } else {
        setNextLocation('');
        setTravelToNext(null);
        setSuggestedEnd(null);
      }
      
    } catch (error) {
      console.error("Error finding adjacent events:", error);
    }
  };
  
  /**
   * Apply a suggested time adjustment
   * @param {string} type The adjustment type ('start' or 'end')
   */
  const applyTimeAdjustment = (type) => {
    if (!event || !onScheduleChange) return;
    
    const updatedEvent = { ...event };
    
    if (type === 'start' && suggestedStart) {
      // Update start time
      if (updatedEvent.start?.dateTime) {
        updatedEvent.start.dateTime = suggestedStart.toISOString();
      } else if (updatedEvent.dateTime) {
        updatedEvent.dateTime = suggestedStart.toISOString();
      }
      
      // Notify parent
      onScheduleChange(updatedEvent);
      setSuggestedStart(null);
    } else if (type === 'end' && suggestedEnd) {
      // Update end time
      if (updatedEvent.end?.dateTime) {
        updatedEvent.end.dateTime = suggestedEnd.toISOString();
      } else if (updatedEvent.endDateTime) {
        updatedEvent.endDateTime = suggestedEnd.toISOString();
      }
      
      // Notify parent
      onScheduleChange(updatedEvent);
      setSuggestedEnd(null);
    }
  };
  
  /**
   * Handle location input change
   * @param {Event} e The input change event
   */
  const handleLocationChange = (e) => {
    setLocation(e.target.value);
    
    // Update event with new location
    if (onScheduleChange && event) {
      const updatedEvent = { ...event, location: e.target.value };
      onScheduleChange(updatedEvent);
    }
  };
  
  /**
   * Format a time for display
   * @param {Date} time The time to format
   * @returns {string} The formatted time
   */
  const formatTime = (time) => {
    if (!time) return '';
    
    // Format as "3:45 PM"
    return time.toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };
  
  /**
   * Render the previous event travel information
   * @returns {JSX.Element} The travel info element
   */
  const renderPreviousEventInfo = () => {
    if (!previousLocation || !travelToPrevious) return null;
    
    return (
      <div className="mt-3 bg-blue-50 p-2 rounded-md text-sm">
        <div className="flex items-center text-blue-700 font-medium">
          <Calendar size={14} className="mr-1" />
          <span>Travel from previous event</span>
        </div>
        
        <div className="mt-1 space-y-1">
          <div className="flex items-center text-xs text-blue-600">
            <MapPin size={12} className="mr-1" />
            <span className="truncate">{previousLocation}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-xs text-blue-600">
              <Car size={12} className="mr-1" />
              <span>
                {travelToPrevious.travelTimeMinutes} min travel time
                {travelToPrevious.hasTrafficData && 
                  ` (${travelToPrevious.trafficConditions} traffic)`}
              </span>
            </div>
            
            <div className="text-xs text-blue-800">
              {travelToPrevious.distanceKm.toFixed(1)} km
            </div>
          </div>
        </div>
        
        {suggestedStart && (
          <div className="mt-2 border-t border-blue-200 pt-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-orange-600 flex items-center">
                <AlertTriangle size={12} className="mr-1" />
                <span>Travel time conflict detected</span>
              </div>
              
              <button
                onClick={() => applyTimeAdjustment('start')}
                className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded flex items-center"
              >
                <Clock size={10} className="mr-1" />
                Adjust to {formatTime(suggestedStart)}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  /**
   * Render the next event travel information
   * @returns {JSX.Element} The travel info element
   */
  const renderNextEventInfo = () => {
    if (!nextLocation || !travelToNext) return null;
    
    return (
      <div className="mt-3 bg-blue-50 p-2 rounded-md text-sm">
        <div className="flex items-center text-blue-700 font-medium">
          <Calendar size={14} className="mr-1" />
          <span>Travel to next event</span>
        </div>
        
        <div className="mt-1 space-y-1">
          <div className="flex items-center text-xs text-blue-600">
            <MapPin size={12} className="mr-1" />
            <span className="truncate">{nextLocation}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-xs text-blue-600">
              <Car size={12} className="mr-1" />
              <span>
                {travelToNext.travelTimeMinutes} min travel time
                {travelToNext.hasTrafficData && 
                  ` (${travelToNext.trafficConditions} traffic)`}
              </span>
            </div>
            
            <div className="text-xs text-blue-800">
              {travelToNext.distanceKm.toFixed(1)} km
            </div>
          </div>
        </div>
        
        {suggestedEnd && (
          <div className="mt-2 border-t border-blue-200 pt-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-orange-600 flex items-center">
                <AlertTriangle size={12} className="mr-1" />
                <span>Travel time conflict detected</span>
              </div>
              
              <button
                onClick={() => applyTimeAdjustment('end')}
                className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded flex items-center"
              >
                <Clock size={10} className="mr-1" />
                Adjust to {formatTime(suggestedEnd)}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  /**
   * Render the conflicts information
   * @returns {JSX.Element} The conflicts element
   */
  const renderConflicts = () => {
    if (!showWarnings || conflicts.length === 0) return null;
    
    return (
      <div className="mt-3 bg-orange-50 p-2 rounded-md">
        <div className="flex items-center text-orange-700 font-medium text-sm">
          <AlertTriangle size={14} className="mr-1" />
          <span>Scheduling Conflicts Detected</span>
        </div>
        
        <div className="mt-1 space-y-2">
          {conflicts.map((conflict, index) => (
            <div key={index} className="text-xs">
              <div className="flex items-center text-orange-600 font-medium">
                <Calendar size={12} className="mr-1" />
                <span className="truncate">{conflict.title}</span>
              </div>
              
              <div className="flex items-center text-orange-600 mt-0.5">
                <Clock size={12} className="mr-1" />
                <span>
                  {new Date(conflict.start).toLocaleTimeString([], { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  })} - {new Date(conflict.end).toLocaleTimeString([], { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </span>
              </div>
              
              <div className="mt-1 text-xs text-orange-700">
                {conflict.overlapType === 'travel-time-conflict' ? (
                  <div className="flex items-start">
                    <Car size={12} className="mr-1 mt-0.5 flex-shrink-0" />
                    <span>
                      Travel time conflict: Need {conflict.travelInfo.travelTimeMinutes} minutes 
                      but only have {conflict.travelInfo.availableTimeMinutes} minutes available
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <AlertTriangle size={12} className="mr-1" />
                    <span>Time conflict: Events overlap</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  /**
   * Render a no conflicts message if there are no conflicts
   * @returns {JSX.Element} The no conflicts element
   */
  const renderNoConflicts = () => {
    if (!hasChecked || isChecking || conflicts.length > 0 || !showWarnings) return null;
    
    return (
      <div className="mt-3 bg-green-50 p-2 rounded-md text-sm flex items-center">
        <CheckCircle size={14} className="text-green-600 mr-2" />
        <span className="text-green-700">No scheduling conflicts detected</span>
      </div>
    );
  };
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center">
          <MapPin size={16} className="text-blue-600 mr-2" />
          <h3 className="font-medium">Location</h3>
        </div>
        
        {(travelToPrevious || travelToNext) && (
          <div className="text-xs text-blue-600 flex items-center">
            <Car size={14} className="mr-1" />
            Travel times calculated
          </div>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Event Location</label>
        <input
          type="text"
          value={location}
          onChange={handleLocationChange}
          placeholder="Enter location address"
          className="w-full p-2 border rounded"
        />
        
        <div className="mt-1 text-xs text-gray-500 flex items-center">
          <Info size={12} className="mr-1" />
          Adding a location helps with travel time calculations
        </div>
      </div>
      
      {renderPreviousEventInfo()}
      {renderNextEventInfo()}
      {renderConflicts()}
      {renderNoConflicts()}
      
      <div className="mt-3 text-right">
        <button
          onClick={checkForConflicts}
          className="text-sm text-blue-600 flex items-center ml-auto"
          disabled={isChecking}
        >
          <CalendarIcon size={14} className="mr-1" />
          {isChecking ? 'Checking conflicts...' : 'Check scheduling conflicts'}
        </button>
      </div>
    </div>
  );
};

export default LocationAwareScheduler;