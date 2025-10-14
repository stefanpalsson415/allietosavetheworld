// src/event-loop-guard-enhanced.js
/**
 * Enhanced Event Loop Protection with Calendar-specific circuit breaker
 * 
 * This utility provides robust protection against infinite event loops,
 * particularly for calendar event loading, by implementing multiple
 * circuit breaker patterns and rate limiting.
 */

// Baseline state
const baseState = {
  // General loop protection
  enabled: true,
  startTime: Date.now(),
  eventCounter: 0,
  circuitBreakerActive: false,
  lastResetTime: Date.now(),
  eventHistory: {},
  
  // Rate limiting
  rateLimitWindows: {},
  
  // Debug info
  debug: {
    loopDetections: 0,
    circuitBreaks: 0,
    lastWarning: 0
  }
};

// Calendar-specific state for specialized loop detection
const calendarState = {
  enabled: true,
  consecutiveEmptyResults: 0,
  eventLoadAttempts: 0,
  lastEmptyResultTime: 0,
  circuitBreakerActive: false,
  circuitBreakerReason: '',
  eventSources: {},
  rateLimitWindows: {},
  lastActivationTime: 0,
  bypassNextCheck: false,
  lastResetTime: 0,
  gracePeriodActive: false
};

// Initialize state in global scope if available
if (typeof window !== 'undefined') {
  window._eventLoopGuardState = window._eventLoopGuardState || {...baseState};
  window._calendarLoopGuardState = window._calendarLoopGuardState || {...calendarState};
}

// Constants for thresholds
const MAX_EVENTS_PER_SECOND = 30;
const CIRCUIT_BREAKER_DURATION = 60000; // 1 minute
const CALENDAR_CIRCUIT_BREAKER_DURATION = 120000; // 2 minutes 
const CONSECUTIVE_EMPTY_THRESHOLD = 10; // Increased from 3 to avoid false positives for new users
const WARNING_INTERVAL = 5000; // 5 seconds between warnings
const RATE_LIMIT_WINDOW = 10000; // 10 second window for rate limiting
const ABSOLUTE_MINIMUM_INTERVAL = 500; // 500ms absolute minimum between events

/**
 * Get current state, using global if available or return local copy
 */
function getState() {
  if (typeof window !== 'undefined' && window._eventLoopGuardState) {
    return window._eventLoopGuardState;
  }
  return baseState;
}

/**
 * Get calendar state, using global if available or return local copy
 */
function getCalendarState() {
  if (typeof window !== 'undefined' && window._calendarLoopGuardState) {
    return window._calendarLoopGuardState;
  }
  return calendarState;
}

/**
 * Reset the circuit breaker
 */
function resetCircuitBreaker() {
  const state = getState();
  state.circuitBreakerActive = false;
  state.lastResetTime = Date.now();
  state.eventCounter = 0;
  state.debug.lastWarning = 0;
  
  // Clean up old event history
  const cutoff = Date.now() - 3600000; // 1 hour
  Object.keys(state.eventHistory).forEach(key => {
    if (state.eventHistory[key].timestamp < cutoff) {
      delete state.eventHistory[key];
    }
  });
  
  // Clean up rate limit windows older than 1 hour
  Object.keys(state.rateLimitWindows).forEach(key => {
    if (state.rateLimitWindows[key].start < cutoff) {
      delete state.rateLimitWindows[key];
    }
  });
  
  console.log(`📊 Event Loop Guard: Circuit breaker reset at ${new Date().toISOString()}`);
  
  // Remove UI notification if present
  if (typeof document !== 'undefined') {
    const notification = document.getElementById('event-loop-guard-notification');
    if (notification) {
      notification.remove();
    }
  }
}

/**
 * Reset the calendar circuit breaker
 */
