// Debug script to verify Google Calendar events in Firestore
// Run this in the browser console after syncing

(async function() {
  console.log('=== Verifying Google Calendar Events ===\n');
  
  // Check if Firebase is available
  if (!window.firebase || !window.firebase.firestore) {
    console.error('Firebase not available. Make sure you are on the Allie app.');
    return;
  }
  
  const db = window.firebase.firestore();
  
  try {
    // Get current user and family
    const auth = window.firebase.auth();
    const user = auth.currentUser;
    
    if (!user) {
      console.error('No user logged in');
      return;
    }
    
    console.log('Current user:', user.email);
    
    // Get family ID from context or user doc
    let familyId = null;
    
    // Try multiple ways to get family ID
    // Method 1: From React context (if exposed)
    try {
      const contexts = document.querySelector('#root')?._reactRootContainer?._internalRoot?.current?.memoizedState?.element?.props;
      if (contexts?.children?.props?.familyId) {
        familyId = contexts.children.props.familyId;
      }
    } catch (e) {
      // Context not accessible this way
    }
    
    // Method 2: From user document
    if (!familyId) {
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        familyId = userData.familyId || userData.selectedFamilyId;
        console.log('User data:', userData);
      }
    }
    
    // Method 3: Try to find from localStorage
    if (!familyId) {
      const savedFamily = localStorage.getItem('selectedFamily');
      if (savedFamily) {
        try {
          const parsed = JSON.parse(savedFamily);
          familyId = parsed.id || parsed.familyId;
        } catch (e) {
          // Not valid JSON
        }
      }
    }
    
    if (!familyId) {
      console.error('Could not find family ID');
      return;
    }
    
    console.log('Family ID:', familyId);
    console.log('\n--- Checking Events ---\n');
    
    // Query all events for this family
    const eventsSnapshot = await db.collection('events')
      .where('familyId', '==', familyId)
      .limit(50)
      .get();
    
    console.log(`Total events found: ${eventsSnapshot.size}`);
    
    // Separate Google events from others
    const googleEvents = [];
    const allieEvents = [];
    
    eventsSnapshot.forEach(doc => {
      const event = { id: doc.id, ...doc.data() };
      if (event.source === 'google') {
        googleEvents.push(event);
      } else {
        allieEvents.push(event);
      }
    });
    
    console.log(`\nGoogle Calendar events: ${googleEvents.length}`);
    console.log(`Allie events: ${allieEvents.length}`);
    
    // Display Google events
    if (googleEvents.length > 0) {
      console.log('\n--- Google Calendar Events ---');
      googleEvents.forEach((event, index) => {
        console.log(`\n${index + 1}. ${event.title}`);
        console.log(`   ID: ${event.id}`);
        console.log(`   Start: ${new Date(event.startTime || event.startDate).toLocaleString()}`);
        console.log(`   Calendar: ${event.sourceCalendar?.name || 'Unknown'}`);
        console.log(`   Status: ${event.status}`);
        console.log(`   Google ID: ${event.googleEventId}`);
      });
    } else {
      console.log('\n❌ No Google Calendar events found');
      console.log('Make sure you:');
      console.log('1. Selected calendars to sync');
      console.log('2. Clicked "Sync Now" button');
      console.log('3. Waited for sync to complete');
      console.log('4. Have events in the current/next month');
    }
    
    // Check sync status
    console.log('\n--- Sync Status ---');
    const syncDoc = await db.collection('googleCalendarSync').doc(familyId).get();
    
    if (syncDoc.exists) {
      const syncData = syncDoc.data();
      console.log('Last sync:', new Date(syncData.lastSync).toLocaleString());
      console.log('Events imported:', syncData.eventsImported);
      console.log('Calendars synced:', syncData.calendarssynced);
      
      if (syncData.errors && syncData.errors.length > 0) {
        console.log('\nSync errors:');
        syncData.errors.forEach(err => {
          console.log(`- ${err.calendar}: ${err.error}`);
        });
      }
    } else {
      console.log('No sync status found - sync may not have been run yet');
    }
    
    // Check if indexes are ready
    console.log('\n--- Index Status ---');
    try {
      // Try a query that requires indexes
      await db.collection('events')
        .where('familyId', '==', familyId)
        .where('source', '==', 'google')
        .limit(1)
        .get();
      console.log('✅ Indexes appear to be ready');
    } catch (error) {
      if (error.message.includes('index')) {
        console.error('❌ Indexes not ready. Please create the required indexes.');
        console.log('Run: node create-events-indexes.js');
      }
    }
    
  } catch (error) {
    console.error('Error verifying events:', error);
  }
})();