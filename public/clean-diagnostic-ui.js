// clean-diagnostic-ui.js
// This script removes debugging UI elements that are no longer needed

document.addEventListener('DOMContentLoaded', function() {
  console.log("Cleaning up diagnostic UI elements");
  
  // Function to remove diagnostic elements
  function removeDiagnosticElements() {
    // 1. Remove the blue calendar fix notification
    const calendarFixNotice = document.querySelector('[class*="Calendar fix applied"]');
    if (calendarFixNotice) {
      calendarFixNotice.remove();
      console.log("Removed calendar fix notification");
    }

    // 2. Remove the calendar issue diagnostic panel
    const calendarDiagnostic = document.getElementById('calendar-issue-diagnostic');
    if (calendarDiagnostic) {
      calendarDiagnostic.remove();
      console.log("Removed calendar diagnostic panel");
    }

    // 3. Remove the firebase index diagnostic panel
    const firebaseIndexDiagnostic = document.getElementById('firebase-index-diagnostic');
    if (firebaseIndexDiagnostic) {
      firebaseIndexDiagnostic.remove();
      console.log("Removed Firebase index diagnostic panel");
    }

    // 4. Remove the firebase index helper panel
    const firebaseIndexHelper = document.getElementById('firebase-index-helper');
    if (firebaseIndexHelper) {
      firebaseIndexHelper.remove();
      console.log("Removed Firebase index helper panel");
    }

    // 5. Remove the event loop monitor
    const eventLoopMonitor = document.getElementById('event-loop-monitor');
    if (eventLoopMonitor) {
      eventLoopMonitor.remove();
      console.log("Removed event loop monitor");
    }

    // 6. Remove the circuit breaker notification
    const circuitBreakerNotice = document.getElementById('circuit-breaker-notice');
    if (circuitBreakerNotice) {
      circuitBreakerNotice.remove();
      console.log("Removed circuit breaker notification");
    }

    // 7. Remove calendar circuit breaker notification
    const calendarCircuitBreaker = document.getElementById('calendar-circuit-breaker');
    if (calendarCircuitBreaker) {
      calendarCircuitBreaker.remove();
      console.log("Removed calendar circuit breaker notification");
    }

    // 8. Remove any emergency notifications at the top of the page
    const emergencyNotices = document.querySelectorAll('.emergency-notification, .notification-banner');
    emergencyNotices.forEach(notice => {
      notice.remove();
      console.log("Removed emergency notification");
    });

    // 9. Remove the diagnostic buttons at the bottom of the page
    const diagnosticButtons = document.querySelectorAll('.diagnostic-button, .check-firebase-button, [id^="check-"]');
    diagnosticButtons.forEach(button => {
      button.remove();
      console.log("Removed diagnostic button");
    });

    // 10. Remove any test event creator
    const testEventCreator = document.getElementById('test-event-creator');
    if (testEventCreator) {
      testEventCreator.remove();
      console.log("Removed test event creator");
    }

    // 11. Remove the orange calendar refresh paused notification - enhanced with more color variations
    const orangeNotices = document.querySelectorAll(
      '.calendar-paused, .calendar-warning, ' +
      '[style*="background-color: rgb(255, 165, 0)"], ' +
      '[style*="background-color: rgb(255, 152, 0)"], ' +
      '[style*="background-color: rgb(255, 140, 0)"], ' +
      '[style*="background-color: #ff9800"], ' +
      '[style*="background-color: #ffa500"], ' +
      '[style*="background-color: #ff8c00"]'
    );
    orangeNotices.forEach(notice => {
      notice.remove();
      console.log("Removed orange notification banner");
    });
    
    // 12. Remove notification by text content - enhanced with more phrases
    document.querySelectorAll('div, span, p').forEach(el => {
      const text = el.textContent;
      if (text && (
          text.includes('Calendar refresh paused') || 
          text.includes('Too many loadEvents') ||
          text.includes('NewEventContext') ||
          text.includes('Circuit breaker') ||
          text.includes('Loading events') ||
          text.includes('Loaded 0 events') ||
          text.includes('Paused calendar')
      )) {
        el.remove();
        console.log("Removed calendar notification by text content");
      }
    });

    // 13. Remove the Create Test Event button - enhanced with more selectors
    const createTestEventButtons = document.querySelectorAll(
      '[class*="Create Test Event"], ' +
      '[class*="create-test-event"], ' +
      '[class*="test-event"], ' +
      '[id*="create-test-event"], ' +
      '[id*="test-event"], ' +
      '.test-event-button, ' +
      '.calendar-test-button'
    );
    createTestEventButtons.forEach(button => {
      button.remove();
      console.log("Removed Create Test Event button");
    });
    
    // 14. Remove Create Test Event button by text content - more aggressive
    document.querySelectorAll('button, a, div, span').forEach(el => {
      const text = el.textContent;
      if (text && (
          text.includes('Create Test Event') || 
          text.includes('Test Event') ||
          text.includes('Create Event') && el.classList.contains('test')
      )) {
        // Remove the element itself
        el.remove();
        console.log("Removed Create Test Event button by text content");
      }
    });

    // 15. Target orange notification by background color - more precise selectors
    const orangeFixedElements = document.querySelectorAll(
      'div[style*="position: fixed"][style*="background-color: rgb(255, 152, 0)"], ' +
      'div[style*="position: fixed"][style*="background-color: #ff9800"], ' +
      'div[style*="position: fixed"][style*="background-color: rgb(255, 165, 0)"], ' +
      'div[style*="position: fixed"][style*="background-color: #ffa500"]'
    );
    orangeFixedElements.forEach(el => {
      el.remove();
      console.log("Removed fixed orange notification");
    });

    // 16. Find elements with bright blue background - for the blue Create Test Event button
    document.querySelectorAll('button, div, a').forEach(el => {
      const styles = window.getComputedStyle(el);
      const bgColor = styles.backgroundColor;
      const position = styles.position;
      
      // Target blue buttons with certain colors that are fixed positioned
      if (position === 'fixed' && (
          bgColor === 'rgb(33, 150, 243)' || // #2196f3
          bgColor === 'rgb(25, 118, 210)' || // #1976d2
          bgColor === 'rgb(66, 133, 244)' || // #4285f4
          bgColor === 'rgb(13, 110, 253)'    // Bootstrap primary blue
      )) {
        el.remove();
        console.log("Removed blue button by computed style");
      }
      
      // Target orange notifications that are fixed positioned
      if (position === 'fixed' && (
          bgColor === 'rgb(255, 152, 0)' || // #ff9800
          bgColor === 'rgb(255, 165, 0)' || // #ffa500
          bgColor === 'rgb(255, 140, 0)'    // #ff8c00
      )) {
        el.remove();
        console.log("Removed orange notification by computed style");
      }
    });

    // 17. Look for notifications in bottom corners
    document.querySelectorAll('div, button').forEach(el => {
      const styles = window.getComputedStyle(el);
      
      // Check bottom corners positioning
      if (styles.position === 'fixed' && 
          (styles.bottom === '0px' || styles.bottom === '10px' || styles.bottom === '20px' || parseInt(styles.bottom) < 50) &&
          (styles.right === '0px' || styles.right === '10px' || styles.right === '20px' || parseInt(styles.right) < 50 ||
           styles.left === '0px' || styles.left === '10px' || styles.left === '20px' || parseInt(styles.left) < 50)) {
        
        // Check if it looks like a notification by style
        if ((styles.zIndex && parseInt(styles.zIndex) > 1000) || 
            styles.boxShadow.includes('rgba') ||
            styles.backgroundColor === 'rgb(255, 152, 0)' || // orange
            styles.backgroundColor === 'rgb(33, 150, 243)') { // blue 
          el.remove();
          console.log("Removed corner notification");
        }
      }
    });

    // 18. TEMPORARILY DISABLED - Specifically target elements that look like notifications
    /*
    document.querySelectorAll('div[style*="z-index: 9"], div[style*="z-index: 99"], div[style*="z-index: 999"], div[style*="z-index: 1000"]').forEach(el => {
      // Skip family meeting modal and task drawer
      if (el.id === 'family-meeting-modal-backdrop' || 
          el.className.includes('family-meeting-modal-do-not-remove') ||
          el.className.includes('task-drawer-do-not-remove') ||
          el.getAttribute('data-modal') === 'family-meeting' ||
          el.getAttribute('data-drawer') === 'task-details' ||
          el.getAttribute('data-testid') === 'task-detail-drawer') {
        return;
      }
      
      const styles = window.getComputedStyle(el);
      
      // High z-index elements with position fixed are often notifications
      if (styles.position === 'fixed' && styles.padding && styles.padding !== '0px') {
        // Only remove if it has some visual styling like background color, shadow or border
        if (styles.backgroundColor !== 'rgba(0, 0, 0, 0)' && styles.backgroundColor !== 'transparent') {
          el.remove();
          console.log("Removed high z-index notification");
        }
      }
    });
    */

    // 19. Extremely aggressive targeting of any button with position:fixed
    document.querySelectorAll('button[style*="position: fixed"]').forEach(button => {
      // If it's in a corner or edge of the screen
      const styles = window.getComputedStyle(button);
      
      if ((styles.bottom === '0px' || styles.bottom === '10px' || styles.bottom === '20px' || parseInt(styles.bottom) < 50) &&
          (styles.right === '0px' || styles.right === '10px' || styles.right === '20px' || parseInt(styles.right) < 50)) {
        button.remove();
        console.log("Removed fixed position corner button");
      }
    });

    // 20. Handle possible nested diagnostic elements
    document.querySelectorAll('div[role="alert"], div[class*="notification"], div[class*="toast"], div[class*="snackbar"]').forEach(el => {
      el.remove();
      console.log("Removed notification component");
    });
  }

  // Initial cleanup right away to catch things that load immediately
  removeDiagnosticElements();
  
  // Run the cleanup with slight delays to ensure all panels have loaded
  setTimeout(removeDiagnosticElements, 500);
  setTimeout(removeDiagnosticElements, 1000);
  setTimeout(removeDiagnosticElements, 2000);
  
  // Run again after longer delays to catch late-loading elements
  setTimeout(removeDiagnosticElements, 3000);
  setTimeout(removeDiagnosticElements, 5000);

  // Also clean up when new content is added to the DOM
  const observer = new MutationObserver((mutations) => {
    removeDiagnosticElements();
  });

  // Start observing the document body for DOM changes - more aggressive monitoring
  observer.observe(document.body, { 
    childList: true, 
    subtree: true, 
    attributes: true,
    attributeFilter: ['style', 'class'] 
  });

  // Intercept dynamic element creation - this is an advanced technique
  // to catch elements that might be added programmatically
  const originalCreateElement = document.createElement;
  document.createElement = function() {
    const element = originalCreateElement.apply(this, arguments);
    
    // Run cleanup a short time after new elements are created
    if (arguments[0].toLowerCase() === 'div' || 
        arguments[0].toLowerCase() === 'button' ||
        arguments[0].toLowerCase() === 'span') {
      setTimeout(removeDiagnosticElements, 50);
    }
    
    return element;
  };
});