import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useFamily } from './FamilyContext';
import { useAuth } from './AuthContext';
import MergedEventParser from '../components/calendar/MergedEventParser';

// Import calendar-v2 services
// For now, we'll use the existing event services and gradually migrate
import CalendarService from '../services/CalendarService';
import AllieAIService from '../services/AllieAIService';
import EventParserService from '../services/EventParserService';

// Mock calendar-v2 classes until they're fully implemented
const EventStore = class {
  constructor(familyId) {
    this.familyId = familyId;
    this.calendarService = CalendarService;
  }
  
  async createEvent(event) {
    // Pass the userId and familyId from the event data
    const result = await this.calendarService.addEvent(
      event, 
      event.createdBy || event.userId,
      event.familyId || this.familyId
    );
    
    // Ensure we always return a consistent format
    if (result && result.success !== false) {
      return {
        success: true,
        eventId: result.eventId || result.id,
        id: result.eventId || result.id,
        universalId: result.universalId,
        ...result
      };
    }
    
    return result;
  }
  
  async updateEvent(id, updates) {
    return await this.calendarService.updateEvent(id, updates);
  }
  
  async deleteEvent(id, userId) {
    // CalendarService requires both eventId and userId
    return await this.calendarService.deleteEvent(id, userId);
  }
  
  async getEvent(id) {
    const events = await this.calendarService.getEventsForUser(null, null, null);
    return events.find(e => e.id === id) || null;
  }
  
  subscribeToEvents(callback) {
    // For now, just fetch once
    this.calendarService.getEventsForUser(null, null, null).then(events => {
      callback(events || []);
    });
    return () => {};
  }
};

const AllieEventProcessor = class {
  constructor(familyId) {
    this.familyId = familyId;
    this.allieService = new AllieAIService();
  }
  
  async processNaturalLanguage(text) {
    return await EventParserService.parseEventDetails(text);
  }
};

const NotificationEngine = class {
  constructor(familyId, store) {
    this.familyId = familyId;
    this.store = store;
  }
  
  async scheduleEventNotifications(event) {
    console.log('Scheduling notifications for:', event);
  }
  
  destroy() {}
};

const CalendarSyncManager = class {
  constructor(familyId, store, processor) {
    this.familyId = familyId;
  }
  
  async initialize() {}
  destroy() {}
};

const FeedbackCollector = class {
  constructor(familyId) {
    this.familyId = familyId;
  }
  
  async createFeedbackPrompts(event) {}
};

const MeetingScheduler = class {
  constructor(store) {
    this.store = store;
  }
  
  async findOptimalTimes(options) {
    return [];
  }
};

/*
interface UnifiedEventContextType {
  // Core services
  eventStore,
  allieProcessor,
  notificationEngine,
  syncManager,
  feedbackCollector,
  meetingScheduler,
  
  // Event state
  events,
  loading,
  error,
  
  // Event operations
  createEvent,
  updateEvent,
  deleteEvent,
  getEvent,
  
  // Advanced features
  processNaturalLanguage,
  extractEventFromImage,
  scheduleMeeting,
  
  // Global event parser modal
  showEventParser,
  openEventParser,
  closeEventParser,
  
  // Calendar state
  currentView,
  setCurrentView,
  currentDate,
  setCurrentDate,
  
  // Filters
  filters,
  setFilters
}
*/

const UnifiedEventContext = createContext(undefined);

