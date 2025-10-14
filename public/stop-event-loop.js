// Temporary script to stop event loading loops
// Add this script to your HTML to temporarily disable auto-refresh
// <script src="/stop-event-loop.js"></script>

(function() {
  if (typeof window === 'undefined') return;
  
  console.log("📅 Event loop stopper initialized");
  
  // Create a control panel for easy debugging
  function createControlPanel() {
    const panel = document.createElement('div');
    panel.id = 'event-debug-panel';
    panel.style.position = 'fixed';
    panel.style.top = '10px';
    panel.style.right = '10px';
    panel.style.backgroundColor = '#fff';
    panel.style.border = '1px solid #ccc';
    panel.style.borderRadius = '4px';
    panel.style.padding = '10px';
    panel.style.zIndex = '999999';
    panel.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    panel.style.maxWidth = '300px';
    panel.style.fontSize = '14px';
    
    panel.innerHTML = `
      <h3 style="margin: 0 0 10px 0; font-size: 16px;">Calendar Debug</h3>
      <div style="margin-bottom: 10px;">
        <button id="disable-refresh" style="background: #ff5252; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Disable Auto-Refresh</button>
        <button id="enable-refresh" style="background: #4caf50; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-left: 5px;">Enable Auto-Refresh</button>
      </div>
      <div style="margin-bottom: 10px;">
        <button id="force-circuit-breaker" style="background: #ff9800; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Activate Circuit Breaker</button>
      </div>
      <div style="margin-bottom: 5px; font-weight: bold;">Status:</div>
      <div id="event-debug-status" style="margin-bottom: 10px; font-size: 13px; color: #666;">Monitoring...</div>
      <div style="display: flex; justify-content: space-between;">
        <div>
          <div style="font-weight: bold; margin-bottom: 5px;">Event Stats</div>
          <div id="event-stats" style="font-size: 12px; color: #666;">Event Count: 0</div>
        </div>
        <div>
          <div style="font-weight: bold; margin-bottom: 5px;">Circuit Breaker</div>
          <div id="circuit-breaker-status" style="font-size: 12px; color: #4caf50;">Inactive</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // Event counters
    window._eventDebug = {
      refreshCount: 0,
      autoRefreshDisabled: false,
      circuitBreakerActive: false
    };
    
    // Set up event listeners for buttons
    document.getElementById('disable-refresh').addEventListener('click', function() {
      window._eventDebug.autoRefreshDisabled = true;
      document.getElementById('event-debug-status').innerText = 'Auto-refresh disabled';
      document.getElementById('event-debug-status').style.color = '#ff5252';
      updateControlPanel();
    });
    
    document.getElementById('enable-refresh').addEventListener('click', function() {
      window._eventDebug.autoRefreshDisabled = false;
      document.getElementById('event-debug-status').innerText = 'Auto-refresh enabled';
      document.getElementById('event-debug-status').style.color = '#4caf50';
      updateControlPanel();
    });
    
    document.getElementById('force-circuit-breaker').addEventListener('click', function() {
      window._eventDebug.circuitBreakerActive = true;
      document.getElementById('circuit-breaker-status').innerText = 'ACTIVE';
      document.getElementById('circuit-breaker-status').style.color = '#ff5252';
      
      // Reset after 1 minute
      setTimeout(() => {
        window._eventDebug.circuitBreakerActive = false;
        document.getElementById('circuit-breaker-status').innerText = 'Inactive';
        document.getElementById('circuit-breaker-status').style.color = '#4caf50';
      }, 60000);
    });
    
    // Update control panel stats
    function updateControlPanel() {
      document.getElementById('event-stats').innerText = `Event Count: ${window._eventDebug.refreshCount}`;
      
      // Update button states
      if (window._eventDebug.autoRefreshDisabled) {
        document.getElementById('disable-refresh').style.opacity = '0.5';
        document.getElementById('disable-refresh').style.cursor = 'default';
        document.getElementById('enable-refresh').style.opacity = '1';
        document.getElementById('enable-refresh').style.cursor = 'pointer';
      } else {
        document.getElementById('disable-refresh').style.opacity = '1';
        document.getElementById('disable-refresh').style.cursor = 'pointer';
        document.getElementById('enable-refresh').style.opacity = '0.5';
        document.getElementById('enable-refresh').style.cursor = 'default';
      }
    }
    
    // Update every second
    setInterval(updateControlPanel, 1000);
    
    return panel;
  }
  
  // Create control panel after short delay to ensure DOM is ready
  setTimeout(() => {
    if (document.body) {
      createControlPanel();
    }
  }, 1000);
  
  // Intercept force-calendar-refresh events
  const originalAddEventListener = window.EventTarget.prototype.addEventListener;
  window.EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (type === 'force-calendar-refresh') {
      // Wrap the listener to allow for debugging and disabling
      const wrappedListener = function(event) {
        // Count refresh events
        if (window._eventDebug) {
          window._eventDebug.refreshCount++;
        }
        
        // Check if auto-refresh is disabled
        if (window._eventDebug && window._eventDebug.autoRefreshDisabled) {
          console.log('🛑 Auto-refresh disabled by debug panel - blocking event');
          event.stopImmediatePropagation();
          return false;
        }
        
        // Check if circuit breaker is active
        if (window._eventDebug && window._eventDebug.circuitBreakerActive) {
          console.log('🛑 Circuit breaker active - blocking event');
          event.stopImmediatePropagation();
          return false;
        }
        
        // Otherwise, let the event through to the original listener
        return listener.apply(this, arguments);
      };
      
      // Store the wrapped listener on the original
      if (!listener._wrapped) {
        listener._wrapped = wrappedListener;
      }
      
      // Call original with our wrapped listener
      return originalAddEventListener.call(this, type, listener._wrapped || wrappedListener, options);
    }
    
    // For all other event types, pass through unchanged
    return originalAddEventListener.call(this, type, listener, options);
  };
  
  // Also intercept dispatchEvent to count and potentially block refresh events
  const originalDispatchEvent = window.EventTarget.prototype.dispatchEvent;
  window.EventTarget.prototype.dispatchEvent = function(event) {
    if (event.type === 'force-calendar-refresh') {
      // Check if auto-refresh is disabled
      if (window._eventDebug && window._eventDebug.autoRefreshDisabled) {
        console.log('🛑 Auto-refresh disabled - blocking dispatch');
        return false;
      }
      
      // Check if circuit breaker is active
      if (window._eventDebug && window._eventDebug.circuitBreakerActive) {
        console.log('🛑 Circuit breaker active - blocking dispatch');
        return false;
      }
    }
    
    // Pass through to original
    return originalDispatchEvent.call(this, event);
  };
  
  console.log("📅 Event loop stopper ready - auto-refresh can now be disabled");
})();