function resetCalendarCircuitBreaker() {
  const state = getCalendarState();
  state.circuitBreakerActive = false;
  state.consecutiveEmptyResults = 0;
  state.eventLoadAttempts = 0;
  state.circuitBreakerReason = '';
  state.lastEmptyResultTime = 0;
  state.bypassNextCheck = false;
  state.lastResetTime = Date.now();
  state.gracePeriodActive = true;
  
  // Clear all rate limit windows
  state.rateLimitWindows = {};
  
  // Reset global counters
  if (typeof window !== 'undefined') {
    window._eventEmptyResultCounter = 0;
    window._forceEventCircuitBreaker = false;
  }
  
  console.log(`📅 Calendar Loop Guard: Circuit breaker fully reset at ${new Date().toISOString()}`);
  
  // Remove UI notification if present
  if (typeof document !== 'undefined') {
    const notification = document.getElementById('calendar-circuit-breaker-notification');
    if (notification) {
      notification.remove();
    }
  }
  
  // Also reset global counter
  if (typeof window !== 'undefined') {
    window._eventEmptyResultCounter = 0;
    window._forceEventCircuitBreaker = false;
  }
  
  // Deactivate grace period after 60 seconds (extended to accommodate login flow)
  setTimeout(() => {
    const currentState = getCalendarState();
    currentState.gracePeriodActive = false;
    console.log('📅 Calendar Loop Guard: Grace period ended');
  }, 60000); // 60 second grace period
}

/**
 * Activate the circuit breaker for the specified duration
 * @param {string} reason Reason for activation
 * @param {number} duration Duration in ms, defaults to CIRCUIT_BREAKER_DURATION
 */
function activateCircuitBreaker(reason, duration = CIRCUIT_BREAKER_DURATION) {
  const state = getState();
  state.circuitBreakerActive = true;
  state.debug.circuitBreaks++;
  
  console.warn(`🔴 Event Loop Guard: Circuit breaker activated - ${reason}`);
  
  // Create UI notification if not already present
  if (typeof document !== 'undefined' && !document.getElementById('event-loop-guard-notification')) {
    try {
      const notification = document.createElement('div');
      notification.id = 'event-loop-guard-notification';
      notification.style.position = 'fixed';
      notification.style.top = '10px';
      notification.style.right = '10px';
      notification.style.backgroundColor = '#ff5252';
      notification.style.color = 'white';
      notification.style.padding = '10px 15px';
      notification.style.borderRadius = '4px';
      notification.style.zIndex = '9999';
      notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
      notification.style.display = 'flex';
      notification.style.alignItems = 'center';
      
      // Add warning icon
      const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      iconSvg.setAttribute('width', '20');
      iconSvg.setAttribute('height', '20');
      iconSvg.setAttribute('viewBox', '0 0 24 24');
      iconSvg.setAttribute('fill', 'none');
      iconSvg.setAttribute('stroke', 'currentColor');
      iconSvg.setAttribute('stroke-width', '2');
      iconSvg.setAttribute('stroke-linecap', 'round');
      iconSvg.setAttribute('stroke-linejoin', 'round');
      
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z');
      iconSvg.appendChild(path);
      
      const exclam = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      exclam.setAttribute('x1', '12');
      exclam.setAttribute('y1', '9');
      exclam.setAttribute('x2', '12');
      exclam.setAttribute('y2', '13');
      iconSvg.appendChild(exclam);
      
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      dot.setAttribute('x1', '12');
      dot.setAttribute('y1', '17');
      dot.setAttribute('x2', '12.01');
      dot.setAttribute('y2', '17');
      iconSvg.appendChild(dot);
      
      notification.appendChild(iconSvg);
      
      // Add text with margin
      const text = document.createElement('span');
      text.style.marginLeft = '8px';
      text.textContent = `Event loop detected - paused for ${duration/1000}s`;
      notification.appendChild(text);
      
      document.body.appendChild(notification);
    } catch (e) {
      console.error("Error creating notification:", e);
    }
  }
  
  // Schedule reset
  setTimeout(() => {
    resetCircuitBreaker();
  }, duration);
  
  return true;
}

