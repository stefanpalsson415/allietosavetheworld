// Clear circuit breaker state for clean survey experience
console.log('🧹 Clearing circuit breaker state...');

// Clear all calendar-related state
if (window._calendarLoopGuardState) {
  window._calendarLoopGuardState.gracePeriodActive = false;
  window._calendarLoopGuardState.emptyResultCount = 0;
  window._calendarLoopGuardState.circuitBreakerActive = false;
}

// Clear event empty result counter
window._eventEmptyResultCounter = 0;

// Clear force circuit breaker flag
window._forceEventCircuitBreaker = false;

// Clear any existing circuit breaker notifications
const existingNotice = document.getElementById('circuit-breaker-notice');
if (existingNotice) {
  existingNotice.remove();
}

const existingError = document.getElementById('event-store-error');
if (existingError) {
  existingError.remove();
}

// Clear localStorage circuit breaker state
localStorage.removeItem('calendarCircuitBreakerActive');
localStorage.removeItem('calendarLoopGuardState');

console.log('✅ Circuit breaker state cleared successfully');
console.log('ℹ️ You can now work on surveys without calendar interference');