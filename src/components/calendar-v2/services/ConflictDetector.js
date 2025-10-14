// Smart conflict detection for calendar events
import { differenceInMinutes, isWithinInterval, addMinutes, subMinutes } from 'date-fns';

export class ConflictDetector {
  constructor() {
    this.travelTimeEstimates = {
      default: 15, // minutes
      farLocation: 30,
      sameLocation: 0
    };
  }

  // Detect all types of conflicts for a new/updated event
  detectConflicts(newEvent, existingEvents, familyMembers) {
    const conflicts = {
      timeConflicts: [],
      travelTimeConflicts: [],
      resourceConflicts: [],
      warnings: [],
      suggestions: []
    };

    // Filter events that might conflict (same day range)
    const potentialConflicts = existingEvents.filter(event => {
      const eventDate = new Date(event.startTime);
      const newEventDate = new Date(newEvent.startTime);
      return eventDate.toDateString() === newEventDate.toDateString();
    });

    // Check each potential conflict
    potentialConflicts.forEach(existingEvent => {
      // Skip if it's the same event (for updates)
      if (existingEvent.id === newEvent.id) return;

      // 1. Direct time conflicts
      if (this.eventsOverlap(newEvent, existingEvent)) {
        const conflictInfo = this.analyzeTimeConflict(newEvent, existingEvent, familyMembers);
        conflicts.timeConflicts.push(conflictInfo);
      }

      // 2. Travel time conflicts
      const travelConflict = this.checkTravelTimeConflict(newEvent, existingEvent);
      if (travelConflict) {
        conflicts.travelTimeConflicts.push(travelConflict);
      }
    });

    // 3. Resource conflicts (same location, equipment, etc.)
    const resourceConflicts = this.checkResourceConflicts(newEvent, potentialConflicts);
    conflicts.resourceConflicts = resourceConflicts;

    // 4. Generate warnings and suggestions
    conflicts.warnings = this.generateWarnings(newEvent, conflicts);
    conflicts.suggestions = this.generateSuggestions(newEvent, conflicts, existingEvents);

    return conflicts;
  }

  // Check if two events overlap in time
  eventsOverlap(event1, event2) {
    const start1 = new Date(event1.startTime);
    const end1 = new Date(event1.endTime);
    const start2 = new Date(event2.startTime);
    const end2 = new Date(event2.endTime);

    return (start1 < end2 && end1 > start2);
  }

  // Analyze the nature of a time conflict
  analyzeTimeConflict(newEvent, existingEvent, familyMembers) {
    const sharedAttendees = this.getSharedAttendees(newEvent, existingEvent);
    
    return {
      event: existingEvent,
      type: 'time_overlap',
      severity: sharedAttendees.length > 0 ? 'high' : 'medium',
      sharedAttendees,
      message: this.getConflictMessage(newEvent, existingEvent, sharedAttendees, familyMembers)
    };
  }

  // Get attendees that are in both events
  getSharedAttendees(event1, event2) {
    if (!event1.attendees || !event2.attendees) return [];
    
    return event1.attendees.filter(a1 => 
      event2.attendees.some(a2 => a2.familyMemberId === a1.familyMemberId)
    );
  }

  // Generate human-readable conflict message
  getConflictMessage(newEvent, existingEvent, sharedAttendees, familyMembers) {
    if (sharedAttendees.length === 0) {
      return `Time conflict with "${existingEvent.title}"`;
    }

    const attendeeNames = sharedAttendees.map(attendee => {
      const member = familyMembers.find(m => m.id === attendee.familyMemberId);
      return member ? member.name : 'Unknown';
    });

    if (attendeeNames.length === 1) {
      return `${attendeeNames[0]} is already scheduled for "${existingEvent.title}"`;
    } else {
      return `${attendeeNames.join(' and ')} are already scheduled for "${existingEvent.title}"`;
    }
  }

