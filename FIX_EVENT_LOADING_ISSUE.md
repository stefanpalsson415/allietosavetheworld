# Fix for Event Loading Issue

## Problem
After updating NotionUpcomingEvents to use UnifiedEventContext, events stopped loading due to circuit breaker activation. The console showed:
- "Calendar Loop Guard: Circuit breaker activated - Too many loadEvents calls"
- "Calendar event guard blocked loadEvents call"

## Root Cause
The app has multiple event contexts wrapped around components:
- `EventProvider`
- `NewEventProvider` 
- `UnifiedEventProvider`

When NotionUpcomingEvents was changed to use UnifiedEventContext, it caused conflicts with NewEventContext which was already loading events, triggering the circuit breaker protection.

## Solution
1. **Reverted NotionUpcomingEvents** to use `useEvents()` from NewEventContext instead of `useUnifiedEvent()`
2. **Kept event update functionality** in AllieChat using UnifiedEventContext for updates
3. **Added refresh trigger** to ensure NewEventContext refreshes after updates

## How It Works Now
- NotionUpcomingEvents uses NewEventContext to display events (avoiding conflicts)
- When clicking an event, it still passes complete event data to Allie chat
- AllieChat uses UnifiedEventContext.updateEvent() for edits
- After updating, it calls refreshEvents() from NewEventContext to sync the display
- Both contexts stay in sync without triggering the circuit breaker

## Code Changes
1. `NotionUpcomingEvents.jsx`: Changed from `useUnifiedEvent()` to `useEvents()`
2. `AllieChat.jsx`: Added `useEvents()` hook and calls `refreshEvents()` after updates

This maintains the global event synchronization while working within the existing multi-context architecture.