/**
 * Activate the calendar circuit breaker
 * @param {string} reason Reason for activation
 * @param {number} duration Duration in ms, defaults to CALENDAR_CIRCUIT_BREAKER_DURATION
 */
function activateCalendarCircuitBreaker(reason, duration = CALENDAR_CIRCUIT_BREAKER_DURATION) {
  const state = getCalendarState();
  
  // Don't activate if already active
  if (state.circuitBreakerActive) {
    return true;
  }
  
  state.circuitBreakerActive = true;
  state.circuitBreakerReason = reason;
  state.lastActivationTime = Date.now();
  
  console.warn(`🔴 Calendar Loop Guard: Circuit breaker activated - ${reason}`);
  
  // Set global flag to ensure other components are aware
  if (typeof window !== 'undefined') {
    window._forceEventCircuitBreaker = true;
  }
  
  // Create UI notification if not already present
  if (typeof document !== 'undefined' && !document.getElementById('calendar-circuit-breaker-notification')) {
    try {
      const notification = document.createElement('div');
      notification.id = 'calendar-circuit-breaker-notification';
      notification.style.position = 'fixed';
      notification.style.bottom = '10px';
      notification.style.left = '10px';
      notification.style.backgroundColor = '#ff9800';
      notification.style.color = 'white';
      notification.style.padding = '10px 15px';
      notification.style.borderRadius = '4px';
      notification.style.zIndex = '9999';
      notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
      notification.style.display = 'flex';
      notification.style.alignItems = 'center';
      
      // Add calendar icon
      const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      iconSvg.setAttribute('width', '20');
      iconSvg.setAttribute('height', '20');
      iconSvg.setAttribute('viewBox', '0 0 24 24');
      iconSvg.setAttribute('fill', 'none');
      iconSvg.setAttribute('stroke', 'currentColor');
      iconSvg.setAttribute('stroke-width', '2');
      iconSvg.setAttribute('stroke-linecap', 'round');
      iconSvg.setAttribute('stroke-linejoin', 'round');
      
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '3');
      rect.setAttribute('y', '4');
      rect.setAttribute('width', '18');
      rect.setAttribute('height', '18');
      rect.setAttribute('rx', '2');
      rect.setAttribute('ry', '2');
      iconSvg.appendChild(rect);
      
      const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line1.setAttribute('x1', '16');
      line1.setAttribute('y1', '2');
      line1.setAttribute('x2', '16');
      line1.setAttribute('y2', '6');
      iconSvg.appendChild(line1);
      
      const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line2.setAttribute('x1', '8');
      line2.setAttribute('y1', '2');
      line2.setAttribute('x2', '8');
      line2.setAttribute('y2', '6');
      iconSvg.appendChild(line2);
      
      const line3 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line3.setAttribute('x1', '3');
      line3.setAttribute('y1', '10');
      line3.setAttribute('x2', '21');
      line3.setAttribute('y2', '10');
      iconSvg.appendChild(line3);
      
      notification.appendChild(iconSvg);
      
      // Add text with margin
      const text = document.createElement('span');
      text.style.marginLeft = '8px';
      text.textContent = `Calendar refresh paused: ${reason}`;
      notification.appendChild(text);
      
      document.body.appendChild(notification);
    } catch (e) {
      console.error("Error creating notification:", e);
    }
  }
  
  // Schedule reset
  setTimeout(() => {
    resetCalendarCircuitBreaker();
  }, duration);
  
  return true;
}

/**
 * Resolve the events source from the stack trace
 * @returns {string} Source identifier
 */
