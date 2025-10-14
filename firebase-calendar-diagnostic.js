/**
 * firebase-calendar-diagnostic.js
 * 
 * A simple diagnostic tool to test direct Firebase calendar event operations
 * without any AI or complex processing logic.
 */

// Import required Firebase packages
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

// Firebase configuration - read from environment or use default
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyALjXkZiFZ_Fy143N_dzdaUbyDCtabBr7Y",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "allie-family-assistant.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "allie-family-assistant",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "allie-family-assistant.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "954978738754",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:954978738754:web:9c78e3f2582b090c0afbf8"
};

// Global states to track operations
let diagnosticResults = {
  firebaseInitialized: false,
  authStatus: 'unknown',
  userId: null,
  operations: []
};

/**
 * Initialize Firebase
 */
function initializeFirebase() {
  try {
    console.log("🔍 DIAGNOSTIC: Initializing Firebase...");
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    diagnosticResults.firebaseInitialized = true;
    console.log("✅ DIAGNOSTIC: Firebase initialized successfully");
    
    return { app, auth, db };
  } catch (error) {
    console.error("❌ DIAGNOSTIC: Firebase initialization failed:", error);
    diagnosticResults.firebaseInitialized = false;
    diagnosticResults.operations.push({
      operation: 'initialize',
      status: 'failed',
      error: error.message
    });
    return null;
  }
}

/**
 * Check authentication state
 */
async function checkAuthState() {
  const { auth } = initializeFirebase();
  if (!auth) return null;
  
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      
      if (user) {
        console.log("✅ DIAGNOSTIC: User is authenticated:", user.uid);
        diagnosticResults.authStatus = 'authenticated';
        diagnosticResults.userId = user.uid;
        diagnosticResults.operations.push({
          operation: 'checkAuth',
          status: 'success',
          userId: user.uid
        });
      } else {
        console.log("❌ DIAGNOSTIC: User is NOT authenticated");
        diagnosticResults.authStatus = 'unauthenticated';
        diagnosticResults.operations.push({
          operation: 'checkAuth',
          status: 'failed',
          error: 'User not authenticated'
        });
      }
      
      resolve(user);
    });
  });
}

/**
 * Test reading calendar events
 */
async function testReadEvents() {
  const user = await checkAuthState();
  if (!user) {
    console.error("❌ DIAGNOSTIC: Cannot read events - not authenticated");
    return [];
  }
  
  const { db } = initializeFirebase();
  if (!db) return [];
  
  console.log("🔍 DIAGNOSTIC: Testing read events from Firestore...");
  
  try {
    // Start network request monitoring
    const startTime = performance.now();
    
    // Query both events collections
    const eventsQuery = query(
      collection(db, "events"), 
      where("userId", "==", user.uid)
    );
    
    const calendarEventsQuery = query(
      collection(db, "calendarEvents"), 
      where("userId", "==", user.uid)
    );
    
    // Execute queries
    console.log("🔍 DIAGNOSTIC: Fetching from 'events' collection...");
    const eventsSnapshot = await getDocs(eventsQuery);
    let events = [];
    
    eventsSnapshot.forEach(doc => {
      events.push({
        id: doc.id,
        collection: 'events',
        ...doc.data()
      });
    });
    
    console.log("🔍 DIAGNOSTIC: Fetching from 'calendarEvents' collection...");
    const calendarEventsSnapshot = await getDocs(calendarEventsQuery);
    
    calendarEventsSnapshot.forEach(doc => {
      events.push({
        id: doc.id,
        collection: 'calendarEvents',
        ...doc.data()
      });
    });
    
    // Calculate time taken
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`✅ DIAGNOSTIC: Successfully read ${events.length} events (${duration.toFixed(0)}ms)`);
    console.log(`   - 'events' collection: ${eventsSnapshot.size} events`);
    console.log(`   - 'calendarEvents' collection: ${calendarEventsSnapshot.size} events`);
    
    diagnosticResults.operations.push({
      operation: 'readEvents',
      status: 'success',
      eventsCount: events.length,
      eventsCollectionCount: eventsSnapshot.size,
      calendarEventsCollectionCount: calendarEventsSnapshot.size,
      duration: duration
    });
    
    return events;
  } catch (error) {
    console.error("❌ DIAGNOSTIC: Error reading events:", error);
    
    diagnosticResults.operations.push({
      operation: 'readEvents',
      status: 'failed',
      error: error.message
    });
    
    return [];
  }
}

/**
 * Test writing a calendar event
 */
