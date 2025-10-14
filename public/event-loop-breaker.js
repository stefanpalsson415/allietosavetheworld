// event-loop-breaker.js
// Global circuit breaker to detect and prevent event loops

(function() {
  console.log("🧩 Event Loop Breaker: Initializing...");
  
  // Configuration
  const LOOP_THRESHOLD = 10; // Number of repeats before we consider it a loop
  const TIME_WINDOW = 3000; // Time window in ms to track events
  const CHECK_INTERVAL = 1000; // How often to check for loops (ms)
  const MAX_ENTRIES = 1000; // Maximum number of tracked events
  const RESET_AFTER_BREAK = 10000; // Time to wait after breaking a loop before reactivating
  
  // State
  let eventCounter = new Map();
  let eventTimestamps = new Map();
  let loopDetected = false;
  let lastBreakTime = 0;
  let eventIntervals = new Map(); // Track timing between same events
  let originalAddEventListener = window.addEventListener;
  let originalDispatchEvent = window.EventTarget.prototype.dispatchEvent;
  let patched = false;
  
  // Initialization
  window._eventLoopBreaker = {
    enabled: true,
    loopsDetected: [],
    breakCount: 0,
    resetEventTracking: resetEventTracking,
    getStats: getStats,
    disable: () => { window._eventLoopBreaker.enabled = false; },
    enable: () => { window._eventLoopBreaker.enabled = true; }
  };
  
  // Function to create a simple event ID
  function getEventId(event) {
    if (typeof event === 'string') {
      return event;
    }
    // For CustomEvent with a detail object
    if (event.type === 'CustomEvent' && event.detail) {
      return `${event.type}-${JSON.stringify(event.detail).substring(0, 100)}`;
    }
    
    // For CustomEvent objects
    if (event.type && (
         event.type === 'force-calendar-refresh' || 
         event.type === 'provider-added' || 
         event.type === 'directory-refresh-needed' ||
         event.type === 'force-data-refresh'
       )) {
      // Include essential properties in the ID
      let id = event.type;
      if (event.detail) {
        if (event.detail.source) id += `-${event.detail.source}`;
        if (event.detail.eventId) id += `-${event.detail.eventId}`;
        if (event.detail.providerId) id += `-${event.detail.providerId}`;
      }
      return id;
    }
    
    return event.type || 'unknown-event';
  }
  
  // Reset event tracking
  function resetEventTracking() {
    console.log("🧩 Event Loop Breaker: Resetting event tracking");
    eventCounter = new Map();
    eventTimestamps = new Map();
    eventIntervals = new Map();
    loopDetected = false;
  }
  
  // Get current stats
  function getStats() {
    // Convert Maps to plain objects for easier viewing
    const counterObj = {};
    eventCounter.forEach((count, key) => {
      counterObj[key] = count;
    });
    
    // Sort by highest count
    const sortedEvents = Array.from(eventCounter.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => ({ event: key, count }));
    
    return {
      totalEventsTracked: eventCounter.size,
      topEvents: sortedEvents,
      loopDetected: loopDetected,
      breakCount: window._eventLoopBreaker.breakCount,
      loopsDetected: window._eventLoopBreaker.loopsDetected,
      enabled: window._eventLoopBreaker.enabled
    };
  }
  
  // Monitor event dispatches for loops
  function monitorEvent(event) {
    if (!window._eventLoopBreaker.enabled) return;
    
    const now = Date.now();
    const eventId = getEventId(event);
    
    // Skip monitoring if we've recently broken a loop
    if (now - lastBreakTime < RESET_AFTER_BREAK) {
      return;
    }
    
    // Skip events that aren't worth tracking
    if (eventId === 'mousemove' || eventId === 'pointermove' || 
        eventId === 'scroll' || eventId === 'mouseover' ||
        eventId === 'mouseout') {
      return;
    }
    
    // Track event frequency
    const count = (eventCounter.get(eventId) || 0) + 1;
    eventCounter.set(eventId, count);
    
    // Store timestamp
    const timestamps = eventTimestamps.get(eventId) || [];
    timestamps.push(now);
    
    // Keep only recent timestamps
    const recentTimestamps = timestamps.filter(ts => now - ts < TIME_WINDOW);
    eventTimestamps.set(eventId, recentTimestamps);
    
    // Track intervals between same events
    if (timestamps.length > 1) {
      const lastTime = timestamps[timestamps.length - 2];
      const interval = now - lastTime;
      
      const intervals = eventIntervals.get(eventId) || [];
      intervals.push(interval);
      
      // Keep only recent intervals (last 5)
      if (intervals.length > 5) {
        intervals.shift();
      }
      
      eventIntervals.set(eventId, intervals);
      
      // Check for loop pattern: regular intervals + high frequency
      if (intervals.length >= 3 && recentTimestamps.length > LOOP_THRESHOLD) {
        // Calculate standard deviation of intervals - very low SD indicates a loop
        const mean = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
        const differences = intervals.map(val => Math.abs(val - mean));
        const avgDifference = differences.reduce((sum, val) => sum + val, 0) / differences.length;
        
        // If intervals are very regular (small differences) and frequency is high
        if (avgDifference < 50 && recentTimestamps.length > LOOP_THRESHOLD) {
          console.warn(`🧩 Event loop detected: ${eventId}, ${recentTimestamps.length} occurrences in ${TIME_WINDOW}ms with interval ~${Math.round(mean)}ms`);
          
          // Record the loop
          window._eventLoopBreaker.loopsDetected.push({
            eventId,
            count: recentTimestamps.length,
            timeWindow: TIME_WINDOW,
            avgInterval: Math.round(mean),
            timestamp: now
          });
          
          // Set loop detected flag
          loopDetected = true;
          window._eventLoopBreaker.breakCount++;
          lastBreakTime = now;
          
          // Break the loop using a more intelligent approach if possible
          if (eventId === 'force-calendar-refresh' || 
              eventId.startsWith('force-calendar-refresh-') ||
              eventId === 'directory-refresh-needed' || 
              eventId === 'provider-added') {
            patchEventListeners(eventId);
          }
        }
      }
    }
    
    // Prevent memory leaks by limiting total entries
    if (eventCounter.size > MAX_ENTRIES) {
      const keys = Array.from(eventCounter.keys());
      const halfLength = Math.floor(keys.length / 2);
      
      // Remove the oldest half of entries
      for (let i = 0; i < halfLength; i++) {
        eventCounter.delete(keys[i]);
        eventTimestamps.delete(keys[i]);
        eventIntervals.delete(keys[i]);
      }
    }
  }
  
  // Patch addEventListener to monitor and break loops
  function patchEventListeners(breakEvent) {
    if (patched) return; // Avoid double patching
    patched = true;
    
    console.warn(`🧩 Patching event listeners for: ${breakEvent}`);
    
    // Create list of events to monitor specifically
    const eventsToBlock = [
      'force-calendar-refresh',
      'provider-added',
      'directory-refresh-needed',
      'force-data-refresh'
    ];
    
    // Replace the dispatchEvent method
    window.EventTarget.prototype.dispatchEvent = function(event) {
      const eventName = event.type;
      
      // If this is an event we want to block and a loop is detected
      if (loopDetected && eventsToBlock.includes(eventName)) {
        const now = Date.now();
        
        // Only block events if we're in the break time window
        if (now - lastBreakTime < RESET_AFTER_BREAK) {
          console.warn(`🧩 Blocking event: ${eventName} during circuit breaker active period`);
          return true; // Pretend it was dispatched
        }
      }
      
      // For all events, monitor but don't block
      monitorEvent(event);
      
      // Call the original method
      return originalDispatchEvent.call(this, event);
    };
    
    // After a delay, reset patched flag to allow re-patching if needed
    setTimeout(() => {
      patched = false;
    }, RESET_AFTER_BREAK);
  }
  
  // Set up a periodic check for loops
  setInterval(() => {
    // Check for high-frequency events
    eventTimestamps.forEach((timestamps, eventId) => {
      const now = Date.now();
      const recentCount = timestamps.filter(ts => now - ts < TIME_WINDOW).length;
      
      if (recentCount > LOOP_THRESHOLD) {
        const intervals = eventIntervals.get(eventId) || [];
        
        // Only report if we have enough data
        if (intervals.length >= 3) {
          const mean = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
          
          // Calculate average difference from mean to detect regularity
          const differences = intervals.map(val => Math.abs(val - mean));
          const avgDifference = differences.reduce((sum, val) => sum + val, 0) / differences.length;
          
          // Very regular intervals suggest a loop
          if (avgDifference < 50) {
            console.warn(`🧩 Potential event loop: ${eventId}, ${recentCount} occurrences in ${TIME_WINDOW}ms with interval ~${Math.round(mean)}ms`);
          }
        }
      }
    });
  }, CHECK_INTERVAL);
  
  // Monitor loading family data spinners specifically
  setInterval(() => {
    // Find loading text elements the standard way
    const loadingSpinners = [];
    const allElements = document.querySelectorAll('*');
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      if (el.textContent && el.textContent.includes('Loading family data')) {
        loadingSpinners.push(el);
      }
    }

    if (loadingSpinners.length > 0) {
      console.log("🧩 Detected 'Loading family data...' spinner for over 5 seconds");
      
      // Force reset loading state and break any event loops
      if (!loopDetected) {
        console.warn("🧩 Taking emergency action to reset stuck loading state");
        
        // Set loopDetected and lastBreakTime to trigger loop breaking logic
        loopDetected = true;
        lastBreakTime = Date.now();
        window._eventLoopBreaker.breakCount++;
        
        // Patch event listeners for all known problematic events
        patchEventListeners('force-calendar-refresh');
        
        // Force dispatch load-completed event to unstick loading UI
        setTimeout(() => {
          console.log("🧩 Dispatching load-completed event to stop spinners");
          window.dispatchEvent(new CustomEvent('load-completed'));
          
          // Try to remove loading elements
          document.querySelectorAll('[role="progressbar"]').forEach(el => {
            try {
              el.remove();
            } catch (e) {
              // Ignore errors
            }
          });
          
          // Force refresh the page if loading persists for too long
          setTimeout(() => {
            // Check for loading text elements again
            const persistentSpinners = [];
            const allEls = document.querySelectorAll('*');
            for (let i = 0; i < allEls.length; i++) {
              const el = allEls[i];
              if (el.textContent && el.textContent.includes('Loading family data')) {
                persistentSpinners.push(el);
              }
            }

            if (persistentSpinners.length > 0) {
              console.warn("🧩 Loading state persists, forcing page refresh");
              window.location.reload();
            }
          }, 5000);
        }, 2000);
      }
    }
  }, 5000);
  
  console.log("🧩 Event Loop Breaker: Ready - monitoring for event loops");
})();