function resolveEventSource() {
  try {
    const stackLines = new Error().stack.split('\n');
    // Skip the first 3 lines (Error, this function, caller)
    for (let i = 3; i < Math.min(stackLines.length, 6); i++) {
      const line = stackLines[i];
      
      // Check for common sources
      if (line.includes('EventContext')) return 'EventContext';
      if (line.includes('useEvents')) return 'useEvents';
      if (line.includes('EventStore')) return 'EventStore';
      if (line.includes('EnhancedEventManager')) return 'EnhancedEventManager';
      if (line.includes('CalendarGrid')) return 'CalendarGrid';
      if (line.includes('EventsList')) return 'EventsList';
      if (line.includes('HabitDJService')) return 'HabitDJService';
      if (line.includes('HabitDJPanel')) return 'HabitDJPanel';
    }
    
    // If no match, return generic source
    return stackLines.length > 3 ? stackLines[3].trim().substring(0, 40) : 'unknown';
  } catch (e) {
    return 'error';
  }
}

/**
 * Check rate limits for a specific event type
 * @param {string} eventType The type of event to check
 * @param {number} maxPerWindow Maximum events allowed in the window
 * @param {number} windowDuration Duration of the window in ms
 * @returns {boolean} true if limit exceeded, false otherwise
 */
function checkRateLimit(eventType, maxPerWindow, windowDuration) {
  const state = getState();
  const now = Date.now();
  
  // Initialize rate limit window if not exists
  if (!state.rateLimitWindows[eventType]) {
    state.rateLimitWindows[eventType] = {
      start: now,
      count: 0
    };
  }
  
  const window = state.rateLimitWindows[eventType];
  
  // If window has expired, reset it
  if (now - window.start > windowDuration) {
    window.start = now;
    window.count = 1;
    return false;
  }
  
  // Increment counter and check limit
  window.count++;
  return window.count > maxPerWindow;
}

/**
 * Check the event loop guard
 * @param {string} eventName The name of the event being processed
 * @param {Object} options Configuration options
 * @param {number} options.threshold Maximum events per second (default: MAX_EVENTS_PER_SECOND)
 * @param {boolean} options.block Whether to block the event when limit exceeded (default: true)
 * @param {string} options.source Source identifier override
 * @returns {boolean} true if limit exceeded (guard triggered), false otherwise
 */
function checkEventLoopGuard(eventName, options = {}) {
  const state = getState();
  
  // Skip if disabled
  if (!state.enabled) return false;
  
  // Skip if circuit breaker is already active
  if (state.circuitBreakerActive) {
    // Log warning occasionally
    const now = Date.now();
    if (now - state.debug.lastWarning > WARNING_INTERVAL) {
      console.log(`⚠️ Event Loop Guard: Blocked "${eventName}" due to active circuit breaker`);
      state.debug.lastWarning = now;
    }
    return true;
  }
  
  // Update event counter
  state.eventCounter++;
  const elapsedSeconds = (Date.now() - state.startTime) / 1000;
  const threshold = options.threshold || MAX_EVENTS_PER_SECOND;
  
  // Determine event source
  const source = options.source || resolveEventSource();
  
  // Track event history for this type
  const eventKey = `${eventName}-${source}`;
  if (!state.eventHistory[eventKey]) {
    state.eventHistory[eventKey] = {
      count: 0,
      timestamp: Date.now(),
      lastIncrement: Date.now()
    };
  }
  
  const eventHistory = state.eventHistory[eventKey];
  const now = Date.now();
  
  // Check absolute minimum interval (must be at least ABSOLUTE_MINIMUM_INTERVAL ms apart)
  if (now - eventHistory.lastIncrement < ABSOLUTE_MINIMUM_INTERVAL) {
    eventHistory.count += 3; // Increment more for very fast events
  } else {
    eventHistory.count++;
  }
  eventHistory.lastIncrement = now;
  
  // Check if we've had too many of the same event in a short period
  if (eventHistory.count > threshold * 2 && now - eventHistory.timestamp < 15000) {
    state.debug.loopDetections++;
    activateCircuitBreaker(`Too many "${eventName}" events from ${source} (${eventHistory.count} in 15s)`);
    return true;
  }
  
  // Reset event history after some time
  if (now - eventHistory.timestamp > 30000) {
    eventHistory.count = 1;
    eventHistory.timestamp = now;
  }
  
  // Check overall event rate
  if (elapsedSeconds >= 1 && state.eventCounter / elapsedSeconds > threshold) {
    state.debug.loopDetections++;
    
    // When events per second exceeds threshold, activate circuit breaker
    activateCircuitBreaker(`Event rate exceeded (${Math.round(state.eventCounter / elapsedSeconds)}/s > ${threshold}/s)`);
    return true;
  }
  
  // Reset counter every 60 seconds
  if (Date.now() - state.startTime > 60000) {
    state.startTime = Date.now();
    state.eventCounter = 0;
  }
  
  return false;
}

