/**
 * Event Factory
 *
 * Creates calendar events with correct patterns enforced:
 * - Security userId field (REQUIRED for Firestore queries)
 * - Timestamp duality (both Firestore Timestamp and ISO string)
 * - Required fields with validation
 *
 * Usage:
 *   import { createEvent } from './factories/EventFactory';
 *   const event = createEvent({
 *     familyId: 'family_123',
 *     userId: 'user_123',
 *     title: 'Doctor Appointment',
 *     startDate: new Date()
 *   });
 */

import { validateEvent } from '../utils/dataValidation';
import { Timestamp } from 'firebase/firestore';

/**
 * Create a calendar event with all required security fields
 *
 * CRITICAL: userId is REQUIRED for Firestore security rules
 * Events without userId will fail security queries
 *
 * @param {Object} data - Event data
 * @param {string} data.familyId - Family ID (required for security)
 * @param {string} data.userId - User ID (required for security)
 * @param {string} data.title - Event title
 * @param {Date|Timestamp} data.startDate - Start date/time
 * @param {Date|Timestamp} [data.endDate] - End date/time (defaults to startDate + 1 hour)
 * @param {string} [data.description] - Event description
 * @param {boolean} [data.allDay=false] - All day event
 * @param {string} [data.location] - Event location
 * @param {'google'|'manual'} [data.source='manual'] - Event source
 * @param {string} [data.googleEventId] - Google Calendar ID (if source='google')
 * @param {string} [data.category] - Event category
 * @param {Array<Object>} [data.reminders] - Reminder objects
 * @param {Array<string>} [data.attendees] - Attendee names
 * @param {Object} [options] - Options
 * @param {boolean} [options.skipValidation] - Skip validation
 * @returns {Object} Complete event object
 * @throws {Error} If validation fails
 */
export function createEvent(data, options = {}) {
  const {
    familyId,
    userId,
    title,
    startDate: startDateInput,
    endDate: endDateInput,
    description = '',
    allDay = false,
    location = '',
    source = 'manual',
    googleEventId,
    category,
    reminders = [],
    attendees = []
  } = data;

  // CRITICAL: Validate required security fields
  if (!familyId) {
    throw new Error('familyId is required for event creation (security)');
  }
  if (!userId) {
    throw new Error('userId is required for event creation (security rules)');
  }

  // Convert dates to both formats (Timestamp duality)
  const startDate = startDateInput instanceof Date
    ? startDateInput
    : (startDateInput?.toDate ? startDateInput.toDate() : new Date(startDateInput));

  const endDate = endDateInput
    ? (endDateInput instanceof Date ? endDateInput : endDateInput.toDate())
    : new Date(startDate.getTime() + 60 * 60 * 1000); // Default: 1 hour after start

  // Build complete event object
  const event = {
    // Security fields (CRITICAL - required for Firestore queries)
    familyId,
    userId,

    // Core fields
    title,
    description,

    // Timestamp Duality (BOTH formats required)
    startTime: Timestamp.fromDate(startDate),  // Firestore Timestamp (for queries)
    endTime: Timestamp.fromDate(endDate),
    startDate: startDate.toISOString(),        // ISO string (for display/compatibility)
    endDate: endDate.toISOString(),

    allDay,
    location,

    // Source tracking
    source,
    ...(googleEventId && { googleEventId }),

    // Optional fields
    ...(category && { category }),
    reminders,
    attendees,

    // Timestamps
    createdAt: data.createdAt || Timestamp.now(),
    updatedAt: data.updatedAt || Timestamp.now()
  };

  // Validate unless explicitly skipped
  if (!options.skipValidation) {
    const validation = validateEvent(event);
    if (!validation.valid) {
      throw new Error(`Invalid event: ${validation.errors.join(', ')}`);
    }
  }

  return event;
}

/**
 * Create multiple events at once
 *
 * @param {Array<Object>} eventsData - Array of event data
 * @param {Object} options - Options for all events
 * @returns {Array<Object>} Array of complete event objects
 */
export function createEvents(eventsData, options = {}) {
  return eventsData.map(data => createEvent(data, options));
}

/**
 * Update an event while preserving required fields
 *
 * @param {Object} existingEvent - Current event object
 * @param {Object} updates - Fields to update
 * @returns {Object} Updated event
 */
export function updateEvent(existingEvent, updates = {}) {
  const updatedDate = updates.startDate
    ? (updates.startDate instanceof Date ? updates.startDate : new Date(updates.startDate))
    : null;

  return {
    ...existingEvent,
    ...updates,
    // Update timestamp duality if date changed
    ...(updatedDate && {
      startTime: Timestamp.fromDate(updatedDate),
      startDate: updatedDate.toISOString()
    }),
    updatedAt: Timestamp.now()
  };
}

/**
 * Create a recurring event series
 *
 * @param {Object} eventData - Base event data
 * @param {Object} recurrence - Recurrence options
 * @param {number} recurrence.count - Number of occurrences
 * @param {'daily'|'weekly'|'monthly'} recurrence.frequency - Recurrence frequency
 * @returns {Array<Object>} Array of event objects
 */
export function createRecurringEvents(eventData, recurrence) {
  const { count, frequency } = recurrence;
  const events = [];

  for (let i = 0; i < count; i++) {
    const startDate = new Date(eventData.startDate);

    // Calculate occurrence date
    switch (frequency) {
      case 'daily':
        startDate.setDate(startDate.getDate() + i);
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() + (i * 7));
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() + i);
        break;
    }

    const endDate = new Date(startDate);
    if (eventData.endDate) {
      const duration = new Date(eventData.endDate) - new Date(eventData.startDate);
      endDate.setTime(startDate.getTime() + duration);
    }

    events.push(createEvent({
      ...eventData,
      startDate,
      endDate
    }));
  }

  return events;
}

/**
 * Create event with reminder
 *
 * @param {Object} eventData - Event data
 * @param {Array<number>} reminderMinutes - Array of minutes before event (e.g., [15, 60])
 * @returns {Object} Event with reminders
 */
export function createEventWithReminders(eventData, reminderMinutes = [15]) {
  return createEvent({
    ...eventData,
    reminders: reminderMinutes.map(minutes => ({
      minutes,
      method: 'popup'
    }))
  });
}

export default {
  createEvent,
  createEvents,
  updateEvent,
  createRecurringEvents,
  createEventWithReminders
};