export const UnifiedEventProvider = ({ children }) => {
  const { selectedFamily } = useFamily();
  const { currentUser } = useAuth();
  
  // Core services
  const [eventStore, setEventStore] = useState(null);
  const [allieProcessor, setAllieProcessor] = useState(null);
  const [notificationEngine, setNotificationEngine] = useState(null);
  const [syncManager, setSyncManager] = useState(null);
  const [feedbackCollector, setFeedbackCollector] = useState(null);
  const [meetingScheduler, setMeetingScheduler] = useState(null);
  
  // Event state
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Calendar state
  const [currentView, setCurrentView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filters, setFilters] = useState({
    categories: [],
    attendees: [],
    searchQuery: ''
  });
  
  // Event parser modal state
  const [showEventParser, setShowEventParser] = useState(false);
  const [parserInitialText, setParserInitialText] = useState('');

  // Initialize services when family is selected
  useEffect(() => {
    if (!selectedFamily) {
      setEventStore(null);
      setAllieProcessor(null);
      setNotificationEngine(null);
      setSyncManager(null);
      setFeedbackCollector(null);
      setMeetingScheduler(null);
      setEvents([]);
      return;
    }

    // Initialize core services
    const store = new EventStore(selectedFamily.id);
    const processor = new AllieEventProcessor(selectedFamily.id);
    const notifEngine = new NotificationEngine(selectedFamily.id, store);
    const sync = new CalendarSyncManager(selectedFamily.id, store, processor);
    const feedback = new FeedbackCollector(selectedFamily.id);
    const scheduler = new MeetingScheduler(store);

    setEventStore(store);
    setAllieProcessor(processor);
    setNotificationEngine(notifEngine);
    setSyncManager(sync);
    setFeedbackCollector(feedback);
    setMeetingScheduler(scheduler);

    // Initialize sync manager
    sync.initialize().catch(console.error);

    // Subscribe to events
    const unsubscribe = store.subscribeToEvents((updatedEvents) => {
      setEvents(updatedEvents);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      notifEngine.destroy();
      sync.destroy();
    };
  }, [selectedFamily]);

  // Event operations
  const createEvent = useCallback(async (eventData) => {
    // If services aren't initialized yet, use CalendarService directly
    if (!eventStore || !currentUser) {
      console.warn('Event store not initialized, using CalendarService directly:', {
        eventStore: !!eventStore,
        currentUser: !!currentUser,
        selectedFamily: !!selectedFamily
      });
      
      // Fall back to direct CalendarService usage
      if (!currentUser) {
        throw new Error('Please log in to create events.');
      }
      
      // Use CalendarService directly
      const event = {
        ...eventData,
        createdBy: eventData.createdBy || currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        attendees: eventData.attendees || [],
        reminders: eventData.reminders || [{
          type: 'notification',
          minutesBefore: 15,
          message: `${eventData.title} starts in 15 minutes`
        }],
        source: eventData.source || 'manual',
        // CRITICAL: Preserve the familyId from the eventData
        familyId: eventData.familyId || eventData.metadata?.originalData?.familyId
      };
      
      try {
        // Pass the familyId as the third parameter to CalendarService.addEvent
        const result = await CalendarService.addEvent(event, currentUser.uid, event.familyId);
        return result;
      } catch (error) {
        console.error('Error creating event with CalendarService:', error);
        throw error;
      }
    }

    // Normal flow with EventStore
    const event = {
      ...eventData,
      createdBy: eventData.createdBy || currentUser.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      attendees: eventData.attendees || [],
      reminders: eventData.reminders || [{
        type: 'notification',
        minutesBefore: 15,
        message: `${eventData.title} starts in 15 minutes`
      }],
      source: eventData.source || 'manual',
      // CRITICAL: Preserve the familyId from the eventData
      familyId: eventData.familyId || eventData.metadata?.originalData?.familyId || selectedFamily?.id
    };

    const result = await eventStore.createEvent(event);

    // Create feedback prompts
    if (feedbackCollector && result.success) {
      await feedbackCollector.createFeedbackPrompts(result);
    }

    // Schedule notifications
    if (notificationEngine && result.success) {
      await notificationEngine.scheduleEventNotifications(result);
    }

    return result;
  }, [eventStore, currentUser, feedbackCollector, notificationEngine, selectedFamily]);

  const updateEvent = useCallback(async (eventId, updates) => {
    if (!eventStore) {
      console.error('Event store not initialized for updateEvent');
      throw new Error('Event store not initialized. Please ensure you are logged in and have selected a family.');
    }

    await eventStore.updateEvent(eventId, {
      ...updates,
      updatedAt: new Date()
    });
  }, [eventStore]);

  const deleteEvent = useCallback(async (eventId, userId) => {
    if (!eventStore) {
      console.error('Event store not initialized for deleteEvent');
      throw new Error('Event store not initialized. Please ensure you are logged in and have selected a family.');
    }

    // Pass userId to the event store's deleteEvent method
    await eventStore.deleteEvent(eventId, userId || currentUser?.uid);
  }, [eventStore, currentUser]);

  const getEvent = useCallback(async (eventId) => {
    if (!eventStore) {
      console.error('Event store not initialized for getEvent');
      throw new Error('Event store not initialized. Please ensure you are logged in and have selected a family.');
    }

    return eventStore.getEvent(eventId);
  }, [eventStore]);

  // Advanced features
  const processNaturalLanguage = useCallback(async (text) => {
    if (!allieProcessor) {
      throw new Error('Allie processor not initialized');
    }

    return allieProcessor.processNaturalLanguage(text);
  }, [allieProcessor]);

  const extractEventFromImage = useCallback(async (imageData) => {
    if (!allieProcessor) {
      throw new Error('Allie processor not initialized');
    }

    // This would integrate with the OCR system
    // For now, return a placeholder
    return {
      title: 'Event from image',
      description: 'Extracted from image'
    };
  }, [allieProcessor]);

  const scheduleMeeting = useCallback(async (options) => {
    if (!meetingScheduler) {
      throw new Error('Meeting scheduler not initialized');
    }

    return meetingScheduler.findOptimalTimes(options);
  }, [meetingScheduler]);
  
  // Event parser modal methods
  const openEventParser = useCallback((initialText) => {
    setParserInitialText(initialText || '');
    setShowEventParser(true);
  }, []);
  
  const closeEventParser = useCallback(() => {
    setShowEventParser(false);
    setParserInitialText('');
  }, []);

  // Add initialization state
  const isInitialized = !!(eventStore && currentUser && selectedFamily);

  const value = {
    // Core services
    eventStore,
    allieProcessor,
    notificationEngine,
    syncManager,
    feedbackCollector,
    meetingScheduler,
    
    // Event state
    events,
    loading,
    error,
    
    // Event operations
    createEvent,
    updateEvent,
    deleteEvent,
    getEvent,
    
    // Advanced features
    processNaturalLanguage,
    extractEventFromImage,
    scheduleMeeting,
    
    // Global event parser modal
    showEventParser,
    openEventParser,
    closeEventParser,
    
    // Calendar state
    currentView,
    setCurrentView,
    currentDate,
    setCurrentDate,
    
    // Filters
    filters,
    setFilters,
    
    // Initialization state
    isInitialized
  };

  return (
    <UnifiedEventContext.Provider value={value}>
      {children}
      {showEventParser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <MergedEventParser
              initialText={parserInitialText}
              onClose={closeEventParser}
              onParseSuccess={(event) => {
                closeEventParser();
                // The event has already been added by MergedEventParser
              }}
              familyId={selectedFamily ? selectedFamily.id : null}
            />
          </div>
        </div>
      )}
    </UnifiedEventContext.Provider>
  );
};

export const useUnifiedEvent = () => {
  const context = useContext(UnifiedEventContext);
  if (!context) {
    throw new Error('useUnifiedEvent must be used within UnifiedEventProvider');
  }
  return context;
};

// Migration helper to support old EventContext API
export const useEvent = () => {
  const unified = useUnifiedEvent();
  
  // Map to old API for backward compatibility
  return {
    events: unified.events,
    loading: unified.loading,
    error: unified.error,
    createEvent: unified.createEvent,
    updateEvent: unified.updateEvent,
    deleteEvent: unified.deleteEvent,
    getEvent: unified.getEvent,
    // Add any other methods from old EventContext
  };
};