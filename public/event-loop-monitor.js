// public/event-loop-monitor.js
/**
 * Event Loop Monitor
 * 
 * This script provides a simple UI to monitor and debug event loops
 * in the application, particularly around calendar events.
 * 
 * Include this script in your HTML to add a monitoring UI.
 */

(function() {
  // Create monitor UI
  function createMonitorUI() {
    // Create container
    const container = document.createElement('div');
    container.id = 'event-loop-monitor';
    container.style.position = 'fixed';
    container.style.bottom = '10px';
    container.style.right = '10px';
    container.style.width = '300px';
    container.style.backgroundColor = '#1e293b';
    container.style.color = '#fff';
    container.style.padding = '10px';
    container.style.borderRadius = '8px';
    container.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    container.style.fontSize = '12px';
    container.style.zIndex = '9999';
    container.style.transition = 'all 0.3s ease';
    
    // Add title
    const title = document.createElement('div');
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '8px';
    title.style.display = 'flex';
    title.style.justifyContent = 'space-between';
    title.style.alignItems = 'center';
    title.innerHTML = '<span>📊 Event Loop Monitor</span>';
    
    // Add minimize button
    const minimizeBtn = document.createElement('button');
    minimizeBtn.innerHTML = '−';
    minimizeBtn.style.background = 'none';
    minimizeBtn.style.border = 'none';
    minimizeBtn.style.color = '#fff';
    minimizeBtn.style.cursor = 'pointer';
    minimizeBtn.style.fontSize = '16px';
    minimizeBtn.style.padding = '0 5px';
    minimizeBtn.onclick = toggleMinimize;
    title.appendChild(minimizeBtn);
    
    container.appendChild(title);
    
    // Create content container
    const content = document.createElement('div');
    content.id = 'event-loop-monitor-content';
    
    // Add status section
    const status = document.createElement('div');
    status.innerHTML = `
      <div style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between;">
          <span>General circuit breaker:</span>
          <span id="general-circuit-status">Inactive</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Calendar circuit breaker:</span>
          <span id="calendar-circuit-status">Inactive</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Empty results counter:</span>
          <span id="empty-results-counter">0</span>
        </div>
      </div>
    `;
    content.appendChild(status);
    
    // Add counters section
    const counters = document.createElement('div');
    counters.innerHTML = `
      <div style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between;">
          <span>Events/second:</span>
          <span id="events-per-second">0</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Loop detections:</span>
          <span id="loop-detections">0</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Circuit breaks:</span>
          <span id="circuit-breaks">0</span>
        </div>
      </div>
    `;
    content.appendChild(counters);
    
    // Add event log
    const logContainer = document.createElement('div');
    logContainer.style.marginTop = '10px';
    logContainer.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">Recent Events:</div>
      <div id="event-log" style="max-height: 100px; overflow-y: auto; background-color: #111827; padding: 5px; border-radius: 4px; font-family: monospace; font-size: 11px;">
      </div>
    `;
    content.appendChild(logContainer);
    
    // Add actions
    const actions = document.createElement('div');
    actions.style.marginTop = '10px';
    actions.style.display = 'flex';
    actions.style.gap = '5px';
    
    // Reset button
    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset Breakers';
    resetBtn.style.backgroundColor = '#2563eb';
    resetBtn.style.color = 'white';
    resetBtn.style.border = 'none';
    resetBtn.style.padding = '5px 10px';
    resetBtn.style.borderRadius = '4px';
    resetBtn.style.cursor = 'pointer';
    resetBtn.style.fontSize = '11px';
    resetBtn.onclick = resetCircuitBreakers;
    actions.appendChild(resetBtn);
    
    // Create event button
    const createEventBtn = document.createElement('button');
    createEventBtn.textContent = 'Create Test Event';
    createEventBtn.style.backgroundColor = '#059669';
    createEventBtn.style.color = 'white';
    createEventBtn.style.border = 'none';
    createEventBtn.style.padding = '5px 10px';
    createEventBtn.style.borderRadius = '4px';
    createEventBtn.style.cursor = 'pointer';
    createEventBtn.style.fontSize = '11px';
    createEventBtn.onclick = createTestEvent;
    actions.appendChild(createEventBtn);
    
    // Force refresh button
    const refreshBtn = document.createElement('button');
    refreshBtn.textContent = 'Force Refresh';
    refreshBtn.style.backgroundColor = '#d97706';
    refreshBtn.style.color = 'white';
    refreshBtn.style.border = 'none';
    refreshBtn.style.padding = '5px 10px';
    refreshBtn.style.borderRadius = '4px';
    refreshBtn.style.cursor = 'pointer';
    refreshBtn.style.fontSize = '11px';
    refreshBtn.onclick = forceCalendarRefresh;
    actions.appendChild(refreshBtn);
    
    content.appendChild(actions);
    container.appendChild(content);
    
    document.body.appendChild(container);
    return container;
  }
  
  // Toggle minimize state
  function toggleMinimize() {
    const container = document.getElementById('event-loop-monitor');
    const content = document.getElementById('event-loop-monitor-content');
    const button = container.querySelector('button');
    
    if (content.style.display === 'none') {
      content.style.display = 'block';
      container.style.width = '300px';
      button.innerHTML = '−';
    } else {
      content.style.display = 'none';
      container.style.width = '180px';
      button.innerHTML = '+';
    }
  }
  
  // Reset circuit breakers
  function resetCircuitBreakers() {
    if (window._resetEventCircuitBreaker) {
      window._resetEventCircuitBreaker();
    }
    
    if (window._resetCalendarCircuitBreaker) {
      window._resetCalendarCircuitBreaker();
    }
    
    window._eventEmptyResultCounter = 0;
    window._forceEventCircuitBreaker = false;
    
    addEventLog('Circuit breakers reset manually');
  }
  
  // Force calendar refresh
  function forceCalendarRefresh() {
    window.dispatchEvent(new CustomEvent('force-calendar-refresh', {
      detail: {
        source: 'event-loop-monitor',
        timestamp: Date.now()
      }
    }));
    
    addEventLog('Calendar refresh forced');
  }
  
  // Add event to log
  function addEventLog(message) {
    const log = document.getElementById('event-log');
    if (!log) return;
    
    const entry = document.createElement('div');
    entry.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
    
    log.prepend(entry);
    
    // Keep only last 10 entries
    const entries = log.querySelectorAll('div');
    if (entries.length > 10) {
      for (let i = 10; i < entries.length; i++) {
        entries[i].remove();
      }
    }
  }
  
  // Create test event in Firebase
  function createTestEvent() {
    // Notify user
    alert('Creating a test event in the calendar...');
    
    try {
      // Get current user
      let userId = '';
      let familyId = '';
      
      // Try to extract these from the window context if available
      if (window.currentUser && window.currentUser.uid) {
        userId = window.currentUser.uid;
      }
      
      if (window.familyId) {
        familyId = window.familyId;
      }
      
      // If we don't have them, try to get from localStorage
      if (!userId) {
        try {
          const authData = JSON.parse(localStorage.getItem('authUser'));
          if (authData && authData.uid) {
            userId = authData.uid;
          }
        } catch (e) {
          console.error('Error parsing auth data from localStorage:', e);
        }
      }
      
      if (!familyId) {
        try {
          const familyData = JSON.parse(localStorage.getItem('familyData'));
          if (familyData && familyData.id) {
            familyId = familyData.id;
          }
        } catch (e) {
          console.error('Error parsing family data from localStorage:', e);
        }
      }
      
      // Check if we have the necessary data
      if (!userId) {
        alert('Error: Could not determine user ID. Please make sure you are logged in.');
        return;
      }
      
      // Create event with proper structure
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 1);
      
      const newEvent = {
        title: `Test Event ${new Date().toLocaleTimeString()}`,
        description: 'This is a test event created by the event loop monitor',
        dateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString(),
        userId,
        familyId,
        attendees: [],
        category: 'general',
        eventType: 'general',
        source: 'event-loop-monitor',
        dateObj: startDate,
        dateEndObj: endDate,
        start: {
          dateTime: startDate.toISOString(),
          date: startDate.toISOString().split('T')[0],
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: endDate.toISOString(),
          date: endDate.toISOString().split('T')[0],
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Use EventStore if available
      if (window.EventStore && window.EventStore.addEvent) {
        window.EventStore.addEvent(newEvent, userId, familyId)
          .then(result => {
            if (result.success) {
              addEventLog(`Created test event: ${result.eventId}`);
              alert(`Test event created successfully! ID: ${result.eventId}`);
              
              // Force refresh
              window.dispatchEvent(new CustomEvent('force-calendar-refresh'));
            } else {
              addEventLog(`Failed to create test event: ${result.error}`);
              alert(`Failed to create event: ${result.error}`);
            }
          })
          .catch(err => {
            addEventLog(`Error creating test event: ${err.message}`);
            alert(`Error creating event: ${err.message}`);
          });
      } else {
        // Use firebase directly
        const db = window.firebase ? window.firebase.firestore() : null;
        
        if (!db) {
          alert('Error: Firebase not available');
          return;
        }
        
        db.collection('events').add(newEvent)
          .then(docRef => {
            addEventLog(`Created test event: ${docRef.id}`);
            alert(`Test event created successfully! ID: ${docRef.id}`);
            
            // Force refresh
            window.dispatchEvent(new CustomEvent('force-calendar-refresh'));
          })
          .catch(err => {
            addEventLog(`Error creating test event: ${err.message}`);
            alert(`Error creating event: ${err.message}`);
          });
      }
    } catch (e) {
      console.error('Error creating test event:', e);
      alert(`Error creating test event: ${e.message}`);
    }
  }
  
  // Update monitor UI
  function updateMonitor() {
    try {
      // Get guard status
      const status = window._getEventGuardStatus ? window._getEventGuardStatus() : {
        general: {
          circuitBreakerActive: false,
          eventCounter: 0,
          eventsPerSecond: 0,
          loopDetections: 0,
          circuitBreaks: 0
        },
        calendar: {
          circuitBreakerActive: false,
          consecutiveEmptyResults: 0,
          circuitBreakerReason: ''
        }
      };
      
      // Update status indicators
      const generalStatus = document.getElementById('general-circuit-status');
      if (generalStatus) {
        generalStatus.textContent = status.general.circuitBreakerActive ? 'ACTIVE' : 'Inactive';
        generalStatus.style.color = status.general.circuitBreakerActive ? '#ef4444' : '#10b981';
      }
      
      const calendarStatus = document.getElementById('calendar-circuit-status');
      if (calendarStatus) {
        calendarStatus.textContent = status.calendar.circuitBreakerActive ? 'ACTIVE' : 'Inactive';
        calendarStatus.style.color = status.calendar.circuitBreakerActive ? '#ef4444' : '#10b981';
      }
      
      const emptyCounter = document.getElementById('empty-results-counter');
      if (emptyCounter) {
        const count = status.calendar.consecutiveEmptyResults || window._eventEmptyResultCounter || 0;
        emptyCounter.textContent = count;
        emptyCounter.style.color = count >= 2 ? '#ef4444' : '#10b981';
      }
      
      // Update counters
      const eventsPerSecond = document.getElementById('events-per-second');
      if (eventsPerSecond) {
        eventsPerSecond.textContent = status.general.eventsPerSecond.toFixed(1);
      }
      
      const loopDetections = document.getElementById('loop-detections');
      if (loopDetections) {
        loopDetections.textContent = status.general.loopDetections;
      }
      
      const circuitBreaks = document.getElementById('circuit-breaks');
      if (circuitBreaks) {
        circuitBreaks.textContent = status.general.circuitBreaks;
      }
    } catch (e) {
      console.error('Error updating monitor:', e);
    }
  }
  
  // Initialize when DOM is ready
  function initialize() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onReady);
    } else {
      onReady();
    }
  }
  
  // Setup when DOM is ready
  function onReady() {
    const container = createMonitorUI();
    
    // Update monitor every second
    setInterval(updateMonitor, 1000);
    
    // Listen for relevant events
    window.addEventListener('force-calendar-refresh', () => {
      addEventLog('Calendar refresh requested');
    });
    
    window.addEventListener('calendar-events-refreshed', (e) => {
      addEventLog(`Calendar refreshed: ${e.detail?.count || 0} events`);
    });
    
    window.addEventListener('events-load-failed', (e) => {
      addEventLog(`Events load failed: ${e.detail?.reason}`);
    });
    
    // For event loop detection
    let eventLoopCounter = 0;
    const eventLoopInterval = setInterval(() => {
      eventLoopCounter = 0;
    }, 1000);
    
    // Attach a listener to monitor potentially looping events
    const originalAddEventListener = window.addEventListener;
    window.addEventListener = function(type, listener, options) {
      if (type === 'force-calendar-refresh') {
        const wrappedListener = function(event) {
          eventLoopCounter++;
          
          // Report suspicious activity
          if (eventLoopCounter > 5) {
            addEventLog(`Warning: High frequency of '${type}' (${eventLoopCounter}/s)`);
          }
          
          return listener.apply(this, arguments);
        };
        
        return originalAddEventListener.call(this, type, wrappedListener, options);
      } else {
        return originalAddEventListener.call(this, type, listener, options);
      }
    };
  }
  
  // Start initialization
  initialize();
})();