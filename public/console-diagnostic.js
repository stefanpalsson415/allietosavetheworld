/**
 * console-diagnostic.js
 *
 * Enhanced console-based diagnostic script that can be run directly from the browser console
 *
 * Load this script by pasting in console:
 *
 * var script = document.createElement('script');
 * script.src = '/console-diagnostic.js';
 * document.head.appendChild(script);
 *
 * Then run: window.consoleDiagnostic.runAll()
 */

(function() {
  console.log("📊 Console Diagnostic Tool: Loading...");

  // Create global diagnostic object
  window.consoleDiagnostic = {
    // Track current state
    state: {
      timestamp: Date.now(),
      firebaseAvailable: false,
      firebaseInstance: null,
      authChecked: false,
      userId: null,
      events: {
        read: false,
        write: false,
        collections: {
          events: 0,
          calendarEvents: 0,
          providers: 0
        }
      },
      eventLoops: {
        detected: false,
        count: 0,
        details: []
      },
      spinners: {
        detected: false,
        count: 0,
        details: []
      },
      fixesApplied: []
    },

    // Main diagnostics
    checkFirebase: async function() {
      console.log("📊 DIAGNOSTIC: Checking Firebase availability");

      if (typeof firebase !== 'undefined') {
        console.log("✅ Firebase is available globally");
        window.consoleDiagnostic.state.firebaseAvailable = true;
        window.consoleDiagnostic.state.firebaseInstance = firebase;

        // Check for firebase apps
        if (firebase.apps && firebase.apps.length > 0) {
          console.log(`✅ Firebase has ${firebase.apps.length} initialized app(s)`);
        } else {
          console.warn("⚠️ Firebase available but no apps initialized");
        }

        // Check for key services
        if (firebase.firestore) {
          console.log("✅ Firestore is available");
        } else {
          console.warn("⚠️ Firestore is not available");
        }

        if (firebase.auth) {
          console.log("✅ Auth is available");
        } else {
          console.warn("⚠️ Auth is not available");
        }

        return true;
      } else if (typeof window.firebase !== 'undefined') {
        console.log("✅ Firebase is available on window.firebase");
        window.consoleDiagnostic.state.firebaseAvailable = true;
        window.consoleDiagnostic.state.firebaseInstance = window.firebase;
        return true;
      } else {
        console.error("❌ Firebase is not available!");
        window.consoleDiagnostic.state.firebaseAvailable = false;

        // Check for diagnostics
        if (window._firebaseDiagnostics) {
          console.log("Found _firebaseDiagnostics:", window._firebaseDiagnostics);
        }

        return false;
      }
    },

    // Check auth state
    checkAuth: async function() {
      if (!window.consoleDiagnostic.state.firebaseAvailable) {
        console.error("❌ Cannot check auth - Firebase is not available");
        return false;
      }

      const fb = window.consoleDiagnostic.state.firebaseInstance;

      try {
        console.log("📊 DIAGNOSTIC: Checking Firebase auth state");

        return new Promise((resolve) => {
          let authChecked = false;

          // Set timeout to prevent hanging
          const timeout = setTimeout(() => {
            if (!authChecked) {
              console.error("❌ Auth check timed out after 5 seconds");
              window.consoleDiagnostic.state.authChecked = true;
              resolve(false);
            }
          }, 5000);

          // Check auth state
          fb.auth().onAuthStateChanged((user) => {
            clearTimeout(timeout);
            authChecked = true;

            if (user) {
              console.log("✅ User is authenticated:", user.uid);
              window.consoleDiagnostic.state.userId = user.uid;
              window.consoleDiagnostic.state.authChecked = true;
              resolve(true);
            } else {
              console.error("❌ No user is logged in");
              window.consoleDiagnostic.state.authChecked = true;

              // Try to find userId in localStorage as fallback
              const possibleUserIds = [
                localStorage.getItem('userId'),
                localStorage.getItem('currentUserId'),
                localStorage.getItem('user_id'),
                localStorage.getItem('uid')
              ].filter(Boolean);

              if (possibleUserIds.length > 0) {
                console.log("Found possible user ID in localStorage:", possibleUserIds[0]);
                window.consoleDiagnostic.state.userId = possibleUserIds[0];
                resolve(true);
              } else {
                resolve(false);
              }
            }
          });
        });
      } catch (error) {
        console.error("❌ Error checking auth:", error);
        return false;
      }
    },

    // Check for event loops
    checkEventLoops: function() {
      console.log("📊 DIAGNOSTIC: Checking for event loops");

      try {
        // Check if event loop breaker is active
        if (window._eventLoopBreaker) {
          const stats = window._eventLoopBreaker.getStats();

          if (stats.loopDetected) {
            console.error(`❌ Event loop detected! ${stats.loopsDetected.length} loops found`);
            window.consoleDiagnostic.state.eventLoops.detected = true;
            window.consoleDiagnostic.state.eventLoops.count = stats.loopsDetected.length;
            window.consoleDiagnostic.state.eventLoops.details = stats.loopsDetected;
            return true;
          } else {
            console.log("✅ No event loops detected");
            return false;
          }
        }

        // If no event loop breaker, check console for patterns
        console.log("⚠️ No event loop breaker found, checking console patterns");

        // Install a temporary console.log interceptor
        const originalLog = console.log;
        const logPatterns = {};

        console.log = function(...args) {
          // Original console.log
          originalLog.apply(console, args);

          // Check for event loop patterns
          if (typeof args[0] === 'string') {
            const logString = args[0].toLowerCase();

            // Check for common event loop messages
            if (logString.includes('loading events for user') ||
                logString.includes('refreshing events') ||
                logString.includes('force-calendar-refresh')) {
              logPatterns[logString] = (logPatterns[logString] || 0) + 1;

              if (logPatterns[logString] > 5) {
                console.warn(`⚠️ Potential event loop detected: "${logString}" repeated ${logPatterns[logString]} times`);
                window.consoleDiagnostic.state.eventLoops.detected = true;
                window.consoleDiagnostic.state.eventLoops.count++;
                window.consoleDiagnostic.state.eventLoops.details.push({
                  pattern: logString,
                  count: logPatterns[logString],
                  timestamp: Date.now()
                });
              }
            }
          }
        };

        // Restore original console.log after 5 seconds
        setTimeout(() => {
          console.log = originalLog;
          console.log("📊 Temporary console monitoring complete");

          // Report findings
          const loopPatterns = Object.keys(logPatterns).filter(k => logPatterns[k] > 5);
          if (loopPatterns.length > 0) {
            console.warn(`⚠️ Found ${loopPatterns.length} possible event loop patterns`);
            console.warn("Patterns:", loopPatterns.map(p => ({ pattern: p, count: logPatterns[p] })));
          } else {
            console.log("✅ No event loop patterns detected during monitoring period");
          }
        }, 5000);

        return false;
      } catch (error) {
        console.error("❌ Error checking for event loops:", error);
        console.log = console.log || console.info;  // Ensure we restore console.log
        return false;
      }
    },

    // Check for stuck spinners
    checkSpinners: function() {
      console.log("📊 DIAGNOSTIC: Checking for stuck spinners");

      try {
        // Check for common spinner classes
        const spinners = document.querySelectorAll('.loading, [role="progressbar"], [aria-busy="true"]');

        // Check for elements with loading text
        const loadingTexts = [];
        const allElements = document.querySelectorAll('*');
        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i];
          if (el.textContent && (
              el.textContent.includes('Loading') ||
              el.textContent.includes('loading') ||
              el.textContent.includes('please wait')
          )) {
            loadingTexts.push(el);
          }
        }

        // Report findings
        if (spinners.length > 0 || loadingTexts.length > 0) {
          console.warn(`⚠️ Found ${spinners.length} spinner elements and ${loadingTexts.length} loading text elements`);

          window.consoleDiagnostic.state.spinners.detected = true;
          window.consoleDiagnostic.state.spinners.count = spinners.length + loadingTexts.length;

          // Collect details of up to 5 spinners and 5 loading texts
          if (spinners.length > 0) {
            window.consoleDiagnostic.state.spinners.details.push(...Array.from(spinners).slice(0, 5).map(el => ({
              type: 'spinner',
              element: el.tagName,
              id: el.id,
              className: el.className,
              text: el.textContent ? el.textContent.substring(0, 50) : ''
            })));
          }

          if (loadingTexts.length > 0) {
            window.consoleDiagnostic.state.spinners.details.push(...loadingTexts.slice(0, 5).map(el => ({
              type: 'text',
              element: el.tagName,
              id: el.id,
              className: el.className,
              text: el.textContent ? el.textContent.substring(0, 50) : ''
            })));
          }

          return true;
        } else {
          console.log("✅ No stuck spinners or loading indicators detected");
          return false;
        }
      } catch (error) {
        console.error("❌ Error checking for spinners:", error);
        return false;
      }
    },

    // Test reading events
    testReadEvents: async function() {
      if (!window.consoleDiagnostic.state.firebaseAvailable) {
        console.error("❌ Cannot read events - Firebase is not available");
        return false;
      }

      if (!window.consoleDiagnostic.state.userId) {
        // Try checking auth first
        if (!await window.consoleDiagnostic.checkAuth()) {
          console.error("❌ Cannot read events - Not authenticated");
          return false;
        }
      }

      const fb = window.consoleDiagnostic.state.firebaseInstance;
      const userId = window.consoleDiagnostic.state.userId;

      try {
        console.log("📊 DIAGNOSTIC: Testing reading events for user:", userId);

        // Read from events collection
        console.log("Reading from 'events' collection...");
        const eventsSnapshot = await fb.firestore().collection('events')
          .where('userId', '==', userId)
          .limit(10)
          .get();

        console.log(`✅ Found ${eventsSnapshot.size} events in 'events' collection`);
        window.consoleDiagnostic.state.events.collections.events = eventsSnapshot.size;

        // Attempt to read from providers collection
        try {
          console.log("Reading from 'providers' collection...");
          const providersSnapshot = await fb.firestore().collection('providers')
            .where('userId', '==', userId)
            .limit(10)
            .get();

          console.log(`✅ Found ${providersSnapshot.size} providers in 'providers' collection`);
          window.consoleDiagnostic.state.events.collections.providers = providersSnapshot.size;
        } catch (providerError) {
          console.warn(`⚠️ Error reading providers: ${providerError.message}`);
        }

        // Show a sample event
        if (eventsSnapshot.size > 0) {
          const sampleEvent = eventsSnapshot.docs[0].data();
          console.log("Sample event:", sampleEvent);
        }

        window.consoleDiagnostic.state.events.read = true;
        return true;
      } catch (error) {
        console.error("❌ Error reading events:", error);
        return false;
      }
    },

    // Test writing an event
    testWriteEvent: async function() {
      if (!window.consoleDiagnostic.state.firebaseAvailable) {
        console.error("❌ Cannot write event - Firebase is not available");
        return false;
      }

      if (!window.consoleDiagnostic.state.userId) {
        // Try checking auth first
        if (!await window.consoleDiagnostic.checkAuth()) {
          console.error("❌ Cannot write event - Not authenticated");
          return false;
        }
      }

      const fb = window.consoleDiagnostic.state.firebaseInstance;
      const userId = window.consoleDiagnostic.state.userId;

      try {
        console.log("📊 DIAGNOSTIC: Testing writing event for user:", userId);

        // Get family ID from localStorage if available
        const familyId = localStorage.getItem('familyId') ||
                        localStorage.getItem('selectedFamilyId') ||
                        localStorage.getItem('currentFamilyId') ||
                        'unknown-family';

        // Create test event data with proper structure
        const testEvent = {
          title: "Console Diagnostic Test Event",
          description: "This is a test event created by the console diagnostic tool",
          dateTime: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
          userId: userId,
          familyId: familyId,
          universalId: `console-test-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          source: 'console-diagnostic',

          // Required fields for standardization
          dateObj: new Date(),
          dateEndObj: new Date(Date.now() + 3600000), // 1 hour later

          // Standard calendar format
          start: {
            dateTime: new Date().toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: new Date(Date.now() + 3600000).toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },

          // Default values to prevent errors
          category: 'general',
          eventType: 'test',
          attendees: [],
          documents: [],
          providers: []
        };

        console.log("Writing event:", testEvent);

        // Try writing to events collection
        console.log("Writing to 'events' collection...");
        const eventRef = await fb.firestore().collection('events').add(testEvent);
        console.log("✅ Successfully wrote to 'events' collection:", eventRef.id);

        window.consoleDiagnostic.state.events.write = true;

        // Now try to use EventStore if available
        if (window.EventStore || window.eventStore) {
          console.log("Detected EventStore, attempting to write using EventStore API");
          const store = window.EventStore || window.eventStore;

          if (typeof store.addEvent === 'function') {
            try {
              const storeResult = await store.addEvent(testEvent, userId, familyId);
              console.log("✅ EventStore.addEvent result:", storeResult);
            } catch (storeError) {
              console.warn(`⚠️ Error using EventStore.addEvent: ${storeError.message}`);
            }
          }
        }

        return {
          success: true,
          eventId: eventRef.id
        };
      } catch (error) {
        console.error("❌ Error writing event:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);

        if (error.code === 'permission-denied') {
          console.error("❌ This is a permissions issue - check Firebase security rules");
        } else if (error.code === 'unavailable') {
          console.error("❌ This is a network issue - check your internet connection");
        }

        return false;
      }
    },

    // Fix event loops
    fixEventLoops: function() {
      console.log("🔧 FIXING EVENT LOOPS");
      console.log("====================");

      try {
        // Reset event loop breaker if available
        if (window._eventLoopBreaker && typeof window._eventLoopBreaker.resetEventTracking === 'function') {
          window._eventLoopBreaker.resetEventTracking();
          console.log("✅ Event tracking reset successfully");
          window.consoleDiagnostic.state.fixesApplied.push("reset-event-tracking");
        }

        // Dispatch custom events to break loops
        window.dispatchEvent(new CustomEvent('force-reset-events', {
          detail: { source: 'console-diagnostic' }
        }));

        window.dispatchEvent(new CustomEvent('force-data-refresh', {
          detail: { source: 'console-diagnostic' }
        }));

        console.log("✅ Dispatched reset events");
        window.consoleDiagnostic.state.fixesApplied.push("dispatch-reset-events");

        // Refresh EventStore cache if available
        if (window.EventStore || window.eventStore) {
          const store = window.EventStore || window.eventStore;

          if (typeof store.clearCache === 'function') {
            store.clearCache();
            console.log("✅ Cleared EventStore cache");
            window.consoleDiagnostic.state.fixesApplied.push("clear-event-cache");
          }
        }

        return true;
      } catch (error) {
        console.error("❌ Error fixing event loops:", error);
        return false;
      }
    },

    // Fix stuck spinners
    fixSpinners: function() {
      console.log("🔧 FIXING STUCK SPINNERS");
      console.log("======================");

      try {
        // Call unstickSpinner function if available
        if (window.unstickSpinners && typeof window.unstickSpinners === 'function') {
          window.unstickSpinners();
          console.log("✅ Used existing unstickSpinners function");
          window.consoleDiagnostic.state.fixesApplied.push("unstick-spinners");
        }

        // Find and remove spinner elements
        const spinners = document.querySelectorAll('.loading, [role="progressbar"], [aria-busy="true"]');
        let spinnerCount = 0;

        spinners.forEach(spinner => {
          try {
            spinner.style.display = 'none';
            spinner.style.visibility = 'hidden';
            spinner.setAttribute('aria-hidden', 'true');
            spinnerCount++;
          } catch (e) {
            // Ignore errors
          }
        });

        if (spinnerCount > 0) {
          console.log(`✅ Removed ${spinnerCount} spinner elements`);
          window.consoleDiagnostic.state.fixesApplied.push("removed-spinner-elements");
        }

        // Find and clear loading text
        const loadingTexts = [];
        const allElements = document.querySelectorAll('*');
        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i];
          if (el.textContent && (
              el.textContent.includes('Loading') ||
              el.textContent.includes('loading')
          )) {
            loadingTexts.push(el);
          }
        }

        let textCount = 0;
        loadingTexts.forEach(el => {
          try {
            el.style.display = 'none';
            el.setAttribute('aria-hidden', 'true');
            textCount++;
          } catch (e) {
            // Ignore errors
          }
        });

        if (textCount > 0) {
          console.log(`✅ Removed ${textCount} loading text elements`);
          window.consoleDiagnostic.state.fixesApplied.push("removed-loading-texts");
        }

        // Dispatch events to break loading state
        window.dispatchEvent(new CustomEvent('load-completed'));
        window.dispatchEvent(new Event('DOMContentLoaded'));
        window.dispatchEvent(new Event('load'));

        console.log("✅ Spinner fix applied and events dispatched");
        window.consoleDiagnostic.state.fixesApplied.push("dispatch-loading-events");

        return true;
      } catch (error) {
        console.error("❌ Error fixing spinners:", error);
        return false;
      }
    },

    // Fix Firebase
    fixFirebase: function() {
      console.log("🔧 FIXING FIREBASE");
      console.log("=================");

      try {
        // Check if fixFirebaseSDK is available
        if (window.fixFirebaseSDK && typeof window.fixFirebaseSDK === 'function') {
          const result = window.fixFirebaseSDK();
          console.log("✅ Firebase SDK fix applied:", result);
          window.consoleDiagnostic.state.fixesApplied.push("fix-firebase-sdk");
          return true;
        }

        // If Firebase SDK not defined, try to load the scripts
        if (typeof firebase === 'undefined') {
          console.log("⚠️ Firebase not found - attempting to load Firebase scripts...");

          // Load the Firebase App script
          const script = document.createElement('script');
          script.src = 'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js';
          script.async = true;

          script.onload = () => {
            console.log("✅ Firebase App script loaded");

            // Load Firestore script
            const firestoreScript = document.createElement('script');
            firestoreScript.src = 'https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js';
            firestoreScript.async = true;

            firestoreScript.onload = () => {
              console.log("✅ Firebase Firestore script loaded");

              // Load Auth script
              const authScript = document.createElement('script');
              authScript.src = 'https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js';
              authScript.async = true;

              authScript.onload = () => {
                console.log("✅ Firebase Auth script loaded");

                // Initialize Firebase
                if (typeof firebase !== 'undefined' && (!firebase.apps || firebase.apps.length === 0)) {
                  console.log("⚠️ Firebase available but not initialized - initializing...");

                  // Use firebaseConfig if available, otherwise use fallback config
                  const config = window.firebaseConfig || {
                    apiKey: "AIzaSyALjXkZiFZ_Fy143N_dzdaUbyDCtabBr7Y",
                    authDomain: "parentload-ba995.firebaseapp.com",
                    projectId: "parentload-ba995",
                    storageBucket: "parentload-ba995.firebasestorage.app",
                    messagingSenderId: "363935868004",
                    appId: "1:363935868004:web:8802abceeca81cc10deb71"
                  };

                  firebase.initializeApp(config);
                  console.log("✅ Firebase initialized");
                  window.consoleDiagnostic.state.fixesApplied.push("initialized-firebase");
                }
              };

              document.head.appendChild(authScript);
            };

            document.head.appendChild(firestoreScript);
          };

          document.head.appendChild(script);
          window.consoleDiagnostic.state.fixesApplied.push("loaded-firebase-scripts");
          return true;
        }

        // If Firebase exists but isn't initialized, initialize it
        if (typeof firebase !== 'undefined' && (!firebase.apps || firebase.apps.length === 0)) {
          console.log("⚠️ Firebase available but not initialized - initializing...");

          // Use firebaseConfig if available, otherwise use fallback config
          const config = window.firebaseConfig || {
            apiKey: "AIzaSyALjXkZiFZ_Fy143N_dzdaUbyDCtabBr7Y",
            authDomain: "parentload-ba995.firebaseapp.com",
            projectId: "parentload-ba995",
            storageBucket: "parentload-ba995.firebasestorage.app",
            messagingSenderId: "363935868004",
            appId: "1:363935868004:web:8802abceeca81cc10deb71"
          };

          firebase.initializeApp(config);
          console.log("✅ Firebase initialized");
          window.consoleDiagnostic.state.fixesApplied.push("initialized-firebase");
          return true;
        }

        console.log("✅ Firebase already loaded and initialized - no action needed");
        return true;
      } catch (error) {
        console.error("❌ Error fixing Firebase:", error);
        return false;
      }
    },

    // Apply all fixes
    applyAllFixes: function() {
      console.log("🔧 APPLYING ALL FIXES");
      console.log("====================");

      this.fixFirebase();
      this.fixEventLoops();
      this.fixSpinners();

      console.log(`✅ Applied ${window.consoleDiagnostic.state.fixesApplied.length} fixes`);

      // Force page reload after 5 seconds if needed
      if (window.consoleDiagnostic.state.eventLoops.detected ||
          window.consoleDiagnostic.state.spinners.detected) {
        console.log("⚠️ Critical issues detected, page will reload in 5 seconds...");

        setTimeout(() => {
          window.location.reload();
        }, 5000);
      }

      return window.consoleDiagnostic.state.fixesApplied;
    },

    // Run all diagnostics
    runAll: async function() {
      console.log("📊 RUNNING ALL DIAGNOSTICS");
      console.log("=========================");

      // Reset state
      window.consoleDiagnostic.state.timestamp = Date.now();
      window.consoleDiagnostic.state.fixesApplied = [];

      // 1. Check Firebase availability
      const firebaseAvailable = await window.consoleDiagnostic.checkFirebase();

      // 2. Check auth state
      await window.consoleDiagnostic.checkAuth();

      // 3. Check for event loops
      window.consoleDiagnostic.checkEventLoops();

      // 4. Check for stuck spinners
      window.consoleDiagnostic.checkSpinners();

      // 5. Test Firebase operations
      if (firebaseAvailable) {
        await window.consoleDiagnostic.testReadEvents();
        await window.consoleDiagnostic.testWriteEvent();
      }

      console.log("=================================");
      console.log("📊 DIAGNOSTIC RESULTS:", window.consoleDiagnostic.state);

      // Provide recommendations based on results
      console.log("\n🔧 RECOMMENDED ACTIONS:");

      if (!firebaseAvailable) {
        console.log("- Run window.consoleDiagnostic.fixFirebase() to fix Firebase issues");
      }

      if (window.consoleDiagnostic.state.eventLoops.detected) {
        console.log("- Run window.consoleDiagnostic.fixEventLoops() to fix event loop issues");
      }

      if (window.consoleDiagnostic.state.spinners.detected) {
        console.log("- Run window.consoleDiagnostic.fixSpinners() to fix stuck spinners");
      }

      if (!firebaseAvailable ||
          window.consoleDiagnostic.state.eventLoops.detected ||
          window.consoleDiagnostic.state.spinners.detected) {
        console.log("- Run window.consoleDiagnostic.applyAllFixes() to apply all recommended fixes");
      }

      return window.consoleDiagnostic.state;
    },

    // Get current state
    getState: function() {
      return window.consoleDiagnostic.state;
    }
  };

  console.log("📊 Console Diagnostic Tool: Ready! Use window.consoleDiagnostic.runAll() to run all tests.");
})();