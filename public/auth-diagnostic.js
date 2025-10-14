// Authentication diagnostic tool for calendar issues
// This waits for auth to be fully ready before checking

console.log("🔑 Auth diagnostic loading...");

// Create UI for results
function createDiagnosticPanel() {
  // Remove existing panel if it exists
  const existingPanel = document.getElementById('auth-diagnostic-panel');
  if (existingPanel) {
    existingPanel.parentNode.removeChild(existingPanel);
  }
  
  const panel = document.createElement('div');
  panel.id = 'auth-diagnostic-panel';
  panel.style.position = 'fixed';
  panel.style.bottom = '10px';
  panel.style.left = '10px';
  panel.style.right = '10px';
  panel.style.backgroundColor = '#f8f9fa';
  panel.style.borderTop = '4px solid #ff9800';
  panel.style.padding = '15px';
  panel.style.zIndex = '999999';
  panel.style.boxShadow = '0 -2px 10px rgba(0,0,0,0.1)';
  panel.style.maxHeight = '250px';
  panel.style.overflowY = 'auto';
  panel.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  
  panel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h3 style="margin: 0; font-size: 16px;">🔑 Calendar Issue Diagnostic</h3>
      <button id="close-auth-diagnostic" style="background: none; border: none; cursor: pointer; font-size: 20px; line-height: 1;">&times;</button>
    </div>
    <div id="auth-diagnostic-content" style="margin-top: 15px; line-height: 1.5;">
      <div style="display: flex; align-items: center;">
        <div style="width: 20px; height: 20px; border: 2px solid #ff9800; border-top-color: transparent; border-radius: 50%; margin-right: 10px; animation: spin 1s linear infinite;"></div>
        Waiting for authentication state...
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </div>
    <div style="margin-top: 15px; display: flex; justify-content: space-between;">
      <button id="check-firebase-events" style="background: #2196F3; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; display: none;">Check Events in Firebase</button>
      <button id="force-auth-refresh" style="background: #ff9800; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; display: none;">Force Auth Refresh</button>
      <button id="clear-local-storage" style="background: #f44336; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; display: none;">Clear Local Storage & Reload</button>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // Set up close button
  document.getElementById('close-auth-diagnostic')?.addEventListener('click', function() {
    panel.parentNode?.removeChild(panel);
  });
  
  return panel;
}

// Update the panel content
function updateDiagnosticContent(content) {
  const contentDiv = document.getElementById('auth-diagnostic-content');
  if (contentDiv) {
    contentDiv.innerHTML = content;
  }
}