  // Check if there's enough travel time between events
  checkTravelTimeConflict(event1, event2) {
    // Skip if no locations
    if (!event1.location || !event2.location) return null;

    const end1 = new Date(event1.endTime);
    const start1 = new Date(event1.startTime);
    const end2 = new Date(event2.endTime);
    const start2 = new Date(event2.startTime);

    let travelTime = this.travelTimeEstimates.default;
    let conflictType = null;
    let eventBefore = null;
    let eventAfter = null;

    // Check if event1 ends right before event2 starts
    if (end1 <= start2 && differenceInMinutes(start2, end1) < travelTime) {
      conflictType = 'insufficient_travel_time';
      eventBefore = event1;
      eventAfter = event2;
    }
    // Check if event2 ends right before event1 starts
    else if (end2 <= start1 && differenceInMinutes(start1, end2) < travelTime) {
      conflictType = 'insufficient_travel_time';
      eventBefore = event2;
      eventAfter = event1;
    }

    if (conflictType) {
      const timeBetween = Math.abs(
        eventBefore === event1 
          ? differenceInMinutes(start2, end1)
          : differenceInMinutes(start1, end2)
      );

      return {
        type: conflictType,
        eventBefore,
        eventAfter,
        requiredTime: travelTime,
        availableTime: timeBetween,
        message: `Only ${timeBetween} minutes between "${eventBefore.title}" and "${eventAfter.title}" - may not be enough travel time`
      };
    }

    return null;
  }

  // Check for resource conflicts (same venue, equipment, etc.)
  checkResourceConflicts(newEvent, existingEvents) {
    const conflicts = [];

    existingEvents.forEach(event => {
      // Skip if it's the same event or no time overlap
      if (event.id === newEvent.id || !this.eventsOverlap(newEvent, event)) {
        return;
      }

      // Check location conflicts
      if (newEvent.location && event.location && 
          this.isSameLocation(newEvent.location, event.location)) {
        conflicts.push({
          type: 'location',
          event,
          resource: newEvent.location,
          message: `Same location "${this.getLocationName(newEvent.location)}" is booked for "${event.title}"`
        });
      }
    });

    return conflicts;
  }

  // Check if two locations are the same
  isSameLocation(loc1, loc2) {
    // Handle different location formats
    if (typeof loc1 === 'string' && typeof loc2 === 'string') {
      return loc1.toLowerCase() === loc2.toLowerCase();
    }
    
    if (loc1.name && loc2.name) {
      return loc1.name.toLowerCase() === loc2.name.toLowerCase();
    }

    return false;
  }

  getLocationName(location) {
    return typeof location === 'string' ? location : location.name || 'Unknown location';
  }

  // Generate warnings based on conflicts and event details
  generateWarnings(event, conflicts) {
    const warnings = [];

    // Warning for dinner time events
    const eventHour = new Date(event.startTime).getHours();
    if (eventHour >= 17 && eventHour <= 19) {
      warnings.push({
        type: 'dinner_time',
        message: 'This event is scheduled during typical dinner time (5-7 PM)'
      });
    }

    // Warning for late events with children
    if (eventHour >= 20 && this.hasChildAttendees(event)) {
      warnings.push({
        type: 'late_for_children',
        message: 'This event may be too late for children (after 8 PM)'
      });
    }

    // Warning for back-to-back events
    if (conflicts.travelTimeConflicts.length > 0) {
      warnings.push({
        type: 'back_to_back',
        message: 'Back-to-back events may be stressful'
      });
    }

    // Warning for multiple conflicts
    if (conflicts.timeConflicts.length > 2) {
      warnings.push({
        type: 'busy_time',
        message: 'This time slot appears to be very busy for your family'
      });
    }

    return warnings;
  }

