// Monitor SMS messages in real-time
// Run this in browser console

(function monitorSMSLive() {
  console.log('📱 Starting SMS monitor...\n');
  
  if (!window.firebase || !window.firebase.firestore) {
    console.error('Firebase not found');
    return;
  }
  
  const db = window.firebase.firestore();
  const seenMessages = new Set();
  
  // Get initial messages
  db.collection('smsInbox')
    .where('familyId', '==', 'm93tlovs6ty9sg8k0c8')
    .get()
    .then(snapshot => {
      console.log(`📊 Initial SMS count: ${snapshot.size}`);
      snapshot.forEach(doc => {
        seenMessages.add(doc.id);
        const data = doc.data();
        console.log(`- ${data.from}: "${(data.content || data.body || '').substring(0, 30)}..."`);
      });
      console.log('\n👀 Monitoring for new SMS messages...');
      console.log('Send an SMS to see it appear here.\n');
    });
  
  // Listen for new messages
  const unsubscribe = db.collection('smsInbox')
    .where('familyId', '==', 'm93tlovs6ty9sg8k0c8')
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added' && !seenMessages.has(change.doc.id)) {
          const data = change.doc.data();
          const time = new Date().toLocaleTimeString();
          
          console.log(`\n🆕 NEW SMS at ${time}:`);
          console.log(`   ID: ${change.doc.id}`);
          console.log(`   From: ${data.from}`);
          console.log(`   Message: "${data.content || data.body}"`);
          console.log(`   Status: ${data.status}`);
          
          seenMessages.add(change.doc.id);
          
          // Visual notification
          const style = 'background: #4CAF50; color: white; padding: 5px 10px; border-radius: 3px;';
          console.log(`%c NEW SMS RECEIVED! `, style);
        }
      });
    }, error => {
      console.error('Snapshot error:', error);
    });
  
  // Store unsubscribe function globally
  window.stopSMSMonitor = () => {
    unsubscribe();
    console.log('❌ SMS monitor stopped');
  };
  
  console.log('💡 To stop monitoring, run: stopSMSMonitor()');
})();