// Run auth check with retry
function runAuthDiagnostic() {
  const panel = createDiagnosticPanel();
  let checkCount = 0;
  let lastUserState = null;
  
  function checkAuth() {
    checkCount++;
    
    // Get authentication objects from different possible locations
    const firebase = window.firebase;
    const firebaseApp = window.firebaseApp || (firebase && firebase.app && firebase.app());
    const authFromContext = window.authContext?.currentUser;
    
    // Get current user
    let auth, currentUser, userId;
    try {
      auth = firebase && firebase.auth && firebase.auth();
      currentUser = auth && auth.currentUser;
      userId = currentUser?.uid;
    } catch (e) {
      console.error("Error accessing Firebase auth:", e);
    }
    
    // Check React context auth (might be different)
    let reactUser = null;
    try {
      if (window.authContext && window.authContext.currentUser) {
        reactUser = window.authContext.currentUser;
      }
    } catch (e) {
      console.error("Error accessing React auth context:", e);
    }
    
    // Get state from local storage if available
    let localUser = null;
    try {
      const localData = localStorage.getItem('firebase:authUser:YOUR_API_KEY:parentload');
      if (localData) {
        localUser = JSON.parse(localData);
      }
    } catch (e) {
      console.error("Error accessing localStorage auth:", e);
    }
    
    // Check if state is different from last check
    const currentState = userId || reactUser?.uid || localUser?.uid;
    const stateChanged = currentState !== lastUserState;
    lastUserState = currentState;
    
    // Format auth state for display
    let authState = "Unknown";
    if (userId) {
      authState = `<span style="color: #4caf50;">Authenticated as ${userId}</span>`;
    } else if (reactUser) {
      authState = `<span style="color: #ff9800;">Authenticated in React context as ${reactUser.uid}, but not in Firebase SDK</span>`;
    } else if (localUser) {
      authState = `<span style="color: #f44336;">Found in localStorage only: ${localUser.uid}</span>`;
    } else {
      authState = '<span style="color: #f44336;">Not authenticated</span>';
    }
    
    // Create detailed output
    let output = `
      <div>
        <p><strong>Auth State:</strong> ${authState}</p>
        <p><strong>Check Count:</strong> ${checkCount} (${stateChanged ? 'Changed' : 'No change'})</p>
      </div>
    `;
    
    if (userId) {
      output += `
        <div style="margin-top: 10px; padding: 10px; background-color: #e8f5e9; border-radius: 4px;">
          <p><strong>Diagnosis:</strong> User is properly authenticated.</p>
          <p>If calendar is still empty, this is likely a permission issue with the events collection, or there are no events for this user.</p>
        </div>
      `;
      
      // Show event check button
      const checkEventsBtn = document.getElementById('check-firebase-events');
      const forceAuthBtn = document.getElementById('force-auth-refresh');
      const clearStorageBtn = document.getElementById('clear-local-storage');
      
      if (checkEventsBtn) checkEventsBtn.style.display = 'block';
      if (forceAuthBtn) forceAuthBtn.style.display = 'block';
      if (clearStorageBtn) clearStorageBtn.style.display = 'block';
    } else if (reactUser) {
      output += `
        <div style="margin-top: 10px; padding: 10px; background-color: #fff8e1; border-radius: 4px;">
          <p><strong>Diagnosis:</strong> Authentication state mismatch between React and Firebase SDK.</p>
          <p>This explains why the calendar can't load events - Firebase queries use the SDK auth state.</p>
        </div>
      `;
      
      // Show buttons
      const forceAuthBtn = document.getElementById('force-auth-refresh');
      const clearStorageBtn = document.getElementById('clear-local-storage');
      
      if (forceAuthBtn) forceAuthBtn.style.display = 'block';
      if (clearStorageBtn) clearStorageBtn.style.display = 'block';
    } else {
      output += `
        <div style="margin-top: 10px; padding: 10px; background-color: #ffebee; border-radius: 4px;">
          <p><strong>Diagnosis:</strong> User is not properly authenticated.</p>
          <p>Calendar can't load events without a valid authenticated user.</p>
        </div>
      `;
      
      // Show clear storage button
      const clearStorageBtn = document.getElementById('clear-local-storage');
      if (clearStorageBtn) clearStorageBtn.style.display = 'block';
    }
    
    updateDiagnosticContent(output);
    
    // Continue checking if user state is still null
    if (!userId && checkCount < 10) {
      setTimeout(checkAuth, 1000);
    }
  }
  
  // Set up event handlers for buttons
  document.getElementById('check-firebase-events')?.addEventListener('click', function() {
    // Direct Firebase check
    console.log("Checking Firebase events directly");
    
    const firebase = window.firebase;
    const db = firebase && firebase.firestore && firebase.firestore();
    const auth = firebase && firebase.auth && firebase.auth();
    const userId = auth?.currentUser?.uid;
    
    if (!db || !userId) {
      updateDiagnosticContent(`
        <div style="color: #f44336;">
          <p>Cannot check events - Firebase not initialized or user not authenticated</p>
        </div>
      `);
      return;
    }
    
    updateDiagnosticContent(`
      <div style="display: flex; align-items: center;">
        <div style="width: 20px; height: 20px; border: 2px solid #ff9800; border-top-color: transparent; border-radius: 50%; margin-right: 10px; animation: spin 1s linear infinite;"></div>
        Checking events for user ${userId}...
      </div>
    `);
    
    // Query events directly
    db.collection('events')
      .where('userId', '==', userId)
      .get()
      .then(querySnapshot => {
        if (querySnapshot.empty) {
          updateDiagnosticContent(`
            <div>
              <p>No events found for user ${userId}</p>
              <div style="margin-top: 10px; padding: 10px; background-color: #e3f2fd; border-radius: 4px;">
                <p><strong>Suggested fix:</strong> Create a test event to verify that creation works</p>
              </div>
            </div>
          `);
        } else {
          const events = [];
          querySnapshot.forEach(doc => {
            events.push({
              id: doc.id,
              title: doc.data().title || 'Untitled',
              date: doc.data().dateTime || doc.data().date || 'Unknown date'
            });
          });
          
          updateDiagnosticContent(`
            <div>
              <p>Found ${events.length} events for user ${userId}</p>
              <div style="margin-top: 10px; max-height: 100px; overflow-y: auto; border: 1px solid #ddd; padding: 8px; border-radius: 4px;">
                ${events.map(e => `<div><strong>${e.title}</strong> - ${e.date}</div>`).join('')}
              </div>
              <div style="margin-top: 10px; padding: 10px; background-color: #e3f2fd; border-radius: 4px;">
                <p><strong>Diagnosis:</strong> Events exist but aren't displaying in the UI. This is a code issue with the event loading component.</p>
              </div>
            </div>
          `);
        }
      })
      .catch(error => {
        updateDiagnosticContent(`
          <div style="color: #f44336;">
            <p>Error checking events: ${error.message}</p>
            <div style="margin-top: 10px; padding: 10px; background-color: #ffebee; border-radius: 4px;">
              <p><strong>Diagnosis:</strong> Permission error. This user likely doesn't have access to the events collection.</p>
            </div>
          </div>
        `);
      });
  });
  
  document.getElementById('force-auth-refresh')?.addEventListener('click', function() {
    // Force refresh token
    const firebase = window.firebase;
    const auth = firebase && firebase.auth && firebase.auth();
    const currentUser = auth && auth.currentUser;
    
    if (!currentUser) {
      updateDiagnosticContent(`
        <div style="color: #f44336;">
          <p>Cannot refresh auth - no current user</p>
        </div>
      `);
      return;
    }
    
    updateDiagnosticContent(`
      <div style="display: flex; align-items: center;">
        <div style="width: 20px; height: 20px; border: 2px solid #ff9800; border-top-color: transparent; border-radius: 50%; margin-right: 10px; animation: spin 1s linear infinite;"></div>
        Refreshing authentication token...
      </div>
    `);
    
    currentUser.getIdToken(true)
      .then(() => {
        updateDiagnosticContent(`
          <div style="color: #4caf50;">
            <p>Auth token refreshed successfully</p>
            <p>Reloading page in 3 seconds...</p>
          </div>
        `);
        
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      })
      .catch(error => {
        updateDiagnosticContent(`
          <div style="color: #f44336;">
            <p>Error refreshing token: ${error.message}</p>
          </div>
        `);
      });
  });
  
  document.getElementById('clear-local-storage')?.addEventListener('click', function() {
    // Clear storage and reload
    updateDiagnosticContent(`
      <div>
        <p>Clearing local storage and reloading...</p>
      </div>
    `);
    
    try {
      localStorage.clear();
      sessionStorage.clear();
      
      // Try to sign out if possible
      const firebase = window.firebase;
      const auth = firebase && firebase.auth && firebase.auth();
      if (auth) {
        auth.signOut()
          .then(() => {
            window.location.reload();
          })
          .catch(() => {
            window.location.reload();
          });
      } else {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (e) {
      console.error("Error clearing storage:", e);
      window.location.reload();
    }
  });
  
  // Start the checks
  checkAuth();
}

// Wait for page to fully load, then run diagnostic
window.addEventListener('load', function() {
  // Delay slightly to let Firebase initialize
  setTimeout(runAuthDiagnostic, 2000);
});

// Export for console use
window.runAuthDiagnostic = runAuthDiagnostic;