/**
 * Check calendar event loop with specialized circuit breaker logic
 * @param {string} eventName The name of the calendar event
 * @param {Object} options Configuration options
 * @returns {boolean} true if circuit breaker is active, false otherwise
 */
function checkCalendarEventGuard(eventName, options = {}) {
  const state = getCalendarState();
  
  // Skip if disabled
  if (!state.enabled) return false;
  
  // Check for bypass flag
  if (state.bypassNextCheck) {
    console.log('🟢 Calendar event guard bypassed for:', eventName);
    state.bypassNextCheck = false; // Reset the flag
    return false;
  }
  
  // Check if we're in grace period (10 seconds after reset)
  if (state.gracePeriodActive) {
    console.log('🟢 Calendar event guard in grace period, allowing:', eventName);
    return false;
  }
  
  // Whitelist certain sources that need calendar access
  const source = options.source || resolveEventSource();
  const whitelistedSources = ['HabitDJService', 'HabitDJPanel', 'HabitBankService'];
  if (whitelistedSources.includes(source)) {
    return false; // Allow these sources through
  }
  
  // If circuit breaker is active, log and block
  if (state.circuitBreakerActive) {
    // Rate limit logs
    const now = Date.now();
    const LOG_INTERVAL = 10000; // 10 seconds between logs
    if (now - state.lastLogTime > LOG_INTERVAL) {
      console.log(`⚠️ Calendar Loop Guard: Blocked "${eventName}" (${state.circuitBreakerReason})`);
      state.lastLogTime = now;
    }
    return true;
  }
  
  // Check rate limits for calendar events
  const rateLimitKey = `${eventName}-${source}`;
  
  // Track event source
  if (!state.eventSources[source]) {
    state.eventSources[source] = {
      count: 0,
      lastSeen: Date.now()
    };
  }
  state.eventSources[source].count++;
  state.eventSources[source].lastSeen = Date.now();
  
  // Rate limit based on event type and source
  if (eventName === 'refreshEvents' && checkRateLimit(rateLimitKey, 5, 5000)) {
    // More than 5 refresh events from same source in 5 seconds
    return activateCalendarCircuitBreaker(`Too many calendar refreshes from ${source}`);
  }
  
  if (eventName === 'loadEvents' && checkRateLimit(rateLimitKey, 10, 5000)) {
    // More than 10 load events from same source in 5 seconds (increased threshold for initial load)
    return activateCalendarCircuitBreaker(`Too many loadEvents calls from ${source}`);
  }
  
  return false;
}

/**
 * Track and handle API calls to ensure we don't have request loops
 * @param {string} endpoint The API endpoint being called
 * @param {Object} options Configuration options
 * @returns {boolean} true if rate limit exceeded, false otherwise
 */
function checkApiCallGuard(endpoint, options = {}) {
  return checkRateLimit(`api-${endpoint}`, options.maxCalls || 10, options.window || 10000);
}

/**
 * ENHANCED: Add special method to track empty results
 * @returns {boolean} true if circuit breaker activated
 */
