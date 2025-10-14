# Calendar System Documentation

This document provides an overview of the new calendar system implemented for the ParentLoad application. The calendar system serves as a central component that connects to all tabs in the application and provides a comprehensive solution for managing family events.

## Core Features

1. **Smart Event Extraction** - AI extraction from screenshots, emails, and conversations
2. **Contextual Event Management** - Attach documents, providers, and notes to events
3. **Family Member Attendee Tracking** - Track which family members attend events
4. **Conflict Detection** - Automatically identify scheduling conflicts
5. **Event Categorization** - Structured categories with specialized fields per type
6. **Calendar Integration Hub** - Centralized view of all family schedules
7. **Intelligent Reminders** - Smart, customizable reminder system
8. **Location Management** - Store locations with map integration
9. **Provider Directory Integration** - Connect with healthcare providers
10. **Recurring Event Support** - Handle repeating events with flexible patterns

## Architecture

The calendar system follows a modular architecture with the following components:

### 1. State Management

- `NewEventContext.js` - Central context provider for event data and operations
- Uses the Observer pattern to notify components of event changes

### 2. Data Storage

- `ImprovedEventStore.js` - Enhanced event storage service with better categorization and standardization
- Handles CRUD operations for events in Firestore
- Provides caching and deduplication

### 3. UI Components

- `NewEnhancedEventManager.jsx` - Main component for creating and editing events
- `NewFloatingCalendarWidget.jsx` - Comprehensive calendar widget with filtering and event management
- `AttendeeSelector.jsx` - Specialized component for selecting event attendees
- `SimpleDateTimePicker.jsx` - Simplified date/time picker with recurrence support
- `SimpleCalendarGrid.jsx` - Calendar grid for date selection
- `SimpleEventList.jsx` - Event list with filtering and actions
- `SimpleCalendarFilters.jsx` - Filters for events by type and family member

### 4. Cross-Tab Integration

- `useCalendarIntegration.js` - Hooks for integrating calendar with other tabs
- `TabConnectors.jsx` - Components for embedding calendar in different tabs

## Event Data Structure

Events follow a standardized structure:

```javascript
{
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
  dateObj: Date object,
  dateEndObj: Date object,
  
  // Classification
  category: "appointment",  // general, appointment, activity, meeting, etc.
  eventType: "medical",     // More specific type
  
  // Location
  location: "123 Main St",
  coordinates: { lat: 37.7749, lng: -122.4194 },
  
  // Attendees
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
  provider: { id: "provider-id-1", name: "Dr. Smith" },
  
  // Cross-tab link
  linkedEntity: {
    type: "task",  // task, meeting, relationship, etc.
    id: "task-id"
  },
  
  // Recurrence
  isRecurring: false,
  recurrence: {
    frequency: "never",  // never, daily, weekly
    days: [],  // day indices for weekly recurrence (0 = Sunday)
    endDate: ""  // Optional end date for recurrence
  },
  
  // Metadata
  createdAt: "2023-05-01T09:00:00Z",
  updatedAt: "2023-05-01T09:00:00Z",
  source: "manual"  // manual, ai-parsed, imported, etc.
}
```

## Usage

### Basic Calendar Display

```jsx
import { NewFloatingCalendarWidget } from '../components/calendar';

function Dashboard() {
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <NewFloatingCalendarWidget embedded={true} />
    </div>
  );
}
```

### Creating Events

```jsx
import { useEvents } from '../contexts/NewEventContext';

function CreateEventButton() {
  const { addEvent } = useEvents();
  
  const handleCreateEvent = async () => {
    const newEvent = {
      title: "Doctor Appointment",
      description: "Annual checkup",
      category: "appointment",
      dateTime: new Date().toISOString(),
      attendees: ["family-member-id-1", "family-member-id-2"]
    };
    
    const result = await addEvent(newEvent);
    
    if (result.success) {
      alert("Event created successfully!");
    }
  };
  
  return (
    <button onClick={handleCreateEvent}>
      Create Event
    </button>
  );
}
```

### Tab-Specific Integration

```jsx
import { useTaskCalendar } from '../hooks/useCalendarIntegration';

function TaskCalendar() {
  const { taskEvents, addTaskEvent } = useTaskCalendar();
  
  return (
    <div>
      <h2>Task Calendar</h2>
      <button onClick={() => addTaskEvent({ title: "New Task" })}>
        Add Task
      </button>
      <ul>
        {taskEvents.map(event => (
          <li key={event.id}>{event.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Migrating from Old Calendar System

To migrate from the old calendar system to the new one:

1. Replace imports from `src/contexts/EventContext` with `src/contexts/NewEventContext`
2. Replace components with their new counterparts:
   - `EnhancedEventManager` → `NewEnhancedEventManager`
   - `RevisedFloatingCalendarWidget` → `NewFloatingCalendarWidget`
3. Use the appropriate tab connector for embedding in specific tabs

## Future Enhancements

1. **Calendar sharing** - Share events with specific family members or external users
2. **Advanced recurrence** - Support for more complex recurrence patterns
3. **Calendar synchronization** - Two-way sync with external calendars
4. **Notification system** - Enhanced notification delivery for events
5. **Mobile support** - Complete integration with mobile app

## Troubleshooting

Common issues and solutions:

- **Event not saving**: Ensure all required fields are provided (title, dateTime)
- **Attendees not saved**: Make sure attendees are in the correct format (array of objects with id, name, role)
- **Events not showing**: Check if filters are applied or refresh the calendar

## Contributors

Implemented by Claude Code at the request of Stefan Palsson.