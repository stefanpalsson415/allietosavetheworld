// Manual Google Calendar sync with detailed logging
// Run this in the browser console

(async function() {
  console.log('=== Manual Google Calendar Sync ===\n');
  
  // Check if we have the necessary imports
  if (!window.CalendarIntegrationService) {
    console.error('CalendarIntegrationService not available globally');
    console.log('Attempting to import it...');
    
    // Try to access it through the app
    try {
      // This won't work directly, but let's check what's available
      console.log('Available globals:', Object.keys(window).filter(k => k.includes('calendar') || k.includes('Calendar')));
    } catch (e) {
      console.error('Cannot access calendar service');
    }
    
    console.log('\nTo sync manually:');
    console.log('1. Go to Settings > Calendar & Events');
    console.log('2. Make sure you see your Google calendars listed');
    console.log('3. Select the calendars you want to sync');
    console.log('4. Click "Sync Now" button');
    console.log('5. Watch the console for errors');
    
    return;
  }
  
  // Get current user and family
  const auth = firebase.auth();
  const user = auth.currentUser;
  const db = firebase.firestore();
  
  if (!user) {
    console.error('No user logged in');
    return;
  }
  
  console.log('Current user:', user.email);
  
  // Get family ID
  const userDoc = await db.collection('users').doc(user.uid).get();
  const familyId = userDoc.data()?.familyId;
  
  if (!familyId) {
    console.error('No family ID found');
    return;
  }
  
  console.log('Family ID:', familyId);
  
  // Get selected calendars
  const selectedCalendars = localStorage.getItem('selectedCalendars');
  if (!selectedCalendars) {
    console.error('No calendars selected. Please select calendars first.');
    return;
  }
  
  const calendars = JSON.parse(selectedCalendars);
  console.log('\nSelected calendars:');
  calendars.forEach(cal => {
    console.log(`- ${cal.summary} (${cal.id})`);
  });
  
  // Check if Google API is loaded
  if (!window.gapi) {
    console.error('Google API not loaded');
    return;
  }
  
  // Check token
  const token = localStorage.getItem('google_access_token');
  if (!token) {
    console.error('No Google access token. Please reconnect to Google Calendar.');
    return;
  }
  
  console.log('\n🔄 Starting sync...\n');
  
  try {
    // Call the sync function
    const result = await window.CalendarIntegrationService.syncGoogleCalendars(calendars, familyId);
    
    console.log('✅ Sync completed!');
    console.log('Events imported:', result.eventsImported);
    console.log('Total events found:', result.totalEvents);
    
    if (result.errors && result.errors.length > 0) {
      console.log('\nErrors encountered:');
      result.errors.forEach(err => {
        console.error(`- ${err.calendar}: ${err.error}`);
      });
    }
    
    // Refresh the calendar view
    window.location.reload();
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure you\'re connected to Google Calendar');
    console.log('2. Try disconnecting and reconnecting');
    console.log('3. Check if your Google token has expired');
    console.log('4. Look for specific error messages above');
  }
  
})();