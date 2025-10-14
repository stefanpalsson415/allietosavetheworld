// Force reload SMS messages directly into the UI
// Run this in browser console

(async function forceReloadSMS() {
  console.log('🔄 Force reloading SMS messages...\n');
  
  if (!window.firebase || !window.firebase.firestore) {
    console.error('Firebase not found');
    return;
  }
  
  const db = window.firebase.firestore();
  const familyId = 'm93tlovs6ty9sg8k0c8';
  
  try {
    // Get SMS messages
    console.log('📱 Loading SMS messages from database...');
    const smsSnapshot = await db.collection('smsInbox')
      .where('familyId', '==', familyId)
      .get();
    
    console.log(`Found ${smsSnapshot.size} SMS messages`);
    
    if (smsSnapshot.size === 0) {
      console.log('No SMS messages found for this family');
      return;
    }
    
    // Check the React component state
    console.log('\n🔍 Looking for React component...');
    
    // Try to find the React fiber
    const inboxContainer = document.querySelector('[class*="flex-1"][class*="bg-gray-50"]')?.parentElement;
    if (!inboxContainer) {
      console.log('Could not find inbox container');
      return;
    }
    
    // Look for React internal properties
    const reactKey = Object.keys(inboxContainer).find(key => key.startsWith('__react'));
    if (reactKey) {
      console.log('✅ Found React component');
      
      // Try to access the component instance
      const fiber = inboxContainer[reactKey];
      console.log('React fiber:', fiber);
      
      // Navigate to find the UnifiedInbox component
      let current = fiber;
      let found = false;
      let depth = 0;
      
      while (current && depth < 20) {
        if (current.memoizedProps && current.memoizedProps.inboxItems !== undefined) {
          console.log('Found component with inboxItems!');
          console.log('Current items:', current.memoizedProps.inboxItems?.length);
          found = true;
          break;
        }
        current = current.return || current.child;
        depth++;
      }
      
      if (!found) {
        console.log('Could not find component with inboxItems');
      }
    }
    
    // Alternative approach - trigger a full page refresh
    console.log('\n🔄 Alternative: Triggering page refresh...');
    console.log('The page will reload in 2 seconds...');
    
    // First, ensure we're on the Document Hub tab
    const tabs = document.querySelectorAll('[role="tab"], button');
    tabs.forEach(tab => {
      if (tab.textContent.includes('Document Hub')) {
        console.log('Clicking Document Hub tab...');
        tab.click();
      }
    });
    
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.error('Error:', error);
    
    // If the query failed due to index, show this
    if (error.message.includes('index')) {
      console.log('\n⚠️ Firestore index issue detected!');
      console.log('This is why SMS messages aren\'t loading.');
      console.log('\nTo fix this:');
      console.log('1. Go to the Firebase Console');
      console.log('2. Navigate to Firestore Database > Indexes');
      console.log('3. Add a composite index for:');
      console.log('   Collection: smsInbox');
      console.log('   Fields: familyId (Ascending), receivedAt (Descending)');
      console.log('\nOr click this link in the error message to auto-create the index.');
    }
  }
})();