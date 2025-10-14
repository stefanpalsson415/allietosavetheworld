// bootstrap.js - Simple initialization script to ensure the app loads properly

// Registry of initialized services
window._initializedServices = {};

// Fix for event loop issues
if (typeof window !== 'undefined') {
  // Detect event loops
  window._eventLoopCount = 0;
  
  // Using fixed EventStore permanently integrated into source code
  window._usingFixedEventStore = true;
  
  // Function for backward compatibility (no longer needed)
  window.useFixedEventStore = function() {
    console.log("Fixed EventStore implementation is now permanently integrated into the codebase");
    
    // Add to initialized services
    window._initializedServices.fixedEventStore = true;
  };
  
  // Register the fixed implementation
  window._initializedServices.fixedEventStore = true;
  
  // Function to clear localStorage cache items that cause loops
  window.clearEventCache = function() {
    try {
      // Clear problematic localStorage items
      const problematicKeys = [
        'cachedEvents',
        'eventCache',
        'lastEventSync',
        'pendingEvents',
        'eventLoopDetected'
      ];
      
      problematicKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          console.log(`Removed problematic localStorage item: ${key}`);
        }
      });
      
      // Register the cleanup
      window._initializedServices.cachedEventsCleared = true;
    } catch (e) {
      console.error("Error clearing event cache:", e);
    }
  };
  
  // Clear the event cache on startup
  window.clearEventCache();
}

// Function to initialize Firebase safely
if (typeof window !== 'undefined') {
  window.ensureFirebaseInitialized = function() {
    // If Firebase is already initialized, do nothing
    if (window._initializedServices.firebase) {
      return;
    }
    
    try {
      // Check if Firebase is available
      if (typeof firebase !== 'undefined') {
        // Ensure Firebase is initialized only once
        if (firebase.apps.length === 0) {
          // The proper initialization will happen in the app
          console.log("Firebase will be initialized by the application");
        } else {
          console.log("Firebase already initialized");
        }
        
        // Register initialization
        window._initializedServices.firebase = true;
      }
    } catch (e) {
      console.error("Error in Firebase initialization check:", e);
    }
  };
}

// Initialize service worker cleanup
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.cleanupServiceWorkers = function() {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for (let registration of registrations) {
        registration.unregister();
        console.log("Unregistered service worker");
      }
      
      // Register cleanup
      window._initializedServices.serviceWorkersCleared = true;
    }).catch(function(err) {
      console.error("Failed to unregister service workers:", err);
    });
  };
  
  // Run the cleanup
  window.cleanupServiceWorkers();
}

// Track initialized status
if (typeof window !== 'undefined') {
  console.log("Bootstrap script loaded and executed successfully");
  window._bootstrapInitialized = true;
}