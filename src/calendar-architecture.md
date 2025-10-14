# Calendar System Rebuild Architecture Plan

## 1. System Overview

The calendar system is a core component that connects to all tabs in the application and serves as the central scheduling hub for family management. It handles events from various sources and must integrate with multiple other features including:

- Tasks Tab (Family meetings)
- Relationships Tab (Date nights)
- Family Command Center (Kanban board and doctor appointments)
- Child management
- Provider directory
- Document library

## 2. Core Components

### 2.1 Event Context Provider (`EventContext.js`)

The EventContext provider will serve as the central state management system for all calendar-related data:

```jsx
// Simplified approach
const EventContext = createContext();

export function EventProvider({ children }) {
  // Core state
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Event operations (CRUD)
  const addEvent = async (eventData) => { /* Implementation */ };
  const updateEvent = async (eventId, updateData) => { /* Implementation */ };
  const deleteEvent = async (eventId) => { /* Implementation */ };
  const refreshEvents = async () => { /* Implementation */ };

  // Event filtering
  const getFilteredEvents = (filters) => { /* Implementation */ };
  
  const value = {
    events,
    loading, 
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    refreshEvents,
    getFilteredEvents
  };
  
  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  );
}
```

### 2.2 Event Management Components

#### 2.2.1 `EnhancedEventManager.jsx`

This component will handle event creation and editing, with improved handling of attendees:

- Clear attendee selection interface
- Proper state management for attendees
- Validation of attendee data before save

#### 2.2.2 `RevisedFloatingCalendarWidget.jsx`

This component serves as the main calendar interface with:

- Date selection grid
- Event filtering controls
- Event list display
- Connection to the event manager

### 2.3 Event Storage Service (`EventStore.js`)

The storage service interfaces with Firebase and handles:

- Standardizing event data
- CRUD operations
- Deduplication
- Caching

## 3. Cross-Tab Integration

To ensure proper integration with all app tabs, we'll implement:

### 3.1 Cross-Tab Event Hooks

```jsx
// Custom hooks for specific tabs
export function useTaskEvents() {
  const { events, addEvent, updateEvent } = useEvents();
  const filteredEvents = useMemo(() => {
    return events.filter(event => event.category === 'task');
  }, [events]);
  
  return { events: filteredEvents, addEvent, updateEvent };
}

export function useRelationshipEvents() {
  const { events, addEvent, updateEvent } = useEvents();
  const filteredEvents = useMemo(() => {
    return events.filter(event => 
      event.category === 'relationship' || 
      event.eventType === 'date-night'
    );
  }, [events]);
  
  return { events: filteredEvents, addEvent, updateEvent };
}
```

### 3.2 Tab Connectors

```jsx
// Connectors for each tab that need calendar access
function TaskCalendarConnector() {
  const { events, addEvent } = useTaskEvents();
  
  // Integration logic
  
  return (
    <div>
      {/* Tab-specific calendar UI */}
    </div>
  );
}
```

## 4. Event Data Structure

```javascript
// Standard event structure
const event = {
  // Identity
  id: "unique-id",
  firestoreId: "firebase-doc-id",
  universalId: "universal-id",
  
  // Core info
  title: "Event Title",
  description: "Event description",
  
  // Date & time
  dateTime: "2023-05-05T10:00:00Z",
  endDateTime: "2023-05-05T11:00:00Z",
  
  // Classification
  category: "appointment",  // general, appointment, activity, meeting, etc.
  eventType: "medical",     // More specific type
  
  // Location
  location: "123 Main St",
  coordinates: { lat: 37.7749, lng: -122.4194 },
  
  // Attendees (Improved structure)
  attendees: [
    {
      id: "family-member-id-1",
      name: "John Doe",
      role: "parent"
    },
    {
      id: "family-member-id-2",
      name: "Jane Doe",
      role: "child"
    }
  ],
  
  // Links to other system entities
  documents: [
    { id: "doc-id-1", title: "Medical Report" }
  ],
  providers: [
    { id: "provider-id-1", name: "Dr. Smith", specialty: "Pediatrics" }
  ],
  
  // Cross-tab link
  linkedEntity: {
    type: "task",  // task, meeting, relationship, etc.
    id: "task-id"
  },
  
  // Metadata
  createdAt: "2023-05-01T09:00:00Z",
  updatedAt: "2023-05-01T09:00:00Z",
  source: "manual",  // manual, ai-parsed, imported, etc.
}
```

## 5. Attendee Management

The new system will handle attendees more effectively:

1. Use a dedicated `AttendeeSelector` component
2. Represent attendees consistently as objects with id, name, and role
3. Validate attendees before saving events
4. Handle string IDs and object attendees consistently

## 6. Implementation Plan

1. Create the new `EventContext.js` provider
2. Develop the `EnhancedEventManager.jsx` component
3. Build the attendee selection interface
4. Develop the `RevisedFloatingCalendarWidget.jsx` component
5. Create the cross-tab connectors
6. Implement the date/time picker component
7. Rebuild the `EventStore.js` service

## 7. Testing Strategy

1. Unit tests for event standardization functions
2. Component tests for the event manager
3. Integration tests for the calendar widget
4. E2E tests for the full calendar system

## 8. Migration Strategy

1. Implement the new system in parallel with the old one
2. Validate data consistency
3. Switch the application to use the new system
4. Remove old components when confirmed working