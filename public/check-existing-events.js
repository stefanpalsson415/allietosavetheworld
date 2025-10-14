// Check existing events in the database
(async function() {
  try {
    console.log('Checking existing events...');
    
    // Wait for Firebase to be ready
    await new Promise(resolve => {
      const checkFirebase = setInterval(() => {
        if (window.firebase && window.firebase.auth && window.firebase.firestore) {
          clearInterval(checkFirebase);
          resolve();
        }
      }, 100);
    });
    
    const auth = window.firebase.auth();
    const db = window.firebase.firestore();
    
    // Get current user
    const user = auth.currentUser;
    if (!user) {
      console.error('No user logged in!');
      return;
    }
    
    // Get family ID
    const familyId = localStorage.getItem('selectedFamilyId');
    
    console.log('Checking events for:', {
      userId: user.uid,
      userEmail: user.email,
      familyId: familyId || 'not set'
    });
    
    // Query events by userId
    console.log('\n=== Events by userId ===');
    const userEventsQuery = await db.collection('events')
      .where('userId', '==', user.uid)
      .limit(10)
      .get();
    
    console.log(`Found ${userEventsQuery.size} events by userId`);
    userEventsQuery.forEach(doc => {
      const data = doc.data();
      console.log(`- ${data.title || 'No title'} (${doc.id}):`, {
        userId: data.userId,
        familyId: data.familyId,
        dateTime: data.dateTime,
        date: data.date,
        start: data.start
      });
    });
    
    // Query events by familyId if available
    if (familyId) {
      console.log('\n=== Events by familyId ===');
      const familyEventsQuery = await db.collection('events')
        .where('familyId', '==', familyId)
        .limit(10)
        .get();
      
      console.log(`Found ${familyEventsQuery.size} events by familyId`);
      familyEventsQuery.forEach(doc => {
        const data = doc.data();
        console.log(`- ${data.title || 'No title'} (${doc.id}):`, {
          userId: data.userId,
          familyId: data.familyId,
          dateTime: data.dateTime,
          createdBy: data.createdBy
        });
      });
    }
    
    // Check any events at all
    console.log('\n=== Sample of all events ===');
    const allEventsQuery = await db.collection('events')
      .limit(5)
      .get();
    
    console.log(`Total sample size: ${allEventsQuery.size}`);
    allEventsQuery.forEach(doc => {
      const data = doc.data();
      console.log(`- ${data.title || 'No title'}:`, {
        id: doc.id,
        userId: data.userId?.substring(0, 10) + '...',
        familyId: data.familyId?.substring(0, 10) + '...',
        hasDate: !!(data.dateTime || data.date || data.start)
      });
    });
    
    // Check EventContext
    console.log('\n=== Checking EventContext ===');
    // Try to access the React component tree to find EventContext
    const reactRoot = document.getElementById('root');
    if (reactRoot && reactRoot._reactRootContainer) {
      console.log('React root found, but cannot directly access context from here.');
      console.log('Use React DevTools to inspect EventContext state.');
    }
    
  } catch (error) {
    console.error('Error checking events:', error);
  }
})();