async function testWriteEvent() {
  const user = await checkAuthState();
  if (!user) {
    console.error("❌ DIAGNOSTIC: Cannot write event - not authenticated");
    return null;
  }
  
  const { db } = initializeFirebase();
  if (!db) return null;
  
  console.log("🔍 DIAGNOSTIC: Testing write event to Firestore...");
  
  // Create test event data
  const testEvent = {
    title: "Diagnostic Test Event",
    description: "This is a test event created by the diagnostic tool",
    dateTime: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
    userId: user.uid,
    universalId: `test-${Date.now()}`,
    createdAt: new Date().toISOString(),
    source: 'diagnostic-tool'
  };
  
  // Try writing to both collections
  try {
    console.log("🔍 DIAGNOSTIC: Writing to 'events' collection...");
    console.log("Event data:", JSON.stringify(testEvent, null, 2));
    
    // Start monitoring network request
    const startTime = performance.now();
    
    // Add to events collection
    const eventDocRef = await addDoc(collection(db, "events"), testEvent);
    console.log("✅ DIAGNOSTIC: Successfully wrote to 'events' collection:", eventDocRef.id);
    
    // Add to calendarEvents collection (for redundancy check)
    const calendarEventDocRef = await addDoc(collection(db, "calendarEvents"), testEvent);
    console.log("✅ DIAGNOSTIC: Successfully wrote to 'calendarEvents' collection:", calendarEventDocRef.id);
    
    // Calculate time taken
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    diagnosticResults.operations.push({
      operation: 'writeEvent',
      status: 'success',
      eventsCollectionId: eventDocRef.id,
      calendarEventsCollectionId: calendarEventDocRef.id,
      duration: duration
    });
    
    return {
      eventsId: eventDocRef.id,
      calendarEventsId: calendarEventDocRef.id
    };
  } catch (error) {
    console.error("❌ DIAGNOSTIC: Error writing event:", error);
    
    // Try to determine the specific issue
    let errorType = 'unknown';
    if (error.code) {
      if (error.code.includes('permission-denied')) {
        errorType = 'permissions';
      } else if (error.code.includes('unavailable')) {
        errorType = 'network';
      } else if (error.code.includes('unauthenticated')) {
        errorType = 'authentication';
      }
    }
    
    diagnosticResults.operations.push({
      operation: 'writeEvent',
      status: 'failed',
      error: error.message,
      errorType: errorType
    });
    
    return null;
  }
}

/**
 * Check security rules
 */
async function testSecurityRules() {
  const user = await checkAuthState();
  const { db } = initializeFirebase();
  if (!db) return;
  
  console.log("🔍 DIAGNOSTIC: Testing Firestore security rules...");
  
  try {
    // Try to read another user's events (should fail if rules are configured correctly)
    const fakeUserId = 'non-existent-user-id';
    const query = query(
      collection(db, "events"),
      where("userId", "==", fakeUserId)
    );
    
    await getDocs(query);
    
    console.log("⚠️ DIAGNOSTIC: Security concern - able to read events for other users");
    diagnosticResults.operations.push({
      operation: 'testSecurityRules',
      status: 'warning',
      warning: 'Able to read other users events'
    });
  } catch (error) {
    // This is actually expected - we want this to fail for security
    console.log("✅ DIAGNOSTIC: Security rules working as expected");
    diagnosticResults.operations.push({
      operation: 'testSecurityRules',
      status: 'success'
    });
  }
}

/**
 * Run all diagnostic tests
 */
async function runFullDiagnostic() {
  console.log("🔍 STARTING CALENDAR DIAGNOSTIC TEST");
  console.log("==================================");
  
  // Start timer
  const startTime = performance.now();
  
  // Check auth
  const user = await checkAuthState();
  
  if (user) {
    // Run tests
    await testReadEvents();
    await testWriteEvent();
    await testSecurityRules();
  }
  
  // Calculate time taken
  const endTime = performance.now();
  const duration = (endTime - startTime) / 1000; // in seconds
  
  console.log("\n==================================");
  console.log(`🔍 DIAGNOSTIC COMPLETED (${duration.toFixed(2)}s)`);
  console.log("Results:", diagnosticResults);
  
  return diagnosticResults;
}

// Create global access
window.calendarDiagnostic = {
  runFullDiagnostic,
  testReadEvents,
  testWriteEvent,
  testSecurityRules,
  getResults: () => diagnosticResults
};

console.log("🔍 Calendar diagnostic tool ready. Run window.calendarDiagnostic.runFullDiagnostic() in console to start tests.");