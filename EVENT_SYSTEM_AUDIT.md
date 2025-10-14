# Event System Audit & Fix Plan

## Current State Analysis

### 1. Multiple Event Contexts (Problem)
We have THREE different event contexts:
- **EventContext** (original) - Used by EnhancedEventManager
- **NewEventContext** (with circuit breaker) - NOT USED by any components!
- **UnifiedEventContext** (bridge) - Used by AllieChat

### 2. Direct EventStore Usage
Many components bypass contexts entirely:
- TasksTab.jsx
- UnifiedInbox.jsx  
- AIKanbanBoard.jsx
- calendar-v2/core/CalendarProvider.js

### 3. Circuit Breaker Issue
The EventStore has a circuit breaker that blocks queries after 3 consecutive empty results. This is likely activated and preventing all event loading.

### 4. Context Nesting Order (in App.js)
```
UnifiedEventProvider
  └── EventProvider 
      └── NewEventProvider
```

## Root Cause
1. **Circuit breaker activated** - EventStore is blocking all queries after detecting empty results
2. **Context confusion** - Different components use different event systems
3. **No single source of truth** - Three contexts competing for the same purpose

## Immediate Fix (To Get Events Working)

### Step 1: Reset Circuit Breaker
Run this in the browser console:
```javascript
// Load and run the diagnostic script
const script = document.createElement('script');
script.src = '/diagnose-event-system.js';
document.head.appendChild(script);

// After it loads, run:
resetEventSystem();
```

### Step 2: Fix EventStore Circuit Breaker
The EventStore has duplicate calls to `checkCalendarEventGuard` and `processEmptyCalendarResult` that need to be cleaned up.

## Long-term Solution

### Consolidation Plan
1. **Use NewEventContext as the single source** - It has the best anti-loop protection
2. **Remove EventContext and UnifiedEventContext**
3. **Update all components to use NewEventContext**
4. **Fix App.js to only wrap with NewEventProvider**

### Migration Steps

#### Phase 1: Fix Immediate Issues
1. Clean up duplicate guard calls in EventStore
2. Update calendar-v2 to use NewEventContext
3. Update EnhancedEventManager to use NewEventContext

#### Phase 2: Consolidate Contexts
1. Update AllieChat to use NewEventContext instead of UnifiedEventContext
2. Update all direct EventStore usage to go through NewEventContext
3. Remove old contexts

#### Phase 3: Clean Architecture
```
App.js
  └── NewEventProvider (renamed to EventProvider)
      └── All child components use useEvents() from this context
```

## Quick Fix Script

To fix the immediate issue, here's what needs to be done:

1. **Fix EventStore.js** - Remove duplicate guard calls
2. **Update components** - Switch to NewEventContext
3. **Reset circuit breaker** - Clear the blocking state

## Components to Update

### High Priority (Currently Broken)
- `/src/components/calendar-v2/core/CalendarProvider.js` - Switch from EventContext to NewEventContext
- `/src/components/calendar/EnhancedEventManager.jsx` - Switch from EventContext to NewEventContext

### Medium Priority (Using Bridge)
- `/src/components/chat/AllieChat.jsx` - Switch from UnifiedEventContext to NewEventContext

### Low Priority (Direct Usage)
- Components using EventStore directly should continue working but should eventually use context

## Testing After Fix

1. Check home page calendar widget
2. Check family calendar tab
3. Check Allie chat event creation
4. Verify events show in all locations

## Prevention

1. Remove unused contexts to prevent confusion
2. Document which context should be used
3. Add lint rules to prevent direct EventStore imports in components
4. Consolidate all event logic into one context