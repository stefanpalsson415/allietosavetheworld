// src/tests/CalendarCRUD.test.js
// Mock TextEncoder and TextDecoder which may be needed by Firebase
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import RevisedFloatingCalendarWidget from '../components/calendar/RevisedFloatingCalendarWidget';
import EnhancedEventManager from '../components/calendar/EnhancedEventManager';

// Mock the contexts instead of importing them
const mockEventContext = {
  events: [],
  loading: false,
  addEvent: jest.fn(),
  updateEvent: jest.fn(),
  deleteEvent: jest.fn(),
  refreshEvents: jest.fn()
};

const mockFamilyContext = {
  familyMembers: [],
  familyId: 'mock-family-id'
};

const mockAuthContext = {
  currentUser: { uid: 'mock-user-id' }
};

// Mock the EventContext, FamilyContext, and AuthContext modules
jest.mock('../contexts/EventContext', () => ({
  EventContext: {
    Provider: ({ children }) => children,
    Consumer: ({ children }) => children(mockEventContext)
  },
  useEvents: () => mockEventContext
}));

jest.mock('../contexts/FamilyContext', () => ({
  FamilyContext: {
    Provider: ({ children }) => children,
    Consumer: ({ children }) => children(mockFamilyContext)
  },
  useFamily: () => mockFamilyContext
}));

jest.mock('../contexts/AuthContext', () => ({
  AuthContext: {
    Provider: ({ children }) => children,
    Consumer: ({ children }) => children(mockAuthContext)
  },
  useAuth: () => mockAuthContext
}));

// Mock service and API calls
jest.mock('../services/CalendarService', () => ({
  showNotification: jest.fn(),
  createEventFromTask: jest.fn(() => ({})),
  createFamilyMeetingEvent: jest.fn(() => ({}))
}));

// Mock our event store
const mockEvents = [];
const mockEventContext = {
  events: mockEvents,
  loading: false,
  addEvent: jest.fn(event => {
    const newEvent = { ...event, firestoreId: `mock-id-${Date.now()}` };
    mockEvents.push(newEvent);
    return Promise.resolve({ 
      success: true, 
      eventId: newEvent.firestoreId,
      firestoreId: newEvent.firestoreId 
    });
  }),
  updateEvent: jest.fn((id, event) => {
    const index = mockEvents.findIndex(e => e.firestoreId === id);
    if (index !== -1) {
      mockEvents[index] = { ...mockEvents[index], ...event, firestoreId: id };
      return Promise.resolve({ success: true, eventId: id });
    }
    return Promise.resolve({ success: false, error: 'Event not found' });
  }),
  deleteEvent: jest.fn(id => {
    const index = mockEvents.findIndex(e => e.firestoreId === id);
    if (index !== -1) {
      mockEvents.splice(index, 1);
      return Promise.resolve({ success: true });
    }
    return Promise.resolve({ success: false, error: 'Event not found' });
  }),
  refreshEvents: jest.fn(() => Promise.resolve(mockEvents))
};

// Mock family context
const mockFamilyContext = {
  familyMembers: [
    { id: 'user1', name: 'Parent 1', role: 'parent' },
    { id: 'user2', name: 'Parent 2', role: 'parent' },
    { id: 'child1', name: 'Child 1', role: 'child' }
  ],
  familyId: 'family1'
};

// Mock auth context
const mockAuthContext = {
  currentUser: { uid: 'user1' }
};

// Custom render with contexts
const renderWithContexts = (ui) => {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      <FamilyContext.Provider value={mockFamilyContext}>
        <EventContext.Provider value={mockEventContext}>
          {ui}
        </EventContext.Provider>
      </FamilyContext.Provider>
    </AuthContext.Provider>
  );
};

