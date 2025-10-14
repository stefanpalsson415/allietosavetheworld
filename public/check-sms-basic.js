// Basic SMS check - no complex queries
// Run this in browser console

(async function checkSMSBasic() {
  console.log('🔍 Basic SMS check...\n');
  
  if (!window.firebase || !window.firebase.firestore) {
    console.error('Firebase not found');
    return;
  }
  
  const db = window.firebase.firestore();
  
  try {
    // Just get all SMS messages, no filters
    console.log('Getting all SMS messages...');
    const snapshot = await db.collection('smsInbox').get();
    
    console.log(`\nTotal SMS messages: ${snapshot.size}`);
    
    if (snapshot.size === 0) {
      console.log('❌ No SMS messages found in the database at all!');
      console.log('This explains why nothing is showing.');
    } else {
      console.log('\nSMS message details:');
      
      snapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\n${index + 1}. Document ID: ${doc.id}`);
        console.log('   familyId:', data.familyId);
        console.log('   from:', data.from || data.phoneNumber);
        console.log('   content:', (data.content || data.body || 'NO CONTENT'));
        console.log('   status:', data.status);
        console.log('   receivedAt:', data.receivedAt);
        console.log('   type:', data.type);
        console.log('   source:', data.source);
      });
      
      // Count by familyId
      console.log('\n📊 SMS count by familyId:');
      const familyCounts = {};
      snapshot.forEach(doc => {
        const familyId = doc.data().familyId || 'NO_FAMILY_ID';
        familyCounts[familyId] = (familyCounts[familyId] || 0) + 1;
      });
      
      Object.entries(familyCounts).forEach(([familyId, count]) => {
        console.log(`- ${familyId}: ${count} messages`);
      });
    }
    
    // Also check what's in localStorage
    console.log('\n🔧 Checking localStorage:');
    console.log('selectedFamilyId:', localStorage.getItem('selectedFamilyId'));
    
    // Check if we're on the right page
    console.log('\n📍 Current location:');
    console.log('URL:', window.location.href);
    console.log('Hash:', window.location.hash);
    
  } catch (error) {
    console.error('Error:', error);
  }
})();