  // Generate smart suggestions to resolve conflicts
  generateSuggestions(event, conflicts, allEvents) {
    const suggestions = [];

    // If there are time conflicts, suggest alternative times
    if (conflicts.timeConflicts.length > 0) {
      const alternativeTimes = this.findAlternativeTimes(event, allEvents);
      alternativeTimes.forEach(time => {
        suggestions.push({
          type: 'alternative_time',
          startTime: time.start,
          endTime: time.end,
          message: `Move to ${this.formatTimeSlot(time.start, time.end)}`,
          reason: time.reason
        });
      });
    }

    // If there are travel time conflicts, suggest buffer time
    if (conflicts.travelTimeConflicts.length > 0) {
      suggestions.push({
        type: 'add_buffer',
        message: 'Add 15-30 minutes buffer time between events',
        action: 'extend_duration'
      });
    }

    // If busy time, suggest different day
    if (conflicts.warnings.some(w => w.type === 'busy_time')) {
      const lessGusyDays = this.findLessBusyDays(event, allEvents);
      lessGusyDays.forEach(day => {
        suggestions.push({
          type: 'alternative_day',
          date: day.date,
          message: `Move to ${day.date.toLocaleDateString()} - ${day.reason}`,
          eventCount: day.eventCount
        });
      });
    }

    return suggestions;
  }

  // Find available time slots on the same day
  findAlternativeTimes(event, allEvents) {
    const alternatives = [];
    const eventDate = new Date(event.startTime);
    const duration = differenceInMinutes(new Date(event.endTime), new Date(event.startTime));
    
    // Get all events on the same day
    const sameDayEvents = allEvents.filter(e => {
      const eDate = new Date(e.startTime);
      return eDate.toDateString() === eventDate.toDateString();
    }).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    // Common time slots to check
    const timeSlots = [
      { hour: 9, minute: 0, reason: 'Morning slot' },
      { hour: 10, minute: 30, reason: 'Mid-morning slot' },
      { hour: 13, minute: 0, reason: 'After lunch slot' },
      { hour: 15, minute: 0, reason: 'Afternoon slot' },
      { hour: 16, minute: 30, reason: 'Late afternoon slot' }
    ];

    timeSlots.forEach(slot => {
      const slotStart = new Date(eventDate);
      slotStart.setHours(slot.hour, slot.minute, 0, 0);
      const slotEnd = addMinutes(slotStart, duration);

      // Check if this slot is available
      const hasConflict = sameDayEvents.some(e => 
        this.eventsOverlap(
          { startTime: slotStart, endTime: slotEnd },
          { startTime: e.startTime, endTime: e.endTime }
        )
      );

      if (!hasConflict && slotStart > new Date()) {
        alternatives.push({
          start: slotStart,
          end: slotEnd,
          reason: slot.reason
        });
      }
    });

    return alternatives.slice(0, 3); // Return top 3 suggestions
  }

  // Find less busy days
  findLessBusyDays(event, allEvents) {
    const suggestions = [];
    const currentDate = new Date(event.startTime);
    
    // Check next 7 days
    for (let i = 1; i <= 7; i++) {
      const checkDate = new Date(currentDate);
      checkDate.setDate(checkDate.getDate() + i);
      
      const eventsOnDay = allEvents.filter(e => {
        const eDate = new Date(e.startTime);
        return eDate.toDateString() === checkDate.toDateString();
      });

      if (eventsOnDay.length < 3) {
        suggestions.push({
          date: checkDate,
          eventCount: eventsOnDay.length,
          reason: eventsOnDay.length === 0 ? 'No events scheduled' : `Only ${eventsOnDay.length} event(s)`
        });
      }
    }

    return suggestions.slice(0, 2);
  }

  // Format time slot for display
  formatTimeSlot(start, end) {
    const startStr = start.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    const endStr = end.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    return `${startStr} - ${endStr}`;
  }

  // Check if event has child attendees
  hasChildAttendees(event) {
    // This would need to check against family member data
    // For now, check if it's a child-related category
    const childCategories = ['school', 'sports', 'birthday'];
    return childCategories.includes(event.category);
  }
}