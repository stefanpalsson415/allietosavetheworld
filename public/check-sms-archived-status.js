// Check if the SMS message is archived
// Run this in browser console

(async function checkSMSArchivedStatus() {
  console.log('🔍 Checking SMS archived status...\n');
  
  if (!window.firebase || !window.firebase.firestore) {
    console.error('Firebase not found');
    return;
  }
  
  const db = window.firebase.firestore();
  const familyId = 'm93tlovs6ty9sg8k0c8';
  
  try {
    // Get the SMS message we know exists
    const smsQuery = await db.collection('smsInbox')
      .where('familyId', '==', familyId)
      .get();
    
    console.log(`Found ${smsQuery.size} SMS messages`);
    
    smsQuery.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n${index + 1}. SMS ID: ${doc.id}`);
      console.log(`   From: ${data.from}`);
      console.log(`   Content: "${(data.content || data.body || '').substring(0, 40)}..."`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Archived: ${data.archived === true ? '❌ YES' : '✅ NO'}`);
      console.log(`   Type: ${data.type}`);
      console.log(`   Source: ${data.source}`);
      
      if (data.archived === true) {
        console.log('\n🔧 This SMS is archived! Unarchiving it...');
        
        // Unarchive it
        db.collection('smsInbox').doc(doc.id).update({
          archived: false,
          archivedAt: null
        }).then(() => {
          console.log('✅ SMS unarchived! Refresh the page to see it.');
        }).catch(error => {
          console.error('Error unarchiving:', error);
        });
      }
    });
    
  } catch (error) {
    console.error('Error checking SMS:', error);
  }
})();