// Simple script to check Google Calendar sync status
// Run this in the browser console

(async function() {
  console.log('=== Google Calendar Sync Check ===\n');
  
  // Get Firebase
  const db = firebase.firestore();
  const auth = firebase.auth();
  const user = auth.currentUser;
  
  console.log('Auth user:', user?.email || 'Not logged in');
  
  // Check for profile switching
  const selectedUserId = localStorage.getItem('selectedUserId');
  console.log('Selected profile ID:', selectedUserId || 'None');
  
  // Get effective user info
  let effectiveUserEmail = user?.email;
  let effectiveUserId = user?.uid;
  
  if (selectedUserId && selectedUserId !== user?.uid) {
    console.log('\n📝 Profile switched from auth user');
    effectiveUserId = selectedUserId;
    
    // Try to get the email for the selected user
    try {
      const userDoc = await db.collection('users').doc(selectedUserId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        effectiveUserEmail = userData.email || 'Unknown';
        console.log('Effective user:', effectiveUserEmail);
      }
    } catch (e) {
      console.log('Could not fetch selected user details');
    }
  }
  
  if (effectiveUserEmail !== 'spalsson@gmail.com') {
    console.warn(`⚠️ Current profile is ${effectiveUserEmail} but you want spalsson@gmail.com`);
    console.log('To switch profiles:');
    console.log('1. Click your avatar in the top left sidebar');
    console.log('2. Select "Stefan Palsson" from the dropdown');
    console.log('3. Confirm the switch');
    console.log('\nThis will keep you in the same family but switch the active profile.\n');
  }
  
  // Get user's family ID
  const userDoc = await db.collection('users').doc(user.uid).get();
  if (!userDoc.exists) {
    console.error('User document not found');
    return;
  }
  
  const userData = userDoc.data();
  const familyId = userData.familyId || userData.selectedFamilyId;
  
  console.log('User ID:', user.uid);
  console.log('Family ID:', familyId);
  console.log('User name:', userData.name || userData.displayName);
  
  if (!familyId) {
    console.error('No family ID found for user');
    return;
  }
  
  // Check if Google Calendar is connected
  const savedConnections = localStorage.getItem('calendarConnections');
  const savedCalendars = localStorage.getItem('selectedCalendars');
  const googleToken = localStorage.getItem('google_access_token');
  
  console.log('\n--- Connection Status ---');
  if (savedConnections) {
    const connections = JSON.parse(savedConnections);
    console.log('Google connected:', connections.google?.connected || false);
  } else {
    console.log('No calendar connections found');
  }
  
  console.log('Google token exists:', !!googleToken);
  
  if (savedCalendars) {
    const calendars = JSON.parse(savedCalendars);
    console.log('Selected calendars:', calendars.length);
    calendars.forEach(cal => {
      console.log(`  - ${cal.summary} (${cal.id})`);
    });
  } else {
    console.log('No calendars selected');
  }
  
  // Check sync status in Firestore
  console.log('\n--- Sync Status ---');
  try {
    const syncDoc = await db.collection('googleCalendarSync').doc(familyId).get();
    if (syncDoc.exists) {
      const sync = syncDoc.data();
      console.log('Last sync:', new Date(sync.lastSync).toLocaleString());
      console.log('Events imported:', sync.eventsImported);
      console.log('Calendars synced:', sync.calendarssynced);
    } else {
      console.log('No sync record found - sync has not been run yet');
    }
  } catch (error) {
    console.error('Error checking sync status:', error.message);
  }
  
  // Count events
  console.log('\n--- Event Count ---');
  try {
    // Count all events
    const allEvents = await db.collection('events')
      .where('familyId', '==', familyId)
      .get();
    
    console.log('Total events for family:', allEvents.size);
    
    // Count by source
    let googleCount = 0;
    let otherCount = 0;
    
    allEvents.forEach(doc => {
      const event = doc.data();
      if (event.source === 'google') {
        googleCount++;
      } else {
        otherCount++;
      }
    });
    
    console.log('Google Calendar events:', googleCount);
    console.log('Other events:', otherCount);
    
    // Show a few Google events
    if (googleCount > 0) {
      console.log('\n--- Sample Google Events ---');
      let shown = 0;
      allEvents.forEach(doc => {
        if (shown < 5) {
          const event = doc.data();
          if (event.source === 'google') {
            console.log(`- ${event.title} (${new Date(event.startTime?.seconds * 1000 || event.startDate).toLocaleDateString()})`);
            shown++;
          }
        }
      });
    }
    
  } catch (error) {
    console.error('Error counting events:', error.message);
    if (error.message.includes('index')) {
      console.log('\n⚠️ Firebase indexes not ready. The sync may have worked but queries are failing.');
      console.log('Please create the indexes as instructed.');
    }
  }
  
  console.log('\n--- Next Steps ---');
  if (googleCount === 0) {
    console.log('❌ No Google events found. Try:');
    console.log('1. Go to Settings > Calendar & Events');
    console.log('2. Make sure calendars are selected');
    console.log('3. Click "Sync Now" button');
    console.log('4. Check console for sync errors');
  } else {
    console.log('✅ Google events are synced!');
    console.log('If they\'re not showing in the calendar:');
    console.log('1. Refresh the page');
    console.log('2. Make sure you\'re viewing the correct date range');
    console.log('3. Check that the calendar view is not filtered');
  }
  
})();