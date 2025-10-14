# Calendar Event Loop Protection

This document explains the implementation of calendar event loop protection in the application.

## Problem

The application was experiencing an infinite loop while loading calendar events. The loop occurred because:

1. Empty results from the database were triggering additional refresh attempts
2. The circuit breaker mechanism wasn't properly tracking consecutive empty results
3. React state updates were resetting counters between renders

This caused visible performance issues, excessive API calls, and potential battery drain on mobile devices.

## Solution

The solution consists of several parts:

1. **Enhanced Event Loop Guard**: A specialized utility for detecting and preventing event loops
2. **Circuit Breaker Pattern**: Automatically stops the loop after detecting certain conditions
3. **React Ref-based Tracking**: Using refs instead of state for persistent counter values
4. **Global Counters**: Shared counters to coordinate between different components
5. **Visual Notifications**: UI indicators when a circuit breaker activates
6. **Event Loop Monitor**: Debug tool to monitor and troubleshoot event loops

## Implementation

### 1. Enhanced Event Loop Guard

The main implementation is in `src/event-loop-guard-enhanced.js`. This file provides:

- `checkCalendarEventGuard()`: Checks if a calendar operation should be allowed to execute
- `processEmptyCalendarResult()`: Tracks consecutive empty results
- `clearEmptyResultCounter()`: Resets counters when we get valid results
- `activateCalendarCircuitBreaker()`: Temporarily disables calendar refreshes

### 2. Integration with Existing Components

The fix was applied to three key components:

- **EventStore.js**: Tracks database queries and empty results
- **NewEventContext.js**: Manages React context for events and refreshes
- **EnhancedEventManager.jsx**: Handles event creation and editing

### 3. Monitoring and Debugging

A monitoring tool was added at `public/event-loop-monitor.js` that provides:

- Real-time status of circuit breakers
- Counter for empty results and refresh attempts
- Event log for major calendar operations
- Manual controls for testing and resetting

## How to Use

### Installing the Fix

1. Run the script to apply the fix:
   ```
   node src/apply-event-loop-fix.js
   ```

2. Add the import to your main application file (typically `src/App.js`):
   ```javascript
   import "./event-loop-guard-index.js";
   ```

3. To enable the monitor, add this script to `public/index.html`:
   ```html
   <script src="/event-loop-monitor.js"></script>
   ```

### Using the Monitor

The monitor will appear in the bottom-right corner of the screen and provides:

- Status indicators for circuit breakers
- Counters for events and refresh attempts
- Event log for debugging
- Buttons to reset circuit breakers and create test events

### Creating Test Events

If you're experiencing empty database results, use the monitor's "Create Test Event" button to add a simple event to the calendar. This will help verify that the calendar is working correctly.

### Resetting Circuit Breakers

If a circuit breaker activates, you can:

1. Wait for the automatic reset (1-2 minutes)
2. Use the "Reset Breakers" button in the monitor
3. Refresh the page

## Technical Details

### Circuit Breaker Thresholds

- **Consecutive Empty Results**: Activates after 3 empty results in a row
- **Refresh Rate**: Limits to 5 refreshes in 5 seconds from the same source
- **Event Load Rate**: Limits to 3 load attempts in 5 seconds from the same source

### Global Variables

For cross-component coordination:

- `window._eventEmptyResultCounter`: Tracks consecutive empty results
- `window._forceEventCircuitBreaker`: Flag to force circuit breaker activation
- `window._eventLoopGuardState`: Stores general circuit breaker state
- `window._calendarLoopGuardState`: Stores calendar-specific circuit breaker state

## Troubleshooting

If you still experience issues with the calendar:

1. **Check browser console** for error messages or warnings
2. **Open the monitor** to see circuit breaker status and counters
3. **Create a test event** to verify database connectivity
4. **Clear browser cache and local storage** if persistent state is causing issues

## Developer Notes

When working with calendar code:

1. Always use the `checkCalendarEventGuard()` function before operations that load or refresh events
2. Track empty results with `processEmptyCalendarResult()`
3. Reset counters with `clearEmptyResultCounter()` when you get valid results
4. Test with the monitor to ensure circuit breakers activate and reset properly

## Future Improvements

- Persist event history to localStorage for analytics
- Add more granular controls for different types of calendar operations
- Improve visual feedback when circuit breakers activate
- Add server-side rate limiting for additional protection
EOF < /dev/null