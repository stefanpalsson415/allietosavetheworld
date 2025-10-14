# UnifiedEventContext Initialization Fix

## Issue
The UnifiedEventContext was throwing an error when trying to update or delete events:
```
Error: Event store not initialized. Please ensure you are logged in and have selected a family.
```

This occurred at line 310 in `UnifiedEventContext.js` when the `updateEvent` method was called but the event store hadn't been initialized yet.

## Root Cause
The event store in UnifiedEventContext is only initialized when:
1. A user is logged in (`currentUser` exists)
2. A family is selected (`selectedFamily` exists)

If either of these conditions is not met, the event store remains `null`, causing the error when trying to use `updateEvent` or `deleteEvent`.

## Solution
Added initialization checks in `AllieChat.jsx` before calling UnifiedEventContext methods:

### For Update Operations (line 5124-5133):
```javascript
// Check if UnifiedEventContext is initialized
if (unifiedEventContext.isInitialized && unifiedEventContext.updateEvent) {
  // Use UnifiedEventContext if available
  await unifiedEventContext.updateEvent(eventData.id, event);
  result = { success: true, eventId: eventData.id };
} else {
  // Fall back to CalendarService if context is not initialized
  console.warn('UnifiedEventContext not initialized, using CalendarService directly');
  await CalendarService.updateEvent(eventData.id, event);
  result = { success: true, eventId: eventData.id };
}
```

### For Delete Operations (line 5025-5032):
```javascript
// Check if UnifiedEventContext is initialized
if (unifiedEventContext.isInitialized && unifiedEventContext.deleteEvent) {
  // Use UnifiedEventContext if available
  await unifiedEventContext.deleteEvent(eventData.eventId);
} else {
  // Fall back to CalendarService if context is not initialized
  console.warn('UnifiedEventContext not initialized, using CalendarService directly');
  await CalendarService.deleteEvent(eventData.eventId);
}
```

## Benefits
1. **Graceful Degradation**: The app now falls back to CalendarService when UnifiedEventContext is not ready
2. **Better Error Handling**: Users won't see cryptic error messages about uninitialized event stores
3. **Improved Reliability**: Events can still be updated/deleted even if the context isn't fully initialized

## Note
The UnifiedEventContext already exports an `isInitialized` property (line 379-422 in UnifiedEventContext.js) that indicates whether all required services are ready. This fix leverages that property to determine when to use the context vs. falling back to direct service calls.