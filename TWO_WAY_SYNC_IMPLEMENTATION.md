# Two-Way Google Calendar Sync Implementation

## Summary
Implemented two-way synchronization between Allie and Google Calendar. Events created or edited in Allie will now automatically sync to your primary Google Calendar, and events from Google Calendar continue to sync into Allie.

## Features Implemented

### 1. Two-Way Sync Toggle
- Added toggle switch in Calendar Settings (Settings > Calendar & Events)
- Toggle state persisted in localStorage
- Shows which calendar will receive new events (primary calendar)

### 2. Automatic Event Sync
- **Create**: New events in Allie → Created in Google Calendar
- **Update**: Edit events in Allie → Updates sync to Google Calendar
- **Source Tracking**: Events show sync status with cloud icon
  - 🔵 Blue cloud: Event from Google Calendar
  - 🟢 Green cloud: Event created in Allie and synced to Google

### 3. Primary Calendar Selection
- Uses your primary Google Calendar by default (spalsson@gmail.com)
- Automatically detected from selected calendars
- New events created in Allie appear in this calendar

## How to Use

### 1. Enable Two-Way Sync
1. Go to **Settings > Calendar & Events**
2. Make sure Google Calendar is connected
3. Toggle **"Two-way Sync"** ON
4. Your primary calendar will be shown

### 2. Create Events
- Create events normally in Allie (via calendar, chat, or quick add)
- Events automatically sync to your primary Google Calendar
- Google Event ID is stored for future updates

### 3. Edit Events
- Edit events in Allie's calendar
- Changes automatically sync to Google Calendar
- Sync happens in the background

### 4. Visual Indicators
- Events show a cloud icon when synced with Google
- Hover over the icon to see sync status
- Blue = from Google, Green = synced to Google

## Testing

### Test Two-Way Sync
Run in browser console:
```javascript
// Copy and paste from: /public/test-two-way-sync.js
```

This will:
1. Create a test event in Allie
2. Wait for it to sync to Google Calendar
3. Report success/failure
4. Clean up the test event

## Technical Details

### Files Modified

1. **`/src/components/calendar-v2/views/SimpleCalendarSync.jsx`**
   - Added two-way sync toggle UI
   - Added primary calendar detection
   - Persists settings to localStorage

2. **`/src/services/EventStore.js`**
   - Enhanced `addEvent` to trigger Google sync
   - Enhanced `updateEvent` to sync changes
   - Handles sync errors gracefully

3. **`/src/components/calendar-v2/views/EventCard.js`**
   - Added cloud icon for sync status
   - Shows different colors for source

4. **`/src/components/calendar-v2/views/Calendar.css`**
   - Added styles for sync indicator

### Data Flow

1. **Event Creation**:
   ```
   Allie UI → EventStore.addEvent() → Firebase → Google Calendar API
                                               ↓
                                         googleEventId stored
   ```

2. **Event Update**:
   ```
   Allie UI → EventStore.updateEvent() → Firebase → Google Calendar API
                                                  ↓
                                            lastSyncedAt updated
   ```

### Event Metadata

Events synced to Google include:
- `googleEventId`: Google's event identifier
- `syncedToGoogle`: Boolean flag
- `syncedCalendarId`: Which calendar it was synced to
- `lastSyncedAt`: Timestamp of last sync

## Limitations

1. **One-way delete**: Deleting in Allie doesn't delete from Google (safety feature)
2. **Primary calendar only**: Currently syncs to primary calendar only
3. **Conflict resolution**: Last write wins - no conflict resolution
4. **Recurring events**: Created as single events (no recurrence rules yet)

## Future Enhancements

1. **Calendar selection**: Choose which Google Calendar for new events
2. **Selective sync**: Choose which events to sync
3. **Delete sync**: Option to sync deletions
4. **Recurring events**: Support for recurrence rules
5. **Conflict resolution**: Handle simultaneous edits
6. **Bulk sync**: Push existing Allie events to Google

## Troubleshooting

### Events not syncing to Google?

1. **Check two-way sync is enabled**:
   - Settings > Calendar & Events > Two-way Sync toggle

2. **Verify Google connection**:
   - Must be connected to Google Calendar
   - Must have calendar write permissions

3. **Check browser console**:
   - Look for "Two-way sync:" messages
   - Check for sync errors

4. **Ensure primary calendar**:
   - At least one calendar must be marked as primary
   - Usually your main email calendar

### Manual sync commands

Force sync a specific event:
```javascript
// Get event ID from calendar
const eventId = 'your-event-id';
const calendarId = 'primary'; // or specific calendar ID

// Manually trigger sync
const CalendarIntegrationService = await import('/src/services/CalendarIntegrationService');
await CalendarIntegrationService.default.createGoogleEvent(event, calendarId);
```