function processEmptyCalendarResult() {
  const state = getCalendarState();
  const now = Date.now();
  
  // Increment counter
  state.consecutiveEmptyResults++;
  state.lastEmptyResultTime = now;
  
  // Update global counter
  if (typeof window !== 'undefined') {
    window._eventEmptyResultCounter = Math.max(
      window._eventEmptyResultCounter || 0,
      state.consecutiveEmptyResults
    );
  }
  
  console.log(`📊 Calendar Loop Guard: Empty result #${state.consecutiveEmptyResults}, global counter: ${window._eventEmptyResultCounter || 0}`);
  
  // If too many consecutive empty results, activate circuit breaker
  if (state.consecutiveEmptyResults >= CONSECUTIVE_EMPTY_THRESHOLD && !state.circuitBreakerActive) {
    activateCalendarCircuitBreaker('Too many consecutive empty results');
  }
  
  return state.circuitBreakerActive;
}

/**
 * Reset the empty result counter when we successfully get results
 */
function clearEmptyResultCounter() {
  const state = getCalendarState();
  state.consecutiveEmptyResults = 0;
  
  // Update global counter
  if (typeof window !== 'undefined') {
    window._eventEmptyResultCounter = 0;
  }
}

/**
 * Get the current state of the circuit breakers
 * @returns {Object} State information
 */
function getGuardStatus() {
  const baseStateInfo = getState();
  const calendarStateInfo = getCalendarState();
  
  return {
    general: {
      circuitBreakerActive: baseStateInfo.circuitBreakerActive,
      eventCounter: baseStateInfo.eventCounter,
      elapsedSeconds: (Date.now() - baseStateInfo.startTime) / 1000,
      eventsPerSecond: baseStateInfo.eventCounter / ((Date.now() - baseStateInfo.startTime) / 1000),
      loopDetections: baseStateInfo.debug.loopDetections,
      circuitBreaks: baseStateInfo.debug.circuitBreaks
    },
    calendar: {
      circuitBreakerActive: calendarStateInfo.circuitBreakerActive,
      consecutiveEmptyResults: calendarStateInfo.consecutiveEmptyResults,
      eventLoadAttempts: calendarStateInfo.eventLoadAttempts,
      circuitBreakerReason: calendarStateInfo.circuitBreakerReason,
      lastActivation: calendarStateInfo.lastActivationTime,
      timeSinceLastActivation: calendarStateInfo.lastActivationTime ? Date.now() - calendarStateInfo.lastActivationTime : null
    }
  };
}

// Add custom window event listeners when in browser environment
if (typeof window !== 'undefined') {
  // Reset all circuit breakers when page visibility changes (user returns to page)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('🔄 Page became visible, resetting circuit breakers');
      resetCircuitBreaker();
      resetCalendarCircuitBreaker();
    }
  });
  
  // Expose reset methods to window for emergency manual reset
  window._resetEventCircuitBreaker = resetCircuitBreaker;
  window._resetCalendarCircuitBreaker = resetCalendarCircuitBreaker;
  window._getEventGuardStatus = getGuardStatus;
}

// Export all methods
/**
 * Set bypass flag for the next calendar event guard check
 * This allows legitimate updates (like from Allie chat) to bypass the guard
 */
function setCalendarBypass() {
  const state = getCalendarState();
  state.bypassNextCheck = true;
  console.log('🟢 Calendar event guard bypass activated');
}

export {
  checkEventLoopGuard,
  checkCalendarEventGuard,
  checkApiCallGuard,
  processEmptyCalendarResult,
  clearEmptyResultCounter,
  activateCircuitBreaker,
  activateCalendarCircuitBreaker,
  resetCircuitBreaker,
  resetCalendarCircuitBreaker,
  getGuardStatus,
  setCalendarBypass
};

// Default export for simplified usage
export default {
  checkEventLoopGuard,
  checkCalendarEventGuard,
  processEmptyCalendarResult,
  clearEmptyResultCounter
};