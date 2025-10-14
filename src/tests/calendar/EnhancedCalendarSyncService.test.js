// src/tests/calendar/EnhancedCalendarSyncService.test.js
import enhancedCalendarSyncService from '../../services/EnhancedCalendarSyncService';
import googleAuthService from '../../services/GoogleAuthService';
import { db } from '../../services/firebase';

// Mock Firebase
jest.mock('../../services/firebase', () => ({
  db: {},
  auth: {
    currentUser: { uid: 'test-user-id' }
  }
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(() => Promise.resolve()),
  getDoc: jest.fn(() => Promise.resolve({
    exists: () => false,
    data: () => ({})
  })),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  serverTimestamp: jest.fn(() => new Date()),
  writeBatch: jest.fn(() => ({
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn(() => Promise.resolve())
  })),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({
    docs: [],
    empty: true
  })),
  onSnapshot: jest.fn(),
  Timestamp: {
    fromDate: jest.fn(date => date),
    now: jest.fn(() => new Date())
  }
}));

// Mock Google Auth Service
jest.mock('../../services/GoogleAuthService', () => ({
  default: {
    isTokenValid: jest.fn(() => true),
    authenticate: jest.fn(() => Promise.resolve('mock_token')),
    executeWithRetry: jest.fn((fn) => fn()),
    onAuthChange: jest.fn(() => () => {})
  }
}));

