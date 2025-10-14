// Comprehensive Event System Diagnostic Tool
console.log('🔍 Starting comprehensive event system diagnosis...');

// Check circuit breaker status
console.log('\n🚦 Circuit Breaker Status:');
console.log('Global event counter:', window._eventEmptyResultCounter || 0);
console.log('Force circuit breaker:', window._forceEventCircuitBreaker || false);

// Check localStorage
console.log('\n💾 Local Storage:');
console.log('Selected Family ID:', localStorage.getItem('selectedFamilyId'));
console.log('Current User:', JSON.parse(localStorage.getItem('user') || '{}').email || 'Not logged in');

// Check all event contexts
console.log('\n📦 Event Context Status:');
const contexts = [
  'EventContext',
  'NewEventContext', 
  'UnifiedEventContext'
];

contexts.forEach(name => {
  const contextExists = window[`__${name.toLowerCase()}`];
  console.log(`${name}: ${contextExists ? '✅ Available' : '❌ Not available'}`);
});

// Reset circuit breaker
function resetEventSystem() {
  console.log('\n🔧 Resetting event system...');
  
  // Clear global counters
  window._eventEmptyResultCounter = 0;
  window._forceEventCircuitBreaker = false;
  
  // Clear any error indicators
  const errorDiv = document.getElementById('event-store-error');
  if (errorDiv) {
    errorDiv.remove();
    console.log('✅ Removed error indicator');
  }
  
  // Clear localStorage cache
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('event') || key.includes('calendar'))) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`Cleared: ${key}`);
  });
  
  // Trigger refresh
  console.log('🔄 Triggering event refresh...');
  window.dispatchEvent(new CustomEvent('force-calendar-refresh', {
    detail: { source: 'diagnostic-reset' }
  }));
  
  console.log('✅ Event system reset complete!');
  console.log('🔄 Please refresh the page to reload events.');
}

// Check Firebase connection
async function checkFirebase() {
  console.log('\n🔥 Checking Firebase connection...');
  
  try {
    const { db } = window.firebase || {};
    if (!db) {
      console.error('❌ Firebase not initialized');
      return;
    }
    
    const { collection, getDocs, query, where, limit } = window.firebase.firestore;
    const auth = window.firebase.auth;
    const user = auth.currentUser;
    
    if (!user) {
      console.error('❌ No authenticated user');
      return;
    }
    
    console.log('✅ Authenticated as:', user.email);
    
    // Check events collection
    const eventsRef = collection(db, 'events');
    
    // Try querying by userId first
    console.log('\n📊 Checking events by userId...');
    const userQuery = query(eventsRef, where('userId', '==', user.uid), limit(5));
    const userSnapshot = await getDocs(userQuery);
    console.log(`Found ${userSnapshot.size} events by userId`);
    
    // Try querying by familyId
    const familyId = localStorage.getItem('selectedFamilyId');
    if (familyId) {
      console.log('\n📊 Checking events by familyId...');
      const familyQuery = query(eventsRef, where('familyId', '==', familyId), limit(5));
      const familySnapshot = await getDocs(familyQuery);
      console.log(`Found ${familySnapshot.size} events by familyId`);
      
      if (familySnapshot.size > 0) {
        console.log('\nSample events:');
        familySnapshot.forEach(doc => {
          const event = doc.data();
          console.log(`- ${event.title || 'Untitled'}`, {
            id: doc.id,
            date: event.dateTime || event.date,
            userId: event.userId?.substring(0, 6) + '...',
            familyId: event.familyId?.substring(0, 6) + '...'
          });
        });
      }
    }
    
    // Check total events
    const allQuery = query(eventsRef, limit(10));
    const allSnapshot = await getDocs(allQuery);
    console.log(`\n📊 Total events in database: ${allSnapshot.size}`);
    
  } catch (error) {
    console.error('❌ Firebase error:', error);
  }
}

// Display menu
console.log('\n🛠️ Available Commands:');
console.log('1. resetEventSystem() - Reset the event system and clear circuit breaker');
console.log('2. checkFirebase() - Check Firebase connection and events');
console.log('3. location.reload() - Refresh the page after reset');

// Auto-run checks
checkFirebase();

// Make functions available globally
window.resetEventSystem = resetEventSystem;
window.checkFirebase = checkFirebase;