// Firebase Diagnostics Tool
// This script helps diagnose Firebase write issues by performing direct operations
// and detailed logging of the process

// Run this in the browser console to diagnose Firebase connectivity issues

(function() {
  console.log("%c Firebase Diagnostics Tool Starting", "background: #2196F3; color: white; padding: 4px; border-radius: 3px;");
  
  // Track diagnostic steps
  const diagnosticSteps = [];
  const logStep = (step, status, details) => {
    const stepObj = { step, status, details, timestamp: new Date().toISOString() };
    diagnosticSteps.push(stepObj);
    
    // Log with appropriate styling
    const style = status === 'success' 
      ? "background: #4CAF50; color: white;" 
      : status === 'error' 
        ? "background: #F44336; color: white;" 
        : "background: #FFC107; color: black;";
        
    console.log(`%c DIAGNOSTIC: ${step}`, `${style} padding: 4px; border-radius: 3px;`, details);
    
    return stepObj;
  };
  
  // Store diagnostic results
  const diagnosticResults = {
    firebaseAvailable: false,
    authStatus: null,
    collectionAccess: {},
    directWriteTests: {},
    networkRequests: [],
    environment: {},
    steps: diagnosticSteps
  };
  
  // 1. Check if Firebase is available
  try {
    if (typeof firebase !== 'undefined') {
      diagnosticResults.firebaseAvailable = true;
      logStep("Firebase SDK Check", "success", "Firebase SDK is available");
      
      // Log Firebase version
      if (firebase.SDK_VERSION) {
        diagnosticResults.environment.firebaseVersion = firebase.SDK_VERSION;
        logStep("Firebase Version", "success", `Firebase SDK version: ${firebase.SDK_VERSION}`);
      }
    } else {
      logStep("Firebase SDK Check", "error", "Firebase SDK is NOT available");
    }
  } catch (e) {
    logStep("Firebase SDK Check", "error", `Error checking Firebase: ${e.message}`);
  }
  
  // 2. Check Firebase app initialization
  try {
    if (diagnosticResults.firebaseAvailable) {
      const apps = firebase.apps;
      if (apps && apps.length > 0) {
        diagnosticResults.environment.firebaseApps = apps.length;
        const appNames = apps.map(app => app.name || 'default').join(', ');
        logStep("Firebase App Initialization", "success", `Found ${apps.length} Firebase app(s): ${appNames}`);
      } else {
        logStep("Firebase App Initialization", "error", "No Firebase apps found. Firebase may not be properly initialized.");
      }
    }
  } catch (e) {
    logStep("Firebase App Initialization", "error", `Error checking Firebase apps: ${e.message}`);
  }
  
  // 3. Check Firebase Auth status
  try {
    if (diagnosticResults.firebaseAvailable) {
      const auth = firebase.auth();
      const user = auth.currentUser;
      
      if (user) {
        diagnosticResults.authStatus = {
          signedIn: true,
          uid: user.uid,
          email: user.email,
          provider: user.providerData.length > 0 ? user.providerData[0].providerId : 'unknown'
        };
        logStep("Firebase Auth", "success", `Signed in as ${user.email} (${user.uid})`);
      } else {
        diagnosticResults.authStatus = { signedIn: false };
        logStep("Firebase Auth", "warning", "No user is currently signed in");
      }
    }
  } catch (e) {
    logStep("Firebase Auth", "error", `Error checking auth: ${e.message}`);
  }
  
  // 4. Check Firestore availability
  try {
    if (diagnosticResults.firebaseAvailable) {
      const db = firebase.firestore();
      if (db) {
        logStep("Firestore", "success", "Firestore is available");
        
        // Capture Firestore settings
        try {
          const settings = db._settings || {};
          diagnosticResults.environment.firestoreSettings = settings;
          logStep("Firestore Settings", "info", settings);
        } catch (settingsError) {
          logStep("Firestore Settings", "warning", `Couldn't read Firestore settings: ${settingsError.message}`);
        }
      } else {
        logStep("Firestore", "error", "Firestore is NOT available");
      }
    }
  } catch (e) {
    logStep("Firestore", "error", `Error checking Firestore: ${e.message}`);
  }
  
  // 5. Check specific collections existence
  const checkCollections = async () => {
    if (!diagnosticResults.firebaseAvailable) return;
    
    try {
      const db = firebase.firestore();
      const collections = ["providers", "familyProviders", "calendar_events", "tasks"];
      
      for (const collectionName of collections) {
        try {
          // Try to get a single document to test access
          const query = await db.collection(collectionName).limit(1).get();
          const exists = !query.empty;
          
          diagnosticResults.collectionAccess[collectionName] = {
            exists,
            canRead: true,
            documentCount: exists ? query.size : 0
          };
          
          logStep(`Collection Check: ${collectionName}`, "success", 
            `Collection exists: ${exists}, Documents found: ${exists ? query.size : 0}`);
        } catch (collectionError) {
          diagnosticResults.collectionAccess[collectionName] = {
            error: collectionError.message,
            canRead: false
          };
          
          logStep(`Collection Check: ${collectionName}`, "error", 
            `Error accessing collection: ${collectionError.message}`);
        }
      }
    } catch (e) {
      logStep("Collection Checks", "error", `Error checking collections: ${e.message}`);
    }
  };
  
  // 6. Get the current family ID
  const getCurrentFamilyId = () => {
    try {
      // Try various localStorage keys
      const familyId = localStorage.getItem('selectedFamilyId') || 
                       localStorage.getItem('currentFamilyId') || 
                       localStorage.getItem('familyId') || 
                       localStorage.getItem('lastUsedFamilyId');
      
      if (familyId) {
        diagnosticResults.environment.familyId = familyId;
        logStep("Family ID", "success", `Current family ID: ${familyId}`);
        return familyId;
      } else {
        logStep("Family ID", "warning", "No family ID found in localStorage");
        return null;
      }
    } catch (e) {
      logStep("Family ID", "error", `Error getting family ID: ${e.message}`);
      return null;
    }
  };
  
  // 7. Direct test - Try writing to providers collection
  const testProviderWrite = async () => {
    if (!diagnosticResults.firebaseAvailable) return;
    
    try {
      const db = firebase.firestore();
      const familyId = getCurrentFamilyId() || "test-family";
      
      // Create a timestamp to make this test unique
      const timestamp = new Date().toISOString();
      const testProvider = {
        name: `Test Provider ${timestamp}`,
        type: "test",
        specialty: "Firebase Diagnostic Test",
        familyId: familyId,
        notes: `This is a diagnostic test provider created at ${timestamp}`,
        _diagnostic: true,
        _shouldDelete: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      logStep("Provider Write Test", "info", "Attempting to write test provider to 'providers' collection");
      
      // Monitor network requests
      const originalFetch = window.fetch;
      const originalXHR = window.XMLHttpRequest.prototype.send;
      
      const requests = [];
      window.fetch = function(...args) {
        const url = args[0].url || args[0];
        if (url.toString().includes('firestore')) {
          requests.push({
            type: 'fetch',
            url: url.toString(),
            time: new Date().toISOString()
          });
          logStep("Network Request", "info", `Fetch: ${url.toString()}`);
        }
        return originalFetch.apply(this, args)
          .then(response => {
            if (url.toString().includes('firestore')) {
              requests[requests.length - 1].status = response.status;
              logStep("Network Response", "info", `Status: ${response.status} for ${url.toString()}`);
            }
            return response;
          })
          .catch(error => {
            if (url.toString().includes('firestore')) {
              requests[requests.length - 1].error = error.message;
              logStep("Network Error", "error", `Error: ${error.message} for ${url.toString()}`);
            }
            throw error;
          });
      };
      
      window.XMLHttpRequest.prototype.send = function(...args) {
        const xhr = this;
        const originalOnReadyStateChange = xhr.onreadystatechange;
        
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4 && xhr.responseURL && xhr.responseURL.includes('firestore')) {
            requests.push({
              type: 'xhr',
              url: xhr.responseURL,
              status: xhr.status,
              time: new Date().toISOString()
            });
            logStep("XHR Response", "info", `Status: ${xhr.status} for ${xhr.responseURL}`);
          }
          
          if (originalOnReadyStateChange) {
            originalOnReadyStateChange.apply(this, arguments);
          }
        };
        
        return originalXHR.apply(this, args);
      };
      
      // 7.1 Write to providers collection
      let providerId = null;
      try {
        const providerRef = await db.collection("providers").add(testProvider);
        providerId = providerRef.id;
        
        diagnosticResults.directWriteTests.providers = {
          success: true,
          providerId,
          timestamp
        };
        
        logStep("Provider Write Test (providers)", "success", 
          `Successfully wrote test provider to 'providers' collection with ID: ${providerId}`);
      } catch (providerError) {
        diagnosticResults.directWriteTests.providers = {
          success: false,
          error: providerError.message
        };
        
        logStep("Provider Write Test (providers)", "error", 
          `Failed to write to 'providers' collection: ${providerError.message}`);
      }
      
      // 7.2 Write to familyProviders collection
      try {
        const mirrorData = {
          ...testProvider,
          mirrorOf: providerId,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const familyProviderRef = await db.collection("familyProviders").add(mirrorData);
        
        diagnosticResults.directWriteTests.familyProviders = {
          success: true,
          providerId: familyProviderRef.id,
          timestamp
        };
        
        logStep("Provider Write Test (familyProviders)", "success", 
          `Successfully wrote test provider to 'familyProviders' collection with ID: ${familyProviderRef.id}`);
      } catch (familyProviderError) {
        diagnosticResults.directWriteTests.familyProviders = {
          success: false,
          error: familyProviderError.message
        };
        
        logStep("Provider Write Test (familyProviders)", "error", 
          `Failed to write to 'familyProviders' collection: ${familyProviderError.message}`);
      }
      
      // Restore original network methods
      window.fetch = originalFetch;
      window.XMLHttpRequest.prototype.send = originalXHR;
      
      // Add collected requests to results
      diagnosticResults.networkRequests = requests;
    } catch (e) {
      logStep("Provider Write Test", "error", `Overall error in write test: ${e.message}`);
    }
  };
  
  // 8. Event System Diagnostics
  const testEventSystem = () => {
    try {
      // Test creating and dispatching events
      const testEvent = new CustomEvent('test-diagnostic-event', {
        detail: { time: Date.now() }
      });
      
      let eventReceived = false;
      const eventListener = () => {
        eventReceived = true;
        logStep("Event System", "success", "Test event was successfully received");
      };
      
      window.addEventListener('test-diagnostic-event', eventListener);
      window.dispatchEvent(testEvent);
      
      // Clean up
      window.removeEventListener('test-diagnostic-event', eventListener);
      
      if (!eventReceived) {
        logStep("Event System", "warning", "Test event was not received - possible event system issue");
      }
      
      // Check for event listeners that might be causing loops
      try {
        // Using Chrome specific debug API if available
        if (window.getEventListeners) {
          const directoryRefreshListeners = window.getEventListeners(window)['directory-refresh-needed'] || [];
          const providerAddedListeners = window.getEventListeners(window)['provider-added'] || [];
          
          logStep("Event Listeners", "info", 
            `Found ${directoryRefreshListeners.length} listeners for 'directory-refresh-needed' and ${providerAddedListeners.length} for 'provider-added'`);
          
          diagnosticResults.eventSystem = {
            directoryRefreshListeners: directoryRefreshListeners.length,
            providerAddedListeners: providerAddedListeners.length
          };
        } else {
          logStep("Event Listeners", "warning", "Cannot inspect event listeners (getEventListeners not available)");
        }
      } catch (eventListenerError) {
        logStep("Event Listeners", "error", `Error inspecting event listeners: ${eventListenerError.message}`);
      }
    } catch (e) {
      logStep("Event System", "error", `Error testing event system: ${e.message}`);
    }
  };
  
  // 9. Get environment info
  const getEnvironmentInfo = () => {
    try {
      diagnosticResults.environment.userAgent = navigator.userAgent;
      diagnosticResults.environment.location = window.location.href;
      
      // Check for localStorage limits
      try {
        const testKey = '_firebase_diagnostic_test';
        const testData = 'x'.repeat(50000); // 50KB test
        localStorage.setItem(testKey, testData);
        localStorage.removeItem(testKey);
        diagnosticResults.environment.localStorage = { status: "working" };
        logStep("localStorage", "success", "localStorage is functioning properly");
      } catch (storageError) {
        diagnosticResults.environment.localStorage = { 
          status: "error",
          error: storageError.message
        };
        logStep("localStorage", "error", `localStorage error: ${storageError.message}`);
      }
      
      // Check console errors count if available (Chrome-specific)
      if (window.console && console.memory) {
        diagnosticResults.environment.consoleErrorsCount = console.memory.jsHeapSizeLimit;
      }
      
      logStep("Environment Info", "success", "Environment info collected");
    } catch (e) {
      logStep("Environment Info", "error", `Error collecting environment info: ${e.message}`);
    }
  };
  
  // 10. Run all diagnostics
  const runAllDiagnostics = async () => {
    try {
      getEnvironmentInfo();
      testEventSystem();
      await checkCollections();
      await testProviderWrite();
      
      // Final summary
      console.log("%c Firebase Diagnostics Complete", "background: #2196F3; color: white; padding: 4px; border-radius: 3px;");
      console.log("Results:", diagnosticResults);
      
      // Flag critical issues
      const criticalIssues = [];
      
      if (!diagnosticResults.firebaseAvailable) {
        criticalIssues.push("Firebase SDK is not available");
      }
      
      if (diagnosticResults.authStatus && !diagnosticResults.authStatus.signedIn) {
        criticalIssues.push("User is not signed in to Firebase");
      }
      
      if (diagnosticResults.directWriteTests.providers && 
          !diagnosticResults.directWriteTests.providers.success) {
        criticalIssues.push(`Cannot write to 'providers' collection: ${diagnosticResults.directWriteTests.providers.error}`);
      }
      
      if (criticalIssues.length > 0) {
        console.log("%c CRITICAL ISSUES FOUND", "background: #F44336; color: white; padding: 4px; border-radius: 3px;");
        criticalIssues.forEach(issue => console.log(`- ${issue}`));
      } else {
        console.log("%c NO CRITICAL ISSUES FOUND", "background: #4CAF50; color: white; padding: 4px; border-radius: 3px;");
      }
      
      return {
        results: diagnosticResults,
        criticalIssues,
        runTimestamp: new Date().toISOString()
      };
    } catch (e) {
      console.error("Error running diagnostics:", e);
      return {
        error: e.message,
        runTimestamp: new Date().toISOString()
      };
    }
  };
  
  // Return the diagnostics object with functions
  window.firebaseDiagnostics = {
    run: runAllDiagnostics,
    testProviderWrite,
    checkCollections,
    results: diagnosticResults
  };
  
  console.log("%c Firebase Diagnostics Tool Ready", "background: #2196F3; color: white; padding: 4px; border-radius: 3px;");
  console.log("Run diagnostics with: window.firebaseDiagnostics.run()");
})();

// Run diagnostics automatically
setTimeout(() => {
  if (window.firebaseDiagnostics) {
    console.log("%c Running Firebase Diagnostics...", "background: #2196F3; color: white; padding: 4px; border-radius: 3px;");
    window.firebaseDiagnostics.run().then(results => {
      // Auto-save results to localStorage for later reference
      try {
        localStorage.setItem('firebase_diagnostics_results', JSON.stringify(results));
        console.log("%c Diagnostic results saved to localStorage", "background: #4CAF50; color: white; padding: 4px; border-radius: 3px;");
      } catch (e) {
        console.error("Could not save diagnostic results to localStorage:", e);
      }
    });
  }
}, 1000);