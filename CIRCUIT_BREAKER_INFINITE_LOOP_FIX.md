# Circuit Breaker Infinite Loop Fix

## Problem
The app was showing two error popups and experiencing infinite re-renders with the error:
- "Maximum update depth exceeded"
- Circuit breaker activating repeatedly even during grace period
- Global counter reaching 5 and forcing activation

## Root Cause
The circuit breaker was updating React state (`setCircuitBreakerActive(true)`) during the render phase, which triggered more renders, creating an infinite loop:

1. Component renders → useEffect runs
2. Circuit breaker check sees global counter >= 5
3. Sets state with `setCircuitBreakerActive(true)` 
4. State change triggers re-render
5. Back to step 1 (infinite loop)

## Solution Applied

### 1. Added Ref to Track State (NewEventContext.js)
```javascript
const circuitBreakerActiveRef = useRef(false);
```
This ref mirrors the state but persists across renders and prevents closure issues.

### 2. Deferred All State Updates
Changed all circuit breaker activations from:
```javascript
// OLD - causes render during render
setCircuitBreakerActive(true);
```

To:
```javascript
// NEW - defers to next tick
setTimeout(() => {
  if (!circuitBreakerActiveRef.current) {
    circuitBreakerActiveRef.current = true;
    setCircuitBreakerActive(true);
  }
}, 0);
```

### 3. Added Grace Period Checks
Before activating the circuit breaker, now checking if we're in grace period:
```javascript
const calendarState = getCalendarState();
if (calendarState && calendarState.gracePeriodActive) {
  return; // Don't activate during grace period
}
```

### 4. Extended Grace Period
Increased from 10 seconds to 30 seconds in event-loop-guard-enhanced.js:
```javascript
setTimeout(() => {
  currentState.gracePeriodActive = false;
}, 30000); // 30 second grace period
```

### 5. Fixed State Synchronization
Always update both ref and state together:
```javascript
circuitBreakerActiveRef.current = true;
setCircuitBreakerActive(true);
```

## Result
- No more infinite re-renders
- Circuit breaker still protects against real loops
- Grace period properly prevents false positives on app load
- State updates happen safely outside render phase

## How It Works Now
1. App loads → Grace period active for 30 seconds
2. During grace period → All operations allowed
3. If issues detected after grace period → Circuit breaker activates safely
4. State updates deferred → No render loops
5. Ref prevents multiple activations → Clean protection