describe('EnhancedCalendarSyncService', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock window.gapi
    global.window = {
      gapi: {
        client: {
          calendar: {
            events: {
              list: jest.fn(() => Promise.resolve({
                result: {
                  items: [],
                  nextSyncToken: 'mock_sync_token'
                }
              })),
              insert: jest.fn(() => Promise.resolve({
                result: {
                  id: 'google_event_id',
                  etag: 'google_etag'
                }
              })),
              update: jest.fn(() => Promise.resolve({
                result: {
                  id: 'google_event_id',
                  etag: 'google_etag_updated'
                }
              })),
              delete: jest.fn(() => Promise.resolve()),
              watch: jest.fn(() => Promise.resolve({
                result: {
                  id: 'watch_id',
                  expiration: Date.now() + 7 * 24 * 60 * 60 * 1000
                }
              }))
            },
            channels: {
              stop: jest.fn(() => Promise.resolve())
            }
          }
        }
      },
      location: {
        origin: 'http://localhost:3000'
      }
    };

    // Mock localStorage
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn()
    };
  });

  describe('Initialization', () => {
    test('should initialize service correctly', async () => {
      await enhancedCalendarSyncService.initialize();

      expect(enhancedCalendarSyncService.syncStatus.google.connected).toBe(false);
      expect(enhancedCalendarSyncService.syncInProgress).toBe(false);
    });

    test('should handle auth state changes', () => {
      enhancedCalendarSyncService.handleAuthChange({
        authenticated: true,
        accessToken: 'test_token'
      });

      expect(enhancedCalendarSyncService.syncStatus.google.connected).toBe(true);
    });

    test('should setup offline queue from localStorage', () => {
      const mockQueue = [
        { action: 'create', data: { title: 'Test Event' } }
      ];
      localStorage.getItem.mockReturnValue(JSON.stringify(mockQueue));

      enhancedCalendarSyncService.setupOfflineQueue();

      expect(enhancedCalendarSyncService.offlineQueue).toEqual(mockQueue);
    });
  });

  describe('Full Sync', () => {
    test('should perform full sync successfully', async () => {
      const mockGoogleEvents = [
        {
          id: 'google1',
          summary: 'Google Event',
          start: { dateTime: '2025-09-20T10:00:00Z' },
          end: { dateTime: '2025-09-20T11:00:00Z' }
        }
      ];

      window.gapi.client.calendar.events.list.mockResolvedValue({
        result: {
          items: mockGoogleEvents,
          nextSyncToken: 'new_sync_token'
        }
      });

      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue({
        docs: [],
        empty: true
      });

      const result = await enhancedCalendarSyncService.performFullSync('family123');

      expect(result.success).toBe(true);
      expect(result.results.fromGoogle.created).toBe(1);
    });

    test('should handle sync conflicts', async () => {
      const localEvent = {
        id: 'local1',
        googleId: 'google1',
        title: 'Local Event',
        updatedAt: new Date()
      };

      const googleEvent = {
        id: 'google1',
        summary: 'Google Event (Updated)',
        updated: new Date(Date.now() + 1000).toISOString()
      };

      window.gapi.client.calendar.events.list.mockResolvedValue({
        result: { items: [googleEvent] }
      });

      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue({
        docs: [{
          id: localEvent.id,
          data: () => localEvent
        }]
      });

      const result = await enhancedCalendarSyncService.performFullSync('family123');

      expect(result.success).toBe(true);
      expect(result.results.fromGoogle.conflicts).toBeGreaterThan(0);
    });

    test('should handle sync errors gracefully', async () => {
      window.gapi.client.calendar.events.list.mockRejectedValue(
        new Error('Network error')
      );

      const result = await enhancedCalendarSyncService.performFullSync('family123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('Incremental Sync', () => {
    test('should perform incremental sync with sync token', async () => {
      enhancedCalendarSyncService.lastSyncToken = 'existing_token';

      const changes = {
        items: [
          {
            id: 'changed1',
            summary: 'Changed Event',
            status: 'confirmed'
          }
        ],
        nextSyncToken: 'new_token'
      };

      window.gapi.client.calendar.events.list.mockResolvedValue({
        result: changes
      });

      const result = await enhancedCalendarSyncService.performIncrementalSync('family123');

      expect(result.success).toBe(true);
      expect(result.results.created).toBe(1);
      expect(enhancedCalendarSyncService.lastSyncToken).toBe('new_token');
    });

    test('should fall back to full sync on expired token', async () => {
      enhancedCalendarSyncService.lastSyncToken = 'expired_token';

      const error = new Error('Sync token expired');
      error.code = 410;
      window.gapi.client.calendar.events.list.mockRejectedValue(error);

      // Mock full sync
      jest.spyOn(enhancedCalendarSyncService, 'performFullSync')
        .mockResolvedValue({ success: true });

      await enhancedCalendarSyncService.performIncrementalSync('family123');

      expect(enhancedCalendarSyncService.performFullSync).toHaveBeenCalled();
      expect(enhancedCalendarSyncService.lastSyncToken).toBeNull();
    });
  });

  describe('Event Transformation', () => {
    test('should transform Google event to local format', () => {
      const googleEvent = {
        id: 'google123',
        summary: 'Test Event',
        description: 'Test Description',
        location: 'Test Location',
        start: { dateTime: '2025-09-20T10:00:00Z' },
        end: { dateTime: '2025-09-20T11:00:00Z' },
        attendees: [
          { email: 'test@example.com', displayName: 'Test User' }
        ],
        recurrence: ['RRULE:FREQ=WEEKLY'],
        reminders: {
          overrides: [{ method: 'popup', minutes: 30 }]
        }
      };

      const transformed = enhancedCalendarSyncService.transformGoogleEvent(googleEvent);

      expect(transformed.id).toBe('google123');
      expect(transformed.title).toBe('Test Event');
      expect(transformed.description).toBe('Test Description');
      expect(transformed.location).toBe('Test Location');
      expect(transformed.googleId).toBe('google123');
      expect(transformed.attendees).toHaveLength(1);
      expect(transformed.recurrence).toEqual(['RRULE:FREQ=WEEKLY']);
      expect(transformed.source).toBe('google');
    });

    test('should transform local event to Google format', () => {
      const localEvent = {
        id: 'local123',
        title: 'Local Event',
        description: 'Local Description',
        location: 'Local Location',
        startDate: '2025-09-20T10:00:00Z',
        endDate: '2025-09-20T11:00:00Z',
        allDay: false,
        attendees: [
          { email: 'test@example.com', name: 'Test User' }
        ],
        recurrence: 'RRULE:FREQ=DAILY'
      };

      const transformed = enhancedCalendarSyncService.transformLocalEvent(localEvent);

      expect(transformed.summary).toBe('Local Event');
      expect(transformed.description).toBe('Local Description');
      expect(transformed.location).toBe('Local Location');
      expect(transformed.start.dateTime).toBe('2025-09-20T10:00:00Z');
      expect(transformed.end.dateTime).toBe('2025-09-20T11:00:00Z');
      expect(transformed.attendees).toHaveLength(1);
      expect(transformed.recurrence).toEqual(['RRULE:FREQ=DAILY']);
    });

    test('should handle all-day events', () => {
      const localEvent = {
        title: 'All Day Event',
        startDate: '2025-09-20',
        endDate: '2025-09-21',
        allDay: true
      };

      const transformed = enhancedCalendarSyncService.transformLocalEvent(localEvent);

      expect(transformed.start.date).toBe('2025-09-20');
      expect(transformed.end.date).toBe('2025-09-21');
      expect(transformed.start.dateTime).toBeUndefined();
    });
  });

  describe('Conflict Detection and Resolution', () => {
    test('should detect concurrent update conflicts', async () => {
      const localEvent = {
        id: 'local1',
        title: 'Local Title',
        updatedAt: new Date()
      };

      const googleEvent = {
        id: 'google1',
        title: 'Google Title',
        googleUpdated: new Date(Date.now() + 1000).toISOString()
      };

      const conflict = await enhancedCalendarSyncService.detectConflict(
        localEvent,
        googleEvent
      );

      expect(conflict).toBeTruthy();
      expect(conflict.type).toBe('content_mismatch');
      expect(conflict.fields).toContain('title');
    });

    test('should resolve conflict with smart strategy', async () => {
      enhancedCalendarSyncService.conflictStrategy = 'smart';

      const olderEvent = {
        updatedAt: new Date(Date.now() - 10000)
      };

      const newerEvent = {
        googleUpdated: new Date().toISOString()
      };

      const resolution = await enhancedCalendarSyncService.resolveConflict(
        olderEvent,
        newerEvent
      );

      expect(resolution.action).toBe('updateLocal');
      expect(resolution.event).toBe(newerEvent);
    });

    test('should resolve conflict with local-wins strategy', async () => {
      enhancedCalendarSyncService.conflictStrategy = 'local-wins';

      const localEvent = { id: 'local1' };
      const googleEvent = { id: 'google1' };

      const resolution = await enhancedCalendarSyncService.resolveConflict(
        localEvent,
        googleEvent
      );

      expect(resolution.action).toBe('updateRemote');
      expect(resolution.event).toBe(localEvent);
    });
  });

  describe('Offline Queue', () => {
    test('should add items to offline queue', () => {
      enhancedCalendarSyncService.addToOfflineQueue('create', {
        title: 'Offline Event'
      });

      expect(enhancedCalendarSyncService.offlineQueue).toHaveLength(1);
      expect(enhancedCalendarSyncService.offlineQueue[0].action).toBe('create');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'calendar_offline_queue',
        expect.any(String)
      );
    });

    test('should process offline queue when online', async () => {
      enhancedCalendarSyncService.offlineQueue = [
        {
          action: 'create',
          data: { title: 'Queued Event' }
        }
      ];

      jest.spyOn(enhancedCalendarSyncService, 'createGoogleEvent')
        .mockResolvedValue({ id: 'created_event' });

      await enhancedCalendarSyncService.processOfflineQueue();

      expect(enhancedCalendarSyncService.createGoogleEvent).toHaveBeenCalled();
      expect(enhancedCalendarSyncService.offlineQueue).toHaveLength(0);
    });

    test('should handle offline queue processing errors', async () => {
      enhancedCalendarSyncService.offlineQueue = [
        {
          action: 'create',
          data: { title: 'Failed Event' },
          id: 'offline1'
        }
      ];

      jest.spyOn(enhancedCalendarSyncService, 'createGoogleEvent')
        .mockRejectedValue(new Error('Network error'));

      await enhancedCalendarSyncService.processOfflineQueue();

      expect(enhancedCalendarSyncService.offlineQueue).toHaveLength(1);
      expect(enhancedCalendarSyncService.offlineQueue[0].id).toBe('offline1');
    });
  });

  describe('Webhook Support', () => {
    test('should setup webhook successfully', async () => {
      const result = await enhancedCalendarSyncService.setupWebhook('family123');

      expect(result).toBe(true);
      expect(enhancedCalendarSyncService.watchId).toBe('watch_id');
      expect(window.gapi.client.calendar.events.watch).toHaveBeenCalled();
    });

    test('should schedule webhook renewal', () => {
      jest.useFakeTimers();
      const spy = jest.spyOn(global, 'setTimeout');

      enhancedCalendarSyncService.watchExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
      enhancedCalendarSyncService.scheduleWebhookRenewal();

      expect(spy).toHaveBeenCalled();
      jest.useRealTimers();
    });

    test('should fall back to polling on webhook failure', async () => {
      window.gapi.client.calendar.events.watch.mockRejectedValue(
        new Error('Webhook not supported')
      );

      jest.spyOn(enhancedCalendarSyncService, 'startPeriodicSync');

      await enhancedCalendarSyncService.setupWebhook('family123');

      expect(enhancedCalendarSyncService.startPeriodicSync).toHaveBeenCalled();
    });
  });

  describe('Periodic Sync', () => {
    test('should start periodic sync', () => {
      jest.useFakeTimers();

      enhancedCalendarSyncService.startPeriodicSync();

      expect(enhancedCalendarSyncService.syncInterval).toBeTruthy();

      jest.useRealTimers();
    });

    test('should stop periodic sync', () => {
      jest.useFakeTimers();

      enhancedCalendarSyncService.startPeriodicSync();
      const interval = enhancedCalendarSyncService.syncInterval;

      enhancedCalendarSyncService.stopPeriodicSync();

      expect(enhancedCalendarSyncService.syncInterval).toBeNull();

      jest.useRealTimers();
    });
  });

  describe('Sync Status Updates', () => {
    test('should update sync status', () => {
      enhancedCalendarSyncService.updateSyncStatus('google', {
        syncing: true,
        lastSync: new Date()
      });

      expect(enhancedCalendarSyncService.syncStatus.google.syncing).toBe(true);
      expect(enhancedCalendarSyncService.syncStatus.google.lastSync).toBeTruthy();
    });

    test('should notify sync status listeners', () => {
      const callback = jest.fn();
      const unsubscribe = enhancedCalendarSyncService.onSyncStatusChange(callback);

      enhancedCalendarSyncService.notifySyncStatusChange();

      expect(callback).toHaveBeenCalledWith(enhancedCalendarSyncService.syncStatus);

      unsubscribe();
    });
  });
});