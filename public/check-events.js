// Firebase database diagnostic tool
// Load this script to check for events in the database

console.log("🔍 Database event inspector loading...");

async function checkDatabaseEvents() {
  // Only run if Firebase is initialized
  if (!window.firebase || !window.firebase.firestore) {
    console.error("Firebase not initialized - can't check database");
    return;
  }
  
  const db = window.firebase.firestore();
  
  // Get current user ID
  let userId = null;
  try {
    const auth = window.firebase.auth();
    const currentUser = auth.currentUser;
    userId = currentUser?.uid;
    
    if (!userId) {
      console.error("No logged in user found");
      showResult(`No logged in user found - please log in first`);
      return;
    }
    
    console.log(`Checking events for user: ${userId}`);
    showResult(`Checking events for user ID: ${userId}...`);
    
    // First check if the events collection exists
    try {
      const collections = await db.listCollections();
      const collectionNames = collections.map(c => c.id);
      
      console.log("Available collections:", collectionNames);
      
      if (!collectionNames.includes('events')) {
        showResult(`Error: 'events' collection not found in database. Available collections: ${collectionNames.join(', ')}`);
        return;
      }
    } catch (err) {
      console.error("Error listing collections:", err);
    }
    
    // Check events for this user
    try {
      // Direct query - no application code involved
      const eventsRef = db.collection('events');
      const querySnapshot = await eventsRef.where('userId', '==', userId).get();
      
      if (querySnapshot.empty) {
        console.log(`No events found for user ${userId}`);
        showResult(`No events found for this user. This explains why the calendar is empty.`);
        
        // Check permissions
        try {
          const securityCheck = await db.collection('events').limit(1).get();
          if (securityCheck.empty) {
            showResult(`No events found and the events collection appears to be empty or inaccessible. This could be a permissions issue.`);
          } else {
            showResult(`No events found for this user, but the events collection exists and is accessible. You may need to create events.`);
          }
        } catch (secErr) {
          showResult(`Permission error: ${secErr.message}. This user may not have access to the events collection.`);
        }
      } else {
        const events = [];
        querySnapshot.forEach(doc => {
          events.push({id: doc.id, ...doc.data()});
        });
        
        console.log(`Found ${events.length} events for user ${userId}`);
        console.table(events.map(e => ({
          id: e.id,
          title: e.title,
          date: e.dateTime || e.date,
          firestoreId: e.firestoreId
        })));
        
        showResult(`Found ${events.length} events for this user in the database, but they're not showing up in the UI. This appears to be a code issue rather than a data issue.`);
      }
    } catch (err) {
      console.error("Error querying events:", err);
      showResult(`Error querying events: ${err.message}`);
    }
  } catch (err) {
    console.error("Error checking events:", err);
    showResult(`Error: ${err.message}`);
  }
}

// Create a nice UI for the results
function showResult(message) {
  // Remove any existing result panel
  const existingPanel = document.getElementById('db-check-result');
  if (existingPanel) {
    existingPanel.parentNode.removeChild(existingPanel);
  }
  
  const panel = document.createElement('div');
  panel.id = 'db-check-result';
  panel.style.position = 'fixed';
  panel.style.bottom = '10px';
  panel.style.left = '10px';
  panel.style.right = '10px';
  panel.style.backgroundColor = '#f8f9fa';
  panel.style.borderTop = '4px solid #2196F3';
  panel.style.padding = '15px';
  panel.style.zIndex = '999999';
  panel.style.boxShadow = '0 -2px 10px rgba(0,0,0,0.1)';
  panel.style.maxHeight = '200px';
  panel.style.overflowY = 'auto';
  panel.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  
  let fixSuggestion = '';
  if (message.includes('No events found')) {
    fixSuggestion = `
      <div style="margin-top: 10px; padding: 10px; background-color: #e3f2fd; border-radius: 4px;">
        <b>Suggested fixes:</b>
        <ul style="margin-top: 5px; padding-left: 20px;">
          <li>Create a test event to verify that creation works</li>
          <li>Check database security rules for 'events' collection</li>
          <li>Verify user authentication is working correctly</li>
        </ul>
      </div>
    `;
  } else if (message.includes('Permission error')) {
    fixSuggestion = `
      <div style="margin-top: 10px; padding: 10px; background-color: #e3f2fd; border-radius: 4px;">
        <b>Suggested fixes:</b>
        <ul style="margin-top: 5px; padding-left: 20px;">
          <li>Check Firestore security rules for the 'events' collection</li>
          <li>Verify this user account has the necessary permissions</li>
          <li>Check for any custom claims or role-based access control</li>
        </ul>
      </div>
    `;
  }
  
  panel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h3 style="margin: 0; font-size: 16px;">🔍 Database Check Results</h3>
      <button id="close-db-check" style="background: none; border: none; cursor: pointer; font-size: 20px; line-height: 1;">&times;</button>
    </div>
    <div style="margin-top: 10px; line-height: 1.5;">
      ${message}
    </div>
    ${fixSuggestion}
  `;
  
  document.body.appendChild(panel);
  
  // Set up close button
  document.getElementById('close-db-check').addEventListener('click', function() {
    panel.parentNode.removeChild(panel);
  });
}

// Run the check
setTimeout(checkDatabaseEvents, 1000);

// Export a function for direct console use
window.checkEvents = checkDatabaseEvents;