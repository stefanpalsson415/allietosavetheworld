// src/services/CalendarIntegrationService.js
// Removed circular dependency: CalendarService will be imported dynamically where needed
import EventParserService from './EventParserService';
import googleAuthService from './GoogleAuthService';
import enhancedCalendarSyncService from './EnhancedCalendarSyncService';
import { format, parseISO, addDays, addWeeks, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { auth, db } from './firebase';
import { collection, doc, setDoc, getDoc, updateDoc, serverTimestamp, writeBatch, query, where, getDocs } from 'firebase/firestore';

class CalendarIntegrationService {
  static unifiedEventContext = null;
  
  // Set the UnifiedEventContext reference
  static setUnifiedEventContext(context) {
    this.unifiedEventContext = context;
  }

  // Helper function to recursively remove undefined values from objects
  static cleanUndefinedValues(obj) {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanUndefinedValues(item)).filter(item => item !== undefined);
    }
    
    if (typeof obj === 'object' && obj.constructor === Object) {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          const cleanedValue = this.cleanUndefinedValues(value);
          if (cleanedValue !== undefined) {
            cleaned[key] = cleanedValue;
          }
        }
      }
      return cleaned;
    }
    
    return obj;
  }
  // Parse natural language to event data
  static async parseEventFromText(text, familyMembers = []) {
    try {
      // Use EventParserService for complex parsing
      const parsedEvent = await EventParserService.parseEventDetails(text);
      
      // Enhance with additional context
      if (parsedEvent) {
        // Try to match family member names in the text
        const memberMentioned = familyMembers.find(member => 
          text.toLowerCase().includes(member.name.toLowerCase())
        );
        
        if (memberMentioned && !parsedEvent.assignedTo) {
          parsedEvent.assignedTo = memberMentioned.id;
        }
        
        // Detect event categories from keywords
        parsedEvent.category = this.detectCategory(text);
        
        // Add recurrence if mentioned
        parsedEvent.recurrence = this.detectRecurrence(text);
        
        return parsedEvent;
      }
      
      // Fallback to simple parsing
      return this.simpleEventParse(text);
    } catch (error) {
      console.error('Error parsing event from text:', error);
      return null;
    }
  }

  // Detect event category from text
  static detectCategory(text) {
    const lowerText = text.toLowerCase();
    
    const categoryKeywords = {
      medical: ['doctor', 'dentist', 'appointment', 'checkup', 'medical', 'hospital', 'clinic'],
      school: ['school', 'class', 'homework', 'exam', 'test', 'parent-teacher', 'pta'],
      work: ['work', 'meeting', 'conference', 'presentation', 'deadline', 'office'],
      social: ['party', 'birthday', 'dinner', 'lunch', 'coffee', 'playdate', 'visit'],
      shopping: ['shopping', 'grocery', 'store', 'buy', 'purchase', 'mall'],
      exercise: ['gym', 'workout', 'exercise', 'yoga', 'run', 'swim', 'sports', 'practice'],
      family: ['family', 'together', 'outing', 'vacation', 'trip']
    };
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category;
      }
    }
    
    return 'personal';
  }

  // Detect recurrence pattern from text
  static detectRecurrence(text) {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('every day') || lowerText.includes('daily')) {
      return 'daily';
    } else if (lowerText.includes('every week') || lowerText.includes('weekly')) {
      return 'weekly';
    } else if (lowerText.includes('every month') || lowerText.includes('monthly')) {
      return 'monthly';
    }
    
    return 'none';
  }

  // Simple event parsing fallback
  static simpleEventParse(text) {
    // Extract date patterns
    const tomorrow = /tomorrow/i.test(text);
    const nextWeek = /next week/i.test(text);
    const timeMatch = text.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
    
    let eventDate = new Date();
    if (tomorrow) {
      eventDate = addDays(eventDate, 1);
    } else if (nextWeek) {
      eventDate = addWeeks(eventDate, 1);
    }
    
    let startTime = '09:00';
    if (timeMatch) {
      const [, hours, minutes = '00', period] = timeMatch;
      let hour = parseInt(hours);
      if (period?.toLowerCase() === 'pm' && hour < 12) hour += 12;
      if (period?.toLowerCase() === 'am' && hour === 12) hour = 0;
      startTime = `${hour.toString().padStart(2, '0')}:${minutes}`;
    }
    
    // Extract title (first sentence or line)
    const title = text.split(/[.!?\n]/)[0].trim();
    
    return {
      title: title || 'New Event',
      startDate: format(eventDate, 'yyyy-MM-dd'),
      startTime,
      endTime: format(addDays(parseISO(`2000-01-01T${startTime}`), 0), 'HH:mm'),
      description: text,
      category: this.detectCategory(text),
      recurrence: this.detectRecurrence(text)
    };
  }

  // Create event from Allie chat
  static async createEventFromChat(eventData, familyId) {
    try {
      // Ensure familyId is present
      if (!familyId) {
        familyId = localStorage.getItem('selectedFamilyId');
        if (!familyId) {
          throw new Error('Family ID is required for event creation');
        }
      }

      const event = {
        ...eventData,
        id: eventData.id || `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        familyId,
        createdAt: new Date().toISOString(),
        createdBy: 'allie-ai',
        source: 'chat',
        status: 'active' // Ensure status is set for queries
      };

      // Skip UnifiedEventContext for now - it's not initialized properly
      // Always use CalendarService directly
      console.log('Using CalendarService directly for event creation');

      // Import CalendarService dynamically to avoid circular deps
      const CalendarService = (await import('./CalendarService')).default;

      // Fallback to CalendarService directly
      try {
        // Get current user ID - prefer from event data, then auth, then localStorage
        let userId = event.userId;

        if (!userId && auth && auth.currentUser) {
          userId = auth.currentUser.uid;
          console.log('Got user ID from auth:', userId);
        }

        if (!userId) {
          // Try to get from localStorage as fallback
          const storedUser = localStorage.getItem('selectedUserId');
          if (storedUser) {
            userId = storedUser;
            console.log('Got user ID from localStorage:', userId);
          }
        }

        if (!userId) {
          console.warn('No user ID available for calendar event creation, using system ID');
          // Use a system user ID for Allie-created events
          userId = 'allie-system';
        }
        
        const savedEvent = await CalendarService.addEvent(event, userId, familyId);
        console.log('📅 Event created via CalendarService:', savedEvent);
        
        // Also dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('allie-event-created', { 
          detail: savedEvent 
        }));
        
        // Dispatch the date update event specifically for TasksTab
        if (eventData.title && eventData.title.includes('Family Meeting')) {
          window.dispatchEvent(new CustomEvent('family-meeting-date-updated', {
            detail: {
              date: eventData.startDate,
              time: eventData.startTime
            }
          }));
        }
        
        return savedEvent;
      } catch (serviceError) {
        console.error('CalendarService failed:', serviceError);
        // Last resort - just dispatch event for calendar to handle
        window.dispatchEvent(new CustomEvent('allie-add-event', { 
          detail: event 
        }));
        return event;
      }
    } catch (error) {
      console.error('Error creating event from chat:', error);
      throw error;
    }
  }

  // Update event from Allie chat
  static async updateEventFromChat(eventId, updates) {
    try {
      // Dispatch event for calendar to handle
      window.dispatchEvent(new CustomEvent('allie-update-event', { 
        detail: { eventId, updates }
      }));
      
      return true;
    } catch (error) {
      console.error('Error updating event from chat:', error);
      throw error;
    }
  }

  // Get events for natural language query
  static async queryEvents(query, events) {
    const lowerQuery = query.toLowerCase();
    
    // Time-based queries
    const today = new Date();
    let filteredEvents = events;
    
    if (lowerQuery.includes('today')) {
      filteredEvents = events.filter(event => {
        const eventDate = new Date(event.startDate || event.dateTime);
        return format(eventDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
      });
    } else if (lowerQuery.includes('tomorrow')) {
      const tomorrow = addDays(today, 1);
      filteredEvents = events.filter(event => {
        const eventDate = new Date(event.startDate || event.dateTime);
        return format(eventDate, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd');
      });
    } else if (lowerQuery.includes('this week')) {
      filteredEvents = events.filter(event => {
        const eventDate = new Date(event.startDate || event.dateTime);
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
        const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        return eventDate >= weekStart && eventDate <= weekEnd;
      });
    }
    
    // Category-based queries
    const categories = ['medical', 'school', 'work', 'social', 'shopping', 'exercise', 'family'];
    const mentionedCategory = categories.find(cat => lowerQuery.includes(cat));
    if (mentionedCategory) {
      filteredEvents = filteredEvents.filter(event => event.category === mentionedCategory);
    }
    
    // Person-based queries
    if (lowerQuery.includes('my') || lowerQuery.includes('mine')) {
      // Would need current user context
    }
    
    return filteredEvents;
  }

  // Format events for chat response
  static formatEventsForChat(events) {
    if (!events || events.length === 0) {
      return "No events found matching your query.";
    }
    
    const sortedEvents = events.sort((a, b) => 
      new Date(a.startDate || a.dateTime) - new Date(b.startDate || b.dateTime)
    );
    
    let response = `Found ${events.length} event${events.length > 1 ? 's' : ''}:\n\n`;
    
    sortedEvents.forEach((event, index) => {
      const eventDate = new Date(event.startDate || event.dateTime);
      response += `${index + 1}. **${event.title}**\n`;
      response += `   📅 ${format(eventDate, 'EEEE, MMMM d, yyyy')}\n`;
      if (event.startTime) {
        response += `   ⏰ ${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''}\n`;
      }
      if (event.location) {
        response += `   📍 ${event.location}\n`;
      }
      if (event.description) {
        response += `   📝 ${event.description}\n`;
      }
      response += '\n';
    });
    
    return response;
  }

  // Suggest event based on context
  static suggestEvent(context) {
    const suggestions = [];
    
    // Family meeting suggestion
    if (context.lastFamilyMeeting) {
      const daysSince = Math.floor((new Date() - new Date(context.lastFamilyMeeting)) / (1000 * 60 * 60 * 24));
      if (daysSince > 7) {
        suggestions.push({
          title: 'Weekly Family Meeting',
          description: 'Time to check in on family tasks and balance',
          category: 'family',
          startTime: '19:00',
          recurrence: 'weekly'
        });
      }
    }
    
    // Task review suggestion
    if (context.pendingTasks > 5) {
      suggestions.push({
        title: 'Task Planning Session',
        description: 'Review and organize pending family tasks',
        category: 'family',
        startTime: '20:00'
      });
    }
    
    return suggestions;
  }

  // Google Calendar Sync Methods - Updated to use improved services
  static async syncGoogleCalendars(selectedCalendars, familyId) {
    try {
      console.log('Starting Google Calendar sync for calendars:', selectedCalendars);

      // Use singleton services
      const googleAuth = googleAuthService;
      const syncService = enhancedCalendarSyncService;

      // Check authentication
      const isAuth = await googleAuth.isAuthenticated();
      if (!isAuth) {
        throw new Error('Not authenticated with Google Calendar. Please reconnect.');
      }

      // Initialize sync service
      await syncService.initialize(familyId, auth.currentUser?.uid);

      // Get date range - fetch from current month forward (6 months ahead)
      const now = new Date();
      const timeMin = startOfMonth(now).toISOString(); // Start of current month
      const timeMax = endOfMonth(addMonths(now, 6)).toISOString(); // 6 months ahead

      // Use EnhancedCalendarSyncService for bidirectional sync
      const syncResult = await syncService.performFullSync(familyId, {
        selectedCalendars: selectedCalendars.map(cal => cal.id),
        bidirectional: false, // One-way import for backward compatibility
        timeMin,
        timeMax,
        conflictResolution: 'smart'
      });

      // Fix: Access nested results correctly
      const eventsImported = syncResult.results?.fromGoogle?.created || 0;
      const eventsUpdated = syncResult.results?.fromGoogle?.updated || 0;
      const eventsExported = syncResult.results?.toGoogle?.created || 0;
      const totalImported = eventsImported + eventsUpdated;

      console.log(`Sync completed: ${totalImported} events imported (${eventsImported} new, ${eventsUpdated} updated), ${eventsExported} events exported`);

      // Update last sync timestamp
      await this.updateSyncStatus(familyId, {
        lastSync: new Date().toISOString(),
        eventsImported: totalImported,
        eventsExported: eventsExported,
        calendarssynced: selectedCalendars.length,
        conflicts: syncResult.results?.fromGoogle?.conflicts || 0,
        errors: []
      });

      return {
        success: true,
        eventsImported: totalImported,
        eventsExported: eventsExported,
        totalEvents: totalImported + eventsExported,
        conflicts: [],
        errors: []
      };

    } catch (error) {
      console.error('Google Calendar sync failed:', error);
      throw error;
    }
  }

  // Save Google events to Firestore
  static async saveGoogleEventsToFirestore(googleEvents, familyId) {
    const batch = writeBatch(db);
    const savedEvents = [];
    const eventsRef = collection(db, 'events');

    for (const googleEvent of googleEvents) {
      try {
        // Convert Google event to Allie event format
        const allieEvent = this.convertGoogleEventToAllie(googleEvent, familyId);
        
        // Use Google event ID as document ID to prevent duplicates
        const eventId = `google_${googleEvent.id}`;
        const eventDoc = doc(eventsRef, eventId);
        
        // Check if event already exists
        const existingEvent = await getDoc(eventDoc);
        
        if (!existingEvent.exists()) {
          batch.set(eventDoc, allieEvent);
          savedEvents.push(allieEvent);
        } else {
          // Update if event has changed
          const existingData = existingEvent.data();
          if (this.hasEventChanged(existingData, allieEvent)) {
            batch.update(eventDoc, {
              ...allieEvent,
              updatedAt: serverTimestamp()
            });
            savedEvents.push(allieEvent);
          }
        }
      } catch (error) {
        console.error('Error processing Google event:', error, googleEvent);
      }
    }

    // Commit the batch
    if (savedEvents.length > 0) {
      await batch.commit();
      console.log(`Saved ${savedEvents.length} events to Firestore`);
    }

    return savedEvents;
  }

  // Convert Google Calendar event to Allie event format
  static convertGoogleEventToAllie(googleEvent, familyId) {
    const startDate = googleEvent.start?.dateTime || googleEvent.start?.date || new Date().toISOString();
    const endDate = googleEvent.end?.dateTime || googleEvent.end?.date || startDate;
    const isAllDay = !googleEvent.start?.dateTime;

    // Parse dates to ensure they're valid
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);

    const allieEvent = {
      title: googleEvent.summary || 'Untitled Event',
      description: googleEvent.description || '',
      // Use both old and new field names for compatibility
      startDate: startDate,
      endDate: endDate,
      startTime: startDateTime,
      endTime: endDateTime,
      dateTime: startDate, // For compatibility with existing code
      isAllDay: isAllDay,
      location: googleEvent.location || '',
      familyId: familyId,
      source: 'google',
      googleEventId: googleEvent.id,
      sourceCalendar: googleEvent.sourceCalendar,
      category: this.detectCategory(googleEvent.summary || ''),
      reminders: this.convertGoogleReminders(googleEvent.reminders),
      attendees: this.convertGoogleAttendees(googleEvent.attendees),
      createdAt: serverTimestamp(),
      createdBy: auth.currentUser?.uid || 'google-sync',
      updatedAt: serverTimestamp(),
      status: 'active', // Changed from 'confirmed' to 'active' to match CalendarServiceV2 query
      // Preserve Google event metadata (filter out undefined values)
      googleMetadata: this.cleanUndefinedValues({
        htmlLink: googleEvent.htmlLink,
        recurringEventId: googleEvent.recurringEventId,
        originalStartTime: googleEvent.originalStartTime,
        organizer: googleEvent.organizer,
        visibility: googleEvent.visibility,
        status: googleEvent.status // Keep original Google status here
      })
    };

    // Clean the entire event object to ensure no undefined values anywhere
    const cleanedEvent = this.cleanUndefinedValues(allieEvent);
    
    // Ensure required fields are present
    if (!cleanedEvent.title) cleanedEvent.title = 'Untitled Event';
    if (!cleanedEvent.familyId) cleanedEvent.familyId = familyId;
    if (!cleanedEvent.createdAt) cleanedEvent.createdAt = serverTimestamp();
    if (!cleanedEvent.updatedAt) cleanedEvent.updatedAt = serverTimestamp();
    
    return cleanedEvent;

    // Add recurrence if it's a recurring event
    if (googleEvent.recurrence) {
      cleanedEvent.recurrence = 'custom';
      cleanedEvent.recurrenceRule = googleEvent.recurrence;
    }

    return cleanedEvent;
  }

  // Convert Google reminders to Allie format
  static convertGoogleReminders(googleReminders) {
    if (!googleReminders) return [];
    
    const reminders = [];
    
    if (googleReminders.useDefault) {
      reminders.push({ minutes: 30, method: 'popup' });
    } else if (googleReminders.overrides) {
      googleReminders.overrides.forEach(reminder => {
        reminders.push({
          minutes: reminder.minutes,
          method: reminder.method
        });
      });
    }
    
    return reminders;
  }

  // Convert Google attendees to Allie format
  static convertGoogleAttendees(googleAttendees) {
    if (!googleAttendees) return [];
    
    return googleAttendees.map(attendee => this.cleanUndefinedValues({
      email: attendee.email,
      displayName: attendee.displayName,
      responseStatus: attendee.responseStatus,
      organizer: attendee.organizer || false,
      optional: attendee.optional || false
    })).filter(attendee => attendee && attendee.email); // Only keep attendees with at least an email
  }

  // Check if event has changed
  static hasEventChanged(existingEvent, newEvent) {
    const fieldsToCheck = ['title', 'description', 'startDate', 'endDate', 'location', 'status'];
    
    for (const field of fieldsToCheck) {
      if (existingEvent[field] !== newEvent[field]) {
        return true;
      }
    }
    
    return false;
  }

  // Update sync status
  static async updateSyncStatus(familyId, status) {
    try {
      const syncStatusDoc = doc(db, 'googleCalendarSync', familyId);
      await setDoc(syncStatusDoc, {
        ...status,
        familyId: familyId,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating sync status:', error);
    }
  }

  // Get sync status
  static async getSyncStatus(familyId) {
    try {
      const syncStatusDoc = doc(db, 'googleCalendarSync', familyId);
      const docSnap = await getDoc(syncStatusDoc);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      console.error('Error getting sync status:', error);
      return null;
    }
  }

  // Push Allie events to Google Calendar (two-way sync)
  static async pushAllieEventsToGoogle(familyId, selectedCalendarId) {
    try {
      console.log('Pushing Allie events to Google Calendar:', selectedCalendarId);
      
      if (!window.gapi || !window.gapi.client || !window.gapi.client.calendar) {
        throw new Error('Google Calendar API not initialized');
      }

      // Get Allie events that should be synced
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef, 
        where('familyId', '==', familyId),
        where('source', '!=', 'google')
      );
      
      const snapshot = await getDocs(q);
      const allieEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      console.log(`Found ${allieEvents.length} Allie events to sync to Google`);
      
      const results = {
        created: 0,
        updated: 0,
        errors: []
      };

      for (const event of allieEvents) {
        try {
          // Skip if event already has a Google ID
          if (event.googleEventId) {
            // Update existing Google event
            await this.updateGoogleEvent(event, selectedCalendarId);
            results.updated++;
          } else {
            // Create new Google event
            const googleEventId = await this.createGoogleEvent(event, selectedCalendarId);
            
            // Update Allie event with Google ID
            const eventDoc = doc(db, 'events', event.id);
            await updateDoc(eventDoc, {
              googleEventId: googleEventId,
              syncedToGoogle: true,
              syncedCalendarId: selectedCalendarId,
              lastSyncedAt: serverTimestamp()
            });
            
            results.created++;
          }
        } catch (error) {
          console.error('Error syncing event to Google:', error, event);
          results.errors.push({ event: event.title, error: error.message });
        }
      }

      return results;
    } catch (error) {
      console.error('Error pushing events to Google:', error);
      throw error;
    }
  }

  // Create event in Google Calendar
  static async createGoogleEvent(allieEvent, calendarId) {
    const googleEvent = {
      summary: allieEvent.title,
      description: allieEvent.description || '',
      location: allieEvent.location || '',
      start: {
        dateTime: allieEvent.isAllDay ? undefined : allieEvent.startDate,
        date: allieEvent.isAllDay ? format(new Date(allieEvent.startDate), 'yyyy-MM-dd') : undefined,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: allieEvent.isAllDay ? undefined : allieEvent.endDate,
        date: allieEvent.isAllDay ? format(new Date(allieEvent.endDate), 'yyyy-MM-dd') : undefined,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      reminders: {
        useDefault: false,
        overrides: allieEvent.reminders?.map(r => ({
          method: 'popup',
          minutes: r.minutes || 30
        })) || [{ method: 'popup', minutes: 30 }]
      }
    };

    const response = await window.gapi.client.calendar.events.insert({
      calendarId: calendarId,
      resource: googleEvent
    });

    return response.result.id;
  }

  // Update event in Google Calendar
  static async updateGoogleEvent(allieEvent, calendarId) {
    const googleEvent = {
      summary: allieEvent.title,
      description: allieEvent.description || '',
      location: allieEvent.location || '',
      start: {
        dateTime: allieEvent.isAllDay ? undefined : allieEvent.startDate,
        date: allieEvent.isAllDay ? format(new Date(allieEvent.startDate), 'yyyy-MM-dd') : undefined,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: allieEvent.isAllDay ? undefined : allieEvent.endDate,
        date: allieEvent.isAllDay ? format(new Date(allieEvent.endDate), 'yyyy-MM-dd') : undefined,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    await window.gapi.client.calendar.events.update({
      calendarId: calendarId,
      eventId: allieEvent.googleEventId,
      resource: googleEvent
    });
  }
}

export default CalendarIntegrationService;