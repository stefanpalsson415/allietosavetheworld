# Calendar V2 - Clean JavaScript Implementation

This is a fresh, clean JavaScript implementation of Calendar V2, rebuilt from scratch to avoid TypeScript conversion issues.

## Features

✅ **Multiple Views**
- Month view with event previews
- Week view with daily columns
- Day view with hourly timeline
- Agenda view for list format

✅ **Event Management**
- Create, edit, and delete events
- Event categories with color coding
- Attendee management
- Location support
- Recurring events
- All-day events

✅ **Firebase Integration**
- Real-time sync with Firestore
- Family-based event filtering
- User authentication

✅ **Clean Architecture**
- CalendarProvider for state management
- useCalendar hook for easy access
- Modular component structure
- Pure JavaScript (no TypeScript)

## Usage

```jsx
import { Calendar, CalendarProvider } from './components/calendar-v2';

function App() {
  return (
    <CalendarProvider>
      <Calendar />
    </CalendarProvider>
  );
}
```

## Structure

```
calendar-v2/
├── index.js              # Main exports
├── core/
│   └── CalendarProvider.js   # Context and state management
├── hooks/
│   └── useCalendar.js       # Calendar hook for components
├── views/
│   ├── Calendar.js          # Main calendar component
│   ├── CalendarHeader.js    # Navigation and view controls
│   ├── CalendarGrid.js      # Grid rendering for all views
│   ├── EventCard.js         # Event display component
│   ├── EventModal.js        # Create/edit event modal
│   └── Calendar.css         # Styles
└── services/             # (Future: AI integration, sync, etc.)
```

## Next Steps

To add the advanced features from the original Calendar V2:

1. **AI Integration**
   - Natural language event creation
   - Smart suggestions
   - Conflict detection

2. **Voice & Image Input**
   - Voice-to-event creation
   - OCR for image-based events

3. **Advanced Features**
   - Calendar sync (Google, Outlook)
   - Smart reminders
   - Prep task generation
   - Family availability visualization

These can be added incrementally without breaking the core functionality.