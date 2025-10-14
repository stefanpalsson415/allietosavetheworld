# Calendar System Implementation Guide

This document outlines the steps to implement the new calendar system in your application.

## Implementation Steps

### 1. Update the App to use the new EventContext

First, we need to update your App.js to include the new EventContext:

```jsx
// In App.js - Add the new import
import { NewEventProvider } from './contexts/NewEventContext';

// Then wrap your application with the provider
function App() {
  return (
    <AuthProvider>
      <FamilyProvider>
        <NewEventProvider>
          {/* Your existing app components */}
        </NewEventProvider>
      </FamilyProvider>
    </AuthProvider>
  );
}
```

### 2. Replace the Floating Calendar Widget

Find where you're currently using the old RevisedFloatingCalendarWidget and replace it:

```jsx
// Replace imports
import { NewFloatingCalendarWidget } from './components/calendar/NewFloatingCalendarWidget';

// Then replace the component
<NewFloatingCalendarWidget />
```

### 3. Setup Tab Integrations

Add tab connectors to your existing tabs:

```jsx
// In TasksTab.jsx
import { TaskCalendarConnector } from './components/calendar/TabConnectors';

// Then add the component to your UI
<TaskCalendarConnector />

// Similar for other tabs
// In RelationshipTab.jsx
import { RelationshipCalendarConnector } from './components/calendar/TabConnectors';

// In ChildrenTab.jsx - For a specific child
import { ChildCalendarConnector } from './components/calendar/TabConnectors';
<ChildCalendarConnector childId={selectedChild.id} />

// In MeetingTab.jsx
import { MeetingCalendarConnector } from './components/calendar/TabConnectors';
```

### 4. Create an Index File for Calendar Components

For easier imports, create an index file:

```jsx
// In src/components/calendar/index.js
export { default as NewFloatingCalendarWidget } from './NewFloatingCalendarWidget';
export { default as NewEnhancedEventManager } from './NewEnhancedEventManager';
export { default as AttendeeSelector } from './AttendeeSelector';
export { default as SimpleDateTimePicker } from './SimpleDateTimePicker';
export { default as SimpleCalendarGrid } from './SimpleCalendarGrid';
export { default as SimpleEventList } from './SimpleEventList';
export { default as SimpleCalendarFilters } from './SimpleCalendarFilters';
export * from './TabConnectors';
```

### 5. Implement Calendar Hooks in Your Custom Hooks

If you have custom hooks, update them to use the new calendar system:

```jsx
// In a custom hook
import { useEvents } from '../contexts/NewEventContext';
import { useTaskCalendar } from '../hooks/useCalendarIntegration';

export function useTaskManagement() {
  const { addEvent } = useEvents();
  const { taskEvents } = useTaskCalendar();
  
  // Your hook logic here
}
```

### 6. Replace Event Manager in Forms

For forms that create or edit events, replace the old manager:

```jsx
import { NewEnhancedEventManager } from './components/calendar';

// Then in your component
<NewEnhancedEventManager 
  onSave={handleSaveEvent}
  onCancel={handleCancel}
/>
```

### 7. Update EventStore Imports

If you directly import the EventStore, update imports:

```jsx
// Replace
import eventStore from '../services/EventStore';

// With
import improvedEventStore from '../services/ImprovedEventStore';
```

## Phased Rollout Strategy

For a gradual transition, follow this approach:

1. **Phase 1 - Add Without Replacing**
   - Add the new context provider without removing the old one
   - Run both systems in parallel for testing
   - Test the new calendar in isolated areas first

2. **Phase 2 - Replace Core Components**
   - Replace the floating calendar widget
   - Replace event form components
   - Monitor for issues

3. **Phase 3 - Full Replacement**
   - Replace all imports to the old context
   - Add tab-specific integrations
   - Remove old components

4. **Phase 4 - Clean Up**
   - Remove old calendar components
   - Update documentation
   - Train users on new features

## Testing Guide

Test these critical functions:

1. **Event Creation**
   - Can users create events with all fields?
   - Are attendees properly saved?
   - Are dates and times correctly stored?

2. **Attendee Management**
   - Does selecting family members work?
   - Are attendees displayed correctly in event details?

3. **Event Filtering**
   - Do filters by type and family member work?
   - Are events shown on the correct dates?

4. **Cross-Tab Integration**
   - Do tab-specific calendars show relevant events?
   - Can events be created from different tabs?

5. **Data Consistency**
   - Are events properly standardized?
   - Is categorization working correctly?

## Troubleshooting Common Issues

1. **Missing Events**
   - Check if filters are active
   - Try refreshing the cache with handleForceRefresh()
   - Verify event dates are valid Date objects

2. **Attendee Issues**
   - Ensure attendees are in the [{ id, name, role }, ...] format
   - Check if familyMembers are being loaded properly

3. **Integration Problems**
   - Verify correct context nesting order (Auth → Family → Event)
   - Check for circular dependencies in imports

4. **Performance Issues**
   - Use the cache clearing methods sparingly
   - Avoid multiple refreshes in quick succession

## Development Timeline

1. **Day 1-2: Setup & Initial Integration**
   - Add context providers
   - Import new components
   - Basic testing

2. **Day 3-5: Component Replacement**
   - Replace calendar widget
   - Replace event forms
   - Implement tab connectors

3. **Day 6-7: Testing & Refinement**
   - User testing
   - Bug fixes
   - Performance optimization

4. **Day 8-10: Documentation & Training**
   - Update documentation
   - Create user guides
   - Train team members

## Go-Live Checklist

- [ ] All components imported and working
- [ ] Context providers properly nested
- [ ] Event creation flow tested
- [ ] Attendee selection working
- [ ] Filters functioning correctly
- [ ] Tab integrations complete
- [ ] Date/time handling verified
- [ ] Event categorization working
- [ ] Documentation updated
- [ ] Performance tested with large event sets