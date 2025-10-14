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
  }

  // Run the cleanup with a slight delay to ensure all panels have loaded
  setTimeout(removeDiagnosticElements, 1000);

  // Also clean up when new content is added to the DOM
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        // Only run cleanup if significant changes are made to the DOM
        if (document.getElementById('firebase-index-diagnostic') || 
            document.getElementById('calendar-issue-diagnostic') ||
            document.getElementById('event-loop-monitor')) {
          removeDiagnosticElements();
        }
      }
    }
  });

  // Start observing the document body for DOM changes
  observer.observe(document.body, { childList: true, subtree: true });
});