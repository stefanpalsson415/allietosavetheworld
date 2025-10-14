// src/services/EnhancedCalendarService.js
import { db } from './firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  deleteDoc, query, where, serverTimestamp 
} from 'firebase/firestore';
import CalendarService from './CalendarService';
import eventStore from './EventStore';
import { v4 as uuidv4 } from 'uuid';

/**
 * EnhancedCalendarService extends the base CalendarService with advanced features:
 * - Sophisticated recurring event handling with exceptions
 * - Location-aware scheduling with travel time calculations
 * - Smart conflict detection and resolution
 * - Calendar sharing features
 */
class EnhancedCalendarService {
  constructor() {
    this.baseService = CalendarService;
    this.isInitialized = true;
    this.travelTimeCache = new Map(); // Cache for travel time calculations
  }

  /**
   * Creates a recurring event series with sophisticated recurrence patterns
   * @param {Object} baseEvent The base event object
   * @param {string} userId The user ID
   * @param {string} recurrencePattern The recurrence pattern (RRULE format)
   * @param {Array} exceptions Dates to exclude from the recurrence
   * @returns {Promise<Object>} Result object with series info
   */
  async createRecurringSeries(baseEvent, userId, recurrencePattern, exceptions = []) {
    try {
      if (!userId) throw new Error("User ID is required");
      if (!baseEvent) throw new Error("Base event is required");
      
      console.log("Creating recurring series with pattern:", recurrencePattern);
      
      // Generate a universal ID for the series
      const seriesId = `series-${uuidv4()}`;
      
      // Parse the recurrence rule
      const parsedRule = this.parseRecurrenceRule(recurrencePattern);
      
      // Process exceptions (convert to Date objects if they're strings)
      const processedExceptions = exceptions.map(ex => 
        typeof ex === 'string' ? new Date(ex) : ex
      );
      
      // Create the base event with series information
      const enhancedBaseEvent = {
        ...baseEvent,
        universalId: `${seriesId}-base`,
        seriesId: seriesId,
        isRecurringSeries: true,
        isSeriesParent: true,
        recurrence: {
          pattern: recurrencePattern,
          parsedRule: parsedRule,
          exceptions: processedExceptions.map(d => d.toISOString()),
          created: new Date().toISOString()
        }
      };
      
      // Add the base event first
      const baseResult = await this.baseService.addEvent(enhancedBaseEvent, userId);
      
      if (!baseResult.success) {
        throw new Error("Failed to create base recurring event");
      }
      
      // Generate all occurrences based on the recurrence pattern
      const occurrences = this.generateOccurrences(
        baseEvent, 
        parsedRule, 
        processedExceptions
      );
      
      // Create all the occurrence events
      const eventPromises = occurrences.map(occurrence => 
        this.baseService.addEvent({
          ...baseEvent,
          universalId: `${seriesId}-${occurrence.startDate.toISOString().split('T')[0]}`,
          seriesId: seriesId,
          isRecurringSeries: true,
          isSeriesParent: false,
          start: {
            dateTime: occurrence.startDate.toISOString(),
            timeZone: baseEvent.start?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: occurrence.endDate.toISOString(),
            timeZone: baseEvent.end?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          recurrence: {
            pattern: recurrencePattern,
            occurrenceDate: occurrence.startDate.toISOString().split('T')[0],
            parentEventId: baseResult.eventId,
            exceptions: processedExceptions.map(d => d.toISOString())
          }
        }, userId)
      );
      
      // Wait for all occurrences to be created
      const results = await Promise.all(eventPromises);
      
      // Create series metadata document for easier management
      const seriesMetadata = {
        seriesId,
        userId,
        baseEventId: baseResult.eventId,
        pattern: recurrencePattern,
        parsedRule: parsedRule,
        exceptions: processedExceptions.map(d => d.toISOString()),
        title: baseEvent.title || baseEvent.summary,
        eventType: baseEvent.eventType || baseEvent.category,
        created: new Date().toISOString(),
        totalOccurrences: occurrences.length,
        occurrenceIds: results.map(r => r.eventId).filter(id => id)
      };
      
      // Save the series metadata
      await setDoc(doc(db, "eventSeries", seriesId), seriesMetadata);
      
      return {
        success: true,
        seriesId,
        baseEventId: baseResult.eventId,
        occurrenceCount: occurrences.length,
        pattern: recurrencePattern
      };
      
    } catch (error) {
      console.error("Error creating recurring series:", error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Parses a recurrence rule string into a structured object
   * @param {string} ruleString The recurrence rule string (RRULE format)
   * @returns {Object} Parsed rule object
   */
  parseRecurrenceRule(ruleString) {
    // Handle full RRULE: format or just the rule content
    const rulePart = ruleString.startsWith('RRULE:') 
      ? ruleString.substring(6) 
      : ruleString;
    
    const ruleComponents = rulePart.split(';');
    const rules = {};
    
    ruleComponents.forEach(component => {
      const [key, value] = component.split('=');
      rules[key] = value;
    });
    
    // Parse the frequency
    const frequency = rules.FREQ || 'WEEKLY';
    
    // Parse interval (how often it repeats)
    const interval = parseInt(rules.INTERVAL || '1', 10);
    
    // Parse count (number of occurrences)
    const count = rules.COUNT ? parseInt(rules.COUNT, 10) : null;
    
    // Parse until date
    const until = rules.UNTIL ? new Date(rules.UNTIL) : null;
    
    // Parse days of week
    const byDay = rules.BYDAY ? rules.BYDAY.split(',') : [];
    
    // Parse days of month
    const byMonthDay = rules.BYMONTHDAY 
      ? rules.BYMONTHDAY.split(',').map(d => parseInt(d, 10)) 
      : [];
    
    // Parse months
    const byMonth = rules.BYMONTH 
      ? rules.BYMONTH.split(',').map(m => parseInt(m, 10)) 
      : [];
    
    // Parse position (e.g., for "first Monday")
    const bySetPos = rules.BYSETPOS 
      ? rules.BYSETPOS.split(',').map(p => parseInt(p, 10)) 
      : [];
    
    return {
      frequency,
      interval,
      count,
      until,
      byDay,
      byMonthDay,
      byMonth,
      bySetPos,
      originalRule: ruleString
    };
  }
  
  /**
   * Generates occurrence dates based on a recurrence rule
   * @param {Object} baseEvent The base event object
   * @param {Object} parsedRule The parsed recurrence rule
   * @param {Array} exceptions Dates to exclude
   * @returns {Array} Array of occurrence objects with start and end dates
   */
  generateOccurrences(baseEvent, parsedRule, exceptions = []) {
    // Get start and end dates from the base event
    const baseStart = new Date(baseEvent.start?.dateTime || baseEvent.dateTime);
    const baseEnd = new Date(baseEvent.end?.dateTime || baseEvent.endDateTime);
    
    // Calculate event duration in milliseconds
    const duration = baseEnd - baseStart;
    
    // Determine end date for the series (default to 1 year)
    let seriesEndDate = new Date(baseStart);
    seriesEndDate.setFullYear(seriesEndDate.getFullYear() + 1);
    
    // If there's an 'until' date, use that instead
    if (parsedRule.until && parsedRule.until <= seriesEndDate) {
      seriesEndDate = new Date(parsedRule.until);
    }
    
    // If there's a count, calculate the end date based on that
    // (This is an approximation, we'll still limit by count after generating dates)
    if (parsedRule.count) {
      const countEndDate = this.estimateEndDateFromCount(
        baseStart, 
        parsedRule.frequency, 
        parsedRule.interval, 
        parsedRule.count
      );
      
      if (countEndDate < seriesEndDate) {
        seriesEndDate = countEndDate;
      }
    }
    
    // Generate all occurrence dates based on frequency
    const occurrences = [];
    let currentDate = new Date(baseStart);
    let occurrenceCount = 0;
    const maxOccurrences = parsedRule.count || 100; // Limit to 100 if no count specified
    
    while (currentDate <= seriesEndDate && occurrenceCount < maxOccurrences) {
      // Skip the first occurrence if it's the base event
      if (occurrenceCount > 0) {
        // Check if this date should be skipped (exception)
        const isException = exceptions.some(exDate => {
          const exDay = new Date(exDate).toDateString();
          return currentDate.toDateString() === exDay;
        });
        
        if (!isException) {
          // Create start and end dates for this occurrence
          const occurrenceStart = new Date(currentDate);
          const occurrenceEnd = new Date(occurrenceStart.getTime() + duration);
          
          // Add to the list of occurrences
          occurrences.push({
            startDate: occurrenceStart,
            endDate: occurrenceEnd
          });
        }
      }
      
      // Move to the next occurrence based on frequency and interval
      currentDate = this.getNextDate(currentDate, parsedRule);
      occurrenceCount++;
    }
    
    return occurrences;
  }
  
  /**
   * Calculates the next occurrence date based on frequency and interval
   * @param {Date} current The current date
   * @param {Object} parsedRule The parsed recurrence rule
   * @returns {Date} The next occurrence date
   */
  getNextDate(current, parsedRule) {
    const next = new Date(current);
    const interval = parsedRule.interval || 1;
    
    switch (parsedRule.frequency) {
      case 'DAILY':
        next.setDate(next.getDate() + interval);
        break;
        
      case 'WEEKLY':
        next.setDate(next.getDate() + (7 * interval));
        break;
        
      case 'MONTHLY':
        next.setMonth(next.getMonth() + interval);
        break;
        
      case 'YEARLY':
        next.setFullYear(next.getFullYear() + interval);
        break;
        
      default:
        next.setDate(next.getDate() + interval);
    }
    
    return next;
  }
  
  /**
   * Estimates an end date based on count, frequency, and interval
   * @param {Date} startDate The start date
   * @param {string} frequency The frequency (DAILY, WEEKLY, etc.)
   * @param {number} interval The interval
   * @param {number} count The count of occurrences
   * @returns {Date} The estimated end date
   */
  estimateEndDateFromCount(startDate, frequency, interval, count) {
    const endDate = new Date(startDate);
    interval = interval || 1;
    
    switch (frequency) {
      case 'DAILY':
        endDate.setDate(endDate.getDate() + (count * interval));
        break;
        
      case 'WEEKLY':
        endDate.setDate(endDate.getDate() + (count * 7 * interval));
        break;
        
      case 'MONTHLY':
        endDate.setMonth(endDate.getMonth() + (count * interval));
        break;
        
      case 'YEARLY':
        endDate.setFullYear(endDate.getFullYear() + (count * interval));
        break;
        
      default:
        endDate.setDate(endDate.getDate() + (count * interval));
    }
    
    return endDate;
  }
  
  /**
   * Adds or updates an exception to a recurring series
   * @param {string} seriesId The series ID
   * @param {string} userId The user ID
   * @param {Date} exceptionDate The exception date
   * @param {Object} replacementEvent Optional replacement event for this date
   * @returns {Promise<Object>} Result object
   */
  async addSeriesException(seriesId, userId, exceptionDate, replacementEvent = null) {
    try {
      // Get the series metadata
      const seriesDoc = await getDoc(doc(db, "eventSeries", seriesId));
      
      if (!seriesDoc.exists()) {
        throw new Error(`Series with ID ${seriesId} not found`);
      }
      
      const seriesData = seriesDoc.data();
      
      // Format the exception date
      const exDate = new Date(exceptionDate);
      const exceptionDateString = exDate.toISOString();
      
      // Add to exceptions list
      const exceptions = seriesData.exceptions || [];
      if (!exceptions.includes(exceptionDateString)) {
        exceptions.push(exceptionDateString);
      }
      
      // Find the occurrence for this date
      const occurrencesToUpdate = [];
      for (const occurrenceId of seriesData.occurrenceIds) {
        const occurrenceDoc = await getDoc(doc(db, "events", occurrenceId));
        
        if (occurrenceDoc.exists()) {
          const occurrenceData = occurrenceDoc.data();
          const occurrenceDate = new Date(occurrenceData.start?.dateTime || occurrenceData.dateTime);
          
          // Check if this is the date we're excepting
          if (occurrenceDate.toDateString() === exDate.toDateString()) {
            occurrencesToUpdate.push({
              id: occurrenceId,
              data: occurrenceData
            });
          }
        }
      }
      
      // Update series metadata with new exceptions
      await updateDoc(doc(db, "eventSeries", seriesId), {
        exceptions,
        updatedAt: serverTimestamp()
      });
      
      // Update the occurrences with the exception info
      for (const occurrence of occurrencesToUpdate) {
        await updateDoc(doc(db, "events", occurrence.id), {
          'recurrence.exceptions': exceptions,
          'isException': true,
          updatedAt: serverTimestamp()
        });
      }
      
      // If there's a replacement event for this date, create it
      if (replacementEvent) {
        const replacementResult = await this.baseService.addEvent({
          ...replacementEvent,
          replacesSeriesId: seriesId,
          replacesDate: exceptionDateString,
          isSeriesException: true
        }, userId);
        
        return {
          success: true,
          exceptionDate: exceptionDateString,
          hasReplacement: true,
          replacementEventId: replacementResult.eventId
        };
      }
      
      return {
        success: true,
        exceptionDate: exceptionDateString,
        updatedOccurrences: occurrencesToUpdate.length
      };
      
    } catch (error) {
      console.error("Error adding series exception:", error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Calculates travel time between locations for an event
   * @param {string} originLocation Origin location
   * @param {string} destLocation Destination location
   * @param {Date} eventTime Event time (for traffic estimation)
   * @returns {Promise<Object>} Travel time details
   */
  async calculateTravelTime(originLocation, destLocation, eventTime) {
    try {
      // Skip calculation if locations not provided
      if (!originLocation || !destLocation) {
        return { 
          travelTimeMinutes: 0, 
          distanceKm: 0,
          hasTrafficData: false
        };
      }
      
      // Check cache first to avoid redundant calculations
      const cacheKey = `${originLocation}|${destLocation}|${eventTime?.getHours() || 0}`;
      
      if (this.travelTimeCache.has(cacheKey)) {
        return this.travelTimeCache.get(cacheKey);
      }
      
      // For demonstration purposes, we'll simulate a calculation here
      // In a real implementation, you would use the Google Maps API or similar
      
      // Simulation based on location string length and time of day
      const baseDistance = (originLocation.length + destLocation.length) / 10;
      const baseTime = baseDistance * 2; // 2 mins per km
      
      // Apply time-of-day factor (rush hour = more time)
      let trafficFactor = 1.0;
      if (eventTime) {
        const hour = eventTime.getHours();
        if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18)) {
          trafficFactor = 1.5; // Rush hour
        } else if (hour >= 22 || hour <= 5) {
          trafficFactor = 0.8; // Late night
        }
      }
      
      const travelTimeMinutes = Math.round(baseTime * trafficFactor);
      const distanceKm = baseDistance;
      
      const result = {
        travelTimeMinutes,
        distanceKm,
        hasTrafficData: true,
        trafficConditions: trafficFactor > 1.2 ? 'heavy' : 
                          trafficFactor < 0.9 ? 'light' : 'normal'
      };
      
      // Cache the result
      this.travelTimeCache.set(cacheKey, result);
      
      return result;
      
    } catch (error) {
      console.error("Error calculating travel time:", error);
      return { 
        travelTimeMinutes: 15, // Fallback default
        distanceKm: 5,
        hasTrafficData: false
      };
    }
  }
  
  /**
   * Detects potential scheduling conflicts for an event
   * @param {Object} newEvent The new event to check
   * @param {string} userId The user ID
   * @returns {Promise<Object>} Conflict details
   */
  async detectSchedulingConflicts(newEvent, userId) {
    try {
      // Get event's date/time information
      const eventStart = new Date(newEvent.start?.dateTime || newEvent.dateTime);
      const eventEnd = new Date(newEvent.end?.dateTime || newEvent.endDateTime);
      
      // Define conflict buffer (15 mins by default)
      const bufferMs = 15 * 60 * 1000;
      
      // Search window (expand the search a bit before and after)
      const searchStart = new Date(eventStart.getTime() - bufferMs);
      const searchEnd = new Date(eventEnd.getTime() + bufferMs);
      
      // Get all events in this time range
      const events = await this.baseService.getEventsForUser(
        userId, 
        searchStart, 
        searchEnd
      );
      
      const conflicts = [];
      
      // Check each event for overlap
      for (const existingEvent of events) {
        // Skip if this is the same event (for updates)
        if (existingEvent.id === newEvent.id) continue;
        
        // Get existing event's date/time
        const existingStart = new Date(
          existingEvent.start?.dateTime || 
          existingEvent.dateTime
        );
        
        const existingEnd = new Date(
          existingEvent.end?.dateTime || 
          existingEvent.endDateTime
        );
        
        // Check for overlap
        const hasOverlap = (
          (eventStart < existingEnd && eventEnd > existingStart) || 
          (Math.abs(eventStart - existingStart) < bufferMs) ||
          (Math.abs(eventEnd - existingEnd) < bufferMs)
        );
        
        if (hasOverlap) {
          conflicts.push({
            eventId: existingEvent.id,
            title: existingEvent.title || existingEvent.summary,
            start: existingStart.toISOString(),
            end: existingEnd.toISOString(),
            overlapType: (
              Math.abs(eventStart - existingStart) < bufferMs ? 'start-conflict' :
              Math.abs(eventEnd - existingEnd) < bufferMs ? 'end-conflict' :
              'full-overlap'
            )
          });
        }
      }
      
      // Check travel time conflicts if event has location
      if (newEvent.location && conflicts.length === 0) {
        for (const existingEvent of events) {
          // Skip if this is the same event
          if (existingEvent.id === newEvent.id) continue;
          
          // Skip if the existing event has no location
          if (!existingEvent.location) continue;
          
          // Get existing event's date/time
          const existingStart = new Date(
            existingEvent.start?.dateTime || 
            existingEvent.dateTime
          );
          
          const existingEnd = new Date(
            existingEvent.end?.dateTime || 
            existingEvent.endDateTime
          );
          
          // Check if events are on the same day and sequential
          const isSameDay = existingStart.toDateString() === eventStart.toDateString();
          const isSequential = (
            (existingEnd <= eventStart && 
             existingEnd.getTime() + (3 * 60 * 60 * 1000) >= eventStart.getTime()) ||
            (eventEnd <= existingStart && 
             eventEnd.getTime() + (3 * 60 * 60 * 1000) >= existingStart.getTime())
          );
          
          if (isSameDay && isSequential) {
            // Calculate travel time between locations
            let originLocation, destLocation, departureTime;
            
            if (existingEnd <= eventStart) {
              // Existing event is before new event
              originLocation = existingEvent.location;
              destLocation = newEvent.location;
              departureTime = existingEnd;
            } else {
              // New event is before existing event
              originLocation = newEvent.location;
              destLocation = existingEvent.location;
              departureTime = eventEnd;
            }
            
            const travelInfo = await this.calculateTravelTime(
              originLocation,
              destLocation,
              departureTime
            );
            
            // Check if travel time creates a conflict
            const travelTimeMs = travelInfo.travelTimeMinutes * 60 * 1000;
            const availableTimeMs = Math.abs(
              existingEnd <= eventStart ? 
                eventStart - existingEnd : 
                existingStart - eventEnd
            );
            
            if (travelTimeMs > availableTimeMs) {
              conflicts.push({
                eventId: existingEvent.id,
                title: existingEvent.title || existingEvent.summary,
                start: existingStart.toISOString(),
                end: existingEnd.toISOString(),
                overlapType: 'travel-time-conflict',
                travelInfo: {
                  origin: originLocation,
                  destination: destLocation,
                  travelTimeMinutes: travelInfo.travelTimeMinutes,
                  availableTimeMinutes: Math.floor(availableTimeMs / (60 * 1000)),
                  shortfallMinutes: Math.ceil((travelTimeMs - availableTimeMs) / (60 * 1000))
                }
              });
            }
          }
        }
      }
      
      return {
        success: true,
        hasConflicts: conflicts.length > 0,
        conflicts,
        conflictCount: conflicts.length
      };
      
    } catch (error) {
      console.error("Error detecting scheduling conflicts:", error);
      return { 
        success: false, 
        error: error.message,
        hasConflicts: false,
        conflicts: []
      };
    }
  }
  
  /**
   * Updates all events in a recurring series
   * @param {string} seriesId The series ID
   * @param {Object} updateData The update data for all events
   * @param {string} userId The user ID
   * @returns {Promise<Object>} Result object
   */
  async updateRecurringSeries(seriesId, updateData, userId) {
    try {
      // Get the series metadata
      const seriesDoc = await getDoc(doc(db, "eventSeries", seriesId));
      
      if (!seriesDoc.exists()) {
        throw new Error(`Series with ID ${seriesId} not found`);
      }
      
      const seriesData = seriesDoc.data();
      
      // Update the base event first
      if (seriesData.baseEventId) {
        await this.baseService.updateEvent(
          seriesData.baseEventId, 
          updateData, 
          userId
        );
      }
      
      // Update all occurrences
      const updatePromises = [];
      
      for (const occurrenceId of seriesData.occurrenceIds) {
        updatePromises.push(
          this.baseService.updateEvent(occurrenceId, updateData, userId)
        );
      }
      
      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      // Update the series metadata
      await updateDoc(doc(db, "eventSeries", seriesId), {
        title: updateData.title || updateData.summary || seriesData.title,
        eventType: updateData.eventType || updateData.category || seriesData.eventType,
        updatedAt: serverTimestamp()
      });
      
      return {
        success: true,
        seriesId,
        updatedCount: 1 + seriesData.occurrenceIds.length
      };
      
    } catch (error) {
      console.error("Error updating recurring series:", error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Shares a calendar event with another user or family
   * @param {string} eventId The event ID
   * @param {string} shareWithUserId The user ID to share with
   * @param {string} ownerId The owner's user ID
   * @returns {Promise<Object>} Result object
   */
  async shareCalendarEvent(eventId, shareWithUserId, ownerId) {
    try {
      // Get the event
      const eventRef = doc(db, "events", eventId);
      const eventSnapshot = await getDoc(eventRef);
      
      if (!eventSnapshot.exists()) {
        throw new Error(`Event with ID ${eventId} not found`);
      }
      
      const eventData = eventSnapshot.data();
      
      // Create a shared event version
      const sharedEventData = {
        ...eventData,
        originalId: eventId,
        originalOwnerId: ownerId,
        isShared: true,
        sharedBy: ownerId,
        sharedAt: new Date().toISOString(),
        userId: shareWithUserId, // Set the new owner ID
        sharedEvent: true
      };
      
      // Remove the Firestore ID
      delete sharedEventData.firestoreId;
      
      // Add as a new event for the recipient
      const addResult = await this.baseService.addEvent(
        sharedEventData, 
        shareWithUserId
      );
      
      // Update the original event with sharing info
      await updateDoc(eventRef, {
        'sharing.isShared': true,
        'sharing.sharedWith': Firebase.firestore.FieldValue.arrayUnion(shareWithUserId),
        'sharing.sharedEventIds': Firebase.firestore.FieldValue.arrayUnion(addResult.eventId),
        updatedAt: serverTimestamp()
      });
      
      return {
        success: true,
        originalEventId: eventId,
        sharedEventId: addResult.eventId,
        sharedWithUserId: shareWithUserId
      };
      
    } catch (error) {
      console.error("Error sharing calendar event:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Suggests optimal scheduling for a new event based on existing calendar
   * @param {Object} eventDetails The event details (duration, preferences)
   * @param {string} userId The user ID
   * @returns {Promise<Object>} Suggested time slots
   */
  async suggestOptimalScheduling(eventDetails, userId) {
    try {
      // Get event parameters
      const durationMinutes = eventDetails.durationMinutes || 60;
      const earliestDate = new Date(eventDetails.earliestDate || Date.now());
      const latestDate = new Date(eventDetails.latestDate || Date.now() + 14 * 24 * 60 * 60 * 1000); // 2 weeks out
      const preferredDayOfWeek = eventDetails.preferredDayOfWeek; // 0-6, where 0 is Sunday
      const preferredTimeOfDay = eventDetails.preferredTimeOfDay; // 'morning', 'afternoon', 'evening'
      
      // Get all events in the date range
      const events = await this.baseService.getEventsForUser(
        userId, 
        earliestDate, 
        latestDate
      );
      
      // Convert to busy time blocks
      const busyBlocks = events.map(event => {
        const start = new Date(event.start?.dateTime || event.dateTime);
        const end = new Date(event.end?.dateTime || event.endDateTime);
        
        // Add buffer time
        const bufferMs = 15 * 60 * 1000; // 15 minutes
        start.setTime(start.getTime() - bufferMs);
        end.setTime(end.getTime() + bufferMs);
        
        return { start, end };
      });
      
      // Sort busy blocks by start time
      busyBlocks.sort((a, b) => a.start - b.start);
      
      // Merge overlapping blocks
      const mergedBusyBlocks = [];
      for (const block of busyBlocks) {
        if (mergedBusyBlocks.length === 0) {
          mergedBusyBlocks.push(block);
          continue;
        }
        
        const lastBlock = mergedBusyBlocks[mergedBusyBlocks.length - 1];
        
        if (block.start <= lastBlock.end) {
          // Merge blocks
          lastBlock.end = new Date(Math.max(lastBlock.end, block.end));
        } else {
          // Add as new block
          mergedBusyBlocks.push(block);
        }
      }
      
      // Define working hours
      const workingHoursStart = 9; // 9 AM
      const workingHoursEnd = 21; // 9 PM
      
      // Generate potential time slots
      const potentialSlots = [];
      const durationMs = durationMinutes * 60 * 1000;
      let currentDate = new Date(earliestDate);
      
      while (currentDate <= latestDate) {
        // Skip if not preferred day of week
        if (preferredDayOfWeek !== undefined && 
            currentDate.getDay() !== preferredDayOfWeek) {
          currentDate.setDate(currentDate.getDate() + 1);
          currentDate.setHours(0, 0, 0, 0);
          continue;
        }
        
        // Define time ranges based on preferred time of day
        let startHour, endHour;
        
        if (preferredTimeOfDay === 'morning') {
          startHour = 9;  // 9 AM
          endHour = 12;   // 12 PM
        } else if (preferredTimeOfDay === 'afternoon') {
          startHour = 12; // 12 PM
          endHour = 17;   // 5 PM
        } else if (preferredTimeOfDay === 'evening') {
          startHour = 17; // 5 PM
          endHour = 21;   // 9 PM
        } else {
          startHour = workingHoursStart;
          endHour = workingHoursEnd;
        }
        
        // Set start time to the specified hour on the current date
        const dayStart = new Date(currentDate);
        dayStart.setHours(startHour, 0, 0, 0);
        
        // If we're already past this time today, start from next slot
        if (dayStart < new Date() && dayStart.toDateString() === new Date().toDateString()) {
          const now = new Date();
          const roundedMinutes = Math.ceil(now.getMinutes() / 30) * 30;
          dayStart.setHours(now.getHours(), roundedMinutes, 0, 0);
        }
        
        // Set end time to the specified hour on the current date
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(endHour, 0, 0, 0);
        
        // Check 30-minute slots throughout the day
        let slotStart = new Date(dayStart);
        
        while (slotStart.getTime() + durationMs <= dayEnd.getTime()) {
          const slotEnd = new Date(slotStart.getTime() + durationMs);
          
          // Check if this slot conflicts with any busy blocks
          let hasConflict = false;
          
          for (const busyBlock of mergedBusyBlocks) {
            if (slotStart < busyBlock.end && slotEnd > busyBlock.start) {
              hasConflict = true;
              break;
            }
          }
          
          if (!hasConflict) {
            // Score the slot based on various factors
            let score = 100; // Base score
            
            // Prefer slots closer to now
            const daysOut = Math.floor((slotStart - new Date()) / (24 * 60 * 60 * 1000));
            score -= daysOut * 2; // Reduce score for days farther out
            
            // Prefer middle of the preferred time range
            const timeRangeMidpoint = (startHour + endHour) / 2;
            const slotHour = slotStart.getHours() + (slotStart.getMinutes() / 60);
            const hourDiff = Math.abs(slotHour - timeRangeMidpoint);
            score -= hourDiff * 5; // Reduce score for times farther from midpoint
            
            // Add this slot to potential slots
            potentialSlots.push({
              start: slotStart.toISOString(),
              end: slotEnd.toISOString(),
              score,
              dayOfWeek: slotStart.getDay(),
              timeOfDay: 
                slotHour < 12 ? 'morning' :
                slotHour < 17 ? 'afternoon' : 'evening'
            });
          }
          
          // Move to next slot (30-minute increments)
          slotStart.setMinutes(slotStart.getMinutes() + 30);
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(0, 0, 0, 0);
      }
      
      // Sort slots by score (highest first)
      potentialSlots.sort((a, b) => b.score - a.score);
      
      // Return top 5 slots
      return {
        success: true,
        suggestedSlots: potentialSlots.slice(0, 5)
      };
      
    } catch (error) {
      console.error("Error suggesting optimal scheduling:", error);
      return { success: false, error: error.message, suggestedSlots: [] };
    }
  }
}

export default new EnhancedCalendarService();