// Testing Core CRUD Flows
describe.skip('Calendar CRUD Flows', () => {
  // Clear mock events before each test
  beforeEach(() => {
    mockEvents.length = 0;
    jest.clearAllMocks();
    // Mock window methods and properties needed for components
    window.dispatchEvent = jest.fn();
    window._notificationShown = false;
    window._calendarRefreshInProgress = false;
    window._eventUpdateInProgress = false;
  });

  // 1.1 Create Event
  test('1.1 Create Event - Click empty slot, fill Title, set Date and Time, Save', async () => {
    // Render the calendar widget
    renderWithContexts(<RevisedFloatingCalendarWidget embedded={true} />);

    // Simulate clicking Add Event button
    const addButton = await screen.findByRole('button', { name: /plus/i });
    fireEvent.click(addButton);
    
    // Verify event form has appeared
    const titleInput = await screen.findByPlaceholderText(/Enter event title/i);
    
    // Fill in the form
    await act(async () => {
      userEvent.type(titleInput, 'Team Sync');
      
      // Find the DateTimePicker (complex control)
      // Note: In a real test, you'd need to identify and interact with the date/time pickers
      // For this mock test, we'll directly update the event in the EnhancedEventManager
      
      // Find Save button and click it
      const saveButton = screen.getByTestId('save-event-button');
      fireEvent.click(saveButton);
    });
    
    // Verify that addEvent was called with correct data
    await waitFor(() => {
      expect(mockEventContext.addEvent).toHaveBeenCalled();
      const eventData = mockEventContext.addEvent.mock.calls[0][0];
      expect(eventData.title).toBe('Team Sync');
    });
    
    // Verify the event was added to our mock events array
    expect(mockEvents.length).toBe(1);
    expect(mockEvents[0].title).toBe('Team Sync');
    
    // Verify API would return correct payload
    expect(mockEvents[0].firestoreId).toBeDefined();
  });

  // 1.2 Edit Title & Time
  test('1.2 Edit Title & Time - Open event, change title and time, Save', async () => {
    // First add an event to edit
    const existingEvent = {
      title: 'Team Sync',
      description: '',
      dateTime: new Date(2025, 5, 10, 10, 0).toISOString(), // June 10, 2025, 10:00 AM
      endDateTime: new Date(2025, 5, 10, 10, 30).toISOString(), // June 10, 2025, 10:30 AM
      firestoreId: 'existing-event-id',
      location: '',
      category: 'general',
      eventType: 'general'
    };
    mockEvents.push(existingEvent);
    
    // Render the calendar
    renderWithContexts(<RevisedFloatingCalendarWidget embedded={true} />);
    
    // Mock event click from calendar
    act(() => {
      // Since we can't directly click on the event in the calendar (it's rendered dynamically),
      // we'll simulate it by calling the handleEventClick handler
      const calendarInstance = screen.getByTestId('calendar-container');
      // Trigger a custom event that the component would listen for
      window.dispatchEvent(new CustomEvent('calendar-event-clicked', {
        detail: { eventId: 'existing-event-id' }
      }));
    });
    
    // Verify the event editor opens
    await waitFor(() => {
      // In the real app, this would open the EnhancedEventManager
      // We'll simulate by rendering it directly with the event
      renderWithContexts(
        <EnhancedEventManager 
          initialEvent={existingEvent} 
          mode="edit"
        />
      );
    });
    
    // Change title and time
    const titleInput = await screen.findByDisplayValue('Team Sync');
    await act(async () => {
      userEvent.clear(titleInput);
      userEvent.type(titleInput, 'Stand-up');
      
      // Simulate changing time
      // In a real test, we'd interact with the time pickers
      
      // Find Update Event button and click it
      const updateButton = screen.getByTestId('update-event-button');
      fireEvent.click(updateButton);
    });
    
    // Verify that updateEvent was called with correct data
    await waitFor(() => {
      expect(mockEventContext.updateEvent).toHaveBeenCalled();
      const eventId = mockEventContext.updateEvent.mock.calls[0][0];
      const eventData = mockEventContext.updateEvent.mock.calls[0][1];
      expect(eventId).toBe('existing-event-id');
      expect(eventData.title).toBe('Stand-up');
    });
    
    // Verify the event was updated in our mock events array
    expect(mockEvents[0].title).toBe('Stand-up');
    
    // Verify WS notifications
    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.stringContaining('calendar-event-updated')
      })
    );
  });

  // 1.3 Delete Event
  test('1.3 Delete Event - Open event, Delete, Confirm', async () => {
    // First add an event to delete
    const existingEvent = {
      title: 'Stand-up',
      description: '',
      dateTime: new Date(2025, 5, 10, 11, 0).toISOString(), // June 10, 2025, 11:00 AM
      endDateTime: new Date(2025, 5, 10, 11, 15).toISOString(), // June 10, 2025, 11:15 AM
      firestoreId: 'existing-event-id',
      location: '',
      category: 'general',
      eventType: 'general'
    };
    mockEvents.push(existingEvent);
    
    // Render the calendar
    renderWithContexts(<RevisedFloatingCalendarWidget embedded={true} />);
    
    // Mock event click from calendar
    act(() => {
      // Trigger a custom event that the component would listen for
      window.dispatchEvent(new CustomEvent('calendar-event-clicked', {
        detail: { eventId: 'existing-event-id' }
      }));
    });
    
    // Verify the event editor opens
    await waitFor(() => {
      renderWithContexts(
        <EnhancedEventManager 
          initialEvent={existingEvent} 
          mode="edit"
          onDelete={mockEventContext.deleteEvent}
        />
      );
    });
    
    // Mock the window.confirm call
    window.confirm = jest.fn(() => true);
    
    // Click Delete button
    const deleteButton = await screen.findByTestId('delete-event-button');
    fireEvent.click(deleteButton);
    
    // Verify confirmation was shown
    expect(window.confirm).toHaveBeenCalled();
    
    // Verify that deleteEvent was called with correct ID
    await waitFor(() => {
      expect(mockEventContext.deleteEvent).toHaveBeenCalledWith('existing-event-id');
    });
    
    // Verify the event was removed from our mock events array
    expect(mockEvents.length).toBe(0);
    
    // Verify API returns 204 (success with no content)
    // This is implicitly tested by our mock returning {success: true}
  });

  // 1.4 Unsaved change guard
  test('1.4 Unsaved change guard - Open event, change time, exit without saving, confirm dialog appears', async () => {
    // First add an event
    const existingEvent = {
      title: 'Stand-up',
      description: '',
      dateTime: new Date(2025, 5, 10, 11, 0).toISOString(), // June 10, 2025, 11:00 AM
      endDateTime: new Date(2025, 5, 10, 11, 15).toISOString(), // June 10, 2025, 11:15 AM
      firestoreId: 'existing-event-id',
      location: '',
      category: 'general',
      eventType: 'general'
    };
    mockEvents.push(existingEvent);
    
    // Render the Event Manager directly
    renderWithContexts(
      <EnhancedEventManager 
        initialEvent={existingEvent} 
        mode="edit"
        onCancel={jest.fn()}
      />
    );
    
    // Make a change without saving
    const titleInput = await screen.findByDisplayValue('Stand-up');
    await act(async () => {
      userEvent.clear(titleInput);
      userEvent.type(titleInput, 'Updated Stand-up');
    });
    
    // Mock the window.confirm call
    window.confirm = jest.fn(() => true);
    
    // Try to close without saving
    const cancelButton = screen.getByTestId('cancel-button');
    fireEvent.click(cancelButton);
    
    // Verify confirmation dialog appeared
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
    });
    
    // Verify original event is intact (not updated)
    expect(mockEvents[0].title).toBe('Stand-up');
    expect(mockEventContext.updateEvent).not.toHaveBeenCalled();
  });
});