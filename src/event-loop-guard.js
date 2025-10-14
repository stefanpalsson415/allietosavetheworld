// event-loop-guard.js
// A centralized solution to prevent event loops across the application
// This applies protection to all custom events that might cause loops
// UPDATED with enhanced calendar event protection

// Initialize the guard system
function initEventLoopGuard() {
  console.log("⚡ Initializing enhanced event loop guard");
  
  // Registry of protected events
  const protectedEvents = [
    'force-calendar-refresh',
    'directory-refresh-needed',
    'provider-added',
    'provider-removed',
    'provider-directly-added',
    'standalone-provider-directory-update',
    'force-data-refresh',
    'calendar-event-added',
    'calendar-event-updated',
    'calendar-event-deleted',
    'family-data-updated',
    'load-providers',
    'events-load-failed',
    'calendar-events-refreshed',
    'force-date-change-refresh'
  ];
  
  // State tracking
  const eventStats = {
    // For each event type: { count, lastTime, isBlocking, blockUntil }
  };
  
  // Calendar-specific protection
  const calendarState = {
    consecutiveEmptyResults: 0,
    lastEmptyResultTime: 0,
    circuitBreakerActive: false,
    circuitBreakerTimeout: null
  };
  
  // Initialize stats
  protectedEvents.forEach(eventType => {
    eventStats[eventType] = {
      count: 0,
      lastTime: 0,
      isBlocking: false,
      blockUntil: 0
    };
  });
  
  // Event handler to capture and potentially block events
  function handleEvent(event) {
    const eventType = event.type;
    const now = Date.now();
    const stats = eventStats[eventType];
    
    // Skip if not tracking this event
    if (!stats) return;
    
    // ENHANCED: Check for special calendar circuit breaker
    if (calendarState.circuitBreakerActive && eventType.includes('calendar')) {
      console.warn(`🔄 Calendar circuit breaker active - blocking ${eventType} event`);
      event.stopImmediatePropagation();
      return;
    }
    
    // If blocking is active, stop propagation
    if (stats.isBlocking && now < stats.blockUntil) {
      console.warn(`🛑 Blocking excessive ${eventType} event (cooling down)`);
      event.stopImmediatePropagation();
      return;
    }
    
    // Reset blocking state if the cooling period is over
    if (stats.isBlocking && now >= stats.blockUntil) {
      stats.isBlocking = false;
      stats.count = 0;
    }
    
    // Count events in a time window (2 seconds)
    if (now - stats.lastTime < 2000) {
      stats.count++;
    } else {
      stats.count = 1;
    }
    
    stats.lastTime = now;
    
    // If too many events are triggered in short succession, start blocking
    if (stats.count > 5) {
      console.warn(`🔄 Event loop detected: ${stats.count} ${eventType} events in 2s`);
      stats.isBlocking = true;
      stats.blockUntil = now + 5000; // Block for 5 seconds
      
      // Stop this event
      event.stopImmediatePropagation();
      
      // If this is a refresh event, try to cancel loading states
      if (eventType.includes('refresh') || eventType.includes('update')) {
        cancelLoadingIndicators();
      }
      
      // For calendar events, activate the circuit breaker to completely stop calendar activity
      if (eventType.includes('calendar')) {
        activateCalendarCircuitBreaker('Too many consecutive events');
      }
    }
  }
  
  // Function to cancel loading indicators
  function cancelLoadingIndicators() {
    setTimeout(() => {
      try {
        // Find any spinner elements and stop them
        document.querySelectorAll('.animate-spin').forEach(element => {
          element.classList.remove('animate-spin');
        });
        
        // Try to reset isLoading flags in React components
        // This is a hack, but it's better than nothing
        if (typeof window !== 'undefined') {
          window._cancelLoading = true;
        }
      } catch (error) {
        console.error("Error canceling loading indicators:", error);
      }
    }, 50);
  }
  
  // ENHANCED: Specialized calendar circuit breaker function
  function activateCalendarCircuitBreaker(reason) {
    if (calendarState.circuitBreakerActive) {
      return; // Already active
    }
    
    console.warn(`🔄 Calendar circuit breaker activated: ${reason}`);
    calendarState.circuitBreakerActive = true;
    
    // Create visual indicator
    try {
      if (typeof document !== 'undefined' && !document.getElementById('calendar-circuit-breaker')) {
        const notice = document.createElement('div');
        notice.id = 'calendar-circuit-breaker';
        notice.style.position = 'fixed';
        notice.style.top = '10px';
        notice.style.left = '50%';
        notice.style.transform = 'translateX(-50%)';
        notice.style.backgroundColor = '#ff5252';
        notice.style.color = 'white';
        notice.style.padding = '10px 16px';
        notice.style.borderRadius = '4px';
        notice.style.zIndex = '9999';
        notice.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        notice.textContent = 'Calendar refresh paused due to too many events';
        document.body.appendChild(notice);
      }
    } catch (e) {
      console.error("Error creating circuit breaker notification:", e);
    }
    
    // Reset after timeout
    if (calendarState.circuitBreakerTimeout) {
      clearTimeout(calendarState.circuitBreakerTimeout);
    }
    
    calendarState.circuitBreakerTimeout = setTimeout(() => {
      // Reset circuit breaker
      calendarState.circuitBreakerActive = false;
      calendarState.consecutiveEmptyResults = 0;
      console.log("Calendar circuit breaker reset");
      
      // Remove notification
      try {
        const notice = document.getElementById('calendar-circuit-breaker');
        if (notice && notice.parentNode) {
          notice.parentNode.removeChild(notice);
        }
      } catch (e) {
        console.error("Error removing circuit breaker notification:", e);
      }
    }, 60000); // 1 minute timeout
  }
  
  // Register capture phase event listeners for all protected events
  protectedEvents.forEach(eventType => {
    window.addEventListener(eventType, handleEvent, { capture: true });
  });
  
  // Create a simpler provider creation function
  if (typeof window !== 'undefined') {
    window.createProviderFromAllie = async function(providerInfo) {
      if (!providerInfo || !providerInfo.name) {
        console.error("Invalid provider data");
        return { success: false, error: "Invalid provider data" };
      }
      
      try {
        // Get familyId from localStorage
        const familyId = localStorage.getItem('selectedFamilyId') ||
                        localStorage.getItem('currentFamilyId') ||
                        localStorage.getItem('familyId');
        
        if (!familyId) {
          console.warn("No familyId found in localStorage");
        }
        
        // Create the provider object
        const provider = {
          id: 'provider-' + Date.now(),
          name: providerInfo.name,
          type: providerInfo.type || 'medical',
          specialty: providerInfo.specialty || '',
          phone: providerInfo.phone || '',
          email: providerInfo.email || '',
          address: providerInfo.address || '',
          familyId: familyId,
          childName: providerInfo.childName || null,
          notes: providerInfo.notes || `Added by Allie Chat on ${new Date().toLocaleDateString()}`,
          createdAt: new Date().toISOString(),
          source: 'allie-chat'
        };
        
        // Save to localStorage
        let localProviders = [];
        try {
          const storedProviders = localStorage.getItem('localProviders');
          if (storedProviders) {
            localProviders = JSON.parse(storedProviders);
            if (!Array.isArray(localProviders)) localProviders = [];
          }
        } catch (e) {
          console.error("Error parsing stored providers:", e);
          localProviders = [];
        }
        
        localProviders.push(provider);
        localStorage.setItem('localProviders', JSON.stringify(localProviders));
        
        // Save as lastProvider
        localStorage.setItem('lastProvider', JSON.stringify(provider));
        
        console.log("Provider saved to localStorage");
        
        // Don't trigger too many updates - use the guard
        const stats = eventStats['directory-refresh-needed'] || { count: 0, lastTime: 0 };
        if (stats.count < 3) {
          // Dispatch directory refresh events (limited by the guard)
          window.dispatchEvent(new CustomEvent('provider-added', {
            detail: { providerId: provider.id, provider }
          }));
          
          // Delay additional events slightly
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('directory-refresh-needed'));
          }, 300);
        }
        
        return {
          success: true,
          id: provider.id,
          provider,
          message: `Added ${provider.name} to your provider directory.`
        };
      } catch (error) {
        console.error("Error creating provider:", error);
        return { success: false, error: error.message };
      }
    };
  }
  
  // ENHANCED: Add special method to track empty results
  function processEmptyCalendarResult() {
    const now = Date.now();
    
    // Increment counter
    calendarState.consecutiveEmptyResults++;
    calendarState.lastEmptyResultTime = now;
    
    // Log only every second update to avoid spam
    if (calendarState.consecutiveEmptyResults % 2 === 0) {
      console.log(`🔄 Empty calendar result #${calendarState.consecutiveEmptyResults}`);
    }
    
    // If too many consecutive empty results, activate circuit breaker
    if (calendarState.consecutiveEmptyResults >= 3 && !calendarState.circuitBreakerActive) {
      activateCalendarCircuitBreaker('Too many consecutive empty results');
    }
    
    return calendarState.circuitBreakerActive;
  }
  
  // Add empty results handler to window
  if (typeof window !== 'undefined') {
    window.handleEmptyCalendarResult = processEmptyCalendarResult;
  }
  
  return {
    isBlocking: function(eventType) {
      const stats = eventStats[eventType];
      return stats ? stats.isBlocking : false;
    },
    isCalendarCircuitBreakerActive: function() {
      return calendarState.circuitBreakerActive;
    },
    processEmptyCalendarResult: processEmptyCalendarResult,
    getStats: function() {
      return { 
        events: { ...eventStats },
        calendar: { ...calendarState }
      };
    },
    reset: function() {
      // Reset all stats
      Object.keys(eventStats).forEach(key => {
        eventStats[key] = {
          count: 0,
          lastTime: 0,
          isBlocking: false,
          blockUntil: 0
        };
      });
      
      // Reset calendar state
      calendarState.circuitBreakerActive = false;
      calendarState.consecutiveEmptyResults = 0;
      if (calendarState.circuitBreakerTimeout) {
        clearTimeout(calendarState.circuitBreakerTimeout);
        calendarState.circuitBreakerTimeout = null;
      }
      
      // Remove notification if present
      try {
        const notice = document.getElementById('calendar-circuit-breaker');
        if (notice && notice.parentNode) {
          notice.parentNode.removeChild(notice);
        }
      } catch (e) {
        console.error("Error removing circuit breaker notification:", e);
      }
    }
  };
}

// Export the guard
export const eventLoopGuard = (typeof window !== 'undefined') ? initEventLoopGuard() : null;

export default eventLoopGuard;